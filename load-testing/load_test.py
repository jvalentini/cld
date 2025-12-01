#!/usr/bin/env python3
"""
Quiz App Load Testing Script

Simulates 1000 users taking random quizzes with 50 concurrent users.
Each user takes 1-5 quizzes, with some taking the same quiz multiple times.

Usage:
    python load_test.py --supabase-url <URL> --supabase-key <ANON_KEY>

Or set environment variables:
    SUPABASE_URL=<URL>
    SUPABASE_ANON_KEY=<ANON_KEY>
"""

import asyncio
import aiohttp
import argparse
import os
import random
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv


@dataclass
class User:
    username: str
    email: str
    full_name: str
    user_id: Optional[int] = None


@dataclass
class Quiz:
    id: int
    name: str
    questions: list  # List of question dicts with answers


@dataclass
class LoadTestConfig:
    supabase_url: str
    supabase_key: str
    concurrent_users: int = 50
    num_users: Optional[int] = None  # Limit number of users (None = all users)
    max_submissions: Optional[int] = None  # Cap total submissions (None = unlimited)
    min_quizzes_per_user: int = 1
    max_quizzes_per_user: int = 5
    think_time_min: float = 0.5  # Min seconds between actions (simulates reading)
    think_time_max: float = 2.0  # Max seconds between actions
    answer_time_min: float = 0.3  # Min seconds to answer a question
    answer_time_max: float = 1.5  # Max seconds to answer a question


class QuizLoadTester:
    def __init__(self, config: LoadTestConfig, users: list[User]):
        self.config = config
        self.users = users
        self.quizzes: list[Quiz] = []
        self.stats = {
            "users_completed": 0,
            "quizzes_taken": 0,
            "submissions_success": 0,
            "submissions_failed": 0,
            "logins_success": 0,
            "logins_failed": 0,
            "errors": [],
            "start_time": None,
            "end_time": None,
        }
        self.semaphore = asyncio.Semaphore(config.concurrent_users)
        self._progress_lock = asyncio.Lock()
        self._submission_limit_reached = False

    def _get_headers(self):
        return {
            "apikey": self.config.supabase_key,
            "Authorization": f"Bearer {self.config.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def fetch_quizzes(self, session: aiohttp.ClientSession):
        """Fetch all available quizzes and their questions/answers."""
        print("📚 Fetching available quizzes...")

        # Fetch quizzes
        url = f"{self.config.supabase_url}/rest/v1/quizzes?select=id,name"
        async with session.get(url, headers=self._get_headers()) as resp:
            if resp.status != 200:
                raise Exception(f"Failed to fetch quizzes: {await resp.text()}")
            quizzes_data = await resp.json()

        for quiz_data in quizzes_data:
            quiz_id = quiz_data["id"]

            # Fetch questions for this quiz
            q_url = f"{self.config.supabase_url}/rest/v1/questions?quiz_id=eq.{quiz_id}&select=id,question_text,question_type,order_index,correct_answer_id&order=order_index"
            async with session.get(q_url, headers=self._get_headers()) as resp:
                if resp.status != 200:
                    continue
                questions_data = await resp.json()

            if not questions_data:
                continue

            # Fetch answers for all questions
            question_ids = [q["id"] for q in questions_data]
            a_url = f"{self.config.supabase_url}/rest/v1/answers?question_id=in.({','.join(map(str, question_ids))})&select=id,question_id,answer_text,answer_label&order=answer_label"
            async with session.get(a_url, headers=self._get_headers()) as resp:
                if resp.status != 200:
                    continue
                answers_data = await resp.json()

            # Group answers by question
            answers_by_question = {}
            for ans in answers_data:
                q_id = ans["question_id"]
                if q_id not in answers_by_question:
                    answers_by_question[q_id] = []
                answers_by_question[q_id].append(ans)

            # Build questions list
            questions = []
            for q in questions_data:
                questions.append(
                    {
                        "id": q["id"],
                        "text": q["question_text"],
                        "type": q["question_type"],
                        "correct_answer_id": q["correct_answer_id"],
                        "answers": answers_by_question.get(q["id"], []),
                    }
                )

            self.quizzes.append(
                Quiz(
                    id=quiz_id,
                    name=quiz_data["name"],
                    questions=questions,
                )
            )

        print(f"✅ Loaded {len(self.quizzes)} quizzes:")
        for quiz in self.quizzes:
            print(f"   - {quiz.name} ({len(quiz.questions)} questions)")

    async def lookup_user(self, session: aiohttp.ClientSession, user: User) -> bool:
        """Look up user ID by username (simulates login)."""
        url = f"{self.config.supabase_url}/rest/v1/users?username=eq.{user.username}&select=id,username,email,full_name"

        try:
            async with session.get(url, headers=self._get_headers()) as resp:
                if resp.status != 200:
                    return False
                data = await resp.json()
                if data and len(data) > 0:
                    user.user_id = data[0]["id"]
                    return True
                return False
        except Exception as e:
            self.stats["errors"].append(
                f"Login lookup error for {user.username}: {str(e)}"
            )
            return False

    async def take_quiz(
        self, session: aiohttp.ClientSession, user: User, quiz: Quiz
    ) -> bool:
        """Simulate a user taking a quiz."""
        # Simulate thinking/reading time before starting
        await asyncio.sleep(
            random.uniform(self.config.think_time_min, self.config.think_time_max)
        )

        # Generate random answers
        user_answers = []
        answer_ids = []
        correct_count = 0

        for question in quiz.questions:
            # Simulate time to read and answer
            await asyncio.sleep(
                random.uniform(self.config.answer_time_min, self.config.answer_time_max)
            )

            if question["answers"]:
                # Randomly select an answer (weighted towards correct answer ~40% of time)
                if random.random() < 0.4:
                    # Try to pick correct answer
                    correct_ans = next(
                        (
                            a
                            for a in question["answers"]
                            if a["id"] == question["correct_answer_id"]
                        ),
                        None,
                    )
                    if correct_ans:
                        selected = correct_ans
                    else:
                        selected = random.choice(question["answers"])
                else:
                    selected = random.choice(question["answers"])

                answer_idx = next(
                    (
                        i
                        for i, a in enumerate(question["answers"])
                        if a["id"] == selected["id"]
                    ),
                    0,
                )
                user_answers.append(answer_idx)
                answer_ids.append(selected["id"])

                if selected["id"] == question["correct_answer_id"]:
                    correct_count += 1

        # Check if we've hit the submission limit
        async with self._progress_lock:
            if self._submission_limit_reached:
                return False
            if (
                self.config.max_submissions is not None
                and self.stats["submissions_success"] >= self.config.max_submissions
            ):
                self._submission_limit_reached = True
                return False

        # Submit the quiz
        submission_data = {
            "quiz_id": quiz.id,
            "correct_answers": correct_count,
            "total_questions": len(quiz.questions),
        }

        if user.user_id:
            submission_data["user_id"] = user.user_id

        try:
            # Insert submission
            url = f"{self.config.supabase_url}/rest/v1/submissions"
            async with session.post(
                url, headers=self._get_headers(), json=submission_data
            ) as resp:
                if resp.status not in (200, 201):
                    error_text = await resp.text()
                    self.stats["errors"].append(
                        f"Submission failed for {user.username} on {quiz.name}: {error_text}"
                    )
                    return False

            # Increment guess counts for each answer
            for ans_id in answer_ids:
                rpc_url = (
                    f"{self.config.supabase_url}/rest/v1/rpc/increment_answer_guess"
                )
                async with session.post(
                    rpc_url, headers=self._get_headers(), json={"answer_id": ans_id}
                ) as resp:
                    pass  # Don't fail the whole submission if guess increment fails

            return True

        except Exception as e:
            self.stats["errors"].append(
                f"Quiz submission error for {user.username}: {str(e)}"
            )
            return False

    async def simulate_user(self, session: aiohttp.ClientSession, user: User):
        """Simulate a single user's complete session."""
        async with self.semaphore:
            # Lookup user (login simulation)
            login_success = await self.lookup_user(session, user)

            async with self._progress_lock:
                if login_success:
                    self.stats["logins_success"] += 1
                else:
                    self.stats["logins_failed"] += 1

            if not login_success:
                async with self._progress_lock:
                    self.stats["users_completed"] += 1
                return

            # Determine how many quizzes this user will take (weighted distribution)
            # 50% take 1, 25% take 2, 15% take 3, 7% take 4, 3% take all 5
            rand = random.random()
            if rand < 0.50:
                num_quizzes = 1
            elif rand < 0.75:
                num_quizzes = 2
            elif rand < 0.90:
                num_quizzes = 3
            elif rand < 0.97:
                num_quizzes = 4
            else:
                num_quizzes = 5

            # Some users take the same quiz multiple times (20% chance for each quiz)
            quizzes_to_take = []
            available_quizzes = list(self.quizzes)
            random.shuffle(available_quizzes)

            for i in range(min(num_quizzes, len(available_quizzes))):
                quiz = available_quizzes[i]
                quizzes_to_take.append(quiz)

                # 20% chance to take the same quiz again
                if random.random() < 0.20:
                    quizzes_to_take.append(quiz)

            # Take each quiz
            for quiz in quizzes_to_take:
                # Check if submission limit reached before taking quiz
                async with self._progress_lock:
                    if self._submission_limit_reached:
                        break

                success = await self.take_quiz(session, user, quiz)

                async with self._progress_lock:
                    if not self._submission_limit_reached:
                        self.stats["quizzes_taken"] += 1
                        if success:
                            self.stats["submissions_success"] += 1
                        else:
                            self.stats["submissions_failed"] += 1

                # Brief pause between quizzes
                await asyncio.sleep(random.uniform(0.5, 1.5))

            async with self._progress_lock:
                self.stats["users_completed"] += 1

                # Print progress every 50 users
                if self.stats["users_completed"] % 50 == 0:
                    elapsed = time.time() - self.stats["start_time"]
                    print(
                        f"📊 Progress: {self.stats['users_completed']}/{len(self.users)} users "
                        f"({self.stats['quizzes_taken']} quizzes, {elapsed:.1f}s elapsed)"
                    )

    async def run(self):
        """Run the load test."""
        print("\n" + "=" * 60)
        print("🚀 QUIZ APP LOAD TEST")
        print("=" * 60)
        print(f"👥 Users: {len(self.users)}")
        print(f"⚡ Concurrent: {self.config.concurrent_users}")
        if self.config.max_submissions:
            print(f"📊 Max submissions: {self.config.max_submissions}")
        print(f"🎯 Target: {self.config.supabase_url}")
        print("=" * 60 + "\n")

        connector = aiohttp.TCPConnector(limit=self.config.concurrent_users * 2)
        timeout = aiohttp.ClientTimeout(total=60)

        async with aiohttp.ClientSession(
            connector=connector, timeout=timeout
        ) as session:
            # First, fetch all quizzes
            await self.fetch_quizzes(session)

            if not self.quizzes:
                print("❌ No quizzes found! Make sure the database is seeded.")
                return

            print(f"\n🏁 Starting load test with {len(self.users)} users...\n")
            self.stats["start_time"] = time.time()

            # Create tasks for all users
            tasks = [self.simulate_user(session, user) for user in self.users]

            # Run all tasks concurrently (semaphore limits actual concurrency)
            await asyncio.gather(*tasks)

            self.stats["end_time"] = time.time()

        self._print_results()

    def _print_results(self):
        """Print the final results."""
        duration = self.stats["end_time"] - self.stats["start_time"]

        print("\n" + "=" * 60)
        print("📈 LOAD TEST RESULTS")
        print("=" * 60)
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"👥 Users completed: {self.stats['users_completed']}/{len(self.users)}")
        print(
            f"🔐 Logins: {self.stats['logins_success']} success, {self.stats['logins_failed']} failed"
        )
        print(f"📝 Quizzes taken: {self.stats['quizzes_taken']}")
        print(
            f"✅ Submissions: {self.stats['submissions_success']} success, {self.stats['submissions_failed']} failed"
        )
        print(
            f"⚡ Throughput: {self.stats['quizzes_taken'] / duration:.2f} quizzes/second"
        )
        print(
            f"👤 Avg time per user: {duration / max(self.stats['users_completed'], 1):.2f} seconds"
        )

        if self._submission_limit_reached:
            print(
                f"\n🛑 Submission limit reached ({self.config.max_submissions} submissions)"
            )

        if self.stats["errors"]:
            print(f"\n⚠️  Errors ({len(self.stats['errors'])}):")
            for error in self.stats["errors"][:10]:  # Show first 10 errors
                print(f"   - {error}")
            if len(self.stats["errors"]) > 10:
                print(f"   ... and {len(self.stats['errors']) - 10} more")

        print("=" * 60 + "\n")


def parse_users_from_seed(seed_file: Path) -> list[User]:
    """Parse users from the SQL seed file."""
    users = []

    # Regex to match INSERT statements
    pattern = re.compile(
        r"INSERT INTO users.*VALUES\s*\(\s*'([^']+)',\s*'([^']+)',\s*'[^']+',\s*'([^']+)'\s*\)"
    )

    with open(seed_file, "r") as f:
        content = f.read()

    for match in pattern.finditer(content):
        username, email, full_name = match.groups()
        users.append(User(username=username, email=email, full_name=full_name))

    return users


def load_env_files():
    """Load environment variables from .env files."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Try loading from various locations (later ones override earlier)
    env_paths = [
        # Relative to project root (for local development)
        project_root / ".env",
        project_root / ".env.local",
        project_root / "quiz-app" / ".env",
        project_root / "quiz-app" / ".env.local",
        # Absolute paths (for Docker container with volume mounts)
        Path("/app/.env"),
        Path("/app/.env.local"),
        Path("/app/quiz-app/.env"),
        Path("/app/quiz-app/.env.local"),
    ]

    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path, override=True)


def get_supabase_config():
    """Get Supabase URL and key from environment, supporting VITE_ prefix."""
    # Check for VITE_ prefixed vars (used by Vue app) or standard vars
    url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get(
        "VITE_SUPABASE_ANON_KEY"
    )
    return url, key


def main():
    # Load environment variables from .env files
    load_env_files()

    # Get default values from environment
    default_url, default_key = get_supabase_config()

    parser = argparse.ArgumentParser(
        description="Load test the Quiz App with simulated users"
    )
    parser.add_argument(
        "--supabase-url",
        default=default_url,
        help="Supabase project URL (or set SUPABASE_URL/VITE_SUPABASE_URL env var)",
    )
    parser.add_argument(
        "--supabase-key",
        default=default_key,
        help="Supabase anonymous key (or set SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY env var)",
    )
    parser.add_argument(
        "--users-file",
        default="supabase/users_seed.sql",
        help="Path to users seed SQL file",
    )
    parser.add_argument(
        "--concurrent",
        type=int,
        default=50,
        help="Number of concurrent users (default: 50)",
    )
    parser.add_argument(
        "--think-time-min",
        type=float,
        default=0.5,
        help="Minimum think time between actions in seconds (default: 0.5)",
    )
    parser.add_argument(
        "--think-time-max",
        type=float,
        default=2.0,
        help="Maximum think time between actions in seconds (default: 2.0)",
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="Run in fast mode with minimal delays (for quick testing)",
    )
    parser.add_argument(
        "--num-users",
        type=int,
        default=None,
        help="Number of users to simulate (default: all users from seed file)",
    )
    parser.add_argument(
        "--max-submissions",
        type=int,
        default=None,
        help="Maximum total quiz submissions (default: unlimited)",
    )

    args = parser.parse_args()

    if not args.supabase_url or not args.supabase_key:
        print("❌ Error: Supabase URL and key are required!")
        print("   The script automatically loads from quiz-app/.env.local")
        print("   Or set via --supabase-url/--supabase-key flags")
        print("   Or set environment variables:")
        print("   export VITE_SUPABASE_URL='https://your-project.supabase.co'")
        print("   export VITE_SUPABASE_ANON_KEY='your-anon-key'")
        return 1

    # Parse users from seed file
    seed_path = Path(args.users_file)
    if not seed_path.exists():
        # Try relative to script location
        script_dir = Path(__file__).parent.parent
        seed_path = script_dir / args.users_file

    if not seed_path.exists():
        print(f"❌ Error: Users seed file not found: {args.users_file}")
        return 1

    all_users = parse_users_from_seed(seed_path)
    print(f"📋 Parsed {len(all_users)} users from {seed_path}")

    if not all_users:
        print("❌ Error: No users found in seed file!")
        return 1

    # Limit number of users if specified
    if args.num_users is not None:
        if args.num_users > len(all_users):
            print(
                f"⚠️  Requested {args.num_users} users but only {len(all_users)} available"
            )
        users = all_users[: args.num_users]
        print(f"👥 Using {len(users)} of {len(all_users)} users")
    else:
        users = all_users

    # Configure load test
    config = LoadTestConfig(
        supabase_url=args.supabase_url.rstrip("/"),
        supabase_key=args.supabase_key,
        concurrent_users=args.concurrent,
        num_users=args.num_users,
        max_submissions=args.max_submissions,
        think_time_min=0.01 if args.fast else args.think_time_min,
        think_time_max=0.05 if args.fast else args.think_time_max,
        answer_time_min=0.01 if args.fast else 0.3,
        answer_time_max=0.05 if args.fast else 1.5,
    )

    # Run the load test
    tester = QuizLoadTester(config, users)
    asyncio.run(tester.run())

    return 0


if __name__ == "__main__":
    exit(main())

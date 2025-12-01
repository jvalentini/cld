# Quiz App Load Testing

A load testing tool that simulates 1000 users taking random quizzes concurrently.

## Features

- **Concurrent Users**: Simulates 50 users at a time (configurable)
- **Realistic Behavior**: 
  - Each user takes 1-5 quizzes with weighted distribution
  - 20% chance users retake the same quiz
  - Simulated "think time" between actions
  - ~40% chance to select correct answers (realistic scoring)
- **Full Quiz Flow**: Login lookup → Load quiz → Answer questions → Submit results
- **Detailed Statistics**: Tracks logins, submissions, errors, and throughput

## Prerequisites

- Python 3.10+
- Supabase project with seeded data (schema.sql, seed.sql, users_seed.sql)

## Installation

```bash
cd load-testing
pip install -r requirements.txt
```

## Usage

### Basic Usage

The script automatically loads Supabase credentials from `quiz-app/.env.local`:

```bash
# Just run it - credentials are loaded automatically
python load_test.py
```

### With Command Line Arguments

You can override the credentials via command line:

```bash
python load_test.py \
  --supabase-url https://your-project.supabase.co \
  --supabase-key your-anon-key \
  --concurrent 50
```

### Environment Variables

The script checks for credentials in this order:
1. Command line arguments (`--supabase-url`, `--supabase-key`)
2. Environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
3. Vite-prefixed env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

These are loaded from `.env` files in:
- Project root (`.env`, `.env.local`)
- Quiz app directory (`quiz-app/.env`, `quiz-app/.env.local`)

### Fast Mode (for quick testing)

```bash
# Minimal delays - runs much faster but less realistic
python load_test.py --fast
```

### All Options

```
--supabase-url     Supabase project URL (or set SUPABASE_URL env var)
--supabase-key     Supabase anonymous key (or set SUPABASE_ANON_KEY env var)
--users-file       Path to users seed SQL file (default: supabase/users_seed.sql)
--concurrent       Number of concurrent users (default: 50)
--num-users        Number of users to simulate (default: all users from seed file)
--max-submissions  Maximum total quiz submissions (default: unlimited)
--think-time-min   Minimum think time between actions in seconds (default: 0.5)
--think-time-max   Maximum think time between actions in seconds (default: 2.0)
--fast             Run in fast mode with minimal delays
```

### Examples

```bash
# Run with only 100 users
python load_test.py --num-users 100

# Limit to 500 total quiz submissions
python load_test.py --max-submissions 500

# Run 200 users with max 300 submissions in fast mode
python load_test.py --num-users 200 --max-submissions 300 --fast
```

## User Distribution

The script parses users from `users_seed.sql` and assigns quiz-taking patterns:

| Quiz Count | Probability | Description |
|------------|-------------|-------------|
| 1 quiz     | 50%         | Casual users |
| 2 quizzes  | 25%         | Interested users |
| 3 quizzes  | 15%         | Active users |
| 4 quizzes  | 7%          | Power users |
| 5 quizzes  | 3%          | Super users (all quizzes) |

Additionally:
- 20% chance any user retakes a quiz they've already taken
- ~40% chance to answer correctly (realistic performance)

## Example Output

```
============================================================
🚀 QUIZ APP LOAD TEST
============================================================
👥 Users: 1000
⚡ Concurrent: 50
🎯 Target: https://your-project.supabase.co
============================================================

📚 Fetching available quizzes...
✅ Loaded 5 quizzes:
   - AI Tools Survey (3 questions)
   - Historical Facts Quiz (6 questions)
   - Geography Challenge (5 questions)
   - Pop Culture Quiz (8 questions)
   - Science & Nature Quiz (4 questions)

🏁 Starting load test with 1000 users...

📊 Progress: 50/1000 users (87 quizzes, 12.3s elapsed)
📊 Progress: 100/1000 users (168 quizzes, 24.1s elapsed)
...

============================================================
📈 LOAD TEST RESULTS
============================================================
⏱️  Duration: 245.32 seconds
👥 Users completed: 1000/1000
🔐 Logins: 1000 success, 0 failed
📝 Quizzes taken: 1752
✅ Submissions: 1752 success, 0 failed
⚡ Throughput: 7.14 quizzes/second
👤 Avg time per user: 0.25 seconds
============================================================
```

## Database Impact

This load test creates:
- ~1500-2000 new submissions (depending on random distribution)
- Increments answer guess counts for all answered questions

To reset after testing, re-run the seed SQL files:
```sql
-- Run in Supabase SQL Editor
-- This will clear and reset all quiz data
\i supabase/seed.sql
```

## Troubleshooting

### "No users found in seed file"
Make sure users_seed.sql has been created and contains user INSERT statements.

### "Login lookup failed"
Ensure the users have been inserted into the database by running:
```bash
psql -f supabase/users_seed.sql
```

### Rate Limiting
If you see many failed submissions, Supabase may be rate limiting. Try:
- Reducing `--concurrent` to 25 or 10
- Increasing think time with `--think-time-min 1 --think-time-max 3`


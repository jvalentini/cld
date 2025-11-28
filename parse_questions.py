#!/usr/bin/env python3
"""
DOCX Question Parser
Parses a DOCX file to extract questions and their answer choices.
Supports both multiple-choice questions and true/false assumption questions.
"""

import sys
import json
import re
from docx2python import docx2python
from typing import List, Dict


def parse_multiple_choice_questions(lines: List[str]) -> List[Dict]:
    """
    Parse multiple choice questions from lines of text.

    Args:
        lines: List of text lines from the document

    Returns:
        List of dictionaries with 'question', 'answers', and 'type' keys
    """
    questions = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if this line starts with "Question"
        if line.lower().startswith("question"):
            # Next line should be the actual question
            if i + 1 >= len(lines):
                raise ValueError(
                    f"Found 'Question' marker at line {i+1} but no question text follows"
                )

            question_text = lines[i + 1]
            i += 2  # Move past "Question" marker and question text

            # Now collect the 4 answer choices
            answers = []
            expected_labels = ["A", "B", "C", "D"]

            for expected_label in expected_labels:
                if i >= len(lines):
                    raise ValueError(
                        f"Question '{question_text[:50]}...' does not have 4 answer choices. "
                        f"Missing answer {expected_label}"
                    )

                answer_line = lines[i]

                # Check if answer is properly labeled (e.g., "A. Some answer" or "A) Some answer")
                pattern = rf"^{expected_label}[\.\)]\s*(.+)$"
                match = re.match(pattern, answer_line, re.IGNORECASE)

                if not match:
                    raise ValueError(
                        f"Question '{question_text[:50]}...' has improperly formatted answer. "
                        f"Expected answer labeled '{expected_label}', but found: '{answer_line}'"
                    )

                answer_text = match.group(1).strip()
                answers.append(answer_text)
                i += 1

            questions.append(
                {
                    "question": question_text,
                    "answers": answers,
                    "type": "multiple_choice",
                }
            )
        else:
            i += 1

    return questions


def parse_assumption_questions(lines: List[str]) -> List[Dict]:
    """
    Parse assumption-based true/false questions from lines of text.
    Searches for sentences containing the word "Assume".

    Args:
        lines: List of text lines from the document

    Returns:
        List of dictionaries with 'question', 'answers', and 'type' keys
    """
    questions = []

    # Join lines to handle multi-line sentences, then re-split by sentence
    full_text = " ".join(lines)

    # Split into sentences (simple approach - can be improved with nltk if needed)
    # This regex splits on '.', '!', or '?' followed by space or end of string
    sentences = re.split(r"(?<=[.!?])\s+", full_text)

    for sentence in sentences:
        sentence = sentence.strip()

        # Check if sentence contains "assume" (case-insensitive)
        if re.search(r"\bassume\b", sentence, re.IGNORECASE):
            questions.append(
                {
                    "question": sentence,
                    "answers": ["True", "False"],
                    "type": "true_false",
                }
            )

    return questions


def parse_docx_questions(docx_path: str, question_type: str = "all") -> List[Dict]:
    """
    Parse a DOCX file and extract questions with their answer choices.

    Args:
        docx_path: Path to the DOCX file
        question_type: Type of questions to parse ('multiple_choice', 'true_false', or 'all')

    Returns:
        List of dictionaries with 'question', 'answers', and 'type' keys
    """
    # Validate question_type
    valid_types = ["multiple_choice", "true_false", "all"]
    if question_type not in valid_types:
        raise ValueError(
            f"Invalid question_type '{question_type}'. Must be one of {valid_types}"
        )

    # Extract text from docx
    with docx2python(docx_path) as docx_content:
        # Get all paragraphs as a flat list
        text = docx_content.text

    # Split into lines and clean up
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    questions = []

    # Parse multiple choice questions if requested
    if question_type in ["multiple_choice", "all"]:
        mc_questions = parse_multiple_choice_questions(lines)
        questions.extend(mc_questions)

    # Parse assumption questions if requested
    if question_type in ["true_false", "all"]:
        tf_questions = parse_assumption_questions(lines)
        questions.extend(tf_questions)

    return questions


def main():
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(
            "Usage: python parse_questions.py <input.docx> <output.json> [question_type]"
        )
        print(
            "  question_type: 'multiple_choice', 'true_false', or 'all' (default: 'all')"
        )
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    question_type = sys.argv[3] if len(sys.argv) == 4 else "all"

    try:
        questions = parse_docx_questions(input_path, question_type)

        # Write to JSON file
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)

        # Count question types
        mc_count = sum(1 for q in questions if q["type"] == "multiple_choice")
        tf_count = sum(1 for q in questions if q["type"] == "true_false")

        print(f"Successfully parsed {len(questions)} question(s)")
        print(f"  - Multiple choice: {mc_count}")
        print(f"  - True/False: {tf_count}")
        print(f"Output written to: {output_path}")

    except FileNotFoundError:
        print(f"Error: Could not find file '{input_path}'")
        sys.exit(1)
    except ValueError as e:
        print(f"Parsing Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

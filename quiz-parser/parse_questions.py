#!/usr/bin/env python3
"""
DOCX Question Parser
Parses a DOCX file to extract questions and their answer choices.
Supports both multiple-choice questions and true/false assumption questions.
"""

import json
import re
import click
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


@click.command()
@click.argument("input_docx", type=click.Path(exists=True))
@click.argument("output_json", type=click.Path())
@click.option(
    "--extended",
    is_flag=True,
    help="Parse both multiple-choice and true/false questions. By default, only multiple-choice questions are parsed.",
)
@click.option(
    "--type",
    "question_type",
    type=click.Choice(["multiple_choice", "true_false", "all"], case_sensitive=False),
    default=None,
    help="Specify question type to parse. Overrides --extended flag.",
)
@click.help_option("--help", "-h")
def main(input_docx, output_json, extended, question_type):
    """
    Parse a DOCX file and extract quiz questions.

    INPUT_DOCX: Path to the input DOCX file containing questions

    OUTPUT_JSON: Path where the parsed JSON output will be saved

    \b
    Examples:
      # Parse only multiple-choice questions (default)
      python parse_questions.py input.docx output.json

      # Parse both multiple-choice and true/false questions
      python parse_questions.py input.docx output.json --extended

      # Parse only true/false questions
      python parse_questions.py input.docx output.json --type true_false
    """
    # Determine which question types to parse
    if question_type:
        # Explicit type overrides everything
        parse_type = question_type
    elif extended:
        # Extended flag means parse all types
        parse_type = "all"
    else:
        # Default: only multiple choice
        parse_type = "multiple_choice"

    try:
        click.echo(f"📄 Reading: {input_docx}")
        questions = parse_docx_questions(input_docx, parse_type)

        # Write to JSON file
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)

        # Count question types
        mc_count = sum(1 for q in questions if q["type"] == "multiple_choice")
        tf_count = sum(1 for q in questions if q["type"] == "true_false")

        click.echo(f"\n✅ Successfully parsed {len(questions)} question(s)")
        if mc_count > 0:
            click.echo(f"   • Multiple choice: {mc_count}")
        if tf_count > 0:
            click.echo(f"   • True/False: {tf_count}")
        click.echo(f"\n💾 Output written to: {output_json}")

    except FileNotFoundError:
        click.echo(f"❌ Error: Could not find file '{input_docx}'", err=True)
        raise click.Abort()
    except ValueError as e:
        click.echo(f"❌ Parsing Error: {e}", err=True)
        raise click.Abort()
    except Exception as e:
        click.echo(f"❌ Unexpected Error: {e}", err=True)
        raise click.Abort()


if __name__ == "__main__":
    main()

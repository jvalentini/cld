#!/usr/bin/env python3
"""
DOCX Question Parser
Parses a DOCX file to extract questions and their answer choices.
Supports both multiple-choice questions and true/false assumption questions.

This module uses the Strategy pattern for extensibility - new question types
can be added by creating a new parser class that extends QuestionParser
and registering it with the QuestionParserRegistry.
"""

import json
import random
import re
import click
from abc import ABC, abstractmethod
from docx2python import docx2python
from typing import List, Dict, Type, Optional


# =============================================================================
# Utility Functions - Common operations extracted to avoid duplication
# =============================================================================


def get_random_correct_answer(max_index: int) -> int:
    """
    Get a random correct answer index.

    Args:
        max_index: Maximum index value (inclusive)

    Returns:
        Random integer from 0 to max_index
    """
    return random.randint(0, max_index)


def convert_letter_to_index(letter: str) -> int:
    """
    Convert answer letter (A, B, C, D) to zero-based index.

    Args:
        letter: A letter from A-D (case insensitive)

    Returns:
        Index 0-3 corresponding to the letter
    """
    return ord(letter.upper()) - ord("A")


def convert_true_false_to_index(value: str) -> int:
    """
    Convert True/False string to index.

    Args:
        value: 'True', 'T', 'False', or 'F' (case insensitive)

    Returns:
        0 for True/T, 1 for False/F
    """
    return 0 if value.upper() in ["TRUE", "T"] else 1


def create_question_dict(
    question: str, answers: List[str], q_type: str, correct_answer: int
) -> Dict:
    """
    Create a standardized question dictionary.

    Args:
        question: The question text
        answers: List of answer choices
        q_type: Question type string
        correct_answer: Index of the correct answer

    Returns:
        Dictionary with question, answers, type, and correct_answer keys
    """
    return {
        "question": question,
        "answers": answers,
        "type": q_type,
        "correct_answer": correct_answer,
    }


def parse_correct_answer_line(
    line: str, pattern: str, converter: callable
) -> Optional[int]:
    """
    Parse a "Correct Answer: X" line and return the index.

    Args:
        line: The line to parse
        pattern: Regex pattern to match (should have one capture group for the answer)
        converter: Function to convert matched value to index

    Returns:
        Index of correct answer if found, None otherwise
    """
    match = re.match(pattern, line.strip(), re.IGNORECASE)
    if match:
        return converter(match.group(1))
    return None


# =============================================================================
# Question Parser Base Class - Strategy Pattern
# =============================================================================


class QuestionParser(ABC):
    """
    Abstract base class for question parsers.

    To add a new question type:
    1. Create a class that extends QuestionParser
    2. Implement the abstract properties and methods
    3. Register the parser using @QuestionParserRegistry.register decorator

    Example:
        @QuestionParserRegistry.register
        class MyNewParser(QuestionParser):
            @property
            def question_type(self) -> str:
                return "my_new_type"

            @property
            def type_key(self) -> str:
                return "my_new_type"

            def parse(self, lines: List[str]) -> List[Dict]:
                # Implementation here
                pass
    """

    @property
    @abstractmethod
    def question_type(self) -> str:
        """
        Return the question type string used in output dictionaries.

        This is the value stored in the 'type' field of question dicts.
        """
        pass

    @property
    @abstractmethod
    def type_key(self) -> str:
        """
        Return the key used to identify this parser type in CLI options.

        This is the value users specify with --type option.
        """
        pass

    @abstractmethod
    def parse(self, lines: List[str]) -> List[Dict]:
        """
        Parse questions from lines of text.

        Args:
            lines: List of text lines from the document

        Returns:
            List of question dictionaries with 'question', 'answers',
            'type', and 'correct_answer' keys
        """
        pass


# =============================================================================
# Parser Registry - Factory Pattern for extensibility
# =============================================================================


class QuestionParserRegistry:
    """
    Registry for question parsers.

    This enables easy addition of new question types without modifying
    existing code. Use the @register decorator on parser classes.
    """

    _parsers: Dict[str, Type[QuestionParser]] = {}

    @classmethod
    def register(cls, parser_class: Type[QuestionParser]):
        """
        Decorator to register a parser class.

        Usage:
            @QuestionParserRegistry.register
            class MyParser(QuestionParser):
                ...
        """
        # Create temporary instance to get the type_key
        instance = parser_class()
        cls._parsers[instance.type_key] = parser_class
        return parser_class

    @classmethod
    def get_parser(cls, type_key: str) -> QuestionParser:
        """
        Get a parser instance by its type key.

        Args:
            type_key: The parser type key (e.g., 'multiple_choice')

        Returns:
            An instance of the corresponding parser

        Raises:
            KeyError: If no parser is registered for the given type
        """
        if type_key not in cls._parsers:
            raise KeyError(f"No parser registered for type '{type_key}'")
        return cls._parsers[type_key]()

    @classmethod
    def get_all_parsers(cls) -> List[QuestionParser]:
        """
        Get instances of all registered parsers.

        Returns:
            List of parser instances
        """
        return [parser_class() for parser_class in cls._parsers.values()]

    @classmethod
    def get_registered_types(cls) -> List[str]:
        """
        Get list of all registered parser type keys.

        Returns:
            List of type key strings
        """
        return list(cls._parsers.keys())


# =============================================================================
# Concrete Parser Implementations
# =============================================================================


@QuestionParserRegistry.register
class MultipleChoiceParser(QuestionParser):
    """
    Parser for multiple choice questions.

    Expected format:
        Question
        What is the question text?
        A. Answer 1
        B. Answer 2
        C. Answer 3
        D. Answer 4
        Correct Answer: B  (optional)
    """

    ANSWER_LABELS = ["A", "B", "C", "D"]
    NUM_ANSWERS = 4

    @property
    def question_type(self) -> str:
        return "multiple_choice"

    @property
    def type_key(self) -> str:
        return "multiple_choice"

    def parse(self, lines: List[str]) -> List[Dict]:
        """
        Parse multiple choice questions from lines of text.

        Args:
            lines: List of text lines from the document

        Returns:
            List of dictionaries with 'question', 'answers', 'type', and 'correct_answer' keys
        """
        questions = []
        i = 0

        while i < len(lines):
            line = lines[i]

            # Check if this line starts with "Question"
            if line.lower().startswith("question"):
                question_data = self._parse_single_question(lines, i)
                if question_data:
                    questions.append(question_data["question"])
                    i = question_data["next_index"]
                else:
                    i += 1
            else:
                i += 1

        return questions

    def _parse_single_question(
        self, lines: List[str], start_index: int
    ) -> Optional[Dict]:
        """
        Parse a single multiple choice question starting at the given index.

        Args:
            lines: All lines from the document
            start_index: Index where "Question" marker was found

        Returns:
            Dictionary with 'question' and 'next_index' keys, or None if parsing fails
        """
        i = start_index

        # Next line should be the actual question
        if i + 1 >= len(lines):
            raise ValueError(
                f"Found 'Question' marker at line {i+1} but no question text follows"
            )

        question_text = lines[i + 1]
        i += 2  # Move past "Question" marker and question text

        # Collect the answer choices
        answers = self._parse_answers(lines, i, question_text)
        i += self.NUM_ANSWERS

        # Check for correct answer line
        correct_answer = self._find_correct_answer(lines, i)
        if correct_answer is not None:
            i += 1  # Move past the "Correct Answer" line
        else:
            correct_answer = get_random_correct_answer(self.NUM_ANSWERS - 1)

        question_dict = create_question_dict(
            question_text, answers, self.question_type, correct_answer
        )

        return {"question": question_dict, "next_index": i}

    def _parse_answers(
        self, lines: List[str], start_index: int, question_text: str
    ) -> List[str]:
        """
        Parse the answer choices for a question.

        Args:
            lines: All lines from the document
            start_index: Index where answers should start
            question_text: The question text (for error messages)

        Returns:
            List of answer texts

        Raises:
            ValueError: If answers are missing or improperly formatted
        """
        answers = []
        i = start_index

        for expected_label in self.ANSWER_LABELS:
            if i >= len(lines):
                raise ValueError(
                    f"Question '{question_text[:50]}...' does not have {self.NUM_ANSWERS} answer choices. "
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

        return answers

    def _find_correct_answer(self, lines: List[str], index: int) -> Optional[int]:
        """
        Look for a "Correct Answer" line at the given index.

        Args:
            lines: All lines from the document
            index: Index to check

        Returns:
            Correct answer index (0-3) if found, None otherwise
        """
        if index >= len(lines):
            return None

        pattern = r"^correct\s*answer:?\s*([A-D])"
        return parse_correct_answer_line(lines[index], pattern, convert_letter_to_index)


@QuestionParserRegistry.register
class TrueFalseParser(QuestionParser):
    """
    Parser for true/false assumption questions.

    Searches for sentences containing the word "Assume" and creates
    true/false questions from them.

    Expected format:
        Assume that something is true.
        Correct Answer: True  (optional)
    """

    ANSWERS = ["True", "False"]

    @property
    def question_type(self) -> str:
        return "true_false"

    @property
    def type_key(self) -> str:
        return "true_false"

    def parse(self, lines: List[str]) -> List[Dict]:
        """
        Parse assumption-based true/false questions from lines of text.

        Args:
            lines: List of text lines from the document

        Returns:
            List of dictionaries with 'question', 'answers', 'type', and 'correct_answer' keys
        """
        questions = []

        # Join lines to handle multi-line sentences, then re-split by sentence
        full_text = " ".join(lines)

        # Split into sentences (simple approach - can be improved with nltk if needed)
        sentences = re.split(r"(?<=[.!?])\s+", full_text)

        i = 0
        while i < len(sentences):
            sentence = sentences[i].strip()

            # Check if sentence contains "assume" (case-insensitive)
            if re.search(r"\bassume\b", sentence, re.IGNORECASE):
                result = self._process_assumption_sentence(sentences, i, questions)
                i = result["next_index"]
            else:
                i += 1

        return questions

    def _process_assumption_sentence(
        self, sentences: List[str], index: int, questions: List[Dict]
    ) -> Dict:
        """
        Process a sentence containing "assume".

        Args:
            sentences: All sentences
            index: Current sentence index
            questions: List of questions to potentially update (for trailing correct answers)

        Returns:
            Dictionary with 'next_index' key
        """
        sentence = sentences[index].strip()

        # Handle leading "Correct Answer" from previous sentence
        sentence = self._handle_leading_correct_answer(sentence, questions)

        # Check for correct answer at end of sentence
        result = self._parse_with_trailing_answer(sentence)
        if result:
            questions.append(result)
            return {"next_index": index + 1}

        # Create question from sentence
        question_dict = create_question_dict(
            sentence, self.ANSWERS.copy(), self.question_type, 0
        )

        # Look for correct answer in next sentence
        next_index = index + 1
        correct_answer = self._find_correct_answer_in_next(sentences, next_index)

        if correct_answer is not None:
            question_dict["correct_answer"] = correct_answer
            # Only skip next sentence if it doesn't contain "assume"
            if next_index < len(sentences) and not re.search(
                r"\bassume\b", sentences[next_index], re.IGNORECASE
            ):
                next_index += 1
        else:
            question_dict["correct_answer"] = get_random_correct_answer(1)

        questions.append(question_dict)
        return {"next_index": next_index}

    def _handle_leading_correct_answer(
        self, sentence: str, questions: List[Dict]
    ) -> str:
        """
        Handle "Correct Answer: X  Assume ..." pattern where correct answer
        belongs to the previous question.

        Args:
            sentence: Current sentence
            questions: List of previous questions

        Returns:
            The sentence with leading correct answer removed if found
        """
        leading_correct = re.match(
            r"^correct\s*answer:?\s*(true|false|t|f)\s+(.+)",
            sentence,
            re.IGNORECASE,
        )

        if leading_correct:
            # Apply the correct answer to the PREVIOUS question
            if len(questions) > 0:
                answer_text = leading_correct.group(1)
                questions[-1]["correct_answer"] = convert_true_false_to_index(
                    answer_text
                )

            # Return just the assume part
            return leading_correct.group(2).strip()

        return sentence

    def _parse_with_trailing_answer(self, sentence: str) -> Optional[Dict]:
        """
        Parse sentence with correct answer at the end.

        Pattern: "Assume text. Correct Answer: True"

        Args:
            sentence: The sentence to parse

        Returns:
            Question dict if pattern matches, None otherwise
        """
        correct_at_end = re.search(
            r"^(.+?)\.\s*correct\s*answer:?\s*(true|false|t|f)\s*$",
            sentence,
            re.IGNORECASE,
        )

        if correct_at_end:
            question_text = correct_at_end.group(1).strip() + "."
            answer_text = correct_at_end.group(2)

            return create_question_dict(
                question_text,
                self.ANSWERS.copy(),
                self.question_type,
                convert_true_false_to_index(answer_text),
            )

        return None

    def _find_correct_answer_in_next(
        self, sentences: List[str], index: int
    ) -> Optional[int]:
        """
        Look for correct answer in the next sentence.

        Args:
            sentences: All sentences
            index: Index of next sentence to check

        Returns:
            Correct answer index if found, None otherwise
        """
        if index >= len(sentences):
            return None

        pattern = r"^correct\s*answer:?\s*(true|false|t|f)"
        return parse_correct_answer_line(
            sentences[index], pattern, convert_true_false_to_index
        )


# =============================================================================
# Legacy function wrappers for backward compatibility
# =============================================================================


def parse_multiple_choice_questions(lines: List[str]) -> List[Dict]:
    """
    Parse multiple choice questions from lines of text.

    This is a backward-compatible wrapper around MultipleChoiceParser.

    Args:
        lines: List of text lines from the document

    Returns:
        List of dictionaries with 'question', 'answers', 'type', and 'correct_answer' keys
    """
    parser = MultipleChoiceParser()
    return parser.parse(lines)


def parse_assumption_questions(lines: List[str]) -> List[Dict]:
    """
    Parse assumption-based true/false questions from lines of text.

    This is a backward-compatible wrapper around TrueFalseParser.

    Args:
        lines: List of text lines from the document

    Returns:
        List of dictionaries with 'question', 'answers', 'type', and 'correct_answer' keys
    """
    parser = TrueFalseParser()
    return parser.parse(lines)


# =============================================================================
# Main parsing function
# =============================================================================


def parse_docx_questions(docx_path: str, question_type: str = "all") -> List[Dict]:
    """
    Parse a DOCX file and extract questions with their answer choices.

    Args:
        docx_path: Path to the DOCX file
        question_type: Type of questions to parse ('multiple_choice', 'true_false', or 'all')

    Returns:
        List of dictionaries with 'question', 'answers', 'type', and 'correct_answer' keys
    """
    # Build valid types from registry
    registered_types = QuestionParserRegistry.get_registered_types()
    valid_types = registered_types + ["all"]

    if question_type not in valid_types:
        raise ValueError(
            f"Invalid question_type '{question_type}'. Must be one of {valid_types}"
        )

    # Extract text from docx
    with docx2python(docx_path) as docx_content:
        text = docx_content.text

    # Split into lines and clean up
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    questions = []

    if question_type == "all":
        # Use all registered parsers
        for parser in QuestionParserRegistry.get_all_parsers():
            questions.extend(parser.parse(lines))
    else:
        # Use specific parser
        parser = QuestionParserRegistry.get_parser(question_type)
        questions.extend(parser.parse(lines))

    return questions


# =============================================================================
# CLI Interface
# =============================================================================


@click.command()
@click.argument("input_docx", default="input.docx", type=click.Path(exists=True))
@click.argument("output_json", default="output.json", type=click.Path())
@click.option(
    "-e",
    "--extended",
    is_flag=True,
    help="Parse both multiple-choice and true/false questions. By default, only multiple-choice questions are parsed.",
)
@click.option(
    "-t",
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

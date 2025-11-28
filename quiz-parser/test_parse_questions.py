#!/usr/bin/env python3
"""
Unit tests for parse_questions.py
"""

import unittest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from click.testing import CliRunner
from parse_questions import (
    parse_docx_questions,
    parse_multiple_choice_questions,
    parse_assumption_questions,
    main,
)
import sys


class TestParseMultipleChoiceQuestions(unittest.TestCase):
    """Test cases for the parse_multiple_choice_questions function"""

    def setUp(self):
        """Set up test fixtures"""
        self.valid_lines = [
            "Question",
            "What is the capital of France?",
            "A. London",
            "B. Paris",
            "C. Berlin",
            "D. Madrid",
        ]

    def test_valid_single_question(self):
        """Test parsing a single valid question"""
        result = parse_multiple_choice_questions(self.valid_lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["question"], "What is the capital of France?")
        self.assertEqual(result[0]["type"], "multiple_choice")
        self.assertEqual(len(result[0]["answers"]), 4)
        self.assertEqual(result[0]["answers"][0], "London")
        self.assertEqual(result[0]["answers"][1], "Paris")

    def test_valid_multiple_questions(self):
        """Test parsing multiple valid questions"""
        lines = self.valid_lines + [
            "Question",
            "What is 2 + 2?",
            "A. 3",
            "B. 4",
            "C. 5",
            "D. 6",
        ]

        result = parse_multiple_choice_questions(lines)

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["question"], "What is the capital of France?")
        self.assertEqual(result[1]["question"], "What is 2 + 2?")

    def test_parentheses_format(self):
        """Test parsing with A) format instead of A."""
        lines = [
            "Question",
            "Test question?",
            "A) Answer 1",
            "B) Answer 2",
            "C) Answer 3",
            "D) Answer 4",
        ]

        result = parse_multiple_choice_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["answers"][0], "Answer 1")

    def test_case_insensitive_question_marker(self):
        """Test that 'question', 'Question', 'QUESTION' all work"""
        lines = [
            "QUESTION",
            "Test question?",
            "A. Answer 1",
            "B. Answer 2",
            "C. Answer 3",
            "D. Answer 4",
        ]

        result = parse_multiple_choice_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["question"], "Test question?")

    def test_missing_answer(self):
        """Test that missing answer raises ValueError"""
        lines = [
            "Question",
            "Test question?",
            "A. Answer 1",
            "B. Answer 2",
            "C. Answer 3",
        ]

        with self.assertRaises(ValueError) as context:
            parse_multiple_choice_questions(lines)

        self.assertIn("does not have 4 answer choices", str(context.exception))

    def test_no_questions(self):
        """Test parsing lines with no questions"""
        lines = ["Some random text", "No questions here"]

        result = parse_multiple_choice_questions(lines)

        self.assertEqual(len(result), 0)


class TestParseAssumptionQuestions(unittest.TestCase):
    """Test cases for the parse_assumption_questions function"""

    def test_single_assumption(self):
        """Test parsing a single assumption statement"""
        lines = ["Assume that the sky is blue."]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["question"], "Assume that the sky is blue.")
        self.assertEqual(result[0]["type"], "true_false")
        self.assertEqual(result[0]["answers"], ["True", "False"])

    def test_multiple_assumptions(self):
        """Test parsing multiple assumption statements"""
        lines = [
            "Assume that the sky is blue. Some other text here.",
            "Random text. Assume all users are authenticated.",
            "More text without assumptions.",
        ]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 2)
        self.assertIn("Assume that the sky is blue", result[0]["question"])
        self.assertIn("Assume all users are authenticated", result[1]["question"])

    def test_case_insensitive_assume(self):
        """Test that 'assume', 'Assume', 'ASSUME' all work"""
        lines = [
            "assume lowercase works.",
            "Assume capitalized works.",
            "ASSUME uppercase works.",
        ]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 3)

    def test_assume_as_part_of_word(self):
        """Test that 'assume' must be a whole word"""
        lines = [
            "The word 'assumed' should not match.",
            "Assume this should match.",
            "The word 'assumes' should not match.",
        ]

        result = parse_assumption_questions(lines)

        # Only the middle sentence should match (word boundary check)
        self.assertEqual(len(result), 1)
        self.assertIn("Assume this should match", result[0]["question"])

    def test_multiline_assumption(self):
        """Test assumption that spans multiple lines"""
        lines = ["Assume that the system", "is operating correctly."]

        result = parse_assumption_questions(lines)

        # Should join lines and find the assumption
        self.assertEqual(len(result), 1)
        self.assertIn(
            "Assume that the system is operating correctly", result[0]["question"]
        )

    def test_no_assumptions(self):
        """Test text with no assumptions"""
        lines = [
            "This is some text.",
            "There are no assumptions here.",
            "Just regular sentences.",
        ]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 0)

    def test_empty_lines(self):
        """Test with empty input"""
        lines = []

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 0)

    def test_assumption_with_special_characters(self):
        """Test assumption with special characters"""
        lines = ["Assume that x > 5 and y < 10."]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertIn(">", result[0]["question"])
        self.assertIn("<", result[0]["question"])


class TestParseDocxQuestions(unittest.TestCase):
    """Test cases for the main parse_docx_questions function"""

    @patch("parse_questions.docx2python")
    def test_parse_all_types(self, mock_docx2python):
        """Test parsing both multiple choice and true/false questions"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid

Assume that the user is authenticated. This is important."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        result = parse_docx_questions("test.docx", "all")

        self.assertEqual(len(result), 2)

        # Check multiple choice question
        mc_q = [q for q in result if q["type"] == "multiple_choice"][0]
        self.assertEqual(mc_q["question"], "What is the capital of France?")
        self.assertEqual(len(mc_q["answers"]), 4)

        # Check true/false question
        tf_q = [q for q in result if q["type"] == "true_false"][0]
        self.assertIn("Assume that the user is authenticated", tf_q["question"])
        self.assertEqual(tf_q["answers"], ["True", "False"])

    @patch("parse_questions.docx2python")
    def test_parse_only_multiple_choice(self, mock_docx2python):
        """Test parsing only multiple choice questions"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4

Assume this should be ignored."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        result = parse_docx_questions("test.docx", "multiple_choice")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["type"], "multiple_choice")

    @patch("parse_questions.docx2python")
    def test_parse_only_true_false(self, mock_docx2python):
        """Test parsing only true/false questions"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
This should be ignored.
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4

Assume that this is captured."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        result = parse_docx_questions("test.docx", "true_false")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["type"], "true_false")

    @patch("parse_questions.docx2python")
    def test_invalid_question_type(self, mock_docx2python):
        """Test that invalid question_type raises ValueError"""
        mock_doc = MagicMock()
        mock_doc.text = "Some text"
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        with self.assertRaises(ValueError) as context:
            parse_docx_questions("test.docx", "invalid_type")

        self.assertIn("Invalid question_type", str(context.exception))

    @patch("parse_questions.docx2python")
    def test_empty_document(self, mock_docx2python):
        """Test parsing empty document"""
        mock_doc = MagicMock()
        mock_doc.text = ""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        result = parse_docx_questions("test.docx")

        self.assertEqual(len(result), 0)


class TestMainFunction(unittest.TestCase):
    """Test cases for the main CLI function"""

    def setUp(self):
        """Set up test fixtures"""
        self.runner = CliRunner()

    def test_help_option(self):
        """Test that --help displays help message"""
        result = self.runner.invoke(main, ["--help"])

        self.assertEqual(result.exit_code, 0)
        self.assertIn("Parse a DOCX file", result.output)
        self.assertIn("--extended", result.output)
        self.assertIn("--type", result.output)

    def test_help_short_option(self):
        """Test that -h displays help message"""
        result = self.runner.invoke(main, ["-h"])

        self.assertEqual(result.exit_code, 0)
        self.assertIn("Parse a DOCX file", result.output)

    def test_missing_arguments(self):
        """Test CLI with missing arguments"""
        result = self.runner.invoke(main, [])

        self.assertNotEqual(result.exit_code, 0)
        self.assertIn("Missing argument", result.output)

    @patch("parse_questions.docx2python")
    def test_default_behavior_multiple_choice_only(self, mock_docx2python):
        """Test default behavior parses only multiple choice questions"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4

Assume this should be ignored by default."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        with self.runner.isolated_filesystem():
            # Create a dummy input file
            with open("input.docx", "w") as f:
                f.write("dummy")

            result = self.runner.invoke(main, ["input.docx", "output.json"])

            self.assertEqual(result.exit_code, 0)
            self.assertIn("Successfully parsed", result.output)
            self.assertIn("Multiple choice: 1", result.output)
            self.assertNotIn("True/False", result.output)

            # Check output file
            with open("output.json", "r") as f:
                data = json.load(f)

            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["type"], "multiple_choice")

    @patch("parse_questions.docx2python")
    def test_extended_flag(self, mock_docx2python):
        """Test --extended flag parses both question types"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4

Assume this should be included."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        with self.runner.isolated_filesystem():
            with open("input.docx", "w") as f:
                f.write("dummy")

            result = self.runner.invoke(
                main, ["input.docx", "output.json", "--extended"]
            )

            self.assertEqual(result.exit_code, 0)
            self.assertIn("Multiple choice: 1", result.output)
            self.assertIn("True/False: 1", result.output)

            # Check output file
            with open("output.json", "r") as f:
                data = json.load(f)

            self.assertEqual(len(data), 2)

    @patch("parse_questions.docx2python")
    def test_type_option_multiple_choice(self, mock_docx2python):
        """Test --type multiple_choice option"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4

Assume this should be ignored."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        with self.runner.isolated_filesystem():
            with open("input.docx", "w") as f:
                f.write("dummy")

            result = self.runner.invoke(
                main, ["input.docx", "output.json", "--type", "multiple_choice"]
            )

            self.assertEqual(result.exit_code, 0)

            with open("output.json", "r") as f:
                data = json.load(f)

            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["type"], "multiple_choice")

    @patch("parse_questions.docx2python")
    def test_type_option_true_false(self, mock_docx2python):
        """Test --type true_false option"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
This should be ignored.
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4

Assume this should be captured."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        with self.runner.isolated_filesystem():
            with open("input.docx", "w") as f:
                f.write("dummy")

            result = self.runner.invoke(
                main, ["input.docx", "output.json", "--type", "true_false"]
            )

            self.assertEqual(result.exit_code, 0)

            with open("output.json", "r") as f:
                data = json.load(f)

            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["type"], "true_false")

    @patch("parse_questions.docx2python")
    def test_type_option_all(self, mock_docx2python):
        """Test --type all option"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4

Assume this."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        with self.runner.isolated_filesystem():
            with open("input.docx", "w") as f:
                f.write("dummy")

            result = self.runner.invoke(
                main, ["input.docx", "output.json", "--type", "all"]
            )

            self.assertEqual(result.exit_code, 0)

            with open("output.json", "r") as f:
                data = json.load(f)

            self.assertEqual(len(data), 2)

    @patch("parse_questions.docx2python")
    def test_type_overrides_extended(self, mock_docx2python):
        """Test that --type option overrides --extended flag"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4

Assume this."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        with self.runner.isolated_filesystem():
            with open("input.docx", "w") as f:
                f.write("dummy")

            # --type multiple_choice should override --extended
            result = self.runner.invoke(
                main,
                [
                    "input.docx",
                    "output.json",
                    "--extended",
                    "--type",
                    "multiple_choice",
                ],
            )

            self.assertEqual(result.exit_code, 0)

            with open("output.json", "r") as f:
                data = json.load(f)

            # Should only have multiple choice despite --extended
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["type"], "multiple_choice")

    def test_file_not_found(self):
        """Test CLI with non-existent input file"""
        with self.runner.isolated_filesystem():
            result = self.runner.invoke(main, ["nonexistent.docx", "output.json"])

            self.assertNotEqual(result.exit_code, 0)

    @patch("parse_questions.parse_docx_questions")
    def test_parsing_error(self, mock_parse):
        """Test CLI with parsing error"""
        mock_parse.side_effect = ValueError("Parsing error")

        with self.runner.isolated_filesystem():
            with open("input.docx", "w") as f:
                f.write("dummy")

            result = self.runner.invoke(main, ["input.docx", "output.json"])

            self.assertNotEqual(result.exit_code, 0)
            self.assertIn("Parsing Error", result.output)


class TestIntegration(unittest.TestCase):
    """Integration tests for complete workflows"""

    @patch("parse_questions.docx2python")
    def test_complex_document(self, mock_docx2python):
        """Test parsing a complex document with mixed content"""
        mock_doc = MagicMock()
        mock_doc.text = """Introduction text here.

Question
What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid

Some additional context. Assume all answers are in English.

Question
What is 2 + 2?
A. 3
B. 4
C. 5
D. 6

Assume the calculations are correct. Final note."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        result = parse_docx_questions("test.docx", "all")

        # Should find 2 multiple choice and 2 true/false questions
        self.assertEqual(len(result), 4)

        mc_questions = [q for q in result if q["type"] == "multiple_choice"]
        tf_questions = [q for q in result if q["type"] == "true_false"]

        self.assertEqual(len(mc_questions), 2)
        self.assertEqual(len(tf_questions), 2)


def run_tests():
    """Run all tests"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestParseMultipleChoiceQuestions))
    suite.addTests(loader.loadTestsFromTestCase(TestParseAssumptionQuestions))
    suite.addTests(loader.loadTestsFromTestCase(TestParseDocxQuestions))
    suite.addTests(loader.loadTestsFromTestCase(TestMainFunction))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Return exit code
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)

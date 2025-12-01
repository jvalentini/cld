#!/usr/bin/env python3
"""
Unit tests for parse_questions.py
"""

import unittest
import json
import sys
from unittest.mock import patch, MagicMock
from click.testing import CliRunner
from parse_questions import (
    # Main functions
    parse_docx_questions,
    main,
    # Legacy wrapper functions (for backward compatibility)
    parse_multiple_choice_questions,
    parse_assumption_questions,
    # Classes for extensibility testing
    QuestionParser,
    QuestionParserRegistry,
    MultipleChoiceParser,
    TrueFalseParser,
    # Utility functions
    get_random_correct_answer,
    convert_letter_to_index,
    convert_true_false_to_index,
    create_question_dict,
    parse_correct_answer_line,
)


# =============================================================================
# Tests for Utility Functions
# =============================================================================


class TestUtilityFunctions(unittest.TestCase):
    """Test cases for utility functions"""

    def test_get_random_correct_answer_range(self):
        """Test that random answer is within expected range"""
        for max_index in [1, 3, 5]:
            for _ in range(100):
                result = get_random_correct_answer(max_index)
                self.assertGreaterEqual(result, 0)
                self.assertLessEqual(result, max_index)

    def test_convert_letter_to_index(self):
        """Test letter to index conversion"""
        self.assertEqual(convert_letter_to_index("A"), 0)
        self.assertEqual(convert_letter_to_index("B"), 1)
        self.assertEqual(convert_letter_to_index("C"), 2)
        self.assertEqual(convert_letter_to_index("D"), 3)

    def test_convert_letter_to_index_case_insensitive(self):
        """Test letter conversion is case insensitive"""
        self.assertEqual(convert_letter_to_index("a"), 0)
        self.assertEqual(convert_letter_to_index("b"), 1)
        self.assertEqual(convert_letter_to_index("c"), 2)
        self.assertEqual(convert_letter_to_index("d"), 3)

    def test_convert_true_false_to_index(self):
        """Test true/false to index conversion"""
        self.assertEqual(convert_true_false_to_index("True"), 0)
        self.assertEqual(convert_true_false_to_index("T"), 0)
        self.assertEqual(convert_true_false_to_index("FALSE"), 1)
        self.assertEqual(convert_true_false_to_index("F"), 1)

    def test_convert_true_false_case_insensitive(self):
        """Test true/false conversion is case insensitive"""
        self.assertEqual(convert_true_false_to_index("true"), 0)
        self.assertEqual(convert_true_false_to_index("TRUE"), 0)
        self.assertEqual(convert_true_false_to_index("false"), 1)
        self.assertEqual(convert_true_false_to_index("f"), 1)

    def test_create_question_dict(self):
        """Test question dictionary creation"""
        result = create_question_dict(
            question="Test?",
            answers=["A", "B", "C", "D"],
            q_type="multiple_choice",
            correct_answer=1,
        )

        self.assertEqual(result["question"], "Test?")
        self.assertEqual(result["answers"], ["A", "B", "C", "D"])
        self.assertEqual(result["type"], "multiple_choice")
        self.assertEqual(result["correct_answer"], 1)

    def test_parse_correct_answer_line_found(self):
        """Test parsing correct answer line when pattern matches"""
        pattern = r"^correct\s*answer:?\s*([A-D])"
        result = parse_correct_answer_line(
            "Correct Answer: B", pattern, convert_letter_to_index
        )
        self.assertEqual(result, 1)

    def test_parse_correct_answer_line_not_found(self):
        """Test parsing correct answer line when pattern doesn't match"""
        pattern = r"^correct\s*answer:?\s*([A-D])"
        result = parse_correct_answer_line(
            "Some other text", pattern, convert_letter_to_index
        )
        self.assertIsNone(result)


# =============================================================================
# Tests for QuestionParserRegistry
# =============================================================================


class TestQuestionParserRegistry(unittest.TestCase):
    """Test cases for the parser registry"""

    def test_multiple_choice_parser_is_registered(self):
        """Test that MultipleChoiceParser is registered"""
        self.assertIn("multiple_choice", QuestionParserRegistry.get_registered_types())

    def test_true_false_parser_is_registered(self):
        """Test that TrueFalseParser is registered"""
        self.assertIn("true_false", QuestionParserRegistry.get_registered_types())

    def test_get_parser_returns_correct_instance(self):
        """Test that get_parser returns the correct parser type"""
        mc_parser = QuestionParserRegistry.get_parser("multiple_choice")
        self.assertIsInstance(mc_parser, MultipleChoiceParser)

        tf_parser = QuestionParserRegistry.get_parser("true_false")
        self.assertIsInstance(tf_parser, TrueFalseParser)

    def test_get_parser_unknown_type_raises(self):
        """Test that get_parser raises KeyError for unknown type"""
        with self.assertRaises(KeyError) as context:
            QuestionParserRegistry.get_parser("unknown_type")
        self.assertIn("No parser registered", str(context.exception))

    def test_get_all_parsers_returns_all(self):
        """Test that get_all_parsers returns all registered parsers"""
        parsers = QuestionParserRegistry.get_all_parsers()
        self.assertGreaterEqual(len(parsers), 2)

        types = [p.type_key for p in parsers]
        self.assertIn("multiple_choice", types)
        self.assertIn("true_false", types)

    def test_custom_parser_registration(self):
        """Test registering a custom parser"""

        # Store original parsers to restore later
        original_parsers = QuestionParserRegistry._parsers.copy()

        try:
            # Create and register a custom parser
            @QuestionParserRegistry.register
            class CustomParser(QuestionParser):
                @property
                def question_type(self) -> str:
                    return "custom"

                @property
                def type_key(self) -> str:
                    return "custom"

                def parse(self, lines):
                    return [{"question": "custom", "type": "custom"}]

            # Verify registration
            self.assertIn("custom", QuestionParserRegistry.get_registered_types())

            # Verify can get parser
            parser = QuestionParserRegistry.get_parser("custom")
            self.assertIsInstance(parser, CustomParser)

        finally:
            # Restore original parsers
            QuestionParserRegistry._parsers = original_parsers


# =============================================================================
# Tests for MultipleChoiceParser
# =============================================================================


class TestMultipleChoiceParser(unittest.TestCase):
    """Test cases for the MultipleChoiceParser class"""

    def setUp(self):
        """Set up test fixtures"""
        self.parser = MultipleChoiceParser()
        self.valid_lines = [
            "Question",
            "What is the capital of France?",
            "A. London",
            "B. Paris",
            "C. Berlin",
            "D. Madrid",
        ]

    def test_parser_properties(self):
        """Test parser properties are correct"""
        self.assertEqual(self.parser.question_type, "multiple_choice")
        self.assertEqual(self.parser.type_key, "multiple_choice")
        self.assertEqual(self.parser.NUM_ANSWERS, 4)

    def test_valid_single_question(self):
        """Test parsing a single valid question"""
        result = self.parser.parse(self.valid_lines)

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

        result = self.parser.parse(lines)

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

        result = self.parser.parse(lines)

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

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["question"], "Test question?")

    def test_correct_answer_with_colon(self):
        """Test parsing correct answer with 'Correct Answer: B' format"""
        lines = self.valid_lines + ["Correct Answer: B"]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 1)  # B = index 1

    def test_correct_answer_without_colon(self):
        """Test parsing correct answer with 'Correct Answer B' format (no colon)"""
        lines = [
            "Question",
            "What is 2 + 2?",
            "A. 3",
            "B. 4",
            "C. 5",
            "D. 6",
            "Correct Answer B",
        ]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 1)  # B = index 1

    def test_correct_answer_case_insensitive(self):
        """Test that 'Correct Answer', 'CORRECT ANSWER', 'correct answer' all work"""
        test_cases = [
            "Correct Answer: C",
            "CORRECT ANSWER: C",
            "correct answer: C",
            "Correct Answer C",
            "CORRECT ANSWER C",
            "correct answer C",
        ]

        for correct_line in test_cases:
            lines = [
                "Question",
                "Test?",
                "A. Answer 1",
                "B. Answer 2",
                "C. Answer 3",
                "D. Answer 4",
                correct_line,
            ]

            result = self.parser.parse(lines)
            self.assertEqual(
                result[0]["correct_answer"], 2, f"Failed for: {correct_line}"
            )  # C = index 2

    def test_correct_answer_different_labels(self):
        """Test correct answer parsing for all labels A, B, C, D"""
        labels_and_indices = [("A", 0), ("B", 1), ("C", 2), ("D", 3)]

        for label, expected_index in labels_and_indices:
            lines = [
                "Question",
                "Test question?",
                "A. Answer 1",
                "B. Answer 2",
                "C. Answer 3",
                "D. Answer 4",
                f"Correct Answer: {label}",
            ]

            result = self.parser.parse(lines)
            self.assertEqual(
                result[0]["correct_answer"], expected_index, f"Failed for label {label}"
            )

    def test_question_without_correct_answer(self):
        """Test that questions without correct answer line get random correct answer"""
        result = self.parser.parse(self.valid_lines)

        self.assertEqual(len(result), 1)
        self.assertIn("correct_answer", result[0])
        self.assertIsInstance(result[0]["correct_answer"], int)
        self.assertGreaterEqual(result[0]["correct_answer"], 0)
        self.assertLessEqual(result[0]["correct_answer"], 3)

    def test_multiple_questions_some_with_correct_answers(self):
        """Test parsing multiple questions where some have correct answers and some don't"""
        lines = [
            "Question",
            "What is the capital of France?",
            "A. London",
            "B. Paris",
            "C. Berlin",
            "D. Madrid",
            "Correct Answer: B",
            "Question",
            "What is 2 + 2?",
            "A. 3",
            "B. 4",
            "C. 5",
            "D. 6",
            "Question",
            "What color is the sky?",
            "A. Red",
            "B. Blue",
            "C. Green",
            "D. Yellow",
            "Correct Answer: B",
        ]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["correct_answer"], 1)
        self.assertIn("correct_answer", result[1])
        self.assertGreaterEqual(result[1]["correct_answer"], 0)
        self.assertLessEqual(result[1]["correct_answer"], 3)
        self.assertEqual(result[2]["correct_answer"], 1)

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
            self.parser.parse(lines)

        self.assertIn("does not have 4 answer choices", str(context.exception))

    def test_no_questions(self):
        """Test parsing lines with no questions"""
        lines = ["Some random text", "No questions here"]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 0)


# =============================================================================
# Tests for TrueFalseParser
# =============================================================================


class TestTrueFalseParser(unittest.TestCase):
    """Test cases for the TrueFalseParser class"""

    def setUp(self):
        """Set up test fixtures"""
        self.parser = TrueFalseParser()

    def test_parser_properties(self):
        """Test parser properties are correct"""
        self.assertEqual(self.parser.question_type, "true_false")
        self.assertEqual(self.parser.type_key, "true_false")
        self.assertEqual(self.parser.ANSWERS, ["True", "False"])

    def test_single_assumption(self):
        """Test parsing a single assumption statement"""
        lines = ["Assume that the sky is blue."]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["question"], "Assume that the sky is blue.")
        self.assertEqual(result[0]["type"], "true_false")
        self.assertEqual(result[0]["answers"], ["True", "False"])

    def test_assumption_with_correct_answer_true(self):
        """Test parsing assumption with 'Correct Answer: True'"""
        lines = ["Assume that the sky is blue. Correct Answer: True"]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 0)  # True = 0

    def test_assumption_with_correct_answer_false(self):
        """Test parsing assumption with 'Correct Answer: False'"""
        lines = ["Assume that the sky is green. Correct Answer: False"]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 1)  # False = 1

    def test_assumption_with_correct_answer_t(self):
        """Test parsing assumption with 'Correct Answer: T'"""
        lines = ["Assume this is correct. Correct Answer: T"]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 0)  # T = 0

    def test_assumption_with_correct_answer_f(self):
        """Test parsing assumption with 'Correct Answer: F'"""
        lines = ["Assume this is wrong. Correct Answer: F"]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 1)  # F = 1

    def test_assumption_correct_answer_case_insensitive(self):
        """Test that correct answer is case insensitive"""
        test_cases = [
            ("Assume test. Correct Answer: true", 0),
            ("Assume test. CORRECT ANSWER: TRUE", 0),
            ("Assume test. correct answer true", 0),
            ("Assume test. Correct Answer: false", 1),
            ("Assume test. CORRECT ANSWER: FALSE", 1),
            ("Assume test. correct answer: f", 1),
            ("Assume test. Correct Answer T", 0),
        ]

        for line, expected_index in test_cases:
            result = self.parser.parse([line])
            self.assertEqual(
                result[0]["correct_answer"], expected_index, f"Failed for: {line}"
            )

    def test_assumption_without_correct_answer(self):
        """Test assumption without correct answer gets random assignment"""
        lines = ["Assume that this is a test."]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertIn("correct_answer", result[0])
        self.assertIn(result[0]["correct_answer"], [0, 1])

    def test_multiple_assumptions(self):
        """Test parsing multiple assumption statements"""
        lines = [
            "Assume that the sky is blue. Some other text here.",
            "Random text. Assume all users are authenticated.",
            "More text without assumptions.",
        ]

        result = self.parser.parse(lines)

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

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 3)

    def test_assume_as_part_of_word(self):
        """Test that 'assume' must be a whole word"""
        lines = [
            "The word 'assumed' should not match.",
            "Assume this should match.",
            "The word 'assumes' should not match.",
        ]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertIn("Assume this should match", result[0]["question"])

    def test_multiline_assumption(self):
        """Test assumption that spans multiple lines"""
        lines = ["Assume that the system", "is operating correctly."]

        result = self.parser.parse(lines)

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

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 0)

    def test_empty_lines(self):
        """Test with empty input"""
        lines = []

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 0)

    def test_assumption_with_special_characters(self):
        """Test assumption with special characters"""
        lines = ["Assume that x > 5 and y < 10."]

        result = self.parser.parse(lines)

        self.assertEqual(len(result), 1)
        self.assertIn(">", result[0]["question"])
        self.assertIn("<", result[0]["question"])


# =============================================================================
# Tests for Legacy Wrapper Functions (Backward Compatibility)
# =============================================================================


class TestParseMultipleChoiceQuestions(unittest.TestCase):
    """Test cases for the parse_multiple_choice_questions legacy function"""

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
        # Verify correct_answer is always present (either specified or random)
        self.assertIn("correct_answer", result[0])
        self.assertIsInstance(result[0]["correct_answer"], int)
        self.assertGreaterEqual(result[0]["correct_answer"], 0)
        self.assertLessEqual(result[0]["correct_answer"], 3)

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

    def test_correct_answer_with_colon(self):
        """Test parsing correct answer with 'Correct Answer: B' format"""
        lines = [
            "Question",
            "What is the capital of France?",
            "A. London",
            "B. Paris",
            "C. Berlin",
            "D. Madrid",
            "Correct Answer: B",
        ]

        result = parse_multiple_choice_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 1)  # B = index 1

    def test_correct_answer_without_colon(self):
        """Test parsing correct answer with 'Correct Answer B' format (no colon)"""
        lines = [
            "Question",
            "What is 2 + 2?",
            "A. 3",
            "B. 4",
            "C. 5",
            "D. 6",
            "Correct Answer B",
        ]

        result = parse_multiple_choice_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 1)  # B = index 1

    def test_correct_answer_case_insensitive(self):
        """Test that 'Correct Answer', 'CORRECT ANSWER', 'correct answer' all work"""
        test_cases = [
            "Correct Answer: C",
            "CORRECT ANSWER: C",
            "correct answer: C",
            "Correct Answer C",
            "CORRECT ANSWER C",
            "correct answer C",
        ]

        for correct_line in test_cases:
            lines = [
                "Question",
                "Test?",
                "A. Answer 1",
                "B. Answer 2",
                "C. Answer 3",
                "D. Answer 4",
                correct_line,
            ]

            result = parse_multiple_choice_questions(lines)
            self.assertEqual(
                result[0]["correct_answer"], 2, f"Failed for: {correct_line}"
            )  # C = index 2

    def test_correct_answer_different_labels(self):
        """Test correct answer parsing for all labels A, B, C, D"""
        labels_and_indices = [("A", 0), ("B", 1), ("C", 2), ("D", 3)]

        for label, expected_index in labels_and_indices:
            lines = [
                "Question",
                "Test question?",
                "A. Answer 1",
                "B. Answer 2",
                "C. Answer 3",
                "D. Answer 4",
                f"Correct Answer: {label}",
            ]

            result = parse_multiple_choice_questions(lines)
            self.assertEqual(
                result[0]["correct_answer"], expected_index, f"Failed for label {label}"
            )

    def test_question_without_correct_answer(self):
        """Test that questions without correct answer line get random correct answer"""
        lines = [
            "Question",
            "What is the capital of France?",
            "A. London",
            "B. Paris",
            "C. Berlin",
            "D. Madrid",
        ]

        result = parse_multiple_choice_questions(lines)

        self.assertEqual(len(result), 1)
        # Should have correct_answer field (randomly assigned)
        self.assertIn("correct_answer", result[0])
        self.assertIsInstance(result[0]["correct_answer"], int)
        self.assertGreaterEqual(result[0]["correct_answer"], 0)
        self.assertLessEqual(result[0]["correct_answer"], 3)

    def test_multiple_questions_some_with_correct_answers(self):
        """Test parsing multiple questions where some have correct answers and some don't"""
        lines = [
            "Question",
            "What is the capital of France?",
            "A. London",
            "B. Paris",
            "C. Berlin",
            "D. Madrid",
            "Correct Answer: B",
            "Question",
            "What is 2 + 2?",
            "A. 3",
            "B. 4",
            "C. 5",
            "D. 6",
            "Question",
            "What color is the sky?",
            "A. Red",
            "B. Blue",
            "C. Green",
            "D. Yellow",
            "Correct Answer: B",
        ]

        result = parse_multiple_choice_questions(lines)

        self.assertEqual(len(result), 3)
        # First has explicit correct answer B
        self.assertEqual(result[0]["correct_answer"], 1)
        # Second should have random correct answer (0-3)
        self.assertIn("correct_answer", result[1])
        self.assertIsInstance(result[1]["correct_answer"], int)
        self.assertGreaterEqual(result[1]["correct_answer"], 0)
        self.assertLessEqual(result[1]["correct_answer"], 3)
        # Third has explicit correct answer B
        self.assertEqual(result[2]["correct_answer"], 1)

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
    """Test cases for the parse_assumption_questions legacy function"""

    def test_single_assumption(self):
        """Test parsing a single assumption statement"""
        lines = ["Assume that the sky is blue."]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["question"], "Assume that the sky is blue.")
        self.assertEqual(result[0]["type"], "true_false")
        self.assertEqual(result[0]["answers"], ["True", "False"])
        # Should have correct_answer (either specified or random)
        self.assertIn("correct_answer", result[0])
        self.assertIsInstance(result[0]["correct_answer"], int)
        self.assertIn(result[0]["correct_answer"], [0, 1])

    def test_assumption_with_correct_answer_true(self):
        """Test parsing assumption with 'Correct Answer: True'"""
        lines = ["Assume that the sky is blue. Correct Answer: True"]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 0)  # True = 0

    def test_assumption_with_correct_answer_false(self):
        """Test parsing assumption with 'Correct Answer: False'"""
        lines = ["Assume that the sky is green. Correct Answer: False"]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 1)  # False = 1

    def test_assumption_with_correct_answer_t(self):
        """Test parsing assumption with 'Correct Answer: T'"""
        lines = ["Assume this is correct. Correct Answer: T"]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 0)  # T = 0

    def test_assumption_with_correct_answer_f(self):
        """Test parsing assumption with 'Correct Answer: F'"""
        lines = ["Assume this is wrong. Correct Answer: F"]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["correct_answer"], 1)  # F = 1

    def test_assumption_correct_answer_case_insensitive(self):
        """Test that correct answer is case insensitive"""
        test_cases = [
            ("Assume test. Correct Answer: true", 0),
            ("Assume test. CORRECT ANSWER: TRUE", 0),
            ("Assume test. correct answer true", 0),
            ("Assume test. Correct Answer: false", 1),
            ("Assume test. CORRECT ANSWER: FALSE", 1),
            ("Assume test. correct answer: f", 1),
            ("Assume test. Correct Answer T", 0),
        ]

        for line, expected_index in test_cases:
            result = parse_assumption_questions([line])
            self.assertEqual(
                result[0]["correct_answer"], expected_index, f"Failed for: {line}"
            )

    def test_assumption_without_correct_answer(self):
        """Test assumption without correct answer gets random assignment"""
        lines = ["Assume that this is a test."]

        result = parse_assumption_questions(lines)

        self.assertEqual(len(result), 1)
        # Should have random correct_answer (0 or 1)
        self.assertIn("correct_answer", result[0])
        self.assertIn(result[0]["correct_answer"], [0, 1])

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


# =============================================================================
# Tests for parse_docx_questions
# =============================================================================


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


# =============================================================================
# Tests for CLI (main function)
# =============================================================================


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


# =============================================================================
# Integration Tests
# =============================================================================


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

        # Verify all questions have correct_answer field
        for q in result:
            self.assertIn("correct_answer", q)
            self.assertIsInstance(q["correct_answer"], int)
            if q["type"] == "multiple_choice":
                self.assertGreaterEqual(q["correct_answer"], 0)
                self.assertLessEqual(q["correct_answer"], 3)
            else:  # true_false
                self.assertIn(q["correct_answer"], [0, 1])

    @patch("parse_questions.docx2python")
    def test_document_with_correct_answers(self, mock_docx2python):
        """Test parsing a document with correct answers specified"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid
Correct Answer: B

Question
What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
CORRECT ANSWER C

Question
What color is grass?
A. Red
B. Green
C. Blue
D. Yellow"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        result = parse_docx_questions("test.docx", "multiple_choice")

        # Should find 3 multiple choice questions
        self.assertEqual(len(result), 3)

        # First question has correct answer B (index 1)
        self.assertEqual(result[0]["question"], "What is the capital of France?")
        self.assertEqual(result[0]["correct_answer"], 1)

        # Second question has correct answer C (index 2)
        self.assertEqual(result[1]["question"], "What is 2 + 2?")
        self.assertEqual(result[1]["correct_answer"], 2)

        # Third question has random correct answer (0-3)
        self.assertEqual(result[2]["question"], "What color is grass?")
        self.assertIn("correct_answer", result[2])
        self.assertIsInstance(result[2]["correct_answer"], int)
        self.assertGreaterEqual(result[2]["correct_answer"], 0)
        self.assertLessEqual(result[2]["correct_answer"], 3)

    @patch("parse_questions.docx2python")
    def test_document_with_assumptions_and_correct_answers(self, mock_docx2python):
        """Test parsing assumptions with correct answers"""
        mock_doc = MagicMock()
        mock_doc.text = """Assume the user is authenticated. Correct Answer: True

Assume the database is empty. Correct Answer: False

Assume all inputs are valid."""
        mock_docx2python.return_value.__enter__.return_value = mock_doc

        result = parse_docx_questions("test.docx", "true_false")

        # Should find 3 true/false questions
        self.assertEqual(len(result), 3)

        # First has correct answer True (index 0)
        self.assertIn("Assume the user is authenticated", result[0]["question"])
        self.assertEqual(result[0]["correct_answer"], 0)

        # Second has correct answer False (index 1)
        self.assertIn("Assume the database is empty", result[1]["question"])
        self.assertEqual(result[1]["correct_answer"], 1)

        # Third has random correct answer (0 or 1)
        self.assertIn("Assume all inputs are valid", result[2]["question"])
        self.assertIn("correct_answer", result[2])
        self.assertIn(result[2]["correct_answer"], [0, 1])


# =============================================================================
# Test Runner
# =============================================================================


def run_tests():
    """Run all tests"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestUtilityFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestQuestionParserRegistry))
    suite.addTests(loader.loadTestsFromTestCase(TestMultipleChoiceParser))
    suite.addTests(loader.loadTestsFromTestCase(TestTrueFalseParser))
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

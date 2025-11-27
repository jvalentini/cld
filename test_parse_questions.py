#!/usr/bin/env python3
"""
Unit tests for parse_questions.py
"""

import unittest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from parse_questions import parse_docx_questions, main
import sys


class TestParseDocxQuestions(unittest.TestCase):
    """Test cases for the parse_docx_questions function"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.valid_docx_content = """Question
What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid

Question
What is 2 + 2?
A. 3
B. 4
C. 5
D. 6"""
    
    @patch('parse_questions.docx2python')
    def test_valid_single_question(self, mock_docx2python):
        """Test parsing a single valid question"""
        # Mock the docx2python context manager
        mock_doc = MagicMock()
        mock_doc.text = """Question
What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['question'], 'What is the capital of France?')
        self.assertEqual(len(result[0]['answers']), 4)
        self.assertEqual(result[0]['answers'][0], 'London')
        self.assertEqual(result[0]['answers'][1], 'Paris')
        self.assertEqual(result[0]['answers'][2], 'Berlin')
        self.assertEqual(result[0]['answers'][3], 'Madrid')
    
    @patch('parse_questions.docx2python')
    def test_valid_multiple_questions(self, mock_docx2python):
        """Test parsing multiple valid questions"""
        mock_doc = MagicMock()
        mock_doc.text = self.valid_docx_content
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['question'], 'What is the capital of France?')
        self.assertEqual(result[1]['question'], 'What is 2 + 2?')
    
    @patch('parse_questions.docx2python')
    def test_parentheses_format(self, mock_docx2python):
        """Test parsing with A) format instead of A."""
        mock_doc = MagicMock()
        mock_doc.text = """Question
What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['answers'][0], 'London')
    
    @patch('parse_questions.docx2python')
    def test_mixed_format(self, mock_docx2python):
        """Test parsing with mixed A. and A) formats"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer 1
B) Answer 2
C. Answer 3
D) Answer 4"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['answers'][0], 'Answer 1')
        self.assertEqual(result[0]['answers'][1], 'Answer 2')
    
    @patch('parse_questions.docx2python')
    def test_case_insensitive_question_marker(self, mock_docx2python):
        """Test that 'question', 'Question', 'QUESTION' all work"""
        mock_doc = MagicMock()
        mock_doc.text = """QUESTION
Test question?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['question'], 'Test question?')
    
    @patch('parse_questions.docx2python')
    def test_extra_whitespace(self, mock_docx2python):
        """Test parsing with extra whitespace"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
  What is the capital of France?  
A.   London
B.  Paris  
C. Berlin
D.    Madrid   """
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(result[0]['question'], 'What is the capital of France?')
        self.assertEqual(result[0]['answers'][0], 'London')
    
    @patch('parse_questions.docx2python')
    def test_unicode_characters(self, mock_docx2python):
        """Test parsing with unicode characters"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
What is π approximately equal to?
A. 3.14159
B. 2.71828
C. 1.61803
D. 9.81"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertIn('π', result[0]['question'])
    
    @patch('parse_questions.docx2python')
    def test_missing_question_text(self, mock_docx2python):
        """Test that missing question text raises ValueError"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
A. London
B. Paris
C. Berlin
D. Madrid"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        with self.assertRaises(ValueError) as context:
            parse_docx_questions('test.docx')
        
        self.assertIn('improperly formatted answer', str(context.exception).lower())
    
    @patch('parse_questions.docx2python')
    def test_missing_answer(self, mock_docx2python):
        """Test that missing answer raises ValueError"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
What is the capital of France?
A. London
B. Paris
C. Berlin"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        with self.assertRaises(ValueError) as context:
            parse_docx_questions('test.docx')
        
        self.assertIn('does not have 4 answer choices', str(context.exception))
        self.assertIn('Missing answer D', str(context.exception))
    
    @patch('parse_questions.docx2python')
    def test_wrong_answer_label(self, mock_docx2python):
        """Test that wrong answer label raises ValueError"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
What is the capital of France?
A. London
B. Paris
E. Berlin
D. Madrid"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        with self.assertRaises(ValueError) as context:
            parse_docx_questions('test.docx')
        
        self.assertIn('improperly formatted answer', str(context.exception).lower())
    
    @patch('parse_questions.docx2python')
    def test_no_questions(self, mock_docx2python):
        """Test parsing document with no questions"""
        mock_doc = MagicMock()
        mock_doc.text = """Some random text
No questions here
Just some content"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 0)
    
    @patch('parse_questions.docx2python')
    def test_question_at_end_of_document(self, mock_docx2python):
        """Test that question marker at end without text raises ValueError"""
        mock_doc = MagicMock()
        mock_doc.text = """Question"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        with self.assertRaises(ValueError) as context:
            parse_docx_questions('test.docx')
        
        self.assertIn('no question text follows', str(context.exception).lower())
    
    @patch('parse_questions.docx2python')
    def test_empty_document(self, mock_docx2python):
        """Test parsing empty document"""
        mock_doc = MagicMock()
        mock_doc.text = ""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 0)
    
    @patch('parse_questions.docx2python')
    def test_blank_lines_between_questions(self, mock_docx2python):
        """Test that blank lines between questions are handled"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid


Question
What is 2 + 2?
A. 3
B. 4
C. 5
D. 6"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 2)
    
    @patch('parse_questions.docx2python')
    def test_long_question_text(self, mock_docx2python):
        """Test parsing very long question text"""
        long_question = "This is a very long question." * 20
        mock_doc = MagicMock()
        mock_doc.text = f"""Question
{long_question}
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['question'], long_question)
    
    @patch('parse_questions.docx2python')
    def test_answers_with_special_characters(self, mock_docx2python):
        """Test parsing answers with special characters"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer with "quotes"
B. Answer with 'apostrophes'
C. Answer with & ampersand
D. Answer with <brackets>"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertIn('"quotes"', result[0]['answers'][0])
        self.assertIn("'apostrophes'", result[0]['answers'][1])
        self.assertIn('& ampersand', result[0]['answers'][2])
        self.assertIn('<brackets>', result[0]['answers'][3])


class TestMainFunction(unittest.TestCase):
    """Test cases for the main function"""
    
    def test_insufficient_arguments(self):
        """Test main function with insufficient arguments"""
        with patch('sys.argv', ['parse_questions.py']):
            with self.assertRaises(SystemExit) as context:
                main()
            self.assertEqual(context.exception.code, 1)
    
    def test_too_many_arguments(self):
        """Test main function with too many arguments"""
        with patch('sys.argv', ['parse_questions.py', 'input.docx', 'output.json', 'extra']):
            with self.assertRaises(SystemExit) as context:
                main()
            self.assertEqual(context.exception.code, 1)
    
    @patch('parse_questions.docx2python')
    @patch('builtins.open', create=True)
    def test_successful_parse(self, mock_open, mock_docx2python):
        """Test successful parsing and output"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        mock_file = MagicMock()
        mock_open.return_value.__enter__.return_value = mock_file
        
        with patch('sys.argv', ['parse_questions.py', 'input.docx', 'output.json']):
            with patch('builtins.print') as mock_print:
                main()
                # Check that success message was printed
                self.assertTrue(any('Successfully parsed' in str(call) for call in mock_print.call_args_list))
    
    @patch('parse_questions.parse_docx_questions')
    def test_file_not_found(self, mock_parse):
        """Test main function with non-existent file"""
        mock_parse.side_effect = FileNotFoundError("File not found")
        
        with patch('sys.argv', ['parse_questions.py', 'nonexistent.docx', 'output.json']):
            with self.assertRaises(SystemExit) as context:
                main()
            self.assertEqual(context.exception.code, 1)
    
    @patch('parse_questions.parse_docx_questions')
    def test_value_error(self, mock_parse):
        """Test main function with parsing error"""
        mock_parse.side_effect = ValueError("Parsing error")
        
        with patch('sys.argv', ['parse_questions.py', 'input.docx', 'output.json']):
            with self.assertRaises(SystemExit) as context:
                main()
            self.assertEqual(context.exception.code, 1)
    
    @patch('parse_questions.parse_docx_questions')
    def test_unexpected_error(self, mock_parse):
        """Test main function with unexpected error"""
        mock_parse.side_effect = Exception("Unexpected error")
        
        with patch('sys.argv', ['parse_questions.py', 'input.docx', 'output.json']):
            with self.assertRaises(SystemExit) as context:
                main()
            self.assertEqual(context.exception.code, 1)
    
    @patch('parse_questions.docx2python')
    def test_output_json_format(self, mock_docx2python):
        """Test that output JSON has correct format"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer 1
B. Answer 2
C. Answer 3
D. Answer 4"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tmp:
            output_path = tmp.name
        
        try:
            with patch('sys.argv', ['parse_questions.py', 'input.docx', output_path]):
                main()
            
            # Read and validate JSON
            with open(output_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.assertIsInstance(data, list)
            self.assertEqual(len(data), 1)
            self.assertIn('question', data[0])
            self.assertIn('answers', data[0])
            self.assertEqual(len(data[0]['answers']), 4)
        finally:
            os.unlink(output_path)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions"""
    
    @patch('parse_questions.docx2python')
    def test_answer_with_period_in_text(self, mock_docx2python):
        """Test answer that contains a period in the text"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
A. Answer with a period. Still part of answer
B. Another answer
C. Third answer
D. Fourth answer"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertIn('period. Still part', result[0]['answers'][0])
    
    @patch('parse_questions.docx2python')
    def test_lowercase_answer_labels(self, mock_docx2python):
        """Test that lowercase answer labels work due to IGNORECASE flag"""
        mock_doc = MagicMock()
        mock_doc.text = """Question
Test question?
a. Answer 1
b. Answer 2
c. Answer 3
d. Answer 4"""
        mock_docx2python.return_value.__enter__.return_value = mock_doc
        
        result = parse_docx_questions('test.docx')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['answers'][0], 'Answer 1')


def run_tests():
    """Run all tests"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestParseDocxQuestions))
    suite.addTests(loader.loadTestsFromTestCase(TestMainFunction))
    suite.addTests(loader.loadTestsFromTestCase(TestEdgeCases))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Return exit code
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    exit_code = run_tests()
    sys.exit(exit_code)
#!/usr/bin/env python3
"""
DOCX Question Parser
Parses a DOCX file to extract questions and their answer choices.
"""

import sys
import json
import re
from docx2python import docx2python

def parse_docx_questions(docx_path):
    """
    Parse a DOCX file and extract questions with their answer choices.
    
    Args:
        docx_path: Path to the DOCX file
        
    Returns:
        List of dictionaries with 'question' and 'answers' keys
    """
    # Extract text from docx
    with docx2python(docx_path) as docx_content:
        # Get all paragraphs as a flat list
        text = docx_content.text
    
    # Split into lines and clean up
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    questions = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Check if this line starts with "Question"
        if line.lower().startswith('question'):
            # Next line should be the actual question
            if i + 1 >= len(lines):
                raise ValueError(f"Found 'Question' marker at line {i+1} but no question text follows")
            
            question_text = lines[i + 1]
            i += 2  # Move past "Question" marker and question text
            
            # Now collect the 4 answer choices
            answers = []
            expected_labels = ['A', 'B', 'C', 'D']
            
            for expected_label in expected_labels:
                if i >= len(lines):
                    raise ValueError(
                        f"Question '{question_text[:50]}...' does not have 4 answer choices. "
                        f"Missing answer {expected_label}"
                    )
                
                answer_line = lines[i]
                
                # Check if answer is properly labeled (e.g., "A. Some answer" or "A) Some answer")
                pattern = rf'^{expected_label}[\.\)]\s*(.+)$'
                match = re.match(pattern, answer_line, re.IGNORECASE)
                
                if not match:
                    raise ValueError(
                        f"Question '{question_text[:50]}...' has improperly formatted answer. "
                        f"Expected answer labeled '{expected_label}', but found: '{answer_line}'"
                    )
                
                answer_text = match.group(1).strip()
                answers.append(answer_text)
                i += 1
            
            questions.append({
                'question': question_text,
                'answers': answers
            })
        else:
            i += 1
    
    return questions

def main():
    if len(sys.argv) != 3:
        print("Usage: python parse_questions.py <input.docx> <output.json>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        questions = parse_docx_questions(input_path)
        
        # Write to JSON file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully parsed {len(questions)} question(s)")
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
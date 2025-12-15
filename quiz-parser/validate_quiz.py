#!/usr/bin/env python3
"""
JSON Quiz File Validator and Fixer
Validates and fixes quiz JSON files for the Vue quiz app
"""

import sys
import json

def validate_and_fix_quiz(input_path, output_path=None):
    """
    Validate and optionally fix a quiz JSON file.
    
    Args:
        input_path: Path to the JSON file to validate
        output_path: Optional path to write fixed JSON
    """
    print(f"Validating: {input_path}")
    print("-" * 60)
    
    # Try to read the file with different encodings
    content = None
    
    for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
        try:
            with open(input_path, 'r', encoding=encoding) as f:
                content = f.read()
            print(f"✓ Successfully read file with encoding: {encoding}")
            break
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"✗ Error reading file with {encoding}: {e}")
    
    if content is None:
        print("\n✗ FAILED: Could not read file with any standard encoding")
        return False
    
    # Check for BOM or hidden characters
    if content.startswith('\ufeff'):
        print("⚠ Warning: File contains BOM (Byte Order Mark)")
        content = content.lstrip('\ufeff')
    
    # Check for non-printable characters
    non_printable = [c for c in content if ord(c) < 32 and c not in '\n\r\t']
    if non_printable:
        print(f"⚠ Warning: Found {len(non_printable)} non-printable characters")
    
    # Try to parse JSON
    try:
        data = json.loads(content)
        print("✓ Valid JSON structure")
    except json.JSONDecodeError as e:
        print(f"\n✗ JSON PARSE ERROR at line {e.lineno}, column {e.colno}:")
        print(f"   {e.msg}")
        
        # Show context around error
        lines = content.split('\n')
        if e.lineno <= len(lines):
            start = max(0, e.lineno - 3)
            end = min(len(lines), e.lineno + 2)
            print("\n   Context:")
            for i in range(start, end):
                marker = " >>>" if i == e.lineno - 1 else "    "
                print(f"{marker} {i+1:4d}: {lines[i]}")
        
        return False
    
    # Validate structure
    print("\nValidating quiz structure...")
    
    if not isinstance(data, list):
        print("✗ FAILED: Root element must be an array")
        return False
    
    if len(data) == 0:
        print("✗ FAILED: Quiz must contain at least one question")
        return False
    
    print(f"✓ Found {len(data)} questions")
    
    # Validate each question
    issues = []
    for i, item in enumerate(data):
        q_num = i + 1
        
        if not isinstance(item, dict):
            issues.append(f"Question {q_num}: Not an object")
            continue
        
        if 'question' not in item:
            issues.append(f"Question {q_num}: Missing 'question' field")
        elif not isinstance(item['question'], str) or not item['question'].strip():
            issues.append(f"Question {q_num}: 'question' must be a non-empty string")
        
        if 'answers' not in item:
            issues.append(f"Question {q_num}: Missing 'answers' field")
        elif not isinstance(item['answers'], list):
            issues.append(f"Question {q_num}: 'answers' must be an array")
        elif len(item['answers']) != 4:
            issues.append(f"Question {q_num}: Must have exactly 4 answers (found {len(item['answers'])})")
        else:
            # Check each answer
            for j, answer in enumerate(item['answers']):
                if not isinstance(answer, str) or not answer.strip():
                    issues.append(f"Question {q_num}, Answer {j+1}: Must be a non-empty string")
    
    if issues:
        print(f"\n✗ Found {len(issues)} validation issues:\n")
        for issue in issues:
            print(f"   • {issue}")
        return False
    
    print("✓ All questions are valid")
    
    # If output path specified, write cleaned version
    if output_path:
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"\n✓ Wrote cleaned JSON to: {output_path}")
        except Exception as e:
            print(f"\n✗ Error writing output file: {e}")
            return False
    
    print("\n" + "=" * 60)
    print("✓ VALIDATION PASSED - File is ready to use!")
    print("=" * 60)
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_quiz.py <input.json> [output.json]")
        print("\nValidates a quiz JSON file and optionally writes a cleaned version.")
        print("\nExample:")
        print("  python validate_quiz.py output.json")
        print("  python validate_quiz.py output.json cleaned_output.json")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = validate_and_fix_quiz(input_path, output_path)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
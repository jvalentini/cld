# Quiz Parser

A command-line tool for parsing DOCX files to extract quiz questions in multiple formats.

## 📋 Features

- **Multiple Choice Questions**: Extract questions with 4 labeled answers (A, B, C, D)
- **True/False Questions**: Extract assumption-based statements for true/false evaluation
- **Flexible Parsing**: Choose which question types to extract
- **Docker Support**: No local Python environment needed
- **CLI Interface**: Professional command-line interface using Click

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Build the image
make build

# Parse only multiple-choice questions (default)
make parse INPUT_DOCX=input.docx OUTPUT_JSON=output.json

# Parse all question types
make parse-extended INPUT_DOCX=input.docx OUTPUT_JSON=output.json

# Parse only true/false questions
make parse-tf INPUT_DOCX=input.docx OUTPUT_JSON=output.json
```

### Using Local Python

```bash
# Install dependencies
make install

# Parse questions
python parse_questions.py input.docx output.json

# View help
python parse_questions.py --help
```

## 📖 Usage

### Command Line

```bash
# Default: Multiple choice only
python parse_questions.py input.docx output.json

# Extended: All question types
python parse_questions.py input.docx output.json --extended

# Specific type
python parse_questions.py input.docx output.json --type true_false
python parse_questions.py input.docx output.json --type multiple_choice
python parse_questions.py input.docx output.json --type all

# View help
python parse_questions.py --help
```

### Makefile Commands

```bash
make help              # Show all available commands
make build             # Build Docker image
make parse             # Parse DOCX (multiple choice only)
make parse-extended    # Parse DOCX (all types)
make parse-tf          # Parse DOCX (true/false only)
make test              # Run unit tests
make test-coverage     # Run tests with coverage
make validate          # Validate output JSON
make clean             # Clean generated files
```

## 📝 Input Format

### Multiple Choice Questions

```
Question
What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid
```

**Requirements:**
- Line starting with "Question" (case-insensitive)
- Question text on the next line
- Exactly 4 answers labeled A, B, C, D
- Answers can use either `A.` or `A)` format

### True/False Questions

Any sentence containing the word "Assume" (case-insensitive):

```
Assume that the user is authenticated.
Assume all calculations are correct.
```

**Requirements:**
- Must contain the word "Assume" as a complete word
- Will be extracted as true/false questions

## 📊 Output Format

```json
[
  {
    "question": "What is the capital of France?",
    "answers": ["London", "Paris", "Berlin", "Madrid"],
    "type": "multiple_choice"
  },
  {
    "question": "Assume that the user is authenticated.",
    "answers": ["True", "False"],
    "type": "true_false"
  }
]
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run with verbose output
make test-verbose

# Run with coverage
make test-coverage

# Run specific test
make test-specific TEST=TestParseMultipleChoiceQuestions.test_valid_single_question
```

## 🐳 Docker

### Build

```bash
make build
```

### Run

```bash
# With Docker directly
docker run --user $(id -u):$(id -g) \
  -v $(pwd):/work \
  -w /work \
  docx-parser input.docx output.json

# With Makefile
make parse INPUT_DOCX=input.docx
```

## 📦 Dependencies

- **Python 3.11+** (3.14-dev not supported due to lxml compatibility)
- **docx2python**: DOCX file parsing
- **click**: Command-line interface
- **coverage**: (optional) Test coverage reporting

Install locally:
```bash
pip install docx2python click coverage
```

## 🔧 Configuration

### Environment Variables

- `INPUT_DOCX`: Default input file (default: `input.docx`)
- `OUTPUT_JSON`: Default output file (default: `output.json`)

### Makefile Variables

```makefile
# Set custom defaults
INPUT_DOCX=myquiz.docx OUTPUT_JSON=myoutput.json make parse
```

## 📁 File Structure

```
quiz-parser/
├── Makefile                    # Build and test commands
├── Dockerfile                  # Docker image definition
├── parse_questions.py          # Main parser script
├── test_parse_questions.py     # Unit tests
├── validate_quiz.py            # JSON validator
├── .dockerignore              # Docker ignore patterns
├── README.md                   # This file
├── input.docx                 # Your input file
└── output.json                # Generated output
```

## 🐛 Troubleshooting

### Python 3.14 Compatibility Issue

If you see `ImportError: undefined symbol: PyBytes_Join`:

**Solution**: Use Python 3.11 or 3.12, or use Docker:
```bash
make build
make parse
```

### File Not Found

```
⚠ Error: input.docx not found
```

**Solution**: Ensure the file exists in the current directory:
```bash
ls -la input.docx
```

### Invalid JSON Output

```
✗ Invalid JSON
```

**Solution**: Check your DOCX format:
```bash
make validate OUTPUT_JSON=output.json
```

## 📚 Examples

### Example 1: Parse Mixed Content

Input DOCX:
```
Introduction paragraph here.

Question
What is 2 + 2?
A. 3
B. 4
C. 5
D. 6

Assume all inputs are validated.

Some other text here.
```

Command:
```bash
make parse-extended INPUT_DOCX=mixed.docx OUTPUT_JSON=mixed.json
```

Output: 1 multiple-choice + 1 true/false question

### Example 2: Parse Only Assumptions

Command:
```bash
make parse-tf INPUT_DOCX=assumptions.docx OUTPUT_JSON=tf-only.json
```

### Example 3: Batch Processing

```bash
for file in *.docx; do
  make parse INPUT_DOCX="$file" OUTPUT_JSON="${file%.docx}.json"
done
```

## 🤝 Contributing

Run tests before committing:
```bash
make test
make lint
```

## 📄 License

See parent project LICENSE file.

## 🔗 Related

- Parent project: `../README.md`
- Quiz app: `../quiz-app/README.md`
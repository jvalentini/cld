# Quiz Generator & Web App

A complete solution for converting DOCX question files into interactive web-based quizzes. This project consists of two main components:

1. **DOCX Parser** - A Python script that extracts questions and answers from formatted Word documents
2. **Vue Quiz App** - A modern web application for taking quizzes with progress tracking

## 🎯 Features

### DOCX Parser
- Parses structured DOCX files containing questions and multiple-choice answers
- Validates question format (requires exactly 4 answers per question)
- Outputs clean JSON format ready for the quiz app
- Runs in Docker (no local Python installation required)

### Quiz Web App
- Upload quiz JSON files directly in the browser
- Progress tracking with localStorage (resume if you leave the page)
- Clean, modern UI with smooth animations
- Results page showing score and answer review
- Fully containerized with Nginx for production deployment

## 📋 Prerequisites

- Docker installed on your system
- Make utility (comes pre-installed on Linux/Mac, available via WSL on Windows)
- A DOCX file with properly formatted questions (see format below)
- (Optional) GitHub account for CI/CD and automatic deployment
  
🔄 CI/CD Pipeline
This project includes a complete GitHub Actions pipeline that automatically:

 - ✅ Builds Docker images on every push
 - ✅ Parses DOCX files to JSON
 - ✅ Validates output
 - ✅ Deploys to GitHub Pages
 - ✅ Runs tests and checks on PRs
  
## 📝 DOCX Format Requirements

Your Word document must follow this exact format:

```
Question
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
D. 6
```

**Rules:**
- Each question must start with the word "Question" on its own line
- The actual question text goes on the next line
- Must have exactly 4 answers labeled A, B, C, D
- Answers can use either `A.` or `A)` format
- Blank lines between questions are optional

## 🚀 Quick Start

### 1. Complete Workflow (First Time)

Run everything with one command (uses input.docx as default):

```bash
make full-workflow
```

To set a specific docx file:

```bash
make full-workflow INPUT_DOCX=questions.docx
```

This will:
1. Build the parser Docker image
2. Parse your DOCX file into JSON
3. Validate the output
4. Build the quiz app Docker image
5. Start the quiz app at http://localhost:8080

Then open your browser to http://localhost:8080 and upload the generated `output.json` file.

### 2. Incremental Workflow

If you already have images built:

```bash
# Parse a new DOCX file
make parse INPUT_DOCX=questions.docx OUTPUT_JSON=quiz.json

# Validate the output
make validate OUTPUT_JSON=quiz.json

# Start the quiz app (if not already running)
make run-quiz
```

If you don't specify `OUTPUT_JSON` it will set the file to `output.json` by default.


## 🛠️ Available Make Commands

### Getting Help

```bash
make help          # Show all available commands with descriptions
```

### Parser Commands

```bash
make build-parser  # Build the DOCX parser Docker image
make parse         # Parse DOCX file (uses input.docx by default)
make parse INPUT_DOCX=file.docx OUTPUT_JSON=output.json  # Parse specific file
make validate      # Validate the generated JSON file
```

### Quiz App Commands

```bash
make build-quiz    # Build the Vue quiz app Docker image
make run-quiz      # Start the quiz app at http://localhost:8080
make stop-quiz     # Stop the running quiz app
make restart-quiz  # Restart the quiz app
make logs-quiz     # View quiz app logs
```

### Docker Compose Commands

```bash
make up            # Start all services with docker-compose
make down          # Stop all services
make rebuild       # Rebuild and restart all services
```

### Workflow Commands

```bash
make all           # Build all Docker images
make workflow      # Parse and validate (quick workflow)
make full-workflow # Complete workflow: build, parse, validate, and run
```

### Utility Commands

```bash
make sample        # Create a sample quiz JSON file for testing
make status        # Show status of Docker containers and images
make clean         # Remove Docker containers and images
make clean-all     # Clean everything including output files
```

## 📖 Common Usage Examples

### Example 1: Creating Your First Quiz

```bash
# 1. Prepare your questions.docx file following the format above

# 2. Run the complete workflow
make full-workflow INPUT_DOCX=questions.docx

# 3. Open http://localhost:8080 in your browser

# 4. Upload the generated output.json file

# 5. Take the quiz!
```

### Example 2: Testing with Sample Data

```bash
# Create a sample quiz file
make sample

# Validate it
make validate OUTPUT_JSON=sample-quiz.json

# Start the quiz app
make run-quiz

# Upload sample-quiz.json in the browser
```

### Example 3: Multiple Quiz Files

```bash
# Parse different DOCX files
make parse INPUT_DOCX=math-questions.docx OUTPUT_JSON=math-quiz.json
make parse INPUT_DOCX=history-questions.docx OUTPUT_JSON=history-quiz.json
make parse INPUT_DOCX=science-questions.docx OUTPUT_JSON=science-quiz.json

# Validate each
make validate OUTPUT_JSON=math-quiz.json
make validate OUTPUT_JSON=history-quiz.json
make validate OUTPUT_JSON=science-quiz.json

# Start the app once, then upload different JSON files as needed
make run-quiz
```

### Example 4: Rebuilding After Code Changes

```bash
# If you modify the Vue app code
cd quiz-app
# ... make your changes ...
cd ..
make rebuild

# If you modify the parser script
make build-parser
make parse INPUT_DOCX=questions.docx
```

### Example 5: Troubleshooting

```bash
# Check if containers are running
make status

# View quiz app logs
make logs-quiz

# Validate your JSON output
make validate OUTPUT_JSON=output.json

# Clean up and start fresh
make clean-all
make full-workflow INPUT_DOCX=questions.docx
```

## 🐛 Troubleshooting

### Parser Issues

**Problem:** `Permission denied` when creating output.json
```bash
# Solution: Ensure your current directory is writable
ls -la
chmod u+w .
make parse INPUT_DOCX=input.docx
```

**Problem:** `Parsing Error: Question X does not have 4 answer choices`
```bash
# Solution: Check your DOCX file format
# Each question must have exactly 4 answers labeled A, B, C, D
```

**Problem:** `FileNotFoundError: input.docx`
```bash
# Solution: Make sure the file exists
ls -la input.docx
make parse INPUT_DOCX=path/to/your/file.docx
```

### Quiz App Issues

**Problem:** Quiz app not loading
```bash
# Check if container is running
make status

# View logs for errors
make logs-quiz

# Try restarting
make restart-quiz
```

**Problem:** Nothing happens when uploading JSON
```bash
# Open browser console (F12) to see errors
# Validate your JSON file
make validate OUTPUT_JSON=output.json

# Common issue: JSON format doesn't match expected structure
```

**Problem:** Port 8080 already in use
```bash
# Stop the existing container
make stop-quiz

# Or edit docker-compose.yml to use a different port
# Change "8080:80" to "8081:80" for example
```

### Docker Issues

**Problem:** `docker: command not found`
```bash
# Install Docker: https://docs.docker.com/get-docker/
```

**Problem:** Permission denied when running docker commands
```bash
# Add your user to docker group (Linux)
sudo usermod -aG docker $USER
# Then log out and back in
```

## 🎨 Customization

### Changing Quiz App Port

Edit `quiz-app/docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # Change 8080 to your desired port
```

Or when using `docker run`:
```bash
docker run -d -p 3000:80 --name quiz-app quiz-app
```

### Modifying Quiz App Styles

Edit `quiz-app/src/style.css` and rebuild:
```bash
make rebuild
```

### Adding More Question Validation

Edit `parse_questions.py` to add custom validation rules, then:
```bash
make build-parser
make parse INPUT_DOCX=input.docx
```

## 📄 License

This project is open source and available for educational and personal use.

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 💡 Tips

- Keep your DOCX files simple and consistently formatted
- Use the validator after parsing to catch issues early
- The quiz app stores progress in localStorage - clearing browser data will reset it
- You can upload different JSON files without restarting the app
- Use `make sample` to quickly test the app without creating a DOCX file

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run `make status` to check container health
3. Run `make validate` to check JSON format
4. Check browser console (F12) for JavaScript errors
5. Review Docker logs with `make logs-quiz`

---

**Happy Quizzing! 🎉**
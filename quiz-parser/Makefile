# Makefile for Quiz Parser

# Variables
IMAGE_NAME = docx-parser
USER_ID = $(shell id -u)
GROUP_ID = $(shell id -g)
PWD = $(shell pwd)

# Default input/output files
INPUT_DOCX ?= input.docx
OUTPUT_JSON ?= output.json

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(GREEN)Quiz Parser - Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

##
## Build Commands
##

.PHONY: build
build: ## Build the parser Docker image
	@echo "$(GREEN)Building parser image...$(NC)"
	docker build -t $(IMAGE_NAME) .
	@echo "$(GREEN)✓ Build complete$(NC)"

##
## Parse Commands
##

.PHONY: parse
parse: ## Parse DOCX file (multiple choice only, default)
	@echo "$(GREEN)Parsing $(INPUT_DOCX) (multiple choice only)...$(NC)"
	@if [ ! -f "$(INPUT_DOCX)" ]; then \
		echo "$(YELLOW)⚠ Error: $(INPUT_DOCX) not found$(NC)"; \
		exit 1; \
	fi
	docker run --user $(USER_ID):$(GROUP_ID) \
		-v $(PWD):/work \
		-w /work \
		$(IMAGE_NAME) $(INPUT_DOCX) $(OUTPUT_JSON)
	@echo "$(GREEN)✓ Output written to $(OUTPUT_JSON)$(NC)"

.PHONY: parse-extended
parse-extended: ## Parse DOCX file (all question types)
	@echo "$(GREEN)Parsing $(INPUT_DOCX) (extended mode)...$(NC)"
	@if [ ! -f "$(INPUT_DOCX)" ]; then \
		echo "$(YELLOW)⚠ Error: $(INPUT_DOCX) not found$(NC)"; \
		exit 1; \
	fi
	docker run --user $(USER_ID):$(GROUP_ID) \
		-v $(PWD):/work \
		-w /work \
		$(IMAGE_NAME) $(INPUT_DOCX) $(OUTPUT_JSON) --extended
	@echo "$(GREEN)✓ Output written to $(OUTPUT_JSON)$(NC)"

.PHONY: parse-tf
parse-tf: ## Parse DOCX file (true/false only)
	@echo "$(GREEN)Parsing $(INPUT_DOCX) (true/false only)...$(NC)"
	@if [ ! -f "$(INPUT_DOCX)" ]; then \
		echo "$(YELLOW)⚠ Error: $(INPUT_DOCX) not found$(NC)"; \
		exit 1; \
	fi
	docker run --user $(USER_ID):$(GROUP_ID) \
		-v $(PWD):/work \
		-w /work \
		$(IMAGE_NAME) $(INPUT_DOCX) $(OUTPUT_JSON) --type true_false
	@echo "$(GREEN)✓ Output written to $(OUTPUT_JSON)$(NC)"

.PHONY: parse-local
parse-local: ## Parse using local Python (no Docker)
	@echo "$(GREEN)Parsing $(INPUT_DOCX) locally...$(NC)"
	python parse_questions.py $(INPUT_DOCX) $(OUTPUT_JSON)

.PHONY: parse-local-extended
parse-local-extended: ## Parse using local Python with extended mode
	@echo "$(GREEN)Parsing $(INPUT_DOCX) locally (extended)...$(NC)"
	python parse_questions.py $(INPUT_DOCX) $(OUTPUT_JSON) --extended

##
## Test Commands
##

.PHONY: test
test: ## Run unit tests
	@echo "$(GREEN)Running unit tests...$(NC)"
	python test_parse_questions.py

.PHONY: test-verbose
test-verbose: ## Run unit tests with verbose output
	@echo "$(GREEN)Running unit tests (verbose)...$(NC)"
	python -m unittest test_parse_questions -v

.PHONY: test-coverage
test-coverage: ## Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	@command -v coverage >/dev/null 2>&1 || { echo "Installing coverage..."; pip install coverage; }
	coverage run test_parse_questions.py
	coverage report
	@echo "$(GREEN)Run 'coverage html' for detailed report$(NC)"

.PHONY: test-specific
test-specific: ## Run specific test (usage: make test-specific TEST=TestClassName.test_method)
	@echo "$(GREEN)Running specific test: $(TEST)$(NC)"
	python -m unittest test_parse_questions.$(TEST) -v

##
## Validation Commands
##

.PHONY: validate
validate: ## Validate the output JSON file
	@echo "$(GREEN)Validating $(OUTPUT_JSON)...$(NC)"
	@if [ -f "$(OUTPUT_JSON)" ]; then \
		python -m json.tool $(OUTPUT_JSON) > /dev/null && echo "$(GREEN)✓ Valid JSON$(NC)" || echo "$(YELLOW)✗ Invalid JSON$(NC)"; \
	else \
		echo "$(YELLOW)⚠ File $(OUTPUT_JSON) not found$(NC)"; \
	fi

.PHONY: view
view: ## View the output JSON file
	@if [ -f "$(OUTPUT_JSON)" ]; then \
		cat $(OUTPUT_JSON) | python -m json.tool; \
	else \
		echo "$(YELLOW)⚠ File $(OUTPUT_JSON) not found$(NC)"; \
	fi

##
## Sample Commands
##

.PHONY: sample
sample: ## Create a sample DOCX file for testing
	@echo "$(GREEN)Creating sample quiz files...$(NC)"
	@echo '[' > sample-quiz.json
	@echo '  {' >> sample-quiz.json
	@echo '    "question": "What is the capital of France?",' >> sample-quiz.json
	@echo '    "answers": ["London", "Paris", "Berlin", "Madrid"],' >> sample-quiz.json
	@echo '    "type": "multiple_choice"' >> sample-quiz.json
	@echo '  },' >> sample-quiz.json
	@echo '  {' >> sample-quiz.json
	@echo '    "question": "Assume that the user is authenticated.",' >> sample-quiz.json
	@echo '    "answers": ["True", "False"],' >> sample-quiz.json
	@echo '    "type": "true_false"' >> sample-quiz.json
	@echo '  }' >> sample-quiz.json
	@echo ']' >> sample-quiz.json
	@echo "$(GREEN)✓ Created sample-quiz.json$(NC)"

##
## Utility Commands
##

.PHONY: clean
clean: ## Clean generated files
	@echo "$(GREEN)Cleaning generated files...$(NC)"
	rm -f $(OUTPUT_JSON)
	rm -f .coverage
	rm -rf htmlcov/
	rm -rf __pycache__/
	rm -rf *.pyc
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

.PHONY: clean-all
clean-all: clean ## Clean everything including Docker images
	@echo "$(GREEN)Removing Docker image...$(NC)"
	docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo "$(GREEN)✓ All clean$(NC)"

.PHONY: install
install: ## Install Python dependencies locally
	@echo "$(GREEN)Installing Python dependencies...$(NC)"
	pip install -r requirements.txt
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

.PHONY: check
check: ## Check if dependencies are installed
	@echo "$(GREEN)Checking dependencies...$(NC)"
	@python -c "import docx2python; print('✓ docx2python installed')" || echo "✗ docx2python not installed"
	@python -c "import click; print('✓ click installed')" || echo "✗ click not installed"
	@command -v docker >/dev/null 2>&1 && echo "✓ Docker installed" || echo "✗ Docker not installed"

.PHONY: lint
lint: ## Lint Python files
	@echo "$(GREEN)Linting Python files...$(NC)"
	@command -v flake8 >/dev/null 2>&1 || { echo "Installing flake8..."; pip install flake8; }
	flake8 parse_questions.py test_parse_questions.py --max-line-length=120 || true

##
## Info Commands
##

.PHONY: info
info: ## Show parser information
	@echo "$(GREEN)Quiz Parser Information$(NC)"
	@echo "  Image name: $(IMAGE_NAME)"
	@echo "  User ID: $(USER_ID)"
	@echo "  Group ID: $(GROUP_ID)"
	@echo "  Working dir: $(PWD)"
	@echo ""
	@echo "Docker image status:"
	@docker images | grep $(IMAGE_NAME) || echo "  Image not built yet"

.PHONY: help-cli
help-cli: ## Show parser CLI help
	@echo "$(GREEN)Parser CLI Help:$(NC)"
	@docker run --rm $(IMAGE_NAME) --help || python parse_questions.py --help

# Catch-all for .docx files
%.docx:
	@:

# Catch-all for .json files  
%.json:
	@:
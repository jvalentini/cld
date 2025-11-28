# Makefile for DOCX Parser and Vue Quiz App

# Variables
PARSER_IMAGE = docx-parser
QUIZ_IMAGE = quiz-app
USER_ID = $(shell id -u)
GROUP_ID = $(shell id -g)
PWD = $(shell pwd)

# Input/Output files for parser
INPUT_DOCX ?= input.docx
OUTPUT_JSON ?= output.json

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

##
## Parser Commands
##

.PHONY: build-parser
build-parser: ## Build the DOCX parser Docker image
	@echo "$(GREEN)Building parser image...$(NC)"
	docker build -t $(PARSER_IMAGE) -f Dockerfile .

.PHONY: parse
parse: ## Parse DOCX (multiple choice only, default)
	@echo "$(GREEN)Parsing $(INPUT_DOCX)...$(NC)"
	docker run --user $(USER_ID):$(GROUP_ID) \
		-v $(PWD):/work \
		-w /work \
		$(PARSER_IMAGE) $(INPUT_DOCX) $(OUTPUT_JSON)

.PHONY: parse-extended
parse-extended: ## Parse DOCX (all question types)
	@echo "$(GREEN)Parsing $(INPUT_DOCX) (extended mode)...$(NC)"
	docker run --user $(USER_ID):$(GROUP_ID) \
		-v $(PWD):/work \
		-w /work \
		$(PARSER_IMAGE) $(INPUT_DOCX) $(OUTPUT_JSON) --extended

.PHONY: parse-tf
parse-tf: ## Parse DOCX (true/false only)
	@echo "$(GREEN)Parsing $(INPUT_DOCX) (true/false only)...$(NC)"
	docker run --user $(USER_ID):$(GROUP_ID) \
		-v $(PWD):/work \
		-w /work \
		$(PARSER_IMAGE) $(INPUT_DOCX) $(OUTPUT_JSON) --type true_false

.PHONY: validate
validate: ## Validate the output JSON file (usage: make validate OUTPUT_JSON=output.json)
	@echo "$(GREEN)Validating $(OUTPUT_JSON)...$(NC)"
	@if [ -f "$(OUTPUT_JSON)" ]; then \
		python3 validate_quiz.py $(OUTPUT_JSON); \
	else \
		echo "$(YELLOW)⚠ File $(OUTPUT_JSON) not found$(NC)"; \
	fi

.PHONY: test
test: ## Run unit tests
	@echo "$(GREEN)Running unit tests...$(NC)"
	python test_parse_questions.py

.PHONY: test-verbose
test-verbose: ## Run unit tests with verbose output
	@echo "$(GREEN)Running unit tests (verbose)...$(NC)"
	python -m unittest test_parse_questions.py -v

.PHONY: test-coverage
test-coverage: ## Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	pip install coverage 2>/dev/null || true
	coverage run test_parse_questions.py
	coverage report
	@echo "$(GREEN)Run 'coverage html' for detailed report$(NC)"

##
## Quiz App Commands
##

.PHONY: build-quiz
build-quiz: ## Build the Vue quiz app Docker image
	@echo "$(GREEN)Building quiz app image...$(NC)"
	cd quiz-app && docker build -t $(QUIZ_IMAGE) .

.PHONY: run-quiz
run-quiz: ## Run the quiz app (accessible at http://localhost:8080)
	@echo "$(GREEN)Starting quiz app at http://localhost:8080$(NC)"
	docker run -d -p 8080:80 --rm --name $(QUIZ_IMAGE) $(QUIZ_IMAGE)
	@echo "$(GREEN)✓ Quiz app running$(NC)"

.PHONY: stop-quiz
stop-quiz: ## Stop the quiz app
	@echo "$(GREEN)Stopping quiz app...$(NC)"
	docker stop $(QUIZ_IMAGE) || true
	docker rm $(QUIZ_IMAGE) || true
	@echo "$(GREEN)✓ Quiz app stopped$(NC)"

.PHONY: logs-quiz
logs-quiz: ## Show quiz app logs
	docker logs -f $(QUIZ_IMAGE)

.PHONY: restart-quiz
restart-quiz: stop-quiz run-quiz ## Restart the quiz app

##
## Docker Compose Commands
##

.PHONY: up
up: ## Start all services with docker-compose
	@echo "$(GREEN)Starting services...$(NC)"
	cd quiz-app && docker-compose up -d
	@echo "$(GREEN)✓ Quiz app running at http://localhost:8080$(NC)"

.PHONY: down
down: ## Stop all services with docker-compose
	@echo "$(GREEN)Stopping services...$(NC)"
	cd quiz-app && docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

.PHONY: rebuild
rebuild: ## Rebuild and restart all services
	@echo "$(GREEN)Rebuilding services...$(NC)"
	cd quiz-app && docker-compose up --build -d
	@echo "$(GREEN)✓ Services rebuilt and running at http://localhost:8080$(NC)"

##
## Complete Workflow
##

.PHONY: all
all: build-parser build-quiz ## Build all Docker images

.PHONY: workflow
workflow: parse validate ## Complete workflow: parse DOCX and validate output
	@echo "$(GREEN)✓ Workflow complete! Upload $(OUTPUT_JSON) to the quiz app$(NC)"

.PHONY: full-workflow
full-workflow: build-parser parse validate build-quiz run-quiz ## Full workflow: build, parse, validate, and run quiz app
	@echo "$(GREEN)✓ Complete! Quiz app running at http://localhost:8080$(NC)"
	@echo "$(YELLOW)Upload $(OUTPUT_JSON) to start the quiz$(NC)"

##
## Utility Commands
##

.PHONY: clean
clean: stop-quiz ## Clean up containers and images
	@echo "$(GREEN)Cleaning up...$(NC)"
	docker rmi $(PARSER_IMAGE) 2>/dev/null || true
	docker rmi $(QUIZ_IMAGE) 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

.PHONY: clean-all
clean-all: clean ## Clean up everything including output files
	@echo "$(GREEN)Removing output files...$(NC)"
	rm -f $(OUTPUT_JSON)
	@echo "$(GREEN)✓ All clean$(NC)"

.PHONY: sample
sample: ## Create a sample quiz JSON file
	@echo "$(GREEN)Creating sample-quiz.json...$(NC)"
	@echo '[' > sample-quiz.json
	@echo '  {' >> sample-quiz.json
	@echo '    "question": "What is the capital of France?",' >> sample-quiz.json
	@echo '    "answers": ["London", "Paris", "Berlin", "Madrid"]' >> sample-quiz.json
	@echo '  },' >> sample-quiz.json
	@echo '  {' >> sample-quiz.json
	@echo '    "question": "What is 2 + 2?",' >> sample-quiz.json
	@echo '    "answers": ["3", "4", "5", "6"]' >> sample-quiz.json
	@echo '  }' >> sample-quiz.json
	@echo ']' >> sample-quiz.json
	@echo "$(GREEN)✓ Created sample-quiz.json$(NC)"

.PHONY: status
status: ## Show status of running containers
	@echo "$(GREEN)Docker containers:$(NC)"
	@docker ps -a | grep -E '($(PARSER_IMAGE)|$(QUIZ_IMAGE))' || echo "  No containers running"
	@echo ""
	@echo "$(GREEN)Docker images:$(NC)"
	@docker images | grep -E '($(PARSER_IMAGE)|$(QUIZ_IMAGE))' || echo "  No images built"
# Root Makefile - Delegates to subdirectories

# Variables
PARSER_DIR = quiz-parser
QUIZ_DIR = quiz-app
PARSER_IMAGE = docx-parser
QUIZ_IMAGE = quiz-app

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(GREEN)Root Makefile - Available targets:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)For parser-specific commands:$(NC)"
	@echo "  $(YELLOW)make parser-help$(NC)            Show all parser commands"
	@echo "  $(YELLOW)cd $(PARSER_DIR) && make help$(NC)   Show parser help directly"

##
## Build Commands
##

.PHONY: build-all
build-all: build-parser build-quiz ## Build all Docker images

.PHONY: build-parser
build-parser: ## Build the DOCX parser Docker image
	@$(MAKE) -C $(PARSER_DIR) build

.PHONY: build-quiz
build-quiz: ## Build the Vue quiz app Docker image
	@echo "$(GREEN)Building quiz app image...$(NC)"
	cd $(QUIZ_DIR) && docker build -t $(QUIZ_IMAGE) .
	@echo "$(GREEN)✓ Quiz app built$(NC)"

##
## Parser Commands (delegated to quiz-parser/Makefile)
##

.PHONY: parse
parse: ## Parse DOCX file (multiple choice only)
	@$(MAKE) -C $(PARSER_DIR) parse INPUT_DOCX=$(INPUT_DOCX) OUTPUT_JSON=$(OUTPUT_JSON)

.PHONY: parse-extended
parse-extended: ## Parse DOCX file (all question types)
	@$(MAKE) -C $(PARSER_DIR) parse-extended INPUT_DOCX=$(INPUT_DOCX) OUTPUT_JSON=$(OUTPUT_JSON)

.PHONY: parse-tf
parse-tf: ## Parse DOCX file (true/false only)
	@$(MAKE) -C $(PARSER_DIR) parse-tf INPUT_DOCX=$(INPUT_DOCX) OUTPUT_JSON=$(OUTPUT_JSON)

.PHONY: validate
validate: ## Validate the output JSON file
	@$(MAKE) -C $(PARSER_DIR) validate OUTPUT_JSON=$(OUTPUT_JSON)

.PHONY: parser-help
parser-help: ## Show parser-specific help
	@$(MAKE) -C $(PARSER_DIR) help

.PHONY: parser-test
parser-test: ## Run parser unit tests
	@$(MAKE) -C $(PARSER_DIR) test

.PHONY: parser-test-verbose
parser-test-verbose: ## Run parser tests with verbose output
	@$(MAKE) -C $(PARSER_DIR) test-verbose

.PHONY: parser-test-coverage
parser-test-coverage: ## Run parser tests with coverage
	@$(MAKE) -C $(PARSER_DIR) test-coverage

.PHONY: parser-clean
parser-clean: ## Clean parser generated files
	@$(MAKE) -C $(PARSER_DIR) clean

.PHONY: parser-sample
parser-sample: ## Create sample quiz JSON
	@$(MAKE) -C $(PARSER_DIR) sample

.PHONY: parser-install
parser-install: ## Install parser dependencies locally
	@$(MAKE) -C $(PARSER_DIR) install

##
## Quiz App Commands
##

.PHONY: run-quiz
run-quiz: ## Run the quiz app (http://localhost:8080)
	@echo "$(GREEN)Starting quiz app at http://localhost:8080$(NC)"
	docker run -d -p 8080:80 --name $(QUIZ_IMAGE) $(QUIZ_IMAGE)
	@echo "$(GREEN)✓ Quiz app running$(NC)"

.PHONY: stop-quiz
stop-quiz: ## Stop the quiz app
	@echo "$(GREEN)Stopping quiz app...$(NC)"
	-docker stop $(QUIZ_IMAGE) 2>/dev/null || true
	-docker rm $(QUIZ_IMAGE) 2>/dev/null || true
	@echo "$(GREEN)✓ Quiz app stopped$(NC)"

.PHONY: restart-quiz
restart-quiz: stop-quiz run-quiz ## Restart the quiz app

.PHONY: logs-quiz
logs-quiz: ## Show quiz app logs
	docker logs -f $(QUIZ_IMAGE)

.PHONY: quiz-clean
quiz-clean: stop-quiz ## Stop and remove quiz app container

##
## Docker Compose Commands
##

.PHONY: up
up: ## Start all services with docker-compose
	@echo "$(GREEN)Starting services...$(NC)"
	cd $(QUIZ_DIR) && docker-compose up -d
	@echo "$(GREEN)✓ Quiz app running at http://localhost:8080$(NC)"

.PHONY: down
down: ## Stop all services with docker-compose
	@echo "$(GREEN)Stopping services...$(NC)"
	cd $(QUIZ_DIR) && docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

.PHONY: rebuild
rebuild: ## Rebuild and restart all services
	@echo "$(GREEN)Rebuilding services...$(NC)"
	cd $(QUIZ_DIR) && docker-compose up --build -d
	@echo "$(GREEN)✓ Services rebuilt and running at http://localhost:8080$(NC)"

##
## Workflow Commands
##

.PHONY: workflow
workflow: ## Parse and validate workflow
	@echo "$(GREEN)Running parse and validate workflow...$(NC)"
	@$(MAKE) -C $(PARSER_DIR) parse INPUT_DOCX=$(INPUT_DOCX) OUTPUT_JSON=$(OUTPUT_JSON)
	@$(MAKE) -C $(PARSER_DIR) validate OUTPUT_JSON=$(OUTPUT_JSON)
	@echo "$(GREEN)✓ Workflow complete!$(NC)"

.PHONY: full-workflow
full-workflow: build-parser build-quiz ## Full workflow: build, parse, validate, run
	@echo "$(GREEN)Running full workflow...$(NC)"
	@$(MAKE) -C $(PARSER_DIR) parse INPUT_DOCX=$(INPUT_DOCX) OUTPUT_JSON=$(OUTPUT_JSON)
	@$(MAKE) -C $(PARSER_DIR) validate OUTPUT_JSON=$(OUTPUT_JSON)
	@$(MAKE) run-quiz
	@echo ""
	@echo "$(GREEN)✓ Complete! Quiz app running at http://localhost:8080$(NC)"
	@echo "$(YELLOW)Upload $(PARSER_DIR)/$(OUTPUT_JSON) to start the quiz$(NC)"

##
## Utility Commands
##

.PHONY: clean
clean: quiz-clean parser-clean ## Clean all generated files and containers
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

.PHONY: clean-all
clean-all: clean ## Clean everything including Docker images
	@echo "$(GREEN)Removing Docker images...$(NC)"
	-docker rmi $(PARSER_IMAGE) 2>/dev/null || true
	-docker rmi $(QUIZ_IMAGE) 2>/dev/null || true
	@$(MAKE) -C $(PARSER_DIR) clean-all
	@echo "$(GREEN)✓ All clean$(NC)"

.PHONY: status
status: ## Show status of containers and images
	@echo "$(GREEN)Docker Containers:$(NC)"
	@docker ps -a | grep -E '($(PARSER_IMAGE)|$(QUIZ_IMAGE))' || echo "  No containers running"
	@echo ""
	@echo "$(GREEN)Docker Images:$(NC)"
	@docker images | grep -E '($(PARSER_IMAGE)|$(QUIZ_IMAGE))' || echo "  No images built"
	@echo ""
	@echo "$(GREEN)Project Structure:$(NC)"
	@echo "  Parser dir: $(PARSER_DIR)/"
	@echo "  Quiz dir: $(QUIZ_DIR)/"

.PHONY: info
info: status ## Show project information

# Allow passing .docx files without error
%.docx:
	@:

# Allow passing .json files without error
%.json:
	@:
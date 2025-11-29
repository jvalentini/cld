# Root Makefile - Delegates to subdirectories

# Variables
PARSER_DIR = quiz-parser
QUIZ_DIR = quiz-app
PARSER_IMAGE = docx-parser
QUIZ_IMAGE = quiz-app

# Default input/output files
INPUT_DOCX ?= input.docx
OUTPUT_JSON ?= output.json

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m # No Color

.PHONY: help
help: ## Show this help
	@echo "$(GREEN)Root Makefile – Available targets$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Delegated commands:$(NC)"
	@echo "  Parser → make parser-*"
	@echo "  Quiz App → make quiz-* or make test-quiz etc."

##
## Build Commands
##

.PHONY: build-all build-parser build-quiz
build-all: build-parser build-quiz
build-parser:
	@$(MAKE) -C $(PARSER_DIR) build
build-quiz: quiz-build

.PHONY: run-quiz stop-quiz restart-quiz logs-quiz quiz-clean
run-quiz:      quiz-run
stop-quiz:     quiz-stop
restart-quiz:  quiz-restart
logs-quiz:     quiz-logs

.PHONY: up down rebuild
up:      quiz-up
down:    quiz-down
rebuild: quiz-rebuild

##
## Parser Commands (delegated to quiz-parser/Makefile)
##

.PHONY: parse parse-extended parse-tf validate parser-help parser-test parser-test-verbose parser-test-coverage parser-clean parser-sample parser-install
parse parse-extended parse-tf validate parser-help parser-test parser-test-verbose parser-test-coverage parser-clean parser-sample parser-install:
	@$(MAKE) -C $(PARSER_DIR) $(@:parser-%=%)

# ──────────────────────────────────────────────────────────────
# Quiz App delegation – now uses quiz-app/Makefile
# ──────────────────────────────────────────────────────────────
.PHONY: quiz-install quiz-dev quiz-build quiz-run quiz-stop quiz-logs quiz-restart \
        quiz-clean quiz-test quiz-test-watch quiz-test-ui quiz-coverage \
        quiz-up quiz-down quiz-rebuild quiz-compose-logs

# Core runtime
quiz-install quiz-dev quiz-build quiz-run quiz-stop quiz-logs quiz-restart quiz-clean \
quiz-up quiz-down quiz-rebuild quiz-compose-logs:
	@$(MAKE) -C $(QUIZ_DIR) $(@:quiz-%=%)

# Testing targets (with nice short aliases)
quiz-test quiz-test-watch quiz-test-ui quiz-coverage:
	@$(MAKE) -C $(QUIZ_DIR) $(patsubst quiz-test%,test%,$(patsubst quiz-%,%,$@))

# Short aliases at root level
test-quiz: quiz-test               ## Run quiz tests
test-quiz-watch: quiz-test-watch   ## Watch mode
test-quiz-ui: quiz-test-ui         ## Vitest UI
test-quiz-cov: quiz-coverage       ## Coverage

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

# Allow passing .docx/.json files without error
%.docx %.json:
	@:
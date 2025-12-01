# Load Testing Makefile

# Variables
IMAGE_NAME = quiz-load-tester
CONTAINER_NAME = quiz-load-test

# Default settings
NUM_USERS ?= 100
MAX_SUBMISSIONS ?= 200
CONCURRENT ?= 50

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
CYAN = \033[0;36m
NC = \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(GREEN)Load Testing Makefile - Available targets:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Configuration variables:$(NC)"
	@echo "  $(CYAN)NUM_USERS$(NC)        Number of users (default: $(NUM_USERS))"
	@echo "  $(CYAN)MAX_SUBMISSIONS$(NC)  Max submissions (default: $(MAX_SUBMISSIONS))"
	@echo "  $(CYAN)CONCURRENT$(NC)       Concurrent users (default: $(CONCURRENT))"
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make run-fast NUM_USERS=50 MAX_SUBMISSIONS=100"
	@echo "  make run CONCURRENT=25"

##
## Build Commands
##

.PHONY: build
build: ## Build the load test Docker image
	@echo "$(GREEN)Building load test image...$(NC)"
	docker build -t $(IMAGE_NAME) .
	@echo "$(GREEN)✓ Load test image built$(NC)"

##
## Run Commands
##

.PHONY: run
run: ## Run load test with default settings
	@echo "$(GREEN)Running load test...$(NC)"
	docker run --rm \
		--name $(CONTAINER_NAME) \
		-v $(shell cd .. && pwd)/supabase:/app/supabase:ro \
		-v $(shell cd .. && pwd)/quiz-app/.env.local:/app/quiz-app/.env.local:ro \
		$(IMAGE_NAME) \
		--num-users $(NUM_USERS) \
		--max-submissions $(MAX_SUBMISSIONS) \
		--concurrent $(CONCURRENT)

.PHONY: run-fast
run-fast: ## Run load test in fast mode (minimal delays)
	@echo "$(GREEN)Running load test (fast mode)...$(NC)"
	docker run --rm \
		--name $(CONTAINER_NAME) \
		-v $(shell cd .. && pwd)/supabase:/app/supabase:ro \
		-v $(shell cd .. && pwd)/quiz-app/.env.local:/app/quiz-app/.env.local:ro \
		$(IMAGE_NAME) \
		--fast \
		--num-users $(NUM_USERS) \
		--max-submissions $(MAX_SUBMISSIONS) \
		--concurrent $(CONCURRENT)

.PHONY: run-full
run-full: ## Run full load test with all 1000 users
	@echo "$(GREEN)Running full load test (all users)...$(NC)"
	docker run --rm \
		--name $(CONTAINER_NAME) \
		-v $(shell cd .. && pwd)/supabase:/app/supabase:ro \
		-v $(shell cd .. && pwd)/quiz-app/.env.local:/app/quiz-app/.env.local:ro \
		$(IMAGE_NAME) \
		--concurrent $(CONCURRENT)

.PHONY: run-quick
run-quick: ## Quick smoke test (10 users, 20 submissions, fast)
	@echo "$(GREEN)Running quick smoke test...$(NC)"
	docker run --rm \
		--name $(CONTAINER_NAME) \
		-v $(shell cd .. && pwd)/supabase:/app/supabase:ro \
		-v $(shell cd .. && pwd)/quiz-app/.env.local:/app/quiz-app/.env.local:ro \
		$(IMAGE_NAME) \
		--fast \
		--num-users 10 \
		--max-submissions 20 \
		--concurrent 10

##
## Local Commands (without Docker)
##

.PHONY: install
install: ## Install dependencies locally
	pip install -r requirements.txt

.PHONY: run-local
run-local: ## Run load test locally (without Docker)
	python load_test.py \
		--num-users $(NUM_USERS) \
		--max-submissions $(MAX_SUBMISSIONS) \
		--concurrent $(CONCURRENT)

.PHONY: run-local-fast
run-local-fast: ## Run load test locally in fast mode
	python load_test.py \
		--fast \
		--num-users $(NUM_USERS) \
		--max-submissions $(MAX_SUBMISSIONS) \
		--concurrent $(CONCURRENT)

##
## Utility Commands
##

.PHONY: clean
clean: ## Remove Docker image
	@echo "$(GREEN)Removing load test image...$(NC)"
	-docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

.PHONY: stop
stop: ## Stop running load test container
	@echo "$(GREEN)Stopping load test...$(NC)"
	-docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@echo "$(GREEN)✓ Load test stopped$(NC)"


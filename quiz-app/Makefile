# quiz-app/Makefile
# Dedicated Makefile for the Vue quiz app

# ──────────────────────────────────────────────────────────────
# Variables & Colors
# ──────────────────────────────────────────────────────────────
GREEN  = \033[0;32m
YELLOW = \033[0;33m
NC     = \033[0m   # No Color

# ──────────────────────────────────────────────────────────────
# Docker / Runtime
# ──────────────────────────────────────────────────────────────
IMAGE_NAME = quiz-app

.PHONY: help
help: ## Show this help
	@echo "$(GREEN)Quiz App Makefile – Available targets$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-25s$(NC) %s\n", $$1, $$2}'

.PHONY: install
install: ## Install node dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm ci
	@echo "$(GREEN)Dependencies installed$(NC)"

.PHONY: dev
dev: ## Run dev server[](http://localhost:5173)
	@echo "$(GREEN)Starting Vite dev server...$(NC)"
	npm run dev

.PHONY: build
build: ## Build production Docker image
	@echo "$(GREEN)Building Docker image $(IMAGE_NAME)...$(NC)"
	docker build --build-arg CACHEBUST=$(shell git rev-parse HEAD 2>/dev/null || date +%s) -t $(IMAGE_NAME) .
	@echo "$(GREEN)Image $(IMAGE_NAME) built$(NC)"

.PHONY: run
run: ## Run container[](http://localhost:8080)
	@echo "$(GREEN)Starting quiz app container...$(NC)"
	docker run -d -p 8080:80 --name $(IMAGE_NAME) $(IMAGE_NAME)
	@echo "$(GREEN)App running at http://localhost:8080$(NC)"

.PHONY: stop
stop: ## Stop container
	@echo "$(GREEN)Stopping container...$(NC)"
	-docker stop $(IMAGE_NAME) 2>/dev/null || true
	-docker rm $(IMAGE_NAME) 2>/dev/null || true
	@echo "$(GREEN)Container stopped$(NC)"

.PHONY: logs
logs: ## Tail container logs
	docker logs -f $(IMAGE_NAME)

.PHONY: restart
restart: stop run ## Restart container

.PHONY: clean
clean: stop ## Stop and clean container only

# ──────────────────────────────────────────────────────────────
# Testing (Vitest)
# ──────────────────────────────────────────────────────────────
.PHONY: test
test: ## Run all unit tests (including App.spec.js)
	@echo "$(GREEN)Running Vitest tests...$(NC)"
	npm run test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "$(GREEN)Running tests in watch mode...$(NC)"
	npm run test -- --watch

.PHONY: test-ui
test-ui: ## Open Vitest UI[](http://localhost:51204/__vitest__/)
	@echo "$(GREEN)Opening Vitest UI...$(NC)"
	npm run test:ui

.PHONY: coverage
coverage: ## Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	npm run coverage

# Short aliases
.PHONY: t tw tc tui
t:   test
tw:  test-watch
tc:  coverage
tui: test-ui

# ──────────────────────────────────────────────────────────────
# Docker Compose (if you use it)
# ──────────────────────────────────────────────────────────────
.PHONY: up down rebuild compose-logs
up: ## docker-compose up -d
	docker-compose up -d
	@echo "$(GREEN)Services up – http://localhost:8080$(NC)"

down: ## docker-compose down
	docker-compose down

rebuild: ## Rebuild & restart with docker-compose
	docker-compose up --build -d

compose-logs: ## Tail docker-compose logs
	docker-compose logs -f
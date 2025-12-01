# quiz-app/Makefile
# Dedicated Makefile for the Vue quiz app

# ----------------------------------------------------------------------
# Variables & Colors
# ----------------------------------------------------------------------
GREEN  = \033[0;32m
YELLOW = \033[0;33m
NC     = \033[0m   # No Color

# ----------------------------------------------------------------------
# Docker / Runtime
# ----------------------------------------------------------------------
IMAGE_NAME = quiz-app

.PHONY: help
help: ## Show this help
	@echo "$(GREEN)Quiz App Makefile - Available targets$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-25s$(NC) %s\n", $$1, $$2}'

.PHONY: install
install: ## Install node dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm ci
	@echo "$(GREEN)Dependencies installed$(NC)"

.PHONY: dev
dev: ## Run dev server (http://localhost:3000)
	@echo "$(GREEN)Starting Vite dev server...$(NC)"
	npm run dev

.PHONY: build
build: ## Build production Docker image
	@echo "$(GREEN)Building Docker image $(IMAGE_NAME)...$(NC)"
	docker build --build-arg CACHEBUST=$(shell git rev-parse HEAD 2>/dev/null || date +%s) -t $(IMAGE_NAME) .
	@echo "$(GREEN)Image $(IMAGE_NAME) built$(NC)"

.PHONY: run
run: ## Run container (http://localhost:8080)
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

# ----------------------------------------------------------------------
# Unit Testing (Vitest)
# ----------------------------------------------------------------------
.PHONY: test
test: ## Run all unit tests (including App.spec.js)
	@echo "$(GREEN)Running Vitest tests...$(NC)"
	npm run test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "$(GREEN)Running tests in watch mode...$(NC)"
	npm run test -- --watch

.PHONY: test-ui
test-ui: ## Open Vitest UI
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

# ----------------------------------------------------------------------
# E2E Testing (Playwright)
# ----------------------------------------------------------------------
.PHONY: e2e
e2e: ## Run Playwright e2e tests (requires dev server)
	@echo "$(GREEN)Running Playwright e2e tests...$(NC)"
	npm run e2e

.PHONY: e2e-ui
e2e-ui: ## Run Playwright tests with UI mode
	@echo "$(GREEN)Opening Playwright UI mode...$(NC)"
	npm run e2e:ui

.PHONY: e2e-headed
e2e-headed: ## Run Playwright tests in headed mode
	@echo "$(GREEN)Running tests in headed mode...$(NC)"
	npm run e2e:headed

.PHONY: e2e-debug
e2e-debug: ## Run Playwright tests in debug mode
	@echo "$(GREEN)Running tests in debug mode...$(NC)"
	npm run e2e:debug

.PHONY: e2e-report
e2e-report: ## Show the Playwright HTML report
	@echo "$(GREEN)Opening Playwright report...$(NC)"
	npm run e2e:report

.PHONY: e2e-install
e2e-install: ## Install Playwright browsers
	@echo "$(GREEN)Installing Playwright browsers...$(NC)"
	npx playwright install --with-deps
	@echo "$(GREEN)Playwright browsers installed$(NC)"

.PHONY: e2e-chromium
e2e-chromium: ## Run e2e tests on Chromium only
	@echo "$(GREEN)Running e2e tests on Chromium...$(NC)"
	npx playwright test --project=chromium

.PHONY: e2e-firefox
e2e-firefox: ## Run e2e tests on Firefox only
	@echo "$(GREEN)Running e2e tests on Firefox...$(NC)"
	npx playwright test --project=firefox

.PHONY: e2e-webkit
e2e-webkit: ## Run e2e tests on WebKit only
	@echo "$(GREEN)Running e2e tests on WebKit...$(NC)"
	npx playwright test --project=webkit

# E2E with Docker
.PHONY: e2e-docker
e2e-docker: ## Run e2e tests in Docker containers
	@echo "$(GREEN)Running e2e tests in Docker...$(NC)"
	docker-compose -f docker-compose.e2e.yml up --build --abort-on-container-exit
	@echo "$(GREEN)E2E tests completed$(NC)"

.PHONY: e2e-docker-down
e2e-docker-down: ## Stop and remove e2e Docker containers
	@echo "$(GREEN)Stopping e2e Docker containers...$(NC)"
	docker-compose -f docker-compose.e2e.yml down
	@echo "$(GREEN)Containers stopped$(NC)"

.PHONY: e2e-build-image
e2e-build-image: ## Build the Playwright e2e test Docker image
	@echo "$(GREEN)Building e2e test image...$(NC)"
	docker build -f Dockerfile.e2e -t quiz-app-e2e .
	@echo "$(GREEN)E2E image built$(NC)"

# E2E short aliases
.PHONY: e eu ed er
e:   e2e
eu:  e2e-ui
ed:  e2e-debug
er:  e2e-report

# ----------------------------------------------------------------------
# Docker Compose
# ----------------------------------------------------------------------
.PHONY: up down rebuild compose-logs
up: ## docker-compose up -d
	docker-compose up -d
	@echo "$(GREEN)Services up - http://localhost:8080$(NC)"

down: ## docker-compose down
	docker-compose down

rebuild: ## Rebuild and restart with docker-compose
	docker-compose up --build -d

compose-logs: ## Tail docker-compose logs
	docker-compose logs -f

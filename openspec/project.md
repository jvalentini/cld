# Project Context

## Purpose
A comprehensive quiz generation and web application platform that converts DOCX question files into interactive web-based quizzes. The project consists of multiple coordinated components: a Python DOCX parser, a Vue.js quiz web application, an MCP Agent Mail coordination system, and supporting infrastructure for load testing and deployment.

## Tech Stack
- **Frontend**: Vue 3, Vite, JavaScript (ES2021), Tailwind CSS, Nginx
- **Backend/Parser**: Python 3.14, FastAPI, uvicorn, Docker
- **Database**: Supabase (PostgreSQL), SQLite (for MCP Agent Mail)
- **Testing**: Vitest (unit), Playwright (E2E), pytest (Python)
- **Build/CI/CD**: Docker, GitHub Actions, Makefiles
- **Agent Coordination**: MCP Agent Mail (FastMCP server), Beads task planning
- **Code Quality**: ESLint, Prettier, Husky, lint-staged, ruff, mypy

## Project Conventions

### Code Style
- **JavaScript/Vue**: ESLint with Vue 3 flat config, Prettier formatting, 2-space indentation
- **Python**: ruff linting (120 char line length), mypy type checking, strict typing required
- **File Naming**: kebab-case for components, PascalCase for Vue components, snake_case for Python
- **Commits**: Conventional commits with commitlint, enforced via Husky
- **No Tech Debt**: No compatibility shims, always choose the right approach over quick fixes

### Architecture Patterns
- **Microservices**: Separate Docker containers for parser, quiz app, and coordination services
- **Event-driven**: MCP Agent Mail provides asynchronous messaging between agents
- **Git-backed Storage**: Human-auditable markdown files stored in Git for agent coordination
- **Advisory File Reservations**: Agents declare intent to edit files to prevent conflicts
- **Container-first**: All services run in Docker with consistent networking

### Testing Strategy
- **Unit Tests**: Vitest for Vue components with jsdom environment, coverage reporting with v8
- **E2E Tests**: Playwright testing across Chromium, Firefox, and WebKit browsers
- **Python Tests**: pytest with asyncio support, coverage reporting
- **Load Testing**: Dedicated load testing service with Python/locust
- **CI/CD**: GitHub Actions run tests on all PRs, with comprehensive checks
- **Test Quality**: High coverage requirements, tests must pass before merges

### Git Workflow
- **Branching**: Main branch for production, feature branches for development
- **Pre-commit Hooks**: Husky with lint-staged for code quality enforcement
- **Commit Messages**: Conventional commits format enforced by commitlint
- **PR Requirements**: All checks must pass (lint, tests, Docker build, validation)
- **File Protection**: Strict no-delete policy for files without explicit permission

## Domain Context

### Quiz System
- **Question Format**: Structured DOCX files with "Question" headers and A/B/C/D answer choices
- **Validation**: Exactly 4 answers per question required, flexible answer formatting (A. or A))
- **JSON Output**: Clean, validated JSON format for web application consumption
- **Progress Tracking**: localStorage-based quiz progress with resume capability

### Agent Coordination
- **Multi-agent Environment**: Multiple coding agents work simultaneously across different components
- **Identity Management**: Memorable adjective+noun agent names (e.g., "GreenCastle", "BlueLake")
- **Message Threading**: GitHub-flavored markdown messages with threading and attachments
- **File Reservations**: Advisory leases prevent agents from overwriting each other's work
- **Cross-project Coordination**: Agents can coordinate across frontend/backend repositories

### Task Planning
- **Beads Integration**: Dependency-aware task planning with priority management
- **Issue Tracking**: Shared identifiers (bd-###) link tasks, messages, and commits
- **Graph Analytics**: PageRank, critical path, and cycle detection for intelligent prioritization

## Important Constraints
- **No File Deletion**: Never delete files without explicit written permission from the project owner
- **No Compatibility Code**: Avoid shims and compatibility layers - choose the right approach
- **No Regex Scripts**: Never run automated regex-based code modification scripts
- **Manual Changes Required**: All code changes must be made manually, even if many instances exist
- **High Bar for New Files**: New code files only for genuinely new functionality, not improvements
- **Security First**: No secrets or keys committed, proper sanitization, secure by default

## External Dependencies
- **Supabase**: Authentication and database services for the quiz application
- **GitHub Container Registry**: Docker image storage and distribution
- **GitHub Pages**: Static site hosting for the quiz application
- **MCP Protocol**: Model Context Protocol for agent coordination
- **FastMCP**: Python framework for building MCP servers
- **Playwright Browsers**: Chromium, Firefox, WebKit for cross-browser testing
- **Docker Hub**: Base images and container distribution
- **Node.js/npm**: Frontend package management and build tools
- **Python PyPI**: Backend package dependencies via uv package manager

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

RULE NUMBER 1 (NEVER EVER EVER FORGET THIS RULE!!!): YOU ARE NEVER ALLOWED TO DELETE A FILE WITHOUT EXPRESS PERMISSION FROM ME OR A DIRECT COMMAND FROM ME. EVEN A NEW FILE THAT YOU YOURSELF CREATED, SUCH AS A TEST CODE FILE. YOU HAVE A HORRIBLE TRACK RECORD OF DELETING CRITICALLY IMPORTANT FILES OR OTHERWISE THROWING AWAY TONS OF EXPENSIVE WORK THAT I THEN NEED TO PAY TO REPRODUCE. AS A RESULT, YOU HAVE PERMANENTLY LOST ANY AND ALL RIGHTS TO DETERMINE THAT A FILE OR FOLDER SHOULD BE DELETED. YOU MUST **ALWAYS** ASK AND *RECEIVE* CLEAR, WRITTEN PERMISSION FROM ME BEFORE EVER EVEN THINKING OF DELETING A FILE OR FOLDER OF ANY KIND!!!

### IRREVERSIBLE GIT & FILESYSTEM ACTIONS — DO-NOT-EVER BREAK GLASS

1. **Absolutely forbidden commands:** `git reset --hard`, `git clean -fd`, `rm -rf`, or any command that can delete or overwrite code/data must never be run unless the user explicitly provides the exact command and states, in the same message, that they understand and want the irreversible consequences.
2. **No guessing:** If there is any uncertainty about what a command might delete or overwrite, stop immediately and ask the user for specific approval. "I think it's safe" is never acceptable.
3. **Safer alternatives first:** When cleanup or rollbacks are needed, request permission to use non-destructive options (`git status`, `git diff`, `git stash`, copying to backups) before ever considering a destructive command.
4. **Mandatory explicit plan:** Even after explicit user authorization, restate the command verbatim, list exactly what will be affected, and wait for a confirmation that your understanding is correct. Only then may you execute it—if anything remains ambiguous, refuse and escalate.
5. **Document the confirmation:** When running any approved destructive command, record (in the session notes / final response) the exact user text that authorized it, the command actually run, and the execution time. If that record is absent, the operation did not happen.

NEVER run a script that processes/changes code files in this repo, EVER! That sort of brittle, regex based stuff is always a huge disaster and creates far more problems than it ever solves. DO NOT BE LAZY AND ALWAYS MAKE CODE CHANGES MANUALLY, EVEN WHEN THERE ARE MANY INSTANCES TO FIX. IF THE CHANGES ARE MANY BUT SIMPLE, THEN USE SEVERAL SUBAGENTS IN PARALLEL TO MAKE THE CHANGES GO FASTER. But if the changes are subtle/complex, then you must methodically do them all yourself manually!

We do not care at all about backwards compatibility since we are still in early development with no users-- we just want to do things the RIGHT way in a clean, organized manner with NO TECH DEBT. That means, never create "compatibility shims" or any other nonsense like that.

We need to AVOID uncontrolled proliferation of code files. If you want to change something or add a feature, then you MUST revise the existing code file in place. You may NEVER, *EVER* take an existing code file, say, "document_processor.py" and then create a new file called "document_processorV2.py", or "document_processor_improved.py", or "document_processor_enhanced.py", or "document_processor_unified.py", or ANYTHING ELSE REMOTELY LIKE THAT! New code files are reserved for GENUINELY NEW FUNCTIONALITY THAT MAKES ZERO SENSE AT ALL TO INCLUDE IN ANY EXISTING CODE FILE. It should be an *INCREDIBLY* high bar for you to EVER create a new code file!

We want all console output to be informative, detailed, stylish, colorful, etc.

If you aren't 100% sure about how to use a third party library, then you must SEARCH ONLINE to find the latest documentation website for the library to understand how it is supposed to work and the latest (mid-2025) suggested best practices and usage.

---

## 🔎 cass — Search All Your Agent History

**What:** `cass` indexes conversations from Claude Code, Codex, Cursor, Gemini, Aider, ChatGPT, and more into a unified, searchable index. Before solving a problem from scratch, check if any agent already solved something similar.

**⚠️ NEVER run bare `cass`** — it launches an interactive TUI. Always use `--robot` or `--json`.

### Quick Start

```bash
# Check if index is healthy (exit 0=ok, 1=run index first)
cass health

# Search across all agent histories
cass search "authentication error" --robot --limit 5

# View a specific result (from search output)
cass view /path/to/session.jsonl -n 42 --json

# Expand context around a line
cass expand /path/to/session.jsonl -n 42 -C 3 --json

# Learn the full API
cass capabilities --json      # Feature discovery
cass robot-docs guide         # LLM-optimized docs
```

### Why Use It

- **Cross-agent knowledge**: Find solutions from Codex when using Claude, or vice versa
- **Forgiving syntax**: Typos and wrong flags are auto-corrected with teaching notes
- **Token-efficient**: `--fields minimal` returns only essential data

### Key Flags

| Flag | Purpose |
|------|---------|
| `--robot` / `--json` | Machine-readable JSON output (required!) |
| `--fields minimal` | Reduce payload: `source_path`, `line_number`, `agent` only |
| `--limit N` | Cap result count |
| `--agent NAME` | Filter to specific agent (claude, codex, cursor, etc.) |
| `--days N` | Limit to recent N days |

**stdout = data only, stderr = diagnostics. Exit 0 = success.**

---

### Robot mode etiquette (CLI for AI agents)
- Prefer `cass --robot-help` and `cass robot-docs <topic>` for machine-first docs.
- The CLI is forgiving: `--robot-docs=commands` and globals placed before/after the subcommand are auto-normalized.
- If parsing fails, we return actionable errors with examples; follow them and retry.
- Keep stdout clean: use `--json/--robot`; stderr only WARN/ERROR in robot mode (INFO auto-suppressed unless `-v`).
- Use `--color=never` in non-TTY automation if you want ANSI-free output.

## MCP Agent Mail — coordination for multi-agent workflows

What it is
- A mail-like layer that lets coding agents coordinate asynchronously via MCP tools and resources.
- Provides identities, inbox/outbox, searchable threads, and advisory file reservations, with human-auditable artifacts in Git.

Why it's useful
- Prevents agents from stepping on each other with explicit file reservations (leases) for files/globs.
- Keeps communication out of your token budget by storing messages in a per-project archive.
- Offers quick reads (`resource://inbox/...`, `resource://thread/...`) and macros that bundle common flows.

How to use effectively
1) Same repository
   - Register an identity: call `ensure_project`, then `register_agent` using this repo's absolute path as `project_key`.
   - Reserve files before you edit: `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true)` to signal intent and avoid conflict.
   - Communicate with threads: use `send_message(..., thread_id="FEAT-123")`; check inbox with `fetch_inbox` and acknowledge with `acknowledge_message`.
   - Read fast: `resource://inbox/{Agent}?project=<abs-path>&limit=20` or `resource://thread/{id}?project=<abs-path>&include_bodies=true`.
   - Tip: set `AGENT_NAME` in your environment so the pre-commit guard can block commits that conflict with others' active exclusive file reservations.
   - Tip: worktree mode (opt-in): set `WORKTREES_ENABLED=1`, and during trials set `AGENT_MAIL_GUARD_MODE=warn`. Check hooks with `mcp-agent-mail guard status .` and identity with `mcp-agent-mail mail status .`.

2) Across different repos in one project (e.g., Next.js frontend + FastAPI backend)
   - Option A (single project bus): register both sides under the same `project_key` (shared key/path). Keep reservation patterns specific (e.g., `frontend/**` vs `backend/**`).
   - Option B (separate projects): each repo has its own `project_key`; use `macro_contact_handshake` or `request_contact`/`respond_contact` to link agents, then message directly. Keep a shared `thread_id` (e.g., ticket key) across repos for clean summaries/audits.

Macros vs granular tools
- Prefer macros when you want speed or are on a smaller model: `macro_start_session`, `macro_prepare_thread`, `macro_file_reservation_cycle`, `macro_contact_handshake`.
- Use granular tools when you need control: `register_agent`, `file_reservation_paths`, `send_message`, `fetch_inbox`, `acknowledge_message`.

### Worktree recipes (opt-in, non-disruptive)

- Enable gated features:
  - Set `WORKTREES_ENABLED=1` or `GIT_IDENTITY_ENABLED=1` in `.env` (do not commit secrets; config is loaded via `dotenvy`).
  - For trial posture, set `AGENT_MAIL_GUARD_MODE=warn` to surface conflicts without blocking.
- Inspect identity for a worktree:
  - CLI: `mcp-agent-mail mail status .`
  - Resource: `resource://identity/{/abs/path}` (available only when `WORKTREES_ENABLED=1`)
- Install guards (chain-runner friendly; honors `core.hooksPath` and Husky):
  - `mcp-agent-mail guard status .`
  - `mcp-agent-mail guard install <project_key> . --prepush`
  - Guards exit early when `WORKTREES_ENABLED=0` or `AGENT_MAIL_BYPASS=1`.
- Composition details:
  - Installer writes a Python chain-runner to `.git/hooks/pre-commit` and `.git/hooks/pre-push` that executes `hooks.d/<hook>/*` and then `<hook>.orig` if present.
  - Agent Mail guard is installed as `hooks.d/pre-commit/50-agent-mail.py` and `hooks.d/pre-push/50-agent-mail.py`.
  - On Windows, `.cmd` and `.ps1` shims are written alongside the chain-runner to invoke Python.
- Reserve before you edit:
  - `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true)`
  - Patterns use Git pathspec semantics and respect repository `core.ignorecase`.

### Git-based identity: precedence and migration

- Precedence (when gate is on):
  1) Committed marker `.agent-mail-project-id`
  2) Discovery YAML `.agent-mail.yaml` with `project_uid:`
  3) Private marker `.git/agent-mail/project-id`
  4) Remote fingerprint: normalized `origin` + default branch
  5) `git-common-dir` or path hash
- Migration helpers (CLI):
  - Write committed marker: `mcp-agent-mail projects mark-identity . --commit`
  - Scaffold discovery YAML: `mcp-agent-mail projects discovery-init . --product <product_uid>`

### Guard usage quickstart

- Set your identity for local commits:
  - Export `AGENT_NAME="YourAgentName"` in the shell that performs commits.
- Pre-commit:
  - Scans staged changes (`git diff --cached --name-status -M -z`) and blocks conflicts with others' active exclusive reservations.
- Pre-push:
  - Enumerates to-be-pushed commits (`git rev-list`) and diffs trees (`git diff-tree --no-ext-diff -z`) to catch conflicts not staged locally.
- Advisory mode:
  - With `AGENT_MAIL_GUARD_MODE=warn`, conflicts are printed with rich context and push/commit proceeds.

### Build slots for long-running tasks

- Acquire a slot (advisory):
  - `acquire_build_slot(project_key, agent_name, "frontend-build", ttl_seconds=3600, exclusive=true)`
- Keep it fresh during the run:
  - `renew_build_slot(project_key, agent_name, "frontend-build", extend_seconds=1800)`
- Release when done (non-destructive; marks released):
  - `release_build_slot(project_key, agent_name, "frontend-build")`
- Tips:
  - Combine with `mcp-agent-mail amctl env --path . --agent $AGENT_NAME` to get `CACHE_KEY` and `ARTIFACT_DIR`.
  - Use `mcp-agent-mail am-run <slot> -- <cmd...>` to run with prepped env; flags include `--ttl-seconds`, `--shared/--exclusive`, and `--block-on-conflicts`. Future versions will auto-acquire/renew/release.

### Product Bus

- Create or ensure a product:
  - `mcp-agent-mail products ensure MyProduct --name "My Product"`
- Link a repo/worktree into the product (use slug or path):
  - `mcp-agent-mail products link MyProduct .`
- View product status and linked projects:
  - `mcp-agent-mail products status MyProduct`
- Search messages across all linked projects:
  - `mcp-agent-mail products search MyProduct "bd-123 OR \"release plan\"" --limit 50`
- Product-wide inbox for an agent:
  - `mcp-agent-mail products inbox MyProduct YourAgent --limit 50 --urgent-only --include-bodies`
- Product-wide thread summarization:
  - `mcp-agent-mail products summarize-thread MyProduct "bd-123" --per-thread-limit 100 --no-llm`

Server tools (for orchestrators)
- `ensure_product(product_key|name)`
- `products_link(product_key, project_key)`
- `resource://product/{key}`
- `search_messages_product(product_key, query, limit=20)`

Common pitfalls
- "from_agent not registered": always `register_agent` in the correct `project_key` first.
- "FILE_RESERVATION_CONFLICT": adjust patterns, wait for expiry, or use a non-exclusive reservation when appropriate.
- Auth errors: if JWT+JWKS is enabled, include a bearer token with a `kid` that matches server JWKS; static bearer is used only when JWT is disabled.

## Integrating with Beads (dependency‑aware task planning)

Beads provides a lightweight, dependency‑aware issue database and a CLI (`bd`) for selecting "ready work," setting priorities, and tracking status. It complements MCP Agent Mail's messaging, audit trail, and file‑reservation signals. Project: [steveyegge/beads](https://github.com/steveyegge/beads)

Recommended conventions
- **Single source of truth**: Use **Beads** for task status/priority/dependencies; use **Agent Mail** for conversation, decisions, and attachments (audit).
- **Shared identifiers**: Use the Beads issue id (e.g., `bd-123`) as the Mail `thread_id` and prefix message subjects with `[bd-123]`.
- **Reservations**: When starting a `bd-###` task, call `file_reservation_paths(...)` for the affected paths; include the issue id in the `reason` and release on completion.

Typical flow (agents)
1) **Pick ready work** (Beads)
   - `bd ready --json` → choose one item (highest priority, no blockers)
2) **Reserve edit surface** (Mail)
   - `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true, reason="bd-123")`
3) **Announce start** (Mail)
   - `send_message(..., thread_id="bd-123", subject="[bd-123] Start: <short title>", ack_required=true)`
4) **Work and update**
   - Reply in‑thread with progress and attach artifacts/images; keep the discussion in one thread per issue id
5) **Complete and release**
   - `bd close bd-123 --reason "Completed"` (Beads is status authority)
   - `release_file_reservations(project_key, agent_name, paths=["src/**"])`
   - Final Mail reply: `[bd-123] Completed` with summary and links

Mapping cheat‑sheet
- **Mail `thread_id`** ↔ `bd-###`
- **Mail subject**: `[bd-###] …`
- **File reservation `reason`**: `bd-###`
- **Commit messages (optional)**: include `bd-###` for traceability

Pitfalls to avoid
- Don't create or manage tasks in Mail; treat Beads as the single task queue.
- Always include `bd-###` in message `thread_id` to avoid ID drift across tools.

Event mirroring (optional automation)
- On `bd update --status blocked`, send a high‑importance Mail message in thread `bd-###` describing the blocker.
- On Mail "ACK overdue" for a critical decision, add a Beads label (e.g., `needs-ack`) or bump priority to surface it in `bd ready`.

---

## Robot Interface (CLI) — Automation Guide for AI Agents

`cass` is designed to be **maximally forgiving** for AI agents. When your intent is clear, the CLI will auto-correct minor syntax issues and proceed with your command—while teaching you the proper syntax for future use. When intent is unclear, it provides rich, contextual error messages with examples.

### Philosophy: Intent Over Syntax

**Core principle:** If we can reliably determine what you're trying to do, we do it. We then tell you how to do it correctly next time.

This means:
- **Minor syntax errors are auto-corrected**: Single-dash long flags, wrong case, subcommand aliases
- **Correction notices teach proper syntax**: Every correction includes an explanation
- **Failures include contextual examples**: Based on what you were likely trying to do

### Auto-Correction Features

The CLI applies multiple normalization layers before parsing:

| Mistake | Correction | Note |
|---------|------------|------|
| `-robot` | `--robot` | Long flags need double-dash |
| `-limit 5` | `--limit 5` | Long flags need double-dash |
| `--Robot`, `--LIMIT` | `--robot`, `--limit` | Flags are lowercase |
| `find "query"` | `search "query"` | `find` is an alias for `search` |
| `query "text"` | `search "text"` | `query` is an alias for `search` |
| `ls` | `stats` | `ls`/`list` are aliases for `stats` |
| `--robot-docs` | `robot-docs` | It's a subcommand, not a flag |
| `docs commands` | `robot-docs commands` | `docs` is an alias |
| Flag after subcommand | Moved to front | Global flags are hoisted |

**Full alias list:**
- **Search:** `find`, `query`, `q`, `lookup`, `grep` → `search`
- **Stats:** `ls`, `list`, `info`, `summary` → `stats`
- **Status:** `st`, `state` → `status`
- **Index:** `reindex`, `idx`, `rebuild` → `index`
- **View:** `show`, `get`, `read` → `view`
- **Diag:** `diagnose`, `debug`, `check` → `diag`
- **Capabilities:** `caps`, `cap` → `capabilities`
- **Introspect:** `inspect`, `intro` → `introspect`
- **Robot-docs:** `docs`, `help-robot`, `robotdocs` → `robot-docs`

### Correction Notices

When commands are auto-corrected, you'll receive a JSON notice on stderr (in robot mode):

```json
{
  "type": "syntax_correction",
  "message": "Your command was auto-corrected. Please use the canonical form in future requests.",
  "corrections": [
    "'-robot' → '--robot' (use double-dash for long flags)",
    "'find' → 'search' (canonical subcommand name)"
  ],
  "tip": "Run 'cass robot-docs' for complete syntax documentation."
}
```

**Important:** The command still executes successfully—this is informational for learning.

### Error Messages (When Intent Is Unclear)

If `cass` cannot determine your intent, it returns a rich error with:
- **Detected intent**: What it thinks you were trying to do
- **Contextual examples**: Relevant to your apparent goal
- **Specific hints**: Based on mistakes detected in your command
- **Common mistakes**: Wrong→Correct mappings for similar commands

**Example Error Output (robot mode):**
```json
{
  "status": "error",
  "error": "error: unrecognized subcommand 'foobar'",
  "kind": "argument_parsing",
  "examples": [
    "cass search \"error handling\" --robot --limit 10",
    "cass search \"authentication\" --robot --agent claude"
  ],
  "hints": [
    "Use '--robot' (double-dash), not '-robot'",
    "Use the 'search' subcommand explicitly: cass search \"your query\" --robot"
  ],
  "common_mistakes": [
    {"wrong": "cass query=\"foo\" --robot", "correct": "cass search \"foo\" --robot"},
    {"wrong": "cass -robot find error", "correct": "cass search \"error\" --robot"}
  ],
  "flag_syntax": {
    "correct": ["--limit 5", "--robot", "--json"],
    "incorrect": ["-limit 5", "limit=5", "--Limit"]
  }
}
```

### Quick Syntax Reference

```
# Correct syntax patterns
cass search "query" --robot --limit 10
cass search "query" --robot --agent claude --workspace /path
cass stats --robot
cass view <session-id> --robot --full
cass robot-docs commands
cass capabilities --json
cass health --json                        # Pre-flight check (<50ms, exit 0=healthy, 1=unhealthy)

# Common mistakes (all auto-corrected)
cass -robot search "query"        → cass search "query" --robot
cass --Robot search "query"       → cass search "query" --robot
cass find "query" --json          → cass search "query" --json
cass --robot-docs                 → cass robot-docs
cass search "query" limit=5       → cass search "query" --limit 5
```

### Best Practices for Agents

1. **Always use `--robot` or `--json`**: Structured output, diagnostics to stderr only
2. **Read correction notices**: Learn proper syntax to avoid corrections next time
3. **Trust error messages**: They're contextual and include working examples
4. **Use `cass robot-docs`**: Complete documentation optimized for LLM consumption
5. **Start with `cass capabilities --json`**: Discover all available commands and options

### Pre-Flight Health Check

Before making complex queries, use the health command to verify cass is working:

```bash
cass health --json
```

Returns in <50ms:
- **Exit 0:** Healthy—proceed with queries
- **Exit 1:** Unhealthy—run `cass index --full` first

JSON output (healthy):
```json
{"healthy": true, "latency_ms": 3, "state": {"index": {"exists": true, "fresh": true, ...}, "database": {...}, "pending": {...}}}
```

When unhealthy (exit 1), includes detailed state for diagnosis:
```json
{"healthy": false, "latency_ms": 5, "state": {"index": {"exists": false, ...}, "database": {...}, "pending": {...}}}
```

The `state` object mirrors the `cass state --json` output, providing index freshness, database stats, and pending session count.

**Recommended agent workflow:**
1. `cass health --json` → Check exit code
2. If exit 1: `cass index --full` → Build index
3. Proceed with `cass search "query" --robot`

### Exit Codes

| Code | Meaning | Retryable |
|------|---------|-----------|
| 0 | Success | N/A |
| 1 | Health check failed (unhealthy) | Yes—run `cass index --full` |
| 2 | Usage/parsing error | No—fix syntax |
| 3 | Missing index | Yes—run `cass index` first |
| 9 | Unknown error | Maybe |

---

Prepared blurb you can paste into other agents' guides (AGENTS.md / CLAUDE.md)

> **cass (Coding Agent Session Search)** — CLI/TUI to search local agent histories.
> - **Pre-flight:** `cass health --json` (<50ms, exit 0=OK, 1=needs index).
> - Robot mode: `cass --robot-help` (automation contract) and `cass robot-docs <topic>` for focused docs.
> - JSON search: `cass search "query" --robot [--limit N --offset N --agent codex --workspace /path]`.
> - Inspect hits: `cass view <source_path> -n <line> --json`.
> - Index first: `cass index --full` (or `cass index --watch`).
> - stdout=data only; stderr=diagnostics; exit codes stable (see `--robot-help`).
> - Non-TTY automation won't start TUI unless you explicitly run `cass tui`.

### ast-grep vs ripgrep (quick guidance)

**Use `ast-grep` when structure matters.** It parses code and matches AST nodes, so results ignore comments/strings, understand syntax, and can **safely rewrite** code.

* Refactors/codemods: rename APIs, change import forms, rewrite call sites or variable kinds.
* Policy checks: enforce patterns across a repo (`scan` with rules + `test`).
* Editor/automation: LSP mode; `--json` output for tooling.

**Use `ripgrep` when text is enough.** It's the fastest way to grep literals/regex across files.

* Recon: find strings, TODOs, log lines, config values, or non‑code assets.
* Pre-filter: narrow candidate files before a precise pass.

**Rule of thumb**

* Need correctness over speed, or you'll **apply changes** → start with `ast-grep`.
* Need raw speed or you're just **hunting text** → start with `rg`.
* Often combine: `rg` to shortlist files, then `ast-grep` to match/modify with precision.

**Snippets**

Find structured code (ignores comments/strings):

```bash
ast-grep run -l TypeScript -p 'import $X from "$P"'
```

Codemod (only real `var` declarations become `let`):

```bash
ast-grep run -l JavaScript -p 'var $A = $B' -r 'let $A = $B' -U
```

Quick textual hunt:

```bash
rg -n 'console\.log\(' -t js
```

Combine speed + precision:

```bash
rg -l -t ts 'useQuery\(' | xargs ast-grep run -l TypeScript -p 'useQuery($A)' -r 'useSuspenseQuery($A)' -U
```

**Mental model**

* Unit of match: `ast-grep` = node; `rg` = line.
* False positives: `ast-grep` low; `rg` depends on your regex.
* Rewrites: `ast-grep` first-class; `rg` requires ad‑hoc sed/awk and risks collateral edits.

---

## UBS Quick Reference for AI Agents

UBS stands for "Ultimate Bug Scanner": **The AI Coding Agent's Secret Weapon: Flagging Likely Bugs for Fixing Early On**

**Golden Rule:** `ubs <changed-files>` before every commit. Exit 0 = safe. Exit >0 = fix & re-run.

**Commands:**
```bash
ubs file.py file2.py                    # Specific files (< 1s) — USE THIS
ubs $(git diff --name-only --cached)    # Staged files — before commit
ubs --only=rust,toml src/               # Language filter (3-5x faster)
ubs --ci --fail-on-warning .            # CI mode — before PR
ubs --help                              # Full command reference
ubs sessions --entries 1                # Tail the latest install session log
ubs .                                   # Whole project (ignores things like target/ and Cargo.lock automatically)
```

**Output Format:**
```
⚠️  Category (N errors)
    file.py:42:5 – Issue description
    💡 Suggested fix
Exit code: 1
```
Parse: `file:line:col` → location | 💡 → how to fix | Exit 0/1 → pass/fail

**Fix Workflow:**
1. Read finding → category + fix suggestion
2. Navigate `file:line:col` → view context
3. Verify real issue (not false positive)
4. Fix root cause (not symptom)
5. Re-run `./ubs <file>` → exit 0
6. Commit

**Speed Critical:** Scope to changed files. `./ubs src/file.py` (< 1s) vs `./ubs .` (30s). Never full scan for small edits.

**Bug Severity:**
- **Critical** (always fix): Memory safety, use-after-free, data races, SQL injection
- **Important** (production): Unwrap panics, resource leaks, overflow checks
- **Contextual** (judgment): TODO/FIXME, println! debugging

**Anti-Patterns:**
- ❌ Ignore findings → ✅ Investigate each
- ❌ Full scan per edit → ✅ Scope to file
- ❌ Fix symptom (`if let Some(x) = opt { x }`) → ✅ Root cause (`opt?` or proper error handling)

---

### Using bv as an AI sidecar

bv is a fast terminal UI for Beads projects (.beads/beads.jsonl). It renders lists/details and precomputes dependency metrics (PageRank, critical path, cycles, etc.) so you instantly see blockers and execution order. For agents, it’s a graph sidecar: instead of parsing JSONL or risking hallucinated traversal, call the robot flags to get deterministic, dependency-aware outputs.

- bv --robot-help — shows all AI-facing commands.
- bv --robot-insights — JSON graph metrics (PageRank, betweenness, HITS, critical path, cycles) with top-N summaries for quick triage.
- bv --robot-plan — JSON execution plan: parallel tracks, items per track, and unblocks lists showing what each item frees up.
- bv --robot-priority — JSON priority recommendations with reasoning and confidence.
- bv --robot-recipes — list recipes (default, actionable, blocked, etc.); apply via bv --recipe <name> to pre-filter/sort before other flags.
- bv --robot-diff --diff-since <commit|date> — JSON diff of issue changes, new/closed items, and cycles introduced/resolved.

Use these commands instead of hand-rolling graph logic; bv already computes the hard parts so agents can act safely and quickly.

---

### Morph Warp Grep — AI-powered code search

**Use `mcp__morph-mcp__warp_grep` for exploratory "how does X work?" questions.** An AI search agent automatically expands your query into multiple search patterns, greps the codebase, reads relevant files, and returns precise line ranges with full context—all in one call.

**Use `ripgrep` (via Grep tool) for targeted searches.** When you know exactly what you're looking for—a specific function name, error message, or config key—ripgrep is faster and more direct.

**Use `ast-grep` for structural code patterns.** When you need to match/rewrite AST nodes while ignoring comments/strings, or enforce codebase-wide rules.

**When to use what**

| Scenario | Tool | Why |
|----------|------|-----|
| "How is authentication implemented?" | `warp_grep` | Exploratory; don't know where to start |
| "Where is the L3 Guardian appeals system?" | `warp_grep` | Need to understand architecture, find multiple related files |
| "Find all uses of `useQuery(`" | `ripgrep` | Targeted literal search |
| "Find files with `console.log`" | `ripgrep` | Simple pattern, known target |
| "Rename `getUserById` → `fetchUser`" | `ast-grep` | Structural refactor, avoid comments/strings |
| "Replace all `var` with `let`" | `ast-grep` | Codemod across codebase |

**warp_grep strengths**

* **Reduces context pollution**: Returns only relevant line ranges, not entire files.
* **Intelligent expansion**: Turns "appeals system" into searches for `appeal`, `Appeals`, `guardian`, `L3`, etc.
* **One-shot answers**: Finds the 3-5 most relevant files with precise locations vs. manual grep→read cycles.
* **Natural language**: Works well with "how", "where", "what" questions.

**warp_grep usage**

```
mcp__morph-mcp__warp_grep(
  repoPath: "/data/projects/communitai",
  query: "How is the L3 Guardian appeals system implemented?"
)
```

Returns structured results with file paths, line ranges, and extracted code snippets.

**Rule of thumb**

* **Don't know where to look** → `warp_grep` (let AI find it)
* **Know the pattern** → `ripgrep` (fastest)
* **Need AST precision** → `ast-grep` (safest for rewrites)

**Anti-patterns**

* ❌ Using `warp_grep` to find a specific function name you already know → use `ripgrep`
* ❌ Using `ripgrep` to understand "how does X work" → wastes time with manual file reads
* ❌ Using `ripgrep` for codemods → misses comments/strings, risks collateral edits

### Morph Warp Grep vs Standard Grep

  Warp Grep = AI agent that greps, reads, follows connections, returns synthesized context with line numbers.
  Standard Grep = Fast regex match, you interpret results.

  Decision: Can you write the grep pattern?
  - Yes → Grep
  - No, you have a question → mcp__morph-mcp__warp_grep

  #### Warp Grep Queries (natural language, unknown location)
  "How does the moderation appeals flow work?"
  "Where are websocket connections managed?"
  "What happens when a user submits a post?"
  "Where is rate limiting implemented?"
  "How does the auth session get validated on API routes?"
  "What services touch the moderationDecisions table?"

  #### Standard Grep Queries (known pattern, specific target)
  pattern="fileAppeal"                          # known function name
  pattern="class.*Service"                      # structural pattern
  pattern="TODO|FIXME|HACK"                     # markers
  pattern="processenv" path="apps/web"      # specific string
  pattern="import.*from [']@/lib/db"          # import tracing

  #### What Warp Grep Does Internally
  One query → 15-30 operations: greps multiple patterns → reads relevant sections → follows imports/references → returns focused line ranges (e.g., l3-guardian.ts:269-440) not whole files.

  #### Anti-patterns
  | Don't Use Warp Grep For | Why | Use Instead |
  |------------------------|-----|-------------|
  | "Find function handleSubmit" | Known name | Grep pattern="handleSubmit" |
  | "Read the auth config" | Known file | Read file_path="lib/auth/..." |
  | "Check if X exists" | Boolean answer | Grep + check results |
  | Quick lookups mid-task | 5-10s latency | Grep is 100ms |

  #### When Warp Grep Wins
  - Tracing data flow across files (API → service → schema → types)
  - Understanding unfamiliar subsystems before modifying
  - Answering "how" questions that span 3+ files
  - Finding all touching points for a cross-cutting concern

#!/usr/bin/env bash
#
# AI Workflow Orchestrator CLI for Clawvec v4
# Version: 1.0
# Status: Production Specification
#
# Usage: ./ai-workflow.sh <command> [args]
#
# Commands:
#   init          Initialize workflow state
#   task <desc>   Create new task from description
#   spec <task>   Run Specification Agent (KIMI)
#   dev <spec>    Run Claude Code Developer
#   test <commit> Run Tester Agent
#   review <pr>   Run Codex Reviewer
#   deploy <pr>   Run Deploy Agent (requires Hermes approval)
#   status        Show current workflow status
#   list          List all tasks
#   approve       Hermes approves deployment
#   reject        Hermes rejects and returns to developer
#
# Environment:
#   AI_PROVIDER   Default: kimi (kimi | anthropic | openai)
#   CLAUDE_MODEL  Claude Code model override
#   CODEX_MODEL   Codex model override
#   WORKFLOW_DIR  State directory (default: ./.workflow)

set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKFLOW_DIR="${WORKFLOW_DIR:-${PROJECT_ROOT}/.workflow}"
AI_PROVIDER="${AI_PROVIDER:-kimi}"
CLAUDE_BIN="${CLAUDE_BIN:-$(which claude 2>/dev/null || echo "")}"
CODEX_BIN="${CODEX_BIN:-$(which codex 2>/dev/null || echo "")}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()   { echo -e "${GREEN}[OK]${NC}   $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_err()  { echo -e "${RED}[ERR]${NC}  $*" >&2; }

# Structured agent communication (per AI_WORKFLOW.md §Agent Communication)
agent_msg() {
    local agent="$1" state="$2" result="$3" next="$4"
    cat <<EOF
STATUS:
${TASK_ID:-UNKNOWN}

AGENT:
${agent}

STATE:
${state}

RESULT:
${result}

NEXT:
${next}
EOF
}

# Initialize workflow directory structure
init_workflow() {
    log_info "Initializing AI Workflow state..."
    mkdir -p "${WORKFLOW_DIR}/tasks"
    mkdir -p "${WORKFLOW_DIR}/specs"
    mkdir -p "${WORKFLOW_DIR}/commits"
    mkdir -p "${WORKFLOW_DIR}/tests"
    mkdir -p "${WORKFLOW_DIR}/reviews"
    mkdir -p "${WORKFLOW_DIR}/deploys"
    mkdir -p "${WORKFLOW_DIR}/memory"
    
    # Create state tracking files
    touch "${WORKFLOW_DIR}/current_task"
    touch "${WORKFLOW_DIR}/task_counter"
    echo "0" > "${WORKFLOW_DIR}/task_counter"
    
    # Create agent memory files
    cat > "${WORKFLOW_DIR}/memory/architecture.md" <<'EOF'
# Architecture Memory
# Updated by: Specification Agent, Codex
# Read by: All agents
EOF
    
    cat > "${WORKFLOW_DIR}/memory/bugs.md" <<'EOF'
# Bug Memory
# Updated by: Tester Agent, Codex
# Read by: Claude Code
EOF
    
    cat > "${WORKFLOW_DIR}/memory/coding.md" <<'EOF'
# Coding Memory
# Updated by: Claude Code, Codex
# Read by: All agents
EOF
    
    cat > "${WORKFLOW_DIR}/memory/decisions.md" <<'EOF'
# Decision Memory
# Updated by: Hermes, Codex
# Read by: All agents
EOF
    
    log_ok "Workflow initialized at ${WORKFLOW_DIR}"
    log_info "AI Provider: ${AI_PROVIDER}"
    log_info "Claude Code: ${CLAUDE_BIN:-NOT FOUND}"
    log_info "Codex: ${CODEX_BIN:-NOT FOUND}"
}

# Generate next task ID
next_task_id() {
    local counter_file="${WORKFLOW_DIR}/task_counter"
    local counter
    counter=$(cat "${counter_file}")
    counter=$((counter + 1))
    echo "${counter}" > "${counter_file}"
    printf "TASK-%03d" "${counter}"
}

# Create new task
create_task() {
    local description="$1"
    local task_id
    task_id=$(next_task_id)
    local task_file="${WORKFLOW_DIR}/tasks/${task_id}.md"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat > "${task_file}" <<EOF
# ${task_id}

**Status:** CREATED
**Created:** ${timestamp}
**Description:** ${description}

## Workflow State
- [ ] Specification
- [ ] Implementation
- [ ] Testing
- [ ] Review
- [ ] Deployment

## Agent Log
EOF
    
    echo "${task_id}" > "${WORKFLOW_DIR}/current_task"
    
    log_ok "Created ${task_id}"
    log_info "Task file: ${task_file}"
    
    # Output structured status
    agent_msg "Hermes" "CREATED" "OK" "SPECIFICATION"
}

# Run Specification Agent via KIMI
run_specification() {
    local task_id="${1:-$(cat "${WORKFLOW_DIR}/current_task" 2>/dev/null || echo "")}"
    if [[ -z "${task_id}" ]]; then
        log_err "No active task. Run: $0 task <description>"
        exit 1
    fi
    
    local task_file="${WORKFLOW_DIR}/tasks/${task_id}.md"
    local spec_file="${WORKFLOW_DIR}/specs/${task_id}-spec.md"
    
    if [[ ! -f "${task_file}" ]]; then
        log_err "Task ${task_id} not found"
        exit 1
    fi
    
    log_info "Running Specification Agent (KIMI) for ${task_id}..."
    
    # Read task description
    local description
    description=$(grep "^\*\*Description:\*\*" "${task_file}" | sed 's/^\*\*Description:\*\* //')
    
    # Generate specification using KIMI (Hermes itself acts as Specification Agent)
    # In production, this would call an external KIMI API or subprocess
    cat > "${spec_file}" <<EOF
# Specification: ${task_id}

## User Story
${description}

## Technical Design
TBD - Generated by Specification Agent

## API Specification
TBD - Generated by Specification Agent

## Database Schema
TBD - Generated by Specification Agent

## Acceptance Criteria
- [ ] Feature implemented per design
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Security review pass
- [ ] Architecture review pass

## Agent: Specification Agent
## Provider: ${AI_PROVIDER}
## Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
    
    # Update task state
    sed -i 's/^\*\*Status:\*\* CREATED/**Status:** SPECIFICATION/' "${task_file}"
    echo -e "\n- $(date -u +"%Y-%m-%dT%H:%M:%SZ") Specification Agent: Generated spec" >> "${task_file}"
    
    log_ok "Specification complete: ${spec_file}"
    agent_msg "Specification Agent" "SPECIFICATION" "PASS" "IMPLEMENTATION"
}

# Run Claude Code Developer
run_developer() {
    local task_id="${1:-$(cat "${WORKFLOW_DIR}/current_task" 2>/dev/null || echo "")}"
    if [[ -z "${task_id}" ]]; then
        log_err "No active task. Run: $0 task <description>"
        exit 1
    fi
    
    local spec_file="${WORKFLOW_DIR}/specs/${task_id}-spec.md"
    
    if [[ ! -f "${spec_file}" ]]; then
        log_err "Specification not found for ${task_id}. Run: $0 spec [task_id]"
        exit 1
    fi
    
    if [[ -z "${CLAUDE_BIN}" ]]; then
        log_err "Claude Code not found. Install: npm install -g @anthropic-ai/claude-code"
        exit 1
    fi
    
    log_info "Running Claude Code Developer for ${task_id}..."
    log_info "Claude Code: ${CLAUDE_BIN}"
    
    # Prepare context for Claude Code
    local claude_context="${WORKFLOW_DIR}/.claude-context-${task_id}.md"
    cat > "${claude_context}" <<EOF
# Claude Code Context: ${task_id}

## Project
Clawvec v4 - AI and human shared civilization recording infrastructure

## Working Directory
${PROJECT_ROOT}

## Specification
$(cat "${spec_file}")

## Architecture Rules
- Read PROJECT.md, ARCHITECTURE.md, CONTEXT.md, AI_WORKFLOW.md before coding
- Follow directory structure in ARCHITECTURE.md strictly
- No fetch/axios in components - use features/*/services/
- No direct Anthropic import - use ai/providers/factory.ts
- No inline prompts in business code - use ai/prompts/
- No hardcoded colors/spacing - use tokens.css
- No task-outside file modifications
- Write tests with implementation

## Memory
$(cat "${WORKFLOW_DIR}/memory/architecture.md" 2>/dev/null || echo "No architecture memory")
$(cat "${WORKFLOW_DIR}/memory/coding.md" 2>/dev/null || echo "No coding memory")
$(cat "${WORKFLOW_DIR}/memory/bugs.md" 2>/dev/null || echo "No bug memory")

## Task
Implement the specification above. Follow all architecture rules.
Create a feature branch: feature/${task_id}
Write unit tests.
Submit commit and PR.
EOF
    
    log_info "Launching Claude Code with context..."
    log_warn "Claude Code will open in interactive mode. Follow the spec and commit when done."
    
    # Launch Claude Code with the context via -p flag (non-interactive with prompt)
    cd "${PROJECT_ROOT}"
    "${CLAUDE_BIN}" -p "$(cat "${claude_context}")" 2>/dev/null || {
        log_warn "Claude Code non-interactive mode failed, launching interactive..."
        log_info "Context file: ${claude_context}"
        log_info "Run: claude"
        log_info "Then paste the context from the file above."
        "${CLAUDE_BIN}"
    }
    
    # Update task state
    local task_file="${WORKFLOW_DIR}/tasks/${task_id}.md"
    sed -i 's/^\*\*Status:\*\* SPECIFICATION/**Status:** IMPLEMENTATION/' "${task_file}"
    echo -e "\n- $(date -u +"%Y-%m-%dT%H:%M:%SZ") Claude Code: Implementation started" >> "${task_file}"
    
    agent_msg "Claude Code" "IMPLEMENTATION" "PENDING" "TESTING"
}

# Run Tester Agent
run_tester() {
    local task_id="${1:-$(cat "${WORKFLOW_DIR}/current_task" 2>/dev/null || echo "")}"
    if [[ -z "${task_id}" ]]; then
        log_err "No active task."
        exit 1
    fi
    
    log_info "Running Tester Agent for ${task_id}..."
    
    local test_file="${WORKFLOW_DIR}/tests/${task_id}-test.md"
    local task_file="${WORKFLOW_DIR}/tasks/${task_id}.md"
    
    # Run test suite
    cat > "${test_file}" <<EOF
# Test Report: ${task_id}

## Test Execution
Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Agent: Tester Agent
Provider: ${AI_PROVIDER}

## Results
EOF
    
    # Check if tests exist and run them
    cd "${PROJECT_ROOT}"
    
    if [[ -f "package.json" ]]; then
        log_info "Running npm test..."
        if npm test >> "${test_file}" 2>&1; then
            echo -e "\n## Status: PASS" >> "${test_file}"
            sed -i 's/^\*\*Status:\*\* IMPLEMENTATION/**Status:** TESTING/' "${task_file}"
            echo -e "\n- $(date -u +"%Y-%m-%dT%H:%M:%SZ") Tester Agent: PASS" >> "${task_file}"
            log_ok "Tests PASSED"
            agent_msg "Tester Agent" "TESTING" "PASS" "CODE_REVIEW"
        else
            echo -e "\n## Status: FAIL" >> "${test_file}"
            echo -e "\n## Bug Report" >> "${test_file}"
            echo "Tests failed. See output above." >> "${test_file}"
            sed -i 's/^\*\*Status:\*\* IMPLEMENTATION/**Status:** TESTING_FAILED/' "${task_file}"
            echo -e "\n- $(date -u +"%Y-%m-%dT%H:%M:%SZ") Tester Agent: FAIL - Returned to Claude" >> "${task_file}"
            log_err "Tests FAILED - Return to Claude Code"
            agent_msg "Tester Agent" "TESTING" "FAIL" "IMPLEMENTATION"
            exit 1
        fi
    else
        log_warn "No package.json found - skipping automated tests"
        echo -e "\n## Status: SKIPPED (no test suite configured)" >> "${test_file}"
        agent_msg "Tester Agent" "TESTING" "PASS" "CODE_REVIEW"
    fi
}

# Run Codex Reviewer
run_review() {
    local task_id="${1:-$(cat "${WORKFLOW_DIR}/current_task" 2>/dev/null || echo "")}"
    if [[ -z "${task_id}" ]]; then
        log_err "No active task."
        exit 1
    fi
    
    if [[ -z "${CODEX_BIN}" ]]; then
        log_err "Codex not found. Install: npm install -g @openai/codex"
        exit 1
    fi
    
    log_info "Running Codex Review for ${task_id}..."
    
    local review_file="${WORKFLOW_DIR}/reviews/${task_id}-review.md"
    local task_file="${WORKFLOW_DIR}/tasks/${task_id}.md"
    local spec_file="${WORKFLOW_DIR}/specs/${task_id}-spec.md"
    
    # Prepare review context for Codex
    local codex_context="${WORKFLOW_DIR}/.codex-context-${task_id}.md"
    cat > "${codex_context}" <<EOF
# Codex Review Context: ${task_id}

## Role
Senior Architect - Code Review, Security Audit, Architecture Review, Performance Review

## Project
Clawvec v4

## Specification
$(cat "${spec_file}" 2>/dev/null || echo "No spec found")

## Review Checklist
- [ ] Architecture compliance (ARCHITECTURE.md)
- [ ] Security audit (no secrets, no injection risks)
- [ ] Performance review (no N+1, proper caching)
- [ ] Coding standards (SOLID, DRY, KISS, Clean Code)
- [ ] Type safety (no any, proper types)
- [ ] Error handling (all boundaries covered)
- [ ] Documentation (README, comments where needed)

## Forbidden for Codex
- Do NOT implement features
- Do NOT write production code
- Only review and report issues

## Output Format
PASS or FAIL with Issue List and Recommendations
EOF
    
    log_info "Launching Codex for review..."
    cd "${PROJECT_ROOT}"
    
    # Run Codex review via -p flag (non-interactive with prompt)
    "${CODEX_BIN}" -p "$(cat "${codex_context}")" 2>/dev/null || {
        log_warn "Codex non-interactive mode failed, launching interactive review..."
        log_info "Context file: ${codex_context}"
        log_info "Run: codex"
        log_info "Then paste the context from the file above."
        "${CODEX_BIN}"
    }
    
    # For now, create a placeholder review
    cat > "${review_file}" <<EOF
# Review Report: ${task_id}

## Review Execution
Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Agent: Codex
Provider: ${AI_PROVIDER}

## Status: PENDING
Codex review launched. Update this file with results.

## Review Areas
- Architecture
- Security
- Performance
- Maintainability
- Naming
- Complexity
EOF
    
    sed -i 's/^\*\*Status:\*\* TESTING/**Status:** REVIEW/' "${task_file}"
    echo -e "\n- $(date -u +"%Y-%m-%dT%H:%M:%SZ") Codex: Review started" >> "${task_file}"
    
    agent_msg "Codex" "REVIEW" "PENDING" "HERMES_APPROVAL"
}

# Hermes approves deployment
approve_deploy() {
    local task_id="${1:-$(cat "${WORKFLOW_DIR}/current_task" 2>/dev/null || echo "")}"
    if [[ -z "${task_id}" ]]; then
        log_err "No active task."
        exit 1
    fi
    
    local task_file="${WORKFLOW_DIR}/tasks/${task_id}.md"
    
    log_info "Hermes approving deployment for ${task_id}..."
    
    sed -i 's/^\*\*Status:\*\* REVIEW/**Status:** APPROVED/' "${task_file}"
    echo -e "\n- $(date -u +"%Y-%m-%dT%H:%M:%SZ") Hermes: APPROVED deployment" >> "${task_file}"
    
    log_ok "Deployment APPROVED for ${task_id}"
    agent_msg "Hermes" "APPROVAL" "PASS" "DEPLOYMENT"
}

# Hermes rejects and returns to developer
reject_return() {
    local task_id="${1:-$(cat "${WORKFLOW_DIR}/current_task" 2>/dev/null || echo "")}"
    if [[ -z "${task_id}" ]]; then
        log_err "No active task."
        exit 1
    fi
    
    local task_file="${WORKFLOW_DIR}/tasks/${task_id}.md"
    local reason="${2:-No reason provided}"
    
    log_warn "Hermes REJECTING ${task_id}: ${reason}"
    
    sed -i 's/^\*\*Status:\*\* REVIEW/**Status:** REJECTED/' "${task_file}"
    echo -e "\n- $(date -u +"%Y-%m-%dT%H:%M:%SZ") Hermes: REJECTED - ${reason}" >> "${task_file}"
    
    agent_msg "Hermes" "REJECTION" "FAIL" "IMPLEMENTATION"
}

# Run Deploy Agent
run_deploy() {
    local task_id="${1:-$(cat "${WORKFLOW_DIR}/current_task" 2>/dev/null || echo "")}"
    if [[ -z "${task_id}" ]]; then
        log_err "No active task."
        exit 1
    fi
    
    local task_file="${WORKFLOW_DIR}/tasks/${task_id}.md"
    local status
    status=$(grep "^\*\*Status:\*\*" "${task_file}" | sed 's/^\*\*Status:\*\* //')
    
    if [[ "${status}" != "APPROVED" ]]; then
        log_err "Task not approved. Status: ${status}"
        log_err "Run: $0 approve [task_id]"
        exit 1
    fi
    
    log_info "Running Deploy Agent for ${task_id}..."
    
    local deploy_file="${WORKFLOW_DIR}/deploys/${task_id}-deploy.md"
    
    cat > "${deploy_file}" <<EOF
# Deployment Report: ${task_id}

## Deployment Execution
Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Agent: Deploy Agent

## Stages
- [ ] DEV
- [ ] STAGING
- [ ] PRODUCTION

## Status: IN_PROGRESS
EOF
    
    sed -i 's/^\*\*Status:\*\* APPROVED/**Status:** DEPLOYING/' "${task_file}"
    echo -e "\n- $(date -u +"%Y-%m-%dT%H:%M:%SZ") Deploy Agent: Deployment started" >> "${task_file}"
    
    log_ok "Deployment started for ${task_id}"
    agent_msg "Deploy Agent" "DEPLOYMENT" "IN_PROGRESS" "DOCUMENTATION"
}

# Show workflow status
show_status() {
    log_info "AI Workflow Status"
    echo "────────────────────────────────────────"
    echo "Project: ${PROJECT_ROOT}"
    echo "Workflow Dir: ${WORKFLOW_DIR}"
    echo "AI Provider: ${AI_PROVIDER}"
    echo "Claude Code: ${CLAUDE_BIN:-NOT FOUND}"
    echo "Codex: ${CODEX_BIN:-NOT FOUND}"
    echo "────────────────────────────────────────"
    
    local current_task
    current_task=$(cat "${WORKFLOW_DIR}/current_task" 2>/dev/null || echo "None")
    echo "Current Task: ${current_task}"
    
    echo ""
    echo "Recent Tasks:"
    ls -1t "${WORKFLOW_DIR}/tasks/" 2>/dev/null | head -5 | while read -r f; do
        local tid
        tid=$(basename "$f" .md)
        local tstatus
        tstatus=$(grep "^\*\*Status:\*\*" "${WORKFLOW_DIR}/tasks/$f" 2>/dev/null | sed 's/^\*\*Status:\*\* //' || echo "UNKNOWN")
        echo "  ${tid}: ${tstatus}"
    done
    
    echo ""
    echo "Task Count: $(cat "${WORKFLOW_DIR}/task_counter" 2>/dev/null || echo "0")"
}

# List all tasks
list_tasks() {
    log_info "All Tasks"
    echo "────────────────────────────────────────"
    
    if [[ ! -d "${WORKFLOW_DIR}/tasks" ]] || [[ -z "$(ls -A "${WORKFLOW_DIR}/tasks" 2>/dev/null)" ]]; then
        echo "No tasks found."
        return
    fi
    
    ls -1t "${WORKFLOW_DIR}/tasks/" | while read -r f; do
        local tid
        tid=$(basename "$f" .md)
        local tstatus
        tstatus=$(grep "^\*\*Status:\*\*" "${WORKFLOW_DIR}/tasks/$f" 2>/dev/null | sed 's/^\*\*Status:\*\* //' || echo "UNKNOWN")
        local tdesc
        tdesc=$(grep "^\*\*Description:\*\*" "${WORKFLOW_DIR}/tasks/$f" 2>/dev/null | sed 's/^\*\*Description:\*\* //' || echo "No description")
        printf "%-12s %-16s %s\n" "${tid}" "[${tstatus}]" "${tdesc}"
    done
}

# Show help
show_help() {
    cat <<EOF
AI Workflow Orchestrator CLI for Clawvec v4
Version: 1.0

Usage: $(basename "$0") <command> [args]

Commands:
  init                  Initialize workflow state
  task <description>    Create new task
  spec [task_id]        Run Specification Agent (KIMI)
  dev [task_id]         Run Claude Code Developer
  test [task_id]        Run Tester Agent
  review [task_id]      Run Codex Reviewer
  deploy [task_id]      Run Deploy Agent (requires approval)
  approve [task_id]     Hermes approves deployment
  reject [task_id] <reason>  Hermes rejects, returns to dev
  status                Show workflow status
  list                  List all tasks
  help                  Show this help

Environment Variables:
  AI_PROVIDER     Default AI provider (default: kimi)
  CLAUDE_BIN      Path to Claude Code binary (auto-detected)
  CODEX_BIN       Path to Codex binary (auto-detected)
  WORKFLOW_DIR    State directory (default: ./.workflow)

Examples:
  $(basename "$0") init
  $(basename "$0") task "Implement user login feature"
  $(basename "$0") spec
  $(basename "$0") dev
  $(basename "$0") test
  $(basename "$0") review
  $(basename "$0") approve
  $(basename "$0") deploy
EOF
}

# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────

main() {
    local cmd="${1:-help}"
    shift || true
    
    case "${cmd}" in
        init)
            init_workflow
            ;;
        task)
            if [[ $# -lt 1 ]]; then
                log_err "Usage: $0 task <description>"
                exit 1
            fi
            create_task "$*"
            ;;
        spec)
            run_specification "$@"
            ;;
        dev|developer|claude)
            run_developer "$@"
            ;;
        test|testing)
            run_tester "$@"
            ;;
        review|codex)
            run_review "$@"
            ;;
        approve|approval)
            approve_deploy "$@"
            ;;
        reject)
            if [[ $# -lt 1 ]]; then
                log_err "Usage: $0 reject [task_id] <reason>"
                exit 1
            fi
            local tid="$1"
            shift
            reject_return "${tid}" "$*"
            ;;
        deploy|deployment)
            run_deploy "$@"
            ;;
        status)
            show_status
            ;;
        list|ls)
            list_tasks
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_err "Unknown command: ${cmd}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"

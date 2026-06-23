#!/usr/bin/env python3
"""
Clawvec AI Workflow CLI Wrapper
Simulates Claude Code / Codex functionality using Kimi API
Version: 1.0
"""

import argparse
import json
import os
import sys
import subprocess
import tempfile
import threading
import time
from pathlib import Path
from typing import Optional, List, Dict, Any

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────

PROJECT_ROOT = Path.home() / "clawvec-v4"
WORKFLOW_DIR = PROJECT_ROOT / ".workflow"
DEFAULT_MODEL = "kimi-for-coding"
DEFAULT_BASE_URL = "https://api.kimi.com/coding/v1"

# Try to read API key from various sources
def get_api_key() -> str:
    """Get Kimi API key from env or auth.json"""
    # 1. Environment variable
    for env_var in ["KIMI_API_KEY", "MOONSHOT_API_KEY", "ANTHROPIC_AUTH_TOKEN"]:
        key = os.environ.get(env_var)
        if key and key.startswith("sk-"):
            return key
    
    # 2. Read from Hermes auth.json
    auth_path = Path.home() / ".hermes" / "auth.json"
    if auth_path.exists():
        try:
            with open(auth_path) as f:
                auth_data = json.load(f)
            cred_pool = auth_data.get("credential_pool", {})
            # Try custom:kimi entries
            for entry in cred_pool.get("custom:kimi", []):
                token = entry.get("access_token", "")
                if token and token.startswith("sk-"):
                    return token
            # Try kimi-coding-cn entries
            for entry in cred_pool.get("kimi-coding-cn", []):
                token = entry.get("access_token", "")
                if token and token.startswith("sk-"):
                    return token
        except Exception:
            pass
    
    return ""

# ─────────────────────────────────────────────────────────────
# Kimi API Client
# ─────────────────────────────────────────────────────────────

class KimiClient:
    def __init__(self, api_key: str, base_url: str = "https://api.kimi.com/coding/v1", model: str = "kimi-for-coding"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def chat_completion(self, messages: List[Dict[str, str]], max_tokens: int = 2000, 
                       temperature: float = 0.7, stream: bool = False) -> Dict[str, Any]:
        """Send chat completion request to Kimi API via kimi CLI with session resume"""
        import subprocess
        
        # Build prompt from messages
        prompt = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt += f"System: {content}\n\n"
            elif role == "user":
                prompt += f"{content}\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n"
        
        # Run kimi CLI with session resume (session_id from successful login)
        # The session e80f7218-9371-44cf-99e2-23c2966ddf74 was verified working
        # Timeout: 600s (10min) for complex generation tasks
        result = subprocess.run(
            ["kimi", "-r", "e80f7218-9371-44cf-99e2-23c2966ddf74", "--prompt", prompt.strip()],
            capture_output=True,
            text=True,
            timeout=600
        )
        
        if result.returncode != 0:
            raise Exception(f"Kimi CLI error: {result.stderr}")
        
        # Parse response - kimi CLI outputs markdown text
        # Remove the "To resume this session" line
        content = result.stdout.strip()
        lines = content.split('\n')
        filtered_lines = []
        for line in lines:
            if "To resume this session" in line:
                continue
            filtered_lines.append(line)
        content = '\n'.join(filtered_lines).strip()
        
        # Return in OpenAI-compatible format
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": content
                },
                "finish_reason": "stop"
            }],
            "model": self.model
        }
    
    def stream_completion(self, messages: List[Dict[str, str]], max_tokens: int = 2000,
                         temperature: float = 0.7):
        """Stream chat completion from Kimi API via kimi CLI with real-time output"""
        import subprocess
        
        # Build prompt from messages
        prompt = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt += f"System: {content}\n\n"
            elif role == "user":
                prompt += f"{content}\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n"
        
        # Run kimi CLI with real-time output streaming
        # Use Popen for streaming output instead of run
        process = subprocess.Popen(
            ["kimi", "-r", "e80f7218-9371-44cf-99e2-23c2966ddf74", "--prompt", prompt.strip()],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Stream output in real-time with timeout
        start_time = time.time()
        timeout_seconds = 600
        output_buffer = []
        
        try:
            while True:
                # Check timeout
                if time.time() - start_time > timeout_seconds:
                    process.terminate()
                    raise TimeoutError(f"Kimi CLI timed out after {timeout_seconds}s")
                
                # Check if process is still running
                ret = process.poll()
                if ret is not None:
                    break
                
                # Read available output
                import select
                if process.stdout:
                    readable, _, _ = select.select([process.stdout], [], [], 0.1)
                    if readable:
                        line = process.stdout.readline()
                        if line:
                            # Filter out session resume line
                            if "To resume this session" not in line:
                                output_buffer.append(line)
                                yield line
                
                time.sleep(0.05)
            
            # Get remaining output
            remaining_stdout, remaining_stderr = process.communicate(timeout=30)
            if remaining_stdout:
                for line in remaining_stdout.split('\n'):
                    if line and "To resume this session" not in line:
                        output_buffer.append(line + '\n')
                        yield line + '\n'
            
            if process.returncode != 0:
                raise Exception(f"Kimi CLI error: {remaining_stderr}")
                
        except Exception as e:
            process.terminate()
            raise e

# ─────────────────────────────────────────────────────────────
# Agent Prompts
# ─────────────────────────────────────────────────────────────

CLAUDE_SYSTEM_PROMPT = """You are Claude Code, an AI software developer for the Clawvec project.
You implement features, fix bugs, and write code following the project's architecture rules.

Key rules:
- Read PROJECT.md, ARCHITECTURE.md, CONTEXT.md, AI_WORKFLOW.md before coding
- Follow the src/ directory structure strictly
- No fetch/axios in components - use features/*/services/
- No direct Anthropic import - use ai/providers/factory.ts
- No inline prompts in business code - use ai/prompts/
- No hardcoded colors/spacing - use tokens.css
- Write tests with implementation
- Use TypeScript strict mode
- Follow SOLID, DRY, KISS principles

When given a task:
1. Analyze the specification
2. Plan implementation steps
3. Write code following architecture rules
4. Include error handling and edge cases
5. Provide test cases

Output only code and explanations. No conversational filler."""

CODEX_SYSTEM_PROMPT = """You are Codex, a Senior Architect and Code Reviewer for the Clawvec project.
You review code for architecture compliance, security, performance, and best practices.

Review checklist:
- [ ] Architecture compliance (ARCHITECTURE.md)
- [ ] Security audit (no secrets, no injection risks)
- [ ] Performance review (no N+1, proper caching)
- [ ] Coding standards (SOLID, DRY, KISS, Clean Code)
- [ ] Type safety (no any, proper types)
- [ ] Error handling (all boundaries covered)
- [ ] Documentation (README, comments where needed)

You do NOT implement features. You only review and report issues.

Output format:
## Review Result: PASS or FAIL

## Issues Found
[List each issue with severity: CRITICAL/HIGH/MEDIUM/LOW]

## Recommendations
[Specific suggestions for improvement]

## Architecture Compliance
[Check against ARCHITECTURE.md rules]"""

SPECIFICATION_PROMPT = """You are a Specification Agent for the Clawvec project.
You analyze user requirements and generate detailed implementation specifications.

Output format:
## User Story
[Clear description of what the user wants]

## Technical Design
[Architecture decisions, component breakdown]

## API Specification
[Endpoints, request/response schemas]

## Database Schema
[Tables, fields, relationships]

## Acceptance Criteria
[Specific, testable conditions]

## Files to Create/Modify
[List of files with purpose]

## Dependencies
[What other modules/features this depends on]"""

# ─────────────────────────────────────────────────────────────
# CLI Commands
# ─────────────────────────────────────────────────────────────

def cmd_claude(args):
    """Claude Code Developer mode"""
    api_key = get_api_key()
    if not api_key:
        print("Error: No API key found. Set KIMI_API_KEY environment variable.")
        sys.exit(1)
    
    client = KimiClient(api_key, model=args.model or DEFAULT_MODEL)
    
    # Read context files
    context = ""
    if args.context:
        context_path = Path(args.context)
        if context_path.exists():
            context = context_path.read_text()
    
    # Read specification if provided
    spec = ""
    if args.spec:
        spec_path = Path(args.spec)
        if spec_path.exists():
            spec = spec_path.read_text()
    
    # Build messages
    messages = [
        {"role": "system", "content": CLAUDE_SYSTEM_PROMPT}
    ]
    
    if context:
        messages.append({"role": "user", "content": f"Project context:\n{context}"})
    
    if spec:
        messages.append({"role": "user", "content": f"Specification:\n{spec}"})
    
    # Interactive or single prompt
    if args.interactive:
        print("Claude Code Developer (Kimi)")
        print("Type 'exit' or 'quit' to exit")
        print("-" * 50)
        
        while True:
            try:
                user_input = input("\n> ")
                if user_input.lower() in ["exit", "quit", "q"]:
                    break
                
                messages.append({"role": "user", "content": user_input})
                
                if args.stream:
                    print("\nClaude: ", end="", flush=True)
                    response_text = ""
                    for chunk in client.stream_completion(messages, max_tokens=args.max_tokens):
                        print(chunk, end="", flush=True)
                        response_text += chunk
                    print()
                else:
                    response = client.chat_completion(messages, max_tokens=args.max_tokens)
                    content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
                    print(f"\nClaude: {content}")
                    response_text = content
                
                messages.append({"role": "assistant", "content": response_text})
                
            except KeyboardInterrupt:
                print("\nExiting...")
                break
            except Exception as e:
                print(f"Error: {e}")
    else:
        # Single prompt mode
        if not args.prompt:
            print("Error: Provide --prompt or use --interactive mode")
            sys.exit(1)
        
        messages.append({"role": "user", "content": args.prompt})
        
        try:
            if args.stream:
                for chunk in client.stream_completion(messages, max_tokens=args.max_tokens):
                    print(chunk, end="", flush=True)
                print()
            else:
                response = client.chat_completion(messages, max_tokens=args.max_tokens)
                content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
                print(content)
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)

def cmd_codex(args):
    """Codex Reviewer mode"""
    api_key = get_api_key()
    if not api_key:
        print("Error: No API key found. Set KIMI_API_KEY environment variable.")
        sys.exit(1)
    
    client = KimiClient(api_key, model=args.model or DEFAULT_MODEL)
    
    # Read files to review
    review_content = ""
    if args.files:
        for file_path in args.files:
            path = Path(file_path)
            if path.exists():
                review_content += f"\n\n=== {file_path} ===\n"
                review_content += path.read_text()
    
    if args.diff:
        review_content += f"\n\n=== Diff ===\n{args.diff}"
    
    if not review_content and not args.prompt:
        print("Error: Provide --files, --diff, or --prompt")
        sys.exit(1)
    
    messages = [
        {"role": "system", "content": CODEX_SYSTEM_PROMPT},
        {"role": "user", "content": f"Please review the following code:\n{review_content}"}
    ]
    
    if args.prompt:
        messages.append({"role": "user", "content": args.prompt})
    
    try:
        if args.stream:
            for chunk in client.stream_completion(messages, max_tokens=args.max_tokens):
                print(chunk, end="", flush=True)
            print()
        else:
            response = client.chat_completion(messages, max_tokens=args.max_tokens)
            content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(content)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def cmd_spec(args):
    """Specification Agent mode"""
    api_key = get_api_key()
    if not api_key:
        print("Error: No API key found. Set KIMI_API_KEY environment variable.")
        sys.exit(1)
    
    client = KimiClient(api_key, model=args.model or DEFAULT_MODEL)
    
    if not args.description:
        print("Error: Provide --description")
        sys.exit(1)
    
    # Read project context
    context = ""
    for ctx_file in ["PROJECT.md", "ARCHITECTURE.md", "CONTEXT.md"]:
        ctx_path = PROJECT_ROOT / ctx_file
        if ctx_path.exists():
            context += f"\n\n=== {ctx_file} ===\n"
            context += ctx_path.read_text()[:2000]  # Limit context size
    
    messages = [
        {"role": "system", "content": SPECIFICATION_PROMPT},
        {"role": "user", "content": f"Project context:\n{context}\n\nUser request: {args.description}"}
    ]
    
    try:
        if args.stream:
            for chunk in client.stream_completion(messages, max_tokens=args.max_tokens):
                print(chunk, end="", flush=True)
            print()
        else:
            response = client.chat_completion(messages, max_tokens=args.max_tokens)
            content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(content)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def cmd_test(args):
    """Tester Agent mode - runs tests and reports results"""
    print("Tester Agent")
    print("-" * 50)
    
    # Run npm test if package.json exists
    if (PROJECT_ROOT / "package.json").exists():
        print("Running npm test...")
        result = subprocess.run(
            ["npm", "test"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.returncode != 0:
            print(f"FAILED: {result.stderr}")
            sys.exit(1)
        else:
            print("PASS")
    else:
        print("No package.json found. Skipping tests.")

def cmd_status(args):
    """Show workflow status"""
    print("AI Workflow Status")
    print("=" * 50)
    print(f"Project: {PROJECT_ROOT}")
    print(f"Workflow: {WORKFLOW_DIR}")
    print(f"Model: {DEFAULT_MODEL}")
    print(f"Base URL: {DEFAULT_BASE_URL}")
    
    api_key = get_api_key()
    print(f"API Key: {'SET' if api_key else 'NOT SET'}")
    
    # Show current task
    current_task_file = WORKFLOW_DIR / "current_task"
    if current_task_file.exists():
        current_task = current_task_file.read_text().strip()
        print(f"Current Task: {current_task}")
        
        task_file = WORKFLOW_DIR / "tasks" / f"{current_task}.md"
        if task_file.exists():
            content = task_file.read_text()
            for line in content.split("\n"):
                if line.startswith("**Status:**"):
                    print(f"Status: {line.replace('**Status:**', '').strip()}")
                    break
    else:
        print("Current Task: None")
    
    # List recent tasks
    tasks_dir = WORKFLOW_DIR / "tasks"
    if tasks_dir.exists():
        print("\nRecent Tasks:")
        for task_file in sorted(tasks_dir.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)[:5]:
            task_id = task_file.stem
            content = task_file.read_text()
            status = "UNKNOWN"
            for line in content.split("\n"):
                if line.startswith("**Status:**"):
                    status = line.replace("**Status:**", "").strip()
                    break
            print(f"  {task_id}: {status}")

def cmd_list(args):
    """List all tasks (alias for show_status with task list)"""
    print("[INFO] All Tasks")
    print("────────────────────────────────────────")
    
    tasks_dir = WORKFLOW_DIR / "tasks"
    if not tasks_dir.exists() or not any(tasks_dir.iterdir()):
        print("No tasks found.")
        return
    
    for task_file in sorted(tasks_dir.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True):
        task_id = task_file.stem
        content = task_file.read_text()
        status = "UNKNOWN"
        description = "No description"
        for line in content.split("\n"):
            if line.startswith("**Status:**"):
                status = line.replace("**Status:**", "").strip()
            if line.startswith("**Description:**"):
                description = line.replace("**Description:**", "").strip()
        print(f"{task_id:12} [{status:16}] {description}")

def cmd_workflow(args):
    """Execute workflow step"""
    if not args.step:
        print("Error: Provide --step (init/task/spec/dev/test/review/deploy)")
        sys.exit(1)
    
    step = args.step.lower()
    
    if step == "init":
        # Initialize workflow
        WORKFLOW_DIR.mkdir(parents=True, exist_ok=True)
        for subdir in ["tasks", "specs", "commits", "tests", "reviews", "deploys", "memory"]:
            (WORKFLOW_DIR / subdir).mkdir(exist_ok=True)
        
        (WORKFLOW_DIR / "current_task").write_text("")
        (WORKFLOW_DIR / "task_counter").write_text("0")
        print("Workflow initialized")
        
    elif step == "task":
        if not args.description:
            print("Error: Provide --description")
            sys.exit(1)
        
        # Create new task
        counter_file = WORKFLOW_DIR / "task_counter"
        counter = int(counter_file.read_text().strip() or "0")
        counter += 1
        counter_file.write_text(str(counter))
        
        task_id = f"TASK-{counter:03d}"
        task_file = WORKFLOW_DIR / "tasks" / f"{task_id}.md"
        
        import datetime
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        task_content = f"""# {task_id}

**Status:** CREATED
**Created:** {timestamp}
**Description:** {args.description}

## Workflow State
- [ ] Specification
- [ ] Implementation
- [ ] Testing
- [ ] Review
- [ ] Deployment

## Agent Log
"""
        task_file.write_text(task_content)
        (WORKFLOW_DIR / "current_task").write_text(task_id)
        
        print(f"Created {task_id}")
        print(f"Task file: {task_file}")
        
    elif step == "spec":
        # Generate specification
        print("Running Specification Agent...")
        cmd_spec(args)
        
    elif step == "dev":
        # Run developer
        print("Running Claude Code Developer...")
        cmd_claude(args)
        
    elif step == "test":
        # Run tests
        cmd_test(args)
        
    elif step == "review":
        # Run reviewer
        print("Running Codex Reviewer...")
        cmd_codex(args)
        
    elif step == "list":
        cmd_list(args)
    elif step == "deploy":
        print("Deploy Agent: Not implemented in CLI wrapper")
        
    else:
        print(f"Unknown step: {step}")
        sys.exit(1)

# ─────────────────────────────────────────────────────────────
# Main CLI
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Clawvec AI Workflow CLI - Kimi API Wrapper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Initialize workflow
  %(prog)s workflow --step init
  
  # Create new task
  %(prog)s workflow --step task --description "Implement user login"
  
  # Run Specification Agent
  %(prog)s spec --description "User login feature" > spec.md
  
  # Run Claude Code Developer (interactive)
  %(prog)s claude --interactive --context CONTEXT.md --spec spec.md
  
  # Run Claude Code with single prompt
  %(prog)s claude --prompt "Implement a login form component"
  
  # Run Codex Reviewer
  %(prog)s codex --files src/features/login/LoginForm.tsx
  
  # Check status
  %(prog)s status
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Claude command
    claude_parser = subparsers.add_parser("claude", help="Claude Code Developer")
    claude_parser.add_argument("--prompt", "-p", help="Single prompt mode")
    claude_parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")
    claude_parser.add_argument("--context", "-c", help="Context file path")
    claude_parser.add_argument("--spec", "-s", help="Specification file path")
    claude_parser.add_argument("--model", "-m", help="Model to use")
    claude_parser.add_argument("--max-tokens", type=int, default=2000, help="Max tokens")
    claude_parser.add_argument("--stream", action="store_true", help="Stream output")
    
    # Codex command
    codex_parser = subparsers.add_parser("codex", help="Codex Reviewer")
    codex_parser.add_argument("--files", "-f", nargs="+", help="Files to review")
    codex_parser.add_argument("--diff", "-d", help="Diff to review")
    codex_parser.add_argument("--prompt", "-p", help="Additional prompt")
    codex_parser.add_argument("--model", "-m", help="Model to use")
    codex_parser.add_argument("--max-tokens", type=int, default=4000, help="Max tokens")
    codex_parser.add_argument("--stream", action="store_true", help="Stream output")
    
    # Spec command
    spec_parser = subparsers.add_parser("spec", help="Specification Agent")
    spec_parser.add_argument("--description", "-d", required=True, help="Feature description")
    spec_parser.add_argument("--model", "-m", help="Model to use")
    spec_parser.add_argument("--max-tokens", type=int, default=4000, help="Max tokens")
    spec_parser.add_argument("--stream", action="store_true", help="Stream output")
    
    # Test command
    test_parser = subparsers.add_parser("test", help="Tester Agent")
    
    # Status command
    status_parser = subparsers.add_parser("status", help="Show workflow status")
    
    # Workflow command
    workflow_parser = subparsers.add_parser("workflow", help="Execute workflow step")
    workflow_parser.add_argument("--step", required=True, 
                                choices=["init", "task", "spec", "dev", "test", "review", "deploy", "list"],
                                help="Workflow step")
    workflow_parser.add_argument("--description", "-d", help="Task description")
    workflow_parser.add_argument("--model", "-m", help="Model to use")
    workflow_parser.add_argument("--max-tokens", type=int, default=2000, help="Max tokens")
    workflow_parser.add_argument("--stream", action="store_true", help="Stream output")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Route to command handler
    commands = {
        "claude": cmd_claude,
        "codex": cmd_codex,
        "spec": cmd_spec,
        "test": cmd_test,
        "status": cmd_status,
        "workflow": cmd_workflow,
    }
    
    handler = commands.get(args.command)
    if handler:
        handler(args)
    else:
        print(f"Unknown command: {args.command}")
        sys.exit(1)

if __name__ == "__main__":
    main()

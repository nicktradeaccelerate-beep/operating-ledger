#!/bin/bash
# work.sh <project-id>
# Opens a new Terminal window in the project directory and starts Claude Code.
# The SessionStart hook will auto-inject the project brief.
# Claude runs in acceptEdits mode: file changes are auto-approved,
# bash/deploys/external calls pause for your sign-off.

PROJECT_ID="$1"
DATA_PATH="$HOME/operating-ledger/data.json"

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: work.sh <project-id>"
  echo ""
  echo "Available projects with local paths:"
  node -e "
const d = require('$DATA_PATH');
d.projects.filter(p => p.local_path).forEach(p => {
  console.log('  ' + p.id.padEnd(22) + p.name);
});
"
  exit 0
fi

LOCAL_PATH=$(node -e "
const d = require('$DATA_PATH');
const p = d.projects.find(x => x.id === '$PROJECT_ID');
if (!p || !p.local_path) { process.exit(1); }
console.log(p.local_path);
" 2>/dev/null)

if [ -z "$LOCAL_PATH" ]; then
  echo "Project '$PROJECT_ID' not found or has no local path set."
  echo "Add the local path via the dashboard edit (✎) button."
  exit 1
fi

echo "Starting Claude Code on: $LOCAL_PATH"

# Open a new Terminal window in the project directory
osascript <<EOF
tell application "Terminal"
  activate
  set newTab to do script "cd \"$LOCAL_PATH\" && claude --permission-mode acceptEdits"
  set custom title of newTab to "$PROJECT_ID"
end tell
EOF

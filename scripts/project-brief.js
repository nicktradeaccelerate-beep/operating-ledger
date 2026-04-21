#!/usr/bin/env node
// SessionStart hook — injects Operating Ledger project brief into Claude Code sessions
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const cwd = process.env.PWD || process.cwd();
    const dataPath = path.join(process.env.HOME, 'operating-ledger/data.json');

    if (!fs.existsSync(dataPath)) process.exit(0);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const project = data.projects.find(p => {
      if (!p.local_path) return false;
      const lp = p.local_path.replace(/\/$/, '');
      return cwd === lp || cwd.startsWith(lp + '/');
    });

    if (!project) process.exit(0);

    const outstanding = project.outstanding.length
      ? project.outstanding.map(t => `  • ${t}`).join('\n')
      : '  (none logged)';

    const notes = project.notes ? `\nNotes: ${project.notes}` : '';

    const brief = `━━ OPERATING LEDGER BRIEF ━━
Project : ${project.name}
Status  : ${project.status}  |  Progress: ${project.progress}%
Stack   : ${project.tech_stack.join(', ')}
${project.one_liner}${notes}

Outstanding (${project.outstanding.length}):
${outstanding}

WORKING INSTRUCTIONS:
- Work through the outstanding items above in order unless told otherwise
- File edits are pre-approved — implement directly, no need to ask
- Before any bash command, deployment, API call, or DB migration: briefly state what you're about to do and why, then wait for approval
- At genuine decision points (architecture choice, external service, irreversible action): present the options concisely and wait
- After completing each outstanding item, confirm it's done and move to the next
- If you're blocked or need credentials, say so clearly and stop`;

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: brief
      }
    }));
  } catch (e) {
    process.exit(0);
  }
});

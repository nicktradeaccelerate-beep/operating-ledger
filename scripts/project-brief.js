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

Pick up where this left off. Focus on the outstanding items above. Ask before doing anything irreversible.`;

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

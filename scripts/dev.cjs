const { spawn, execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const next = path.join(root, 'frontend/node_modules/next/dist/bin/next');

if (!existsSync(next)) {
  console.error('Chua cai thu vien frontend. Hay chay: npm --prefix frontend install');
  process.exit(1);
}

const children = [];
let stopping = false;

function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    try {
      if (process.platform === 'win32') {
        execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        process.kill(-child.pid, 'SIGTERM');
      }
    } catch {
      // The process may already have stopped after Ctrl+C.
    }
  }
  process.exit(code);
}

function start(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`Khong the chay ${command}: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => stop(code ?? 1));
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

console.log('Frontend: http://localhost:3000 | Backend: http://localhost:5108');
console.log('Nhan Ctrl+C de dung ca hai.');
start('dotnet', ['run', '--project', 'backend/TravelHub.Api.csproj', '--launch-profile', 'http'], root);
start(process.execPath, [next, 'dev'], path.join(root, 'frontend'));

import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 실행할 스크립트 경로
const scriptPath = path.join(__dirname, 'check.mjs');

console.log('스케줄러가 시작되었습니다. (1분 간격)');

// 1분마다 실행 (* * * * *)
cron.schedule('* * * * *', () => {
  const now = new Date().toLocaleString();
  console.log(`[${now}] 스크립트 실행 시작: node check.mjs`);

  const child = spawn('node', [scriptPath], { windowsHide: true });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[STDOUT] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[STDERR] ${data}`);
  });

  child.on('close', (code) => {
    console.log(`[${new Date().toLocaleString()}] 스크립트 실행 종료 (종료 코드: ${code})`);
    console.log('--------------------------------------------------');
  });
});

// 즉시 한 번 실행하고 싶다면 아래 주석을 해제하세요.
// runImmediately();
function runImmediately() {
    const child = spawn('node', [scriptPath], { windowsHide: true });
    child.stdout.on('data', (data) => process.stdout.write(`[STDOUT] ${data}`));
    child.stderr.on('data', (data) => process.stderr.write(`[STDERR] ${data}`));
}

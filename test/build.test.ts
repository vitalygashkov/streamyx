import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { test, expect } from 'vitest';

const getBuildDirPrefix = () => {
  switch (process.platform) {
    case 'win32':
      return 'win';
    case 'darwin':
      return 'mac';
    case 'linux':
      return 'lin';
    default:
      throw new Error('Unsupported platform');
  }
};

test('test executable run with Okko', async () => {
  const buildDir = path.join(__dirname, '../build');
  const buildDirPrefix = getBuildDirPrefix();
  const executableDir = fs.readdirSync(buildDir).find((file) => file.startsWith(buildDirPrefix));
  expect(executableDir).toBeDefined();
  const executableSuffix = process.platform.startsWith('win') ? '.exe' : '';
  const executablePath = path.join(buildDir, executableDir!, 'streamyx' + executableSuffix);
  console.log('Spawning sync executable');
  const streamyx = spawn(executablePath, [
    'https://okko.tv/serial/hozukis-coolheadedness/season/1/episode/13',
    '--debug',
  ]);
  const dataLines: string[] = [];
  streamyx.stdout.on('data', (data: Buffer) => {
    if (!data) return;
    const dataStr = data.toString();
    dataLines.push(dataStr);
    console.log(dataStr);
  });
  const errorLines: string[] = [];
  streamyx.stderr.on('error', (error: Buffer) => {
    if (!error) return;
    const errorStr = error.toString();
    errorLines.push(errorStr);
    console.log(errorStr);
  });
  const searchTarget = 'Open page https://okko.tv/tv and enter';
  const result = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(dataLines.find((line) => line.includes(searchTarget)));
    }, 3_000);
  });
  expect(result).toBeDefined();
  expect(result).toContain(searchTarget);
  streamyx.kill();
});

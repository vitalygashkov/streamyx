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
  const executable = spawn(executablePath, [
    'https://okko.tv/serial/hozukis-coolheadedness/season/1/episode/13',
    '--debug',
  ]);
  const searchTarget = 'Open page https://okko.tv/tv and enter';
  const result = await new Promise((resolve) => {
    const lines: string[] = [];
    const hasSearchTarget = (line: string) => line.includes(searchTarget);
    executable.stdout.on('data', (data: Buffer) => {
      if (!data) return;
      const line = data.toString();
      lines.push(line);
      console.log(line);
      if (hasSearchTarget(line)) resolve(line);
    });
    executable.stderr.on('data', (error: Buffer) => error && console.log(error.toString()));
    setTimeout(() => resolve(lines.find(hasSearchTarget)), 3_000);
  });
  expect(result).toBeDefined();
  expect(result).toContain(searchTarget);
  executable.kill();
});

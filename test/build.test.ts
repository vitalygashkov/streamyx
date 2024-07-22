import path from 'node:path';
import fs from 'node:fs';
import { spawn, exec } from 'node:child_process';
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

test('test executable run with Okko', { timeout: 240_000 }, async () => {
  const buildDir = path.join(__dirname, '../build');
  const buildDirPrefix = getBuildDirPrefix();
  const executableDir = fs.readdirSync(buildDir).find((file) => file.startsWith(buildDirPrefix));
  expect(executableDir).toBeDefined();
  console.log(`Executable folder: ${executableDir}`);
  const executableSuffix = process.platform.startsWith('win') ? '.exe' : '';
  const executablePath = path.join(buildDir, executableDir!, 'streamyx' + executableSuffix);
  console.log(`Executable path: ${executablePath}`);
  const streamyxSpawn = spawn(executablePath, [
    'https://okko.tv/serial/hozukis-coolheadedness/season/1/episode/13',
    '--debug',
  ]);
  const streamyxExec = exec(
    executablePath + ' https://okko.tv/serial/hozukis-coolheadedness/season/1/episode/13 --debug',
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    }
  );
  const dataLines: string[] = [];
  streamyxSpawn.stdout.on('data', (data: Buffer) => {
    if (!data) return;
    const dataStr = data.toString();
    dataLines.push(dataStr);
    console.log(dataStr);
  });
  const errorLines: string[] = [];
  streamyxSpawn.stderr.on('error', (error: Buffer) => {
    if (!error) return;
    const errorStr = error.toString();
    errorLines.push(errorStr);
    console.log(errorStr);
  });
  streamyxExec.stdout?.on('data', (data) => {
    console.log(`stdout: ${data}`);
    dataLines.push(data.toString());
  });
  streamyxExec.stderr?.on('data', (data) => {
    console.log(`stderr: ${data}`);
    errorLines.push(data.toString());
  });
  const searchTarget = 'Open page https://okko.tv/tv and enter';
  const result = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(dataLines.find((line) => line.includes(searchTarget)));
    }, 120_000);
  });
  expect(result).toBeDefined();
  expect(result).toContain(searchTarget);
  streamyxSpawn.kill();
});

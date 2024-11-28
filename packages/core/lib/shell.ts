import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { join } from 'node:path';

export const $ = async (command: TemplateStringsArray) => {
  let cmd = typeof command === 'string' ? command : command.join(' ');
  const files = await fs.readdir(process.cwd());
  const isPackage = files.includes('package.json');
  if (isPackage) {
    const pkg = await fs.readFile(join(process.cwd(), 'package.json'), { encoding: 'utf-8' });
    const pkgJson = JSON.parse(pkg);
    let main = pkgJson.main || files.find((file) => file === 'index.js') || files.find((file) => file.endsWith('.js'));
    main = join(process.cwd(), main);
    if (cmd.startsWith('streamyx install')) {
      const targetName = cmd.split(' ')[2];
      if (targetName === pkgJson.name) cmd = `streamyx install ${main}`;
    }
  }
  execSync(cmd, { stdio: 'inherit' });
};

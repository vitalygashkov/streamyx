import { cwd } from 'node:process';
import { homedir } from 'node:os';
import nodeFs from 'node:fs';
import type { WriteStream } from 'node:fs';
import { appendFile, mkdir, readdir, readFile, unlink, writeFile, rename } from 'node:fs/promises';
import { join, parse } from 'node:path';

const APP_NAME = 'Streamyx';

const getAppDataDir = (appName: string = APP_NAME) => {
  switch (process.platform) {
    case 'win32':
      return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), appName);
    case 'darwin':
      return join(homedir(), 'Library', 'Application Support', appName);
    case 'linux':
      return join(homedir(), '.local', 'share', appName);
    default:
      throw new Error('Unsupported platform');
  }
};

const appDataDir = getAppDataDir();

export const initDir = (dir: string) => {
  if (!nodeFs.existsSync(dir)) nodeFs.mkdirSync(dir);
  return dir;
};

export class BaseDirectory {
  static AppData = initDir(appDataDir);
  static AppLog = initDir(join(appDataDir, 'logs'));
  static Temp = initDir(join(appDataDir, 'tmp'));
  static Download = join(homedir(), 'Downloads');
}

export const fs = {
  appDir: cwd(),
  homeDir: homedir(),
  tempDir: BaseDirectory.Temp,
  logsDir: BaseDirectory.AppLog,
  join(...paths: string[]) {
    return join(...paths);
  },
  parse(path: string) {
    return parse(path);
  },
  async readDir(dir: string, contentType: 'all' | 'dir' | 'file' = 'all') {
    const dirEntries = await readdir(dir, { withFileTypes: true });
    switch (contentType) {
      case 'dir':
        return dirEntries.filter((de) => de.isDirectory()).map((de) => de.name);
      case 'file':
        return dirEntries.filter((de) => de.isFile()).map((de) => de.name);
      case 'all':
      default:
        return dirEntries.map((de) => de.name);
    }
  },
  async createDir(dir: string, options: { recursive?: boolean } | number | string = { recursive: true }) {
    if (!this.exists(dir)) await mkdir(dir, options);
  },
  async writeBinary(path: string, data: Buffer) {
    const dir = this.parse(path).dir;
    try {
      if (!!dir && !this.exists(dir)) await this.createDir(dir);
      await writeFile(path, data, 'binary');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async writeText(path: string, data: string) {
    const dir = this.parse(path).dir;
    try {
      if (!!dir && !this.exists(dir)) await this.createDir(dir);
      await writeFile(path, data, 'utf8');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async writeJson(path: string, data: object) {
    const dir = this.parse(path).dir;
    try {
      if (!!dir && !this.exists(dir)) await this.createDir(dir);
      await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async appendBinary(path: string, data: Buffer) {
    const dir = this.parse(path).dir;
    try {
      if (!!dir && !this.exists(dir)) await this.createDir(dir);
      if (!this.exists(path)) await this.writeBinary(path, data);
      else await appendFile(path, data, 'binary');
    } catch (e) {
      throw Error(`Failed to append data to binary file: ${path}`);
    }
  },
  async appendText(path: string, data: string) {
    const dir = this.parse(path).dir;
    try {
      if (!!dir && !this.exists(dir)) await this.createDir(dir);
      if (!this.exists(path)) await this.writeText(path, data);
      else await appendFile(path, data, 'utf8');
    } catch (e) {
      throw Error(`Failed to append data to text file: ${path}`);
    }
  },
  async readBinary(path: string) {
    try {
      const data = await readFile(path);
      return data;
    } catch (e) {
      throw Error(`Failed to read binary file: ${path}`);
    }
  },
  async readText(path: string) {
    try {
      const data = await readFile(path, { encoding: 'utf8' });
      return data;
    } catch (e) {
      throw Error(`Failed to read text file: ${path}`);
    }
  },
  async readJson<T = unknown>(path: string): Promise<T> {
    try {
      const data = await readFile(path, { encoding: 'utf8' });
      return JSON.parse(data);
    } catch (e) {
      throw Error(`Failed to read JSON file: ${path}`);
    }
  },
  async delete(path: string) {
    if (!this.exists(path)) return;
    try {
      await unlink(path);
    } catch (e) {
      throw Error(`Failed to delete file or folder: ${path}`);
    }
  },
  rename: rename,
  exists: nodeFs.existsSync,
  createWriteStream: async (path: string) => {
    const dir = parse(path).dir;
    const dirExists = fs.exists(dir);
    if (!dirExists) await fs.createDir(dir);
    return nodeFs.createWriteStream(path);
  },
  streamWrite: (stream: WriteStream, contents: Buffer) => {
    return new Promise<void>((resolve, reject) => stream.write(contents, (err) => (err ? reject(err) : resolve())));
  },
  streamClose: (stream: WriteStream) => {
    return new Promise<void>((resolve) => {
      stream.end(() => {
        stream.close();
        stream.destroy();
        setTimeout(() => resolve(), 50);
      });
    });
  },
};

export default fs;

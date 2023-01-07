import { createWriteStream, existsSync, WriteStream } from 'node:fs';
import { appendFile, mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { cwd } from 'node:process';
import { homedir, tmpdir } from 'node:os';

const fs = {
  appDir: cwd(),
  homeDir: homedir(),
  tempDir: tmpdir(),
  join(...paths: string[]) {
    return join(...paths);
  },
  parse(path: string) {
    return parse(path);
  },
  async readDir(dir: string) {
    return readdir(dir);
  },
  async createDir(dir: string, recursive = true) {
    if (!this.exists(dir)) await mkdir(dir, { recursive });
  },
  async writeBinary(path: string, data: Buffer) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      await writeFile(path, data, 'binary');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async writeText(path: string, data: string) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      await writeFile(path, data, 'utf8');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async writeJson(path: string, data: object) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async appendBinary(path: string, data: Buffer) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      if (!this.exists(path)) await this.writeBinary(path, data);
      else await appendFile(path, data, 'binary');
    } catch (e) {
      throw Error(`Failed to append data to binary file: ${path}`);
    }
  },
  async appendText(path: string, data: string) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
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
  exists(path: string) {
    return existsSync(path);
  },
  async createWriteStream(path: string) {
    const dir = this.parse(path).dir;
    if (!this.exists(dir)) await this.createDir(dir);
    return createWriteStream(path);
  },
  async streamWrite(stream: WriteStream, data: any) {
    return new Promise<void>((resolve, reject) =>
      stream.write(data, (err) => (err ? reject(err) : resolve()))
    );
  },
  async streamClose(stream: WriteStream) {
    return new Promise<void>((resolve, reject) => {
      stream.end(() => {
        stream.close();
        stream.destroy();
        setTimeout(() => resolve(), 50);
      });
    });
  },
};

export default fs;

import { cwd } from 'node:process';
import { homedir, tmpdir } from 'node:os';
import nodeFs from 'node:fs';
import type { WriteStream } from 'node:fs';
import {
  access,
  appendFile,
  mkdir,
  readdir,
  readFile,
  rmdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { join, parse } from 'node:path';

export enum BaseDirectory {
  Audio = 1,
  Cache,
  Config,
  Data,
  LocalData,
  Desktop,
  Document,
  Download,
  Executable,
  Font,
  Home,
  Picture,
  Public,
  Runtime,
  Template,
  Video,
  Resource,
  App,
  Log,
  Temp,
  AppConfig,
  AppData,
  AppLocalData,
  AppCache,
  AppLog,
}

interface FsOptions {
  dir?: BaseDirectory;
}

interface FsDirOptions extends FsOptions {
  recursive?: boolean;
}

const getBaseDirectory = (dir?: BaseDirectory) => {
  switch (dir) {
    case BaseDirectory.App:
      return cwd();
    case BaseDirectory.Home:
      return homedir();
    case BaseDirectory.Temp:
      return tmpdir();
    default:
      return cwd();
      break;
  }
};

export const copyFile = async () => {
  // TODO: Implement
};

export const createDir = async (dir: string, options?: FsDirOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    await access(join(baseDir, dir));
  } catch (e) {
    await mkdir(join(baseDir, dir), { recursive: options?.recursive || true });
  }
};

export const exists = async (path: string, options?: FsOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    await access(join(baseDir, path));
    return true;
  } catch (e) {
    return false;
  }
};

export const readBinaryFile = async (filePath: string, options?: FsOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    return readFile(join(baseDir, filePath));
  } catch (e) {
    throw Error(`Failed to read binary file: ${filePath}`);
  }
};

export const readDir = async (dir: string, options?: FsDirOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    return readdir(join(baseDir, dir));
  } catch (e) {
    throw Error(`Failed to read directory: ${dir}`);
  }
};

export const readTextFile = async (filePath: string, options?: FsOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    return readFile(join(baseDir, filePath), { encoding: 'utf8' });
  } catch (e) {
    throw Error(`Failed to read text file: ${filePath}`);
  }
};

export const readJsonFile = async <T = unknown>(
  filePath: string,
  options?: FsOptions
): Promise<T> => {
  const data = await readTextFile(filePath, options);
  return JSON.parse(data);
};

export const removeDir = async (dir: string, options?: FsDirOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    return rmdir(join(baseDir, dir), { recursive: options?.recursive });
  } catch (e) {
    throw Error(`Failed to remove directory: ${dir}`);
  }
};

export const removeFile = async (file: string, options?: FsOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    await unlink(join(baseDir, file));
  } catch (e) {
    throw Error(`Failed to remove file: ${file}`);
  }
};

export const renameFile = async () => {
  // TODO: Implement
};

export const writeBinaryFile = async (path: string, contents: Buffer, options?: FsOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    await writeFile(join(baseDir, path), contents, 'binary');
  } catch (e) {
    throw Error(`Failed to write binary to file: ${path}`);
  }
};

export const writeTextFile = async (path: string, contents: string, options?: FsOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    await writeFile(join(baseDir, path), contents, 'utf8');
  } catch (e) {
    throw Error(`Failed to write text to file: ${path}`);
  }
};

export const writeJsonFile = async (path: string, contents: object, options?: FsOptions) => {
  await writeTextFile(path, JSON.stringify(contents, null, 2), options);
};

export const appendBinaryFile = async (path: string, contents: Buffer, options?: FsOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    await appendFile(join(baseDir, path), contents, 'binary');
  } catch (e) {
    throw Error(`Failed to write binary to file: ${path}`);
  }
};

export const appendTextFile = async (path: string, contents: string, options?: FsOptions) => {
  const baseDir = getBaseDirectory(options?.dir);
  try {
    await appendFile(join(baseDir, path), contents, 'utf8');
  } catch (e) {
    throw Error(`Failed to write binary to file: ${path}`);
  }
};

export const createWriteStream = async (path: string) => {
  const dir = parse(path).dir;
  const dirExists = exists(dir);
  if (!dirExists) await createDir(dir);
  return nodeFs.createWriteStream(path);
};

export const writeStream = (stream: WriteStream, contents: Buffer) => {
  return new Promise<void>((resolve, reject) =>
    stream.write(contents, (err) => (err ? reject(err) : resolve()))
  );
};

export const closeStream = (stream: WriteStream) => {
  return new Promise<void>((resolve) => {
    stream.end(() => {
      stream.close();
      stream.destroy();
      setTimeout(() => resolve(), 50);
    });
  });
};

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
  exists: nodeFs.existsSync,
  createWriteStream,
  streamWrite: writeStream,
  streamClose: closeStream,
};

export default fs;

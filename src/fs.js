'use strict';

const { existsSync, createWriteStream } = require('node:fs');
const { readdir, mkdir, writeFile, appendFile, readFile, unlink } = require('node:fs/promises');
const { join, parse } = require('node:path');
const { cwd } = require('node:process');
const { homedir, tmpdir } = require('node:os');

const fs = {
  appDir: cwd(),
  homeDir: homedir(),
  tempDir: tmpdir(),
  join(...paths) {
    return join(...paths);
  },
  parse(path) {
    return parse(path);
  },
  async readDir(dir) {
    return readdir(dir);
  },
  async createDir(dir, recursive = true) {
    if (!this.exists(dir)) await mkdir(dir, { recursive });
  },
  async writeBinary(path, data) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      await writeFile(path, data, 'binary');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async writeText(path, data) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      await writeFile(path, data, 'utf8');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async writeJson(path, data) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      throw Error(`Failed to save data to file: ${path}`);
    }
  },
  async appendBinary(path, data) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      if (!this.exists(path)) await this.writeBinary(path, data);
      else await appendFile(path, data, 'binary');
    } catch (e) {
      throw Error(`Failed to append data to binary file: ${path}`);
    }
  },
  async appendText(path, data) {
    const dir = this.parse(path).dir;
    try {
      if (!this.exists(dir)) await this.createDir(dir);
      if (!this.exists(path)) await this.writeText(path, data);
      else await appendFile(path, data, 'utf8');
    } catch (e) {
      throw Error(`Failed to append data to text file: ${path}`);
    }
  },
  async readBinary(path) {
    try {
      const data = await readFile(path);
      return data;
    } catch (e) {
      throw Error(`Failed to read binary file: ${path}`);
    }
  },
  async readText(path) {
    try {
      const data = await readFile(path, { encoding: 'utf8' });
      return data;
    } catch (e) {
      throw Error(`Failed to read text file: ${path}`);
    }
  },
  async readJson(path) {
    try {
      const data = await readFile(path, { encoding: 'utf8' });
      return JSON.parse(data);
    } catch (e) {
      throw Error(`Failed to read JSON file: ${path}`);
    }
  },
  async delete(path) {
    if (!this.exists(path)) return;
    try {
      await unlink(path);
    } catch (e) {
      throw Error(`Failed to delete file or folder: ${path}`);
    }
  },
  exists(path) {
    return existsSync(path);
  },
  async createWriteStream(path) {
    const dir = this.parse(path).dir;
    if (!this.exists(dir)) await this.createDir(dir);
    return createWriteStream(path);
  },
  async streamWrite(stream, data) {
    return new Promise((resolve, reject) =>
      stream.write(data, (err) => (err ? reject(err) : resolve()))
    );
  },
  async streamClose(stream) {
    return new Promise((resolve, reject) => {
      stream.end(() => {
        stream.close();
        stream.destroy();
        setTimeout(() => resolve(), 50);
      });
    });
  },
};

module.exports = fs;

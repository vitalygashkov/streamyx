import { arch, platform } from 'node:process';
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { chmodSync } from 'node:fs';
import { delimiter } from 'node:path';
import { stat } from 'node:fs/promises';
import { logger } from './logger';
import fs from './fs';

export const getAnyValidPath = async (paths: string[]) => {
  const getPathStat = (p: string) =>
    stat(p)
      .catch(() => null)
      .then((s) => (s ? p : null));
  return await Promise.any(paths.map(getPathStat)).catch(() => null);
};

const findExecutable = async (exe: string) => {
  const envPath = process.env.PATH || '';
  const envExt = process.env.PATHEXT || '';
  const pathDirs = envPath.replace(/["]+/g, '').split(delimiter).filter(Boolean);
  const extensions = envExt.split(';');
  const candidates = pathDirs.flatMap((d) => extensions.map((ext) => fs.join(d, exe + ext)));
  try {
    return await Promise.any(candidates.map(checkFileExists));
  } catch (e) {
    return null;
  }
  async function checkFileExists(filePath: string) {
    if ((await stat(filePath)).isFile()) return filePath;
    throw new Error('Not a file');
  }
};

export const findPath = async (name: string) => {
  const filesDir = fs.join(fs.appDir, 'files');
  if (!fs.exists(filesDir)) await fs.createDir(filesDir, 0o755);

  const files = await fs.readDir(filesDir);
  const localPath = fs.join(filesDir, name + (platform === 'win32' ? '.exe' : ''));
  if (fs.exists(localPath)) return localPath;

  const similarFileName = files.find((f) => f.includes(name));
  const similarFilePath = similarFileName ? fs.join(filesDir, similarFileName) : null;
  if (similarFilePath && fs.exists(similarFilePath)) return similarFilePath;

  const globalPath = await findExecutable(name);
  if (globalPath && fs.exists(globalPath)) return globalPath;

  return null;
};

export const withOutput = (
  process: ChildProcessWithoutNullStreams,
  log: Pick<typeof console, 'debug'> = logger
) => {
  const handler = (message: string) => message && log.debug(message.trim());
  process.stdout.setEncoding('utf8');
  process.stdout.on('data', handler);
  process.stderr.setEncoding('utf8');
  process.stderr.on('data', handler);
};

export const logSpawn = (command: string, args: string[]) => {
  logger.debug(
    `${command} ${args.map((s) => (s.startsWith('-') ? s : `"${s.replaceAll('"', '\\"')}"`)).join(' ')}`
  );
};

export interface BinaryNamesByArch {
  x64: string;
  arm64?: string;
}

export interface BinaryNamesByPlatform {
  linux?: BinaryNamesByArch;
  darwin?: BinaryNamesByArch;
  win32?: BinaryNamesByArch;
}

const getBinaryName = (names: BinaryNamesByPlatform) => {
  const name = names[platform as keyof BinaryNamesByPlatform]?.[arch as 'x64' | 'arm64'] || null;
  if (!name) {
    const archList: BinaryNamesByArch[] = Object.values(names);
    const archItem = archList.find((item) => item.x64 || item.arm64);
    throw new Error(
      `Unsupported platform (${platform}/${arch}) for binary ${archItem?.x64 || archItem?.arm64}`
    );
  }
  return name;
};

interface GitHubUrlOptions {
  repo: string;
  version: string;
  asset: string;
}

const getGitHubAssetUrl = ({ repo, version, asset }: GitHubUrlOptions) => {
  return `https://github.com/${repo}/releases/download/${version}/${asset}`;
};

export const download = async (url: string, outputPath: string) => {
  // Curl args:
  const args = [
    '-L', // follow redirects
    '-f', // fail if the request fails
    // output destination:
    '-o',
    outputPath,
    '--show-error', // show errors
    '--silent', // but no progress bar
    url,
  ];
  // Now fetch the binary and fail the script if that fails:
  logger.debug(`Downloading ${url} to ${outputPath}`);
  const process = spawn('curl', args, { stdio: 'inherit' });
  const code = await new Promise<number | null>((resolve) => process.on('exit', resolve));
  if (code != 0) throw new Error('Download of ' + url + ' failed: ' + code);
};

interface DownloadBinaryOptions extends Omit<GitHubUrlOptions, 'asset'> {
  id: string;
  assets: BinaryNamesByPlatform;
}

export const downloads = {
  state: new Map<string, 'downloading' | 'finished'>(),
  paths: new Map<string, string>(),
};

export const isDownloading = (id: string) => downloads.state.get(id) === 'downloading';

export const waitForDownload = async (id: string) => {
  while (isDownloading(id)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return downloads.paths.get(id) || null;
};

export const fetchGitHubAsset = async ({ id, assets, repo, version }: DownloadBinaryOptions) => {
  const name = getBinaryName(assets);
  const output = fs.join(fs.appDir, 'files', name);
  downloads.state.set(id, 'downloading');
  const url = getGitHubAssetUrl({ repo, version, asset: name });
  await download(url, output);
  chmodSync(output, 0o755);
  downloads.paths.set(id, output);
  downloads.state.set(id, 'finished');
  return output;
};

export const useBinary = async (
  name: string,
  downloadFn?: (name: string) => string | Promise<string>
) => {
  let binaryPath = await findPath(name);
  if (!binaryPath) {
    if (downloads.paths.has(name)) binaryPath = downloads.paths.get(name)!;
    else if (isDownloading(name)) binaryPath = await waitForDownload(name);
    binaryPath =
      binaryPath && fs.exists(binaryPath) ? binaryPath : (await downloadFn?.(name)) || null;
  }
  if (!binaryPath || !fs.exists(binaryPath))
    throw new Error(`Required package is missing: ${name}`);
  return binaryPath;
};

export const bin = {
  get: useBinary,
  fetchGitHubAsset,
  getAnyValidPath,
  findPath,
  withOutput,
  logSpawn,
};

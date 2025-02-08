const fsp = require('node:fs/promises');
const path = require('node:path');
const metavm = require('metavm');

const { COMMON_CONTEXT } = metavm;

const findAllScripts = async (moduleDir) => {
  const findScripts = async (dir) => {
    const files = await fsp.readdir(dir, { withFileTypes: true });
    const jsFiles = await Promise.all(
      files.map(async (file) => {
        const isJs = file.name.endsWith('.js');
        const isTest = file.name.endsWith('.test.js');
        if (file.isDirectory() && file.name !== 'node_modules') {
          return findScripts(path.join(dir, file.name));
        } else if (file.isFile() && isJs && !isTest) {
          return [path.join(dir, file.name)];
        } else {
          return [];
        }
      }),
    );
    return jsFiles.flat();
  };
  return findScripts(moduleDir);
};

const load = async (scriptPath, options = {}) => {
  const access = {};
  if (options.dirname) {
    const allowedFiles = await findAllScripts(options.dirname);
    for (const file of allowedFiles)
      access[file.replace(options.dirname, '.')] = true;
  }
  const readScriptOptions = {
    context: metavm.createContext({
      ...COMMON_CONTEXT,
      ...options.context,
      structuredClone,
      crypto,
    }),
    dirname: options.dirname,
    access: {
      'node:crypto': true,
      crypto: true,
      '@streamyx/api': true,
      ...access,
      ...options.access,
    },
    type:
      options.format === 'esm'
        ? metavm.MODULE_TYPE.ECMA
        : metavm.MODULE_TYPE.COMMONJS,
  };
  const script = await metavm.readScript(scriptPath, readScriptOptions);
  return script;
};

const create = (src, name = 'Eval') => {
  try {
    const script = metavm.createScript(name, src);
    return script;
  } catch (e) {
    console.error(`Syntax Error: ${e.message}`);
    return null;
  }
};

module.exports = { load, create };

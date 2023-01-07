import { platform, arch, version } from 'node:process';

const formatArgLabel = (rawLabel: string) => {
  const labelParts = rawLabel
    .replace(/--/g, '-')
    .split('-')
    .filter((i) => !!i);
  return labelParts
    .map((word, index) => (index > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join('');
};

class Args {
  #argv;
  #data: {
    arguments: { name: string; description: string }[];
    options: { flags: string; description: string; defaultValue?: string }[];
    name?: string;
    description?: string;
    version?: string;
  };
  parsed;

  constructor(argv = process.argv.slice(2)) {
    this.parsed = false;
    this.#argv = argv;
    this.#data = { arguments: [], options: [] };
  }

  setName(name: string) {
    this.#data.name = name;
    return this;
  }

  setDescription(description: string) {
    this.#data.description = description;
    return this;
  }

  setVersion(version: string) {
    this.#data.version = version;
    return this;
  }

  setArgument(name: string, description: string) {
    this.#data.arguments.push({ name, description });
    return this;
  }

  setOption(flags: string, description: string, defaultValue?: string | number | boolean) {
    this.#data.options.push({ flags, description, defaultValue });
    return this;
  }

  parse(indexOfNamelessArg = -1) {
    if (!this.#argv.length) return this;
    const isNamelessArgAtBegin = this.#argv[0][0] !== '-';
    if (!isNamelessArgAtBegin) {
      this._ = [this.#argv.at(indexOfNamelessArg)];
      this.#argv.splice(indexOfNamelessArg, 1);
    }

    const parsedArgs: Record<string, string | number | boolean | string[]> = {};
    const argv = this.#argv;

    for (let i = 0; i < argv.length; i++) {
      const argument = argv[i];
      const previousArgument = argv[i - 1];
      const nextArgument = argv[i + 1];
      const isLabel = argv[i][0] === '-';

      if (isLabel) {
        const isLabelHasValue = nextArgument?.[0] !== undefined && nextArgument?.[0] !== '-';
        const label = formatArgLabel(argument);
        const value = isLabelHasValue ? nextArgument : true;
        parsedArgs[label] = value;
      } else {
        const isValueHasLabel = previousArgument?.[0] === '-';
        if (!isValueHasLabel)
          parsedArgs._ = Array.isArray(parsedArgs._) ? [...parsedArgs._, argument] : [argument];
      }
    }

    Object.keys(parsedArgs).forEach((key) => (this[key] = parsedArgs[key]));
    this.parsed = true;

    const hasArgs = parsedArgs ? Object.keys(parsedArgs).length > 0 : false;
    if (!hasArgs || 'h' in this || 'help' in this) this.outputHelp();
    if ('v' in this || 'version' in this) this.outputVersion();

    return this;
  }

  outputHelp() {
    this.outputDescription();
    this.outputVersion();
    this.outputUsage();
    this.outputArguments();
    this.outputOptions();
    process.exit(1);
  }

  outputDescription() {
    if (this.#data.description) console.log(`${this.#data.name}: ${this.#data.description}\n`);
  }

  outputUsage() {
    console.log(`\x1b[1mUSAGE\x1b[0m`);
    let message = `  $ ${this.#data.name} `;
    if (this.#data.options.length) message += `[OPTIONS] `;
    if (this.#data.arguments.length) message += this.#data.arguments.map((a) => a.name).join(' ');
    console.log(`${message}\n`);
  }

  outputArguments() {
    if (!this.#data.arguments.length) return;
    console.log(`\x1b[1mARGUMENTS\x1b[0m`);
    for (const argument of this.#data.arguments) {
      console.log(`  ${argument.name}  ${argument.description}\n`);
    }
  }

  outputOptions() {
    if (this.#data.options) {
      console.log(`\x1b[1mOPTIONS\x1b[0m`);
      this.#data.options.forEach((option) =>
        console.log(`  ${option.flags.padEnd(20)}  ${option.description}`)
      );
    }
  }

  outputVersion() {
    console.log(`\x1b[1mVERSION\x1b[0m`);
    console.log(`  ${this.#data.name}/${this.#data.version} ${platform}-${arch} node-${version}\n`);
  }
}

const pushOrSet = (obj, key, value) => {
  if (Array.isArray(obj[key])) obj[key].push(value);
  else obj[key] = value;
};

const parseFlag = (parsed, args, currentIndex, opt, flag) => {
  if (opt.type === Boolean) {
    pushOrSet(parsed, opt.name, true);
  } else {
    const nextValue = args[++currentIndex];
    if (nextValue === undefined) {
      if (opt.optionalValue) {
        pushOrSet(parsed, opt.name, true);
      } else {
        throw new Error(`missing value for ${flag}`);
      }
    } else {
      pushOrSet(parsed, opt.name, opt.type(nextValue));
    }
  }
  return currentIndex;
};

const parsePositional = (parsed, args, currentIndex, opt) => {
  if (!opt.multiple) {
    parsed[opt.name] = opt.type(args[currentIndex]);
    return currentIndex;
  }

  const values = [opt.type(args[currentIndex])];

  for (let i = currentIndex + 1; i < args.length; i++) {
    const value = args[i];
    if (value && value[0] === '-' && opt.multiple !== 'include-flags') {
      break;
    } else if (value) {
      currentIndex += 1;
      values.push(opt.type(value));
    }
  }

  parsed[opt.name] = values;
  return currentIndex;
};

// -abc 1 => -a -b -c 1
const splitShortFlags = (arg) => {
  if (/^-[a-zA-Z]/.test(arg)) {
    return arg
      .slice(1)
      .split('')
      .map((flag) => `-${flag}`);
  }
  return [arg];
};

const parse = (args, options) => {
  const parsed = { _: [] };
  let stopped = false;

  // when `option.when` returns false, they will be skipped
  const skippedPositionalArgs = new Set();

  args = args.reduce((res, arg) => {
    if (arg[0] === '-') {
      let equalSignIndex = arg.indexOf('=');
      if (equalSignIndex > 0) {
        res.push(...splitShortFlags(arg.slice(0, equalSignIndex)), arg.slice(equalSignIndex + 1));
      } else {
        res.push(...splitShortFlags(arg));
      }
    } else {
      res.push(arg);
    }
    return res;
  }, []);

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const flagName = flag.replace(/^-{1,2}/, '');
    if (stopped) {
      parsed._.push(flag);
      continue;
    }
    if (flag.startsWith('-')) {
      const opt = options.find(
        (o) =>
          !o.positional &&
          (o.name === flagName || o.flags?.includes(flagName)) &&
          (!o.when || o.when(parsed))
      );
      if (opt) {
        if (opt.multiple) {
          parsed[opt.name] = parsed[opt.name] || [];
        }
        i = parseFlag(parsed, args, i, opt, flag);
        if (opt.stop) {
          stopped = true;
        }
      } else {
        throw new Error(`unknown flag: ${flag}`);
      }
    } else {
      const opt = options.find((o) => {
        return (
          o.positional &&
          parsed[o.name] === undefined &&
          (!o.when || o.when(parsed) || !skippedPositionalArgs.add(o.name))
        );
      });
      if (opt) {
        i = parsePositional(parsed, args, i, opt);
        if (opt.stop) {
          stopped = true;
        }
      } else {
        throw new Error(`unknown positional argument: ${flag}`);
      }
    }
  }

  // check required positional arguments
  for (const opt of options) {
    if (
      opt.positional &&
      !opt.optionalValue &&
      parsed[opt.name] === undefined &&
      !skippedPositionalArgs.has(opt.name)
    ) {
      if (opt.when && !opt.when(parsed)) {
        continue;
      }
      throw new Error(`missing positional argument: ${opt.name}`);
    }
  }

  return parsed;
};

export { Args, parse };

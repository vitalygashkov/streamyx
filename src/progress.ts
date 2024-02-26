import { EventEmitter } from 'node:events';
import { stdout } from 'node:process';

interface ProgressOptions {
  id?: string;
  size?: number;
  label?: string;
  prefix?: string;
  manifestUrl?: string;
  filename?: string;
  track?: any;
  state?: string;
}

interface ProgressUpdateInfo {
  id?: string;
  size?: number;
  current?: number;
  percents?: number;
  label?: string;
  manifestUrl?: string;
  filename?: string;
  track?: any;
  state?: string;
}

class Progress extends EventEmitter {
  id?: string;
  label: string;
  size: number;
  sizeChars: number;
  current: number;
  stopped: boolean;
  manifestUrl: string;
  filename: string;
  track: any;
  state: string;
  prefix = '[INFO]';

  constructor({
    id,
    size = 0,
    label = '',
    prefix,
    track = {},
    state = 'idle',
  }: ProgressOptions = {}) {
    super();
    this.id = id;
    this.size = size;
    this.label = label;
    this.sizeChars = 50;
    this.current = 0;
    this.stopped = false;
    this.manifestUrl = '';
    this.filename = '';
    this.track = track;
    this.state = state;
    if (prefix) this.setPrefix(prefix);
  }

  setSize(size: number) {
    this.size = size;
  }

  setPrefix(prefix: string) {
    this.prefix = prefix;
  }

  increase(value = 1) {
    this.update(this.current + value);
  }

  update(progress: number) {
    if (this.stopped) return;
    if (progress) this.current = progress;
    else this.current++;
    const progressPercents = parseInt(((this.current * 100) / this.size).toFixed(0));
    const progressChars = parseInt(((this.current * this.sizeChars) / this.size).toFixed(0));
    const emptyRepeatTimes = progressChars > this.sizeChars ? 0 : this.sizeChars - progressChars;
    const dots = '█'.repeat(progressChars);
    const empty = '▒'.repeat(emptyRepeatTimes);
    const label = this.label ? ` ${this.label} ` : ' ';
    stdout.write(`\r${this.prefix}${label}${dots}${empty} ${progressPercents}%`);
    this.state = this.current >= this.size ? 'finished' : 'downloading';
    this.emit('progress', {
      id: this.id,
      size: this.size,
      current: this.current,
      percents: progressPercents,
      label,
      manifestUrl: this.manifestUrl,
      filename: this.filename,
      track: this.track,
      state: this.state,
    });
    if (this.current >= this.size) this.reset({ state: this.state });
  }

  reset({
    id,
    size = 0,
    label = '',
    prefix,
    manifestUrl = '',
    filename = '',
    track = {},
    state = 'idle',
  }: ProgressOptions = {}) {
    if (!id) stdout.write(`\n`);
    this.id = id;
    this.size = size;
    this.label = label;
    this.sizeChars = 50;
    this.current = 0;
    this.stopped = false;
    this.manifestUrl = manifestUrl;
    this.filename = filename;
    this.track = track;
    this.state = state;
    if (prefix) this.setPrefix(prefix);
  }

  stop() {
    stdout.write(`\n`);
    this.stopped = true;
  }

  listen(listener: (info: ProgressUpdateInfo) => void) {
    this.addListener('progress', listener);
  }
}

const progress = new Progress();

export type { ProgressOptions, ProgressUpdateInfo };
export { Progress, progress };

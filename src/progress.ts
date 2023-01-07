import { stdout } from 'node:process';

class Progress {
  label: string;
  size: number;
  sizeChars: number;
  current: number;
  stopped: boolean;
  prefix = '[INFO]';

  constructor({
    size = 0,
    label = '',
    prefix,
  }: { size?: number; label?: string; prefix?: string } = {}) {
    this.size = size;
    this.label = label;
    this.sizeChars = 50;
    this.current = 0;
    this.stopped = false;
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
    if (this.current >= this.size) this.reset();
  }

  reset() {
    stdout.write(`\n`);
    this.sizeChars = 50;
    this.current = 0;
    this.stopped = false;
  }

  stop() {
    stdout.write(`\n`);
    this.stopped = true;
  }
}

module.exports = { Progress };

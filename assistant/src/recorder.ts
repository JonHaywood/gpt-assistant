// Copied from node-record-lpcm16 npm package
// Repository: https://github.com/gillesdemey/node-record-lpcm16/blob/master/index.js
import assert from 'assert';
import Debug from 'debug';
import {
  spawn,
  ChildProcessWithoutNullStreams,
  StdioPipeNamed,
} from 'child_process';

const debug = Debug('record');

class Recording {
  private options: {
    sampleRate: number;
    channels: number;
    compress: boolean;
    threshold: number;
    thresholdStart: null | number;
    thresholdEnd: null | number;
    silence: string;
    recorder: string;
    endOnSilence: boolean;
    audioType: string;
  };
  private cmd: string;
  private args: string[];
  private cmdOptions: { stdio: StdioPipeNamed };
  private process: ChildProcessWithoutNullStreams | null;
  private _stream: any;

  constructor(
    options: {
      sampleRate?: number;
      channels?: number;
      compress?: boolean;
      threshold?: number;
      thresholdStart?: null | number;
      thresholdEnd?: null | number;
      silence?: string;
      recorder?: string;
      endOnSilence?: boolean;
      audioType?: string;
      bufferSize?: number;
    } = {},
  ) {
    const defaults = {
      sampleRate: 16000,
      channels: 1,
      compress: false,
      threshold: 0.5,
      thresholdStart: null,
      thresholdEnd: null,
      silence: '1.0',
      recorder: 'sox',
      endOnSilence: false,
      audioType: 'wav',
      bufferSize: null,
    };

    this.options = { ...defaults, ...options };

    const { cmd, args } = arecord_recorder(this.options);

    this.cmd = cmd;
    this.args = args;
    this.cmdOptions = { stdio: 'pipe' };

    debug(`Started recording`);
    debug(this.options);
    debug(` ${this.cmd} ${this.args.join(' ')}`);

    return this.start();
  }

  private start() {
    const { cmd, args, cmdOptions } = this;

    const cp = spawn(cmd, args, cmdOptions);
    const rec = cp.stdout;
    const err = cp.stderr;

    this.process = cp; // expose child process
    this._stream = rec; // expose output stream

    cp.on('close', (code) => {
      if (code === 0) return;
      rec.emit(
        'error',
        `${this.cmd} has exited with error code ${code}.\n\nEnable debugging with the environment variable DEBUG=record.`,
      );
    });

    err.on('data', (chunk) => {
      debug(`STDERR: ${chunk}`);
    });

    rec.on('data', (chunk) => {
      debug(`Recording ${chunk.length} bytes`);
    });

    rec.on('end', () => {
      debug('Recording ended');
    });

    return this;
  }

  public stop() {
    assert(this.process, 'Recording not yet started');

    this.process!.kill();
  }

  public pause() {
    assert(this.process, 'Recording not yet started');

    this.process!.kill('SIGSTOP');
    this._stream.pause();
    debug('Paused recording');
  }

  public resume() {
    assert(this.process, 'Recording not yet started');

    this.process!.kill('SIGCONT');
    this._stream.resume();
    debug('Resumed recording');
  }

  public isPaused() {
    assert(this.process, 'Recording not yet started');

    return this._stream.isPaused();
  }

  public stream() {
    assert(this._stream, 'Recording not yet started');

    return this._stream;
  }
}

export const record = (...args: any[]) => new Recording(...args);

// Copied from node-record-lpcm16 npm package
// Repository: https://github.com/gillesdemey/node-record-lpcm16/blob/master/recorders/arecord.js
const arecord_recorder = (options: any) => {
  const cmd = 'arecord';

  const args = [
    '-q', // show no progress
    '-r',
    options.sampleRate, // sample rate
    '-c',
    options.channels, // channels
    '-t',
    options.audioType, // audio type
    '-f',
    'S16_LE', // Sample format
    '-', // pipe
  ];

  if (options.bufferSize) {
    args.unshift('--buffer-size=' + options.bufferSize);
  }

  if (options.device) {
    args.unshift('-D', options.device);
  }

  return { cmd, args };
};

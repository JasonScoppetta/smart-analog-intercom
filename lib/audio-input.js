const { nonstandard } = require("wrtc");
const { spawn, exec } = require("child_process");
const { promisify } = require("util");

const { RTCAudioSource } = nonstandard;

class NodeWebRtcAudioSource extends RTCAudioSource {
  constructor({ callback }) {
    super();
    this.ps = null;
    this.cache = Buffer.alloc(0);
    this.callback = callback;
  }

  createTrack() {
    const track = super.createTrack();
    if (this.ps === null) {
      this.start();
    }
    return track;
  }

  async start() {
    if (this.ps !== null) {
      this.stop(); // stop existing process
    }
    this.ps = spawn("rec", [
      "-q",
      "-b",
      16,
      "-r",
      48000,
      "-e",
      "signed",
      "-c",
      1,
      "-t",
      "raw",
      "--buffer",
      1920,
      "-",
      // "noisered",
      // "/home/pi/intercom/noise.prof",
      // 0.15,
    ]);
    this.ps.stdout.on("data", (buffer) => {
      this.cache = Buffer.concat([this.cache, buffer]);
    });
    const processData = () => {
      while (this.cache.length > 960) {
        const buffer = this.cache.slice(0, 960);
        this.cache = this.cache.slice(960);
        const samples = new Int16Array(new Uint8Array(buffer).buffer);
        const dd = {
          bitsPerSample: 16,
          sampleRate: 48000,
          channelCount: 1,
          numberOfFrames: samples.length,
          type: "data",
          samples,
        };
        this.onData(dd);
        if (this.callback) this.callback(dd, buffer);
      }
      if (this.ps !== null) {
        setTimeout(() => processData(), 10);
      }
    };
    processData();
  }

  stop() {
    if (this.ps !== null) {
      this.ps.kill("SIGTERM");
      this.ps = null;
    }
  }
}

exports.default = NodeWebRtcAudioSource;

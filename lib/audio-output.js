const NodeSpeaker = require('speaker');
const Through = require('audio-through');
const util = require('util');

function AudioSpeaker (opts) {
    if (!(this instanceof AudioSpeaker)) {
        return new AudioSpeaker(opts);
    }

    Through.call(this, opts);

    //create node-speaker with default options - the most cross-platform case
    this.speaker = new NodeSpeaker({
        channels: this.channels
    });

    this.pipe(this.speaker);
}

util.inherits(Through, AudioSpeaker);

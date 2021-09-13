"use strict";

const { RTCAudioSink } = require("wrtc").nonstandard;
const Speaker = require("audio-speaker/stream");
const { shared } = require("../shared");
const config = require("../config");
const RTCAudioSource = require("./audio-input").default;
const logger = require("./logger");
const colors = require("colors");

let lBuff = 0;
let lTimes = 0;

function WebRTCTwoWayAudio(intercom) {
  const rtcAudioSource = new RTCAudioSource({
    callback: (data, buffer) => {
      const avg = parseInt(
        data.samples.reduce((a, b) => a + b, 0) / data.samples.length
      );
      if (avg > 0) {
        lTimes++;

        if (lTimes < 25) {
          lBuff += avg;
        } else {
          // sendFrequency(lBuff);
          if (lBuff > config.RINGING_MIN_TRIGGER && !intercom.isAnswered) {
            logger.info(colors.bgYellow(`Ringing enabled ${lBuff}`));

            intercom.setRinging(true);
          }
          lTimes = 0;
          lBuff = 0;
        }
      }
    },
  });

  const track = rtcAudioSource.createTrack();
  const rtcAudioSink = new RTCAudioSink(track);

  const speaker = new Speaker({
    channels: 1, // 1 channel
    bitDepth: 16, // 32-bit samples
    sampleRate: 48000, // 48,000 Hz sample rate
    signed: true,
  });

  function beforeOffer(peerConnection) {
    const dataChannel = peerConnection.createDataChannel("frequency");
    const ringingChannel = peerConnection.createDataChannel("ringing");
    const audioTransceiver = peerConnection.addTransceiver("audio");
    const audioSink = new RTCAudioSink(audioTransceiver.receiver.track);

    const openConnections = intercom.connectionManager.getConnections();

    if (openConnections && openConnections.length) {
      openConnections.forEach((connection) => connection.close());
    }

    // intercom.setRinging(true);

    const onAudioData = ({ samples: { buffer } }) => {
      const buf = Buffer.from(buffer);
      speaker.write(buf);
    };

    audioSink.addEventListener("data", onAudioData);

    const sendFrequency = (frequency) => {
      if (frequency && dataChannel.readyState === "open") {
        dataChannel.send(JSON.stringify(frequency));
        // client.publish("HOME/INTERCOM/AUDIOINTENSITY", frequency);
      }
    };

    rtcAudioSource.start();

    return Promise.all([
      audioTransceiver.sender.replaceTrack(track),
      // videoTransceiver.sender.replaceTrack(videoTransceiver.receiver.track)
    ]);
  }

  return { beforeOffer };
}

module.exports = WebRTCTwoWayAudio;

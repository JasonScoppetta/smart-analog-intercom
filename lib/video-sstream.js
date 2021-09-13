const config = require("../config");
const logger = require("./logger");
const colors = require("colors");
let video_started = false;

let videoStream = {
  camera: null,
  start: async function (app) {
    if (video_started) return;
    video_started = true;

    this.camera = require("raspberry-pi-camera-native");
    const opts = {
      width: config.CAMERA_OUTPUT_WIDTH,
      height: config.CAMERA_OUTPUT_HEIGHT,
      fps: config.CAMERA_OUTPUT_FPS,
      encoding: config.CAMERA_OUTPUT_ENCODING,
      quality: config.CAMERA_OUTPUT_QUALITY,
    };

    this.camera.start(opts);
    logger.info(colors.green("Camera started"));

    app.get(config.CAMERA_RESOURCE_PATH, (req, res) => {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      res.writeHead(200, {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0",
        Pragma: "no-cache",
        Connection: "close",
        "Content-Type": "multipart/x-mixed-replace; boundary=--myboundary",
      });

      logger.info(`Connection to camera stream from ${req.hostname} (${ip})`);

      let isReady = true;
      const frameHandler = (frame) => {
        try {
          if (!isReady) {
            return;
          }

          isReady = false;

          res.write(
            `--myboundary\nContent-Type: image/jpg\nContent-length: ${frame.length}\n\n`
          );
          res.write(frame, function () {
            isReady = true;
          });
          // logger.info(frame.length);
        } catch (error) {
          logger.error(`Unable to send frame: ${error}`);
        }
      };

      const frameEmitter = this.camera.on("frame", frameHandler);

      req.on("close", () => {
        frameEmitter.removeListener("frame", frameHandler);

        logger.info(`Camera stream closed from ${req.hostname} (${ip})`);
      });
    });
  },
  stop: function (cb) {
    this.camera.pause(function () {
      console.log("here im ");
    });
    this.camera.stop(function () {
      console.log("here im ");
    });
  },
};
module.exports = videoStream;

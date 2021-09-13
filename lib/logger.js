const { LOG_ENABLED } = require("../config");
exports.info = (msg) => {
  if (LOG_ENABLED) {
    console.log(msg);
  }
};

exports.error = (msg) => {
  if (LOG_ENABLED) {
    console.error("\x1b[41m\x1b[37m %s \x1b[0m\n", msg);
  }
};

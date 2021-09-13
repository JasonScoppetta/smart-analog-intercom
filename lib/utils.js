const config = require("../config");

exports.delay = async (t, val) => {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(val);
    }, t);
  });
};

exports.getHighLowState = (status) => {
  if (config.GPIO_HIGH_IS_TRUE) return status;
  return !status;
};

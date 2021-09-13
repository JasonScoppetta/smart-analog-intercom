/* Web server */
exports.WEB_SERVER_HOST = "rb-intercom"; // string
exports.WEB_SERVER_PORT = 3000; // int
exports.WEB_SERVER_USE_HTTPS = false; // bool

/* MQTT */

// Host
exports.MQTT_ENABLED = true;
exports.MQTT_HOST = ""; // string
exports.MQTT_USER = ""; // string
exports.MQTT_PASSWORD = ""; // string
exports.MQTT_CONNECTION_TIMEOUT = 10000;
exports.MQTT_CLIENT_ID = "1002";
exports.MQTT_KEEP_ALIVE = 60;

// Status topics

exports.MQTT_DOOR_STATUS_TOPIC = "HOME/INTERCOM/DOOR"; // string
exports.MQTT_ANSWER_STATUS_TOPIC = "HOME/INTERCOM/ANSWER"; // string

// Command topics
exports.MQTT_DOOR_COMMAND_TOPIC = "HOME/INTERCOM/DOOR"; // string
exports.MQTT_ANSWER_COMMAND_TOPIC = "HOME/INTERCOM/ANSWER"; // string
exports.MQTT_RINGING_COMMAND_TOPIC = "HOME/INTERCOM/RINGING"; // string
exports.MQTT_VIDEO_ENABLED_COMMAND_TOPIC = "HOME/INTERCOM/VIDEOENABLED"; // string

// True/False values
exports.MQTT_DOOR_TRUE_VALUE = "1"; // string
exports.MQTT_DOOR_FALSE_VALUE = "0"; // string
exports.MQTT_ANSWER_TRUE_VALUE = "1"; // string
exports.MQTT_ANSWER_FALSE_VALUE = "0"; // string
exports.MQTT_RINGING_TRUE_VALUE = "On"; // string
exports.MQTT_RINGING_FALSE_VALUE = "Off"; // string
exports.MQTT_VIDEO_ENABLED_TRUE_VALUE = "On"; // string
exports.MQTT_VIDEO_ENABLED_FALSE_VALUE = "Off"; // string

// Default values
exports.MQTT_DOOR_DEFAULT_VALUE = "0"; // string
exports.MQTT_ANSWER_DEFAULT_VALUE = "0"; // string
exports.MQTT_RINGING_DEFAULT_VALUE = "Off"; // string
exports.MQTT_VIDEO_ENABLED_DEFAULT_VALUE = "Off"; // string

/* GPIOs */

exports.GPIO_DOOR_RELAY = 37; // int
exports.GPIO_DOOR_RELAY_DEFAULT = false; // bool

exports.GPIO_ANSWER_RELAYS = [32, 36, 38, 40];
exports.GPIO_ANSWER_RELAY_DEFAULTS = [false, false, false, false];

exports.GPIO_ANSWER_RELAY_1 = 32; // int
exports.GPIO_ANSWER_RELAY_1_DEFAULT = false; // bool
exports.GPIO_ANSWER_RELAY_2 = 36; // int
exports.GPIO_ANSWER_RELAY_2_DEFAULT = false; // bool
exports.GPIO_ANSWER_RELAY_3 = 38; // int
exports.GPIO_ANSWER_RELAY_3_DEFAULT = false; // bool
exports.GPIO_ANSWER_RELAY_4 = 40; // int
exports.GPIO_ANSWER_RELAY_4_DEFAULT = false; // bool

/* Camera options */

exports.CAMERA_RESOURCE_PATH = "/camera.mjpg";
exports.CAMERA_OUTPUT_WIDTH = 640;
exports.CAMERA_OUTPUT_HEIGHT = 360;
exports.CAMERA_OUTPUT_FPS = 16;
exports.CAMERA_OUTPUT_ENCODING = "JPEG";
exports.CAMERA_OUTPUT_QUALITY = 4; // int 1 to 10 - less is faster

/* Globals */

exports.LOG_ENABLED = true; // bool
exports.GPIO_HIGH_IS_TRUE = false;
exports.RINGING_MIN_TRIGGER = 3000;
exports.CAMERA_DELAY_AFTER_ANSWER = 500;
exports.OPEN_DOOR_DURATION = 5000;
exports.CALL_DURATION = 1000 * 20;
exports.JWT_SECRET =
  "";

/* USERS */

exports.USERS = [
  { id: "1", user: "user", password: "password" },
  { id: "2", user: "user2", password: "password2" },
];

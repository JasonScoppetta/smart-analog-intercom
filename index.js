"use strict";
const express = require("express");
const process = require("process");
const mqtt = require("mqtt");
const config = require("./config");
const logger = require("./lib/logger");
const colors = require("colors");
const videoStream = require("./lib/video-sstream");
const WebRtcConnectionManager = require("./lib/connections/webrtcconnectionmanager");
const gpiop = require("rpi-gpio").promise;
const cors = require("cors");
const { mount } = require("./lib/connections-api");
const bodyParser = require("body-parser");
const twoAudioWayOptions = require("./lib/webrtc-two-way-audio");
const { shared } = require("./shared");
const { delay, getHighLowState } = require("./lib/utils");
const jwt = require("jsonwebtoken");
/* */

class intercom {
  mqttClient = null;
  server = null;
  expressWs = null;
  connectionManager = null;

  isAnswered = false;
  isRinging = false;

  stopRingingClients = [];

  ringingTimeout = null;

  async setRinging(status) {
    if (status) {
      if (!this.isAnswered) {
        if (true || !this.isRinging) {
          // videoStream.start(app);

          this.mqttPublish(
            config.MQTT_RINGING_COMMAND_TOPIC,
            config.MQTT_RINGING_TRUE_VALUE
          );

          this.isRinging = true;

          console.log("IS SETTING RINGING");

          if (this.ringingTimeout) {
            logger.info("Cleared previous ringing timeout");
            clearTimeout(this.ringingTimeout);
          }

          logger.info(
            `Starting ringing timeout: ${config.CALL_DURATION / 1000} seconds`
          );
          this.ringingTimeout = setTimeout(() => {
            this.hangUp();
            this.isRinging = false;
            // videoStream.start(app);

            this.mqttPublish(
              config.MQTT_RINGING_COMMAND_TOPIC,
              config.MQTT_RINGING_FALSE_VALUE
            );
          }, config.CALL_DURATION);
        }
      }
    }
  }

  async openDoor() {
    logger.info(colors.bgCyan("Door open request"));

    await this.gpioWrite(config.GPIO_DOOR_RELAY, true);
    await delay(config.OPEN_DOOR_DURATION);
    await this.gpioWrite(config.GPIO_DOOR_RELAY, false);
  }

  async answer() {
    await this.gpioWrite(config.GPIO_ANSWER_RELAY_1, true);
    await this.gpioWrite(config.GPIO_ANSWER_RELAY_2, true);
    await this.gpioWrite(config.GPIO_ANSWER_RELAY_3, true);
    await this.gpioWrite(config.GPIO_ANSWER_RELAY_4, true);

    this.mqttPublish(
      config.MQTT_ANSWER_COMMAND_TOPIC,
      config.MQTT_ANSWER_TRUE_VALUE
    );

    this.isAnswered = true;
  }

  async hangUp() {
    logger.info(colors.bgCyan("Hang up"));

    await this.gpioWrite(config.GPIO_ANSWER_RELAY_1, false);
    await this.gpioWrite(config.GPIO_ANSWER_RELAY_2, false);
    await this.gpioWrite(config.GPIO_ANSWER_RELAY_3, false);
    await this.gpioWrite(config.GPIO_ANSWER_RELAY_4, false);

    this.mqttPublish(
      config.MQTT_ANSWER_COMMAND_TOPIC,
      config.MQTT_ANSWER_FALSE_VALUE
    );

    this.stopRingingClients = [];

    this.isAnswered = false;
    this.isRinging = false;
  }

  async gpioWrite(gpio, value) {
    logger.info(
      `GPIO ${String(gpio)} write: (${getHighLowState(value)}) ${colors.bold(
        String(value)
      )}`
    );

    return await gpiop.write(gpio, getHighLowState(value));
  }

  mqttPublish(topic, value) {
    this.mqttClient.publish(topic, value);
  }

  async getUserUsingJWT(token) {
    const decoded = await jwt.verify(token, config.JWT_SECRET);

    if (decoded && decoded.user) {
      return config.USERS.find((u) => u.user === decoded.user) || null;
    }

    return null;
  }

  async setupGPIOs() {
    logger.info(colors.bgMagenta(colors.white(colors.bold("Setup GPIOs"))));

    try {
      logger.info(colors.bold("Door Relay"));

      await gpiop.setup(config.GPIO_DOOR_RELAY, gpiop.DIR_OUT);
      logger.info(
        `GPIO Output ${colors.bold(config.GPIO_DOOR_RELAY)} for ${colors.bold(
          "Door Relay"
        )}.`
      );

      await this.gpioWrite(
        config.GPIO_DOOR_RELAY,
        config.GPIO_DOOR_RELAY_DEFAULT
      );

      logger.info("");
    } catch (err) {
      logger.error("Door Relay: " + err.toString());
      return false;
    }

    try {
      logger.info(colors.bold("Answer relay"));
      for (
        let relayIndex = 0;
        relayIndex < config.GPIO_ANSWER_RELAYS.length;
        relayIndex++
      ) {
        logger.info(
          `GPIO Output ${colors.bold(
            String(config.GPIO_ANSWER_RELAYS[relayIndex])
          )} for ${colors.bold("Answer Relay")}.`
        );

        await gpiop.setup(config.GPIO_ANSWER_RELAYS[relayIndex], gpiop.DIR_OUT);

        await this.gpioWrite(
          config.GPIO_ANSWER_RELAYS[relayIndex],
          config.GPIO_ANSWER_RELAY_DEFAULTS[relayIndex]
        );
      }
    } catch (err) {
      logger.error("Answer Relay GPIO Setup: " + err.toString());
      return false;
    }

    logger.info("");

    return true;
  }

  async setupMqtt() {
    logger.info(
      colors.bgMagenta(
        `Connecting to MQTT server ${colors.bold(config.MQTT_HOST)}`
      )
    );

    // Setup MQTT Client

    this.mqttClient = await mqtt.connect(config.MQTT_HOST, {
      connectTimeout: config.MQTT_CONNECTION_TIMEOUT,
      clientId: config.MQTT_CLIENT_ID,
      keepalive: config.MQTT_KEEP_ALIVE,
      clean: true,
      queueQoSZero: false,
      username: config.MQTT_USER,
      password: config.MQTT_PASSWORD,
    });

    // Setup MQTT events

    this.mqttClient.on("connect", (pck) => {
      logger.info(colors.bgGreen("MQTT client started"));
    });

    this.mqttClient.on("offline", () => {
      logger.error("MQTT disconnected");
    });
  }

  async serverSetup() {
    logger.info(colors.bgMagenta("Startubg Express server"));

    this.server = await express();
    await this.server.use(cors());
    await this.server.use(bodyParser.json());

    await this.server.get("/", (req, res) => res.send("Good to see you!"));

    this.expressWs = require("express-ws")(this.server);

    this.server.post("/signin", (req, res) => {
      const result = { success: false, message: "", jwt: null };

      const username = (req && req.body && req.body.username) || "";
      const password = (req && req.body && req.body.password) || "";

      const user = config.USERS.find((u) => u.user === username);

      if (!user) {
        result.message = "No user found";
      } else {
        if (user.password !== password) {
          result.message = "Wrong credentials";
        } else {
          result.success = true;
          result.jwt = jwt.sign(
            {
              user: username,
            },
            config.JWT_SECRET
          );
        }
      }

      res.send(JSON.stringify(result));
    });

    this.server.post("/check-auth", async (req, res) => {
      const result = { success: false };

      if (req && req.body && req.body.jwt) {
        const user = await this.getUserUsingJWT(req.body.jwt);

        if (user) {
          logger.info(colors.blue(`Auth success for ${user.user}`));
          result.success = true;
        }
      }

      res.send(JSON.stringify(result));
    });

    this.server.ws("/status", async (ws, req) => {
      if (!req || !req.query || !req.query.a) {
        logger.error("Websocket, Access denied");
        ws.send(JSON.stringify({ error: "No JWT provided" }));
        return;
      }

      const user = await this.getUserUsingJWT(req.query.a);

      if (!user) {
        logger.error("Websocket, Access denied");
        ws.send(JSON.stringify({ error: "Access denied" }));
        return;
      }

      ws.on("message", (msg, p) => {
        switch (msg) {
          case "answer":
            this.answer();
            break;
          case "hangup":
            this.hangUp();
            break;
          case "stop-ringing":
            if (!this.stopRingingClients.includes(user.id)) {
              this.stopRingingClients.push(user.id);
            }
            break;
          case "open":
            this.openDoor();
            break;
          case "open-and-hangup":
            this.hangUp();
            this.openDoor();
            break;
          case "start-ringing":
            this.setRinging(true);
            break;
          default:
            ws.send(
              JSON.stringify({
                isRinging:
                  this.isRinging && !this.stopRingingClients.includes(user.id),
                isAnswered: this.isAnswered,
              })
            );
        }
      });
    });

    this.connectionManager = WebRtcConnectionManager.create(twoAudioWayOptions);

    shared.connectionManager = WebRtcConnectionManager.create(
      twoAudioWayOptions(this)
    );
    mount(this.server, shared.connectionManager, ``);

    const server = this.server.listen(config.WEB_SERVER_PORT, () => {
      const address = server.address();
      logger.info(
        `http${config.WEB_SERVER_USE_HTTPS ? "s" : ""}://${
          config.WEB_SERVER_HOST
        }:${config.WEB_SERVER_PORT}\n`
      );

      server.once("close", () => {
        // shared.connectionManager.close();
      });
    });
  }

  async start() {
    const gpioResult = await this.setupGPIOs();

    if (!gpioResult) {
      logger.error("GPIOs setup failed");
      process.exit(1);
    }

    if (config.MQTT_ENABLED) {
      this.setupMqtt();
    }

    await this.serverSetup();
    await videoStream.start(this.server);
  }
}

const app = new intercom();
app
  .start()
  .then(() => logger.info(colors.bgBlue("Smart intercom server started")));

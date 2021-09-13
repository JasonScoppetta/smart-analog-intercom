# smart-analog-intercom

This repository has the purpose to transform a common home door phone into a smart ( connected ) video door phone.

This script is designed to work with a **Raspberry Pi** and a **Terraneo MP10WS**. However, it can basically be used with any multi-wire video door phone (
at least for the audio part it should also be usable with two-wire ones).

- WebSocket comunication
- Two way audio comunication with WebRTC
- One way door phone camera stream
- MQTT enabled

## Hardware requirements
* Raspberry Pi 3 ( with at least 5 free GPIOs )
* A USB sound card adapter that has at least one microphone input and one headphone output ( Better if it has a preamp input )
* 6 5v Relays having both NC and NO wiring ( I used a card with 4 relays and a 2 relay to make it fit into the case of the door phone )
* A 22R resistor
* Wires and/or duponts

Only if you want the get the camera streaming
* AV to HDMI adapter ( It can be found cheap on amazon )
* HDMI to CSI-2 for Raspberry Pi ( I am using the one with Toshiba TC358743XBG )

## Software requirements

I'm using raspbian lite ( desktop-less version ) to keep the cpu quieter. But you can use the full Raspbian if you prefer

**CSI Camera enabled**

You can enable it using **raspi-config**

**ALSA**
```
sudo apt install alsa alsa-utils
```

**SOX**
```
sudo apt install sox
```

**COTURN (Only if you want to use this from remote)**
```
sudo apt install coturn
```

Coturn configuration instruction in progres...



## Wire up
In progress...


## Installation
```
npm install
```


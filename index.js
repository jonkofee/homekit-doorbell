'use strict';
const hap = require('hap-nodejs');
const Bridge = hap.Bridge;
const Accessory = hap.Accessory;
const CameraAccessory = require('./Accessories/Camera');

hap.init();

const bridge = new Bridge('Camera', hap.uuid.generate("homebridge-camera-rpi:bridge"));

bridge.addBridgedAccessory(new CameraAccessory());

bridge.publish({
  username: 'EC:13:12:13:1E:07',
  pincode: '031-45-150',
  category: Accessory.Categories.BRIDGE
}, true);

console.log('Poshla voda');

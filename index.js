'use strict';
const hap = require('hap-nodejs');
const Bridge = hap.Bridge;
const Accessory = hap.Accessory;
const CameraAccessory = require('./CameraAccessory');
const LockAccessory = require('./LockAccessory');

hap.init();

const bridge = new Bridge('Camera', hap.uuid.generate("homebridge-camera-rpi:bridge"));

bridge.addBridgedAccessory(new CameraAccessory());
bridge.addBridgedAccessory(new LockAccessory());

bridge.publish({
  username: 'EC:13:12:13:8E:07',
  pincode: '031-45-150',
  category: Accessory.Categories.BRIDGE
}, true);

console.log('Poshla voda');

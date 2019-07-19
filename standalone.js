'use strict'
const hap = require('hap-nodejs')
const CameraAccessory = require('./CameraAccessory')(hap, hap.Accessory, console.log)
const LockAccessory = require('./LockAccessory')(hap, hap.Accessory, console.log)

let conf = {
    username: 'EC:23:22:D3:CE:07',
    pincode: '031-45-150',
    debug: true
};

console.log('HAP-NodeJS starting...')

hap.init()

const bridge = new hap.Bridge('Node Bridge', hap.uuid.generate("Node Bridge"));

bridge.addBridgedAccessory(new CameraAccessory())
bridge.addBridgedAccessory(new LockAccessory())

bridge.publish({
  username: conf.username,
  pincode: conf.pincode,
  category: hap.Accessory.Categories.CAMERA
}, true)

console.log('Pincode: ' + conf.pincode)

'use strict'
const hap = require('hap-nodejs')
const CameraAccessory = require('./CameraAccessory')(hap, hap.Accessory, console.log)

let conf = {
    username: 'EC:23:3D:D3:CE:01',
    pincode: '031-45-150',
    debug: true
};

console.log('HAP-NodeJS starting...')

hap.init()

const cameraAccessory = new CameraAccessory(conf)

cameraAccessory.publish({
  username: conf.username,
  pincode: conf.pincode,
  category: hap.Accessory.Categories.CAMERA
}, true)

console.log('Scan this code with your HomeKit App on your iOS device to pair with Camera:')
console.log('                       ')
console.log('    ┌────────────┐     ')
console.log(`    │ ${conf.pincode} │     `)
console.log('    └────────────┘     ')
console.log('                       ')

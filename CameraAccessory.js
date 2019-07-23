'use strict';
const hap = require('hap-nodejs');
const Accessory = hap.Accessory;
const Service = hap.Service;

const CameraSource = require('./CameraSource');

module.exports = class CameraAccessory extends Accessory {
  constructor () {
    super('Camera', hap.uuid.generate('homebridge-camera-rpi:camera'));

    this.addService(new Service.Speaker("Speaker"));

    this.on('identify', (paired, callback) => {
        console.log('Idetify camera');
        callback();
    });

    this.configureCameraSource(new CameraSource());
  }
};

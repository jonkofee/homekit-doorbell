'use strict';
const hap = require('hap-nodejs');
const Accessory = hap.Accessory;

const ButtonService = require('../Services/Button');
const SpeakerService = require('../Services/Speaker');
const CameraSource = require('../CameraSource');

module.exports = class CameraAccessory extends Accessory {
  constructor () {
    super('Camera', hap.uuid.generate('homebridge-camera-rpi:camera'));

    this.addService(SpeakerService);
    this.addService(ButtonService);

    this.on('identify', (paired, callback) => {
        console.log('Idetify camera');
        callback();
    });

    this.configureCameraSource(new CameraSource());
  }
};

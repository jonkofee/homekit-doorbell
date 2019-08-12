'use strict';
const hap = require('hap-nodejs');
const Gpio = require('onoff').Gpio;
const Accessory = hap.Accessory;
const Service = hap.Service;
const Characteristic = hap.Characteristic;

const buttonGpio = new Gpio(17, 'in', 'falling', {debounceTimeout: 10});

const CameraSource = require('./CameraSource');

module.exports = class CameraAccessory extends Accessory {
  constructor () {
    super('Camera', hap.uuid.generate('homebridge-camera-rpi:camera'));

    this.addService(new Service.Speaker("Speaker"));

    var button = new Service.Doorbell('Button');

    this.addService(button);

    this.on('identify', (paired, callback) => {
        console.log('Idetify camera');
        callback();
    });


    buttonGpio.watch(() => {
        button.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(1);
        console.log('alarm')
    });

    this.configureCameraSource(new CameraSource());
  }
};

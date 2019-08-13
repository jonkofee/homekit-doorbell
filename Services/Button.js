'use strict';
const hap = require('hap-nodejs');
const Gpio = require('onoff').Gpio;
const Service = hap.Service;
const Characteristic = hap.Characteristic;

const buttonGpio = new Gpio(17, 'in', 'falling', {debounceTimeout: 10});
const service = new Service.Doorbell('Button');

buttonGpio.watch(() => {
    service.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(1);
    console.log('alarm');
});

module.exports = service;

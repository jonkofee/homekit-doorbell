'use strict';
const packageJSON = require('./package.json');

module.exports = (hap, Accessory, log) => class LockAccessory extends Accessory {
  constructor () {
    super('Lock', hap.uuid.generate('homebridge-camera-rpi:lock'));

    this.getService(hap.Service.AccessoryInformation)
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Raspberry Pi Foundation')
      .setCharacteristic(hap.Characteristic.Model, 'v2.1')
      .setCharacteristic(hap.Characteristic.SerialNumber, '42')
      .setCharacteristic(hap.Characteristic.FirmwareRevision, packageJSON.version);

    var FAKE_LOCK = {
      locked: false,
      lock: function() {
        console.log("Locking the lock!");
        FAKE_LOCK.locked = true;
      },
      unlock: function() {
        console.log("Unlocking the lock!");
        FAKE_LOCK.locked = false;
      },
      identify: function() {
        console.log("Identify the lock!");
      }
    };

    this.addService(hap.Service.LockMechanism, "Fake Lock")
        .getCharacteristic(hap.Characteristic.LockTargetState)
        .on('set', (value, callback) => {
          if (value == hap.Characteristic.LockTargetState.UNSECURED) {
            FAKE_LOCK.unlock();
            callback(); // Our fake Lock is synchronous - this value has been successfully set

            // now we want to set our lock's "actual state" to be unsecured so it shows as unlocked in iOS apps
            this
                .getService(hap.Service.LockMechanism)
                .setCharacteristic(hap.Characteristic.LockCurrentState, hap.Characteristic.LockCurrentState.UNSECURED);
          }
          else if (value == hap.Characteristic.LockTargetState.SECURED) {
            FAKE_LOCK.lock();
            callback(); // Our fake Lock is synchronous - this value has been successfully set

            // now we want to set our lock's "actual state" to be locked so it shows as open in iOS apps
            this
                .getService(hap.Service.LockMechanism)
                .setCharacteristic(hap.Characteristic.LockCurrentState, hap.Characteristic.LockCurrentState.SECURED);
          }
        });

    this
        .getService(hap.Service.LockMechanism)
        .getCharacteristic(hap.Characteristic.LockCurrentState)
        .on('get', (callback) => {

          // this event is emitted when you ask Siri directly whether your lock is locked or not. you might query
          // the lock hardware itself to find this out, then call the callback. But if you take longer than a
          // few seconds to respond, Siri will give up.

          var err = null; // in case there were any problems

          if (FAKE_LOCK.locked) {
            console.log("Are we locked? Yes.");
            callback(err, hap.Characteristic.LockCurrentState.SECURED);
          }
          else {
            console.log("Are we locked? No.");
            callback(err, hap.Characteristic.LockCurrentState.UNSECURED);
          }
        });

    this.on('identify', function (paired, callback) {
        log('**identify**');
        callback();
    });
  }
}

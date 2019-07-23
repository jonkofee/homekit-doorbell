'use strict';
const hap = require('hap-nodejs');
const Accessory = hap.Accessory;
const Service = hap.Service;
const Characteristic = hap.Characteristic;

module.exports = class LockAccessory extends Accessory {
  constructor () {
    super('Lock', hap.uuid.generate('homebridge-camera-rpi:lock'));

    const FAKE_LOCK = {
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

    this.addService(Service.LockMechanism, "Fake Lock")
        .getCharacteristic(Characteristic.LockTargetState)
        .on('set', (value, callback) => {
          if (value == Characteristic.LockTargetState.UNSECURED) {
            FAKE_LOCK.unlock();
            callback(); // Our fake Lock is synchronous - this value has been successfully set

            // now we want to set our lock's "actual state" to be unsecured so it shows as unlocked in iOS apps
            this
                .getService(Service.LockMechanism)
                .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
          }
          else if (value == Characteristic.LockTargetState.SECURED) {
            FAKE_LOCK.lock();
            callback(); // Our fake Lock is synchronous - this value has been successfully set

            // now we want to set our lock's "actual state" to be locked so it shows as open in iOS apps
            this
                .getService(Service.LockMechanism)
                .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
          }
        });

    this
        .getService(Service.LockMechanism)
        .getCharacteristic(Characteristic.LockCurrentState)
        .on('get', (callback) => {

          // this event is emitted when you ask Siri directly whether your lock is locked or not. you might query
          // the lock hardware itself to find this out, then call the callback. But if you take longer than a
          // few seconds to respond, Siri will give up.

          if (FAKE_LOCK.locked) {
            console.log("Are we locked? Yes.");
            callback(null, Characteristic.LockCurrentState.SECURED);
          }
          else {
            console.log("Are we locked? No.");
            callback(null, Characteristic.LockCurrentState.UNSECURED);
          }
        });

    this.on('identify', function (paired, callback) {
        console.log('Identify lock');
        callback();
    });
  }
}

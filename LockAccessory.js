'use strict'
const packageJSON = require('./package.json')
const CameraSource = require('./CameraSource')

module.exports = (hap, Accessory, log) => class CameraAccessory extends Accessory {
  constructor () {
    super('Camera', hap.uuid.generate('homebridge-camera-rpi:outdoor'))

    this.getService(hap.Service.AccessoryInformation)
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Raspberry Pi Foundation')
      .setCharacteristic(hap.Characteristic.Model, 'v2.1')
      .setCharacteristic(hap.Characteristic.SerialNumber, '42')
      .setCharacteristic(hap.Characteristic.FirmwareRevision, packageJSON.version)

    this.addService(new hap.Service.Speaker("Speaker"))

    this.on('identify', function (paired, callback) {
        log('**identify**'); callback()
    })

    const cameraSource = new CameraSource(hap, {}, log)

    this.configureCameraSource(cameraSource)
  }
}

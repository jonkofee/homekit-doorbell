'use strict'
const packageJSON = require('./package.json')
const CameraSource = require('./CameraSource')

module.exports = (hap, Accessory, log) => class CameraAccessory extends Accessory {
  constructor (conf) {
    super(conf.name, hap.uuid.generate('homebridge-camera-rpi:' + conf.id)) // hap.Accessory.Categories.CAMERA only required for homebridge - ignored by hap-nodejs (standalone)

    this.getService(hap.Service.AccessoryInformation)
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Raspberry Pi Foundation')
      .setCharacteristic(hap.Characteristic.Model, 'v2.1')
      .setCharacteristic(hap.Characteristic.SerialNumber, '42')
      .setCharacteristic(hap.Characteristic.FirmwareRevision, packageJSON.version)

    this.on('identify', function (paired, callback) {
        log('**identify**'); callback()
    })

    const cameraSource = new CameraSource(hap, conf, log)

    this.configureCameraSource(cameraSource)
  }
}

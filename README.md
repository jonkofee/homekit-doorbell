# homebridge-camera-rpi
raspberry pi camera plugin for homebridge

Note: An SD card image is available [here](https://github.com/moritzmhmk/buildroot-camera-rpi/releases).

## Prerequisite

* camera module activated (`raspi-config`)
* module `bcm2835-v4l2` loaded (add `bcm2835-v4l2` to `/etc/modules` and reboot)
* ffmpeg installed (`sudo apt install ffmpeg`)
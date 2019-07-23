'use strict';

var ip = require('ip');
var spawn = require('child_process').spawn;
var crypto = require('crypto');

module.exports = Camera;

function Camera (hap, conf, log) {
  const options = {
    proxy: false, // Requires RTP/RTCP MUX Proxy
    disable_audio_proxy: false, // If proxy = true, you can opt out audio proxy via this
    srtp: true, // Supports SRTP AES_CM_128_HMAC_SHA1_80 encryption
    video: {
      resolutions: [
        [1920, 1080, 30], // Width, Height, framerate
        [1280, 960, 30],
        [1280, 720, 60],
        [1024, 768, 60],
        [640, 480, 60],
        [640, 360, 60],
        [480, 360, 30],
        [480, 270, 30],
        [320, 240, 30],
        [320, 240, 15], // Apple Watch requires this configuration
        [320, 180, 30]
      ],
      codec: {
        profiles: [0, 1, 2], // Enum, please refer StreamController.VideoCodecParamProfileIDTypes
        levels: [0, 1, 2] // Enum, please refer StreamController.VideoCodecParamLevelTypes
      }
    },
    audio: {
      comfort_noise: false,
      codecs: [
        {
          type: 'OPUS', // Audio Codec
          samplerate: 24 // 8, 16, 24 KHz
        },
        {
          type: 'AAC-eld',
          samplerate: 16
        }
      ]
    }
  };

  this.hap = hap;
  this.conf = conf;
  this.log = log;
  this.services = [];
  this.streamControllers = [];
  this.debug = conf.debug;
  this.pendingSessions = {};
  this.ongoingSessions = {};

  this._v4l2CTLSetCTRL('rotate', this.conf.rotate || 0);
  this._v4l2CTLSetCTRL('vertical_flip', this.conf.verticalFlip ? 1 : 0);
  this._v4l2CTLSetCTRL('horizontal_flip', this.conf.horizontalFlip ? 1 : 0);
  this.createCameraControlService();
  this._createStreamControllers(2, options);
}

Camera.prototype.handleSnapshotRequest = function (request, callback) {
  let ffmpegCommand = `\
-f video4linux2 -input_format mjpeg -video_size ${request.width}x${request.height} -i /dev/video0 \
-vframes 1 -f mjpeg -`

  if (this.debug) {
    console.log('ffmpeg', ffmpegCommand);
  }

  let ffmpeg = spawn('ffmpeg', ffmpegCommand.split(' '), { env: process.env });
  var imageBuffer = Buffer.alloc(0);
  ffmpeg.stdout.on('data', function (data) { imageBuffer = Buffer.concat([imageBuffer, data]) });
  if (this.debug) {
    ffmpeg.stderr.on('data', function (data) { console.log(String(data)) });
  }
  ffmpeg.on('error', error => {
    this.log('Failed to take a snapshot');
    if (this.debug) {
      console.log('Error:', error.message);
    }
  });
  ffmpeg.on('close', code => {
    if (!code || code === 255) {
      this.log(`Took snapshot at ${request.width}x${request.height}`);
      callback(null, imageBuffer);
    } else {
      this.log(`ffmpeg exited with code ${code}`);
    }
  });
};

Camera.prototype.handleCloseConnection = function (connectionID) {
  this.streamControllers.forEach(function (controller) {
    controller.handleCloseConnection(connectionID);
  });
};

Camera.prototype.prepareStream = function (request, callback) {
  let response = {
      address: {
          address: ip.address(),
          type: ip.isV4Format(ip.address()) ? 'v4' : 'v6'
      }
  };
  let sessionInfo = {
      address: request['targetAddress']
  }

  if (request['video']) {
    // SSRC is a 32 bit integer that is unique per stream
    let ssrcSource = crypto.randomBytes(4);
    ssrcSource[0] = 0;

    response.video = {
        port: request['video']['port'],
        ssrc: ssrcSource.readInt32BE(0, true),
        srtp_key: request['video']['srtp_key'],
        srtp_salt: request['video']['srtp_salt']
    };

    sessionInfo['video_port'] = response.video.port;
    sessionInfo['video_srtp'] = Buffer.concat([response.video.srtp_key, response.video.srtp_salt]);
    sessionInfo['video_ssrc'] = response.video.ssrc;
  }

  if (request['audio']) {
    // SSRC is a 32 bit integer that is unique per stream
    let ssrcSource = crypto.randomBytes(4);
    ssrcSource[0] = 0;

    response.audio = {
        port: request['audio']['port'],
        ssrc: ssrcSource.readInt32BE(0, true),
        srtp_key: request['audio']['srtp_key'],
        srtp_salt: request['audio']['srtp_salt']
    };

    sessionInfo['audio_port'] = response.audio.port;
    sessionInfo['audio_srtp'] = Buffer.concat([response.audio.srtp_key, response.audio.srtp_salt]);
    sessionInfo['audio_ssrc'] = response.audio.ssrc;
  }

  this.pendingSessions[this.hap.uuid.unparse(request['sessionID'])] = sessionInfo;

  callback(response);
}

Camera.prototype.handleStreamRequest = function (request) {
  if (!request['sessionID']) {
    return false;
  }

  switch (request['type']) {
    case 'start':
      this._handleStartStream(request);
      break;
    case 'stop':
      this._handleStopStream(request);
      break;
    default:
      return false;
  }
};

Camera.prototype.createCameraControlService = function () {
  var controlService = new this.hap.Service.CameraControl();

  // Developer can add control characteristics like rotation, night vision at here.

  this.services.push(controlService);
}

// Private

Camera.prototype._createStreamControllers = function (maxStreams, options) {
  let self = this;

  for (var i = 0; i < maxStreams; i++) {
    var streamController = new this.hap.StreamController(i, options, self);

    self.services.push(streamController.service);
    self.streamControllers.push(streamController);
  }
}

Camera.prototype._v4l2CTLSetCTRL = function (name, value) {
  let v4l2ctlCommand = `--set-ctrl ${name}=${value}`;
  if (this.debug) {
    console.log('v4l2-ctl', v4l2ctlCommand);
  }
  let v4l2ctl = spawn('v4l2-ctl', v4l2ctlCommand.split(' '), { env: process.env });
  v4l2ctl.on('error', err => {
    this.log(`Failed to set '${name}' to '${value}'`);
    if (this.debug) {
      console.log('Error:', err.message);
    }
  })
  if (this.debug) {
    v4l2ctl.stderr.on('data', function (data) { console.log(String(data)) });
  }

}

Camera.prototype._handleStartStream = function(request) {
  const sessionIdentifier = this.hap.uuid.unparse(request['sessionID']);

  if (!this.pendingSessions[sessionIdentifier]) {
    return false;
  }

  const width = request['video']['width'];
  const height = request['video']['height'];
  const fps = request['video']['fps'];
  const bitrate = request['video']['max_bit_rate'];
  const srtp = this.pendingSessions[sessionIdentifier]['video_srtp'].toString('base64');
  const address = this.pendingSessions[sessionIdentifier]['address'];
  const port = this.pendingSessions[sessionIdentifier]['video_port'];
  const ssrc = this.pendingSessions[sessionIdentifier]['video_ssrc'];

  this._v4l2CTLSetCTRL('video_bitrate', `${bitrate}000`);

  this.log(`Starting video stream (${width}x${height}, ${fps} fps, ${bitrate} kbps)`);

  let ffmpegCommand = `-f video4linux2 -input_format h264 -video_size ${width}x${height} -framerate ${fps} -i /dev/video0 -vcodec h264_omx -an -payload_type 99 -ssrc ${ssrc} -f rtp -srtp_out_suite AES_CM_128_HMAC_SHA1_80 -srtp_out_params ${srtp} srtp://${address}:${port}?rtcpport=${port}&localrtcpport=${port}&pkt_size=1378`;

  if (this.debug) {
    console.log('ffmpeg', ffmpegCommand);
  }

  let ffmpeg = spawn('ffmpeg', ffmpegCommand.split(' '), { env: process.env });

  ffmpeg.stderr.on('data', data => {
    if (this.debug) {
      console.log(String(data));
    }
  });

  ffmpeg.on('error', error => {
    this.log('Failed to start video stream');
    if (this.debug) {
      console.log('Error:', error.message);
    }
  });

  ffmpeg.on('close', code => {
    if (!code || code === 255) {
      this.log('Video stream stopped');
    } else {
      this.log(`ffmpeg exited with code ${code}`);
    }
  });

  this.ongoingSessions[sessionIdentifier] = ffmpeg;

  delete this.pendingSessions[sessionIdentifier];
}

Camera.prototype._handleStopStream = function(request) {
  const sessionIdentifier = this.hap.uuid.unparse(request['sessionID']);

  if (!this.ongoingSessions[sessionIdentifier]) {
    return false;
  }

  this.ongoingSessions[sessionIdentifier].kill('SIGKILL');
  delete this.ongoingSessions[sessionIdentifier];
};

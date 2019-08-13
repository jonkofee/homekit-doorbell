const hap = require('hap-nodejs');
const Service = hap.Service;

const service = new Service.Speaker("Speaker");

module.exports = service;
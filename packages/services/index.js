'use strict';

const fs = require('node:fs');
const path = require('node:path');

const files = fs
  .readdirSync(path.join(__dirname, 'src'))
  .filter((file) => path.extname(file) === '.js' && file !== 'index.js');

const services = {};

for (const file of files) {
  const serviceName = path.basename(file, '.js');
  services[serviceName] = require(path.join(__dirname, file));
}

module.exports = { services };

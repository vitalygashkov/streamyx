'use strict';

const services = {
  rutube: require('./src/rutube'),
  soundcloud: require('./src/soundcloud'),
  weibo: require('./src/weibo'),
  vk: require('./src/vk'),
  ntv: require('./src/ntv'),
};

module.exports = { services };

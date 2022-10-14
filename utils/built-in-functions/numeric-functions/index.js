const _ = require('lodash');
const { interfaces } = require('mocha');

const round = (number, precision) => {
  if(typeof precision==="number")
    return _.round(number, precision);
  else
    return _.round(number);
};

module.exports = {
  round,
};
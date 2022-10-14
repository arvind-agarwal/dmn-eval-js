const _ = require('lodash');

const round = (number, precision) => {
  if (typeof precision === 'number') return _.round(number, precision);
  return _.round(number);
};

module.exports = {
  round,
};

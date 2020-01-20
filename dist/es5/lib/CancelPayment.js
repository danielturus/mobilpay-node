'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RequestError = require('./errors/RequestError');
var ContactInfo = require('./ContactInfo');
var _ = require('lodash');

var CancelPayment = function CancelPayment(params) {
  _classCallCheck(this, CancelPayment);

  if (!params) {
    throw new RequestError('Params object is required');
  }

  if (!params.amount) {
    throw new RequestError('Missing amount');
  }

  if (params.amount < 0.1 || params.amount > 99999) {
    throw new RequestError('Invalid amount value. A minimum of ' + '0.10 and a maximum of 99999 units are permitted ');
  }

  Object.assign(this, _.pick(params, ['orderId', 'amount']));
};

module.exports = CancelPayment;
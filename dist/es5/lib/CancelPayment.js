'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RequestError = require('./errors/RequestError');
var ContactInfo = require('./ContactInfo');
var _ = require('lodash');

var CancelPayment = function () {
  function CancelPayment(params) {
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
  }

  _createClass(CancelPayment, [{
    key: 'toXmlData',
    value: function toXmlData() {
      var xml = {
        'amount': this.amount,
        'orderId': this.orderId
      };

      return xml;
    }
  }], [{
    key: 'xmlDataToAttributes',
    value: function xmlDataToAttributes(xmlData) {
      var attributes = {};
      var cancelPaymentAttributes = xmlData['$'] || {};

      if (cancelPaymentAttributes.amount) {
        attributes.amount = cancelPaymentAttributes.amount;
      };

      if (cancelPaymentAttributes.orderId) {
        attributes.orderId = cancelPaymentAttributes.orderId;
      };

      return attributes;
    }
  }, {
    key: 'fromXmlData',
    value: function fromXmlData(xmlData) {
      var attributes = this.xmlDataToAttributes(xmlData);

      return new CancelPayment(attributes);
    }
  }]);

  return CancelPayment;
}();

module.exports = CancelPayment;
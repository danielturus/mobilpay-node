'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var xml2js = require('xml2js');
var ContactInfo = require('./ContactInfo');
var constants = require('./constants');
var _ = require('lodash');

var Notify = function () {
  function Notify(options) {
    _classCallCheck(this, Notify);

    if (!options) {
      throw new Error('Options object is required');
    }

    if (constants.VALID_NOTIFY_ACTIONS.indexOf(options.action) < 0) {
      throw new Error('Invalid action');
    }

    Object.assign(this, _.pick(options, ['timestamp', 'crc', 'action', 'purchase', 'originalAmount', 'processedAmount', 'currentPaymentCount', 'panMasked', 'paymentInstrumentId', 'tokenId', 'tokenExpirationDate', 'errorCode', 'errorMessage']));

    if (options.customer) {
      this.customer = new ContactInfo(options.customer);
    }
  }

  _createClass(Notify, null, [{
    key: 'xmlDataToAttributes',
    value: function xmlDataToAttributes(xmlData) {
      var attributes = {};
      var notifyAttributes = xmlData['$'] || {};

      Object.assign(attributes, _.pick(notifyAttributes, ['timestamp', 'crc']));

      Object.assign(attributes, _.mapKeys(_.pick(xmlData, ['action', 'purchase', 'original_amount', 'processed_amount', 'current_payment_count', 'pan_masked', 'payment_instrument_id', 'token_id', 'token_expiration_date']), function (value, key) {
        return _.camelCase(key);
      }));

      if (xmlData.customer) {
        Object.assign(attributes, {
          customer: ContactInfo.xmlDataToAttributes(xmlData.customer)
        });
      }

      if (xmlData.error) {
        attributes.errorCode = xmlData.error['$'].code;
        attributes.errorMessage = xmlData.error['_'];
      }

      return attributes;
    }
  }, {
    key: 'fromXmlData',
    value: function fromXmlData(xmlData) {
      var attributes = this.xmlDataToAttributes(xmlData);

      return new Notify(attributes);
    }
  }]);

  return Notify;
}();

module.exports = Notify;
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RequestError = require('./errors/RequestError');
var ContactInfo = require('./ContactInfo');
var _ = require('lodash');

var Invoice = function () {
  function Invoice() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      currency: 'RON',
      tokenId: null,
      panMasked: null,
      details: ''
    };

    _classCallCheck(this, Invoice);

    if (!params) {
      throw new RequestError('Params object is required');
    }

    if (!params.amount) {
      throw new RequestError('Missing amount');
    }

    if (params.amount < 0.1 || params.amount > 99999) {
      throw new RequestError('Invalid amount value. A minimum of ' + '0.10 and a maximum of 99999 units are permitted ');
    }

    Object.assign(this, _.pick(params, ['currency', 'amount', 'customerId', 'tokenId', 'panMasked', 'details']));

    if (params.billingAddress) {
      this.billingAddress = new ContactInfo(params.billingAddress);
    }

    if (params.shippingAddress) {
      this.shippingAddress = new ContactInfo(params.shippingAddress);
    }
  }

  _createClass(Invoice, [{
    key: 'toXmlData',
    value: function toXmlData() {
      var xml = {
        invoice: {
          '@currency': this.currency,
          '@amount': this.amount,
          '@customer_id': this.customerId,
          '@customer_type': 2,
          details: this.details || ''
        }
      };

      if (this.tokenId) {
        xml.invoice['@token_id'] = this.tokenId;
      }

      if (this.panMasked) {
        xml.invoice['@pan_masked'] = this.panMasked;
      }

      if (this.billingAddress || this.shippingAddress) {
        var contactInfo = {};

        if (this.billingAddress) {
          Object.assign(contactInfo, { 'billing': this.billingAddress.toXmlData().address });
        }

        if (this.shippingAddress) {
          Object.assign(contactInfo, { 'shipping': this.shippingAddress.toXmlData().address });
        }

        xml.invoice['contact_info'] = contactInfo;
      }

      return xml;
    }
  }], [{
    key: 'xmlDataToAttributes',
    value: function xmlDataToAttributes(xmlData) {
      var attributes = {};
      var invoiceAttributes = xmlData['$'] || {};

      if (invoiceAttributes.amount) {
        attributes.amount = invoiceAttributes.amount;
      }

      if (invoiceAttributes.currency) {
        attributes.currency = invoiceAttributes.currency;
      }

      if (invoiceAttributes.customer_id) {
        attributes.customerId = invoiceAttributes.customer_id;
      }

      if (invoiceAttributes.token_id) {
        attributes.tokenId = invoiceAttributes.token_id;
      }

      if (invoiceAttributes.pan_masked) {
        attributes.panMasked = invoiceAttributes.pan_masked;
      }

      if (xmlData.details) {
        attributes.details = order['invoice'].details;
      }

      if (xmlData.contact_info && _.isFunction(ContactInfo.xmlDataToAttributes)) {
        if (xmlData.contact_info.billing) {
          Object.assign(attributes, {
            billingAddress: ContactInfo.xmlDataToAttributes(xmlData.contact_info.billing)
          });
        }

        if (xmlData.contact_info.shipping) {
          Object.assign(attributes, {
            shippingAddress: ContactInfo.xmlDataToAttributes(xmlData.contact_info.shipping)
          });
        }
      }

      return attributes;
    }
  }, {
    key: 'fromXmlData',
    value: function fromXmlData(xmlData) {
      var attributes = this.xmlDataToAttributes(xmlData);

      return new Invoice(attributes);
    }
  }]);

  return Invoice;
}();

module.exports = Invoice;
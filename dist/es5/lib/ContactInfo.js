'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var constants = require('./constants');
var _ = require('lodash');

var ContactInfo = function () {
  function ContactInfo() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      type: constants.ADDRESS_TYPE_PERSON,
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      mobilePhone: ''
    };

    _classCallCheck(this, ContactInfo);

    if (params.type !== constants.ADDRESS_TYPE_COMPANY && params.type !== constants.ADDRESS_TYPE_PERSON) {
      throw new Error('Invalid address type \'' + params.type + '\'');
    }

    Object.assign(this, _.pick(params, ['type', 'firstName', 'lastName', 'email', 'address', 'mobilePhone']));
  }

  _createClass(ContactInfo, [{
    key: 'toXmlData',
    value: function toXmlData() {
      return {
        'address': {
          '@type': this.type,
          'first_name': this.firstName || '',
          'last_name': this.lastName || '',
          'email': this.email || '',
          'address': this.address || '',
          'mobile_phone': this.mobilePhone || ''
        }
      };
    }
  }], [{
    key: 'xmlDataToAttributes',
    value: function xmlDataToAttributes(xmlData) {
      var attributes = {};
      var addressAttributes = xmlData['$'] || {};

      if (addressAttributes.type) {
        attributes.type = addressAttributes.type;
      }

      if (xmlData.address) {
        attributes.address = xmlData.address;
      }

      if (xmlData.email) {
        attributes.email = xmlData.email;
      }

      if (xmlData.first_name) {
        attributes.firstName = xmlData.first_name;
      }

      if (xmlData.last_name) {
        attributes.lastName = xmlData.last_name;
      }

      if (xmlData.mobile_phone) {
        attributes.moblePhone = xmlData.mobile_phone;
      }

      return attributes;
    }
  }, {
    key: 'fromXmlData',
    value: function fromXmlData(xmlData) {
      var attributes = this.xmlDataToAttributes(xmlData);

      return new ContactInfo(attributes);
    }
  }]);

  return ContactInfo;
}();

module.exports = ContactInfo;
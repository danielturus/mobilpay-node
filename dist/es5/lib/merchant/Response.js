'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var constants = require('../constants');
var _ = require('lodash');
var XmlBuilder = require('xmlbuilder');

var Response = function () {
  function Response(options) {
    _classCallCheck(this, Response);

    if (!options) {
      throw new Error('Options object is required');
    }

    if (options.code) {
      if (!_.isNumber(options.code)) {
        throw new Error('Non numeric code value');
      }
      this.code = options.code;
    }

    if (options.type && (options.type === constants.CRC_ERROR_TYPE_TEMPORARY || options.type === constants.CRC_ERROR_TYPE_PERMANENT)) {

      this.type = options.type;
    }

    if (options.message) {
      this.messsage = options.message;
    }
  }

  _createClass(Response, [{
    key: 'toXmlData',
    value: function toXmlData() {
      var xmlData = {
        crc: {
          '#text': this.messsage
        }
      };

      if (this.code) {
        xmlData.crc['@error_code'] = this.code;
      }

      if (this.type) {
        xmlData.crc['@error_type'] = this.type;
      }

      return xmlData;
    }
  }, {
    key: 'toXml',
    value: function toXml() {
      return XmlBuilder.create(this.toXmlData()).end();
    }
  }]);

  return Response;
}();

module.exports = Response;
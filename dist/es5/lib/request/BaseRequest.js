'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @typedef {Object} RequestData
 * @property {String} paymentType
 * @property {String} currency - Transaction currency
 * @property {String} signature - Unique key assigned to your seller account for the payment process
 * @property {String} confirmUrl - Callback URL where the payment
 *                                 gateway will post transaction status updates
 * @property {String} returnUrl -  A URL in your web application where the client
 *                                 will be redirected to once the payment is complete
 * @property {String} lang - If you wish to display the interface in a different language other than RO
 * @property {Number} amount - the amount to be processed
 * @property {Object} notify - notification object
 */

var utils = require('./../utils');
var constants = require('./../constants');
var RequestError = require('./../errors/RequestError');
var moment = require('moment');
var XmlBuilder = require('xmlbuilder');
var _ = require('lodash');

var BaseRequest = function () {

  /**
   * @param {RequestData} options
   */
  function BaseRequest(options) {
    _classCallCheck(this, BaseRequest);

    if (!options) {
      throw new RequestError('Params object is required');
    }

    if (!options.paymentType) {
      throw new RequestError('Empty payment type');
    }

    /**
     * We only support cart payment for now
     * @todo support transfer payment type
     */
    if (options.paymentType !== constants.PAYMENT_TYPE_CARD) {
      throw new RequestError('Payment type \'' + options.paymentType + '\' not supported');
    }

    if (!options.signature) {
      throw new RequestError('Missing merchant signature');
    }

    this.paymentType = options.paymentType;
    this.signature = options.signature;
    this.id = utils.getUniqueId();
    this.timestamp = moment().format('YYYYMMDDHHmmss');

    if (options.returnUrl) {
      this.returnUrl = options.returnUrl;
    }

    if (options.confirmUrl) {
      this.confirmUrl = options.confirmUrl;
    }

    this.params = options.params || null;
  }

  _createClass(BaseRequest, [{
    key: 'toXmlData',
    value: function toXmlData() {
      var xmlData = {
        order: {
          '@type': this.paymentType,
          '@id': this.id,
          '@timestamp': this.timestamp,
          signature: this.signature
        }
      };

      if (this.confirmUrl) {
        xmlData.order['confirm'] = this.confirmUrl;
      }

      if (this.returnUrl) {
        xmlData.order['return'] = this.returnUrl;
      }

      if (this.params && _.isObject(this.params) && !_.isEmpty(this.params)) {
        var params = [];
        _.forIn(this.params, function (value, key) {
          params.push({
            name: key,
            value: value
          });
          xmlData.order['params'] = { param: params };
        });
      }

      return xmlData;
    }
  }, {
    key: 'toXml',
    value: function toXml() {
      return XmlBuilder.create(this.toXmlData()).end();
    }
  }], [{
    key: 'xmlDataToAttributes',
    value: function xmlDataToAttributes(xmlData) {
      var attributes = {};

      if (xmlData.order) {
        var order = xmlData.order;
        var orderAttributes = order['$'];

        attributes.paymentType = orderAttributes.type;
        attributes.id = orderAttributes.id;
        attributes.timestamp = orderAttributes.timestamp;
        if (order.signature) {
          attributes.signature = order.signature;
        }

        if (order.confirm) {
          attributes.confirmUrl = order.confirm;
        }

        if (order.return) {
          attributes.returnUrl = order.return;
        }

        if (order.params) {
          var params = order.params.param;

          attributes.params = _.reduce(params, function (result, item, key) {
            result[item.name] = item.value;
            return result;
          }, {});
        }
      }
      return attributes;
    }
  }]);

  return BaseRequest;
}();

module.exports = BaseRequest;
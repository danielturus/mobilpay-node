'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @typedef {Object} MobilPayConfig
 * @property {Number} serviceType
 * @property {String} paymentType
 * @property {String} publicKeyFile
 * @property {String} privateKeyFile
 * @property {Boolean} sandbox - Toggle sandbox mode
 * @property {String} currency - Transaction currency
 * @property {String} signature - Unique key assigned to your seller account for the payment process
 * @property {String} confirmUrl - Callback URL where the payment
 *                                 gateway will post transaction status updates
 * @property {String} returnUrl -  A URL in your web application where the client
 *                                 will be redirected to once the payment is complete
 * @property {String} lang - If you wish to display the interface in a different language other than RO
 */

var CardRequest = require('./request/CardRequest');
var RequestError = require('./errors/RequestError');
var constants = require('./constants');
var encrypt = require('./utils').encrypt;
var decrypt = require('./utils').decrypt;
var Promise = require('es6-promise').Promise;
var xml2js = require('xml2js');
var _ = require('lodash');
var Notify = require('./Notify');

var MobilPay = function () {

  /**
   * @param {MobilPayConfig} config
   */
  function MobilPay(config) {
    _classCallCheck(this, MobilPay);

    if (!config) {
      throw new Error('Config is required');
    }

    this.config = Object.assign({
      currency: 'RON',
      serviceType: constants.SERVICE_STANDARD_PAYMENT,
      paymentType: constants.PAYMENT_TYPE_CARD,
      sandbox: false,
      privateKeyFile: '',
      publicKeyFile: ''
    }, config);

    if (this.config.serviceType !== constants.SERVICE_STANDARD_PAYMENT && this.config.serviceType !== constants.SERVICE_PREFILLED_CARD_DATA_PAYMENT) {
      throw new Error('Unsupported service type');
    }

    if (this.config.paymentType !== constants.PAYMENT_TYPE_CARD) {
      throw new Error('Unsupported payment type');
    }

    if (!this.config.signature) {
      throw new Error('Missing merchant signature');
    }
  }

  _createClass(MobilPay, [{
    key: 'createRequest',
    value: function createRequest(data) {
      var params = data || {};

      params.paymentType = this.config.paymentType;
      params.signature = this.config.signature;
      params.returnUrl = this.config.returnUrl;
      params.currency = this.config.currency;

      if (params.orderId && params.amount) {
        console.log(' if (params.orderId && params.amount) { a intrat ______');
        return new CardRequest(params);
      } else if (params.paymentType === constants.PAYMENT_TYPE_CARD) {
        return new CardRequest(params);
      }

      throw new RequestError('Payment type \'' + params.paymentType + '\' not supported');
    }
  }, {
    key: 'prepareRedirectData',
    value: function prepareRedirectData(request) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var xml = request.toXml();

        encrypt(xml, { publicKeyFile: _this.config.publicKeyFile }).then(function (result) {
          resolve({
            'url': constants.REQUEST_ENDPOINTS[_this.config.serviceType][_this.config.sandbox ? constants.SANDBOX_MODE : constants.LIVE_MODE],
            'envKey': result.key,
            'data': result.message
          });
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  }, {
    key: 'handleGatewayResponse',
    value: function handleGatewayResponse() {
      var _this2 = this;

      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          envKey = _ref.envKey,
          data = _ref.data;

      return new Promise(function (resolve, reject) {
        decrypt(data, {
          privateKeyFile: _this2.config.privateKeyFile,
          key: envKey
        }).then(function (data) {
          var parser = new xml2js.Parser({ explicitArray: false });

          parser.parseString(data, function (err, result) {
            if (err) {
              return reject(err);
            }

            if (!result.order) {
              return reject(new Error('Invalid XML data'));
            }

            var notify = null;
            var order = null;

            if (result.order.mobilpay && _.isFunction(Notify.xmlDataToAttributes)) {
              notify = Notify.fromXmlData(result.order.mobilpay);
            }

            if (result.order['$'].type && result.order['$'].type == constants.PAYMENT_TYPE_CARD) {
              if (_.isFunction(CardRequest.fromXmlData)) {
                order = CardRequest.fromXmlData(result);
              }
            }

            resolve({
              order: order,
              response: notify
            });
          });
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  }]);

  return MobilPay;
}();

module.exports = MobilPay;
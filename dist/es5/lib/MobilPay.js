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
var request = require('request');

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

      if (params.paymentType === constants.PAYMENT_TYPE_CARD) {
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
    key: 'getSessionId',
    value: function getSessionId(_ref) {
      var _this2 = this;

      var username = _ref.username,
          password = _ref.password;

      if (!username) {
        throw new Error('username is required');
      }

      if (!password) {
        throw new Error('password is required');
      }

      return new Promise(function (resolve, reject) {
        var url = constants.REQUEST_ENDPOINTS.login[_this2.config.sandbox ? constants.SANDBOX_MODE : constants.LIVE_MODE];
        var builder = new xml2js.Builder();
        var xml = builder.buildObject({
          "soapenv:Envelope": {
            "$": {
              "xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
              "xmlns:pay": url
            },
            "soapenv:Header": [],
            "soapenv:Body": [{
              "pay:logIn": [{
                "request": [{
                  "username": [username],
                  "password": [password]
                }]
              }]
            }]
          }
        });

        var options = {
          url: url,
          body: xml,
          headers: { 'Content-Type': 'text/xml' }
        };

        request.post(options, function (err, response, body) {
          if (err) {
            reject(err);
          }

          // SOAP should response with statuses 2xx or 500 - https://www.w3.org/TR/2000/NOTE-SOAP-20000508/
          if (response.statusCode === 500) {
            reject({ error: true, message: "Something went wrong" });
          }

          var parser = new xml2js.Parser({ explicitArray: false });
          parser.parseString(body, function (err, result) {
            if (err) {
              reject(err);
            }

            var sessionId = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:logInResponse']['logInResult'].id;
            resolve({ sessionId: sessionId });
          });
        });
      });
    }
  }, {
    key: 'creditInvoice',
    value: function creditInvoice(_ref2) {
      var sessionId = _ref2.sessionId,
          orderId = _ref2.orderId,
          amount = _ref2.amount;

      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      if (!signature) {
        throw new Error('signature is required');
      }

      if (!orderId) {
        throw new Error('orderId is required');
      }

      if (!amount) {
        throw new Error('amount is required');
      }

      if (amount < 0.1 || amount > 99999) {
        throw new Error('Invalid amount value. A minimum of ' + '0.10 and a maximum of 99999 units are permitted ');
      }

      return new Promise(function (resolve, reject) {
        var xml = '\n      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pay="http://sandboxsecure.mobilpay.ro/api/payment2/">\n        <soapenv:Header/>\n        <soapenv:Body>\n            <pay:credit>\n              <request>\n                  <sessionId>' + sessionId + '</sessionId>\n                  <sacId>' + signature + '</sacId>\n                  <orderId>' + orderId + '</orderId>\n                  <amount>' + amount + '</amount>\n              </request>\n            </pay:credit>\n        </soapenv:Body>\n      </soapenv:Envelope>';

        var options = {
          url: constants.REQUEST_ENDPOINTS.login,
          body: xml,
          headers: { 'Content-Type': 'text/xml' }
        };

        request.post(options, function (err, response, body) {
          if (err) {
            reject(err);
          }

          var parser = new xml2js.Parser({ explicitArray: false });
          parser.parseString(body, function (err, result) {
            if (err) {
              return reject(err);
            }

            console.log(result);
            var sessionId = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'];
            resolve({ sessionId: sessionId });
          });
        });
      });
    }
  }, {
    key: 'handleGatewayResponse',
    value: function handleGatewayResponse() {
      var _this3 = this;

      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          envKey = _ref3.envKey,
          data = _ref3.data;

      return new Promise(function (resolve, reject) {
        decrypt(data, {
          privateKeyFile: _this3.config.privateKeyFile,
          key: envKey
        }).then(function (data) {
          console.log('response data from MobilPay', data);
          var parser = new xml2js.Parser({ explicitArray: false });

          parser.parseString(data, function (err, result) {
            if (err) {
              return reject(err);
            }
            console.log('result  decrypted data from MobilPay', result);

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
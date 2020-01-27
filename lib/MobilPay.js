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

const CardRequest = require('./request/CardRequest');
const RequestError = require('./errors/RequestError');
const constants = require('./constants');
const encrypt = require('./utils').encrypt;
const decrypt = require('./utils').decrypt;
const Promise = require('es6-promise').Promise;
const xml2js = require('xml2js');
const _ = require('lodash');
const Notify = require('./Notify');
const request = require('request');

class MobilPay {

  /**
   * @param {MobilPayConfig} config
   */
  constructor(config) {

    if (!config) {
      throw new Error('Config is required');
    }

    this.config = Object.assign({
      currency: 'RON',
      serviceType: constants.SERVICE_STANDARD_PAYMENT,
      paymentType: constants.PAYMENT_TYPE_CARD,
      sandbox: false,
      privateKeyFile: '',
      publicKeyFile: '',
    }, config);

    if (this.config.serviceType !== constants.SERVICE_STANDARD_PAYMENT &&
        this.config.serviceType !== constants.SERVICE_PREFILLED_CARD_DATA_PAYMENT) {
      throw new Error('Unsupported service type');
    }

    if (this.config.paymentType !== constants.PAYMENT_TYPE_CARD) {
      throw new Error('Unsupported payment type');
    }

    if(!this.config.signature) {
      throw new Error('Missing merchant signature');
    }
  }

  createRequest(data) {
    let params = data || {};

    params.paymentType = this.config.paymentType;
    params.signature = this.config.signature;
    params.returnUrl = this.config.returnUrl;
    params.currency = this.config.currency;

    if (params.paymentType === constants.PAYMENT_TYPE_CARD) {
      return new CardRequest(params);
    }

    throw new RequestError(`Payment type '${params.paymentType}' not supported`);
  }

  prepareRedirectData(request) {
    return new Promise((resolve, reject) => {
      const xml = request.toXml();

      encrypt(xml, { publicKeyFile: this.config.publicKeyFile})
        .then((result) => {
          resolve({
            'url': constants.REQUEST_ENDPOINTS[this.config.serviceType][this.config.sandbox ? constants.SANDBOX_MODE : constants.LIVE_MODE],
            'envKey': result.key,
            'data': result.message
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getSessionId({ username, password }) {
    if (!username) {
      throw new Error('username is required')
    }

    if (!password) {
      throw new Error('password is required')
    }

    return new Promise((resolve, reject) => {
      const url = constants.REQUEST_ENDPOINTS.login[this.config.sandbox ? constants.SANDBOX_MODE : constants.LIVE_MODE];
      const builder = new xml2js.Builder();
      const xml = builder.buildObject({
        "soapenv:Envelope": {
          "$": {
            "xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
            "xmlns:pay": url
          },
          "soapenv:Header": [],
          "soapenv:Body": [
            {
              "pay:logIn": [
                {
                  "request": [
                    {
                      "username": [
                        username
                      ],
                      "password": [
                        password
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      })

      const options = {
        url: url,
        body: xml,
        headers: { 'Content-Type': 'text/xml' }
      }

      request.post(options, (err, response, body) => {
        if (err) {
          reject(err)
        }

        const parser = new xml2js.Parser({ explicitArray: false });
        parser.parseString(body, (err, result) => {
          if(err) {
            reject(err);
          }


          console.log(result)
          const sessionId = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']
          resolve({sessionId: sessionId})
        })  
      })

    })
  }

  creditInvoice({ sessionId, orderId, amount }) {
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
      throw new Error('Invalid amount value. A minimum of ' +
        '0.10 and a maximum of 99999 units are permitted ');
    }

    return new Promise((resolve, reject) => {
      const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pay="http://sandboxsecure.mobilpay.ro/api/payment2/">
        <soapenv:Header/>
        <soapenv:Body>
            <pay:credit>
              <request>
                  <sessionId>${sessionId}</sessionId>
                  <sacId>${signature}</sacId>
                  <orderId>${orderId}</orderId>
                  <amount>${amount}</amount>
              </request>
            </pay:credit>
        </soapenv:Body>
      </soapenv:Envelope>`

      const options = {
        url: constants.REQUEST_ENDPOINTS.login,
        body: xml,
        headers: { 'Content-Type': 'text/xml' }
      }

      request.post(options, (err, response, body) => {
        if (err) {
          reject(err)
        }

        const parser = new xml2js.Parser({ explicitArray: false });
        parser.parseString(body, (err, result) => {
          if(err) {
            return reject(err);
          }


          console.log(result)
          const sessionId = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']
          resolve({sessionId: sessionId})
        })        
      })
    })
  }

  handleGatewayResponse({ envKey, data } = {}) {
    return new Promise((resolve, reject) => {
      decrypt(data, {
        privateKeyFile: this.config.privateKeyFile,
        key: envKey,
      })
        .then((data) => {
          console.log('response data from MobilPay', data)
          const parser = new xml2js.Parser({ explicitArray: false });
          
          parser.parseString(data, (err, result) => {
            if(err) {
              return reject(err);
            }
            console.log('result  decrypted data from MobilPay', result)

            if (!result.order) {
              return reject(new Error('Invalid XML data'));
            }

            let notify = null;
            let order = null;

            if(result.order.mobilpay && _.isFunction(Notify.xmlDataToAttributes)) {
              notify = Notify.fromXmlData(result.order.mobilpay);
            }

            if(result.order['$'].type
              && result.order['$'].type == constants.PAYMENT_TYPE_CARD) {
              if(_.isFunction(CardRequest.fromXmlData)) {
                order = CardRequest.fromXmlData(result);
              }
            }

            resolve({
              order,
              response: notify
            });
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

module.exports = MobilPay;

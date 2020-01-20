const RequestError = require('./errors/RequestError');
const ContactInfo = require('./ContactInfo');
const _ = require('lodash');

class CancelPayment {

  constructor(params) {

    if(!params) {
      throw new RequestError('Params object is required');
    }

    if (!params.amount) {
      throw new RequestError('Missing amount');
    }

    if (params.amount < 0.1 || params.amount > 99999) {
      throw new RequestError('Invalid amount value. A minimum of ' +
        '0.10 and a maximum of 99999 units are permitted ');
    }

    Object.assign(this, _.pick(params, [
      'orderId', 'amount'
    ]));

  }

  toXmlData() {
    const xml = {
      'amount': this.amount,
      'orderId': this.orderId,
    };

    return xml;
  }

  static xmlDataToAttributes(xmlData) {
    const attributes = {};
    const cancelPaymentAttributes = xmlData['$'] || {};

    if(cancelPaymentAttributes.amount) {
      attributes.amount = cancelPaymentAttributes.amount;
    };
    
    if(cancelPaymentAttributes.orderId) {
      attributes.orderId = cancelPaymentAttributes.orderId;
    };

    return attributes;
  }

  static fromXmlData(xmlData) {
    const attributes = this.xmlDataToAttributes(xmlData);

    return new CancelPayment(attributes);
  }
}

module.exports = CancelPayment;

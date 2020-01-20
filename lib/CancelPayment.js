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
}

module.exports = CancelPayment;

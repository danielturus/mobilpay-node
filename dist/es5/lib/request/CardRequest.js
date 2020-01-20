'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BaseRequest = require('./BaseRequest');
var Invoice = require('./../Invoice');
var CancelPayment = require('./../CancelPayment');
var RequestError = require('../errors/RequestError');
var constants = require('../constants');
var _ = require('lodash');

var CardRequest = function (_BaseRequest) {
  _inherits(CardRequest, _BaseRequest);

  function CardRequest(params) {
    _classCallCheck(this, CardRequest);

    if (!params || typeof params === 'undefined') {
      throw new RequestError('Params object is required');
    }

    params.paymentType = constants.PAYMENT_TYPE_CARD;

    var _this = _possibleConstructorReturn(this, (CardRequest.__proto__ || Object.getPrototypeOf(CardRequest)).call(this, params));

    if (params.orderId) {
      Object.assign(_this, new CancelPayment(_.pick(params, ['orderId', 'amount'])));
    } else {
      _this.invoice = new Invoice(_.pick(params, ['amount', 'currency', 'customerId', 'tokenId', 'panMasked', 'details', 'billingAddress', 'shippingAddress']));
    }
    return _this;
  }

  _createClass(CardRequest, [{
    key: 'toXmlData',
    value: function toXmlData() {
      var xmlData = _get(CardRequest.prototype.__proto__ || Object.getPrototypeOf(CardRequest.prototype), 'toXmlData', this).call(this);

      Object.assign(xmlData.order, this.invoice.toXmlData());

      return xmlData;
    }
  }], [{
    key: 'xmlDataToAttributes',
    value: function xmlDataToAttributes(xmlData) {
      var attributes = _get(CardRequest.__proto__ || Object.getPrototypeOf(CardRequest), 'xmlDataToAttributes', this).call(this, xmlData);
      var order = xmlData.order || null;

      if (order && order.invoice && _.isFunction(Invoice.xmlDataToAttributes)) {
        Object.assign(attributes, Invoice.xmlDataToAttributes(order.invoice));
      }

      return attributes;
    }
  }, {
    key: 'fromXmlData',
    value: function fromXmlData(xmlData) {
      var attributes = this.xmlDataToAttributes(xmlData);

      return new CardRequest(attributes);
    }
  }]);

  return CardRequest;
}(BaseRequest);

module.exports = CardRequest;
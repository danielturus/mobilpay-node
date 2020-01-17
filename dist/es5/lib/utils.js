'use strict';

var md5 = require('md5');
var uuid = require('uuid');
var fs = require('fs');
var _ = require('lodash');
var Promise = require('es6-promise').Promise;
var crypto = require('crypto');
var NodeRSA = require('node-rsa');
var constants = require('./constants');
var CardRequest = require('./request/CardRequest');

module.exports.getUniqueId = getUniqueId;
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;

function getUniqueId() {
  return md5(uuid.v4());
}

function encrypt(message, options) {
  return new Promise(function (resolve, reject) {

    try {

      var randomKey = crypto.randomBytes(16);

      var cipher = crypto.createCipheriv('rc4', new Buffer(randomKey), '');
      var sealedBuf = [];
      sealedBuf.push(cipher.update(new Buffer(message)));
      sealedBuf.push(cipher.final());

      // Passing length of buffers as second arg excludes 1 loop
      var sealed = Buffer.concat(sealedBuf, sealedBuf[0].length + sealedBuf[1].length);

      var encryptedKey = new NodeRSA(fs.readFileSync(options.publicKeyFile, { encoding: 'UTF-8' }), {
        encryptionScheme: 'pkcs1'
      }).encrypt(randomKey).toString('base64');

      resolve({
        key: encryptedKey,
        message: sealed.toString('base64')
      });
    } catch (err) {
      reject(err);
    }
  });
}

function decrypt(message, options) {
  return new Promise(function (resolve, reject) {
    try {
      var randomKey = new NodeRSA(fs.readFileSync(options.privateKeyFile, { encoding: 'UTF-8' }), {
        encryptionScheme: 'pkcs1'
      }).decrypt(options.key);

      var decipher = crypto.createDecipheriv('rc4', randomKey, '');
      var decrypted = decipher.update(message, 'base64', 'utf8') + decipher.final('utf8');

      resolve(decrypted);
    } catch (err) {
      reject(err);
    }
  });
}
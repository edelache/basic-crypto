'use strict'

var crypto     = require('crypto')
var helpers    = require('./helpers')
var ctCompare  = helpers.constantTimeCompare
var newBuffer  = helpers.newBuffer
var truncateTo = helpers.truncateTo
var keyStrech  = helpers.pseudoKeyStrech
var fallback   = helpers.fallback
var isObject   = helpers.isObject
var isString   = helpers.isString

function parseOptions(__options){
	var _options = (isString(__options) ? {key: __options} : __options) || {}

	if(!isObject(_options)){
		throw new Error('options must be an object or string')
	}

	var options = {
		algorithm: 'AES-256-CTR',
		digest:    'SHA256',
		hmacSize:  fallback(_options.hmacSize, 64),
		integrity: !!_options.integrity,
		key:       _options.key     ? keyStrech(_options.key, 32) : crypto.randomBytes(32),
		hmacKey:   _options.hmacKey ? newBuffer(_options.hmacKey) : crypto.randomBytes(32),
	}

	if(options.integrity){
		let size = options.hmacSize
		if(!Number.isInteger(size) || 0 >= size){
			throw new Error('hmacSize must be a positive non-zero integer')
		}
	}

	return options
}

function BasicCrypto(_options){
	if(!(this instanceof BasicCrypto)){
		return new BasicCrypto(_options)
	}

	var options = parseOptions(_options)
	var hmacTruncate = truncateTo(options.hmacSize)

	this.encrypt = function encrypt(plainText, callback){
		var error = null
		var encrypted = null

		try{
			let hmac = ''
			let IV = crypto.randomBytes(16)

			let encryptor = crypto.createCipheriv(options.algorithm, options.key, IV)
			let cipherText = encryptor.update(plainText, 'utf8', 'hex') + encryptor.final('hex')

			if(options.integrity){
				let _hmac = crypto.createHmac(options.digest, options.hmacKey)
				_hmac.update(cipherText)
				_hmac.update(IV.toString('hex'))
				hmac = hmacTruncate(_hmac.digest('hex'))
			}

			encrypted = cipherText + '$' + IV.toString('hex') + (hmac ? ('$' + hmac) : '')
		}catch (e){
			error = e
		}
		if(!callback &&  error) throw error
		if(!callback && !error) return encrypted
		return callback(error, encrypted)
	}

	this.decrypt = function decrypt(cipherText, callback){
		var error = null
		var plainText = null

		try{
			let cBlob = cipherText.split('$')
			let cText = cBlob[0]
			let cIV   = newBuffer(cBlob[1], 'hex')
			let cHmac = cBlob[2]

			if(options.integrity){
				if(!cHmac){
					throw new Error('Missing HMAC, integrity could not be checked.')
				}

				let _hmac = crypto.createHmac(options.digest, options.hmacKey)
				_hmac.update(cText)
				_hmac.update(cIV.toString('hex'))

				let hmac = hmacTruncate(_hmac.digest('hex'))

				if(!ctCompare(hmac, cHmac)){
					throw new Error('Encrypted blob has been tampered.')
				}
			}

			let decryptor = crypto.createDecipheriv(options.algorithm, options.key, cIV)
			plainText = decryptor.update(cText, 'hex', 'utf8') + decryptor.final('utf8')
		}catch (e){
			error = e
		}
		if(!callback &&  error) throw error
		if(!callback && !error) return plainText
		return callback(error, plainText)
	}

	return this
}

module.exports = BasicCrypto

'use strict'

var test = require('tape')
var BasicCrypto = require('.')

function label(a, b, c, d){
	// (instantiationMethod, testTitle, customValue?, instanceDescriptor)
	if(arguments.length === 3){
		return '['+a+'] '+b+' -- '+c
	}
	if(arguments.length === 4){
		return '['+a+'] '+b+' ('+c+') -- '+d
	}
	throw new Error('LABEL: wrong number of arguments')
}

function instantiation(mode, _testName, basicCryptoOptions){
	var testName = label(mode, 'create instance', _testName)
	test(testName, function(t){
		var basicCrypto
		t.doesNotThrow(function(){
			if(mode === 'explicit'){
				basicCrypto = new BasicCrypto(basicCryptoOptions)
			}else{
				basicCrypto = BasicCrypto(basicCryptoOptions)
			}
		}, 'sucessfuly creates')
		t.ok(basicCrypto.encrypt, 'has encryption method')
		t.ok(basicCrypto.decrypt, 'has decryption method')
		t.end()
	})
}

function encryptionDecryption(mode, _testName, basicCryptoOptions, inputType, plainText){
	var testName = label(mode, 'sync encryption-decryption', inputType, _testName)
	test(testName, function(t){
		var basicCrypto
		if(mode === 'explicit'){
			basicCrypto = new BasicCrypto(basicCryptoOptions)
		}else{
			basicCrypto = BasicCrypto(basicCryptoOptions)
		}

		var encrypted
		var decrypted

		t.doesNotThrow(function(){
			encrypted = basicCrypto.encrypt(plainText)
		})
		t.doesNotThrow(function(){
			decrypted = basicCrypto.decrypt(encrypted)
		})

		t.equal(plainText, decrypted)
		t.notEqual(encrypted, plainText)
		t.end()
	})
}
encryptionDecryption.inputs = [
	['ascii', 'hello world!'],
	['utf-8', 'abcd😜§±4563'],
]

function asyncEncryptionDecryption(mode, _testName, basicCryptoOptions, inputType, plainText){
	var testName = label(mode, 'async encryption-decryption', inputType, _testName)
	test(testName, function(t){
		var basicCrypto
		if(mode === 'explicit'){
			basicCrypto = new BasicCrypto(basicCryptoOptions)
		}else{
			basicCrypto = BasicCrypto(basicCryptoOptions)
		}

		basicCrypto.encrypt(plainText, function(err, encrypted){
			t.error(err)
			t.notEqual(encrypted, plainText)
			basicCrypto.decrypt(encrypted, function(err, decrypted){
				t.error(err)
				t.equal(plainText, decrypted)
				t.end()
			})
		})
	})
}
asyncEncryptionDecryption.inputs = [
	['ascii', 'hello world!'],
	['utf-8', 'abcd😜§±4563'],
]

function truncateHMAC(mode, _testName, basicCryptoOptions, hmacSize){
	if(!basicCryptoOptions || !basicCryptoOptions.integrity){return}
	var plainText = 'abcd😜§±4563'

	var testName = label(mode, 'truncate HMAC', hmacSize, _testName)
	var instanceOptions = Object.assign({}, basicCryptoOptions, {hmacSize: +hmacSize})
	test(testName, function(t){
		var basicCrypto = new BasicCrypto(instanceOptions)
		var encrypted
		var decrypted

		t.doesNotThrow(function(){
			encrypted = basicCrypto.encrypt(plainText)
		})
		t.doesNotThrow(function(){
			decrypted = basicCrypto.decrypt(encrypted)
		})

		t.equal(plainText, decrypted)
		t.notEqual(encrypted, plainText)
		t.ok(hmacSize >= encrypted.split('$')[2].length)
		t.end()
	})
}
truncateHMAC.inputs = [
	1, 11, 12, 16, 22, 23, 31, 32, 64, 65, 1000,
]

function rejectInvalidHmacSize(mode, _testName, basicCryptoOptions, hmacSize){
	if(!basicCryptoOptions || !basicCryptoOptions.integrity){return}
	
	var testName = label(mode, 'reject invalid hmac size', hmacSize, _testName)
	var instanceOptions = Object.assign({}, basicCryptoOptions, {hmacSize: hmacSize})
	test(testName, function(t){
		t.throws(function(){
			new BasicCrypto(instanceOptions)
		})
		t.end()
	})
}
rejectInvalidHmacSize.inputs = [
	0, -1, 0.4, -0.33, 1/3,
]

function rejectInvalidOptions(mode, _testName, basicCryptoOptions, optionName, option){
	if(basicCryptoOptions !== null){return}
	var testName = label(mode, 'reject invalid options', optionName)
	test(testName, function(t){
		t.throws(function(){
			new BasicCrypto(option)
		})
		t.end()
	})
}
rejectInvalidOptions.inputs = [
	['array', []],
	['boolean', true],
	['date', new Date()],
	['function', function(){}],
	['error', new Error('invalid option')],
]

function hmacPresenceAbsence(mode, _testName, basicCryptoOptions){
	var plainText = 'abcd😜§±4563'
	var integrity = !!((basicCryptoOptions || {}).integrity)
	var testTitle = 'check HMAC '+(integrity ? 'presence' : 'absence')
	var testName = label(mode, testTitle, _testName)
	test(testName, function(t){
		var basicCrypto
		if(mode === 'explicit'){
			basicCrypto = new BasicCrypto(basicCryptoOptions)
		}else{
			basicCrypto = BasicCrypto(basicCryptoOptions)
		}
		var encrypted = basicCrypto.encrypt(plainText)
		var hasHmac   = !!encrypted.split('$')[2]
		t.equal(integrity, hasHmac)
		t.end()
	})
}

var tests = [
	instantiation,
	encryptionDecryption,
	asyncEncryptionDecryption,
	truncateHMAC,
	rejectInvalidHmacSize,
	rejectInvalidOptions,
	hmacPresenceAbsence,
]

var instances = [
	['simple', null],
	['custom key', {key: 'keyboard cat'}],
	['custom key (unicode)', {key: 'example😜password§±`\'echo'}],
	['custom key (string only)', 'example😜password§±`\'echo'],
	['integrity checking', {integrity: true}],
	['integrity checking, custom hmac key', {integrity: true, hmacKey: 'abcd4563'}],
	['integrity checking, custom hmac key (unicode)', {integrity: true, hmacKey: 'abcd😜§±4563'}],
]

var instantiations = ['implied', 'explicit']

instantiations.forEach(function(instantiationMethod){
	tests.forEach(function(testFn){
		var inputs = testFn.inputs || [null]
		inputs.forEach(function(input){
			instances.forEach(function(instance){
				var args = (input === null) ? instance : instance.concat(input)
				args = [instantiationMethod].concat(args)
				testFn.apply(testFn, args)
			})
		})
	})
})

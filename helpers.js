'use strict'

var crypto = require('crypto')

function constantTimeCompare(val1, val2){
	var sentinel

	if(val1.length !== val2.length){
		return false
	}

	for(var i = 0; i < val1.length; i++){
		sentinel |= val1.charCodeAt(i) ^ val2.charCodeAt(i)
	}

	return sentinel === 0
}

var newBuffer = function(_string, _encoding){
	var string = '' + _string
	var encoding = _encoding || 'utf8'
	return new Buffer(string, encoding)
}

function truncateTo(size){
	return function(string){
		return string.substring(0, size)
	}
}

function pseudoKeyStrech(key, len){
	// Intended only as a consistent way to derive a fixed length buffer,
	// from any length string. For use on server supplyed keys only.

	// for use with user supplied passwords, use real key stretching:
	// pbkdf2, bcrypt, scrypt, etc.
	return newBuffer(truncateTo(len)(crypto.createHash('sha256').update(key).digest('hex')))
}

function fallback(v, d){
	return (typeof v === 'undefined') ? d : v
}

function isObject(thing){
	return Object.prototype.toString.call(thing) === '[object Object]'
}
function isString(thing){
	return typeof thing === 'string'
}

module.exports = {
	constantTimeCompare: constantTimeCompare,
	newBuffer: newBuffer,
	truncateTo: truncateTo,
	pseudoKeyStrech: pseudoKeyStrech,
	fallback: fallback,
	isObject: isObject,
	isString: isString,
}

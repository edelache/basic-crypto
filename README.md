# basic-crypto

[![Build](https://travis-ci.org/leonardodino/basic-crypto.svg?branch=master)](http://travis-ci.org/leonardodino/basic-crypto)

Basic, high-level, opnionated crypto suite. <sup id="a1">[1](#f1)</sup>

This module lets you encrypt and decrypt strings in your Node.js application.
It's goal is to be a simplified interface to the many, _sometimes confusing_, methods of the `crypto` module.


## Features:

- [x] dependency-free -- except node's internal `crypto` module <sup id="a1">[1](#f1)</sup>
- [x] simple api -- `encrypt(plaintext)` & `decrypt(cypherText)`
- [x] message authentication -- turn on by setting `{integrity: true}`
- [x] encryption and hash keys pinning, or generating them on-the-fly
- [x] tested -- my first atempt at a _"decently tested"_ module <sup id="a2">[2](#f2)</sup>
- [x] secure -- protected against HMAC timing attack, uses PRNG IV, etc
- [x] convenient useage -- methods provides both sync and async signatures
- [x] very small codebase -- easy to examine
- [ ] proper key stretching -- safe to handle user provided criptographic keys <sup id="a3">[3](#f3)</sup>
- [ ] truly async methods -- leverage streaming crypto functions <sup id="a4">[4](#f4)</sup>


## Install

```shell
$ npm install --save basic-crypto
```


## Usage

#### Constructor

This module provides a regular js constructor, which is initializated with options.
For conveinience it can be called with or without the `new` keyword.

```javascript
var basicCrypto = require('basic-crypto')(options)
```
_is the same as_
```javascript
var BasicCrypto = require('basic-crypto')
var basicCrypto = new BasicCrypto(options)
```

for options, see ["Modes"](#modes)

#### Methods

There are only two methods in each instance, the function signature is the same:

**syncronous:**
accepts only one argument. <sup id="a5">[5](#f5)</sup>
```javascript
var plainText = 'any string, multibyte support, etc'
var encrypted = basicCrypto.encrypt(plainText)
var decrypted = basicCrypto.decrypt(encrypted)
console.log(decrypted === plainText) //true
```

**asyncronous:**
accepts only an argument and a standard node callback.
```javascript
var plainText = 'any string, multibyte support, etc'
basicCrypto.encrypt(plainText, function(err, encrypted){
    basicCrypto.decrypt(encrypted, function(err, decrypted){
        console.log(decrypted === plainText) //true
    })
})
```


## Modes

This module can operate, _transparently_, in two distinct ways:
- ["Encrypt only"](#encrypt-only)
- ["Encrypt then sign"](#encrypt-then-sign)

#### Encrypt only

This is the default behaviour, but it's advisable to only use it in already signed enviroments,
as encryption alone doesn't guarantees the origin and/or the integrity of the data.

A possible use case is inside a `JWT`, to encrypt a property.

**valid options:**
- **`key:`** `[string, optional]` Set a fixed cryptographic key. <sup id="a6">[6](#f6)</sup>

#### Encrypt then sign

The second method is enabled by passing `{integrity: true}` to the constructor.
After encrypting, it will append an HMAC of the encrypted text to the end of the block.
When decrypting this block, it will first check the HMAC signature, and then decrypt it.
When any "weird thing" occurs in either phase, the process is halted with an error.

**valid options:**
- **`key:`** `[string, optional]` Set a fixed cryptographic key. <sup id="a6">[6](#f6)</sup>
- **`integrity:`** `[boolean, required]` To enable signing this property must be `true`.
- **`hmacKey:`** `[string, optional]` set a fixed signing key. <sup id="a6">[6](#f6)</sup>
- **`hmacSize:`** `[integer, optional]` truncate signature to this length.


## Error handling

- Syncronous invocations will throw an error if something goes awry.
- Asyncronous invocations follows node style callback, `(err, result)`.


## Compatibility

- **`node:`** `v4.0.0` or later


## Tests

```shell
$ npm install
$ npm test
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. Contact-me personally instead.


## Author

[Leonardo Dino](https://github.com/leonardodino/)


## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.


## Footnotes

<span id="f0">`0`</span> As usual, everything is provided "AS-IS", no liability, but I might be using this code in production. Shhhh. [↩](#a0) <br/>
<span id="f1">`1`</span> And some usual test module, as dev-dependency. [↩](#a1) <br/>
<span id="f2">`2`</span> Accepting pull requests of unit tests for the helper library. [↩](#a2) <br/>
<span id="f3">`3`</span> Accepting pull requests of a method implementing pbkdf2. [↩](#a3) <br/>
<span id="f4">`4`</span> Unfortunelly this leads to code duplication, as the sync methods can't support it. [↩](#a4) <br/>
<span id="f5">`5`</span> Syncronous code should be always wraped inside a try-catch block, as any erros are thrown. [↩](#a5) <br/>
<span id="f6">`6`</span> A fixed key is useful when talking to other processes, or storing the key for later. When not provided a key will be generated randomly on the fly, but it's not possible to access this value, and it's unique in each instantiation. [↩](#a6)

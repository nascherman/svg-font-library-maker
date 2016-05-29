(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync();
 
const attributes = {fill: 'red', stroke: 'black'};
const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};
 
//const svg = textToSVG.getSVG('hello', options);

require('domready')(function() {
//	console.log(svg);
//	document.body.appendChild(svg);	
});
 

},{"domready":5,"text-to-svg":39}],2:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":2,"ieee754":6,"isarray":7}],5:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? setTimeout(fn, 0) : fns.push(fn)
  }

});

},{}],6:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],7:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],8:[function(require,module,exports){
// Run-time checking of preconditions.

'use strict';

// Precondition function that checks if the given predicate is true.
// If not, it will throw an error.
exports.argument = function(predicate, message) {
    if (!predicate) {
        throw new Error(message);
    }
};

// Precondition function that checks if the given assertion is true.
// If not, it will throw an error.
exports.assert = exports.argument;

},{}],9:[function(require,module,exports){
// Drawing utility functions.

'use strict';

// Draw a line on the given context from point `x1,y1` to point `x2,y2`.
function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

exports.line = line;

},{}],10:[function(require,module,exports){
// Glyph encoding

'use strict';

var cffStandardStrings = [
    '.notdef', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright',
    'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two',
    'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater',
    'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
    'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', 'exclamdown', 'cent', 'sterling',
    'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle', 'quotedblleft', 'guillemotleft',
    'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'endash', 'dagger', 'daggerdbl', 'periodcentered', 'paragraph',
    'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis', 'perthousand',
    'questiondown', 'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'dieresis', 'ring',
    'cedilla', 'hungarumlaut', 'ogonek', 'caron', 'emdash', 'AE', 'ordfeminine', 'Lslash', 'Oslash', 'OE',
    'ordmasculine', 'ae', 'dotlessi', 'lslash', 'oslash', 'oe', 'germandbls', 'onesuperior', 'logicalnot', 'mu',
    'trademark', 'Eth', 'onehalf', 'plusminus', 'Thorn', 'onequarter', 'divide', 'brokenbar', 'degree', 'thorn',
    'threequarters', 'twosuperior', 'registered', 'minus', 'eth', 'multiply', 'threesuperior', 'copyright',
    'Aacute', 'Acircumflex', 'Adieresis', 'Agrave', 'Aring', 'Atilde', 'Ccedilla', 'Eacute', 'Ecircumflex',
    'Edieresis', 'Egrave', 'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Ntilde', 'Oacute', 'Ocircumflex',
    'Odieresis', 'Ograve', 'Otilde', 'Scaron', 'Uacute', 'Ucircumflex', 'Udieresis', 'Ugrave', 'Yacute',
    'Ydieresis', 'Zcaron', 'aacute', 'acircumflex', 'adieresis', 'agrave', 'aring', 'atilde', 'ccedilla', 'eacute',
    'ecircumflex', 'edieresis', 'egrave', 'iacute', 'icircumflex', 'idieresis', 'igrave', 'ntilde', 'oacute',
    'ocircumflex', 'odieresis', 'ograve', 'otilde', 'scaron', 'uacute', 'ucircumflex', 'udieresis', 'ugrave',
    'yacute', 'ydieresis', 'zcaron', 'exclamsmall', 'Hungarumlautsmall', 'dollaroldstyle', 'dollarsuperior',
    'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', '266 ff', 'onedotenleader',
    'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle', 'fouroldstyle', 'fiveoldstyle', 'sixoldstyle',
    'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'commasuperior', 'threequartersemdash', 'periodsuperior',
    'questionsmall', 'asuperior', 'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', 'isuperior', 'lsuperior',
    'msuperior', 'nsuperior', 'osuperior', 'rsuperior', 'ssuperior', 'tsuperior', 'ff', 'ffi', 'ffl',
    'parenleftinferior', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall',
    'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall',
    'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall',
    'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', 'exclamdownsmall',
    'centoldstyle', 'Lslashsmall', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall', 'Brevesmall', 'Caronsmall',
    'Dotaccentsmall', 'Macronsmall', 'figuredash', 'hypheninferior', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall',
    'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds',
    'zerosuperior', 'foursuperior', 'fivesuperior', 'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior',
    'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior',
    'seveninferior', 'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior',
    'commainferior', 'Agravesmall', 'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall',
    'Aringsmall', 'AEsmall', 'Ccedillasmall', 'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall',
    'Igravesmall', 'Iacutesmall', 'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall',
    'Oacutesmall', 'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall',
    'Uacutesmall', 'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall', '001.000',
    '001.001', '001.002', '001.003', 'Black', 'Bold', 'Book', 'Light', 'Medium', 'Regular', 'Roman', 'Semibold'];

var cffStandardEncoding = [
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright',
    'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two',
    'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater',
    'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
    'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'exclamdown', 'cent', 'sterling', 'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle',
    'quotedblleft', 'guillemotleft', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', '', 'endash', 'dagger',
    'daggerdbl', 'periodcentered', '', 'paragraph', 'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright',
    'guillemotright', 'ellipsis', 'perthousand', '', 'questiondown', '', 'grave', 'acute', 'circumflex', 'tilde',
    'macron', 'breve', 'dotaccent', 'dieresis', '', 'ring', 'cedilla', '', 'hungarumlaut', 'ogonek', 'caron',
    'emdash', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'AE', '', 'ordfeminine', '', '', '',
    '', 'Lslash', 'Oslash', 'OE', 'ordmasculine', '', '', '', '', '', 'ae', '', '', '', 'dotlessi', '', '',
    'lslash', 'oslash', 'oe', 'germandbls'];

var cffExpertEncoding = [
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', 'space', 'exclamsmall', 'Hungarumlautsmall', '', 'dollaroldstyle', 'dollarsuperior',
    'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', 'twodotenleader', 'onedotenleader',
    'comma', 'hyphen', 'period', 'fraction', 'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle',
    'fouroldstyle', 'fiveoldstyle', 'sixoldstyle', 'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'colon',
    'semicolon', 'commasuperior', 'threequartersemdash', 'periodsuperior', 'questionsmall', '', 'asuperior',
    'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', '', '', 'isuperior', '', '', 'lsuperior', 'msuperior',
    'nsuperior', 'osuperior', '', '', 'rsuperior', 'ssuperior', 'tsuperior', '', 'ff', 'fi', 'fl', 'ffi', 'ffl',
    'parenleftinferior', '', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall',
    'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall',
    'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall',
    'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'exclamdownsmall', 'centoldstyle', 'Lslashsmall', '', '', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall',
    'Brevesmall', 'Caronsmall', '', 'Dotaccentsmall', '', '', 'Macronsmall', '', '', 'figuredash', 'hypheninferior',
    '', '', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall', '', '', '', 'onequarter', 'onehalf', 'threequarters',
    'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds', '',
    '', 'zerosuperior', 'onesuperior', 'twosuperior', 'threesuperior', 'foursuperior', 'fivesuperior',
    'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior', 'zeroinferior', 'oneinferior', 'twoinferior',
    'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior', 'eightinferior',
    'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior', 'commainferior', 'Agravesmall',
    'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall', 'Aringsmall', 'AEsmall', 'Ccedillasmall',
    'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall', 'Igravesmall', 'Iacutesmall',
    'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall', 'Oacutesmall',
    'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall', 'Uacutesmall',
    'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall'];

var standardNames = [
    '.notdef', '.null', 'nonmarkingreturn', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent',
    'ampersand', 'quotesingle', 'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash',
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less',
    'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright',
    'asciicircum', 'underscore', 'grave', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde',
    'Adieresis', 'Aring', 'Ccedilla', 'Eacute', 'Ntilde', 'Odieresis', 'Udieresis', 'aacute', 'agrave',
    'acircumflex', 'adieresis', 'atilde', 'aring', 'ccedilla', 'eacute', 'egrave', 'ecircumflex', 'edieresis',
    'iacute', 'igrave', 'icircumflex', 'idieresis', 'ntilde', 'oacute', 'ograve', 'ocircumflex', 'odieresis',
    'otilde', 'uacute', 'ugrave', 'ucircumflex', 'udieresis', 'dagger', 'degree', 'cent', 'sterling', 'section',
    'bullet', 'paragraph', 'germandbls', 'registered', 'copyright', 'trademark', 'acute', 'dieresis', 'notequal',
    'AE', 'Oslash', 'infinity', 'plusminus', 'lessequal', 'greaterequal', 'yen', 'mu', 'partialdiff', 'summation',
    'product', 'pi', 'integral', 'ordfeminine', 'ordmasculine', 'Omega', 'ae', 'oslash', 'questiondown',
    'exclamdown', 'logicalnot', 'radical', 'florin', 'approxequal', 'Delta', 'guillemotleft', 'guillemotright',
    'ellipsis', 'nonbreakingspace', 'Agrave', 'Atilde', 'Otilde', 'OE', 'oe', 'endash', 'emdash', 'quotedblleft',
    'quotedblright', 'quoteleft', 'quoteright', 'divide', 'lozenge', 'ydieresis', 'Ydieresis', 'fraction',
    'currency', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'daggerdbl', 'periodcentered', 'quotesinglbase',
    'quotedblbase', 'perthousand', 'Acircumflex', 'Ecircumflex', 'Aacute', 'Edieresis', 'Egrave', 'Iacute',
    'Icircumflex', 'Idieresis', 'Igrave', 'Oacute', 'Ocircumflex', 'apple', 'Ograve', 'Uacute', 'Ucircumflex',
    'Ugrave', 'dotlessi', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'ring', 'cedilla', 'hungarumlaut',
    'ogonek', 'caron', 'Lslash', 'lslash', 'Scaron', 'scaron', 'Zcaron', 'zcaron', 'brokenbar', 'Eth', 'eth',
    'Yacute', 'yacute', 'Thorn', 'thorn', 'minus', 'multiply', 'onesuperior', 'twosuperior', 'threesuperior',
    'onehalf', 'onequarter', 'threequarters', 'franc', 'Gbreve', 'gbreve', 'Idotaccent', 'Scedilla', 'scedilla',
    'Cacute', 'cacute', 'Ccaron', 'ccaron', 'dcroat'];

// This is the encoding used for fonts created from scratch.
// It loops through all glyphs and finds the appropriate unicode value.
// Since it's linear time, other encodings will be faster.
function DefaultEncoding(font) {
    this.font = font;
}

DefaultEncoding.prototype.charToGlyphIndex = function(c) {
    var code = c.charCodeAt(0);
    var glyphs = this.font.glyphs;
    if (glyphs) {
        for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs.get(i);
            for (var j = 0; j < glyph.unicodes.length; j += 1) {
                if (glyph.unicodes[j] === code) {
                    return i;
                }
            }
        }
    } else {
        return null;
    }
};

function CmapEncoding(cmap) {
    this.cmap = cmap;
}

CmapEncoding.prototype.charToGlyphIndex = function(c) {
    return this.cmap.glyphIndexMap[c.charCodeAt(0)] || 0;
};

function CffEncoding(encoding, charset) {
    this.encoding = encoding;
    this.charset = charset;
}

CffEncoding.prototype.charToGlyphIndex = function(s) {
    var code = s.charCodeAt(0);
    var charName = this.encoding[code];
    return this.charset.indexOf(charName);
};

function GlyphNames(post) {
    var i;
    switch (post.version) {
        case 1:
            this.names = exports.standardNames.slice();
            break;
        case 2:
            this.names = new Array(post.numberOfGlyphs);
            for (i = 0; i < post.numberOfGlyphs; i++) {
                if (post.glyphNameIndex[i] < exports.standardNames.length) {
                    this.names[i] = exports.standardNames[post.glyphNameIndex[i]];
                } else {
                    this.names[i] = post.names[post.glyphNameIndex[i] - exports.standardNames.length];
                }
            }

            break;
        case 2.5:
            this.names = new Array(post.numberOfGlyphs);
            for (i = 0; i < post.numberOfGlyphs; i++) {
                this.names[i] = exports.standardNames[i + post.glyphNameIndex[i]];
            }

            break;
        case 3:
            this.names = [];
            break;
    }
}

GlyphNames.prototype.nameToGlyphIndex = function(name) {
    return this.names.indexOf(name);
};

GlyphNames.prototype.glyphIndexToName = function(gid) {
    return this.names[gid];
};

function addGlyphNames(font) {
    var glyph;
    var glyphIndexMap = font.tables.cmap.glyphIndexMap;
    var charCodes = Object.keys(glyphIndexMap);

    for (var i = 0; i < charCodes.length; i += 1) {
        var c = charCodes[i];
        var glyphIndex = glyphIndexMap[c];
        glyph = font.glyphs.get(glyphIndex);
        glyph.addUnicode(parseInt(c));
    }

    for (i = 0; i < font.glyphs.length; i += 1) {
        glyph = font.glyphs.get(i);
        if (font.cffEncoding) {
            glyph.name = font.cffEncoding.charset[i];
        } else {
            glyph.name = font.glyphNames.glyphIndexToName(i);
        }
    }
}

exports.cffStandardStrings = cffStandardStrings;
exports.cffStandardEncoding = cffStandardEncoding;
exports.cffExpertEncoding = cffExpertEncoding;
exports.standardNames = standardNames;
exports.DefaultEncoding = DefaultEncoding;
exports.CmapEncoding = CmapEncoding;
exports.CffEncoding = CffEncoding;
exports.GlyphNames = GlyphNames;
exports.addGlyphNames = addGlyphNames;

},{}],11:[function(require,module,exports){
// The Font object

'use strict';

var path = require('./path');
var sfnt = require('./tables/sfnt');
var encoding = require('./encoding');
var glyphset = require('./glyphset');
var util = require('./util');

// A Font represents a loaded OpenType font file.
// It contains a set of glyphs and methods to draw text on a drawing context,
// or to get a path representing the text.
function Font(options) {
    options = options || {};

    if (!options.empty) {
        // Check that we've provided the minimum set of names.
        util.checkArgument(options.familyName, 'When creating a new Font object, familyName is required.');
        util.checkArgument(options.styleName, 'When creating a new Font object, styleName is required.');
        util.checkArgument(options.unitsPerEm, 'When creating a new Font object, unitsPerEm is required.');
        util.checkArgument(options.ascender, 'When creating a new Font object, ascender is required.');
        util.checkArgument(options.descender, 'When creating a new Font object, descender is required.');
        util.checkArgument(options.descender < 0, 'Descender should be negative (e.g. -512).');

        // OS X will complain if the names are empty, so we put a single space everywhere by default.
        this.names = {
            fontFamily: {en: options.familyName || ' '},
            fontSubfamily: {en: options.styleName || ' '},
            fullName: {en: options.fullName || options.familyName + ' ' + options.styleName},
            postScriptName: {en: options.postScriptName || options.familyName + options.styleName},
            designer: {en: options.designer || ' '},
            designerURL: {en: options.designerURL || ' '},
            manufacturer: {en: options.manufacturer || ' '},
            manufacturerURL: {en: options.manufacturerURL || ' '},
            license: {en: options.license || ' '},
            licenseURL: {en: options.licenseURL || ' '},
            version: {en: options.version || 'Version 0.1'},
            description: {en: options.description || ' '},
            copyright: {en: options.copyright || ' '},
            trademark: {en: options.trademark || ' '}
        };
        this.unitsPerEm = options.unitsPerEm || 1000;
        this.ascender = options.ascender;
        this.descender = options.descender;
    }

    this.supported = true; // Deprecated: parseBuffer will throw an error if font is not supported.
    this.glyphs = new glyphset.GlyphSet(this, options.glyphs || []);
    this.encoding = new encoding.DefaultEncoding(this);
    this.tables = {};
}

// Check if the font has a glyph for the given character.
Font.prototype.hasChar = function(c) {
    return this.encoding.charToGlyphIndex(c) !== null;
};

// Convert the given character to a single glyph index.
// Note that this function assumes that there is a one-to-one mapping between
// the given character and a glyph; for complex scripts this might not be the case.
Font.prototype.charToGlyphIndex = function(s) {
    return this.encoding.charToGlyphIndex(s);
};

// Convert the given character to a single Glyph object.
// Note that this function assumes that there is a one-to-one mapping between
// the given character and a glyph; for complex scripts this might not be the case.
Font.prototype.charToGlyph = function(c) {
    var glyphIndex = this.charToGlyphIndex(c);
    var glyph = this.glyphs.get(glyphIndex);
    if (!glyph) {
        // .notdef
        glyph = this.glyphs.get(0);
    }

    return glyph;
};

// Convert the given text to a list of Glyph objects.
// Note that there is no strict one-to-one mapping between characters and
// glyphs, so the list of returned glyphs can be larger or smaller than the
// length of the given string.
Font.prototype.stringToGlyphs = function(s) {
    var glyphs = [];
    for (var i = 0; i < s.length; i += 1) {
        var c = s[i];
        glyphs.push(this.charToGlyph(c));
    }

    return glyphs;
};

Font.prototype.nameToGlyphIndex = function(name) {
    return this.glyphNames.nameToGlyphIndex(name);
};

Font.prototype.nameToGlyph = function(name) {
    var glyphIndex = this.nametoGlyphIndex(name);
    var glyph = this.glyphs.get(glyphIndex);
    if (!glyph) {
        // .notdef
        glyph = this.glyphs.get(0);
    }

    return glyph;
};

Font.prototype.glyphIndexToName = function(gid) {
    if (!this.glyphNames.glyphIndexToName) {
        return '';
    }

    return this.glyphNames.glyphIndexToName(gid);
};

// Retrieve the value of the kerning pair between the left glyph (or its index)
// and the right glyph (or its index). If no kerning pair is found, return 0.
// The kerning value gets added to the advance width when calculating the spacing
// between glyphs.
Font.prototype.getKerningValue = function(leftGlyph, rightGlyph) {
    leftGlyph = leftGlyph.index || leftGlyph;
    rightGlyph = rightGlyph.index || rightGlyph;
    var gposKerning = this.getGposKerningValue;
    return gposKerning ? gposKerning(leftGlyph, rightGlyph) :
        (this.kerningPairs[leftGlyph + ',' + rightGlyph] || 0);
};

// Helper function that invokes the given callback for each glyph in the given text.
// The callback gets `(glyph, x, y, fontSize, options)`.
Font.prototype.forEachGlyph = function(text, x, y, fontSize, options, callback) {
    x = x !== undefined ? x : 0;
    y = y !== undefined ? y : 0;
    fontSize = fontSize !== undefined ? fontSize : 72;
    options = options || {};
    var kerning = options.kerning === undefined ? true : options.kerning;
    var fontScale = 1 / this.unitsPerEm * fontSize;
    var glyphs = this.stringToGlyphs(text);
    for (var i = 0; i < glyphs.length; i += 1) {
        var glyph = glyphs[i];
        callback(glyph, x, y, fontSize, options);
        if (glyph.advanceWidth) {
            x += glyph.advanceWidth * fontScale;
        }

        if (kerning && i < glyphs.length - 1) {
            var kerningValue = this.getKerningValue(glyph, glyphs[i + 1]);
            x += kerningValue * fontScale;
        }
    }
};

// Create a Path object that represents the given text.
//
// text - The text to create.
// x - Horizontal position of the beginning of the text. (default: 0)
// y - Vertical position of the *baseline* of the text. (default: 0)
// fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
// Options is an optional object that contains:
// - kerning - Whether to take kerning information into account. (default: true)
//
// Returns a Path object.
Font.prototype.getPath = function(text, x, y, fontSize, options) {
    var fullPath = new path.Path();
    this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
        var glyphPath = glyph.getPath(gX, gY, gFontSize);
        fullPath.extend(glyphPath);
    });

    return fullPath;
};

// Create an array of Path objects that represent the glyps of a given text.
//
// text - The text to create.
// x - Horizontal position of the beginning of the text. (default: 0)
// y - Vertical position of the *baseline* of the text. (default: 0)
// fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
// Options is an optional object that contains:
// - kerning - Whether to take kerning information into account. (default: true)
//
// Returns an array of Path objects.
Font.prototype.getPaths = function(text, x, y, fontSize, options) {
    var glyphPaths = [];
    this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
        var glyphPath = glyph.getPath(gX, gY, gFontSize);
        glyphPaths.push(glyphPath);
    });

    return glyphPaths;
};

// Draw the text on the given drawing context.
//
// ctx - A 2D drawing context, like Canvas.
// text - The text to create.
// x - Horizontal position of the beginning of the text. (default: 0)
// y - Vertical position of the *baseline* of the text. (default: 0)
// fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
// Options is an optional object that contains:
// - kerning - Whether to take kerning information into account. (default: true)
Font.prototype.draw = function(ctx, text, x, y, fontSize, options) {
    this.getPath(text, x, y, fontSize, options).draw(ctx);
};

// Draw the points of all glyphs in the text.
// On-curve points will be drawn in blue, off-curve points will be drawn in red.
//
// ctx - A 2D drawing context, like Canvas.
// text - The text to create.
// x - Horizontal position of the beginning of the text. (default: 0)
// y - Vertical position of the *baseline* of the text. (default: 0)
// fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
// Options is an optional object that contains:
// - kerning - Whether to take kerning information into account. (default: true)
Font.prototype.drawPoints = function(ctx, text, x, y, fontSize, options) {
    this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
        glyph.drawPoints(ctx, gX, gY, gFontSize);
    });
};

// Draw lines indicating important font measurements for all glyphs in the text.
// Black lines indicate the origin of the coordinate system (point 0,0).
// Blue lines indicate the glyph bounding box.
// Green line indicates the advance width of the glyph.
//
// ctx - A 2D drawing context, like Canvas.
// text - The text to create.
// x - Horizontal position of the beginning of the text. (default: 0)
// y - Vertical position of the *baseline* of the text. (default: 0)
// fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
// Options is an optional object that contains:
// - kerning - Whether to take kerning information into account. (default: true)
Font.prototype.drawMetrics = function(ctx, text, x, y, fontSize, options) {
    this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
        glyph.drawMetrics(ctx, gX, gY, gFontSize);
    });
};

Font.prototype.getEnglishName = function(name) {
    var translations = this.names[name];
    if (translations) {
        return translations.en;
    }
};

// Validate
Font.prototype.validate = function() {
    var warnings = [];
    var _this = this;

    function assert(predicate, message) {
        if (!predicate) {
            warnings.push(message);
        }
    }

    function assertNamePresent(name) {
        var englishName = _this.getEnglishName(name);
        assert(englishName && englishName.trim().length > 0,
               'No English ' + name + ' specified.');
    }

    // Identification information
    assertNamePresent('fontFamily');
    assertNamePresent('weightName');
    assertNamePresent('manufacturer');
    assertNamePresent('copyright');
    assertNamePresent('version');

    // Dimension information
    assert(this.unitsPerEm > 0, 'No unitsPerEm specified.');
};

// Convert the font object to a SFNT data structure.
// This structure contains all the necessary tables and metadata to create a binary OTF file.
Font.prototype.toTables = function() {
    return sfnt.fontToTable(this);
};

Font.prototype.toBuffer = function() {
    console.warn('Font.toBuffer is deprecated. Use Font.toArrayBuffer instead.');
    return this.toArrayBuffer();
};

Font.prototype.toArrayBuffer = function() {
    var sfntTable = this.toTables();
    var bytes = sfntTable.encode();
    var buffer = new ArrayBuffer(bytes.length);
    var intArray = new Uint8Array(buffer);
    for (var i = 0; i < bytes.length; i++) {
        intArray[i] = bytes[i];
    }

    return buffer;
};

// Initiate a download of the OpenType font.
Font.prototype.download = function() {
    var familyName = this.getEnglishName('fontFamily');
    var styleName = this.getEnglishName('fontSubfamily');
    var fileName = familyName.replace(/\s/g, '') + '-' + styleName + '.otf';
    var arrayBuffer = this.toArrayBuffer();

    if (util.isBrowser()) {
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        window.requestFileSystem(window.TEMPORARY, arrayBuffer.byteLength, function(fs) {
            fs.root.getFile(fileName, {create: true}, function(fileEntry) {
                fileEntry.createWriter(function(writer) {
                    var dataView = new DataView(arrayBuffer);
                    var blob = new Blob([dataView], {type: 'font/opentype'});
                    writer.write(blob);

                    writer.addEventListener('writeend', function() {
                        // Navigating to the file will download it.
                        location.href = fileEntry.toURL();
                    }, false);
                });
            });
        },
        function(err) {
            throw err;
        });
    } else {
        var fs = require('fs');
        var buffer = util.arrayBufferToNodeBuffer(arrayBuffer);
        fs.writeFileSync(fileName, buffer);
    }
};

exports.Font = Font;

},{"./encoding":10,"./glyphset":13,"./path":16,"./tables/sfnt":33,"./util":35,"fs":3}],12:[function(require,module,exports){
// The Glyph object

'use strict';

var check = require('./check');
var draw = require('./draw');
var path = require('./path');

function getPathDefinition(glyph, path) {
    var _path = path || { commands: [] };
    return {
        configurable: true,

        get: function() {
            if (typeof _path === 'function') {
                _path = _path();
            }

            return _path;
        },

        set: function(p) {
            _path = p;
        }
    };
}

// A Glyph is an individual mark that often corresponds to a character.
// Some glyphs, such as ligatures, are a combination of many characters.
// Glyphs are the basic building blocks of a font.
//
// The `Glyph` class contains utility methods for drawing the path and its points.
function Glyph(options) {
    // By putting all the code on a prototype function (which is only declared once)
    // we reduce the memory requirements for larger fonts by some 2%
    this.bindConstructorValues(options);
}

Glyph.prototype.bindConstructorValues = function(options) {
    this.index = options.index || 0;

    // These three values cannnot be deferred for memory optimization:
    this.name = options.name || null;
    this.unicode = options.unicode || undefined;
    this.unicodes = options.unicodes || options.unicode !== undefined ? [options.unicode] : [];

    // But by binding these values only when necessary, we reduce can
    // the memory requirements by almost 3% for larger fonts.
    if (options.xMin) {
        this.xMin = options.xMin;
    }

    if (options.yMin) {
        this.yMin = options.yMin;
    }

    if (options.xMax) {
        this.xMax = options.xMax;
    }

    if (options.yMax) {
        this.yMax = options.yMax;
    }

    if (options.advanceWidth) {
        this.advanceWidth = options.advanceWidth;
    }

    // The path for a glyph is the most memory intensive, and is bound as a value
    // with a getter/setter to ensure we actually do path parsing only once the
    // path is actually needed by anything.
    Object.defineProperty(this, 'path', getPathDefinition(this, options.path));
};

Glyph.prototype.addUnicode = function(unicode) {
    if (this.unicodes.length === 0) {
        this.unicode = unicode;
    }

    this.unicodes.push(unicode);
};

// Convert the glyph to a Path we can draw on a drawing context.
//
// x - Horizontal position of the glyph. (default: 0)
// y - Vertical position of the *baseline* of the glyph. (default: 0)
// fontSize - Font size, in pixels (default: 72).
Glyph.prototype.getPath = function(x, y, fontSize) {
    x = x !== undefined ? x : 0;
    y = y !== undefined ? y : 0;
    fontSize = fontSize !== undefined ? fontSize : 72;
    var scale = 1 / this.path.unitsPerEm * fontSize;
    var p = new path.Path();
    var commands = this.path.commands;
    for (var i = 0; i < commands.length; i += 1) {
        var cmd = commands[i];
        if (cmd.type === 'M') {
            p.moveTo(x + (cmd.x * scale), y + (-cmd.y * scale));
        } else if (cmd.type === 'L') {
            p.lineTo(x + (cmd.x * scale), y + (-cmd.y * scale));
        } else if (cmd.type === 'Q') {
            p.quadraticCurveTo(x + (cmd.x1 * scale), y + (-cmd.y1 * scale),
                               x + (cmd.x * scale), y + (-cmd.y * scale));
        } else if (cmd.type === 'C') {
            p.curveTo(x + (cmd.x1 * scale), y + (-cmd.y1 * scale),
                      x + (cmd.x2 * scale), y + (-cmd.y2 * scale),
                      x + (cmd.x * scale), y + (-cmd.y * scale));
        } else if (cmd.type === 'Z') {
            p.closePath();
        }
    }

    return p;
};

// Split the glyph into contours.
// This function is here for backwards compatibility, and to
// provide raw access to the TrueType glyph outlines.
Glyph.prototype.getContours = function() {
    if (this.points === undefined) {
        return [];
    }

    var contours = [];
    var currentContour = [];
    for (var i = 0; i < this.points.length; i += 1) {
        var pt = this.points[i];
        currentContour.push(pt);
        if (pt.lastPointOfContour) {
            contours.push(currentContour);
            currentContour = [];
        }
    }

    check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
    return contours;
};

// Calculate the xMin/yMin/xMax/yMax/lsb/rsb for a Glyph.
Glyph.prototype.getMetrics = function() {
    var commands = this.path.commands;
    var xCoords = [];
    var yCoords = [];
    for (var i = 0; i < commands.length; i += 1) {
        var cmd = commands[i];
        if (cmd.type !== 'Z') {
            xCoords.push(cmd.x);
            yCoords.push(cmd.y);
        }

        if (cmd.type === 'Q' || cmd.type === 'C') {
            xCoords.push(cmd.x1);
            yCoords.push(cmd.y1);
        }

        if (cmd.type === 'C') {
            xCoords.push(cmd.x2);
            yCoords.push(cmd.y2);
        }
    }

    var metrics = {
        xMin: Math.min.apply(null, xCoords),
        yMin: Math.min.apply(null, yCoords),
        xMax: Math.max.apply(null, xCoords),
        yMax: Math.max.apply(null, yCoords),
        leftSideBearing: this.leftSideBearing
    };

    if (!isFinite(metrics.xMin)) {
        metrics.xMin = 0;
    }

    if (!isFinite(metrics.xMax)) {
        metrics.xMax = this.advanceWidth;
    }

    if (!isFinite(metrics.yMin)) {
        metrics.yMin = 0;
    }

    if (!isFinite(metrics.yMax)) {
        metrics.yMax = 0;
    }

    metrics.rightSideBearing = this.advanceWidth - metrics.leftSideBearing - (metrics.xMax - metrics.xMin);
    return metrics;
};

// Draw the glyph on the given context.
//
// ctx - The drawing context.
// x - Horizontal position of the glyph. (default: 0)
// y - Vertical position of the *baseline* of the glyph. (default: 0)
// fontSize - Font size, in pixels (default: 72).
Glyph.prototype.draw = function(ctx, x, y, fontSize) {
    this.getPath(x, y, fontSize).draw(ctx);
};

// Draw the points of the glyph.
// On-curve points will be drawn in blue, off-curve points will be drawn in red.
//
// ctx - The drawing context.
// x - Horizontal position of the glyph. (default: 0)
// y - Vertical position of the *baseline* of the glyph. (default: 0)
// fontSize - Font size, in pixels (default: 72).
Glyph.prototype.drawPoints = function(ctx, x, y, fontSize) {

    function drawCircles(l, x, y, scale) {
        var PI_SQ = Math.PI * 2;
        ctx.beginPath();
        for (var j = 0; j < l.length; j += 1) {
            ctx.moveTo(x + (l[j].x * scale), y + (l[j].y * scale));
            ctx.arc(x + (l[j].x * scale), y + (l[j].y * scale), 2, 0, PI_SQ, false);
        }

        ctx.closePath();
        ctx.fill();
    }

    x = x !== undefined ? x : 0;
    y = y !== undefined ? y : 0;
    fontSize = fontSize !== undefined ? fontSize : 24;
    var scale = 1 / this.path.unitsPerEm * fontSize;

    var blueCircles = [];
    var redCircles = [];
    var path = this.path;
    for (var i = 0; i < path.commands.length; i += 1) {
        var cmd = path.commands[i];
        if (cmd.x !== undefined) {
            blueCircles.push({x: cmd.x, y: -cmd.y});
        }

        if (cmd.x1 !== undefined) {
            redCircles.push({x: cmd.x1, y: -cmd.y1});
        }

        if (cmd.x2 !== undefined) {
            redCircles.push({x: cmd.x2, y: -cmd.y2});
        }
    }

    ctx.fillStyle = 'blue';
    drawCircles(blueCircles, x, y, scale);
    ctx.fillStyle = 'red';
    drawCircles(redCircles, x, y, scale);
};

// Draw lines indicating important font measurements.
// Black lines indicate the origin of the coordinate system (point 0,0).
// Blue lines indicate the glyph bounding box.
// Green line indicates the advance width of the glyph.
//
// ctx - The drawing context.
// x - Horizontal position of the glyph. (default: 0)
// y - Vertical position of the *baseline* of the glyph. (default: 0)
// fontSize - Font size, in pixels (default: 72).
Glyph.prototype.drawMetrics = function(ctx, x, y, fontSize) {
    var scale;
    x = x !== undefined ? x : 0;
    y = y !== undefined ? y : 0;
    fontSize = fontSize !== undefined ? fontSize : 24;
    scale = 1 / this.path.unitsPerEm * fontSize;
    ctx.lineWidth = 1;

    // Draw the origin
    ctx.strokeStyle = 'black';
    draw.line(ctx, x, -10000, x, 10000);
    draw.line(ctx, -10000, y, 10000, y);

    // This code is here due to memory optimization: by not using
    // defaults in the constructor, we save a notable amount of memory.
    var xMin = this.xMin || 0;
    var yMin = this.yMin || 0;
    var xMax = this.xMax || 0;
    var yMax = this.yMax || 0;
    var advanceWidth = this.advanceWidth || 0;

    // Draw the glyph box
    ctx.strokeStyle = 'blue';
    draw.line(ctx, x + (xMin * scale), -10000, x + (xMin * scale), 10000);
    draw.line(ctx, x + (xMax * scale), -10000, x + (xMax * scale), 10000);
    draw.line(ctx, -10000, y + (-yMin * scale), 10000, y + (-yMin * scale));
    draw.line(ctx, -10000, y + (-yMax * scale), 10000, y + (-yMax * scale));

    // Draw the advance width
    ctx.strokeStyle = 'green';
    draw.line(ctx, x + (advanceWidth * scale), -10000, x + (advanceWidth * scale), 10000);
};

exports.Glyph = Glyph;

},{"./check":8,"./draw":9,"./path":16}],13:[function(require,module,exports){
// The GlyphSet object

'use strict';

var _glyph = require('./glyph');

// A GlyphSet represents all glyphs available in the font, but modelled using
// a deferred glyph loader, for retrieving glyphs only once they are absolutely
// necessary, to keep the memory footprint down.
function GlyphSet(font, glyphs) {
    this.font = font;
    this.glyphs = {};
    if (Array.isArray(glyphs)) {
        for (var i = 0; i < glyphs.length; i++) {
            this.glyphs[i] = glyphs[i];
        }
    }

    this.length = (glyphs && glyphs.length) || 0;
}

GlyphSet.prototype.get = function(index) {
    if (typeof this.glyphs[index] === 'function') {
        this.glyphs[index] = this.glyphs[index]();
    }

    return this.glyphs[index];
};

GlyphSet.prototype.push = function(index, loader) {
    this.glyphs[index] = loader;
    this.length++;
};

function glyphLoader(font, index) {
    return new _glyph.Glyph({index: index, font: font});
}

/**
 * Generate a stub glyph that can be filled with all metadata *except*
 * the "points" and "path" properties, which must be loaded only once
 * the glyph's path is actually requested for text shaping.
 */

function ttfGlyphLoader(font, index, parseGlyph, data, position, buildPath) {
    return function() {
        var glyph = new _glyph.Glyph({index: index, font: font});

        glyph.path = function() {
            parseGlyph(glyph, data, position);
            var path = buildPath(font.glyphs, glyph);
            path.unitsPerEm = font.unitsPerEm;
            return path;
        };

        return glyph;
    };
}

function cffGlyphLoader(font, index, parseCFFCharstring, charstring) {
    return function() {
        var glyph = new _glyph.Glyph({index: index, font: font});

        glyph.path = function() {
            var path = parseCFFCharstring(font, glyph, charstring);
            path.unitsPerEm = font.unitsPerEm;
            return path;
        };

        return glyph;
    };
}

exports.GlyphSet = GlyphSet;
exports.glyphLoader = glyphLoader;
exports.ttfGlyphLoader = ttfGlyphLoader;
exports.cffGlyphLoader = cffGlyphLoader;

},{"./glyph":12}],14:[function(require,module,exports){
// opentype.js
// https://github.com/nodebox/opentype.js
// (c) 2015 Frederik De Bleser
// opentype.js may be freely distributed under the MIT license.

/* global DataView, Uint8Array, XMLHttpRequest  */

'use strict';

var inflate = require('tiny-inflate');

var encoding = require('./encoding');
var _font = require('./font');
var glyph = require('./glyph');
var parse = require('./parse');
var path = require('./path');
var util = require('./util');

var cmap = require('./tables/cmap');
var cff = require('./tables/cff');
var fvar = require('./tables/fvar');
var glyf = require('./tables/glyf');
var gpos = require('./tables/gpos');
var head = require('./tables/head');
var hhea = require('./tables/hhea');
var hmtx = require('./tables/hmtx');
var kern = require('./tables/kern');
var ltag = require('./tables/ltag');
var loca = require('./tables/loca');
var maxp = require('./tables/maxp');
var _name = require('./tables/name');
var os2 = require('./tables/os2');
var post = require('./tables/post');

// File loaders /////////////////////////////////////////////////////////

function loadFromFile(path, callback) {
    var fs = require('fs');
    fs.readFile(path, function(err, buffer) {
        if (err) {
            return callback(err.message);
        }

        callback(null, util.nodeBufferToArrayBuffer(buffer));
    });
}

function loadFromUrl(url, callback) {
    var request = new XMLHttpRequest();
    request.open('get', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        if (request.status !== 200) {
            return callback('Font could not be loaded: ' + request.statusText);
        }

        return callback(null, request.response);
    };

    request.send();
}

// Table Directory Entries //////////////////////////////////////////////

function parseOpenTypeTableEntries(data, numTables) {
    var tableEntries = [];
    var p = 12;
    for (var i = 0; i < numTables; i += 1) {
        var tag = parse.getTag(data, p);
        var checksum = parse.getULong(data, p + 4);
        var offset = parse.getULong(data, p + 8);
        var length = parse.getULong(data, p + 12);
        tableEntries.push({tag: tag, checksum: checksum, offset: offset, length: length, compression: false});
        p += 16;
    }

    return tableEntries;
}

function parseWOFFTableEntries(data, numTables) {
    var tableEntries = [];
    var p = 44; // offset to the first table directory entry.
    for (var i = 0; i < numTables; i += 1) {
        var tag = parse.getTag(data, p);
        var offset = parse.getULong(data, p + 4);
        var compLength = parse.getULong(data, p + 8);
        var origLength = parse.getULong(data, p + 12);
        var compression;
        if (compLength < origLength) {
            compression = 'WOFF';
        } else {
            compression = false;
        }

        tableEntries.push({tag: tag, offset: offset, compression: compression,
            compressedLength: compLength, originalLength: origLength});
        p += 20;
    }

    return tableEntries;
}

function uncompressTable(data, tableEntry) {
    if (tableEntry.compression === 'WOFF') {
        var inBuffer = new Uint8Array(data.buffer, tableEntry.offset + 2, tableEntry.compressedLength - 2);
        var outBuffer = new Uint8Array(tableEntry.originalLength);
        inflate(inBuffer, outBuffer);
        if (outBuffer.byteLength !== tableEntry.originalLength) {
            throw new Error('Decompression error: ' + tableEntry.tag + ' decompressed length doesn\'t match recorded length');
        }

        var view = new DataView(outBuffer.buffer, 0);
        return {data: view, offset: 0};
    } else {
        return {data: data, offset: tableEntry.offset};
    }
}

// Public API ///////////////////////////////////////////////////////////

// Parse the OpenType file data (as an ArrayBuffer) and return a Font object.
// Throws an error if the font could not be parsed.
function parseBuffer(buffer) {
    var indexToLocFormat;
    var ltagTable;

    // Since the constructor can also be called to create new fonts from scratch, we indicate this
    // should be an empty font that we'll fill with our own data.
    var font = new _font.Font({empty: true});

    // OpenType fonts use big endian byte ordering.
    // We can't rely on typed array view types, because they operate with the endianness of the host computer.
    // Instead we use DataViews where we can specify endianness.
    var data = new DataView(buffer, 0);
    var numTables;
    var tableEntries = [];
    var signature = parse.getTag(data, 0);
    if (signature === String.fromCharCode(0, 1, 0, 0)) {
        font.outlinesFormat = 'truetype';
        numTables = parse.getUShort(data, 4);
        tableEntries = parseOpenTypeTableEntries(data, numTables);
    } else if (signature === 'OTTO') {
        font.outlinesFormat = 'cff';
        numTables = parse.getUShort(data, 4);
        tableEntries = parseOpenTypeTableEntries(data, numTables);
    } else if (signature === 'wOFF') {
        var flavor = parse.getTag(data, 4);
        if (flavor === String.fromCharCode(0, 1, 0, 0)) {
            font.outlinesFormat = 'truetype';
        } else if (flavor === 'OTTO') {
            font.outlinesFormat = 'cff';
        } else {
            throw new Error('Unsupported OpenType flavor ' + signature);
        }

        numTables = parse.getUShort(data, 12);
        tableEntries = parseWOFFTableEntries(data, numTables);
    } else {
        throw new Error('Unsupported OpenType signature ' + signature);
    }

    var cffTableEntry;
    var fvarTableEntry;
    var glyfTableEntry;
    var gposTableEntry;
    var hmtxTableEntry;
    var kernTableEntry;
    var locaTableEntry;
    var nameTableEntry;

    for (var i = 0; i < numTables; i += 1) {
        var tableEntry = tableEntries[i];
        var table;
        switch (tableEntry.tag) {
            case 'cmap':
                table = uncompressTable(data, tableEntry);
                font.tables.cmap = cmap.parse(table.data, table.offset);
                font.encoding = new encoding.CmapEncoding(font.tables.cmap);
                break;
            case 'fvar':
                fvarTableEntry = tableEntry;
                break;
            case 'head':
                table = uncompressTable(data, tableEntry);
                font.tables.head = head.parse(table.data, table.offset);
                font.unitsPerEm = font.tables.head.unitsPerEm;
                indexToLocFormat = font.tables.head.indexToLocFormat;
                break;
            case 'hhea':
                table = uncompressTable(data, tableEntry);
                font.tables.hhea = hhea.parse(table.data, table.offset);
                font.ascender = font.tables.hhea.ascender;
                font.descender = font.tables.hhea.descender;
                font.numberOfHMetrics = font.tables.hhea.numberOfHMetrics;
                break;
            case 'hmtx':
                hmtxTableEntry = tableEntry;
                break;
            case 'ltag':
                table = uncompressTable(data, tableEntry);
                ltagTable = ltag.parse(table.data, table.offset);
                break;
            case 'maxp':
                table = uncompressTable(data, tableEntry);
                font.tables.maxp = maxp.parse(table.data, table.offset);
                font.numGlyphs = font.tables.maxp.numGlyphs;
                break;
            case 'name':
                nameTableEntry = tableEntry;
                break;
            case 'OS/2':
                table = uncompressTable(data, tableEntry);
                font.tables.os2 = os2.parse(table.data, table.offset);
                break;
            case 'post':
                table = uncompressTable(data, tableEntry);
                font.tables.post = post.parse(table.data, table.offset);
                font.glyphNames = new encoding.GlyphNames(font.tables.post);
                break;
            case 'glyf':
                glyfTableEntry = tableEntry;
                break;
            case 'loca':
                locaTableEntry = tableEntry;
                break;
            case 'CFF ':
                cffTableEntry = tableEntry;
                break;
            case 'kern':
                kernTableEntry = tableEntry;
                break;
            case 'GPOS':
                gposTableEntry = tableEntry;
                break;
        }
    }

    var nameTable = uncompressTable(data, nameTableEntry);
    font.tables.name = _name.parse(nameTable.data, nameTable.offset, ltagTable);
    font.names = font.tables.name;

    if (glyfTableEntry && locaTableEntry) {
        var shortVersion = indexToLocFormat === 0;
        var locaTable = uncompressTable(data, locaTableEntry);
        var locaOffsets = loca.parse(locaTable.data, locaTable.offset, font.numGlyphs, shortVersion);
        var glyfTable = uncompressTable(data, glyfTableEntry);
        font.glyphs = glyf.parse(glyfTable.data, glyfTable.offset, locaOffsets, font);
    } else if (cffTableEntry) {
        var cffTable = uncompressTable(data, cffTableEntry);
        cff.parse(cffTable.data, cffTable.offset, font);
    } else {
        throw new Error('Font doesn\'t contain TrueType or CFF outlines.');
    }

    var hmtxTable = uncompressTable(data, hmtxTableEntry);
    hmtx.parse(hmtxTable.data, hmtxTable.offset, font.numberOfHMetrics, font.numGlyphs, font.glyphs);
    encoding.addGlyphNames(font);

    if (kernTableEntry) {
        var kernTable = uncompressTable(data, kernTableEntry);
        font.kerningPairs = kern.parse(kernTable.data, kernTable.offset);
    } else {
        font.kerningPairs = {};
    }

    if (gposTableEntry) {
        var gposTable = uncompressTable(data, gposTableEntry);
        gpos.parse(gposTable.data, gposTable.offset, font);
    }

    if (fvarTableEntry) {
        var fvarTable = uncompressTable(data, fvarTableEntry);
        font.tables.fvar = fvar.parse(fvarTable.data, fvarTable.offset, font.names);
    }

    return font;
}

// Asynchronously load the font from a URL or a filesystem. When done, call the callback
// with two arguments `(err, font)`. The `err` will be null on success,
// the `font` is a Font object.
//
// We use the node.js callback convention so that
// opentype.js can integrate with frameworks like async.js.
function load(url, callback) {
    var isNode = typeof window === 'undefined';
    var loadFn = isNode ? loadFromFile : loadFromUrl;
    loadFn(url, function(err, arrayBuffer) {
        if (err) {
            return callback(err);
        }
        var font;
        try {
            font = parseBuffer(arrayBuffer);
        } catch (e) {
            return callback(e, null);
        }
        return callback(null, font);
    });
}

// Synchronously load the font from a URL or file.
// When done, return the font object or throw an error.
function loadSync(url) {
    var fs = require('fs');
    var buffer = fs.readFileSync(url);
    return parseBuffer(util.nodeBufferToArrayBuffer(buffer));
}

exports._parse = parse;
exports.Font = _font.Font;
exports.Glyph = glyph.Glyph;
exports.Path = path.Path;
exports.parse = parseBuffer;
exports.load = load;
exports.loadSync = loadSync;

},{"./encoding":10,"./font":11,"./glyph":12,"./parse":15,"./path":16,"./tables/cff":18,"./tables/cmap":19,"./tables/fvar":20,"./tables/glyf":21,"./tables/gpos":22,"./tables/head":23,"./tables/hhea":24,"./tables/hmtx":25,"./tables/kern":26,"./tables/loca":27,"./tables/ltag":28,"./tables/maxp":29,"./tables/name":30,"./tables/os2":31,"./tables/post":32,"./util":35,"fs":3,"tiny-inflate":40}],15:[function(require,module,exports){
// Parsing utility functions

'use strict';

// Retrieve an unsigned byte from the DataView.
exports.getByte = function getByte(dataView, offset) {
    return dataView.getUint8(offset);
};

exports.getCard8 = exports.getByte;

// Retrieve an unsigned 16-bit short from the DataView.
// The value is stored in big endian.
exports.getUShort = function(dataView, offset) {
    return dataView.getUint16(offset, false);
};

exports.getCard16 = exports.getUShort;

// Retrieve a signed 16-bit short from the DataView.
// The value is stored in big endian.
exports.getShort = function(dataView, offset) {
    return dataView.getInt16(offset, false);
};

// Retrieve an unsigned 32-bit long from the DataView.
// The value is stored in big endian.
exports.getULong = function(dataView, offset) {
    return dataView.getUint32(offset, false);
};

// Retrieve a 32-bit signed fixed-point number (16.16) from the DataView.
// The value is stored in big endian.
exports.getFixed = function(dataView, offset) {
    var decimal = dataView.getInt16(offset, false);
    var fraction = dataView.getUint16(offset + 2, false);
    return decimal + fraction / 65535;
};

// Retrieve a 4-character tag from the DataView.
// Tags are used to identify tables.
exports.getTag = function(dataView, offset) {
    var tag = '';
    for (var i = offset; i < offset + 4; i += 1) {
        tag += String.fromCharCode(dataView.getInt8(i));
    }

    return tag;
};

// Retrieve an offset from the DataView.
// Offsets are 1 to 4 bytes in length, depending on the offSize argument.
exports.getOffset = function(dataView, offset, offSize) {
    var v = 0;
    for (var i = 0; i < offSize; i += 1) {
        v <<= 8;
        v += dataView.getUint8(offset + i);
    }

    return v;
};

// Retrieve a number of bytes from start offset to the end offset from the DataView.
exports.getBytes = function(dataView, startOffset, endOffset) {
    var bytes = [];
    for (var i = startOffset; i < endOffset; i += 1) {
        bytes.push(dataView.getUint8(i));
    }

    return bytes;
};

// Convert the list of bytes to a string.
exports.bytesToString = function(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 1) {
        s += String.fromCharCode(bytes[i]);
    }

    return s;
};

var typeOffsets = {
    byte: 1,
    uShort: 2,
    short: 2,
    uLong: 4,
    fixed: 4,
    longDateTime: 8,
    tag: 4
};

// A stateful parser that changes the offset whenever a value is retrieved.
// The data is a DataView.
function Parser(data, offset) {
    this.data = data;
    this.offset = offset;
    this.relativeOffset = 0;
}

Parser.prototype.parseByte = function() {
    var v = this.data.getUint8(this.offset + this.relativeOffset);
    this.relativeOffset += 1;
    return v;
};

Parser.prototype.parseChar = function() {
    var v = this.data.getInt8(this.offset + this.relativeOffset);
    this.relativeOffset += 1;
    return v;
};

Parser.prototype.parseCard8 = Parser.prototype.parseByte;

Parser.prototype.parseUShort = function() {
    var v = this.data.getUint16(this.offset + this.relativeOffset);
    this.relativeOffset += 2;
    return v;
};

Parser.prototype.parseCard16 = Parser.prototype.parseUShort;
Parser.prototype.parseSID = Parser.prototype.parseUShort;
Parser.prototype.parseOffset16 = Parser.prototype.parseUShort;

Parser.prototype.parseShort = function() {
    var v = this.data.getInt16(this.offset + this.relativeOffset);
    this.relativeOffset += 2;
    return v;
};

Parser.prototype.parseF2Dot14 = function() {
    var v = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
    this.relativeOffset += 2;
    return v;
};

Parser.prototype.parseULong = function() {
    var v = exports.getULong(this.data, this.offset + this.relativeOffset);
    this.relativeOffset += 4;
    return v;
};

Parser.prototype.parseFixed = function() {
    var v = exports.getFixed(this.data, this.offset + this.relativeOffset);
    this.relativeOffset += 4;
    return v;
};

Parser.prototype.parseOffset16List =
Parser.prototype.parseUShortList = function(count) {
    var offsets = new Array(count);
    var dataView = this.data;
    var offset = this.offset + this.relativeOffset;
    for (var i = 0; i < count; i++) {
        offsets[i] = exports.getUShort(dataView, offset);
        offset += 2;
    }

    this.relativeOffset += count * 2;
    return offsets;
};

Parser.prototype.parseString = function(length) {
    var dataView = this.data;
    var offset = this.offset + this.relativeOffset;
    var string = '';
    this.relativeOffset += length;
    for (var i = 0; i < length; i++) {
        string += String.fromCharCode(dataView.getUint8(offset + i));
    }

    return string;
};

Parser.prototype.parseTag = function() {
    return this.parseString(4);
};

// LONGDATETIME is a 64-bit integer.
// JavaScript and unix timestamps traditionally use 32 bits, so we
// only take the last 32 bits.
Parser.prototype.parseLongDateTime = function() {
    var v = exports.getULong(this.data, this.offset + this.relativeOffset + 4);
    this.relativeOffset += 8;
    return v;
};

Parser.prototype.parseFixed = function() {
    var v = exports.getULong(this.data, this.offset + this.relativeOffset);
    this.relativeOffset += 4;
    return v / 65536;
};

Parser.prototype.parseVersion = function() {
    var major = exports.getUShort(this.data, this.offset + this.relativeOffset);

    // How to interpret the minor version is very vague in the spec. 0x5000 is 5, 0x1000 is 1
    // This returns the correct number if minor = 0xN000 where N is 0-9
    var minor = exports.getUShort(this.data, this.offset + this.relativeOffset + 2);
    this.relativeOffset += 4;
    return major + minor / 0x1000 / 10;
};

Parser.prototype.skip = function(type, amount) {
    if (amount === undefined) {
        amount = 1;
    }

    this.relativeOffset += typeOffsets[type] * amount;
};

exports.Parser = Parser;

},{}],16:[function(require,module,exports){
// Geometric objects

'use strict';

// A bézier path containing a set of path commands similar to a SVG path.
// Paths can be drawn on a context using `draw`.
function Path() {
    this.commands = [];
    this.fill = 'black';
    this.stroke = null;
    this.strokeWidth = 1;
}

Path.prototype.moveTo = function(x, y) {
    this.commands.push({
        type: 'M',
        x: x,
        y: y
    });
};

Path.prototype.lineTo = function(x, y) {
    this.commands.push({
        type: 'L',
        x: x,
        y: y
    });
};

Path.prototype.curveTo = Path.prototype.bezierCurveTo = function(x1, y1, x2, y2, x, y) {
    this.commands.push({
        type: 'C',
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        x: x,
        y: y
    });
};

Path.prototype.quadTo = Path.prototype.quadraticCurveTo = function(x1, y1, x, y) {
    this.commands.push({
        type: 'Q',
        x1: x1,
        y1: y1,
        x: x,
        y: y
    });
};

Path.prototype.close = Path.prototype.closePath = function() {
    this.commands.push({
        type: 'Z'
    });
};

// Add the given path or list of commands to the commands of this path.
Path.prototype.extend = function(pathOrCommands) {
    if (pathOrCommands.commands) {
        pathOrCommands = pathOrCommands.commands;
    }

    Array.prototype.push.apply(this.commands, pathOrCommands);
};

// Draw the path to a 2D context.
Path.prototype.draw = function(ctx) {
    ctx.beginPath();
    for (var i = 0; i < this.commands.length; i += 1) {
        var cmd = this.commands[i];
        if (cmd.type === 'M') {
            ctx.moveTo(cmd.x, cmd.y);
        } else if (cmd.type === 'L') {
            ctx.lineTo(cmd.x, cmd.y);
        } else if (cmd.type === 'C') {
            ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        } else if (cmd.type === 'Q') {
            ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        } else if (cmd.type === 'Z') {
            ctx.closePath();
        }
    }

    if (this.fill) {
        ctx.fillStyle = this.fill;
        ctx.fill();
    }

    if (this.stroke) {
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
    }
};

// Convert the Path to a string of path data instructions
// See http://www.w3.org/TR/SVG/paths.html#PathData
// Parameters:
// - decimalPlaces: The amount of decimal places for floating-point values (default: 2)
Path.prototype.toPathData = function(decimalPlaces) {
    decimalPlaces = decimalPlaces !== undefined ? decimalPlaces : 2;

    function floatToString(v) {
        if (Math.round(v) === v) {
            return '' + Math.round(v);
        } else {
            return v.toFixed(decimalPlaces);
        }
    }

    function packValues() {
        var s = '';
        for (var i = 0; i < arguments.length; i += 1) {
            var v = arguments[i];
            if (v >= 0 && i > 0) {
                s += ' ';
            }

            s += floatToString(v);
        }

        return s;
    }

    var d = '';
    for (var i = 0; i < this.commands.length; i += 1) {
        var cmd = this.commands[i];
        if (cmd.type === 'M') {
            d += 'M' + packValues(cmd.x, cmd.y);
        } else if (cmd.type === 'L') {
            d += 'L' + packValues(cmd.x, cmd.y);
        } else if (cmd.type === 'C') {
            d += 'C' + packValues(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        } else if (cmd.type === 'Q') {
            d += 'Q' + packValues(cmd.x1, cmd.y1, cmd.x, cmd.y);
        } else if (cmd.type === 'Z') {
            d += 'Z';
        }
    }

    return d;
};

// Convert the path to a SVG <path> element, as a string.
// Parameters:
// - decimalPlaces: The amount of decimal places for floating-point values (default: 2)
Path.prototype.toSVG = function(decimalPlaces) {
    var svg = '<path d="';
    svg += this.toPathData(decimalPlaces);
    svg += '"';
    if (this.fill & this.fill !== 'black') {
        if (this.fill === null) {
            svg += ' fill="none"';
        } else {
            svg += ' fill="' + this.fill + '"';
        }
    }

    if (this.stroke) {
        svg += ' stroke="' + this.stroke + '" stroke-width="' + this.strokeWidth + '"';
    }

    svg += '/>';
    return svg;
};

exports.Path = Path;

},{}],17:[function(require,module,exports){
// Table metadata

'use strict';

var encode = require('./types').encode;
var sizeOf = require('./types').sizeOf;

function Table(tableName, fields, options) {
    var i;
    for (i = 0; i < fields.length; i += 1) {
        var field = fields[i];
        this[field.name] = field.value;
    }

    this.tableName = tableName;
    this.fields = fields;
    if (options) {
        var optionKeys = Object.keys(options);
        for (i = 0; i < optionKeys.length; i += 1) {
            var k = optionKeys[i];
            var v = options[k];
            if (this[k] !== undefined) {
                this[k] = v;
            }
        }
    }
}

Table.prototype.encode = function() {
    return encode.TABLE(this);
};

Table.prototype.sizeOf = function() {
    return sizeOf.TABLE(this);
};

exports.Record = exports.Table = Table;

},{"./types":34}],18:[function(require,module,exports){
// The `CFF` table contains the glyph outlines in PostScript format.
// https://www.microsoft.com/typography/OTSPEC/cff.htm
// http://download.microsoft.com/download/8/0/1/801a191c-029d-4af3-9642-555f6fe514ee/cff.pdf
// http://download.microsoft.com/download/8/0/1/801a191c-029d-4af3-9642-555f6fe514ee/type2.pdf

'use strict';

var encoding = require('../encoding');
var glyphset = require('../glyphset');
var parse = require('../parse');
var path = require('../path');
var table = require('../table');

// Custom equals function that can also check lists.
function equals(a, b) {
    if (a === b) {
        return true;
    } else if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        for (var i = 0; i < a.length; i += 1) {
            if (!equals(a[i], b[i])) {
                return false;
            }
        }

        return true;
    } else {
        return false;
    }
}

// Parse a `CFF` INDEX array.
// An index array consists of a list of offsets, then a list of objects at those offsets.
function parseCFFIndex(data, start, conversionFn) {
    //var i, objectOffset, endOffset;
    var offsets = [];
    var objects = [];
    var count = parse.getCard16(data, start);
    var i;
    var objectOffset;
    var endOffset;
    if (count !== 0) {
        var offsetSize = parse.getByte(data, start + 2);
        objectOffset = start + ((count + 1) * offsetSize) + 2;
        var pos = start + 3;
        for (i = 0; i < count + 1; i += 1) {
            offsets.push(parse.getOffset(data, pos, offsetSize));
            pos += offsetSize;
        }

        // The total size of the index array is 4 header bytes + the value of the last offset.
        endOffset = objectOffset + offsets[count];
    } else {
        endOffset = start + 2;
    }

    for (i = 0; i < offsets.length - 1; i += 1) {
        var value = parse.getBytes(data, objectOffset + offsets[i], objectOffset + offsets[i + 1]);
        if (conversionFn) {
            value = conversionFn(value);
        }

        objects.push(value);
    }

    return {objects: objects, startOffset: start, endOffset: endOffset};
}

// Parse a `CFF` DICT real value.
function parseFloatOperand(parser) {
    var s = '';
    var eof = 15;
    var lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'E', 'E-', null, '-'];
    while (true) {
        var b = parser.parseByte();
        var n1 = b >> 4;
        var n2 = b & 15;

        if (n1 === eof) {
            break;
        }

        s += lookup[n1];

        if (n2 === eof) {
            break;
        }

        s += lookup[n2];
    }

    return parseFloat(s);
}

// Parse a `CFF` DICT operand.
function parseOperand(parser, b0) {
    var b1;
    var b2;
    var b3;
    var b4;
    if (b0 === 28) {
        b1 = parser.parseByte();
        b2 = parser.parseByte();
        return b1 << 8 | b2;
    }

    if (b0 === 29) {
        b1 = parser.parseByte();
        b2 = parser.parseByte();
        b3 = parser.parseByte();
        b4 = parser.parseByte();
        return b1 << 24 | b2 << 16 | b3 << 8 | b4;
    }

    if (b0 === 30) {
        return parseFloatOperand(parser);
    }

    if (b0 >= 32 && b0 <= 246) {
        return b0 - 139;
    }

    if (b0 >= 247 && b0 <= 250) {
        b1 = parser.parseByte();
        return (b0 - 247) * 256 + b1 + 108;
    }

    if (b0 >= 251 && b0 <= 254) {
        b1 = parser.parseByte();
        return -(b0 - 251) * 256 - b1 - 108;
    }

    throw new Error('Invalid b0 ' + b0);
}

// Convert the entries returned by `parseDict` to a proper dictionary.
// If a value is a list of one, it is unpacked.
function entriesToObject(entries) {
    var o = {};
    for (var i = 0; i < entries.length; i += 1) {
        var key = entries[i][0];
        var values = entries[i][1];
        var value;
        if (values.length === 1) {
            value = values[0];
        } else {
            value = values;
        }

        if (o.hasOwnProperty(key)) {
            throw new Error('Object ' + o + ' already has key ' + key);
        }

        o[key] = value;
    }

    return o;
}

// Parse a `CFF` DICT object.
// A dictionary contains key-value pairs in a compact tokenized format.
function parseCFFDict(data, start, size) {
    start = start !== undefined ? start : 0;
    var parser = new parse.Parser(data, start);
    var entries = [];
    var operands = [];
    size = size !== undefined ? size : data.length;

    while (parser.relativeOffset < size) {
        var op = parser.parseByte();

        // The first byte for each dict item distinguishes between operator (key) and operand (value).
        // Values <= 21 are operators.
        if (op <= 21) {
            // Two-byte operators have an initial escape byte of 12.
            if (op === 12) {
                op = 1200 + parser.parseByte();
            }

            entries.push([op, operands]);
            operands = [];
        } else {
            // Since the operands (values) come before the operators (keys), we store all operands in a list
            // until we encounter an operator.
            operands.push(parseOperand(parser, op));
        }
    }

    return entriesToObject(entries);
}

// Given a String Index (SID), return the value of the string.
// Strings below index 392 are standard CFF strings and are not encoded in the font.
function getCFFString(strings, index) {
    if (index <= 390) {
        index = encoding.cffStandardStrings[index];
    } else {
        index = strings[index - 391];
    }

    return index;
}

// Interpret a dictionary and return a new dictionary with readable keys and values for missing entries.
// This function takes `meta` which is a list of objects containing `operand`, `name` and `default`.
function interpretDict(dict, meta, strings) {
    var newDict = {};

    // Because we also want to include missing values, we start out from the meta list
    // and lookup values in the dict.
    for (var i = 0; i < meta.length; i += 1) {
        var m = meta[i];
        var value = dict[m.op];
        if (value === undefined) {
            value = m.value !== undefined ? m.value : null;
        }

        if (m.type === 'SID') {
            value = getCFFString(strings, value);
        }

        newDict[m.name] = value;
    }

    return newDict;
}

// Parse the CFF header.
function parseCFFHeader(data, start) {
    var header = {};
    header.formatMajor = parse.getCard8(data, start);
    header.formatMinor = parse.getCard8(data, start + 1);
    header.size = parse.getCard8(data, start + 2);
    header.offsetSize = parse.getCard8(data, start + 3);
    header.startOffset = start;
    header.endOffset = start + 4;
    return header;
}

var TOP_DICT_META = [
    {name: 'version', op: 0, type: 'SID'},
    {name: 'notice', op: 1, type: 'SID'},
    {name: 'copyright', op: 1200, type: 'SID'},
    {name: 'fullName', op: 2, type: 'SID'},
    {name: 'familyName', op: 3, type: 'SID'},
    {name: 'weight', op: 4, type: 'SID'},
    {name: 'isFixedPitch', op: 1201, type: 'number', value: 0},
    {name: 'italicAngle', op: 1202, type: 'number', value: 0},
    {name: 'underlinePosition', op: 1203, type: 'number', value: -100},
    {name: 'underlineThickness', op: 1204, type: 'number', value: 50},
    {name: 'paintType', op: 1205, type: 'number', value: 0},
    {name: 'charstringType', op: 1206, type: 'number', value: 2},
    {name: 'fontMatrix', op: 1207, type: ['real', 'real', 'real', 'real', 'real', 'real'], value: [0.001, 0, 0, 0.001, 0, 0]},
    {name: 'uniqueId', op: 13, type: 'number'},
    {name: 'fontBBox', op: 5, type: ['number', 'number', 'number', 'number'], value: [0, 0, 0, 0]},
    {name: 'strokeWidth', op: 1208, type: 'number', value: 0},
    {name: 'xuid', op: 14, type: [], value: null},
    {name: 'charset', op: 15, type: 'offset', value: 0},
    {name: 'encoding', op: 16, type: 'offset', value: 0},
    {name: 'charStrings', op: 17, type: 'offset', value: 0},
    {name: 'private', op: 18, type: ['number', 'offset'], value: [0, 0]}
];

var PRIVATE_DICT_META = [
    {name: 'subrs', op: 19, type: 'offset', value: 0},
    {name: 'defaultWidthX', op: 20, type: 'number', value: 0},
    {name: 'nominalWidthX', op: 21, type: 'number', value: 0}
];

// Parse the CFF top dictionary. A CFF table can contain multiple fonts, each with their own top dictionary.
// The top dictionary contains the essential metadata for the font, together with the private dictionary.
function parseCFFTopDict(data, strings) {
    var dict = parseCFFDict(data, 0, data.byteLength);
    return interpretDict(dict, TOP_DICT_META, strings);
}

// Parse the CFF private dictionary. We don't fully parse out all the values, only the ones we need.
function parseCFFPrivateDict(data, start, size, strings) {
    var dict = parseCFFDict(data, start, size);
    return interpretDict(dict, PRIVATE_DICT_META, strings);
}

// Parse the CFF charset table, which contains internal names for all the glyphs.
// This function will return a list of glyph names.
// See Adobe TN #5176 chapter 13, "Charsets".
function parseCFFCharset(data, start, nGlyphs, strings) {
    var i;
    var sid;
    var count;
    var parser = new parse.Parser(data, start);

    // The .notdef glyph is not included, so subtract 1.
    nGlyphs -= 1;
    var charset = ['.notdef'];

    var format = parser.parseCard8();
    if (format === 0) {
        for (i = 0; i < nGlyphs; i += 1) {
            sid = parser.parseSID();
            charset.push(getCFFString(strings, sid));
        }
    } else if (format === 1) {
        while (charset.length <= nGlyphs) {
            sid = parser.parseSID();
            count = parser.parseCard8();
            for (i = 0; i <= count; i += 1) {
                charset.push(getCFFString(strings, sid));
                sid += 1;
            }
        }
    } else if (format === 2) {
        while (charset.length <= nGlyphs) {
            sid = parser.parseSID();
            count = parser.parseCard16();
            for (i = 0; i <= count; i += 1) {
                charset.push(getCFFString(strings, sid));
                sid += 1;
            }
        }
    } else {
        throw new Error('Unknown charset format ' + format);
    }

    return charset;
}

// Parse the CFF encoding data. Only one encoding can be specified per font.
// See Adobe TN #5176 chapter 12, "Encodings".
function parseCFFEncoding(data, start, charset) {
    var i;
    var code;
    var enc = {};
    var parser = new parse.Parser(data, start);
    var format = parser.parseCard8();
    if (format === 0) {
        var nCodes = parser.parseCard8();
        for (i = 0; i < nCodes; i += 1) {
            code = parser.parseCard8();
            enc[code] = i;
        }
    } else if (format === 1) {
        var nRanges = parser.parseCard8();
        code = 1;
        for (i = 0; i < nRanges; i += 1) {
            var first = parser.parseCard8();
            var nLeft = parser.parseCard8();
            for (var j = first; j <= first + nLeft; j += 1) {
                enc[j] = code;
                code += 1;
            }
        }
    } else {
        throw new Error('Unknown encoding format ' + format);
    }

    return new encoding.CffEncoding(enc, charset);
}

// Take in charstring code and return a Glyph object.
// The encoding is described in the Type 2 Charstring Format
// https://www.microsoft.com/typography/OTSPEC/charstr2.htm
function parseCFFCharstring(font, glyph, code) {
    var c1x;
    var c1y;
    var c2x;
    var c2y;
    var p = new path.Path();
    var stack = [];
    var nStems = 0;
    var haveWidth = false;
    var width = font.defaultWidthX;
    var open = false;
    var x = 0;
    var y = 0;

    function newContour(x, y) {
        if (open) {
            p.closePath();
        }

        p.moveTo(x, y);
        open = true;
    }

    function parseStems() {
        var hasWidthArg;

        // The number of stem operators on the stack is always even.
        // If the value is uneven, that means a width is specified.
        hasWidthArg = stack.length % 2 !== 0;
        if (hasWidthArg && !haveWidth) {
            width = stack.shift() + font.nominalWidthX;
        }

        nStems += stack.length >> 1;
        stack.length = 0;
        haveWidth = true;
    }

    function parse(code) {
        var b1;
        var b2;
        var b3;
        var b4;
        var codeIndex;
        var subrCode;
        var jpx;
        var jpy;
        var c3x;
        var c3y;
        var c4x;
        var c4y;

        var i = 0;
        while (i < code.length) {
            var v = code[i];
            i += 1;
            switch (v) {
                case 1: // hstem
                    parseStems();
                    break;
                case 3: // vstem
                    parseStems();
                    break;
                case 4: // vmoveto
                    if (stack.length > 1 && !haveWidth) {
                        width = stack.shift() + font.nominalWidthX;
                        haveWidth = true;
                    }

                    y += stack.pop();
                    newContour(x, y);
                    break;
                case 5: // rlineto
                    while (stack.length > 0) {
                        x += stack.shift();
                        y += stack.shift();
                        p.lineTo(x, y);
                    }

                    break;
                case 6: // hlineto
                    while (stack.length > 0) {
                        x += stack.shift();
                        p.lineTo(x, y);
                        if (stack.length === 0) {
                            break;
                        }

                        y += stack.shift();
                        p.lineTo(x, y);
                    }

                    break;
                case 7: // vlineto
                    while (stack.length > 0) {
                        y += stack.shift();
                        p.lineTo(x, y);
                        if (stack.length === 0) {
                            break;
                        }

                        x += stack.shift();
                        p.lineTo(x, y);
                    }

                    break;
                case 8: // rrcurveto
                    while (stack.length > 0) {
                        c1x = x + stack.shift();
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + stack.shift();
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                case 10: // callsubr
                    codeIndex = stack.pop() + font.subrsBias;
                    subrCode = font.subrs[codeIndex];
                    if (subrCode) {
                        parse(subrCode);
                    }

                    break;
                case 11: // return
                    return;
                case 12: // flex operators
                    v = code[i];
                    i += 1;
                    switch (v) {
                        case 35: // flex
                            // |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 dx6 dy6 fd flex (12 35) |-
                            c1x = x   + stack.shift();    // dx1
                            c1y = y   + stack.shift();    // dy1
                            c2x = c1x + stack.shift();    // dx2
                            c2y = c1y + stack.shift();    // dy2
                            jpx = c2x + stack.shift();    // dx3
                            jpy = c2y + stack.shift();    // dy3
                            c3x = jpx + stack.shift();    // dx4
                            c3y = jpy + stack.shift();    // dy4
                            c4x = c3x + stack.shift();    // dx5
                            c4y = c3y + stack.shift();    // dy5
                            x = c4x + stack.shift();      // dx6
                            y = c4y + stack.shift();      // dy6
                            stack.shift();                // flex depth
                            p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                            p.curveTo(c3x, c3y, c4x, c4y, x, y);
                            break;
                        case 34: // hflex
                            // |- dx1 dx2 dy2 dx3 dx4 dx5 dx6 hflex (12 34) |-
                            c1x = x   + stack.shift();    // dx1
                            c1y = y;                      // dy1
                            c2x = c1x + stack.shift();    // dx2
                            c2y = c1y + stack.shift();    // dy2
                            jpx = c2x + stack.shift();    // dx3
                            jpy = c2y;                    // dy3
                            c3x = jpx + stack.shift();    // dx4
                            c3y = c2y;                    // dy4
                            c4x = c3x + stack.shift();    // dx5
                            c4y = y;                      // dy5
                            x = c4x + stack.shift();      // dx6
                            p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                            p.curveTo(c3x, c3y, c4x, c4y, x, y);
                            break;
                        case 36: // hflex1
                            // |- dx1 dy1 dx2 dy2 dx3 dx4 dx5 dy5 dx6 hflex1 (12 36) |-
                            c1x = x   + stack.shift();    // dx1
                            c1y = y   + stack.shift();    // dy1
                            c2x = c1x + stack.shift();    // dx2
                            c2y = c1y + stack.shift();    // dy2
                            jpx = c2x + stack.shift();    // dx3
                            jpy = c2y;                    // dy3
                            c3x = jpx + stack.shift();    // dx4
                            c3y = c2y;                    // dy4
                            c4x = c3x + stack.shift();    // dx5
                            c4y = c3y + stack.shift();    // dy5
                            x = c4x + stack.shift();      // dx6
                            p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                            p.curveTo(c3x, c3y, c4x, c4y, x, y);
                            break;
                        case 37: // flex1
                            // |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 d6 flex1 (12 37) |-
                            c1x = x   + stack.shift();    // dx1
                            c1y = y   + stack.shift();    // dy1
                            c2x = c1x + stack.shift();    // dx2
                            c2y = c1y + stack.shift();    // dy2
                            jpx = c2x + stack.shift();    // dx3
                            jpy = c2y + stack.shift();    // dy3
                            c3x = jpx + stack.shift();    // dx4
                            c3y = jpy + stack.shift();    // dy4
                            c4x = c3x + stack.shift();    // dx5
                            c4y = c3y + stack.shift();    // dy5
                            if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
                                x = c4x + stack.shift();
                            } else {
                                y = c4y + stack.shift();
                            }

                            p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                            p.curveTo(c3x, c3y, c4x, c4y, x, y);
                            break;
                        default:
                            console.log('Glyph ' + glyph.index + ': unknown operator ' + 1200 + v);
                            stack.length = 0;
                    }
                    break;
                case 14: // endchar
                    if (stack.length > 0 && !haveWidth) {
                        width = stack.shift() + font.nominalWidthX;
                        haveWidth = true;
                    }

                    if (open) {
                        p.closePath();
                        open = false;
                    }

                    break;
                case 18: // hstemhm
                    parseStems();
                    break;
                case 19: // hintmask
                case 20: // cntrmask
                    parseStems();
                    i += (nStems + 7) >> 3;
                    break;
                case 21: // rmoveto
                    if (stack.length > 2 && !haveWidth) {
                        width = stack.shift() + font.nominalWidthX;
                        haveWidth = true;
                    }

                    y += stack.pop();
                    x += stack.pop();
                    newContour(x, y);
                    break;
                case 22: // hmoveto
                    if (stack.length > 1 && !haveWidth) {
                        width = stack.shift() + font.nominalWidthX;
                        haveWidth = true;
                    }

                    x += stack.pop();
                    newContour(x, y);
                    break;
                case 23: // vstemhm
                    parseStems();
                    break;
                case 24: // rcurveline
                    while (stack.length > 2) {
                        c1x = x + stack.shift();
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + stack.shift();
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    x += stack.shift();
                    y += stack.shift();
                    p.lineTo(x, y);
                    break;
                case 25: // rlinecurve
                    while (stack.length > 6) {
                        x += stack.shift();
                        y += stack.shift();
                        p.lineTo(x, y);
                    }

                    c1x = x + stack.shift();
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + stack.shift();
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    break;
                case 26: // vvcurveto
                    if (stack.length % 2) {
                        x += stack.shift();
                    }

                    while (stack.length > 0) {
                        c1x = x;
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x;
                        y = c2y + stack.shift();
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                case 27: // hhcurveto
                    if (stack.length % 2) {
                        y += stack.shift();
                    }

                    while (stack.length > 0) {
                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y;
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                case 28: // shortint
                    b1 = code[i];
                    b2 = code[i + 1];
                    stack.push(((b1 << 24) | (b2 << 16)) >> 16);
                    i += 2;
                    break;
                case 29: // callgsubr
                    codeIndex = stack.pop() + font.gsubrsBias;
                    subrCode = font.gsubrs[codeIndex];
                    if (subrCode) {
                        parse(subrCode);
                    }

                    break;
                case 30: // vhcurveto
                    while (stack.length > 0) {
                        c1x = x;
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + (stack.length === 1 ? stack.shift() : 0);
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                        if (stack.length === 0) {
                            break;
                        }

                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        y = c2y + stack.shift();
                        x = c2x + (stack.length === 1 ? stack.shift() : 0);
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                case 31: // hvcurveto
                    while (stack.length > 0) {
                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        y = c2y + stack.shift();
                        x = c2x + (stack.length === 1 ? stack.shift() : 0);
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                        if (stack.length === 0) {
                            break;
                        }

                        c1x = x;
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + (stack.length === 1 ? stack.shift() : 0);
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                default:
                    if (v < 32) {
                        console.log('Glyph ' + glyph.index + ': unknown operator ' + v);
                    } else if (v < 247) {
                        stack.push(v - 139);
                    } else if (v < 251) {
                        b1 = code[i];
                        i += 1;
                        stack.push((v - 247) * 256 + b1 + 108);
                    } else if (v < 255) {
                        b1 = code[i];
                        i += 1;
                        stack.push(-(v - 251) * 256 - b1 - 108);
                    } else {
                        b1 = code[i];
                        b2 = code[i + 1];
                        b3 = code[i + 2];
                        b4 = code[i + 3];
                        i += 4;
                        stack.push(((b1 << 24) | (b2 << 16) | (b3 << 8) | b4) / 65536);
                    }
            }
        }
    }

    parse(code);

    glyph.advanceWidth = width;
    return p;
}

// Subroutines are encoded using the negative half of the number space.
// See type 2 chapter 4.7 "Subroutine operators".
function calcCFFSubroutineBias(subrs) {
    var bias;
    if (subrs.length < 1240) {
        bias = 107;
    } else if (subrs.length < 33900) {
        bias = 1131;
    } else {
        bias = 32768;
    }

    return bias;
}

// Parse the `CFF` table, which contains the glyph outlines in PostScript format.
function parseCFFTable(data, start, font) {
    font.tables.cff = {};
    var header = parseCFFHeader(data, start);
    var nameIndex = parseCFFIndex(data, header.endOffset, parse.bytesToString);
    var topDictIndex = parseCFFIndex(data, nameIndex.endOffset);
    var stringIndex = parseCFFIndex(data, topDictIndex.endOffset, parse.bytesToString);
    var globalSubrIndex = parseCFFIndex(data, stringIndex.endOffset);
    font.gsubrs = globalSubrIndex.objects;
    font.gsubrsBias = calcCFFSubroutineBias(font.gsubrs);

    var topDictData = new DataView(new Uint8Array(topDictIndex.objects[0]).buffer);
    var topDict = parseCFFTopDict(topDictData, stringIndex.objects);
    font.tables.cff.topDict = topDict;

    var privateDictOffset = start + topDict['private'][1];
    var privateDict = parseCFFPrivateDict(data, privateDictOffset, topDict['private'][0], stringIndex.objects);
    font.defaultWidthX = privateDict.defaultWidthX;
    font.nominalWidthX = privateDict.nominalWidthX;

    if (privateDict.subrs !== 0) {
        var subrOffset = privateDictOffset + privateDict.subrs;
        var subrIndex = parseCFFIndex(data, subrOffset);
        font.subrs = subrIndex.objects;
        font.subrsBias = calcCFFSubroutineBias(font.subrs);
    } else {
        font.subrs = [];
        font.subrsBias = 0;
    }

    // Offsets in the top dict are relative to the beginning of the CFF data, so add the CFF start offset.
    var charStringsIndex = parseCFFIndex(data, start + topDict.charStrings);
    font.nGlyphs = charStringsIndex.objects.length;

    var charset = parseCFFCharset(data, start + topDict.charset, font.nGlyphs, stringIndex.objects);
    if (topDict.encoding === 0) { // Standard encoding
        font.cffEncoding = new encoding.CffEncoding(encoding.cffStandardEncoding, charset);
    } else if (topDict.encoding === 1) { // Expert encoding
        font.cffEncoding = new encoding.CffEncoding(encoding.cffExpertEncoding, charset);
    } else {
        font.cffEncoding = parseCFFEncoding(data, start + topDict.encoding, charset);
    }

    // Prefer the CMAP encoding to the CFF encoding.
    font.encoding = font.encoding || font.cffEncoding;

    font.glyphs = new glyphset.GlyphSet(font);
    for (var i = 0; i < font.nGlyphs; i += 1) {
        var charString = charStringsIndex.objects[i];
        font.glyphs.push(i, glyphset.cffGlyphLoader(font, i, parseCFFCharstring, charString));
    }
}

// Convert a string to a String ID (SID).
// The list of strings is modified in place.
function encodeString(s, strings) {
    var sid;

    // Is the string in the CFF standard strings?
    var i = encoding.cffStandardStrings.indexOf(s);
    if (i >= 0) {
        sid = i;
    }

    // Is the string already in the string index?
    i = strings.indexOf(s);
    if (i >= 0) {
        sid = i + encoding.cffStandardStrings.length;
    } else {
        sid = encoding.cffStandardStrings.length + strings.length;
        strings.push(s);
    }

    return sid;
}

function makeHeader() {
    return new table.Record('Header', [
        {name: 'major', type: 'Card8', value: 1},
        {name: 'minor', type: 'Card8', value: 0},
        {name: 'hdrSize', type: 'Card8', value: 4},
        {name: 'major', type: 'Card8', value: 1}
    ]);
}

function makeNameIndex(fontNames) {
    var t = new table.Record('Name INDEX', [
        {name: 'names', type: 'INDEX', value: []}
    ]);
    t.names = [];
    for (var i = 0; i < fontNames.length; i += 1) {
        t.names.push({name: 'name_' + i, type: 'NAME', value: fontNames[i]});
    }

    return t;
}

// Given a dictionary's metadata, create a DICT structure.
function makeDict(meta, attrs, strings) {
    var m = {};
    for (var i = 0; i < meta.length; i += 1) {
        var entry = meta[i];
        var value = attrs[entry.name];
        if (value !== undefined && !equals(value, entry.value)) {
            if (entry.type === 'SID') {
                value = encodeString(value, strings);
            }

            m[entry.op] = {name: entry.name, type: entry.type, value: value};
        }
    }

    return m;
}

// The Top DICT houses the global font attributes.
function makeTopDict(attrs, strings) {
    var t = new table.Record('Top DICT', [
        {name: 'dict', type: 'DICT', value: {}}
    ]);
    t.dict = makeDict(TOP_DICT_META, attrs, strings);
    return t;
}

function makeTopDictIndex(topDict) {
    var t = new table.Record('Top DICT INDEX', [
        {name: 'topDicts', type: 'INDEX', value: []}
    ]);
    t.topDicts = [{name: 'topDict_0', type: 'TABLE', value: topDict}];
    return t;
}

function makeStringIndex(strings) {
    var t = new table.Record('String INDEX', [
        {name: 'strings', type: 'INDEX', value: []}
    ]);
    t.strings = [];
    for (var i = 0; i < strings.length; i += 1) {
        t.strings.push({name: 'string_' + i, type: 'STRING', value: strings[i]});
    }

    return t;
}

function makeGlobalSubrIndex() {
    // Currently we don't use subroutines.
    return new table.Record('Global Subr INDEX', [
        {name: 'subrs', type: 'INDEX', value: []}
    ]);
}

function makeCharsets(glyphNames, strings) {
    var t = new table.Record('Charsets', [
        {name: 'format', type: 'Card8', value: 0}
    ]);
    for (var i = 0; i < glyphNames.length; i += 1) {
        var glyphName = glyphNames[i];
        var glyphSID = encodeString(glyphName, strings);
        t.fields.push({name: 'glyph_' + i, type: 'SID', value: glyphSID});
    }

    return t;
}

function glyphToOps(glyph) {
    var ops = [];
    var path = glyph.path;
    ops.push({name: 'width', type: 'NUMBER', value: glyph.advanceWidth});
    var x = 0;
    var y = 0;
    for (var i = 0; i < path.commands.length; i += 1) {
        var dx;
        var dy;
        var cmd = path.commands[i];
        if (cmd.type === 'Q') {
            // CFF only supports bézier curves, so convert the quad to a bézier.
            var _13 = 1 / 3;
            var _23 = 2 / 3;

            // We're going to create a new command so we don't change the original path.
            cmd = {
                type: 'C',
                x: cmd.x,
                y: cmd.y,
                x1: _13 * x + _23 * cmd.x1,
                y1: _13 * y + _23 * cmd.y1,
                x2: _13 * cmd.x + _23 * cmd.x1,
                y2: _13 * cmd.y + _23 * cmd.y1
            };
        }

        if (cmd.type === 'M') {
            dx = Math.round(cmd.x - x);
            dy = Math.round(cmd.y - y);
            ops.push({name: 'dx', type: 'NUMBER', value: dx});
            ops.push({name: 'dy', type: 'NUMBER', value: dy});
            ops.push({name: 'rmoveto', type: 'OP', value: 21});
            x = Math.round(cmd.x);
            y = Math.round(cmd.y);
        } else if (cmd.type === 'L') {
            dx = Math.round(cmd.x - x);
            dy = Math.round(cmd.y - y);
            ops.push({name: 'dx', type: 'NUMBER', value: dx});
            ops.push({name: 'dy', type: 'NUMBER', value: dy});
            ops.push({name: 'rlineto', type: 'OP', value: 5});
            x = Math.round(cmd.x);
            y = Math.round(cmd.y);
        } else if (cmd.type === 'C') {
            var dx1 = Math.round(cmd.x1 - x);
            var dy1 = Math.round(cmd.y1 - y);
            var dx2 = Math.round(cmd.x2 - cmd.x1);
            var dy2 = Math.round(cmd.y2 - cmd.y1);
            dx = Math.round(cmd.x - cmd.x2);
            dy = Math.round(cmd.y - cmd.y2);
            ops.push({name: 'dx1', type: 'NUMBER', value: dx1});
            ops.push({name: 'dy1', type: 'NUMBER', value: dy1});
            ops.push({name: 'dx2', type: 'NUMBER', value: dx2});
            ops.push({name: 'dy2', type: 'NUMBER', value: dy2});
            ops.push({name: 'dx', type: 'NUMBER', value: dx});
            ops.push({name: 'dy', type: 'NUMBER', value: dy});
            ops.push({name: 'rrcurveto', type: 'OP', value: 8});
            x = Math.round(cmd.x);
            y = Math.round(cmd.y);
        }

        // Contours are closed automatically.

    }

    ops.push({name: 'endchar', type: 'OP', value: 14});
    return ops;
}

function makeCharStringsIndex(glyphs) {
    var t = new table.Record('CharStrings INDEX', [
        {name: 'charStrings', type: 'INDEX', value: []}
    ]);

    for (var i = 0; i < glyphs.length; i += 1) {
        var glyph = glyphs.get(i);
        var ops = glyphToOps(glyph);
        t.charStrings.push({name: glyph.name, type: 'CHARSTRING', value: ops});
    }

    return t;
}

function makePrivateDict(attrs, strings) {
    var t = new table.Record('Private DICT', [
        {name: 'dict', type: 'DICT', value: {}}
    ]);
    t.dict = makeDict(PRIVATE_DICT_META, attrs, strings);
    return t;
}

function makeCFFTable(glyphs, options) {
    var t = new table.Table('CFF ', [
        {name: 'header', type: 'RECORD'},
        {name: 'nameIndex', type: 'RECORD'},
        {name: 'topDictIndex', type: 'RECORD'},
        {name: 'stringIndex', type: 'RECORD'},
        {name: 'globalSubrIndex', type: 'RECORD'},
        {name: 'charsets', type: 'RECORD'},
        {name: 'charStringsIndex', type: 'RECORD'},
        {name: 'privateDict', type: 'RECORD'}
    ]);

    var fontScale = 1 / options.unitsPerEm;
    // We use non-zero values for the offsets so that the DICT encodes them.
    // This is important because the size of the Top DICT plays a role in offset calculation,
    // and the size shouldn't change after we've written correct offsets.
    var attrs = {
        version: options.version,
        fullName: options.fullName,
        familyName: options.familyName,
        weight: options.weightName,
        fontBBox: options.fontBBox || [0, 0, 0, 0],
        fontMatrix: [fontScale, 0, 0, fontScale, 0, 0],
        charset: 999,
        encoding: 0,
        charStrings: 999,
        private: [0, 999]
    };

    var privateAttrs = {};

    var glyphNames = [];
    var glyph;

    // Skip first glyph (.notdef)
    for (var i = 1; i < glyphs.length; i += 1) {
        glyph = glyphs.get(i);
        glyphNames.push(glyph.name);
    }

    var strings = [];

    t.header = makeHeader();
    t.nameIndex = makeNameIndex([options.postScriptName]);
    var topDict = makeTopDict(attrs, strings);
    t.topDictIndex = makeTopDictIndex(topDict);
    t.globalSubrIndex = makeGlobalSubrIndex();
    t.charsets = makeCharsets(glyphNames, strings);
    t.charStringsIndex = makeCharStringsIndex(glyphs);
    t.privateDict = makePrivateDict(privateAttrs, strings);

    // Needs to come at the end, to encode all custom strings used in the font.
    t.stringIndex = makeStringIndex(strings);

    var startOffset = t.header.sizeOf() +
        t.nameIndex.sizeOf() +
        t.topDictIndex.sizeOf() +
        t.stringIndex.sizeOf() +
        t.globalSubrIndex.sizeOf();
    attrs.charset = startOffset;

    // We use the CFF standard encoding; proper encoding will be handled in cmap.
    attrs.encoding = 0;
    attrs.charStrings = attrs.charset + t.charsets.sizeOf();
    attrs.private[1] = attrs.charStrings + t.charStringsIndex.sizeOf();

    // Recreate the Top DICT INDEX with the correct offsets.
    topDict = makeTopDict(attrs, strings);
    t.topDictIndex = makeTopDictIndex(topDict);

    return t;
}

exports.parse = parseCFFTable;
exports.make = makeCFFTable;

},{"../encoding":10,"../glyphset":13,"../parse":15,"../path":16,"../table":17}],19:[function(require,module,exports){
// The `cmap` table stores the mappings from characters to glyphs.
// https://www.microsoft.com/typography/OTSPEC/cmap.htm

'use strict';

var check = require('../check');
var parse = require('../parse');
var table = require('../table');

// Parse the `cmap` table. This table stores the mappings from characters to glyphs.
// There are many available formats, but we only support the Windows format 4.
// This function returns a `CmapEncoding` object or null if no supported format could be found.
function parseCmapTable(data, start) {
    var i;
    var cmap = {};
    cmap.version = parse.getUShort(data, start);
    check.argument(cmap.version === 0, 'cmap table version should be 0.');

    // The cmap table can contain many sub-tables, each with their own format.
    // We're only interested in a "platform 3" table. This is a Windows format.
    cmap.numTables = parse.getUShort(data, start + 2);
    var offset = -1;
    for (i = 0; i < cmap.numTables; i += 1) {
        var platformId = parse.getUShort(data, start + 4 + (i * 8));
        var encodingId = parse.getUShort(data, start + 4 + (i * 8) + 2);
        if (platformId === 3 && (encodingId === 1 || encodingId === 0)) {
            offset = parse.getULong(data, start + 4 + (i * 8) + 4);
            break;
        }
    }

    if (offset === -1) {
        // There is no cmap table in the font that we support, so return null.
        // This font will be marked as unsupported.
        return null;
    }

    var p = new parse.Parser(data, start + offset);
    cmap.format = p.parseUShort();
    check.argument(cmap.format === 4, 'Only format 4 cmap tables are supported.');

    // Length in bytes of the sub-tables.
    cmap.length = p.parseUShort();
    cmap.language = p.parseUShort();

    // segCount is stored x 2.
    var segCount;
    cmap.segCount = segCount = p.parseUShort() >> 1;

    // Skip searchRange, entrySelector, rangeShift.
    p.skip('uShort', 3);

    // The "unrolled" mapping from character codes to glyph indices.
    cmap.glyphIndexMap = {};

    var endCountParser = new parse.Parser(data, start + offset + 14);
    var startCountParser = new parse.Parser(data, start + offset + 16 + segCount * 2);
    var idDeltaParser = new parse.Parser(data, start + offset + 16 + segCount * 4);
    var idRangeOffsetParser = new parse.Parser(data, start + offset + 16 + segCount * 6);
    var glyphIndexOffset = start + offset + 16 + segCount * 8;
    for (i = 0; i < segCount - 1; i += 1) {
        var glyphIndex;
        var endCount = endCountParser.parseUShort();
        var startCount = startCountParser.parseUShort();
        var idDelta = idDeltaParser.parseShort();
        var idRangeOffset = idRangeOffsetParser.parseUShort();
        for (var c = startCount; c <= endCount; c += 1) {
            if (idRangeOffset !== 0) {
                // The idRangeOffset is relative to the current position in the idRangeOffset array.
                // Take the current offset in the idRangeOffset array.
                glyphIndexOffset = (idRangeOffsetParser.offset + idRangeOffsetParser.relativeOffset - 2);

                // Add the value of the idRangeOffset, which will move us into the glyphIndex array.
                glyphIndexOffset += idRangeOffset;

                // Then add the character index of the current segment, multiplied by 2 for USHORTs.
                glyphIndexOffset += (c - startCount) * 2;
                glyphIndex = parse.getUShort(data, glyphIndexOffset);
                if (glyphIndex !== 0) {
                    glyphIndex = (glyphIndex + idDelta) & 0xFFFF;
                }
            } else {
                glyphIndex = (c + idDelta) & 0xFFFF;
            }

            cmap.glyphIndexMap[c] = glyphIndex;
        }
    }

    return cmap;
}

function addSegment(t, code, glyphIndex) {
    t.segments.push({
        end: code,
        start: code,
        delta: -(code - glyphIndex),
        offset: 0
    });
}

function addTerminatorSegment(t) {
    t.segments.push({
        end: 0xFFFF,
        start: 0xFFFF,
        delta: 1,
        offset: 0
    });
}

function makeCmapTable(glyphs) {
    var i;
    var t = new table.Table('cmap', [
        {name: 'version', type: 'USHORT', value: 0},
        {name: 'numTables', type: 'USHORT', value: 1},
        {name: 'platformID', type: 'USHORT', value: 3},
        {name: 'encodingID', type: 'USHORT', value: 1},
        {name: 'offset', type: 'ULONG', value: 12},
        {name: 'format', type: 'USHORT', value: 4},
        {name: 'length', type: 'USHORT', value: 0},
        {name: 'language', type: 'USHORT', value: 0},
        {name: 'segCountX2', type: 'USHORT', value: 0},
        {name: 'searchRange', type: 'USHORT', value: 0},
        {name: 'entrySelector', type: 'USHORT', value: 0},
        {name: 'rangeShift', type: 'USHORT', value: 0}
    ]);

    t.segments = [];
    for (i = 0; i < glyphs.length; i += 1) {
        var glyph = glyphs.get(i);
        for (var j = 0; j < glyph.unicodes.length; j += 1) {
            addSegment(t, glyph.unicodes[j], i);
        }

        t.segments = t.segments.sort(function(a, b) {
            return a.start - b.start;
        });
    }

    addTerminatorSegment(t);

    var segCount;
    segCount = t.segments.length;
    t.segCountX2 = segCount * 2;
    t.searchRange = Math.pow(2, Math.floor(Math.log(segCount) / Math.log(2))) * 2;
    t.entrySelector = Math.log(t.searchRange / 2) / Math.log(2);
    t.rangeShift = t.segCountX2 - t.searchRange;

    // Set up parallel segment arrays.
    var endCounts = [];
    var startCounts = [];
    var idDeltas = [];
    var idRangeOffsets = [];
    var glyphIds = [];

    for (i = 0; i < segCount; i += 1) {
        var segment = t.segments[i];
        endCounts = endCounts.concat({name: 'end_' + i, type: 'USHORT', value: segment.end});
        startCounts = startCounts.concat({name: 'start_' + i, type: 'USHORT', value: segment.start});
        idDeltas = idDeltas.concat({name: 'idDelta_' + i, type: 'SHORT', value: segment.delta});
        idRangeOffsets = idRangeOffsets.concat({name: 'idRangeOffset_' + i, type: 'USHORT', value: segment.offset});
        if (segment.glyphId !== undefined) {
            glyphIds = glyphIds.concat({name: 'glyph_' + i, type: 'USHORT', value: segment.glyphId});
        }
    }

    t.fields = t.fields.concat(endCounts);
    t.fields.push({name: 'reservedPad', type: 'USHORT', value: 0});
    t.fields = t.fields.concat(startCounts);
    t.fields = t.fields.concat(idDeltas);
    t.fields = t.fields.concat(idRangeOffsets);
    t.fields = t.fields.concat(glyphIds);

    t.length = 14 + // Subtable header
        endCounts.length * 2 +
        2 + // reservedPad
        startCounts.length * 2 +
        idDeltas.length * 2 +
        idRangeOffsets.length * 2 +
        glyphIds.length * 2;

    return t;
}

exports.parse = parseCmapTable;
exports.make = makeCmapTable;

},{"../check":8,"../parse":15,"../table":17}],20:[function(require,module,exports){
// The `fvar` table stores font variation axes and instances.
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6fvar.html

'use strict';

var check = require('../check');
var parse = require('../parse');
var table = require('../table');

function addName(name, names) {
    var nameString = JSON.stringify(name);
    var nameID = 256;
    for (var nameKey in names) {
        var n = parseInt(nameKey);
        if (!n || n < 256) {
            continue;
        }

        if (JSON.stringify(names[nameKey]) === nameString) {
            return n;
        }

        if (nameID <= n) {
            nameID = n + 1;
        }
    }

    names[nameID] = name;
    return nameID;
}

function makeFvarAxis(n, axis, names) {
    var nameID = addName(axis.name, names);
    return [
        {name: 'tag_' + n, type: 'TAG', value: axis.tag},
        {name: 'minValue_' + n, type: 'FIXED', value: axis.minValue << 16},
        {name: 'defaultValue_' + n, type: 'FIXED', value: axis.defaultValue << 16},
        {name: 'maxValue_' + n, type: 'FIXED', value: axis.maxValue << 16},
        {name: 'flags_' + n, type: 'USHORT', value: 0},
        {name: 'nameID_' + n, type: 'USHORT', value: nameID}
    ];
}

function parseFvarAxis(data, start, names) {
    var axis = {};
    var p = new parse.Parser(data, start);
    axis.tag = p.parseTag();
    axis.minValue = p.parseFixed();
    axis.defaultValue = p.parseFixed();
    axis.maxValue = p.parseFixed();
    p.skip('uShort', 1);  // reserved for flags; no values defined
    axis.name = names[p.parseUShort()] || {};
    return axis;
}

function makeFvarInstance(n, inst, axes, names) {
    var nameID = addName(inst.name, names);
    var fields = [
        {name: 'nameID_' + n, type: 'USHORT', value: nameID},
        {name: 'flags_' + n, type: 'USHORT', value: 0}
    ];

    for (var i = 0; i < axes.length; ++i) {
        var axisTag = axes[i].tag;
        fields.push({
            name: 'axis_' + n + ' ' + axisTag,
            type: 'FIXED',
            value: inst.coordinates[axisTag] << 16
        });
    }

    return fields;
}

function parseFvarInstance(data, start, axes, names) {
    var inst = {};
    var p = new parse.Parser(data, start);
    inst.name = names[p.parseUShort()] || {};
    p.skip('uShort', 1);  // reserved for flags; no values defined

    inst.coordinates = {};
    for (var i = 0; i < axes.length; ++i) {
        inst.coordinates[axes[i].tag] = p.parseFixed();
    }

    return inst;
}

function makeFvarTable(fvar, names) {
    var result = new table.Table('fvar', [
        {name: 'version', type: 'ULONG', value: 0x10000},
        {name: 'offsetToData', type: 'USHORT', value: 0},
        {name: 'countSizePairs', type: 'USHORT', value: 2},
        {name: 'axisCount', type: 'USHORT', value: fvar.axes.length},
        {name: 'axisSize', type: 'USHORT', value: 20},
        {name: 'instanceCount', type: 'USHORT', value: fvar.instances.length},
        {name: 'instanceSize', type: 'USHORT', value: 4 + fvar.axes.length * 4}
    ]);
    result.offsetToData = result.sizeOf();

    for (var i = 0; i < fvar.axes.length; i++) {
        result.fields = result.fields.concat(makeFvarAxis(i, fvar.axes[i], names));
    }

    for (var j = 0; j < fvar.instances.length; j++) {
        result.fields = result.fields.concat(makeFvarInstance(j, fvar.instances[j], fvar.axes, names));
    }

    return result;
}

function parseFvarTable(data, start, names) {
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseULong();
    check.argument(tableVersion === 0x00010000, 'Unsupported fvar table version.');
    var offsetToData = p.parseOffset16();
    // Skip countSizePairs.
    p.skip('uShort', 1);
    var axisCount = p.parseUShort();
    var axisSize = p.parseUShort();
    var instanceCount = p.parseUShort();
    var instanceSize = p.parseUShort();

    var axes = [];
    for (var i = 0; i < axisCount; i++) {
        axes.push(parseFvarAxis(data, start + offsetToData + i * axisSize, names));
    }

    var instances = [];
    var instanceStart = start + offsetToData + axisCount * axisSize;
    for (var j = 0; j < instanceCount; j++) {
        instances.push(parseFvarInstance(data, instanceStart + j * instanceSize, axes, names));
    }

    return {axes: axes, instances: instances};
}

exports.make = makeFvarTable;
exports.parse = parseFvarTable;

},{"../check":8,"../parse":15,"../table":17}],21:[function(require,module,exports){
// The `glyf` table describes the glyphs in TrueType outline format.
// http://www.microsoft.com/typography/otspec/glyf.htm

'use strict';

var check = require('../check');
var glyphset = require('../glyphset');
var parse = require('../parse');
var path = require('../path');

// Parse the coordinate data for a glyph.
function parseGlyphCoordinate(p, flag, previousValue, shortVectorBitMask, sameBitMask) {
    var v;
    if ((flag & shortVectorBitMask) > 0) {
        // The coordinate is 1 byte long.
        v = p.parseByte();
        // The `same` bit is re-used for short values to signify the sign of the value.
        if ((flag & sameBitMask) === 0) {
            v = -v;
        }

        v = previousValue + v;
    } else {
        //  The coordinate is 2 bytes long.
        // If the `same` bit is set, the coordinate is the same as the previous coordinate.
        if ((flag & sameBitMask) > 0) {
            v = previousValue;
        } else {
            // Parse the coordinate as a signed 16-bit delta value.
            v = previousValue + p.parseShort();
        }
    }

    return v;
}

// Parse a TrueType glyph.
function parseGlyph(glyph, data, start) {
    var p = new parse.Parser(data, start);
    glyph.numberOfContours = p.parseShort();
    glyph.xMin = p.parseShort();
    glyph.yMin = p.parseShort();
    glyph.xMax = p.parseShort();
    glyph.yMax = p.parseShort();
    var flags;
    var flag;
    if (glyph.numberOfContours > 0) {
        var i;
        // This glyph is not a composite.
        var endPointIndices = glyph.endPointIndices = [];
        for (i = 0; i < glyph.numberOfContours; i += 1) {
            endPointIndices.push(p.parseUShort());
        }

        glyph.instructionLength = p.parseUShort();
        glyph.instructions = [];
        for (i = 0; i < glyph.instructionLength; i += 1) {
            glyph.instructions.push(p.parseByte());
        }

        var numberOfCoordinates = endPointIndices[endPointIndices.length - 1] + 1;
        flags = [];
        for (i = 0; i < numberOfCoordinates; i += 1) {
            flag = p.parseByte();
            flags.push(flag);
            // If bit 3 is set, we repeat this flag n times, where n is the next byte.
            if ((flag & 8) > 0) {
                var repeatCount = p.parseByte();
                for (var j = 0; j < repeatCount; j += 1) {
                    flags.push(flag);
                    i += 1;
                }
            }
        }

        check.argument(flags.length === numberOfCoordinates, 'Bad flags.');

        if (endPointIndices.length > 0) {
            var points = [];
            var point;
            // X/Y coordinates are relative to the previous point, except for the first point which is relative to 0,0.
            if (numberOfCoordinates > 0) {
                for (i = 0; i < numberOfCoordinates; i += 1) {
                    flag = flags[i];
                    point = {};
                    point.onCurve = !!(flag & 1);
                    point.lastPointOfContour = endPointIndices.indexOf(i) >= 0;
                    points.push(point);
                }

                var px = 0;
                for (i = 0; i < numberOfCoordinates; i += 1) {
                    flag = flags[i];
                    point = points[i];
                    point.x = parseGlyphCoordinate(p, flag, px, 2, 16);
                    px = point.x;
                }

                var py = 0;
                for (i = 0; i < numberOfCoordinates; i += 1) {
                    flag = flags[i];
                    point = points[i];
                    point.y = parseGlyphCoordinate(p, flag, py, 4, 32);
                    py = point.y;
                }
            }

            glyph.points = points;
        } else {
            glyph.points = [];
        }
    } else if (glyph.numberOfContours === 0) {
        glyph.points = [];
    } else {
        glyph.isComposite = true;
        glyph.points = [];
        glyph.components = [];
        var moreComponents = true;
        while (moreComponents) {
            flags = p.parseUShort();
            var component = {
                glyphIndex: p.parseUShort(),
                xScale: 1,
                scale01: 0,
                scale10: 0,
                yScale: 1,
                dx: 0,
                dy: 0
            };
            if ((flags & 1) > 0) {
                // The arguments are words
                component.dx = p.parseShort();
                component.dy = p.parseShort();
            } else {
                // The arguments are bytes
                component.dx = p.parseChar();
                component.dy = p.parseChar();
            }

            if ((flags & 8) > 0) {
                // We have a scale
                component.xScale = component.yScale = p.parseF2Dot14();
            } else if ((flags & 64) > 0) {
                // We have an X / Y scale
                component.xScale = p.parseF2Dot14();
                component.yScale = p.parseF2Dot14();
            } else if ((flags & 128) > 0) {
                // We have a 2x2 transformation
                component.xScale = p.parseF2Dot14();
                component.scale01 = p.parseF2Dot14();
                component.scale10 = p.parseF2Dot14();
                component.yScale = p.parseF2Dot14();
            }

            glyph.components.push(component);
            moreComponents = !!(flags & 32);
        }
    }
}

// Transform an array of points and return a new array.
function transformPoints(points, transform) {
    var newPoints = [];
    for (var i = 0; i < points.length; i += 1) {
        var pt = points[i];
        var newPt = {
            x: transform.xScale * pt.x + transform.scale01 * pt.y + transform.dx,
            y: transform.scale10 * pt.x + transform.yScale * pt.y + transform.dy,
            onCurve: pt.onCurve,
            lastPointOfContour: pt.lastPointOfContour
        };
        newPoints.push(newPt);
    }

    return newPoints;
}

function getContours(points) {
    var contours = [];
    var currentContour = [];
    for (var i = 0; i < points.length; i += 1) {
        var pt = points[i];
        currentContour.push(pt);
        if (pt.lastPointOfContour) {
            contours.push(currentContour);
            currentContour = [];
        }
    }

    check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
    return contours;
}

// Convert the TrueType glyph outline to a Path.
function getPath(points) {
    var p = new path.Path();
    if (!points) {
        return p;
    }

    var contours = getContours(points);
    for (var i = 0; i < contours.length; i += 1) {
        var contour = contours[i];
        var firstPt = contour[0];
        var lastPt = contour[contour.length - 1];
        var curvePt;
        var realFirstPoint;
        if (firstPt.onCurve) {
            curvePt = null;
            // The first point will be consumed by the moveTo command,
            // so skip it in the loop.
            realFirstPoint = true;
        } else {
            if (lastPt.onCurve) {
                // If the first point is off-curve and the last point is on-curve,
                // start at the last point.
                firstPt = lastPt;
            } else {
                // If both first and last points are off-curve, start at their middle.
                firstPt = { x: (firstPt.x + lastPt.x) / 2, y: (firstPt.y + lastPt.y) / 2 };
            }

            curvePt = firstPt;
            // The first point is synthesized, so don't skip the real first point.
            realFirstPoint = false;
        }

        p.moveTo(firstPt.x, firstPt.y);

        for (var j = realFirstPoint ? 1 : 0; j < contour.length; j += 1) {
            var pt = contour[j];
            var prevPt = j === 0 ? firstPt : contour[j - 1];
            if (prevPt.onCurve && pt.onCurve) {
                // This is a straight line.
                p.lineTo(pt.x, pt.y);
            } else if (prevPt.onCurve && !pt.onCurve) {
                curvePt = pt;
            } else if (!prevPt.onCurve && !pt.onCurve) {
                var midPt = { x: (prevPt.x + pt.x) / 2, y: (prevPt.y + pt.y) / 2 };
                p.quadraticCurveTo(prevPt.x, prevPt.y, midPt.x, midPt.y);
                curvePt = pt;
            } else if (!prevPt.onCurve && pt.onCurve) {
                // Previous point off-curve, this point on-curve.
                p.quadraticCurveTo(curvePt.x, curvePt.y, pt.x, pt.y);
                curvePt = null;
            } else {
                throw new Error('Invalid state.');
            }
        }

        if (firstPt !== lastPt) {
            // Connect the last and first points
            if (curvePt) {
                p.quadraticCurveTo(curvePt.x, curvePt.y, firstPt.x, firstPt.y);
            } else {
                p.lineTo(firstPt.x, firstPt.y);
            }
        }
    }

    p.closePath();
    return p;
}

function buildPath(glyphs, glyph) {
    if (glyph.isComposite) {
        for (var j = 0; j < glyph.components.length; j += 1) {
            var component = glyph.components[j];
            var componentGlyph = glyphs.get(component.glyphIndex);
            // Force the ttfGlyphLoader to parse the glyph.
            componentGlyph.getPath();
            if (componentGlyph.points) {
                var transformedPoints = transformPoints(componentGlyph.points, component);
                glyph.points = glyph.points.concat(transformedPoints);
            }
        }
    }

    return getPath(glyph.points);
}

// Parse all the glyphs according to the offsets from the `loca` table.
function parseGlyfTable(data, start, loca, font) {
    var glyphs = new glyphset.GlyphSet(font);
    var i;

    // The last element of the loca table is invalid.
    for (i = 0; i < loca.length - 1; i += 1) {
        var offset = loca[i];
        var nextOffset = loca[i + 1];
        if (offset !== nextOffset) {
            glyphs.push(i, glyphset.ttfGlyphLoader(font, i, parseGlyph, data, start + offset, buildPath));
        } else {
            glyphs.push(i, glyphset.glyphLoader(font, i));
        }
    }

    return glyphs;
}

exports.parse = parseGlyfTable;

},{"../check":8,"../glyphset":13,"../parse":15,"../path":16}],22:[function(require,module,exports){
// The `GPOS` table contains kerning pairs, among other things.
// https://www.microsoft.com/typography/OTSPEC/gpos.htm

'use strict';

var check = require('../check');
var parse = require('../parse');

// Parse ScriptList and FeatureList tables of GPOS, GSUB, GDEF, BASE, JSTF tables.
// These lists are unused by now, this function is just the basis for a real parsing.
function parseTaggedListTable(data, start) {
    var p = new parse.Parser(data, start);
    var n = p.parseUShort();
    var list = [];
    for (var i = 0; i < n; i++) {
        list[p.parseTag()] = { offset: p.parseUShort() };
    }

    return list;
}

// Parse a coverage table in a GSUB, GPOS or GDEF table.
// Format 1 is a simple list of glyph ids,
// Format 2 is a list of ranges. It is expanded in a list of glyphs, maybe not the best idea.
function parseCoverageTable(data, start) {
    var p = new parse.Parser(data, start);
    var format = p.parseUShort();
    var count =  p.parseUShort();
    if (format === 1) {
        return p.parseUShortList(count);
    } else if (format === 2) {
        var coverage = [];
        for (; count--;) {
            var begin = p.parseUShort();
            var end = p.parseUShort();
            var index = p.parseUShort();
            for (var i = begin; i <= end; i++) {
                coverage[index++] = i;
            }
        }

        return coverage;
    }
}

// Parse a Class Definition Table in a GSUB, GPOS or GDEF table.
// Returns a function that gets a class value from a glyph ID.
function parseClassDefTable(data, start) {
    var p = new parse.Parser(data, start);
    var format = p.parseUShort();
    if (format === 1) {
        // Format 1 specifies a range of consecutive glyph indices, one class per glyph ID.
        var startGlyph = p.parseUShort();
        var glyphCount = p.parseUShort();
        var classes = p.parseUShortList(glyphCount);
        return function(glyphID) {
            return classes[glyphID - startGlyph] || 0;
        };
    } else if (format === 2) {
        // Format 2 defines multiple groups of glyph indices that belong to the same class.
        var rangeCount = p.parseUShort();
        var startGlyphs = [];
        var endGlyphs = [];
        var classValues = [];
        for (var i = 0; i < rangeCount; i++) {
            startGlyphs[i] = p.parseUShort();
            endGlyphs[i] = p.parseUShort();
            classValues[i] = p.parseUShort();
        }

        return function(glyphID) {
            var l = 0;
            var r = startGlyphs.length - 1;
            while (l < r) {
                var c = (l + r + 1) >> 1;
                if (glyphID < startGlyphs[c]) {
                    r = c - 1;
                } else {
                    l = c;
                }
            }

            if (startGlyphs[l] <= glyphID && glyphID <= endGlyphs[l]) {
                return classValues[l] || 0;
            }

            return 0;
        };
    }
}

// Parse a pair adjustment positioning subtable, format 1 or format 2
// The subtable is returned in the form of a lookup function.
function parsePairPosSubTable(data, start) {
    var p = new parse.Parser(data, start);
    // This part is common to format 1 and format 2 subtables
    var format = p.parseUShort();
    var coverageOffset = p.parseUShort();
    var coverage = parseCoverageTable(data, start + coverageOffset);
    // valueFormat 4: XAdvance only, 1: XPlacement only, 0: no ValueRecord for second glyph
    // Only valueFormat1=4 and valueFormat2=0 is supported.
    var valueFormat1 = p.parseUShort();
    var valueFormat2 = p.parseUShort();
    var value1;
    var value2;
    if (valueFormat1 !== 4 || valueFormat2 !== 0) return;
    var sharedPairSets = {};
    if (format === 1) {
        // Pair Positioning Adjustment: Format 1
        var pairSetCount = p.parseUShort();
        var pairSet = [];
        // Array of offsets to PairSet tables-from beginning of PairPos subtable-ordered by Coverage Index
        var pairSetOffsets = p.parseOffset16List(pairSetCount);
        for (var firstGlyph = 0; firstGlyph < pairSetCount; firstGlyph++) {
            var pairSetOffset = pairSetOffsets[firstGlyph];
            var sharedPairSet = sharedPairSets[pairSetOffset];
            if (!sharedPairSet) {
                // Parse a pairset table in a pair adjustment subtable format 1
                sharedPairSet = {};
                p.relativeOffset = pairSetOffset;
                var pairValueCount = p.parseUShort();
                for (; pairValueCount--;) {
                    var secondGlyph = p.parseUShort();
                    if (valueFormat1) value1 = p.parseShort();
                    if (valueFormat2) value2 = p.parseShort();
                    // We only support valueFormat1 = 4 and valueFormat2 = 0,
                    // so value1 is the XAdvance and value2 is empty.
                    sharedPairSet[secondGlyph] = value1;
                }
            }

            pairSet[coverage[firstGlyph]] = sharedPairSet;
        }

        return function(leftGlyph, rightGlyph) {
            var pairs = pairSet[leftGlyph];
            if (pairs) return pairs[rightGlyph];
        };
    } else if (format === 2) {
        // Pair Positioning Adjustment: Format 2
        var classDef1Offset = p.parseUShort();
        var classDef2Offset = p.parseUShort();
        var class1Count = p.parseUShort();
        var class2Count = p.parseUShort();
        var getClass1 = parseClassDefTable(data, start + classDef1Offset);
        var getClass2 = parseClassDefTable(data, start + classDef2Offset);

        // Parse kerning values by class pair.
        var kerningMatrix = [];
        for (var i = 0; i < class1Count; i++) {
            var kerningRow = kerningMatrix[i] = [];
            for (var j = 0; j < class2Count; j++) {
                if (valueFormat1) value1 = p.parseShort();
                if (valueFormat2) value2 = p.parseShort();
                // We only support valueFormat1 = 4 and valueFormat2 = 0,
                // so value1 is the XAdvance and value2 is empty.
                kerningRow[j] = value1;
            }
        }

        // Convert coverage list to a hash
        var covered = {};
        for (i = 0; i < coverage.length; i++) covered[coverage[i]] = 1;

        // Get the kerning value for a specific glyph pair.
        return function(leftGlyph, rightGlyph) {
            if (!covered[leftGlyph]) return;
            var class1 = getClass1(leftGlyph);
            var class2 = getClass2(rightGlyph);
            var kerningRow = kerningMatrix[class1];

            if (kerningRow) {
                return kerningRow[class2];
            }
        };
    }
}

// Parse a LookupTable (present in of GPOS, GSUB, GDEF, BASE, JSTF tables).
function parseLookupTable(data, start) {
    var p = new parse.Parser(data, start);
    var lookupType = p.parseUShort();
    var lookupFlag = p.parseUShort();
    var useMarkFilteringSet = lookupFlag & 0x10;
    var subTableCount = p.parseUShort();
    var subTableOffsets = p.parseOffset16List(subTableCount);
    var table = {
        lookupType: lookupType,
        lookupFlag: lookupFlag,
        markFilteringSet: useMarkFilteringSet ? p.parseUShort() : -1
    };
    // LookupType 2, Pair adjustment
    if (lookupType === 2) {
        var subtables = [];
        for (var i = 0; i < subTableCount; i++) {
            subtables.push(parsePairPosSubTable(data, start + subTableOffsets[i]));
        }
        // Return a function which finds the kerning values in the subtables.
        table.getKerningValue = function(leftGlyph, rightGlyph) {
            for (var i = subtables.length; i--;) {
                var value = subtables[i](leftGlyph, rightGlyph);
                if (value !== undefined) return value;
            }

            return 0;
        };
    }

    return table;
}

// Parse the `GPOS` table which contains, among other things, kerning pairs.
// https://www.microsoft.com/typography/OTSPEC/gpos.htm
function parseGposTable(data, start, font) {
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseFixed();
    check.argument(tableVersion === 1, 'Unsupported GPOS table version.');

    // ScriptList and FeatureList - ignored for now
    parseTaggedListTable(data, start + p.parseUShort());
    // 'kern' is the feature we are looking for.
    parseTaggedListTable(data, start + p.parseUShort());

    // LookupList
    var lookupListOffset = p.parseUShort();
    p.relativeOffset = lookupListOffset;
    var lookupCount = p.parseUShort();
    var lookupTableOffsets = p.parseOffset16List(lookupCount);
    var lookupListAbsoluteOffset = start + lookupListOffset;
    for (var i = 0; i < lookupCount; i++) {
        var table = parseLookupTable(data, lookupListAbsoluteOffset + lookupTableOffsets[i]);
        if (table.lookupType === 2 && !font.getGposKerningValue) font.getGposKerningValue = table.getKerningValue;
    }
}

exports.parse = parseGposTable;

},{"../check":8,"../parse":15}],23:[function(require,module,exports){
// The `head` table contains global information about the font.
// https://www.microsoft.com/typography/OTSPEC/head.htm

'use strict';

var check = require('../check');
var parse = require('../parse');
var table = require('../table');

// Parse the header `head` table
function parseHeadTable(data, start) {
    var head = {};
    var p = new parse.Parser(data, start);
    head.version = p.parseVersion();
    head.fontRevision = Math.round(p.parseFixed() * 1000) / 1000;
    head.checkSumAdjustment = p.parseULong();
    head.magicNumber = p.parseULong();
    check.argument(head.magicNumber === 0x5F0F3CF5, 'Font header has wrong magic number.');
    head.flags = p.parseUShort();
    head.unitsPerEm = p.parseUShort();
    head.created = p.parseLongDateTime();
    head.modified = p.parseLongDateTime();
    head.xMin = p.parseShort();
    head.yMin = p.parseShort();
    head.xMax = p.parseShort();
    head.yMax = p.parseShort();
    head.macStyle = p.parseUShort();
    head.lowestRecPPEM = p.parseUShort();
    head.fontDirectionHint = p.parseShort();
    head.indexToLocFormat = p.parseShort();
    head.glyphDataFormat = p.parseShort();
    return head;
}

function makeHeadTable(options) {
    return new table.Table('head', [
        {name: 'version', type: 'FIXED', value: 0x00010000},
        {name: 'fontRevision', type: 'FIXED', value: 0x00010000},
        {name: 'checkSumAdjustment', type: 'ULONG', value: 0},
        {name: 'magicNumber', type: 'ULONG', value: 0x5F0F3CF5},
        {name: 'flags', type: 'USHORT', value: 0},
        {name: 'unitsPerEm', type: 'USHORT', value: 1000},
        {name: 'created', type: 'LONGDATETIME', value: 0},
        {name: 'modified', type: 'LONGDATETIME', value: 0},
        {name: 'xMin', type: 'SHORT', value: 0},
        {name: 'yMin', type: 'SHORT', value: 0},
        {name: 'xMax', type: 'SHORT', value: 0},
        {name: 'yMax', type: 'SHORT', value: 0},
        {name: 'macStyle', type: 'USHORT', value: 0},
        {name: 'lowestRecPPEM', type: 'USHORT', value: 0},
        {name: 'fontDirectionHint', type: 'SHORT', value: 2},
        {name: 'indexToLocFormat', type: 'SHORT', value: 0},
        {name: 'glyphDataFormat', type: 'SHORT', value: 0}
    ], options);
}

exports.parse = parseHeadTable;
exports.make = makeHeadTable;

},{"../check":8,"../parse":15,"../table":17}],24:[function(require,module,exports){
// The `hhea` table contains information for horizontal layout.
// https://www.microsoft.com/typography/OTSPEC/hhea.htm

'use strict';

var parse = require('../parse');
var table = require('../table');

// Parse the horizontal header `hhea` table
function parseHheaTable(data, start) {
    var hhea = {};
    var p = new parse.Parser(data, start);
    hhea.version = p.parseVersion();
    hhea.ascender = p.parseShort();
    hhea.descender = p.parseShort();
    hhea.lineGap = p.parseShort();
    hhea.advanceWidthMax = p.parseUShort();
    hhea.minLeftSideBearing = p.parseShort();
    hhea.minRightSideBearing = p.parseShort();
    hhea.xMaxExtent = p.parseShort();
    hhea.caretSlopeRise = p.parseShort();
    hhea.caretSlopeRun = p.parseShort();
    hhea.caretOffset = p.parseShort();
    p.relativeOffset += 8;
    hhea.metricDataFormat = p.parseShort();
    hhea.numberOfHMetrics = p.parseUShort();
    return hhea;
}

function makeHheaTable(options) {
    return new table.Table('hhea', [
        {name: 'version', type: 'FIXED', value: 0x00010000},
        {name: 'ascender', type: 'FWORD', value: 0},
        {name: 'descender', type: 'FWORD', value: 0},
        {name: 'lineGap', type: 'FWORD', value: 0},
        {name: 'advanceWidthMax', type: 'UFWORD', value: 0},
        {name: 'minLeftSideBearing', type: 'FWORD', value: 0},
        {name: 'minRightSideBearing', type: 'FWORD', value: 0},
        {name: 'xMaxExtent', type: 'FWORD', value: 0},
        {name: 'caretSlopeRise', type: 'SHORT', value: 1},
        {name: 'caretSlopeRun', type: 'SHORT', value: 0},
        {name: 'caretOffset', type: 'SHORT', value: 0},
        {name: 'reserved1', type: 'SHORT', value: 0},
        {name: 'reserved2', type: 'SHORT', value: 0},
        {name: 'reserved3', type: 'SHORT', value: 0},
        {name: 'reserved4', type: 'SHORT', value: 0},
        {name: 'metricDataFormat', type: 'SHORT', value: 0},
        {name: 'numberOfHMetrics', type: 'USHORT', value: 0}
    ], options);
}

exports.parse = parseHheaTable;
exports.make = makeHheaTable;

},{"../parse":15,"../table":17}],25:[function(require,module,exports){
// The `hmtx` table contains the horizontal metrics for all glyphs.
// https://www.microsoft.com/typography/OTSPEC/hmtx.htm

'use strict';

var parse = require('../parse');
var table = require('../table');

// Parse the `hmtx` table, which contains the horizontal metrics for all glyphs.
// This function augments the glyph array, adding the advanceWidth and leftSideBearing to each glyph.
function parseHmtxTable(data, start, numMetrics, numGlyphs, glyphs) {
    var advanceWidth;
    var leftSideBearing;
    var p = new parse.Parser(data, start);
    for (var i = 0; i < numGlyphs; i += 1) {
        // If the font is monospaced, only one entry is needed. This last entry applies to all subsequent glyphs.
        if (i < numMetrics) {
            advanceWidth = p.parseUShort();
            leftSideBearing = p.parseShort();
        }

        var glyph = glyphs.get(i);
        glyph.advanceWidth = advanceWidth;
        glyph.leftSideBearing = leftSideBearing;
    }
}

function makeHmtxTable(glyphs) {
    var t = new table.Table('hmtx', []);
    for (var i = 0; i < glyphs.length; i += 1) {
        var glyph = glyphs.get(i);
        var advanceWidth = glyph.advanceWidth || 0;
        var leftSideBearing = glyph.leftSideBearing || 0;
        t.fields.push({name: 'advanceWidth_' + i, type: 'USHORT', value: advanceWidth});
        t.fields.push({name: 'leftSideBearing_' + i, type: 'SHORT', value: leftSideBearing});
    }

    return t;
}

exports.parse = parseHmtxTable;
exports.make = makeHmtxTable;

},{"../parse":15,"../table":17}],26:[function(require,module,exports){
// The `kern` table contains kerning pairs.
// Note that some fonts use the GPOS OpenType layout table to specify kerning.
// https://www.microsoft.com/typography/OTSPEC/kern.htm

'use strict';

var check = require('../check');
var parse = require('../parse');

// Parse the `kern` table which contains kerning pairs.
function parseKernTable(data, start) {
    var pairs = {};
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseUShort();
    check.argument(tableVersion === 0, 'Unsupported kern table version.');
    // Skip nTables.
    p.skip('uShort', 1);
    var subTableVersion = p.parseUShort();
    check.argument(subTableVersion === 0, 'Unsupported kern sub-table version.');
    // Skip subTableLength, subTableCoverage
    p.skip('uShort', 2);
    var nPairs = p.parseUShort();
    // Skip searchRange, entrySelector, rangeShift.
    p.skip('uShort', 3);
    for (var i = 0; i < nPairs; i += 1) {
        var leftIndex = p.parseUShort();
        var rightIndex = p.parseUShort();
        var value = p.parseShort();
        pairs[leftIndex + ',' + rightIndex] = value;
    }

    return pairs;
}

exports.parse = parseKernTable;

},{"../check":8,"../parse":15}],27:[function(require,module,exports){
// The `loca` table stores the offsets to the locations of the glyphs in the font.
// https://www.microsoft.com/typography/OTSPEC/loca.htm

'use strict';

var parse = require('../parse');

// Parse the `loca` table. This table stores the offsets to the locations of the glyphs in the font,
// relative to the beginning of the glyphData table.
// The number of glyphs stored in the `loca` table is specified in the `maxp` table (under numGlyphs)
// The loca table has two versions: a short version where offsets are stored as uShorts, and a long
// version where offsets are stored as uLongs. The `head` table specifies which version to use
// (under indexToLocFormat).
function parseLocaTable(data, start, numGlyphs, shortVersion) {
    var p = new parse.Parser(data, start);
    var parseFn = shortVersion ? p.parseUShort : p.parseULong;
    // There is an extra entry after the last index element to compute the length of the last glyph.
    // That's why we use numGlyphs + 1.
    var glyphOffsets = [];
    for (var i = 0; i < numGlyphs + 1; i += 1) {
        var glyphOffset = parseFn.call(p);
        if (shortVersion) {
            // The short table version stores the actual offset divided by 2.
            glyphOffset *= 2;
        }

        glyphOffsets.push(glyphOffset);
    }

    return glyphOffsets;
}

exports.parse = parseLocaTable;

},{"../parse":15}],28:[function(require,module,exports){
// The `ltag` table stores IETF BCP-47 language tags. It allows supporting
// languages for which TrueType does not assign a numeric code.
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6ltag.html
// http://www.w3.org/International/articles/language-tags/
// http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry

'use strict';

var check = require('../check');
var parse = require('../parse');
var table = require('../table');

function makeLtagTable(tags) {
    var result = new table.Table('ltag', [
        {name: 'version', type: 'ULONG', value: 1},
        {name: 'flags', type: 'ULONG', value: 0},
        {name: 'numTags', type: 'ULONG', value: tags.length}
    ]);

    var stringPool = '';
    var stringPoolOffset = 12 + tags.length * 4;
    for (var i = 0; i < tags.length; ++i) {
        var pos = stringPool.indexOf(tags[i]);
        if (pos < 0) {
            pos = stringPool.length;
            stringPool += tags[i];
        }

        result.fields.push({name: 'offset ' + i, type: 'USHORT', value: stringPoolOffset + pos});
        result.fields.push({name: 'length ' + i, type: 'USHORT', value: tags[i].length});
    }

    result.fields.push({name: 'stringPool', type: 'CHARARRAY', value: stringPool});
    return result;
}

function parseLtagTable(data, start) {
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseULong();
    check.argument(tableVersion === 1, 'Unsupported ltag table version.');
    // The 'ltag' specification does not define any flags; skip the field.
    p.skip('uLong', 1);
    var numTags = p.parseULong();

    var tags = [];
    for (var i = 0; i < numTags; i++) {
        var tag = '';
        var offset = start + p.parseUShort();
        var length = p.parseUShort();
        for (var j = offset; j < offset + length; ++j) {
            tag += String.fromCharCode(data.getInt8(j));
        }

        tags.push(tag);
    }

    return tags;
}

exports.make = makeLtagTable;
exports.parse = parseLtagTable;

},{"../check":8,"../parse":15,"../table":17}],29:[function(require,module,exports){
// The `maxp` table establishes the memory requirements for the font.
// We need it just to get the number of glyphs in the font.
// https://www.microsoft.com/typography/OTSPEC/maxp.htm

'use strict';

var parse = require('../parse');
var table = require('../table');

// Parse the maximum profile `maxp` table.
function parseMaxpTable(data, start) {
    var maxp = {};
    var p = new parse.Parser(data, start);
    maxp.version = p.parseVersion();
    maxp.numGlyphs = p.parseUShort();
    if (maxp.version === 1.0) {
        maxp.maxPoints = p.parseUShort();
        maxp.maxContours = p.parseUShort();
        maxp.maxCompositePoints = p.parseUShort();
        maxp.maxCompositeContours = p.parseUShort();
        maxp.maxZones = p.parseUShort();
        maxp.maxTwilightPoints = p.parseUShort();
        maxp.maxStorage = p.parseUShort();
        maxp.maxFunctionDefs = p.parseUShort();
        maxp.maxInstructionDefs = p.parseUShort();
        maxp.maxStackElements = p.parseUShort();
        maxp.maxSizeOfInstructions = p.parseUShort();
        maxp.maxComponentElements = p.parseUShort();
        maxp.maxComponentDepth = p.parseUShort();
    }

    return maxp;
}

function makeMaxpTable(numGlyphs) {
    return new table.Table('maxp', [
        {name: 'version', type: 'FIXED', value: 0x00005000},
        {name: 'numGlyphs', type: 'USHORT', value: numGlyphs}
    ]);
}

exports.parse = parseMaxpTable;
exports.make = makeMaxpTable;

},{"../parse":15,"../table":17}],30:[function(require,module,exports){
// The `name` naming table.
// https://www.microsoft.com/typography/OTSPEC/name.htm

'use strict';

var types = require('../types');
var decode = types.decode;
var encode = types.encode;
var parse = require('../parse');
var table = require('../table');

// NameIDs for the name table.
var nameTableNames = [
    'copyright',              // 0
    'fontFamily',             // 1
    'fontSubfamily',          // 2
    'uniqueID',               // 3
    'fullName',               // 4
    'version',                // 5
    'postScriptName',         // 6
    'trademark',              // 7
    'manufacturer',           // 8
    'designer',               // 9
    'description',            // 10
    'manufacturerURL',        // 11
    'designerURL',            // 12
    'license',                // 13
    'licenseURL',             // 14
    'reserved',               // 15
    'preferredFamily',        // 16
    'preferredSubfamily',     // 17
    'compatibleFullName',     // 18
    'sampleText',             // 19
    'postScriptFindFontName', // 20
    'wwsFamily',              // 21
    'wwsSubfamily'            // 22
];

var macLanguages = {
    0: 'en',
    1: 'fr',
    2: 'de',
    3: 'it',
    4: 'nl',
    5: 'sv',
    6: 'es',
    7: 'da',
    8: 'pt',
    9: 'no',
    10: 'he',
    11: 'ja',
    12: 'ar',
    13: 'fi',
    14: 'el',
    15: 'is',
    16: 'mt',
    17: 'tr',
    18: 'hr',
    19: 'zh-Hant',
    20: 'ur',
    21: 'hi',
    22: 'th',
    23: 'ko',
    24: 'lt',
    25: 'pl',
    26: 'hu',
    27: 'es',
    28: 'lv',
    29: 'se',
    30: 'fo',
    31: 'fa',
    32: 'ru',
    33: 'zh',
    34: 'nl-BE',
    35: 'ga',
    36: 'sq',
    37: 'ro',
    38: 'cz',
    39: 'sk',
    40: 'si',
    41: 'yi',
    42: 'sr',
    43: 'mk',
    44: 'bg',
    45: 'uk',
    46: 'be',
    47: 'uz',
    48: 'kk',
    49: 'az-Cyrl',
    50: 'az-Arab',
    51: 'hy',
    52: 'ka',
    53: 'mo',
    54: 'ky',
    55: 'tg',
    56: 'tk',
    57: 'mn-CN',
    58: 'mn',
    59: 'ps',
    60: 'ks',
    61: 'ku',
    62: 'sd',
    63: 'bo',
    64: 'ne',
    65: 'sa',
    66: 'mr',
    67: 'bn',
    68: 'as',
    69: 'gu',
    70: 'pa',
    71: 'or',
    72: 'ml',
    73: 'kn',
    74: 'ta',
    75: 'te',
    76: 'si',
    77: 'my',
    78: 'km',
    79: 'lo',
    80: 'vi',
    81: 'id',
    82: 'tl',
    83: 'ms',
    84: 'ms-Arab',
    85: 'am',
    86: 'ti',
    87: 'om',
    88: 'so',
    89: 'sw',
    90: 'rw',
    91: 'rn',
    92: 'ny',
    93: 'mg',
    94: 'eo',
    128: 'cy',
    129: 'eu',
    130: 'ca',
    131: 'la',
    132: 'qu',
    133: 'gn',
    134: 'ay',
    135: 'tt',
    136: 'ug',
    137: 'dz',
    138: 'jv',
    139: 'su',
    140: 'gl',
    141: 'af',
    142: 'br',
    143: 'iu',
    144: 'gd',
    145: 'gv',
    146: 'ga',
    147: 'to',
    148: 'el-polyton',
    149: 'kl',
    150: 'az',
    151: 'nn'
};

// MacOS language ID → MacOS script ID
//
// Note that the script ID is not sufficient to determine what encoding
// to use in TrueType files. For some languages, MacOS used a modification
// of a mainstream script. For example, an Icelandic name would be stored
// with smRoman in the TrueType naming table, but the actual encoding
// is a special Icelandic version of the normal Macintosh Roman encoding.
// As another example, Inuktitut uses an 8-bit encoding for Canadian Aboriginal
// Syllables but MacOS had run out of available script codes, so this was
// done as a (pretty radical) "modification" of Ethiopic.
//
// http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/Readme.txt
var macLanguageToScript = {
    0: 0,  // langEnglish → smRoman
    1: 0,  // langFrench → smRoman
    2: 0,  // langGerman → smRoman
    3: 0,  // langItalian → smRoman
    4: 0,  // langDutch → smRoman
    5: 0,  // langSwedish → smRoman
    6: 0,  // langSpanish → smRoman
    7: 0,  // langDanish → smRoman
    8: 0,  // langPortuguese → smRoman
    9: 0,  // langNorwegian → smRoman
    10: 5,  // langHebrew → smHebrew
    11: 1,  // langJapanese → smJapanese
    12: 4,  // langArabic → smArabic
    13: 0,  // langFinnish → smRoman
    14: 6,  // langGreek → smGreek
    15: 0,  // langIcelandic → smRoman (modified)
    16: 0,  // langMaltese → smRoman
    17: 0,  // langTurkish → smRoman (modified)
    18: 0,  // langCroatian → smRoman (modified)
    19: 2,  // langTradChinese → smTradChinese
    20: 4,  // langUrdu → smArabic
    21: 9,  // langHindi → smDevanagari
    22: 21,  // langThai → smThai
    23: 3,  // langKorean → smKorean
    24: 29,  // langLithuanian → smCentralEuroRoman
    25: 29,  // langPolish → smCentralEuroRoman
    26: 29,  // langHungarian → smCentralEuroRoman
    27: 29,  // langEstonian → smCentralEuroRoman
    28: 29,  // langLatvian → smCentralEuroRoman
    29: 0,  // langSami → smRoman
    30: 0,  // langFaroese → smRoman (modified)
    31: 4,  // langFarsi → smArabic (modified)
    32: 7,  // langRussian → smCyrillic
    33: 25,  // langSimpChinese → smSimpChinese
    34: 0,  // langFlemish → smRoman
    35: 0,  // langIrishGaelic → smRoman (modified)
    36: 0,  // langAlbanian → smRoman
    37: 0,  // langRomanian → smRoman (modified)
    38: 29,  // langCzech → smCentralEuroRoman
    39: 29,  // langSlovak → smCentralEuroRoman
    40: 0,  // langSlovenian → smRoman (modified)
    41: 5,  // langYiddish → smHebrew
    42: 7,  // langSerbian → smCyrillic
    43: 7,  // langMacedonian → smCyrillic
    44: 7,  // langBulgarian → smCyrillic
    45: 7,  // langUkrainian → smCyrillic (modified)
    46: 7,  // langByelorussian → smCyrillic
    47: 7,  // langUzbek → smCyrillic
    48: 7,  // langKazakh → smCyrillic
    49: 7,  // langAzerbaijani → smCyrillic
    50: 4,  // langAzerbaijanAr → smArabic
    51: 24,  // langArmenian → smArmenian
    52: 23,  // langGeorgian → smGeorgian
    53: 7,  // langMoldavian → smCyrillic
    54: 7,  // langKirghiz → smCyrillic
    55: 7,  // langTajiki → smCyrillic
    56: 7,  // langTurkmen → smCyrillic
    57: 27,  // langMongolian → smMongolian
    58: 7,  // langMongolianCyr → smCyrillic
    59: 4,  // langPashto → smArabic
    60: 4,  // langKurdish → smArabic
    61: 4,  // langKashmiri → smArabic
    62: 4,  // langSindhi → smArabic
    63: 26,  // langTibetan → smTibetan
    64: 9,  // langNepali → smDevanagari
    65: 9,  // langSanskrit → smDevanagari
    66: 9,  // langMarathi → smDevanagari
    67: 13,  // langBengali → smBengali
    68: 13,  // langAssamese → smBengali
    69: 11,  // langGujarati → smGujarati
    70: 10,  // langPunjabi → smGurmukhi
    71: 12,  // langOriya → smOriya
    72: 17,  // langMalayalam → smMalayalam
    73: 16,  // langKannada → smKannada
    74: 14,  // langTamil → smTamil
    75: 15,  // langTelugu → smTelugu
    76: 18,  // langSinhalese → smSinhalese
    77: 19,  // langBurmese → smBurmese
    78: 20,  // langKhmer → smKhmer
    79: 22,  // langLao → smLao
    80: 30,  // langVietnamese → smVietnamese
    81: 0,  // langIndonesian → smRoman
    82: 0,  // langTagalog → smRoman
    83: 0,  // langMalayRoman → smRoman
    84: 4,  // langMalayArabic → smArabic
    85: 28,  // langAmharic → smEthiopic
    86: 28,  // langTigrinya → smEthiopic
    87: 28,  // langOromo → smEthiopic
    88: 0,  // langSomali → smRoman
    89: 0,  // langSwahili → smRoman
    90: 0,  // langKinyarwanda → smRoman
    91: 0,  // langRundi → smRoman
    92: 0,  // langNyanja → smRoman
    93: 0,  // langMalagasy → smRoman
    94: 0,  // langEsperanto → smRoman
    128: 0,  // langWelsh → smRoman (modified)
    129: 0,  // langBasque → smRoman
    130: 0,  // langCatalan → smRoman
    131: 0,  // langLatin → smRoman
    132: 0,  // langQuechua → smRoman
    133: 0,  // langGuarani → smRoman
    134: 0,  // langAymara → smRoman
    135: 7,  // langTatar → smCyrillic
    136: 4,  // langUighur → smArabic
    137: 26,  // langDzongkha → smTibetan
    138: 0,  // langJavaneseRom → smRoman
    139: 0,  // langSundaneseRom → smRoman
    140: 0,  // langGalician → smRoman
    141: 0,  // langAfrikaans → smRoman
    142: 0,  // langBreton → smRoman (modified)
    143: 28,  // langInuktitut → smEthiopic (modified)
    144: 0,  // langScottishGaelic → smRoman (modified)
    145: 0,  // langManxGaelic → smRoman (modified)
    146: 0,  // langIrishGaelicScript → smRoman (modified)
    147: 0,  // langTongan → smRoman
    148: 6,  // langGreekAncient → smRoman
    149: 0,  // langGreenlandic → smRoman
    150: 0,  // langAzerbaijanRoman → smRoman
    151: 0   // langNynorsk → smRoman
};

// While Microsoft indicates a region/country for all its language
// IDs, we omit the region code if it's equal to the "most likely
// region subtag" according to Unicode CLDR. For scripts, we omit
// the subtag if it is equal to the Suppress-Script entry in the
// IANA language subtag registry for IETF BCP 47.
//
// For example, Microsoft states that its language code 0x041A is
// Croatian in Croatia. We transform this to the BCP 47 language code 'hr'
// and not 'hr-HR' because Croatia is the default country for Croatian,
// according to Unicode CLDR. As another example, Microsoft states
// that 0x101A is Croatian (Latin) in Bosnia-Herzegovina. We transform
// this to 'hr-BA' and not 'hr-Latn-BA' because Latin is the default script
// for the Croatian language, according to IANA.
//
// http://www.unicode.org/cldr/charts/latest/supplemental/likely_subtags.html
// http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
var windowsLanguages = {
    0x0436: 'af',
    0x041C: 'sq',
    0x0484: 'gsw',
    0x045E: 'am',
    0x1401: 'ar-DZ',
    0x3C01: 'ar-BH',
    0x0C01: 'ar',
    0x0801: 'ar-IQ',
    0x2C01: 'ar-JO',
    0x3401: 'ar-KW',
    0x3001: 'ar-LB',
    0x1001: 'ar-LY',
    0x1801: 'ary',
    0x2001: 'ar-OM',
    0x4001: 'ar-QA',
    0x0401: 'ar-SA',
    0x2801: 'ar-SY',
    0x1C01: 'aeb',
    0x3801: 'ar-AE',
    0x2401: 'ar-YE',
    0x042B: 'hy',
    0x044D: 'as',
    0x082C: 'az-Cyrl',
    0x042C: 'az',
    0x046D: 'ba',
    0x042D: 'eu',
    0x0423: 'be',
    0x0845: 'bn',
    0x0445: 'bn-IN',
    0x201A: 'bs-Cyrl',
    0x141A: 'bs',
    0x047E: 'br',
    0x0402: 'bg',
    0x0403: 'ca',
    0x0C04: 'zh-HK',
    0x1404: 'zh-MO',
    0x0804: 'zh',
    0x1004: 'zh-SG',
    0x0404: 'zh-TW',
    0x0483: 'co',
    0x041A: 'hr',
    0x101A: 'hr-BA',
    0x0405: 'cs',
    0x0406: 'da',
    0x048C: 'prs',
    0x0465: 'dv',
    0x0813: 'nl-BE',
    0x0413: 'nl',
    0x0C09: 'en-AU',
    0x2809: 'en-BZ',
    0x1009: 'en-CA',
    0x2409: 'en-029',
    0x4009: 'en-IN',
    0x1809: 'en-IE',
    0x2009: 'en-JM',
    0x4409: 'en-MY',
    0x1409: 'en-NZ',
    0x3409: 'en-PH',
    0x4809: 'en-SG',
    0x1C09: 'en-ZA',
    0x2C09: 'en-TT',
    0x0809: 'en-GB',
    0x0409: 'en',
    0x3009: 'en-ZW',
    0x0425: 'et',
    0x0438: 'fo',
    0x0464: 'fil',
    0x040B: 'fi',
    0x080C: 'fr-BE',
    0x0C0C: 'fr-CA',
    0x040C: 'fr',
    0x140C: 'fr-LU',
    0x180C: 'fr-MC',
    0x100C: 'fr-CH',
    0x0462: 'fy',
    0x0456: 'gl',
    0x0437: 'ka',
    0x0C07: 'de-AT',
    0x0407: 'de',
    0x1407: 'de-LI',
    0x1007: 'de-LU',
    0x0807: 'de-CH',
    0x0408: 'el',
    0x046F: 'kl',
    0x0447: 'gu',
    0x0468: 'ha',
    0x040D: 'he',
    0x0439: 'hi',
    0x040E: 'hu',
    0x040F: 'is',
    0x0470: 'ig',
    0x0421: 'id',
    0x045D: 'iu',
    0x085D: 'iu-Latn',
    0x083C: 'ga',
    0x0434: 'xh',
    0x0435: 'zu',
    0x0410: 'it',
    0x0810: 'it-CH',
    0x0411: 'ja',
    0x044B: 'kn',
    0x043F: 'kk',
    0x0453: 'km',
    0x0486: 'quc',
    0x0487: 'rw',
    0x0441: 'sw',
    0x0457: 'kok',
    0x0412: 'ko',
    0x0440: 'ky',
    0x0454: 'lo',
    0x0426: 'lv',
    0x0427: 'lt',
    0x082E: 'dsb',
    0x046E: 'lb',
    0x042F: 'mk',
    0x083E: 'ms-BN',
    0x043E: 'ms',
    0x044C: 'ml',
    0x043A: 'mt',
    0x0481: 'mi',
    0x047A: 'arn',
    0x044E: 'mr',
    0x047C: 'moh',
    0x0450: 'mn',
    0x0850: 'mn-CN',
    0x0461: 'ne',
    0x0414: 'nb',
    0x0814: 'nn',
    0x0482: 'oc',
    0x0448: 'or',
    0x0463: 'ps',
    0x0415: 'pl',
    0x0416: 'pt',
    0x0816: 'pt-PT',
    0x0446: 'pa',
    0x046B: 'qu-BO',
    0x086B: 'qu-EC',
    0x0C6B: 'qu',
    0x0418: 'ro',
    0x0417: 'rm',
    0x0419: 'ru',
    0x243B: 'smn',
    0x103B: 'smj-NO',
    0x143B: 'smj',
    0x0C3B: 'se-FI',
    0x043B: 'se',
    0x083B: 'se-SE',
    0x203B: 'sms',
    0x183B: 'sma-NO',
    0x1C3B: 'sms',
    0x044F: 'sa',
    0x1C1A: 'sr-Cyrl-BA',
    0x0C1A: 'sr',
    0x181A: 'sr-Latn-BA',
    0x081A: 'sr-Latn',
    0x046C: 'nso',
    0x0432: 'tn',
    0x045B: 'si',
    0x041B: 'sk',
    0x0424: 'sl',
    0x2C0A: 'es-AR',
    0x400A: 'es-BO',
    0x340A: 'es-CL',
    0x240A: 'es-CO',
    0x140A: 'es-CR',
    0x1C0A: 'es-DO',
    0x300A: 'es-EC',
    0x440A: 'es-SV',
    0x100A: 'es-GT',
    0x480A: 'es-HN',
    0x080A: 'es-MX',
    0x4C0A: 'es-NI',
    0x180A: 'es-PA',
    0x3C0A: 'es-PY',
    0x280A: 'es-PE',
    0x500A: 'es-PR',

    // Microsoft has defined two different language codes for
    // “Spanish with modern sorting” and “Spanish with traditional
    // sorting”. This makes sense for collation APIs, and it would be
    // possible to express this in BCP 47 language tags via Unicode
    // extensions (eg., es-u-co-trad is Spanish with traditional
    // sorting). However, for storing names in fonts, the distinction
    // does not make sense, so we give “es” in both cases.
    0x0C0A: 'es',
    0x040A: 'es',

    0x540A: 'es-US',
    0x380A: 'es-UY',
    0x200A: 'es-VE',
    0x081D: 'sv-FI',
    0x041D: 'sv',
    0x045A: 'syr',
    0x0428: 'tg',
    0x085F: 'tzm',
    0x0449: 'ta',
    0x0444: 'tt',
    0x044A: 'te',
    0x041E: 'th',
    0x0451: 'bo',
    0x041F: 'tr',
    0x0442: 'tk',
    0x0480: 'ug',
    0x0422: 'uk',
    0x042E: 'hsb',
    0x0420: 'ur',
    0x0843: 'uz-Cyrl',
    0x0443: 'uz',
    0x042A: 'vi',
    0x0452: 'cy',
    0x0488: 'wo',
    0x0485: 'sah',
    0x0478: 'ii',
    0x046A: 'yo'
};

// Returns a IETF BCP 47 language code, for example 'zh-Hant'
// for 'Chinese in the traditional script'.
function getLanguageCode(platformID, languageID, ltag) {
    switch (platformID) {
        case 0:  // Unicode
            if (languageID === 0xFFFF) {
                return 'und';
            } else if (ltag) {
                return ltag[languageID];
            }

            break;

        case 1:  // Macintosh
            return macLanguages[languageID];

        case 3:  // Windows
            return windowsLanguages[languageID];
    }

    return undefined;
}

var utf16 = 'utf-16';

// MacOS script ID → encoding. This table stores the default case,
// which can be overridden by macLanguageEncodings.
var macScriptEncodings = {
    0: 'macintosh',           // smRoman
    1: 'x-mac-japanese',      // smJapanese
    2: 'x-mac-chinesetrad',   // smTradChinese
    3: 'x-mac-korean',        // smKorean
    6: 'x-mac-greek',         // smGreek
    7: 'x-mac-cyrillic',      // smCyrillic
    9: 'x-mac-devanagai',     // smDevanagari
    10: 'x-mac-gurmukhi',     // smGurmukhi
    11: 'x-mac-gujarati',     // smGujarati
    12: 'x-mac-oriya',        // smOriya
    13: 'x-mac-bengali',      // smBengali
    14: 'x-mac-tamil',        // smTamil
    15: 'x-mac-telugu',       // smTelugu
    16: 'x-mac-kannada',      // smKannada
    17: 'x-mac-malayalam',    // smMalayalam
    18: 'x-mac-sinhalese',    // smSinhalese
    19: 'x-mac-burmese',      // smBurmese
    20: 'x-mac-khmer',        // smKhmer
    21: 'x-mac-thai',         // smThai
    22: 'x-mac-lao',          // smLao
    23: 'x-mac-georgian',     // smGeorgian
    24: 'x-mac-armenian',     // smArmenian
    25: 'x-mac-chinesesimp',  // smSimpChinese
    26: 'x-mac-tibetan',      // smTibetan
    27: 'x-mac-mongolian',    // smMongolian
    28: 'x-mac-ethiopic',     // smEthiopic
    29: 'x-mac-ce',           // smCentralEuroRoman
    30: 'x-mac-vietnamese',   // smVietnamese
    31: 'x-mac-extarabic'     // smExtArabic
};

// MacOS language ID → encoding. This table stores the exceptional
// cases, which override macScriptEncodings. For writing MacOS naming
// tables, we need to emit a MacOS script ID. Therefore, we cannot
// merge macScriptEncodings into macLanguageEncodings.
//
// http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/Readme.txt
var macLanguageEncodings = {
    15: 'x-mac-icelandic',    // langIcelandic
    17: 'x-mac-turkish',      // langTurkish
    18: 'x-mac-croatian',     // langCroatian
    24: 'x-mac-ce',           // langLithuanian
    25: 'x-mac-ce',           // langPolish
    26: 'x-mac-ce',           // langHungarian
    27: 'x-mac-ce',           // langEstonian
    28: 'x-mac-ce',           // langLatvian
    30: 'x-mac-icelandic',    // langFaroese
    37: 'x-mac-romanian',     // langRomanian
    38: 'x-mac-ce',           // langCzech
    39: 'x-mac-ce',           // langSlovak
    40: 'x-mac-ce',           // langSlovenian
    143: 'x-mac-inuit',       // langInuktitut
    146: 'x-mac-gaelic'       // langIrishGaelicScript
};

function getEncoding(platformID, encodingID, languageID) {
    switch (platformID) {
        case 0:  // Unicode
            return utf16;

        case 1:  // Apple Macintosh
            return macLanguageEncodings[languageID] || macScriptEncodings[encodingID];

        case 3:  // Microsoft Windows
            if (encodingID === 1 || encodingID === 10) {
                return utf16;
            }

            break;
    }

    return undefined;
}

// Parse the naming `name` table.
// FIXME: Format 1 additional fields are not supported yet.
// ltag is the content of the `ltag' table, such as ['en', 'zh-Hans', 'de-CH-1904'].
function parseNameTable(data, start, ltag) {
    var name = {};
    var p = new parse.Parser(data, start);
    var format = p.parseUShort();
    var count = p.parseUShort();
    var stringOffset = p.offset + p.parseUShort();
    for (var i = 0; i < count; i++) {
        var platformID = p.parseUShort();
        var encodingID = p.parseUShort();
        var languageID = p.parseUShort();
        var nameID = p.parseUShort();
        var property = nameTableNames[nameID] || nameID;
        var byteLength = p.parseUShort();
        var offset = p.parseUShort();
        var language = getLanguageCode(platformID, languageID, ltag);
        var encoding = getEncoding(platformID, encodingID, languageID);
        if (encoding !== undefined && language !== undefined) {
            var text;
            if (encoding === utf16) {
                text = decode.UTF16(data, stringOffset + offset, byteLength);
            } else {
                text = decode.MACSTRING(data, stringOffset + offset, byteLength, encoding);
            }

            if (text) {
                var translations = name[property];
                if (translations === undefined) {
                    translations = name[property] = {};
                }

                translations[language] = text;
            }
        }
    }

    var langTagCount = 0;
    if (format === 1) {
        // FIXME: Also handle Microsoft's 'name' table 1.
        langTagCount = p.parseUShort();
    }

    return name;
}

// {23: 'foo'} → {'foo': 23}
// ['bar', 'baz'] → {'bar': 0, 'baz': 1}
function reverseDict(dict) {
    var result = {};
    for (var key in dict) {
        result[dict[key]] = parseInt(key);
    }

    return result;
}

function makeNameRecord(platformID, encodingID, languageID, nameID, length, offset) {
    return new table.Record('NameRecord', [
        {name: 'platformID', type: 'USHORT', value: platformID},
        {name: 'encodingID', type: 'USHORT', value: encodingID},
        {name: 'languageID', type: 'USHORT', value: languageID},
        {name: 'nameID', type: 'USHORT', value: nameID},
        {name: 'length', type: 'USHORT', value: length},
        {name: 'offset', type: 'USHORT', value: offset}
    ]);
}

// Finds the position of needle in haystack, or -1 if not there.
// Like String.indexOf(), but for arrays.
function findSubArray(needle, haystack) {
    var needleLength = needle.length;
    var limit = haystack.length - needleLength + 1;

    loop:
    for (var pos = 0; pos < limit; pos++) {
        for (; pos < limit; pos++) {
            for (var k = 0; k < needleLength; k++) {
                if (haystack[pos + k] !== needle[k]) {
                    continue loop;
                }
            }

            return pos;
        }
    }

    return -1;
}

function addStringToPool(s, pool) {
    var offset = findSubArray(s, pool);
    if (offset < 0) {
        offset = pool.length;
        for (var i = 0, len = s.length; i < len; ++i) {
            pool.push(s[i]);
        }

    }

    return offset;
}

function makeNameTable(names, ltag) {
    var nameID;
    var nameIDs = [];

    var namesWithNumericKeys = {};
    var nameTableIds = reverseDict(nameTableNames);
    for (var key in names) {
        var id = nameTableIds[key];
        if (id === undefined) {
            id = key;
        }

        nameID = parseInt(id);
        namesWithNumericKeys[nameID] = names[key];
        nameIDs.push(nameID);
    }

    var macLanguageIds = reverseDict(macLanguages);
    var windowsLanguageIds = reverseDict(windowsLanguages);

    var nameRecords = [];
    var stringPool = [];

    for (var i = 0; i < nameIDs.length; i++) {
        nameID = nameIDs[i];
        var translations = namesWithNumericKeys[nameID];
        for (var lang in translations) {
            var text = translations[lang];

            // For MacOS, we try to emit the name in the form that was introduced
            // in the initial version of the TrueType spec (in the late 1980s).
            // However, this can fail for various reasons: the requested BCP 47
            // language code might not have an old-style Mac equivalent;
            // we might not have a codec for the needed character encoding;
            // or the name might contain characters that cannot be expressed
            // in the old-style Macintosh encoding. In case of failure, we emit
            // the name in a more modern fashion (Unicode encoding with BCP 47
            // language tags) that is recognized by MacOS 10.5, released in 2009.
            // If fonts were only read by operating systems, we could simply
            // emit all names in the modern form; this would be much easier.
            // However, there are many applications and libraries that read
            // 'name' tables directly, and these will usually only recognize
            // the ancient form (silently skipping the unrecognized names).
            var macPlatform = 1;  // Macintosh
            var macLanguage = macLanguageIds[lang];
            var macScript = macLanguageToScript[macLanguage];
            var macEncoding = getEncoding(macPlatform, macScript, macLanguage);
            var macName = encode.MACSTRING(text, macEncoding);
            if (macName === undefined) {
                macPlatform = 0;  // Unicode
                macLanguage = ltag.indexOf(lang);
                if (macLanguage < 0) {
                    macLanguage = ltag.length;
                    ltag.push(lang);
                }

                macScript = 4;  // Unicode 2.0 and later
                macName = encode.UTF16(text);
            }

            var macNameOffset = addStringToPool(macName, stringPool);
            nameRecords.push(makeNameRecord(macPlatform, macScript, macLanguage,
                                            nameID, macName.length, macNameOffset));

            var winLanguage = windowsLanguageIds[lang];
            if (winLanguage !== undefined) {
                var winName = encode.UTF16(text);
                var winNameOffset = addStringToPool(winName, stringPool);
                nameRecords.push(makeNameRecord(3, 1, winLanguage,
                                                nameID, winName.length, winNameOffset));
            }
        }
    }

    nameRecords.sort(function(a, b) {
        return ((a.platformID - b.platformID) ||
                (a.encodingID - b.encodingID) ||
                (a.languageID - b.languageID) ||
                (a.nameID - b.nameID));
    });

    var t = new table.Table('name', [
        {name: 'format', type: 'USHORT', value: 0},
        {name: 'count', type: 'USHORT', value: nameRecords.length},
        {name: 'stringOffset', type: 'USHORT', value: 6 + nameRecords.length * 12}
    ]);

    for (var r = 0; r < nameRecords.length; r++) {
        t.fields.push({name: 'record_' + r, type: 'RECORD', value: nameRecords[r]});
    }

    t.fields.push({name: 'strings', type: 'LITERAL', value: stringPool});
    return t;
}

exports.parse = parseNameTable;
exports.make = makeNameTable;

},{"../parse":15,"../table":17,"../types":34}],31:[function(require,module,exports){
// The `OS/2` table contains metrics required in OpenType fonts.
// https://www.microsoft.com/typography/OTSPEC/os2.htm

'use strict';

var parse = require('../parse');
var table = require('../table');

var unicodeRanges = [
    {begin: 0x0000, end: 0x007F}, // Basic Latin
    {begin: 0x0080, end: 0x00FF}, // Latin-1 Supplement
    {begin: 0x0100, end: 0x017F}, // Latin Extended-A
    {begin: 0x0180, end: 0x024F}, // Latin Extended-B
    {begin: 0x0250, end: 0x02AF}, // IPA Extensions
    {begin: 0x02B0, end: 0x02FF}, // Spacing Modifier Letters
    {begin: 0x0300, end: 0x036F}, // Combining Diacritical Marks
    {begin: 0x0370, end: 0x03FF}, // Greek and Coptic
    {begin: 0x2C80, end: 0x2CFF}, // Coptic
    {begin: 0x0400, end: 0x04FF}, // Cyrillic
    {begin: 0x0530, end: 0x058F}, // Armenian
    {begin: 0x0590, end: 0x05FF}, // Hebrew
    {begin: 0xA500, end: 0xA63F}, // Vai
    {begin: 0x0600, end: 0x06FF}, // Arabic
    {begin: 0x07C0, end: 0x07FF}, // NKo
    {begin: 0x0900, end: 0x097F}, // Devanagari
    {begin: 0x0980, end: 0x09FF}, // Bengali
    {begin: 0x0A00, end: 0x0A7F}, // Gurmukhi
    {begin: 0x0A80, end: 0x0AFF}, // Gujarati
    {begin: 0x0B00, end: 0x0B7F}, // Oriya
    {begin: 0x0B80, end: 0x0BFF}, // Tamil
    {begin: 0x0C00, end: 0x0C7F}, // Telugu
    {begin: 0x0C80, end: 0x0CFF}, // Kannada
    {begin: 0x0D00, end: 0x0D7F}, // Malayalam
    {begin: 0x0E00, end: 0x0E7F}, // Thai
    {begin: 0x0E80, end: 0x0EFF}, // Lao
    {begin: 0x10A0, end: 0x10FF}, // Georgian
    {begin: 0x1B00, end: 0x1B7F}, // Balinese
    {begin: 0x1100, end: 0x11FF}, // Hangul Jamo
    {begin: 0x1E00, end: 0x1EFF}, // Latin Extended Additional
    {begin: 0x1F00, end: 0x1FFF}, // Greek Extended
    {begin: 0x2000, end: 0x206F}, // General Punctuation
    {begin: 0x2070, end: 0x209F}, // Superscripts And Subscripts
    {begin: 0x20A0, end: 0x20CF}, // Currency Symbol
    {begin: 0x20D0, end: 0x20FF}, // Combining Diacritical Marks For Symbols
    {begin: 0x2100, end: 0x214F}, // Letterlike Symbols
    {begin: 0x2150, end: 0x218F}, // Number Forms
    {begin: 0x2190, end: 0x21FF}, // Arrows
    {begin: 0x2200, end: 0x22FF}, // Mathematical Operators
    {begin: 0x2300, end: 0x23FF}, // Miscellaneous Technical
    {begin: 0x2400, end: 0x243F}, // Control Pictures
    {begin: 0x2440, end: 0x245F}, // Optical Character Recognition
    {begin: 0x2460, end: 0x24FF}, // Enclosed Alphanumerics
    {begin: 0x2500, end: 0x257F}, // Box Drawing
    {begin: 0x2580, end: 0x259F}, // Block Elements
    {begin: 0x25A0, end: 0x25FF}, // Geometric Shapes
    {begin: 0x2600, end: 0x26FF}, // Miscellaneous Symbols
    {begin: 0x2700, end: 0x27BF}, // Dingbats
    {begin: 0x3000, end: 0x303F}, // CJK Symbols And Punctuation
    {begin: 0x3040, end: 0x309F}, // Hiragana
    {begin: 0x30A0, end: 0x30FF}, // Katakana
    {begin: 0x3100, end: 0x312F}, // Bopomofo
    {begin: 0x3130, end: 0x318F}, // Hangul Compatibility Jamo
    {begin: 0xA840, end: 0xA87F}, // Phags-pa
    {begin: 0x3200, end: 0x32FF}, // Enclosed CJK Letters And Months
    {begin: 0x3300, end: 0x33FF}, // CJK Compatibility
    {begin: 0xAC00, end: 0xD7AF}, // Hangul Syllables
    {begin: 0xD800, end: 0xDFFF}, // Non-Plane 0 *
    {begin: 0x10900, end: 0x1091F}, // Phoenicia
    {begin: 0x4E00, end: 0x9FFF}, // CJK Unified Ideographs
    {begin: 0xE000, end: 0xF8FF}, // Private Use Area (plane 0)
    {begin: 0x31C0, end: 0x31EF}, // CJK Strokes
    {begin: 0xFB00, end: 0xFB4F}, // Alphabetic Presentation Forms
    {begin: 0xFB50, end: 0xFDFF}, // Arabic Presentation Forms-A
    {begin: 0xFE20, end: 0xFE2F}, // Combining Half Marks
    {begin: 0xFE10, end: 0xFE1F}, // Vertical Forms
    {begin: 0xFE50, end: 0xFE6F}, // Small Form Variants
    {begin: 0xFE70, end: 0xFEFF}, // Arabic Presentation Forms-B
    {begin: 0xFF00, end: 0xFFEF}, // Halfwidth And Fullwidth Forms
    {begin: 0xFFF0, end: 0xFFFF}, // Specials
    {begin: 0x0F00, end: 0x0FFF}, // Tibetan
    {begin: 0x0700, end: 0x074F}, // Syriac
    {begin: 0x0780, end: 0x07BF}, // Thaana
    {begin: 0x0D80, end: 0x0DFF}, // Sinhala
    {begin: 0x1000, end: 0x109F}, // Myanmar
    {begin: 0x1200, end: 0x137F}, // Ethiopic
    {begin: 0x13A0, end: 0x13FF}, // Cherokee
    {begin: 0x1400, end: 0x167F}, // Unified Canadian Aboriginal Syllabics
    {begin: 0x1680, end: 0x169F}, // Ogham
    {begin: 0x16A0, end: 0x16FF}, // Runic
    {begin: 0x1780, end: 0x17FF}, // Khmer
    {begin: 0x1800, end: 0x18AF}, // Mongolian
    {begin: 0x2800, end: 0x28FF}, // Braille Patterns
    {begin: 0xA000, end: 0xA48F}, // Yi Syllables
    {begin: 0x1700, end: 0x171F}, // Tagalog
    {begin: 0x10300, end: 0x1032F}, // Old Italic
    {begin: 0x10330, end: 0x1034F}, // Gothic
    {begin: 0x10400, end: 0x1044F}, // Deseret
    {begin: 0x1D000, end: 0x1D0FF}, // Byzantine Musical Symbols
    {begin: 0x1D400, end: 0x1D7FF}, // Mathematical Alphanumeric Symbols
    {begin: 0xFF000, end: 0xFFFFD}, // Private Use (plane 15)
    {begin: 0xFE00, end: 0xFE0F}, // Variation Selectors
    {begin: 0xE0000, end: 0xE007F}, // Tags
    {begin: 0x1900, end: 0x194F}, // Limbu
    {begin: 0x1950, end: 0x197F}, // Tai Le
    {begin: 0x1980, end: 0x19DF}, // New Tai Lue
    {begin: 0x1A00, end: 0x1A1F}, // Buginese
    {begin: 0x2C00, end: 0x2C5F}, // Glagolitic
    {begin: 0x2D30, end: 0x2D7F}, // Tifinagh
    {begin: 0x4DC0, end: 0x4DFF}, // Yijing Hexagram Symbols
    {begin: 0xA800, end: 0xA82F}, // Syloti Nagri
    {begin: 0x10000, end: 0x1007F}, // Linear B Syllabary
    {begin: 0x10140, end: 0x1018F}, // Ancient Greek Numbers
    {begin: 0x10380, end: 0x1039F}, // Ugaritic
    {begin: 0x103A0, end: 0x103DF}, // Old Persian
    {begin: 0x10450, end: 0x1047F}, // Shavian
    {begin: 0x10480, end: 0x104AF}, // Osmanya
    {begin: 0x10800, end: 0x1083F}, // Cypriot Syllabary
    {begin: 0x10A00, end: 0x10A5F}, // Kharoshthi
    {begin: 0x1D300, end: 0x1D35F}, // Tai Xuan Jing Symbols
    {begin: 0x12000, end: 0x123FF}, // Cuneiform
    {begin: 0x1D360, end: 0x1D37F}, // Counting Rod Numerals
    {begin: 0x1B80, end: 0x1BBF}, // Sundanese
    {begin: 0x1C00, end: 0x1C4F}, // Lepcha
    {begin: 0x1C50, end: 0x1C7F}, // Ol Chiki
    {begin: 0xA880, end: 0xA8DF}, // Saurashtra
    {begin: 0xA900, end: 0xA92F}, // Kayah Li
    {begin: 0xA930, end: 0xA95F}, // Rejang
    {begin: 0xAA00, end: 0xAA5F}, // Cham
    {begin: 0x10190, end: 0x101CF}, // Ancient Symbols
    {begin: 0x101D0, end: 0x101FF}, // Phaistos Disc
    {begin: 0x102A0, end: 0x102DF}, // Carian
    {begin: 0x1F030, end: 0x1F09F}  // Domino Tiles
];

function getUnicodeRange(unicode) {
    for (var i = 0; i < unicodeRanges.length; i += 1) {
        var range = unicodeRanges[i];
        if (unicode >= range.begin && unicode < range.end) {
            return i;
        }
    }

    return -1;
}

// Parse the OS/2 and Windows metrics `OS/2` table
function parseOS2Table(data, start) {
    var os2 = {};
    var p = new parse.Parser(data, start);
    os2.version = p.parseUShort();
    os2.xAvgCharWidth = p.parseShort();
    os2.usWeightClass = p.parseUShort();
    os2.usWidthClass = p.parseUShort();
    os2.fsType = p.parseUShort();
    os2.ySubscriptXSize = p.parseShort();
    os2.ySubscriptYSize = p.parseShort();
    os2.ySubscriptXOffset = p.parseShort();
    os2.ySubscriptYOffset = p.parseShort();
    os2.ySuperscriptXSize = p.parseShort();
    os2.ySuperscriptYSize = p.parseShort();
    os2.ySuperscriptXOffset = p.parseShort();
    os2.ySuperscriptYOffset = p.parseShort();
    os2.yStrikeoutSize = p.parseShort();
    os2.yStrikeoutPosition = p.parseShort();
    os2.sFamilyClass = p.parseShort();
    os2.panose = [];
    for (var i = 0; i < 10; i++) {
        os2.panose[i] = p.parseByte();
    }

    os2.ulUnicodeRange1 = p.parseULong();
    os2.ulUnicodeRange2 = p.parseULong();
    os2.ulUnicodeRange3 = p.parseULong();
    os2.ulUnicodeRange4 = p.parseULong();
    os2.achVendID = String.fromCharCode(p.parseByte(), p.parseByte(), p.parseByte(), p.parseByte());
    os2.fsSelection = p.parseUShort();
    os2.usFirstCharIndex = p.parseUShort();
    os2.usLastCharIndex = p.parseUShort();
    os2.sTypoAscender = p.parseShort();
    os2.sTypoDescender = p.parseShort();
    os2.sTypoLineGap = p.parseShort();
    os2.usWinAscent = p.parseUShort();
    os2.usWinDescent = p.parseUShort();
    if (os2.version >= 1) {
        os2.ulCodePageRange1 = p.parseULong();
        os2.ulCodePageRange2 = p.parseULong();
    }

    if (os2.version >= 2) {
        os2.sxHeight = p.parseShort();
        os2.sCapHeight = p.parseShort();
        os2.usDefaultChar = p.parseUShort();
        os2.usBreakChar = p.parseUShort();
        os2.usMaxContent = p.parseUShort();
    }

    return os2;
}

function makeOS2Table(options) {
    return new table.Table('OS/2', [
        {name: 'version', type: 'USHORT', value: 0x0003},
        {name: 'xAvgCharWidth', type: 'SHORT', value: 0},
        {name: 'usWeightClass', type: 'USHORT', value: 0},
        {name: 'usWidthClass', type: 'USHORT', value: 0},
        {name: 'fsType', type: 'USHORT', value: 0},
        {name: 'ySubscriptXSize', type: 'SHORT', value: 650},
        {name: 'ySubscriptYSize', type: 'SHORT', value: 699},
        {name: 'ySubscriptXOffset', type: 'SHORT', value: 0},
        {name: 'ySubscriptYOffset', type: 'SHORT', value: 140},
        {name: 'ySuperscriptXSize', type: 'SHORT', value: 650},
        {name: 'ySuperscriptYSize', type: 'SHORT', value: 699},
        {name: 'ySuperscriptXOffset', type: 'SHORT', value: 0},
        {name: 'ySuperscriptYOffset', type: 'SHORT', value: 479},
        {name: 'yStrikeoutSize', type: 'SHORT', value: 49},
        {name: 'yStrikeoutPosition', type: 'SHORT', value: 258},
        {name: 'sFamilyClass', type: 'SHORT', value: 0},
        {name: 'bFamilyType', type: 'BYTE', value: 0},
        {name: 'bSerifStyle', type: 'BYTE', value: 0},
        {name: 'bWeight', type: 'BYTE', value: 0},
        {name: 'bProportion', type: 'BYTE', value: 0},
        {name: 'bContrast', type: 'BYTE', value: 0},
        {name: 'bStrokeVariation', type: 'BYTE', value: 0},
        {name: 'bArmStyle', type: 'BYTE', value: 0},
        {name: 'bLetterform', type: 'BYTE', value: 0},
        {name: 'bMidline', type: 'BYTE', value: 0},
        {name: 'bXHeight', type: 'BYTE', value: 0},
        {name: 'ulUnicodeRange1', type: 'ULONG', value: 0},
        {name: 'ulUnicodeRange2', type: 'ULONG', value: 0},
        {name: 'ulUnicodeRange3', type: 'ULONG', value: 0},
        {name: 'ulUnicodeRange4', type: 'ULONG', value: 0},
        {name: 'achVendID', type: 'CHARARRAY', value: 'XXXX'},
        {name: 'fsSelection', type: 'USHORT', value: 0},
        {name: 'usFirstCharIndex', type: 'USHORT', value: 0},
        {name: 'usLastCharIndex', type: 'USHORT', value: 0},
        {name: 'sTypoAscender', type: 'SHORT', value: 0},
        {name: 'sTypoDescender', type: 'SHORT', value: 0},
        {name: 'sTypoLineGap', type: 'SHORT', value: 0},
        {name: 'usWinAscent', type: 'USHORT', value: 0},
        {name: 'usWinDescent', type: 'USHORT', value: 0},
        {name: 'ulCodePageRange1', type: 'ULONG', value: 0},
        {name: 'ulCodePageRange2', type: 'ULONG', value: 0},
        {name: 'sxHeight', type: 'SHORT', value: 0},
        {name: 'sCapHeight', type: 'SHORT', value: 0},
        {name: 'usDefaultChar', type: 'USHORT', value: 0},
        {name: 'usBreakChar', type: 'USHORT', value: 0},
        {name: 'usMaxContext', type: 'USHORT', value: 0}
    ], options);
}

exports.unicodeRanges = unicodeRanges;
exports.getUnicodeRange = getUnicodeRange;
exports.parse = parseOS2Table;
exports.make = makeOS2Table;

},{"../parse":15,"../table":17}],32:[function(require,module,exports){
// The `post` table stores additional PostScript information, such as glyph names.
// https://www.microsoft.com/typography/OTSPEC/post.htm

'use strict';

var encoding = require('../encoding');
var parse = require('../parse');
var table = require('../table');

// Parse the PostScript `post` table
function parsePostTable(data, start) {
    var post = {};
    var p = new parse.Parser(data, start);
    var i;
    post.version = p.parseVersion();
    post.italicAngle = p.parseFixed();
    post.underlinePosition = p.parseShort();
    post.underlineThickness = p.parseShort();
    post.isFixedPitch = p.parseULong();
    post.minMemType42 = p.parseULong();
    post.maxMemType42 = p.parseULong();
    post.minMemType1 = p.parseULong();
    post.maxMemType1 = p.parseULong();
    switch (post.version) {
        case 1:
            post.names = encoding.standardNames.slice();
            break;
        case 2:
            post.numberOfGlyphs = p.parseUShort();
            post.glyphNameIndex = new Array(post.numberOfGlyphs);
            for (i = 0; i < post.numberOfGlyphs; i++) {
                post.glyphNameIndex[i] = p.parseUShort();
            }

            post.names = [];
            for (i = 0; i < post.numberOfGlyphs; i++) {
                if (post.glyphNameIndex[i] >= encoding.standardNames.length) {
                    var nameLength = p.parseChar();
                    post.names.push(p.parseString(nameLength));
                }
            }

            break;
        case 2.5:
            post.numberOfGlyphs = p.parseUShort();
            post.offset = new Array(post.numberOfGlyphs);
            for (i = 0; i < post.numberOfGlyphs; i++) {
                post.offset[i] = p.parseChar();
            }

            break;
    }
    return post;
}

function makePostTable() {
    return new table.Table('post', [
        {name: 'version', type: 'FIXED', value: 0x00030000},
        {name: 'italicAngle', type: 'FIXED', value: 0},
        {name: 'underlinePosition', type: 'FWORD', value: 0},
        {name: 'underlineThickness', type: 'FWORD', value: 0},
        {name: 'isFixedPitch', type: 'ULONG', value: 0},
        {name: 'minMemType42', type: 'ULONG', value: 0},
        {name: 'maxMemType42', type: 'ULONG', value: 0},
        {name: 'minMemType1', type: 'ULONG', value: 0},
        {name: 'maxMemType1', type: 'ULONG', value: 0}
    ]);
}

exports.parse = parsePostTable;
exports.make = makePostTable;

},{"../encoding":10,"../parse":15,"../table":17}],33:[function(require,module,exports){
// The `sfnt` wrapper provides organization for the tables in the font.
// It is the top-level data structure in a font.
// https://www.microsoft.com/typography/OTSPEC/otff.htm
// Recommendations for creating OpenType Fonts:
// http://www.microsoft.com/typography/otspec140/recom.htm

'use strict';

var check = require('../check');
var table = require('../table');

var cmap = require('./cmap');
var cff = require('./cff');
var head = require('./head');
var hhea = require('./hhea');
var hmtx = require('./hmtx');
var ltag = require('./ltag');
var maxp = require('./maxp');
var _name = require('./name');
var os2 = require('./os2');
var post = require('./post');

function log2(v) {
    return Math.log(v) / Math.log(2) | 0;
}

function computeCheckSum(bytes) {
    while (bytes.length % 4 !== 0) {
        bytes.push(0);
    }

    var sum = 0;
    for (var i = 0; i < bytes.length; i += 4) {
        sum += (bytes[i] << 24) +
            (bytes[i + 1] << 16) +
            (bytes[i + 2] << 8) +
            (bytes[i + 3]);
    }

    sum %= Math.pow(2, 32);
    return sum;
}

function makeTableRecord(tag, checkSum, offset, length) {
    return new table.Record('Table Record', [
        {name: 'tag', type: 'TAG', value: tag !== undefined ? tag : ''},
        {name: 'checkSum', type: 'ULONG', value: checkSum !== undefined ? checkSum : 0},
        {name: 'offset', type: 'ULONG', value: offset !== undefined ? offset : 0},
        {name: 'length', type: 'ULONG', value: length !== undefined ? length : 0}
    ]);
}

function makeSfntTable(tables) {
    var sfnt = new table.Table('sfnt', [
        {name: 'version', type: 'TAG', value: 'OTTO'},
        {name: 'numTables', type: 'USHORT', value: 0},
        {name: 'searchRange', type: 'USHORT', value: 0},
        {name: 'entrySelector', type: 'USHORT', value: 0},
        {name: 'rangeShift', type: 'USHORT', value: 0}
    ]);
    sfnt.tables = tables;
    sfnt.numTables = tables.length;
    var highestPowerOf2 = Math.pow(2, log2(sfnt.numTables));
    sfnt.searchRange = 16 * highestPowerOf2;
    sfnt.entrySelector = log2(highestPowerOf2);
    sfnt.rangeShift = sfnt.numTables * 16 - sfnt.searchRange;

    var recordFields = [];
    var tableFields = [];

    var offset = sfnt.sizeOf() + (makeTableRecord().sizeOf() * sfnt.numTables);
    while (offset % 4 !== 0) {
        offset += 1;
        tableFields.push({name: 'padding', type: 'BYTE', value: 0});
    }

    for (var i = 0; i < tables.length; i += 1) {
        var t = tables[i];
        check.argument(t.tableName.length === 4, 'Table name' + t.tableName + ' is invalid.');
        var tableLength = t.sizeOf();
        var tableRecord = makeTableRecord(t.tableName, computeCheckSum(t.encode()), offset, tableLength);
        recordFields.push({name: tableRecord.tag + ' Table Record', type: 'RECORD', value: tableRecord});
        tableFields.push({name: t.tableName + ' table', type: 'RECORD', value: t});
        offset += tableLength;
        check.argument(!isNaN(offset), 'Something went wrong calculating the offset.');
        while (offset % 4 !== 0) {
            offset += 1;
            tableFields.push({name: 'padding', type: 'BYTE', value: 0});
        }
    }

    // Table records need to be sorted alphabetically.
    recordFields.sort(function(r1, r2) {
        if (r1.value.tag > r2.value.tag) {
            return 1;
        } else {
            return -1;
        }
    });

    sfnt.fields = sfnt.fields.concat(recordFields);
    sfnt.fields = sfnt.fields.concat(tableFields);
    return sfnt;
}

// Get the metrics for a character. If the string has more than one character
// this function returns metrics for the first available character.
// You can provide optional fallback metrics if no characters are available.
function metricsForChar(font, chars, notFoundMetrics) {
    for (var i = 0; i < chars.length; i += 1) {
        var glyphIndex = font.charToGlyphIndex(chars[i]);
        if (glyphIndex > 0) {
            var glyph = font.glyphs.get(glyphIndex);
            return glyph.getMetrics();
        }
    }

    return notFoundMetrics;
}

function average(vs) {
    var sum = 0;
    for (var i = 0; i < vs.length; i += 1) {
        sum += vs[i];
    }

    return sum / vs.length;
}

// Convert the font object to a SFNT data structure.
// This structure contains all the necessary tables and metadata to create a binary OTF file.
function fontToSfntTable(font) {
    var xMins = [];
    var yMins = [];
    var xMaxs = [];
    var yMaxs = [];
    var advanceWidths = [];
    var leftSideBearings = [];
    var rightSideBearings = [];
    var firstCharIndex;
    var lastCharIndex = 0;
    var ulUnicodeRange1 = 0;
    var ulUnicodeRange2 = 0;
    var ulUnicodeRange3 = 0;
    var ulUnicodeRange4 = 0;

    for (var i = 0; i < font.glyphs.length; i += 1) {
        var glyph = font.glyphs.get(i);
        var unicode = glyph.unicode | 0;

        if (typeof glyph.advanceWidth === 'undefined') {
            throw new Error('Glyph ' + glyph.name + ' (' + i + '): advanceWidth is required.');
        }

        if (firstCharIndex > unicode || firstCharIndex === null) {
            firstCharIndex = unicode;
        }

        if (lastCharIndex < unicode) {
            lastCharIndex = unicode;
        }

        var position = os2.getUnicodeRange(unicode);
        if (position < 32) {
            ulUnicodeRange1 |= 1 << position;
        } else if (position < 64) {
            ulUnicodeRange2 |= 1 << position - 32;
        } else if (position < 96) {
            ulUnicodeRange3 |= 1 << position - 64;
        } else if (position < 123) {
            ulUnicodeRange4 |= 1 << position - 96;
        } else {
            throw new Error('Unicode ranges bits > 123 are reserved for internal usage');
        }
        // Skip non-important characters.
        if (glyph.name === '.notdef') continue;
        var metrics = glyph.getMetrics();
        xMins.push(metrics.xMin);
        yMins.push(metrics.yMin);
        xMaxs.push(metrics.xMax);
        yMaxs.push(metrics.yMax);
        leftSideBearings.push(metrics.leftSideBearing);
        rightSideBearings.push(metrics.rightSideBearing);
        advanceWidths.push(glyph.advanceWidth);
    }

    var globals = {
        xMin: Math.min.apply(null, xMins),
        yMin: Math.min.apply(null, yMins),
        xMax: Math.max.apply(null, xMaxs),
        yMax: Math.max.apply(null, yMaxs),
        advanceWidthMax: Math.max.apply(null, advanceWidths),
        advanceWidthAvg: average(advanceWidths),
        minLeftSideBearing: Math.min.apply(null, leftSideBearings),
        maxLeftSideBearing: Math.max.apply(null, leftSideBearings),
        minRightSideBearing: Math.min.apply(null, rightSideBearings)
    };
    globals.ascender = font.ascender;
    globals.descender = font.descender;

    var headTable = head.make({
        flags: 3, // 00000011 (baseline for font at y=0; left sidebearing point at x=0)
        unitsPerEm: font.unitsPerEm,
        xMin: globals.xMin,
        yMin: globals.yMin,
        xMax: globals.xMax,
        yMax: globals.yMax,
        lowestRecPPEM: 3
    });

    var hheaTable = hhea.make({
        ascender: globals.ascender,
        descender: globals.descender,
        advanceWidthMax: globals.advanceWidthMax,
        minLeftSideBearing: globals.minLeftSideBearing,
        minRightSideBearing: globals.minRightSideBearing,
        xMaxExtent: globals.maxLeftSideBearing + (globals.xMax - globals.xMin),
        numberOfHMetrics: font.glyphs.length
    });

    var maxpTable = maxp.make(font.glyphs.length);

    var os2Table = os2.make({
        xAvgCharWidth: Math.round(globals.advanceWidthAvg),
        usWeightClass: 500, // Medium FIXME Make this configurable
        usWidthClass: 5, // Medium (normal) FIXME Make this configurable
        usFirstCharIndex: firstCharIndex,
        usLastCharIndex: lastCharIndex,
        ulUnicodeRange1: ulUnicodeRange1,
        ulUnicodeRange2: ulUnicodeRange2,
        ulUnicodeRange3: ulUnicodeRange3,
        ulUnicodeRange4: ulUnicodeRange4,
        fsSelection: 64, // REGULAR
        // See http://typophile.com/node/13081 for more info on vertical metrics.
        // We get metrics for typical characters (such as "x" for xHeight).
        // We provide some fallback characters if characters are unavailable: their
        // ordering was chosen experimentally.
        sTypoAscender: globals.ascender,
        sTypoDescender: globals.descender,
        sTypoLineGap: 0,
        usWinAscent: globals.yMax,
        usWinDescent: Math.abs(globals.yMin),
        ulCodePageRange1: 1, // FIXME: hard-code Latin 1 support for now
        sxHeight: metricsForChar(font, 'xyvw', {yMax: Math.round(globals.ascender / 2)}).yMax,
        sCapHeight: metricsForChar(font, 'HIKLEFJMNTZBDPRAGOQSUVWXY', globals).yMax,
        usDefaultChar: font.hasChar(' ') ? 32 : 0, // Use space as the default character, if available.
        usBreakChar: font.hasChar(' ') ? 32 : 0 // Use space as the break character, if available.
    });

    var hmtxTable = hmtx.make(font.glyphs);
    var cmapTable = cmap.make(font.glyphs);

    var englishFamilyName = font.getEnglishName('fontFamily');
    var englishStyleName = font.getEnglishName('fontSubfamily');
    var englishFullName = englishFamilyName + ' ' + englishStyleName;
    var postScriptName = font.getEnglishName('postScriptName');
    if (!postScriptName) {
        postScriptName = englishFamilyName.replace(/\s/g, '') + '-' + englishStyleName;
    }

    var names = {};
    for (var n in font.names) {
        names[n] = font.names[n];
    }

    if (!names.uniqueID) {
        names.uniqueID = {en: font.getEnglishName('manufacturer') + ':' + englishFullName};
    }

    if (!names.postScriptName) {
        names.postScriptName = {en: postScriptName};
    }

    if (!names.preferredFamily) {
        names.preferredFamily = font.names.fontFamily;
    }

    if (!names.preferredSubfamily) {
        names.preferredSubfamily = font.names.fontSubfamily;
    }

    var languageTags = [];
    var nameTable = _name.make(names, languageTags);
    var ltagTable = (languageTags.length > 0 ? ltag.make(languageTags) : undefined);

    var postTable = post.make();
    var cffTable = cff.make(font.glyphs, {
        version: font.getEnglishName('version'),
        fullName: englishFullName,
        familyName: englishFamilyName,
        weightName: englishStyleName,
        postScriptName: postScriptName,
        unitsPerEm: font.unitsPerEm,
        fontBBox: [0, globals.yMin, globals.ascender, globals.advanceWidthMax]
    });

    // The order does not matter because makeSfntTable() will sort them.
    var tables = [headTable, hheaTable, maxpTable, os2Table, nameTable, cmapTable, postTable, cffTable, hmtxTable];
    if (ltagTable) {
        tables.push(ltagTable);
    }

    var sfntTable = makeSfntTable(tables);

    // Compute the font's checkSum and store it in head.checkSumAdjustment.
    var bytes = sfntTable.encode();
    var checkSum = computeCheckSum(bytes);
    var tableFields = sfntTable.fields;
    var checkSumAdjusted = false;
    for (i = 0; i < tableFields.length; i += 1) {
        if (tableFields[i].name === 'head table') {
            tableFields[i].value.checkSumAdjustment = 0xB1B0AFBA - checkSum;
            checkSumAdjusted = true;
            break;
        }
    }

    if (!checkSumAdjusted) {
        throw new Error('Could not find head table with checkSum to adjust.');
    }

    return sfntTable;
}

exports.computeCheckSum = computeCheckSum;
exports.make = makeSfntTable;
exports.fontToTable = fontToSfntTable;

},{"../check":8,"../table":17,"./cff":18,"./cmap":19,"./head":23,"./hhea":24,"./hmtx":25,"./ltag":28,"./maxp":29,"./name":30,"./os2":31,"./post":32}],34:[function(require,module,exports){
// Data types used in the OpenType font file.
// All OpenType fonts use Motorola-style byte ordering (Big Endian)

/* global WeakMap */

'use strict';

var check = require('./check');

var LIMIT16 = 32768; // The limit at which a 16-bit number switches signs == 2^15
var LIMIT32 = 2147483648; // The limit at which a 32-bit number switches signs == 2 ^ 31

var decode = {};
var encode = {};
var sizeOf = {};

// Return a function that always returns the same value.
function constant(v) {
    return function() {
        return v;
    };
}

// OpenType data types //////////////////////////////////////////////////////

// Convert an 8-bit unsigned integer to a list of 1 byte.
encode.BYTE = function(v) {
    check.argument(v >= 0 && v <= 255, 'Byte value should be between 0 and 255.');
    return [v];
};

sizeOf.BYTE = constant(1);

// Convert a 8-bit signed integer to a list of 1 byte.
encode.CHAR = function(v) {
    return [v.charCodeAt(0)];
};

sizeOf.CHAR = constant(1);

// Convert an ASCII string to a list of bytes.
encode.CHARARRAY = function(v) {
    var b = [];
    for (var i = 0; i < v.length; i += 1) {
        b.push(v.charCodeAt(i));
    }

    return b;
};

sizeOf.CHARARRAY = function(v) {
    return v.length;
};

// Convert a 16-bit unsigned integer to a list of 2 bytes.
encode.USHORT = function(v) {
    return [(v >> 8) & 0xFF, v & 0xFF];
};

sizeOf.USHORT = constant(2);

// Convert a 16-bit signed integer to a list of 2 bytes.
encode.SHORT = function(v) {
    // Two's complement
    if (v >= LIMIT16) {
        v = -(2 * LIMIT16 - v);
    }

    return [(v >> 8) & 0xFF, v & 0xFF];
};

sizeOf.SHORT = constant(2);

// Convert a 24-bit unsigned integer to a list of 3 bytes.
encode.UINT24 = function(v) {
    return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

sizeOf.UINT24 = constant(3);

// Convert a 32-bit unsigned integer to a list of 4 bytes.
encode.ULONG = function(v) {
    return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

sizeOf.ULONG = constant(4);

// Convert a 32-bit unsigned integer to a list of 4 bytes.
encode.LONG = function(v) {
    // Two's complement
    if (v >= LIMIT32) {
        v = -(2 * LIMIT32 - v);
    }

    return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

sizeOf.LONG = constant(4);

encode.FIXED = encode.ULONG;
sizeOf.FIXED = sizeOf.ULONG;

encode.FWORD = encode.SHORT;
sizeOf.FWORD = sizeOf.SHORT;

encode.UFWORD = encode.USHORT;
sizeOf.UFWORD = sizeOf.USHORT;

// FIXME Implement LONGDATETIME
encode.LONGDATETIME = function() {
    return [0, 0, 0, 0, 0, 0, 0, 0];
};

sizeOf.LONGDATETIME = constant(8);

// Convert a 4-char tag to a list of 4 bytes.
encode.TAG = function(v) {
    check.argument(v.length === 4, 'Tag should be exactly 4 ASCII characters.');
    return [v.charCodeAt(0),
            v.charCodeAt(1),
            v.charCodeAt(2),
            v.charCodeAt(3)];
};

sizeOf.TAG = constant(4);

// CFF data types ///////////////////////////////////////////////////////////

encode.Card8 = encode.BYTE;
sizeOf.Card8 = sizeOf.BYTE;

encode.Card16 = encode.USHORT;
sizeOf.Card16 = sizeOf.USHORT;

encode.OffSize = encode.BYTE;
sizeOf.OffSize = sizeOf.BYTE;

encode.SID = encode.USHORT;
sizeOf.SID = sizeOf.USHORT;

// Convert a numeric operand or charstring number to a variable-size list of bytes.
encode.NUMBER = function(v) {
    if (v >= -107 && v <= 107) {
        return [v + 139];
    } else if (v >= 108 && v <= 1131) {
        v = v - 108;
        return [(v >> 8) + 247, v & 0xFF];
    } else if (v >= -1131 && v <= -108) {
        v = -v - 108;
        return [(v >> 8) + 251, v & 0xFF];
    } else if (v >= -32768 && v <= 32767) {
        return encode.NUMBER16(v);
    } else {
        return encode.NUMBER32(v);
    }
};

sizeOf.NUMBER = function(v) {
    return encode.NUMBER(v).length;
};

// Convert a signed number between -32768 and +32767 to a three-byte value.
// This ensures we always use three bytes, but is not the most compact format.
encode.NUMBER16 = function(v) {
    return [28, (v >> 8) & 0xFF, v & 0xFF];
};

sizeOf.NUMBER16 = constant(3);

// Convert a signed number between -(2^31) and +(2^31-1) to a five-byte value.
// This is useful if you want to be sure you always use four bytes,
// at the expense of wasting a few bytes for smaller numbers.
encode.NUMBER32 = function(v) {
    return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

sizeOf.NUMBER32 = constant(5);

encode.REAL = function(v) {
    var value = v.toString();

    // Some numbers use an epsilon to encode the value. (e.g. JavaScript will store 0.0000001 as 1e-7)
    // This code converts it back to a number without the epsilon.
    var m = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value);
    if (m) {
        var epsilon = parseFloat('1e' + ((m[2] ? +m[2] : 0) + m[1].length));
        value = (Math.round(v * epsilon) / epsilon).toString();
    }

    var nibbles = '';
    var i;
    var ii;
    for (i = 0, ii = value.length; i < ii; i += 1) {
        var c = value[i];
        if (c === 'e') {
            nibbles += value[++i] === '-' ? 'c' : 'b';
        } else if (c === '.') {
            nibbles += 'a';
        } else if (c === '-') {
            nibbles += 'e';
        } else {
            nibbles += c;
        }
    }

    nibbles += (nibbles.length & 1) ? 'f' : 'ff';
    var out = [30];
    for (i = 0, ii = nibbles.length; i < ii; i += 2) {
        out.push(parseInt(nibbles.substr(i, 2), 16));
    }

    return out;
};

sizeOf.REAL = function(v) {
    return encode.REAL(v).length;
};

encode.NAME = encode.CHARARRAY;
sizeOf.NAME = sizeOf.CHARARRAY;

encode.STRING = encode.CHARARRAY;
sizeOf.STRING = sizeOf.CHARARRAY;

decode.UTF16 = function(data, offset, numBytes) {
    var codePoints = [];
    var numChars = numBytes / 2;
    for (var j = 0; j < numChars; j++, offset += 2) {
        codePoints[j] = data.getUint16(offset);
    }

    return String.fromCharCode.apply(null, codePoints);
};

// Convert a JavaScript string to UTF16-BE.
encode.UTF16 = function(v) {
    var b = [];
    for (var i = 0; i < v.length; i += 1) {
        var codepoint = v.charCodeAt(i);
        b.push((codepoint >> 8) & 0xFF);
        b.push(codepoint & 0xFF);
    }

    return b;
};

sizeOf.UTF16 = function(v) {
    return v.length * 2;
};

// Data for converting old eight-bit Macintosh encodings to Unicode.
// This representation is optimized for decoding; encoding is slower
// and needs more memory. The assumption is that all opentype.js users
// want to open fonts, but saving a font will be comperatively rare
// so it can be more expensive. Keyed by IANA character set name.
//
// Python script for generating these strings:
//
//     s = u''.join([chr(c).decode('mac_greek') for c in range(128, 256)])
//     print(s.encode('utf-8'))
var eightBitMacEncodings = {
    'x-mac-croatian':  // Python: 'mac_croatian'
        'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø' +
        '¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ',
    'x-mac-cyrillic':  // Python: 'mac_cyrillic'
        'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњ' +
        'јЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю',
    'x-mac-gaelic':
        // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/GAELIC.TXT
        'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæø' +
        'ṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ',
    'x-mac-greek':  // Python: 'mac_greek'
        'Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩ' +
        'άΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ\u00AD',
    'x-mac-icelandic':  // Python: 'mac_iceland'
        'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
        '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
    'x-mac-inuit':
        // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/INUIT.TXT
        'ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗ' +
        'ᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł',
    'x-mac-ce':  // Python: 'mac_latin2'
        'ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅ' +
        'ņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ',
    macintosh:  // Python: 'mac_roman'
        'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
        '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
    'x-mac-romanian':  // Python: 'mac_romanian'
        'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș' +
        '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
    'x-mac-turkish':  // Python: 'mac_turkish'
        'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
        '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ'
};

// Decodes an old-style Macintosh string. Returns either a Unicode JavaScript
// string, or 'undefined' if the encoding is unsupported. For example, we do
// not support Chinese, Japanese or Korean because these would need large
// mapping tables.
decode.MACSTRING = function(dataView, offset, dataLength, encoding) {
    var table = eightBitMacEncodings[encoding];
    if (table === undefined) {
        return undefined;
    }

    var result = '';
    for (var i = 0; i < dataLength; i++) {
        var c = dataView.getUint8(offset + i);
        // In all eight-bit Mac encodings, the characters 0x00..0x7F are
        // mapped to U+0000..U+007F; we only need to look up the others.
        if (c <= 0x7F) {
            result += String.fromCharCode(c);
        } else {
            result += table[c & 0x7F];
        }
    }

    return result;
};

// Helper function for encode.MACSTRING. Returns a dictionary for mapping
// Unicode character codes to their 8-bit MacOS equivalent. This table
// is not exactly a super cheap data structure, but we do not care because
// encoding Macintosh strings is only rarely needed in typical applications.
var macEncodingTableCache = typeof WeakMap === 'function' && new WeakMap();
var macEncodingCacheKeys;
var getMacEncodingTable = function(encoding) {
    // Since we use encoding as a cache key for WeakMap, it has to be
    // a String object and not a literal. And at least on NodeJS 2.10.1,
    // WeakMap requires that the same String instance is passed for cache hits.
    if (!macEncodingCacheKeys) {
        macEncodingCacheKeys = {};
        for (var e in eightBitMacEncodings) {
            /*jshint -W053 */  // Suppress "Do not use String as a constructor."
            macEncodingCacheKeys[e] = new String(e);
        }
    }

    var cacheKey = macEncodingCacheKeys[encoding];
    if (cacheKey === undefined) {
        return undefined;
    }

    // We can't do "if (cache.has(key)) {return cache.get(key)}" here:
    // since garbage collection may run at any time, it could also kick in
    // between the calls to cache.has() and cache.get(). In that case,
    // we would return 'undefined' even though we do support the encoding.
    if (macEncodingTableCache) {
        var cachedTable = macEncodingTableCache.get(cacheKey);
        if (cachedTable !== undefined) {
            return cachedTable;
        }
    }

    var decodingTable = eightBitMacEncodings[encoding];
    if (decodingTable === undefined) {
        return undefined;
    }

    var encodingTable = {};
    for (var i = 0; i < decodingTable.length; i++) {
        encodingTable[decodingTable.charCodeAt(i)] = i + 0x80;
    }

    if (macEncodingTableCache) {
        macEncodingTableCache.set(cacheKey, encodingTable);
    }

    return encodingTable;
};

// Encodes an old-style Macintosh string. Returns a byte array upon success.
// If the requested encoding is unsupported, or if the input string contains
// a character that cannot be expressed in the encoding, the function returns
// 'undefined'.
encode.MACSTRING = function(str, encoding) {
    var table = getMacEncodingTable(encoding);
    if (table === undefined) {
        return undefined;
    }

    var result = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);

        // In all eight-bit Mac encodings, the characters 0x00..0x7F are
        // mapped to U+0000..U+007F; we only need to look up the others.
        if (c >= 0x80) {
            c = table[c];
            if (c === undefined) {
                // str contains a Unicode character that cannot be encoded
                // in the requested encoding.
                return undefined;
            }
        }

        result.push(c);
    }

    return result;
};

sizeOf.MACSTRING = function(str, encoding) {
    var b = encode.MACSTRING(str, encoding);
    if (b !== undefined) {
        return b.length;
    } else {
        return 0;
    }
};

// Convert a list of values to a CFF INDEX structure.
// The values should be objects containing name / type / value.
encode.INDEX = function(l) {
    var i;
    //var offset, offsets, offsetEncoder, encodedOffsets, encodedOffset, data,
    //    dataSize, i, v;
    // Because we have to know which data type to use to encode the offsets,
    // we have to go through the values twice: once to encode the data and
    // calculate the offets, then again to encode the offsets using the fitting data type.
    var offset = 1; // First offset is always 1.
    var offsets = [offset];
    var data = [];
    var dataSize = 0;
    for (i = 0; i < l.length; i += 1) {
        var v = encode.OBJECT(l[i]);
        Array.prototype.push.apply(data, v);
        dataSize += v.length;
        offset += v.length;
        offsets.push(offset);
    }

    if (data.length === 0) {
        return [0, 0];
    }

    var encodedOffsets = [];
    var offSize = (1 + Math.floor(Math.log(dataSize) / Math.log(2)) / 8) | 0;
    var offsetEncoder = [undefined, encode.BYTE, encode.USHORT, encode.UINT24, encode.ULONG][offSize];
    for (i = 0; i < offsets.length; i += 1) {
        var encodedOffset = offsetEncoder(offsets[i]);
        Array.prototype.push.apply(encodedOffsets, encodedOffset);
    }

    return Array.prototype.concat(encode.Card16(l.length),
                           encode.OffSize(offSize),
                           encodedOffsets,
                           data);
};

sizeOf.INDEX = function(v) {
    return encode.INDEX(v).length;
};

// Convert an object to a CFF DICT structure.
// The keys should be numeric.
// The values should be objects containing name / type / value.
encode.DICT = function(m) {
    var d = [];
    var keys = Object.keys(m);
    var length = keys.length;

    for (var i = 0; i < length; i += 1) {
        // Object.keys() return string keys, but our keys are always numeric.
        var k = parseInt(keys[i], 0);
        var v = m[k];
        // Value comes before the key.
        d = d.concat(encode.OPERAND(v.value, v.type));
        d = d.concat(encode.OPERATOR(k));
    }

    return d;
};

sizeOf.DICT = function(m) {
    return encode.DICT(m).length;
};

encode.OPERATOR = function(v) {
    if (v < 1200) {
        return [v];
    } else {
        return [12, v - 1200];
    }
};

encode.OPERAND = function(v, type) {
    var d = [];
    if (Array.isArray(type)) {
        for (var i = 0; i < type.length; i += 1) {
            check.argument(v.length === type.length, 'Not enough arguments given for type' + type);
            d = d.concat(encode.OPERAND(v[i], type[i]));
        }
    } else {
        if (type === 'SID') {
            d = d.concat(encode.NUMBER(v));
        } else if (type === 'offset') {
            // We make it easy for ourselves and always encode offsets as
            // 4 bytes. This makes offset calculation for the top dict easier.
            d = d.concat(encode.NUMBER32(v));
        } else if (type === 'number') {
            d = d.concat(encode.NUMBER(v));
        } else if (type === 'real') {
            d = d.concat(encode.REAL(v));
        } else {
            throw new Error('Unknown operand type ' + type);
            // FIXME Add support for booleans
        }
    }

    return d;
};

encode.OP = encode.BYTE;
sizeOf.OP = sizeOf.BYTE;

// memoize charstring encoding using WeakMap if available
var wmm = typeof WeakMap === 'function' && new WeakMap();
// Convert a list of CharString operations to bytes.
encode.CHARSTRING = function(ops) {
    // See encode.MACSTRING for why we don't do "if (wmm && wmm.has(ops))".
    if (wmm) {
        var cachedValue = wmm.get(ops);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
    }

    var d = [];
    var length = ops.length;

    for (var i = 0; i < length; i += 1) {
        var op = ops[i];
        d = d.concat(encode[op.type](op.value));
    }

    if (wmm) {
        wmm.set(ops, d);
    }

    return d;
};

sizeOf.CHARSTRING = function(ops) {
    return encode.CHARSTRING(ops).length;
};

// Utility functions ////////////////////////////////////////////////////////

// Convert an object containing name / type / value to bytes.
encode.OBJECT = function(v) {
    var encodingFunction = encode[v.type];
    check.argument(encodingFunction !== undefined, 'No encoding function for type ' + v.type);
    return encodingFunction(v.value);
};

sizeOf.OBJECT = function(v) {
    var sizeOfFunction = sizeOf[v.type];
    check.argument(sizeOfFunction !== undefined, 'No sizeOf function for type ' + v.type);
    return sizeOfFunction(v.value);
};

// Convert a table object to bytes.
// A table contains a list of fields containing the metadata (name, type and default value).
// The table itself has the field values set as attributes.
encode.TABLE = function(table) {
    var d = [];
    var length = table.fields.length;
    var subtables = [];
    var subtableOffsets = [];
    var i;

    for (i = 0; i < length; i += 1) {
        var field = table.fields[i];
        var encodingFunction = encode[field.type];
        check.argument(encodingFunction !== undefined, 'No encoding function for field type ' + field.type + ' (' + field.name + ')');
        var value = table[field.name];
        if (value === undefined) {
            value = field.value;
        }

        var bytes = encodingFunction(value);

        if (field.type === 'TABLE') {
            subtableOffsets.push(d.length);
            d = d.concat([0, 0]);
            subtables.push(bytes);
        } else {
            d = d.concat(bytes);
        }
    }

    for (i = 0; i < subtables.length; i += 1) {
        var o = subtableOffsets[i];
        var offset = d.length;
        check.argument(offset < 65536, 'Table ' + table.tableName + ' too big.');
        d[o] = offset >> 8;
        d[o + 1] = offset & 0xff;
        d = d.concat(subtables[i]);
    }

    return d;
};

sizeOf.TABLE = function(table) {
    var numBytes = 0;
    var length = table.fields.length;

    for (var i = 0; i < length; i += 1) {
        var field = table.fields[i];
        var sizeOfFunction = sizeOf[field.type];
        check.argument(sizeOfFunction !== undefined, 'No sizeOf function for field type ' + field.type + ' (' + field.name + ')');
        var value = table[field.name];
        if (value === undefined) {
            value = field.value;
        }

        numBytes += sizeOfFunction(value);

        // Subtables take 2 more bytes for offsets.
        if (field.type === 'TABLE') {
            numBytes += 2;
        }
    }

    return numBytes;
};

encode.RECORD = encode.TABLE;
sizeOf.RECORD = sizeOf.TABLE;

// Merge in a list of bytes.
encode.LITERAL = function(v) {
    return v;
};

sizeOf.LITERAL = function(v) {
    return v.length;
};

exports.decode = decode;
exports.encode = encode;
exports.sizeOf = sizeOf;

},{"./check":8}],35:[function(require,module,exports){
(function (Buffer){
'use strict';

exports.isBrowser = function() {
    return typeof window !== 'undefined';
};

exports.isNode = function() {
    return typeof window === 'undefined';
};

exports.nodeBufferToArrayBuffer = function(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }

    return ab;
};

exports.arrayBufferToNodeBuffer = function(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }

    return buffer;
};

exports.checkArgument = function(expression, message) {
    if (!expression) {
        throw message;
    }
};

}).call(this,require("buffer").Buffer)

},{"buffer":4}],36:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":37}],37:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],38:[function(require,module,exports){
(function (__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2016 Hideki Shiro
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _opentype = require('opentype.js');

var _opentype2 = _interopRequireDefault(_opentype);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_FONT = require('path').join(__dirname, '../fonts/ipag.ttf');

// Private method

function parseAnchorOption(anchor) {
  var horizontal = anchor.match(/left|center|right/gi) || [];
  horizontal = horizontal.length === 0 ? 'left' : horizontal[0];

  var vertical = anchor.match(/baseline|top|bottom|middle/gi) || [];
  vertical = vertical.length === 0 ? 'baseline' : vertical[0];

  return { horizontal: horizontal, vertical: vertical };
}

var TextToSVG = function () {
  function TextToSVG(font) {
    _classCallCheck(this, TextToSVG);

    this.font = font;
  }

  _createClass(TextToSVG, [{
    key: 'getWidth',
    value: function getWidth(text, fontSize, kerning) {
      var fontScale = 1 / this.font.unitsPerEm * fontSize;

      var width = 0;
      var glyphs = this.font.stringToGlyphs(text);
      for (var i = 0; i < glyphs.length; i++) {
        var glyph = glyphs[i];

        if (glyph.advanceWidth) {
          width += glyph.advanceWidth * fontScale;
        }

        if (kerning && i < glyphs.length - 1) {
          var kerningValue = this.font.getKerningValue(glyph, glyphs[i + 1]);
          width += kerningValue * fontScale;
        }
      }
      return width;
    }
  }, {
    key: 'getHeight',
    value: function getHeight(fontSize) {
      var fontScale = 1 / this.font.unitsPerEm * fontSize;
      return (this.font.ascender - this.font.descender) * fontScale;
    }
  }, {
    key: 'getMetrics',
    value: function getMetrics(text) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var fontSize = options.fontSize || 72;
      var kerning = 'kerning' in options ? options.kerning : true;
      var anchor = parseAnchorOption(options.anchor || '');

      var width = this.getWidth(text, fontSize, kerning);
      var height = this.getHeight(fontSize);

      var fontScale = 1 / this.font.unitsPerEm * fontSize;
      var ascender = this.font.ascender * fontScale;
      var descender = this.font.descender * fontScale;

      var x = options.x || 0;
      switch (anchor.horizontal) {
        case 'left':
          x -= 0;
          break;
        case 'center':
          x -= width / 2;
          break;
        case 'right':
          x -= width;
          break;
        default:
          throw new Error('Unknown anchor option: ' + anchor.horizontal);
      }

      var y = options.y || 0;
      switch (anchor.vertical) {
        case 'baseline':
          y -= ascender;
          break;
        case 'top':
          y -= 0;
          break;
        case 'middle':
          y -= height / 2;
          break;
        case 'bottom':
          y -= height;
          break;
        default:
          throw new Error('Unknown anchor option: ' + anchor.vertical);
      }

      var baseline = y + ascender;

      return {
        x: x,
        y: y,
        baseline: baseline,
        width: width,
        height: height,
        ascender: ascender,
        descender: descender
      };
    }
  }, {
    key: 'getD',
    value: function getD(text) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var fontSize = options.fontSize || 72;
      var kerning = 'kerning' in options ? options.kerning : true;
      var metrics = this.getMetrics(text, options);
      var path = this.font.getPath(text, metrics.x, metrics.baseline, fontSize, { kerning: kerning });

      return path.toPathData();
    }
  }, {
    key: 'getPath',
    value: function getPath(text) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var attributes = Object.keys(options.attributes || {}).map(function (key) {
        return key + '="' + options.attributes[key] + '"';
      }).join(' ');
      var d = this.getD(text, options);

      if (attributes) {
        return '<path ' + attributes + ' d="' + d + '"/>';
      }

      return '<path d="' + d + '"/>';
    }
  }, {
    key: 'getSVG',
    value: function getSVG(text) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var metrics = this.getMetrics(text, options);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + metrics.width + '" height="' + metrics.height + '">';
      svg += this.getPath(text, options);
      svg += '</svg>';

      return svg;
    }
  }, {
    key: 'getDebugSVG',
    value: function getDebugSVG(text) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = JSON.parse(JSON.stringify(options));

      options.x = options.x || 0;
      options.y = options.y || 0;
      var metrics = this.getMetrics(text, options);
      var box = {
        width: Math.max(metrics.x + metrics.width, 0) - Math.min(metrics.x, 0),
        height: Math.max(metrics.y + metrics.height, 0) - Math.min(metrics.y, 0)
      };
      var origin = {
        x: box.width - Math.max(metrics.x + metrics.width, 0),
        y: box.height - Math.max(metrics.y + metrics.height, 0)
      };

      // Shift text based on origin
      options.x += origin.x;
      options.y += origin.y;

      var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + box.width + '" height="' + box.height + '">';
      svg += '<path fill="none" stroke="red" stroke-width="1" d="M0,' + origin.y + 'L' + box.width + ',' + origin.y + '"/>'; // X Axis
      svg += '<path fill="none" stroke="red" stroke-width="1" d="M' + origin.x + ',0L' + origin.x + ',' + box.height + '"/>'; // Y Axis
      svg += this.getPath(text, options);
      svg += '</svg>';

      return svg;
    }
  }], [{
    key: 'loadSync',
    value: function loadSync() {
      var file = arguments.length <= 0 || arguments[0] === undefined ? DEFAULT_FONT : arguments[0];

      return new TextToSVG(_opentype2.default.loadSync(file));
    }
  }, {
    key: 'load',
    value: function load(url, cb) {
      _opentype2.default.load(url, function (err, font) {
        if (err !== null) {
          return cb(err, null);
        }

        return cb(null, new TextToSVG(font));
      });
    }
  }]);

  return TextToSVG;
}();

exports.default = TextToSVG;


module.exports = exports.default;
}).call(this,"/node_modules/text-to-svg/build/src")

},{"opentype.js":14,"path":36}],39:[function(require,module,exports){
/**
 * Copyright (c) 2016 Hideki Shiro
 */

module.exports = require('./build/src/index.js');

},{"./build/src/index.js":38}],40:[function(require,module,exports){
var TINF_OK = 0;
var TINF_DATA_ERROR = -3;

function Tree() {
  this.table = new Uint16Array(16);   /* table of code length counts */
  this.trans = new Uint16Array(288);  /* code -> symbol translation table */
}

function Data(source, dest) {
  this.source = source;
  this.sourceIndex = 0;
  this.tag = 0;
  this.bitcount = 0;
  
  this.dest = dest;
  this.destLen = 0;
  
  this.ltree = new Tree();  /* dynamic length/symbol tree */
  this.dtree = new Tree();  /* dynamic distance tree */
}

/* --------------------------------------------------- *
 * -- uninitialized global data (static structures) -- *
 * --------------------------------------------------- */

var sltree = new Tree();
var sdtree = new Tree();

/* extra bits and base tables for length codes */
var length_bits = new Uint8Array(30);
var length_base = new Uint16Array(30);

/* extra bits and base tables for distance codes */
var dist_bits = new Uint8Array(30);
var dist_base = new Uint16Array(30);

/* special ordering of code length codes */
var clcidx = new Uint8Array([
  16, 17, 18, 0, 8, 7, 9, 6,
  10, 5, 11, 4, 12, 3, 13, 2,
  14, 1, 15
]);

/* used by tinf_decode_trees, avoids allocations every call */
var code_tree = new Tree();
var lengths = new Uint8Array(288 + 32);

/* ----------------------- *
 * -- utility functions -- *
 * ----------------------- */

/* build extra bits and base tables */
function tinf_build_bits_base(bits, base, delta, first) {
  var i, sum;

  /* build bits table */
  for (i = 0; i < delta; ++i) bits[i] = 0;
  for (i = 0; i < 30 - delta; ++i) bits[i + delta] = i / delta | 0;

  /* build base table */
  for (sum = first, i = 0; i < 30; ++i) {
    base[i] = sum;
    sum += 1 << bits[i];
  }
}

/* build the fixed huffman trees */
function tinf_build_fixed_trees(lt, dt) {
  var i;

  /* build fixed length tree */
  for (i = 0; i < 7; ++i) lt.table[i] = 0;

  lt.table[7] = 24;
  lt.table[8] = 152;
  lt.table[9] = 112;

  for (i = 0; i < 24; ++i) lt.trans[i] = 256 + i;
  for (i = 0; i < 144; ++i) lt.trans[24 + i] = i;
  for (i = 0; i < 8; ++i) lt.trans[24 + 144 + i] = 280 + i;
  for (i = 0; i < 112; ++i) lt.trans[24 + 144 + 8 + i] = 144 + i;

  /* build fixed distance tree */
  for (i = 0; i < 5; ++i) dt.table[i] = 0;

  dt.table[5] = 32;

  for (i = 0; i < 32; ++i) dt.trans[i] = i;
}

/* given an array of code lengths, build a tree */
var offs = new Uint16Array(16);

function tinf_build_tree(t, lengths, off, num) {
  var i, sum;

  /* clear code length count table */
  for (i = 0; i < 16; ++i) t.table[i] = 0;

  /* scan symbol lengths, and sum code length counts */
  for (i = 0; i < num; ++i) t.table[lengths[off + i]]++;

  t.table[0] = 0;

  /* compute offset table for distribution sort */
  for (sum = 0, i = 0; i < 16; ++i) {
    offs[i] = sum;
    sum += t.table[i];
  }

  /* create code->symbol translation table (symbols sorted by code) */
  for (i = 0; i < num; ++i) {
    if (lengths[off + i]) t.trans[offs[lengths[off + i]]++] = i;
  }
}

/* ---------------------- *
 * -- decode functions -- *
 * ---------------------- */

/* get one bit from source stream */
function tinf_getbit(d) {
  /* check if tag is empty */
  if (!d.bitcount--) {
    /* load next tag */
    d.tag = d.source[d.sourceIndex++];
    d.bitcount = 7;
  }

  /* shift bit out of tag */
  var bit = d.tag & 1;
  d.tag >>>= 1;

  return bit;
}

/* read a num bit value from a stream and add base */
function tinf_read_bits(d, num, base) {
  if (!num)
    return base;

  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }

  var val = d.tag & (0xffff >>> (16 - num));
  d.tag >>>= num;
  d.bitcount -= num;
  return val + base;
}

/* given a data stream and a tree, decode a symbol */
function tinf_decode_symbol(d, t) {
  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }
  
  var sum = 0, cur = 0, len = 0;
  var tag = d.tag;

  /* get more bits while code value is above sum */
  do {
    cur = 2 * cur + (tag & 1);
    tag >>>= 1;
    ++len;

    sum += t.table[len];
    cur -= t.table[len];
  } while (cur >= 0);
  
  d.tag = tag;
  d.bitcount -= len;

  return t.trans[sum + cur];
}

/* given a data stream, decode dynamic trees from it */
function tinf_decode_trees(d, lt, dt) {
  var hlit, hdist, hclen;
  var i, num, length;

  /* get 5 bits HLIT (257-286) */
  hlit = tinf_read_bits(d, 5, 257);

  /* get 5 bits HDIST (1-32) */
  hdist = tinf_read_bits(d, 5, 1);

  /* get 4 bits HCLEN (4-19) */
  hclen = tinf_read_bits(d, 4, 4);

  for (i = 0; i < 19; ++i) lengths[i] = 0;

  /* read code lengths for code length alphabet */
  for (i = 0; i < hclen; ++i) {
    /* get 3 bits code length (0-7) */
    var clen = tinf_read_bits(d, 3, 0);
    lengths[clcidx[i]] = clen;
  }

  /* build code length tree */
  tinf_build_tree(code_tree, lengths, 0, 19);

  /* decode code lengths for the dynamic trees */
  for (num = 0; num < hlit + hdist;) {
    var sym = tinf_decode_symbol(d, code_tree);

    switch (sym) {
      case 16:
        /* copy previous code length 3-6 times (read 2 bits) */
        var prev = lengths[num - 1];
        for (length = tinf_read_bits(d, 2, 3); length; --length) {
          lengths[num++] = prev;
        }
        break;
      case 17:
        /* repeat code length 0 for 3-10 times (read 3 bits) */
        for (length = tinf_read_bits(d, 3, 3); length; --length) {
          lengths[num++] = 0;
        }
        break;
      case 18:
        /* repeat code length 0 for 11-138 times (read 7 bits) */
        for (length = tinf_read_bits(d, 7, 11); length; --length) {
          lengths[num++] = 0;
        }
        break;
      default:
        /* values 0-15 represent the actual code lengths */
        lengths[num++] = sym;
        break;
    }
  }

  /* build dynamic trees */
  tinf_build_tree(lt, lengths, 0, hlit);
  tinf_build_tree(dt, lengths, hlit, hdist);
}

/* ----------------------------- *
 * -- block inflate functions -- *
 * ----------------------------- */

/* given a stream and two trees, inflate a block of data */
function tinf_inflate_block_data(d, lt, dt) {
  while (1) {
    var sym = tinf_decode_symbol(d, lt);

    /* check for end of block */
    if (sym === 256) {
      return TINF_OK;
    }

    if (sym < 256) {
      d.dest[d.destLen++] = sym;
    } else {
      var length, dist, offs;
      var i;

      sym -= 257;

      /* possibly get more bits from length code */
      length = tinf_read_bits(d, length_bits[sym], length_base[sym]);

      dist = tinf_decode_symbol(d, dt);

      /* possibly get more bits from distance code */
      offs = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);

      /* copy match */
      for (i = offs; i < offs + length; ++i) {
        d.dest[d.destLen++] = d.dest[i];
      }
    }
  }
}

/* inflate an uncompressed block of data */
function tinf_inflate_uncompressed_block(d) {
  var length, invlength;
  var i;
  
  /* unread from bitbuffer */
  while (d.bitcount > 8) {
    d.sourceIndex--;
    d.bitcount -= 8;
  }

  /* get length */
  length = d.source[d.sourceIndex + 1];
  length = 256 * length + d.source[d.sourceIndex];

  /* get one's complement of length */
  invlength = d.source[d.sourceIndex + 3];
  invlength = 256 * invlength + d.source[d.sourceIndex + 2];

  /* check length */
  if (length !== (~invlength & 0x0000ffff))
    return TINF_DATA_ERROR;

  d.sourceIndex += 4;

  /* copy block */
  for (i = length; i; --i)
    d.dest[d.destLen++] = d.source[d.sourceIndex++];

  /* make sure we start next block on a byte boundary */
  d.bitcount = 0;

  return TINF_OK;
}

/* inflate stream from source to dest */
function tinf_uncompress(source, dest) {
  var d = new Data(source, dest);
  var bfinal, btype, res;

  do {
    /* read final block flag */
    bfinal = tinf_getbit(d);

    /* read block type (2 bits) */
    btype = tinf_read_bits(d, 2, 0);

    /* decompress block */
    switch (btype) {
      case 0:
        /* decompress uncompressed block */
        res = tinf_inflate_uncompressed_block(d);
        break;
      case 1:
        /* decompress block with fixed huffman trees */
        res = tinf_inflate_block_data(d, sltree, sdtree);
        break;
      case 2:
        /* decompress block with dynamic huffman trees */
        tinf_decode_trees(d, d.ltree, d.dtree);
        res = tinf_inflate_block_data(d, d.ltree, d.dtree);
        break;
      default:
        res = TINF_DATA_ERROR;
    }

    if (res !== TINF_OK)
      throw new Error('Data error');

  } while (!bfinal);

  if (d.destLen < d.dest.length) {
    if (typeof d.dest.slice === 'function')
      return d.dest.slice(0, d.destLen);
    else
      return d.dest.subarray(0, d.destLen);
  }
  
  return d.dest;
}

/* -------------------- *
 * -- initialization -- *
 * -------------------- */

/* build fixed huffman trees */
tinf_build_fixed_trees(sltree, sdtree);

/* build extra bits and base tables */
tinf_build_bits_base(length_bits, length_base, 4, 3);
tinf_build_bits_base(dist_bits, dist_base, 2, 1);

/* fix a special case */
length_bits[28] = 0;
length_base[28] = 258;

module.exports = tinf_uncompress;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvZW1wdHkuanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RvbXJlYWR5L3JlYWR5LmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvY2hlY2suanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL2RyYXcuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL2VuY29kaW5nLmpzIiwibm9kZV9tb2R1bGVzL29wZW50eXBlLmpzL3NyYy9mb250LmpzIiwibm9kZV9tb2R1bGVzL29wZW50eXBlLmpzL3NyYy9nbHlwaC5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvZ2x5cGhzZXQuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL29wZW50eXBlLmpzIiwibm9kZV9tb2R1bGVzL29wZW50eXBlLmpzL3NyYy9wYXJzZS5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvcGF0aC5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvdGFibGUuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL3RhYmxlcy9jZmYuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL3RhYmxlcy9jbWFwLmpzIiwibm9kZV9tb2R1bGVzL29wZW50eXBlLmpzL3NyYy90YWJsZXMvZnZhci5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvdGFibGVzL2dseWYuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL3RhYmxlcy9ncG9zLmpzIiwibm9kZV9tb2R1bGVzL29wZW50eXBlLmpzL3NyYy90YWJsZXMvaGVhZC5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvdGFibGVzL2hoZWEuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL3RhYmxlcy9obXR4LmpzIiwibm9kZV9tb2R1bGVzL29wZW50eXBlLmpzL3NyYy90YWJsZXMva2Vybi5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvdGFibGVzL2xvY2EuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL3RhYmxlcy9sdGFnLmpzIiwibm9kZV9tb2R1bGVzL29wZW50eXBlLmpzL3NyYy90YWJsZXMvbWF4cC5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvdGFibGVzL25hbWUuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL3RhYmxlcy9vczIuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL3RhYmxlcy9wb3N0LmpzIiwibm9kZV9tb2R1bGVzL29wZW50eXBlLmpzL3NyYy90YWJsZXMvc2ZudC5qcyIsIm5vZGVfbW9kdWxlcy9vcGVudHlwZS5qcy9zcmMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvb3BlbnR5cGUuanMvc3JjL3V0aWwuanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy90ZXh0LXRvLXN2Zy9idWlsZC9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdGV4dC10by1zdmcvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdGlueS1pbmZsYXRlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9xREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4bENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbm9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBUZXh0VG9TVkcgPSByZXF1aXJlKCd0ZXh0LXRvLXN2ZycpO1xuY29uc3QgdGV4dFRvU1ZHID0gVGV4dFRvU1ZHLmxvYWRTeW5jKCk7XG4gXG5jb25zdCBhdHRyaWJ1dGVzID0ge2ZpbGw6ICdyZWQnLCBzdHJva2U6ICdibGFjayd9O1xuY29uc3Qgb3B0aW9ucyA9IHt4OiAwLCB5OiAwLCBmb250U2l6ZTogNzIsIGFuY2hvcjogJ3RvcCcsIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXN9O1xuIFxuLy9jb25zdCBzdmcgPSB0ZXh0VG9TVkcuZ2V0U1ZHKCdoZWxsbycsIG9wdGlvbnMpO1xuXG5yZXF1aXJlKCdkb21yZWFkeScpKGZ1bmN0aW9uKCkge1xuLy9cdGNvbnNvbGUubG9nKHN2Zyk7XG4vL1x0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdmcpO1x0XG59KTtcbiBcbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxuZnVuY3Rpb24gaW5pdCAoKSB7XG4gIHZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgbG9va3VwW2ldID0gY29kZVtpXVxuICAgIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxuICB9XG5cbiAgcmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG4gIHJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xufVxuXG5pbml0KClcblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuICAvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG4gIC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuICAvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcbiAgLy8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuICBwbGFjZUhvbGRlcnMgPSBiNjRbbGVuIC0gMl0gPT09ICc9JyA/IDIgOiBiNjRbbGVuIC0gMV0gPT09ICc9JyA/IDEgOiAwXG5cbiAgLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG4gIGFyciA9IG5ldyBBcnIobGVuICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICBsID0gcGxhY2VIb2xkZXJzID4gMCA/IGxlbiAtIDQgOiBsZW5cblxuICB2YXIgTCA9IDBcblxuICBmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8IHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbTCsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbTCsrXSA9IHRtcCAmIDB4RkZcbiAgfSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcbiAgICB0bXAgPSAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbTCsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gKyBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gKyBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBvdXRwdXQgPSAnJ1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aCkpKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFt0bXAgPj4gMl1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXVxuICAgIG91dHB1dCArPSAnPT0nXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArICh1aW50OFtsZW4gLSAxXSlcbiAgICBvdXRwdXQgKz0gbG9va3VwW3RtcCA+PiAxMF1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXVxuICAgIG91dHB1dCArPSBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdXG4gICAgb3V0cHV0ICs9ICc9J1xuICB9XG5cbiAgcGFydHMucHVzaChvdXRwdXQpXG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIiLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBEdWUgdG8gdmFyaW91cyBicm93c2VyIGJ1Z3MsIHNvbWV0aW1lcyB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uIHdpbGwgYmUgdXNlZCBldmVuXG4gKiB3aGVuIHRoZSBicm93c2VyIHN1cHBvcnRzIHR5cGVkIGFycmF5cy5cbiAqXG4gKiBOb3RlOlxuICpcbiAqICAgLSBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsXG4gKiAgICAgU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzguXG4gKlxuICogICAtIENocm9tZSA5LTEwIGlzIG1pc3NpbmcgdGhlIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24uXG4gKlxuICogICAtIElFMTAgaGFzIGEgYnJva2VuIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhcnJheXMgb2ZcbiAqICAgICBpbmNvcnJlY3QgbGVuZ3RoIGluIHNvbWUgc2l0dWF0aW9ucy5cblxuICogV2UgZGV0ZWN0IHRoZXNlIGJ1Z2d5IGJyb3dzZXJzIGFuZCBzZXQgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYCB0byBgZmFsc2VgIHNvIHRoZXlcbiAqIGdldCB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uLCB3aGljaCBpcyBzbG93ZXIgYnV0IGJlaGF2ZXMgY29ycmVjdGx5LlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUICE9PSB1bmRlZmluZWRcbiAgPyBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVFxuICA6IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuLypcbiAqIEV4cG9ydCBrTWF4TGVuZ3RoIGFmdGVyIHR5cGVkIGFycmF5IHN1cHBvcnQgaXMgZGV0ZXJtaW5lZC5cbiAqL1xuZXhwb3J0cy5rTWF4TGVuZ3RoID0ga01heExlbmd0aCgpXG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgJiYgLy8gY2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gICAgICAgIGFyci5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5mdW5jdGlvbiBrTWF4TGVuZ3RoICgpIHtcbiAgcmV0dXJuIEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gICAgPyAweDdmZmZmZmZmXG4gICAgOiAweDNmZmZmZmZmXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAodGhhdCwgbGVuZ3RoKSB7XG4gIGlmIChrTWF4TGVuZ3RoKCkgPCBsZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCB0eXBlZCBhcnJheSBsZW5ndGgnKVxuICB9XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoYXQgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIGlmICh0aGF0ID09PSBudWxsKSB7XG4gICAgICB0aGF0ID0gbmV3IEJ1ZmZlcihsZW5ndGgpXG4gICAgfVxuICAgIHRoYXQubGVuZ3RoID0gbGVuZ3RoXG4gIH1cblxuICByZXR1cm4gdGhhdFxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiAhKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnSWYgZW5jb2RpbmcgaXMgc3BlY2lmaWVkIHRoZW4gdGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcnXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZSh0aGlzLCBhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20odGhpcywgYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG4vLyBUT0RPOiBMZWdhY3ksIG5vdCBuZWVkZWQgYW55bW9yZS4gUmVtb3ZlIGluIG5leHQgbWFqb3IgdmVyc2lvbi5cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiBmcm9tICh0aGF0LCB2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIGEgbnVtYmVyJylcbiAgfVxuXG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHRoYXQsIHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoYXQsIHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgcmV0dXJuIGZyb21PYmplY3QodGhhdCwgdmFsdWUpXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20obnVsbCwgdmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gIEJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbiAgQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC5zcGVjaWVzICYmXG4gICAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgICAvLyBGaXggc3ViYXJyYXkoKSBpbiBFUzIwMTYuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC85N1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgICB2YWx1ZTogbnVsbCxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBhIG51bWJlcicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHRoYXQsIHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcih0aGF0LCBzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKG51bGwsIHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAodGhhdCwgc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShudWxsLCBzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShudWxsLCBzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZW5jb2RpbmdcIiBtdXN0IGJlIGEgdmFsaWQgc3RyaW5nIGVuY29kaW5nJylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGFycmF5LmJ5dGVMZW5ndGggLy8gdGhpcyB0aHJvd3MgaWYgYGFycmF5YCBpcyBub3QgYSB2YWxpZCBBcnJheUJ1ZmZlclxuXG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcXCdvZmZzZXRcXCcgaXMgb3V0IG9mIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1xcJ2xlbmd0aFxcJyBpcyBvdXQgb2YgYm91bmRzJylcbiAgfVxuXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYXJyYXkgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IGFycmF5XG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tQXJyYXlMaWtlKHRoYXQsIGFycmF5KVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbilcblxuICAgIGlmICh0aGF0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoYXRcbiAgICB9XG5cbiAgICBvYmouY29weSh0aGF0LCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIHRoYXRcbiAgfVxuXG4gIGlmIChvYmopIHtcbiAgICBpZiAoKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgb2JqLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB8fCAnbGVuZ3RoJyBpbiBvYmopIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgaXNuYW4ob2JqLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcih0aGF0LCAwKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqKVxuICAgIH1cblxuICAgIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iai5kYXRhKVxuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCBvciBhcnJheS1saWtlIG9iamVjdC4nKVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBrTWF4TGVuZ3RoKCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsga01heExlbmd0aCgpLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBidWYgPSBsaXN0W2ldXG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgc3RyaW5nIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgc3RyaW5nID0gJycgKyBzdHJpbmdcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgLy8gRGVwcmVjYXRlZFxuICAgICAgY2FzZSAncmF3JzpcbiAgICAgIGNhc2UgJ3Jhd3MnOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoZSBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIGFuZCBgaXMtYnVmZmVyYCAoaW4gU2FmYXJpIDUtNykgdG8gZGV0ZWN0XG4vLyBCdWZmZXIgaW5zdGFuY2VzLlxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHwgMFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgZm91bmRJbmRleCA9IC0xXG4gIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHJlYWQoYXJyLCBieXRlT2Zmc2V0ICsgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIChieXRlT2Zmc2V0ICsgZm91bmRJbmRleCkgKiBpbmRleFNpemVcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPj49IDBcblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVybiAtMVxuICBpZiAoYnl0ZU9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuIC0xXG5cbiAgLy8gTmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBNYXRoLm1heCh0aGlzLmxlbmd0aCArIGJ5dGVPZmZzZXQsIDApXG5cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZylcbiAgfVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAoc3RyTGVuICUgMiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggfCAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgLy8gbGVnYWN5IHdyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKSAtIHJlbW92ZSBpbiB2MC4xM1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgdmFyIGlcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmIChjb2RlIDwgMjU2KSB7XG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiB1dGY4VG9CeXRlcyhuZXcgQnVmZmVyKHZhbCwgZW5jb2RpbmcpLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgaSsrKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teK1xcLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0cmluZ3RyaW0oc3RyKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGlzbmFuICh2YWwpIHtcbiAgcmV0dXJuIHZhbCAhPT0gdmFsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCIvKiFcbiAgKiBkb21yZWFkeSAoYykgRHVzdGluIERpYXogMjAxNCAtIExpY2Vuc2UgTUlUXG4gICovXG4hZnVuY3Rpb24gKG5hbWUsIGRlZmluaXRpb24pIHtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJykgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKClcbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09ICdvYmplY3QnKSBkZWZpbmUoZGVmaW5pdGlvbilcbiAgZWxzZSB0aGlzW25hbWVdID0gZGVmaW5pdGlvbigpXG5cbn0oJ2RvbXJlYWR5JywgZnVuY3Rpb24gKCkge1xuXG4gIHZhciBmbnMgPSBbXSwgbGlzdGVuZXJcbiAgICAsIGRvYyA9IGRvY3VtZW50XG4gICAgLCBoYWNrID0gZG9jLmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbFxuICAgICwgZG9tQ29udGVudExvYWRlZCA9ICdET01Db250ZW50TG9hZGVkJ1xuICAgICwgbG9hZGVkID0gKGhhY2sgPyAvXmxvYWRlZHxeYy8gOiAvXmxvYWRlZHxeaXxeYy8pLnRlc3QoZG9jLnJlYWR5U3RhdGUpXG5cblxuICBpZiAoIWxvYWRlZClcbiAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoZG9tQ29udGVudExvYWRlZCwgbGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9tQ29udGVudExvYWRlZCwgbGlzdGVuZXIpXG4gICAgbG9hZGVkID0gMVxuICAgIHdoaWxlIChsaXN0ZW5lciA9IGZucy5zaGlmdCgpKSBsaXN0ZW5lcigpXG4gIH0pXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChmbikge1xuICAgIGxvYWRlZCA/IHNldFRpbWVvdXQoZm4sIDApIDogZm5zLnB1c2goZm4pXG4gIH1cblxufSk7XG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiLy8gUnVuLXRpbWUgY2hlY2tpbmcgb2YgcHJlY29uZGl0aW9ucy5cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBQcmVjb25kaXRpb24gZnVuY3Rpb24gdGhhdCBjaGVja3MgaWYgdGhlIGdpdmVuIHByZWRpY2F0ZSBpcyB0cnVlLlxuLy8gSWYgbm90LCBpdCB3aWxsIHRocm93IGFuIGVycm9yLlxuZXhwb3J0cy5hcmd1bWVudCA9IGZ1bmN0aW9uKHByZWRpY2F0ZSwgbWVzc2FnZSkge1xuICAgIGlmICghcHJlZGljYXRlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG59O1xuXG4vLyBQcmVjb25kaXRpb24gZnVuY3Rpb24gdGhhdCBjaGVja3MgaWYgdGhlIGdpdmVuIGFzc2VydGlvbiBpcyB0cnVlLlxuLy8gSWYgbm90LCBpdCB3aWxsIHRocm93IGFuIGVycm9yLlxuZXhwb3J0cy5hc3NlcnQgPSBleHBvcnRzLmFyZ3VtZW50O1xuIiwiLy8gRHJhd2luZyB1dGlsaXR5IGZ1bmN0aW9ucy5cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBEcmF3IGEgbGluZSBvbiB0aGUgZ2l2ZW4gY29udGV4dCBmcm9tIHBvaW50IGB4MSx5MWAgdG8gcG9pbnQgYHgyLHkyYC5cbmZ1bmN0aW9uIGxpbmUoY3R4LCB4MSwgeTEsIHgyLCB5Mikge1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKHgxLCB5MSk7XG4gICAgY3R4LmxpbmVUbyh4MiwgeTIpO1xuICAgIGN0eC5zdHJva2UoKTtcbn1cblxuZXhwb3J0cy5saW5lID0gbGluZTtcbiIsIi8vIEdseXBoIGVuY29kaW5nXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNmZlN0YW5kYXJkU3RyaW5ncyA9IFtcbiAgICAnLm5vdGRlZicsICdzcGFjZScsICdleGNsYW0nLCAncXVvdGVkYmwnLCAnbnVtYmVyc2lnbicsICdkb2xsYXInLCAncGVyY2VudCcsICdhbXBlcnNhbmQnLCAncXVvdGVyaWdodCcsXG4gICAgJ3BhcmVubGVmdCcsICdwYXJlbnJpZ2h0JywgJ2FzdGVyaXNrJywgJ3BsdXMnLCAnY29tbWEnLCAnaHlwaGVuJywgJ3BlcmlvZCcsICdzbGFzaCcsICd6ZXJvJywgJ29uZScsICd0d28nLFxuICAgICd0aHJlZScsICdmb3VyJywgJ2ZpdmUnLCAnc2l4JywgJ3NldmVuJywgJ2VpZ2h0JywgJ25pbmUnLCAnY29sb24nLCAnc2VtaWNvbG9uJywgJ2xlc3MnLCAnZXF1YWwnLCAnZ3JlYXRlcicsXG4gICAgJ3F1ZXN0aW9uJywgJ2F0JywgJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCcsICdJJywgJ0onLCAnSycsICdMJywgJ00nLCAnTicsICdPJywgJ1AnLCAnUScsICdSJywgJ1MnLFxuICAgICdUJywgJ1UnLCAnVicsICdXJywgJ1gnLCAnWScsICdaJywgJ2JyYWNrZXRsZWZ0JywgJ2JhY2tzbGFzaCcsICdicmFja2V0cmlnaHQnLCAnYXNjaWljaXJjdW0nLCAndW5kZXJzY29yZScsXG4gICAgJ3F1b3RlbGVmdCcsICdhJywgJ2InLCAnYycsICdkJywgJ2UnLCAnZicsICdnJywgJ2gnLCAnaScsICdqJywgJ2snLCAnbCcsICdtJywgJ24nLCAnbycsICdwJywgJ3EnLCAncicsICdzJywgJ3QnLFxuICAgICd1JywgJ3YnLCAndycsICd4JywgJ3knLCAneicsICdicmFjZWxlZnQnLCAnYmFyJywgJ2JyYWNlcmlnaHQnLCAnYXNjaWl0aWxkZScsICdleGNsYW1kb3duJywgJ2NlbnQnLCAnc3RlcmxpbmcnLFxuICAgICdmcmFjdGlvbicsICd5ZW4nLCAnZmxvcmluJywgJ3NlY3Rpb24nLCAnY3VycmVuY3knLCAncXVvdGVzaW5nbGUnLCAncXVvdGVkYmxsZWZ0JywgJ2d1aWxsZW1vdGxlZnQnLFxuICAgICdndWlsc2luZ2xsZWZ0JywgJ2d1aWxzaW5nbHJpZ2h0JywgJ2ZpJywgJ2ZsJywgJ2VuZGFzaCcsICdkYWdnZXInLCAnZGFnZ2VyZGJsJywgJ3BlcmlvZGNlbnRlcmVkJywgJ3BhcmFncmFwaCcsXG4gICAgJ2J1bGxldCcsICdxdW90ZXNpbmdsYmFzZScsICdxdW90ZWRibGJhc2UnLCAncXVvdGVkYmxyaWdodCcsICdndWlsbGVtb3RyaWdodCcsICdlbGxpcHNpcycsICdwZXJ0aG91c2FuZCcsXG4gICAgJ3F1ZXN0aW9uZG93bicsICdncmF2ZScsICdhY3V0ZScsICdjaXJjdW1mbGV4JywgJ3RpbGRlJywgJ21hY3JvbicsICdicmV2ZScsICdkb3RhY2NlbnQnLCAnZGllcmVzaXMnLCAncmluZycsXG4gICAgJ2NlZGlsbGEnLCAnaHVuZ2FydW1sYXV0JywgJ29nb25laycsICdjYXJvbicsICdlbWRhc2gnLCAnQUUnLCAnb3JkZmVtaW5pbmUnLCAnTHNsYXNoJywgJ09zbGFzaCcsICdPRScsXG4gICAgJ29yZG1hc2N1bGluZScsICdhZScsICdkb3RsZXNzaScsICdsc2xhc2gnLCAnb3NsYXNoJywgJ29lJywgJ2dlcm1hbmRibHMnLCAnb25lc3VwZXJpb3InLCAnbG9naWNhbG5vdCcsICdtdScsXG4gICAgJ3RyYWRlbWFyaycsICdFdGgnLCAnb25laGFsZicsICdwbHVzbWludXMnLCAnVGhvcm4nLCAnb25lcXVhcnRlcicsICdkaXZpZGUnLCAnYnJva2VuYmFyJywgJ2RlZ3JlZScsICd0aG9ybicsXG4gICAgJ3RocmVlcXVhcnRlcnMnLCAndHdvc3VwZXJpb3InLCAncmVnaXN0ZXJlZCcsICdtaW51cycsICdldGgnLCAnbXVsdGlwbHknLCAndGhyZWVzdXBlcmlvcicsICdjb3B5cmlnaHQnLFxuICAgICdBYWN1dGUnLCAnQWNpcmN1bWZsZXgnLCAnQWRpZXJlc2lzJywgJ0FncmF2ZScsICdBcmluZycsICdBdGlsZGUnLCAnQ2NlZGlsbGEnLCAnRWFjdXRlJywgJ0VjaXJjdW1mbGV4JyxcbiAgICAnRWRpZXJlc2lzJywgJ0VncmF2ZScsICdJYWN1dGUnLCAnSWNpcmN1bWZsZXgnLCAnSWRpZXJlc2lzJywgJ0lncmF2ZScsICdOdGlsZGUnLCAnT2FjdXRlJywgJ09jaXJjdW1mbGV4JyxcbiAgICAnT2RpZXJlc2lzJywgJ09ncmF2ZScsICdPdGlsZGUnLCAnU2Nhcm9uJywgJ1VhY3V0ZScsICdVY2lyY3VtZmxleCcsICdVZGllcmVzaXMnLCAnVWdyYXZlJywgJ1lhY3V0ZScsXG4gICAgJ1lkaWVyZXNpcycsICdaY2Fyb24nLCAnYWFjdXRlJywgJ2FjaXJjdW1mbGV4JywgJ2FkaWVyZXNpcycsICdhZ3JhdmUnLCAnYXJpbmcnLCAnYXRpbGRlJywgJ2NjZWRpbGxhJywgJ2VhY3V0ZScsXG4gICAgJ2VjaXJjdW1mbGV4JywgJ2VkaWVyZXNpcycsICdlZ3JhdmUnLCAnaWFjdXRlJywgJ2ljaXJjdW1mbGV4JywgJ2lkaWVyZXNpcycsICdpZ3JhdmUnLCAnbnRpbGRlJywgJ29hY3V0ZScsXG4gICAgJ29jaXJjdW1mbGV4JywgJ29kaWVyZXNpcycsICdvZ3JhdmUnLCAnb3RpbGRlJywgJ3NjYXJvbicsICd1YWN1dGUnLCAndWNpcmN1bWZsZXgnLCAndWRpZXJlc2lzJywgJ3VncmF2ZScsXG4gICAgJ3lhY3V0ZScsICd5ZGllcmVzaXMnLCAnemNhcm9uJywgJ2V4Y2xhbXNtYWxsJywgJ0h1bmdhcnVtbGF1dHNtYWxsJywgJ2RvbGxhcm9sZHN0eWxlJywgJ2RvbGxhcnN1cGVyaW9yJyxcbiAgICAnYW1wZXJzYW5kc21hbGwnLCAnQWN1dGVzbWFsbCcsICdwYXJlbmxlZnRzdXBlcmlvcicsICdwYXJlbnJpZ2h0c3VwZXJpb3InLCAnMjY2IGZmJywgJ29uZWRvdGVubGVhZGVyJyxcbiAgICAnemVyb29sZHN0eWxlJywgJ29uZW9sZHN0eWxlJywgJ3R3b29sZHN0eWxlJywgJ3RocmVlb2xkc3R5bGUnLCAnZm91cm9sZHN0eWxlJywgJ2ZpdmVvbGRzdHlsZScsICdzaXhvbGRzdHlsZScsXG4gICAgJ3NldmVub2xkc3R5bGUnLCAnZWlnaHRvbGRzdHlsZScsICduaW5lb2xkc3R5bGUnLCAnY29tbWFzdXBlcmlvcicsICd0aHJlZXF1YXJ0ZXJzZW1kYXNoJywgJ3BlcmlvZHN1cGVyaW9yJyxcbiAgICAncXVlc3Rpb25zbWFsbCcsICdhc3VwZXJpb3InLCAnYnN1cGVyaW9yJywgJ2NlbnRzdXBlcmlvcicsICdkc3VwZXJpb3InLCAnZXN1cGVyaW9yJywgJ2lzdXBlcmlvcicsICdsc3VwZXJpb3InLFxuICAgICdtc3VwZXJpb3InLCAnbnN1cGVyaW9yJywgJ29zdXBlcmlvcicsICdyc3VwZXJpb3InLCAnc3N1cGVyaW9yJywgJ3RzdXBlcmlvcicsICdmZicsICdmZmknLCAnZmZsJyxcbiAgICAncGFyZW5sZWZ0aW5mZXJpb3InLCAncGFyZW5yaWdodGluZmVyaW9yJywgJ0NpcmN1bWZsZXhzbWFsbCcsICdoeXBoZW5zdXBlcmlvcicsICdHcmF2ZXNtYWxsJywgJ0FzbWFsbCcsXG4gICAgJ0JzbWFsbCcsICdDc21hbGwnLCAnRHNtYWxsJywgJ0VzbWFsbCcsICdGc21hbGwnLCAnR3NtYWxsJywgJ0hzbWFsbCcsICdJc21hbGwnLCAnSnNtYWxsJywgJ0tzbWFsbCcsICdMc21hbGwnLFxuICAgICdNc21hbGwnLCAnTnNtYWxsJywgJ09zbWFsbCcsICdQc21hbGwnLCAnUXNtYWxsJywgJ1JzbWFsbCcsICdTc21hbGwnLCAnVHNtYWxsJywgJ1VzbWFsbCcsICdWc21hbGwnLCAnV3NtYWxsJyxcbiAgICAnWHNtYWxsJywgJ1lzbWFsbCcsICdac21hbGwnLCAnY29sb25tb25ldGFyeScsICdvbmVmaXR0ZWQnLCAncnVwaWFoJywgJ1RpbGRlc21hbGwnLCAnZXhjbGFtZG93bnNtYWxsJyxcbiAgICAnY2VudG9sZHN0eWxlJywgJ0xzbGFzaHNtYWxsJywgJ1NjYXJvbnNtYWxsJywgJ1pjYXJvbnNtYWxsJywgJ0RpZXJlc2lzc21hbGwnLCAnQnJldmVzbWFsbCcsICdDYXJvbnNtYWxsJyxcbiAgICAnRG90YWNjZW50c21hbGwnLCAnTWFjcm9uc21hbGwnLCAnZmlndXJlZGFzaCcsICdoeXBoZW5pbmZlcmlvcicsICdPZ29uZWtzbWFsbCcsICdSaW5nc21hbGwnLCAnQ2VkaWxsYXNtYWxsJyxcbiAgICAncXVlc3Rpb25kb3duc21hbGwnLCAnb25lZWlnaHRoJywgJ3RocmVlZWlnaHRocycsICdmaXZlZWlnaHRocycsICdzZXZlbmVpZ2h0aHMnLCAnb25ldGhpcmQnLCAndHdvdGhpcmRzJyxcbiAgICAnemVyb3N1cGVyaW9yJywgJ2ZvdXJzdXBlcmlvcicsICdmaXZlc3VwZXJpb3InLCAnc2l4c3VwZXJpb3InLCAnc2V2ZW5zdXBlcmlvcicsICdlaWdodHN1cGVyaW9yJywgJ25pbmVzdXBlcmlvcicsXG4gICAgJ3plcm9pbmZlcmlvcicsICdvbmVpbmZlcmlvcicsICd0d29pbmZlcmlvcicsICd0aHJlZWluZmVyaW9yJywgJ2ZvdXJpbmZlcmlvcicsICdmaXZlaW5mZXJpb3InLCAnc2l4aW5mZXJpb3InLFxuICAgICdzZXZlbmluZmVyaW9yJywgJ2VpZ2h0aW5mZXJpb3InLCAnbmluZWluZmVyaW9yJywgJ2NlbnRpbmZlcmlvcicsICdkb2xsYXJpbmZlcmlvcicsICdwZXJpb2RpbmZlcmlvcicsXG4gICAgJ2NvbW1haW5mZXJpb3InLCAnQWdyYXZlc21hbGwnLCAnQWFjdXRlc21hbGwnLCAnQWNpcmN1bWZsZXhzbWFsbCcsICdBdGlsZGVzbWFsbCcsICdBZGllcmVzaXNzbWFsbCcsXG4gICAgJ0FyaW5nc21hbGwnLCAnQUVzbWFsbCcsICdDY2VkaWxsYXNtYWxsJywgJ0VncmF2ZXNtYWxsJywgJ0VhY3V0ZXNtYWxsJywgJ0VjaXJjdW1mbGV4c21hbGwnLCAnRWRpZXJlc2lzc21hbGwnLFxuICAgICdJZ3JhdmVzbWFsbCcsICdJYWN1dGVzbWFsbCcsICdJY2lyY3VtZmxleHNtYWxsJywgJ0lkaWVyZXNpc3NtYWxsJywgJ0V0aHNtYWxsJywgJ050aWxkZXNtYWxsJywgJ09ncmF2ZXNtYWxsJyxcbiAgICAnT2FjdXRlc21hbGwnLCAnT2NpcmN1bWZsZXhzbWFsbCcsICdPdGlsZGVzbWFsbCcsICdPZGllcmVzaXNzbWFsbCcsICdPRXNtYWxsJywgJ09zbGFzaHNtYWxsJywgJ1VncmF2ZXNtYWxsJyxcbiAgICAnVWFjdXRlc21hbGwnLCAnVWNpcmN1bWZsZXhzbWFsbCcsICdVZGllcmVzaXNzbWFsbCcsICdZYWN1dGVzbWFsbCcsICdUaG9ybnNtYWxsJywgJ1lkaWVyZXNpc3NtYWxsJywgJzAwMS4wMDAnLFxuICAgICcwMDEuMDAxJywgJzAwMS4wMDInLCAnMDAxLjAwMycsICdCbGFjaycsICdCb2xkJywgJ0Jvb2snLCAnTGlnaHQnLCAnTWVkaXVtJywgJ1JlZ3VsYXInLCAnUm9tYW4nLCAnU2VtaWJvbGQnXTtcblxudmFyIGNmZlN0YW5kYXJkRW5jb2RpbmcgPSBbXG4gICAgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsXG4gICAgJycsICcnLCAnJywgJycsICdzcGFjZScsICdleGNsYW0nLCAncXVvdGVkYmwnLCAnbnVtYmVyc2lnbicsICdkb2xsYXInLCAncGVyY2VudCcsICdhbXBlcnNhbmQnLCAncXVvdGVyaWdodCcsXG4gICAgJ3BhcmVubGVmdCcsICdwYXJlbnJpZ2h0JywgJ2FzdGVyaXNrJywgJ3BsdXMnLCAnY29tbWEnLCAnaHlwaGVuJywgJ3BlcmlvZCcsICdzbGFzaCcsICd6ZXJvJywgJ29uZScsICd0d28nLFxuICAgICd0aHJlZScsICdmb3VyJywgJ2ZpdmUnLCAnc2l4JywgJ3NldmVuJywgJ2VpZ2h0JywgJ25pbmUnLCAnY29sb24nLCAnc2VtaWNvbG9uJywgJ2xlc3MnLCAnZXF1YWwnLCAnZ3JlYXRlcicsXG4gICAgJ3F1ZXN0aW9uJywgJ2F0JywgJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCcsICdJJywgJ0onLCAnSycsICdMJywgJ00nLCAnTicsICdPJywgJ1AnLCAnUScsICdSJywgJ1MnLFxuICAgICdUJywgJ1UnLCAnVicsICdXJywgJ1gnLCAnWScsICdaJywgJ2JyYWNrZXRsZWZ0JywgJ2JhY2tzbGFzaCcsICdicmFja2V0cmlnaHQnLCAnYXNjaWljaXJjdW0nLCAndW5kZXJzY29yZScsXG4gICAgJ3F1b3RlbGVmdCcsICdhJywgJ2InLCAnYycsICdkJywgJ2UnLCAnZicsICdnJywgJ2gnLCAnaScsICdqJywgJ2snLCAnbCcsICdtJywgJ24nLCAnbycsICdwJywgJ3EnLCAncicsICdzJywgJ3QnLFxuICAgICd1JywgJ3YnLCAndycsICd4JywgJ3knLCAneicsICdicmFjZWxlZnQnLCAnYmFyJywgJ2JyYWNlcmlnaHQnLCAnYXNjaWl0aWxkZScsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgICAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsXG4gICAgJ2V4Y2xhbWRvd24nLCAnY2VudCcsICdzdGVybGluZycsICdmcmFjdGlvbicsICd5ZW4nLCAnZmxvcmluJywgJ3NlY3Rpb24nLCAnY3VycmVuY3knLCAncXVvdGVzaW5nbGUnLFxuICAgICdxdW90ZWRibGxlZnQnLCAnZ3VpbGxlbW90bGVmdCcsICdndWlsc2luZ2xsZWZ0JywgJ2d1aWxzaW5nbHJpZ2h0JywgJ2ZpJywgJ2ZsJywgJycsICdlbmRhc2gnLCAnZGFnZ2VyJyxcbiAgICAnZGFnZ2VyZGJsJywgJ3BlcmlvZGNlbnRlcmVkJywgJycsICdwYXJhZ3JhcGgnLCAnYnVsbGV0JywgJ3F1b3Rlc2luZ2xiYXNlJywgJ3F1b3RlZGJsYmFzZScsICdxdW90ZWRibHJpZ2h0JyxcbiAgICAnZ3VpbGxlbW90cmlnaHQnLCAnZWxsaXBzaXMnLCAncGVydGhvdXNhbmQnLCAnJywgJ3F1ZXN0aW9uZG93bicsICcnLCAnZ3JhdmUnLCAnYWN1dGUnLCAnY2lyY3VtZmxleCcsICd0aWxkZScsXG4gICAgJ21hY3JvbicsICdicmV2ZScsICdkb3RhY2NlbnQnLCAnZGllcmVzaXMnLCAnJywgJ3JpbmcnLCAnY2VkaWxsYScsICcnLCAnaHVuZ2FydW1sYXV0JywgJ29nb25laycsICdjYXJvbicsXG4gICAgJ2VtZGFzaCcsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnQUUnLCAnJywgJ29yZGZlbWluaW5lJywgJycsICcnLCAnJyxcbiAgICAnJywgJ0xzbGFzaCcsICdPc2xhc2gnLCAnT0UnLCAnb3JkbWFzY3VsaW5lJywgJycsICcnLCAnJywgJycsICcnLCAnYWUnLCAnJywgJycsICcnLCAnZG90bGVzc2knLCAnJywgJycsXG4gICAgJ2xzbGFzaCcsICdvc2xhc2gnLCAnb2UnLCAnZ2VybWFuZGJscyddO1xuXG52YXIgY2ZmRXhwZXJ0RW5jb2RpbmcgPSBbXG4gICAgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsXG4gICAgJycsICcnLCAnJywgJycsICdzcGFjZScsICdleGNsYW1zbWFsbCcsICdIdW5nYXJ1bWxhdXRzbWFsbCcsICcnLCAnZG9sbGFyb2xkc3R5bGUnLCAnZG9sbGFyc3VwZXJpb3InLFxuICAgICdhbXBlcnNhbmRzbWFsbCcsICdBY3V0ZXNtYWxsJywgJ3BhcmVubGVmdHN1cGVyaW9yJywgJ3BhcmVucmlnaHRzdXBlcmlvcicsICd0d29kb3RlbmxlYWRlcicsICdvbmVkb3RlbmxlYWRlcicsXG4gICAgJ2NvbW1hJywgJ2h5cGhlbicsICdwZXJpb2QnLCAnZnJhY3Rpb24nLCAnemVyb29sZHN0eWxlJywgJ29uZW9sZHN0eWxlJywgJ3R3b29sZHN0eWxlJywgJ3RocmVlb2xkc3R5bGUnLFxuICAgICdmb3Vyb2xkc3R5bGUnLCAnZml2ZW9sZHN0eWxlJywgJ3NpeG9sZHN0eWxlJywgJ3NldmVub2xkc3R5bGUnLCAnZWlnaHRvbGRzdHlsZScsICduaW5lb2xkc3R5bGUnLCAnY29sb24nLFxuICAgICdzZW1pY29sb24nLCAnY29tbWFzdXBlcmlvcicsICd0aHJlZXF1YXJ0ZXJzZW1kYXNoJywgJ3BlcmlvZHN1cGVyaW9yJywgJ3F1ZXN0aW9uc21hbGwnLCAnJywgJ2FzdXBlcmlvcicsXG4gICAgJ2JzdXBlcmlvcicsICdjZW50c3VwZXJpb3InLCAnZHN1cGVyaW9yJywgJ2VzdXBlcmlvcicsICcnLCAnJywgJ2lzdXBlcmlvcicsICcnLCAnJywgJ2xzdXBlcmlvcicsICdtc3VwZXJpb3InLFxuICAgICduc3VwZXJpb3InLCAnb3N1cGVyaW9yJywgJycsICcnLCAncnN1cGVyaW9yJywgJ3NzdXBlcmlvcicsICd0c3VwZXJpb3InLCAnJywgJ2ZmJywgJ2ZpJywgJ2ZsJywgJ2ZmaScsICdmZmwnLFxuICAgICdwYXJlbmxlZnRpbmZlcmlvcicsICcnLCAncGFyZW5yaWdodGluZmVyaW9yJywgJ0NpcmN1bWZsZXhzbWFsbCcsICdoeXBoZW5zdXBlcmlvcicsICdHcmF2ZXNtYWxsJywgJ0FzbWFsbCcsXG4gICAgJ0JzbWFsbCcsICdDc21hbGwnLCAnRHNtYWxsJywgJ0VzbWFsbCcsICdGc21hbGwnLCAnR3NtYWxsJywgJ0hzbWFsbCcsICdJc21hbGwnLCAnSnNtYWxsJywgJ0tzbWFsbCcsICdMc21hbGwnLFxuICAgICdNc21hbGwnLCAnTnNtYWxsJywgJ09zbWFsbCcsICdQc21hbGwnLCAnUXNtYWxsJywgJ1JzbWFsbCcsICdTc21hbGwnLCAnVHNtYWxsJywgJ1VzbWFsbCcsICdWc21hbGwnLCAnV3NtYWxsJyxcbiAgICAnWHNtYWxsJywgJ1lzbWFsbCcsICdac21hbGwnLCAnY29sb25tb25ldGFyeScsICdvbmVmaXR0ZWQnLCAncnVwaWFoJywgJ1RpbGRlc21hbGwnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgICAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLFxuICAgICdleGNsYW1kb3duc21hbGwnLCAnY2VudG9sZHN0eWxlJywgJ0xzbGFzaHNtYWxsJywgJycsICcnLCAnU2Nhcm9uc21hbGwnLCAnWmNhcm9uc21hbGwnLCAnRGllcmVzaXNzbWFsbCcsXG4gICAgJ0JyZXZlc21hbGwnLCAnQ2Fyb25zbWFsbCcsICcnLCAnRG90YWNjZW50c21hbGwnLCAnJywgJycsICdNYWNyb25zbWFsbCcsICcnLCAnJywgJ2ZpZ3VyZWRhc2gnLCAnaHlwaGVuaW5mZXJpb3InLFxuICAgICcnLCAnJywgJ09nb25la3NtYWxsJywgJ1JpbmdzbWFsbCcsICdDZWRpbGxhc21hbGwnLCAnJywgJycsICcnLCAnb25lcXVhcnRlcicsICdvbmVoYWxmJywgJ3RocmVlcXVhcnRlcnMnLFxuICAgICdxdWVzdGlvbmRvd25zbWFsbCcsICdvbmVlaWdodGgnLCAndGhyZWVlaWdodGhzJywgJ2ZpdmVlaWdodGhzJywgJ3NldmVuZWlnaHRocycsICdvbmV0aGlyZCcsICd0d290aGlyZHMnLCAnJyxcbiAgICAnJywgJ3plcm9zdXBlcmlvcicsICdvbmVzdXBlcmlvcicsICd0d29zdXBlcmlvcicsICd0aHJlZXN1cGVyaW9yJywgJ2ZvdXJzdXBlcmlvcicsICdmaXZlc3VwZXJpb3InLFxuICAgICdzaXhzdXBlcmlvcicsICdzZXZlbnN1cGVyaW9yJywgJ2VpZ2h0c3VwZXJpb3InLCAnbmluZXN1cGVyaW9yJywgJ3plcm9pbmZlcmlvcicsICdvbmVpbmZlcmlvcicsICd0d29pbmZlcmlvcicsXG4gICAgJ3RocmVlaW5mZXJpb3InLCAnZm91cmluZmVyaW9yJywgJ2ZpdmVpbmZlcmlvcicsICdzaXhpbmZlcmlvcicsICdzZXZlbmluZmVyaW9yJywgJ2VpZ2h0aW5mZXJpb3InLFxuICAgICduaW5laW5mZXJpb3InLCAnY2VudGluZmVyaW9yJywgJ2RvbGxhcmluZmVyaW9yJywgJ3BlcmlvZGluZmVyaW9yJywgJ2NvbW1haW5mZXJpb3InLCAnQWdyYXZlc21hbGwnLFxuICAgICdBYWN1dGVzbWFsbCcsICdBY2lyY3VtZmxleHNtYWxsJywgJ0F0aWxkZXNtYWxsJywgJ0FkaWVyZXNpc3NtYWxsJywgJ0FyaW5nc21hbGwnLCAnQUVzbWFsbCcsICdDY2VkaWxsYXNtYWxsJyxcbiAgICAnRWdyYXZlc21hbGwnLCAnRWFjdXRlc21hbGwnLCAnRWNpcmN1bWZsZXhzbWFsbCcsICdFZGllcmVzaXNzbWFsbCcsICdJZ3JhdmVzbWFsbCcsICdJYWN1dGVzbWFsbCcsXG4gICAgJ0ljaXJjdW1mbGV4c21hbGwnLCAnSWRpZXJlc2lzc21hbGwnLCAnRXRoc21hbGwnLCAnTnRpbGRlc21hbGwnLCAnT2dyYXZlc21hbGwnLCAnT2FjdXRlc21hbGwnLFxuICAgICdPY2lyY3VtZmxleHNtYWxsJywgJ090aWxkZXNtYWxsJywgJ09kaWVyZXNpc3NtYWxsJywgJ09Fc21hbGwnLCAnT3NsYXNoc21hbGwnLCAnVWdyYXZlc21hbGwnLCAnVWFjdXRlc21hbGwnLFxuICAgICdVY2lyY3VtZmxleHNtYWxsJywgJ1VkaWVyZXNpc3NtYWxsJywgJ1lhY3V0ZXNtYWxsJywgJ1Rob3Juc21hbGwnLCAnWWRpZXJlc2lzc21hbGwnXTtcblxudmFyIHN0YW5kYXJkTmFtZXMgPSBbXG4gICAgJy5ub3RkZWYnLCAnLm51bGwnLCAnbm9ubWFya2luZ3JldHVybicsICdzcGFjZScsICdleGNsYW0nLCAncXVvdGVkYmwnLCAnbnVtYmVyc2lnbicsICdkb2xsYXInLCAncGVyY2VudCcsXG4gICAgJ2FtcGVyc2FuZCcsICdxdW90ZXNpbmdsZScsICdwYXJlbmxlZnQnLCAncGFyZW5yaWdodCcsICdhc3RlcmlzaycsICdwbHVzJywgJ2NvbW1hJywgJ2h5cGhlbicsICdwZXJpb2QnLCAnc2xhc2gnLFxuICAgICd6ZXJvJywgJ29uZScsICd0d28nLCAndGhyZWUnLCAnZm91cicsICdmaXZlJywgJ3NpeCcsICdzZXZlbicsICdlaWdodCcsICduaW5lJywgJ2NvbG9uJywgJ3NlbWljb2xvbicsICdsZXNzJyxcbiAgICAnZXF1YWwnLCAnZ3JlYXRlcicsICdxdWVzdGlvbicsICdhdCcsICdBJywgJ0InLCAnQycsICdEJywgJ0UnLCAnRicsICdHJywgJ0gnLCAnSScsICdKJywgJ0snLCAnTCcsICdNJywgJ04nLCAnTycsXG4gICAgJ1AnLCAnUScsICdSJywgJ1MnLCAnVCcsICdVJywgJ1YnLCAnVycsICdYJywgJ1knLCAnWicsICdicmFja2V0bGVmdCcsICdiYWNrc2xhc2gnLCAnYnJhY2tldHJpZ2h0JyxcbiAgICAnYXNjaWljaXJjdW0nLCAndW5kZXJzY29yZScsICdncmF2ZScsICdhJywgJ2InLCAnYycsICdkJywgJ2UnLCAnZicsICdnJywgJ2gnLCAnaScsICdqJywgJ2snLCAnbCcsICdtJywgJ24nLCAnbycsXG4gICAgJ3AnLCAncScsICdyJywgJ3MnLCAndCcsICd1JywgJ3YnLCAndycsICd4JywgJ3knLCAneicsICdicmFjZWxlZnQnLCAnYmFyJywgJ2JyYWNlcmlnaHQnLCAnYXNjaWl0aWxkZScsXG4gICAgJ0FkaWVyZXNpcycsICdBcmluZycsICdDY2VkaWxsYScsICdFYWN1dGUnLCAnTnRpbGRlJywgJ09kaWVyZXNpcycsICdVZGllcmVzaXMnLCAnYWFjdXRlJywgJ2FncmF2ZScsXG4gICAgJ2FjaXJjdW1mbGV4JywgJ2FkaWVyZXNpcycsICdhdGlsZGUnLCAnYXJpbmcnLCAnY2NlZGlsbGEnLCAnZWFjdXRlJywgJ2VncmF2ZScsICdlY2lyY3VtZmxleCcsICdlZGllcmVzaXMnLFxuICAgICdpYWN1dGUnLCAnaWdyYXZlJywgJ2ljaXJjdW1mbGV4JywgJ2lkaWVyZXNpcycsICdudGlsZGUnLCAnb2FjdXRlJywgJ29ncmF2ZScsICdvY2lyY3VtZmxleCcsICdvZGllcmVzaXMnLFxuICAgICdvdGlsZGUnLCAndWFjdXRlJywgJ3VncmF2ZScsICd1Y2lyY3VtZmxleCcsICd1ZGllcmVzaXMnLCAnZGFnZ2VyJywgJ2RlZ3JlZScsICdjZW50JywgJ3N0ZXJsaW5nJywgJ3NlY3Rpb24nLFxuICAgICdidWxsZXQnLCAncGFyYWdyYXBoJywgJ2dlcm1hbmRibHMnLCAncmVnaXN0ZXJlZCcsICdjb3B5cmlnaHQnLCAndHJhZGVtYXJrJywgJ2FjdXRlJywgJ2RpZXJlc2lzJywgJ25vdGVxdWFsJyxcbiAgICAnQUUnLCAnT3NsYXNoJywgJ2luZmluaXR5JywgJ3BsdXNtaW51cycsICdsZXNzZXF1YWwnLCAnZ3JlYXRlcmVxdWFsJywgJ3llbicsICdtdScsICdwYXJ0aWFsZGlmZicsICdzdW1tYXRpb24nLFxuICAgICdwcm9kdWN0JywgJ3BpJywgJ2ludGVncmFsJywgJ29yZGZlbWluaW5lJywgJ29yZG1hc2N1bGluZScsICdPbWVnYScsICdhZScsICdvc2xhc2gnLCAncXVlc3Rpb25kb3duJyxcbiAgICAnZXhjbGFtZG93bicsICdsb2dpY2Fsbm90JywgJ3JhZGljYWwnLCAnZmxvcmluJywgJ2FwcHJveGVxdWFsJywgJ0RlbHRhJywgJ2d1aWxsZW1vdGxlZnQnLCAnZ3VpbGxlbW90cmlnaHQnLFxuICAgICdlbGxpcHNpcycsICdub25icmVha2luZ3NwYWNlJywgJ0FncmF2ZScsICdBdGlsZGUnLCAnT3RpbGRlJywgJ09FJywgJ29lJywgJ2VuZGFzaCcsICdlbWRhc2gnLCAncXVvdGVkYmxsZWZ0JyxcbiAgICAncXVvdGVkYmxyaWdodCcsICdxdW90ZWxlZnQnLCAncXVvdGVyaWdodCcsICdkaXZpZGUnLCAnbG96ZW5nZScsICd5ZGllcmVzaXMnLCAnWWRpZXJlc2lzJywgJ2ZyYWN0aW9uJyxcbiAgICAnY3VycmVuY3knLCAnZ3VpbHNpbmdsbGVmdCcsICdndWlsc2luZ2xyaWdodCcsICdmaScsICdmbCcsICdkYWdnZXJkYmwnLCAncGVyaW9kY2VudGVyZWQnLCAncXVvdGVzaW5nbGJhc2UnLFxuICAgICdxdW90ZWRibGJhc2UnLCAncGVydGhvdXNhbmQnLCAnQWNpcmN1bWZsZXgnLCAnRWNpcmN1bWZsZXgnLCAnQWFjdXRlJywgJ0VkaWVyZXNpcycsICdFZ3JhdmUnLCAnSWFjdXRlJyxcbiAgICAnSWNpcmN1bWZsZXgnLCAnSWRpZXJlc2lzJywgJ0lncmF2ZScsICdPYWN1dGUnLCAnT2NpcmN1bWZsZXgnLCAnYXBwbGUnLCAnT2dyYXZlJywgJ1VhY3V0ZScsICdVY2lyY3VtZmxleCcsXG4gICAgJ1VncmF2ZScsICdkb3RsZXNzaScsICdjaXJjdW1mbGV4JywgJ3RpbGRlJywgJ21hY3JvbicsICdicmV2ZScsICdkb3RhY2NlbnQnLCAncmluZycsICdjZWRpbGxhJywgJ2h1bmdhcnVtbGF1dCcsXG4gICAgJ29nb25laycsICdjYXJvbicsICdMc2xhc2gnLCAnbHNsYXNoJywgJ1NjYXJvbicsICdzY2Fyb24nLCAnWmNhcm9uJywgJ3pjYXJvbicsICdicm9rZW5iYXInLCAnRXRoJywgJ2V0aCcsXG4gICAgJ1lhY3V0ZScsICd5YWN1dGUnLCAnVGhvcm4nLCAndGhvcm4nLCAnbWludXMnLCAnbXVsdGlwbHknLCAnb25lc3VwZXJpb3InLCAndHdvc3VwZXJpb3InLCAndGhyZWVzdXBlcmlvcicsXG4gICAgJ29uZWhhbGYnLCAnb25lcXVhcnRlcicsICd0aHJlZXF1YXJ0ZXJzJywgJ2ZyYW5jJywgJ0dicmV2ZScsICdnYnJldmUnLCAnSWRvdGFjY2VudCcsICdTY2VkaWxsYScsICdzY2VkaWxsYScsXG4gICAgJ0NhY3V0ZScsICdjYWN1dGUnLCAnQ2Nhcm9uJywgJ2NjYXJvbicsICdkY3JvYXQnXTtcblxuLy8gVGhpcyBpcyB0aGUgZW5jb2RpbmcgdXNlZCBmb3IgZm9udHMgY3JlYXRlZCBmcm9tIHNjcmF0Y2guXG4vLyBJdCBsb29wcyB0aHJvdWdoIGFsbCBnbHlwaHMgYW5kIGZpbmRzIHRoZSBhcHByb3ByaWF0ZSB1bmljb2RlIHZhbHVlLlxuLy8gU2luY2UgaXQncyBsaW5lYXIgdGltZSwgb3RoZXIgZW5jb2RpbmdzIHdpbGwgYmUgZmFzdGVyLlxuZnVuY3Rpb24gRGVmYXVsdEVuY29kaW5nKGZvbnQpIHtcbiAgICB0aGlzLmZvbnQgPSBmb250O1xufVxuXG5EZWZhdWx0RW5jb2RpbmcucHJvdG90eXBlLmNoYXJUb0dseXBoSW5kZXggPSBmdW5jdGlvbihjKSB7XG4gICAgdmFyIGNvZGUgPSBjLmNoYXJDb2RlQXQoMCk7XG4gICAgdmFyIGdseXBocyA9IHRoaXMuZm9udC5nbHlwaHM7XG4gICAgaWYgKGdseXBocykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdseXBocy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdmFyIGdseXBoID0gZ2x5cGhzLmdldChpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZ2x5cGgudW5pY29kZXMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZ2x5cGgudW5pY29kZXNbal0gPT09IGNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gQ21hcEVuY29kaW5nKGNtYXApIHtcbiAgICB0aGlzLmNtYXAgPSBjbWFwO1xufVxuXG5DbWFwRW5jb2RpbmcucHJvdG90eXBlLmNoYXJUb0dseXBoSW5kZXggPSBmdW5jdGlvbihjKSB7XG4gICAgcmV0dXJuIHRoaXMuY21hcC5nbHlwaEluZGV4TWFwW2MuY2hhckNvZGVBdCgwKV0gfHwgMDtcbn07XG5cbmZ1bmN0aW9uIENmZkVuY29kaW5nKGVuY29kaW5nLCBjaGFyc2V0KSB7XG4gICAgdGhpcy5lbmNvZGluZyA9IGVuY29kaW5nO1xuICAgIHRoaXMuY2hhcnNldCA9IGNoYXJzZXQ7XG59XG5cbkNmZkVuY29kaW5nLnByb3RvdHlwZS5jaGFyVG9HbHlwaEluZGV4ID0gZnVuY3Rpb24ocykge1xuICAgIHZhciBjb2RlID0gcy5jaGFyQ29kZUF0KDApO1xuICAgIHZhciBjaGFyTmFtZSA9IHRoaXMuZW5jb2RpbmdbY29kZV07XG4gICAgcmV0dXJuIHRoaXMuY2hhcnNldC5pbmRleE9mKGNoYXJOYW1lKTtcbn07XG5cbmZ1bmN0aW9uIEdseXBoTmFtZXMocG9zdCkge1xuICAgIHZhciBpO1xuICAgIHN3aXRjaCAocG9zdC52ZXJzaW9uKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHRoaXMubmFtZXMgPSBleHBvcnRzLnN0YW5kYXJkTmFtZXMuc2xpY2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICB0aGlzLm5hbWVzID0gbmV3IEFycmF5KHBvc3QubnVtYmVyT2ZHbHlwaHMpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHBvc3QubnVtYmVyT2ZHbHlwaHM7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChwb3N0LmdseXBoTmFtZUluZGV4W2ldIDwgZXhwb3J0cy5zdGFuZGFyZE5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWVzW2ldID0gZXhwb3J0cy5zdGFuZGFyZE5hbWVzW3Bvc3QuZ2x5cGhOYW1lSW5kZXhbaV1dO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZXNbaV0gPSBwb3N0Lm5hbWVzW3Bvc3QuZ2x5cGhOYW1lSW5kZXhbaV0gLSBleHBvcnRzLnN0YW5kYXJkTmFtZXMubGVuZ3RoXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDIuNTpcbiAgICAgICAgICAgIHRoaXMubmFtZXMgPSBuZXcgQXJyYXkocG9zdC5udW1iZXJPZkdseXBocyk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcG9zdC5udW1iZXJPZkdseXBoczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lc1tpXSA9IGV4cG9ydHMuc3RhbmRhcmROYW1lc1tpICsgcG9zdC5nbHlwaE5hbWVJbmRleFtpXV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICB0aGlzLm5hbWVzID0gW107XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59XG5cbkdseXBoTmFtZXMucHJvdG90eXBlLm5hbWVUb0dseXBoSW5kZXggPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZXMuaW5kZXhPZihuYW1lKTtcbn07XG5cbkdseXBoTmFtZXMucHJvdG90eXBlLmdseXBoSW5kZXhUb05hbWUgPSBmdW5jdGlvbihnaWQpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lc1tnaWRdO1xufTtcblxuZnVuY3Rpb24gYWRkR2x5cGhOYW1lcyhmb250KSB7XG4gICAgdmFyIGdseXBoO1xuICAgIHZhciBnbHlwaEluZGV4TWFwID0gZm9udC50YWJsZXMuY21hcC5nbHlwaEluZGV4TWFwO1xuICAgIHZhciBjaGFyQ29kZXMgPSBPYmplY3Qua2V5cyhnbHlwaEluZGV4TWFwKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hhckNvZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBjID0gY2hhckNvZGVzW2ldO1xuICAgICAgICB2YXIgZ2x5cGhJbmRleCA9IGdseXBoSW5kZXhNYXBbY107XG4gICAgICAgIGdseXBoID0gZm9udC5nbHlwaHMuZ2V0KGdseXBoSW5kZXgpO1xuICAgICAgICBnbHlwaC5hZGRVbmljb2RlKHBhcnNlSW50KGMpKTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZm9udC5nbHlwaHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgZ2x5cGggPSBmb250LmdseXBocy5nZXQoaSk7XG4gICAgICAgIGlmIChmb250LmNmZkVuY29kaW5nKSB7XG4gICAgICAgICAgICBnbHlwaC5uYW1lID0gZm9udC5jZmZFbmNvZGluZy5jaGFyc2V0W2ldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2x5cGgubmFtZSA9IGZvbnQuZ2x5cGhOYW1lcy5nbHlwaEluZGV4VG9OYW1lKGkpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnRzLmNmZlN0YW5kYXJkU3RyaW5ncyA9IGNmZlN0YW5kYXJkU3RyaW5ncztcbmV4cG9ydHMuY2ZmU3RhbmRhcmRFbmNvZGluZyA9IGNmZlN0YW5kYXJkRW5jb2Rpbmc7XG5leHBvcnRzLmNmZkV4cGVydEVuY29kaW5nID0gY2ZmRXhwZXJ0RW5jb2Rpbmc7XG5leHBvcnRzLnN0YW5kYXJkTmFtZXMgPSBzdGFuZGFyZE5hbWVzO1xuZXhwb3J0cy5EZWZhdWx0RW5jb2RpbmcgPSBEZWZhdWx0RW5jb2Rpbmc7XG5leHBvcnRzLkNtYXBFbmNvZGluZyA9IENtYXBFbmNvZGluZztcbmV4cG9ydHMuQ2ZmRW5jb2RpbmcgPSBDZmZFbmNvZGluZztcbmV4cG9ydHMuR2x5cGhOYW1lcyA9IEdseXBoTmFtZXM7XG5leHBvcnRzLmFkZEdseXBoTmFtZXMgPSBhZGRHbHlwaE5hbWVzO1xuIiwiLy8gVGhlIEZvbnQgb2JqZWN0XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHBhdGggPSByZXF1aXJlKCcuL3BhdGgnKTtcbnZhciBzZm50ID0gcmVxdWlyZSgnLi90YWJsZXMvc2ZudCcpO1xudmFyIGVuY29kaW5nID0gcmVxdWlyZSgnLi9lbmNvZGluZycpO1xudmFyIGdseXBoc2V0ID0gcmVxdWlyZSgnLi9nbHlwaHNldCcpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLy8gQSBGb250IHJlcHJlc2VudHMgYSBsb2FkZWQgT3BlblR5cGUgZm9udCBmaWxlLlxuLy8gSXQgY29udGFpbnMgYSBzZXQgb2YgZ2x5cGhzIGFuZCBtZXRob2RzIHRvIGRyYXcgdGV4dCBvbiBhIGRyYXdpbmcgY29udGV4dCxcbi8vIG9yIHRvIGdldCBhIHBhdGggcmVwcmVzZW50aW5nIHRoZSB0ZXh0LlxuZnVuY3Rpb24gRm9udChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAoIW9wdGlvbnMuZW1wdHkpIHtcbiAgICAgICAgLy8gQ2hlY2sgdGhhdCB3ZSd2ZSBwcm92aWRlZCB0aGUgbWluaW11bSBzZXQgb2YgbmFtZXMuXG4gICAgICAgIHV0aWwuY2hlY2tBcmd1bWVudChvcHRpb25zLmZhbWlseU5hbWUsICdXaGVuIGNyZWF0aW5nIGEgbmV3IEZvbnQgb2JqZWN0LCBmYW1pbHlOYW1lIGlzIHJlcXVpcmVkLicpO1xuICAgICAgICB1dGlsLmNoZWNrQXJndW1lbnQob3B0aW9ucy5zdHlsZU5hbWUsICdXaGVuIGNyZWF0aW5nIGEgbmV3IEZvbnQgb2JqZWN0LCBzdHlsZU5hbWUgaXMgcmVxdWlyZWQuJyk7XG4gICAgICAgIHV0aWwuY2hlY2tBcmd1bWVudChvcHRpb25zLnVuaXRzUGVyRW0sICdXaGVuIGNyZWF0aW5nIGEgbmV3IEZvbnQgb2JqZWN0LCB1bml0c1BlckVtIGlzIHJlcXVpcmVkLicpO1xuICAgICAgICB1dGlsLmNoZWNrQXJndW1lbnQob3B0aW9ucy5hc2NlbmRlciwgJ1doZW4gY3JlYXRpbmcgYSBuZXcgRm9udCBvYmplY3QsIGFzY2VuZGVyIGlzIHJlcXVpcmVkLicpO1xuICAgICAgICB1dGlsLmNoZWNrQXJndW1lbnQob3B0aW9ucy5kZXNjZW5kZXIsICdXaGVuIGNyZWF0aW5nIGEgbmV3IEZvbnQgb2JqZWN0LCBkZXNjZW5kZXIgaXMgcmVxdWlyZWQuJyk7XG4gICAgICAgIHV0aWwuY2hlY2tBcmd1bWVudChvcHRpb25zLmRlc2NlbmRlciA8IDAsICdEZXNjZW5kZXIgc2hvdWxkIGJlIG5lZ2F0aXZlIChlLmcuIC01MTIpLicpO1xuXG4gICAgICAgIC8vIE9TIFggd2lsbCBjb21wbGFpbiBpZiB0aGUgbmFtZXMgYXJlIGVtcHR5LCBzbyB3ZSBwdXQgYSBzaW5nbGUgc3BhY2UgZXZlcnl3aGVyZSBieSBkZWZhdWx0LlxuICAgICAgICB0aGlzLm5hbWVzID0ge1xuICAgICAgICAgICAgZm9udEZhbWlseToge2VuOiBvcHRpb25zLmZhbWlseU5hbWUgfHwgJyAnfSxcbiAgICAgICAgICAgIGZvbnRTdWJmYW1pbHk6IHtlbjogb3B0aW9ucy5zdHlsZU5hbWUgfHwgJyAnfSxcbiAgICAgICAgICAgIGZ1bGxOYW1lOiB7ZW46IG9wdGlvbnMuZnVsbE5hbWUgfHwgb3B0aW9ucy5mYW1pbHlOYW1lICsgJyAnICsgb3B0aW9ucy5zdHlsZU5hbWV9LFxuICAgICAgICAgICAgcG9zdFNjcmlwdE5hbWU6IHtlbjogb3B0aW9ucy5wb3N0U2NyaXB0TmFtZSB8fCBvcHRpb25zLmZhbWlseU5hbWUgKyBvcHRpb25zLnN0eWxlTmFtZX0sXG4gICAgICAgICAgICBkZXNpZ25lcjoge2VuOiBvcHRpb25zLmRlc2lnbmVyIHx8ICcgJ30sXG4gICAgICAgICAgICBkZXNpZ25lclVSTDoge2VuOiBvcHRpb25zLmRlc2lnbmVyVVJMIHx8ICcgJ30sXG4gICAgICAgICAgICBtYW51ZmFjdHVyZXI6IHtlbjogb3B0aW9ucy5tYW51ZmFjdHVyZXIgfHwgJyAnfSxcbiAgICAgICAgICAgIG1hbnVmYWN0dXJlclVSTDoge2VuOiBvcHRpb25zLm1hbnVmYWN0dXJlclVSTCB8fCAnICd9LFxuICAgICAgICAgICAgbGljZW5zZToge2VuOiBvcHRpb25zLmxpY2Vuc2UgfHwgJyAnfSxcbiAgICAgICAgICAgIGxpY2Vuc2VVUkw6IHtlbjogb3B0aW9ucy5saWNlbnNlVVJMIHx8ICcgJ30sXG4gICAgICAgICAgICB2ZXJzaW9uOiB7ZW46IG9wdGlvbnMudmVyc2lvbiB8fCAnVmVyc2lvbiAwLjEnfSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB7ZW46IG9wdGlvbnMuZGVzY3JpcHRpb24gfHwgJyAnfSxcbiAgICAgICAgICAgIGNvcHlyaWdodDoge2VuOiBvcHRpb25zLmNvcHlyaWdodCB8fCAnICd9LFxuICAgICAgICAgICAgdHJhZGVtYXJrOiB7ZW46IG9wdGlvbnMudHJhZGVtYXJrIHx8ICcgJ31cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51bml0c1BlckVtID0gb3B0aW9ucy51bml0c1BlckVtIHx8IDEwMDA7XG4gICAgICAgIHRoaXMuYXNjZW5kZXIgPSBvcHRpb25zLmFzY2VuZGVyO1xuICAgICAgICB0aGlzLmRlc2NlbmRlciA9IG9wdGlvbnMuZGVzY2VuZGVyO1xuICAgIH1cblxuICAgIHRoaXMuc3VwcG9ydGVkID0gdHJ1ZTsgLy8gRGVwcmVjYXRlZDogcGFyc2VCdWZmZXIgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBmb250IGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgdGhpcy5nbHlwaHMgPSBuZXcgZ2x5cGhzZXQuR2x5cGhTZXQodGhpcywgb3B0aW9ucy5nbHlwaHMgfHwgW10pO1xuICAgIHRoaXMuZW5jb2RpbmcgPSBuZXcgZW5jb2RpbmcuRGVmYXVsdEVuY29kaW5nKHRoaXMpO1xuICAgIHRoaXMudGFibGVzID0ge307XG59XG5cbi8vIENoZWNrIGlmIHRoZSBmb250IGhhcyBhIGdseXBoIGZvciB0aGUgZ2l2ZW4gY2hhcmFjdGVyLlxuRm9udC5wcm90b3R5cGUuaGFzQ2hhciA9IGZ1bmN0aW9uKGMpIHtcbiAgICByZXR1cm4gdGhpcy5lbmNvZGluZy5jaGFyVG9HbHlwaEluZGV4KGMpICE9PSBudWxsO1xufTtcblxuLy8gQ29udmVydCB0aGUgZ2l2ZW4gY2hhcmFjdGVyIHRvIGEgc2luZ2xlIGdseXBoIGluZGV4LlxuLy8gTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gYXNzdW1lcyB0aGF0IHRoZXJlIGlzIGEgb25lLXRvLW9uZSBtYXBwaW5nIGJldHdlZW5cbi8vIHRoZSBnaXZlbiBjaGFyYWN0ZXIgYW5kIGEgZ2x5cGg7IGZvciBjb21wbGV4IHNjcmlwdHMgdGhpcyBtaWdodCBub3QgYmUgdGhlIGNhc2UuXG5Gb250LnByb3RvdHlwZS5jaGFyVG9HbHlwaEluZGV4ID0gZnVuY3Rpb24ocykge1xuICAgIHJldHVybiB0aGlzLmVuY29kaW5nLmNoYXJUb0dseXBoSW5kZXgocyk7XG59O1xuXG4vLyBDb252ZXJ0IHRoZSBnaXZlbiBjaGFyYWN0ZXIgdG8gYSBzaW5nbGUgR2x5cGggb2JqZWN0LlxuLy8gTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gYXNzdW1lcyB0aGF0IHRoZXJlIGlzIGEgb25lLXRvLW9uZSBtYXBwaW5nIGJldHdlZW5cbi8vIHRoZSBnaXZlbiBjaGFyYWN0ZXIgYW5kIGEgZ2x5cGg7IGZvciBjb21wbGV4IHNjcmlwdHMgdGhpcyBtaWdodCBub3QgYmUgdGhlIGNhc2UuXG5Gb250LnByb3RvdHlwZS5jaGFyVG9HbHlwaCA9IGZ1bmN0aW9uKGMpIHtcbiAgICB2YXIgZ2x5cGhJbmRleCA9IHRoaXMuY2hhclRvR2x5cGhJbmRleChjKTtcbiAgICB2YXIgZ2x5cGggPSB0aGlzLmdseXBocy5nZXQoZ2x5cGhJbmRleCk7XG4gICAgaWYgKCFnbHlwaCkge1xuICAgICAgICAvLyAubm90ZGVmXG4gICAgICAgIGdseXBoID0gdGhpcy5nbHlwaHMuZ2V0KDApO1xuICAgIH1cblxuICAgIHJldHVybiBnbHlwaDtcbn07XG5cbi8vIENvbnZlcnQgdGhlIGdpdmVuIHRleHQgdG8gYSBsaXN0IG9mIEdseXBoIG9iamVjdHMuXG4vLyBOb3RlIHRoYXQgdGhlcmUgaXMgbm8gc3RyaWN0IG9uZS10by1vbmUgbWFwcGluZyBiZXR3ZWVuIGNoYXJhY3RlcnMgYW5kXG4vLyBnbHlwaHMsIHNvIHRoZSBsaXN0IG9mIHJldHVybmVkIGdseXBocyBjYW4gYmUgbGFyZ2VyIG9yIHNtYWxsZXIgdGhhbiB0aGVcbi8vIGxlbmd0aCBvZiB0aGUgZ2l2ZW4gc3RyaW5nLlxuRm9udC5wcm90b3R5cGUuc3RyaW5nVG9HbHlwaHMgPSBmdW5jdGlvbihzKSB7XG4gICAgdmFyIGdseXBocyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgYyA9IHNbaV07XG4gICAgICAgIGdseXBocy5wdXNoKHRoaXMuY2hhclRvR2x5cGgoYykpO1xuICAgIH1cblxuICAgIHJldHVybiBnbHlwaHM7XG59O1xuXG5Gb250LnByb3RvdHlwZS5uYW1lVG9HbHlwaEluZGV4ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLmdseXBoTmFtZXMubmFtZVRvR2x5cGhJbmRleChuYW1lKTtcbn07XG5cbkZvbnQucHJvdG90eXBlLm5hbWVUb0dseXBoID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBnbHlwaEluZGV4ID0gdGhpcy5uYW1ldG9HbHlwaEluZGV4KG5hbWUpO1xuICAgIHZhciBnbHlwaCA9IHRoaXMuZ2x5cGhzLmdldChnbHlwaEluZGV4KTtcbiAgICBpZiAoIWdseXBoKSB7XG4gICAgICAgIC8vIC5ub3RkZWZcbiAgICAgICAgZ2x5cGggPSB0aGlzLmdseXBocy5nZXQoMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdseXBoO1xufTtcblxuRm9udC5wcm90b3R5cGUuZ2x5cGhJbmRleFRvTmFtZSA9IGZ1bmN0aW9uKGdpZCkge1xuICAgIGlmICghdGhpcy5nbHlwaE5hbWVzLmdseXBoSW5kZXhUb05hbWUpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdseXBoTmFtZXMuZ2x5cGhJbmRleFRvTmFtZShnaWQpO1xufTtcblxuLy8gUmV0cmlldmUgdGhlIHZhbHVlIG9mIHRoZSBrZXJuaW5nIHBhaXIgYmV0d2VlbiB0aGUgbGVmdCBnbHlwaCAob3IgaXRzIGluZGV4KVxuLy8gYW5kIHRoZSByaWdodCBnbHlwaCAob3IgaXRzIGluZGV4KS4gSWYgbm8ga2VybmluZyBwYWlyIGlzIGZvdW5kLCByZXR1cm4gMC5cbi8vIFRoZSBrZXJuaW5nIHZhbHVlIGdldHMgYWRkZWQgdG8gdGhlIGFkdmFuY2Ugd2lkdGggd2hlbiBjYWxjdWxhdGluZyB0aGUgc3BhY2luZ1xuLy8gYmV0d2VlbiBnbHlwaHMuXG5Gb250LnByb3RvdHlwZS5nZXRLZXJuaW5nVmFsdWUgPSBmdW5jdGlvbihsZWZ0R2x5cGgsIHJpZ2h0R2x5cGgpIHtcbiAgICBsZWZ0R2x5cGggPSBsZWZ0R2x5cGguaW5kZXggfHwgbGVmdEdseXBoO1xuICAgIHJpZ2h0R2x5cGggPSByaWdodEdseXBoLmluZGV4IHx8IHJpZ2h0R2x5cGg7XG4gICAgdmFyIGdwb3NLZXJuaW5nID0gdGhpcy5nZXRHcG9zS2VybmluZ1ZhbHVlO1xuICAgIHJldHVybiBncG9zS2VybmluZyA/IGdwb3NLZXJuaW5nKGxlZnRHbHlwaCwgcmlnaHRHbHlwaCkgOlxuICAgICAgICAodGhpcy5rZXJuaW5nUGFpcnNbbGVmdEdseXBoICsgJywnICsgcmlnaHRHbHlwaF0gfHwgMCk7XG59O1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdGhhdCBpbnZva2VzIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgZWFjaCBnbHlwaCBpbiB0aGUgZ2l2ZW4gdGV4dC5cbi8vIFRoZSBjYWxsYmFjayBnZXRzIGAoZ2x5cGgsIHgsIHksIGZvbnRTaXplLCBvcHRpb25zKWAuXG5Gb250LnByb3RvdHlwZS5mb3JFYWNoR2x5cGggPSBmdW5jdGlvbih0ZXh0LCB4LCB5LCBmb250U2l6ZSwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICB4ID0geCAhPT0gdW5kZWZpbmVkID8geCA6IDA7XG4gICAgeSA9IHkgIT09IHVuZGVmaW5lZCA/IHkgOiAwO1xuICAgIGZvbnRTaXplID0gZm9udFNpemUgIT09IHVuZGVmaW5lZCA/IGZvbnRTaXplIDogNzI7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIGtlcm5pbmcgPSBvcHRpb25zLmtlcm5pbmcgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBvcHRpb25zLmtlcm5pbmc7XG4gICAgdmFyIGZvbnRTY2FsZSA9IDEgLyB0aGlzLnVuaXRzUGVyRW0gKiBmb250U2l6ZTtcbiAgICB2YXIgZ2x5cGhzID0gdGhpcy5zdHJpbmdUb0dseXBocyh0ZXh0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdseXBocy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgZ2x5cGggPSBnbHlwaHNbaV07XG4gICAgICAgIGNhbGxiYWNrKGdseXBoLCB4LCB5LCBmb250U2l6ZSwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChnbHlwaC5hZHZhbmNlV2lkdGgpIHtcbiAgICAgICAgICAgIHggKz0gZ2x5cGguYWR2YW5jZVdpZHRoICogZm9udFNjYWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGtlcm5pbmcgJiYgaSA8IGdseXBocy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB2YXIga2VybmluZ1ZhbHVlID0gdGhpcy5nZXRLZXJuaW5nVmFsdWUoZ2x5cGgsIGdseXBoc1tpICsgMV0pO1xuICAgICAgICAgICAgeCArPSBrZXJuaW5nVmFsdWUgKiBmb250U2NhbGU7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vLyBDcmVhdGUgYSBQYXRoIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGdpdmVuIHRleHQuXG4vL1xuLy8gdGV4dCAtIFRoZSB0ZXh0IHRvIGNyZWF0ZS5cbi8vIHggLSBIb3Jpem9udGFsIHBvc2l0aW9uIG9mIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHRleHQuIChkZWZhdWx0OiAwKVxuLy8geSAtIFZlcnRpY2FsIHBvc2l0aW9uIG9mIHRoZSAqYmFzZWxpbmUqIG9mIHRoZSB0ZXh0LiAoZGVmYXVsdDogMClcbi8vIGZvbnRTaXplIC0gRm9udCBzaXplIGluIHBpeGVscy4gV2Ugc2NhbGUgdGhlIGdseXBoIHVuaXRzIGJ5IGAxIC8gdW5pdHNQZXJFbSAqIGZvbnRTaXplYC4gKGRlZmF1bHQ6IDcyKVxuLy8gT3B0aW9ucyBpcyBhbiBvcHRpb25hbCBvYmplY3QgdGhhdCBjb250YWluczpcbi8vIC0ga2VybmluZyAtIFdoZXRoZXIgdG8gdGFrZSBrZXJuaW5nIGluZm9ybWF0aW9uIGludG8gYWNjb3VudC4gKGRlZmF1bHQ6IHRydWUpXG4vL1xuLy8gUmV0dXJucyBhIFBhdGggb2JqZWN0LlxuRm9udC5wcm90b3R5cGUuZ2V0UGF0aCA9IGZ1bmN0aW9uKHRleHQsIHgsIHksIGZvbnRTaXplLCBvcHRpb25zKSB7XG4gICAgdmFyIGZ1bGxQYXRoID0gbmV3IHBhdGguUGF0aCgpO1xuICAgIHRoaXMuZm9yRWFjaEdseXBoKHRleHQsIHgsIHksIGZvbnRTaXplLCBvcHRpb25zLCBmdW5jdGlvbihnbHlwaCwgZ1gsIGdZLCBnRm9udFNpemUpIHtcbiAgICAgICAgdmFyIGdseXBoUGF0aCA9IGdseXBoLmdldFBhdGgoZ1gsIGdZLCBnRm9udFNpemUpO1xuICAgICAgICBmdWxsUGF0aC5leHRlbmQoZ2x5cGhQYXRoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmdWxsUGF0aDtcbn07XG5cbi8vIENyZWF0ZSBhbiBhcnJheSBvZiBQYXRoIG9iamVjdHMgdGhhdCByZXByZXNlbnQgdGhlIGdseXBzIG9mIGEgZ2l2ZW4gdGV4dC5cbi8vXG4vLyB0ZXh0IC0gVGhlIHRleHQgdG8gY3JlYXRlLlxuLy8geCAtIEhvcml6b250YWwgcG9zaXRpb24gb2YgdGhlIGJlZ2lubmluZyBvZiB0aGUgdGV4dC4gKGRlZmF1bHQ6IDApXG4vLyB5IC0gVmVydGljYWwgcG9zaXRpb24gb2YgdGhlICpiYXNlbGluZSogb2YgdGhlIHRleHQuIChkZWZhdWx0OiAwKVxuLy8gZm9udFNpemUgLSBGb250IHNpemUgaW4gcGl4ZWxzLiBXZSBzY2FsZSB0aGUgZ2x5cGggdW5pdHMgYnkgYDEgLyB1bml0c1BlckVtICogZm9udFNpemVgLiAoZGVmYXVsdDogNzIpXG4vLyBPcHRpb25zIGlzIGFuIG9wdGlvbmFsIG9iamVjdCB0aGF0IGNvbnRhaW5zOlxuLy8gLSBrZXJuaW5nIC0gV2hldGhlciB0byB0YWtlIGtlcm5pbmcgaW5mb3JtYXRpb24gaW50byBhY2NvdW50LiAoZGVmYXVsdDogdHJ1ZSlcbi8vXG4vLyBSZXR1cm5zIGFuIGFycmF5IG9mIFBhdGggb2JqZWN0cy5cbkZvbnQucHJvdG90eXBlLmdldFBhdGhzID0gZnVuY3Rpb24odGV4dCwgeCwgeSwgZm9udFNpemUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZ2x5cGhQYXRocyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaEdseXBoKHRleHQsIHgsIHksIGZvbnRTaXplLCBvcHRpb25zLCBmdW5jdGlvbihnbHlwaCwgZ1gsIGdZLCBnRm9udFNpemUpIHtcbiAgICAgICAgdmFyIGdseXBoUGF0aCA9IGdseXBoLmdldFBhdGgoZ1gsIGdZLCBnRm9udFNpemUpO1xuICAgICAgICBnbHlwaFBhdGhzLnB1c2goZ2x5cGhQYXRoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBnbHlwaFBhdGhzO1xufTtcblxuLy8gRHJhdyB0aGUgdGV4dCBvbiB0aGUgZ2l2ZW4gZHJhd2luZyBjb250ZXh0LlxuLy9cbi8vIGN0eCAtIEEgMkQgZHJhd2luZyBjb250ZXh0LCBsaWtlIENhbnZhcy5cbi8vIHRleHQgLSBUaGUgdGV4dCB0byBjcmVhdGUuXG4vLyB4IC0gSG9yaXpvbnRhbCBwb3NpdGlvbiBvZiB0aGUgYmVnaW5uaW5nIG9mIHRoZSB0ZXh0LiAoZGVmYXVsdDogMClcbi8vIHkgLSBWZXJ0aWNhbCBwb3NpdGlvbiBvZiB0aGUgKmJhc2VsaW5lKiBvZiB0aGUgdGV4dC4gKGRlZmF1bHQ6IDApXG4vLyBmb250U2l6ZSAtIEZvbnQgc2l6ZSBpbiBwaXhlbHMuIFdlIHNjYWxlIHRoZSBnbHlwaCB1bml0cyBieSBgMSAvIHVuaXRzUGVyRW0gKiBmb250U2l6ZWAuIChkZWZhdWx0OiA3Milcbi8vIE9wdGlvbnMgaXMgYW4gb3B0aW9uYWwgb2JqZWN0IHRoYXQgY29udGFpbnM6XG4vLyAtIGtlcm5pbmcgLSBXaGV0aGVyIHRvIHRha2Uga2VybmluZyBpbmZvcm1hdGlvbiBpbnRvIGFjY291bnQuIChkZWZhdWx0OiB0cnVlKVxuRm9udC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCwgdGV4dCwgeCwgeSwgZm9udFNpemUsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmdldFBhdGgodGV4dCwgeCwgeSwgZm9udFNpemUsIG9wdGlvbnMpLmRyYXcoY3R4KTtcbn07XG5cbi8vIERyYXcgdGhlIHBvaW50cyBvZiBhbGwgZ2x5cGhzIGluIHRoZSB0ZXh0LlxuLy8gT24tY3VydmUgcG9pbnRzIHdpbGwgYmUgZHJhd24gaW4gYmx1ZSwgb2ZmLWN1cnZlIHBvaW50cyB3aWxsIGJlIGRyYXduIGluIHJlZC5cbi8vXG4vLyBjdHggLSBBIDJEIGRyYXdpbmcgY29udGV4dCwgbGlrZSBDYW52YXMuXG4vLyB0ZXh0IC0gVGhlIHRleHQgdG8gY3JlYXRlLlxuLy8geCAtIEhvcml6b250YWwgcG9zaXRpb24gb2YgdGhlIGJlZ2lubmluZyBvZiB0aGUgdGV4dC4gKGRlZmF1bHQ6IDApXG4vLyB5IC0gVmVydGljYWwgcG9zaXRpb24gb2YgdGhlICpiYXNlbGluZSogb2YgdGhlIHRleHQuIChkZWZhdWx0OiAwKVxuLy8gZm9udFNpemUgLSBGb250IHNpemUgaW4gcGl4ZWxzLiBXZSBzY2FsZSB0aGUgZ2x5cGggdW5pdHMgYnkgYDEgLyB1bml0c1BlckVtICogZm9udFNpemVgLiAoZGVmYXVsdDogNzIpXG4vLyBPcHRpb25zIGlzIGFuIG9wdGlvbmFsIG9iamVjdCB0aGF0IGNvbnRhaW5zOlxuLy8gLSBrZXJuaW5nIC0gV2hldGhlciB0byB0YWtlIGtlcm5pbmcgaW5mb3JtYXRpb24gaW50byBhY2NvdW50LiAoZGVmYXVsdDogdHJ1ZSlcbkZvbnQucHJvdG90eXBlLmRyYXdQb2ludHMgPSBmdW5jdGlvbihjdHgsIHRleHQsIHgsIHksIGZvbnRTaXplLCBvcHRpb25zKSB7XG4gICAgdGhpcy5mb3JFYWNoR2x5cGgodGV4dCwgeCwgeSwgZm9udFNpemUsIG9wdGlvbnMsIGZ1bmN0aW9uKGdseXBoLCBnWCwgZ1ksIGdGb250U2l6ZSkge1xuICAgICAgICBnbHlwaC5kcmF3UG9pbnRzKGN0eCwgZ1gsIGdZLCBnRm9udFNpemUpO1xuICAgIH0pO1xufTtcblxuLy8gRHJhdyBsaW5lcyBpbmRpY2F0aW5nIGltcG9ydGFudCBmb250IG1lYXN1cmVtZW50cyBmb3IgYWxsIGdseXBocyBpbiB0aGUgdGV4dC5cbi8vIEJsYWNrIGxpbmVzIGluZGljYXRlIHRoZSBvcmlnaW4gb2YgdGhlIGNvb3JkaW5hdGUgc3lzdGVtIChwb2ludCAwLDApLlxuLy8gQmx1ZSBsaW5lcyBpbmRpY2F0ZSB0aGUgZ2x5cGggYm91bmRpbmcgYm94LlxuLy8gR3JlZW4gbGluZSBpbmRpY2F0ZXMgdGhlIGFkdmFuY2Ugd2lkdGggb2YgdGhlIGdseXBoLlxuLy9cbi8vIGN0eCAtIEEgMkQgZHJhd2luZyBjb250ZXh0LCBsaWtlIENhbnZhcy5cbi8vIHRleHQgLSBUaGUgdGV4dCB0byBjcmVhdGUuXG4vLyB4IC0gSG9yaXpvbnRhbCBwb3NpdGlvbiBvZiB0aGUgYmVnaW5uaW5nIG9mIHRoZSB0ZXh0LiAoZGVmYXVsdDogMClcbi8vIHkgLSBWZXJ0aWNhbCBwb3NpdGlvbiBvZiB0aGUgKmJhc2VsaW5lKiBvZiB0aGUgdGV4dC4gKGRlZmF1bHQ6IDApXG4vLyBmb250U2l6ZSAtIEZvbnQgc2l6ZSBpbiBwaXhlbHMuIFdlIHNjYWxlIHRoZSBnbHlwaCB1bml0cyBieSBgMSAvIHVuaXRzUGVyRW0gKiBmb250U2l6ZWAuIChkZWZhdWx0OiA3Milcbi8vIE9wdGlvbnMgaXMgYW4gb3B0aW9uYWwgb2JqZWN0IHRoYXQgY29udGFpbnM6XG4vLyAtIGtlcm5pbmcgLSBXaGV0aGVyIHRvIHRha2Uga2VybmluZyBpbmZvcm1hdGlvbiBpbnRvIGFjY291bnQuIChkZWZhdWx0OiB0cnVlKVxuRm9udC5wcm90b3R5cGUuZHJhd01ldHJpY3MgPSBmdW5jdGlvbihjdHgsIHRleHQsIHgsIHksIGZvbnRTaXplLCBvcHRpb25zKSB7XG4gICAgdGhpcy5mb3JFYWNoR2x5cGgodGV4dCwgeCwgeSwgZm9udFNpemUsIG9wdGlvbnMsIGZ1bmN0aW9uKGdseXBoLCBnWCwgZ1ksIGdGb250U2l6ZSkge1xuICAgICAgICBnbHlwaC5kcmF3TWV0cmljcyhjdHgsIGdYLCBnWSwgZ0ZvbnRTaXplKTtcbiAgICB9KTtcbn07XG5cbkZvbnQucHJvdG90eXBlLmdldEVuZ2xpc2hOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB0cmFuc2xhdGlvbnMgPSB0aGlzLm5hbWVzW25hbWVdO1xuICAgIGlmICh0cmFuc2xhdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zbGF0aW9ucy5lbjtcbiAgICB9XG59O1xuXG4vLyBWYWxpZGF0ZVxuRm9udC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2FybmluZ3MgPSBbXTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gYXNzZXJ0KHByZWRpY2F0ZSwgbWVzc2FnZSkge1xuICAgICAgICBpZiAoIXByZWRpY2F0ZSkge1xuICAgICAgICAgICAgd2FybmluZ3MucHVzaChtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzc2VydE5hbWVQcmVzZW50KG5hbWUpIHtcbiAgICAgICAgdmFyIGVuZ2xpc2hOYW1lID0gX3RoaXMuZ2V0RW5nbGlzaE5hbWUobmFtZSk7XG4gICAgICAgIGFzc2VydChlbmdsaXNoTmFtZSAmJiBlbmdsaXNoTmFtZS50cmltKCkubGVuZ3RoID4gMCxcbiAgICAgICAgICAgICAgICdObyBFbmdsaXNoICcgKyBuYW1lICsgJyBzcGVjaWZpZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gSWRlbnRpZmljYXRpb24gaW5mb3JtYXRpb25cbiAgICBhc3NlcnROYW1lUHJlc2VudCgnZm9udEZhbWlseScpO1xuICAgIGFzc2VydE5hbWVQcmVzZW50KCd3ZWlnaHROYW1lJyk7XG4gICAgYXNzZXJ0TmFtZVByZXNlbnQoJ21hbnVmYWN0dXJlcicpO1xuICAgIGFzc2VydE5hbWVQcmVzZW50KCdjb3B5cmlnaHQnKTtcbiAgICBhc3NlcnROYW1lUHJlc2VudCgndmVyc2lvbicpO1xuXG4gICAgLy8gRGltZW5zaW9uIGluZm9ybWF0aW9uXG4gICAgYXNzZXJ0KHRoaXMudW5pdHNQZXJFbSA+IDAsICdObyB1bml0c1BlckVtIHNwZWNpZmllZC4nKTtcbn07XG5cbi8vIENvbnZlcnQgdGhlIGZvbnQgb2JqZWN0IHRvIGEgU0ZOVCBkYXRhIHN0cnVjdHVyZS5cbi8vIFRoaXMgc3RydWN0dXJlIGNvbnRhaW5zIGFsbCB0aGUgbmVjZXNzYXJ5IHRhYmxlcyBhbmQgbWV0YWRhdGEgdG8gY3JlYXRlIGEgYmluYXJ5IE9URiBmaWxlLlxuRm9udC5wcm90b3R5cGUudG9UYWJsZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2ZudC5mb250VG9UYWJsZSh0aGlzKTtcbn07XG5cbkZvbnQucHJvdG90eXBlLnRvQnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS53YXJuKCdGb250LnRvQnVmZmVyIGlzIGRlcHJlY2F0ZWQuIFVzZSBGb250LnRvQXJyYXlCdWZmZXIgaW5zdGVhZC4nKTtcbiAgICByZXR1cm4gdGhpcy50b0FycmF5QnVmZmVyKCk7XG59O1xuXG5Gb250LnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNmbnRUYWJsZSA9IHRoaXMudG9UYWJsZXMoKTtcbiAgICB2YXIgYnl0ZXMgPSBzZm50VGFibGUuZW5jb2RlKCk7XG4gICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihieXRlcy5sZW5ndGgpO1xuICAgIHZhciBpbnRBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpbnRBcnJheVtpXSA9IGJ5dGVzW2ldO1xuICAgIH1cblxuICAgIHJldHVybiBidWZmZXI7XG59O1xuXG4vLyBJbml0aWF0ZSBhIGRvd25sb2FkIG9mIHRoZSBPcGVuVHlwZSBmb250LlxuRm9udC5wcm90b3R5cGUuZG93bmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZmFtaWx5TmFtZSA9IHRoaXMuZ2V0RW5nbGlzaE5hbWUoJ2ZvbnRGYW1pbHknKTtcbiAgICB2YXIgc3R5bGVOYW1lID0gdGhpcy5nZXRFbmdsaXNoTmFtZSgnZm9udFN1YmZhbWlseScpO1xuICAgIHZhciBmaWxlTmFtZSA9IGZhbWlseU5hbWUucmVwbGFjZSgvXFxzL2csICcnKSArICctJyArIHN0eWxlTmFtZSArICcub3RmJztcbiAgICB2YXIgYXJyYXlCdWZmZXIgPSB0aGlzLnRvQXJyYXlCdWZmZXIoKTtcblxuICAgIGlmICh1dGlsLmlzQnJvd3NlcigpKSB7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0RmlsZVN5c3RlbSA9IHdpbmRvdy5yZXF1ZXN0RmlsZVN5c3RlbSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEZpbGVTeXN0ZW07XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0RmlsZVN5c3RlbSh3aW5kb3cuVEVNUE9SQVJZLCBhcnJheUJ1ZmZlci5ieXRlTGVuZ3RoLCBmdW5jdGlvbihmcykge1xuICAgICAgICAgICAgZnMucm9vdC5nZXRGaWxlKGZpbGVOYW1lLCB7Y3JlYXRlOiB0cnVlfSwgZnVuY3Rpb24oZmlsZUVudHJ5KSB7XG4gICAgICAgICAgICAgICAgZmlsZUVudHJ5LmNyZWF0ZVdyaXRlcihmdW5jdGlvbih3cml0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGFWaWV3ID0gbmV3IERhdGFWaWV3KGFycmF5QnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbZGF0YVZpZXddLCB7dHlwZTogJ2ZvbnQvb3BlbnR5cGUnfSk7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlci53cml0ZShibG9iKTtcblxuICAgICAgICAgICAgICAgICAgICB3cml0ZXIuYWRkRXZlbnRMaXN0ZW5lcignd3JpdGVlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5hdmlnYXRpbmcgdG8gdGhlIGZpbGUgd2lsbCBkb3dubG9hZCBpdC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhyZWYgPSBmaWxlRW50cnkudG9VUkwoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgICAgICB2YXIgYnVmZmVyID0gdXRpbC5hcnJheUJ1ZmZlclRvTm9kZUJ1ZmZlcihhcnJheUJ1ZmZlcik7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZU5hbWUsIGJ1ZmZlcik7XG4gICAgfVxufTtcblxuZXhwb3J0cy5Gb250ID0gRm9udDtcbiIsIi8vIFRoZSBHbHlwaCBvYmplY3RcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2hlY2sgPSByZXF1aXJlKCcuL2NoZWNrJyk7XG52YXIgZHJhdyA9IHJlcXVpcmUoJy4vZHJhdycpO1xudmFyIHBhdGggPSByZXF1aXJlKCcuL3BhdGgnKTtcblxuZnVuY3Rpb24gZ2V0UGF0aERlZmluaXRpb24oZ2x5cGgsIHBhdGgpIHtcbiAgICB2YXIgX3BhdGggPSBwYXRoIHx8IHsgY29tbWFuZHM6IFtdIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIF9wYXRoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgX3BhdGggPSBfcGF0aCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gX3BhdGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0OiBmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICBfcGF0aCA9IHA7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBBIEdseXBoIGlzIGFuIGluZGl2aWR1YWwgbWFyayB0aGF0IG9mdGVuIGNvcnJlc3BvbmRzIHRvIGEgY2hhcmFjdGVyLlxuLy8gU29tZSBnbHlwaHMsIHN1Y2ggYXMgbGlnYXR1cmVzLCBhcmUgYSBjb21iaW5hdGlvbiBvZiBtYW55IGNoYXJhY3RlcnMuXG4vLyBHbHlwaHMgYXJlIHRoZSBiYXNpYyBidWlsZGluZyBibG9ja3Mgb2YgYSBmb250LlxuLy9cbi8vIFRoZSBgR2x5cGhgIGNsYXNzIGNvbnRhaW5zIHV0aWxpdHkgbWV0aG9kcyBmb3IgZHJhd2luZyB0aGUgcGF0aCBhbmQgaXRzIHBvaW50cy5cbmZ1bmN0aW9uIEdseXBoKG9wdGlvbnMpIHtcbiAgICAvLyBCeSBwdXR0aW5nIGFsbCB0aGUgY29kZSBvbiBhIHByb3RvdHlwZSBmdW5jdGlvbiAod2hpY2ggaXMgb25seSBkZWNsYXJlZCBvbmNlKVxuICAgIC8vIHdlIHJlZHVjZSB0aGUgbWVtb3J5IHJlcXVpcmVtZW50cyBmb3IgbGFyZ2VyIGZvbnRzIGJ5IHNvbWUgMiVcbiAgICB0aGlzLmJpbmRDb25zdHJ1Y3RvclZhbHVlcyhvcHRpb25zKTtcbn1cblxuR2x5cGgucHJvdG90eXBlLmJpbmRDb25zdHJ1Y3RvclZhbHVlcyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB0aGlzLmluZGV4ID0gb3B0aW9ucy5pbmRleCB8fCAwO1xuXG4gICAgLy8gVGhlc2UgdGhyZWUgdmFsdWVzIGNhbm5ub3QgYmUgZGVmZXJyZWQgZm9yIG1lbW9yeSBvcHRpbWl6YXRpb246XG4gICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lIHx8IG51bGw7XG4gICAgdGhpcy51bmljb2RlID0gb3B0aW9ucy51bmljb2RlIHx8IHVuZGVmaW5lZDtcbiAgICB0aGlzLnVuaWNvZGVzID0gb3B0aW9ucy51bmljb2RlcyB8fCBvcHRpb25zLnVuaWNvZGUgIT09IHVuZGVmaW5lZCA/IFtvcHRpb25zLnVuaWNvZGVdIDogW107XG5cbiAgICAvLyBCdXQgYnkgYmluZGluZyB0aGVzZSB2YWx1ZXMgb25seSB3aGVuIG5lY2Vzc2FyeSwgd2UgcmVkdWNlIGNhblxuICAgIC8vIHRoZSBtZW1vcnkgcmVxdWlyZW1lbnRzIGJ5IGFsbW9zdCAzJSBmb3IgbGFyZ2VyIGZvbnRzLlxuICAgIGlmIChvcHRpb25zLnhNaW4pIHtcbiAgICAgICAgdGhpcy54TWluID0gb3B0aW9ucy54TWluO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnlNaW4pIHtcbiAgICAgICAgdGhpcy55TWluID0gb3B0aW9ucy55TWluO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnhNYXgpIHtcbiAgICAgICAgdGhpcy54TWF4ID0gb3B0aW9ucy54TWF4O1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnlNYXgpIHtcbiAgICAgICAgdGhpcy55TWF4ID0gb3B0aW9ucy55TWF4O1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmFkdmFuY2VXaWR0aCkge1xuICAgICAgICB0aGlzLmFkdmFuY2VXaWR0aCA9IG9wdGlvbnMuYWR2YW5jZVdpZHRoO1xuICAgIH1cblxuICAgIC8vIFRoZSBwYXRoIGZvciBhIGdseXBoIGlzIHRoZSBtb3N0IG1lbW9yeSBpbnRlbnNpdmUsIGFuZCBpcyBib3VuZCBhcyBhIHZhbHVlXG4gICAgLy8gd2l0aCBhIGdldHRlci9zZXR0ZXIgdG8gZW5zdXJlIHdlIGFjdHVhbGx5IGRvIHBhdGggcGFyc2luZyBvbmx5IG9uY2UgdGhlXG4gICAgLy8gcGF0aCBpcyBhY3R1YWxseSBuZWVkZWQgYnkgYW55dGhpbmcuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdwYXRoJywgZ2V0UGF0aERlZmluaXRpb24odGhpcywgb3B0aW9ucy5wYXRoKSk7XG59O1xuXG5HbHlwaC5wcm90b3R5cGUuYWRkVW5pY29kZSA9IGZ1bmN0aW9uKHVuaWNvZGUpIHtcbiAgICBpZiAodGhpcy51bmljb2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy51bmljb2RlID0gdW5pY29kZTtcbiAgICB9XG5cbiAgICB0aGlzLnVuaWNvZGVzLnB1c2godW5pY29kZSk7XG59O1xuXG4vLyBDb252ZXJ0IHRoZSBnbHlwaCB0byBhIFBhdGggd2UgY2FuIGRyYXcgb24gYSBkcmF3aW5nIGNvbnRleHQuXG4vL1xuLy8geCAtIEhvcml6b250YWwgcG9zaXRpb24gb2YgdGhlIGdseXBoLiAoZGVmYXVsdDogMClcbi8vIHkgLSBWZXJ0aWNhbCBwb3NpdGlvbiBvZiB0aGUgKmJhc2VsaW5lKiBvZiB0aGUgZ2x5cGguIChkZWZhdWx0OiAwKVxuLy8gZm9udFNpemUgLSBGb250IHNpemUsIGluIHBpeGVscyAoZGVmYXVsdDogNzIpLlxuR2x5cGgucHJvdG90eXBlLmdldFBhdGggPSBmdW5jdGlvbih4LCB5LCBmb250U2l6ZSkge1xuICAgIHggPSB4ICE9PSB1bmRlZmluZWQgPyB4IDogMDtcbiAgICB5ID0geSAhPT0gdW5kZWZpbmVkID8geSA6IDA7XG4gICAgZm9udFNpemUgPSBmb250U2l6ZSAhPT0gdW5kZWZpbmVkID8gZm9udFNpemUgOiA3MjtcbiAgICB2YXIgc2NhbGUgPSAxIC8gdGhpcy5wYXRoLnVuaXRzUGVyRW0gKiBmb250U2l6ZTtcbiAgICB2YXIgcCA9IG5ldyBwYXRoLlBhdGgoKTtcbiAgICB2YXIgY29tbWFuZHMgPSB0aGlzLnBhdGguY29tbWFuZHM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb21tYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgY21kID0gY29tbWFuZHNbaV07XG4gICAgICAgIGlmIChjbWQudHlwZSA9PT0gJ00nKSB7XG4gICAgICAgICAgICBwLm1vdmVUbyh4ICsgKGNtZC54ICogc2NhbGUpLCB5ICsgKC1jbWQueSAqIHNjYWxlKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY21kLnR5cGUgPT09ICdMJykge1xuICAgICAgICAgICAgcC5saW5lVG8oeCArIChjbWQueCAqIHNjYWxlKSwgeSArICgtY21kLnkgKiBzY2FsZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKGNtZC50eXBlID09PSAnUScpIHtcbiAgICAgICAgICAgIHAucXVhZHJhdGljQ3VydmVUbyh4ICsgKGNtZC54MSAqIHNjYWxlKSwgeSArICgtY21kLnkxICogc2NhbGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggKyAoY21kLnggKiBzY2FsZSksIHkgKyAoLWNtZC55ICogc2NhbGUpKTtcbiAgICAgICAgfSBlbHNlIGlmIChjbWQudHlwZSA9PT0gJ0MnKSB7XG4gICAgICAgICAgICBwLmN1cnZlVG8oeCArIChjbWQueDEgKiBzY2FsZSksIHkgKyAoLWNtZC55MSAqIHNjYWxlKSxcbiAgICAgICAgICAgICAgICAgICAgICB4ICsgKGNtZC54MiAqIHNjYWxlKSwgeSArICgtY21kLnkyICogc2NhbGUpLFxuICAgICAgICAgICAgICAgICAgICAgIHggKyAoY21kLnggKiBzY2FsZSksIHkgKyAoLWNtZC55ICogc2NhbGUpKTtcbiAgICAgICAgfSBlbHNlIGlmIChjbWQudHlwZSA9PT0gJ1onKSB7XG4gICAgICAgICAgICBwLmNsb3NlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHA7XG59O1xuXG4vLyBTcGxpdCB0aGUgZ2x5cGggaW50byBjb250b3Vycy5cbi8vIFRoaXMgZnVuY3Rpb24gaXMgaGVyZSBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHksIGFuZCB0b1xuLy8gcHJvdmlkZSByYXcgYWNjZXNzIHRvIHRoZSBUcnVlVHlwZSBnbHlwaCBvdXRsaW5lcy5cbkdseXBoLnByb3RvdHlwZS5nZXRDb250b3VycyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnBvaW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICB2YXIgY29udG91cnMgPSBbXTtcbiAgICB2YXIgY3VycmVudENvbnRvdXIgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucG9pbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBwdCA9IHRoaXMucG9pbnRzW2ldO1xuICAgICAgICBjdXJyZW50Q29udG91ci5wdXNoKHB0KTtcbiAgICAgICAgaWYgKHB0Lmxhc3RQb2ludE9mQ29udG91cikge1xuICAgICAgICAgICAgY29udG91cnMucHVzaChjdXJyZW50Q29udG91cik7XG4gICAgICAgICAgICBjdXJyZW50Q29udG91ciA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2suYXJndW1lbnQoY3VycmVudENvbnRvdXIubGVuZ3RoID09PSAwLCAnVGhlcmUgYXJlIHN0aWxsIHBvaW50cyBsZWZ0IGluIHRoZSBjdXJyZW50IGNvbnRvdXIuJyk7XG4gICAgcmV0dXJuIGNvbnRvdXJzO1xufTtcblxuLy8gQ2FsY3VsYXRlIHRoZSB4TWluL3lNaW4veE1heC95TWF4L2xzYi9yc2IgZm9yIGEgR2x5cGguXG5HbHlwaC5wcm90b3R5cGUuZ2V0TWV0cmljcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb21tYW5kcyA9IHRoaXMucGF0aC5jb21tYW5kcztcbiAgICB2YXIgeENvb3JkcyA9IFtdO1xuICAgIHZhciB5Q29vcmRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb21tYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgY21kID0gY29tbWFuZHNbaV07XG4gICAgICAgIGlmIChjbWQudHlwZSAhPT0gJ1onKSB7XG4gICAgICAgICAgICB4Q29vcmRzLnB1c2goY21kLngpO1xuICAgICAgICAgICAgeUNvb3Jkcy5wdXNoKGNtZC55KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjbWQudHlwZSA9PT0gJ1EnIHx8IGNtZC50eXBlID09PSAnQycpIHtcbiAgICAgICAgICAgIHhDb29yZHMucHVzaChjbWQueDEpO1xuICAgICAgICAgICAgeUNvb3Jkcy5wdXNoKGNtZC55MSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY21kLnR5cGUgPT09ICdDJykge1xuICAgICAgICAgICAgeENvb3Jkcy5wdXNoKGNtZC54Mik7XG4gICAgICAgICAgICB5Q29vcmRzLnB1c2goY21kLnkyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBtZXRyaWNzID0ge1xuICAgICAgICB4TWluOiBNYXRoLm1pbi5hcHBseShudWxsLCB4Q29vcmRzKSxcbiAgICAgICAgeU1pbjogTWF0aC5taW4uYXBwbHkobnVsbCwgeUNvb3JkcyksXG4gICAgICAgIHhNYXg6IE1hdGgubWF4LmFwcGx5KG51bGwsIHhDb29yZHMpLFxuICAgICAgICB5TWF4OiBNYXRoLm1heC5hcHBseShudWxsLCB5Q29vcmRzKSxcbiAgICAgICAgbGVmdFNpZGVCZWFyaW5nOiB0aGlzLmxlZnRTaWRlQmVhcmluZ1xuICAgIH07XG5cbiAgICBpZiAoIWlzRmluaXRlKG1ldHJpY3MueE1pbikpIHtcbiAgICAgICAgbWV0cmljcy54TWluID0gMDtcbiAgICB9XG5cbiAgICBpZiAoIWlzRmluaXRlKG1ldHJpY3MueE1heCkpIHtcbiAgICAgICAgbWV0cmljcy54TWF4ID0gdGhpcy5hZHZhbmNlV2lkdGg7XG4gICAgfVxuXG4gICAgaWYgKCFpc0Zpbml0ZShtZXRyaWNzLnlNaW4pKSB7XG4gICAgICAgIG1ldHJpY3MueU1pbiA9IDA7XG4gICAgfVxuXG4gICAgaWYgKCFpc0Zpbml0ZShtZXRyaWNzLnlNYXgpKSB7XG4gICAgICAgIG1ldHJpY3MueU1heCA9IDA7XG4gICAgfVxuXG4gICAgbWV0cmljcy5yaWdodFNpZGVCZWFyaW5nID0gdGhpcy5hZHZhbmNlV2lkdGggLSBtZXRyaWNzLmxlZnRTaWRlQmVhcmluZyAtIChtZXRyaWNzLnhNYXggLSBtZXRyaWNzLnhNaW4pO1xuICAgIHJldHVybiBtZXRyaWNzO1xufTtcblxuLy8gRHJhdyB0aGUgZ2x5cGggb24gdGhlIGdpdmVuIGNvbnRleHQuXG4vL1xuLy8gY3R4IC0gVGhlIGRyYXdpbmcgY29udGV4dC5cbi8vIHggLSBIb3Jpem9udGFsIHBvc2l0aW9uIG9mIHRoZSBnbHlwaC4gKGRlZmF1bHQ6IDApXG4vLyB5IC0gVmVydGljYWwgcG9zaXRpb24gb2YgdGhlICpiYXNlbGluZSogb2YgdGhlIGdseXBoLiAoZGVmYXVsdDogMClcbi8vIGZvbnRTaXplIC0gRm9udCBzaXplLCBpbiBwaXhlbHMgKGRlZmF1bHQ6IDcyKS5cbkdseXBoLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4LCB4LCB5LCBmb250U2l6ZSkge1xuICAgIHRoaXMuZ2V0UGF0aCh4LCB5LCBmb250U2l6ZSkuZHJhdyhjdHgpO1xufTtcblxuLy8gRHJhdyB0aGUgcG9pbnRzIG9mIHRoZSBnbHlwaC5cbi8vIE9uLWN1cnZlIHBvaW50cyB3aWxsIGJlIGRyYXduIGluIGJsdWUsIG9mZi1jdXJ2ZSBwb2ludHMgd2lsbCBiZSBkcmF3biBpbiByZWQuXG4vL1xuLy8gY3R4IC0gVGhlIGRyYXdpbmcgY29udGV4dC5cbi8vIHggLSBIb3Jpem9udGFsIHBvc2l0aW9uIG9mIHRoZSBnbHlwaC4gKGRlZmF1bHQ6IDApXG4vLyB5IC0gVmVydGljYWwgcG9zaXRpb24gb2YgdGhlICpiYXNlbGluZSogb2YgdGhlIGdseXBoLiAoZGVmYXVsdDogMClcbi8vIGZvbnRTaXplIC0gRm9udCBzaXplLCBpbiBwaXhlbHMgKGRlZmF1bHQ6IDcyKS5cbkdseXBoLnByb3RvdHlwZS5kcmF3UG9pbnRzID0gZnVuY3Rpb24oY3R4LCB4LCB5LCBmb250U2l6ZSkge1xuXG4gICAgZnVuY3Rpb24gZHJhd0NpcmNsZXMobCwgeCwgeSwgc2NhbGUpIHtcbiAgICAgICAgdmFyIFBJX1NRID0gTWF0aC5QSSAqIDI7XG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgICBjdHgubW92ZVRvKHggKyAobFtqXS54ICogc2NhbGUpLCB5ICsgKGxbal0ueSAqIHNjYWxlKSk7XG4gICAgICAgICAgICBjdHguYXJjKHggKyAobFtqXS54ICogc2NhbGUpLCB5ICsgKGxbal0ueSAqIHNjYWxlKSwgMiwgMCwgUElfU1EsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgY3R4LmZpbGwoKTtcbiAgICB9XG5cbiAgICB4ID0geCAhPT0gdW5kZWZpbmVkID8geCA6IDA7XG4gICAgeSA9IHkgIT09IHVuZGVmaW5lZCA/IHkgOiAwO1xuICAgIGZvbnRTaXplID0gZm9udFNpemUgIT09IHVuZGVmaW5lZCA/IGZvbnRTaXplIDogMjQ7XG4gICAgdmFyIHNjYWxlID0gMSAvIHRoaXMucGF0aC51bml0c1BlckVtICogZm9udFNpemU7XG5cbiAgICB2YXIgYmx1ZUNpcmNsZXMgPSBbXTtcbiAgICB2YXIgcmVkQ2lyY2xlcyA9IFtdO1xuICAgIHZhciBwYXRoID0gdGhpcy5wYXRoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5jb21tYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgY21kID0gcGF0aC5jb21tYW5kc1tpXTtcbiAgICAgICAgaWYgKGNtZC54ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGJsdWVDaXJjbGVzLnB1c2goe3g6IGNtZC54LCB5OiAtY21kLnl9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjbWQueDEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVkQ2lyY2xlcy5wdXNoKHt4OiBjbWQueDEsIHk6IC1jbWQueTF9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjbWQueDIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVkQ2lyY2xlcy5wdXNoKHt4OiBjbWQueDIsIHk6IC1jbWQueTJ9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGN0eC5maWxsU3R5bGUgPSAnYmx1ZSc7XG4gICAgZHJhd0NpcmNsZXMoYmx1ZUNpcmNsZXMsIHgsIHksIHNjYWxlKTtcbiAgICBjdHguZmlsbFN0eWxlID0gJ3JlZCc7XG4gICAgZHJhd0NpcmNsZXMocmVkQ2lyY2xlcywgeCwgeSwgc2NhbGUpO1xufTtcblxuLy8gRHJhdyBsaW5lcyBpbmRpY2F0aW5nIGltcG9ydGFudCBmb250IG1lYXN1cmVtZW50cy5cbi8vIEJsYWNrIGxpbmVzIGluZGljYXRlIHRoZSBvcmlnaW4gb2YgdGhlIGNvb3JkaW5hdGUgc3lzdGVtIChwb2ludCAwLDApLlxuLy8gQmx1ZSBsaW5lcyBpbmRpY2F0ZSB0aGUgZ2x5cGggYm91bmRpbmcgYm94LlxuLy8gR3JlZW4gbGluZSBpbmRpY2F0ZXMgdGhlIGFkdmFuY2Ugd2lkdGggb2YgdGhlIGdseXBoLlxuLy9cbi8vIGN0eCAtIFRoZSBkcmF3aW5nIGNvbnRleHQuXG4vLyB4IC0gSG9yaXpvbnRhbCBwb3NpdGlvbiBvZiB0aGUgZ2x5cGguIChkZWZhdWx0OiAwKVxuLy8geSAtIFZlcnRpY2FsIHBvc2l0aW9uIG9mIHRoZSAqYmFzZWxpbmUqIG9mIHRoZSBnbHlwaC4gKGRlZmF1bHQ6IDApXG4vLyBmb250U2l6ZSAtIEZvbnQgc2l6ZSwgaW4gcGl4ZWxzIChkZWZhdWx0OiA3MikuXG5HbHlwaC5wcm90b3R5cGUuZHJhd01ldHJpY3MgPSBmdW5jdGlvbihjdHgsIHgsIHksIGZvbnRTaXplKSB7XG4gICAgdmFyIHNjYWxlO1xuICAgIHggPSB4ICE9PSB1bmRlZmluZWQgPyB4IDogMDtcbiAgICB5ID0geSAhPT0gdW5kZWZpbmVkID8geSA6IDA7XG4gICAgZm9udFNpemUgPSBmb250U2l6ZSAhPT0gdW5kZWZpbmVkID8gZm9udFNpemUgOiAyNDtcbiAgICBzY2FsZSA9IDEgLyB0aGlzLnBhdGgudW5pdHNQZXJFbSAqIGZvbnRTaXplO1xuICAgIGN0eC5saW5lV2lkdGggPSAxO1xuXG4gICAgLy8gRHJhdyB0aGUgb3JpZ2luXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gJ2JsYWNrJztcbiAgICBkcmF3LmxpbmUoY3R4LCB4LCAtMTAwMDAsIHgsIDEwMDAwKTtcbiAgICBkcmF3LmxpbmUoY3R4LCAtMTAwMDAsIHksIDEwMDAwLCB5KTtcblxuICAgIC8vIFRoaXMgY29kZSBpcyBoZXJlIGR1ZSB0byBtZW1vcnkgb3B0aW1pemF0aW9uOiBieSBub3QgdXNpbmdcbiAgICAvLyBkZWZhdWx0cyBpbiB0aGUgY29uc3RydWN0b3IsIHdlIHNhdmUgYSBub3RhYmxlIGFtb3VudCBvZiBtZW1vcnkuXG4gICAgdmFyIHhNaW4gPSB0aGlzLnhNaW4gfHwgMDtcbiAgICB2YXIgeU1pbiA9IHRoaXMueU1pbiB8fCAwO1xuICAgIHZhciB4TWF4ID0gdGhpcy54TWF4IHx8IDA7XG4gICAgdmFyIHlNYXggPSB0aGlzLnlNYXggfHwgMDtcbiAgICB2YXIgYWR2YW5jZVdpZHRoID0gdGhpcy5hZHZhbmNlV2lkdGggfHwgMDtcblxuICAgIC8vIERyYXcgdGhlIGdseXBoIGJveFxuICAgIGN0eC5zdHJva2VTdHlsZSA9ICdibHVlJztcbiAgICBkcmF3LmxpbmUoY3R4LCB4ICsgKHhNaW4gKiBzY2FsZSksIC0xMDAwMCwgeCArICh4TWluICogc2NhbGUpLCAxMDAwMCk7XG4gICAgZHJhdy5saW5lKGN0eCwgeCArICh4TWF4ICogc2NhbGUpLCAtMTAwMDAsIHggKyAoeE1heCAqIHNjYWxlKSwgMTAwMDApO1xuICAgIGRyYXcubGluZShjdHgsIC0xMDAwMCwgeSArICgteU1pbiAqIHNjYWxlKSwgMTAwMDAsIHkgKyAoLXlNaW4gKiBzY2FsZSkpO1xuICAgIGRyYXcubGluZShjdHgsIC0xMDAwMCwgeSArICgteU1heCAqIHNjYWxlKSwgMTAwMDAsIHkgKyAoLXlNYXggKiBzY2FsZSkpO1xuXG4gICAgLy8gRHJhdyB0aGUgYWR2YW5jZSB3aWR0aFxuICAgIGN0eC5zdHJva2VTdHlsZSA9ICdncmVlbic7XG4gICAgZHJhdy5saW5lKGN0eCwgeCArIChhZHZhbmNlV2lkdGggKiBzY2FsZSksIC0xMDAwMCwgeCArIChhZHZhbmNlV2lkdGggKiBzY2FsZSksIDEwMDAwKTtcbn07XG5cbmV4cG9ydHMuR2x5cGggPSBHbHlwaDtcbiIsIi8vIFRoZSBHbHlwaFNldCBvYmplY3RcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2dseXBoID0gcmVxdWlyZSgnLi9nbHlwaCcpO1xuXG4vLyBBIEdseXBoU2V0IHJlcHJlc2VudHMgYWxsIGdseXBocyBhdmFpbGFibGUgaW4gdGhlIGZvbnQsIGJ1dCBtb2RlbGxlZCB1c2luZ1xuLy8gYSBkZWZlcnJlZCBnbHlwaCBsb2FkZXIsIGZvciByZXRyaWV2aW5nIGdseXBocyBvbmx5IG9uY2UgdGhleSBhcmUgYWJzb2x1dGVseVxuLy8gbmVjZXNzYXJ5LCB0byBrZWVwIHRoZSBtZW1vcnkgZm9vdHByaW50IGRvd24uXG5mdW5jdGlvbiBHbHlwaFNldChmb250LCBnbHlwaHMpIHtcbiAgICB0aGlzLmZvbnQgPSBmb250O1xuICAgIHRoaXMuZ2x5cGhzID0ge307XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZ2x5cGhzKSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdseXBocy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nbHlwaHNbaV0gPSBnbHlwaHNbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmxlbmd0aCA9IChnbHlwaHMgJiYgZ2x5cGhzLmxlbmd0aCkgfHwgMDtcbn1cblxuR2x5cGhTZXQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmdseXBoc1tpbmRleF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5nbHlwaHNbaW5kZXhdID0gdGhpcy5nbHlwaHNbaW5kZXhdKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2x5cGhzW2luZGV4XTtcbn07XG5cbkdseXBoU2V0LnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oaW5kZXgsIGxvYWRlcikge1xuICAgIHRoaXMuZ2x5cGhzW2luZGV4XSA9IGxvYWRlcjtcbiAgICB0aGlzLmxlbmd0aCsrO1xufTtcblxuZnVuY3Rpb24gZ2x5cGhMb2FkZXIoZm9udCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbmV3IF9nbHlwaC5HbHlwaCh7aW5kZXg6IGluZGV4LCBmb250OiBmb250fSk7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBzdHViIGdseXBoIHRoYXQgY2FuIGJlIGZpbGxlZCB3aXRoIGFsbCBtZXRhZGF0YSAqZXhjZXB0KlxuICogdGhlIFwicG9pbnRzXCIgYW5kIFwicGF0aFwiIHByb3BlcnRpZXMsIHdoaWNoIG11c3QgYmUgbG9hZGVkIG9ubHkgb25jZVxuICogdGhlIGdseXBoJ3MgcGF0aCBpcyBhY3R1YWxseSByZXF1ZXN0ZWQgZm9yIHRleHQgc2hhcGluZy5cbiAqL1xuXG5mdW5jdGlvbiB0dGZHbHlwaExvYWRlcihmb250LCBpbmRleCwgcGFyc2VHbHlwaCwgZGF0YSwgcG9zaXRpb24sIGJ1aWxkUGF0aCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGdseXBoID0gbmV3IF9nbHlwaC5HbHlwaCh7aW5kZXg6IGluZGV4LCBmb250OiBmb250fSk7XG5cbiAgICAgICAgZ2x5cGgucGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcGFyc2VHbHlwaChnbHlwaCwgZGF0YSwgcG9zaXRpb24pO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBidWlsZFBhdGgoZm9udC5nbHlwaHMsIGdseXBoKTtcbiAgICAgICAgICAgIHBhdGgudW5pdHNQZXJFbSA9IGZvbnQudW5pdHNQZXJFbTtcbiAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBnbHlwaDtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjZmZHbHlwaExvYWRlcihmb250LCBpbmRleCwgcGFyc2VDRkZDaGFyc3RyaW5nLCBjaGFyc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZ2x5cGggPSBuZXcgX2dseXBoLkdseXBoKHtpbmRleDogaW5kZXgsIGZvbnQ6IGZvbnR9KTtcblxuICAgICAgICBnbHlwaC5wYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHBhcnNlQ0ZGQ2hhcnN0cmluZyhmb250LCBnbHlwaCwgY2hhcnN0cmluZyk7XG4gICAgICAgICAgICBwYXRoLnVuaXRzUGVyRW0gPSBmb250LnVuaXRzUGVyRW07XG4gICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZ2x5cGg7XG4gICAgfTtcbn1cblxuZXhwb3J0cy5HbHlwaFNldCA9IEdseXBoU2V0O1xuZXhwb3J0cy5nbHlwaExvYWRlciA9IGdseXBoTG9hZGVyO1xuZXhwb3J0cy50dGZHbHlwaExvYWRlciA9IHR0ZkdseXBoTG9hZGVyO1xuZXhwb3J0cy5jZmZHbHlwaExvYWRlciA9IGNmZkdseXBoTG9hZGVyO1xuIiwiLy8gb3BlbnR5cGUuanNcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlYm94L29wZW50eXBlLmpzXG4vLyAoYykgMjAxNSBGcmVkZXJpayBEZSBCbGVzZXJcbi8vIG9wZW50eXBlLmpzIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4vKiBnbG9iYWwgRGF0YVZpZXcsIFVpbnQ4QXJyYXksIFhNTEh0dHBSZXF1ZXN0ICAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpbmZsYXRlID0gcmVxdWlyZSgndGlueS1pbmZsYXRlJyk7XG5cbnZhciBlbmNvZGluZyA9IHJlcXVpcmUoJy4vZW5jb2RpbmcnKTtcbnZhciBfZm9udCA9IHJlcXVpcmUoJy4vZm9udCcpO1xudmFyIGdseXBoID0gcmVxdWlyZSgnLi9nbHlwaCcpO1xudmFyIHBhcnNlID0gcmVxdWlyZSgnLi9wYXJzZScpO1xudmFyIHBhdGggPSByZXF1aXJlKCcuL3BhdGgnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBjbWFwID0gcmVxdWlyZSgnLi90YWJsZXMvY21hcCcpO1xudmFyIGNmZiA9IHJlcXVpcmUoJy4vdGFibGVzL2NmZicpO1xudmFyIGZ2YXIgPSByZXF1aXJlKCcuL3RhYmxlcy9mdmFyJyk7XG52YXIgZ2x5ZiA9IHJlcXVpcmUoJy4vdGFibGVzL2dseWYnKTtcbnZhciBncG9zID0gcmVxdWlyZSgnLi90YWJsZXMvZ3BvcycpO1xudmFyIGhlYWQgPSByZXF1aXJlKCcuL3RhYmxlcy9oZWFkJyk7XG52YXIgaGhlYSA9IHJlcXVpcmUoJy4vdGFibGVzL2hoZWEnKTtcbnZhciBobXR4ID0gcmVxdWlyZSgnLi90YWJsZXMvaG10eCcpO1xudmFyIGtlcm4gPSByZXF1aXJlKCcuL3RhYmxlcy9rZXJuJyk7XG52YXIgbHRhZyA9IHJlcXVpcmUoJy4vdGFibGVzL2x0YWcnKTtcbnZhciBsb2NhID0gcmVxdWlyZSgnLi90YWJsZXMvbG9jYScpO1xudmFyIG1heHAgPSByZXF1aXJlKCcuL3RhYmxlcy9tYXhwJyk7XG52YXIgX25hbWUgPSByZXF1aXJlKCcuL3RhYmxlcy9uYW1lJyk7XG52YXIgb3MyID0gcmVxdWlyZSgnLi90YWJsZXMvb3MyJyk7XG52YXIgcG9zdCA9IHJlcXVpcmUoJy4vdGFibGVzL3Bvc3QnKTtcblxuLy8gRmlsZSBsb2FkZXJzIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBsb2FkRnJvbUZpbGUocGF0aCwgY2FsbGJhY2spIHtcbiAgICB2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgIGZzLnJlYWRGaWxlKHBhdGgsIGZ1bmN0aW9uKGVyciwgYnVmZmVyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIubWVzc2FnZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhudWxsLCB1dGlsLm5vZGVCdWZmZXJUb0FycmF5QnVmZmVyKGJ1ZmZlcikpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBsb2FkRnJvbVVybCh1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICByZXF1ZXN0Lm9wZW4oJ2dldCcsIHVybCwgdHJ1ZSk7XG4gICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChyZXF1ZXN0LnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0ZvbnQgY291bGQgbm90IGJlIGxvYWRlZDogJyArIHJlcXVlc3Quc3RhdHVzVGV4dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcmVxdWVzdC5yZXNwb25zZSk7XG4gICAgfTtcblxuICAgIHJlcXVlc3Quc2VuZCgpO1xufVxuXG4vLyBUYWJsZSBEaXJlY3RvcnkgRW50cmllcyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIHBhcnNlT3BlblR5cGVUYWJsZUVudHJpZXMoZGF0YSwgbnVtVGFibGVzKSB7XG4gICAgdmFyIHRhYmxlRW50cmllcyA9IFtdO1xuICAgIHZhciBwID0gMTI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkgKz0gMSkge1xuICAgICAgICB2YXIgdGFnID0gcGFyc2UuZ2V0VGFnKGRhdGEsIHApO1xuICAgICAgICB2YXIgY2hlY2tzdW0gPSBwYXJzZS5nZXRVTG9uZyhkYXRhLCBwICsgNCk7XG4gICAgICAgIHZhciBvZmZzZXQgPSBwYXJzZS5nZXRVTG9uZyhkYXRhLCBwICsgOCk7XG4gICAgICAgIHZhciBsZW5ndGggPSBwYXJzZS5nZXRVTG9uZyhkYXRhLCBwICsgMTIpO1xuICAgICAgICB0YWJsZUVudHJpZXMucHVzaCh7dGFnOiB0YWcsIGNoZWNrc3VtOiBjaGVja3N1bSwgb2Zmc2V0OiBvZmZzZXQsIGxlbmd0aDogbGVuZ3RoLCBjb21wcmVzc2lvbjogZmFsc2V9KTtcbiAgICAgICAgcCArPSAxNjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFibGVFbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBwYXJzZVdPRkZUYWJsZUVudHJpZXMoZGF0YSwgbnVtVGFibGVzKSB7XG4gICAgdmFyIHRhYmxlRW50cmllcyA9IFtdO1xuICAgIHZhciBwID0gNDQ7IC8vIG9mZnNldCB0byB0aGUgZmlyc3QgdGFibGUgZGlyZWN0b3J5IGVudHJ5LlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtVGFibGVzOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHRhZyA9IHBhcnNlLmdldFRhZyhkYXRhLCBwKTtcbiAgICAgICAgdmFyIG9mZnNldCA9IHBhcnNlLmdldFVMb25nKGRhdGEsIHAgKyA0KTtcbiAgICAgICAgdmFyIGNvbXBMZW5ndGggPSBwYXJzZS5nZXRVTG9uZyhkYXRhLCBwICsgOCk7XG4gICAgICAgIHZhciBvcmlnTGVuZ3RoID0gcGFyc2UuZ2V0VUxvbmcoZGF0YSwgcCArIDEyKTtcbiAgICAgICAgdmFyIGNvbXByZXNzaW9uO1xuICAgICAgICBpZiAoY29tcExlbmd0aCA8IG9yaWdMZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbXByZXNzaW9uID0gJ1dPRkYnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29tcHJlc3Npb24gPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhYmxlRW50cmllcy5wdXNoKHt0YWc6IHRhZywgb2Zmc2V0OiBvZmZzZXQsIGNvbXByZXNzaW9uOiBjb21wcmVzc2lvbixcbiAgICAgICAgICAgIGNvbXByZXNzZWRMZW5ndGg6IGNvbXBMZW5ndGgsIG9yaWdpbmFsTGVuZ3RoOiBvcmlnTGVuZ3RofSk7XG4gICAgICAgIHAgKz0gMjA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYmxlRW50cmllcztcbn1cblxuZnVuY3Rpb24gdW5jb21wcmVzc1RhYmxlKGRhdGEsIHRhYmxlRW50cnkpIHtcbiAgICBpZiAodGFibGVFbnRyeS5jb21wcmVzc2lvbiA9PT0gJ1dPRkYnKSB7XG4gICAgICAgIHZhciBpbkJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGRhdGEuYnVmZmVyLCB0YWJsZUVudHJ5Lm9mZnNldCArIDIsIHRhYmxlRW50cnkuY29tcHJlc3NlZExlbmd0aCAtIDIpO1xuICAgICAgICB2YXIgb3V0QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkodGFibGVFbnRyeS5vcmlnaW5hbExlbmd0aCk7XG4gICAgICAgIGluZmxhdGUoaW5CdWZmZXIsIG91dEJ1ZmZlcik7XG4gICAgICAgIGlmIChvdXRCdWZmZXIuYnl0ZUxlbmd0aCAhPT0gdGFibGVFbnRyeS5vcmlnaW5hbExlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWNvbXByZXNzaW9uIGVycm9yOiAnICsgdGFibGVFbnRyeS50YWcgKyAnIGRlY29tcHJlc3NlZCBsZW5ndGggZG9lc25cXCd0IG1hdGNoIHJlY29yZGVkIGxlbmd0aCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgRGF0YVZpZXcob3V0QnVmZmVyLmJ1ZmZlciwgMCk7XG4gICAgICAgIHJldHVybiB7ZGF0YTogdmlldywgb2Zmc2V0OiAwfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge2RhdGE6IGRhdGEsIG9mZnNldDogdGFibGVFbnRyeS5vZmZzZXR9O1xuICAgIH1cbn1cblxuLy8gUHVibGljIEFQSSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLyBQYXJzZSB0aGUgT3BlblR5cGUgZmlsZSBkYXRhIChhcyBhbiBBcnJheUJ1ZmZlcikgYW5kIHJldHVybiBhIEZvbnQgb2JqZWN0LlxuLy8gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSBmb250IGNvdWxkIG5vdCBiZSBwYXJzZWQuXG5mdW5jdGlvbiBwYXJzZUJ1ZmZlcihidWZmZXIpIHtcbiAgICB2YXIgaW5kZXhUb0xvY0Zvcm1hdDtcbiAgICB2YXIgbHRhZ1RhYmxlO1xuXG4gICAgLy8gU2luY2UgdGhlIGNvbnN0cnVjdG9yIGNhbiBhbHNvIGJlIGNhbGxlZCB0byBjcmVhdGUgbmV3IGZvbnRzIGZyb20gc2NyYXRjaCwgd2UgaW5kaWNhdGUgdGhpc1xuICAgIC8vIHNob3VsZCBiZSBhbiBlbXB0eSBmb250IHRoYXQgd2UnbGwgZmlsbCB3aXRoIG91ciBvd24gZGF0YS5cbiAgICB2YXIgZm9udCA9IG5ldyBfZm9udC5Gb250KHtlbXB0eTogdHJ1ZX0pO1xuXG4gICAgLy8gT3BlblR5cGUgZm9udHMgdXNlIGJpZyBlbmRpYW4gYnl0ZSBvcmRlcmluZy5cbiAgICAvLyBXZSBjYW4ndCByZWx5IG9uIHR5cGVkIGFycmF5IHZpZXcgdHlwZXMsIGJlY2F1c2UgdGhleSBvcGVyYXRlIHdpdGggdGhlIGVuZGlhbm5lc3Mgb2YgdGhlIGhvc3QgY29tcHV0ZXIuXG4gICAgLy8gSW5zdGVhZCB3ZSB1c2UgRGF0YVZpZXdzIHdoZXJlIHdlIGNhbiBzcGVjaWZ5IGVuZGlhbm5lc3MuXG4gICAgdmFyIGRhdGEgPSBuZXcgRGF0YVZpZXcoYnVmZmVyLCAwKTtcbiAgICB2YXIgbnVtVGFibGVzO1xuICAgIHZhciB0YWJsZUVudHJpZXMgPSBbXTtcbiAgICB2YXIgc2lnbmF0dXJlID0gcGFyc2UuZ2V0VGFnKGRhdGEsIDApO1xuICAgIGlmIChzaWduYXR1cmUgPT09IFN0cmluZy5mcm9tQ2hhckNvZGUoMCwgMSwgMCwgMCkpIHtcbiAgICAgICAgZm9udC5vdXRsaW5lc0Zvcm1hdCA9ICd0cnVldHlwZSc7XG4gICAgICAgIG51bVRhYmxlcyA9IHBhcnNlLmdldFVTaG9ydChkYXRhLCA0KTtcbiAgICAgICAgdGFibGVFbnRyaWVzID0gcGFyc2VPcGVuVHlwZVRhYmxlRW50cmllcyhkYXRhLCBudW1UYWJsZXMpO1xuICAgIH0gZWxzZSBpZiAoc2lnbmF0dXJlID09PSAnT1RUTycpIHtcbiAgICAgICAgZm9udC5vdXRsaW5lc0Zvcm1hdCA9ICdjZmYnO1xuICAgICAgICBudW1UYWJsZXMgPSBwYXJzZS5nZXRVU2hvcnQoZGF0YSwgNCk7XG4gICAgICAgIHRhYmxlRW50cmllcyA9IHBhcnNlT3BlblR5cGVUYWJsZUVudHJpZXMoZGF0YSwgbnVtVGFibGVzKTtcbiAgICB9IGVsc2UgaWYgKHNpZ25hdHVyZSA9PT0gJ3dPRkYnKSB7XG4gICAgICAgIHZhciBmbGF2b3IgPSBwYXJzZS5nZXRUYWcoZGF0YSwgNCk7XG4gICAgICAgIGlmIChmbGF2b3IgPT09IFN0cmluZy5mcm9tQ2hhckNvZGUoMCwgMSwgMCwgMCkpIHtcbiAgICAgICAgICAgIGZvbnQub3V0bGluZXNGb3JtYXQgPSAndHJ1ZXR5cGUnO1xuICAgICAgICB9IGVsc2UgaWYgKGZsYXZvciA9PT0gJ09UVE8nKSB7XG4gICAgICAgICAgICBmb250Lm91dGxpbmVzRm9ybWF0ID0gJ2NmZic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIE9wZW5UeXBlIGZsYXZvciAnICsgc2lnbmF0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG51bVRhYmxlcyA9IHBhcnNlLmdldFVTaG9ydChkYXRhLCAxMik7XG4gICAgICAgIHRhYmxlRW50cmllcyA9IHBhcnNlV09GRlRhYmxlRW50cmllcyhkYXRhLCBudW1UYWJsZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgT3BlblR5cGUgc2lnbmF0dXJlICcgKyBzaWduYXR1cmUpO1xuICAgIH1cblxuICAgIHZhciBjZmZUYWJsZUVudHJ5O1xuICAgIHZhciBmdmFyVGFibGVFbnRyeTtcbiAgICB2YXIgZ2x5ZlRhYmxlRW50cnk7XG4gICAgdmFyIGdwb3NUYWJsZUVudHJ5O1xuICAgIHZhciBobXR4VGFibGVFbnRyeTtcbiAgICB2YXIga2VyblRhYmxlRW50cnk7XG4gICAgdmFyIGxvY2FUYWJsZUVudHJ5O1xuICAgIHZhciBuYW1lVGFibGVFbnRyeTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtVGFibGVzOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHRhYmxlRW50cnkgPSB0YWJsZUVudHJpZXNbaV07XG4gICAgICAgIHZhciB0YWJsZTtcbiAgICAgICAgc3dpdGNoICh0YWJsZUVudHJ5LnRhZykge1xuICAgICAgICAgICAgY2FzZSAnY21hcCc6XG4gICAgICAgICAgICAgICAgdGFibGUgPSB1bmNvbXByZXNzVGFibGUoZGF0YSwgdGFibGVFbnRyeSk7XG4gICAgICAgICAgICAgICAgZm9udC50YWJsZXMuY21hcCA9IGNtYXAucGFyc2UodGFibGUuZGF0YSwgdGFibGUub2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBmb250LmVuY29kaW5nID0gbmV3IGVuY29kaW5nLkNtYXBFbmNvZGluZyhmb250LnRhYmxlcy5jbWFwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2Z2YXInOlxuICAgICAgICAgICAgICAgIGZ2YXJUYWJsZUVudHJ5ID0gdGFibGVFbnRyeTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2hlYWQnOlxuICAgICAgICAgICAgICAgIHRhYmxlID0gdW5jb21wcmVzc1RhYmxlKGRhdGEsIHRhYmxlRW50cnkpO1xuICAgICAgICAgICAgICAgIGZvbnQudGFibGVzLmhlYWQgPSBoZWFkLnBhcnNlKHRhYmxlLmRhdGEsIHRhYmxlLm9mZnNldCk7XG4gICAgICAgICAgICAgICAgZm9udC51bml0c1BlckVtID0gZm9udC50YWJsZXMuaGVhZC51bml0c1BlckVtO1xuICAgICAgICAgICAgICAgIGluZGV4VG9Mb2NGb3JtYXQgPSBmb250LnRhYmxlcy5oZWFkLmluZGV4VG9Mb2NGb3JtYXQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdoaGVhJzpcbiAgICAgICAgICAgICAgICB0YWJsZSA9IHVuY29tcHJlc3NUYWJsZShkYXRhLCB0YWJsZUVudHJ5KTtcbiAgICAgICAgICAgICAgICBmb250LnRhYmxlcy5oaGVhID0gaGhlYS5wYXJzZSh0YWJsZS5kYXRhLCB0YWJsZS5vZmZzZXQpO1xuICAgICAgICAgICAgICAgIGZvbnQuYXNjZW5kZXIgPSBmb250LnRhYmxlcy5oaGVhLmFzY2VuZGVyO1xuICAgICAgICAgICAgICAgIGZvbnQuZGVzY2VuZGVyID0gZm9udC50YWJsZXMuaGhlYS5kZXNjZW5kZXI7XG4gICAgICAgICAgICAgICAgZm9udC5udW1iZXJPZkhNZXRyaWNzID0gZm9udC50YWJsZXMuaGhlYS5udW1iZXJPZkhNZXRyaWNzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaG10eCc6XG4gICAgICAgICAgICAgICAgaG10eFRhYmxlRW50cnkgPSB0YWJsZUVudHJ5O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbHRhZyc6XG4gICAgICAgICAgICAgICAgdGFibGUgPSB1bmNvbXByZXNzVGFibGUoZGF0YSwgdGFibGVFbnRyeSk7XG4gICAgICAgICAgICAgICAgbHRhZ1RhYmxlID0gbHRhZy5wYXJzZSh0YWJsZS5kYXRhLCB0YWJsZS5vZmZzZXQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbWF4cCc6XG4gICAgICAgICAgICAgICAgdGFibGUgPSB1bmNvbXByZXNzVGFibGUoZGF0YSwgdGFibGVFbnRyeSk7XG4gICAgICAgICAgICAgICAgZm9udC50YWJsZXMubWF4cCA9IG1heHAucGFyc2UodGFibGUuZGF0YSwgdGFibGUub2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBmb250Lm51bUdseXBocyA9IGZvbnQudGFibGVzLm1heHAubnVtR2x5cGhzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbmFtZSc6XG4gICAgICAgICAgICAgICAgbmFtZVRhYmxlRW50cnkgPSB0YWJsZUVudHJ5O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnT1MvMic6XG4gICAgICAgICAgICAgICAgdGFibGUgPSB1bmNvbXByZXNzVGFibGUoZGF0YSwgdGFibGVFbnRyeSk7XG4gICAgICAgICAgICAgICAgZm9udC50YWJsZXMub3MyID0gb3MyLnBhcnNlKHRhYmxlLmRhdGEsIHRhYmxlLm9mZnNldCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwb3N0JzpcbiAgICAgICAgICAgICAgICB0YWJsZSA9IHVuY29tcHJlc3NUYWJsZShkYXRhLCB0YWJsZUVudHJ5KTtcbiAgICAgICAgICAgICAgICBmb250LnRhYmxlcy5wb3N0ID0gcG9zdC5wYXJzZSh0YWJsZS5kYXRhLCB0YWJsZS5vZmZzZXQpO1xuICAgICAgICAgICAgICAgIGZvbnQuZ2x5cGhOYW1lcyA9IG5ldyBlbmNvZGluZy5HbHlwaE5hbWVzKGZvbnQudGFibGVzLnBvc3QpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZ2x5Zic6XG4gICAgICAgICAgICAgICAgZ2x5ZlRhYmxlRW50cnkgPSB0YWJsZUVudHJ5O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbG9jYSc6XG4gICAgICAgICAgICAgICAgbG9jYVRhYmxlRW50cnkgPSB0YWJsZUVudHJ5O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnQ0ZGICc6XG4gICAgICAgICAgICAgICAgY2ZmVGFibGVFbnRyeSA9IHRhYmxlRW50cnk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdrZXJuJzpcbiAgICAgICAgICAgICAgICBrZXJuVGFibGVFbnRyeSA9IHRhYmxlRW50cnk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdHUE9TJzpcbiAgICAgICAgICAgICAgICBncG9zVGFibGVFbnRyeSA9IHRhYmxlRW50cnk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbmFtZVRhYmxlID0gdW5jb21wcmVzc1RhYmxlKGRhdGEsIG5hbWVUYWJsZUVudHJ5KTtcbiAgICBmb250LnRhYmxlcy5uYW1lID0gX25hbWUucGFyc2UobmFtZVRhYmxlLmRhdGEsIG5hbWVUYWJsZS5vZmZzZXQsIGx0YWdUYWJsZSk7XG4gICAgZm9udC5uYW1lcyA9IGZvbnQudGFibGVzLm5hbWU7XG5cbiAgICBpZiAoZ2x5ZlRhYmxlRW50cnkgJiYgbG9jYVRhYmxlRW50cnkpIHtcbiAgICAgICAgdmFyIHNob3J0VmVyc2lvbiA9IGluZGV4VG9Mb2NGb3JtYXQgPT09IDA7XG4gICAgICAgIHZhciBsb2NhVGFibGUgPSB1bmNvbXByZXNzVGFibGUoZGF0YSwgbG9jYVRhYmxlRW50cnkpO1xuICAgICAgICB2YXIgbG9jYU9mZnNldHMgPSBsb2NhLnBhcnNlKGxvY2FUYWJsZS5kYXRhLCBsb2NhVGFibGUub2Zmc2V0LCBmb250Lm51bUdseXBocywgc2hvcnRWZXJzaW9uKTtcbiAgICAgICAgdmFyIGdseWZUYWJsZSA9IHVuY29tcHJlc3NUYWJsZShkYXRhLCBnbHlmVGFibGVFbnRyeSk7XG4gICAgICAgIGZvbnQuZ2x5cGhzID0gZ2x5Zi5wYXJzZShnbHlmVGFibGUuZGF0YSwgZ2x5ZlRhYmxlLm9mZnNldCwgbG9jYU9mZnNldHMsIGZvbnQpO1xuICAgIH0gZWxzZSBpZiAoY2ZmVGFibGVFbnRyeSkge1xuICAgICAgICB2YXIgY2ZmVGFibGUgPSB1bmNvbXByZXNzVGFibGUoZGF0YSwgY2ZmVGFibGVFbnRyeSk7XG4gICAgICAgIGNmZi5wYXJzZShjZmZUYWJsZS5kYXRhLCBjZmZUYWJsZS5vZmZzZXQsIGZvbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRm9udCBkb2VzblxcJ3QgY29udGFpbiBUcnVlVHlwZSBvciBDRkYgb3V0bGluZXMuJyk7XG4gICAgfVxuXG4gICAgdmFyIGhtdHhUYWJsZSA9IHVuY29tcHJlc3NUYWJsZShkYXRhLCBobXR4VGFibGVFbnRyeSk7XG4gICAgaG10eC5wYXJzZShobXR4VGFibGUuZGF0YSwgaG10eFRhYmxlLm9mZnNldCwgZm9udC5udW1iZXJPZkhNZXRyaWNzLCBmb250Lm51bUdseXBocywgZm9udC5nbHlwaHMpO1xuICAgIGVuY29kaW5nLmFkZEdseXBoTmFtZXMoZm9udCk7XG5cbiAgICBpZiAoa2VyblRhYmxlRW50cnkpIHtcbiAgICAgICAgdmFyIGtlcm5UYWJsZSA9IHVuY29tcHJlc3NUYWJsZShkYXRhLCBrZXJuVGFibGVFbnRyeSk7XG4gICAgICAgIGZvbnQua2VybmluZ1BhaXJzID0ga2Vybi5wYXJzZShrZXJuVGFibGUuZGF0YSwga2VyblRhYmxlLm9mZnNldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9udC5rZXJuaW5nUGFpcnMgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoZ3Bvc1RhYmxlRW50cnkpIHtcbiAgICAgICAgdmFyIGdwb3NUYWJsZSA9IHVuY29tcHJlc3NUYWJsZShkYXRhLCBncG9zVGFibGVFbnRyeSk7XG4gICAgICAgIGdwb3MucGFyc2UoZ3Bvc1RhYmxlLmRhdGEsIGdwb3NUYWJsZS5vZmZzZXQsIGZvbnQpO1xuICAgIH1cblxuICAgIGlmIChmdmFyVGFibGVFbnRyeSkge1xuICAgICAgICB2YXIgZnZhclRhYmxlID0gdW5jb21wcmVzc1RhYmxlKGRhdGEsIGZ2YXJUYWJsZUVudHJ5KTtcbiAgICAgICAgZm9udC50YWJsZXMuZnZhciA9IGZ2YXIucGFyc2UoZnZhclRhYmxlLmRhdGEsIGZ2YXJUYWJsZS5vZmZzZXQsIGZvbnQubmFtZXMpO1xuICAgIH1cblxuICAgIHJldHVybiBmb250O1xufVxuXG4vLyBBc3luY2hyb25vdXNseSBsb2FkIHRoZSBmb250IGZyb20gYSBVUkwgb3IgYSBmaWxlc3lzdGVtLiBXaGVuIGRvbmUsIGNhbGwgdGhlIGNhbGxiYWNrXG4vLyB3aXRoIHR3byBhcmd1bWVudHMgYChlcnIsIGZvbnQpYC4gVGhlIGBlcnJgIHdpbGwgYmUgbnVsbCBvbiBzdWNjZXNzLFxuLy8gdGhlIGBmb250YCBpcyBhIEZvbnQgb2JqZWN0LlxuLy9cbi8vIFdlIHVzZSB0aGUgbm9kZS5qcyBjYWxsYmFjayBjb252ZW50aW9uIHNvIHRoYXRcbi8vIG9wZW50eXBlLmpzIGNhbiBpbnRlZ3JhdGUgd2l0aCBmcmFtZXdvcmtzIGxpa2UgYXN5bmMuanMuXG5mdW5jdGlvbiBsb2FkKHVybCwgY2FsbGJhY2spIHtcbiAgICB2YXIgaXNOb2RlID0gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCc7XG4gICAgdmFyIGxvYWRGbiA9IGlzTm9kZSA/IGxvYWRGcm9tRmlsZSA6IGxvYWRGcm9tVXJsO1xuICAgIGxvYWRGbih1cmwsIGZ1bmN0aW9uKGVyciwgYXJyYXlCdWZmZXIpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZvbnQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb250ID0gcGFyc2VCdWZmZXIoYXJyYXlCdWZmZXIpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZSwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGZvbnQpO1xuICAgIH0pO1xufVxuXG4vLyBTeW5jaHJvbm91c2x5IGxvYWQgdGhlIGZvbnQgZnJvbSBhIFVSTCBvciBmaWxlLlxuLy8gV2hlbiBkb25lLCByZXR1cm4gdGhlIGZvbnQgb2JqZWN0IG9yIHRocm93IGFuIGVycm9yLlxuZnVuY3Rpb24gbG9hZFN5bmModXJsKSB7XG4gICAgdmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbiAgICB2YXIgYnVmZmVyID0gZnMucmVhZEZpbGVTeW5jKHVybCk7XG4gICAgcmV0dXJuIHBhcnNlQnVmZmVyKHV0aWwubm9kZUJ1ZmZlclRvQXJyYXlCdWZmZXIoYnVmZmVyKSk7XG59XG5cbmV4cG9ydHMuX3BhcnNlID0gcGFyc2U7XG5leHBvcnRzLkZvbnQgPSBfZm9udC5Gb250O1xuZXhwb3J0cy5HbHlwaCA9IGdseXBoLkdseXBoO1xuZXhwb3J0cy5QYXRoID0gcGF0aC5QYXRoO1xuZXhwb3J0cy5wYXJzZSA9IHBhcnNlQnVmZmVyO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMubG9hZFN5bmMgPSBsb2FkU3luYztcbiIsIi8vIFBhcnNpbmcgdXRpbGl0eSBmdW5jdGlvbnNcblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBSZXRyaWV2ZSBhbiB1bnNpZ25lZCBieXRlIGZyb20gdGhlIERhdGFWaWV3LlxuZXhwb3J0cy5nZXRCeXRlID0gZnVuY3Rpb24gZ2V0Qnl0ZShkYXRhVmlldywgb2Zmc2V0KSB7XG4gICAgcmV0dXJuIGRhdGFWaWV3LmdldFVpbnQ4KG9mZnNldCk7XG59O1xuXG5leHBvcnRzLmdldENhcmQ4ID0gZXhwb3J0cy5nZXRCeXRlO1xuXG4vLyBSZXRyaWV2ZSBhbiB1bnNpZ25lZCAxNi1iaXQgc2hvcnQgZnJvbSB0aGUgRGF0YVZpZXcuXG4vLyBUaGUgdmFsdWUgaXMgc3RvcmVkIGluIGJpZyBlbmRpYW4uXG5leHBvcnRzLmdldFVTaG9ydCA9IGZ1bmN0aW9uKGRhdGFWaWV3LCBvZmZzZXQpIHtcbiAgICByZXR1cm4gZGF0YVZpZXcuZ2V0VWludDE2KG9mZnNldCwgZmFsc2UpO1xufTtcblxuZXhwb3J0cy5nZXRDYXJkMTYgPSBleHBvcnRzLmdldFVTaG9ydDtcblxuLy8gUmV0cmlldmUgYSBzaWduZWQgMTYtYml0IHNob3J0IGZyb20gdGhlIERhdGFWaWV3LlxuLy8gVGhlIHZhbHVlIGlzIHN0b3JlZCBpbiBiaWcgZW5kaWFuLlxuZXhwb3J0cy5nZXRTaG9ydCA9IGZ1bmN0aW9uKGRhdGFWaWV3LCBvZmZzZXQpIHtcbiAgICByZXR1cm4gZGF0YVZpZXcuZ2V0SW50MTYob2Zmc2V0LCBmYWxzZSk7XG59O1xuXG4vLyBSZXRyaWV2ZSBhbiB1bnNpZ25lZCAzMi1iaXQgbG9uZyBmcm9tIHRoZSBEYXRhVmlldy5cbi8vIFRoZSB2YWx1ZSBpcyBzdG9yZWQgaW4gYmlnIGVuZGlhbi5cbmV4cG9ydHMuZ2V0VUxvbmcgPSBmdW5jdGlvbihkYXRhVmlldywgb2Zmc2V0KSB7XG4gICAgcmV0dXJuIGRhdGFWaWV3LmdldFVpbnQzMihvZmZzZXQsIGZhbHNlKTtcbn07XG5cbi8vIFJldHJpZXZlIGEgMzItYml0IHNpZ25lZCBmaXhlZC1wb2ludCBudW1iZXIgKDE2LjE2KSBmcm9tIHRoZSBEYXRhVmlldy5cbi8vIFRoZSB2YWx1ZSBpcyBzdG9yZWQgaW4gYmlnIGVuZGlhbi5cbmV4cG9ydHMuZ2V0Rml4ZWQgPSBmdW5jdGlvbihkYXRhVmlldywgb2Zmc2V0KSB7XG4gICAgdmFyIGRlY2ltYWwgPSBkYXRhVmlldy5nZXRJbnQxNihvZmZzZXQsIGZhbHNlKTtcbiAgICB2YXIgZnJhY3Rpb24gPSBkYXRhVmlldy5nZXRVaW50MTYob2Zmc2V0ICsgMiwgZmFsc2UpO1xuICAgIHJldHVybiBkZWNpbWFsICsgZnJhY3Rpb24gLyA2NTUzNTtcbn07XG5cbi8vIFJldHJpZXZlIGEgNC1jaGFyYWN0ZXIgdGFnIGZyb20gdGhlIERhdGFWaWV3LlxuLy8gVGFncyBhcmUgdXNlZCB0byBpZGVudGlmeSB0YWJsZXMuXG5leHBvcnRzLmdldFRhZyA9IGZ1bmN0aW9uKGRhdGFWaWV3LCBvZmZzZXQpIHtcbiAgICB2YXIgdGFnID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IG9mZnNldDsgaSA8IG9mZnNldCArIDQ7IGkgKz0gMSkge1xuICAgICAgICB0YWcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShkYXRhVmlldy5nZXRJbnQ4KGkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFnO1xufTtcblxuLy8gUmV0cmlldmUgYW4gb2Zmc2V0IGZyb20gdGhlIERhdGFWaWV3LlxuLy8gT2Zmc2V0cyBhcmUgMSB0byA0IGJ5dGVzIGluIGxlbmd0aCwgZGVwZW5kaW5nIG9uIHRoZSBvZmZTaXplIGFyZ3VtZW50LlxuZXhwb3J0cy5nZXRPZmZzZXQgPSBmdW5jdGlvbihkYXRhVmlldywgb2Zmc2V0LCBvZmZTaXplKSB7XG4gICAgdmFyIHYgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2ZmU2l6ZTsgaSArPSAxKSB7XG4gICAgICAgIHYgPDw9IDg7XG4gICAgICAgIHYgKz0gZGF0YVZpZXcuZ2V0VWludDgob2Zmc2V0ICsgaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHY7XG59O1xuXG4vLyBSZXRyaWV2ZSBhIG51bWJlciBvZiBieXRlcyBmcm9tIHN0YXJ0IG9mZnNldCB0byB0aGUgZW5kIG9mZnNldCBmcm9tIHRoZSBEYXRhVmlldy5cbmV4cG9ydHMuZ2V0Qnl0ZXMgPSBmdW5jdGlvbihkYXRhVmlldywgc3RhcnRPZmZzZXQsIGVuZE9mZnNldCkge1xuICAgIHZhciBieXRlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSBzdGFydE9mZnNldDsgaSA8IGVuZE9mZnNldDsgaSArPSAxKSB7XG4gICAgICAgIGJ5dGVzLnB1c2goZGF0YVZpZXcuZ2V0VWludDgoaSkpO1xuICAgIH1cblxuICAgIHJldHVybiBieXRlcztcbn07XG5cbi8vIENvbnZlcnQgdGhlIGxpc3Qgb2YgYnl0ZXMgdG8gYSBzdHJpbmcuXG5leHBvcnRzLmJ5dGVzVG9TdHJpbmcgPSBmdW5jdGlvbihieXRlcykge1xuICAgIHZhciBzID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pO1xuICAgIH1cblxuICAgIHJldHVybiBzO1xufTtcblxudmFyIHR5cGVPZmZzZXRzID0ge1xuICAgIGJ5dGU6IDEsXG4gICAgdVNob3J0OiAyLFxuICAgIHNob3J0OiAyLFxuICAgIHVMb25nOiA0LFxuICAgIGZpeGVkOiA0LFxuICAgIGxvbmdEYXRlVGltZTogOCxcbiAgICB0YWc6IDRcbn07XG5cbi8vIEEgc3RhdGVmdWwgcGFyc2VyIHRoYXQgY2hhbmdlcyB0aGUgb2Zmc2V0IHdoZW5ldmVyIGEgdmFsdWUgaXMgcmV0cmlldmVkLlxuLy8gVGhlIGRhdGEgaXMgYSBEYXRhVmlldy5cbmZ1bmN0aW9uIFBhcnNlcihkYXRhLCBvZmZzZXQpIHtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuICAgIHRoaXMucmVsYXRpdmVPZmZzZXQgPSAwO1xufVxuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlQnl0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ID0gdGhpcy5kYXRhLmdldFVpbnQ4KHRoaXMub2Zmc2V0ICsgdGhpcy5yZWxhdGl2ZU9mZnNldCk7XG4gICAgdGhpcy5yZWxhdGl2ZU9mZnNldCArPSAxO1xuICAgIHJldHVybiB2O1xufTtcblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZUNoYXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdiA9IHRoaXMuZGF0YS5nZXRJbnQ4KHRoaXMub2Zmc2V0ICsgdGhpcy5yZWxhdGl2ZU9mZnNldCk7XG4gICAgdGhpcy5yZWxhdGl2ZU9mZnNldCArPSAxO1xuICAgIHJldHVybiB2O1xufTtcblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZUNhcmQ4ID0gUGFyc2VyLnByb3RvdHlwZS5wYXJzZUJ5dGU7XG5cblBhcnNlci5wcm90b3R5cGUucGFyc2VVU2hvcnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdiA9IHRoaXMuZGF0YS5nZXRVaW50MTYodGhpcy5vZmZzZXQgKyB0aGlzLnJlbGF0aXZlT2Zmc2V0KTtcbiAgICB0aGlzLnJlbGF0aXZlT2Zmc2V0ICs9IDI7XG4gICAgcmV0dXJuIHY7XG59O1xuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlQ2FyZDE2ID0gUGFyc2VyLnByb3RvdHlwZS5wYXJzZVVTaG9ydDtcblBhcnNlci5wcm90b3R5cGUucGFyc2VTSUQgPSBQYXJzZXIucHJvdG90eXBlLnBhcnNlVVNob3J0O1xuUGFyc2VyLnByb3RvdHlwZS5wYXJzZU9mZnNldDE2ID0gUGFyc2VyLnByb3RvdHlwZS5wYXJzZVVTaG9ydDtcblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZVNob3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHYgPSB0aGlzLmRhdGEuZ2V0SW50MTYodGhpcy5vZmZzZXQgKyB0aGlzLnJlbGF0aXZlT2Zmc2V0KTtcbiAgICB0aGlzLnJlbGF0aXZlT2Zmc2V0ICs9IDI7XG4gICAgcmV0dXJuIHY7XG59O1xuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlRjJEb3QxNCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ID0gdGhpcy5kYXRhLmdldEludDE2KHRoaXMub2Zmc2V0ICsgdGhpcy5yZWxhdGl2ZU9mZnNldCkgLyAxNjM4NDtcbiAgICB0aGlzLnJlbGF0aXZlT2Zmc2V0ICs9IDI7XG4gICAgcmV0dXJuIHY7XG59O1xuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlVUxvbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdiA9IGV4cG9ydHMuZ2V0VUxvbmcodGhpcy5kYXRhLCB0aGlzLm9mZnNldCArIHRoaXMucmVsYXRpdmVPZmZzZXQpO1xuICAgIHRoaXMucmVsYXRpdmVPZmZzZXQgKz0gNDtcbiAgICByZXR1cm4gdjtcbn07XG5cblBhcnNlci5wcm90b3R5cGUucGFyc2VGaXhlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ID0gZXhwb3J0cy5nZXRGaXhlZCh0aGlzLmRhdGEsIHRoaXMub2Zmc2V0ICsgdGhpcy5yZWxhdGl2ZU9mZnNldCk7XG4gICAgdGhpcy5yZWxhdGl2ZU9mZnNldCArPSA0O1xuICAgIHJldHVybiB2O1xufTtcblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZU9mZnNldDE2TGlzdCA9XG5QYXJzZXIucHJvdG90eXBlLnBhcnNlVVNob3J0TGlzdCA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgdmFyIG9mZnNldHMgPSBuZXcgQXJyYXkoY291bnQpO1xuICAgIHZhciBkYXRhVmlldyA9IHRoaXMuZGF0YTtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5vZmZzZXQgKyB0aGlzLnJlbGF0aXZlT2Zmc2V0O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICBvZmZzZXRzW2ldID0gZXhwb3J0cy5nZXRVU2hvcnQoZGF0YVZpZXcsIG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSAyO1xuICAgIH1cblxuICAgIHRoaXMucmVsYXRpdmVPZmZzZXQgKz0gY291bnQgKiAyO1xuICAgIHJldHVybiBvZmZzZXRzO1xufTtcblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZVN0cmluZyA9IGZ1bmN0aW9uKGxlbmd0aCkge1xuICAgIHZhciBkYXRhVmlldyA9IHRoaXMuZGF0YTtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5vZmZzZXQgKyB0aGlzLnJlbGF0aXZlT2Zmc2V0O1xuICAgIHZhciBzdHJpbmcgPSAnJztcbiAgICB0aGlzLnJlbGF0aXZlT2Zmc2V0ICs9IGxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGRhdGFWaWV3LmdldFVpbnQ4KG9mZnNldCArIGkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nO1xufTtcblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZVRhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnBhcnNlU3RyaW5nKDQpO1xufTtcblxuLy8gTE9OR0RBVEVUSU1FIGlzIGEgNjQtYml0IGludGVnZXIuXG4vLyBKYXZhU2NyaXB0IGFuZCB1bml4IHRpbWVzdGFtcHMgdHJhZGl0aW9uYWxseSB1c2UgMzIgYml0cywgc28gd2Vcbi8vIG9ubHkgdGFrZSB0aGUgbGFzdCAzMiBiaXRzLlxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZUxvbmdEYXRlVGltZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ID0gZXhwb3J0cy5nZXRVTG9uZyh0aGlzLmRhdGEsIHRoaXMub2Zmc2V0ICsgdGhpcy5yZWxhdGl2ZU9mZnNldCArIDQpO1xuICAgIHRoaXMucmVsYXRpdmVPZmZzZXQgKz0gODtcbiAgICByZXR1cm4gdjtcbn07XG5cblBhcnNlci5wcm90b3R5cGUucGFyc2VGaXhlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ID0gZXhwb3J0cy5nZXRVTG9uZyh0aGlzLmRhdGEsIHRoaXMub2Zmc2V0ICsgdGhpcy5yZWxhdGl2ZU9mZnNldCk7XG4gICAgdGhpcy5yZWxhdGl2ZU9mZnNldCArPSA0O1xuICAgIHJldHVybiB2IC8gNjU1MzY7XG59O1xuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlVmVyc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYWpvciA9IGV4cG9ydHMuZ2V0VVNob3J0KHRoaXMuZGF0YSwgdGhpcy5vZmZzZXQgKyB0aGlzLnJlbGF0aXZlT2Zmc2V0KTtcblxuICAgIC8vIEhvdyB0byBpbnRlcnByZXQgdGhlIG1pbm9yIHZlcnNpb24gaXMgdmVyeSB2YWd1ZSBpbiB0aGUgc3BlYy4gMHg1MDAwIGlzIDUsIDB4MTAwMCBpcyAxXG4gICAgLy8gVGhpcyByZXR1cm5zIHRoZSBjb3JyZWN0IG51bWJlciBpZiBtaW5vciA9IDB4TjAwMCB3aGVyZSBOIGlzIDAtOVxuICAgIHZhciBtaW5vciA9IGV4cG9ydHMuZ2V0VVNob3J0KHRoaXMuZGF0YSwgdGhpcy5vZmZzZXQgKyB0aGlzLnJlbGF0aXZlT2Zmc2V0ICsgMik7XG4gICAgdGhpcy5yZWxhdGl2ZU9mZnNldCArPSA0O1xuICAgIHJldHVybiBtYWpvciArIG1pbm9yIC8gMHgxMDAwIC8gMTA7XG59O1xuXG5QYXJzZXIucHJvdG90eXBlLnNraXAgPSBmdW5jdGlvbih0eXBlLCBhbW91bnQpIHtcbiAgICBpZiAoYW1vdW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYW1vdW50ID0gMTtcbiAgICB9XG5cbiAgICB0aGlzLnJlbGF0aXZlT2Zmc2V0ICs9IHR5cGVPZmZzZXRzW3R5cGVdICogYW1vdW50O1xufTtcblxuZXhwb3J0cy5QYXJzZXIgPSBQYXJzZXI7XG4iLCIvLyBHZW9tZXRyaWMgb2JqZWN0c1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIEEgYsOpemllciBwYXRoIGNvbnRhaW5pbmcgYSBzZXQgb2YgcGF0aCBjb21tYW5kcyBzaW1pbGFyIHRvIGEgU1ZHIHBhdGguXG4vLyBQYXRocyBjYW4gYmUgZHJhd24gb24gYSBjb250ZXh0IHVzaW5nIGBkcmF3YC5cbmZ1bmN0aW9uIFBhdGgoKSB7XG4gICAgdGhpcy5jb21tYW5kcyA9IFtdO1xuICAgIHRoaXMuZmlsbCA9ICdibGFjayc7XG4gICAgdGhpcy5zdHJva2UgPSBudWxsO1xuICAgIHRoaXMuc3Ryb2tlV2lkdGggPSAxO1xufVxuXG5QYXRoLnByb3RvdHlwZS5tb3ZlVG8gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5jb21tYW5kcy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ00nLFxuICAgICAgICB4OiB4LFxuICAgICAgICB5OiB5XG4gICAgfSk7XG59O1xuXG5QYXRoLnByb3RvdHlwZS5saW5lVG8gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5jb21tYW5kcy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ0wnLFxuICAgICAgICB4OiB4LFxuICAgICAgICB5OiB5XG4gICAgfSk7XG59O1xuXG5QYXRoLnByb3RvdHlwZS5jdXJ2ZVRvID0gUGF0aC5wcm90b3R5cGUuYmV6aWVyQ3VydmVUbyA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCB4LCB5KSB7XG4gICAgdGhpcy5jb21tYW5kcy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ0MnLFxuICAgICAgICB4MTogeDEsXG4gICAgICAgIHkxOiB5MSxcbiAgICAgICAgeDI6IHgyLFxuICAgICAgICB5MjogeTIsXG4gICAgICAgIHg6IHgsXG4gICAgICAgIHk6IHlcbiAgICB9KTtcbn07XG5cblBhdGgucHJvdG90eXBlLnF1YWRUbyA9IFBhdGgucHJvdG90eXBlLnF1YWRyYXRpY0N1cnZlVG8gPSBmdW5jdGlvbih4MSwgeTEsIHgsIHkpIHtcbiAgICB0aGlzLmNvbW1hbmRzLnB1c2goe1xuICAgICAgICB0eXBlOiAnUScsXG4gICAgICAgIHgxOiB4MSxcbiAgICAgICAgeTE6IHkxLFxuICAgICAgICB4OiB4LFxuICAgICAgICB5OiB5XG4gICAgfSk7XG59O1xuXG5QYXRoLnByb3RvdHlwZS5jbG9zZSA9IFBhdGgucHJvdG90eXBlLmNsb3NlUGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29tbWFuZHMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdaJ1xuICAgIH0pO1xufTtcblxuLy8gQWRkIHRoZSBnaXZlbiBwYXRoIG9yIGxpc3Qgb2YgY29tbWFuZHMgdG8gdGhlIGNvbW1hbmRzIG9mIHRoaXMgcGF0aC5cblBhdGgucHJvdG90eXBlLmV4dGVuZCA9IGZ1bmN0aW9uKHBhdGhPckNvbW1hbmRzKSB7XG4gICAgaWYgKHBhdGhPckNvbW1hbmRzLmNvbW1hbmRzKSB7XG4gICAgICAgIHBhdGhPckNvbW1hbmRzID0gcGF0aE9yQ29tbWFuZHMuY29tbWFuZHM7XG4gICAgfVxuXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcy5jb21tYW5kcywgcGF0aE9yQ29tbWFuZHMpO1xufTtcblxuLy8gRHJhdyB0aGUgcGF0aCB0byBhIDJEIGNvbnRleHQuXG5QYXRoLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb21tYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgY21kID0gdGhpcy5jb21tYW5kc1tpXTtcbiAgICAgICAgaWYgKGNtZC50eXBlID09PSAnTScpIHtcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oY21kLngsIGNtZC55KTtcbiAgICAgICAgfSBlbHNlIGlmIChjbWQudHlwZSA9PT0gJ0wnKSB7XG4gICAgICAgICAgICBjdHgubGluZVRvKGNtZC54LCBjbWQueSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY21kLnR5cGUgPT09ICdDJykge1xuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oY21kLngxLCBjbWQueTEsIGNtZC54MiwgY21kLnkyLCBjbWQueCwgY21kLnkpO1xuICAgICAgICB9IGVsc2UgaWYgKGNtZC50eXBlID09PSAnUScpIHtcbiAgICAgICAgICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKGNtZC54MSwgY21kLnkxLCBjbWQueCwgY21kLnkpO1xuICAgICAgICB9IGVsc2UgaWYgKGNtZC50eXBlID09PSAnWicpIHtcbiAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmZpbGwpIHtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcbiAgICAgICAgY3R4LmZpbGwoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJva2UpIHtcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5zdHJva2U7XG4gICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlzLnN0cm9rZVdpZHRoO1xuICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfVxufTtcblxuLy8gQ29udmVydCB0aGUgUGF0aCB0byBhIHN0cmluZyBvZiBwYXRoIGRhdGEgaW5zdHJ1Y3Rpb25zXG4vLyBTZWUgaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL3BhdGhzLmh0bWwjUGF0aERhdGFcbi8vIFBhcmFtZXRlcnM6XG4vLyAtIGRlY2ltYWxQbGFjZXM6IFRoZSBhbW91bnQgb2YgZGVjaW1hbCBwbGFjZXMgZm9yIGZsb2F0aW5nLXBvaW50IHZhbHVlcyAoZGVmYXVsdDogMilcblBhdGgucHJvdG90eXBlLnRvUGF0aERhdGEgPSBmdW5jdGlvbihkZWNpbWFsUGxhY2VzKSB7XG4gICAgZGVjaW1hbFBsYWNlcyA9IGRlY2ltYWxQbGFjZXMgIT09IHVuZGVmaW5lZCA/IGRlY2ltYWxQbGFjZXMgOiAyO1xuXG4gICAgZnVuY3Rpb24gZmxvYXRUb1N0cmluZyh2KSB7XG4gICAgICAgIGlmIChNYXRoLnJvdW5kKHYpID09PSB2KSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyBNYXRoLnJvdW5kKHYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHYudG9GaXhlZChkZWNpbWFsUGxhY2VzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhY2tWYWx1ZXMoKSB7XG4gICAgICAgIHZhciBzID0gJyc7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICh2ID49IDAgJiYgaSA+IDApIHtcbiAgICAgICAgICAgICAgICBzICs9ICcgJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcyArPSBmbG9hdFRvU3RyaW5nKHYpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfVxuXG4gICAgdmFyIGQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29tbWFuZHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGNtZCA9IHRoaXMuY29tbWFuZHNbaV07XG4gICAgICAgIGlmIChjbWQudHlwZSA9PT0gJ00nKSB7XG4gICAgICAgICAgICBkICs9ICdNJyArIHBhY2tWYWx1ZXMoY21kLngsIGNtZC55KTtcbiAgICAgICAgfSBlbHNlIGlmIChjbWQudHlwZSA9PT0gJ0wnKSB7XG4gICAgICAgICAgICBkICs9ICdMJyArIHBhY2tWYWx1ZXMoY21kLngsIGNtZC55KTtcbiAgICAgICAgfSBlbHNlIGlmIChjbWQudHlwZSA9PT0gJ0MnKSB7XG4gICAgICAgICAgICBkICs9ICdDJyArIHBhY2tWYWx1ZXMoY21kLngxLCBjbWQueTEsIGNtZC54MiwgY21kLnkyLCBjbWQueCwgY21kLnkpO1xuICAgICAgICB9IGVsc2UgaWYgKGNtZC50eXBlID09PSAnUScpIHtcbiAgICAgICAgICAgIGQgKz0gJ1EnICsgcGFja1ZhbHVlcyhjbWQueDEsIGNtZC55MSwgY21kLngsIGNtZC55KTtcbiAgICAgICAgfSBlbHNlIGlmIChjbWQudHlwZSA9PT0gJ1onKSB7XG4gICAgICAgICAgICBkICs9ICdaJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkO1xufTtcblxuLy8gQ29udmVydCB0aGUgcGF0aCB0byBhIFNWRyA8cGF0aD4gZWxlbWVudCwgYXMgYSBzdHJpbmcuXG4vLyBQYXJhbWV0ZXJzOlxuLy8gLSBkZWNpbWFsUGxhY2VzOiBUaGUgYW1vdW50IG9mIGRlY2ltYWwgcGxhY2VzIGZvciBmbG9hdGluZy1wb2ludCB2YWx1ZXMgKGRlZmF1bHQ6IDIpXG5QYXRoLnByb3RvdHlwZS50b1NWRyA9IGZ1bmN0aW9uKGRlY2ltYWxQbGFjZXMpIHtcbiAgICB2YXIgc3ZnID0gJzxwYXRoIGQ9XCInO1xuICAgIHN2ZyArPSB0aGlzLnRvUGF0aERhdGEoZGVjaW1hbFBsYWNlcyk7XG4gICAgc3ZnICs9ICdcIic7XG4gICAgaWYgKHRoaXMuZmlsbCAmIHRoaXMuZmlsbCAhPT0gJ2JsYWNrJykge1xuICAgICAgICBpZiAodGhpcy5maWxsID09PSBudWxsKSB7XG4gICAgICAgICAgICBzdmcgKz0gJyBmaWxsPVwibm9uZVwiJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN2ZyArPSAnIGZpbGw9XCInICsgdGhpcy5maWxsICsgJ1wiJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLnN0cm9rZSkge1xuICAgICAgICBzdmcgKz0gJyBzdHJva2U9XCInICsgdGhpcy5zdHJva2UgKyAnXCIgc3Ryb2tlLXdpZHRoPVwiJyArIHRoaXMuc3Ryb2tlV2lkdGggKyAnXCInO1xuICAgIH1cblxuICAgIHN2ZyArPSAnLz4nO1xuICAgIHJldHVybiBzdmc7XG59O1xuXG5leHBvcnRzLlBhdGggPSBQYXRoO1xuIiwiLy8gVGFibGUgbWV0YWRhdGFcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZW5jb2RlID0gcmVxdWlyZSgnLi90eXBlcycpLmVuY29kZTtcbnZhciBzaXplT2YgPSByZXF1aXJlKCcuL3R5cGVzJykuc2l6ZU9mO1xuXG5mdW5jdGlvbiBUYWJsZSh0YWJsZU5hbWUsIGZpZWxkcywgb3B0aW9ucykge1xuICAgIHZhciBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGZpZWxkID0gZmllbGRzW2ldO1xuICAgICAgICB0aGlzW2ZpZWxkLm5hbWVdID0gZmllbGQudmFsdWU7XG4gICAgfVxuXG4gICAgdGhpcy50YWJsZU5hbWUgPSB0YWJsZU5hbWU7XG4gICAgdGhpcy5maWVsZHMgPSBmaWVsZHM7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG9wdGlvbktleXMgPSBPYmplY3Qua2V5cyhvcHRpb25zKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbktleXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHZhciBrID0gb3B0aW9uS2V5c1tpXTtcbiAgICAgICAgICAgIHZhciB2ID0gb3B0aW9uc1trXTtcbiAgICAgICAgICAgIGlmICh0aGlzW2tdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzW2tdID0gdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuVGFibGUucHJvdG90eXBlLmVuY29kZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBlbmNvZGUuVEFCTEUodGhpcyk7XG59O1xuXG5UYWJsZS5wcm90b3R5cGUuc2l6ZU9mID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNpemVPZi5UQUJMRSh0aGlzKTtcbn07XG5cbmV4cG9ydHMuUmVjb3JkID0gZXhwb3J0cy5UYWJsZSA9IFRhYmxlO1xuIiwiLy8gVGhlIGBDRkZgIHRhYmxlIGNvbnRhaW5zIHRoZSBnbHlwaCBvdXRsaW5lcyBpbiBQb3N0U2NyaXB0IGZvcm1hdC5cbi8vIGh0dHBzOi8vd3d3Lm1pY3Jvc29mdC5jb20vdHlwb2dyYXBoeS9PVFNQRUMvY2ZmLmh0bVxuLy8gaHR0cDovL2Rvd25sb2FkLm1pY3Jvc29mdC5jb20vZG93bmxvYWQvOC8wLzEvODAxYTE5MWMtMDI5ZC00YWYzLTk2NDItNTU1ZjZmZTUxNGVlL2NmZi5wZGZcbi8vIGh0dHA6Ly9kb3dubG9hZC5taWNyb3NvZnQuY29tL2Rvd25sb2FkLzgvMC8xLzgwMWExOTFjLTAyOWQtNGFmMy05NjQyLTU1NWY2ZmU1MTRlZS90eXBlMi5wZGZcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZW5jb2RpbmcgPSByZXF1aXJlKCcuLi9lbmNvZGluZycpO1xudmFyIGdseXBoc2V0ID0gcmVxdWlyZSgnLi4vZ2x5cGhzZXQnKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4uL3BhcnNlJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJy4uL3BhdGgnKTtcbnZhciB0YWJsZSA9IHJlcXVpcmUoJy4uL3RhYmxlJyk7XG5cbi8vIEN1c3RvbSBlcXVhbHMgZnVuY3Rpb24gdGhhdCBjYW4gYWxzbyBjaGVjayBsaXN0cy5cbmZ1bmN0aW9uIGVxdWFscyhhLCBiKSB7XG4gICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGEpICYmIEFycmF5LmlzQXJyYXkoYikpIHtcbiAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpZiAoIWVxdWFscyhhW2ldLCBiW2ldKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8vIFBhcnNlIGEgYENGRmAgSU5ERVggYXJyYXkuXG4vLyBBbiBpbmRleCBhcnJheSBjb25zaXN0cyBvZiBhIGxpc3Qgb2Ygb2Zmc2V0cywgdGhlbiBhIGxpc3Qgb2Ygb2JqZWN0cyBhdCB0aG9zZSBvZmZzZXRzLlxuZnVuY3Rpb24gcGFyc2VDRkZJbmRleChkYXRhLCBzdGFydCwgY29udmVyc2lvbkZuKSB7XG4gICAgLy92YXIgaSwgb2JqZWN0T2Zmc2V0LCBlbmRPZmZzZXQ7XG4gICAgdmFyIG9mZnNldHMgPSBbXTtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIHZhciBjb3VudCA9IHBhcnNlLmdldENhcmQxNihkYXRhLCBzdGFydCk7XG4gICAgdmFyIGk7XG4gICAgdmFyIG9iamVjdE9mZnNldDtcbiAgICB2YXIgZW5kT2Zmc2V0O1xuICAgIGlmIChjb3VudCAhPT0gMCkge1xuICAgICAgICB2YXIgb2Zmc2V0U2l6ZSA9IHBhcnNlLmdldEJ5dGUoZGF0YSwgc3RhcnQgKyAyKTtcbiAgICAgICAgb2JqZWN0T2Zmc2V0ID0gc3RhcnQgKyAoKGNvdW50ICsgMSkgKiBvZmZzZXRTaXplKSArIDI7XG4gICAgICAgIHZhciBwb3MgPSBzdGFydCArIDM7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudCArIDE7IGkgKz0gMSkge1xuICAgICAgICAgICAgb2Zmc2V0cy5wdXNoKHBhcnNlLmdldE9mZnNldChkYXRhLCBwb3MsIG9mZnNldFNpemUpKTtcbiAgICAgICAgICAgIHBvcyArPSBvZmZzZXRTaXplO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIHRvdGFsIHNpemUgb2YgdGhlIGluZGV4IGFycmF5IGlzIDQgaGVhZGVyIGJ5dGVzICsgdGhlIHZhbHVlIG9mIHRoZSBsYXN0IG9mZnNldC5cbiAgICAgICAgZW5kT2Zmc2V0ID0gb2JqZWN0T2Zmc2V0ICsgb2Zmc2V0c1tjb3VudF07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZW5kT2Zmc2V0ID0gc3RhcnQgKyAyO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBvZmZzZXRzLmxlbmd0aCAtIDE7IGkgKz0gMSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBwYXJzZS5nZXRCeXRlcyhkYXRhLCBvYmplY3RPZmZzZXQgKyBvZmZzZXRzW2ldLCBvYmplY3RPZmZzZXQgKyBvZmZzZXRzW2kgKyAxXSk7XG4gICAgICAgIGlmIChjb252ZXJzaW9uRm4pIHtcbiAgICAgICAgICAgIHZhbHVlID0gY29udmVyc2lvbkZuKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9iamVjdHMucHVzaCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtvYmplY3RzOiBvYmplY3RzLCBzdGFydE9mZnNldDogc3RhcnQsIGVuZE9mZnNldDogZW5kT2Zmc2V0fTtcbn1cblxuLy8gUGFyc2UgYSBgQ0ZGYCBESUNUIHJlYWwgdmFsdWUuXG5mdW5jdGlvbiBwYXJzZUZsb2F0T3BlcmFuZChwYXJzZXIpIHtcbiAgICB2YXIgcyA9ICcnO1xuICAgIHZhciBlb2YgPSAxNTtcbiAgICB2YXIgbG9va3VwID0gWycwJywgJzEnLCAnMicsICczJywgJzQnLCAnNScsICc2JywgJzcnLCAnOCcsICc5JywgJy4nLCAnRScsICdFLScsIG51bGwsICctJ107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdmFyIGIgPSBwYXJzZXIucGFyc2VCeXRlKCk7XG4gICAgICAgIHZhciBuMSA9IGIgPj4gNDtcbiAgICAgICAgdmFyIG4yID0gYiAmIDE1O1xuXG4gICAgICAgIGlmIChuMSA9PT0gZW9mKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHMgKz0gbG9va3VwW24xXTtcblxuICAgICAgICBpZiAobjIgPT09IGVvZikge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBzICs9IGxvb2t1cFtuMl07XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQocyk7XG59XG5cbi8vIFBhcnNlIGEgYENGRmAgRElDVCBvcGVyYW5kLlxuZnVuY3Rpb24gcGFyc2VPcGVyYW5kKHBhcnNlciwgYjApIHtcbiAgICB2YXIgYjE7XG4gICAgdmFyIGIyO1xuICAgIHZhciBiMztcbiAgICB2YXIgYjQ7XG4gICAgaWYgKGIwID09PSAyOCkge1xuICAgICAgICBiMSA9IHBhcnNlci5wYXJzZUJ5dGUoKTtcbiAgICAgICAgYjIgPSBwYXJzZXIucGFyc2VCeXRlKCk7XG4gICAgICAgIHJldHVybiBiMSA8PCA4IHwgYjI7XG4gICAgfVxuXG4gICAgaWYgKGIwID09PSAyOSkge1xuICAgICAgICBiMSA9IHBhcnNlci5wYXJzZUJ5dGUoKTtcbiAgICAgICAgYjIgPSBwYXJzZXIucGFyc2VCeXRlKCk7XG4gICAgICAgIGIzID0gcGFyc2VyLnBhcnNlQnl0ZSgpO1xuICAgICAgICBiNCA9IHBhcnNlci5wYXJzZUJ5dGUoKTtcbiAgICAgICAgcmV0dXJuIGIxIDw8IDI0IHwgYjIgPDwgMTYgfCBiMyA8PCA4IHwgYjQ7XG4gICAgfVxuXG4gICAgaWYgKGIwID09PSAzMCkge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdE9wZXJhbmQocGFyc2VyKTtcbiAgICB9XG5cbiAgICBpZiAoYjAgPj0gMzIgJiYgYjAgPD0gMjQ2KSB7XG4gICAgICAgIHJldHVybiBiMCAtIDEzOTtcbiAgICB9XG5cbiAgICBpZiAoYjAgPj0gMjQ3ICYmIGIwIDw9IDI1MCkge1xuICAgICAgICBiMSA9IHBhcnNlci5wYXJzZUJ5dGUoKTtcbiAgICAgICAgcmV0dXJuIChiMCAtIDI0NykgKiAyNTYgKyBiMSArIDEwODtcbiAgICB9XG5cbiAgICBpZiAoYjAgPj0gMjUxICYmIGIwIDw9IDI1NCkge1xuICAgICAgICBiMSA9IHBhcnNlci5wYXJzZUJ5dGUoKTtcbiAgICAgICAgcmV0dXJuIC0oYjAgLSAyNTEpICogMjU2IC0gYjEgLSAxMDg7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGIwICcgKyBiMCk7XG59XG5cbi8vIENvbnZlcnQgdGhlIGVudHJpZXMgcmV0dXJuZWQgYnkgYHBhcnNlRGljdGAgdG8gYSBwcm9wZXIgZGljdGlvbmFyeS5cbi8vIElmIGEgdmFsdWUgaXMgYSBsaXN0IG9mIG9uZSwgaXQgaXMgdW5wYWNrZWQuXG5mdW5jdGlvbiBlbnRyaWVzVG9PYmplY3QoZW50cmllcykge1xuICAgIHZhciBvID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBrZXkgPSBlbnRyaWVzW2ldWzBdO1xuICAgICAgICB2YXIgdmFsdWVzID0gZW50cmllc1tpXVsxXTtcbiAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZXNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0ICcgKyBvICsgJyBhbHJlYWR5IGhhcyBrZXkgJyArIGtleSk7XG4gICAgICAgIH1cblxuICAgICAgICBvW2tleV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbztcbn1cblxuLy8gUGFyc2UgYSBgQ0ZGYCBESUNUIG9iamVjdC5cbi8vIEEgZGljdGlvbmFyeSBjb250YWlucyBrZXktdmFsdWUgcGFpcnMgaW4gYSBjb21wYWN0IHRva2VuaXplZCBmb3JtYXQuXG5mdW5jdGlvbiBwYXJzZUNGRkRpY3QoZGF0YSwgc3RhcnQsIHNpemUpIHtcbiAgICBzdGFydCA9IHN0YXJ0ICE9PSB1bmRlZmluZWQgPyBzdGFydCA6IDA7XG4gICAgdmFyIHBhcnNlciA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQpO1xuICAgIHZhciBlbnRyaWVzID0gW107XG4gICAgdmFyIG9wZXJhbmRzID0gW107XG4gICAgc2l6ZSA9IHNpemUgIT09IHVuZGVmaW5lZCA/IHNpemUgOiBkYXRhLmxlbmd0aDtcblxuICAgIHdoaWxlIChwYXJzZXIucmVsYXRpdmVPZmZzZXQgPCBzaXplKSB7XG4gICAgICAgIHZhciBvcCA9IHBhcnNlci5wYXJzZUJ5dGUoKTtcblxuICAgICAgICAvLyBUaGUgZmlyc3QgYnl0ZSBmb3IgZWFjaCBkaWN0IGl0ZW0gZGlzdGluZ3Vpc2hlcyBiZXR3ZWVuIG9wZXJhdG9yIChrZXkpIGFuZCBvcGVyYW5kICh2YWx1ZSkuXG4gICAgICAgIC8vIFZhbHVlcyA8PSAyMSBhcmUgb3BlcmF0b3JzLlxuICAgICAgICBpZiAob3AgPD0gMjEpIHtcbiAgICAgICAgICAgIC8vIFR3by1ieXRlIG9wZXJhdG9ycyBoYXZlIGFuIGluaXRpYWwgZXNjYXBlIGJ5dGUgb2YgMTIuXG4gICAgICAgICAgICBpZiAob3AgPT09IDEyKSB7XG4gICAgICAgICAgICAgICAgb3AgPSAxMjAwICsgcGFyc2VyLnBhcnNlQnl0ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbnRyaWVzLnB1c2goW29wLCBvcGVyYW5kc10pO1xuICAgICAgICAgICAgb3BlcmFuZHMgPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFNpbmNlIHRoZSBvcGVyYW5kcyAodmFsdWVzKSBjb21lIGJlZm9yZSB0aGUgb3BlcmF0b3JzIChrZXlzKSwgd2Ugc3RvcmUgYWxsIG9wZXJhbmRzIGluIGEgbGlzdFxuICAgICAgICAgICAgLy8gdW50aWwgd2UgZW5jb3VudGVyIGFuIG9wZXJhdG9yLlxuICAgICAgICAgICAgb3BlcmFuZHMucHVzaChwYXJzZU9wZXJhbmQocGFyc2VyLCBvcCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVudHJpZXNUb09iamVjdChlbnRyaWVzKTtcbn1cblxuLy8gR2l2ZW4gYSBTdHJpbmcgSW5kZXggKFNJRCksIHJldHVybiB0aGUgdmFsdWUgb2YgdGhlIHN0cmluZy5cbi8vIFN0cmluZ3MgYmVsb3cgaW5kZXggMzkyIGFyZSBzdGFuZGFyZCBDRkYgc3RyaW5ncyBhbmQgYXJlIG5vdCBlbmNvZGVkIGluIHRoZSBmb250LlxuZnVuY3Rpb24gZ2V0Q0ZGU3RyaW5nKHN0cmluZ3MsIGluZGV4KSB7XG4gICAgaWYgKGluZGV4IDw9IDM5MCkge1xuICAgICAgICBpbmRleCA9IGVuY29kaW5nLmNmZlN0YW5kYXJkU3RyaW5nc1tpbmRleF07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW5kZXggPSBzdHJpbmdzW2luZGV4IC0gMzkxXTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5kZXg7XG59XG5cbi8vIEludGVycHJldCBhIGRpY3Rpb25hcnkgYW5kIHJldHVybiBhIG5ldyBkaWN0aW9uYXJ5IHdpdGggcmVhZGFibGUga2V5cyBhbmQgdmFsdWVzIGZvciBtaXNzaW5nIGVudHJpZXMuXG4vLyBUaGlzIGZ1bmN0aW9uIHRha2VzIGBtZXRhYCB3aGljaCBpcyBhIGxpc3Qgb2Ygb2JqZWN0cyBjb250YWluaW5nIGBvcGVyYW5kYCwgYG5hbWVgIGFuZCBgZGVmYXVsdGAuXG5mdW5jdGlvbiBpbnRlcnByZXREaWN0KGRpY3QsIG1ldGEsIHN0cmluZ3MpIHtcbiAgICB2YXIgbmV3RGljdCA9IHt9O1xuXG4gICAgLy8gQmVjYXVzZSB3ZSBhbHNvIHdhbnQgdG8gaW5jbHVkZSBtaXNzaW5nIHZhbHVlcywgd2Ugc3RhcnQgb3V0IGZyb20gdGhlIG1ldGEgbGlzdFxuICAgIC8vIGFuZCBsb29rdXAgdmFsdWVzIGluIHRoZSBkaWN0LlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWV0YS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgbSA9IG1ldGFbaV07XG4gICAgICAgIHZhciB2YWx1ZSA9IGRpY3RbbS5vcF07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG0udmFsdWUgIT09IHVuZGVmaW5lZCA/IG0udmFsdWUgOiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG0udHlwZSA9PT0gJ1NJRCcpIHtcbiAgICAgICAgICAgIHZhbHVlID0gZ2V0Q0ZGU3RyaW5nKHN0cmluZ3MsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ld0RpY3RbbS5uYW1lXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBuZXdEaWN0O1xufVxuXG4vLyBQYXJzZSB0aGUgQ0ZGIGhlYWRlci5cbmZ1bmN0aW9uIHBhcnNlQ0ZGSGVhZGVyKGRhdGEsIHN0YXJ0KSB7XG4gICAgdmFyIGhlYWRlciA9IHt9O1xuICAgIGhlYWRlci5mb3JtYXRNYWpvciA9IHBhcnNlLmdldENhcmQ4KGRhdGEsIHN0YXJ0KTtcbiAgICBoZWFkZXIuZm9ybWF0TWlub3IgPSBwYXJzZS5nZXRDYXJkOChkYXRhLCBzdGFydCArIDEpO1xuICAgIGhlYWRlci5zaXplID0gcGFyc2UuZ2V0Q2FyZDgoZGF0YSwgc3RhcnQgKyAyKTtcbiAgICBoZWFkZXIub2Zmc2V0U2l6ZSA9IHBhcnNlLmdldENhcmQ4KGRhdGEsIHN0YXJ0ICsgMyk7XG4gICAgaGVhZGVyLnN0YXJ0T2Zmc2V0ID0gc3RhcnQ7XG4gICAgaGVhZGVyLmVuZE9mZnNldCA9IHN0YXJ0ICsgNDtcbiAgICByZXR1cm4gaGVhZGVyO1xufVxuXG52YXIgVE9QX0RJQ1RfTUVUQSA9IFtcbiAgICB7bmFtZTogJ3ZlcnNpb24nLCBvcDogMCwgdHlwZTogJ1NJRCd9LFxuICAgIHtuYW1lOiAnbm90aWNlJywgb3A6IDEsIHR5cGU6ICdTSUQnfSxcbiAgICB7bmFtZTogJ2NvcHlyaWdodCcsIG9wOiAxMjAwLCB0eXBlOiAnU0lEJ30sXG4gICAge25hbWU6ICdmdWxsTmFtZScsIG9wOiAyLCB0eXBlOiAnU0lEJ30sXG4gICAge25hbWU6ICdmYW1pbHlOYW1lJywgb3A6IDMsIHR5cGU6ICdTSUQnfSxcbiAgICB7bmFtZTogJ3dlaWdodCcsIG9wOiA0LCB0eXBlOiAnU0lEJ30sXG4gICAge25hbWU6ICdpc0ZpeGVkUGl0Y2gnLCBvcDogMTIwMSwgdHlwZTogJ251bWJlcicsIHZhbHVlOiAwfSxcbiAgICB7bmFtZTogJ2l0YWxpY0FuZ2xlJywgb3A6IDEyMDIsIHR5cGU6ICdudW1iZXInLCB2YWx1ZTogMH0sXG4gICAge25hbWU6ICd1bmRlcmxpbmVQb3NpdGlvbicsIG9wOiAxMjAzLCB0eXBlOiAnbnVtYmVyJywgdmFsdWU6IC0xMDB9LFxuICAgIHtuYW1lOiAndW5kZXJsaW5lVGhpY2tuZXNzJywgb3A6IDEyMDQsIHR5cGU6ICdudW1iZXInLCB2YWx1ZTogNTB9LFxuICAgIHtuYW1lOiAncGFpbnRUeXBlJywgb3A6IDEyMDUsIHR5cGU6ICdudW1iZXInLCB2YWx1ZTogMH0sXG4gICAge25hbWU6ICdjaGFyc3RyaW5nVHlwZScsIG9wOiAxMjA2LCB0eXBlOiAnbnVtYmVyJywgdmFsdWU6IDJ9LFxuICAgIHtuYW1lOiAnZm9udE1hdHJpeCcsIG9wOiAxMjA3LCB0eXBlOiBbJ3JlYWwnLCAncmVhbCcsICdyZWFsJywgJ3JlYWwnLCAncmVhbCcsICdyZWFsJ10sIHZhbHVlOiBbMC4wMDEsIDAsIDAsIDAuMDAxLCAwLCAwXX0sXG4gICAge25hbWU6ICd1bmlxdWVJZCcsIG9wOiAxMywgdHlwZTogJ251bWJlcid9LFxuICAgIHtuYW1lOiAnZm9udEJCb3gnLCBvcDogNSwgdHlwZTogWydudW1iZXInLCAnbnVtYmVyJywgJ251bWJlcicsICdudW1iZXInXSwgdmFsdWU6IFswLCAwLCAwLCAwXX0sXG4gICAge25hbWU6ICdzdHJva2VXaWR0aCcsIG9wOiAxMjA4LCB0eXBlOiAnbnVtYmVyJywgdmFsdWU6IDB9LFxuICAgIHtuYW1lOiAneHVpZCcsIG9wOiAxNCwgdHlwZTogW10sIHZhbHVlOiBudWxsfSxcbiAgICB7bmFtZTogJ2NoYXJzZXQnLCBvcDogMTUsIHR5cGU6ICdvZmZzZXQnLCB2YWx1ZTogMH0sXG4gICAge25hbWU6ICdlbmNvZGluZycsIG9wOiAxNiwgdHlwZTogJ29mZnNldCcsIHZhbHVlOiAwfSxcbiAgICB7bmFtZTogJ2NoYXJTdHJpbmdzJywgb3A6IDE3LCB0eXBlOiAnb2Zmc2V0JywgdmFsdWU6IDB9LFxuICAgIHtuYW1lOiAncHJpdmF0ZScsIG9wOiAxOCwgdHlwZTogWydudW1iZXInLCAnb2Zmc2V0J10sIHZhbHVlOiBbMCwgMF19XG5dO1xuXG52YXIgUFJJVkFURV9ESUNUX01FVEEgPSBbXG4gICAge25hbWU6ICdzdWJycycsIG9wOiAxOSwgdHlwZTogJ29mZnNldCcsIHZhbHVlOiAwfSxcbiAgICB7bmFtZTogJ2RlZmF1bHRXaWR0aFgnLCBvcDogMjAsIHR5cGU6ICdudW1iZXInLCB2YWx1ZTogMH0sXG4gICAge25hbWU6ICdub21pbmFsV2lkdGhYJywgb3A6IDIxLCB0eXBlOiAnbnVtYmVyJywgdmFsdWU6IDB9XG5dO1xuXG4vLyBQYXJzZSB0aGUgQ0ZGIHRvcCBkaWN0aW9uYXJ5LiBBIENGRiB0YWJsZSBjYW4gY29udGFpbiBtdWx0aXBsZSBmb250cywgZWFjaCB3aXRoIHRoZWlyIG93biB0b3AgZGljdGlvbmFyeS5cbi8vIFRoZSB0b3AgZGljdGlvbmFyeSBjb250YWlucyB0aGUgZXNzZW50aWFsIG1ldGFkYXRhIGZvciB0aGUgZm9udCwgdG9nZXRoZXIgd2l0aCB0aGUgcHJpdmF0ZSBkaWN0aW9uYXJ5LlxuZnVuY3Rpb24gcGFyc2VDRkZUb3BEaWN0KGRhdGEsIHN0cmluZ3MpIHtcbiAgICB2YXIgZGljdCA9IHBhcnNlQ0ZGRGljdChkYXRhLCAwLCBkYXRhLmJ5dGVMZW5ndGgpO1xuICAgIHJldHVybiBpbnRlcnByZXREaWN0KGRpY3QsIFRPUF9ESUNUX01FVEEsIHN0cmluZ3MpO1xufVxuXG4vLyBQYXJzZSB0aGUgQ0ZGIHByaXZhdGUgZGljdGlvbmFyeS4gV2UgZG9uJ3QgZnVsbHkgcGFyc2Ugb3V0IGFsbCB0aGUgdmFsdWVzLCBvbmx5IHRoZSBvbmVzIHdlIG5lZWQuXG5mdW5jdGlvbiBwYXJzZUNGRlByaXZhdGVEaWN0KGRhdGEsIHN0YXJ0LCBzaXplLCBzdHJpbmdzKSB7XG4gICAgdmFyIGRpY3QgPSBwYXJzZUNGRkRpY3QoZGF0YSwgc3RhcnQsIHNpemUpO1xuICAgIHJldHVybiBpbnRlcnByZXREaWN0KGRpY3QsIFBSSVZBVEVfRElDVF9NRVRBLCBzdHJpbmdzKTtcbn1cblxuLy8gUGFyc2UgdGhlIENGRiBjaGFyc2V0IHRhYmxlLCB3aGljaCBjb250YWlucyBpbnRlcm5hbCBuYW1lcyBmb3IgYWxsIHRoZSBnbHlwaHMuXG4vLyBUaGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIGEgbGlzdCBvZiBnbHlwaCBuYW1lcy5cbi8vIFNlZSBBZG9iZSBUTiAjNTE3NiBjaGFwdGVyIDEzLCBcIkNoYXJzZXRzXCIuXG5mdW5jdGlvbiBwYXJzZUNGRkNoYXJzZXQoZGF0YSwgc3RhcnQsIG5HbHlwaHMsIHN0cmluZ3MpIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgc2lkO1xuICAgIHZhciBjb3VudDtcbiAgICB2YXIgcGFyc2VyID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCk7XG5cbiAgICAvLyBUaGUgLm5vdGRlZiBnbHlwaCBpcyBub3QgaW5jbHVkZWQsIHNvIHN1YnRyYWN0IDEuXG4gICAgbkdseXBocyAtPSAxO1xuICAgIHZhciBjaGFyc2V0ID0gWycubm90ZGVmJ107XG5cbiAgICB2YXIgZm9ybWF0ID0gcGFyc2VyLnBhcnNlQ2FyZDgoKTtcbiAgICBpZiAoZm9ybWF0ID09PSAwKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuR2x5cGhzOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHNpZCA9IHBhcnNlci5wYXJzZVNJRCgpO1xuICAgICAgICAgICAgY2hhcnNldC5wdXNoKGdldENGRlN0cmluZyhzdHJpbmdzLCBzaWQpKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAxKSB7XG4gICAgICAgIHdoaWxlIChjaGFyc2V0Lmxlbmd0aCA8PSBuR2x5cGhzKSB7XG4gICAgICAgICAgICBzaWQgPSBwYXJzZXIucGFyc2VTSUQoKTtcbiAgICAgICAgICAgIGNvdW50ID0gcGFyc2VyLnBhcnNlQ2FyZDgoKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPD0gY291bnQ7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNoYXJzZXQucHVzaChnZXRDRkZTdHJpbmcoc3RyaW5ncywgc2lkKSk7XG4gICAgICAgICAgICAgICAgc2lkICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gMikge1xuICAgICAgICB3aGlsZSAoY2hhcnNldC5sZW5ndGggPD0gbkdseXBocykge1xuICAgICAgICAgICAgc2lkID0gcGFyc2VyLnBhcnNlU0lEKCk7XG4gICAgICAgICAgICBjb3VudCA9IHBhcnNlci5wYXJzZUNhcmQxNigpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8PSBjb3VudDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY2hhcnNldC5wdXNoKGdldENGRlN0cmluZyhzdHJpbmdzLCBzaWQpKTtcbiAgICAgICAgICAgICAgICBzaWQgKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBjaGFyc2V0IGZvcm1hdCAnICsgZm9ybWF0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhcnNldDtcbn1cblxuLy8gUGFyc2UgdGhlIENGRiBlbmNvZGluZyBkYXRhLiBPbmx5IG9uZSBlbmNvZGluZyBjYW4gYmUgc3BlY2lmaWVkIHBlciBmb250LlxuLy8gU2VlIEFkb2JlIFROICM1MTc2IGNoYXB0ZXIgMTIsIFwiRW5jb2RpbmdzXCIuXG5mdW5jdGlvbiBwYXJzZUNGRkVuY29kaW5nKGRhdGEsIHN0YXJ0LCBjaGFyc2V0KSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIGNvZGU7XG4gICAgdmFyIGVuYyA9IHt9O1xuICAgIHZhciBwYXJzZXIgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0KTtcbiAgICB2YXIgZm9ybWF0ID0gcGFyc2VyLnBhcnNlQ2FyZDgoKTtcbiAgICBpZiAoZm9ybWF0ID09PSAwKSB7XG4gICAgICAgIHZhciBuQ29kZXMgPSBwYXJzZXIucGFyc2VDYXJkOCgpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbkNvZGVzOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvZGUgPSBwYXJzZXIucGFyc2VDYXJkOCgpO1xuICAgICAgICAgICAgZW5jW2NvZGVdID0gaTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAxKSB7XG4gICAgICAgIHZhciBuUmFuZ2VzID0gcGFyc2VyLnBhcnNlQ2FyZDgoKTtcbiAgICAgICAgY29kZSA9IDE7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuUmFuZ2VzOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHBhcnNlci5wYXJzZUNhcmQ4KCk7XG4gICAgICAgICAgICB2YXIgbkxlZnQgPSBwYXJzZXIucGFyc2VDYXJkOCgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IGZpcnN0OyBqIDw9IGZpcnN0ICsgbkxlZnQ7IGogKz0gMSkge1xuICAgICAgICAgICAgICAgIGVuY1tqXSA9IGNvZGU7XG4gICAgICAgICAgICAgICAgY29kZSArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nIGZvcm1hdCAnICsgZm9ybWF0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IGVuY29kaW5nLkNmZkVuY29kaW5nKGVuYywgY2hhcnNldCk7XG59XG5cbi8vIFRha2UgaW4gY2hhcnN0cmluZyBjb2RlIGFuZCByZXR1cm4gYSBHbHlwaCBvYmplY3QuXG4vLyBUaGUgZW5jb2RpbmcgaXMgZGVzY3JpYmVkIGluIHRoZSBUeXBlIDIgQ2hhcnN0cmluZyBGb3JtYXRcbi8vIGh0dHBzOi8vd3d3Lm1pY3Jvc29mdC5jb20vdHlwb2dyYXBoeS9PVFNQRUMvY2hhcnN0cjIuaHRtXG5mdW5jdGlvbiBwYXJzZUNGRkNoYXJzdHJpbmcoZm9udCwgZ2x5cGgsIGNvZGUpIHtcbiAgICB2YXIgYzF4O1xuICAgIHZhciBjMXk7XG4gICAgdmFyIGMyeDtcbiAgICB2YXIgYzJ5O1xuICAgIHZhciBwID0gbmV3IHBhdGguUGF0aCgpO1xuICAgIHZhciBzdGFjayA9IFtdO1xuICAgIHZhciBuU3RlbXMgPSAwO1xuICAgIHZhciBoYXZlV2lkdGggPSBmYWxzZTtcbiAgICB2YXIgd2lkdGggPSBmb250LmRlZmF1bHRXaWR0aFg7XG4gICAgdmFyIG9wZW4gPSBmYWxzZTtcbiAgICB2YXIgeCA9IDA7XG4gICAgdmFyIHkgPSAwO1xuXG4gICAgZnVuY3Rpb24gbmV3Q29udG91cih4LCB5KSB7XG4gICAgICAgIGlmIChvcGVuKSB7XG4gICAgICAgICAgICBwLmNsb3NlUGF0aCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgIG9wZW4gPSB0cnVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlU3RlbXMoKSB7XG4gICAgICAgIHZhciBoYXNXaWR0aEFyZztcblxuICAgICAgICAvLyBUaGUgbnVtYmVyIG9mIHN0ZW0gb3BlcmF0b3JzIG9uIHRoZSBzdGFjayBpcyBhbHdheXMgZXZlbi5cbiAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIHVuZXZlbiwgdGhhdCBtZWFucyBhIHdpZHRoIGlzIHNwZWNpZmllZC5cbiAgICAgICAgaGFzV2lkdGhBcmcgPSBzdGFjay5sZW5ndGggJSAyICE9PSAwO1xuICAgICAgICBpZiAoaGFzV2lkdGhBcmcgJiYgIWhhdmVXaWR0aCkge1xuICAgICAgICAgICAgd2lkdGggPSBzdGFjay5zaGlmdCgpICsgZm9udC5ub21pbmFsV2lkdGhYO1xuICAgICAgICB9XG5cbiAgICAgICAgblN0ZW1zICs9IHN0YWNrLmxlbmd0aCA+PiAxO1xuICAgICAgICBzdGFjay5sZW5ndGggPSAwO1xuICAgICAgICBoYXZlV2lkdGggPSB0cnVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlKGNvZGUpIHtcbiAgICAgICAgdmFyIGIxO1xuICAgICAgICB2YXIgYjI7XG4gICAgICAgIHZhciBiMztcbiAgICAgICAgdmFyIGI0O1xuICAgICAgICB2YXIgY29kZUluZGV4O1xuICAgICAgICB2YXIgc3VickNvZGU7XG4gICAgICAgIHZhciBqcHg7XG4gICAgICAgIHZhciBqcHk7XG4gICAgICAgIHZhciBjM3g7XG4gICAgICAgIHZhciBjM3k7XG4gICAgICAgIHZhciBjNHg7XG4gICAgICAgIHZhciBjNHk7XG5cbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IGNvZGUubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGNvZGVbaV07XG4gICAgICAgICAgICBpICs9IDE7XG4gICAgICAgICAgICBzd2l0Y2ggKHYpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IC8vIGhzdGVtXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU3RlbXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOiAvLyB2c3RlbVxuICAgICAgICAgICAgICAgICAgICBwYXJzZVN0ZW1zKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDogLy8gdm1vdmV0b1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhY2subGVuZ3RoID4gMSAmJiAhaGF2ZVdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IHN0YWNrLnNoaWZ0KCkgKyBmb250Lm5vbWluYWxXaWR0aFg7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXZlV2lkdGggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgeSArPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3Q29udG91cih4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA1OiAvLyBybGluZXRvXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ICs9IHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ICs9IHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLmxpbmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNjogLy8gaGxpbmV0b1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCArPSBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcC5saW5lVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA3OiAvLyB2bGluZXRvXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ICs9IHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLmxpbmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgeCArPSBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcC5saW5lVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDg6IC8vIHJyY3VydmV0b1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYzF4ID0geCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMXkgPSB5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyeCA9IGMxeCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMnkgPSBjMXkgKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGMyeCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gYzJ5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VydmVUbyhjMXgsIGMxeSwgYzJ4LCBjMnksIHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAxMDogLy8gY2FsbHN1YnJcbiAgICAgICAgICAgICAgICAgICAgY29kZUluZGV4ID0gc3RhY2sucG9wKCkgKyBmb250LnN1YnJzQmlhcztcbiAgICAgICAgICAgICAgICAgICAgc3VickNvZGUgPSBmb250LnN1YnJzW2NvZGVJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWJyQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2Uoc3VickNvZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAxMTogLy8gcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBjYXNlIDEyOiAvLyBmbGV4IG9wZXJhdG9yc1xuICAgICAgICAgICAgICAgICAgICB2ID0gY29kZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgaSArPSAxO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMzU6IC8vIGZsZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB8LSBkeDEgZHkxIGR4MiBkeTIgZHgzIGR5MyBkeDQgZHk0IGR4NSBkeTUgZHg2IGR5NiBmZCBmbGV4ICgxMiAzNSkgfC1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjMXggPSB4ICAgKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjMXkgPSB5ICAgKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjMnggPSBjMXggKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjMnkgPSBjMXkgKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeTJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqcHggPSBjMnggKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeDNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqcHkgPSBjMnkgKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeTNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjM3ggPSBqcHggKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeDRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjM3kgPSBqcHkgKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeTRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjNHggPSBjM3ggKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjNHkgPSBjM3kgKyBzdGFjay5zaGlmdCgpOyAgICAvLyBkeTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ID0gYzR4ICsgc3RhY2suc2hpZnQoKTsgICAgICAvLyBkeDZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0gYzR5ICsgc3RhY2suc2hpZnQoKTsgICAgICAvLyBkeTZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5zaGlmdCgpOyAgICAgICAgICAgICAgICAvLyBmbGV4IGRlcHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5jdXJ2ZVRvKGMxeCwgYzF5LCBjMngsIGMyeSwganB4LCBqcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VydmVUbyhjM3gsIGMzeSwgYzR4LCBjNHksIHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAzNDogLy8gaGZsZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB8LSBkeDEgZHgyIGR5MiBkeDMgZHg0IGR4NSBkeDYgaGZsZXggKDEyIDM0KSB8LVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMxeCA9IHggICArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMxeSA9IHk7ICAgICAgICAgICAgICAgICAgICAgIC8vIGR5MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMyeCA9IGMxeCArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4MlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMyeSA9IGMxeSArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR5MlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpweCA9IGMyeCArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4M1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpweSA9IGMyeTsgICAgICAgICAgICAgICAgICAgIC8vIGR5M1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMzeCA9IGpweCArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4NFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMzeSA9IGMyeTsgICAgICAgICAgICAgICAgICAgIC8vIGR5NFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGM0eCA9IGMzeCArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGM0eSA9IHk7ICAgICAgICAgICAgICAgICAgICAgIC8vIGR5NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSBjNHggKyBzdGFjay5zaGlmdCgpOyAgICAgIC8vIGR4NlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VydmVUbyhjMXgsIGMxeSwgYzJ4LCBjMnksIGpweCwganB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmN1cnZlVG8oYzN4LCBjM3ksIGM0eCwgYzR5LCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMzY6IC8vIGhmbGV4MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHwtIGR4MSBkeTEgZHgyIGR5MiBkeDMgZHg0IGR4NSBkeTUgZHg2IGhmbGV4MSAoMTIgMzYpIHwtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYzF4ID0geCAgICsgc3RhY2suc2hpZnQoKTsgICAgLy8gZHgxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYzF5ID0geSAgICsgc3RhY2suc2hpZnQoKTsgICAgLy8gZHkxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYzJ4ID0gYzF4ICsgc3RhY2suc2hpZnQoKTsgICAgLy8gZHgyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYzJ5ID0gYzF5ICsgc3RhY2suc2hpZnQoKTsgICAgLy8gZHkyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganB4ID0gYzJ4ICsgc3RhY2suc2hpZnQoKTsgICAgLy8gZHgzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganB5ID0gYzJ5OyAgICAgICAgICAgICAgICAgICAgLy8gZHkzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYzN4ID0ganB4ICsgc3RhY2suc2hpZnQoKTsgICAgLy8gZHg0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYzN5ID0gYzJ5OyAgICAgICAgICAgICAgICAgICAgLy8gZHk0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYzR4ID0gYzN4ICsgc3RhY2suc2hpZnQoKTsgICAgLy8gZHg1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYzR5ID0gYzN5ICsgc3RhY2suc2hpZnQoKTsgICAgLy8gZHk1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGM0eCArIHN0YWNrLnNoaWZ0KCk7ICAgICAgLy8gZHg2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5jdXJ2ZVRvKGMxeCwgYzF5LCBjMngsIGMyeSwganB4LCBqcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VydmVUbyhjM3gsIGMzeSwgYzR4LCBjNHksIHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAzNzogLy8gZmxleDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB8LSBkeDEgZHkxIGR4MiBkeTIgZHgzIGR5MyBkeDQgZHk0IGR4NSBkeTUgZDYgZmxleDEgKDEyIDM3KSB8LVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMxeCA9IHggICArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMxeSA9IHkgICArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR5MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMyeCA9IGMxeCArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4MlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMyeSA9IGMxeSArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR5MlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpweCA9IGMyeCArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4M1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpweSA9IGMyeSArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR5M1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMzeCA9IGpweCArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4NFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMzeSA9IGpweSArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR5NFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGM0eCA9IGMzeCArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR4NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGM0eSA9IGMzeSArIHN0YWNrLnNoaWZ0KCk7ICAgIC8vIGR5NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjNHggLSB4KSA+IE1hdGguYWJzKGM0eSAtIHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSBjNHggKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgPSBjNHkgKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VydmVUbyhjMXgsIGMxeSwgYzJ4LCBjMnksIGpweCwganB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmN1cnZlVG8oYzN4LCBjM3ksIGM0eCwgYzR5LCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0dseXBoICcgKyBnbHlwaC5pbmRleCArICc6IHVua25vd24gb3BlcmF0b3IgJyArIDEyMDAgKyB2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTQ6IC8vIGVuZGNoYXJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA+IDAgJiYgIWhhdmVXaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBzdGFjay5zaGlmdCgpICsgZm9udC5ub21pbmFsV2lkdGhYO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGF2ZVdpZHRoID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcGVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAxODogLy8gaHN0ZW1obVxuICAgICAgICAgICAgICAgICAgICBwYXJzZVN0ZW1zKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTk6IC8vIGhpbnRtYXNrXG4gICAgICAgICAgICAgICAgY2FzZSAyMDogLy8gY250cm1hc2tcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTdGVtcygpO1xuICAgICAgICAgICAgICAgICAgICBpICs9IChuU3RlbXMgKyA3KSA+PiAzO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDIxOiAvLyBybW92ZXRvXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFjay5sZW5ndGggPiAyICYmICFoYXZlV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gc3RhY2suc2hpZnQoKSArIGZvbnQubm9taW5hbFdpZHRoWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhdmVXaWR0aCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB5ICs9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB4ICs9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBuZXdDb250b3VyKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDIyOiAvLyBobW92ZXRvXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFjay5sZW5ndGggPiAxICYmICFoYXZlV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gc3RhY2suc2hpZnQoKSArIGZvbnQubm9taW5hbFdpZHRoWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhdmVXaWR0aCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB4ICs9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBuZXdDb250b3VyKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDIzOiAvLyB2c3RlbWhtXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU3RlbXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyNDogLy8gcmN1cnZlbGluZVxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYzF4ID0geCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMXkgPSB5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyeCA9IGMxeCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMnkgPSBjMXkgKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGMyeCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gYzJ5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VydmVUbyhjMXgsIGMxeSwgYzJ4LCBjMnksIHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgeCArPSBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICB5ICs9IHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIHAubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI1OiAvLyBybGluZWN1cnZlXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiA2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ICs9IHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ICs9IHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLmxpbmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGMxeCA9IHggKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBjMXkgPSB5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgYzJ4ID0gYzF4ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgYzJ5ID0gYzF5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgeCA9IGMyeCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIHkgPSBjMnkgKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBwLmN1cnZlVG8oYzF4LCBjMXksIGMyeCwgYzJ5LCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyNjogLy8gdnZjdXJ2ZXRvXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFjay5sZW5ndGggJSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ICs9IHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYzF4ID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMxeSA9IHkgKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYzJ4ID0gYzF4ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyeSA9IGMxeSArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gYzJ4O1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IGMyeSArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLmN1cnZlVG8oYzF4LCBjMXksIGMyeCwgYzJ5LCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjc6IC8vIGhoY3VydmV0b1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhY2subGVuZ3RoICUgMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMxeCA9IHggKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYzF5ID0geTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyeCA9IGMxeCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMnkgPSBjMXkgKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGMyeCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gYzJ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgcC5jdXJ2ZVRvKGMxeCwgYzF5LCBjMngsIGMyeSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI4OiAvLyBzaG9ydGludFxuICAgICAgICAgICAgICAgICAgICBiMSA9IGNvZGVbaV07XG4gICAgICAgICAgICAgICAgICAgIGIyID0gY29kZVtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goKChiMSA8PCAyNCkgfCAoYjIgPDwgMTYpKSA+PiAxNik7XG4gICAgICAgICAgICAgICAgICAgIGkgKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOTogLy8gY2FsbGdzdWJyXG4gICAgICAgICAgICAgICAgICAgIGNvZGVJbmRleCA9IHN0YWNrLnBvcCgpICsgZm9udC5nc3VicnNCaWFzO1xuICAgICAgICAgICAgICAgICAgICBzdWJyQ29kZSA9IGZvbnQuZ3N1YnJzW2NvZGVJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWJyQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2Uoc3VickNvZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzMDogLy8gdmhjdXJ2ZXRvXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMXggPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYzF5ID0geSArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMnggPSBjMXggKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYzJ5ID0gYzF5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBjMnggKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IGMyeSArIChzdGFjay5sZW5ndGggPT09IDEgPyBzdGFjay5zaGlmdCgpIDogMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLmN1cnZlVG8oYzF4LCBjMXksIGMyeCwgYzJ5LCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYzF4ID0geCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMXkgPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYzJ4ID0gYzF4ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyeSA9IGMxeSArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gYzJ5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBjMnggKyAoc3RhY2subGVuZ3RoID09PSAxID8gc3RhY2suc2hpZnQoKSA6IDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcC5jdXJ2ZVRvKGMxeCwgYzF5LCBjMngsIGMyeSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDMxOiAvLyBodmN1cnZldG9cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMxeCA9IHggKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYzF5ID0geTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyeCA9IGMxeCArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMnkgPSBjMXkgKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IGMyeSArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gYzJ4ICsgKHN0YWNrLmxlbmd0aCA9PT0gMSA/IHN0YWNrLnNoaWZ0KCkgOiAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VydmVUbyhjMXgsIGMxeSwgYzJ4LCBjMnksIHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjMXggPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYzF5ID0geSArIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMnggPSBjMXggKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYzJ5ID0gYzF5ICsgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBjMnggKyBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IGMyeSArIChzdGFjay5sZW5ndGggPT09IDEgPyBzdGFjay5zaGlmdCgpIDogMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLmN1cnZlVG8oYzF4LCBjMXksIGMyeCwgYzJ5LCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICh2IDwgMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdHbHlwaCAnICsgZ2x5cGguaW5kZXggKyAnOiB1bmtub3duIG9wZXJhdG9yICcgKyB2KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2IDwgMjQ3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHYgLSAxMzkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHYgPCAyNTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGIxID0gY29kZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goKHYgLSAyNDcpICogMjU2ICsgYjEgKyAxMDgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHYgPCAyNTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGIxID0gY29kZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goLSh2IC0gMjUxKSAqIDI1NiAtIGIxIC0gMTA4KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGIxID0gY29kZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGIyID0gY29kZVtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBiMyA9IGNvZGVbaSArIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYjQgPSBjb2RlW2kgKyAzXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goKChiMSA8PCAyNCkgfCAoYjIgPDwgMTYpIHwgKGIzIDw8IDgpIHwgYjQpIC8gNjU1MzYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJzZShjb2RlKTtcblxuICAgIGdseXBoLmFkdmFuY2VXaWR0aCA9IHdpZHRoO1xuICAgIHJldHVybiBwO1xufVxuXG4vLyBTdWJyb3V0aW5lcyBhcmUgZW5jb2RlZCB1c2luZyB0aGUgbmVnYXRpdmUgaGFsZiBvZiB0aGUgbnVtYmVyIHNwYWNlLlxuLy8gU2VlIHR5cGUgMiBjaGFwdGVyIDQuNyBcIlN1YnJvdXRpbmUgb3BlcmF0b3JzXCIuXG5mdW5jdGlvbiBjYWxjQ0ZGU3Vicm91dGluZUJpYXMoc3VicnMpIHtcbiAgICB2YXIgYmlhcztcbiAgICBpZiAoc3VicnMubGVuZ3RoIDwgMTI0MCkge1xuICAgICAgICBiaWFzID0gMTA3O1xuICAgIH0gZWxzZSBpZiAoc3VicnMubGVuZ3RoIDwgMzM5MDApIHtcbiAgICAgICAgYmlhcyA9IDExMzE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYmlhcyA9IDMyNzY4O1xuICAgIH1cblxuICAgIHJldHVybiBiaWFzO1xufVxuXG4vLyBQYXJzZSB0aGUgYENGRmAgdGFibGUsIHdoaWNoIGNvbnRhaW5zIHRoZSBnbHlwaCBvdXRsaW5lcyBpbiBQb3N0U2NyaXB0IGZvcm1hdC5cbmZ1bmN0aW9uIHBhcnNlQ0ZGVGFibGUoZGF0YSwgc3RhcnQsIGZvbnQpIHtcbiAgICBmb250LnRhYmxlcy5jZmYgPSB7fTtcbiAgICB2YXIgaGVhZGVyID0gcGFyc2VDRkZIZWFkZXIoZGF0YSwgc3RhcnQpO1xuICAgIHZhciBuYW1lSW5kZXggPSBwYXJzZUNGRkluZGV4KGRhdGEsIGhlYWRlci5lbmRPZmZzZXQsIHBhcnNlLmJ5dGVzVG9TdHJpbmcpO1xuICAgIHZhciB0b3BEaWN0SW5kZXggPSBwYXJzZUNGRkluZGV4KGRhdGEsIG5hbWVJbmRleC5lbmRPZmZzZXQpO1xuICAgIHZhciBzdHJpbmdJbmRleCA9IHBhcnNlQ0ZGSW5kZXgoZGF0YSwgdG9wRGljdEluZGV4LmVuZE9mZnNldCwgcGFyc2UuYnl0ZXNUb1N0cmluZyk7XG4gICAgdmFyIGdsb2JhbFN1YnJJbmRleCA9IHBhcnNlQ0ZGSW5kZXgoZGF0YSwgc3RyaW5nSW5kZXguZW5kT2Zmc2V0KTtcbiAgICBmb250LmdzdWJycyA9IGdsb2JhbFN1YnJJbmRleC5vYmplY3RzO1xuICAgIGZvbnQuZ3N1YnJzQmlhcyA9IGNhbGNDRkZTdWJyb3V0aW5lQmlhcyhmb250LmdzdWJycyk7XG5cbiAgICB2YXIgdG9wRGljdERhdGEgPSBuZXcgRGF0YVZpZXcobmV3IFVpbnQ4QXJyYXkodG9wRGljdEluZGV4Lm9iamVjdHNbMF0pLmJ1ZmZlcik7XG4gICAgdmFyIHRvcERpY3QgPSBwYXJzZUNGRlRvcERpY3QodG9wRGljdERhdGEsIHN0cmluZ0luZGV4Lm9iamVjdHMpO1xuICAgIGZvbnQudGFibGVzLmNmZi50b3BEaWN0ID0gdG9wRGljdDtcblxuICAgIHZhciBwcml2YXRlRGljdE9mZnNldCA9IHN0YXJ0ICsgdG9wRGljdFsncHJpdmF0ZSddWzFdO1xuICAgIHZhciBwcml2YXRlRGljdCA9IHBhcnNlQ0ZGUHJpdmF0ZURpY3QoZGF0YSwgcHJpdmF0ZURpY3RPZmZzZXQsIHRvcERpY3RbJ3ByaXZhdGUnXVswXSwgc3RyaW5nSW5kZXgub2JqZWN0cyk7XG4gICAgZm9udC5kZWZhdWx0V2lkdGhYID0gcHJpdmF0ZURpY3QuZGVmYXVsdFdpZHRoWDtcbiAgICBmb250Lm5vbWluYWxXaWR0aFggPSBwcml2YXRlRGljdC5ub21pbmFsV2lkdGhYO1xuXG4gICAgaWYgKHByaXZhdGVEaWN0LnN1YnJzICE9PSAwKSB7XG4gICAgICAgIHZhciBzdWJyT2Zmc2V0ID0gcHJpdmF0ZURpY3RPZmZzZXQgKyBwcml2YXRlRGljdC5zdWJycztcbiAgICAgICAgdmFyIHN1YnJJbmRleCA9IHBhcnNlQ0ZGSW5kZXgoZGF0YSwgc3Vick9mZnNldCk7XG4gICAgICAgIGZvbnQuc3VicnMgPSBzdWJySW5kZXgub2JqZWN0cztcbiAgICAgICAgZm9udC5zdWJyc0JpYXMgPSBjYWxjQ0ZGU3Vicm91dGluZUJpYXMoZm9udC5zdWJycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9udC5zdWJycyA9IFtdO1xuICAgICAgICBmb250LnN1YnJzQmlhcyA9IDA7XG4gICAgfVxuXG4gICAgLy8gT2Zmc2V0cyBpbiB0aGUgdG9wIGRpY3QgYXJlIHJlbGF0aXZlIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIENGRiBkYXRhLCBzbyBhZGQgdGhlIENGRiBzdGFydCBvZmZzZXQuXG4gICAgdmFyIGNoYXJTdHJpbmdzSW5kZXggPSBwYXJzZUNGRkluZGV4KGRhdGEsIHN0YXJ0ICsgdG9wRGljdC5jaGFyU3RyaW5ncyk7XG4gICAgZm9udC5uR2x5cGhzID0gY2hhclN0cmluZ3NJbmRleC5vYmplY3RzLmxlbmd0aDtcblxuICAgIHZhciBjaGFyc2V0ID0gcGFyc2VDRkZDaGFyc2V0KGRhdGEsIHN0YXJ0ICsgdG9wRGljdC5jaGFyc2V0LCBmb250Lm5HbHlwaHMsIHN0cmluZ0luZGV4Lm9iamVjdHMpO1xuICAgIGlmICh0b3BEaWN0LmVuY29kaW5nID09PSAwKSB7IC8vIFN0YW5kYXJkIGVuY29kaW5nXG4gICAgICAgIGZvbnQuY2ZmRW5jb2RpbmcgPSBuZXcgZW5jb2RpbmcuQ2ZmRW5jb2RpbmcoZW5jb2RpbmcuY2ZmU3RhbmRhcmRFbmNvZGluZywgY2hhcnNldCk7XG4gICAgfSBlbHNlIGlmICh0b3BEaWN0LmVuY29kaW5nID09PSAxKSB7IC8vIEV4cGVydCBlbmNvZGluZ1xuICAgICAgICBmb250LmNmZkVuY29kaW5nID0gbmV3IGVuY29kaW5nLkNmZkVuY29kaW5nKGVuY29kaW5nLmNmZkV4cGVydEVuY29kaW5nLCBjaGFyc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmb250LmNmZkVuY29kaW5nID0gcGFyc2VDRkZFbmNvZGluZyhkYXRhLCBzdGFydCArIHRvcERpY3QuZW5jb2RpbmcsIGNoYXJzZXQpO1xuICAgIH1cblxuICAgIC8vIFByZWZlciB0aGUgQ01BUCBlbmNvZGluZyB0byB0aGUgQ0ZGIGVuY29kaW5nLlxuICAgIGZvbnQuZW5jb2RpbmcgPSBmb250LmVuY29kaW5nIHx8IGZvbnQuY2ZmRW5jb2Rpbmc7XG5cbiAgICBmb250LmdseXBocyA9IG5ldyBnbHlwaHNldC5HbHlwaFNldChmb250KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZvbnQubkdseXBoczsgaSArPSAxKSB7XG4gICAgICAgIHZhciBjaGFyU3RyaW5nID0gY2hhclN0cmluZ3NJbmRleC5vYmplY3RzW2ldO1xuICAgICAgICBmb250LmdseXBocy5wdXNoKGksIGdseXBoc2V0LmNmZkdseXBoTG9hZGVyKGZvbnQsIGksIHBhcnNlQ0ZGQ2hhcnN0cmluZywgY2hhclN0cmluZykpO1xuICAgIH1cbn1cblxuLy8gQ29udmVydCBhIHN0cmluZyB0byBhIFN0cmluZyBJRCAoU0lEKS5cbi8vIFRoZSBsaXN0IG9mIHN0cmluZ3MgaXMgbW9kaWZpZWQgaW4gcGxhY2UuXG5mdW5jdGlvbiBlbmNvZGVTdHJpbmcocywgc3RyaW5ncykge1xuICAgIHZhciBzaWQ7XG5cbiAgICAvLyBJcyB0aGUgc3RyaW5nIGluIHRoZSBDRkYgc3RhbmRhcmQgc3RyaW5ncz9cbiAgICB2YXIgaSA9IGVuY29kaW5nLmNmZlN0YW5kYXJkU3RyaW5ncy5pbmRleE9mKHMpO1xuICAgIGlmIChpID49IDApIHtcbiAgICAgICAgc2lkID0gaTtcbiAgICB9XG5cbiAgICAvLyBJcyB0aGUgc3RyaW5nIGFscmVhZHkgaW4gdGhlIHN0cmluZyBpbmRleD9cbiAgICBpID0gc3RyaW5ncy5pbmRleE9mKHMpO1xuICAgIGlmIChpID49IDApIHtcbiAgICAgICAgc2lkID0gaSArIGVuY29kaW5nLmNmZlN0YW5kYXJkU3RyaW5ncy5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2lkID0gZW5jb2RpbmcuY2ZmU3RhbmRhcmRTdHJpbmdzLmxlbmd0aCArIHN0cmluZ3MubGVuZ3RoO1xuICAgICAgICBzdHJpbmdzLnB1c2gocyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpZDtcbn1cblxuZnVuY3Rpb24gbWFrZUhlYWRlcigpIHtcbiAgICByZXR1cm4gbmV3IHRhYmxlLlJlY29yZCgnSGVhZGVyJywgW1xuICAgICAgICB7bmFtZTogJ21ham9yJywgdHlwZTogJ0NhcmQ4JywgdmFsdWU6IDF9LFxuICAgICAgICB7bmFtZTogJ21pbm9yJywgdHlwZTogJ0NhcmQ4JywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2hkclNpemUnLCB0eXBlOiAnQ2FyZDgnLCB2YWx1ZTogNH0sXG4gICAgICAgIHtuYW1lOiAnbWFqb3InLCB0eXBlOiAnQ2FyZDgnLCB2YWx1ZTogMX1cbiAgICBdKTtcbn1cblxuZnVuY3Rpb24gbWFrZU5hbWVJbmRleChmb250TmFtZXMpIHtcbiAgICB2YXIgdCA9IG5ldyB0YWJsZS5SZWNvcmQoJ05hbWUgSU5ERVgnLCBbXG4gICAgICAgIHtuYW1lOiAnbmFtZXMnLCB0eXBlOiAnSU5ERVgnLCB2YWx1ZTogW119XG4gICAgXSk7XG4gICAgdC5uYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZm9udE5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHQubmFtZXMucHVzaCh7bmFtZTogJ25hbWVfJyArIGksIHR5cGU6ICdOQU1FJywgdmFsdWU6IGZvbnROYW1lc1tpXX0pO1xuICAgIH1cblxuICAgIHJldHVybiB0O1xufVxuXG4vLyBHaXZlbiBhIGRpY3Rpb25hcnkncyBtZXRhZGF0YSwgY3JlYXRlIGEgRElDVCBzdHJ1Y3R1cmUuXG5mdW5jdGlvbiBtYWtlRGljdChtZXRhLCBhdHRycywgc3RyaW5ncykge1xuICAgIHZhciBtID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXRhLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IG1ldGFbaV07XG4gICAgICAgIHZhciB2YWx1ZSA9IGF0dHJzW2VudHJ5Lm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCAmJiAhZXF1YWxzKHZhbHVlLCBlbnRyeS52YWx1ZSkpIHtcbiAgICAgICAgICAgIGlmIChlbnRyeS50eXBlID09PSAnU0lEJykge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gZW5jb2RlU3RyaW5nKHZhbHVlLCBzdHJpbmdzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbVtlbnRyeS5vcF0gPSB7bmFtZTogZW50cnkubmFtZSwgdHlwZTogZW50cnkudHlwZSwgdmFsdWU6IHZhbHVlfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtO1xufVxuXG4vLyBUaGUgVG9wIERJQ1QgaG91c2VzIHRoZSBnbG9iYWwgZm9udCBhdHRyaWJ1dGVzLlxuZnVuY3Rpb24gbWFrZVRvcERpY3QoYXR0cnMsIHN0cmluZ3MpIHtcbiAgICB2YXIgdCA9IG5ldyB0YWJsZS5SZWNvcmQoJ1RvcCBESUNUJywgW1xuICAgICAgICB7bmFtZTogJ2RpY3QnLCB0eXBlOiAnRElDVCcsIHZhbHVlOiB7fX1cbiAgICBdKTtcbiAgICB0LmRpY3QgPSBtYWtlRGljdChUT1BfRElDVF9NRVRBLCBhdHRycywgc3RyaW5ncyk7XG4gICAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG1ha2VUb3BEaWN0SW5kZXgodG9wRGljdCkge1xuICAgIHZhciB0ID0gbmV3IHRhYmxlLlJlY29yZCgnVG9wIERJQ1QgSU5ERVgnLCBbXG4gICAgICAgIHtuYW1lOiAndG9wRGljdHMnLCB0eXBlOiAnSU5ERVgnLCB2YWx1ZTogW119XG4gICAgXSk7XG4gICAgdC50b3BEaWN0cyA9IFt7bmFtZTogJ3RvcERpY3RfMCcsIHR5cGU6ICdUQUJMRScsIHZhbHVlOiB0b3BEaWN0fV07XG4gICAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG1ha2VTdHJpbmdJbmRleChzdHJpbmdzKSB7XG4gICAgdmFyIHQgPSBuZXcgdGFibGUuUmVjb3JkKCdTdHJpbmcgSU5ERVgnLCBbXG4gICAgICAgIHtuYW1lOiAnc3RyaW5ncycsIHR5cGU6ICdJTkRFWCcsIHZhbHVlOiBbXX1cbiAgICBdKTtcbiAgICB0LnN0cmluZ3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZ3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdC5zdHJpbmdzLnB1c2goe25hbWU6ICdzdHJpbmdfJyArIGksIHR5cGU6ICdTVFJJTkcnLCB2YWx1ZTogc3RyaW5nc1tpXX0pO1xuICAgIH1cblxuICAgIHJldHVybiB0O1xufVxuXG5mdW5jdGlvbiBtYWtlR2xvYmFsU3VickluZGV4KCkge1xuICAgIC8vIEN1cnJlbnRseSB3ZSBkb24ndCB1c2Ugc3Vicm91dGluZXMuXG4gICAgcmV0dXJuIG5ldyB0YWJsZS5SZWNvcmQoJ0dsb2JhbCBTdWJyIElOREVYJywgW1xuICAgICAgICB7bmFtZTogJ3N1YnJzJywgdHlwZTogJ0lOREVYJywgdmFsdWU6IFtdfVxuICAgIF0pO1xufVxuXG5mdW5jdGlvbiBtYWtlQ2hhcnNldHMoZ2x5cGhOYW1lcywgc3RyaW5ncykge1xuICAgIHZhciB0ID0gbmV3IHRhYmxlLlJlY29yZCgnQ2hhcnNldHMnLCBbXG4gICAgICAgIHtuYW1lOiAnZm9ybWF0JywgdHlwZTogJ0NhcmQ4JywgdmFsdWU6IDB9XG4gICAgXSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnbHlwaE5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBnbHlwaE5hbWUgPSBnbHlwaE5hbWVzW2ldO1xuICAgICAgICB2YXIgZ2x5cGhTSUQgPSBlbmNvZGVTdHJpbmcoZ2x5cGhOYW1lLCBzdHJpbmdzKTtcbiAgICAgICAgdC5maWVsZHMucHVzaCh7bmFtZTogJ2dseXBoXycgKyBpLCB0eXBlOiAnU0lEJywgdmFsdWU6IGdseXBoU0lEfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIGdseXBoVG9PcHMoZ2x5cGgpIHtcbiAgICB2YXIgb3BzID0gW107XG4gICAgdmFyIHBhdGggPSBnbHlwaC5wYXRoO1xuICAgIG9wcy5wdXNoKHtuYW1lOiAnd2lkdGgnLCB0eXBlOiAnTlVNQkVSJywgdmFsdWU6IGdseXBoLmFkdmFuY2VXaWR0aH0pO1xuICAgIHZhciB4ID0gMDtcbiAgICB2YXIgeSA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmNvbW1hbmRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBkeDtcbiAgICAgICAgdmFyIGR5O1xuICAgICAgICB2YXIgY21kID0gcGF0aC5jb21tYW5kc1tpXTtcbiAgICAgICAgaWYgKGNtZC50eXBlID09PSAnUScpIHtcbiAgICAgICAgICAgIC8vIENGRiBvbmx5IHN1cHBvcnRzIGLDqXppZXIgY3VydmVzLCBzbyBjb252ZXJ0IHRoZSBxdWFkIHRvIGEgYsOpemllci5cbiAgICAgICAgICAgIHZhciBfMTMgPSAxIC8gMztcbiAgICAgICAgICAgIHZhciBfMjMgPSAyIC8gMztcblxuICAgICAgICAgICAgLy8gV2UncmUgZ29pbmcgdG8gY3JlYXRlIGEgbmV3IGNvbW1hbmQgc28gd2UgZG9uJ3QgY2hhbmdlIHRoZSBvcmlnaW5hbCBwYXRoLlxuICAgICAgICAgICAgY21kID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdDJyxcbiAgICAgICAgICAgICAgICB4OiBjbWQueCxcbiAgICAgICAgICAgICAgICB5OiBjbWQueSxcbiAgICAgICAgICAgICAgICB4MTogXzEzICogeCArIF8yMyAqIGNtZC54MSxcbiAgICAgICAgICAgICAgICB5MTogXzEzICogeSArIF8yMyAqIGNtZC55MSxcbiAgICAgICAgICAgICAgICB4MjogXzEzICogY21kLnggKyBfMjMgKiBjbWQueDEsXG4gICAgICAgICAgICAgICAgeTI6IF8xMyAqIGNtZC55ICsgXzIzICogY21kLnkxXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNtZC50eXBlID09PSAnTScpIHtcbiAgICAgICAgICAgIGR4ID0gTWF0aC5yb3VuZChjbWQueCAtIHgpO1xuICAgICAgICAgICAgZHkgPSBNYXRoLnJvdW5kKGNtZC55IC0geSk7XG4gICAgICAgICAgICBvcHMucHVzaCh7bmFtZTogJ2R4JywgdHlwZTogJ05VTUJFUicsIHZhbHVlOiBkeH0pO1xuICAgICAgICAgICAgb3BzLnB1c2goe25hbWU6ICdkeScsIHR5cGU6ICdOVU1CRVInLCB2YWx1ZTogZHl9KTtcbiAgICAgICAgICAgIG9wcy5wdXNoKHtuYW1lOiAncm1vdmV0bycsIHR5cGU6ICdPUCcsIHZhbHVlOiAyMX0pO1xuICAgICAgICAgICAgeCA9IE1hdGgucm91bmQoY21kLngpO1xuICAgICAgICAgICAgeSA9IE1hdGgucm91bmQoY21kLnkpO1xuICAgICAgICB9IGVsc2UgaWYgKGNtZC50eXBlID09PSAnTCcpIHtcbiAgICAgICAgICAgIGR4ID0gTWF0aC5yb3VuZChjbWQueCAtIHgpO1xuICAgICAgICAgICAgZHkgPSBNYXRoLnJvdW5kKGNtZC55IC0geSk7XG4gICAgICAgICAgICBvcHMucHVzaCh7bmFtZTogJ2R4JywgdHlwZTogJ05VTUJFUicsIHZhbHVlOiBkeH0pO1xuICAgICAgICAgICAgb3BzLnB1c2goe25hbWU6ICdkeScsIHR5cGU6ICdOVU1CRVInLCB2YWx1ZTogZHl9KTtcbiAgICAgICAgICAgIG9wcy5wdXNoKHtuYW1lOiAncmxpbmV0bycsIHR5cGU6ICdPUCcsIHZhbHVlOiA1fSk7XG4gICAgICAgICAgICB4ID0gTWF0aC5yb3VuZChjbWQueCk7XG4gICAgICAgICAgICB5ID0gTWF0aC5yb3VuZChjbWQueSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY21kLnR5cGUgPT09ICdDJykge1xuICAgICAgICAgICAgdmFyIGR4MSA9IE1hdGgucm91bmQoY21kLngxIC0geCk7XG4gICAgICAgICAgICB2YXIgZHkxID0gTWF0aC5yb3VuZChjbWQueTEgLSB5KTtcbiAgICAgICAgICAgIHZhciBkeDIgPSBNYXRoLnJvdW5kKGNtZC54MiAtIGNtZC54MSk7XG4gICAgICAgICAgICB2YXIgZHkyID0gTWF0aC5yb3VuZChjbWQueTIgLSBjbWQueTEpO1xuICAgICAgICAgICAgZHggPSBNYXRoLnJvdW5kKGNtZC54IC0gY21kLngyKTtcbiAgICAgICAgICAgIGR5ID0gTWF0aC5yb3VuZChjbWQueSAtIGNtZC55Mik7XG4gICAgICAgICAgICBvcHMucHVzaCh7bmFtZTogJ2R4MScsIHR5cGU6ICdOVU1CRVInLCB2YWx1ZTogZHgxfSk7XG4gICAgICAgICAgICBvcHMucHVzaCh7bmFtZTogJ2R5MScsIHR5cGU6ICdOVU1CRVInLCB2YWx1ZTogZHkxfSk7XG4gICAgICAgICAgICBvcHMucHVzaCh7bmFtZTogJ2R4MicsIHR5cGU6ICdOVU1CRVInLCB2YWx1ZTogZHgyfSk7XG4gICAgICAgICAgICBvcHMucHVzaCh7bmFtZTogJ2R5MicsIHR5cGU6ICdOVU1CRVInLCB2YWx1ZTogZHkyfSk7XG4gICAgICAgICAgICBvcHMucHVzaCh7bmFtZTogJ2R4JywgdHlwZTogJ05VTUJFUicsIHZhbHVlOiBkeH0pO1xuICAgICAgICAgICAgb3BzLnB1c2goe25hbWU6ICdkeScsIHR5cGU6ICdOVU1CRVInLCB2YWx1ZTogZHl9KTtcbiAgICAgICAgICAgIG9wcy5wdXNoKHtuYW1lOiAncnJjdXJ2ZXRvJywgdHlwZTogJ09QJywgdmFsdWU6IDh9KTtcbiAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKGNtZC54KTtcbiAgICAgICAgICAgIHkgPSBNYXRoLnJvdW5kKGNtZC55KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbnRvdXJzIGFyZSBjbG9zZWQgYXV0b21hdGljYWxseS5cblxuICAgIH1cblxuICAgIG9wcy5wdXNoKHtuYW1lOiAnZW5kY2hhcicsIHR5cGU6ICdPUCcsIHZhbHVlOiAxNH0pO1xuICAgIHJldHVybiBvcHM7XG59XG5cbmZ1bmN0aW9uIG1ha2VDaGFyU3RyaW5nc0luZGV4KGdseXBocykge1xuICAgIHZhciB0ID0gbmV3IHRhYmxlLlJlY29yZCgnQ2hhclN0cmluZ3MgSU5ERVgnLCBbXG4gICAgICAgIHtuYW1lOiAnY2hhclN0cmluZ3MnLCB0eXBlOiAnSU5ERVgnLCB2YWx1ZTogW119XG4gICAgXSk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdseXBocy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgZ2x5cGggPSBnbHlwaHMuZ2V0KGkpO1xuICAgICAgICB2YXIgb3BzID0gZ2x5cGhUb09wcyhnbHlwaCk7XG4gICAgICAgIHQuY2hhclN0cmluZ3MucHVzaCh7bmFtZTogZ2x5cGgubmFtZSwgdHlwZTogJ0NIQVJTVFJJTkcnLCB2YWx1ZTogb3BzfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG1ha2VQcml2YXRlRGljdChhdHRycywgc3RyaW5ncykge1xuICAgIHZhciB0ID0gbmV3IHRhYmxlLlJlY29yZCgnUHJpdmF0ZSBESUNUJywgW1xuICAgICAgICB7bmFtZTogJ2RpY3QnLCB0eXBlOiAnRElDVCcsIHZhbHVlOiB7fX1cbiAgICBdKTtcbiAgICB0LmRpY3QgPSBtYWtlRGljdChQUklWQVRFX0RJQ1RfTUVUQSwgYXR0cnMsIHN0cmluZ3MpO1xuICAgIHJldHVybiB0O1xufVxuXG5mdW5jdGlvbiBtYWtlQ0ZGVGFibGUoZ2x5cGhzLCBvcHRpb25zKSB7XG4gICAgdmFyIHQgPSBuZXcgdGFibGUuVGFibGUoJ0NGRiAnLCBbXG4gICAgICAgIHtuYW1lOiAnaGVhZGVyJywgdHlwZTogJ1JFQ09SRCd9LFxuICAgICAgICB7bmFtZTogJ25hbWVJbmRleCcsIHR5cGU6ICdSRUNPUkQnfSxcbiAgICAgICAge25hbWU6ICd0b3BEaWN0SW5kZXgnLCB0eXBlOiAnUkVDT1JEJ30sXG4gICAgICAgIHtuYW1lOiAnc3RyaW5nSW5kZXgnLCB0eXBlOiAnUkVDT1JEJ30sXG4gICAgICAgIHtuYW1lOiAnZ2xvYmFsU3VickluZGV4JywgdHlwZTogJ1JFQ09SRCd9LFxuICAgICAgICB7bmFtZTogJ2NoYXJzZXRzJywgdHlwZTogJ1JFQ09SRCd9LFxuICAgICAgICB7bmFtZTogJ2NoYXJTdHJpbmdzSW5kZXgnLCB0eXBlOiAnUkVDT1JEJ30sXG4gICAgICAgIHtuYW1lOiAncHJpdmF0ZURpY3QnLCB0eXBlOiAnUkVDT1JEJ31cbiAgICBdKTtcblxuICAgIHZhciBmb250U2NhbGUgPSAxIC8gb3B0aW9ucy51bml0c1BlckVtO1xuICAgIC8vIFdlIHVzZSBub24temVybyB2YWx1ZXMgZm9yIHRoZSBvZmZzZXRzIHNvIHRoYXQgdGhlIERJQ1QgZW5jb2RlcyB0aGVtLlxuICAgIC8vIFRoaXMgaXMgaW1wb3J0YW50IGJlY2F1c2UgdGhlIHNpemUgb2YgdGhlIFRvcCBESUNUIHBsYXlzIGEgcm9sZSBpbiBvZmZzZXQgY2FsY3VsYXRpb24sXG4gICAgLy8gYW5kIHRoZSBzaXplIHNob3VsZG4ndCBjaGFuZ2UgYWZ0ZXIgd2UndmUgd3JpdHRlbiBjb3JyZWN0IG9mZnNldHMuXG4gICAgdmFyIGF0dHJzID0ge1xuICAgICAgICB2ZXJzaW9uOiBvcHRpb25zLnZlcnNpb24sXG4gICAgICAgIGZ1bGxOYW1lOiBvcHRpb25zLmZ1bGxOYW1lLFxuICAgICAgICBmYW1pbHlOYW1lOiBvcHRpb25zLmZhbWlseU5hbWUsXG4gICAgICAgIHdlaWdodDogb3B0aW9ucy53ZWlnaHROYW1lLFxuICAgICAgICBmb250QkJveDogb3B0aW9ucy5mb250QkJveCB8fCBbMCwgMCwgMCwgMF0sXG4gICAgICAgIGZvbnRNYXRyaXg6IFtmb250U2NhbGUsIDAsIDAsIGZvbnRTY2FsZSwgMCwgMF0sXG4gICAgICAgIGNoYXJzZXQ6IDk5OSxcbiAgICAgICAgZW5jb2Rpbmc6IDAsXG4gICAgICAgIGNoYXJTdHJpbmdzOiA5OTksXG4gICAgICAgIHByaXZhdGU6IFswLCA5OTldXG4gICAgfTtcblxuICAgIHZhciBwcml2YXRlQXR0cnMgPSB7fTtcblxuICAgIHZhciBnbHlwaE5hbWVzID0gW107XG4gICAgdmFyIGdseXBoO1xuXG4gICAgLy8gU2tpcCBmaXJzdCBnbHlwaCAoLm5vdGRlZilcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGdseXBocy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBnbHlwaCA9IGdseXBocy5nZXQoaSk7XG4gICAgICAgIGdseXBoTmFtZXMucHVzaChnbHlwaC5uYW1lKTtcbiAgICB9XG5cbiAgICB2YXIgc3RyaW5ncyA9IFtdO1xuXG4gICAgdC5oZWFkZXIgPSBtYWtlSGVhZGVyKCk7XG4gICAgdC5uYW1lSW5kZXggPSBtYWtlTmFtZUluZGV4KFtvcHRpb25zLnBvc3RTY3JpcHROYW1lXSk7XG4gICAgdmFyIHRvcERpY3QgPSBtYWtlVG9wRGljdChhdHRycywgc3RyaW5ncyk7XG4gICAgdC50b3BEaWN0SW5kZXggPSBtYWtlVG9wRGljdEluZGV4KHRvcERpY3QpO1xuICAgIHQuZ2xvYmFsU3VickluZGV4ID0gbWFrZUdsb2JhbFN1YnJJbmRleCgpO1xuICAgIHQuY2hhcnNldHMgPSBtYWtlQ2hhcnNldHMoZ2x5cGhOYW1lcywgc3RyaW5ncyk7XG4gICAgdC5jaGFyU3RyaW5nc0luZGV4ID0gbWFrZUNoYXJTdHJpbmdzSW5kZXgoZ2x5cGhzKTtcbiAgICB0LnByaXZhdGVEaWN0ID0gbWFrZVByaXZhdGVEaWN0KHByaXZhdGVBdHRycywgc3RyaW5ncyk7XG5cbiAgICAvLyBOZWVkcyB0byBjb21lIGF0IHRoZSBlbmQsIHRvIGVuY29kZSBhbGwgY3VzdG9tIHN0cmluZ3MgdXNlZCBpbiB0aGUgZm9udC5cbiAgICB0LnN0cmluZ0luZGV4ID0gbWFrZVN0cmluZ0luZGV4KHN0cmluZ3MpO1xuXG4gICAgdmFyIHN0YXJ0T2Zmc2V0ID0gdC5oZWFkZXIuc2l6ZU9mKCkgK1xuICAgICAgICB0Lm5hbWVJbmRleC5zaXplT2YoKSArXG4gICAgICAgIHQudG9wRGljdEluZGV4LnNpemVPZigpICtcbiAgICAgICAgdC5zdHJpbmdJbmRleC5zaXplT2YoKSArXG4gICAgICAgIHQuZ2xvYmFsU3VickluZGV4LnNpemVPZigpO1xuICAgIGF0dHJzLmNoYXJzZXQgPSBzdGFydE9mZnNldDtcblxuICAgIC8vIFdlIHVzZSB0aGUgQ0ZGIHN0YW5kYXJkIGVuY29kaW5nOyBwcm9wZXIgZW5jb2Rpbmcgd2lsbCBiZSBoYW5kbGVkIGluIGNtYXAuXG4gICAgYXR0cnMuZW5jb2RpbmcgPSAwO1xuICAgIGF0dHJzLmNoYXJTdHJpbmdzID0gYXR0cnMuY2hhcnNldCArIHQuY2hhcnNldHMuc2l6ZU9mKCk7XG4gICAgYXR0cnMucHJpdmF0ZVsxXSA9IGF0dHJzLmNoYXJTdHJpbmdzICsgdC5jaGFyU3RyaW5nc0luZGV4LnNpemVPZigpO1xuXG4gICAgLy8gUmVjcmVhdGUgdGhlIFRvcCBESUNUIElOREVYIHdpdGggdGhlIGNvcnJlY3Qgb2Zmc2V0cy5cbiAgICB0b3BEaWN0ID0gbWFrZVRvcERpY3QoYXR0cnMsIHN0cmluZ3MpO1xuICAgIHQudG9wRGljdEluZGV4ID0gbWFrZVRvcERpY3RJbmRleCh0b3BEaWN0KTtcblxuICAgIHJldHVybiB0O1xufVxuXG5leHBvcnRzLnBhcnNlID0gcGFyc2VDRkZUYWJsZTtcbmV4cG9ydHMubWFrZSA9IG1ha2VDRkZUYWJsZTtcbiIsIi8vIFRoZSBgY21hcGAgdGFibGUgc3RvcmVzIHRoZSBtYXBwaW5ncyBmcm9tIGNoYXJhY3RlcnMgdG8gZ2x5cGhzLlxuLy8gaHR0cHM6Ly93d3cubWljcm9zb2Z0LmNvbS90eXBvZ3JhcGh5L09UU1BFQy9jbWFwLmh0bVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjaGVjayA9IHJlcXVpcmUoJy4uL2NoZWNrJyk7XG52YXIgcGFyc2UgPSByZXF1aXJlKCcuLi9wYXJzZScpO1xudmFyIHRhYmxlID0gcmVxdWlyZSgnLi4vdGFibGUnKTtcblxuLy8gUGFyc2UgdGhlIGBjbWFwYCB0YWJsZS4gVGhpcyB0YWJsZSBzdG9yZXMgdGhlIG1hcHBpbmdzIGZyb20gY2hhcmFjdGVycyB0byBnbHlwaHMuXG4vLyBUaGVyZSBhcmUgbWFueSBhdmFpbGFibGUgZm9ybWF0cywgYnV0IHdlIG9ubHkgc3VwcG9ydCB0aGUgV2luZG93cyBmb3JtYXQgNC5cbi8vIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBhIGBDbWFwRW5jb2RpbmdgIG9iamVjdCBvciBudWxsIGlmIG5vIHN1cHBvcnRlZCBmb3JtYXQgY291bGQgYmUgZm91bmQuXG5mdW5jdGlvbiBwYXJzZUNtYXBUYWJsZShkYXRhLCBzdGFydCkge1xuICAgIHZhciBpO1xuICAgIHZhciBjbWFwID0ge307XG4gICAgY21hcC52ZXJzaW9uID0gcGFyc2UuZ2V0VVNob3J0KGRhdGEsIHN0YXJ0KTtcbiAgICBjaGVjay5hcmd1bWVudChjbWFwLnZlcnNpb24gPT09IDAsICdjbWFwIHRhYmxlIHZlcnNpb24gc2hvdWxkIGJlIDAuJyk7XG5cbiAgICAvLyBUaGUgY21hcCB0YWJsZSBjYW4gY29udGFpbiBtYW55IHN1Yi10YWJsZXMsIGVhY2ggd2l0aCB0aGVpciBvd24gZm9ybWF0LlxuICAgIC8vIFdlJ3JlIG9ubHkgaW50ZXJlc3RlZCBpbiBhIFwicGxhdGZvcm0gM1wiIHRhYmxlLiBUaGlzIGlzIGEgV2luZG93cyBmb3JtYXQuXG4gICAgY21hcC5udW1UYWJsZXMgPSBwYXJzZS5nZXRVU2hvcnQoZGF0YSwgc3RhcnQgKyAyKTtcbiAgICB2YXIgb2Zmc2V0ID0gLTE7XG4gICAgZm9yIChpID0gMDsgaSA8IGNtYXAubnVtVGFibGVzOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHBsYXRmb3JtSWQgPSBwYXJzZS5nZXRVU2hvcnQoZGF0YSwgc3RhcnQgKyA0ICsgKGkgKiA4KSk7XG4gICAgICAgIHZhciBlbmNvZGluZ0lkID0gcGFyc2UuZ2V0VVNob3J0KGRhdGEsIHN0YXJ0ICsgNCArIChpICogOCkgKyAyKTtcbiAgICAgICAgaWYgKHBsYXRmb3JtSWQgPT09IDMgJiYgKGVuY29kaW5nSWQgPT09IDEgfHwgZW5jb2RpbmdJZCA9PT0gMCkpIHtcbiAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlLmdldFVMb25nKGRhdGEsIHN0YXJ0ICsgNCArIChpICogOCkgKyA0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldCA9PT0gLTEpIHtcbiAgICAgICAgLy8gVGhlcmUgaXMgbm8gY21hcCB0YWJsZSBpbiB0aGUgZm9udCB0aGF0IHdlIHN1cHBvcnQsIHNvIHJldHVybiBudWxsLlxuICAgICAgICAvLyBUaGlzIGZvbnQgd2lsbCBiZSBtYXJrZWQgYXMgdW5zdXBwb3J0ZWQuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBwID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCArIG9mZnNldCk7XG4gICAgY21hcC5mb3JtYXQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgY2hlY2suYXJndW1lbnQoY21hcC5mb3JtYXQgPT09IDQsICdPbmx5IGZvcm1hdCA0IGNtYXAgdGFibGVzIGFyZSBzdXBwb3J0ZWQuJyk7XG5cbiAgICAvLyBMZW5ndGggaW4gYnl0ZXMgb2YgdGhlIHN1Yi10YWJsZXMuXG4gICAgY21hcC5sZW5ndGggPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgY21hcC5sYW5ndWFnZSA9IHAucGFyc2VVU2hvcnQoKTtcblxuICAgIC8vIHNlZ0NvdW50IGlzIHN0b3JlZCB4IDIuXG4gICAgdmFyIHNlZ0NvdW50O1xuICAgIGNtYXAuc2VnQ291bnQgPSBzZWdDb3VudCA9IHAucGFyc2VVU2hvcnQoKSA+PiAxO1xuXG4gICAgLy8gU2tpcCBzZWFyY2hSYW5nZSwgZW50cnlTZWxlY3RvciwgcmFuZ2VTaGlmdC5cbiAgICBwLnNraXAoJ3VTaG9ydCcsIDMpO1xuXG4gICAgLy8gVGhlIFwidW5yb2xsZWRcIiBtYXBwaW5nIGZyb20gY2hhcmFjdGVyIGNvZGVzIHRvIGdseXBoIGluZGljZXMuXG4gICAgY21hcC5nbHlwaEluZGV4TWFwID0ge307XG5cbiAgICB2YXIgZW5kQ291bnRQYXJzZXIgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0ICsgb2Zmc2V0ICsgMTQpO1xuICAgIHZhciBzdGFydENvdW50UGFyc2VyID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCArIG9mZnNldCArIDE2ICsgc2VnQ291bnQgKiAyKTtcbiAgICB2YXIgaWREZWx0YVBhcnNlciA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQgKyBvZmZzZXQgKyAxNiArIHNlZ0NvdW50ICogNCk7XG4gICAgdmFyIGlkUmFuZ2VPZmZzZXRQYXJzZXIgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0ICsgb2Zmc2V0ICsgMTYgKyBzZWdDb3VudCAqIDYpO1xuICAgIHZhciBnbHlwaEluZGV4T2Zmc2V0ID0gc3RhcnQgKyBvZmZzZXQgKyAxNiArIHNlZ0NvdW50ICogODtcbiAgICBmb3IgKGkgPSAwOyBpIDwgc2VnQ291bnQgLSAxOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGdseXBoSW5kZXg7XG4gICAgICAgIHZhciBlbmRDb3VudCA9IGVuZENvdW50UGFyc2VyLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIHZhciBzdGFydENvdW50ID0gc3RhcnRDb3VudFBhcnNlci5wYXJzZVVTaG9ydCgpO1xuICAgICAgICB2YXIgaWREZWx0YSA9IGlkRGVsdGFQYXJzZXIucGFyc2VTaG9ydCgpO1xuICAgICAgICB2YXIgaWRSYW5nZU9mZnNldCA9IGlkUmFuZ2VPZmZzZXRQYXJzZXIucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgZm9yICh2YXIgYyA9IHN0YXJ0Q291bnQ7IGMgPD0gZW5kQ291bnQ7IGMgKz0gMSkge1xuICAgICAgICAgICAgaWYgKGlkUmFuZ2VPZmZzZXQgIT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgaWRSYW5nZU9mZnNldCBpcyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiB0aGUgaWRSYW5nZU9mZnNldCBhcnJheS5cbiAgICAgICAgICAgICAgICAvLyBUYWtlIHRoZSBjdXJyZW50IG9mZnNldCBpbiB0aGUgaWRSYW5nZU9mZnNldCBhcnJheS5cbiAgICAgICAgICAgICAgICBnbHlwaEluZGV4T2Zmc2V0ID0gKGlkUmFuZ2VPZmZzZXRQYXJzZXIub2Zmc2V0ICsgaWRSYW5nZU9mZnNldFBhcnNlci5yZWxhdGl2ZU9mZnNldCAtIDIpO1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSB2YWx1ZSBvZiB0aGUgaWRSYW5nZU9mZnNldCwgd2hpY2ggd2lsbCBtb3ZlIHVzIGludG8gdGhlIGdseXBoSW5kZXggYXJyYXkuXG4gICAgICAgICAgICAgICAgZ2x5cGhJbmRleE9mZnNldCArPSBpZFJhbmdlT2Zmc2V0O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlbiBhZGQgdGhlIGNoYXJhY3RlciBpbmRleCBvZiB0aGUgY3VycmVudCBzZWdtZW50LCBtdWx0aXBsaWVkIGJ5IDIgZm9yIFVTSE9SVHMuXG4gICAgICAgICAgICAgICAgZ2x5cGhJbmRleE9mZnNldCArPSAoYyAtIHN0YXJ0Q291bnQpICogMjtcbiAgICAgICAgICAgICAgICBnbHlwaEluZGV4ID0gcGFyc2UuZ2V0VVNob3J0KGRhdGEsIGdseXBoSW5kZXhPZmZzZXQpO1xuICAgICAgICAgICAgICAgIGlmIChnbHlwaEluZGV4ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGdseXBoSW5kZXggPSAoZ2x5cGhJbmRleCArIGlkRGVsdGEpICYgMHhGRkZGO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2x5cGhJbmRleCA9IChjICsgaWREZWx0YSkgJiAweEZGRkY7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNtYXAuZ2x5cGhJbmRleE1hcFtjXSA9IGdseXBoSW5kZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY21hcDtcbn1cblxuZnVuY3Rpb24gYWRkU2VnbWVudCh0LCBjb2RlLCBnbHlwaEluZGV4KSB7XG4gICAgdC5zZWdtZW50cy5wdXNoKHtcbiAgICAgICAgZW5kOiBjb2RlLFxuICAgICAgICBzdGFydDogY29kZSxcbiAgICAgICAgZGVsdGE6IC0oY29kZSAtIGdseXBoSW5kZXgpLFxuICAgICAgICBvZmZzZXQ6IDBcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYWRkVGVybWluYXRvclNlZ21lbnQodCkge1xuICAgIHQuc2VnbWVudHMucHVzaCh7XG4gICAgICAgIGVuZDogMHhGRkZGLFxuICAgICAgICBzdGFydDogMHhGRkZGLFxuICAgICAgICBkZWx0YTogMSxcbiAgICAgICAgb2Zmc2V0OiAwXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIG1ha2VDbWFwVGFibGUoZ2x5cGhzKSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIHQgPSBuZXcgdGFibGUuVGFibGUoJ2NtYXAnLCBbXG4gICAgICAgIHtuYW1lOiAndmVyc2lvbicsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnbnVtVGFibGVzJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAxfSxcbiAgICAgICAge25hbWU6ICdwbGF0Zm9ybUlEJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAzfSxcbiAgICAgICAge25hbWU6ICdlbmNvZGluZ0lEJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAxfSxcbiAgICAgICAge25hbWU6ICdvZmZzZXQnLCB0eXBlOiAnVUxPTkcnLCB2YWx1ZTogMTJ9LFxuICAgICAgICB7bmFtZTogJ2Zvcm1hdCcsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogNH0sXG4gICAgICAgIHtuYW1lOiAnbGVuZ3RoJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdsYW5ndWFnZScsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnc2VnQ291bnRYMicsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnc2VhcmNoUmFuZ2UnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2VudHJ5U2VsZWN0b3InLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3JhbmdlU2hpZnQnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9XG4gICAgXSk7XG5cbiAgICB0LnNlZ21lbnRzID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IGdseXBocy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgZ2x5cGggPSBnbHlwaHMuZ2V0KGkpO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdseXBoLnVuaWNvZGVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgICBhZGRTZWdtZW50KHQsIGdseXBoLnVuaWNvZGVzW2pdLCBpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHQuc2VnbWVudHMgPSB0LnNlZ21lbnRzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEuc3RhcnQgLSBiLnN0YXJ0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhZGRUZXJtaW5hdG9yU2VnbWVudCh0KTtcblxuICAgIHZhciBzZWdDb3VudDtcbiAgICBzZWdDb3VudCA9IHQuc2VnbWVudHMubGVuZ3RoO1xuICAgIHQuc2VnQ291bnRYMiA9IHNlZ0NvdW50ICogMjtcbiAgICB0LnNlYXJjaFJhbmdlID0gTWF0aC5wb3coMiwgTWF0aC5mbG9vcihNYXRoLmxvZyhzZWdDb3VudCkgLyBNYXRoLmxvZygyKSkpICogMjtcbiAgICB0LmVudHJ5U2VsZWN0b3IgPSBNYXRoLmxvZyh0LnNlYXJjaFJhbmdlIC8gMikgLyBNYXRoLmxvZygyKTtcbiAgICB0LnJhbmdlU2hpZnQgPSB0LnNlZ0NvdW50WDIgLSB0LnNlYXJjaFJhbmdlO1xuXG4gICAgLy8gU2V0IHVwIHBhcmFsbGVsIHNlZ21lbnQgYXJyYXlzLlxuICAgIHZhciBlbmRDb3VudHMgPSBbXTtcbiAgICB2YXIgc3RhcnRDb3VudHMgPSBbXTtcbiAgICB2YXIgaWREZWx0YXMgPSBbXTtcbiAgICB2YXIgaWRSYW5nZU9mZnNldHMgPSBbXTtcbiAgICB2YXIgZ2x5cGhJZHMgPSBbXTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBzZWdDb3VudDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBzZWdtZW50ID0gdC5zZWdtZW50c1tpXTtcbiAgICAgICAgZW5kQ291bnRzID0gZW5kQ291bnRzLmNvbmNhdCh7bmFtZTogJ2VuZF8nICsgaSwgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiBzZWdtZW50LmVuZH0pO1xuICAgICAgICBzdGFydENvdW50cyA9IHN0YXJ0Q291bnRzLmNvbmNhdCh7bmFtZTogJ3N0YXJ0XycgKyBpLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IHNlZ21lbnQuc3RhcnR9KTtcbiAgICAgICAgaWREZWx0YXMgPSBpZERlbHRhcy5jb25jYXQoe25hbWU6ICdpZERlbHRhXycgKyBpLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogc2VnbWVudC5kZWx0YX0pO1xuICAgICAgICBpZFJhbmdlT2Zmc2V0cyA9IGlkUmFuZ2VPZmZzZXRzLmNvbmNhdCh7bmFtZTogJ2lkUmFuZ2VPZmZzZXRfJyArIGksIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogc2VnbWVudC5vZmZzZXR9KTtcbiAgICAgICAgaWYgKHNlZ21lbnQuZ2x5cGhJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBnbHlwaElkcyA9IGdseXBoSWRzLmNvbmNhdCh7bmFtZTogJ2dseXBoXycgKyBpLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IHNlZ21lbnQuZ2x5cGhJZH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdC5maWVsZHMgPSB0LmZpZWxkcy5jb25jYXQoZW5kQ291bnRzKTtcbiAgICB0LmZpZWxkcy5wdXNoKHtuYW1lOiAncmVzZXJ2ZWRQYWQnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9KTtcbiAgICB0LmZpZWxkcyA9IHQuZmllbGRzLmNvbmNhdChzdGFydENvdW50cyk7XG4gICAgdC5maWVsZHMgPSB0LmZpZWxkcy5jb25jYXQoaWREZWx0YXMpO1xuICAgIHQuZmllbGRzID0gdC5maWVsZHMuY29uY2F0KGlkUmFuZ2VPZmZzZXRzKTtcbiAgICB0LmZpZWxkcyA9IHQuZmllbGRzLmNvbmNhdChnbHlwaElkcyk7XG5cbiAgICB0Lmxlbmd0aCA9IDE0ICsgLy8gU3VidGFibGUgaGVhZGVyXG4gICAgICAgIGVuZENvdW50cy5sZW5ndGggKiAyICtcbiAgICAgICAgMiArIC8vIHJlc2VydmVkUGFkXG4gICAgICAgIHN0YXJ0Q291bnRzLmxlbmd0aCAqIDIgK1xuICAgICAgICBpZERlbHRhcy5sZW5ndGggKiAyICtcbiAgICAgICAgaWRSYW5nZU9mZnNldHMubGVuZ3RoICogMiArXG4gICAgICAgIGdseXBoSWRzLmxlbmd0aCAqIDI7XG5cbiAgICByZXR1cm4gdDtcbn1cblxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlQ21hcFRhYmxlO1xuZXhwb3J0cy5tYWtlID0gbWFrZUNtYXBUYWJsZTtcbiIsIi8vIFRoZSBgZnZhcmAgdGFibGUgc3RvcmVzIGZvbnQgdmFyaWF0aW9uIGF4ZXMgYW5kIGluc3RhbmNlcy5cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLmFwcGxlLmNvbS9mb250cy9UcnVlVHlwZS1SZWZlcmVuY2UtTWFudWFsL1JNMDYvQ2hhcDZmdmFyLmh0bWxcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2hlY2sgPSByZXF1aXJlKCcuLi9jaGVjaycpO1xudmFyIHBhcnNlID0gcmVxdWlyZSgnLi4vcGFyc2UnKTtcbnZhciB0YWJsZSA9IHJlcXVpcmUoJy4uL3RhYmxlJyk7XG5cbmZ1bmN0aW9uIGFkZE5hbWUobmFtZSwgbmFtZXMpIHtcbiAgICB2YXIgbmFtZVN0cmluZyA9IEpTT04uc3RyaW5naWZ5KG5hbWUpO1xuICAgIHZhciBuYW1lSUQgPSAyNTY7XG4gICAgZm9yICh2YXIgbmFtZUtleSBpbiBuYW1lcykge1xuICAgICAgICB2YXIgbiA9IHBhcnNlSW50KG5hbWVLZXkpO1xuICAgICAgICBpZiAoIW4gfHwgbiA8IDI1Nikge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkobmFtZXNbbmFtZUtleV0pID09PSBuYW1lU3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuYW1lSUQgPD0gbikge1xuICAgICAgICAgICAgbmFtZUlEID0gbiArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuYW1lc1tuYW1lSURdID0gbmFtZTtcbiAgICByZXR1cm4gbmFtZUlEO1xufVxuXG5mdW5jdGlvbiBtYWtlRnZhckF4aXMobiwgYXhpcywgbmFtZXMpIHtcbiAgICB2YXIgbmFtZUlEID0gYWRkTmFtZShheGlzLm5hbWUsIG5hbWVzKTtcbiAgICByZXR1cm4gW1xuICAgICAgICB7bmFtZTogJ3RhZ18nICsgbiwgdHlwZTogJ1RBRycsIHZhbHVlOiBheGlzLnRhZ30sXG4gICAgICAgIHtuYW1lOiAnbWluVmFsdWVfJyArIG4sIHR5cGU6ICdGSVhFRCcsIHZhbHVlOiBheGlzLm1pblZhbHVlIDw8IDE2fSxcbiAgICAgICAge25hbWU6ICdkZWZhdWx0VmFsdWVfJyArIG4sIHR5cGU6ICdGSVhFRCcsIHZhbHVlOiBheGlzLmRlZmF1bHRWYWx1ZSA8PCAxNn0sXG4gICAgICAgIHtuYW1lOiAnbWF4VmFsdWVfJyArIG4sIHR5cGU6ICdGSVhFRCcsIHZhbHVlOiBheGlzLm1heFZhbHVlIDw8IDE2fSxcbiAgICAgICAge25hbWU6ICdmbGFnc18nICsgbiwgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICduYW1lSURfJyArIG4sIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogbmFtZUlEfVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIHBhcnNlRnZhckF4aXMoZGF0YSwgc3RhcnQsIG5hbWVzKSB7XG4gICAgdmFyIGF4aXMgPSB7fTtcbiAgICB2YXIgcCA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQpO1xuICAgIGF4aXMudGFnID0gcC5wYXJzZVRhZygpO1xuICAgIGF4aXMubWluVmFsdWUgPSBwLnBhcnNlRml4ZWQoKTtcbiAgICBheGlzLmRlZmF1bHRWYWx1ZSA9IHAucGFyc2VGaXhlZCgpO1xuICAgIGF4aXMubWF4VmFsdWUgPSBwLnBhcnNlRml4ZWQoKTtcbiAgICBwLnNraXAoJ3VTaG9ydCcsIDEpOyAgLy8gcmVzZXJ2ZWQgZm9yIGZsYWdzOyBubyB2YWx1ZXMgZGVmaW5lZFxuICAgIGF4aXMubmFtZSA9IG5hbWVzW3AucGFyc2VVU2hvcnQoKV0gfHwge307XG4gICAgcmV0dXJuIGF4aXM7XG59XG5cbmZ1bmN0aW9uIG1ha2VGdmFySW5zdGFuY2UobiwgaW5zdCwgYXhlcywgbmFtZXMpIHtcbiAgICB2YXIgbmFtZUlEID0gYWRkTmFtZShpbnN0Lm5hbWUsIG5hbWVzKTtcbiAgICB2YXIgZmllbGRzID0gW1xuICAgICAgICB7bmFtZTogJ25hbWVJRF8nICsgbiwgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiBuYW1lSUR9LFxuICAgICAgICB7bmFtZTogJ2ZsYWdzXycgKyBuLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9XG4gICAgXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXhlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgYXhpc1RhZyA9IGF4ZXNbaV0udGFnO1xuICAgICAgICBmaWVsZHMucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiAnYXhpc18nICsgbiArICcgJyArIGF4aXNUYWcsXG4gICAgICAgICAgICB0eXBlOiAnRklYRUQnLFxuICAgICAgICAgICAgdmFsdWU6IGluc3QuY29vcmRpbmF0ZXNbYXhpc1RhZ10gPDwgMTZcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZnVuY3Rpb24gcGFyc2VGdmFySW5zdGFuY2UoZGF0YSwgc3RhcnQsIGF4ZXMsIG5hbWVzKSB7XG4gICAgdmFyIGluc3QgPSB7fTtcbiAgICB2YXIgcCA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQpO1xuICAgIGluc3QubmFtZSA9IG5hbWVzW3AucGFyc2VVU2hvcnQoKV0gfHwge307XG4gICAgcC5za2lwKCd1U2hvcnQnLCAxKTsgIC8vIHJlc2VydmVkIGZvciBmbGFnczsgbm8gdmFsdWVzIGRlZmluZWRcblxuICAgIGluc3QuY29vcmRpbmF0ZXMgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF4ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaW5zdC5jb29yZGluYXRlc1theGVzW2ldLnRhZ10gPSBwLnBhcnNlRml4ZWQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5zdDtcbn1cblxuZnVuY3Rpb24gbWFrZUZ2YXJUYWJsZShmdmFyLCBuYW1lcykge1xuICAgIHZhciByZXN1bHQgPSBuZXcgdGFibGUuVGFibGUoJ2Z2YXInLCBbXG4gICAgICAgIHtuYW1lOiAndmVyc2lvbicsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAweDEwMDAwfSxcbiAgICAgICAge25hbWU6ICdvZmZzZXRUb0RhdGEnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2NvdW50U2l6ZVBhaXJzJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAyfSxcbiAgICAgICAge25hbWU6ICdheGlzQ291bnQnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IGZ2YXIuYXhlcy5sZW5ndGh9LFxuICAgICAgICB7bmFtZTogJ2F4aXNTaXplJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAyMH0sXG4gICAgICAgIHtuYW1lOiAnaW5zdGFuY2VDb3VudCcsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogZnZhci5pbnN0YW5jZXMubGVuZ3RofSxcbiAgICAgICAge25hbWU6ICdpbnN0YW5jZVNpemUnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDQgKyBmdmFyLmF4ZXMubGVuZ3RoICogNH1cbiAgICBdKTtcbiAgICByZXN1bHQub2Zmc2V0VG9EYXRhID0gcmVzdWx0LnNpemVPZigpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmdmFyLmF4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVzdWx0LmZpZWxkcyA9IHJlc3VsdC5maWVsZHMuY29uY2F0KG1ha2VGdmFyQXhpcyhpLCBmdmFyLmF4ZXNbaV0sIG5hbWVzKSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBmdmFyLmluc3RhbmNlcy5sZW5ndGg7IGorKykge1xuICAgICAgICByZXN1bHQuZmllbGRzID0gcmVzdWx0LmZpZWxkcy5jb25jYXQobWFrZUZ2YXJJbnN0YW5jZShqLCBmdmFyLmluc3RhbmNlc1tqXSwgZnZhci5heGVzLCBuYW1lcykpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRnZhclRhYmxlKGRhdGEsIHN0YXJ0LCBuYW1lcykge1xuICAgIHZhciBwID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCk7XG4gICAgdmFyIHRhYmxlVmVyc2lvbiA9IHAucGFyc2VVTG9uZygpO1xuICAgIGNoZWNrLmFyZ3VtZW50KHRhYmxlVmVyc2lvbiA9PT0gMHgwMDAxMDAwMCwgJ1Vuc3VwcG9ydGVkIGZ2YXIgdGFibGUgdmVyc2lvbi4nKTtcbiAgICB2YXIgb2Zmc2V0VG9EYXRhID0gcC5wYXJzZU9mZnNldDE2KCk7XG4gICAgLy8gU2tpcCBjb3VudFNpemVQYWlycy5cbiAgICBwLnNraXAoJ3VTaG9ydCcsIDEpO1xuICAgIHZhciBheGlzQ291bnQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgdmFyIGF4aXNTaXplID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIHZhciBpbnN0YW5jZUNvdW50ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIHZhciBpbnN0YW5jZVNpemUgPSBwLnBhcnNlVVNob3J0KCk7XG5cbiAgICB2YXIgYXhlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXhpc0NvdW50OyBpKyspIHtcbiAgICAgICAgYXhlcy5wdXNoKHBhcnNlRnZhckF4aXMoZGF0YSwgc3RhcnQgKyBvZmZzZXRUb0RhdGEgKyBpICogYXhpc1NpemUsIG5hbWVzKSk7XG4gICAgfVxuXG4gICAgdmFyIGluc3RhbmNlcyA9IFtdO1xuICAgIHZhciBpbnN0YW5jZVN0YXJ0ID0gc3RhcnQgKyBvZmZzZXRUb0RhdGEgKyBheGlzQ291bnQgKiBheGlzU2l6ZTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGluc3RhbmNlQ291bnQ7IGorKykge1xuICAgICAgICBpbnN0YW5jZXMucHVzaChwYXJzZUZ2YXJJbnN0YW5jZShkYXRhLCBpbnN0YW5jZVN0YXJ0ICsgaiAqIGluc3RhbmNlU2l6ZSwgYXhlcywgbmFtZXMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge2F4ZXM6IGF4ZXMsIGluc3RhbmNlczogaW5zdGFuY2VzfTtcbn1cblxuZXhwb3J0cy5tYWtlID0gbWFrZUZ2YXJUYWJsZTtcbmV4cG9ydHMucGFyc2UgPSBwYXJzZUZ2YXJUYWJsZTtcbiIsIi8vIFRoZSBgZ2x5ZmAgdGFibGUgZGVzY3JpYmVzIHRoZSBnbHlwaHMgaW4gVHJ1ZVR5cGUgb3V0bGluZSBmb3JtYXQuXG4vLyBodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vdHlwb2dyYXBoeS9vdHNwZWMvZ2x5Zi5odG1cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2hlY2sgPSByZXF1aXJlKCcuLi9jaGVjaycpO1xudmFyIGdseXBoc2V0ID0gcmVxdWlyZSgnLi4vZ2x5cGhzZXQnKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4uL3BhcnNlJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJy4uL3BhdGgnKTtcblxuLy8gUGFyc2UgdGhlIGNvb3JkaW5hdGUgZGF0YSBmb3IgYSBnbHlwaC5cbmZ1bmN0aW9uIHBhcnNlR2x5cGhDb29yZGluYXRlKHAsIGZsYWcsIHByZXZpb3VzVmFsdWUsIHNob3J0VmVjdG9yQml0TWFzaywgc2FtZUJpdE1hc2spIHtcbiAgICB2YXIgdjtcbiAgICBpZiAoKGZsYWcgJiBzaG9ydFZlY3RvckJpdE1hc2spID4gMCkge1xuICAgICAgICAvLyBUaGUgY29vcmRpbmF0ZSBpcyAxIGJ5dGUgbG9uZy5cbiAgICAgICAgdiA9IHAucGFyc2VCeXRlKCk7XG4gICAgICAgIC8vIFRoZSBgc2FtZWAgYml0IGlzIHJlLXVzZWQgZm9yIHNob3J0IHZhbHVlcyB0byBzaWduaWZ5IHRoZSBzaWduIG9mIHRoZSB2YWx1ZS5cbiAgICAgICAgaWYgKChmbGFnICYgc2FtZUJpdE1hc2spID09PSAwKSB7XG4gICAgICAgICAgICB2ID0gLXY7XG4gICAgICAgIH1cblxuICAgICAgICB2ID0gcHJldmlvdXNWYWx1ZSArIHY7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gIFRoZSBjb29yZGluYXRlIGlzIDIgYnl0ZXMgbG9uZy5cbiAgICAgICAgLy8gSWYgdGhlIGBzYW1lYCBiaXQgaXMgc2V0LCB0aGUgY29vcmRpbmF0ZSBpcyB0aGUgc2FtZSBhcyB0aGUgcHJldmlvdXMgY29vcmRpbmF0ZS5cbiAgICAgICAgaWYgKChmbGFnICYgc2FtZUJpdE1hc2spID4gMCkge1xuICAgICAgICAgICAgdiA9IHByZXZpb3VzVmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBQYXJzZSB0aGUgY29vcmRpbmF0ZSBhcyBhIHNpZ25lZCAxNi1iaXQgZGVsdGEgdmFsdWUuXG4gICAgICAgICAgICB2ID0gcHJldmlvdXNWYWx1ZSArIHAucGFyc2VTaG9ydCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHY7XG59XG5cbi8vIFBhcnNlIGEgVHJ1ZVR5cGUgZ2x5cGguXG5mdW5jdGlvbiBwYXJzZUdseXBoKGdseXBoLCBkYXRhLCBzdGFydCkge1xuICAgIHZhciBwID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCk7XG4gICAgZ2x5cGgubnVtYmVyT2ZDb250b3VycyA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGdseXBoLnhNaW4gPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBnbHlwaC55TWluID0gcC5wYXJzZVNob3J0KCk7XG4gICAgZ2x5cGgueE1heCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGdseXBoLnlNYXggPSBwLnBhcnNlU2hvcnQoKTtcbiAgICB2YXIgZmxhZ3M7XG4gICAgdmFyIGZsYWc7XG4gICAgaWYgKGdseXBoLm51bWJlck9mQ29udG91cnMgPiAwKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICAvLyBUaGlzIGdseXBoIGlzIG5vdCBhIGNvbXBvc2l0ZS5cbiAgICAgICAgdmFyIGVuZFBvaW50SW5kaWNlcyA9IGdseXBoLmVuZFBvaW50SW5kaWNlcyA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZ2x5cGgubnVtYmVyT2ZDb250b3VyczsgaSArPSAxKSB7XG4gICAgICAgICAgICBlbmRQb2ludEluZGljZXMucHVzaChwLnBhcnNlVVNob3J0KCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2x5cGguaW5zdHJ1Y3Rpb25MZW5ndGggPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIGdseXBoLmluc3RydWN0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZ2x5cGguaW5zdHJ1Y3Rpb25MZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgZ2x5cGguaW5zdHJ1Y3Rpb25zLnB1c2gocC5wYXJzZUJ5dGUoKSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbnVtYmVyT2ZDb29yZGluYXRlcyA9IGVuZFBvaW50SW5kaWNlc1tlbmRQb2ludEluZGljZXMubGVuZ3RoIC0gMV0gKyAxO1xuICAgICAgICBmbGFncyA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbnVtYmVyT2ZDb29yZGluYXRlczsgaSArPSAxKSB7XG4gICAgICAgICAgICBmbGFnID0gcC5wYXJzZUJ5dGUoKTtcbiAgICAgICAgICAgIGZsYWdzLnB1c2goZmxhZyk7XG4gICAgICAgICAgICAvLyBJZiBiaXQgMyBpcyBzZXQsIHdlIHJlcGVhdCB0aGlzIGZsYWcgbiB0aW1lcywgd2hlcmUgbiBpcyB0aGUgbmV4dCBieXRlLlxuICAgICAgICAgICAgaWYgKChmbGFnICYgOCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlcGVhdENvdW50ID0gcC5wYXJzZUJ5dGUoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlcGVhdENvdW50OyBqICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MucHVzaChmbGFnKTtcbiAgICAgICAgICAgICAgICAgICAgaSArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNoZWNrLmFyZ3VtZW50KGZsYWdzLmxlbmd0aCA9PT0gbnVtYmVyT2ZDb29yZGluYXRlcywgJ0JhZCBmbGFncy4nKTtcblxuICAgICAgICBpZiAoZW5kUG9pbnRJbmRpY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBwb2ludHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBwb2ludDtcbiAgICAgICAgICAgIC8vIFgvWSBjb29yZGluYXRlcyBhcmUgcmVsYXRpdmUgdG8gdGhlIHByZXZpb3VzIHBvaW50LCBleGNlcHQgZm9yIHRoZSBmaXJzdCBwb2ludCB3aGljaCBpcyByZWxhdGl2ZSB0byAwLDAuXG4gICAgICAgICAgICBpZiAobnVtYmVyT2ZDb29yZGluYXRlcyA+IDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbnVtYmVyT2ZDb29yZGluYXRlczsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWcgPSBmbGFnc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnQub25DdXJ2ZSA9ICEhKGZsYWcgJiAxKTtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnQubGFzdFBvaW50T2ZDb250b3VyID0gZW5kUG9pbnRJbmRpY2VzLmluZGV4T2YoaSkgPj0gMDtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2gocG9pbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBweCA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG51bWJlck9mQ29vcmRpbmF0ZXM7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBmbGFnID0gZmxhZ3NbaV07XG4gICAgICAgICAgICAgICAgICAgIHBvaW50ID0gcG9pbnRzW2ldO1xuICAgICAgICAgICAgICAgICAgICBwb2ludC54ID0gcGFyc2VHbHlwaENvb3JkaW5hdGUocCwgZmxhZywgcHgsIDIsIDE2KTtcbiAgICAgICAgICAgICAgICAgICAgcHggPSBwb2ludC54O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBweSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG51bWJlck9mQ29vcmRpbmF0ZXM7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBmbGFnID0gZmxhZ3NbaV07XG4gICAgICAgICAgICAgICAgICAgIHBvaW50ID0gcG9pbnRzW2ldO1xuICAgICAgICAgICAgICAgICAgICBwb2ludC55ID0gcGFyc2VHbHlwaENvb3JkaW5hdGUocCwgZmxhZywgcHksIDQsIDMyKTtcbiAgICAgICAgICAgICAgICAgICAgcHkgPSBwb2ludC55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2x5cGgucG9pbnRzID0gcG9pbnRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2x5cGgucG9pbnRzID0gW107XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGdseXBoLm51bWJlck9mQ29udG91cnMgPT09IDApIHtcbiAgICAgICAgZ2x5cGgucG9pbnRzID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2x5cGguaXNDb21wb3NpdGUgPSB0cnVlO1xuICAgICAgICBnbHlwaC5wb2ludHMgPSBbXTtcbiAgICAgICAgZ2x5cGguY29tcG9uZW50cyA9IFtdO1xuICAgICAgICB2YXIgbW9yZUNvbXBvbmVudHMgPSB0cnVlO1xuICAgICAgICB3aGlsZSAobW9yZUNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGZsYWdzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICAgICAgdmFyIGNvbXBvbmVudCA9IHtcbiAgICAgICAgICAgICAgICBnbHlwaEluZGV4OiBwLnBhcnNlVVNob3J0KCksXG4gICAgICAgICAgICAgICAgeFNjYWxlOiAxLFxuICAgICAgICAgICAgICAgIHNjYWxlMDE6IDAsXG4gICAgICAgICAgICAgICAgc2NhbGUxMDogMCxcbiAgICAgICAgICAgICAgICB5U2NhbGU6IDEsXG4gICAgICAgICAgICAgICAgZHg6IDAsXG4gICAgICAgICAgICAgICAgZHk6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoKGZsYWdzICYgMSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGFyZ3VtZW50cyBhcmUgd29yZHNcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuZHggPSBwLnBhcnNlU2hvcnQoKTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuZHkgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGFyZ3VtZW50cyBhcmUgYnl0ZXNcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuZHggPSBwLnBhcnNlQ2hhcigpO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5keSA9IHAucGFyc2VDaGFyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgoZmxhZ3MgJiA4KSA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgc2NhbGVcbiAgICAgICAgICAgICAgICBjb21wb25lbnQueFNjYWxlID0gY29tcG9uZW50LnlTY2FsZSA9IHAucGFyc2VGMkRvdDE0KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChmbGFncyAmIDY0KSA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGFuIFggLyBZIHNjYWxlXG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnhTY2FsZSA9IHAucGFyc2VGMkRvdDE0KCk7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnlTY2FsZSA9IHAucGFyc2VGMkRvdDE0KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChmbGFncyAmIDEyOCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIDJ4MiB0cmFuc2Zvcm1hdGlvblxuICAgICAgICAgICAgICAgIGNvbXBvbmVudC54U2NhbGUgPSBwLnBhcnNlRjJEb3QxNCgpO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5zY2FsZTAxID0gcC5wYXJzZUYyRG90MTQoKTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuc2NhbGUxMCA9IHAucGFyc2VGMkRvdDE0KCk7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnlTY2FsZSA9IHAucGFyc2VGMkRvdDE0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdseXBoLmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICAgICAgbW9yZUNvbXBvbmVudHMgPSAhIShmbGFncyAmIDMyKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gVHJhbnNmb3JtIGFuIGFycmF5IG9mIHBvaW50cyBhbmQgcmV0dXJuIGEgbmV3IGFycmF5LlxuZnVuY3Rpb24gdHJhbnNmb3JtUG9pbnRzKHBvaW50cywgdHJhbnNmb3JtKSB7XG4gICAgdmFyIG5ld1BvaW50cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBwdCA9IHBvaW50c1tpXTtcbiAgICAgICAgdmFyIG5ld1B0ID0ge1xuICAgICAgICAgICAgeDogdHJhbnNmb3JtLnhTY2FsZSAqIHB0LnggKyB0cmFuc2Zvcm0uc2NhbGUwMSAqIHB0LnkgKyB0cmFuc2Zvcm0uZHgsXG4gICAgICAgICAgICB5OiB0cmFuc2Zvcm0uc2NhbGUxMCAqIHB0LnggKyB0cmFuc2Zvcm0ueVNjYWxlICogcHQueSArIHRyYW5zZm9ybS5keSxcbiAgICAgICAgICAgIG9uQ3VydmU6IHB0Lm9uQ3VydmUsXG4gICAgICAgICAgICBsYXN0UG9pbnRPZkNvbnRvdXI6IHB0Lmxhc3RQb2ludE9mQ29udG91clxuICAgICAgICB9O1xuICAgICAgICBuZXdQb2ludHMucHVzaChuZXdQdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld1BvaW50cztcbn1cblxuZnVuY3Rpb24gZ2V0Q29udG91cnMocG9pbnRzKSB7XG4gICAgdmFyIGNvbnRvdXJzID0gW107XG4gICAgdmFyIGN1cnJlbnRDb250b3VyID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHB0ID0gcG9pbnRzW2ldO1xuICAgICAgICBjdXJyZW50Q29udG91ci5wdXNoKHB0KTtcbiAgICAgICAgaWYgKHB0Lmxhc3RQb2ludE9mQ29udG91cikge1xuICAgICAgICAgICAgY29udG91cnMucHVzaChjdXJyZW50Q29udG91cik7XG4gICAgICAgICAgICBjdXJyZW50Q29udG91ciA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2suYXJndW1lbnQoY3VycmVudENvbnRvdXIubGVuZ3RoID09PSAwLCAnVGhlcmUgYXJlIHN0aWxsIHBvaW50cyBsZWZ0IGluIHRoZSBjdXJyZW50IGNvbnRvdXIuJyk7XG4gICAgcmV0dXJuIGNvbnRvdXJzO1xufVxuXG4vLyBDb252ZXJ0IHRoZSBUcnVlVHlwZSBnbHlwaCBvdXRsaW5lIHRvIGEgUGF0aC5cbmZ1bmN0aW9uIGdldFBhdGgocG9pbnRzKSB7XG4gICAgdmFyIHAgPSBuZXcgcGF0aC5QYXRoKCk7XG4gICAgaWYgKCFwb2ludHMpIHtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuXG4gICAgdmFyIGNvbnRvdXJzID0gZ2V0Q29udG91cnMocG9pbnRzKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRvdXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBjb250b3VyID0gY29udG91cnNbaV07XG4gICAgICAgIHZhciBmaXJzdFB0ID0gY29udG91clswXTtcbiAgICAgICAgdmFyIGxhc3RQdCA9IGNvbnRvdXJbY29udG91ci5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIGN1cnZlUHQ7XG4gICAgICAgIHZhciByZWFsRmlyc3RQb2ludDtcbiAgICAgICAgaWYgKGZpcnN0UHQub25DdXJ2ZSkge1xuICAgICAgICAgICAgY3VydmVQdCA9IG51bGw7XG4gICAgICAgICAgICAvLyBUaGUgZmlyc3QgcG9pbnQgd2lsbCBiZSBjb25zdW1lZCBieSB0aGUgbW92ZVRvIGNvbW1hbmQsXG4gICAgICAgICAgICAvLyBzbyBza2lwIGl0IGluIHRoZSBsb29wLlxuICAgICAgICAgICAgcmVhbEZpcnN0UG9pbnQgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGxhc3RQdC5vbkN1cnZlKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGZpcnN0IHBvaW50IGlzIG9mZi1jdXJ2ZSBhbmQgdGhlIGxhc3QgcG9pbnQgaXMgb24tY3VydmUsXG4gICAgICAgICAgICAgICAgLy8gc3RhcnQgYXQgdGhlIGxhc3QgcG9pbnQuXG4gICAgICAgICAgICAgICAgZmlyc3RQdCA9IGxhc3RQdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgYm90aCBmaXJzdCBhbmQgbGFzdCBwb2ludHMgYXJlIG9mZi1jdXJ2ZSwgc3RhcnQgYXQgdGhlaXIgbWlkZGxlLlxuICAgICAgICAgICAgICAgIGZpcnN0UHQgPSB7IHg6IChmaXJzdFB0LnggKyBsYXN0UHQueCkgLyAyLCB5OiAoZmlyc3RQdC55ICsgbGFzdFB0LnkpIC8gMiB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJ2ZVB0ID0gZmlyc3RQdDtcbiAgICAgICAgICAgIC8vIFRoZSBmaXJzdCBwb2ludCBpcyBzeW50aGVzaXplZCwgc28gZG9uJ3Qgc2tpcCB0aGUgcmVhbCBmaXJzdCBwb2ludC5cbiAgICAgICAgICAgIHJlYWxGaXJzdFBvaW50ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBwLm1vdmVUbyhmaXJzdFB0LngsIGZpcnN0UHQueSk7XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IHJlYWxGaXJzdFBvaW50ID8gMSA6IDA7IGogPCBjb250b3VyLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgICB2YXIgcHQgPSBjb250b3VyW2pdO1xuICAgICAgICAgICAgdmFyIHByZXZQdCA9IGogPT09IDAgPyBmaXJzdFB0IDogY29udG91cltqIC0gMV07XG4gICAgICAgICAgICBpZiAocHJldlB0Lm9uQ3VydmUgJiYgcHQub25DdXJ2ZSkge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdHJhaWdodCBsaW5lLlxuICAgICAgICAgICAgICAgIHAubGluZVRvKHB0LngsIHB0LnkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcmV2UHQub25DdXJ2ZSAmJiAhcHQub25DdXJ2ZSkge1xuICAgICAgICAgICAgICAgIGN1cnZlUHQgPSBwdDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXByZXZQdC5vbkN1cnZlICYmICFwdC5vbkN1cnZlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZFB0ID0geyB4OiAocHJldlB0LnggKyBwdC54KSAvIDIsIHk6IChwcmV2UHQueSArIHB0LnkpIC8gMiB9O1xuICAgICAgICAgICAgICAgIHAucXVhZHJhdGljQ3VydmVUbyhwcmV2UHQueCwgcHJldlB0LnksIG1pZFB0LngsIG1pZFB0LnkpO1xuICAgICAgICAgICAgICAgIGN1cnZlUHQgPSBwdDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXByZXZQdC5vbkN1cnZlICYmIHB0Lm9uQ3VydmUpIHtcbiAgICAgICAgICAgICAgICAvLyBQcmV2aW91cyBwb2ludCBvZmYtY3VydmUsIHRoaXMgcG9pbnQgb24tY3VydmUuXG4gICAgICAgICAgICAgICAgcC5xdWFkcmF0aWNDdXJ2ZVRvKGN1cnZlUHQueCwgY3VydmVQdC55LCBwdC54LCBwdC55KTtcbiAgICAgICAgICAgICAgICBjdXJ2ZVB0ID0gbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0YXRlLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpcnN0UHQgIT09IGxhc3RQdCkge1xuICAgICAgICAgICAgLy8gQ29ubmVjdCB0aGUgbGFzdCBhbmQgZmlyc3QgcG9pbnRzXG4gICAgICAgICAgICBpZiAoY3VydmVQdCkge1xuICAgICAgICAgICAgICAgIHAucXVhZHJhdGljQ3VydmVUbyhjdXJ2ZVB0LngsIGN1cnZlUHQueSwgZmlyc3RQdC54LCBmaXJzdFB0LnkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwLmxpbmVUbyhmaXJzdFB0LngsIGZpcnN0UHQueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwLmNsb3NlUGF0aCgpO1xuICAgIHJldHVybiBwO1xufVxuXG5mdW5jdGlvbiBidWlsZFBhdGgoZ2x5cGhzLCBnbHlwaCkge1xuICAgIGlmIChnbHlwaC5pc0NvbXBvc2l0ZSkge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdseXBoLmNvbXBvbmVudHMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgICAgIHZhciBjb21wb25lbnQgPSBnbHlwaC5jb21wb25lbnRzW2pdO1xuICAgICAgICAgICAgdmFyIGNvbXBvbmVudEdseXBoID0gZ2x5cGhzLmdldChjb21wb25lbnQuZ2x5cGhJbmRleCk7XG4gICAgICAgICAgICAvLyBGb3JjZSB0aGUgdHRmR2x5cGhMb2FkZXIgdG8gcGFyc2UgdGhlIGdseXBoLlxuICAgICAgICAgICAgY29tcG9uZW50R2x5cGguZ2V0UGF0aCgpO1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudEdseXBoLnBvaW50cykge1xuICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1lZFBvaW50cyA9IHRyYW5zZm9ybVBvaW50cyhjb21wb25lbnRHbHlwaC5wb2ludHMsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgZ2x5cGgucG9pbnRzID0gZ2x5cGgucG9pbnRzLmNvbmNhdCh0cmFuc2Zvcm1lZFBvaW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0UGF0aChnbHlwaC5wb2ludHMpO1xufVxuXG4vLyBQYXJzZSBhbGwgdGhlIGdseXBocyBhY2NvcmRpbmcgdG8gdGhlIG9mZnNldHMgZnJvbSB0aGUgYGxvY2FgIHRhYmxlLlxuZnVuY3Rpb24gcGFyc2VHbHlmVGFibGUoZGF0YSwgc3RhcnQsIGxvY2EsIGZvbnQpIHtcbiAgICB2YXIgZ2x5cGhzID0gbmV3IGdseXBoc2V0LkdseXBoU2V0KGZvbnQpO1xuICAgIHZhciBpO1xuXG4gICAgLy8gVGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgbG9jYSB0YWJsZSBpcyBpbnZhbGlkLlxuICAgIGZvciAoaSA9IDA7IGkgPCBsb2NhLmxlbmd0aCAtIDE7IGkgKz0gMSkge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gbG9jYVtpXTtcbiAgICAgICAgdmFyIG5leHRPZmZzZXQgPSBsb2NhW2kgKyAxXTtcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gbmV4dE9mZnNldCkge1xuICAgICAgICAgICAgZ2x5cGhzLnB1c2goaSwgZ2x5cGhzZXQudHRmR2x5cGhMb2FkZXIoZm9udCwgaSwgcGFyc2VHbHlwaCwgZGF0YSwgc3RhcnQgKyBvZmZzZXQsIGJ1aWxkUGF0aCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2x5cGhzLnB1c2goaSwgZ2x5cGhzZXQuZ2x5cGhMb2FkZXIoZm9udCwgaSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdseXBocztcbn1cblxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlR2x5ZlRhYmxlO1xuIiwiLy8gVGhlIGBHUE9TYCB0YWJsZSBjb250YWlucyBrZXJuaW5nIHBhaXJzLCBhbW9uZyBvdGhlciB0aGluZ3MuXG4vLyBodHRwczovL3d3dy5taWNyb3NvZnQuY29tL3R5cG9ncmFwaHkvT1RTUEVDL2dwb3MuaHRtXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNoZWNrID0gcmVxdWlyZSgnLi4vY2hlY2snKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4uL3BhcnNlJyk7XG5cbi8vIFBhcnNlIFNjcmlwdExpc3QgYW5kIEZlYXR1cmVMaXN0IHRhYmxlcyBvZiBHUE9TLCBHU1VCLCBHREVGLCBCQVNFLCBKU1RGIHRhYmxlcy5cbi8vIFRoZXNlIGxpc3RzIGFyZSB1bnVzZWQgYnkgbm93LCB0aGlzIGZ1bmN0aW9uIGlzIGp1c3QgdGhlIGJhc2lzIGZvciBhIHJlYWwgcGFyc2luZy5cbmZ1bmN0aW9uIHBhcnNlVGFnZ2VkTGlzdFRhYmxlKGRhdGEsIHN0YXJ0KSB7XG4gICAgdmFyIHAgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0KTtcbiAgICB2YXIgbiA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICB2YXIgbGlzdCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIGxpc3RbcC5wYXJzZVRhZygpXSA9IHsgb2Zmc2V0OiBwLnBhcnNlVVNob3J0KCkgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGlzdDtcbn1cblxuLy8gUGFyc2UgYSBjb3ZlcmFnZSB0YWJsZSBpbiBhIEdTVUIsIEdQT1Mgb3IgR0RFRiB0YWJsZS5cbi8vIEZvcm1hdCAxIGlzIGEgc2ltcGxlIGxpc3Qgb2YgZ2x5cGggaWRzLFxuLy8gRm9ybWF0IDIgaXMgYSBsaXN0IG9mIHJhbmdlcy4gSXQgaXMgZXhwYW5kZWQgaW4gYSBsaXN0IG9mIGdseXBocywgbWF5YmUgbm90IHRoZSBiZXN0IGlkZWEuXG5mdW5jdGlvbiBwYXJzZUNvdmVyYWdlVGFibGUoZGF0YSwgc3RhcnQpIHtcbiAgICB2YXIgcCA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQpO1xuICAgIHZhciBmb3JtYXQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgdmFyIGNvdW50ID0gIHAucGFyc2VVU2hvcnQoKTtcbiAgICBpZiAoZm9ybWF0ID09PSAxKSB7XG4gICAgICAgIHJldHVybiBwLnBhcnNlVVNob3J0TGlzdChjb3VudCk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09IDIpIHtcbiAgICAgICAgdmFyIGNvdmVyYWdlID0gW107XG4gICAgICAgIGZvciAoOyBjb3VudC0tOykge1xuICAgICAgICAgICAgdmFyIGJlZ2luID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICAgICAgdmFyIGVuZCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBiZWdpbjsgaSA8PSBlbmQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvdmVyYWdlW2luZGV4KytdID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb3ZlcmFnZTtcbiAgICB9XG59XG5cbi8vIFBhcnNlIGEgQ2xhc3MgRGVmaW5pdGlvbiBUYWJsZSBpbiBhIEdTVUIsIEdQT1Mgb3IgR0RFRiB0YWJsZS5cbi8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGdldHMgYSBjbGFzcyB2YWx1ZSBmcm9tIGEgZ2x5cGggSUQuXG5mdW5jdGlvbiBwYXJzZUNsYXNzRGVmVGFibGUoZGF0YSwgc3RhcnQpIHtcbiAgICB2YXIgcCA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQpO1xuICAgIHZhciBmb3JtYXQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgaWYgKGZvcm1hdCA9PT0gMSkge1xuICAgICAgICAvLyBGb3JtYXQgMSBzcGVjaWZpZXMgYSByYW5nZSBvZiBjb25zZWN1dGl2ZSBnbHlwaCBpbmRpY2VzLCBvbmUgY2xhc3MgcGVyIGdseXBoIElELlxuICAgICAgICB2YXIgc3RhcnRHbHlwaCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgdmFyIGdseXBoQ291bnQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIHZhciBjbGFzc2VzID0gcC5wYXJzZVVTaG9ydExpc3QoZ2x5cGhDb3VudCk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihnbHlwaElEKSB7XG4gICAgICAgICAgICByZXR1cm4gY2xhc3Nlc1tnbHlwaElEIC0gc3RhcnRHbHlwaF0gfHwgMDtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gMikge1xuICAgICAgICAvLyBGb3JtYXQgMiBkZWZpbmVzIG11bHRpcGxlIGdyb3VwcyBvZiBnbHlwaCBpbmRpY2VzIHRoYXQgYmVsb25nIHRvIHRoZSBzYW1lIGNsYXNzLlxuICAgICAgICB2YXIgcmFuZ2VDb3VudCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgdmFyIHN0YXJ0R2x5cGhzID0gW107XG4gICAgICAgIHZhciBlbmRHbHlwaHMgPSBbXTtcbiAgICAgICAgdmFyIGNsYXNzVmFsdWVzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFuZ2VDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBzdGFydEdseXBoc1tpXSA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgICAgIGVuZEdseXBoc1tpXSA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgICAgIGNsYXNzVmFsdWVzW2ldID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGdseXBoSUQpIHtcbiAgICAgICAgICAgIHZhciBsID0gMDtcbiAgICAgICAgICAgIHZhciByID0gc3RhcnRHbHlwaHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHdoaWxlIChsIDwgcikge1xuICAgICAgICAgICAgICAgIHZhciBjID0gKGwgKyByICsgMSkgPj4gMTtcbiAgICAgICAgICAgICAgICBpZiAoZ2x5cGhJRCA8IHN0YXJ0R2x5cGhzW2NdKSB7XG4gICAgICAgICAgICAgICAgICAgIHIgPSBjIC0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsID0gYztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdGFydEdseXBoc1tsXSA8PSBnbHlwaElEICYmIGdseXBoSUQgPD0gZW5kR2x5cGhzW2xdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsYXNzVmFsdWVzW2xdIHx8IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9O1xuICAgIH1cbn1cblxuLy8gUGFyc2UgYSBwYWlyIGFkanVzdG1lbnQgcG9zaXRpb25pbmcgc3VidGFibGUsIGZvcm1hdCAxIG9yIGZvcm1hdCAyXG4vLyBUaGUgc3VidGFibGUgaXMgcmV0dXJuZWQgaW4gdGhlIGZvcm0gb2YgYSBsb29rdXAgZnVuY3Rpb24uXG5mdW5jdGlvbiBwYXJzZVBhaXJQb3NTdWJUYWJsZShkYXRhLCBzdGFydCkge1xuICAgIHZhciBwID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCk7XG4gICAgLy8gVGhpcyBwYXJ0IGlzIGNvbW1vbiB0byBmb3JtYXQgMSBhbmQgZm9ybWF0IDIgc3VidGFibGVzXG4gICAgdmFyIGZvcm1hdCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICB2YXIgY292ZXJhZ2VPZmZzZXQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgdmFyIGNvdmVyYWdlID0gcGFyc2VDb3ZlcmFnZVRhYmxlKGRhdGEsIHN0YXJ0ICsgY292ZXJhZ2VPZmZzZXQpO1xuICAgIC8vIHZhbHVlRm9ybWF0IDQ6IFhBZHZhbmNlIG9ubHksIDE6IFhQbGFjZW1lbnQgb25seSwgMDogbm8gVmFsdWVSZWNvcmQgZm9yIHNlY29uZCBnbHlwaFxuICAgIC8vIE9ubHkgdmFsdWVGb3JtYXQxPTQgYW5kIHZhbHVlRm9ybWF0Mj0wIGlzIHN1cHBvcnRlZC5cbiAgICB2YXIgdmFsdWVGb3JtYXQxID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIHZhciB2YWx1ZUZvcm1hdDIgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgdmFyIHZhbHVlMTtcbiAgICB2YXIgdmFsdWUyO1xuICAgIGlmICh2YWx1ZUZvcm1hdDEgIT09IDQgfHwgdmFsdWVGb3JtYXQyICE9PSAwKSByZXR1cm47XG4gICAgdmFyIHNoYXJlZFBhaXJTZXRzID0ge307XG4gICAgaWYgKGZvcm1hdCA9PT0gMSkge1xuICAgICAgICAvLyBQYWlyIFBvc2l0aW9uaW5nIEFkanVzdG1lbnQ6IEZvcm1hdCAxXG4gICAgICAgIHZhciBwYWlyU2V0Q291bnQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIHZhciBwYWlyU2V0ID0gW107XG4gICAgICAgIC8vIEFycmF5IG9mIG9mZnNldHMgdG8gUGFpclNldCB0YWJsZXMtZnJvbSBiZWdpbm5pbmcgb2YgUGFpclBvcyBzdWJ0YWJsZS1vcmRlcmVkIGJ5IENvdmVyYWdlIEluZGV4XG4gICAgICAgIHZhciBwYWlyU2V0T2Zmc2V0cyA9IHAucGFyc2VPZmZzZXQxNkxpc3QocGFpclNldENvdW50KTtcbiAgICAgICAgZm9yICh2YXIgZmlyc3RHbHlwaCA9IDA7IGZpcnN0R2x5cGggPCBwYWlyU2V0Q291bnQ7IGZpcnN0R2x5cGgrKykge1xuICAgICAgICAgICAgdmFyIHBhaXJTZXRPZmZzZXQgPSBwYWlyU2V0T2Zmc2V0c1tmaXJzdEdseXBoXTtcbiAgICAgICAgICAgIHZhciBzaGFyZWRQYWlyU2V0ID0gc2hhcmVkUGFpclNldHNbcGFpclNldE9mZnNldF07XG4gICAgICAgICAgICBpZiAoIXNoYXJlZFBhaXJTZXQpIHtcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBhIHBhaXJzZXQgdGFibGUgaW4gYSBwYWlyIGFkanVzdG1lbnQgc3VidGFibGUgZm9ybWF0IDFcbiAgICAgICAgICAgICAgICBzaGFyZWRQYWlyU2V0ID0ge307XG4gICAgICAgICAgICAgICAgcC5yZWxhdGl2ZU9mZnNldCA9IHBhaXJTZXRPZmZzZXQ7XG4gICAgICAgICAgICAgICAgdmFyIHBhaXJWYWx1ZUNvdW50ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICAgICAgICAgIGZvciAoOyBwYWlyVmFsdWVDb3VudC0tOykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2Vjb25kR2x5cGggPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZUZvcm1hdDEpIHZhbHVlMSA9IHAucGFyc2VTaG9ydCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVGb3JtYXQyKSB2YWx1ZTIgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2Ugb25seSBzdXBwb3J0IHZhbHVlRm9ybWF0MSA9IDQgYW5kIHZhbHVlRm9ybWF0MiA9IDAsXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvIHZhbHVlMSBpcyB0aGUgWEFkdmFuY2UgYW5kIHZhbHVlMiBpcyBlbXB0eS5cbiAgICAgICAgICAgICAgICAgICAgc2hhcmVkUGFpclNldFtzZWNvbmRHbHlwaF0gPSB2YWx1ZTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYWlyU2V0W2NvdmVyYWdlW2ZpcnN0R2x5cGhdXSA9IHNoYXJlZFBhaXJTZXQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obGVmdEdseXBoLCByaWdodEdseXBoKSB7XG4gICAgICAgICAgICB2YXIgcGFpcnMgPSBwYWlyU2V0W2xlZnRHbHlwaF07XG4gICAgICAgICAgICBpZiAocGFpcnMpIHJldHVybiBwYWlyc1tyaWdodEdseXBoXTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gMikge1xuICAgICAgICAvLyBQYWlyIFBvc2l0aW9uaW5nIEFkanVzdG1lbnQ6IEZvcm1hdCAyXG4gICAgICAgIHZhciBjbGFzc0RlZjFPZmZzZXQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIHZhciBjbGFzc0RlZjJPZmZzZXQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIHZhciBjbGFzczFDb3VudCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgdmFyIGNsYXNzMkNvdW50ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICB2YXIgZ2V0Q2xhc3MxID0gcGFyc2VDbGFzc0RlZlRhYmxlKGRhdGEsIHN0YXJ0ICsgY2xhc3NEZWYxT2Zmc2V0KTtcbiAgICAgICAgdmFyIGdldENsYXNzMiA9IHBhcnNlQ2xhc3NEZWZUYWJsZShkYXRhLCBzdGFydCArIGNsYXNzRGVmMk9mZnNldCk7XG5cbiAgICAgICAgLy8gUGFyc2Uga2VybmluZyB2YWx1ZXMgYnkgY2xhc3MgcGFpci5cbiAgICAgICAgdmFyIGtlcm5pbmdNYXRyaXggPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzczFDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2VybmluZ1JvdyA9IGtlcm5pbmdNYXRyaXhbaV0gPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2xhc3MyQ291bnQ7IGorKykge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZUZvcm1hdDEpIHZhbHVlMSA9IHAucGFyc2VTaG9ydCgpO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZUZvcm1hdDIpIHZhbHVlMiA9IHAucGFyc2VTaG9ydCgpO1xuICAgICAgICAgICAgICAgIC8vIFdlIG9ubHkgc3VwcG9ydCB2YWx1ZUZvcm1hdDEgPSA0IGFuZCB2YWx1ZUZvcm1hdDIgPSAwLFxuICAgICAgICAgICAgICAgIC8vIHNvIHZhbHVlMSBpcyB0aGUgWEFkdmFuY2UgYW5kIHZhbHVlMiBpcyBlbXB0eS5cbiAgICAgICAgICAgICAgICBrZXJuaW5nUm93W2pdID0gdmFsdWUxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29udmVydCBjb3ZlcmFnZSBsaXN0IHRvIGEgaGFzaFxuICAgICAgICB2YXIgY292ZXJlZCA9IHt9O1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY292ZXJhZ2UubGVuZ3RoOyBpKyspIGNvdmVyZWRbY292ZXJhZ2VbaV1dID0gMTtcblxuICAgICAgICAvLyBHZXQgdGhlIGtlcm5pbmcgdmFsdWUgZm9yIGEgc3BlY2lmaWMgZ2x5cGggcGFpci5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGxlZnRHbHlwaCwgcmlnaHRHbHlwaCkge1xuICAgICAgICAgICAgaWYgKCFjb3ZlcmVkW2xlZnRHbHlwaF0pIHJldHVybjtcbiAgICAgICAgICAgIHZhciBjbGFzczEgPSBnZXRDbGFzczEobGVmdEdseXBoKTtcbiAgICAgICAgICAgIHZhciBjbGFzczIgPSBnZXRDbGFzczIocmlnaHRHbHlwaCk7XG4gICAgICAgICAgICB2YXIga2VybmluZ1JvdyA9IGtlcm5pbmdNYXRyaXhbY2xhc3MxXTtcblxuICAgICAgICAgICAgaWYgKGtlcm5pbmdSb3cpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ga2VybmluZ1Jvd1tjbGFzczJdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbn1cblxuLy8gUGFyc2UgYSBMb29rdXBUYWJsZSAocHJlc2VudCBpbiBvZiBHUE9TLCBHU1VCLCBHREVGLCBCQVNFLCBKU1RGIHRhYmxlcykuXG5mdW5jdGlvbiBwYXJzZUxvb2t1cFRhYmxlKGRhdGEsIHN0YXJ0KSB7XG4gICAgdmFyIHAgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0KTtcbiAgICB2YXIgbG9va3VwVHlwZSA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICB2YXIgbG9va3VwRmxhZyA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICB2YXIgdXNlTWFya0ZpbHRlcmluZ1NldCA9IGxvb2t1cEZsYWcgJiAweDEwO1xuICAgIHZhciBzdWJUYWJsZUNvdW50ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIHZhciBzdWJUYWJsZU9mZnNldHMgPSBwLnBhcnNlT2Zmc2V0MTZMaXN0KHN1YlRhYmxlQ291bnQpO1xuICAgIHZhciB0YWJsZSA9IHtcbiAgICAgICAgbG9va3VwVHlwZTogbG9va3VwVHlwZSxcbiAgICAgICAgbG9va3VwRmxhZzogbG9va3VwRmxhZyxcbiAgICAgICAgbWFya0ZpbHRlcmluZ1NldDogdXNlTWFya0ZpbHRlcmluZ1NldCA/IHAucGFyc2VVU2hvcnQoKSA6IC0xXG4gICAgfTtcbiAgICAvLyBMb29rdXBUeXBlIDIsIFBhaXIgYWRqdXN0bWVudFxuICAgIGlmIChsb29rdXBUeXBlID09PSAyKSB7XG4gICAgICAgIHZhciBzdWJ0YWJsZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJUYWJsZUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHN1YnRhYmxlcy5wdXNoKHBhcnNlUGFpclBvc1N1YlRhYmxlKGRhdGEsIHN0YXJ0ICsgc3ViVGFibGVPZmZzZXRzW2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmV0dXJuIGEgZnVuY3Rpb24gd2hpY2ggZmluZHMgdGhlIGtlcm5pbmcgdmFsdWVzIGluIHRoZSBzdWJ0YWJsZXMuXG4gICAgICAgIHRhYmxlLmdldEtlcm5pbmdWYWx1ZSA9IGZ1bmN0aW9uKGxlZnRHbHlwaCwgcmlnaHRHbHlwaCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHN1YnRhYmxlcy5sZW5ndGg7IGktLTspIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzdWJ0YWJsZXNbaV0obGVmdEdseXBoLCByaWdodEdseXBoKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFibGU7XG59XG5cbi8vIFBhcnNlIHRoZSBgR1BPU2AgdGFibGUgd2hpY2ggY29udGFpbnMsIGFtb25nIG90aGVyIHRoaW5ncywga2VybmluZyBwYWlycy5cbi8vIGh0dHBzOi8vd3d3Lm1pY3Jvc29mdC5jb20vdHlwb2dyYXBoeS9PVFNQRUMvZ3Bvcy5odG1cbmZ1bmN0aW9uIHBhcnNlR3Bvc1RhYmxlKGRhdGEsIHN0YXJ0LCBmb250KSB7XG4gICAgdmFyIHAgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0KTtcbiAgICB2YXIgdGFibGVWZXJzaW9uID0gcC5wYXJzZUZpeGVkKCk7XG4gICAgY2hlY2suYXJndW1lbnQodGFibGVWZXJzaW9uID09PSAxLCAnVW5zdXBwb3J0ZWQgR1BPUyB0YWJsZSB2ZXJzaW9uLicpO1xuXG4gICAgLy8gU2NyaXB0TGlzdCBhbmQgRmVhdHVyZUxpc3QgLSBpZ25vcmVkIGZvciBub3dcbiAgICBwYXJzZVRhZ2dlZExpc3RUYWJsZShkYXRhLCBzdGFydCArIHAucGFyc2VVU2hvcnQoKSk7XG4gICAgLy8gJ2tlcm4nIGlzIHRoZSBmZWF0dXJlIHdlIGFyZSBsb29raW5nIGZvci5cbiAgICBwYXJzZVRhZ2dlZExpc3RUYWJsZShkYXRhLCBzdGFydCArIHAucGFyc2VVU2hvcnQoKSk7XG5cbiAgICAvLyBMb29rdXBMaXN0XG4gICAgdmFyIGxvb2t1cExpc3RPZmZzZXQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgcC5yZWxhdGl2ZU9mZnNldCA9IGxvb2t1cExpc3RPZmZzZXQ7XG4gICAgdmFyIGxvb2t1cENvdW50ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIHZhciBsb29rdXBUYWJsZU9mZnNldHMgPSBwLnBhcnNlT2Zmc2V0MTZMaXN0KGxvb2t1cENvdW50KTtcbiAgICB2YXIgbG9va3VwTGlzdEFic29sdXRlT2Zmc2V0ID0gc3RhcnQgKyBsb29rdXBMaXN0T2Zmc2V0O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9va3VwQ291bnQ7IGkrKykge1xuICAgICAgICB2YXIgdGFibGUgPSBwYXJzZUxvb2t1cFRhYmxlKGRhdGEsIGxvb2t1cExpc3RBYnNvbHV0ZU9mZnNldCArIGxvb2t1cFRhYmxlT2Zmc2V0c1tpXSk7XG4gICAgICAgIGlmICh0YWJsZS5sb29rdXBUeXBlID09PSAyICYmICFmb250LmdldEdwb3NLZXJuaW5nVmFsdWUpIGZvbnQuZ2V0R3Bvc0tlcm5pbmdWYWx1ZSA9IHRhYmxlLmdldEtlcm5pbmdWYWx1ZTtcbiAgICB9XG59XG5cbmV4cG9ydHMucGFyc2UgPSBwYXJzZUdwb3NUYWJsZTtcbiIsIi8vIFRoZSBgaGVhZGAgdGFibGUgY29udGFpbnMgZ2xvYmFsIGluZm9ybWF0aW9uIGFib3V0IHRoZSBmb250LlxuLy8gaHR0cHM6Ly93d3cubWljcm9zb2Z0LmNvbS90eXBvZ3JhcGh5L09UU1BFQy9oZWFkLmh0bVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjaGVjayA9IHJlcXVpcmUoJy4uL2NoZWNrJyk7XG52YXIgcGFyc2UgPSByZXF1aXJlKCcuLi9wYXJzZScpO1xudmFyIHRhYmxlID0gcmVxdWlyZSgnLi4vdGFibGUnKTtcblxuLy8gUGFyc2UgdGhlIGhlYWRlciBgaGVhZGAgdGFibGVcbmZ1bmN0aW9uIHBhcnNlSGVhZFRhYmxlKGRhdGEsIHN0YXJ0KSB7XG4gICAgdmFyIGhlYWQgPSB7fTtcbiAgICB2YXIgcCA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQpO1xuICAgIGhlYWQudmVyc2lvbiA9IHAucGFyc2VWZXJzaW9uKCk7XG4gICAgaGVhZC5mb250UmV2aXNpb24gPSBNYXRoLnJvdW5kKHAucGFyc2VGaXhlZCgpICogMTAwMCkgLyAxMDAwO1xuICAgIGhlYWQuY2hlY2tTdW1BZGp1c3RtZW50ID0gcC5wYXJzZVVMb25nKCk7XG4gICAgaGVhZC5tYWdpY051bWJlciA9IHAucGFyc2VVTG9uZygpO1xuICAgIGNoZWNrLmFyZ3VtZW50KGhlYWQubWFnaWNOdW1iZXIgPT09IDB4NUYwRjNDRjUsICdGb250IGhlYWRlciBoYXMgd3JvbmcgbWFnaWMgbnVtYmVyLicpO1xuICAgIGhlYWQuZmxhZ3MgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgaGVhZC51bml0c1BlckVtID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIGhlYWQuY3JlYXRlZCA9IHAucGFyc2VMb25nRGF0ZVRpbWUoKTtcbiAgICBoZWFkLm1vZGlmaWVkID0gcC5wYXJzZUxvbmdEYXRlVGltZSgpO1xuICAgIGhlYWQueE1pbiA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGhlYWQueU1pbiA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGhlYWQueE1heCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGhlYWQueU1heCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGhlYWQubWFjU3R5bGUgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgaGVhZC5sb3dlc3RSZWNQUEVNID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIGhlYWQuZm9udERpcmVjdGlvbkhpbnQgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBoZWFkLmluZGV4VG9Mb2NGb3JtYXQgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBoZWFkLmdseXBoRGF0YUZvcm1hdCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIHJldHVybiBoZWFkO1xufVxuXG5mdW5jdGlvbiBtYWtlSGVhZFRhYmxlKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IHRhYmxlLlRhYmxlKCdoZWFkJywgW1xuICAgICAgICB7bmFtZTogJ3ZlcnNpb24nLCB0eXBlOiAnRklYRUQnLCB2YWx1ZTogMHgwMDAxMDAwMH0sXG4gICAgICAgIHtuYW1lOiAnZm9udFJldmlzaW9uJywgdHlwZTogJ0ZJWEVEJywgdmFsdWU6IDB4MDAwMTAwMDB9LFxuICAgICAgICB7bmFtZTogJ2NoZWNrU3VtQWRqdXN0bWVudCcsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdtYWdpY051bWJlcicsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAweDVGMEYzQ0Y1fSxcbiAgICAgICAge25hbWU6ICdmbGFncycsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAndW5pdHNQZXJFbScsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMTAwMH0sXG4gICAgICAgIHtuYW1lOiAnY3JlYXRlZCcsIHR5cGU6ICdMT05HREFURVRJTUUnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnbW9kaWZpZWQnLCB0eXBlOiAnTE9OR0RBVEVUSU1FJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3hNaW4nLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAneU1pbicsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICd4TWF4JywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3lNYXgnLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnbWFjU3R5bGUnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2xvd2VzdFJlY1BQRU0nLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2ZvbnREaXJlY3Rpb25IaW50JywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDJ9LFxuICAgICAgICB7bmFtZTogJ2luZGV4VG9Mb2NGb3JtYXQnLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnZ2x5cGhEYXRhRm9ybWF0JywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDB9XG4gICAgXSwgb3B0aW9ucyk7XG59XG5cbmV4cG9ydHMucGFyc2UgPSBwYXJzZUhlYWRUYWJsZTtcbmV4cG9ydHMubWFrZSA9IG1ha2VIZWFkVGFibGU7XG4iLCIvLyBUaGUgYGhoZWFgIHRhYmxlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGZvciBob3Jpem9udGFsIGxheW91dC5cbi8vIGh0dHBzOi8vd3d3Lm1pY3Jvc29mdC5jb20vdHlwb2dyYXBoeS9PVFNQRUMvaGhlYS5odG1cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcGFyc2UgPSByZXF1aXJlKCcuLi9wYXJzZScpO1xudmFyIHRhYmxlID0gcmVxdWlyZSgnLi4vdGFibGUnKTtcblxuLy8gUGFyc2UgdGhlIGhvcml6b250YWwgaGVhZGVyIGBoaGVhYCB0YWJsZVxuZnVuY3Rpb24gcGFyc2VIaGVhVGFibGUoZGF0YSwgc3RhcnQpIHtcbiAgICB2YXIgaGhlYSA9IHt9O1xuICAgIHZhciBwID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCk7XG4gICAgaGhlYS52ZXJzaW9uID0gcC5wYXJzZVZlcnNpb24oKTtcbiAgICBoaGVhLmFzY2VuZGVyID0gcC5wYXJzZVNob3J0KCk7XG4gICAgaGhlYS5kZXNjZW5kZXIgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBoaGVhLmxpbmVHYXAgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBoaGVhLmFkdmFuY2VXaWR0aE1heCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICBoaGVhLm1pbkxlZnRTaWRlQmVhcmluZyA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGhoZWEubWluUmlnaHRTaWRlQmVhcmluZyA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGhoZWEueE1heEV4dGVudCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGhoZWEuY2FyZXRTbG9wZVJpc2UgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBoaGVhLmNhcmV0U2xvcGVSdW4gPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBoaGVhLmNhcmV0T2Zmc2V0ID0gcC5wYXJzZVNob3J0KCk7XG4gICAgcC5yZWxhdGl2ZU9mZnNldCArPSA4O1xuICAgIGhoZWEubWV0cmljRGF0YUZvcm1hdCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIGhoZWEubnVtYmVyT2ZITWV0cmljcyA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICByZXR1cm4gaGhlYTtcbn1cblxuZnVuY3Rpb24gbWFrZUhoZWFUYWJsZShvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyB0YWJsZS5UYWJsZSgnaGhlYScsIFtcbiAgICAgICAge25hbWU6ICd2ZXJzaW9uJywgdHlwZTogJ0ZJWEVEJywgdmFsdWU6IDB4MDAwMTAwMDB9LFxuICAgICAgICB7bmFtZTogJ2FzY2VuZGVyJywgdHlwZTogJ0ZXT1JEJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2Rlc2NlbmRlcicsIHR5cGU6ICdGV09SRCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdsaW5lR2FwJywgdHlwZTogJ0ZXT1JEJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2FkdmFuY2VXaWR0aE1heCcsIHR5cGU6ICdVRldPUkQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnbWluTGVmdFNpZGVCZWFyaW5nJywgdHlwZTogJ0ZXT1JEJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ21pblJpZ2h0U2lkZUJlYXJpbmcnLCB0eXBlOiAnRldPUkQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAneE1heEV4dGVudCcsIHR5cGU6ICdGV09SRCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdjYXJldFNsb3BlUmlzZScsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAxfSxcbiAgICAgICAge25hbWU6ICdjYXJldFNsb3BlUnVuJywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2NhcmV0T2Zmc2V0JywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3Jlc2VydmVkMScsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdyZXNlcnZlZDInLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAncmVzZXJ2ZWQzJywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3Jlc2VydmVkNCcsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdtZXRyaWNEYXRhRm9ybWF0JywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ251bWJlck9mSE1ldHJpY3MnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9XG4gICAgXSwgb3B0aW9ucyk7XG59XG5cbmV4cG9ydHMucGFyc2UgPSBwYXJzZUhoZWFUYWJsZTtcbmV4cG9ydHMubWFrZSA9IG1ha2VIaGVhVGFibGU7XG4iLCIvLyBUaGUgYGhtdHhgIHRhYmxlIGNvbnRhaW5zIHRoZSBob3Jpem9udGFsIG1ldHJpY3MgZm9yIGFsbCBnbHlwaHMuXG4vLyBodHRwczovL3d3dy5taWNyb3NvZnQuY29tL3R5cG9ncmFwaHkvT1RTUEVDL2htdHguaHRtXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHBhcnNlID0gcmVxdWlyZSgnLi4vcGFyc2UnKTtcbnZhciB0YWJsZSA9IHJlcXVpcmUoJy4uL3RhYmxlJyk7XG5cbi8vIFBhcnNlIHRoZSBgaG10eGAgdGFibGUsIHdoaWNoIGNvbnRhaW5zIHRoZSBob3Jpem9udGFsIG1ldHJpY3MgZm9yIGFsbCBnbHlwaHMuXG4vLyBUaGlzIGZ1bmN0aW9uIGF1Z21lbnRzIHRoZSBnbHlwaCBhcnJheSwgYWRkaW5nIHRoZSBhZHZhbmNlV2lkdGggYW5kIGxlZnRTaWRlQmVhcmluZyB0byBlYWNoIGdseXBoLlxuZnVuY3Rpb24gcGFyc2VIbXR4VGFibGUoZGF0YSwgc3RhcnQsIG51bU1ldHJpY3MsIG51bUdseXBocywgZ2x5cGhzKSB7XG4gICAgdmFyIGFkdmFuY2VXaWR0aDtcbiAgICB2YXIgbGVmdFNpZGVCZWFyaW5nO1xuICAgIHZhciBwID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1HbHlwaHM7IGkgKz0gMSkge1xuICAgICAgICAvLyBJZiB0aGUgZm9udCBpcyBtb25vc3BhY2VkLCBvbmx5IG9uZSBlbnRyeSBpcyBuZWVkZWQuIFRoaXMgbGFzdCBlbnRyeSBhcHBsaWVzIHRvIGFsbCBzdWJzZXF1ZW50IGdseXBocy5cbiAgICAgICAgaWYgKGkgPCBudW1NZXRyaWNzKSB7XG4gICAgICAgICAgICBhZHZhbmNlV2lkdGggPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgICAgICBsZWZ0U2lkZUJlYXJpbmcgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBnbHlwaCA9IGdseXBocy5nZXQoaSk7XG4gICAgICAgIGdseXBoLmFkdmFuY2VXaWR0aCA9IGFkdmFuY2VXaWR0aDtcbiAgICAgICAgZ2x5cGgubGVmdFNpZGVCZWFyaW5nID0gbGVmdFNpZGVCZWFyaW5nO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFrZUhtdHhUYWJsZShnbHlwaHMpIHtcbiAgICB2YXIgdCA9IG5ldyB0YWJsZS5UYWJsZSgnaG10eCcsIFtdKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdseXBocy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgZ2x5cGggPSBnbHlwaHMuZ2V0KGkpO1xuICAgICAgICB2YXIgYWR2YW5jZVdpZHRoID0gZ2x5cGguYWR2YW5jZVdpZHRoIHx8IDA7XG4gICAgICAgIHZhciBsZWZ0U2lkZUJlYXJpbmcgPSBnbHlwaC5sZWZ0U2lkZUJlYXJpbmcgfHwgMDtcbiAgICAgICAgdC5maWVsZHMucHVzaCh7bmFtZTogJ2FkdmFuY2VXaWR0aF8nICsgaSwgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiBhZHZhbmNlV2lkdGh9KTtcbiAgICAgICAgdC5maWVsZHMucHVzaCh7bmFtZTogJ2xlZnRTaWRlQmVhcmluZ18nICsgaSwgdHlwZTogJ1NIT1JUJywgdmFsdWU6IGxlZnRTaWRlQmVhcmluZ30pO1xuICAgIH1cblxuICAgIHJldHVybiB0O1xufVxuXG5leHBvcnRzLnBhcnNlID0gcGFyc2VIbXR4VGFibGU7XG5leHBvcnRzLm1ha2UgPSBtYWtlSG10eFRhYmxlO1xuIiwiLy8gVGhlIGBrZXJuYCB0YWJsZSBjb250YWlucyBrZXJuaW5nIHBhaXJzLlxuLy8gTm90ZSB0aGF0IHNvbWUgZm9udHMgdXNlIHRoZSBHUE9TIE9wZW5UeXBlIGxheW91dCB0YWJsZSB0byBzcGVjaWZ5IGtlcm5pbmcuXG4vLyBodHRwczovL3d3dy5taWNyb3NvZnQuY29tL3R5cG9ncmFwaHkvT1RTUEVDL2tlcm4uaHRtXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNoZWNrID0gcmVxdWlyZSgnLi4vY2hlY2snKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4uL3BhcnNlJyk7XG5cbi8vIFBhcnNlIHRoZSBga2VybmAgdGFibGUgd2hpY2ggY29udGFpbnMga2VybmluZyBwYWlycy5cbmZ1bmN0aW9uIHBhcnNlS2VyblRhYmxlKGRhdGEsIHN0YXJ0KSB7XG4gICAgdmFyIHBhaXJzID0ge307XG4gICAgdmFyIHAgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0KTtcbiAgICB2YXIgdGFibGVWZXJzaW9uID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIGNoZWNrLmFyZ3VtZW50KHRhYmxlVmVyc2lvbiA9PT0gMCwgJ1Vuc3VwcG9ydGVkIGtlcm4gdGFibGUgdmVyc2lvbi4nKTtcbiAgICAvLyBTa2lwIG5UYWJsZXMuXG4gICAgcC5za2lwKCd1U2hvcnQnLCAxKTtcbiAgICB2YXIgc3ViVGFibGVWZXJzaW9uID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIGNoZWNrLmFyZ3VtZW50KHN1YlRhYmxlVmVyc2lvbiA9PT0gMCwgJ1Vuc3VwcG9ydGVkIGtlcm4gc3ViLXRhYmxlIHZlcnNpb24uJyk7XG4gICAgLy8gU2tpcCBzdWJUYWJsZUxlbmd0aCwgc3ViVGFibGVDb3ZlcmFnZVxuICAgIHAuc2tpcCgndVNob3J0JywgMik7XG4gICAgdmFyIG5QYWlycyA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAvLyBTa2lwIHNlYXJjaFJhbmdlLCBlbnRyeVNlbGVjdG9yLCByYW5nZVNoaWZ0LlxuICAgIHAuc2tpcCgndVNob3J0JywgMyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuUGFpcnM7IGkgKz0gMSkge1xuICAgICAgICB2YXIgbGVmdEluZGV4ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICB2YXIgcmlnaHRJbmRleCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgdmFyIHZhbHVlID0gcC5wYXJzZVNob3J0KCk7XG4gICAgICAgIHBhaXJzW2xlZnRJbmRleCArICcsJyArIHJpZ2h0SW5kZXhdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhaXJzO1xufVxuXG5leHBvcnRzLnBhcnNlID0gcGFyc2VLZXJuVGFibGU7XG4iLCIvLyBUaGUgYGxvY2FgIHRhYmxlIHN0b3JlcyB0aGUgb2Zmc2V0cyB0byB0aGUgbG9jYXRpb25zIG9mIHRoZSBnbHlwaHMgaW4gdGhlIGZvbnQuXG4vLyBodHRwczovL3d3dy5taWNyb3NvZnQuY29tL3R5cG9ncmFwaHkvT1RTUEVDL2xvY2EuaHRtXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHBhcnNlID0gcmVxdWlyZSgnLi4vcGFyc2UnKTtcblxuLy8gUGFyc2UgdGhlIGBsb2NhYCB0YWJsZS4gVGhpcyB0YWJsZSBzdG9yZXMgdGhlIG9mZnNldHMgdG8gdGhlIGxvY2F0aW9ucyBvZiB0aGUgZ2x5cGhzIGluIHRoZSBmb250LFxuLy8gcmVsYXRpdmUgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgZ2x5cGhEYXRhIHRhYmxlLlxuLy8gVGhlIG51bWJlciBvZiBnbHlwaHMgc3RvcmVkIGluIHRoZSBgbG9jYWAgdGFibGUgaXMgc3BlY2lmaWVkIGluIHRoZSBgbWF4cGAgdGFibGUgKHVuZGVyIG51bUdseXBocylcbi8vIFRoZSBsb2NhIHRhYmxlIGhhcyB0d28gdmVyc2lvbnM6IGEgc2hvcnQgdmVyc2lvbiB3aGVyZSBvZmZzZXRzIGFyZSBzdG9yZWQgYXMgdVNob3J0cywgYW5kIGEgbG9uZ1xuLy8gdmVyc2lvbiB3aGVyZSBvZmZzZXRzIGFyZSBzdG9yZWQgYXMgdUxvbmdzLiBUaGUgYGhlYWRgIHRhYmxlIHNwZWNpZmllcyB3aGljaCB2ZXJzaW9uIHRvIHVzZVxuLy8gKHVuZGVyIGluZGV4VG9Mb2NGb3JtYXQpLlxuZnVuY3Rpb24gcGFyc2VMb2NhVGFibGUoZGF0YSwgc3RhcnQsIG51bUdseXBocywgc2hvcnRWZXJzaW9uKSB7XG4gICAgdmFyIHAgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0KTtcbiAgICB2YXIgcGFyc2VGbiA9IHNob3J0VmVyc2lvbiA/IHAucGFyc2VVU2hvcnQgOiBwLnBhcnNlVUxvbmc7XG4gICAgLy8gVGhlcmUgaXMgYW4gZXh0cmEgZW50cnkgYWZ0ZXIgdGhlIGxhc3QgaW5kZXggZWxlbWVudCB0byBjb21wdXRlIHRoZSBsZW5ndGggb2YgdGhlIGxhc3QgZ2x5cGguXG4gICAgLy8gVGhhdCdzIHdoeSB3ZSB1c2UgbnVtR2x5cGhzICsgMS5cbiAgICB2YXIgZ2x5cGhPZmZzZXRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1HbHlwaHMgKyAxOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGdseXBoT2Zmc2V0ID0gcGFyc2VGbi5jYWxsKHApO1xuICAgICAgICBpZiAoc2hvcnRWZXJzaW9uKSB7XG4gICAgICAgICAgICAvLyBUaGUgc2hvcnQgdGFibGUgdmVyc2lvbiBzdG9yZXMgdGhlIGFjdHVhbCBvZmZzZXQgZGl2aWRlZCBieSAyLlxuICAgICAgICAgICAgZ2x5cGhPZmZzZXQgKj0gMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGdseXBoT2Zmc2V0cy5wdXNoKGdseXBoT2Zmc2V0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2x5cGhPZmZzZXRzO1xufVxuXG5leHBvcnRzLnBhcnNlID0gcGFyc2VMb2NhVGFibGU7XG4iLCIvLyBUaGUgYGx0YWdgIHRhYmxlIHN0b3JlcyBJRVRGIEJDUC00NyBsYW5ndWFnZSB0YWdzLiBJdCBhbGxvd3Mgc3VwcG9ydGluZ1xuLy8gbGFuZ3VhZ2VzIGZvciB3aGljaCBUcnVlVHlwZSBkb2VzIG5vdCBhc3NpZ24gYSBudW1lcmljIGNvZGUuXG4vLyBodHRwczovL2RldmVsb3Blci5hcHBsZS5jb20vZm9udHMvVHJ1ZVR5cGUtUmVmZXJlbmNlLU1hbnVhbC9STTA2L0NoYXA2bHRhZy5odG1sXG4vLyBodHRwOi8vd3d3LnczLm9yZy9JbnRlcm5hdGlvbmFsL2FydGljbGVzL2xhbmd1YWdlLXRhZ3MvXG4vLyBodHRwOi8vd3d3LmlhbmEub3JnL2Fzc2lnbm1lbnRzL2xhbmd1YWdlLXN1YnRhZy1yZWdpc3RyeS9sYW5ndWFnZS1zdWJ0YWctcmVnaXN0cnlcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2hlY2sgPSByZXF1aXJlKCcuLi9jaGVjaycpO1xudmFyIHBhcnNlID0gcmVxdWlyZSgnLi4vcGFyc2UnKTtcbnZhciB0YWJsZSA9IHJlcXVpcmUoJy4uL3RhYmxlJyk7XG5cbmZ1bmN0aW9uIG1ha2VMdGFnVGFibGUodGFncykge1xuICAgIHZhciByZXN1bHQgPSBuZXcgdGFibGUuVGFibGUoJ2x0YWcnLCBbXG4gICAgICAgIHtuYW1lOiAndmVyc2lvbicsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAxfSxcbiAgICAgICAge25hbWU6ICdmbGFncycsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdudW1UYWdzJywgdHlwZTogJ1VMT05HJywgdmFsdWU6IHRhZ3MubGVuZ3RofVxuICAgIF0pO1xuXG4gICAgdmFyIHN0cmluZ1Bvb2wgPSAnJztcbiAgICB2YXIgc3RyaW5nUG9vbE9mZnNldCA9IDEyICsgdGFncy5sZW5ndGggKiA0O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcG9zID0gc3RyaW5nUG9vbC5pbmRleE9mKHRhZ3NbaV0pO1xuICAgICAgICBpZiAocG9zIDwgMCkge1xuICAgICAgICAgICAgcG9zID0gc3RyaW5nUG9vbC5sZW5ndGg7XG4gICAgICAgICAgICBzdHJpbmdQb29sICs9IHRhZ3NbaV07XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHQuZmllbGRzLnB1c2goe25hbWU6ICdvZmZzZXQgJyArIGksIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogc3RyaW5nUG9vbE9mZnNldCArIHBvc30pO1xuICAgICAgICByZXN1bHQuZmllbGRzLnB1c2goe25hbWU6ICdsZW5ndGggJyArIGksIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogdGFnc1tpXS5sZW5ndGh9KTtcbiAgICB9XG5cbiAgICByZXN1bHQuZmllbGRzLnB1c2goe25hbWU6ICdzdHJpbmdQb29sJywgdHlwZTogJ0NIQVJBUlJBWScsIHZhbHVlOiBzdHJpbmdQb29sfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcGFyc2VMdGFnVGFibGUoZGF0YSwgc3RhcnQpIHtcbiAgICB2YXIgcCA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQpO1xuICAgIHZhciB0YWJsZVZlcnNpb24gPSBwLnBhcnNlVUxvbmcoKTtcbiAgICBjaGVjay5hcmd1bWVudCh0YWJsZVZlcnNpb24gPT09IDEsICdVbnN1cHBvcnRlZCBsdGFnIHRhYmxlIHZlcnNpb24uJyk7XG4gICAgLy8gVGhlICdsdGFnJyBzcGVjaWZpY2F0aW9uIGRvZXMgbm90IGRlZmluZSBhbnkgZmxhZ3M7IHNraXAgdGhlIGZpZWxkLlxuICAgIHAuc2tpcCgndUxvbmcnLCAxKTtcbiAgICB2YXIgbnVtVGFncyA9IHAucGFyc2VVTG9uZygpO1xuXG4gICAgdmFyIHRhZ3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVRhZ3M7IGkrKykge1xuICAgICAgICB2YXIgdGFnID0gJyc7XG4gICAgICAgIHZhciBvZmZzZXQgPSBzdGFydCArIHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IG9mZnNldDsgaiA8IG9mZnNldCArIGxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICB0YWcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShkYXRhLmdldEludDgoaikpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGFncy5wdXNoKHRhZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhZ3M7XG59XG5cbmV4cG9ydHMubWFrZSA9IG1ha2VMdGFnVGFibGU7XG5leHBvcnRzLnBhcnNlID0gcGFyc2VMdGFnVGFibGU7XG4iLCIvLyBUaGUgYG1heHBgIHRhYmxlIGVzdGFibGlzaGVzIHRoZSBtZW1vcnkgcmVxdWlyZW1lbnRzIGZvciB0aGUgZm9udC5cbi8vIFdlIG5lZWQgaXQganVzdCB0byBnZXQgdGhlIG51bWJlciBvZiBnbHlwaHMgaW4gdGhlIGZvbnQuXG4vLyBodHRwczovL3d3dy5taWNyb3NvZnQuY29tL3R5cG9ncmFwaHkvT1RTUEVDL21heHAuaHRtXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHBhcnNlID0gcmVxdWlyZSgnLi4vcGFyc2UnKTtcbnZhciB0YWJsZSA9IHJlcXVpcmUoJy4uL3RhYmxlJyk7XG5cbi8vIFBhcnNlIHRoZSBtYXhpbXVtIHByb2ZpbGUgYG1heHBgIHRhYmxlLlxuZnVuY3Rpb24gcGFyc2VNYXhwVGFibGUoZGF0YSwgc3RhcnQpIHtcbiAgICB2YXIgbWF4cCA9IHt9O1xuICAgIHZhciBwID0gbmV3IHBhcnNlLlBhcnNlcihkYXRhLCBzdGFydCk7XG4gICAgbWF4cC52ZXJzaW9uID0gcC5wYXJzZVZlcnNpb24oKTtcbiAgICBtYXhwLm51bUdseXBocyA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICBpZiAobWF4cC52ZXJzaW9uID09PSAxLjApIHtcbiAgICAgICAgbWF4cC5tYXhQb2ludHMgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIG1heHAubWF4Q29udG91cnMgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIG1heHAubWF4Q29tcG9zaXRlUG9pbnRzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICBtYXhwLm1heENvbXBvc2l0ZUNvbnRvdXJzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICBtYXhwLm1heFpvbmVzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICBtYXhwLm1heFR3aWxpZ2h0UG9pbnRzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICBtYXhwLm1heFN0b3JhZ2UgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIG1heHAubWF4RnVuY3Rpb25EZWZzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICBtYXhwLm1heEluc3RydWN0aW9uRGVmcyA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgbWF4cC5tYXhTdGFja0VsZW1lbnRzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICBtYXhwLm1heFNpemVPZkluc3RydWN0aW9ucyA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgbWF4cC5tYXhDb21wb25lbnRFbGVtZW50cyA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgbWF4cC5tYXhDb21wb25lbnREZXB0aCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF4cDtcbn1cblxuZnVuY3Rpb24gbWFrZU1heHBUYWJsZShudW1HbHlwaHMpIHtcbiAgICByZXR1cm4gbmV3IHRhYmxlLlRhYmxlKCdtYXhwJywgW1xuICAgICAgICB7bmFtZTogJ3ZlcnNpb24nLCB0eXBlOiAnRklYRUQnLCB2YWx1ZTogMHgwMDAwNTAwMH0sXG4gICAgICAgIHtuYW1lOiAnbnVtR2x5cGhzJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiBudW1HbHlwaHN9XG4gICAgXSk7XG59XG5cbmV4cG9ydHMucGFyc2UgPSBwYXJzZU1heHBUYWJsZTtcbmV4cG9ydHMubWFrZSA9IG1ha2VNYXhwVGFibGU7XG4iLCIvLyBUaGUgYG5hbWVgIG5hbWluZyB0YWJsZS5cbi8vIGh0dHBzOi8vd3d3Lm1pY3Jvc29mdC5jb20vdHlwb2dyYXBoeS9PVFNQRUMvbmFtZS5odG1cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHlwZXMgPSByZXF1aXJlKCcuLi90eXBlcycpO1xudmFyIGRlY29kZSA9IHR5cGVzLmRlY29kZTtcbnZhciBlbmNvZGUgPSB0eXBlcy5lbmNvZGU7XG52YXIgcGFyc2UgPSByZXF1aXJlKCcuLi9wYXJzZScpO1xudmFyIHRhYmxlID0gcmVxdWlyZSgnLi4vdGFibGUnKTtcblxuLy8gTmFtZUlEcyBmb3IgdGhlIG5hbWUgdGFibGUuXG52YXIgbmFtZVRhYmxlTmFtZXMgPSBbXG4gICAgJ2NvcHlyaWdodCcsICAgICAgICAgICAgICAvLyAwXG4gICAgJ2ZvbnRGYW1pbHknLCAgICAgICAgICAgICAvLyAxXG4gICAgJ2ZvbnRTdWJmYW1pbHknLCAgICAgICAgICAvLyAyXG4gICAgJ3VuaXF1ZUlEJywgICAgICAgICAgICAgICAvLyAzXG4gICAgJ2Z1bGxOYW1lJywgICAgICAgICAgICAgICAvLyA0XG4gICAgJ3ZlcnNpb24nLCAgICAgICAgICAgICAgICAvLyA1XG4gICAgJ3Bvc3RTY3JpcHROYW1lJywgICAgICAgICAvLyA2XG4gICAgJ3RyYWRlbWFyaycsICAgICAgICAgICAgICAvLyA3XG4gICAgJ21hbnVmYWN0dXJlcicsICAgICAgICAgICAvLyA4XG4gICAgJ2Rlc2lnbmVyJywgICAgICAgICAgICAgICAvLyA5XG4gICAgJ2Rlc2NyaXB0aW9uJywgICAgICAgICAgICAvLyAxMFxuICAgICdtYW51ZmFjdHVyZXJVUkwnLCAgICAgICAgLy8gMTFcbiAgICAnZGVzaWduZXJVUkwnLCAgICAgICAgICAgIC8vIDEyXG4gICAgJ2xpY2Vuc2UnLCAgICAgICAgICAgICAgICAvLyAxM1xuICAgICdsaWNlbnNlVVJMJywgICAgICAgICAgICAgLy8gMTRcbiAgICAncmVzZXJ2ZWQnLCAgICAgICAgICAgICAgIC8vIDE1XG4gICAgJ3ByZWZlcnJlZEZhbWlseScsICAgICAgICAvLyAxNlxuICAgICdwcmVmZXJyZWRTdWJmYW1pbHknLCAgICAgLy8gMTdcbiAgICAnY29tcGF0aWJsZUZ1bGxOYW1lJywgICAgIC8vIDE4XG4gICAgJ3NhbXBsZVRleHQnLCAgICAgICAgICAgICAvLyAxOVxuICAgICdwb3N0U2NyaXB0RmluZEZvbnROYW1lJywgLy8gMjBcbiAgICAnd3dzRmFtaWx5JywgICAgICAgICAgICAgIC8vIDIxXG4gICAgJ3d3c1N1YmZhbWlseScgICAgICAgICAgICAvLyAyMlxuXTtcblxudmFyIG1hY0xhbmd1YWdlcyA9IHtcbiAgICAwOiAnZW4nLFxuICAgIDE6ICdmcicsXG4gICAgMjogJ2RlJyxcbiAgICAzOiAnaXQnLFxuICAgIDQ6ICdubCcsXG4gICAgNTogJ3N2JyxcbiAgICA2OiAnZXMnLFxuICAgIDc6ICdkYScsXG4gICAgODogJ3B0JyxcbiAgICA5OiAnbm8nLFxuICAgIDEwOiAnaGUnLFxuICAgIDExOiAnamEnLFxuICAgIDEyOiAnYXInLFxuICAgIDEzOiAnZmknLFxuICAgIDE0OiAnZWwnLFxuICAgIDE1OiAnaXMnLFxuICAgIDE2OiAnbXQnLFxuICAgIDE3OiAndHInLFxuICAgIDE4OiAnaHInLFxuICAgIDE5OiAnemgtSGFudCcsXG4gICAgMjA6ICd1cicsXG4gICAgMjE6ICdoaScsXG4gICAgMjI6ICd0aCcsXG4gICAgMjM6ICdrbycsXG4gICAgMjQ6ICdsdCcsXG4gICAgMjU6ICdwbCcsXG4gICAgMjY6ICdodScsXG4gICAgMjc6ICdlcycsXG4gICAgMjg6ICdsdicsXG4gICAgMjk6ICdzZScsXG4gICAgMzA6ICdmbycsXG4gICAgMzE6ICdmYScsXG4gICAgMzI6ICdydScsXG4gICAgMzM6ICd6aCcsXG4gICAgMzQ6ICdubC1CRScsXG4gICAgMzU6ICdnYScsXG4gICAgMzY6ICdzcScsXG4gICAgMzc6ICdybycsXG4gICAgMzg6ICdjeicsXG4gICAgMzk6ICdzaycsXG4gICAgNDA6ICdzaScsXG4gICAgNDE6ICd5aScsXG4gICAgNDI6ICdzcicsXG4gICAgNDM6ICdtaycsXG4gICAgNDQ6ICdiZycsXG4gICAgNDU6ICd1aycsXG4gICAgNDY6ICdiZScsXG4gICAgNDc6ICd1eicsXG4gICAgNDg6ICdraycsXG4gICAgNDk6ICdhei1DeXJsJyxcbiAgICA1MDogJ2F6LUFyYWInLFxuICAgIDUxOiAnaHknLFxuICAgIDUyOiAna2EnLFxuICAgIDUzOiAnbW8nLFxuICAgIDU0OiAna3knLFxuICAgIDU1OiAndGcnLFxuICAgIDU2OiAndGsnLFxuICAgIDU3OiAnbW4tQ04nLFxuICAgIDU4OiAnbW4nLFxuICAgIDU5OiAncHMnLFxuICAgIDYwOiAna3MnLFxuICAgIDYxOiAna3UnLFxuICAgIDYyOiAnc2QnLFxuICAgIDYzOiAnYm8nLFxuICAgIDY0OiAnbmUnLFxuICAgIDY1OiAnc2EnLFxuICAgIDY2OiAnbXInLFxuICAgIDY3OiAnYm4nLFxuICAgIDY4OiAnYXMnLFxuICAgIDY5OiAnZ3UnLFxuICAgIDcwOiAncGEnLFxuICAgIDcxOiAnb3InLFxuICAgIDcyOiAnbWwnLFxuICAgIDczOiAna24nLFxuICAgIDc0OiAndGEnLFxuICAgIDc1OiAndGUnLFxuICAgIDc2OiAnc2knLFxuICAgIDc3OiAnbXknLFxuICAgIDc4OiAna20nLFxuICAgIDc5OiAnbG8nLFxuICAgIDgwOiAndmknLFxuICAgIDgxOiAnaWQnLFxuICAgIDgyOiAndGwnLFxuICAgIDgzOiAnbXMnLFxuICAgIDg0OiAnbXMtQXJhYicsXG4gICAgODU6ICdhbScsXG4gICAgODY6ICd0aScsXG4gICAgODc6ICdvbScsXG4gICAgODg6ICdzbycsXG4gICAgODk6ICdzdycsXG4gICAgOTA6ICdydycsXG4gICAgOTE6ICdybicsXG4gICAgOTI6ICdueScsXG4gICAgOTM6ICdtZycsXG4gICAgOTQ6ICdlbycsXG4gICAgMTI4OiAnY3knLFxuICAgIDEyOTogJ2V1JyxcbiAgICAxMzA6ICdjYScsXG4gICAgMTMxOiAnbGEnLFxuICAgIDEzMjogJ3F1JyxcbiAgICAxMzM6ICdnbicsXG4gICAgMTM0OiAnYXknLFxuICAgIDEzNTogJ3R0JyxcbiAgICAxMzY6ICd1ZycsXG4gICAgMTM3OiAnZHonLFxuICAgIDEzODogJ2p2JyxcbiAgICAxMzk6ICdzdScsXG4gICAgMTQwOiAnZ2wnLFxuICAgIDE0MTogJ2FmJyxcbiAgICAxNDI6ICdicicsXG4gICAgMTQzOiAnaXUnLFxuICAgIDE0NDogJ2dkJyxcbiAgICAxNDU6ICdndicsXG4gICAgMTQ2OiAnZ2EnLFxuICAgIDE0NzogJ3RvJyxcbiAgICAxNDg6ICdlbC1wb2x5dG9uJyxcbiAgICAxNDk6ICdrbCcsXG4gICAgMTUwOiAnYXonLFxuICAgIDE1MTogJ25uJ1xufTtcblxuLy8gTWFjT1MgbGFuZ3VhZ2UgSUQg4oaSIE1hY09TIHNjcmlwdCBJRFxuLy9cbi8vIE5vdGUgdGhhdCB0aGUgc2NyaXB0IElEIGlzIG5vdCBzdWZmaWNpZW50IHRvIGRldGVybWluZSB3aGF0IGVuY29kaW5nXG4vLyB0byB1c2UgaW4gVHJ1ZVR5cGUgZmlsZXMuIEZvciBzb21lIGxhbmd1YWdlcywgTWFjT1MgdXNlZCBhIG1vZGlmaWNhdGlvblxuLy8gb2YgYSBtYWluc3RyZWFtIHNjcmlwdC4gRm9yIGV4YW1wbGUsIGFuIEljZWxhbmRpYyBuYW1lIHdvdWxkIGJlIHN0b3JlZFxuLy8gd2l0aCBzbVJvbWFuIGluIHRoZSBUcnVlVHlwZSBuYW1pbmcgdGFibGUsIGJ1dCB0aGUgYWN0dWFsIGVuY29kaW5nXG4vLyBpcyBhIHNwZWNpYWwgSWNlbGFuZGljIHZlcnNpb24gb2YgdGhlIG5vcm1hbCBNYWNpbnRvc2ggUm9tYW4gZW5jb2RpbmcuXG4vLyBBcyBhbm90aGVyIGV4YW1wbGUsIEludWt0aXR1dCB1c2VzIGFuIDgtYml0IGVuY29kaW5nIGZvciBDYW5hZGlhbiBBYm9yaWdpbmFsXG4vLyBTeWxsYWJsZXMgYnV0IE1hY09TIGhhZCBydW4gb3V0IG9mIGF2YWlsYWJsZSBzY3JpcHQgY29kZXMsIHNvIHRoaXMgd2FzXG4vLyBkb25lIGFzIGEgKHByZXR0eSByYWRpY2FsKSBcIm1vZGlmaWNhdGlvblwiIG9mIEV0aGlvcGljLlxuLy9cbi8vIGh0dHA6Ly91bmljb2RlLm9yZy9QdWJsaWMvTUFQUElOR1MvVkVORE9SUy9BUFBMRS9SZWFkbWUudHh0XG52YXIgbWFjTGFuZ3VhZ2VUb1NjcmlwdCA9IHtcbiAgICAwOiAwLCAgLy8gbGFuZ0VuZ2xpc2gg4oaSIHNtUm9tYW5cbiAgICAxOiAwLCAgLy8gbGFuZ0ZyZW5jaCDihpIgc21Sb21hblxuICAgIDI6IDAsICAvLyBsYW5nR2VybWFuIOKGkiBzbVJvbWFuXG4gICAgMzogMCwgIC8vIGxhbmdJdGFsaWFuIOKGkiBzbVJvbWFuXG4gICAgNDogMCwgIC8vIGxhbmdEdXRjaCDihpIgc21Sb21hblxuICAgIDU6IDAsICAvLyBsYW5nU3dlZGlzaCDihpIgc21Sb21hblxuICAgIDY6IDAsICAvLyBsYW5nU3BhbmlzaCDihpIgc21Sb21hblxuICAgIDc6IDAsICAvLyBsYW5nRGFuaXNoIOKGkiBzbVJvbWFuXG4gICAgODogMCwgIC8vIGxhbmdQb3J0dWd1ZXNlIOKGkiBzbVJvbWFuXG4gICAgOTogMCwgIC8vIGxhbmdOb3J3ZWdpYW4g4oaSIHNtUm9tYW5cbiAgICAxMDogNSwgIC8vIGxhbmdIZWJyZXcg4oaSIHNtSGVicmV3XG4gICAgMTE6IDEsICAvLyBsYW5nSmFwYW5lc2Ug4oaSIHNtSmFwYW5lc2VcbiAgICAxMjogNCwgIC8vIGxhbmdBcmFiaWMg4oaSIHNtQXJhYmljXG4gICAgMTM6IDAsICAvLyBsYW5nRmlubmlzaCDihpIgc21Sb21hblxuICAgIDE0OiA2LCAgLy8gbGFuZ0dyZWVrIOKGkiBzbUdyZWVrXG4gICAgMTU6IDAsICAvLyBsYW5nSWNlbGFuZGljIOKGkiBzbVJvbWFuIChtb2RpZmllZClcbiAgICAxNjogMCwgIC8vIGxhbmdNYWx0ZXNlIOKGkiBzbVJvbWFuXG4gICAgMTc6IDAsICAvLyBsYW5nVHVya2lzaCDihpIgc21Sb21hbiAobW9kaWZpZWQpXG4gICAgMTg6IDAsICAvLyBsYW5nQ3JvYXRpYW4g4oaSIHNtUm9tYW4gKG1vZGlmaWVkKVxuICAgIDE5OiAyLCAgLy8gbGFuZ1RyYWRDaGluZXNlIOKGkiBzbVRyYWRDaGluZXNlXG4gICAgMjA6IDQsICAvLyBsYW5nVXJkdSDihpIgc21BcmFiaWNcbiAgICAyMTogOSwgIC8vIGxhbmdIaW5kaSDihpIgc21EZXZhbmFnYXJpXG4gICAgMjI6IDIxLCAgLy8gbGFuZ1RoYWkg4oaSIHNtVGhhaVxuICAgIDIzOiAzLCAgLy8gbGFuZ0tvcmVhbiDihpIgc21Lb3JlYW5cbiAgICAyNDogMjksICAvLyBsYW5nTGl0aHVhbmlhbiDihpIgc21DZW50cmFsRXVyb1JvbWFuXG4gICAgMjU6IDI5LCAgLy8gbGFuZ1BvbGlzaCDihpIgc21DZW50cmFsRXVyb1JvbWFuXG4gICAgMjY6IDI5LCAgLy8gbGFuZ0h1bmdhcmlhbiDihpIgc21DZW50cmFsRXVyb1JvbWFuXG4gICAgMjc6IDI5LCAgLy8gbGFuZ0VzdG9uaWFuIOKGkiBzbUNlbnRyYWxFdXJvUm9tYW5cbiAgICAyODogMjksICAvLyBsYW5nTGF0dmlhbiDihpIgc21DZW50cmFsRXVyb1JvbWFuXG4gICAgMjk6IDAsICAvLyBsYW5nU2FtaSDihpIgc21Sb21hblxuICAgIDMwOiAwLCAgLy8gbGFuZ0Zhcm9lc2Ug4oaSIHNtUm9tYW4gKG1vZGlmaWVkKVxuICAgIDMxOiA0LCAgLy8gbGFuZ0ZhcnNpIOKGkiBzbUFyYWJpYyAobW9kaWZpZWQpXG4gICAgMzI6IDcsICAvLyBsYW5nUnVzc2lhbiDihpIgc21DeXJpbGxpY1xuICAgIDMzOiAyNSwgIC8vIGxhbmdTaW1wQ2hpbmVzZSDihpIgc21TaW1wQ2hpbmVzZVxuICAgIDM0OiAwLCAgLy8gbGFuZ0ZsZW1pc2gg4oaSIHNtUm9tYW5cbiAgICAzNTogMCwgIC8vIGxhbmdJcmlzaEdhZWxpYyDihpIgc21Sb21hbiAobW9kaWZpZWQpXG4gICAgMzY6IDAsICAvLyBsYW5nQWxiYW5pYW4g4oaSIHNtUm9tYW5cbiAgICAzNzogMCwgIC8vIGxhbmdSb21hbmlhbiDihpIgc21Sb21hbiAobW9kaWZpZWQpXG4gICAgMzg6IDI5LCAgLy8gbGFuZ0N6ZWNoIOKGkiBzbUNlbnRyYWxFdXJvUm9tYW5cbiAgICAzOTogMjksICAvLyBsYW5nU2xvdmFrIOKGkiBzbUNlbnRyYWxFdXJvUm9tYW5cbiAgICA0MDogMCwgIC8vIGxhbmdTbG92ZW5pYW4g4oaSIHNtUm9tYW4gKG1vZGlmaWVkKVxuICAgIDQxOiA1LCAgLy8gbGFuZ1lpZGRpc2gg4oaSIHNtSGVicmV3XG4gICAgNDI6IDcsICAvLyBsYW5nU2VyYmlhbiDihpIgc21DeXJpbGxpY1xuICAgIDQzOiA3LCAgLy8gbGFuZ01hY2Vkb25pYW4g4oaSIHNtQ3lyaWxsaWNcbiAgICA0NDogNywgIC8vIGxhbmdCdWxnYXJpYW4g4oaSIHNtQ3lyaWxsaWNcbiAgICA0NTogNywgIC8vIGxhbmdVa3JhaW5pYW4g4oaSIHNtQ3lyaWxsaWMgKG1vZGlmaWVkKVxuICAgIDQ2OiA3LCAgLy8gbGFuZ0J5ZWxvcnVzc2lhbiDihpIgc21DeXJpbGxpY1xuICAgIDQ3OiA3LCAgLy8gbGFuZ1V6YmVrIOKGkiBzbUN5cmlsbGljXG4gICAgNDg6IDcsICAvLyBsYW5nS2F6YWtoIOKGkiBzbUN5cmlsbGljXG4gICAgNDk6IDcsICAvLyBsYW5nQXplcmJhaWphbmkg4oaSIHNtQ3lyaWxsaWNcbiAgICA1MDogNCwgIC8vIGxhbmdBemVyYmFpamFuQXIg4oaSIHNtQXJhYmljXG4gICAgNTE6IDI0LCAgLy8gbGFuZ0FybWVuaWFuIOKGkiBzbUFybWVuaWFuXG4gICAgNTI6IDIzLCAgLy8gbGFuZ0dlb3JnaWFuIOKGkiBzbUdlb3JnaWFuXG4gICAgNTM6IDcsICAvLyBsYW5nTW9sZGF2aWFuIOKGkiBzbUN5cmlsbGljXG4gICAgNTQ6IDcsICAvLyBsYW5nS2lyZ2hpeiDihpIgc21DeXJpbGxpY1xuICAgIDU1OiA3LCAgLy8gbGFuZ1RhamlraSDihpIgc21DeXJpbGxpY1xuICAgIDU2OiA3LCAgLy8gbGFuZ1R1cmttZW4g4oaSIHNtQ3lyaWxsaWNcbiAgICA1NzogMjcsICAvLyBsYW5nTW9uZ29saWFuIOKGkiBzbU1vbmdvbGlhblxuICAgIDU4OiA3LCAgLy8gbGFuZ01vbmdvbGlhbkN5ciDihpIgc21DeXJpbGxpY1xuICAgIDU5OiA0LCAgLy8gbGFuZ1Bhc2h0byDihpIgc21BcmFiaWNcbiAgICA2MDogNCwgIC8vIGxhbmdLdXJkaXNoIOKGkiBzbUFyYWJpY1xuICAgIDYxOiA0LCAgLy8gbGFuZ0thc2htaXJpIOKGkiBzbUFyYWJpY1xuICAgIDYyOiA0LCAgLy8gbGFuZ1NpbmRoaSDihpIgc21BcmFiaWNcbiAgICA2MzogMjYsICAvLyBsYW5nVGliZXRhbiDihpIgc21UaWJldGFuXG4gICAgNjQ6IDksICAvLyBsYW5nTmVwYWxpIOKGkiBzbURldmFuYWdhcmlcbiAgICA2NTogOSwgIC8vIGxhbmdTYW5za3JpdCDihpIgc21EZXZhbmFnYXJpXG4gICAgNjY6IDksICAvLyBsYW5nTWFyYXRoaSDihpIgc21EZXZhbmFnYXJpXG4gICAgNjc6IDEzLCAgLy8gbGFuZ0JlbmdhbGkg4oaSIHNtQmVuZ2FsaVxuICAgIDY4OiAxMywgIC8vIGxhbmdBc3NhbWVzZSDihpIgc21CZW5nYWxpXG4gICAgNjk6IDExLCAgLy8gbGFuZ0d1amFyYXRpIOKGkiBzbUd1amFyYXRpXG4gICAgNzA6IDEwLCAgLy8gbGFuZ1B1bmphYmkg4oaSIHNtR3VybXVraGlcbiAgICA3MTogMTIsICAvLyBsYW5nT3JpeWEg4oaSIHNtT3JpeWFcbiAgICA3MjogMTcsICAvLyBsYW5nTWFsYXlhbGFtIOKGkiBzbU1hbGF5YWxhbVxuICAgIDczOiAxNiwgIC8vIGxhbmdLYW5uYWRhIOKGkiBzbUthbm5hZGFcbiAgICA3NDogMTQsICAvLyBsYW5nVGFtaWwg4oaSIHNtVGFtaWxcbiAgICA3NTogMTUsICAvLyBsYW5nVGVsdWd1IOKGkiBzbVRlbHVndVxuICAgIDc2OiAxOCwgIC8vIGxhbmdTaW5oYWxlc2Ug4oaSIHNtU2luaGFsZXNlXG4gICAgNzc6IDE5LCAgLy8gbGFuZ0J1cm1lc2Ug4oaSIHNtQnVybWVzZVxuICAgIDc4OiAyMCwgIC8vIGxhbmdLaG1lciDihpIgc21LaG1lclxuICAgIDc5OiAyMiwgIC8vIGxhbmdMYW8g4oaSIHNtTGFvXG4gICAgODA6IDMwLCAgLy8gbGFuZ1ZpZXRuYW1lc2Ug4oaSIHNtVmlldG5hbWVzZVxuICAgIDgxOiAwLCAgLy8gbGFuZ0luZG9uZXNpYW4g4oaSIHNtUm9tYW5cbiAgICA4MjogMCwgIC8vIGxhbmdUYWdhbG9nIOKGkiBzbVJvbWFuXG4gICAgODM6IDAsICAvLyBsYW5nTWFsYXlSb21hbiDihpIgc21Sb21hblxuICAgIDg0OiA0LCAgLy8gbGFuZ01hbGF5QXJhYmljIOKGkiBzbUFyYWJpY1xuICAgIDg1OiAyOCwgIC8vIGxhbmdBbWhhcmljIOKGkiBzbUV0aGlvcGljXG4gICAgODY6IDI4LCAgLy8gbGFuZ1RpZ3JpbnlhIOKGkiBzbUV0aGlvcGljXG4gICAgODc6IDI4LCAgLy8gbGFuZ09yb21vIOKGkiBzbUV0aGlvcGljXG4gICAgODg6IDAsICAvLyBsYW5nU29tYWxpIOKGkiBzbVJvbWFuXG4gICAgODk6IDAsICAvLyBsYW5nU3dhaGlsaSDihpIgc21Sb21hblxuICAgIDkwOiAwLCAgLy8gbGFuZ0tpbnlhcndhbmRhIOKGkiBzbVJvbWFuXG4gICAgOTE6IDAsICAvLyBsYW5nUnVuZGkg4oaSIHNtUm9tYW5cbiAgICA5MjogMCwgIC8vIGxhbmdOeWFuamEg4oaSIHNtUm9tYW5cbiAgICA5MzogMCwgIC8vIGxhbmdNYWxhZ2FzeSDihpIgc21Sb21hblxuICAgIDk0OiAwLCAgLy8gbGFuZ0VzcGVyYW50byDihpIgc21Sb21hblxuICAgIDEyODogMCwgIC8vIGxhbmdXZWxzaCDihpIgc21Sb21hbiAobW9kaWZpZWQpXG4gICAgMTI5OiAwLCAgLy8gbGFuZ0Jhc3F1ZSDihpIgc21Sb21hblxuICAgIDEzMDogMCwgIC8vIGxhbmdDYXRhbGFuIOKGkiBzbVJvbWFuXG4gICAgMTMxOiAwLCAgLy8gbGFuZ0xhdGluIOKGkiBzbVJvbWFuXG4gICAgMTMyOiAwLCAgLy8gbGFuZ1F1ZWNodWEg4oaSIHNtUm9tYW5cbiAgICAxMzM6IDAsICAvLyBsYW5nR3VhcmFuaSDihpIgc21Sb21hblxuICAgIDEzNDogMCwgIC8vIGxhbmdBeW1hcmEg4oaSIHNtUm9tYW5cbiAgICAxMzU6IDcsICAvLyBsYW5nVGF0YXIg4oaSIHNtQ3lyaWxsaWNcbiAgICAxMzY6IDQsICAvLyBsYW5nVWlnaHVyIOKGkiBzbUFyYWJpY1xuICAgIDEzNzogMjYsICAvLyBsYW5nRHpvbmdraGEg4oaSIHNtVGliZXRhblxuICAgIDEzODogMCwgIC8vIGxhbmdKYXZhbmVzZVJvbSDihpIgc21Sb21hblxuICAgIDEzOTogMCwgIC8vIGxhbmdTdW5kYW5lc2VSb20g4oaSIHNtUm9tYW5cbiAgICAxNDA6IDAsICAvLyBsYW5nR2FsaWNpYW4g4oaSIHNtUm9tYW5cbiAgICAxNDE6IDAsICAvLyBsYW5nQWZyaWthYW5zIOKGkiBzbVJvbWFuXG4gICAgMTQyOiAwLCAgLy8gbGFuZ0JyZXRvbiDihpIgc21Sb21hbiAobW9kaWZpZWQpXG4gICAgMTQzOiAyOCwgIC8vIGxhbmdJbnVrdGl0dXQg4oaSIHNtRXRoaW9waWMgKG1vZGlmaWVkKVxuICAgIDE0NDogMCwgIC8vIGxhbmdTY290dGlzaEdhZWxpYyDihpIgc21Sb21hbiAobW9kaWZpZWQpXG4gICAgMTQ1OiAwLCAgLy8gbGFuZ01hbnhHYWVsaWMg4oaSIHNtUm9tYW4gKG1vZGlmaWVkKVxuICAgIDE0NjogMCwgIC8vIGxhbmdJcmlzaEdhZWxpY1NjcmlwdCDihpIgc21Sb21hbiAobW9kaWZpZWQpXG4gICAgMTQ3OiAwLCAgLy8gbGFuZ1RvbmdhbiDihpIgc21Sb21hblxuICAgIDE0ODogNiwgIC8vIGxhbmdHcmVla0FuY2llbnQg4oaSIHNtUm9tYW5cbiAgICAxNDk6IDAsICAvLyBsYW5nR3JlZW5sYW5kaWMg4oaSIHNtUm9tYW5cbiAgICAxNTA6IDAsICAvLyBsYW5nQXplcmJhaWphblJvbWFuIOKGkiBzbVJvbWFuXG4gICAgMTUxOiAwICAgLy8gbGFuZ055bm9yc2sg4oaSIHNtUm9tYW5cbn07XG5cbi8vIFdoaWxlIE1pY3Jvc29mdCBpbmRpY2F0ZXMgYSByZWdpb24vY291bnRyeSBmb3IgYWxsIGl0cyBsYW5ndWFnZVxuLy8gSURzLCB3ZSBvbWl0IHRoZSByZWdpb24gY29kZSBpZiBpdCdzIGVxdWFsIHRvIHRoZSBcIm1vc3QgbGlrZWx5XG4vLyByZWdpb24gc3VidGFnXCIgYWNjb3JkaW5nIHRvIFVuaWNvZGUgQ0xEUi4gRm9yIHNjcmlwdHMsIHdlIG9taXRcbi8vIHRoZSBzdWJ0YWcgaWYgaXQgaXMgZXF1YWwgdG8gdGhlIFN1cHByZXNzLVNjcmlwdCBlbnRyeSBpbiB0aGVcbi8vIElBTkEgbGFuZ3VhZ2Ugc3VidGFnIHJlZ2lzdHJ5IGZvciBJRVRGIEJDUCA0Ny5cbi8vXG4vLyBGb3IgZXhhbXBsZSwgTWljcm9zb2Z0IHN0YXRlcyB0aGF0IGl0cyBsYW5ndWFnZSBjb2RlIDB4MDQxQSBpc1xuLy8gQ3JvYXRpYW4gaW4gQ3JvYXRpYS4gV2UgdHJhbnNmb3JtIHRoaXMgdG8gdGhlIEJDUCA0NyBsYW5ndWFnZSBjb2RlICdocidcbi8vIGFuZCBub3QgJ2hyLUhSJyBiZWNhdXNlIENyb2F0aWEgaXMgdGhlIGRlZmF1bHQgY291bnRyeSBmb3IgQ3JvYXRpYW4sXG4vLyBhY2NvcmRpbmcgdG8gVW5pY29kZSBDTERSLiBBcyBhbm90aGVyIGV4YW1wbGUsIE1pY3Jvc29mdCBzdGF0ZXNcbi8vIHRoYXQgMHgxMDFBIGlzIENyb2F0aWFuIChMYXRpbikgaW4gQm9zbmlhLUhlcnplZ292aW5hLiBXZSB0cmFuc2Zvcm1cbi8vIHRoaXMgdG8gJ2hyLUJBJyBhbmQgbm90ICdoci1MYXRuLUJBJyBiZWNhdXNlIExhdGluIGlzIHRoZSBkZWZhdWx0IHNjcmlwdFxuLy8gZm9yIHRoZSBDcm9hdGlhbiBsYW5ndWFnZSwgYWNjb3JkaW5nIHRvIElBTkEuXG4vL1xuLy8gaHR0cDovL3d3dy51bmljb2RlLm9yZy9jbGRyL2NoYXJ0cy9sYXRlc3Qvc3VwcGxlbWVudGFsL2xpa2VseV9zdWJ0YWdzLmh0bWxcbi8vIGh0dHA6Ly93d3cuaWFuYS5vcmcvYXNzaWdubWVudHMvbGFuZ3VhZ2Utc3VidGFnLXJlZ2lzdHJ5L2xhbmd1YWdlLXN1YnRhZy1yZWdpc3RyeVxudmFyIHdpbmRvd3NMYW5ndWFnZXMgPSB7XG4gICAgMHgwNDM2OiAnYWYnLFxuICAgIDB4MDQxQzogJ3NxJyxcbiAgICAweDA0ODQ6ICdnc3cnLFxuICAgIDB4MDQ1RTogJ2FtJyxcbiAgICAweDE0MDE6ICdhci1EWicsXG4gICAgMHgzQzAxOiAnYXItQkgnLFxuICAgIDB4MEMwMTogJ2FyJyxcbiAgICAweDA4MDE6ICdhci1JUScsXG4gICAgMHgyQzAxOiAnYXItSk8nLFxuICAgIDB4MzQwMTogJ2FyLUtXJyxcbiAgICAweDMwMDE6ICdhci1MQicsXG4gICAgMHgxMDAxOiAnYXItTFknLFxuICAgIDB4MTgwMTogJ2FyeScsXG4gICAgMHgyMDAxOiAnYXItT00nLFxuICAgIDB4NDAwMTogJ2FyLVFBJyxcbiAgICAweDA0MDE6ICdhci1TQScsXG4gICAgMHgyODAxOiAnYXItU1knLFxuICAgIDB4MUMwMTogJ2FlYicsXG4gICAgMHgzODAxOiAnYXItQUUnLFxuICAgIDB4MjQwMTogJ2FyLVlFJyxcbiAgICAweDA0MkI6ICdoeScsXG4gICAgMHgwNDREOiAnYXMnLFxuICAgIDB4MDgyQzogJ2F6LUN5cmwnLFxuICAgIDB4MDQyQzogJ2F6JyxcbiAgICAweDA0NkQ6ICdiYScsXG4gICAgMHgwNDJEOiAnZXUnLFxuICAgIDB4MDQyMzogJ2JlJyxcbiAgICAweDA4NDU6ICdibicsXG4gICAgMHgwNDQ1OiAnYm4tSU4nLFxuICAgIDB4MjAxQTogJ2JzLUN5cmwnLFxuICAgIDB4MTQxQTogJ2JzJyxcbiAgICAweDA0N0U6ICdicicsXG4gICAgMHgwNDAyOiAnYmcnLFxuICAgIDB4MDQwMzogJ2NhJyxcbiAgICAweDBDMDQ6ICd6aC1ISycsXG4gICAgMHgxNDA0OiAnemgtTU8nLFxuICAgIDB4MDgwNDogJ3poJyxcbiAgICAweDEwMDQ6ICd6aC1TRycsXG4gICAgMHgwNDA0OiAnemgtVFcnLFxuICAgIDB4MDQ4MzogJ2NvJyxcbiAgICAweDA0MUE6ICdocicsXG4gICAgMHgxMDFBOiAnaHItQkEnLFxuICAgIDB4MDQwNTogJ2NzJyxcbiAgICAweDA0MDY6ICdkYScsXG4gICAgMHgwNDhDOiAncHJzJyxcbiAgICAweDA0NjU6ICdkdicsXG4gICAgMHgwODEzOiAnbmwtQkUnLFxuICAgIDB4MDQxMzogJ25sJyxcbiAgICAweDBDMDk6ICdlbi1BVScsXG4gICAgMHgyODA5OiAnZW4tQlonLFxuICAgIDB4MTAwOTogJ2VuLUNBJyxcbiAgICAweDI0MDk6ICdlbi0wMjknLFxuICAgIDB4NDAwOTogJ2VuLUlOJyxcbiAgICAweDE4MDk6ICdlbi1JRScsXG4gICAgMHgyMDA5OiAnZW4tSk0nLFxuICAgIDB4NDQwOTogJ2VuLU1ZJyxcbiAgICAweDE0MDk6ICdlbi1OWicsXG4gICAgMHgzNDA5OiAnZW4tUEgnLFxuICAgIDB4NDgwOTogJ2VuLVNHJyxcbiAgICAweDFDMDk6ICdlbi1aQScsXG4gICAgMHgyQzA5OiAnZW4tVFQnLFxuICAgIDB4MDgwOTogJ2VuLUdCJyxcbiAgICAweDA0MDk6ICdlbicsXG4gICAgMHgzMDA5OiAnZW4tWlcnLFxuICAgIDB4MDQyNTogJ2V0JyxcbiAgICAweDA0Mzg6ICdmbycsXG4gICAgMHgwNDY0OiAnZmlsJyxcbiAgICAweDA0MEI6ICdmaScsXG4gICAgMHgwODBDOiAnZnItQkUnLFxuICAgIDB4MEMwQzogJ2ZyLUNBJyxcbiAgICAweDA0MEM6ICdmcicsXG4gICAgMHgxNDBDOiAnZnItTFUnLFxuICAgIDB4MTgwQzogJ2ZyLU1DJyxcbiAgICAweDEwMEM6ICdmci1DSCcsXG4gICAgMHgwNDYyOiAnZnknLFxuICAgIDB4MDQ1NjogJ2dsJyxcbiAgICAweDA0Mzc6ICdrYScsXG4gICAgMHgwQzA3OiAnZGUtQVQnLFxuICAgIDB4MDQwNzogJ2RlJyxcbiAgICAweDE0MDc6ICdkZS1MSScsXG4gICAgMHgxMDA3OiAnZGUtTFUnLFxuICAgIDB4MDgwNzogJ2RlLUNIJyxcbiAgICAweDA0MDg6ICdlbCcsXG4gICAgMHgwNDZGOiAna2wnLFxuICAgIDB4MDQ0NzogJ2d1JyxcbiAgICAweDA0Njg6ICdoYScsXG4gICAgMHgwNDBEOiAnaGUnLFxuICAgIDB4MDQzOTogJ2hpJyxcbiAgICAweDA0MEU6ICdodScsXG4gICAgMHgwNDBGOiAnaXMnLFxuICAgIDB4MDQ3MDogJ2lnJyxcbiAgICAweDA0MjE6ICdpZCcsXG4gICAgMHgwNDVEOiAnaXUnLFxuICAgIDB4MDg1RDogJ2l1LUxhdG4nLFxuICAgIDB4MDgzQzogJ2dhJyxcbiAgICAweDA0MzQ6ICd4aCcsXG4gICAgMHgwNDM1OiAnenUnLFxuICAgIDB4MDQxMDogJ2l0JyxcbiAgICAweDA4MTA6ICdpdC1DSCcsXG4gICAgMHgwNDExOiAnamEnLFxuICAgIDB4MDQ0QjogJ2tuJyxcbiAgICAweDA0M0Y6ICdraycsXG4gICAgMHgwNDUzOiAna20nLFxuICAgIDB4MDQ4NjogJ3F1YycsXG4gICAgMHgwNDg3OiAncncnLFxuICAgIDB4MDQ0MTogJ3N3JyxcbiAgICAweDA0NTc6ICdrb2snLFxuICAgIDB4MDQxMjogJ2tvJyxcbiAgICAweDA0NDA6ICdreScsXG4gICAgMHgwNDU0OiAnbG8nLFxuICAgIDB4MDQyNjogJ2x2JyxcbiAgICAweDA0Mjc6ICdsdCcsXG4gICAgMHgwODJFOiAnZHNiJyxcbiAgICAweDA0NkU6ICdsYicsXG4gICAgMHgwNDJGOiAnbWsnLFxuICAgIDB4MDgzRTogJ21zLUJOJyxcbiAgICAweDA0M0U6ICdtcycsXG4gICAgMHgwNDRDOiAnbWwnLFxuICAgIDB4MDQzQTogJ210JyxcbiAgICAweDA0ODE6ICdtaScsXG4gICAgMHgwNDdBOiAnYXJuJyxcbiAgICAweDA0NEU6ICdtcicsXG4gICAgMHgwNDdDOiAnbW9oJyxcbiAgICAweDA0NTA6ICdtbicsXG4gICAgMHgwODUwOiAnbW4tQ04nLFxuICAgIDB4MDQ2MTogJ25lJyxcbiAgICAweDA0MTQ6ICduYicsXG4gICAgMHgwODE0OiAnbm4nLFxuICAgIDB4MDQ4MjogJ29jJyxcbiAgICAweDA0NDg6ICdvcicsXG4gICAgMHgwNDYzOiAncHMnLFxuICAgIDB4MDQxNTogJ3BsJyxcbiAgICAweDA0MTY6ICdwdCcsXG4gICAgMHgwODE2OiAncHQtUFQnLFxuICAgIDB4MDQ0NjogJ3BhJyxcbiAgICAweDA0NkI6ICdxdS1CTycsXG4gICAgMHgwODZCOiAncXUtRUMnLFxuICAgIDB4MEM2QjogJ3F1JyxcbiAgICAweDA0MTg6ICdybycsXG4gICAgMHgwNDE3OiAncm0nLFxuICAgIDB4MDQxOTogJ3J1JyxcbiAgICAweDI0M0I6ICdzbW4nLFxuICAgIDB4MTAzQjogJ3Ntai1OTycsXG4gICAgMHgxNDNCOiAnc21qJyxcbiAgICAweDBDM0I6ICdzZS1GSScsXG4gICAgMHgwNDNCOiAnc2UnLFxuICAgIDB4MDgzQjogJ3NlLVNFJyxcbiAgICAweDIwM0I6ICdzbXMnLFxuICAgIDB4MTgzQjogJ3NtYS1OTycsXG4gICAgMHgxQzNCOiAnc21zJyxcbiAgICAweDA0NEY6ICdzYScsXG4gICAgMHgxQzFBOiAnc3ItQ3lybC1CQScsXG4gICAgMHgwQzFBOiAnc3InLFxuICAgIDB4MTgxQTogJ3NyLUxhdG4tQkEnLFxuICAgIDB4MDgxQTogJ3NyLUxhdG4nLFxuICAgIDB4MDQ2QzogJ25zbycsXG4gICAgMHgwNDMyOiAndG4nLFxuICAgIDB4MDQ1QjogJ3NpJyxcbiAgICAweDA0MUI6ICdzaycsXG4gICAgMHgwNDI0OiAnc2wnLFxuICAgIDB4MkMwQTogJ2VzLUFSJyxcbiAgICAweDQwMEE6ICdlcy1CTycsXG4gICAgMHgzNDBBOiAnZXMtQ0wnLFxuICAgIDB4MjQwQTogJ2VzLUNPJyxcbiAgICAweDE0MEE6ICdlcy1DUicsXG4gICAgMHgxQzBBOiAnZXMtRE8nLFxuICAgIDB4MzAwQTogJ2VzLUVDJyxcbiAgICAweDQ0MEE6ICdlcy1TVicsXG4gICAgMHgxMDBBOiAnZXMtR1QnLFxuICAgIDB4NDgwQTogJ2VzLUhOJyxcbiAgICAweDA4MEE6ICdlcy1NWCcsXG4gICAgMHg0QzBBOiAnZXMtTkknLFxuICAgIDB4MTgwQTogJ2VzLVBBJyxcbiAgICAweDNDMEE6ICdlcy1QWScsXG4gICAgMHgyODBBOiAnZXMtUEUnLFxuICAgIDB4NTAwQTogJ2VzLVBSJyxcblxuICAgIC8vIE1pY3Jvc29mdCBoYXMgZGVmaW5lZCB0d28gZGlmZmVyZW50IGxhbmd1YWdlIGNvZGVzIGZvclxuICAgIC8vIOKAnFNwYW5pc2ggd2l0aCBtb2Rlcm4gc29ydGluZ+KAnSBhbmQg4oCcU3BhbmlzaCB3aXRoIHRyYWRpdGlvbmFsXG4gICAgLy8gc29ydGluZ+KAnS4gVGhpcyBtYWtlcyBzZW5zZSBmb3IgY29sbGF0aW9uIEFQSXMsIGFuZCBpdCB3b3VsZCBiZVxuICAgIC8vIHBvc3NpYmxlIHRvIGV4cHJlc3MgdGhpcyBpbiBCQ1AgNDcgbGFuZ3VhZ2UgdGFncyB2aWEgVW5pY29kZVxuICAgIC8vIGV4dGVuc2lvbnMgKGVnLiwgZXMtdS1jby10cmFkIGlzIFNwYW5pc2ggd2l0aCB0cmFkaXRpb25hbFxuICAgIC8vIHNvcnRpbmcpLiBIb3dldmVyLCBmb3Igc3RvcmluZyBuYW1lcyBpbiBmb250cywgdGhlIGRpc3RpbmN0aW9uXG4gICAgLy8gZG9lcyBub3QgbWFrZSBzZW5zZSwgc28gd2UgZ2l2ZSDigJxlc+KAnSBpbiBib3RoIGNhc2VzLlxuICAgIDB4MEMwQTogJ2VzJyxcbiAgICAweDA0MEE6ICdlcycsXG5cbiAgICAweDU0MEE6ICdlcy1VUycsXG4gICAgMHgzODBBOiAnZXMtVVknLFxuICAgIDB4MjAwQTogJ2VzLVZFJyxcbiAgICAweDA4MUQ6ICdzdi1GSScsXG4gICAgMHgwNDFEOiAnc3YnLFxuICAgIDB4MDQ1QTogJ3N5cicsXG4gICAgMHgwNDI4OiAndGcnLFxuICAgIDB4MDg1RjogJ3R6bScsXG4gICAgMHgwNDQ5OiAndGEnLFxuICAgIDB4MDQ0NDogJ3R0JyxcbiAgICAweDA0NEE6ICd0ZScsXG4gICAgMHgwNDFFOiAndGgnLFxuICAgIDB4MDQ1MTogJ2JvJyxcbiAgICAweDA0MUY6ICd0cicsXG4gICAgMHgwNDQyOiAndGsnLFxuICAgIDB4MDQ4MDogJ3VnJyxcbiAgICAweDA0MjI6ICd1aycsXG4gICAgMHgwNDJFOiAnaHNiJyxcbiAgICAweDA0MjA6ICd1cicsXG4gICAgMHgwODQzOiAndXotQ3lybCcsXG4gICAgMHgwNDQzOiAndXonLFxuICAgIDB4MDQyQTogJ3ZpJyxcbiAgICAweDA0NTI6ICdjeScsXG4gICAgMHgwNDg4OiAnd28nLFxuICAgIDB4MDQ4NTogJ3NhaCcsXG4gICAgMHgwNDc4OiAnaWknLFxuICAgIDB4MDQ2QTogJ3lvJ1xufTtcblxuLy8gUmV0dXJucyBhIElFVEYgQkNQIDQ3IGxhbmd1YWdlIGNvZGUsIGZvciBleGFtcGxlICd6aC1IYW50J1xuLy8gZm9yICdDaGluZXNlIGluIHRoZSB0cmFkaXRpb25hbCBzY3JpcHQnLlxuZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VDb2RlKHBsYXRmb3JtSUQsIGxhbmd1YWdlSUQsIGx0YWcpIHtcbiAgICBzd2l0Y2ggKHBsYXRmb3JtSUQpIHtcbiAgICAgICAgY2FzZSAwOiAgLy8gVW5pY29kZVxuICAgICAgICAgICAgaWYgKGxhbmd1YWdlSUQgPT09IDB4RkZGRikge1xuICAgICAgICAgICAgICAgIHJldHVybiAndW5kJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobHRhZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBsdGFnW2xhbmd1YWdlSURdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIDE6ICAvLyBNYWNpbnRvc2hcbiAgICAgICAgICAgIHJldHVybiBtYWNMYW5ndWFnZXNbbGFuZ3VhZ2VJRF07XG5cbiAgICAgICAgY2FzZSAzOiAgLy8gV2luZG93c1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvd3NMYW5ndWFnZXNbbGFuZ3VhZ2VJRF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxudmFyIHV0ZjE2ID0gJ3V0Zi0xNic7XG5cbi8vIE1hY09TIHNjcmlwdCBJRCDihpIgZW5jb2RpbmcuIFRoaXMgdGFibGUgc3RvcmVzIHRoZSBkZWZhdWx0IGNhc2UsXG4vLyB3aGljaCBjYW4gYmUgb3ZlcnJpZGRlbiBieSBtYWNMYW5ndWFnZUVuY29kaW5ncy5cbnZhciBtYWNTY3JpcHRFbmNvZGluZ3MgPSB7XG4gICAgMDogJ21hY2ludG9zaCcsICAgICAgICAgICAvLyBzbVJvbWFuXG4gICAgMTogJ3gtbWFjLWphcGFuZXNlJywgICAgICAvLyBzbUphcGFuZXNlXG4gICAgMjogJ3gtbWFjLWNoaW5lc2V0cmFkJywgICAvLyBzbVRyYWRDaGluZXNlXG4gICAgMzogJ3gtbWFjLWtvcmVhbicsICAgICAgICAvLyBzbUtvcmVhblxuICAgIDY6ICd4LW1hYy1ncmVlaycsICAgICAgICAgLy8gc21HcmVla1xuICAgIDc6ICd4LW1hYy1jeXJpbGxpYycsICAgICAgLy8gc21DeXJpbGxpY1xuICAgIDk6ICd4LW1hYy1kZXZhbmFnYWknLCAgICAgLy8gc21EZXZhbmFnYXJpXG4gICAgMTA6ICd4LW1hYy1ndXJtdWtoaScsICAgICAvLyBzbUd1cm11a2hpXG4gICAgMTE6ICd4LW1hYy1ndWphcmF0aScsICAgICAvLyBzbUd1amFyYXRpXG4gICAgMTI6ICd4LW1hYy1vcml5YScsICAgICAgICAvLyBzbU9yaXlhXG4gICAgMTM6ICd4LW1hYy1iZW5nYWxpJywgICAgICAvLyBzbUJlbmdhbGlcbiAgICAxNDogJ3gtbWFjLXRhbWlsJywgICAgICAgIC8vIHNtVGFtaWxcbiAgICAxNTogJ3gtbWFjLXRlbHVndScsICAgICAgIC8vIHNtVGVsdWd1XG4gICAgMTY6ICd4LW1hYy1rYW5uYWRhJywgICAgICAvLyBzbUthbm5hZGFcbiAgICAxNzogJ3gtbWFjLW1hbGF5YWxhbScsICAgIC8vIHNtTWFsYXlhbGFtXG4gICAgMTg6ICd4LW1hYy1zaW5oYWxlc2UnLCAgICAvLyBzbVNpbmhhbGVzZVxuICAgIDE5OiAneC1tYWMtYnVybWVzZScsICAgICAgLy8gc21CdXJtZXNlXG4gICAgMjA6ICd4LW1hYy1raG1lcicsICAgICAgICAvLyBzbUtobWVyXG4gICAgMjE6ICd4LW1hYy10aGFpJywgICAgICAgICAvLyBzbVRoYWlcbiAgICAyMjogJ3gtbWFjLWxhbycsICAgICAgICAgIC8vIHNtTGFvXG4gICAgMjM6ICd4LW1hYy1nZW9yZ2lhbicsICAgICAvLyBzbUdlb3JnaWFuXG4gICAgMjQ6ICd4LW1hYy1hcm1lbmlhbicsICAgICAvLyBzbUFybWVuaWFuXG4gICAgMjU6ICd4LW1hYy1jaGluZXNlc2ltcCcsICAvLyBzbVNpbXBDaGluZXNlXG4gICAgMjY6ICd4LW1hYy10aWJldGFuJywgICAgICAvLyBzbVRpYmV0YW5cbiAgICAyNzogJ3gtbWFjLW1vbmdvbGlhbicsICAgIC8vIHNtTW9uZ29saWFuXG4gICAgMjg6ICd4LW1hYy1ldGhpb3BpYycsICAgICAvLyBzbUV0aGlvcGljXG4gICAgMjk6ICd4LW1hYy1jZScsICAgICAgICAgICAvLyBzbUNlbnRyYWxFdXJvUm9tYW5cbiAgICAzMDogJ3gtbWFjLXZpZXRuYW1lc2UnLCAgIC8vIHNtVmlldG5hbWVzZVxuICAgIDMxOiAneC1tYWMtZXh0YXJhYmljJyAgICAgLy8gc21FeHRBcmFiaWNcbn07XG5cbi8vIE1hY09TIGxhbmd1YWdlIElEIOKGkiBlbmNvZGluZy4gVGhpcyB0YWJsZSBzdG9yZXMgdGhlIGV4Y2VwdGlvbmFsXG4vLyBjYXNlcywgd2hpY2ggb3ZlcnJpZGUgbWFjU2NyaXB0RW5jb2RpbmdzLiBGb3Igd3JpdGluZyBNYWNPUyBuYW1pbmdcbi8vIHRhYmxlcywgd2UgbmVlZCB0byBlbWl0IGEgTWFjT1Mgc2NyaXB0IElELiBUaGVyZWZvcmUsIHdlIGNhbm5vdFxuLy8gbWVyZ2UgbWFjU2NyaXB0RW5jb2RpbmdzIGludG8gbWFjTGFuZ3VhZ2VFbmNvZGluZ3MuXG4vL1xuLy8gaHR0cDovL3VuaWNvZGUub3JnL1B1YmxpYy9NQVBQSU5HUy9WRU5ET1JTL0FQUExFL1JlYWRtZS50eHRcbnZhciBtYWNMYW5ndWFnZUVuY29kaW5ncyA9IHtcbiAgICAxNTogJ3gtbWFjLWljZWxhbmRpYycsICAgIC8vIGxhbmdJY2VsYW5kaWNcbiAgICAxNzogJ3gtbWFjLXR1cmtpc2gnLCAgICAgIC8vIGxhbmdUdXJraXNoXG4gICAgMTg6ICd4LW1hYy1jcm9hdGlhbicsICAgICAvLyBsYW5nQ3JvYXRpYW5cbiAgICAyNDogJ3gtbWFjLWNlJywgICAgICAgICAgIC8vIGxhbmdMaXRodWFuaWFuXG4gICAgMjU6ICd4LW1hYy1jZScsICAgICAgICAgICAvLyBsYW5nUG9saXNoXG4gICAgMjY6ICd4LW1hYy1jZScsICAgICAgICAgICAvLyBsYW5nSHVuZ2FyaWFuXG4gICAgMjc6ICd4LW1hYy1jZScsICAgICAgICAgICAvLyBsYW5nRXN0b25pYW5cbiAgICAyODogJ3gtbWFjLWNlJywgICAgICAgICAgIC8vIGxhbmdMYXR2aWFuXG4gICAgMzA6ICd4LW1hYy1pY2VsYW5kaWMnLCAgICAvLyBsYW5nRmFyb2VzZVxuICAgIDM3OiAneC1tYWMtcm9tYW5pYW4nLCAgICAgLy8gbGFuZ1JvbWFuaWFuXG4gICAgMzg6ICd4LW1hYy1jZScsICAgICAgICAgICAvLyBsYW5nQ3plY2hcbiAgICAzOTogJ3gtbWFjLWNlJywgICAgICAgICAgIC8vIGxhbmdTbG92YWtcbiAgICA0MDogJ3gtbWFjLWNlJywgICAgICAgICAgIC8vIGxhbmdTbG92ZW5pYW5cbiAgICAxNDM6ICd4LW1hYy1pbnVpdCcsICAgICAgIC8vIGxhbmdJbnVrdGl0dXRcbiAgICAxNDY6ICd4LW1hYy1nYWVsaWMnICAgICAgIC8vIGxhbmdJcmlzaEdhZWxpY1NjcmlwdFxufTtcblxuZnVuY3Rpb24gZ2V0RW5jb2RpbmcocGxhdGZvcm1JRCwgZW5jb2RpbmdJRCwgbGFuZ3VhZ2VJRCkge1xuICAgIHN3aXRjaCAocGxhdGZvcm1JRCkge1xuICAgICAgICBjYXNlIDA6ICAvLyBVbmljb2RlXG4gICAgICAgICAgICByZXR1cm4gdXRmMTY7XG5cbiAgICAgICAgY2FzZSAxOiAgLy8gQXBwbGUgTWFjaW50b3NoXG4gICAgICAgICAgICByZXR1cm4gbWFjTGFuZ3VhZ2VFbmNvZGluZ3NbbGFuZ3VhZ2VJRF0gfHwgbWFjU2NyaXB0RW5jb2RpbmdzW2VuY29kaW5nSURdO1xuXG4gICAgICAgIGNhc2UgMzogIC8vIE1pY3Jvc29mdCBXaW5kb3dzXG4gICAgICAgICAgICBpZiAoZW5jb2RpbmdJRCA9PT0gMSB8fCBlbmNvZGluZ0lEID09PSAxMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1dGYxNjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLy8gUGFyc2UgdGhlIG5hbWluZyBgbmFtZWAgdGFibGUuXG4vLyBGSVhNRTogRm9ybWF0IDEgYWRkaXRpb25hbCBmaWVsZHMgYXJlIG5vdCBzdXBwb3J0ZWQgeWV0LlxuLy8gbHRhZyBpcyB0aGUgY29udGVudCBvZiB0aGUgYGx0YWcnIHRhYmxlLCBzdWNoIGFzIFsnZW4nLCAnemgtSGFucycsICdkZS1DSC0xOTA0J10uXG5mdW5jdGlvbiBwYXJzZU5hbWVUYWJsZShkYXRhLCBzdGFydCwgbHRhZykge1xuICAgIHZhciBuYW1lID0ge307XG4gICAgdmFyIHAgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0KTtcbiAgICB2YXIgZm9ybWF0ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIHZhciBjb3VudCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICB2YXIgc3RyaW5nT2Zmc2V0ID0gcC5vZmZzZXQgKyBwLnBhcnNlVVNob3J0KCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciBwbGF0Zm9ybUlEID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICB2YXIgZW5jb2RpbmdJRCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgdmFyIGxhbmd1YWdlSUQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIHZhciBuYW1lSUQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIHZhciBwcm9wZXJ0eSA9IG5hbWVUYWJsZU5hbWVzW25hbWVJRF0gfHwgbmFtZUlEO1xuICAgICAgICB2YXIgYnl0ZUxlbmd0aCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgdmFyIG9mZnNldCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICAgICAgdmFyIGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2VDb2RlKHBsYXRmb3JtSUQsIGxhbmd1YWdlSUQsIGx0YWcpO1xuICAgICAgICB2YXIgZW5jb2RpbmcgPSBnZXRFbmNvZGluZyhwbGF0Zm9ybUlELCBlbmNvZGluZ0lELCBsYW5ndWFnZUlEKTtcbiAgICAgICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgbGFuZ3VhZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIHRleHQ7XG4gICAgICAgICAgICBpZiAoZW5jb2RpbmcgPT09IHV0ZjE2KSB7XG4gICAgICAgICAgICAgICAgdGV4dCA9IGRlY29kZS5VVEYxNihkYXRhLCBzdHJpbmdPZmZzZXQgKyBvZmZzZXQsIGJ5dGVMZW5ndGgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gZGVjb2RlLk1BQ1NUUklORyhkYXRhLCBzdHJpbmdPZmZzZXQgKyBvZmZzZXQsIGJ5dGVMZW5ndGgsIGVuY29kaW5nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHJhbnNsYXRpb25zID0gbmFtZVtwcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zbGF0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9ucyA9IG5hbWVbcHJvcGVydHldID0ge307XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRpb25zW2xhbmd1YWdlXSA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFuZ1RhZ0NvdW50ID0gMDtcbiAgICBpZiAoZm9ybWF0ID09PSAxKSB7XG4gICAgICAgIC8vIEZJWE1FOiBBbHNvIGhhbmRsZSBNaWNyb3NvZnQncyAnbmFtZScgdGFibGUgMS5cbiAgICAgICAgbGFuZ1RhZ0NvdW50ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuYW1lO1xufVxuXG4vLyB7MjM6ICdmb28nfSDihpIgeydmb28nOiAyM31cbi8vIFsnYmFyJywgJ2JheiddIOKGkiB7J2Jhcic6IDAsICdiYXonOiAxfVxuZnVuY3Rpb24gcmV2ZXJzZURpY3QoZGljdCkge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGljdCkge1xuICAgICAgICByZXN1bHRbZGljdFtrZXldXSA9IHBhcnNlSW50KGtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gbWFrZU5hbWVSZWNvcmQocGxhdGZvcm1JRCwgZW5jb2RpbmdJRCwgbGFuZ3VhZ2VJRCwgbmFtZUlELCBsZW5ndGgsIG9mZnNldCkge1xuICAgIHJldHVybiBuZXcgdGFibGUuUmVjb3JkKCdOYW1lUmVjb3JkJywgW1xuICAgICAgICB7bmFtZTogJ3BsYXRmb3JtSUQnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IHBsYXRmb3JtSUR9LFxuICAgICAgICB7bmFtZTogJ2VuY29kaW5nSUQnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IGVuY29kaW5nSUR9LFxuICAgICAgICB7bmFtZTogJ2xhbmd1YWdlSUQnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IGxhbmd1YWdlSUR9LFxuICAgICAgICB7bmFtZTogJ25hbWVJRCcsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogbmFtZUlEfSxcbiAgICAgICAge25hbWU6ICdsZW5ndGgnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IGxlbmd0aH0sXG4gICAgICAgIHtuYW1lOiAnb2Zmc2V0JywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiBvZmZzZXR9XG4gICAgXSk7XG59XG5cbi8vIEZpbmRzIHRoZSBwb3NpdGlvbiBvZiBuZWVkbGUgaW4gaGF5c3RhY2ssIG9yIC0xIGlmIG5vdCB0aGVyZS5cbi8vIExpa2UgU3RyaW5nLmluZGV4T2YoKSwgYnV0IGZvciBhcnJheXMuXG5mdW5jdGlvbiBmaW5kU3ViQXJyYXkobmVlZGxlLCBoYXlzdGFjaykge1xuICAgIHZhciBuZWVkbGVMZW5ndGggPSBuZWVkbGUubGVuZ3RoO1xuICAgIHZhciBsaW1pdCA9IGhheXN0YWNrLmxlbmd0aCAtIG5lZWRsZUxlbmd0aCArIDE7XG5cbiAgICBsb29wOlxuICAgIGZvciAodmFyIHBvcyA9IDA7IHBvcyA8IGxpbWl0OyBwb3MrKykge1xuICAgICAgICBmb3IgKDsgcG9zIDwgbGltaXQ7IHBvcysrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IG5lZWRsZUxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhheXN0YWNrW3BvcyArIGtdICE9PSBuZWVkbGVba10pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgbG9vcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwb3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGFkZFN0cmluZ1RvUG9vbChzLCBwb29sKSB7XG4gICAgdmFyIG9mZnNldCA9IGZpbmRTdWJBcnJheShzLCBwb29sKTtcbiAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICBvZmZzZXQgPSBwb29sLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgIHBvb2wucHVzaChzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIG9mZnNldDtcbn1cblxuZnVuY3Rpb24gbWFrZU5hbWVUYWJsZShuYW1lcywgbHRhZykge1xuICAgIHZhciBuYW1lSUQ7XG4gICAgdmFyIG5hbWVJRHMgPSBbXTtcblxuICAgIHZhciBuYW1lc1dpdGhOdW1lcmljS2V5cyA9IHt9O1xuICAgIHZhciBuYW1lVGFibGVJZHMgPSByZXZlcnNlRGljdChuYW1lVGFibGVOYW1lcyk7XG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVzKSB7XG4gICAgICAgIHZhciBpZCA9IG5hbWVUYWJsZUlkc1trZXldO1xuICAgICAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWQgPSBrZXk7XG4gICAgICAgIH1cblxuICAgICAgICBuYW1lSUQgPSBwYXJzZUludChpZCk7XG4gICAgICAgIG5hbWVzV2l0aE51bWVyaWNLZXlzW25hbWVJRF0gPSBuYW1lc1trZXldO1xuICAgICAgICBuYW1lSURzLnB1c2gobmFtZUlEKTtcbiAgICB9XG5cbiAgICB2YXIgbWFjTGFuZ3VhZ2VJZHMgPSByZXZlcnNlRGljdChtYWNMYW5ndWFnZXMpO1xuICAgIHZhciB3aW5kb3dzTGFuZ3VhZ2VJZHMgPSByZXZlcnNlRGljdCh3aW5kb3dzTGFuZ3VhZ2VzKTtcblxuICAgIHZhciBuYW1lUmVjb3JkcyA9IFtdO1xuICAgIHZhciBzdHJpbmdQb29sID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVJRHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbmFtZUlEID0gbmFtZUlEc1tpXTtcbiAgICAgICAgdmFyIHRyYW5zbGF0aW9ucyA9IG5hbWVzV2l0aE51bWVyaWNLZXlzW25hbWVJRF07XG4gICAgICAgIGZvciAodmFyIGxhbmcgaW4gdHJhbnNsYXRpb25zKSB7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHRyYW5zbGF0aW9uc1tsYW5nXTtcblxuICAgICAgICAgICAgLy8gRm9yIE1hY09TLCB3ZSB0cnkgdG8gZW1pdCB0aGUgbmFtZSBpbiB0aGUgZm9ybSB0aGF0IHdhcyBpbnRyb2R1Y2VkXG4gICAgICAgICAgICAvLyBpbiB0aGUgaW5pdGlhbCB2ZXJzaW9uIG9mIHRoZSBUcnVlVHlwZSBzcGVjIChpbiB0aGUgbGF0ZSAxOTgwcykuXG4gICAgICAgICAgICAvLyBIb3dldmVyLCB0aGlzIGNhbiBmYWlsIGZvciB2YXJpb3VzIHJlYXNvbnM6IHRoZSByZXF1ZXN0ZWQgQkNQIDQ3XG4gICAgICAgICAgICAvLyBsYW5ndWFnZSBjb2RlIG1pZ2h0IG5vdCBoYXZlIGFuIG9sZC1zdHlsZSBNYWMgZXF1aXZhbGVudDtcbiAgICAgICAgICAgIC8vIHdlIG1pZ2h0IG5vdCBoYXZlIGEgY29kZWMgZm9yIHRoZSBuZWVkZWQgY2hhcmFjdGVyIGVuY29kaW5nO1xuICAgICAgICAgICAgLy8gb3IgdGhlIG5hbWUgbWlnaHQgY29udGFpbiBjaGFyYWN0ZXJzIHRoYXQgY2Fubm90IGJlIGV4cHJlc3NlZFxuICAgICAgICAgICAgLy8gaW4gdGhlIG9sZC1zdHlsZSBNYWNpbnRvc2ggZW5jb2RpbmcuIEluIGNhc2Ugb2YgZmFpbHVyZSwgd2UgZW1pdFxuICAgICAgICAgICAgLy8gdGhlIG5hbWUgaW4gYSBtb3JlIG1vZGVybiBmYXNoaW9uIChVbmljb2RlIGVuY29kaW5nIHdpdGggQkNQIDQ3XG4gICAgICAgICAgICAvLyBsYW5ndWFnZSB0YWdzKSB0aGF0IGlzIHJlY29nbml6ZWQgYnkgTWFjT1MgMTAuNSwgcmVsZWFzZWQgaW4gMjAwOS5cbiAgICAgICAgICAgIC8vIElmIGZvbnRzIHdlcmUgb25seSByZWFkIGJ5IG9wZXJhdGluZyBzeXN0ZW1zLCB3ZSBjb3VsZCBzaW1wbHlcbiAgICAgICAgICAgIC8vIGVtaXQgYWxsIG5hbWVzIGluIHRoZSBtb2Rlcm4gZm9ybTsgdGhpcyB3b3VsZCBiZSBtdWNoIGVhc2llci5cbiAgICAgICAgICAgIC8vIEhvd2V2ZXIsIHRoZXJlIGFyZSBtYW55IGFwcGxpY2F0aW9ucyBhbmQgbGlicmFyaWVzIHRoYXQgcmVhZFxuICAgICAgICAgICAgLy8gJ25hbWUnIHRhYmxlcyBkaXJlY3RseSwgYW5kIHRoZXNlIHdpbGwgdXN1YWxseSBvbmx5IHJlY29nbml6ZVxuICAgICAgICAgICAgLy8gdGhlIGFuY2llbnQgZm9ybSAoc2lsZW50bHkgc2tpcHBpbmcgdGhlIHVucmVjb2duaXplZCBuYW1lcykuXG4gICAgICAgICAgICB2YXIgbWFjUGxhdGZvcm0gPSAxOyAgLy8gTWFjaW50b3NoXG4gICAgICAgICAgICB2YXIgbWFjTGFuZ3VhZ2UgPSBtYWNMYW5ndWFnZUlkc1tsYW5nXTtcbiAgICAgICAgICAgIHZhciBtYWNTY3JpcHQgPSBtYWNMYW5ndWFnZVRvU2NyaXB0W21hY0xhbmd1YWdlXTtcbiAgICAgICAgICAgIHZhciBtYWNFbmNvZGluZyA9IGdldEVuY29kaW5nKG1hY1BsYXRmb3JtLCBtYWNTY3JpcHQsIG1hY0xhbmd1YWdlKTtcbiAgICAgICAgICAgIHZhciBtYWNOYW1lID0gZW5jb2RlLk1BQ1NUUklORyh0ZXh0LCBtYWNFbmNvZGluZyk7XG4gICAgICAgICAgICBpZiAobWFjTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbWFjUGxhdGZvcm0gPSAwOyAgLy8gVW5pY29kZVxuICAgICAgICAgICAgICAgIG1hY0xhbmd1YWdlID0gbHRhZy5pbmRleE9mKGxhbmcpO1xuICAgICAgICAgICAgICAgIGlmIChtYWNMYW5ndWFnZSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbWFjTGFuZ3VhZ2UgPSBsdGFnLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgbHRhZy5wdXNoKGxhbmcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG1hY1NjcmlwdCA9IDQ7ICAvLyBVbmljb2RlIDIuMCBhbmQgbGF0ZXJcbiAgICAgICAgICAgICAgICBtYWNOYW1lID0gZW5jb2RlLlVURjE2KHRleHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbWFjTmFtZU9mZnNldCA9IGFkZFN0cmluZ1RvUG9vbChtYWNOYW1lLCBzdHJpbmdQb29sKTtcbiAgICAgICAgICAgIG5hbWVSZWNvcmRzLnB1c2gobWFrZU5hbWVSZWNvcmQobWFjUGxhdGZvcm0sIG1hY1NjcmlwdCwgbWFjTGFuZ3VhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVJRCwgbWFjTmFtZS5sZW5ndGgsIG1hY05hbWVPZmZzZXQpKTtcblxuICAgICAgICAgICAgdmFyIHdpbkxhbmd1YWdlID0gd2luZG93c0xhbmd1YWdlSWRzW2xhbmddO1xuICAgICAgICAgICAgaWYgKHdpbkxhbmd1YWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgd2luTmFtZSA9IGVuY29kZS5VVEYxNih0ZXh0KTtcbiAgICAgICAgICAgICAgICB2YXIgd2luTmFtZU9mZnNldCA9IGFkZFN0cmluZ1RvUG9vbCh3aW5OYW1lLCBzdHJpbmdQb29sKTtcbiAgICAgICAgICAgICAgICBuYW1lUmVjb3Jkcy5wdXNoKG1ha2VOYW1lUmVjb3JkKDMsIDEsIHdpbkxhbmd1YWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZUlELCB3aW5OYW1lLmxlbmd0aCwgd2luTmFtZU9mZnNldCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmFtZVJlY29yZHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiAoKGEucGxhdGZvcm1JRCAtIGIucGxhdGZvcm1JRCkgfHxcbiAgICAgICAgICAgICAgICAoYS5lbmNvZGluZ0lEIC0gYi5lbmNvZGluZ0lEKSB8fFxuICAgICAgICAgICAgICAgIChhLmxhbmd1YWdlSUQgLSBiLmxhbmd1YWdlSUQpIHx8XG4gICAgICAgICAgICAgICAgKGEubmFtZUlEIC0gYi5uYW1lSUQpKTtcbiAgICB9KTtcblxuICAgIHZhciB0ID0gbmV3IHRhYmxlLlRhYmxlKCduYW1lJywgW1xuICAgICAgICB7bmFtZTogJ2Zvcm1hdCcsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnY291bnQnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IG5hbWVSZWNvcmRzLmxlbmd0aH0sXG4gICAgICAgIHtuYW1lOiAnc3RyaW5nT2Zmc2V0JywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiA2ICsgbmFtZVJlY29yZHMubGVuZ3RoICogMTJ9XG4gICAgXSk7XG5cbiAgICBmb3IgKHZhciByID0gMDsgciA8IG5hbWVSZWNvcmRzLmxlbmd0aDsgcisrKSB7XG4gICAgICAgIHQuZmllbGRzLnB1c2goe25hbWU6ICdyZWNvcmRfJyArIHIsIHR5cGU6ICdSRUNPUkQnLCB2YWx1ZTogbmFtZVJlY29yZHNbcl19KTtcbiAgICB9XG5cbiAgICB0LmZpZWxkcy5wdXNoKHtuYW1lOiAnc3RyaW5ncycsIHR5cGU6ICdMSVRFUkFMJywgdmFsdWU6IHN0cmluZ1Bvb2x9KTtcbiAgICByZXR1cm4gdDtcbn1cblxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlTmFtZVRhYmxlO1xuZXhwb3J0cy5tYWtlID0gbWFrZU5hbWVUYWJsZTtcbiIsIi8vIFRoZSBgT1MvMmAgdGFibGUgY29udGFpbnMgbWV0cmljcyByZXF1aXJlZCBpbiBPcGVuVHlwZSBmb250cy5cbi8vIGh0dHBzOi8vd3d3Lm1pY3Jvc29mdC5jb20vdHlwb2dyYXBoeS9PVFNQRUMvb3MyLmh0bVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4uL3BhcnNlJyk7XG52YXIgdGFibGUgPSByZXF1aXJlKCcuLi90YWJsZScpO1xuXG52YXIgdW5pY29kZVJhbmdlcyA9IFtcbiAgICB7YmVnaW46IDB4MDAwMCwgZW5kOiAweDAwN0Z9LCAvLyBCYXNpYyBMYXRpblxuICAgIHtiZWdpbjogMHgwMDgwLCBlbmQ6IDB4MDBGRn0sIC8vIExhdGluLTEgU3VwcGxlbWVudFxuICAgIHtiZWdpbjogMHgwMTAwLCBlbmQ6IDB4MDE3Rn0sIC8vIExhdGluIEV4dGVuZGVkLUFcbiAgICB7YmVnaW46IDB4MDE4MCwgZW5kOiAweDAyNEZ9LCAvLyBMYXRpbiBFeHRlbmRlZC1CXG4gICAge2JlZ2luOiAweDAyNTAsIGVuZDogMHgwMkFGfSwgLy8gSVBBIEV4dGVuc2lvbnNcbiAgICB7YmVnaW46IDB4MDJCMCwgZW5kOiAweDAyRkZ9LCAvLyBTcGFjaW5nIE1vZGlmaWVyIExldHRlcnNcbiAgICB7YmVnaW46IDB4MDMwMCwgZW5kOiAweDAzNkZ9LCAvLyBDb21iaW5pbmcgRGlhY3JpdGljYWwgTWFya3NcbiAgICB7YmVnaW46IDB4MDM3MCwgZW5kOiAweDAzRkZ9LCAvLyBHcmVlayBhbmQgQ29wdGljXG4gICAge2JlZ2luOiAweDJDODAsIGVuZDogMHgyQ0ZGfSwgLy8gQ29wdGljXG4gICAge2JlZ2luOiAweDA0MDAsIGVuZDogMHgwNEZGfSwgLy8gQ3lyaWxsaWNcbiAgICB7YmVnaW46IDB4MDUzMCwgZW5kOiAweDA1OEZ9LCAvLyBBcm1lbmlhblxuICAgIHtiZWdpbjogMHgwNTkwLCBlbmQ6IDB4MDVGRn0sIC8vIEhlYnJld1xuICAgIHtiZWdpbjogMHhBNTAwLCBlbmQ6IDB4QTYzRn0sIC8vIFZhaVxuICAgIHtiZWdpbjogMHgwNjAwLCBlbmQ6IDB4MDZGRn0sIC8vIEFyYWJpY1xuICAgIHtiZWdpbjogMHgwN0MwLCBlbmQ6IDB4MDdGRn0sIC8vIE5Lb1xuICAgIHtiZWdpbjogMHgwOTAwLCBlbmQ6IDB4MDk3Rn0sIC8vIERldmFuYWdhcmlcbiAgICB7YmVnaW46IDB4MDk4MCwgZW5kOiAweDA5RkZ9LCAvLyBCZW5nYWxpXG4gICAge2JlZ2luOiAweDBBMDAsIGVuZDogMHgwQTdGfSwgLy8gR3VybXVraGlcbiAgICB7YmVnaW46IDB4MEE4MCwgZW5kOiAweDBBRkZ9LCAvLyBHdWphcmF0aVxuICAgIHtiZWdpbjogMHgwQjAwLCBlbmQ6IDB4MEI3Rn0sIC8vIE9yaXlhXG4gICAge2JlZ2luOiAweDBCODAsIGVuZDogMHgwQkZGfSwgLy8gVGFtaWxcbiAgICB7YmVnaW46IDB4MEMwMCwgZW5kOiAweDBDN0Z9LCAvLyBUZWx1Z3VcbiAgICB7YmVnaW46IDB4MEM4MCwgZW5kOiAweDBDRkZ9LCAvLyBLYW5uYWRhXG4gICAge2JlZ2luOiAweDBEMDAsIGVuZDogMHgwRDdGfSwgLy8gTWFsYXlhbGFtXG4gICAge2JlZ2luOiAweDBFMDAsIGVuZDogMHgwRTdGfSwgLy8gVGhhaVxuICAgIHtiZWdpbjogMHgwRTgwLCBlbmQ6IDB4MEVGRn0sIC8vIExhb1xuICAgIHtiZWdpbjogMHgxMEEwLCBlbmQ6IDB4MTBGRn0sIC8vIEdlb3JnaWFuXG4gICAge2JlZ2luOiAweDFCMDAsIGVuZDogMHgxQjdGfSwgLy8gQmFsaW5lc2VcbiAgICB7YmVnaW46IDB4MTEwMCwgZW5kOiAweDExRkZ9LCAvLyBIYW5ndWwgSmFtb1xuICAgIHtiZWdpbjogMHgxRTAwLCBlbmQ6IDB4MUVGRn0sIC8vIExhdGluIEV4dGVuZGVkIEFkZGl0aW9uYWxcbiAgICB7YmVnaW46IDB4MUYwMCwgZW5kOiAweDFGRkZ9LCAvLyBHcmVlayBFeHRlbmRlZFxuICAgIHtiZWdpbjogMHgyMDAwLCBlbmQ6IDB4MjA2Rn0sIC8vIEdlbmVyYWwgUHVuY3R1YXRpb25cbiAgICB7YmVnaW46IDB4MjA3MCwgZW5kOiAweDIwOUZ9LCAvLyBTdXBlcnNjcmlwdHMgQW5kIFN1YnNjcmlwdHNcbiAgICB7YmVnaW46IDB4MjBBMCwgZW5kOiAweDIwQ0Z9LCAvLyBDdXJyZW5jeSBTeW1ib2xcbiAgICB7YmVnaW46IDB4MjBEMCwgZW5kOiAweDIwRkZ9LCAvLyBDb21iaW5pbmcgRGlhY3JpdGljYWwgTWFya3MgRm9yIFN5bWJvbHNcbiAgICB7YmVnaW46IDB4MjEwMCwgZW5kOiAweDIxNEZ9LCAvLyBMZXR0ZXJsaWtlIFN5bWJvbHNcbiAgICB7YmVnaW46IDB4MjE1MCwgZW5kOiAweDIxOEZ9LCAvLyBOdW1iZXIgRm9ybXNcbiAgICB7YmVnaW46IDB4MjE5MCwgZW5kOiAweDIxRkZ9LCAvLyBBcnJvd3NcbiAgICB7YmVnaW46IDB4MjIwMCwgZW5kOiAweDIyRkZ9LCAvLyBNYXRoZW1hdGljYWwgT3BlcmF0b3JzXG4gICAge2JlZ2luOiAweDIzMDAsIGVuZDogMHgyM0ZGfSwgLy8gTWlzY2VsbGFuZW91cyBUZWNobmljYWxcbiAgICB7YmVnaW46IDB4MjQwMCwgZW5kOiAweDI0M0Z9LCAvLyBDb250cm9sIFBpY3R1cmVzXG4gICAge2JlZ2luOiAweDI0NDAsIGVuZDogMHgyNDVGfSwgLy8gT3B0aWNhbCBDaGFyYWN0ZXIgUmVjb2duaXRpb25cbiAgICB7YmVnaW46IDB4MjQ2MCwgZW5kOiAweDI0RkZ9LCAvLyBFbmNsb3NlZCBBbHBoYW51bWVyaWNzXG4gICAge2JlZ2luOiAweDI1MDAsIGVuZDogMHgyNTdGfSwgLy8gQm94IERyYXdpbmdcbiAgICB7YmVnaW46IDB4MjU4MCwgZW5kOiAweDI1OUZ9LCAvLyBCbG9jayBFbGVtZW50c1xuICAgIHtiZWdpbjogMHgyNUEwLCBlbmQ6IDB4MjVGRn0sIC8vIEdlb21ldHJpYyBTaGFwZXNcbiAgICB7YmVnaW46IDB4MjYwMCwgZW5kOiAweDI2RkZ9LCAvLyBNaXNjZWxsYW5lb3VzIFN5bWJvbHNcbiAgICB7YmVnaW46IDB4MjcwMCwgZW5kOiAweDI3QkZ9LCAvLyBEaW5nYmF0c1xuICAgIHtiZWdpbjogMHgzMDAwLCBlbmQ6IDB4MzAzRn0sIC8vIENKSyBTeW1ib2xzIEFuZCBQdW5jdHVhdGlvblxuICAgIHtiZWdpbjogMHgzMDQwLCBlbmQ6IDB4MzA5Rn0sIC8vIEhpcmFnYW5hXG4gICAge2JlZ2luOiAweDMwQTAsIGVuZDogMHgzMEZGfSwgLy8gS2F0YWthbmFcbiAgICB7YmVnaW46IDB4MzEwMCwgZW5kOiAweDMxMkZ9LCAvLyBCb3BvbW9mb1xuICAgIHtiZWdpbjogMHgzMTMwLCBlbmQ6IDB4MzE4Rn0sIC8vIEhhbmd1bCBDb21wYXRpYmlsaXR5IEphbW9cbiAgICB7YmVnaW46IDB4QTg0MCwgZW5kOiAweEE4N0Z9LCAvLyBQaGFncy1wYVxuICAgIHtiZWdpbjogMHgzMjAwLCBlbmQ6IDB4MzJGRn0sIC8vIEVuY2xvc2VkIENKSyBMZXR0ZXJzIEFuZCBNb250aHNcbiAgICB7YmVnaW46IDB4MzMwMCwgZW5kOiAweDMzRkZ9LCAvLyBDSksgQ29tcGF0aWJpbGl0eVxuICAgIHtiZWdpbjogMHhBQzAwLCBlbmQ6IDB4RDdBRn0sIC8vIEhhbmd1bCBTeWxsYWJsZXNcbiAgICB7YmVnaW46IDB4RDgwMCwgZW5kOiAweERGRkZ9LCAvLyBOb24tUGxhbmUgMCAqXG4gICAge2JlZ2luOiAweDEwOTAwLCBlbmQ6IDB4MTA5MUZ9LCAvLyBQaG9lbmljaWFcbiAgICB7YmVnaW46IDB4NEUwMCwgZW5kOiAweDlGRkZ9LCAvLyBDSksgVW5pZmllZCBJZGVvZ3JhcGhzXG4gICAge2JlZ2luOiAweEUwMDAsIGVuZDogMHhGOEZGfSwgLy8gUHJpdmF0ZSBVc2UgQXJlYSAocGxhbmUgMClcbiAgICB7YmVnaW46IDB4MzFDMCwgZW5kOiAweDMxRUZ9LCAvLyBDSksgU3Ryb2tlc1xuICAgIHtiZWdpbjogMHhGQjAwLCBlbmQ6IDB4RkI0Rn0sIC8vIEFscGhhYmV0aWMgUHJlc2VudGF0aW9uIEZvcm1zXG4gICAge2JlZ2luOiAweEZCNTAsIGVuZDogMHhGREZGfSwgLy8gQXJhYmljIFByZXNlbnRhdGlvbiBGb3Jtcy1BXG4gICAge2JlZ2luOiAweEZFMjAsIGVuZDogMHhGRTJGfSwgLy8gQ29tYmluaW5nIEhhbGYgTWFya3NcbiAgICB7YmVnaW46IDB4RkUxMCwgZW5kOiAweEZFMUZ9LCAvLyBWZXJ0aWNhbCBGb3Jtc1xuICAgIHtiZWdpbjogMHhGRTUwLCBlbmQ6IDB4RkU2Rn0sIC8vIFNtYWxsIEZvcm0gVmFyaWFudHNcbiAgICB7YmVnaW46IDB4RkU3MCwgZW5kOiAweEZFRkZ9LCAvLyBBcmFiaWMgUHJlc2VudGF0aW9uIEZvcm1zLUJcbiAgICB7YmVnaW46IDB4RkYwMCwgZW5kOiAweEZGRUZ9LCAvLyBIYWxmd2lkdGggQW5kIEZ1bGx3aWR0aCBGb3Jtc1xuICAgIHtiZWdpbjogMHhGRkYwLCBlbmQ6IDB4RkZGRn0sIC8vIFNwZWNpYWxzXG4gICAge2JlZ2luOiAweDBGMDAsIGVuZDogMHgwRkZGfSwgLy8gVGliZXRhblxuICAgIHtiZWdpbjogMHgwNzAwLCBlbmQ6IDB4MDc0Rn0sIC8vIFN5cmlhY1xuICAgIHtiZWdpbjogMHgwNzgwLCBlbmQ6IDB4MDdCRn0sIC8vIFRoYWFuYVxuICAgIHtiZWdpbjogMHgwRDgwLCBlbmQ6IDB4MERGRn0sIC8vIFNpbmhhbGFcbiAgICB7YmVnaW46IDB4MTAwMCwgZW5kOiAweDEwOUZ9LCAvLyBNeWFubWFyXG4gICAge2JlZ2luOiAweDEyMDAsIGVuZDogMHgxMzdGfSwgLy8gRXRoaW9waWNcbiAgICB7YmVnaW46IDB4MTNBMCwgZW5kOiAweDEzRkZ9LCAvLyBDaGVyb2tlZVxuICAgIHtiZWdpbjogMHgxNDAwLCBlbmQ6IDB4MTY3Rn0sIC8vIFVuaWZpZWQgQ2FuYWRpYW4gQWJvcmlnaW5hbCBTeWxsYWJpY3NcbiAgICB7YmVnaW46IDB4MTY4MCwgZW5kOiAweDE2OUZ9LCAvLyBPZ2hhbVxuICAgIHtiZWdpbjogMHgxNkEwLCBlbmQ6IDB4MTZGRn0sIC8vIFJ1bmljXG4gICAge2JlZ2luOiAweDE3ODAsIGVuZDogMHgxN0ZGfSwgLy8gS2htZXJcbiAgICB7YmVnaW46IDB4MTgwMCwgZW5kOiAweDE4QUZ9LCAvLyBNb25nb2xpYW5cbiAgICB7YmVnaW46IDB4MjgwMCwgZW5kOiAweDI4RkZ9LCAvLyBCcmFpbGxlIFBhdHRlcm5zXG4gICAge2JlZ2luOiAweEEwMDAsIGVuZDogMHhBNDhGfSwgLy8gWWkgU3lsbGFibGVzXG4gICAge2JlZ2luOiAweDE3MDAsIGVuZDogMHgxNzFGfSwgLy8gVGFnYWxvZ1xuICAgIHtiZWdpbjogMHgxMDMwMCwgZW5kOiAweDEwMzJGfSwgLy8gT2xkIEl0YWxpY1xuICAgIHtiZWdpbjogMHgxMDMzMCwgZW5kOiAweDEwMzRGfSwgLy8gR290aGljXG4gICAge2JlZ2luOiAweDEwNDAwLCBlbmQ6IDB4MTA0NEZ9LCAvLyBEZXNlcmV0XG4gICAge2JlZ2luOiAweDFEMDAwLCBlbmQ6IDB4MUQwRkZ9LCAvLyBCeXphbnRpbmUgTXVzaWNhbCBTeW1ib2xzXG4gICAge2JlZ2luOiAweDFENDAwLCBlbmQ6IDB4MUQ3RkZ9LCAvLyBNYXRoZW1hdGljYWwgQWxwaGFudW1lcmljIFN5bWJvbHNcbiAgICB7YmVnaW46IDB4RkYwMDAsIGVuZDogMHhGRkZGRH0sIC8vIFByaXZhdGUgVXNlIChwbGFuZSAxNSlcbiAgICB7YmVnaW46IDB4RkUwMCwgZW5kOiAweEZFMEZ9LCAvLyBWYXJpYXRpb24gU2VsZWN0b3JzXG4gICAge2JlZ2luOiAweEUwMDAwLCBlbmQ6IDB4RTAwN0Z9LCAvLyBUYWdzXG4gICAge2JlZ2luOiAweDE5MDAsIGVuZDogMHgxOTRGfSwgLy8gTGltYnVcbiAgICB7YmVnaW46IDB4MTk1MCwgZW5kOiAweDE5N0Z9LCAvLyBUYWkgTGVcbiAgICB7YmVnaW46IDB4MTk4MCwgZW5kOiAweDE5REZ9LCAvLyBOZXcgVGFpIEx1ZVxuICAgIHtiZWdpbjogMHgxQTAwLCBlbmQ6IDB4MUExRn0sIC8vIEJ1Z2luZXNlXG4gICAge2JlZ2luOiAweDJDMDAsIGVuZDogMHgyQzVGfSwgLy8gR2xhZ29saXRpY1xuICAgIHtiZWdpbjogMHgyRDMwLCBlbmQ6IDB4MkQ3Rn0sIC8vIFRpZmluYWdoXG4gICAge2JlZ2luOiAweDREQzAsIGVuZDogMHg0REZGfSwgLy8gWWlqaW5nIEhleGFncmFtIFN5bWJvbHNcbiAgICB7YmVnaW46IDB4QTgwMCwgZW5kOiAweEE4MkZ9LCAvLyBTeWxvdGkgTmFncmlcbiAgICB7YmVnaW46IDB4MTAwMDAsIGVuZDogMHgxMDA3Rn0sIC8vIExpbmVhciBCIFN5bGxhYmFyeVxuICAgIHtiZWdpbjogMHgxMDE0MCwgZW5kOiAweDEwMThGfSwgLy8gQW5jaWVudCBHcmVlayBOdW1iZXJzXG4gICAge2JlZ2luOiAweDEwMzgwLCBlbmQ6IDB4MTAzOUZ9LCAvLyBVZ2FyaXRpY1xuICAgIHtiZWdpbjogMHgxMDNBMCwgZW5kOiAweDEwM0RGfSwgLy8gT2xkIFBlcnNpYW5cbiAgICB7YmVnaW46IDB4MTA0NTAsIGVuZDogMHgxMDQ3Rn0sIC8vIFNoYXZpYW5cbiAgICB7YmVnaW46IDB4MTA0ODAsIGVuZDogMHgxMDRBRn0sIC8vIE9zbWFueWFcbiAgICB7YmVnaW46IDB4MTA4MDAsIGVuZDogMHgxMDgzRn0sIC8vIEN5cHJpb3QgU3lsbGFiYXJ5XG4gICAge2JlZ2luOiAweDEwQTAwLCBlbmQ6IDB4MTBBNUZ9LCAvLyBLaGFyb3NodGhpXG4gICAge2JlZ2luOiAweDFEMzAwLCBlbmQ6IDB4MUQzNUZ9LCAvLyBUYWkgWHVhbiBKaW5nIFN5bWJvbHNcbiAgICB7YmVnaW46IDB4MTIwMDAsIGVuZDogMHgxMjNGRn0sIC8vIEN1bmVpZm9ybVxuICAgIHtiZWdpbjogMHgxRDM2MCwgZW5kOiAweDFEMzdGfSwgLy8gQ291bnRpbmcgUm9kIE51bWVyYWxzXG4gICAge2JlZ2luOiAweDFCODAsIGVuZDogMHgxQkJGfSwgLy8gU3VuZGFuZXNlXG4gICAge2JlZ2luOiAweDFDMDAsIGVuZDogMHgxQzRGfSwgLy8gTGVwY2hhXG4gICAge2JlZ2luOiAweDFDNTAsIGVuZDogMHgxQzdGfSwgLy8gT2wgQ2hpa2lcbiAgICB7YmVnaW46IDB4QTg4MCwgZW5kOiAweEE4REZ9LCAvLyBTYXVyYXNodHJhXG4gICAge2JlZ2luOiAweEE5MDAsIGVuZDogMHhBOTJGfSwgLy8gS2F5YWggTGlcbiAgICB7YmVnaW46IDB4QTkzMCwgZW5kOiAweEE5NUZ9LCAvLyBSZWphbmdcbiAgICB7YmVnaW46IDB4QUEwMCwgZW5kOiAweEFBNUZ9LCAvLyBDaGFtXG4gICAge2JlZ2luOiAweDEwMTkwLCBlbmQ6IDB4MTAxQ0Z9LCAvLyBBbmNpZW50IFN5bWJvbHNcbiAgICB7YmVnaW46IDB4MTAxRDAsIGVuZDogMHgxMDFGRn0sIC8vIFBoYWlzdG9zIERpc2NcbiAgICB7YmVnaW46IDB4MTAyQTAsIGVuZDogMHgxMDJERn0sIC8vIENhcmlhblxuICAgIHtiZWdpbjogMHgxRjAzMCwgZW5kOiAweDFGMDlGfSAgLy8gRG9taW5vIFRpbGVzXG5dO1xuXG5mdW5jdGlvbiBnZXRVbmljb2RlUmFuZ2UodW5pY29kZSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdW5pY29kZVJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgcmFuZ2UgPSB1bmljb2RlUmFuZ2VzW2ldO1xuICAgICAgICBpZiAodW5pY29kZSA+PSByYW5nZS5iZWdpbiAmJiB1bmljb2RlIDwgcmFuZ2UuZW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gUGFyc2UgdGhlIE9TLzIgYW5kIFdpbmRvd3MgbWV0cmljcyBgT1MvMmAgdGFibGVcbmZ1bmN0aW9uIHBhcnNlT1MyVGFibGUoZGF0YSwgc3RhcnQpIHtcbiAgICB2YXIgb3MyID0ge307XG4gICAgdmFyIHAgPSBuZXcgcGFyc2UuUGFyc2VyKGRhdGEsIHN0YXJ0KTtcbiAgICBvczIudmVyc2lvbiA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICBvczIueEF2Z0NoYXJXaWR0aCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIG9zMi51c1dlaWdodENsYXNzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIG9zMi51c1dpZHRoQ2xhc3MgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgb3MyLmZzVHlwZSA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICBvczIueVN1YnNjcmlwdFhTaXplID0gcC5wYXJzZVNob3J0KCk7XG4gICAgb3MyLnlTdWJzY3JpcHRZU2l6ZSA9IHAucGFyc2VTaG9ydCgpO1xuICAgIG9zMi55U3Vic2NyaXB0WE9mZnNldCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIG9zMi55U3Vic2NyaXB0WU9mZnNldCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIG9zMi55U3VwZXJzY3JpcHRYU2l6ZSA9IHAucGFyc2VTaG9ydCgpO1xuICAgIG9zMi55U3VwZXJzY3JpcHRZU2l6ZSA9IHAucGFyc2VTaG9ydCgpO1xuICAgIG9zMi55U3VwZXJzY3JpcHRYT2Zmc2V0ID0gcC5wYXJzZVNob3J0KCk7XG4gICAgb3MyLnlTdXBlcnNjcmlwdFlPZmZzZXQgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBvczIueVN0cmlrZW91dFNpemUgPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBvczIueVN0cmlrZW91dFBvc2l0aW9uID0gcC5wYXJzZVNob3J0KCk7XG4gICAgb3MyLnNGYW1pbHlDbGFzcyA9IHAucGFyc2VTaG9ydCgpO1xuICAgIG9zMi5wYW5vc2UgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgICAgb3MyLnBhbm9zZVtpXSA9IHAucGFyc2VCeXRlKCk7XG4gICAgfVxuXG4gICAgb3MyLnVsVW5pY29kZVJhbmdlMSA9IHAucGFyc2VVTG9uZygpO1xuICAgIG9zMi51bFVuaWNvZGVSYW5nZTIgPSBwLnBhcnNlVUxvbmcoKTtcbiAgICBvczIudWxVbmljb2RlUmFuZ2UzID0gcC5wYXJzZVVMb25nKCk7XG4gICAgb3MyLnVsVW5pY29kZVJhbmdlNCA9IHAucGFyc2VVTG9uZygpO1xuICAgIG9zMi5hY2hWZW5kSUQgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHAucGFyc2VCeXRlKCksIHAucGFyc2VCeXRlKCksIHAucGFyc2VCeXRlKCksIHAucGFyc2VCeXRlKCkpO1xuICAgIG9zMi5mc1NlbGVjdGlvbiA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICBvczIudXNGaXJzdENoYXJJbmRleCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICBvczIudXNMYXN0Q2hhckluZGV4ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIG9zMi5zVHlwb0FzY2VuZGVyID0gcC5wYXJzZVNob3J0KCk7XG4gICAgb3MyLnNUeXBvRGVzY2VuZGVyID0gcC5wYXJzZVNob3J0KCk7XG4gICAgb3MyLnNUeXBvTGluZUdhcCA9IHAucGFyc2VTaG9ydCgpO1xuICAgIG9zMi51c1dpbkFzY2VudCA9IHAucGFyc2VVU2hvcnQoKTtcbiAgICBvczIudXNXaW5EZXNjZW50ID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgIGlmIChvczIudmVyc2lvbiA+PSAxKSB7XG4gICAgICAgIG9zMi51bENvZGVQYWdlUmFuZ2UxID0gcC5wYXJzZVVMb25nKCk7XG4gICAgICAgIG9zMi51bENvZGVQYWdlUmFuZ2UyID0gcC5wYXJzZVVMb25nKCk7XG4gICAgfVxuXG4gICAgaWYgKG9zMi52ZXJzaW9uID49IDIpIHtcbiAgICAgICAgb3MyLnN4SGVpZ2h0ID0gcC5wYXJzZVNob3J0KCk7XG4gICAgICAgIG9zMi5zQ2FwSGVpZ2h0ID0gcC5wYXJzZVNob3J0KCk7XG4gICAgICAgIG9zMi51c0RlZmF1bHRDaGFyID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICBvczIudXNCcmVha0NoYXIgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgICAgIG9zMi51c01heENvbnRlbnQgPSBwLnBhcnNlVVNob3J0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9zMjtcbn1cblxuZnVuY3Rpb24gbWFrZU9TMlRhYmxlKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IHRhYmxlLlRhYmxlKCdPUy8yJywgW1xuICAgICAgICB7bmFtZTogJ3ZlcnNpb24nLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB4MDAwM30sXG4gICAgICAgIHtuYW1lOiAneEF2Z0NoYXJXaWR0aCcsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICd1c1dlaWdodENsYXNzJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICd1c1dpZHRoQ2xhc3MnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2ZzVHlwZScsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAneVN1YnNjcmlwdFhTaXplJywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDY1MH0sXG4gICAgICAgIHtuYW1lOiAneVN1YnNjcmlwdFlTaXplJywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDY5OX0sXG4gICAgICAgIHtuYW1lOiAneVN1YnNjcmlwdFhPZmZzZXQnLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAneVN1YnNjcmlwdFlPZmZzZXQnLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogMTQwfSxcbiAgICAgICAge25hbWU6ICd5U3VwZXJzY3JpcHRYU2l6ZScsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiA2NTB9LFxuICAgICAgICB7bmFtZTogJ3lTdXBlcnNjcmlwdFlTaXplJywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDY5OX0sXG4gICAgICAgIHtuYW1lOiAneVN1cGVyc2NyaXB0WE9mZnNldCcsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICd5U3VwZXJzY3JpcHRZT2Zmc2V0JywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDQ3OX0sXG4gICAgICAgIHtuYW1lOiAneVN0cmlrZW91dFNpemUnLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogNDl9LFxuICAgICAgICB7bmFtZTogJ3lTdHJpa2VvdXRQb3NpdGlvbicsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAyNTh9LFxuICAgICAgICB7bmFtZTogJ3NGYW1pbHlDbGFzcycsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdiRmFtaWx5VHlwZScsIHR5cGU6ICdCWVRFJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2JTZXJpZlN0eWxlJywgdHlwZTogJ0JZVEUnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnYldlaWdodCcsIHR5cGU6ICdCWVRFJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2JQcm9wb3J0aW9uJywgdHlwZTogJ0JZVEUnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnYkNvbnRyYXN0JywgdHlwZTogJ0JZVEUnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnYlN0cm9rZVZhcmlhdGlvbicsIHR5cGU6ICdCWVRFJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2JBcm1TdHlsZScsIHR5cGU6ICdCWVRFJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ2JMZXR0ZXJmb3JtJywgdHlwZTogJ0JZVEUnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnYk1pZGxpbmUnLCB0eXBlOiAnQllURScsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdiWEhlaWdodCcsIHR5cGU6ICdCWVRFJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3VsVW5pY29kZVJhbmdlMScsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICd1bFVuaWNvZGVSYW5nZTInLCB0eXBlOiAnVUxPTkcnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAndWxVbmljb2RlUmFuZ2UzJywgdHlwZTogJ1VMT05HJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3VsVW5pY29kZVJhbmdlNCcsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdhY2hWZW5kSUQnLCB0eXBlOiAnQ0hBUkFSUkFZJywgdmFsdWU6ICdYWFhYJ30sXG4gICAgICAgIHtuYW1lOiAnZnNTZWxlY3Rpb24nLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3VzRmlyc3RDaGFySW5kZXgnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3VzTGFzdENoYXJJbmRleCcsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnc1R5cG9Bc2NlbmRlcicsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdzVHlwb0Rlc2NlbmRlcicsIHR5cGU6ICdTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdzVHlwb0xpbmVHYXAnLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAndXNXaW5Bc2NlbnQnLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3VzV2luRGVzY2VudCcsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAndWxDb2RlUGFnZVJhbmdlMScsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICd1bENvZGVQYWdlUmFuZ2UyJywgdHlwZTogJ1VMT05HJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3N4SGVpZ2h0JywgdHlwZTogJ1NIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3NDYXBIZWlnaHQnLCB0eXBlOiAnU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAndXNEZWZhdWx0Q2hhcicsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAndXNCcmVha0NoYXInLCB0eXBlOiAnVVNIT1JUJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3VzTWF4Q29udGV4dCcsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH1cbiAgICBdLCBvcHRpb25zKTtcbn1cblxuZXhwb3J0cy51bmljb2RlUmFuZ2VzID0gdW5pY29kZVJhbmdlcztcbmV4cG9ydHMuZ2V0VW5pY29kZVJhbmdlID0gZ2V0VW5pY29kZVJhbmdlO1xuZXhwb3J0cy5wYXJzZSA9IHBhcnNlT1MyVGFibGU7XG5leHBvcnRzLm1ha2UgPSBtYWtlT1MyVGFibGU7XG4iLCIvLyBUaGUgYHBvc3RgIHRhYmxlIHN0b3JlcyBhZGRpdGlvbmFsIFBvc3RTY3JpcHQgaW5mb3JtYXRpb24sIHN1Y2ggYXMgZ2x5cGggbmFtZXMuXG4vLyBodHRwczovL3d3dy5taWNyb3NvZnQuY29tL3R5cG9ncmFwaHkvT1RTUEVDL3Bvc3QuaHRtXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGVuY29kaW5nID0gcmVxdWlyZSgnLi4vZW5jb2RpbmcnKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4uL3BhcnNlJyk7XG52YXIgdGFibGUgPSByZXF1aXJlKCcuLi90YWJsZScpO1xuXG4vLyBQYXJzZSB0aGUgUG9zdFNjcmlwdCBgcG9zdGAgdGFibGVcbmZ1bmN0aW9uIHBhcnNlUG9zdFRhYmxlKGRhdGEsIHN0YXJ0KSB7XG4gICAgdmFyIHBvc3QgPSB7fTtcbiAgICB2YXIgcCA9IG5ldyBwYXJzZS5QYXJzZXIoZGF0YSwgc3RhcnQpO1xuICAgIHZhciBpO1xuICAgIHBvc3QudmVyc2lvbiA9IHAucGFyc2VWZXJzaW9uKCk7XG4gICAgcG9zdC5pdGFsaWNBbmdsZSA9IHAucGFyc2VGaXhlZCgpO1xuICAgIHBvc3QudW5kZXJsaW5lUG9zaXRpb24gPSBwLnBhcnNlU2hvcnQoKTtcbiAgICBwb3N0LnVuZGVybGluZVRoaWNrbmVzcyA9IHAucGFyc2VTaG9ydCgpO1xuICAgIHBvc3QuaXNGaXhlZFBpdGNoID0gcC5wYXJzZVVMb25nKCk7XG4gICAgcG9zdC5taW5NZW1UeXBlNDIgPSBwLnBhcnNlVUxvbmcoKTtcbiAgICBwb3N0Lm1heE1lbVR5cGU0MiA9IHAucGFyc2VVTG9uZygpO1xuICAgIHBvc3QubWluTWVtVHlwZTEgPSBwLnBhcnNlVUxvbmcoKTtcbiAgICBwb3N0Lm1heE1lbVR5cGUxID0gcC5wYXJzZVVMb25nKCk7XG4gICAgc3dpdGNoIChwb3N0LnZlcnNpb24pIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcG9zdC5uYW1lcyA9IGVuY29kaW5nLnN0YW5kYXJkTmFtZXMuc2xpY2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBwb3N0Lm51bWJlck9mR2x5cGhzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICAgICAgcG9zdC5nbHlwaE5hbWVJbmRleCA9IG5ldyBBcnJheShwb3N0Lm51bWJlck9mR2x5cGhzKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBwb3N0Lm51bWJlck9mR2x5cGhzOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwb3N0LmdseXBoTmFtZUluZGV4W2ldID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb3N0Lm5hbWVzID0gW107XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcG9zdC5udW1iZXJPZkdseXBoczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBvc3QuZ2x5cGhOYW1lSW5kZXhbaV0gPj0gZW5jb2Rpbmcuc3RhbmRhcmROYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVMZW5ndGggPSBwLnBhcnNlQ2hhcigpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0Lm5hbWVzLnB1c2gocC5wYXJzZVN0cmluZyhuYW1lTGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyLjU6XG4gICAgICAgICAgICBwb3N0Lm51bWJlck9mR2x5cGhzID0gcC5wYXJzZVVTaG9ydCgpO1xuICAgICAgICAgICAgcG9zdC5vZmZzZXQgPSBuZXcgQXJyYXkocG9zdC5udW1iZXJPZkdseXBocyk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcG9zdC5udW1iZXJPZkdseXBoczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcG9zdC5vZmZzZXRbaV0gPSBwLnBhcnNlQ2hhcigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHBvc3Q7XG59XG5cbmZ1bmN0aW9uIG1ha2VQb3N0VGFibGUoKSB7XG4gICAgcmV0dXJuIG5ldyB0YWJsZS5UYWJsZSgncG9zdCcsIFtcbiAgICAgICAge25hbWU6ICd2ZXJzaW9uJywgdHlwZTogJ0ZJWEVEJywgdmFsdWU6IDB4MDAwMzAwMDB9LFxuICAgICAgICB7bmFtZTogJ2l0YWxpY0FuZ2xlJywgdHlwZTogJ0ZJWEVEJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3VuZGVybGluZVBvc2l0aW9uJywgdHlwZTogJ0ZXT1JEJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ3VuZGVybGluZVRoaWNrbmVzcycsIHR5cGU6ICdGV09SRCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdpc0ZpeGVkUGl0Y2gnLCB0eXBlOiAnVUxPTkcnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnbWluTWVtVHlwZTQyJywgdHlwZTogJ1VMT05HJywgdmFsdWU6IDB9LFxuICAgICAgICB7bmFtZTogJ21heE1lbVR5cGU0MicsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdtaW5NZW1UeXBlMScsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdtYXhNZW1UeXBlMScsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiAwfVxuICAgIF0pO1xufVxuXG5leHBvcnRzLnBhcnNlID0gcGFyc2VQb3N0VGFibGU7XG5leHBvcnRzLm1ha2UgPSBtYWtlUG9zdFRhYmxlO1xuIiwiLy8gVGhlIGBzZm50YCB3cmFwcGVyIHByb3ZpZGVzIG9yZ2FuaXphdGlvbiBmb3IgdGhlIHRhYmxlcyBpbiB0aGUgZm9udC5cbi8vIEl0IGlzIHRoZSB0b3AtbGV2ZWwgZGF0YSBzdHJ1Y3R1cmUgaW4gYSBmb250LlxuLy8gaHR0cHM6Ly93d3cubWljcm9zb2Z0LmNvbS90eXBvZ3JhcGh5L09UU1BFQy9vdGZmLmh0bVxuLy8gUmVjb21tZW5kYXRpb25zIGZvciBjcmVhdGluZyBPcGVuVHlwZSBGb250czpcbi8vIGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS90eXBvZ3JhcGh5L290c3BlYzE0MC9yZWNvbS5odG1cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2hlY2sgPSByZXF1aXJlKCcuLi9jaGVjaycpO1xudmFyIHRhYmxlID0gcmVxdWlyZSgnLi4vdGFibGUnKTtcblxudmFyIGNtYXAgPSByZXF1aXJlKCcuL2NtYXAnKTtcbnZhciBjZmYgPSByZXF1aXJlKCcuL2NmZicpO1xudmFyIGhlYWQgPSByZXF1aXJlKCcuL2hlYWQnKTtcbnZhciBoaGVhID0gcmVxdWlyZSgnLi9oaGVhJyk7XG52YXIgaG10eCA9IHJlcXVpcmUoJy4vaG10eCcpO1xudmFyIGx0YWcgPSByZXF1aXJlKCcuL2x0YWcnKTtcbnZhciBtYXhwID0gcmVxdWlyZSgnLi9tYXhwJyk7XG52YXIgX25hbWUgPSByZXF1aXJlKCcuL25hbWUnKTtcbnZhciBvczIgPSByZXF1aXJlKCcuL29zMicpO1xudmFyIHBvc3QgPSByZXF1aXJlKCcuL3Bvc3QnKTtcblxuZnVuY3Rpb24gbG9nMih2KSB7XG4gICAgcmV0dXJuIE1hdGgubG9nKHYpIC8gTWF0aC5sb2coMikgfCAwO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlQ2hlY2tTdW0oYnl0ZXMpIHtcbiAgICB3aGlsZSAoYnl0ZXMubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgICAgICBieXRlcy5wdXNoKDApO1xuICAgIH1cblxuICAgIHZhciBzdW0gPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgICAgc3VtICs9IChieXRlc1tpXSA8PCAyNCkgK1xuICAgICAgICAgICAgKGJ5dGVzW2kgKyAxXSA8PCAxNikgK1xuICAgICAgICAgICAgKGJ5dGVzW2kgKyAyXSA8PCA4KSArXG4gICAgICAgICAgICAoYnl0ZXNbaSArIDNdKTtcbiAgICB9XG5cbiAgICBzdW0gJT0gTWF0aC5wb3coMiwgMzIpO1xuICAgIHJldHVybiBzdW07XG59XG5cbmZ1bmN0aW9uIG1ha2VUYWJsZVJlY29yZCh0YWcsIGNoZWNrU3VtLCBvZmZzZXQsIGxlbmd0aCkge1xuICAgIHJldHVybiBuZXcgdGFibGUuUmVjb3JkKCdUYWJsZSBSZWNvcmQnLCBbXG4gICAgICAgIHtuYW1lOiAndGFnJywgdHlwZTogJ1RBRycsIHZhbHVlOiB0YWcgIT09IHVuZGVmaW5lZCA/IHRhZyA6ICcnfSxcbiAgICAgICAge25hbWU6ICdjaGVja1N1bScsIHR5cGU6ICdVTE9ORycsIHZhbHVlOiBjaGVja1N1bSAhPT0gdW5kZWZpbmVkID8gY2hlY2tTdW0gOiAwfSxcbiAgICAgICAge25hbWU6ICdvZmZzZXQnLCB0eXBlOiAnVUxPTkcnLCB2YWx1ZTogb2Zmc2V0ICE9PSB1bmRlZmluZWQgPyBvZmZzZXQgOiAwfSxcbiAgICAgICAge25hbWU6ICdsZW5ndGgnLCB0eXBlOiAnVUxPTkcnLCB2YWx1ZTogbGVuZ3RoICE9PSB1bmRlZmluZWQgPyBsZW5ndGggOiAwfVxuICAgIF0pO1xufVxuXG5mdW5jdGlvbiBtYWtlU2ZudFRhYmxlKHRhYmxlcykge1xuICAgIHZhciBzZm50ID0gbmV3IHRhYmxlLlRhYmxlKCdzZm50JywgW1xuICAgICAgICB7bmFtZTogJ3ZlcnNpb24nLCB0eXBlOiAnVEFHJywgdmFsdWU6ICdPVFRPJ30sXG4gICAgICAgIHtuYW1lOiAnbnVtVGFibGVzJywgdHlwZTogJ1VTSE9SVCcsIHZhbHVlOiAwfSxcbiAgICAgICAge25hbWU6ICdzZWFyY2hSYW5nZScsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAnZW50cnlTZWxlY3RvcicsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH0sXG4gICAgICAgIHtuYW1lOiAncmFuZ2VTaGlmdCcsIHR5cGU6ICdVU0hPUlQnLCB2YWx1ZTogMH1cbiAgICBdKTtcbiAgICBzZm50LnRhYmxlcyA9IHRhYmxlcztcbiAgICBzZm50Lm51bVRhYmxlcyA9IHRhYmxlcy5sZW5ndGg7XG4gICAgdmFyIGhpZ2hlc3RQb3dlck9mMiA9IE1hdGgucG93KDIsIGxvZzIoc2ZudC5udW1UYWJsZXMpKTtcbiAgICBzZm50LnNlYXJjaFJhbmdlID0gMTYgKiBoaWdoZXN0UG93ZXJPZjI7XG4gICAgc2ZudC5lbnRyeVNlbGVjdG9yID0gbG9nMihoaWdoZXN0UG93ZXJPZjIpO1xuICAgIHNmbnQucmFuZ2VTaGlmdCA9IHNmbnQubnVtVGFibGVzICogMTYgLSBzZm50LnNlYXJjaFJhbmdlO1xuXG4gICAgdmFyIHJlY29yZEZpZWxkcyA9IFtdO1xuICAgIHZhciB0YWJsZUZpZWxkcyA9IFtdO1xuXG4gICAgdmFyIG9mZnNldCA9IHNmbnQuc2l6ZU9mKCkgKyAobWFrZVRhYmxlUmVjb3JkKCkuc2l6ZU9mKCkgKiBzZm50Lm51bVRhYmxlcyk7XG4gICAgd2hpbGUgKG9mZnNldCAlIDQgIT09IDApIHtcbiAgICAgICAgb2Zmc2V0ICs9IDE7XG4gICAgICAgIHRhYmxlRmllbGRzLnB1c2goe25hbWU6ICdwYWRkaW5nJywgdHlwZTogJ0JZVEUnLCB2YWx1ZTogMH0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFibGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciB0ID0gdGFibGVzW2ldO1xuICAgICAgICBjaGVjay5hcmd1bWVudCh0LnRhYmxlTmFtZS5sZW5ndGggPT09IDQsICdUYWJsZSBuYW1lJyArIHQudGFibGVOYW1lICsgJyBpcyBpbnZhbGlkLicpO1xuICAgICAgICB2YXIgdGFibGVMZW5ndGggPSB0LnNpemVPZigpO1xuICAgICAgICB2YXIgdGFibGVSZWNvcmQgPSBtYWtlVGFibGVSZWNvcmQodC50YWJsZU5hbWUsIGNvbXB1dGVDaGVja1N1bSh0LmVuY29kZSgpKSwgb2Zmc2V0LCB0YWJsZUxlbmd0aCk7XG4gICAgICAgIHJlY29yZEZpZWxkcy5wdXNoKHtuYW1lOiB0YWJsZVJlY29yZC50YWcgKyAnIFRhYmxlIFJlY29yZCcsIHR5cGU6ICdSRUNPUkQnLCB2YWx1ZTogdGFibGVSZWNvcmR9KTtcbiAgICAgICAgdGFibGVGaWVsZHMucHVzaCh7bmFtZTogdC50YWJsZU5hbWUgKyAnIHRhYmxlJywgdHlwZTogJ1JFQ09SRCcsIHZhbHVlOiB0fSk7XG4gICAgICAgIG9mZnNldCArPSB0YWJsZUxlbmd0aDtcbiAgICAgICAgY2hlY2suYXJndW1lbnQoIWlzTmFOKG9mZnNldCksICdTb21ldGhpbmcgd2VudCB3cm9uZyBjYWxjdWxhdGluZyB0aGUgb2Zmc2V0LicpO1xuICAgICAgICB3aGlsZSAob2Zmc2V0ICUgNCAhPT0gMCkge1xuICAgICAgICAgICAgb2Zmc2V0ICs9IDE7XG4gICAgICAgICAgICB0YWJsZUZpZWxkcy5wdXNoKHtuYW1lOiAncGFkZGluZycsIHR5cGU6ICdCWVRFJywgdmFsdWU6IDB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRhYmxlIHJlY29yZHMgbmVlZCB0byBiZSBzb3J0ZWQgYWxwaGFiZXRpY2FsbHkuXG4gICAgcmVjb3JkRmllbGRzLnNvcnQoZnVuY3Rpb24ocjEsIHIyKSB7XG4gICAgICAgIGlmIChyMS52YWx1ZS50YWcgPiByMi52YWx1ZS50YWcpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBzZm50LmZpZWxkcyA9IHNmbnQuZmllbGRzLmNvbmNhdChyZWNvcmRGaWVsZHMpO1xuICAgIHNmbnQuZmllbGRzID0gc2ZudC5maWVsZHMuY29uY2F0KHRhYmxlRmllbGRzKTtcbiAgICByZXR1cm4gc2ZudDtcbn1cblxuLy8gR2V0IHRoZSBtZXRyaWNzIGZvciBhIGNoYXJhY3Rlci4gSWYgdGhlIHN0cmluZyBoYXMgbW9yZSB0aGFuIG9uZSBjaGFyYWN0ZXJcbi8vIHRoaXMgZnVuY3Rpb24gcmV0dXJucyBtZXRyaWNzIGZvciB0aGUgZmlyc3QgYXZhaWxhYmxlIGNoYXJhY3Rlci5cbi8vIFlvdSBjYW4gcHJvdmlkZSBvcHRpb25hbCBmYWxsYmFjayBtZXRyaWNzIGlmIG5vIGNoYXJhY3RlcnMgYXJlIGF2YWlsYWJsZS5cbmZ1bmN0aW9uIG1ldHJpY3NGb3JDaGFyKGZvbnQsIGNoYXJzLCBub3RGb3VuZE1ldHJpY3MpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBnbHlwaEluZGV4ID0gZm9udC5jaGFyVG9HbHlwaEluZGV4KGNoYXJzW2ldKTtcbiAgICAgICAgaWYgKGdseXBoSW5kZXggPiAwKSB7XG4gICAgICAgICAgICB2YXIgZ2x5cGggPSBmb250LmdseXBocy5nZXQoZ2x5cGhJbmRleCk7XG4gICAgICAgICAgICByZXR1cm4gZ2x5cGguZ2V0TWV0cmljcygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vdEZvdW5kTWV0cmljcztcbn1cblxuZnVuY3Rpb24gYXZlcmFnZSh2cykge1xuICAgIHZhciBzdW0gPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3VtICs9IHZzW2ldO1xuICAgIH1cblxuICAgIHJldHVybiBzdW0gLyB2cy5sZW5ndGg7XG59XG5cbi8vIENvbnZlcnQgdGhlIGZvbnQgb2JqZWN0IHRvIGEgU0ZOVCBkYXRhIHN0cnVjdHVyZS5cbi8vIFRoaXMgc3RydWN0dXJlIGNvbnRhaW5zIGFsbCB0aGUgbmVjZXNzYXJ5IHRhYmxlcyBhbmQgbWV0YWRhdGEgdG8gY3JlYXRlIGEgYmluYXJ5IE9URiBmaWxlLlxuZnVuY3Rpb24gZm9udFRvU2ZudFRhYmxlKGZvbnQpIHtcbiAgICB2YXIgeE1pbnMgPSBbXTtcbiAgICB2YXIgeU1pbnMgPSBbXTtcbiAgICB2YXIgeE1heHMgPSBbXTtcbiAgICB2YXIgeU1heHMgPSBbXTtcbiAgICB2YXIgYWR2YW5jZVdpZHRocyA9IFtdO1xuICAgIHZhciBsZWZ0U2lkZUJlYXJpbmdzID0gW107XG4gICAgdmFyIHJpZ2h0U2lkZUJlYXJpbmdzID0gW107XG4gICAgdmFyIGZpcnN0Q2hhckluZGV4O1xuICAgIHZhciBsYXN0Q2hhckluZGV4ID0gMDtcbiAgICB2YXIgdWxVbmljb2RlUmFuZ2UxID0gMDtcbiAgICB2YXIgdWxVbmljb2RlUmFuZ2UyID0gMDtcbiAgICB2YXIgdWxVbmljb2RlUmFuZ2UzID0gMDtcbiAgICB2YXIgdWxVbmljb2RlUmFuZ2U0ID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZm9udC5nbHlwaHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGdseXBoID0gZm9udC5nbHlwaHMuZ2V0KGkpO1xuICAgICAgICB2YXIgdW5pY29kZSA9IGdseXBoLnVuaWNvZGUgfCAwO1xuXG4gICAgICAgIGlmICh0eXBlb2YgZ2x5cGguYWR2YW5jZVdpZHRoID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHbHlwaCAnICsgZ2x5cGgubmFtZSArICcgKCcgKyBpICsgJyk6IGFkdmFuY2VXaWR0aCBpcyByZXF1aXJlZC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaXJzdENoYXJJbmRleCA+IHVuaWNvZGUgfHwgZmlyc3RDaGFySW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgIGZpcnN0Q2hhckluZGV4ID0gdW5pY29kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsYXN0Q2hhckluZGV4IDwgdW5pY29kZSkge1xuICAgICAgICAgICAgbGFzdENoYXJJbmRleCA9IHVuaWNvZGU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcG9zaXRpb24gPSBvczIuZ2V0VW5pY29kZVJhbmdlKHVuaWNvZGUpO1xuICAgICAgICBpZiAocG9zaXRpb24gPCAzMikge1xuICAgICAgICAgICAgdWxVbmljb2RlUmFuZ2UxIHw9IDEgPDwgcG9zaXRpb247XG4gICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPCA2NCkge1xuICAgICAgICAgICAgdWxVbmljb2RlUmFuZ2UyIHw9IDEgPDwgcG9zaXRpb24gLSAzMjtcbiAgICAgICAgfSBlbHNlIGlmIChwb3NpdGlvbiA8IDk2KSB7XG4gICAgICAgICAgICB1bFVuaWNvZGVSYW5nZTMgfD0gMSA8PCBwb3NpdGlvbiAtIDY0O1xuICAgICAgICB9IGVsc2UgaWYgKHBvc2l0aW9uIDwgMTIzKSB7XG4gICAgICAgICAgICB1bFVuaWNvZGVSYW5nZTQgfD0gMSA8PCBwb3NpdGlvbiAtIDk2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmljb2RlIHJhbmdlcyBiaXRzID4gMTIzIGFyZSByZXNlcnZlZCBmb3IgaW50ZXJuYWwgdXNhZ2UnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBTa2lwIG5vbi1pbXBvcnRhbnQgY2hhcmFjdGVycy5cbiAgICAgICAgaWYgKGdseXBoLm5hbWUgPT09ICcubm90ZGVmJykgY29udGludWU7XG4gICAgICAgIHZhciBtZXRyaWNzID0gZ2x5cGguZ2V0TWV0cmljcygpO1xuICAgICAgICB4TWlucy5wdXNoKG1ldHJpY3MueE1pbik7XG4gICAgICAgIHlNaW5zLnB1c2gobWV0cmljcy55TWluKTtcbiAgICAgICAgeE1heHMucHVzaChtZXRyaWNzLnhNYXgpO1xuICAgICAgICB5TWF4cy5wdXNoKG1ldHJpY3MueU1heCk7XG4gICAgICAgIGxlZnRTaWRlQmVhcmluZ3MucHVzaChtZXRyaWNzLmxlZnRTaWRlQmVhcmluZyk7XG4gICAgICAgIHJpZ2h0U2lkZUJlYXJpbmdzLnB1c2gobWV0cmljcy5yaWdodFNpZGVCZWFyaW5nKTtcbiAgICAgICAgYWR2YW5jZVdpZHRocy5wdXNoKGdseXBoLmFkdmFuY2VXaWR0aCk7XG4gICAgfVxuXG4gICAgdmFyIGdsb2JhbHMgPSB7XG4gICAgICAgIHhNaW46IE1hdGgubWluLmFwcGx5KG51bGwsIHhNaW5zKSxcbiAgICAgICAgeU1pbjogTWF0aC5taW4uYXBwbHkobnVsbCwgeU1pbnMpLFxuICAgICAgICB4TWF4OiBNYXRoLm1heC5hcHBseShudWxsLCB4TWF4cyksXG4gICAgICAgIHlNYXg6IE1hdGgubWF4LmFwcGx5KG51bGwsIHlNYXhzKSxcbiAgICAgICAgYWR2YW5jZVdpZHRoTWF4OiBNYXRoLm1heC5hcHBseShudWxsLCBhZHZhbmNlV2lkdGhzKSxcbiAgICAgICAgYWR2YW5jZVdpZHRoQXZnOiBhdmVyYWdlKGFkdmFuY2VXaWR0aHMpLFxuICAgICAgICBtaW5MZWZ0U2lkZUJlYXJpbmc6IE1hdGgubWluLmFwcGx5KG51bGwsIGxlZnRTaWRlQmVhcmluZ3MpLFxuICAgICAgICBtYXhMZWZ0U2lkZUJlYXJpbmc6IE1hdGgubWF4LmFwcGx5KG51bGwsIGxlZnRTaWRlQmVhcmluZ3MpLFxuICAgICAgICBtaW5SaWdodFNpZGVCZWFyaW5nOiBNYXRoLm1pbi5hcHBseShudWxsLCByaWdodFNpZGVCZWFyaW5ncylcbiAgICB9O1xuICAgIGdsb2JhbHMuYXNjZW5kZXIgPSBmb250LmFzY2VuZGVyO1xuICAgIGdsb2JhbHMuZGVzY2VuZGVyID0gZm9udC5kZXNjZW5kZXI7XG5cbiAgICB2YXIgaGVhZFRhYmxlID0gaGVhZC5tYWtlKHtcbiAgICAgICAgZmxhZ3M6IDMsIC8vIDAwMDAwMDExIChiYXNlbGluZSBmb3IgZm9udCBhdCB5PTA7IGxlZnQgc2lkZWJlYXJpbmcgcG9pbnQgYXQgeD0wKVxuICAgICAgICB1bml0c1BlckVtOiBmb250LnVuaXRzUGVyRW0sXG4gICAgICAgIHhNaW46IGdsb2JhbHMueE1pbixcbiAgICAgICAgeU1pbjogZ2xvYmFscy55TWluLFxuICAgICAgICB4TWF4OiBnbG9iYWxzLnhNYXgsXG4gICAgICAgIHlNYXg6IGdsb2JhbHMueU1heCxcbiAgICAgICAgbG93ZXN0UmVjUFBFTTogM1xuICAgIH0pO1xuXG4gICAgdmFyIGhoZWFUYWJsZSA9IGhoZWEubWFrZSh7XG4gICAgICAgIGFzY2VuZGVyOiBnbG9iYWxzLmFzY2VuZGVyLFxuICAgICAgICBkZXNjZW5kZXI6IGdsb2JhbHMuZGVzY2VuZGVyLFxuICAgICAgICBhZHZhbmNlV2lkdGhNYXg6IGdsb2JhbHMuYWR2YW5jZVdpZHRoTWF4LFxuICAgICAgICBtaW5MZWZ0U2lkZUJlYXJpbmc6IGdsb2JhbHMubWluTGVmdFNpZGVCZWFyaW5nLFxuICAgICAgICBtaW5SaWdodFNpZGVCZWFyaW5nOiBnbG9iYWxzLm1pblJpZ2h0U2lkZUJlYXJpbmcsXG4gICAgICAgIHhNYXhFeHRlbnQ6IGdsb2JhbHMubWF4TGVmdFNpZGVCZWFyaW5nICsgKGdsb2JhbHMueE1heCAtIGdsb2JhbHMueE1pbiksXG4gICAgICAgIG51bWJlck9mSE1ldHJpY3M6IGZvbnQuZ2x5cGhzLmxlbmd0aFxuICAgIH0pO1xuXG4gICAgdmFyIG1heHBUYWJsZSA9IG1heHAubWFrZShmb250LmdseXBocy5sZW5ndGgpO1xuXG4gICAgdmFyIG9zMlRhYmxlID0gb3MyLm1ha2Uoe1xuICAgICAgICB4QXZnQ2hhcldpZHRoOiBNYXRoLnJvdW5kKGdsb2JhbHMuYWR2YW5jZVdpZHRoQXZnKSxcbiAgICAgICAgdXNXZWlnaHRDbGFzczogNTAwLCAvLyBNZWRpdW0gRklYTUUgTWFrZSB0aGlzIGNvbmZpZ3VyYWJsZVxuICAgICAgICB1c1dpZHRoQ2xhc3M6IDUsIC8vIE1lZGl1bSAobm9ybWFsKSBGSVhNRSBNYWtlIHRoaXMgY29uZmlndXJhYmxlXG4gICAgICAgIHVzRmlyc3RDaGFySW5kZXg6IGZpcnN0Q2hhckluZGV4LFxuICAgICAgICB1c0xhc3RDaGFySW5kZXg6IGxhc3RDaGFySW5kZXgsXG4gICAgICAgIHVsVW5pY29kZVJhbmdlMTogdWxVbmljb2RlUmFuZ2UxLFxuICAgICAgICB1bFVuaWNvZGVSYW5nZTI6IHVsVW5pY29kZVJhbmdlMixcbiAgICAgICAgdWxVbmljb2RlUmFuZ2UzOiB1bFVuaWNvZGVSYW5nZTMsXG4gICAgICAgIHVsVW5pY29kZVJhbmdlNDogdWxVbmljb2RlUmFuZ2U0LFxuICAgICAgICBmc1NlbGVjdGlvbjogNjQsIC8vIFJFR1VMQVJcbiAgICAgICAgLy8gU2VlIGh0dHA6Ly90eXBvcGhpbGUuY29tL25vZGUvMTMwODEgZm9yIG1vcmUgaW5mbyBvbiB2ZXJ0aWNhbCBtZXRyaWNzLlxuICAgICAgICAvLyBXZSBnZXQgbWV0cmljcyBmb3IgdHlwaWNhbCBjaGFyYWN0ZXJzIChzdWNoIGFzIFwieFwiIGZvciB4SGVpZ2h0KS5cbiAgICAgICAgLy8gV2UgcHJvdmlkZSBzb21lIGZhbGxiYWNrIGNoYXJhY3RlcnMgaWYgY2hhcmFjdGVycyBhcmUgdW5hdmFpbGFibGU6IHRoZWlyXG4gICAgICAgIC8vIG9yZGVyaW5nIHdhcyBjaG9zZW4gZXhwZXJpbWVudGFsbHkuXG4gICAgICAgIHNUeXBvQXNjZW5kZXI6IGdsb2JhbHMuYXNjZW5kZXIsXG4gICAgICAgIHNUeXBvRGVzY2VuZGVyOiBnbG9iYWxzLmRlc2NlbmRlcixcbiAgICAgICAgc1R5cG9MaW5lR2FwOiAwLFxuICAgICAgICB1c1dpbkFzY2VudDogZ2xvYmFscy55TWF4LFxuICAgICAgICB1c1dpbkRlc2NlbnQ6IE1hdGguYWJzKGdsb2JhbHMueU1pbiksXG4gICAgICAgIHVsQ29kZVBhZ2VSYW5nZTE6IDEsIC8vIEZJWE1FOiBoYXJkLWNvZGUgTGF0aW4gMSBzdXBwb3J0IGZvciBub3dcbiAgICAgICAgc3hIZWlnaHQ6IG1ldHJpY3NGb3JDaGFyKGZvbnQsICd4eXZ3Jywge3lNYXg6IE1hdGgucm91bmQoZ2xvYmFscy5hc2NlbmRlciAvIDIpfSkueU1heCxcbiAgICAgICAgc0NhcEhlaWdodDogbWV0cmljc0ZvckNoYXIoZm9udCwgJ0hJS0xFRkpNTlRaQkRQUkFHT1FTVVZXWFknLCBnbG9iYWxzKS55TWF4LFxuICAgICAgICB1c0RlZmF1bHRDaGFyOiBmb250Lmhhc0NoYXIoJyAnKSA/IDMyIDogMCwgLy8gVXNlIHNwYWNlIGFzIHRoZSBkZWZhdWx0IGNoYXJhY3RlciwgaWYgYXZhaWxhYmxlLlxuICAgICAgICB1c0JyZWFrQ2hhcjogZm9udC5oYXNDaGFyKCcgJykgPyAzMiA6IDAgLy8gVXNlIHNwYWNlIGFzIHRoZSBicmVhayBjaGFyYWN0ZXIsIGlmIGF2YWlsYWJsZS5cbiAgICB9KTtcblxuICAgIHZhciBobXR4VGFibGUgPSBobXR4Lm1ha2UoZm9udC5nbHlwaHMpO1xuICAgIHZhciBjbWFwVGFibGUgPSBjbWFwLm1ha2UoZm9udC5nbHlwaHMpO1xuXG4gICAgdmFyIGVuZ2xpc2hGYW1pbHlOYW1lID0gZm9udC5nZXRFbmdsaXNoTmFtZSgnZm9udEZhbWlseScpO1xuICAgIHZhciBlbmdsaXNoU3R5bGVOYW1lID0gZm9udC5nZXRFbmdsaXNoTmFtZSgnZm9udFN1YmZhbWlseScpO1xuICAgIHZhciBlbmdsaXNoRnVsbE5hbWUgPSBlbmdsaXNoRmFtaWx5TmFtZSArICcgJyArIGVuZ2xpc2hTdHlsZU5hbWU7XG4gICAgdmFyIHBvc3RTY3JpcHROYW1lID0gZm9udC5nZXRFbmdsaXNoTmFtZSgncG9zdFNjcmlwdE5hbWUnKTtcbiAgICBpZiAoIXBvc3RTY3JpcHROYW1lKSB7XG4gICAgICAgIHBvc3RTY3JpcHROYW1lID0gZW5nbGlzaEZhbWlseU5hbWUucmVwbGFjZSgvXFxzL2csICcnKSArICctJyArIGVuZ2xpc2hTdHlsZU5hbWU7XG4gICAgfVxuXG4gICAgdmFyIG5hbWVzID0ge307XG4gICAgZm9yICh2YXIgbiBpbiBmb250Lm5hbWVzKSB7XG4gICAgICAgIG5hbWVzW25dID0gZm9udC5uYW1lc1tuXTtcbiAgICB9XG5cbiAgICBpZiAoIW5hbWVzLnVuaXF1ZUlEKSB7XG4gICAgICAgIG5hbWVzLnVuaXF1ZUlEID0ge2VuOiBmb250LmdldEVuZ2xpc2hOYW1lKCdtYW51ZmFjdHVyZXInKSArICc6JyArIGVuZ2xpc2hGdWxsTmFtZX07XG4gICAgfVxuXG4gICAgaWYgKCFuYW1lcy5wb3N0U2NyaXB0TmFtZSkge1xuICAgICAgICBuYW1lcy5wb3N0U2NyaXB0TmFtZSA9IHtlbjogcG9zdFNjcmlwdE5hbWV9O1xuICAgIH1cblxuICAgIGlmICghbmFtZXMucHJlZmVycmVkRmFtaWx5KSB7XG4gICAgICAgIG5hbWVzLnByZWZlcnJlZEZhbWlseSA9IGZvbnQubmFtZXMuZm9udEZhbWlseTtcbiAgICB9XG5cbiAgICBpZiAoIW5hbWVzLnByZWZlcnJlZFN1YmZhbWlseSkge1xuICAgICAgICBuYW1lcy5wcmVmZXJyZWRTdWJmYW1pbHkgPSBmb250Lm5hbWVzLmZvbnRTdWJmYW1pbHk7XG4gICAgfVxuXG4gICAgdmFyIGxhbmd1YWdlVGFncyA9IFtdO1xuICAgIHZhciBuYW1lVGFibGUgPSBfbmFtZS5tYWtlKG5hbWVzLCBsYW5ndWFnZVRhZ3MpO1xuICAgIHZhciBsdGFnVGFibGUgPSAobGFuZ3VhZ2VUYWdzLmxlbmd0aCA+IDAgPyBsdGFnLm1ha2UobGFuZ3VhZ2VUYWdzKSA6IHVuZGVmaW5lZCk7XG5cbiAgICB2YXIgcG9zdFRhYmxlID0gcG9zdC5tYWtlKCk7XG4gICAgdmFyIGNmZlRhYmxlID0gY2ZmLm1ha2UoZm9udC5nbHlwaHMsIHtcbiAgICAgICAgdmVyc2lvbjogZm9udC5nZXRFbmdsaXNoTmFtZSgndmVyc2lvbicpLFxuICAgICAgICBmdWxsTmFtZTogZW5nbGlzaEZ1bGxOYW1lLFxuICAgICAgICBmYW1pbHlOYW1lOiBlbmdsaXNoRmFtaWx5TmFtZSxcbiAgICAgICAgd2VpZ2h0TmFtZTogZW5nbGlzaFN0eWxlTmFtZSxcbiAgICAgICAgcG9zdFNjcmlwdE5hbWU6IHBvc3RTY3JpcHROYW1lLFxuICAgICAgICB1bml0c1BlckVtOiBmb250LnVuaXRzUGVyRW0sXG4gICAgICAgIGZvbnRCQm94OiBbMCwgZ2xvYmFscy55TWluLCBnbG9iYWxzLmFzY2VuZGVyLCBnbG9iYWxzLmFkdmFuY2VXaWR0aE1heF1cbiAgICB9KTtcblxuICAgIC8vIFRoZSBvcmRlciBkb2VzIG5vdCBtYXR0ZXIgYmVjYXVzZSBtYWtlU2ZudFRhYmxlKCkgd2lsbCBzb3J0IHRoZW0uXG4gICAgdmFyIHRhYmxlcyA9IFtoZWFkVGFibGUsIGhoZWFUYWJsZSwgbWF4cFRhYmxlLCBvczJUYWJsZSwgbmFtZVRhYmxlLCBjbWFwVGFibGUsIHBvc3RUYWJsZSwgY2ZmVGFibGUsIGhtdHhUYWJsZV07XG4gICAgaWYgKGx0YWdUYWJsZSkge1xuICAgICAgICB0YWJsZXMucHVzaChsdGFnVGFibGUpO1xuICAgIH1cblxuICAgIHZhciBzZm50VGFibGUgPSBtYWtlU2ZudFRhYmxlKHRhYmxlcyk7XG5cbiAgICAvLyBDb21wdXRlIHRoZSBmb250J3MgY2hlY2tTdW0gYW5kIHN0b3JlIGl0IGluIGhlYWQuY2hlY2tTdW1BZGp1c3RtZW50LlxuICAgIHZhciBieXRlcyA9IHNmbnRUYWJsZS5lbmNvZGUoKTtcbiAgICB2YXIgY2hlY2tTdW0gPSBjb21wdXRlQ2hlY2tTdW0oYnl0ZXMpO1xuICAgIHZhciB0YWJsZUZpZWxkcyA9IHNmbnRUYWJsZS5maWVsZHM7XG4gICAgdmFyIGNoZWNrU3VtQWRqdXN0ZWQgPSBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGFibGVGaWVsZHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKHRhYmxlRmllbGRzW2ldLm5hbWUgPT09ICdoZWFkIHRhYmxlJykge1xuICAgICAgICAgICAgdGFibGVGaWVsZHNbaV0udmFsdWUuY2hlY2tTdW1BZGp1c3RtZW50ID0gMHhCMUIwQUZCQSAtIGNoZWNrU3VtO1xuICAgICAgICAgICAgY2hlY2tTdW1BZGp1c3RlZCA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghY2hlY2tTdW1BZGp1c3RlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGhlYWQgdGFibGUgd2l0aCBjaGVja1N1bSB0byBhZGp1c3QuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNmbnRUYWJsZTtcbn1cblxuZXhwb3J0cy5jb21wdXRlQ2hlY2tTdW0gPSBjb21wdXRlQ2hlY2tTdW07XG5leHBvcnRzLm1ha2UgPSBtYWtlU2ZudFRhYmxlO1xuZXhwb3J0cy5mb250VG9UYWJsZSA9IGZvbnRUb1NmbnRUYWJsZTtcbiIsIi8vIERhdGEgdHlwZXMgdXNlZCBpbiB0aGUgT3BlblR5cGUgZm9udCBmaWxlLlxuLy8gQWxsIE9wZW5UeXBlIGZvbnRzIHVzZSBNb3Rvcm9sYS1zdHlsZSBieXRlIG9yZGVyaW5nIChCaWcgRW5kaWFuKVxuXG4vKiBnbG9iYWwgV2Vha01hcCAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjaGVjayA9IHJlcXVpcmUoJy4vY2hlY2snKTtcblxudmFyIExJTUlUMTYgPSAzMjc2ODsgLy8gVGhlIGxpbWl0IGF0IHdoaWNoIGEgMTYtYml0IG51bWJlciBzd2l0Y2hlcyBzaWducyA9PSAyXjE1XG52YXIgTElNSVQzMiA9IDIxNDc0ODM2NDg7IC8vIFRoZSBsaW1pdCBhdCB3aGljaCBhIDMyLWJpdCBudW1iZXIgc3dpdGNoZXMgc2lnbnMgPT0gMiBeIDMxXG5cbnZhciBkZWNvZGUgPSB7fTtcbnZhciBlbmNvZGUgPSB7fTtcbnZhciBzaXplT2YgPSB7fTtcblxuLy8gUmV0dXJuIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGUgc2FtZSB2YWx1ZS5cbmZ1bmN0aW9uIGNvbnN0YW50KHYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH07XG59XG5cbi8vIE9wZW5UeXBlIGRhdGEgdHlwZXMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIENvbnZlcnQgYW4gOC1iaXQgdW5zaWduZWQgaW50ZWdlciB0byBhIGxpc3Qgb2YgMSBieXRlLlxuZW5jb2RlLkJZVEUgPSBmdW5jdGlvbih2KSB7XG4gICAgY2hlY2suYXJndW1lbnQodiA+PSAwICYmIHYgPD0gMjU1LCAnQnl0ZSB2YWx1ZSBzaG91bGQgYmUgYmV0d2VlbiAwIGFuZCAyNTUuJyk7XG4gICAgcmV0dXJuIFt2XTtcbn07XG5cbnNpemVPZi5CWVRFID0gY29uc3RhbnQoMSk7XG5cbi8vIENvbnZlcnQgYSA4LWJpdCBzaWduZWQgaW50ZWdlciB0byBhIGxpc3Qgb2YgMSBieXRlLlxuZW5jb2RlLkNIQVIgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIFt2LmNoYXJDb2RlQXQoMCldO1xufTtcblxuc2l6ZU9mLkNIQVIgPSBjb25zdGFudCgxKTtcblxuLy8gQ29udmVydCBhbiBBU0NJSSBzdHJpbmcgdG8gYSBsaXN0IG9mIGJ5dGVzLlxuZW5jb2RlLkNIQVJBUlJBWSA9IGZ1bmN0aW9uKHYpIHtcbiAgICB2YXIgYiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBiLnB1c2godi5jaGFyQ29kZUF0KGkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYjtcbn07XG5cbnNpemVPZi5DSEFSQVJSQVkgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHYubGVuZ3RoO1xufTtcblxuLy8gQ29udmVydCBhIDE2LWJpdCB1bnNpZ25lZCBpbnRlZ2VyIHRvIGEgbGlzdCBvZiAyIGJ5dGVzLlxuZW5jb2RlLlVTSE9SVCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gWyh2ID4+IDgpICYgMHhGRiwgdiAmIDB4RkZdO1xufTtcblxuc2l6ZU9mLlVTSE9SVCA9IGNvbnN0YW50KDIpO1xuXG4vLyBDb252ZXJ0IGEgMTYtYml0IHNpZ25lZCBpbnRlZ2VyIHRvIGEgbGlzdCBvZiAyIGJ5dGVzLlxuZW5jb2RlLlNIT1JUID0gZnVuY3Rpb24odikge1xuICAgIC8vIFR3bydzIGNvbXBsZW1lbnRcbiAgICBpZiAodiA+PSBMSU1JVDE2KSB7XG4gICAgICAgIHYgPSAtKDIgKiBMSU1JVDE2IC0gdik7XG4gICAgfVxuXG4gICAgcmV0dXJuIFsodiA+PiA4KSAmIDB4RkYsIHYgJiAweEZGXTtcbn07XG5cbnNpemVPZi5TSE9SVCA9IGNvbnN0YW50KDIpO1xuXG4vLyBDb252ZXJ0IGEgMjQtYml0IHVuc2lnbmVkIGludGVnZXIgdG8gYSBsaXN0IG9mIDMgYnl0ZXMuXG5lbmNvZGUuVUlOVDI0ID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBbKHYgPj4gMTYpICYgMHhGRiwgKHYgPj4gOCkgJiAweEZGLCB2ICYgMHhGRl07XG59O1xuXG5zaXplT2YuVUlOVDI0ID0gY29uc3RhbnQoMyk7XG5cbi8vIENvbnZlcnQgYSAzMi1iaXQgdW5zaWduZWQgaW50ZWdlciB0byBhIGxpc3Qgb2YgNCBieXRlcy5cbmVuY29kZS5VTE9ORyA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gWyh2ID4+IDI0KSAmIDB4RkYsICh2ID4+IDE2KSAmIDB4RkYsICh2ID4+IDgpICYgMHhGRiwgdiAmIDB4RkZdO1xufTtcblxuc2l6ZU9mLlVMT05HID0gY29uc3RhbnQoNCk7XG5cbi8vIENvbnZlcnQgYSAzMi1iaXQgdW5zaWduZWQgaW50ZWdlciB0byBhIGxpc3Qgb2YgNCBieXRlcy5cbmVuY29kZS5MT05HID0gZnVuY3Rpb24odikge1xuICAgIC8vIFR3bydzIGNvbXBsZW1lbnRcbiAgICBpZiAodiA+PSBMSU1JVDMyKSB7XG4gICAgICAgIHYgPSAtKDIgKiBMSU1JVDMyIC0gdik7XG4gICAgfVxuXG4gICAgcmV0dXJuIFsodiA+PiAyNCkgJiAweEZGLCAodiA+PiAxNikgJiAweEZGLCAodiA+PiA4KSAmIDB4RkYsIHYgJiAweEZGXTtcbn07XG5cbnNpemVPZi5MT05HID0gY29uc3RhbnQoNCk7XG5cbmVuY29kZS5GSVhFRCA9IGVuY29kZS5VTE9ORztcbnNpemVPZi5GSVhFRCA9IHNpemVPZi5VTE9ORztcblxuZW5jb2RlLkZXT1JEID0gZW5jb2RlLlNIT1JUO1xuc2l6ZU9mLkZXT1JEID0gc2l6ZU9mLlNIT1JUO1xuXG5lbmNvZGUuVUZXT1JEID0gZW5jb2RlLlVTSE9SVDtcbnNpemVPZi5VRldPUkQgPSBzaXplT2YuVVNIT1JUO1xuXG4vLyBGSVhNRSBJbXBsZW1lbnQgTE9OR0RBVEVUSU1FXG5lbmNvZGUuTE9OR0RBVEVUSU1FID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXTtcbn07XG5cbnNpemVPZi5MT05HREFURVRJTUUgPSBjb25zdGFudCg4KTtcblxuLy8gQ29udmVydCBhIDQtY2hhciB0YWcgdG8gYSBsaXN0IG9mIDQgYnl0ZXMuXG5lbmNvZGUuVEFHID0gZnVuY3Rpb24odikge1xuICAgIGNoZWNrLmFyZ3VtZW50KHYubGVuZ3RoID09PSA0LCAnVGFnIHNob3VsZCBiZSBleGFjdGx5IDQgQVNDSUkgY2hhcmFjdGVycy4nKTtcbiAgICByZXR1cm4gW3YuY2hhckNvZGVBdCgwKSxcbiAgICAgICAgICAgIHYuY2hhckNvZGVBdCgxKSxcbiAgICAgICAgICAgIHYuY2hhckNvZGVBdCgyKSxcbiAgICAgICAgICAgIHYuY2hhckNvZGVBdCgzKV07XG59O1xuXG5zaXplT2YuVEFHID0gY29uc3RhbnQoNCk7XG5cbi8vIENGRiBkYXRhIHR5cGVzIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmVuY29kZS5DYXJkOCA9IGVuY29kZS5CWVRFO1xuc2l6ZU9mLkNhcmQ4ID0gc2l6ZU9mLkJZVEU7XG5cbmVuY29kZS5DYXJkMTYgPSBlbmNvZGUuVVNIT1JUO1xuc2l6ZU9mLkNhcmQxNiA9IHNpemVPZi5VU0hPUlQ7XG5cbmVuY29kZS5PZmZTaXplID0gZW5jb2RlLkJZVEU7XG5zaXplT2YuT2ZmU2l6ZSA9IHNpemVPZi5CWVRFO1xuXG5lbmNvZGUuU0lEID0gZW5jb2RlLlVTSE9SVDtcbnNpemVPZi5TSUQgPSBzaXplT2YuVVNIT1JUO1xuXG4vLyBDb252ZXJ0IGEgbnVtZXJpYyBvcGVyYW5kIG9yIGNoYXJzdHJpbmcgbnVtYmVyIHRvIGEgdmFyaWFibGUtc2l6ZSBsaXN0IG9mIGJ5dGVzLlxuZW5jb2RlLk5VTUJFUiA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodiA+PSAtMTA3ICYmIHYgPD0gMTA3KSB7XG4gICAgICAgIHJldHVybiBbdiArIDEzOV07XG4gICAgfSBlbHNlIGlmICh2ID49IDEwOCAmJiB2IDw9IDExMzEpIHtcbiAgICAgICAgdiA9IHYgLSAxMDg7XG4gICAgICAgIHJldHVybiBbKHYgPj4gOCkgKyAyNDcsIHYgJiAweEZGXTtcbiAgICB9IGVsc2UgaWYgKHYgPj0gLTExMzEgJiYgdiA8PSAtMTA4KSB7XG4gICAgICAgIHYgPSAtdiAtIDEwODtcbiAgICAgICAgcmV0dXJuIFsodiA+PiA4KSArIDI1MSwgdiAmIDB4RkZdO1xuICAgIH0gZWxzZSBpZiAodiA+PSAtMzI3NjggJiYgdiA8PSAzMjc2Nykge1xuICAgICAgICByZXR1cm4gZW5jb2RlLk5VTUJFUjE2KHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbmNvZGUuTlVNQkVSMzIodik7XG4gICAgfVxufTtcblxuc2l6ZU9mLk5VTUJFUiA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gZW5jb2RlLk5VTUJFUih2KS5sZW5ndGg7XG59O1xuXG4vLyBDb252ZXJ0IGEgc2lnbmVkIG51bWJlciBiZXR3ZWVuIC0zMjc2OCBhbmQgKzMyNzY3IHRvIGEgdGhyZWUtYnl0ZSB2YWx1ZS5cbi8vIFRoaXMgZW5zdXJlcyB3ZSBhbHdheXMgdXNlIHRocmVlIGJ5dGVzLCBidXQgaXMgbm90IHRoZSBtb3N0IGNvbXBhY3QgZm9ybWF0LlxuZW5jb2RlLk5VTUJFUjE2ID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBbMjgsICh2ID4+IDgpICYgMHhGRiwgdiAmIDB4RkZdO1xufTtcblxuc2l6ZU9mLk5VTUJFUjE2ID0gY29uc3RhbnQoMyk7XG5cbi8vIENvbnZlcnQgYSBzaWduZWQgbnVtYmVyIGJldHdlZW4gLSgyXjMxKSBhbmQgKygyXjMxLTEpIHRvIGEgZml2ZS1ieXRlIHZhbHVlLlxuLy8gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gYmUgc3VyZSB5b3UgYWx3YXlzIHVzZSBmb3VyIGJ5dGVzLFxuLy8gYXQgdGhlIGV4cGVuc2Ugb2Ygd2FzdGluZyBhIGZldyBieXRlcyBmb3Igc21hbGxlciBudW1iZXJzLlxuZW5jb2RlLk5VTUJFUjMyID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBbMjksICh2ID4+IDI0KSAmIDB4RkYsICh2ID4+IDE2KSAmIDB4RkYsICh2ID4+IDgpICYgMHhGRiwgdiAmIDB4RkZdO1xufTtcblxuc2l6ZU9mLk5VTUJFUjMyID0gY29uc3RhbnQoNSk7XG5cbmVuY29kZS5SRUFMID0gZnVuY3Rpb24odikge1xuICAgIHZhciB2YWx1ZSA9IHYudG9TdHJpbmcoKTtcblxuICAgIC8vIFNvbWUgbnVtYmVycyB1c2UgYW4gZXBzaWxvbiB0byBlbmNvZGUgdGhlIHZhbHVlLiAoZS5nLiBKYXZhU2NyaXB0IHdpbGwgc3RvcmUgMC4wMDAwMDAxIGFzIDFlLTcpXG4gICAgLy8gVGhpcyBjb2RlIGNvbnZlcnRzIGl0IGJhY2sgdG8gYSBudW1iZXIgd2l0aG91dCB0aGUgZXBzaWxvbi5cbiAgICB2YXIgbSA9IC9cXC4oXFxkKj8pKD86OXs1LDIwfXwwezUsMjB9KVxcZHswLDJ9KD86ZSguKyl8JCkvLmV4ZWModmFsdWUpO1xuICAgIGlmIChtKSB7XG4gICAgICAgIHZhciBlcHNpbG9uID0gcGFyc2VGbG9hdCgnMWUnICsgKChtWzJdID8gK21bMl0gOiAwKSArIG1bMV0ubGVuZ3RoKSk7XG4gICAgICAgIHZhbHVlID0gKE1hdGgucm91bmQodiAqIGVwc2lsb24pIC8gZXBzaWxvbikudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICB2YXIgbmliYmxlcyA9ICcnO1xuICAgIHZhciBpO1xuICAgIHZhciBpaTtcbiAgICBmb3IgKGkgPSAwLCBpaSA9IHZhbHVlLmxlbmd0aDsgaSA8IGlpOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGMgPSB2YWx1ZVtpXTtcbiAgICAgICAgaWYgKGMgPT09ICdlJykge1xuICAgICAgICAgICAgbmliYmxlcyArPSB2YWx1ZVsrK2ldID09PSAnLScgPyAnYycgOiAnYic7XG4gICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gJy4nKSB7XG4gICAgICAgICAgICBuaWJibGVzICs9ICdhJztcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSAnLScpIHtcbiAgICAgICAgICAgIG5pYmJsZXMgKz0gJ2UnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmliYmxlcyArPSBjO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmliYmxlcyArPSAobmliYmxlcy5sZW5ndGggJiAxKSA/ICdmJyA6ICdmZic7XG4gICAgdmFyIG91dCA9IFszMF07XG4gICAgZm9yIChpID0gMCwgaWkgPSBuaWJibGVzLmxlbmd0aDsgaSA8IGlpOyBpICs9IDIpIHtcbiAgICAgICAgb3V0LnB1c2gocGFyc2VJbnQobmliYmxlcy5zdWJzdHIoaSwgMiksIDE2KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbnNpemVPZi5SRUFMID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBlbmNvZGUuUkVBTCh2KS5sZW5ndGg7XG59O1xuXG5lbmNvZGUuTkFNRSA9IGVuY29kZS5DSEFSQVJSQVk7XG5zaXplT2YuTkFNRSA9IHNpemVPZi5DSEFSQVJSQVk7XG5cbmVuY29kZS5TVFJJTkcgPSBlbmNvZGUuQ0hBUkFSUkFZO1xuc2l6ZU9mLlNUUklORyA9IHNpemVPZi5DSEFSQVJSQVk7XG5cbmRlY29kZS5VVEYxNiA9IGZ1bmN0aW9uKGRhdGEsIG9mZnNldCwgbnVtQnl0ZXMpIHtcbiAgICB2YXIgY29kZVBvaW50cyA9IFtdO1xuICAgIHZhciBudW1DaGFycyA9IG51bUJ5dGVzIC8gMjtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG51bUNoYXJzOyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgIGNvZGVQb2ludHNbal0gPSBkYXRhLmdldFVpbnQxNihvZmZzZXQpO1xuICAgIH1cblxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGNvZGVQb2ludHMpO1xufTtcblxuLy8gQ29udmVydCBhIEphdmFTY3JpcHQgc3RyaW5nIHRvIFVURjE2LUJFLlxuZW5jb2RlLlVURjE2ID0gZnVuY3Rpb24odikge1xuICAgIHZhciBiID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBjb2RlcG9pbnQgPSB2LmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGIucHVzaCgoY29kZXBvaW50ID4+IDgpICYgMHhGRik7XG4gICAgICAgIGIucHVzaChjb2RlcG9pbnQgJiAweEZGKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYjtcbn07XG5cbnNpemVPZi5VVEYxNiA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdi5sZW5ndGggKiAyO1xufTtcblxuLy8gRGF0YSBmb3IgY29udmVydGluZyBvbGQgZWlnaHQtYml0IE1hY2ludG9zaCBlbmNvZGluZ3MgdG8gVW5pY29kZS5cbi8vIFRoaXMgcmVwcmVzZW50YXRpb24gaXMgb3B0aW1pemVkIGZvciBkZWNvZGluZzsgZW5jb2RpbmcgaXMgc2xvd2VyXG4vLyBhbmQgbmVlZHMgbW9yZSBtZW1vcnkuIFRoZSBhc3N1bXB0aW9uIGlzIHRoYXQgYWxsIG9wZW50eXBlLmpzIHVzZXJzXG4vLyB3YW50IHRvIG9wZW4gZm9udHMsIGJ1dCBzYXZpbmcgYSBmb250IHdpbGwgYmUgY29tcGVyYXRpdmVseSByYXJlXG4vLyBzbyBpdCBjYW4gYmUgbW9yZSBleHBlbnNpdmUuIEtleWVkIGJ5IElBTkEgY2hhcmFjdGVyIHNldCBuYW1lLlxuLy9cbi8vIFB5dGhvbiBzY3JpcHQgZm9yIGdlbmVyYXRpbmcgdGhlc2Ugc3RyaW5nczpcbi8vXG4vLyAgICAgcyA9IHUnJy5qb2luKFtjaHIoYykuZGVjb2RlKCdtYWNfZ3JlZWsnKSBmb3IgYyBpbiByYW5nZSgxMjgsIDI1NildKVxuLy8gICAgIHByaW50KHMuZW5jb2RlKCd1dGYtOCcpKVxudmFyIGVpZ2h0Qml0TWFjRW5jb2RpbmdzID0ge1xuICAgICd4LW1hYy1jcm9hdGlhbic6ICAvLyBQeXRob246ICdtYWNfY3JvYXRpYW4nXG4gICAgICAgICfDhMOFw4fDicORw5bDnMOhw6DDosOkw6PDpcOnw6nDqMOqw6vDrcOsw67Dr8Oxw7PDssO0w7bDtcO6w7nDu8O84oCgwrDCosKjwqfigKLCtsOfwq7FoOKEosK0wqjiiaDFvcOY4oiewrHiiaTiiaXiiIbCteKIguKIkeKIj8Wh4oirwqrCus6pxb7DuCcgK1xuICAgICAgICAnwr/CocKs4oiaxpLiiYjEhsKrxIzigKbCoMOAw4PDlcWSxZPEkOKAlOKAnOKAneKAmOKAmcO34peK76O/wqnigYTigqzigLnigLrDhsK74oCTwrfigJrigJ7igLDDgsSHw4HEjcOIw43DjsOPw4zDk8OUxJHDksOaw5vDmcSxy4bLnMKvz4DDi8uawrjDisOmy4cnLFxuICAgICd4LW1hYy1jeXJpbGxpYyc6ICAvLyBQeXRob246ICdtYWNfY3lyaWxsaWMnXG4gICAgICAgICfQkNCR0JLQk9CU0JXQltCX0JjQmdCa0JvQnNCd0J7Qn9Cg0KHQotCj0KTQpdCm0KfQqNCp0KrQq9Cs0K3QrtCv4oCgwrDSkMKjwqfigKLCttCGwq7CqeKEotCC0ZLiiaDQg9GT4oiewrHiiaTiiaXRlsK10pHQiNCE0ZTQh9GX0InRmdCK0ZonICtcbiAgICAgICAgJ9GY0IXCrOKImsaS4omI4oiGwqvCu+KApsKg0IvRm9CM0ZzRleKAk+KAlOKAnOKAneKAmOKAmcO34oCe0I7RntCP0Z/ihJbQgdGR0Y/QsNCx0LLQs9C00LXQttC30LjQudC60LvQvNC90L7Qv9GA0YHRgtGD0YTRhdGG0YfRiNGJ0YrRi9GM0Y3RjicsXG4gICAgJ3gtbWFjLWdhZWxpYyc6XG4gICAgICAgIC8vIGh0dHA6Ly91bmljb2RlLm9yZy9QdWJsaWMvTUFQUElOR1MvVkVORE9SUy9BUFBMRS9HQUVMSUMuVFhUXG4gICAgICAgICfDhMOFw4fDicORw5bDnMOhw6DDosOkw6PDpcOnw6nDqMOqw6vDrcOsw67Dr8Oxw7PDssO0w7bDtcO6w7nDu8O84oCgwrDCosKjwqfigKLCtsOfwq7CqeKEosK0wqjiiaDDhsOY4biCwrHiiaTiiaXhuIPEisSL4biK4biL4bie4bifxKDEoeG5gMOmw7gnICtcbiAgICAgICAgJ+G5geG5luG5l8m8xpLFv+G5oMKrwrvigKbCoMOAw4PDlcWSxZPigJPigJTigJzigJ3igJjigJnhuaHhupvDv8W44bmq4oKs4oC54oC6xbbFt+G5q8K34buy4buz4oGKw4LDisOBw4vDiMONw47Dj8OMw5PDlOKZo8OSw5rDm8OZxLHDncO9xbTFteG6hOG6heG6gOG6geG6guG6gycsXG4gICAgJ3gtbWFjLWdyZWVrJzogIC8vIFB5dGhvbjogJ21hY19ncmVlaydcbiAgICAgICAgJ8OEwrnCssOJwrPDlsOczoXDoMOiw6TOhMKow6fDqcOow6rDq8Kj4oSiw67Dr+KAosK94oCww7TDtsKm4oKsw7nDu8O84oCgzpPOlM6YzpvOns6gw5/CrsKpzqPOqsKn4omgwrDCt86RwrHiiaTiiaXCpc6SzpXOls6XzpnOms6czqbOq86ozqknICtcbiAgICAgICAgJ86szp3CrM6fzqHiiYjOpMKrwrvigKbCoM6lzqfOhs6IxZPigJPigJXigJzigJ3igJjigJnDt86JzorOjM6Ozq3Ors6vz4zOj8+NzrHOss+IzrTOtc+GzrPOt865zr7Ous67zrzOvc6/z4DPjs+Bz4PPhM64z4nPgs+Hz4XOts+Kz4vOkM6wXFx1MDBBRCcsXG4gICAgJ3gtbWFjLWljZWxhbmRpYyc6ICAvLyBQeXRob246ICdtYWNfaWNlbGFuZCdcbiAgICAgICAgJ8OEw4XDh8OJw5HDlsOcw6HDoMOiw6TDo8Olw6fDqcOow6rDq8Otw6zDrsOvw7HDs8Oyw7TDtsO1w7rDucO7w7zDncKwwqLCo8Kn4oCiwrbDn8KuwqnihKLCtMKo4omgw4bDmOKInsKx4omk4omlwqXCteKIguKIkeKIj8+A4oirwqrCus6pw6bDuCcgK1xuICAgICAgICAnwr/CocKs4oiaxpLiiYjiiIbCq8K74oCmwqDDgMODw5XFksWT4oCT4oCU4oCc4oCd4oCY4oCZw7fil4rDv8W44oGE4oKsw5DDsMOew77DvcK34oCa4oCe4oCww4LDisOBw4vDiMONw47Dj8OMw5PDlO+jv8OSw5rDm8OZxLHLhsucwq/LmMuZy5rCuMudy5vLhycsXG4gICAgJ3gtbWFjLWludWl0JzpcbiAgICAgICAgLy8gaHR0cDovL3VuaWNvZGUub3JnL1B1YmxpYy9NQVBQSU5HUy9WRU5ET1JTL0FQUExFL0lOVUlULlRYVFxuICAgICAgICAn4ZCD4ZCE4ZCF4ZCG4ZCK4ZCL4ZCx4ZCy4ZCz4ZC04ZC44ZC54ZGJ4ZGO4ZGP4ZGQ4ZGR4ZGV4ZGW4ZGm4ZGt4ZGu4ZGv4ZGw4ZGy4ZGz4ZKD4ZKL4ZKM4ZKN4ZKO4ZKQ4ZKRwrDhkqHhkqXhkqbigKLCtuGSp8KuwqnihKLhkqjhkqrhkqvhkrvhk4Lhk4Phk4Thk4Xhk4fhk4jhk5Dhk6/hk7Dhk7Hhk7Lhk7Thk7XhlIXhk5Xhk5bhk5cnICtcbiAgICAgICAgJ+GTmOGTmuGTm+GTquGUqOGUqeGUquGUq+GUreKApsKg4ZSu4ZS+4ZWV4ZWW4ZWX4oCT4oCU4oCc4oCd4oCY4oCZ4ZWY4ZWZ4ZWa4ZWd4ZWG4ZWH4ZWI4ZWJ4ZWL4ZWM4ZWQ4ZW/4ZaA4ZaB4ZaC4ZaD4ZaE4ZaF4ZaP4ZaQ4ZaR4ZaS4ZaT4ZaU4ZaV4Zmx4Zmy4Zmz4Zm04Zm14Zm24ZaW4Zag4Zah4Zai4Zaj4Zak4Zal4Zam4ZW8xYHFgicsXG4gICAgJ3gtbWFjLWNlJzogIC8vIFB5dGhvbjogJ21hY19sYXRpbjInXG4gICAgICAgICfDhMSAxIHDicSEw5bDnMOhxIXEjMOkxI3EhsSHw6nFucW6xI7DrcSPxJLEk8SWw7PEl8O0w7bDtcO6xJrEm8O84oCgwrDEmMKjwqfigKLCtsOfwq7CqeKEosSZwqjiiaDEo8SuxK/EquKJpOKJpcSrxLbiiILiiJHFgsS7xLzEvcS+xLnEusWFJyArXG4gICAgICAgICfFhsWDwqziiJrFhMWH4oiGwqvCu+KApsKgxYjFkMOVxZHFjOKAk+KAlOKAnOKAneKAmOKAmcO34peKxY3FlMWVxZjigLnigLrFmcWWxZfFoOKAmuKAnsWhxZrFm8OBxaTFpcONxb3FvsWqw5PDlMWrxa7DmsWvxbDFscWyxbPDncO9xLfFu8WBxbzEosuHJyxcbiAgICBtYWNpbnRvc2g6ICAvLyBQeXRob246ICdtYWNfcm9tYW4nXG4gICAgICAgICfDhMOFw4fDicORw5bDnMOhw6DDosOkw6PDpcOnw6nDqMOqw6vDrcOsw67Dr8Oxw7PDssO0w7bDtcO6w7nDu8O84oCgwrDCosKjwqfigKLCtsOfwq7CqeKEosK0wqjiiaDDhsOY4oiewrHiiaTiiaXCpcK14oiC4oiR4oiPz4DiiKvCqsK6zqnDpsO4JyArXG4gICAgICAgICfCv8KhwqziiJrGkuKJiOKIhsKrwrvigKbCoMOAw4PDlcWSxZPigJPigJTigJzigJ3igJjigJnDt+KXisO/xbjigYTigqzigLnigLrvrIHvrILigKHCt+KAmuKAnuKAsMOCw4rDgcOLw4jDjcOOw4/DjMOTw5Tvo7/DksOaw5vDmcSxy4bLnMKvy5jLmcuawrjLncuby4cnLFxuICAgICd4LW1hYy1yb21hbmlhbic6ICAvLyBQeXRob246ICdtYWNfcm9tYW5pYW4nXG4gICAgICAgICfDhMOFw4fDicORw5bDnMOhw6DDosOkw6PDpcOnw6nDqMOqw6vDrcOsw67Dr8Oxw7PDssO0w7bDtcO6w7nDu8O84oCgwrDCosKjwqfigKLCtsOfwq7CqeKEosK0wqjiiaDEgsiY4oiewrHiiaTiiaXCpcK14oiC4oiR4oiPz4DiiKvCqsK6zqnEg8iZJyArXG4gICAgICAgICfCv8KhwqziiJrGkuKJiOKIhsKrwrvigKbCoMOAw4PDlcWSxZPigJPigJTigJzigJ3igJjigJnDt+KXisO/xbjigYTigqzigLnigLrImsib4oChwrfigJrigJ7igLDDgsOKw4HDi8OIw43DjsOPw4zDk8OU76O/w5LDmsObw5nEscuGy5zCr8uYy5nLmsK4y53Lm8uHJyxcbiAgICAneC1tYWMtdHVya2lzaCc6ICAvLyBQeXRob246ICdtYWNfdHVya2lzaCdcbiAgICAgICAgJ8OEw4XDh8OJw5HDlsOcw6HDoMOiw6TDo8Olw6fDqcOow6rDq8Otw6zDrsOvw7HDs8Oyw7TDtsO1w7rDucO7w7zigKDCsMKiwqPCp+KAosK2w5/CrsKp4oSiwrTCqOKJoMOGw5jiiJ7CseKJpOKJpcKlwrXiiILiiJHiiI/PgOKIq8KqwrrOqcOmw7gnICtcbiAgICAgICAgJ8K/wqHCrOKImsaS4omI4oiGwqvCu+KApsKgw4DDg8OVxZLFk+KAk+KAlOKAnOKAneKAmOKAmcO34peKw7/FuMSexJ/EsMSxxZ7Fn+KAocK34oCa4oCe4oCww4LDisOBw4vDiMONw47Dj8OMw5PDlO+jv8OSw5rDm8OZ76Kgy4bLnMKvy5jLmcuawrjLncuby4cnXG59O1xuXG4vLyBEZWNvZGVzIGFuIG9sZC1zdHlsZSBNYWNpbnRvc2ggc3RyaW5nLiBSZXR1cm5zIGVpdGhlciBhIFVuaWNvZGUgSmF2YVNjcmlwdFxuLy8gc3RyaW5nLCBvciAndW5kZWZpbmVkJyBpZiB0aGUgZW5jb2RpbmcgaXMgdW5zdXBwb3J0ZWQuIEZvciBleGFtcGxlLCB3ZSBkb1xuLy8gbm90IHN1cHBvcnQgQ2hpbmVzZSwgSmFwYW5lc2Ugb3IgS29yZWFuIGJlY2F1c2UgdGhlc2Ugd291bGQgbmVlZCBsYXJnZVxuLy8gbWFwcGluZyB0YWJsZXMuXG5kZWNvZGUuTUFDU1RSSU5HID0gZnVuY3Rpb24oZGF0YVZpZXcsIG9mZnNldCwgZGF0YUxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgICB2YXIgdGFibGUgPSBlaWdodEJpdE1hY0VuY29kaW5nc1tlbmNvZGluZ107XG4gICAgaWYgKHRhYmxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGMgPSBkYXRhVmlldy5nZXRVaW50OChvZmZzZXQgKyBpKTtcbiAgICAgICAgLy8gSW4gYWxsIGVpZ2h0LWJpdCBNYWMgZW5jb2RpbmdzLCB0aGUgY2hhcmFjdGVycyAweDAwLi4weDdGIGFyZVxuICAgICAgICAvLyBtYXBwZWQgdG8gVSswMDAwLi5VKzAwN0Y7IHdlIG9ubHkgbmVlZCB0byBsb29rIHVwIHRoZSBvdGhlcnMuXG4gICAgICAgIGlmIChjIDw9IDB4N0YpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ICs9IHRhYmxlW2MgJiAweDdGXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gZm9yIGVuY29kZS5NQUNTVFJJTkcuIFJldHVybnMgYSBkaWN0aW9uYXJ5IGZvciBtYXBwaW5nXG4vLyBVbmljb2RlIGNoYXJhY3RlciBjb2RlcyB0byB0aGVpciA4LWJpdCBNYWNPUyBlcXVpdmFsZW50LiBUaGlzIHRhYmxlXG4vLyBpcyBub3QgZXhhY3RseSBhIHN1cGVyIGNoZWFwIGRhdGEgc3RydWN0dXJlLCBidXQgd2UgZG8gbm90IGNhcmUgYmVjYXVzZVxuLy8gZW5jb2RpbmcgTWFjaW50b3NoIHN0cmluZ3MgaXMgb25seSByYXJlbHkgbmVlZGVkIGluIHR5cGljYWwgYXBwbGljYXRpb25zLlxudmFyIG1hY0VuY29kaW5nVGFibGVDYWNoZSA9IHR5cGVvZiBXZWFrTWFwID09PSAnZnVuY3Rpb24nICYmIG5ldyBXZWFrTWFwKCk7XG52YXIgbWFjRW5jb2RpbmdDYWNoZUtleXM7XG52YXIgZ2V0TWFjRW5jb2RpbmdUYWJsZSA9IGZ1bmN0aW9uKGVuY29kaW5nKSB7XG4gICAgLy8gU2luY2Ugd2UgdXNlIGVuY29kaW5nIGFzIGEgY2FjaGUga2V5IGZvciBXZWFrTWFwLCBpdCBoYXMgdG8gYmVcbiAgICAvLyBhIFN0cmluZyBvYmplY3QgYW5kIG5vdCBhIGxpdGVyYWwuIEFuZCBhdCBsZWFzdCBvbiBOb2RlSlMgMi4xMC4xLFxuICAgIC8vIFdlYWtNYXAgcmVxdWlyZXMgdGhhdCB0aGUgc2FtZSBTdHJpbmcgaW5zdGFuY2UgaXMgcGFzc2VkIGZvciBjYWNoZSBoaXRzLlxuICAgIGlmICghbWFjRW5jb2RpbmdDYWNoZUtleXMpIHtcbiAgICAgICAgbWFjRW5jb2RpbmdDYWNoZUtleXMgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgZSBpbiBlaWdodEJpdE1hY0VuY29kaW5ncykge1xuICAgICAgICAgICAgLypqc2hpbnQgLVcwNTMgKi8gIC8vIFN1cHByZXNzIFwiRG8gbm90IHVzZSBTdHJpbmcgYXMgYSBjb25zdHJ1Y3Rvci5cIlxuICAgICAgICAgICAgbWFjRW5jb2RpbmdDYWNoZUtleXNbZV0gPSBuZXcgU3RyaW5nKGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGNhY2hlS2V5ID0gbWFjRW5jb2RpbmdDYWNoZUtleXNbZW5jb2RpbmddO1xuICAgIGlmIChjYWNoZUtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gV2UgY2FuJ3QgZG8gXCJpZiAoY2FjaGUuaGFzKGtleSkpIHtyZXR1cm4gY2FjaGUuZ2V0KGtleSl9XCIgaGVyZTpcbiAgICAvLyBzaW5jZSBnYXJiYWdlIGNvbGxlY3Rpb24gbWF5IHJ1biBhdCBhbnkgdGltZSwgaXQgY291bGQgYWxzbyBraWNrIGluXG4gICAgLy8gYmV0d2VlbiB0aGUgY2FsbHMgdG8gY2FjaGUuaGFzKCkgYW5kIGNhY2hlLmdldCgpLiBJbiB0aGF0IGNhc2UsXG4gICAgLy8gd2Ugd291bGQgcmV0dXJuICd1bmRlZmluZWQnIGV2ZW4gdGhvdWdoIHdlIGRvIHN1cHBvcnQgdGhlIGVuY29kaW5nLlxuICAgIGlmIChtYWNFbmNvZGluZ1RhYmxlQ2FjaGUpIHtcbiAgICAgICAgdmFyIGNhY2hlZFRhYmxlID0gbWFjRW5jb2RpbmdUYWJsZUNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgIGlmIChjYWNoZWRUYWJsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkVGFibGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZGVjb2RpbmdUYWJsZSA9IGVpZ2h0Qml0TWFjRW5jb2RpbmdzW2VuY29kaW5nXTtcbiAgICBpZiAoZGVjb2RpbmdUYWJsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdmFyIGVuY29kaW5nVGFibGUgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlY29kaW5nVGFibGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZW5jb2RpbmdUYWJsZVtkZWNvZGluZ1RhYmxlLmNoYXJDb2RlQXQoaSldID0gaSArIDB4ODA7XG4gICAgfVxuXG4gICAgaWYgKG1hY0VuY29kaW5nVGFibGVDYWNoZSkge1xuICAgICAgICBtYWNFbmNvZGluZ1RhYmxlQ2FjaGUuc2V0KGNhY2hlS2V5LCBlbmNvZGluZ1RhYmxlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW5jb2RpbmdUYWJsZTtcbn07XG5cbi8vIEVuY29kZXMgYW4gb2xkLXN0eWxlIE1hY2ludG9zaCBzdHJpbmcuIFJldHVybnMgYSBieXRlIGFycmF5IHVwb24gc3VjY2Vzcy5cbi8vIElmIHRoZSByZXF1ZXN0ZWQgZW5jb2RpbmcgaXMgdW5zdXBwb3J0ZWQsIG9yIGlmIHRoZSBpbnB1dCBzdHJpbmcgY29udGFpbnNcbi8vIGEgY2hhcmFjdGVyIHRoYXQgY2Fubm90IGJlIGV4cHJlc3NlZCBpbiB0aGUgZW5jb2RpbmcsIHRoZSBmdW5jdGlvbiByZXR1cm5zXG4vLyAndW5kZWZpbmVkJy5cbmVuY29kZS5NQUNTVFJJTkcgPSBmdW5jdGlvbihzdHIsIGVuY29kaW5nKSB7XG4gICAgdmFyIHRhYmxlID0gZ2V0TWFjRW5jb2RpbmdUYWJsZShlbmNvZGluZyk7XG4gICAgaWYgKHRhYmxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGMgPSBzdHIuY2hhckNvZGVBdChpKTtcblxuICAgICAgICAvLyBJbiBhbGwgZWlnaHQtYml0IE1hYyBlbmNvZGluZ3MsIHRoZSBjaGFyYWN0ZXJzIDB4MDAuLjB4N0YgYXJlXG4gICAgICAgIC8vIG1hcHBlZCB0byBVKzAwMDAuLlUrMDA3Rjsgd2Ugb25seSBuZWVkIHRvIGxvb2sgdXAgdGhlIG90aGVycy5cbiAgICAgICAgaWYgKGMgPj0gMHg4MCkge1xuICAgICAgICAgICAgYyA9IHRhYmxlW2NdO1xuICAgICAgICAgICAgaWYgKGMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8vIHN0ciBjb250YWlucyBhIFVuaWNvZGUgY2hhcmFjdGVyIHRoYXQgY2Fubm90IGJlIGVuY29kZWRcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgcmVxdWVzdGVkIGVuY29kaW5nLlxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHQucHVzaChjKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuc2l6ZU9mLk1BQ1NUUklORyA9IGZ1bmN0aW9uKHN0ciwgZW5jb2RpbmcpIHtcbiAgICB2YXIgYiA9IGVuY29kZS5NQUNTVFJJTkcoc3RyLCBlbmNvZGluZyk7XG4gICAgaWYgKGIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gYi5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufTtcblxuLy8gQ29udmVydCBhIGxpc3Qgb2YgdmFsdWVzIHRvIGEgQ0ZGIElOREVYIHN0cnVjdHVyZS5cbi8vIFRoZSB2YWx1ZXMgc2hvdWxkIGJlIG9iamVjdHMgY29udGFpbmluZyBuYW1lIC8gdHlwZSAvIHZhbHVlLlxuZW5jb2RlLklOREVYID0gZnVuY3Rpb24obCkge1xuICAgIHZhciBpO1xuICAgIC8vdmFyIG9mZnNldCwgb2Zmc2V0cywgb2Zmc2V0RW5jb2RlciwgZW5jb2RlZE9mZnNldHMsIGVuY29kZWRPZmZzZXQsIGRhdGEsXG4gICAgLy8gICAgZGF0YVNpemUsIGksIHY7XG4gICAgLy8gQmVjYXVzZSB3ZSBoYXZlIHRvIGtub3cgd2hpY2ggZGF0YSB0eXBlIHRvIHVzZSB0byBlbmNvZGUgdGhlIG9mZnNldHMsXG4gICAgLy8gd2UgaGF2ZSB0byBnbyB0aHJvdWdoIHRoZSB2YWx1ZXMgdHdpY2U6IG9uY2UgdG8gZW5jb2RlIHRoZSBkYXRhIGFuZFxuICAgIC8vIGNhbGN1bGF0ZSB0aGUgb2ZmZXRzLCB0aGVuIGFnYWluIHRvIGVuY29kZSB0aGUgb2Zmc2V0cyB1c2luZyB0aGUgZml0dGluZyBkYXRhIHR5cGUuXG4gICAgdmFyIG9mZnNldCA9IDE7IC8vIEZpcnN0IG9mZnNldCBpcyBhbHdheXMgMS5cbiAgICB2YXIgb2Zmc2V0cyA9IFtvZmZzZXRdO1xuICAgIHZhciBkYXRhID0gW107XG4gICAgdmFyIGRhdGFTaXplID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgdiA9IGVuY29kZS5PQkpFQ1QobFtpXSk7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGRhdGEsIHYpO1xuICAgICAgICBkYXRhU2l6ZSArPSB2Lmxlbmd0aDtcbiAgICAgICAgb2Zmc2V0ICs9IHYubGVuZ3RoO1xuICAgICAgICBvZmZzZXRzLnB1c2gob2Zmc2V0KTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFswLCAwXTtcbiAgICB9XG5cbiAgICB2YXIgZW5jb2RlZE9mZnNldHMgPSBbXTtcbiAgICB2YXIgb2ZmU2l6ZSA9ICgxICsgTWF0aC5mbG9vcihNYXRoLmxvZyhkYXRhU2l6ZSkgLyBNYXRoLmxvZygyKSkgLyA4KSB8IDA7XG4gICAgdmFyIG9mZnNldEVuY29kZXIgPSBbdW5kZWZpbmVkLCBlbmNvZGUuQllURSwgZW5jb2RlLlVTSE9SVCwgZW5jb2RlLlVJTlQyNCwgZW5jb2RlLlVMT05HXVtvZmZTaXplXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgb2Zmc2V0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgZW5jb2RlZE9mZnNldCA9IG9mZnNldEVuY29kZXIob2Zmc2V0c1tpXSk7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGVuY29kZWRPZmZzZXRzLCBlbmNvZGVkT2Zmc2V0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdChlbmNvZGUuQ2FyZDE2KGwubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZS5PZmZTaXplKG9mZlNpemUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlZE9mZnNldHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhKTtcbn07XG5cbnNpemVPZi5JTkRFWCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gZW5jb2RlLklOREVYKHYpLmxlbmd0aDtcbn07XG5cbi8vIENvbnZlcnQgYW4gb2JqZWN0IHRvIGEgQ0ZGIERJQ1Qgc3RydWN0dXJlLlxuLy8gVGhlIGtleXMgc2hvdWxkIGJlIG51bWVyaWMuXG4vLyBUaGUgdmFsdWVzIHNob3VsZCBiZSBvYmplY3RzIGNvbnRhaW5pbmcgbmFtZSAvIHR5cGUgLyB2YWx1ZS5cbmVuY29kZS5ESUNUID0gZnVuY3Rpb24obSkge1xuICAgIHZhciBkID0gW107XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8vIE9iamVjdC5rZXlzKCkgcmV0dXJuIHN0cmluZyBrZXlzLCBidXQgb3VyIGtleXMgYXJlIGFsd2F5cyBudW1lcmljLlxuICAgICAgICB2YXIgayA9IHBhcnNlSW50KGtleXNbaV0sIDApO1xuICAgICAgICB2YXIgdiA9IG1ba107XG4gICAgICAgIC8vIFZhbHVlIGNvbWVzIGJlZm9yZSB0aGUga2V5LlxuICAgICAgICBkID0gZC5jb25jYXQoZW5jb2RlLk9QRVJBTkQodi52YWx1ZSwgdi50eXBlKSk7XG4gICAgICAgIGQgPSBkLmNvbmNhdChlbmNvZGUuT1BFUkFUT1IoaykpO1xuICAgIH1cblxuICAgIHJldHVybiBkO1xufTtcblxuc2l6ZU9mLkRJQ1QgPSBmdW5jdGlvbihtKSB7XG4gICAgcmV0dXJuIGVuY29kZS5ESUNUKG0pLmxlbmd0aDtcbn07XG5cbmVuY29kZS5PUEVSQVRPUiA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodiA8IDEyMDApIHtcbiAgICAgICAgcmV0dXJuIFt2XTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gWzEyLCB2IC0gMTIwMF07XG4gICAgfVxufTtcblxuZW5jb2RlLk9QRVJBTkQgPSBmdW5jdGlvbih2LCB0eXBlKSB7XG4gICAgdmFyIGQgPSBbXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0eXBlKSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNoZWNrLmFyZ3VtZW50KHYubGVuZ3RoID09PSB0eXBlLmxlbmd0aCwgJ05vdCBlbm91Z2ggYXJndW1lbnRzIGdpdmVuIGZvciB0eXBlJyArIHR5cGUpO1xuICAgICAgICAgICAgZCA9IGQuY29uY2F0KGVuY29kZS5PUEVSQU5EKHZbaV0sIHR5cGVbaV0pKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlID09PSAnU0lEJykge1xuICAgICAgICAgICAgZCA9IGQuY29uY2F0KGVuY29kZS5OVU1CRVIodikpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdvZmZzZXQnKSB7XG4gICAgICAgICAgICAvLyBXZSBtYWtlIGl0IGVhc3kgZm9yIG91cnNlbHZlcyBhbmQgYWx3YXlzIGVuY29kZSBvZmZzZXRzIGFzXG4gICAgICAgICAgICAvLyA0IGJ5dGVzLiBUaGlzIG1ha2VzIG9mZnNldCBjYWxjdWxhdGlvbiBmb3IgdGhlIHRvcCBkaWN0IGVhc2llci5cbiAgICAgICAgICAgIGQgPSBkLmNvbmNhdChlbmNvZGUuTlVNQkVSMzIodikpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBkID0gZC5jb25jYXQoZW5jb2RlLk5VTUJFUih2KSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3JlYWwnKSB7XG4gICAgICAgICAgICBkID0gZC5jb25jYXQoZW5jb2RlLlJFQUwodikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIG9wZXJhbmQgdHlwZSAnICsgdHlwZSk7XG4gICAgICAgICAgICAvLyBGSVhNRSBBZGQgc3VwcG9ydCBmb3IgYm9vbGVhbnNcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkO1xufTtcblxuZW5jb2RlLk9QID0gZW5jb2RlLkJZVEU7XG5zaXplT2YuT1AgPSBzaXplT2YuQllURTtcblxuLy8gbWVtb2l6ZSBjaGFyc3RyaW5nIGVuY29kaW5nIHVzaW5nIFdlYWtNYXAgaWYgYXZhaWxhYmxlXG52YXIgd21tID0gdHlwZW9mIFdlYWtNYXAgPT09ICdmdW5jdGlvbicgJiYgbmV3IFdlYWtNYXAoKTtcbi8vIENvbnZlcnQgYSBsaXN0IG9mIENoYXJTdHJpbmcgb3BlcmF0aW9ucyB0byBieXRlcy5cbmVuY29kZS5DSEFSU1RSSU5HID0gZnVuY3Rpb24ob3BzKSB7XG4gICAgLy8gU2VlIGVuY29kZS5NQUNTVFJJTkcgZm9yIHdoeSB3ZSBkb24ndCBkbyBcImlmICh3bW0gJiYgd21tLmhhcyhvcHMpKVwiLlxuICAgIGlmICh3bW0pIHtcbiAgICAgICAgdmFyIGNhY2hlZFZhbHVlID0gd21tLmdldChvcHMpO1xuICAgICAgICBpZiAoY2FjaGVkVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGQgPSBbXTtcbiAgICB2YXIgbGVuZ3RoID0gb3BzLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIG9wID0gb3BzW2ldO1xuICAgICAgICBkID0gZC5jb25jYXQoZW5jb2RlW29wLnR5cGVdKG9wLnZhbHVlKSk7XG4gICAgfVxuXG4gICAgaWYgKHdtbSkge1xuICAgICAgICB3bW0uc2V0KG9wcywgZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGQ7XG59O1xuXG5zaXplT2YuQ0hBUlNUUklORyA9IGZ1bmN0aW9uKG9wcykge1xuICAgIHJldHVybiBlbmNvZGUuQ0hBUlNUUklORyhvcHMpLmxlbmd0aDtcbn07XG5cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIENvbnZlcnQgYW4gb2JqZWN0IGNvbnRhaW5pbmcgbmFtZSAvIHR5cGUgLyB2YWx1ZSB0byBieXRlcy5cbmVuY29kZS5PQkpFQ1QgPSBmdW5jdGlvbih2KSB7XG4gICAgdmFyIGVuY29kaW5nRnVuY3Rpb24gPSBlbmNvZGVbdi50eXBlXTtcbiAgICBjaGVjay5hcmd1bWVudChlbmNvZGluZ0Z1bmN0aW9uICE9PSB1bmRlZmluZWQsICdObyBlbmNvZGluZyBmdW5jdGlvbiBmb3IgdHlwZSAnICsgdi50eXBlKTtcbiAgICByZXR1cm4gZW5jb2RpbmdGdW5jdGlvbih2LnZhbHVlKTtcbn07XG5cbnNpemVPZi5PQkpFQ1QgPSBmdW5jdGlvbih2KSB7XG4gICAgdmFyIHNpemVPZkZ1bmN0aW9uID0gc2l6ZU9mW3YudHlwZV07XG4gICAgY2hlY2suYXJndW1lbnQoc2l6ZU9mRnVuY3Rpb24gIT09IHVuZGVmaW5lZCwgJ05vIHNpemVPZiBmdW5jdGlvbiBmb3IgdHlwZSAnICsgdi50eXBlKTtcbiAgICByZXR1cm4gc2l6ZU9mRnVuY3Rpb24odi52YWx1ZSk7XG59O1xuXG4vLyBDb252ZXJ0IGEgdGFibGUgb2JqZWN0IHRvIGJ5dGVzLlxuLy8gQSB0YWJsZSBjb250YWlucyBhIGxpc3Qgb2YgZmllbGRzIGNvbnRhaW5pbmcgdGhlIG1ldGFkYXRhIChuYW1lLCB0eXBlIGFuZCBkZWZhdWx0IHZhbHVlKS5cbi8vIFRoZSB0YWJsZSBpdHNlbGYgaGFzIHRoZSBmaWVsZCB2YWx1ZXMgc2V0IGFzIGF0dHJpYnV0ZXMuXG5lbmNvZGUuVEFCTEUgPSBmdW5jdGlvbih0YWJsZSkge1xuICAgIHZhciBkID0gW107XG4gICAgdmFyIGxlbmd0aCA9IHRhYmxlLmZpZWxkcy5sZW5ndGg7XG4gICAgdmFyIHN1YnRhYmxlcyA9IFtdO1xuICAgIHZhciBzdWJ0YWJsZU9mZnNldHMgPSBbXTtcbiAgICB2YXIgaTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgZmllbGQgPSB0YWJsZS5maWVsZHNbaV07XG4gICAgICAgIHZhciBlbmNvZGluZ0Z1bmN0aW9uID0gZW5jb2RlW2ZpZWxkLnR5cGVdO1xuICAgICAgICBjaGVjay5hcmd1bWVudChlbmNvZGluZ0Z1bmN0aW9uICE9PSB1bmRlZmluZWQsICdObyBlbmNvZGluZyBmdW5jdGlvbiBmb3IgZmllbGQgdHlwZSAnICsgZmllbGQudHlwZSArICcgKCcgKyBmaWVsZC5uYW1lICsgJyknKTtcbiAgICAgICAgdmFyIHZhbHVlID0gdGFibGVbZmllbGQubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGZpZWxkLnZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJ5dGVzID0gZW5jb2RpbmdGdW5jdGlvbih2YWx1ZSk7XG5cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09ICdUQUJMRScpIHtcbiAgICAgICAgICAgIHN1YnRhYmxlT2Zmc2V0cy5wdXNoKGQubGVuZ3RoKTtcbiAgICAgICAgICAgIGQgPSBkLmNvbmNhdChbMCwgMF0pO1xuICAgICAgICAgICAgc3VidGFibGVzLnB1c2goYnl0ZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZCA9IGQuY29uY2F0KGJ5dGVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBzdWJ0YWJsZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIG8gPSBzdWJ0YWJsZU9mZnNldHNbaV07XG4gICAgICAgIHZhciBvZmZzZXQgPSBkLmxlbmd0aDtcbiAgICAgICAgY2hlY2suYXJndW1lbnQob2Zmc2V0IDwgNjU1MzYsICdUYWJsZSAnICsgdGFibGUudGFibGVOYW1lICsgJyB0b28gYmlnLicpO1xuICAgICAgICBkW29dID0gb2Zmc2V0ID4+IDg7XG4gICAgICAgIGRbbyArIDFdID0gb2Zmc2V0ICYgMHhmZjtcbiAgICAgICAgZCA9IGQuY29uY2F0KHN1YnRhYmxlc1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGQ7XG59O1xuXG5zaXplT2YuVEFCTEUgPSBmdW5jdGlvbih0YWJsZSkge1xuICAgIHZhciBudW1CeXRlcyA9IDA7XG4gICAgdmFyIGxlbmd0aCA9IHRhYmxlLmZpZWxkcy5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBmaWVsZCA9IHRhYmxlLmZpZWxkc1tpXTtcbiAgICAgICAgdmFyIHNpemVPZkZ1bmN0aW9uID0gc2l6ZU9mW2ZpZWxkLnR5cGVdO1xuICAgICAgICBjaGVjay5hcmd1bWVudChzaXplT2ZGdW5jdGlvbiAhPT0gdW5kZWZpbmVkLCAnTm8gc2l6ZU9mIGZ1bmN0aW9uIGZvciBmaWVsZCB0eXBlICcgKyBmaWVsZC50eXBlICsgJyAoJyArIGZpZWxkLm5hbWUgKyAnKScpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0YWJsZVtmaWVsZC5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gZmllbGQudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBudW1CeXRlcyArPSBzaXplT2ZGdW5jdGlvbih2YWx1ZSk7XG5cbiAgICAgICAgLy8gU3VidGFibGVzIHRha2UgMiBtb3JlIGJ5dGVzIGZvciBvZmZzZXRzLlxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ1RBQkxFJykge1xuICAgICAgICAgICAgbnVtQnl0ZXMgKz0gMjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudW1CeXRlcztcbn07XG5cbmVuY29kZS5SRUNPUkQgPSBlbmNvZGUuVEFCTEU7XG5zaXplT2YuUkVDT1JEID0gc2l6ZU9mLlRBQkxFO1xuXG4vLyBNZXJnZSBpbiBhIGxpc3Qgb2YgYnl0ZXMuXG5lbmNvZGUuTElURVJBTCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdjtcbn07XG5cbnNpemVPZi5MSVRFUkFMID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiB2Lmxlbmd0aDtcbn07XG5cbmV4cG9ydHMuZGVjb2RlID0gZGVjb2RlO1xuZXhwb3J0cy5lbmNvZGUgPSBlbmNvZGU7XG5leHBvcnRzLnNpemVPZiA9IHNpemVPZjtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5pc0Jyb3dzZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG59O1xuXG5leHBvcnRzLmlzTm9kZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJztcbn07XG5cbmV4cG9ydHMubm9kZUJ1ZmZlclRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbihidWZmZXIpIHtcbiAgICB2YXIgYWIgPSBuZXcgQXJyYXlCdWZmZXIoYnVmZmVyLmxlbmd0aCk7XG4gICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShhYik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWZmZXIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmlld1tpXSA9IGJ1ZmZlcltpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWI7XG59O1xuXG5leHBvcnRzLmFycmF5QnVmZmVyVG9Ob2RlQnVmZmVyID0gZnVuY3Rpb24oYWIpIHtcbiAgICB2YXIgYnVmZmVyID0gbmV3IEJ1ZmZlcihhYi5ieXRlTGVuZ3RoKTtcbiAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGFiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1ZmZlci5sZW5ndGg7ICsraSkge1xuICAgICAgICBidWZmZXJbaV0gPSB2aWV3W2ldO1xuICAgIH1cblxuICAgIHJldHVybiBidWZmZXI7XG59O1xuXG5leHBvcnRzLmNoZWNrQXJndW1lbnQgPSBmdW5jdGlvbihleHByZXNzaW9uLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFleHByZXNzaW9uKSB7XG4gICAgICAgIHRocm93IG1lc3NhZ2U7XG4gICAgfVxufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7IC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIENvcHlyaWdodCAoYykgMjAxNiBIaWRla2kgU2hpcm9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxudmFyIF9vcGVudHlwZSA9IHJlcXVpcmUoJ29wZW50eXBlLmpzJyk7XG5cbnZhciBfb3BlbnR5cGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfb3BlbnR5cGUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgREVGQVVMVF9GT05UID0gcmVxdWlyZSgncGF0aCcpLmpvaW4oX19kaXJuYW1lLCAnLi4vZm9udHMvaXBhZy50dGYnKTtcblxuLy8gUHJpdmF0ZSBtZXRob2RcblxuZnVuY3Rpb24gcGFyc2VBbmNob3JPcHRpb24oYW5jaG9yKSB7XG4gIHZhciBob3Jpem9udGFsID0gYW5jaG9yLm1hdGNoKC9sZWZ0fGNlbnRlcnxyaWdodC9naSkgfHwgW107XG4gIGhvcml6b250YWwgPSBob3Jpem9udGFsLmxlbmd0aCA9PT0gMCA/ICdsZWZ0JyA6IGhvcml6b250YWxbMF07XG5cbiAgdmFyIHZlcnRpY2FsID0gYW5jaG9yLm1hdGNoKC9iYXNlbGluZXx0b3B8Ym90dG9tfG1pZGRsZS9naSkgfHwgW107XG4gIHZlcnRpY2FsID0gdmVydGljYWwubGVuZ3RoID09PSAwID8gJ2Jhc2VsaW5lJyA6IHZlcnRpY2FsWzBdO1xuXG4gIHJldHVybiB7IGhvcml6b250YWw6IGhvcml6b250YWwsIHZlcnRpY2FsOiB2ZXJ0aWNhbCB9O1xufVxuXG52YXIgVGV4dFRvU1ZHID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBUZXh0VG9TVkcoZm9udCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBUZXh0VG9TVkcpO1xuXG4gICAgdGhpcy5mb250ID0gZm9udDtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhUZXh0VG9TVkcsIFt7XG4gICAga2V5OiAnZ2V0V2lkdGgnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRXaWR0aCh0ZXh0LCBmb250U2l6ZSwga2VybmluZykge1xuICAgICAgdmFyIGZvbnRTY2FsZSA9IDEgLyB0aGlzLmZvbnQudW5pdHNQZXJFbSAqIGZvbnRTaXplO1xuXG4gICAgICB2YXIgd2lkdGggPSAwO1xuICAgICAgdmFyIGdseXBocyA9IHRoaXMuZm9udC5zdHJpbmdUb0dseXBocyh0ZXh0KTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2x5cGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBnbHlwaCA9IGdseXBoc1tpXTtcblxuICAgICAgICBpZiAoZ2x5cGguYWR2YW5jZVdpZHRoKSB7XG4gICAgICAgICAgd2lkdGggKz0gZ2x5cGguYWR2YW5jZVdpZHRoICogZm9udFNjYWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGtlcm5pbmcgJiYgaSA8IGdseXBocy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgdmFyIGtlcm5pbmdWYWx1ZSA9IHRoaXMuZm9udC5nZXRLZXJuaW5nVmFsdWUoZ2x5cGgsIGdseXBoc1tpICsgMV0pO1xuICAgICAgICAgIHdpZHRoICs9IGtlcm5pbmdWYWx1ZSAqIGZvbnRTY2FsZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHdpZHRoO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2dldEhlaWdodCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEhlaWdodChmb250U2l6ZSkge1xuICAgICAgdmFyIGZvbnRTY2FsZSA9IDEgLyB0aGlzLmZvbnQudW5pdHNQZXJFbSAqIGZvbnRTaXplO1xuICAgICAgcmV0dXJuICh0aGlzLmZvbnQuYXNjZW5kZXIgLSB0aGlzLmZvbnQuZGVzY2VuZGVyKSAqIGZvbnRTY2FsZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdnZXRNZXRyaWNzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0TWV0cmljcyh0ZXh0KSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG4gICAgICB2YXIgZm9udFNpemUgPSBvcHRpb25zLmZvbnRTaXplIHx8IDcyO1xuICAgICAgdmFyIGtlcm5pbmcgPSAna2VybmluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMua2VybmluZyA6IHRydWU7XG4gICAgICB2YXIgYW5jaG9yID0gcGFyc2VBbmNob3JPcHRpb24ob3B0aW9ucy5hbmNob3IgfHwgJycpO1xuXG4gICAgICB2YXIgd2lkdGggPSB0aGlzLmdldFdpZHRoKHRleHQsIGZvbnRTaXplLCBrZXJuaW5nKTtcbiAgICAgIHZhciBoZWlnaHQgPSB0aGlzLmdldEhlaWdodChmb250U2l6ZSk7XG5cbiAgICAgIHZhciBmb250U2NhbGUgPSAxIC8gdGhpcy5mb250LnVuaXRzUGVyRW0gKiBmb250U2l6ZTtcbiAgICAgIHZhciBhc2NlbmRlciA9IHRoaXMuZm9udC5hc2NlbmRlciAqIGZvbnRTY2FsZTtcbiAgICAgIHZhciBkZXNjZW5kZXIgPSB0aGlzLmZvbnQuZGVzY2VuZGVyICogZm9udFNjYWxlO1xuXG4gICAgICB2YXIgeCA9IG9wdGlvbnMueCB8fCAwO1xuICAgICAgc3dpdGNoIChhbmNob3IuaG9yaXpvbnRhbCkge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICB4IC09IDA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgICAgeCAtPSB3aWR0aCAvIDI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICB4IC09IHdpZHRoO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBhbmNob3Igb3B0aW9uOiAnICsgYW5jaG9yLmhvcml6b250YWwpO1xuICAgICAgfVxuXG4gICAgICB2YXIgeSA9IG9wdGlvbnMueSB8fCAwO1xuICAgICAgc3dpdGNoIChhbmNob3IudmVydGljYWwpIHtcbiAgICAgICAgY2FzZSAnYmFzZWxpbmUnOlxuICAgICAgICAgIHkgLT0gYXNjZW5kZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgeSAtPSAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtaWRkbGUnOlxuICAgICAgICAgIHkgLT0gaGVpZ2h0IC8gMjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICB5IC09IGhlaWdodDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gYW5jaG9yIG9wdGlvbjogJyArIGFuY2hvci52ZXJ0aWNhbCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBiYXNlbGluZSA9IHkgKyBhc2NlbmRlcjtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogeCxcbiAgICAgICAgeTogeSxcbiAgICAgICAgYmFzZWxpbmU6IGJhc2VsaW5lLFxuICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICBhc2NlbmRlcjogYXNjZW5kZXIsXG4gICAgICAgIGRlc2NlbmRlcjogZGVzY2VuZGVyXG4gICAgICB9O1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2dldEQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXREKHRleHQpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIHZhciBmb250U2l6ZSA9IG9wdGlvbnMuZm9udFNpemUgfHwgNzI7XG4gICAgICB2YXIga2VybmluZyA9ICdrZXJuaW5nJyBpbiBvcHRpb25zID8gb3B0aW9ucy5rZXJuaW5nIDogdHJ1ZTtcbiAgICAgIHZhciBtZXRyaWNzID0gdGhpcy5nZXRNZXRyaWNzKHRleHQsIG9wdGlvbnMpO1xuICAgICAgdmFyIHBhdGggPSB0aGlzLmZvbnQuZ2V0UGF0aCh0ZXh0LCBtZXRyaWNzLngsIG1ldHJpY3MuYmFzZWxpbmUsIGZvbnRTaXplLCB7IGtlcm5pbmc6IGtlcm5pbmcgfSk7XG5cbiAgICAgIHJldHVybiBwYXRoLnRvUGF0aERhdGEoKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdnZXRQYXRoJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UGF0aCh0ZXh0KSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG4gICAgICB2YXIgYXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKG9wdGlvbnMuYXR0cmlidXRlcyB8fCB7fSkubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIGtleSArICc9XCInICsgb3B0aW9ucy5hdHRyaWJ1dGVzW2tleV0gKyAnXCInO1xuICAgICAgfSkuam9pbignICcpO1xuICAgICAgdmFyIGQgPSB0aGlzLmdldEQodGV4dCwgb3B0aW9ucyk7XG5cbiAgICAgIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiAnPHBhdGggJyArIGF0dHJpYnV0ZXMgKyAnIGQ9XCInICsgZCArICdcIi8+JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICc8cGF0aCBkPVwiJyArIGQgKyAnXCIvPic7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZ2V0U1ZHJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0U1ZHKHRleHQpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIHZhciBtZXRyaWNzID0gdGhpcy5nZXRNZXRyaWNzKHRleHQsIG9wdGlvbnMpO1xuICAgICAgdmFyIHN2ZyA9ICc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB3aWR0aD1cIicgKyBtZXRyaWNzLndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBtZXRyaWNzLmhlaWdodCArICdcIj4nO1xuICAgICAgc3ZnICs9IHRoaXMuZ2V0UGF0aCh0ZXh0LCBvcHRpb25zKTtcbiAgICAgIHN2ZyArPSAnPC9zdmc+JztcblxuICAgICAgcmV0dXJuIHN2ZztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdnZXREZWJ1Z1NWRycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldERlYnVnU1ZHKHRleHQpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIG9wdGlvbnMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpKTtcblxuICAgICAgb3B0aW9ucy54ID0gb3B0aW9ucy54IHx8IDA7XG4gICAgICBvcHRpb25zLnkgPSBvcHRpb25zLnkgfHwgMDtcbiAgICAgIHZhciBtZXRyaWNzID0gdGhpcy5nZXRNZXRyaWNzKHRleHQsIG9wdGlvbnMpO1xuICAgICAgdmFyIGJveCA9IHtcbiAgICAgICAgd2lkdGg6IE1hdGgubWF4KG1ldHJpY3MueCArIG1ldHJpY3Mud2lkdGgsIDApIC0gTWF0aC5taW4obWV0cmljcy54LCAwKSxcbiAgICAgICAgaGVpZ2h0OiBNYXRoLm1heChtZXRyaWNzLnkgKyBtZXRyaWNzLmhlaWdodCwgMCkgLSBNYXRoLm1pbihtZXRyaWNzLnksIDApXG4gICAgICB9O1xuICAgICAgdmFyIG9yaWdpbiA9IHtcbiAgICAgICAgeDogYm94LndpZHRoIC0gTWF0aC5tYXgobWV0cmljcy54ICsgbWV0cmljcy53aWR0aCwgMCksXG4gICAgICAgIHk6IGJveC5oZWlnaHQgLSBNYXRoLm1heChtZXRyaWNzLnkgKyBtZXRyaWNzLmhlaWdodCwgMClcbiAgICAgIH07XG5cbiAgICAgIC8vIFNoaWZ0IHRleHQgYmFzZWQgb24gb3JpZ2luXG4gICAgICBvcHRpb25zLnggKz0gb3JpZ2luLng7XG4gICAgICBvcHRpb25zLnkgKz0gb3JpZ2luLnk7XG5cbiAgICAgIHZhciBzdmcgPSAnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgd2lkdGg9XCInICsgYm94LndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBib3guaGVpZ2h0ICsgJ1wiPic7XG4gICAgICBzdmcgKz0gJzxwYXRoIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwicmVkXCIgc3Ryb2tlLXdpZHRoPVwiMVwiIGQ9XCJNMCwnICsgb3JpZ2luLnkgKyAnTCcgKyBib3gud2lkdGggKyAnLCcgKyBvcmlnaW4ueSArICdcIi8+JzsgLy8gWCBBeGlzXG4gICAgICBzdmcgKz0gJzxwYXRoIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwicmVkXCIgc3Ryb2tlLXdpZHRoPVwiMVwiIGQ9XCJNJyArIG9yaWdpbi54ICsgJywwTCcgKyBvcmlnaW4ueCArICcsJyArIGJveC5oZWlnaHQgKyAnXCIvPic7IC8vIFkgQXhpc1xuICAgICAgc3ZnICs9IHRoaXMuZ2V0UGF0aCh0ZXh0LCBvcHRpb25zKTtcbiAgICAgIHN2ZyArPSAnPC9zdmc+JztcblxuICAgICAgcmV0dXJuIHN2ZztcbiAgICB9XG4gIH1dLCBbe1xuICAgIGtleTogJ2xvYWRTeW5jJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZFN5bmMoKSB7XG4gICAgICB2YXIgZmlsZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IERFRkFVTFRfRk9OVCA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgcmV0dXJuIG5ldyBUZXh0VG9TVkcoX29wZW50eXBlMi5kZWZhdWx0LmxvYWRTeW5jKGZpbGUpKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdsb2FkJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZCh1cmwsIGNiKSB7XG4gICAgICBfb3BlbnR5cGUyLmRlZmF1bHQubG9hZCh1cmwsIGZ1bmN0aW9uIChlcnIsIGZvbnQpIHtcbiAgICAgICAgaWYgKGVyciAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBjYihlcnIsIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIG5ldyBUZXh0VG9TVkcoZm9udCkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIFRleHRUb1NWRztcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gVGV4dFRvU1ZHO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cy5kZWZhdWx0OyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE2IEhpZGVraSBTaGlyb1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9idWlsZC9zcmMvaW5kZXguanMnKTtcbiIsInZhciBUSU5GX09LID0gMDtcbnZhciBUSU5GX0RBVEFfRVJST1IgPSAtMztcblxuZnVuY3Rpb24gVHJlZSgpIHtcbiAgdGhpcy50YWJsZSA9IG5ldyBVaW50MTZBcnJheSgxNik7ICAgLyogdGFibGUgb2YgY29kZSBsZW5ndGggY291bnRzICovXG4gIHRoaXMudHJhbnMgPSBuZXcgVWludDE2QXJyYXkoMjg4KTsgIC8qIGNvZGUgLT4gc3ltYm9sIHRyYW5zbGF0aW9uIHRhYmxlICovXG59XG5cbmZ1bmN0aW9uIERhdGEoc291cmNlLCBkZXN0KSB7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xuICB0aGlzLnNvdXJjZUluZGV4ID0gMDtcbiAgdGhpcy50YWcgPSAwO1xuICB0aGlzLmJpdGNvdW50ID0gMDtcbiAgXG4gIHRoaXMuZGVzdCA9IGRlc3Q7XG4gIHRoaXMuZGVzdExlbiA9IDA7XG4gIFxuICB0aGlzLmx0cmVlID0gbmV3IFRyZWUoKTsgIC8qIGR5bmFtaWMgbGVuZ3RoL3N5bWJvbCB0cmVlICovXG4gIHRoaXMuZHRyZWUgPSBuZXcgVHJlZSgpOyAgLyogZHluYW1pYyBkaXN0YW5jZSB0cmVlICovXG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqXG4gKiAtLSB1bmluaXRpYWxpemVkIGdsb2JhbCBkYXRhIChzdGF0aWMgc3RydWN0dXJlcykgLS0gKlxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbnZhciBzbHRyZWUgPSBuZXcgVHJlZSgpO1xudmFyIHNkdHJlZSA9IG5ldyBUcmVlKCk7XG5cbi8qIGV4dHJhIGJpdHMgYW5kIGJhc2UgdGFibGVzIGZvciBsZW5ndGggY29kZXMgKi9cbnZhciBsZW5ndGhfYml0cyA9IG5ldyBVaW50OEFycmF5KDMwKTtcbnZhciBsZW5ndGhfYmFzZSA9IG5ldyBVaW50MTZBcnJheSgzMCk7XG5cbi8qIGV4dHJhIGJpdHMgYW5kIGJhc2UgdGFibGVzIGZvciBkaXN0YW5jZSBjb2RlcyAqL1xudmFyIGRpc3RfYml0cyA9IG5ldyBVaW50OEFycmF5KDMwKTtcbnZhciBkaXN0X2Jhc2UgPSBuZXcgVWludDE2QXJyYXkoMzApO1xuXG4vKiBzcGVjaWFsIG9yZGVyaW5nIG9mIGNvZGUgbGVuZ3RoIGNvZGVzICovXG52YXIgY2xjaWR4ID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAxNiwgMTcsIDE4LCAwLCA4LCA3LCA5LCA2LFxuICAxMCwgNSwgMTEsIDQsIDEyLCAzLCAxMywgMixcbiAgMTQsIDEsIDE1XG5dKTtcblxuLyogdXNlZCBieSB0aW5mX2RlY29kZV90cmVlcywgYXZvaWRzIGFsbG9jYXRpb25zIGV2ZXJ5IGNhbGwgKi9cbnZhciBjb2RlX3RyZWUgPSBuZXcgVHJlZSgpO1xudmFyIGxlbmd0aHMgPSBuZXcgVWludDhBcnJheSgyODggKyAzMik7XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICpcbiAqIC0tIHV0aWxpdHkgZnVuY3Rpb25zIC0tICpcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8qIGJ1aWxkIGV4dHJhIGJpdHMgYW5kIGJhc2UgdGFibGVzICovXG5mdW5jdGlvbiB0aW5mX2J1aWxkX2JpdHNfYmFzZShiaXRzLCBiYXNlLCBkZWx0YSwgZmlyc3QpIHtcbiAgdmFyIGksIHN1bTtcblxuICAvKiBidWlsZCBiaXRzIHRhYmxlICovXG4gIGZvciAoaSA9IDA7IGkgPCBkZWx0YTsgKytpKSBiaXRzW2ldID0gMDtcbiAgZm9yIChpID0gMDsgaSA8IDMwIC0gZGVsdGE7ICsraSkgYml0c1tpICsgZGVsdGFdID0gaSAvIGRlbHRhIHwgMDtcblxuICAvKiBidWlsZCBiYXNlIHRhYmxlICovXG4gIGZvciAoc3VtID0gZmlyc3QsIGkgPSAwOyBpIDwgMzA7ICsraSkge1xuICAgIGJhc2VbaV0gPSBzdW07XG4gICAgc3VtICs9IDEgPDwgYml0c1tpXTtcbiAgfVxufVxuXG4vKiBidWlsZCB0aGUgZml4ZWQgaHVmZm1hbiB0cmVlcyAqL1xuZnVuY3Rpb24gdGluZl9idWlsZF9maXhlZF90cmVlcyhsdCwgZHQpIHtcbiAgdmFyIGk7XG5cbiAgLyogYnVpbGQgZml4ZWQgbGVuZ3RoIHRyZWUgKi9cbiAgZm9yIChpID0gMDsgaSA8IDc7ICsraSkgbHQudGFibGVbaV0gPSAwO1xuXG4gIGx0LnRhYmxlWzddID0gMjQ7XG4gIGx0LnRhYmxlWzhdID0gMTUyO1xuICBsdC50YWJsZVs5XSA9IDExMjtcblxuICBmb3IgKGkgPSAwOyBpIDwgMjQ7ICsraSkgbHQudHJhbnNbaV0gPSAyNTYgKyBpO1xuICBmb3IgKGkgPSAwOyBpIDwgMTQ0OyArK2kpIGx0LnRyYW5zWzI0ICsgaV0gPSBpO1xuICBmb3IgKGkgPSAwOyBpIDwgODsgKytpKSBsdC50cmFuc1syNCArIDE0NCArIGldID0gMjgwICsgaTtcbiAgZm9yIChpID0gMDsgaSA8IDExMjsgKytpKSBsdC50cmFuc1syNCArIDE0NCArIDggKyBpXSA9IDE0NCArIGk7XG5cbiAgLyogYnVpbGQgZml4ZWQgZGlzdGFuY2UgdHJlZSAqL1xuICBmb3IgKGkgPSAwOyBpIDwgNTsgKytpKSBkdC50YWJsZVtpXSA9IDA7XG5cbiAgZHQudGFibGVbNV0gPSAzMjtcblxuICBmb3IgKGkgPSAwOyBpIDwgMzI7ICsraSkgZHQudHJhbnNbaV0gPSBpO1xufVxuXG4vKiBnaXZlbiBhbiBhcnJheSBvZiBjb2RlIGxlbmd0aHMsIGJ1aWxkIGEgdHJlZSAqL1xudmFyIG9mZnMgPSBuZXcgVWludDE2QXJyYXkoMTYpO1xuXG5mdW5jdGlvbiB0aW5mX2J1aWxkX3RyZWUodCwgbGVuZ3Rocywgb2ZmLCBudW0pIHtcbiAgdmFyIGksIHN1bTtcblxuICAvKiBjbGVhciBjb2RlIGxlbmd0aCBjb3VudCB0YWJsZSAqL1xuICBmb3IgKGkgPSAwOyBpIDwgMTY7ICsraSkgdC50YWJsZVtpXSA9IDA7XG5cbiAgLyogc2NhbiBzeW1ib2wgbGVuZ3RocywgYW5kIHN1bSBjb2RlIGxlbmd0aCBjb3VudHMgKi9cbiAgZm9yIChpID0gMDsgaSA8IG51bTsgKytpKSB0LnRhYmxlW2xlbmd0aHNbb2ZmICsgaV1dKys7XG5cbiAgdC50YWJsZVswXSA9IDA7XG5cbiAgLyogY29tcHV0ZSBvZmZzZXQgdGFibGUgZm9yIGRpc3RyaWJ1dGlvbiBzb3J0ICovXG4gIGZvciAoc3VtID0gMCwgaSA9IDA7IGkgPCAxNjsgKytpKSB7XG4gICAgb2Zmc1tpXSA9IHN1bTtcbiAgICBzdW0gKz0gdC50YWJsZVtpXTtcbiAgfVxuXG4gIC8qIGNyZWF0ZSBjb2RlLT5zeW1ib2wgdHJhbnNsYXRpb24gdGFibGUgKHN5bWJvbHMgc29ydGVkIGJ5IGNvZGUpICovXG4gIGZvciAoaSA9IDA7IGkgPCBudW07ICsraSkge1xuICAgIGlmIChsZW5ndGhzW29mZiArIGldKSB0LnRyYW5zW29mZnNbbGVuZ3Roc1tvZmYgKyBpXV0rK10gPSBpO1xuICB9XG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKlxuICogLS0gZGVjb2RlIGZ1bmN0aW9ucyAtLSAqXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8qIGdldCBvbmUgYml0IGZyb20gc291cmNlIHN0cmVhbSAqL1xuZnVuY3Rpb24gdGluZl9nZXRiaXQoZCkge1xuICAvKiBjaGVjayBpZiB0YWcgaXMgZW1wdHkgKi9cbiAgaWYgKCFkLmJpdGNvdW50LS0pIHtcbiAgICAvKiBsb2FkIG5leHQgdGFnICovXG4gICAgZC50YWcgPSBkLnNvdXJjZVtkLnNvdXJjZUluZGV4KytdO1xuICAgIGQuYml0Y291bnQgPSA3O1xuICB9XG5cbiAgLyogc2hpZnQgYml0IG91dCBvZiB0YWcgKi9cbiAgdmFyIGJpdCA9IGQudGFnICYgMTtcbiAgZC50YWcgPj4+PSAxO1xuXG4gIHJldHVybiBiaXQ7XG59XG5cbi8qIHJlYWQgYSBudW0gYml0IHZhbHVlIGZyb20gYSBzdHJlYW0gYW5kIGFkZCBiYXNlICovXG5mdW5jdGlvbiB0aW5mX3JlYWRfYml0cyhkLCBudW0sIGJhc2UpIHtcbiAgaWYgKCFudW0pXG4gICAgcmV0dXJuIGJhc2U7XG5cbiAgd2hpbGUgKGQuYml0Y291bnQgPCAyNCkge1xuICAgIGQudGFnIHw9IGQuc291cmNlW2Quc291cmNlSW5kZXgrK10gPDwgZC5iaXRjb3VudDtcbiAgICBkLmJpdGNvdW50ICs9IDg7XG4gIH1cblxuICB2YXIgdmFsID0gZC50YWcgJiAoMHhmZmZmID4+PiAoMTYgLSBudW0pKTtcbiAgZC50YWcgPj4+PSBudW07XG4gIGQuYml0Y291bnQgLT0gbnVtO1xuICByZXR1cm4gdmFsICsgYmFzZTtcbn1cblxuLyogZ2l2ZW4gYSBkYXRhIHN0cmVhbSBhbmQgYSB0cmVlLCBkZWNvZGUgYSBzeW1ib2wgKi9cbmZ1bmN0aW9uIHRpbmZfZGVjb2RlX3N5bWJvbChkLCB0KSB7XG4gIHdoaWxlIChkLmJpdGNvdW50IDwgMjQpIHtcbiAgICBkLnRhZyB8PSBkLnNvdXJjZVtkLnNvdXJjZUluZGV4KytdIDw8IGQuYml0Y291bnQ7XG4gICAgZC5iaXRjb3VudCArPSA4O1xuICB9XG4gIFxuICB2YXIgc3VtID0gMCwgY3VyID0gMCwgbGVuID0gMDtcbiAgdmFyIHRhZyA9IGQudGFnO1xuXG4gIC8qIGdldCBtb3JlIGJpdHMgd2hpbGUgY29kZSB2YWx1ZSBpcyBhYm92ZSBzdW0gKi9cbiAgZG8ge1xuICAgIGN1ciA9IDIgKiBjdXIgKyAodGFnICYgMSk7XG4gICAgdGFnID4+Pj0gMTtcbiAgICArK2xlbjtcblxuICAgIHN1bSArPSB0LnRhYmxlW2xlbl07XG4gICAgY3VyIC09IHQudGFibGVbbGVuXTtcbiAgfSB3aGlsZSAoY3VyID49IDApO1xuICBcbiAgZC50YWcgPSB0YWc7XG4gIGQuYml0Y291bnQgLT0gbGVuO1xuXG4gIHJldHVybiB0LnRyYW5zW3N1bSArIGN1cl07XG59XG5cbi8qIGdpdmVuIGEgZGF0YSBzdHJlYW0sIGRlY29kZSBkeW5hbWljIHRyZWVzIGZyb20gaXQgKi9cbmZ1bmN0aW9uIHRpbmZfZGVjb2RlX3RyZWVzKGQsIGx0LCBkdCkge1xuICB2YXIgaGxpdCwgaGRpc3QsIGhjbGVuO1xuICB2YXIgaSwgbnVtLCBsZW5ndGg7XG5cbiAgLyogZ2V0IDUgYml0cyBITElUICgyNTctMjg2KSAqL1xuICBobGl0ID0gdGluZl9yZWFkX2JpdHMoZCwgNSwgMjU3KTtcblxuICAvKiBnZXQgNSBiaXRzIEhESVNUICgxLTMyKSAqL1xuICBoZGlzdCA9IHRpbmZfcmVhZF9iaXRzKGQsIDUsIDEpO1xuXG4gIC8qIGdldCA0IGJpdHMgSENMRU4gKDQtMTkpICovXG4gIGhjbGVuID0gdGluZl9yZWFkX2JpdHMoZCwgNCwgNCk7XG5cbiAgZm9yIChpID0gMDsgaSA8IDE5OyArK2kpIGxlbmd0aHNbaV0gPSAwO1xuXG4gIC8qIHJlYWQgY29kZSBsZW5ndGhzIGZvciBjb2RlIGxlbmd0aCBhbHBoYWJldCAqL1xuICBmb3IgKGkgPSAwOyBpIDwgaGNsZW47ICsraSkge1xuICAgIC8qIGdldCAzIGJpdHMgY29kZSBsZW5ndGggKDAtNykgKi9cbiAgICB2YXIgY2xlbiA9IHRpbmZfcmVhZF9iaXRzKGQsIDMsIDApO1xuICAgIGxlbmd0aHNbY2xjaWR4W2ldXSA9IGNsZW47XG4gIH1cblxuICAvKiBidWlsZCBjb2RlIGxlbmd0aCB0cmVlICovXG4gIHRpbmZfYnVpbGRfdHJlZShjb2RlX3RyZWUsIGxlbmd0aHMsIDAsIDE5KTtcblxuICAvKiBkZWNvZGUgY29kZSBsZW5ndGhzIGZvciB0aGUgZHluYW1pYyB0cmVlcyAqL1xuICBmb3IgKG51bSA9IDA7IG51bSA8IGhsaXQgKyBoZGlzdDspIHtcbiAgICB2YXIgc3ltID0gdGluZl9kZWNvZGVfc3ltYm9sKGQsIGNvZGVfdHJlZSk7XG5cbiAgICBzd2l0Y2ggKHN5bSkge1xuICAgICAgY2FzZSAxNjpcbiAgICAgICAgLyogY29weSBwcmV2aW91cyBjb2RlIGxlbmd0aCAzLTYgdGltZXMgKHJlYWQgMiBiaXRzKSAqL1xuICAgICAgICB2YXIgcHJldiA9IGxlbmd0aHNbbnVtIC0gMV07XG4gICAgICAgIGZvciAobGVuZ3RoID0gdGluZl9yZWFkX2JpdHMoZCwgMiwgMyk7IGxlbmd0aDsgLS1sZW5ndGgpIHtcbiAgICAgICAgICBsZW5ndGhzW251bSsrXSA9IHByZXY7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE3OlxuICAgICAgICAvKiByZXBlYXQgY29kZSBsZW5ndGggMCBmb3IgMy0xMCB0aW1lcyAocmVhZCAzIGJpdHMpICovXG4gICAgICAgIGZvciAobGVuZ3RoID0gdGluZl9yZWFkX2JpdHMoZCwgMywgMyk7IGxlbmd0aDsgLS1sZW5ndGgpIHtcbiAgICAgICAgICBsZW5ndGhzW251bSsrXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE4OlxuICAgICAgICAvKiByZXBlYXQgY29kZSBsZW5ndGggMCBmb3IgMTEtMTM4IHRpbWVzIChyZWFkIDcgYml0cykgKi9cbiAgICAgICAgZm9yIChsZW5ndGggPSB0aW5mX3JlYWRfYml0cyhkLCA3LCAxMSk7IGxlbmd0aDsgLS1sZW5ndGgpIHtcbiAgICAgICAgICBsZW5ndGhzW251bSsrXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvKiB2YWx1ZXMgMC0xNSByZXByZXNlbnQgdGhlIGFjdHVhbCBjb2RlIGxlbmd0aHMgKi9cbiAgICAgICAgbGVuZ3Roc1tudW0rK10gPSBzeW07XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8qIGJ1aWxkIGR5bmFtaWMgdHJlZXMgKi9cbiAgdGluZl9idWlsZF90cmVlKGx0LCBsZW5ndGhzLCAwLCBobGl0KTtcbiAgdGluZl9idWlsZF90cmVlKGR0LCBsZW5ndGhzLCBobGl0LCBoZGlzdCk7XG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICpcbiAqIC0tIGJsb2NrIGluZmxhdGUgZnVuY3Rpb25zIC0tICpcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8qIGdpdmVuIGEgc3RyZWFtIGFuZCB0d28gdHJlZXMsIGluZmxhdGUgYSBibG9jayBvZiBkYXRhICovXG5mdW5jdGlvbiB0aW5mX2luZmxhdGVfYmxvY2tfZGF0YShkLCBsdCwgZHQpIHtcbiAgd2hpbGUgKDEpIHtcbiAgICB2YXIgc3ltID0gdGluZl9kZWNvZGVfc3ltYm9sKGQsIGx0KTtcblxuICAgIC8qIGNoZWNrIGZvciBlbmQgb2YgYmxvY2sgKi9cbiAgICBpZiAoc3ltID09PSAyNTYpIHtcbiAgICAgIHJldHVybiBUSU5GX09LO1xuICAgIH1cblxuICAgIGlmIChzeW0gPCAyNTYpIHtcbiAgICAgIGQuZGVzdFtkLmRlc3RMZW4rK10gPSBzeW07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsZW5ndGgsIGRpc3QsIG9mZnM7XG4gICAgICB2YXIgaTtcblxuICAgICAgc3ltIC09IDI1NztcblxuICAgICAgLyogcG9zc2libHkgZ2V0IG1vcmUgYml0cyBmcm9tIGxlbmd0aCBjb2RlICovXG4gICAgICBsZW5ndGggPSB0aW5mX3JlYWRfYml0cyhkLCBsZW5ndGhfYml0c1tzeW1dLCBsZW5ndGhfYmFzZVtzeW1dKTtcblxuICAgICAgZGlzdCA9IHRpbmZfZGVjb2RlX3N5bWJvbChkLCBkdCk7XG5cbiAgICAgIC8qIHBvc3NpYmx5IGdldCBtb3JlIGJpdHMgZnJvbSBkaXN0YW5jZSBjb2RlICovXG4gICAgICBvZmZzID0gZC5kZXN0TGVuIC0gdGluZl9yZWFkX2JpdHMoZCwgZGlzdF9iaXRzW2Rpc3RdLCBkaXN0X2Jhc2VbZGlzdF0pO1xuXG4gICAgICAvKiBjb3B5IG1hdGNoICovXG4gICAgICBmb3IgKGkgPSBvZmZzOyBpIDwgb2ZmcyArIGxlbmd0aDsgKytpKSB7XG4gICAgICAgIGQuZGVzdFtkLmRlc3RMZW4rK10gPSBkLmRlc3RbaV07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qIGluZmxhdGUgYW4gdW5jb21wcmVzc2VkIGJsb2NrIG9mIGRhdGEgKi9cbmZ1bmN0aW9uIHRpbmZfaW5mbGF0ZV91bmNvbXByZXNzZWRfYmxvY2soZCkge1xuICB2YXIgbGVuZ3RoLCBpbnZsZW5ndGg7XG4gIHZhciBpO1xuICBcbiAgLyogdW5yZWFkIGZyb20gYml0YnVmZmVyICovXG4gIHdoaWxlIChkLmJpdGNvdW50ID4gOCkge1xuICAgIGQuc291cmNlSW5kZXgtLTtcbiAgICBkLmJpdGNvdW50IC09IDg7XG4gIH1cblxuICAvKiBnZXQgbGVuZ3RoICovXG4gIGxlbmd0aCA9IGQuc291cmNlW2Quc291cmNlSW5kZXggKyAxXTtcbiAgbGVuZ3RoID0gMjU2ICogbGVuZ3RoICsgZC5zb3VyY2VbZC5zb3VyY2VJbmRleF07XG5cbiAgLyogZ2V0IG9uZSdzIGNvbXBsZW1lbnQgb2YgbGVuZ3RoICovXG4gIGludmxlbmd0aCA9IGQuc291cmNlW2Quc291cmNlSW5kZXggKyAzXTtcbiAgaW52bGVuZ3RoID0gMjU2ICogaW52bGVuZ3RoICsgZC5zb3VyY2VbZC5zb3VyY2VJbmRleCArIDJdO1xuXG4gIC8qIGNoZWNrIGxlbmd0aCAqL1xuICBpZiAobGVuZ3RoICE9PSAofmludmxlbmd0aCAmIDB4MDAwMGZmZmYpKVxuICAgIHJldHVybiBUSU5GX0RBVEFfRVJST1I7XG5cbiAgZC5zb3VyY2VJbmRleCArPSA0O1xuXG4gIC8qIGNvcHkgYmxvY2sgKi9cbiAgZm9yIChpID0gbGVuZ3RoOyBpOyAtLWkpXG4gICAgZC5kZXN0W2QuZGVzdExlbisrXSA9IGQuc291cmNlW2Quc291cmNlSW5kZXgrK107XG5cbiAgLyogbWFrZSBzdXJlIHdlIHN0YXJ0IG5leHQgYmxvY2sgb24gYSBieXRlIGJvdW5kYXJ5ICovXG4gIGQuYml0Y291bnQgPSAwO1xuXG4gIHJldHVybiBUSU5GX09LO1xufVxuXG4vKiBpbmZsYXRlIHN0cmVhbSBmcm9tIHNvdXJjZSB0byBkZXN0ICovXG5mdW5jdGlvbiB0aW5mX3VuY29tcHJlc3Moc291cmNlLCBkZXN0KSB7XG4gIHZhciBkID0gbmV3IERhdGEoc291cmNlLCBkZXN0KTtcbiAgdmFyIGJmaW5hbCwgYnR5cGUsIHJlcztcblxuICBkbyB7XG4gICAgLyogcmVhZCBmaW5hbCBibG9jayBmbGFnICovXG4gICAgYmZpbmFsID0gdGluZl9nZXRiaXQoZCk7XG5cbiAgICAvKiByZWFkIGJsb2NrIHR5cGUgKDIgYml0cykgKi9cbiAgICBidHlwZSA9IHRpbmZfcmVhZF9iaXRzKGQsIDIsIDApO1xuXG4gICAgLyogZGVjb21wcmVzcyBibG9jayAqL1xuICAgIHN3aXRjaCAoYnR5cGUpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgLyogZGVjb21wcmVzcyB1bmNvbXByZXNzZWQgYmxvY2sgKi9cbiAgICAgICAgcmVzID0gdGluZl9pbmZsYXRlX3VuY29tcHJlc3NlZF9ibG9jayhkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIC8qIGRlY29tcHJlc3MgYmxvY2sgd2l0aCBmaXhlZCBodWZmbWFuIHRyZWVzICovXG4gICAgICAgIHJlcyA9IHRpbmZfaW5mbGF0ZV9ibG9ja19kYXRhKGQsIHNsdHJlZSwgc2R0cmVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIC8qIGRlY29tcHJlc3MgYmxvY2sgd2l0aCBkeW5hbWljIGh1ZmZtYW4gdHJlZXMgKi9cbiAgICAgICAgdGluZl9kZWNvZGVfdHJlZXMoZCwgZC5sdHJlZSwgZC5kdHJlZSk7XG4gICAgICAgIHJlcyA9IHRpbmZfaW5mbGF0ZV9ibG9ja19kYXRhKGQsIGQubHRyZWUsIGQuZHRyZWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJlcyA9IFRJTkZfREFUQV9FUlJPUjtcbiAgICB9XG5cbiAgICBpZiAocmVzICE9PSBUSU5GX09LKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhIGVycm9yJyk7XG5cbiAgfSB3aGlsZSAoIWJmaW5hbCk7XG5cbiAgaWYgKGQuZGVzdExlbiA8IGQuZGVzdC5sZW5ndGgpIHtcbiAgICBpZiAodHlwZW9mIGQuZGVzdC5zbGljZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBkLmRlc3Quc2xpY2UoMCwgZC5kZXN0TGVuKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZC5kZXN0LnN1YmFycmF5KDAsIGQuZGVzdExlbik7XG4gIH1cbiAgXG4gIHJldHVybiBkLmRlc3Q7XG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tICpcbiAqIC0tIGluaXRpYWxpemF0aW9uIC0tICpcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8qIGJ1aWxkIGZpeGVkIGh1ZmZtYW4gdHJlZXMgKi9cbnRpbmZfYnVpbGRfZml4ZWRfdHJlZXMoc2x0cmVlLCBzZHRyZWUpO1xuXG4vKiBidWlsZCBleHRyYSBiaXRzIGFuZCBiYXNlIHRhYmxlcyAqL1xudGluZl9idWlsZF9iaXRzX2Jhc2UobGVuZ3RoX2JpdHMsIGxlbmd0aF9iYXNlLCA0LCAzKTtcbnRpbmZfYnVpbGRfYml0c19iYXNlKGRpc3RfYml0cywgZGlzdF9iYXNlLCAyLCAxKTtcblxuLyogZml4IGEgc3BlY2lhbCBjYXNlICovXG5sZW5ndGhfYml0c1syOF0gPSAwO1xubGVuZ3RoX2Jhc2VbMjhdID0gMjU4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRpbmZfdW5jb21wcmVzcztcbiJdfQ==

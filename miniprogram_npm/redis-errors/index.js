module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1779907970508, function(require, module, exports) {


const Errors = process.version.charCodeAt(1) < 55 && process.version.charCodeAt(2) === 46
  ? require('./lib/old') // Node.js < 7
  : require('./lib/modern')

module.exports = Errors

}, function(modId) {var map = {"./lib/old":1779907970509,"./lib/modern":1779907970510}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1779907970509, function(require, module, exports) {


const assert = require('assert')
const util = require('util')

// RedisError

function RedisError (message) {
  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  })
  Error.captureStackTrace(this, this.constructor)
}

util.inherits(RedisError, Error)

Object.defineProperty(RedisError.prototype, 'name', {
  value: 'RedisError',
  configurable: true,
  writable: true
})

// ParserError

function ParserError (message, buffer, offset) {
  assert(buffer)
  assert.strictEqual(typeof offset, 'number')

  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  })

  const tmp = Error.stackTraceLimit
  Error.stackTraceLimit = 2
  Error.captureStackTrace(this, this.constructor)
  Error.stackTraceLimit = tmp
  this.offset = offset
  this.buffer = buffer
}

util.inherits(ParserError, RedisError)

Object.defineProperty(ParserError.prototype, 'name', {
  value: 'ParserError',
  configurable: true,
  writable: true
})

// ReplyError

function ReplyError (message) {
  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  })
  const tmp = Error.stackTraceLimit
  Error.stackTraceLimit = 2
  Error.captureStackTrace(this, this.constructor)
  Error.stackTraceLimit = tmp
}

util.inherits(ReplyError, RedisError)

Object.defineProperty(ReplyError.prototype, 'name', {
  value: 'ReplyError',
  configurable: true,
  writable: true
})

// AbortError

function AbortError (message) {
  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  })
  Error.captureStackTrace(this, this.constructor)
}

util.inherits(AbortError, RedisError)

Object.defineProperty(AbortError.prototype, 'name', {
  value: 'AbortError',
  configurable: true,
  writable: true
})

// InterruptError

function InterruptError (message) {
  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  })
  Error.captureStackTrace(this, this.constructor)
}

util.inherits(InterruptError, AbortError)

Object.defineProperty(InterruptError.prototype, 'name', {
  value: 'InterruptError',
  configurable: true,
  writable: true
})

module.exports = {
  RedisError,
  ParserError,
  ReplyError,
  AbortError,
  InterruptError
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1779907970510, function(require, module, exports) {


const assert = require('assert')

class RedisError extends Error {
  get name () {
    return this.constructor.name
  }
}

class ParserError extends RedisError {
  constructor (message, buffer, offset) {
    assert(buffer)
    assert.strictEqual(typeof offset, 'number')

    const tmp = Error.stackTraceLimit
    Error.stackTraceLimit = 2
    super(message)
    Error.stackTraceLimit = tmp
    this.offset = offset
    this.buffer = buffer
  }

  get name () {
    return this.constructor.name
  }
}

class ReplyError extends RedisError {
  constructor (message) {
    const tmp = Error.stackTraceLimit
    Error.stackTraceLimit = 2
    super(message)
    Error.stackTraceLimit = tmp
  }
  get name () {
    return this.constructor.name
  }
}

class AbortError extends RedisError {
  get name () {
    return this.constructor.name
  }
}

class InterruptError extends AbortError {
  get name () {
    return this.constructor.name
  }
}

module.exports = {
  RedisError,
  ParserError,
  ReplyError,
  AbortError,
  InterruptError
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1779907970508);
})()
//miniprogram-npm-outsideDeps=["assert","util"]
//# sourceMappingURL=index.js.map
module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1779907970378, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeyIndexes = exports.hasFlag = exports.exists = exports.list = void 0;
const commands_json_1 = __importDefault(require("./commands.json"));
/**
 * Redis command list
 *
 * All commands are lowercased.
 */
exports.list = Object.keys(commands_json_1.default);
const flags = {};
exports.list.forEach((commandName) => {
    flags[commandName] = commands_json_1.default[commandName].flags.reduce(function (flags, flag) {
        flags[flag] = true;
        return flags;
    }, {});
});
/**
 * Check if the command exists
 */
function exists(commandName, options) {
    commandName = (options === null || options === void 0 ? void 0 : options.caseInsensitive)
        ? String(commandName).toLowerCase()
        : commandName;
    return Boolean(commands_json_1.default[commandName]);
}
exports.exists = exists;
/**
 * Check if the command has the flag
 *
 * Some of possible flags: readonly, noscript, loading
 */
function hasFlag(commandName, flag, options) {
    commandName = (options === null || options === void 0 ? void 0 : options.nameCaseInsensitive)
        ? String(commandName).toLowerCase()
        : commandName;
    if (!flags[commandName]) {
        throw new Error("Unknown command " + commandName);
    }
    return Boolean(flags[commandName][flag]);
}
exports.hasFlag = hasFlag;
/**
 * Get indexes of keys in the command arguments
 *
 * @example
 * ```javascript
 * getKeyIndexes('set', ['key', 'value']) // [0]
 * getKeyIndexes('mget', ['key1', 'key2']) // [0, 1]
 * ```
 */
function getKeyIndexes(commandName, args, options) {
    commandName = (options === null || options === void 0 ? void 0 : options.nameCaseInsensitive)
        ? String(commandName).toLowerCase()
        : commandName;
    const command = commands_json_1.default[commandName];
    if (!command) {
        throw new Error("Unknown command " + commandName);
    }
    if (!Array.isArray(args)) {
        throw new Error("Expect args to be an array");
    }
    const keys = [];
    const parseExternalKey = Boolean(options && options.parseExternalKey);
    const takeDynamicKeys = (args, startIndex) => {
        const keys = [];
        const keyStop = Number(args[startIndex]);
        for (let i = 0; i < keyStop; i++) {
            keys.push(i + startIndex + 1);
        }
        return keys;
    };
    const takeKeyAfterToken = (args, startIndex, token) => {
        for (let i = startIndex; i < args.length - 1; i += 1) {
            if (String(args[i]).toLowerCase() === token.toLowerCase()) {
                return i + 1;
            }
        }
        return null;
    };
    switch (commandName) {
        case "zunionstore":
        case "zinterstore":
        case "zdiffstore":
            keys.push(0, ...takeDynamicKeys(args, 1));
            break;
        case "eval":
        case "evalsha":
        case "eval_ro":
        case "evalsha_ro":
        case "fcall":
        case "fcall_ro":
        case "blmpop":
        case "bzmpop":
            keys.push(...takeDynamicKeys(args, 1));
            break;
        case "sintercard":
        case "lmpop":
        case "zunion":
        case "zinter":
        case "zmpop":
        case "zintercard":
        case "zdiff": {
            keys.push(...takeDynamicKeys(args, 0));
            break;
        }
        case "msetex": {
            const numKeys = Number(args[0]);
            for (let i = 0; i < numKeys; i++) {
                keys.push(1 + i * 2);
            }
            break;
        }
        case "georadius": {
            keys.push(0);
            const storeKey = takeKeyAfterToken(args, 5, "STORE");
            if (storeKey)
                keys.push(storeKey);
            const distKey = takeKeyAfterToken(args, 5, "STOREDIST");
            if (distKey)
                keys.push(distKey);
            break;
        }
        case "georadiusbymember": {
            keys.push(0);
            const storeKey = takeKeyAfterToken(args, 4, "STORE");
            if (storeKey)
                keys.push(storeKey);
            const distKey = takeKeyAfterToken(args, 4, "STOREDIST");
            if (distKey)
                keys.push(distKey);
            break;
        }
        case "sort":
        case "sort_ro":
            keys.push(0);
            for (let i = 1; i < args.length - 1; i++) {
                let arg = args[i];
                if (typeof arg !== "string") {
                    continue;
                }
                const directive = arg.toUpperCase();
                if (directive === "GET") {
                    i += 1;
                    arg = args[i];
                    if (arg !== "#") {
                        if (parseExternalKey) {
                            keys.push([i, getExternalKeyNameLength(arg)]);
                        }
                        else {
                            keys.push(i);
                        }
                    }
                }
                else if (directive === "BY") {
                    i += 1;
                    if (parseExternalKey) {
                        keys.push([i, getExternalKeyNameLength(args[i])]);
                    }
                    else {
                        keys.push(i);
                    }
                }
                else if (directive === "STORE") {
                    i += 1;
                    keys.push(i);
                }
            }
            break;
        case "migrate":
            if (args[2] === "") {
                for (let i = 5; i < args.length - 1; i++) {
                    const arg = args[i];
                    if (typeof arg === "string" && arg.toUpperCase() === "KEYS") {
                        for (let j = i + 1; j < args.length; j++) {
                            keys.push(j);
                        }
                        break;
                    }
                }
            }
            else {
                keys.push(2);
            }
            break;
        case "xreadgroup":
        case "xread":
            // Keys are 1st half of the args after STREAMS argument.
            for (let i = commandName === "xread" ? 0 : 3; i < args.length - 1; i++) {
                if (String(args[i]).toUpperCase() === "STREAMS") {
                    for (let j = i + 1; j <= i + (args.length - 1 - i) / 2; j++) {
                        keys.push(j);
                    }
                    break;
                }
            }
            break;
        default:
            // Step has to be at least one in this case, otherwise the command does
            // not contain a key.
            if (command.step > 0) {
                const keyStart = command.keyStart - 1;
                const keyStop = command.keyStop > 0
                    ? command.keyStop
                    : args.length + command.keyStop + 1;
                for (let i = keyStart; i < keyStop; i += command.step) {
                    keys.push(i);
                }
            }
            break;
    }
    return keys;
}
exports.getKeyIndexes = getKeyIndexes;
function getExternalKeyNameLength(key) {
    if (typeof key !== "string") {
        key = String(key);
    }
    const hashPos = key.indexOf("->");
    return hashPos === -1 ? key.length : hashPos;
}

}, function(modId) {var map = {"./commands.json":1779907970379}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1779907970379, function(require, module, exports) {
module.exports = {
    "vadd": {
        "arity": -5,
        "flags": [
            "write",
            "denyoom",
            "module"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vcard": {
        "arity": 2,
        "flags": [
            "readonly",
            "module",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vdim": {
        "arity": 2,
        "flags": [
            "readonly",
            "module",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vemb": {
        "arity": -3,
        "flags": [
            "readonly",
            "module",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vgetattr": {
        "arity": 3,
        "flags": [
            "readonly",
            "module",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vinfo": {
        "arity": 2,
        "flags": [
            "readonly",
            "module",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vismember": {
        "arity": 3,
        "flags": [
            "readonly",
            "module"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vlinks": {
        "arity": -3,
        "flags": [
            "readonly",
            "module",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vrandmember": {
        "arity": -2,
        "flags": [
            "readonly",
            "module"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vrange": {
        "arity": -4,
        "flags": [
            "readonly",
            "module"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vrem": {
        "arity": 3,
        "flags": [
            "write",
            "module"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vsetattr": {
        "arity": 4,
        "flags": [
            "write",
            "module",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "vsim": {
        "arity": -4,
        "flags": [
            "readonly",
            "module"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "acl": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "append": {
        "arity": 3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arcount": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "ardel": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "ardelrange": {
        "arity": -4,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arget": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "argetrange": {
        "arity": 4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "argrep": {
        "arity": -6,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arinfo": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arinsert": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arlastitems": {
        "arity": -3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arlen": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "armget": {
        "arity": -3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "armset": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arnext": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arop": {
        "arity": -5,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arring": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arscan": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arseek": {
        "arity": 3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "arset": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "asking": {
        "arity": 1,
        "flags": [
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "auth": {
        "arity": -2,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast",
            "no_auth",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "bgrewriteaof": {
        "arity": 1,
        "flags": [
            "admin",
            "noscript",
            "no_async_loading"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "bgsave": {
        "arity": -1,
        "flags": [
            "admin",
            "noscript",
            "no_async_loading"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "bitcount": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "bitfield": {
        "arity": -2,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "bitfield_ro": {
        "arity": -2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "bitop": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 2,
        "keyStop": -1,
        "step": 1
    },
    "bitpos": {
        "arity": -3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "blmove": {
        "arity": 6,
        "flags": [
            "write",
            "denyoom",
            "noscript",
            "blocking"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "blmpop": {
        "arity": -5,
        "flags": [
            "write",
            "blocking",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "blpop": {
        "arity": -3,
        "flags": [
            "write",
            "noscript",
            "blocking"
        ],
        "keyStart": 1,
        "keyStop": -2,
        "step": 1
    },
    "brpop": {
        "arity": -3,
        "flags": [
            "write",
            "noscript",
            "blocking"
        ],
        "keyStart": 1,
        "keyStop": -2,
        "step": 1
    },
    "brpoplpush": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom",
            "noscript",
            "blocking"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "bzmpop": {
        "arity": -5,
        "flags": [
            "write",
            "blocking",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "bzpopmax": {
        "arity": -3,
        "flags": [
            "write",
            "noscript",
            "blocking",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": -2,
        "step": 1
    },
    "bzpopmin": {
        "arity": -3,
        "flags": [
            "write",
            "noscript",
            "blocking",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": -2,
        "step": 1
    },
    "client": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "cluster": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "command": {
        "arity": -1,
        "flags": [
            "loading",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "config": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "copy": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "dbsize": {
        "arity": 1,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "debug": {
        "arity": -2,
        "flags": [
            "admin",
            "noscript",
            "loading",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "decr": {
        "arity": 2,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "decrby": {
        "arity": 3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "del": {
        "arity": -2,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "discard": {
        "arity": 1,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "dump": {
        "arity": 2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "echo": {
        "arity": 2,
        "flags": [
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "eval": {
        "arity": -3,
        "flags": [
            "noscript",
            "stale",
            "skip_monitor",
            "no_mandatory_keys",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "eval_ro": {
        "arity": -3,
        "flags": [
            "readonly",
            "noscript",
            "stale",
            "skip_monitor",
            "no_mandatory_keys",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "evalsha": {
        "arity": -3,
        "flags": [
            "noscript",
            "stale",
            "skip_monitor",
            "no_mandatory_keys",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "evalsha_ro": {
        "arity": -3,
        "flags": [
            "readonly",
            "noscript",
            "stale",
            "skip_monitor",
            "no_mandatory_keys",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "exec": {
        "arity": 1,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "skip_slowlog"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "exists": {
        "arity": -2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "expire": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "expireat": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "expiretime": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "failover": {
        "arity": -1,
        "flags": [
            "admin",
            "noscript",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "fcall": {
        "arity": -3,
        "flags": [
            "noscript",
            "stale",
            "skip_monitor",
            "no_mandatory_keys",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "fcall_ro": {
        "arity": -3,
        "flags": [
            "readonly",
            "noscript",
            "stale",
            "skip_monitor",
            "no_mandatory_keys",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "flushall": {
        "arity": -1,
        "flags": [
            "write"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "flushdb": {
        "arity": -1,
        "flags": [
            "write"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "function": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "geoadd": {
        "arity": -5,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "geodist": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "geohash": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "geopos": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "georadius": {
        "arity": -6,
        "flags": [
            "write",
            "denyoom",
            "movablekeys"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "georadius_ro": {
        "arity": -6,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "georadiusbymember": {
        "arity": -5,
        "flags": [
            "write",
            "denyoom",
            "movablekeys"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "georadiusbymember_ro": {
        "arity": -5,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "geosearch": {
        "arity": -7,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "geosearchstore": {
        "arity": -8,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "get": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "getbit": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "getdel": {
        "arity": 2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "getex": {
        "arity": -2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "getrange": {
        "arity": 4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "getset": {
        "arity": 3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hdel": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hello": {
        "arity": -1,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast",
            "no_auth",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "hexists": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hexpire": {
        "arity": -6,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hexpireat": {
        "arity": -6,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hexpiretime": {
        "arity": -5,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hget": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hgetall": {
        "arity": 2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hgetdel": {
        "arity": -5,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hgetex": {
        "arity": -5,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hincrby": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hincrbyfloat": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hkeys": {
        "arity": 2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hlen": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hmget": {
        "arity": -3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hmset": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hpersist": {
        "arity": -5,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hpexpire": {
        "arity": -6,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hpexpireat": {
        "arity": -6,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hpexpiretime": {
        "arity": -5,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hpttl": {
        "arity": -5,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hrandfield": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hscan": {
        "arity": -3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hset": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hsetex": {
        "arity": -6,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hsetnx": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hstrlen": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "httl": {
        "arity": -5,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "hvals": {
        "arity": 2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "incr": {
        "arity": 2,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "incrby": {
        "arity": 3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "incrbyfloat": {
        "arity": 3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "increx": {
        "arity": -2,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "info": {
        "arity": -1,
        "flags": [
            "loading",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "keys": {
        "arity": 2,
        "flags": [
            "readonly"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "lastsave": {
        "arity": 1,
        "flags": [
            "loading",
            "stale",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "latency": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "lcs": {
        "arity": -3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "lindex": {
        "arity": 3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "linsert": {
        "arity": 5,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "llen": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "lmove": {
        "arity": 5,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "lmpop": {
        "arity": -4,
        "flags": [
            "write",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "lolwut": {
        "arity": -1,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "lpop": {
        "arity": -2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "lpos": {
        "arity": -3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "lpush": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "lpushx": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "lrange": {
        "arity": 4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "lrem": {
        "arity": 4,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "lset": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "ltrim": {
        "arity": 4,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "memory": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "mget": {
        "arity": -2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "migrate": {
        "arity": -6,
        "flags": [
            "write",
            "movablekeys"
        ],
        "keyStart": 3,
        "keyStop": 3,
        "step": 1
    },
    "module": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "monitor": {
        "arity": 1,
        "flags": [
            "admin",
            "noscript",
            "loading",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "move": {
        "arity": 3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "mset": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 2
    },
    "msetex": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "msetnx": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 2
    },
    "multi": {
        "arity": 1,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "object": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "persist": {
        "arity": 2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "pexpire": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "pexpireat": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "pexpiretime": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "pfadd": {
        "arity": -2,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "pfcount": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "pfdebug": {
        "arity": 3,
        "flags": [
            "write",
            "denyoom",
            "admin"
        ],
        "keyStart": 2,
        "keyStop": 2,
        "step": 1
    },
    "pfmerge": {
        "arity": -2,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "pfselftest": {
        "arity": 1,
        "flags": [
            "admin"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "ping": {
        "arity": -1,
        "flags": [
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "psetex": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "psubscribe": {
        "arity": -2,
        "flags": [
            "pubsub",
            "noscript",
            "loading",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "psync": {
        "arity": -3,
        "flags": [
            "admin",
            "noscript",
            "no_async_loading",
            "no_multi"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "pttl": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "publish": {
        "arity": 3,
        "flags": [
            "pubsub",
            "loading",
            "stale",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "pubsub": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "punsubscribe": {
        "arity": -1,
        "flags": [
            "pubsub",
            "noscript",
            "loading",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "quit": {
        "arity": -1,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast",
            "no_auth",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "randomkey": {
        "arity": 1,
        "flags": [
            "readonly"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "readonly": {
        "arity": 1,
        "flags": [
            "loading",
            "stale",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "readwrite": {
        "arity": 1,
        "flags": [
            "loading",
            "stale",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "rename": {
        "arity": 3,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "renamenx": {
        "arity": 3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "replconf": {
        "arity": -1,
        "flags": [
            "admin",
            "noscript",
            "loading",
            "stale",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "replicaof": {
        "arity": 3,
        "flags": [
            "admin",
            "noscript",
            "stale",
            "no_async_loading"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "reset": {
        "arity": 1,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast",
            "no_auth",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "restore": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "restore-asking": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "asking"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "role": {
        "arity": 1,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "rpop": {
        "arity": -2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "rpoplpush": {
        "arity": 3,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "rpush": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "rpushx": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "sadd": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "save": {
        "arity": 1,
        "flags": [
            "admin",
            "noscript",
            "no_async_loading",
            "no_multi"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "scan": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "scard": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "script": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "sdiff": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "sdiffstore": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "select": {
        "arity": 2,
        "flags": [
            "loading",
            "stale",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "set": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "setbit": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "setex": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "setnx": {
        "arity": 3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "setrange": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "shutdown": {
        "arity": -1,
        "flags": [
            "admin",
            "noscript",
            "loading",
            "stale",
            "no_multi",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "sinter": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "sintercard": {
        "arity": -3,
        "flags": [
            "readonly",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "sinterstore": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "sismember": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "slaveof": {
        "arity": 3,
        "flags": [
            "admin",
            "noscript",
            "stale",
            "no_async_loading"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "slowlog": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "smembers": {
        "arity": 2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "smismember": {
        "arity": -3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "smove": {
        "arity": 4,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "sort": {
        "arity": -2,
        "flags": [
            "write",
            "denyoom",
            "movablekeys"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "sort_ro": {
        "arity": -2,
        "flags": [
            "readonly",
            "movablekeys"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "spop": {
        "arity": -2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "spublish": {
        "arity": 3,
        "flags": [
            "pubsub",
            "loading",
            "stale",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "srandmember": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "srem": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "sscan": {
        "arity": -3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "ssubscribe": {
        "arity": -2,
        "flags": [
            "pubsub",
            "noscript",
            "loading",
            "stale"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "strlen": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "subscribe": {
        "arity": -2,
        "flags": [
            "pubsub",
            "noscript",
            "loading",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "substr": {
        "arity": 4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "sunion": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "sunionstore": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "sunsubscribe": {
        "arity": -1,
        "flags": [
            "pubsub",
            "noscript",
            "loading",
            "stale"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "swapdb": {
        "arity": 3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "sync": {
        "arity": 1,
        "flags": [
            "admin",
            "noscript",
            "no_async_loading",
            "no_multi"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "time": {
        "arity": 1,
        "flags": [
            "loading",
            "stale",
            "fast"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "touch": {
        "arity": -2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "ttl": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "type": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "unlink": {
        "arity": -2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "unsubscribe": {
        "arity": -1,
        "flags": [
            "pubsub",
            "noscript",
            "loading",
            "stale"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "unwatch": {
        "arity": 1,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast",
            "allow_busy"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "wait": {
        "arity": 3,
        "flags": [
            "noscript"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "watch": {
        "arity": -2,
        "flags": [
            "noscript",
            "loading",
            "stale",
            "fast",
            "allow_busy"
        ],
        "keyStart": 1,
        "keyStop": -1,
        "step": 1
    },
    "xack": {
        "arity": -4,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xadd": {
        "arity": -5,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xautoclaim": {
        "arity": -6,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xclaim": {
        "arity": -6,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xdel": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xdelex": {
        "arity": -5,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xgroup": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "xinfo": {
        "arity": -2,
        "flags": [],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "xlen": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xnack": {
        "arity": -7,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xpending": {
        "arity": -3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xrange": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xread": {
        "arity": -4,
        "flags": [
            "readonly",
            "blocking",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "xreadgroup": {
        "arity": -7,
        "flags": [
            "write",
            "blocking",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "xrevrange": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xsetid": {
        "arity": -3,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "xtrim": {
        "arity": -4,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zadd": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zcard": {
        "arity": 2,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zcount": {
        "arity": 4,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zdiff": {
        "arity": -3,
        "flags": [
            "readonly",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "zdiffstore": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "movablekeys"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zincrby": {
        "arity": 4,
        "flags": [
            "write",
            "denyoom",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zinter": {
        "arity": -3,
        "flags": [
            "readonly",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "zintercard": {
        "arity": -3,
        "flags": [
            "readonly",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "zinterstore": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "movablekeys"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zlexcount": {
        "arity": 4,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zmpop": {
        "arity": -4,
        "flags": [
            "write",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "zmscore": {
        "arity": -3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zpopmax": {
        "arity": -2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zpopmin": {
        "arity": -2,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrandmember": {
        "arity": -2,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrange": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrangebylex": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrangebyscore": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrangestore": {
        "arity": -5,
        "flags": [
            "write",
            "denyoom"
        ],
        "keyStart": 1,
        "keyStop": 2,
        "step": 1
    },
    "zrank": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrem": {
        "arity": -3,
        "flags": [
            "write",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zremrangebylex": {
        "arity": 4,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zremrangebyrank": {
        "arity": 4,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zremrangebyscore": {
        "arity": 4,
        "flags": [
            "write"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrevrange": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrevrangebylex": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrevrangebyscore": {
        "arity": -4,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zrevrank": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zscan": {
        "arity": -3,
        "flags": [
            "readonly"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zscore": {
        "arity": 3,
        "flags": [
            "readonly",
            "fast"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    },
    "zunion": {
        "arity": -3,
        "flags": [
            "readonly",
            "movablekeys"
        ],
        "keyStart": 0,
        "keyStop": 0,
        "step": 0
    },
    "zunionstore": {
        "arity": -4,
        "flags": [
            "write",
            "denyoom",
            "movablekeys"
        ],
        "keyStart": 1,
        "keyStop": 1,
        "step": 1
    }
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1779907970378);
})()
//miniprogram-npm-outsideDeps=[]
//# sourceMappingURL=index.js.map
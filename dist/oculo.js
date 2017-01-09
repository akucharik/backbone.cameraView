(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Oculo = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var fbemitter = {
  EventEmitter: require('./lib/BaseEventEmitter'),
  EmitterSubscription : require('./lib/EmitterSubscription')
};

module.exports = fbemitter;

},{"./lib/BaseEventEmitter":2,"./lib/EmitterSubscription":3}],2:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BaseEventEmitter
 * @typechecks
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var EmitterSubscription = require('./EmitterSubscription');
var EventSubscriptionVendor = require('./EventSubscriptionVendor');

var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');

/**
 * @class BaseEventEmitter
 * @description
 * An EventEmitter is responsible for managing a set of listeners and publishing
 * events to them when it is told that such events happened. In addition to the
 * data for the given event it also sends a event control object which allows
 * the listeners/handlers to prevent the default behavior of the given event.
 *
 * The emitter is designed to be generic enough to support all the different
 * contexts in which one might want to emit events. It is a simple multicast
 * mechanism on top of which extra functionality can be composed. For example, a
 * more advanced emitter may use an EventHolder and EventFactory.
 */

var BaseEventEmitter = (function () {
  /**
   * @constructor
   */

  function BaseEventEmitter() {
    _classCallCheck(this, BaseEventEmitter);

    this._subscriber = new EventSubscriptionVendor();
    this._currentSubscription = null;
  }

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   *
   * TODO: Annotate the listener arg's type. This is tricky because listeners
   *       can be invoked with varargs.
   *
   * @param {string} eventType - Name of the event to listen to
   * @param {function} listener - Function to invoke when the specified event is
   *   emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   */

  BaseEventEmitter.prototype.addListener = function addListener(eventType, listener, context) {
    return this._subscriber.addSubscription(eventType, new EmitterSubscription(this._subscriber, listener, context));
  };

  /**
   * Similar to addListener, except that the listener is removed after it is
   * invoked once.
   *
   * @param {string} eventType - Name of the event to listen to
   * @param {function} listener - Function to invoke only once when the
   *   specified event is emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   */

  BaseEventEmitter.prototype.once = function once(eventType, listener, context) {
    var emitter = this;
    return this.addListener(eventType, function () {
      emitter.removeCurrentListener();
      listener.apply(context, arguments);
    });
  };

  /**
   * Removes all of the registered listeners, including those registered as
   * listener maps.
   *
   * @param {?string} eventType - Optional name of the event whose registered
   *   listeners to remove
   */

  BaseEventEmitter.prototype.removeAllListeners = function removeAllListeners(eventType) {
    this._subscriber.removeAllSubscriptions(eventType);
  };

  /**
   * Provides an API that can be called during an eventing cycle to remove the
   * last listener that was invoked. This allows a developer to provide an event
   * object that can remove the listener (or listener map) during the
   * invocation.
   *
   * If it is called when not inside of an emitting cycle it will throw.
   *
   * @throws {Error} When called not during an eventing cycle
   *
   * @example
   *   var subscription = emitter.addListenerMap({
   *     someEvent: function(data, event) {
   *       console.log(data);
   *       emitter.removeCurrentListener();
   *     }
   *   });
   *
   *   emitter.emit('someEvent', 'abc'); // logs 'abc'
   *   emitter.emit('someEvent', 'def'); // does not log anything
   */

  BaseEventEmitter.prototype.removeCurrentListener = function removeCurrentListener() {
    !!!this._currentSubscription ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Not in an emitting cycle; there is no current subscription') : invariant(false) : undefined;
    this._subscriber.removeSubscription(this._currentSubscription);
  };

  /**
   * Returns an array of listeners that are currently registered for the given
   * event.
   *
   * @param {string} eventType - Name of the event to query
   * @return {array}
   */

  BaseEventEmitter.prototype.listeners = function listeners(eventType) /* TODO: Array<EventSubscription> */{
    var subscriptions = this._subscriber.getSubscriptionsForType(eventType);
    return subscriptions ? subscriptions.filter(emptyFunction.thatReturnsTrue).map(function (subscription) {
      return subscription.listener;
    }) : [];
  };

  /**
   * Emits an event of the given type with the given data. All handlers of that
   * particular type will be notified.
   *
   * @param {string} eventType - Name of the event to emit
   * @param {*} Arbitrary arguments to be passed to each registered listener
   *
   * @example
   *   emitter.addListener('someEvent', function(message) {
   *     console.log(message);
   *   });
   *
   *   emitter.emit('someEvent', 'abc'); // logs 'abc'
   */

  BaseEventEmitter.prototype.emit = function emit(eventType) {
    var subscriptions = this._subscriber.getSubscriptionsForType(eventType);
    if (subscriptions) {
      var keys = Object.keys(subscriptions);
      for (var ii = 0; ii < keys.length; ii++) {
        var key = keys[ii];
        var subscription = subscriptions[key];
        // The subscription may have been removed during this event loop.
        if (subscription) {
          this._currentSubscription = subscription;
          this.__emitToSubscription.apply(this, [subscription].concat(Array.prototype.slice.call(arguments)));
        }
      }
      this._currentSubscription = null;
    }
  };

  /**
   * Provides a hook to override how the emitter emits an event to a specific
   * subscription. This allows you to set up logging and error boundaries
   * specific to your environment.
   *
   * @param {EmitterSubscription} subscription
   * @param {string} eventType
   * @param {*} Arbitrary arguments to be passed to each registered listener
   */

  BaseEventEmitter.prototype.__emitToSubscription = function __emitToSubscription(subscription, eventType) {
    var args = Array.prototype.slice.call(arguments, 2);
    subscription.listener.apply(subscription.context, args);
  };

  return BaseEventEmitter;
})();

module.exports = BaseEventEmitter;
}).call(this,require('_process'))

},{"./EmitterSubscription":3,"./EventSubscriptionVendor":5,"_process":40,"fbjs/lib/emptyFunction":6,"fbjs/lib/invariant":7}],3:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * 
 * @providesModule EmitterSubscription
 * @typechecks
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventSubscription = require('./EventSubscription');

/**
 * EmitterSubscription represents a subscription with listener and context data.
 */

var EmitterSubscription = (function (_EventSubscription) {
  _inherits(EmitterSubscription, _EventSubscription);

  /**
   * @param {EventSubscriptionVendor} subscriber - The subscriber that controls
   *   this subscription
   * @param {function} listener - Function to invoke when the specified event is
   *   emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   */

  function EmitterSubscription(subscriber, listener, context) {
    _classCallCheck(this, EmitterSubscription);

    _EventSubscription.call(this, subscriber);
    this.listener = listener;
    this.context = context;
  }

  return EmitterSubscription;
})(EventSubscription);

module.exports = EmitterSubscription;
},{"./EventSubscription":4}],4:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EventSubscription
 * @typechecks
 */

'use strict';

/**
 * EventSubscription represents a subscription to a particular event. It can
 * remove its own subscription.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var EventSubscription = (function () {

  /**
   * @param {EventSubscriptionVendor} subscriber the subscriber that controls
   *   this subscription.
   */

  function EventSubscription(subscriber) {
    _classCallCheck(this, EventSubscription);

    this.subscriber = subscriber;
  }

  /**
   * Removes this subscription from the subscriber that controls it.
   */

  EventSubscription.prototype.remove = function remove() {
    if (this.subscriber) {
      this.subscriber.removeSubscription(this);
      this.subscriber = null;
    }
  };

  return EventSubscription;
})();

module.exports = EventSubscription;
},{}],5:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * 
 * @providesModule EventSubscriptionVendor
 * @typechecks
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var invariant = require('fbjs/lib/invariant');

/**
 * EventSubscriptionVendor stores a set of EventSubscriptions that are
 * subscribed to a particular event type.
 */

var EventSubscriptionVendor = (function () {
  function EventSubscriptionVendor() {
    _classCallCheck(this, EventSubscriptionVendor);

    this._subscriptionsForType = {};
    this._currentSubscription = null;
  }

  /**
   * Adds a subscription keyed by an event type.
   *
   * @param {string} eventType
   * @param {EventSubscription} subscription
   */

  EventSubscriptionVendor.prototype.addSubscription = function addSubscription(eventType, subscription) {
    !(subscription.subscriber === this) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'The subscriber of the subscription is incorrectly set.') : invariant(false) : undefined;
    if (!this._subscriptionsForType[eventType]) {
      this._subscriptionsForType[eventType] = [];
    }
    var key = this._subscriptionsForType[eventType].length;
    this._subscriptionsForType[eventType].push(subscription);
    subscription.eventType = eventType;
    subscription.key = key;
    return subscription;
  };

  /**
   * Removes a bulk set of the subscriptions.
   *
   * @param {?string} eventType - Optional name of the event type whose
   *   registered supscriptions to remove, if null remove all subscriptions.
   */

  EventSubscriptionVendor.prototype.removeAllSubscriptions = function removeAllSubscriptions(eventType) {
    if (eventType === undefined) {
      this._subscriptionsForType = {};
    } else {
      delete this._subscriptionsForType[eventType];
    }
  };

  /**
   * Removes a specific subscription. Instead of calling this function, call
   * `subscription.remove()` directly.
   *
   * @param {object} subscription
   */

  EventSubscriptionVendor.prototype.removeSubscription = function removeSubscription(subscription) {
    var eventType = subscription.eventType;
    var key = subscription.key;

    var subscriptionsForType = this._subscriptionsForType[eventType];
    if (subscriptionsForType) {
      delete subscriptionsForType[key];
    }
  };

  /**
   * Returns the array of subscriptions that are currently registered for the
   * given event type.
   *
   * Note: This array can be potentially sparse as subscriptions are deleted
   * from it when they are removed.
   *
   * TODO: This returns a nullable array. wat?
   *
   * @param {string} eventType
   * @return {?array}
   */

  EventSubscriptionVendor.prototype.getSubscriptionsForType = function getSubscriptionsForType(eventType) {
    return this._subscriptionsForType[eventType];
  };

  return EventSubscriptionVendor;
})();

module.exports = EventSubscriptionVendor;
}).call(this,require('_process'))

},{"_process":40,"fbjs/lib/invariant":7}],6:[function(require,module,exports){
"use strict";

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;
},{}],7:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

function invariant(condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

module.exports = invariant;
}).call(this,require('_process'))

},{"_process":40}],8:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"./_root":19}],9:[function(require,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],10:[function(require,module,exports){
/**
 * The base implementation of `_.clamp` which doesn't coerce arguments.
 *
 * @private
 * @param {number} number The number to clamp.
 * @param {number} [lower] The lower bound.
 * @param {number} upper The upper bound.
 * @returns {number} Returns the clamped number.
 */
function baseClamp(number, lower, upper) {
  if (number === number) {
    if (upper !== undefined) {
      number = number <= upper ? number : upper;
    }
    if (lower !== undefined) {
      number = number >= lower ? number : lower;
    }
  }
  return number;
}

module.exports = baseClamp;

},{}],11:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    getRawTag = require('./_getRawTag'),
    objectToString = require('./_objectToString');

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  value = Object(value);
  return (symToStringTag && symToStringTag in value)
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;

},{"./_Symbol":8,"./_getRawTag":16,"./_objectToString":17}],12:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    arrayMap = require('./_arrayMap'),
    isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = baseToString;

},{"./_Symbol":8,"./_arrayMap":9,"./isArray":22,"./isSymbol":32}],13:[function(require,module,exports){
var toInteger = require('./toInteger'),
    toNumber = require('./toNumber'),
    toString = require('./toString');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Creates a function like `_.round`.
 *
 * @private
 * @param {string} methodName The name of the `Math` method to use when rounding.
 * @returns {Function} Returns the new round function.
 */
function createRound(methodName) {
  var func = Math[methodName];
  return function(number, precision) {
    number = toNumber(number);
    precision = nativeMin(toInteger(precision), 292);
    if (precision) {
      // Shift with exponential notation to avoid floating-point issues.
      // See [MDN](https://mdn.io/round#Examples) for more details.
      var pair = (toString(number) + 'e').split('e'),
          value = func(pair[0] + 'e' + (+pair[1] + precision));

      pair = (toString(value) + 'e').split('e');
      return +(pair[0] + 'e' + (+pair[1] - precision));
    }
    return func(number);
  };
}

module.exports = createRound;

},{"./toInteger":37,"./toNumber":38,"./toString":39}],14:[function(require,module,exports){
(function (global){
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],15:[function(require,module,exports){
var overArg = require('./_overArg');

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;

},{"./_overArg":18}],16:[function(require,module,exports){
var Symbol = require('./_Symbol');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;

},{"./_Symbol":8}],17:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

},{}],18:[function(require,module,exports){
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;

},{}],19:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":14}],20:[function(require,module,exports){
var baseClamp = require('./_baseClamp'),
    toNumber = require('./toNumber');

/**
 * Clamps `number` within the inclusive `lower` and `upper` bounds.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Number
 * @param {number} number The number to clamp.
 * @param {number} [lower] The lower bound.
 * @param {number} upper The upper bound.
 * @returns {number} Returns the clamped number.
 * @example
 *
 * _.clamp(-10, -5, 5);
 * // => -5
 *
 * _.clamp(10, -5, 5);
 * // => 5
 */
function clamp(number, lower, upper) {
  if (upper === undefined) {
    upper = lower;
    lower = undefined;
  }
  if (upper !== undefined) {
    upper = toNumber(upper);
    upper = upper === upper ? upper : 0;
  }
  if (lower !== undefined) {
    lower = toNumber(lower);
    lower = lower === lower ? lower : 0;
  }
  return baseClamp(toNumber(number), lower, upper);
}

module.exports = clamp;

},{"./_baseClamp":10,"./toNumber":38}],21:[function(require,module,exports){
var isObject = require('./isObject'),
    now = require('./now'),
    toNumber = require('./toNumber');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

module.exports = debounce;

},{"./isObject":29,"./now":33,"./toNumber":38}],22:[function(require,module,exports){
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;

},{}],23:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

module.exports = isArrayLike;

},{"./isFunction":26,"./isLength":27}],24:[function(require,module,exports){
var isObjectLike = require('./isObjectLike'),
    isPlainObject = require('./isPlainObject');

/**
 * Checks if `value` is likely a DOM element.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
 * @example
 *
 * _.isElement(document.body);
 * // => true
 *
 * _.isElement('<body>');
 * // => false
 */
function isElement(value) {
  return isObjectLike(value) && value.nodeType === 1 && !isPlainObject(value);
}

module.exports = isElement;

},{"./isObjectLike":30,"./isPlainObject":31}],25:[function(require,module,exports){
var root = require('./_root');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsFinite = root.isFinite;

/**
 * Checks if `value` is a finite primitive number.
 *
 * **Note:** This method is based on
 * [`Number.isFinite`](https://mdn.io/Number/isFinite).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
 * @example
 *
 * _.isFinite(3);
 * // => true
 *
 * _.isFinite(Number.MIN_VALUE);
 * // => true
 *
 * _.isFinite(Infinity);
 * // => false
 *
 * _.isFinite('3');
 * // => false
 */
function isFinite(value) {
  return typeof value == 'number' && nativeIsFinite(value);
}

module.exports = isFinite;

},{"./_root":19}],26:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObject = require('./isObject');

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;

},{"./_baseGetTag":11,"./isObject":29}],27:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],28:[function(require,module,exports){
/**
 * Checks if `value` is `null` or `undefined`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
 * @example
 *
 * _.isNil(null);
 * // => true
 *
 * _.isNil(void 0);
 * // => true
 *
 * _.isNil(NaN);
 * // => false
 */
function isNil(value) {
  return value == null;
}

module.exports = isNil;

},{}],29:[function(require,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],30:[function(require,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],31:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    getPrototype = require('./_getPrototype'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

module.exports = isPlainObject;

},{"./_baseGetTag":11,"./_getPrototype":15,"./isObjectLike":30}],32:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

module.exports = isSymbol;

},{"./_baseGetTag":11,"./isObjectLike":30}],33:[function(require,module,exports){
var root = require('./_root');

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

module.exports = now;

},{"./_root":19}],34:[function(require,module,exports){
var createRound = require('./_createRound');

/**
 * Computes `number` rounded to `precision`.
 *
 * @static
 * @memberOf _
 * @since 3.10.0
 * @category Math
 * @param {number} number The number to round.
 * @param {number} [precision=0] The precision to round to.
 * @returns {number} Returns the rounded number.
 * @example
 *
 * _.round(4.006);
 * // => 4
 *
 * _.round(4.006, 2);
 * // => 4.01
 *
 * _.round(4060, -2);
 * // => 4100
 */
var round = createRound('round');

module.exports = round;

},{"./_createRound":13}],35:[function(require,module,exports){
var debounce = require('./debounce'),
    isObject = require('./isObject');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed `func` invocations and a `flush` method to
 * immediately invoke them. Provide `options` to indicate whether `func`
 * should be invoked on the leading and/or trailing edge of the `wait`
 * timeout. The `func` is invoked with the last arguments provided to the
 * throttled function. Subsequent calls to the throttled function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the throttled function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=true]
 *  Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // Avoid excessively updating the position while scrolling.
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
 * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
 * jQuery(element).on('click', throttled);
 *
 * // Cancel the trailing throttled invocation.
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing
  });
}

module.exports = throttle;

},{"./debounce":21,"./isObject":29}],36:[function(require,module,exports){
var toNumber = require('./toNumber');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

module.exports = toFinite;

},{"./toNumber":38}],37:[function(require,module,exports){
var toFinite = require('./toFinite');

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = toFinite(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

module.exports = toInteger;

},{"./toFinite":36}],38:[function(require,module,exports){
var isObject = require('./isObject'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;

},{"./isObject":29,"./isSymbol":32}],39:[function(require,module,exports){
var baseToString = require('./_baseToString');

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

module.exports = toString;

},{"./_baseToString":12}],40:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
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
    var timeout = runTimeout(cleanUpNextTick);
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
    runClearTimeout(timeout);
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
        runTimeout(drainQueue);
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

},{}],41:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _isElement = require('lodash/isElement');

var _isElement2 = _interopRequireDefault(_isElement);

var _isFinite = require('lodash/isFinite');

var _isFinite2 = _interopRequireDefault(_isFinite);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isNil = require('lodash/isNil');

var _isNil2 = _interopRequireDefault(_isNil);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _constants = require('./constants');

var _math = require('./math/math');

var _math2 = _interopRequireDefault(_math);

var _matrix = require('./math/matrix2');

var _matrix2 = _interopRequireDefault(_matrix);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _vector = require('./math/vector2');

var _vector2 = _interopRequireDefault(_vector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var animation = {
    type: {
        CORE: 1
    }
};

/**
* Description.
* 
* @class Oculo.Animation
* @constructor
* @extends external:TimelineMax
* @param {Camera} camera - The camera to be animated.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {Object} [options.destroyOnComplete] - Whether the animation should be destroyed once it has completed.
*
* @example
* var myAnimation = new Oculo.Animation(myCamera, { 
*   destroyOnComplete: true
* }).zoomTo(2, 1).shake(0.1, 2).play();
*/

var Animation = function (_TimelineMax) {
    _inherits(Animation, _TimelineMax);

    function Animation(camera, options) {
        _classCallCheck(this, Animation);

        options = Object.assign({
            paused: true
        }, options);

        /**
        * @property {object} - The initial configuration.
        * @default {};
        */
        var _this = _possibleConstructorReturn(this, (Animation.__proto__ || Object.getPrototypeOf(Animation)).call(this, Object.assign({}, options)));

        _this.config = options;

        /**
        * @property {number} - The type of this object.
        * @readonly
        */
        _this.type = _constants.Type.ANIMATION;

        /**
        * @property {Camera} - The camera on which the animation will be applied.
        */
        _this.camera = camera || null;

        /**
        * @property {array} - The core tweens of this animation in order of execution.
        */
        _this.coreTweens = [];

        /**
        * @property {TimelineLite} - The current active sub-animation consisting of the core camera animation and effect animations.
        */
        _this.currentKeyframe = null;

        /**
        * @property {boolean} - Whether the animation should be destroyed once it has completed.
        */
        _this.destroyOnComplete = options.destroyOnComplete ? true : false;

        /**
        * @property {object} - The camera values of the previous sub-animation.
        */
        _this.previousProps = {};

        /**
        * Called when the animation has started.
        *
        * @private
        */
        _this._onStart = function () {
            this._initCoreTween(this.coreTweens[0]);

            if (this.duration() > 0) {
                if (this.camera.isDraggable) {
                    this.camera.trackControl.disableDrag();
                }

                if (this.camera.isManualZoomable) {
                    this.camera.trackControl.disableWheel();
                }
            }

            if (this.config.onStart !== undefined) {
                this.config.onStart.apply(this, this.config.onStartParams);
            }
            // TODO: Remove once dev is complete
            console.log('animation started');
        };

        /**
        * Called when the animation has updated.
        *
        * @private
        */
        _this._onUpdate = function () {
            if (this.config.onUpdate !== undefined) {
                this.config.onUpdate.apply(this, this.config.onUpdateParams);
            }

            this.camera.render();
        };

        /**
        * Called when the animation has completed.
        *
        * @private
        */
        _this._onComplete = function () {
            if (this.duration() > 0) {
                if (this.camera.isDraggable) {
                    this.camera.trackControl.enableDrag();
                }

                if (this.camera.isManualZoomable) {
                    this.camera.trackControl.enableWheel();
                }
            }

            if (this.config.onComplete !== undefined) {
                this.config.onComplete.apply(this, this.config.onCompleteParams);
            }

            if (this.destroyOnComplete) {
                this.destroy();
            }
            // TODO: Remove once dev is complete
            console.log('animation completed');
        }, _this.eventCallback('onStart', _this._onStart);
        _this.eventCallback('onUpdate', _this._onUpdate);
        _this.eventCallback('onComplete', _this._onComplete);
        return _this;
    }

    /**
    * Animate the camera.
    *
    * @private
    * @param {Object} props - The properties to animate.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    */


    _createClass(Animation, [{
        key: '_animate',
        value: function _animate(props, duration, options) {
            options = options || {};

            var mainTimeline = new TimelineLite({
                callbackScope: this,
                onStartParams: ['{self}'],
                onStart: function onStart(self) {
                    this.currentKeyframe = self;
                }
            });
            var shakeTimeline = null;
            var shake = this._parseShake(props.shake);

            // Tween core camera properties
            if (props.origin || props.position || props.rotation || props.zoom) {
                var coreTween = TweenMax.to(this.camera, duration, Object.assign({}, options, {
                    rawOffsetX: 0,
                    rawOffsetY: 0,
                    rotation: 0,
                    zoom: 0,
                    immediateRender: false,
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        var zDirection = _constants.zoomDirection.NONE;
                        self.timeline.core = self;
                        this.camera.setTransformOrigin(self.props.to.origin);

                        if (self.props.to.zoom > this.camera.zoom) {
                            zDirection = _constants.zoomDirection.IN;
                        } else if (self.props.to.zoom < this.camera.zoom) {
                            zDirection = _constants.zoomDirection.OUT;
                        }

                        this.camera.zoomDirection = zDirection;

                        // TODO: For dev only
                        console.log('core tween started');
                        console.log('tween vars: ', self.vars);
                        console.log('tween props: ', self.props);
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        // Position is manually maintained so animations can smoothly continue when camera is resized
                        this.camera.setRawPosition(this.camera._convertOffsetToPosition(this.camera.rawOffset, this.camera.center, this.camera.transformOrigin, this.camera.transformation));
                    },
                    onCompleteParams: ['{self}'],
                    onComplete: function onComplete(self) {
                        this._initCoreTween(this.coreTweens[self.index + 1], self.props.end);
                        // TODO: For dev only
                        console.log('core tween completed');
                    }
                }));

                coreTween.type = animation.type.CORE;
                coreTween.props = {
                    source: {},
                    parsed: {},
                    to: {},
                    start: {},
                    end: {}
                };
                coreTween.props.source.origin = props.origin;
                coreTween.props.source.position = props.position;
                coreTween.props.source.rotation = props.rotation;
                coreTween.props.source.zoom = props.zoom;
                coreTween.index = this.coreTweens.length;
                this.coreTweens.push(coreTween);
                mainTimeline.add(coreTween, 0);
            }

            // Tween shake effect
            if (duration > 0 && shake && shake.intensity > 0) {
                shakeTimeline = new TimelineLite(Object.assign({}, options, {
                    data: {
                        intensity: 0,
                        direction: shake.direction,
                        enforceBounds: shake.enforceBounds === false ? false : true
                    },
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        self.timeline.shake = self;
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        var isFinalFrame = self.time() === self.duration();
                        var offsetX = 0;
                        var offsetY = 0;
                        var position = this.camera.rawPosition.clone();

                        if (self.data.direction === Animation.shake.direction.HORIZONTAL || self.data.direction === Animation.shake.direction.BOTH) {
                            if (!isFinalFrame) {
                                offsetX = Math.random() * self.data.intensity * this.camera.width * 2 - self.data.intensity * this.camera.width;
                                position.x += offsetX;
                            }
                        }

                        if (self.data.direction === Animation.shake.direction.VERTICAL || self.data.direction === Animation.shake.direction.BOTH) {
                            if (!isFinalFrame) {
                                offsetY = Math.random() * self.data.intensity * this.camera.height * 2 - self.data.intensity * this.camera.height;
                                position.y += offsetY;
                            }
                        }

                        this.camera.setPosition(position, self.data.enforceBounds);
                    },
                    onCompleteParams: ['{self}']
                }));

                // Ease in/out
                if (shake.easeIn && shake.easeOut) {
                    shakeTimeline.fromTo(shakeTimeline.data, duration * 0.5, {
                        intensity: 0
                    }, {
                        intensity: shake.intensity,
                        ease: shake.easeIn || Power0.easeNone
                    }, 0);

                    shakeTimeline.to(shakeTimeline.data, duration * 0.5, {
                        intensity: 0,
                        ease: shake.easeOut || Power0.easeNone
                    }, duration * 0.5);
                }
                // Ease in or ease
                else if (shake.easeIn && !shake.easeOut) {
                        shakeTimeline.fromTo(shakeTimeline.data, duration, {
                            intensity: 0
                        }, {
                            intensity: shake.intensity,
                            ease: shake.easeIn || Power0.easeNone
                        }, 0);
                    }
                    // Ease out
                    else if (!shake.easeIn && shake.easeOut) {
                            shakeTimeline.fromTo(shakeTimeline.data, duration, {
                                intensity: shake.intensity
                            }, {
                                intensity: 0,
                                ease: shake.easeOut || Power0.easeNone
                            }, 0);
                        }
                        // Ease
                        else if (options.ease) {
                                shakeTimeline.fromTo(shakeTimeline.data, duration, {
                                    intensity: 0
                                }, {
                                    intensity: shake.intensity,
                                    ease: options.ease || Power0.easeNone
                                }, 0);
                            }
                            // No ease
                            else {
                                    shakeTimeline.data.intensity = shake.intensity;
                                    shakeTimeline.to(shakeTimeline.data, duration, {}, 0);
                                }

                mainTimeline.add(shakeTimeline, 0);
            }

            this.add(mainTimeline);

            return this;
        }

        /**
        * Calculates the "to" property values.
        *
        * @private
        * @param {Object|Vector2} sourceOrigin - The source origin.
        * @param {Object|Vector2} sourcePosition - The source position.
        * @param {number} sourceRotation - The source rotation.
        * @param {number} sourceZoom - The source zoom.
        * @param {Oculo.Camera} camera - The camera.
        * @returns {Object} - The end properties.
        */

    }, {
        key: '_calculateToProps',
        value: function _calculateToProps(parsed, start) {
            var source = {
                origin: parsed.origin !== null ? parsed.origin : {},
                position: parsed.position !== null ? parsed.position : {},
                rotation: parsed.rotation,
                zoom: parsed.zoom
            };

            var isAnchored = false;
            // Changing to same origin is necessary for wheel zoom
            var isOriginXChanging = Number.isFinite(source.origin.x);
            var isOriginYChanging = Number.isFinite(source.origin.y);
            var isOriginChanging = isOriginXChanging || isOriginYChanging;
            // Changing to same position is necessary for camera resize
            var isPositionXChanging = Number.isFinite(source.position.x);
            var isPositionYChanging = Number.isFinite(source.position.y);
            var isPositionChanging = isPositionXChanging || isPositionYChanging;
            var isOffsetChanging = isPositionChanging;
            var isRotationChanging = Number.isFinite(source.rotation) && source.rotation !== start.rotation;
            var isZoomChanging = Number.isFinite(source.zoom) && source.zoom !== start.zoom;

            var startTransformation = new _matrix2.default().scale(start.zoom, start.zoom).rotate(_math2.default.degToRad(-start.rotation));
            var fovPosition = this.camera.center;
            var toOffset;
            var toOrigin = new _vector2.default(isOriginXChanging ? source.origin.x : start.origin.x, isOriginYChanging ? source.origin.y : start.origin.y);
            var toPosition = new _vector2.default(isPositionXChanging ? source.position.x : start.position.x, isPositionYChanging ? source.position.y : start.position.y);
            var toRotation = isRotationChanging ? source.rotation : start.rotation;
            var toZoom = isZoomChanging ? source.zoom : start.zoom;
            var toTransformation = new _matrix2.default().scale(toZoom, toZoom).rotate(_math2.default.degToRad(-toRotation));

            // rotateTo, zoomTo
            if (!isOriginChanging && !isPositionChanging) {
                isAnchored = true;
                toOrigin.copy(start.position);
            }
            // rotateAt, zoomAt
            else if (isOriginChanging && !isPositionChanging) {
                    isAnchored = true;
                    isPositionChanging = true;
                    fovPosition = this.camera._convertScenePositionToFOVPosition(toOrigin, start.position, this.camera.center, startTransformation);
                    console.log('fov pos: ', fovPosition);
                    toPosition = this.camera._convertScenePositionToCameraPosition(toOrigin, fovPosition, this.camera.center, toOrigin, toTransformation);
                }

            toOffset = this.camera._convertPositionToOffset(toPosition, this.camera.center, toOrigin, toTransformation);

            return {
                offsetX: isOffsetChanging ? toOffset.x : null,
                offsetY: isOffsetChanging ? toOffset.y : null,
                origin: isAnchored || isOriginChanging ? toOrigin : null,
                position: isPositionChanging ? toPosition : null,
                rotation: isRotationChanging ? toRotation : null,
                zoom: isZoomChanging ? toZoom : null
            };
        }

        /**
        * Gets the starting property values.
        *
        * @private
        * @returns {Object} - The starting properties.
        */

    }, {
        key: '_getStartProps',
        value: function _getStartProps() {
            return {
                origin: this.camera.transformOrigin.clone(),
                position: this.camera.position.clone(),
                rotation: this.camera.rotation,
                zoom: this.camera.zoom
            };
        }

        /**
        * Gets the ending property values.
        *
        * @private
        * @returns {Object} - The ending properties.
        */

    }, {
        key: '_getEndProps',
        value: function _getEndProps(to, start) {
            return {
                origin: to.origin !== null ? to.origin : start.origin,
                position: to.position !== null ? to.position : start.position,
                rotation: to.rotation !== null ? to.rotation : start.rotation,
                zoom: to.zoom !== null ? to.zoom : start.zoom
            };
        }

        /**
        * Initializes a core tween.
        *
        * @private
        * @param {TweenMax} tween - The tween.
        * @returns {this} self
        */

    }, {
        key: '_initCoreTween',
        value: function _initCoreTween(tween, startProps) {
            if (tween !== undefined) {
                startProps = startProps !== undefined ? startProps : this._getStartProps();

                var parsedProps = this._parseProps(tween.props.source.origin, tween.props.source.position, tween.props.source.rotation, tween.props.source.zoom);
                var toProps = this._calculateToProps(parsedProps, startProps);
                var endProps = this._getEndProps(toProps, startProps);

                this.previousProps = startProps;
                tween.props.start = startProps;
                tween.props.end = endProps;
                tween.props.parsed = parsedProps;
                tween.props.to = toProps;

                tween.vars.rawOffsetX = toProps.offsetX;
                tween.vars.rawOffsetY = toProps.offsetY;
                tween.vars.rotation = toProps.rotation;
                tween.vars.zoom = toProps.zoom;
            }

            return this;
        }

        /**
        * Parses the core animation properties.
        *
        * @private
        * @param {Object} origin - The origin.
        * @param {Object} position - The origin.
        * @param {number} rotation - The rotation.
        * @param {number} zoom - The zoom.
        * @returns {Object} - The parsed properties.
        */

    }, {
        key: '_parseProps',
        value: function _parseProps(origin, position, rotation, zoom) {
            if (position === 'previous' && this.previousProps.position) {
                position = this.previousProps.position;
            }

            if (rotation === 'previous' && !(0, _isNil2.default)(this.previousProps.rotation)) {
                rotation = this.previousProps.rotation;
            }

            if (zoom === 'previous' && !(0, _isNil2.default)(this.previousProps.zoom)) {
                zoom = this.previousProps.zoom;
            }

            return {
                origin: _utils2.default.parsePosition(origin, this.camera.scene.view),
                position: _utils2.default.parsePosition(position, this.camera.scene.view),
                rotation: !(0, _isNil2.default)(rotation) ? rotation : null,
                zoom: zoom || null
            };
        }

        /**
        * Parses the shake properties.
        *
        * @private
        * @param {Object} shake - The shake properties.
        * @returns {Object} - The parsed properties.
        */

    }, {
        key: '_parseShake',
        value: function _parseShake(shake) {
            var parsedShake = null;

            if (shake) {
                parsedShake = {
                    intensity: (0, _isNil2.default)(shake.intensity) ? 0 : shake.intensity,
                    direction: (0, _isNil2.default)(shake.direction) ? Animation.shake.direction.BOTH : shake.direction,
                    easeIn: shake.easeIn,
                    easeOut: shake.easeOut,
                    enforceBounds: shake.enforceBounds
                };
            }

            return parsedShake;
        }

        /**
        * Stops the animation and releases it for garbage collection.
        *
        * @returns {this} self
        *
        * @example
        * myAnimation.destroy();
        */

    }, {
        key: 'destroy',
        value: function destroy() {
            _get(Animation.prototype.__proto__ || Object.getPrototypeOf(Animation.prototype), 'kill', this).call(this);
            this.camera = null;
            this.currentKeyframe = null;
            this.previousProps = null;
        }

        /**
        * Animate the camera.
        *
        * @param {Object} props - The properties to animate.
        * @param {string|Element|Object} [props.position] - The location to move to. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [props.position.x] - The x coordinate on the raw scene.
        * @param {number} [props.position.y] - The y coordinate on the raw scene.
        * @param {string|Element|Object} [props.origin] - The location for the zoom's origin. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [props.origin.x] - The x coordinate on the raw scene.
        * @param {number} [props.origin.y] - The y coordinate on the raw scene.
        * @param {number|string} [props.rotation] - The rotation.
        * @param {Object} [props.shake] - An object of shake effect properties.
        * @param {number} [props.shake.intensity] - A {@link Camera#shakeIntensity|shake intensity}.
        * @param {Oculo.Animation.shake.direction} [props.shake.direction=Oculo.Animation.shake.direction.BOTH] - A shake direction. 
        * @param {Object} [props.shake.easeIn] - An {@link external:Easing|Easing}.
        * @param {Object} [props.shake.easeOut] - An {@link external:Easing|Easing}.
        * @param {number} [props.zoom] - A zoom value.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.animate({position: '#box100', zoom: 2}, 1);
        * myAnimation.animate({position: {x: 200, y: 50}, zoom: 2}, 1);
        * myAnimation.animate({origin: '#box100', zoom: 2}, 1);
        * myAnimation.animate({origin: {x: 200, y: 50}, zoom: 2}, 1);
        */

    }, {
        key: 'animate',
        value: function animate(props, duration, options) {
            this._animate({
                position: props.position,
                origin: props.origin,
                rotation: props.rotation,
                shake: props.shake,
                zoom: props.zoom
            }, duration, options);

            return this;
        }

        /**
        * Move to a specific position.
        *
        * @param {string|Element|Object} position - The position to move to. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [position.x] - The x coordinate on the raw scene.
        * @param {number} [position.y] - The y coordinate on the raw scene.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.moveTo('#box100', 1);
        * myAnimation.moveTo(document.getElementById('box100'), 1);
        * myAnimation.moveTo({x:200, y: 50}, 1);
        * myAnimation.moveTo({x: 200}, 1);
        * myAnimation.moveTo({y: 200}, 1);
        */

    }, {
        key: 'moveTo',
        value: function moveTo(position, duration, options) {
            this._animate({
                position: position
            }, duration, options);

            return this;
        }

        /**
        * Rotate at the specified location.
        *
        * @param {string|Element|Object} origin - The location for the rotation's origin. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [origin.x] - The x coordinate on the raw scene.
        * @param {number} [origin.y] - The y coordinate on the raw scene.
        * @param {number|string} rotation - The rotation.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.rotateAt('#box100', 20, 1);
        * myAnimation.rotateAt(document.getElementById('box100'), 20, 1);
        * myAnimation.rotateAt({x: 200, y: 50}, 20, 1);
        */

    }, {
        key: 'rotateAt',
        value: function rotateAt(origin, rotation, duration, options) {
            this._animate({
                origin: origin,
                rotation: rotation
            }, duration, options);

            return this;
        }

        /**
        * Rotate at the current position.
        *
        * @param {number|string} rotation - The rotation.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.rotateTo(20, 1);
        */

    }, {
        key: 'rotateTo',
        value: function rotateTo(rotation, duration, options) {
            this._animate({
                rotation: rotation
            }, duration, options);

            return this;
        }

        /**
        * Shake the camera.
        *
        * @param {number} intensity - A {@link Camera#shakeIntensity|shake intensity}.
        * @param {number} duration - A duration.
        * @param {Oculo.Animation.shake.direction} [direction=Oculo.Animation.shake.direction.BOTH] - A shake direction. 
        * @param {Object} [options] - An object of {@link external:TimelineMax|TimelineMax} options plus:
        * @param {Object} [options.easeIn] - An {@link external:Easing|Easing}.
        * @param {Object} [options.easeOut] - An {@link external:Easing|Easing}.
        * @returns {this} self
        *
        * @example
        * myAnimation.shake(0.1, 4);
        * myAnimation.shake(0.1, 4, Oculo.Animation.shake.direction.HORIZONTAL, { easeIn: Power2.easeIn, easeOut: Power2.easeOut })
        */

    }, {
        key: 'shake',
        value: function shake(intensity, duration, direction, options) {
            options = options || {};

            this.animate({
                shake: {
                    intensity: intensity,
                    direction: direction,
                    easeIn: options.easeIn,
                    easeOut: options.easeOut,
                    enforceBounds: options.enforceBounds
                }
            }, duration, options);

            return this;
        }

        /**
        * Zoom in/out at a specific location.
        *
        * @param {string|Element|Object} origin - The location for the zoom's origin. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [origin.x] - The x coordinate on the raw scene.
        * @param {number} [origin.y] - The y coordinate on the raw scene.
        * @param {number} zoom - A zoom value.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.zoomAt('#box100', 2, 1);
        * myAnimation.zoomAt(document.getElementById('box100'), 2, 1);
        * myAnimation.zoomAt({x: 200, y: 50}, 2, 1);
        */

    }, {
        key: 'zoomAt',
        value: function zoomAt(origin, zoom, duration, options) {
            this._animate({
                origin: origin,
                zoom: zoom
            }, duration, options);

            return this;
        }

        /**
        * Zoom in/out at the current position.
        *
        * @param {number} zoom - A zoom value.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.zoomTo(2, 1);
        */

    }, {
        key: 'zoomTo',
        value: function zoomTo(zoom, duration, options) {
            this._animate({
                zoom: zoom
            }, duration, options);

            return this;
        }
    }]);

    return Animation;
}(TimelineMax);

/**
* Shake directions.
* @enum {number}
*/


Animation.shake = {
    direction: {
        /**
        * Both the x and y axes.
        */
        BOTH: 0,
        /**
        * The x axis.
        */
        HORIZONTAL: 1,
        /**
        * The y axis.
        */
        VERTICAL: 2
    }
};

exports.default = Animation;

},{"./constants":45,"./math/math":48,"./math/matrix2":49,"./math/vector2":50,"./utils":55,"lodash/isElement":24,"lodash/isFinite":25,"lodash/isFunction":26,"lodash/isNil":28,"lodash/isObject":29}],42:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _isElement = require('lodash/isElement');

var _isElement2 = _interopRequireDefault(_isElement);

var _isFinite = require('lodash/isFinite');

var _isFinite2 = _interopRequireDefault(_isFinite);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isNil = require('lodash/isNil');

var _isNil2 = _interopRequireDefault(_isNil);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _constants = require('./constants');

var _math = require('./math/math');

var _math2 = _interopRequireDefault(_math);

var _matrix = require('./math/matrix2');

var _matrix2 = _interopRequireDefault(_matrix);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _vector = require('./math/vector2');

var _vector2 = _interopRequireDefault(_vector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var animation = {
    type: {
        CORE: 1
    }
};

/**
* Description.
* 
* @class Oculo.Animation
* @constructor
* @extends external:TimelineMax
* @param {Camera} camera - The camera to be animated.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {Object} [options.destroyOnComplete] - Whether the animation should be destroyed once it has completed.
*
* @example
* var myAnimation = new Oculo.Animation(myCamera, { 
*   destroyOnComplete: true
* }).zoomTo(2, 1).shake(0.1, 2).play();
*/

var Animation = function (_TimelineMax) {
    _inherits(Animation, _TimelineMax);

    function Animation(camera, options) {
        _classCallCheck(this, Animation);

        options = Object.assign({
            paused: true
        }, options);

        /**
        * @property {object} - The initial configuration.
        * @default {};
        */
        var _this = _possibleConstructorReturn(this, (Animation.__proto__ || Object.getPrototypeOf(Animation)).call(this, Object.assign({}, options)));

        _this.config = options;

        /**
        * @property {number} - The type of this object.
        * @readonly
        */
        _this.type = _constants.Type.ANIMATION;

        /**
        * @property {Camera} - The camera on which the animation will be applied.
        */
        _this.camera = camera || null;

        /**
        * @property {array} - The core tweens of this animation in order of execution.
        */
        _this.coreTweens = [];

        /**
        * @property {TimelineLite} - The current active sub-animation consisting of the core camera animation and effect animations.
        */
        _this.currentKeyframe = null;

        /**
        * @property {boolean} - Whether the animation should be destroyed once it has completed.
        */
        _this.destroyOnComplete = options.destroyOnComplete ? true : false;

        /**
        * @property {object} - The camera values of the previous sub-animation.
        */
        _this.previousProps = {};

        /**
        * Called when the animation has started.
        *
        * @private
        */
        _this._onStart = function () {
            this._initCoreTween(this.coreTweens[0]);

            if (this.duration() > 0) {
                if (this.camera.isDraggable) {
                    this.camera.trackControl.disableDrag();
                }

                if (this.camera.isManualZoomable) {
                    this.camera.trackControl.disableWheel();
                }
            }

            if (this.config.onStart !== undefined) {
                this.config.onStart.apply(this, this.config.onStartParams);
            }
            // TODO: Remove once dev is complete
            console.log('animation started');
        };

        /**
        * Called when the animation has updated.
        *
        * @private
        */
        _this._onUpdate = function () {
            if (this.config.onUpdate !== undefined) {
                this.config.onUpdate.apply(this, this.config.onUpdateParams);
            }

            this.camera.render();
        };

        /**
        * Called when the animation has completed.
        *
        * @private
        */
        _this._onComplete = function () {
            if (this.duration() > 0) {
                if (this.camera.isDraggable) {
                    this.camera.trackControl.enableDrag();
                }

                if (this.camera.isManualZoomable) {
                    this.camera.trackControl.enableWheel();
                }
            }

            if (this.config.onComplete !== undefined) {
                this.config.onComplete.apply(this, this.config.onCompleteParams);
            }

            if (this.destroyOnComplete) {
                this.destroy();
            }
            // TODO: Remove once dev is complete
            console.log('animation completed');
        }, _this.eventCallback('onStart', _this._onStart);
        _this.eventCallback('onUpdate', _this._onUpdate);
        _this.eventCallback('onComplete', _this._onComplete);
        return _this;
    }

    /**
    * Animate the camera.
    *
    * @private
    * @param {Object} props - The properties to animate.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    */


    _createClass(Animation, [{
        key: '_animate',
        value: function _animate(props, duration, options) {
            options = options || {};

            var mainTimeline = new TimelineLite({
                callbackScope: this,
                onStartParams: ['{self}'],
                onStart: function onStart(self) {
                    this.currentKeyframe = self;
                }
            });
            var shakeTimeline = null;
            var shake = this._parseShake(props.shake);

            // Tween core camera properties
            if (props.origin || props.position || props.rotation || props.zoom) {
                var coreTween = TweenMax.to(this.camera, duration, Object.assign({}, options, {
                    rawOffsetX: 0,
                    rawOffsetY: 0,
                    rotation: 0,
                    zoom: 0,
                    immediateRender: false,
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        var zDirection = _constants.zoomDirection.NONE;
                        self.timeline.core = self;
                        this.camera.setTransformOrigin(self.props.to.origin);

                        if (self.props.to.zoom > this.camera.zoom) {
                            zDirection = _constants.zoomDirection.IN;
                        } else if (self.props.to.zoom < this.camera.zoom) {
                            zDirection = _constants.zoomDirection.OUT;
                        }

                        this.camera.zoomDirection = zDirection;

                        // TODO: For dev only
                        console.log('core tween started');
                        console.log('tween vars: ', self.vars);
                        console.log('tween props: ', self.props);
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        // Position is manually maintained so animations can smoothly continue when camera is resized
                        this.camera.setRawPosition(this.camera._convertOffsetToPosition(this.camera.rawOffset, this.camera.center, this.camera.transformOrigin, this.camera.transformation));
                    },
                    onCompleteParams: ['{self}'],
                    onComplete: function onComplete(self) {
                        this._initCoreTween(this.coreTweens[self.index + 1], self.props.end);
                        // TODO: For dev only
                        console.log('core tween completed');
                    }
                }));

                coreTween.type = animation.type.CORE;
                coreTween.props = {
                    source: {},
                    parsed: {},
                    to: {},
                    start: {},
                    end: {}
                };
                coreTween.props.source.origin = props.origin;
                coreTween.props.source.position = props.position;
                coreTween.props.source.rotation = props.rotation;
                coreTween.props.source.zoom = props.zoom;
                coreTween.index = this.coreTweens.length;
                this.coreTweens.push(coreTween);
                mainTimeline.add(coreTween, 0);
            }

            // Tween shake effect
            if (duration > 0 && shake && shake.intensity > 0) {
                shakeTimeline = new TimelineLite(Object.assign({}, options, {
                    data: {
                        intensity: 0,
                        direction: shake.direction,
                        enforceBounds: shake.enforceBounds === false ? false : true
                    },
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        self.timeline.shake = self;
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        var isFinalFrame = self.time() === self.duration();
                        var offsetX = 0;
                        var offsetY = 0;
                        var position = this.camera.rawPosition.clone();

                        if (self.data.direction === Animation.shake.direction.HORIZONTAL || self.data.direction === Animation.shake.direction.BOTH) {
                            if (!isFinalFrame) {
                                offsetX = Math.random() * self.data.intensity * this.camera.width * 2 - self.data.intensity * this.camera.width;
                                position.x += offsetX;
                            }
                        }

                        if (self.data.direction === Animation.shake.direction.VERTICAL || self.data.direction === Animation.shake.direction.BOTH) {
                            if (!isFinalFrame) {
                                offsetY = Math.random() * self.data.intensity * this.camera.height * 2 - self.data.intensity * this.camera.height;
                                position.y += offsetY;
                            }
                        }

                        this.camera.setPosition(position, self.data.enforceBounds);
                    },
                    onCompleteParams: ['{self}']
                }));

                // Ease in/out
                if (shake.easeIn && shake.easeOut) {
                    shakeTimeline.fromTo(shakeTimeline.data, duration * 0.5, {
                        intensity: 0
                    }, {
                        intensity: shake.intensity,
                        ease: shake.easeIn || Power0.easeNone
                    }, 0);

                    shakeTimeline.to(shakeTimeline.data, duration * 0.5, {
                        intensity: 0,
                        ease: shake.easeOut || Power0.easeNone
                    }, duration * 0.5);
                }
                // Ease in or ease
                else if (shake.easeIn && !shake.easeOut) {
                        shakeTimeline.fromTo(shakeTimeline.data, duration, {
                            intensity: 0
                        }, {
                            intensity: shake.intensity,
                            ease: shake.easeIn || Power0.easeNone
                        }, 0);
                    }
                    // Ease out
                    else if (!shake.easeIn && shake.easeOut) {
                            shakeTimeline.fromTo(shakeTimeline.data, duration, {
                                intensity: shake.intensity
                            }, {
                                intensity: 0,
                                ease: shake.easeOut || Power0.easeNone
                            }, 0);
                        }
                        // Ease
                        else if (options.ease) {
                                shakeTimeline.fromTo(shakeTimeline.data, duration, {
                                    intensity: 0
                                }, {
                                    intensity: shake.intensity,
                                    ease: options.ease || Power0.easeNone
                                }, 0);
                            }
                            // No ease
                            else {
                                    shakeTimeline.data.intensity = shake.intensity;
                                    shakeTimeline.to(shakeTimeline.data, duration, {}, 0);
                                }

                mainTimeline.add(shakeTimeline, 0);
            }

            this.add(mainTimeline);

            return this;
        }

        /**
        * Calculates the "to" property values.
        *
        * @private
        * @param {Object|Vector2} sourceOrigin - The source origin.
        * @param {Object|Vector2} sourcePosition - The source position.
        * @param {number} sourceRotation - The source rotation.
        * @param {number} sourceZoom - The source zoom.
        * @param {Oculo.Camera} camera - The camera.
        * @returns {Object} - The end properties.
        */

    }, {
        key: '_calculateToProps',
        value: function _calculateToProps(parsed, start) {
            var source = {
                origin: parsed.origin !== null ? parsed.origin : {},
                position: parsed.position !== null ? parsed.position : {},
                rotation: parsed.rotation,
                zoom: parsed.zoom
            };

            var isAnchored = false;
            // Changing to same origin is necessary for wheel zoom
            var isOriginXChanging = Number.isFinite(source.origin.x);
            var isOriginYChanging = Number.isFinite(source.origin.y);
            var isOriginChanging = isOriginXChanging || isOriginYChanging;
            // Changing to same position is necessary for camera resize
            var isPositionXChanging = Number.isFinite(source.position.x);
            var isPositionYChanging = Number.isFinite(source.position.y);
            var isPositionChanging = isPositionXChanging || isPositionYChanging;
            var isOffsetChanging = isPositionChanging;
            var isRotationChanging = Number.isFinite(source.rotation) && source.rotation !== start.rotation;
            var isZoomChanging = Number.isFinite(source.zoom) && source.zoom !== start.zoom;

            var startTransformation = new _matrix2.default().scale(start.zoom, start.zoom).rotate(_math2.default.degToRad(-start.rotation));
            var fovPosition = this.camera.center;
            var toOffset;
            var toOrigin = new _vector2.default(isOriginXChanging ? source.origin.x : start.origin.x, isOriginYChanging ? source.origin.y : start.origin.y);
            var toPosition = new _vector2.default(isPositionXChanging ? source.position.x : start.position.x, isPositionYChanging ? source.position.y : start.position.y);
            var toRotation = isRotationChanging ? source.rotation : start.rotation;
            var toZoom = isZoomChanging ? source.zoom : start.zoom;
            var toTransformation = new _matrix2.default().scale(toZoom, toZoom).rotate(_math2.default.degToRad(-toRotation));

            // rotateTo, zoomTo
            if (!isOriginChanging && !isPositionChanging) {
                isAnchored = true;
                toOrigin.copy(start.position);
            }
            // rotateAt, zoomAt
            else if (isOriginChanging && !isPositionChanging) {
                    isAnchored = true;
                    isPositionChanging = true;
                    fovPosition = this.camera._convertScenePositionToFOVPosition(toOrigin, start.position, this.camera.center, startTransformation);
                    console.log('fov pos: ', fovPosition);
                    toPosition = this.camera._convertScenePositionToCameraPosition(toOrigin, fovPosition, this.camera.center, toOrigin, toTransformation);
                }

            toOffset = this.camera._convertPositionToOffset(toPosition, this.camera.center, toOrigin, toTransformation);

            return {
                offsetX: isOffsetChanging ? toOffset.x : null,
                offsetY: isOffsetChanging ? toOffset.y : null,
                origin: isAnchored || isOriginChanging ? toOrigin : null,
                position: isPositionChanging ? toPosition : null,
                rotation: isRotationChanging ? toRotation : null,
                zoom: isZoomChanging ? toZoom : null
            };
        }

        /**
        * Gets the starting property values.
        *
        * @private
        * @returns {Object} - The starting properties.
        */

    }, {
        key: '_getStartProps',
        value: function _getStartProps() {
            return {
                origin: this.camera.transformOrigin.clone(),
                position: this.camera.position.clone(),
                rotation: this.camera.rotation,
                zoom: this.camera.zoom
            };
        }

        /**
        * Gets the ending property values.
        *
        * @private
        * @returns {Object} - The ending properties.
        */

    }, {
        key: '_getEndProps',
        value: function _getEndProps(to, start) {
            return {
                origin: to.origin !== null ? to.origin : start.origin,
                position: to.position !== null ? to.position : start.position,
                rotation: to.rotation !== null ? to.rotation : start.rotation,
                zoom: to.zoom !== null ? to.zoom : start.zoom
            };
        }

        /**
        * Initializes a core tween.
        *
        * @private
        * @param {TweenMax} tween - The tween.
        * @returns {this} self
        */

    }, {
        key: '_initCoreTween',
        value: function _initCoreTween(tween, startProps) {
            if (tween !== undefined) {
                startProps = startProps !== undefined ? startProps : this._getStartProps();

                var parsedProps = this._parseProps(tween.props.source.origin, tween.props.source.position, tween.props.source.rotation, tween.props.source.zoom);
                var toProps = this._calculateToProps(parsedProps, startProps);
                var endProps = this._getEndProps(toProps, startProps);

                this.previousProps = startProps;
                tween.props.start = startProps;
                tween.props.end = endProps;
                tween.props.parsed = parsedProps;
                tween.props.to = toProps;

                tween.vars.rawOffsetX = toProps.offsetX;
                tween.vars.rawOffsetY = toProps.offsetY;
                tween.vars.rotation = toProps.rotation;
                tween.vars.zoom = toProps.zoom;
            }

            return this;
        }

        /**
        * Parses the core animation properties.
        *
        * @private
        * @param {Object} origin - The origin.
        * @param {Object} position - The origin.
        * @param {number} rotation - The rotation.
        * @param {number} zoom - The zoom.
        * @returns {Object} - The parsed properties.
        */

    }, {
        key: '_parseProps',
        value: function _parseProps(origin, position, rotation, zoom) {
            if (position === 'previous' && this.previousProps.position) {
                position = this.previousProps.position;
            }

            if (rotation === 'previous' && !(0, _isNil2.default)(this.previousProps.rotation)) {
                rotation = this.previousProps.rotation;
            }

            if (zoom === 'previous' && !(0, _isNil2.default)(this.previousProps.zoom)) {
                zoom = this.previousProps.zoom;
            }

            return {
                origin: _utils2.default.parsePosition(origin, this.camera.scene.view),
                position: _utils2.default.parsePosition(position, this.camera.scene.view),
                rotation: !(0, _isNil2.default)(rotation) ? rotation : null,
                zoom: zoom || null
            };
        }

        /**
        * Parses the shake properties.
        *
        * @private
        * @param {Object} shake - The shake properties.
        * @returns {Object} - The parsed properties.
        */

    }, {
        key: '_parseShake',
        value: function _parseShake(shake) {
            var parsedShake = null;

            if (shake) {
                parsedShake = {
                    intensity: (0, _isNil2.default)(shake.intensity) ? 0 : shake.intensity,
                    direction: (0, _isNil2.default)(shake.direction) ? Animation.shake.direction.BOTH : shake.direction,
                    easeIn: shake.easeIn,
                    easeOut: shake.easeOut,
                    enforceBounds: shake.enforceBounds
                };
            }

            return parsedShake;
        }

        /**
        * Stops the animation and releases it for garbage collection.
        *
        * @returns {this} self
        *
        * @example
        * myAnimation.destroy();
        */

    }, {
        key: 'destroy',
        value: function destroy() {
            _get(Animation.prototype.__proto__ || Object.getPrototypeOf(Animation.prototype), 'kill', this).call(this);
            this.camera = null;
            this.currentKeyframe = null;
            this.previousProps = null;
        }

        /**
        * Animate the camera.
        *
        * @param {Object} props - The properties to animate.
        * @param {string|Element|Object} [props.position] - The location to move to. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [props.position.x] - The x coordinate on the raw scene.
        * @param {number} [props.position.y] - The y coordinate on the raw scene.
        * @param {string|Element|Object} [props.origin] - The location for the zoom's origin. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [props.origin.x] - The x coordinate on the raw scene.
        * @param {number} [props.origin.y] - The y coordinate on the raw scene.
        * @param {number|string} [props.rotation] - The rotation.
        * @param {Object} [props.shake] - An object of shake effect properties.
        * @param {number} [props.shake.intensity] - A {@link Camera#shakeIntensity|shake intensity}.
        * @param {Oculo.Animation.shake.direction} [props.shake.direction=Oculo.Animation.shake.direction.BOTH] - A shake direction. 
        * @param {Object} [props.shake.easeIn] - An {@link external:Easing|Easing}.
        * @param {Object} [props.shake.easeOut] - An {@link external:Easing|Easing}.
        * @param {number} [props.zoom] - A zoom value.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.animate({position: '#box100', zoom: 2}, 1);
        * myAnimation.animate({position: {x: 200, y: 50}, zoom: 2}, 1);
        * myAnimation.animate({origin: '#box100', zoom: 2}, 1);
        * myAnimation.animate({origin: {x: 200, y: 50}, zoom: 2}, 1);
        */

    }, {
        key: 'animate',
        value: function animate(props, duration, options) {
            this._animate({
                position: props.position,
                origin: props.origin,
                rotation: props.rotation,
                shake: props.shake,
                zoom: props.zoom
            }, duration, options);

            return this;
        }

        /**
        * Move to a specific position.
        *
        * @param {string|Element|Object} position - The position to move to. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [position.x] - The x coordinate on the raw scene.
        * @param {number} [position.y] - The y coordinate on the raw scene.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.moveTo('#box100', 1);
        * myAnimation.moveTo(document.getElementById('box100'), 1);
        * myAnimation.moveTo({x:200, y: 50}, 1);
        * myAnimation.moveTo({x: 200}, 1);
        * myAnimation.moveTo({y: 200}, 1);
        */

    }, {
        key: 'moveTo',
        value: function moveTo(position, duration, options) {
            this._animate({
                position: position
            }, duration, options);

            return this;
        }

        /**
        * Rotate at the specified location.
        *
        * @param {string|Element|Object} origin - The location for the rotation's origin. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [origin.x] - The x coordinate on the raw scene.
        * @param {number} [origin.y] - The y coordinate on the raw scene.
        * @param {number|string} rotation - The rotation.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.rotateAt('#box100', 20, 1);
        * myAnimation.rotateAt(document.getElementById('box100'), 20, 1);
        * myAnimation.rotateAt({x: 200, y: 50}, 20, 1);
        */

    }, {
        key: 'rotateAt',
        value: function rotateAt(origin, rotation, duration, options) {
            this._animate({
                origin: origin,
                rotation: rotation
            }, duration, options);

            return this;
        }

        /**
        * Rotate at the current position.
        *
        * @param {number|string} rotation - The rotation.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.rotateTo(20, 1);
        */

    }, {
        key: 'rotateTo',
        value: function rotateTo(rotation, duration, options) {
            this._animate({
                rotation: rotation
            }, duration, options);

            return this;
        }

        /**
        * Shake the camera.
        *
        * @param {number} intensity - A {@link Camera#shakeIntensity|shake intensity}.
        * @param {number} duration - A duration.
        * @param {Oculo.Animation.shake.direction} [direction=Oculo.Animation.shake.direction.BOTH] - A shake direction. 
        * @param {Object} [options] - An object of {@link external:TimelineMax|TimelineMax} options plus:
        * @param {Object} [options.easeIn] - An {@link external:Easing|Easing}.
        * @param {Object} [options.easeOut] - An {@link external:Easing|Easing}.
        * @returns {this} self
        *
        * @example
        * myAnimation.shake(0.1, 4);
        * myAnimation.shake(0.1, 4, Oculo.Animation.shake.direction.HORIZONTAL, { easeIn: Power2.easeIn, easeOut: Power2.easeOut })
        */

    }, {
        key: 'shake',
        value: function shake(intensity, duration, direction, options) {
            options = options || {};

            this.animate({
                shake: {
                    intensity: intensity,
                    direction: direction,
                    easeIn: options.easeIn,
                    easeOut: options.easeOut,
                    enforceBounds: options.enforceBounds
                }
            }, duration, options);

            return this;
        }

        /**
        * Zoom in/out at a specific location.
        *
        * @param {string|Element|Object} origin - The location for the zoom's origin. It can be a selector, an element, or an object with x/y coordinates.
        * @param {number} [origin.x] - The x coordinate on the raw scene.
        * @param {number} [origin.y] - The y coordinate on the raw scene.
        * @param {number} zoom - A zoom value.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.zoomAt('#box100', 2, 1);
        * myAnimation.zoomAt(document.getElementById('box100'), 2, 1);
        * myAnimation.zoomAt({x: 200, y: 50}, 2, 1);
        */

    }, {
        key: 'zoomAt',
        value: function zoomAt(origin, zoom, duration, options) {
            this._animate({
                origin: origin,
                zoom: zoom
            }, duration, options);

            return this;
        }

        /**
        * Zoom in/out at the current position.
        *
        * @param {number} zoom - A zoom value.
        * @param {number} duration - A duration.
        * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
        * @returns {this} self
        *
        * @example
        * myAnimation.zoomTo(2, 1);
        */

    }, {
        key: 'zoomTo',
        value: function zoomTo(zoom, duration, options) {
            this._animate({
                zoom: zoom
            }, duration, options);

            return this;
        }
    }]);

    return Animation;
}(TimelineMax);

/**
* Shake directions.
* @enum {number}
*/


Animation.shake = {
    direction: {
        /**
        * Both the x and y axes.
        */
        BOTH: 0,
        /**
        * The x axis.
        */
        HORIZONTAL: 1,
        /**
        * The y axis.
        */
        VERTICAL: 2
    }
};

exports.default = Animation;

},{"./constants":45,"./math/math":48,"./math/matrix2":49,"./math/vector2":50,"./utils":55,"lodash/isElement":24,"lodash/isFinite":25,"lodash/isFunction":26,"lodash/isNil":28,"lodash/isObject":29}],43:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Animation = require('./Animation');

var _Animation2 = _interopRequireDefault(_Animation);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Description.
* 
* @class Oculo.AnimationManager
* @constructor
* @param {Object} camera - The camera that owns this AnimationManager.
*/
var AnimationManager = function () {
    function AnimationManager(camera) {
        _classCallCheck(this, AnimationManager);

        /**
        * @property {Object} - The camera that owns this AnimationManager.
        * @readonly
        */
        this.camera = camera;

        /**
        * @property {Oculo.Animation} - The active animation.
        * @readonly
        */
        this.currentAnimation = null;

        /**
        * @property {Object} - An object for storing the Animation instances.
        * @private
        */
        this._animations = {};
    }

    /**
    * @name AnimationManager#isAnimating
    * @property {boolean} - Whether the current animation is running or not.
    * @readonly
    */


    _createClass(AnimationManager, [{
        key: 'add',


        /**
        * Adds an animation.
        *
        * @param {string} name - The name to give the animation.
        * @param {object|Oculo.Animation} animation - The animation. It can be an actual animation instance or an object representing the animation.
        * @returns {this} self
        *
        * @example <caption>As an animation instance</caption>
        * myAnimationManager.add('zoomInOut', new Oculo.Animation(myCamera).animate({zoom: 2}, 2, {ease: Power2.easeIn}).animate({zoom: 1}, 2, {ease: Power2.easeOut}));
        * 
        * @example <caption>As an object representing an animation</caption>
        * myAnimationManager.add('zoomInAndOut', { 
        *   keyframes: [{ 
        *     zoom: 2, 
        *     duration: 2, 
        *     options: { 
        *       ease: Power2.easeIn 
        *     }
        *   }, {
        *     zoom: 1,
        *     duration: 2,
        *     options: {
        *       ease: Power2.easeOut
        *     }
        *   }]
        * });
        */
        value: function add(name, animation) {
            var newAnimation = void 0;

            if (this._animations[name]) {
                this._animations[name].destroy();
            }

            if (animation.type === _constants.Type.ANIMATION) {
                newAnimation = animation;
            } else {
                newAnimation = new _Animation2.default(this.camera);
                animation.keyframes.forEach(function (keyframe) {
                    newAnimation.animate({
                        origin: keyframe.origin,
                        position: keyframe.position,
                        rotation: keyframe.rotation,
                        shake: keyframe.shake,
                        zoom: keyframe.zoom
                    }, keyframe.duration, keyframe.options);
                });
            }

            this._animations[name] = newAnimation;

            return this;
        }

        /**
        * Destroys the AnimationManager and prepares it for garbage collection.
        *
        * @returns {this} self
        */

    }, {
        key: 'destroy',
        value: function destroy() {
            for (var key in this._animations) {
                this._animations[key].destroy();
            }

            this.camera = null;
            this.currentAnimation = null;
            this._animations = {};

            return this;
        }

        /**
        * Gets an animation.
        *
        * @param {string} name - The name of the animation.
        * @returns {Oculo.Animation} The animation.
        */

    }, {
        key: 'get',
        value: function get(name) {
            return this._animations[name];
        }

        /**
        * Pauses the active animation.
        *
        * @see {@link external:TimelineMax|TimelineMax}
        * @returns {this} self
        */

    }, {
        key: 'pause',
        value: function pause() {
            if (this.currentAnimation) {
                this.currentAnimation.pause(null, false);
            }

            return this;
        }

        /**
        * Plays the current or provided animation forward from the current playhead position.
        * @param {string} [name] - The name of the animation to play.
        *
        * @returns {this} self
        */

    }, {
        key: 'play',
        value: function play(name) {
            var animation;

            if (typeof name === 'string') {
                animation = this._animations[name];
            }

            if (animation) {
                this.currentAnimation = animation;
                this.currentAnimation.invalidate().restart(false, false);
            } else if (name === undefined && this.currentAnimation) {
                this.currentAnimation.play(null, false);
            }

            return this;
        }

        /**
        * Resumes playing the animation from the current playhead position.
        *
        * @see {@link external:TimelineMax|TimelineMax}
        * @returns {this} self
        */

    }, {
        key: 'resume',
        value: function resume() {
            if (this.currentAnimation) {
                this.currentAnimation.resume(null, false);
            }

            return this;
        }

        /**
        * Reverses playback of an animation.
        *
        * @param {string} [name=null] - The name of the animation. If none is specified, the current animation will be reversed.
        * @returns {this} self
        */

    }, {
        key: 'reverse',
        value: function reverse() {
            var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            var animation;

            if (typeof name === 'string') {
                animation = this._animations[name];
            }

            if (animation) {
                this.currentAnimation = animation;
                this.currentAnimation.invalidate().reverse(0, false);
            } else if (name === null && this.currentAnimation) {
                var time = this.currentAnimation.time();
                this.currentAnimation.reverse();
            }

            return this;
        }
    }, {
        key: 'isAnimating',
        get: function get() {
            var progress = this.currentAnimation ? this.currentAnimation.progress() : 0;
            return progress > 0 && progress < 1;
        }

        /**
        * @name AnimationManager#isPaused
        * @property {boolean} - Whether the current animation is paused or not.
        * @readonly
        */

    }, {
        key: 'isPaused',
        get: function get() {
            return this.currentAnimation ? this.currentAnimation.paused() : false;
        }
    }]);

    return AnimationManager;
}();

exports.default = AnimationManager;

},{"./Animation":41,"./constants":45}],44:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

// TODO:
// 1) Import Animation to avoid using Oculo namespace

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _clamp = require('lodash/clamp');

var _clamp2 = _interopRequireDefault(_clamp);

var _isElement = require('lodash/isElement');

var _isElement2 = _interopRequireDefault(_isElement);

var _isFinite = require('lodash/isFinite');

var _isFinite2 = _interopRequireDefault(_isFinite);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isNil = require('lodash/isNil');

var _isNil2 = _interopRequireDefault(_isNil);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _constants = require('./constants');

var _fbemitter = require('fbemitter');

var _animationManager = require('./animationManager');

var _animationManager2 = _interopRequireDefault(_animationManager);

var _cssRenderer = require('./cssRenderer');

var _cssRenderer2 = _interopRequireDefault(_cssRenderer);

var _math = require('./math/math');

var _math2 = _interopRequireDefault(_math);

var _matrix = require('./math/matrix2');

var _matrix2 = _interopRequireDefault(_matrix);

var _scene = require('./scene');

var _scene2 = _interopRequireDefault(_scene);

var _sceneManager = require('./sceneManager');

var _sceneManager2 = _interopRequireDefault(_sceneManager);

var _trackControl = require('./trackControl');

var _trackControl2 = _interopRequireDefault(_trackControl);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _vector = require('./math/vector2');

var _vector2 = _interopRequireDefault(_vector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var animationName = {
    ANONYMOUS: '_anonymous'
};

/**
* Description.
* 
* @class Oculo.Camera
* @constructor
* @param {Object} [options] - An object of options.
* @param {function|Object} [options.bounds] - The bounds.
* @param {boolean} [options.dragToMove] - Whether the camera's position is draggable or not.
* @param {number} [options.minZoom] - The {@link Camera.minZoom|minimum zoom}.
* @param {number} [options.maxZoom] - The {@link Camera.maxZoom|maximum zoom}.
* @param {string|Element|null} [options.view] - The camera's view.
* @param {boolean} [options.wheelToZoom] - Whether wheeling can be used to zoom or not.
* @param {number} [options.wheelToZoomIncrement] - The base {@link Camera.wheelToZoomIncrement|zoom increment}.
* @param {number|string} [options.width] - The camera's {@link Camera.width|width}.
* @param {number|string} [options.height] - The camera's {@link Camera.height|height}.
*
* @example
* var myCamera = new Oculo.Camera({ 
*   view: '#camera',
*   bounds: Oculo.Camera.bounds.WORLD_EDGE,
*   dragToMove: true,
*   minZoom: 0.5,
*   maxZoom: 3,
*   wheelToZoom: true,
*   wheelToZoomIncrement: 0.5,
*   width: 1000,
*   height: 500
* });
*/

var Camera = function () {
    function Camera() {
        var _this = this;

        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$bounds = _ref.bounds,
            bounds = _ref$bounds === undefined ? null : _ref$bounds,
            _ref$dragToMove = _ref.dragToMove,
            dragToMove = _ref$dragToMove === undefined ? false : _ref$dragToMove,
            _ref$height = _ref.height,
            height = _ref$height === undefined ? 0 : _ref$height,
            _ref$maxZoom = _ref.maxZoom,
            maxZoom = _ref$maxZoom === undefined ? 3 : _ref$maxZoom,
            _ref$minZoom = _ref.minZoom,
            minZoom = _ref$minZoom === undefined ? 0.5 : _ref$minZoom,
            _ref$onInitialize = _ref.onInitialize,
            onInitialize = _ref$onInitialize === undefined ? null : _ref$onInitialize,
            _ref$onBeforeRender = _ref.onBeforeRender,
            onBeforeRender = _ref$onBeforeRender === undefined ? null : _ref$onBeforeRender,
            _ref$onRender = _ref.onRender,
            onRender = _ref$onRender === undefined ? null : _ref$onRender,
            _ref$view = _ref.view,
            view = _ref$view === undefined ? undefined : _ref$view,
            _ref$wheelToZoom = _ref.wheelToZoom,
            wheelToZoom = _ref$wheelToZoom === undefined ? false : _ref$wheelToZoom,
            _ref$wheelToZoomIncre = _ref.wheelToZoomIncrement,
            wheelToZoomIncrement = _ref$wheelToZoomIncre === undefined ? 0.01 : _ref$wheelToZoomIncre,
            _ref$width = _ref.width,
            width = _ref$width === undefined ? 0 : _ref$width;

        _classCallCheck(this, Camera);

        /**
        * @property {Oculo.AnimationManager} - An object for managing animations.
        * @readonly
        */
        this.animations = new _animationManager2.default(this);

        /**
        * @property {Vector2} - The center of the camera's FOV.
        * @readonly
        */
        this.center = new _vector2.default(width, height).multiplyScalar(0.5);

        /**
        * @property {boolean} - Whether the camera's position is draggable or not.
        * @default false
        */
        this.dragToMove = dragToMove === true ? true : false;

        /**
        * @property {number} - The height.
        * @readonly
        * @default 0
        */
        this.height = height;

        /**
        * @property {boolean} - Whether the camera has been rendered or not.
        * @readonly
        * @default
        */
        this.isRendered = false;

        /**
        * @property {null|number} - The minimum X position after bounds are applied.
        * @readonly
        */
        this.minPositionX = null;

        /**
        * @property {null|number} - The minimum Y position after bounds are applied.
        * @readonly
        */
        this.minPositionY = null;

        /**
        * @property {null|number} - The maximum X position after bounds are applied.
        * @readonly
        */
        this.maxPositionX = null;

        /**
        * @property {null|number} - The maximum Y position after bounds are applied.
        * @readonly
        */
        this.maxPositionY = null;

        /**
        * The minimum value the camera can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 0.5
        */
        this.minZoom = minZoom;

        /**
        * The maximum value the camera can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 3
        */
        this.maxZoom = maxZoom;

        /**
        * @property {number} - The position of the camera on the scene.
        * @readonly
        */
        this.position = new _vector2.default(0, 0);

        /**
        * @property {number} - The offset of the camera's top left corner relative to the scene without any effects applied.
        * @readonly
        */
        this.rawOffset = new _vector2.default(0, 0);

        /**
        * @property {number} - The position of the camera on the scene without any effects applied.
        * @readonly
        */
        this.rawPosition = new _vector2.default(0, 0);

        /**
        * @property {number} - The renderer.
        * @readonly
        */
        this.renderer = new _cssRenderer2.default(this);

        /**
        * @property {number} - The amount of rotation in degrees.
        * @readonly
        * @default 0
        */
        this.rotation = 0;

        /**
        * @property {Oculo.SceneManager} - An object for managing scenes.
        * @readonly
        */
        this.scenes = new _sceneManager2.default(this);

        /**
        * @property {TrackControl} - The track control.
        * @readonly
        * @default
        */
        this.trackControl = null;

        /**
        * @property {Vector2} - The transformation origin.
        * @readonly
        */
        this.transformOrigin = new _vector2.default(0, 0);

        /**
        * @private
        * @property {Element} - The view.
        */
        this.view = view === null ? null : _utils2.default.DOM.parseView(view) || document.createElement('div');

        /**
        * @property {boolean} - Whether wheeling can be used to zoom or not.
        * @default false
        */
        this.wheelToZoom = wheelToZoom === true ? true : false;

        /**
        * @property {number} - The base increment at which the camera will be zoomed. See {@link Camera.zoom|zoom}.
        * @default 0.01
        */
        this.wheelToZoomIncrement = wheelToZoomIncrement;

        /**
        * @property {number} - The width.
        * @readonly
        * @default 0
        */
        this.width = width;

        /**
        * @property {number} - The zoom direction.
        * @readonly
        * @default 0
        */
        this.zoomDirection = _constants.zoomDirection.NONE;

        /**
        * @private
        * @property {null|function|Object} - The internally managed bounds.
        */
        this._bounds = bounds;

        /**
        * @private
        * @property {EventEmitter} - The internal event emitter.
        */
        this._events = new _fbemitter.EventEmitter();

        /**
        * @private
        * @property {number} - The scale at which the scene is rasterized.
        */
        this._rasterScale = 1;

        /**
        * @private
        * @property {number} - The internally managed zoom.
        */
        this._zoom = 1;

        // Initialize position
        this.setRawPosition(new _vector2.default(width * 0.5, height * 0.5));

        // Initialize events
        if (onInitialize !== null) {
            this.onInitialize = onInitialize;
        }

        if (onBeforeRender !== null) {
            this.onBeforeRender = onBeforeRender;
        }

        if (onRender !== null) {
            this.onRender = onRender;
        }

        this.onResize = function () {
            // Maintain camera position and update the current animation
            new Oculo.Animation(_this, {
                destroyOnComplete: true,
                paused: false,
                onComplete: function onComplete(wasPaused) {
                    if (this.camera.animations.currentAnimation) {
                        // 'this' is bound to the Animation via the Animation class
                        var animation = this.camera.animations.currentAnimation;
                        var time = animation.time();

                        animation.seek(0).invalidate();

                        if (animation.coreTweens[0]) {
                            this.camera.setRawPosition(animation.coreTweens[0].props.start.position);
                        }

                        animation.seek(time, false);

                        if (!wasPaused) {
                            this.camera.resume();
                        }
                    }
                },
                onCompleteParams: [_this.animations.isPaused]
            }).moveTo(_this.rawPosition, 0, { overwrite: false });
        };

        // Initialize event listeners
        this._events.addListener('change:size', this.onResize);

        // Initialize view
        if (this.view) {
            this.view.style.overflow = 'hidden';
            this.view.style.position = 'relative';
        }

        // Initialize scene manager view and track controls
        if (this.view && this.scenes.view) {
            this.view.appendChild(this.scenes.view);
            this.trackControl = new _trackControl2.default(this, {
                draggable: this.dragToMove,
                onDrag: function onDrag(camera) {
                    var position = camera._convertOffsetToPosition(new _vector2.default(-this.x, -this.y), camera.center, camera.transformOrigin, camera.transformation);
                    new Oculo.Animation(camera, {
                        destroyOnComplete: true,
                        paused: false,
                        onComplete: function onComplete(dragControl) {
                            dragControl.update();
                        },
                        onCompleteParams: [this]
                    }).moveTo(position, 0);
                },
                wheelable: this.wheelToZoom,
                onWheel: function onWheel(camera) {
                    var ZOOM_IN = 1;
                    var ZOOM_OUT = 0;
                    var velocity = Math.abs(this.wheelEvent.deltaY);
                    var direction = this.wheelEvent.deltaY > 0 ? ZOOM_OUT : ZOOM_IN;
                    var previousDirection = this.previousWheelEvent.deltaY > 0 ? ZOOM_OUT : ZOOM_IN;
                    var cameraRect;
                    var cameraFOVPosition = new _vector2.default();
                    var scenePosition = new _vector2.default();
                    var origin = camera.transformOrigin;
                    var zoom = camera.zoom + camera.zoom * camera.wheelToZoomIncrement * (velocity > 1 ? velocity * 0.5 : 1) * (direction === ZOOM_IN ? 1 : -1);

                    // Performance Optimization: If zoom has not changed because it's at the min/max, don't zoom.
                    if (direction === previousDirection && camera._clampZoom(zoom) !== camera.zoom) {
                        cameraRect = camera.view.getBoundingClientRect();
                        cameraFOVPosition.set(this.wheelEvent.clientX - cameraRect.left, this.wheelEvent.clientY - cameraRect.top);
                        scenePosition = camera._convertFOVPositionToScenePosition(cameraFOVPosition, camera.position, camera.center, camera.transformation);
                        console.log('s pos: ', scenePosition);

                        if (Math.floor(origin.x) !== Math.floor(scenePosition.x) || Math.floor(origin.y) !== Math.floor(scenePosition.y)) {
                            origin = scenePosition;
                        }

                        new Oculo.Animation(camera, {
                            destroyOnComplete: true,
                            paused: false
                        }).zoomAt(origin, zoom, 0);
                    }
                }
            });
        }

        this.onInitialize(arguments[0]);
    }

    /**
    * @name Camera#bounds
    * @property {null|function|Object} - The camera's bounds. The minimum and maximum position values for the camera. Set to null if no bounds are desired.
    *
    * @example <caption>As a stock bounds</caption>
    * Oculo.Camera.bounds.WORLD
    *
    * @example <caption>As a bounds object</caption>
    * { 
    *   minX: 0, 
    *   minY: 0, 
    *   maxX: this.scene.width, 
    *   maxY: this.scene.height
    * }
    *
    * @example <caption>As a function that returns a bounds object</caption>
    * function () { 
    *   var transformation = new Matrix2().scale(this.zoom, this.zoom).getInverse();
    *   var min = new Vector2().add(this.center).transform(transformation);
    *   var max = new Vector2(this.scene.scaledWidth, this.scene.scaledHeight).subtract(this.center).transform(transformation);
    * 
    *   return {
    *     minX: min.x,
    *     minY: min.y,
    *     maxX: max.x,
    *     maxY: max.y
    *   }
    * }
    */


    _createClass(Camera, [{
        key: '_clampPositionX',


        /**
        * Clamps the X position.
        *
        * @private
        * @param {number} x - The position.
        * @returns {number} The clamped position.
        */
        value: function _clampPositionX(x) {
            if (this._bounds !== null) {
                x = (0, _clamp2.default)(x, this.minPositionX, this.maxPositionX);
            }

            return x;
        }

        /**
        * Clamps the Y position.
        *
        * @private
        * @param {number} y - The position.
        * @returns {number} The clamped position.
        */

    }, {
        key: '_clampPositionY',
        value: function _clampPositionY(y) {
            if (this._bounds !== null) {
                y = (0, _clamp2.default)(y, this.minPositionY, this.maxPositionY);
            }

            return y;
        }

        /**
        * Clamps the zoom.
        *
        * @private
        * @param {number} zoom - The zoom.
        * @returns {number} The clamped zoom.
        */

    }, {
        key: '_clampZoom',
        value: function _clampZoom(zoom) {
            return (0, _clamp2.default)(zoom, this.minZoom, this.maxZoom);
        }

        /**
        * Converts a FOV position to a scene position.
        *
        * @private
        * @param {Vector2} cameraFOVPosition - The point in the camera's FOV.
        * @param {Vector2} cameraPosition - The camera's position.
        * @param {Vector2} cameraCenter - The center of the camera's FOV.
        * @param {Matrix2} transformation - The transformation matrix.
        * @returns {Vector2} The scene position.
        */

    }, {
        key: '_convertFOVPositionToScenePosition',
        value: function _convertFOVPositionToScenePosition(cameraFOVPosition, cameraPosition, cameraCenter, transformation) {
            return cameraPosition.clone().transform(transformation).subtract(cameraCenter.clone().subtract(cameraFOVPosition)).transform(transformation.getInverse());
        }

        /**
        * Converts a scene position to a FOV position.
        *
        * @private
        * @param {Vector2} scenePosition - The raw point on the scene.
        * @param {Vector2} cameraPosition - The camera's position.
        * @param {Vector2} cameraCenter - The center of the camera's FOV.
        * @param {Matrix2} transformation - The transformation matrix.
        * @returns {Vector2} The FOV position.
        */

    }, {
        key: '_convertScenePositionToFOVPosition',
        value: function _convertScenePositionToFOVPosition(scenePosition, cameraPosition, cameraCenter, transformation) {
            return cameraCenter.clone().add(scenePosition.clone().transform(transformation).subtract(cameraPosition.clone().transform(transformation)));
        }

        /**
        * Converts a scene position located at a FOV position to a camera position.
        *
        * @private
        * @param {Vector2} scenePosition - The raw point on the scene.
        * @param {Vector2} cameraFOVPosition - The point in the camera's FOV.
        * @param {Vector2} cameraCenter - The center of the camera's FOV.
        * @param {Vector2} transformOrigin - The transform origin.
        * @param {Matrix2} transformation - The transformation matrix.
        * @returns {Vector2} The camera position.
        */

    }, {
        key: '_convertScenePositionToCameraPosition',
        value: function _convertScenePositionToCameraPosition(scenePosition, cameraFOVPosition, cameraCenter, transformOrigin, transformation) {
            var transformOriginOffset = this._getTransformOriginOffset(transformOrigin, transformation);
            var offset = scenePosition.clone().transform(transformation).subtract(transformOriginOffset).subtract(cameraFOVPosition);

            return this._convertOffsetToPosition(offset, cameraCenter, transformOrigin, transformation);
        }

        /**
        * Converts a camera offset to a camera position.
        *
        * @private
        * @param {Vector2} cameraOffset - The camera's offset on the scene.
        * @param {Vector2} cameraCenter - The center of the camera's FOV.
        * @param {Vector2} transformOrigin - The transform origin.
        * @param {Matrix2} transformation - The transformation matrix.
        * @returns {Vector2} The camera position.
        */

    }, {
        key: '_convertOffsetToPosition',
        value: function _convertOffsetToPosition(cameraOffset, cameraCenter, transformOrigin, transformation) {
            var transformOriginOffset = this._getTransformOriginOffset(transformOrigin, transformation);

            return cameraOffset.clone().add(transformOriginOffset).add(cameraCenter).transform(transformation.getInverse());
        }

        /**
        * Converts a camera position to a camera offset.
        *
        * @private
        * @param {Vector2} cameraPosition - The camera's position on the scene.
        * @param {Vector2} cameraCenter - The center of the camera's FOV.
        * @param {Vector2} transformOrigin - The transform origin.
        * @param {Matrix2} transformation - The transformation matrix.
        * @returns {Vector2} The camera offset.
        */

    }, {
        key: '_convertPositionToOffset',
        value: function _convertPositionToOffset(cameraPosition, cameraCenter, transformOrigin, transformation) {
            var transformOriginOffset = this._getTransformOriginOffset(transformOrigin, transformation);

            return cameraPosition.clone().transform(transformation).subtract(transformOriginOffset).subtract(cameraCenter);
        }

        /**
        * Gets the offset of the transform origin.
        *
        * @private
        * @param {Vector2} transformOrigin - The transformation origin.
        * @param {Matrix2} transformation - The transformation matrix.
        * @returns {Vector2} The offset.
        */

    }, {
        key: '_getTransformOriginOffset',
        value: function _getTransformOriginOffset(transformOrigin, transformation) {
            return transformOrigin.clone().transform(transformation).subtract(transformOrigin);
        }

        /**
        * Resets the camera to the default state.
        *
        * @returns {this} self
        */

    }, {
        key: '_reset',
        value: function _reset() {
            this.transformOrigin.set(0, 0);
            this.rotation = 0;
            this.zoom = 1;
            this._rasterScale = 1;
            this.setRawPosition(new _vector2.default(this.width * 0.5, this.height * 0.5));

            return this;
        }

        /**
        * Updates the bounds.
        *
        * returns {this} self
        */

    }, {
        key: '_updateBounds',
        value: function _updateBounds() {
            var bounds;

            if (this.scene) {
                if (this._bounds === null) {
                    bounds = {
                        minX: null,
                        minY: null,
                        maxX: null,
                        maxY: null
                    };
                } else if ((0, _isFunction2.default)(this._bounds)) {
                    bounds = this._bounds.call(this);
                } else {
                    bounds = this._bounds;
                }

                this.minPositionX = bounds.minX;
                this.minPositionY = bounds.minY;
                this.maxPositionX = bounds.maxX;
                this.maxPositionY = bounds.maxY;

                // TODO: For dev only
                console.log('update bounds');
            }

            return this;
        }

        /**
        * Adds an animation to the camera.
        *
        * @see Oculo.AnimationManager.add
        * returns {this} self
        */

    }, {
        key: 'addAnimation',
        value: function addAnimation(name, animation) {
            this.animations.add(name, animation);

            return this;
        }

        /**
        * Gets an animation.
        *
        * @see Oculo.AnimationManager.get
        */

    }, {
        key: 'getAnimation',
        value: function getAnimation(name) {
            return this.animations.get(name);
        }

        /**
        * Adds a scene to the camera.
        *
        * @see Oculo.SceneManager.add
        * @returns {this} self
        */

    }, {
        key: 'addScene',
        value: function addScene(name, scene) {
            this.scenes.add(name, scene);

            return this;
        }

        /**
        * Gets a scene.
        *
        * @see Oculo.SceneManager.get
        */

    }, {
        key: 'getScene',
        value: function getScene(name) {
            return this.scenes.get(name);
        }

        /**
        * Sets the active scene.
        *
        * @param {string} name - The name of the scene.
        * @returns {this} self
        */

    }, {
        key: 'setScene',
        value: function setScene(name) {
            this.scenes.setActiveScene(name);
            this._reset();

            return this;
        }

        /**
        * Destroys the camera and prepares it for garbage collection.
        *
        * @returns {this} self
        */

    }, {
        key: 'destroy',
        value: function destroy() {
            if (this.view && this.view.parentNode) {
                this.view.parentNode.removeChild(this.view);
            }

            this.view = null;
            this.animations.destroy();
            this.renderer.destroy();
            this.scenes.destroy();
            this.trackControl.destroy();
            this._events.removeAllListeners();

            return this;
        }

        /**
        * Disables drag-to-move.
        *
        * @returns {this} self
        */

    }, {
        key: 'disableDragToMove',
        value: function disableDragToMove() {
            this.trackControl.disableDrag();

            return this;
        }

        /**
        * Enables drag-to-move.
        *
        * @returns {this} self
        */

    }, {
        key: 'enableDragToMove',
        value: function enableDragToMove() {
            this.trackControl.enableDrag();

            return this;
        }

        /**
        * Disables wheel-to-zoom.
        *
        * @returns {this} self
        */

    }, {
        key: 'disableWheelToZoom',
        value: function disableWheelToZoom() {
            this.trackControl.disableWheel();

            return this;
        }

        /**
        * Enables wheel-to-zoom.
        *
        * @returns {this} self
        */

    }, {
        key: 'enableWheelToZoom',
        value: function enableWheelToZoom() {
            this.trackControl.enableWheel();

            return this;
        }

        /**
        * Called when the camera has been initialized. The default implementation is a no-op. Override this function with your own code.
        *
        * @param {Object} [options] - The options passed to the constructor when the camera was created.
        */

    }, {
        key: 'onInitialize',
        value: function onInitialize(options) {}

        /**
        * Called before the camera has rendered. The default implementation is a no-op. Override this function with your own code.
        */

    }, {
        key: 'onBeforeRender',
        value: function onBeforeRender() {}

        /**
        * Called after the camera has rendered. The default implementation is a no-op. Override this function with your own code.
        */

    }, {
        key: 'onRender',
        value: function onRender() {}

        /**
        * Render the camera view. If you need to manipulate how the camera renders, use {@link Camera#onBeforeRender|onBeforeRender} and {@link Camera#onRender|onRender}.
        *
        * @returns {Camera} The view.
        */

    }, {
        key: 'render',
        value: function render() {
            this.onBeforeRender();

            if (!this.isRendered) {
                this.renderer.renderSize();
                this.isRendered = true;
            }

            this.renderer.render();
            this.onRender();

            return this;
        }

        /**
        * Sets the position.
        *
        * @param {Vector2} position - The new position.
        * @param {boolean} enforceBounds - Whether to enforce bounds or not.
        * @returns {this} self
        */

    }, {
        key: 'setPosition',
        value: function setPosition(position) {
            var enforceBounds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            if (enforceBounds) {
                this.position.set(this._clampPositionX(position.x), this._clampPositionY(position.y));
            } else {
                this.position.set(position.x, position.y);
            }

            return this;
        }

        /**
        * Sets the raw position and updates dependent data.
        *
        * @param {Vector2} position - The new position.
        * @returns {this} self
        */

    }, {
        key: 'setRawPosition',
        value: function setRawPosition(position) {
            this.rawPosition.set(this._clampPositionX(position.x), this._clampPositionY(position.y));
            this.position.copy(this.rawPosition);
            this.rawOffset.copy(this._convertPositionToOffset(this.rawPosition, this.center, this.transformOrigin, this.transformation));

            return this;
        }

        /**
        * Sets the size of the camera.
        *
        * @param {number|string} width - The width.
        * @param {number|string} height - The height.
        * @returns {this} self
        */

    }, {
        key: 'setSize',
        value: function setSize(width, height) {
            var hasChanged = false;

            if (!(0, _isNil2.default)(width) && width !== this.width) {
                this.width = width;
                this.center.x = width * 0.5;
                hasChanged = true;
            }

            if (!(0, _isNil2.default)(height) && height !== this.height) {
                this.height = height;
                this.center.y = height * 0.5;
                hasChanged = true;
            }

            if (hasChanged) {
                this.renderer.renderSize();
                this._events.emit('change:size');
            }

            return this;
        }

        /**
        * Sets the transformOrigin.
        *
        * @private
        * @param {Vector2} origin - The origin.
        * @returns {this} self
        */

    }, {
        key: 'setTransformOrigin',
        value: function setTransformOrigin(origin) {
            if (origin && !origin.equals(this.transformOrigin)) {
                this.transformOrigin.copy(origin);

                if (this.isRotated || this.isZoomed) {
                    this.rawOffset.copy(this._convertPositionToOffset(this.rawPosition, this.center, this.transformOrigin, this.transformation));
                }
            }

            return this;
        }

        /**
        * Pauses the camera animation.
        *
        * @see {@link external:TimelineMax|TimelineMax}
        * @returns {this} self
        */

    }, {
        key: 'pause',
        value: function pause() {
            this.animations.pause();

            return this;
        }

        /**
        * Plays the camera animation forward from the current playhead position.
        *
        * @see {@link external:TimelineMax|TimelineMax}
        * @returns {this} self
        */

    }, {
        key: 'play',
        value: function play(animation) {
            this.animations.play(animation);

            return this;
        }

        /**
        * Resumes playing the camera animation from the current playhead position.
        *
        * @see {@link external:TimelineMax|TimelineMax}
        * @returns {this} self
        */

    }, {
        key: 'resume',
        value: function resume() {
            this.animations.resume();

            return this;
        }

        /**
        * Reverses playback of an animation.
        *
        * @param {string} [name] - The name of the animation. If none is specified, the current animation will be reversed.
        * @returns {this} self
        */

    }, {
        key: 'reverse',
        value: function reverse(name) {
            this.animations.reverse(name);

            return this;
        }

        /**
        * Immediately animate the camera.
        *
        * @see {@link Camera.Animation#animate|Animation.animate}
        * @returns {this} self
        */

    }, {
        key: 'animate',
        value: function animate(props, duration, options) {
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).animate(props, duration, options));
            this.animations.play(animationName.ANONYMOUS);

            return this;
        }

        /**
        * Immediately move to a specific position.
        *
        * @see {@link Camera.Animation#moveTo|Animation.moveTo}
        * @returns {this} self
        */

    }, {
        key: 'moveTo',
        value: function moveTo(position, duration, options) {
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).moveTo(position, duration, options));
            this.animations.play(animationName.ANONYMOUS);

            return this;
        }

        /**
        * Immediately rotate at the specified location.
        *
        * @see {@link Camera.Animation#rotateAt|Animation.rotateAt}
        * @returns {this} self
        */

    }, {
        key: 'rotateAt',
        value: function rotateAt(origin, rotation, duration, options) {
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).rotateAt(origin, rotation, duration, options));
            this.animations.play(animationName.ANONYMOUS);

            return this;
        }

        /**
        * Immediately rotate at the current position.
        *
        * @see {@link Camera.Animation#rotateTo|Animation.rotateTo}
        * @returns {this} self
        */

    }, {
        key: 'rotateTo',
        value: function rotateTo(rotation, duration, options) {
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).rotateTo(rotation, duration, options));
            this.animations.play(animationName.ANONYMOUS);

            return this;
        }

        /**
        * Immediately shake the camera.
        *
        * @see {@link Camera.Animation#shake|Animation.shake}
        * @returns {this} self
        */

    }, {
        key: 'shake',
        value: function shake(intensity, duration, direction, options) {
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).shake(intensity, duration, direction, options));
            this.animations.play(animationName.ANONYMOUS);

            return this;
        }

        /**
        * Immediately zoom in/out at a specific location.
        *
        * @see {@link Camera.Animation#zoomAt|Animation.zoomAt}
        * @returns {this} self
        */

    }, {
        key: 'zoomAt',
        value: function zoomAt(origin, zoom, duration, options) {
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).zoomAt(origin, zoom, duration, options));
            this.animations.play(animationName.ANONYMOUS);

            return this;
        }

        /**
        * Immediately zoom in/out at the current position.
        *
        * @see {@link Camera.Animation#zoomTo|Animation.zoomTo}
        * @returns {this} self
        */

    }, {
        key: 'zoomTo',
        value: function zoomTo(zoom, duration, options) {
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).zoomTo(zoom, duration, options));
            this.animations.play(animationName.ANONYMOUS);

            return this;
        }
    }, {
        key: 'bounds',
        get: function get() {
            return this._bounds;
        },
        set: function set(value) {
            this._bounds = !value ? null : value;
            this._updateBounds();
        }

        /**
        * @name Camera#hasBounds
        * @property {boolean} - Whether the camera has bounds or not.
        * @readonly
        */

    }, {
        key: 'hasBounds',
        get: function get() {
            return this._bounds !== null;
        }

        /**
        * @name Camera#isRotated
        * @property {boolean} - Whether the camera is rotated or not.
        * @readonly
        */

    }, {
        key: 'isRotated',
        get: function get() {
            return Math.abs(this.rotation / 360) % 1 > 0;
        }

        /**
        * @name Camera#isZoomed
        * @property {boolean} - Whether the camera is zoomed or not.
        * @readonly
        */

    }, {
        key: 'isZoomed',
        get: function get() {
            return this.zoom !== 1;
        }

        /**
        * @name Camera#rawOffsetX
        * @property {Vector2} - The X offset of the camera's top left corner relative to the scene without any effects applied.
        */

    }, {
        key: 'rawOffsetX',
        get: function get() {
            return this.rawOffset.x;
        },
        set: function set(value) {
            this.rawOffset.x = value;
        }

        /**
        * @name Camera#rawOffsetY
        * @property {Vector2} - The Y offset of the camera's top left corner relative to the scene without any effects applied.
        */

    }, {
        key: 'rawOffsetY',
        get: function get() {
            return this.rawOffset.y;
        },
        set: function set(value) {
            this.rawOffset.y = value;
        }

        /**
        * @name Camera#scene
        * @property {Oculo.Scene} - The active scene.
        * @readonly
        */

    }, {
        key: 'scene',
        get: function get() {
            return this.scenes.activeScene;
        }

        /**
        * @name Camera#transformation
        * @property {Matrix2} - The transformation of the scene.
        * @readonly
        */

    }, {
        key: 'transformation',
        get: function get() {
            return new _matrix2.default().scale(this.zoom, this.zoom).rotate(_math2.default.degToRad(-this.rotation));
        }

        /**
        * @name Camera#zoom
        * @property {number} - The amount of zoom. A ratio where 1 = 100%.
        * @readonly
        * @default 1
        */

    }, {
        key: 'zoom',
        get: function get() {
            return this._zoom;
        },
        set: function set(value) {
            this._zoom = this._clampZoom(value);
            this._updateBounds();
        }
    }]);

    return Camera;
}();

Camera.bounds = {
    NONE: null,
    WORLD: function WORLD() {
        var transformation = new _matrix2.default().scale(this.zoom, this.zoom).getInverse();
        var min = new _vector2.default().add(this.center).transform(transformation);
        var max = new _vector2.default(this.scene.scaledWidth, this.scene.scaledHeight).subtract(this.center).transform(transformation);

        return {
            minX: min.x,
            minY: min.y,
            maxX: max.x,
            maxY: max.y
        };
    },
    WORLD_EDGE: function WORLD_EDGE() {
        return {
            minX: 0,
            minY: 0,
            maxX: this.scene.width,
            maxY: this.scene.height
        };
    }
};

exports.default = Camera;

},{"./animationManager":43,"./constants":45,"./cssRenderer":46,"./math/math":48,"./math/matrix2":49,"./math/vector2":50,"./scene":52,"./sceneManager":53,"./trackControl":54,"./utils":55,"fbemitter":1,"lodash/clamp":20,"lodash/isElement":24,"lodash/isFinite":25,"lodash/isFunction":26,"lodash/isNil":28,"lodash/isObject":29}],45:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Object types.
* @enum {number}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});
var Type = exports.Type = {
    ANIMATION: 0
};

/**
* Zoom direction.
* @enum {number}
*/
var zoomDirection = exports.zoomDirection = {
    NONE: 0,
    IN: 1,
    OUT: -1
};

},{}],46:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _round = require('lodash/round');

var _round2 = _interopRequireDefault(_round);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Description.
* 
* @class Oculo.CSSRenderer
* @constructor
*
* @example
* var myRenderer = new CSSRenderer(myCamera);
*/
var CSSRenderer = function () {
    function CSSRenderer(camera) {
        _classCallCheck(this, CSSRenderer);

        /**
        * @property {Object} - The camera.
        * @readonly
        */
        this.camera = camera;
    }

    /**
    * Destroys the renderer and prepares it for garbage collection.
    *
    * @returns {this} self
    */


    _createClass(CSSRenderer, [{
        key: 'destroy',
        value: function destroy() {
            this.camera = null;

            return this;
        }

        /**
        * Render the scene.
        *
        * returns {this} self
        */

    }, {
        key: 'render',
        value: function render() {
            if (this.camera.scene && this.camera.scenes.view) {
                var offset = this.camera._convertPositionToOffset(this.camera.position, this.camera.center, this.camera.transformOrigin, this.camera.transformation);
                var rasterIncrement = 0.3;
                var scaleLevel = Math.floor(this.camera.zoom);

                // Control rasterization to maintain clarity when zooming
                if (this.camera.zoom === this.camera.maxZoom || this.camera.zoomDirection === _constants.zoomDirection.IN && this.camera.zoom > this.camera._rasterScale + rasterIncrement * scaleLevel) {
                    this.camera._rasterScale = this.camera.zoom;
                    this.camera.scenes.view.style.willChange = 'auto';
                } else {
                    this.camera.scenes.view.style.willChange = 'transform';
                }

                this.camera.scene.view.style.visibility = 'visible';
                TweenLite.set(this.camera.scenes.view, {
                    css: {
                        transformOrigin: this.camera.transformOrigin.x + 'px ' + this.camera.transformOrigin.y + 'px',
                        scaleX: this.camera.zoom,
                        scaleY: this.camera.zoom,
                        rotation: -this.camera.rotation,
                        x: -offset.x,
                        y: -offset.y
                    }
                });
            }
        }

        /**
        * Render the dimensions/size.
        *
        * returns {this} self
        */

    }, {
        key: 'renderSize',
        value: function renderSize() {
            if (this.camera.view) {
                TweenLite.set(this.camera.view, {
                    css: {
                        height: this.camera.height,
                        width: this.camera.width
                    }
                });
            }
        }
    }]);

    return CSSRenderer;
}();

exports.default = CSSRenderer;

},{"./constants":45,"lodash/round":34}],47:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* GSAP's Draggable.
* @external Draggable
* @see http://greensock.com/docs/#/HTML5/GSAP/Utils/Draggable/
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Description.
* 
* @class Oculo.DragControl
* @constructor
* @requires {@link external:Draggable}
* @param {string|Element} target - The target.
* @param {Object} [options] - An object of configuration options.
* @param {string|Element} [options.dragProxy] - The element that controls/initiates the drag events.
* @param {function} [options.onDrag] - The function to call every time the drag event occurs.
* @param {array} [options.onDragParams] - The parameters to pass to the callback.
* @param {object} [options.onDragScope] - What 'this' refers to inside the callback.
*
* @example
* var myDragControl = new Oculo.DragControl('#scene', {  
*   onDrag: function () { 
*     console.log('dragging'); 
*   }
* });
*/
var DragControl = function () {
    function DragControl(target) {
        var _this = this;

        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$dragProxy = _ref.dragProxy,
            dragProxy = _ref$dragProxy === undefined ? target : _ref$dragProxy,
            _ref$onDrag = _ref.onDrag,
            onDrag = _ref$onDrag === undefined ? function () {} : _ref$onDrag,
            _ref$onDragParams = _ref.onDragParams,
            onDragParams = _ref$onDragParams === undefined ? [] : _ref$onDragParams,
            _ref$onDragScope = _ref.onDragScope,
            onDragScope = _ref$onDragScope === undefined ? this : _ref$onDragScope;

        _classCallCheck(this, DragControl);

        /**
        * @property {object} - The configuration.
        */
        this.config = { dragProxy: dragProxy, onDrag: onDrag, onDragParams: onDragParams, onDragScope: onDragScope };

        /**
        * @property {Draggable} - The object that handles the drag behavior.
        * @readonly
        */
        this.control = new Draggable(target, {
            callbackScope: onDragScope,
            onDrag: onDrag,
            onDragParams: onDragParams,
            zIndexBoost: false
        });

        /**
        * @property {Element} - The element that controls/initiates the drag events.
        * @readonly
        */
        this.dragProxy = _utils2.default.DOM.parseView(dragProxy);

        /**
        * @property {boolean} - Whether it is dragging or not.
        * @readonly
        */
        this.isDragging = false;

        /**
        * @property {boolean} - Whether it is pressed or not.
        * @readonly
        */
        this.isPressed = false;

        /*
        * @private
        */
        this._onDragstart = function (event) {
            event.preventDefault();
            event.stopPropagation();

            return false;
        };

        /*
        * @private
        */
        this._onDragRelease = function (event) {
            _this._endDrag(event);
        };

        /*
        * @private
        */
        this._onDragLeave = function (event) {
            _this._endDrag(event);
        };

        /*
        * @private
        */
        this._onDragMove = function (event) {
            if (_this.isPressed && !_this.isDragging) {
                _this.control.startDrag(event);
                _this.isDragging = true;
            }
        };

        /*
        * @private
        */
        this._endDrag = function (event) {
            if (_this.isDragging) {
                _this.control.endDrag(event);
                _this.dragProxy.removeEventListener('mouseup', _this._onDragRelease);
                _this.dragProxy.removeEventListener('mouseleave', _this._onDragLeave);
                _this.dragProxy.removeEventListener('mousemove', _this._onDragMove);
                _this.dragProxy.removeEventListener('touchend', _this._onDragRelease);
                _this.dragProxy.removeEventListener('touchcancel', _this._onDragRelease);
                _this.dragProxy.removeEventListener('touchmove', _this._onDragMove);
                _this.isDragging = false;
            }
        };

        /*
        * @private
        */
        this._onPress = function (event) {
            _this.dragProxy.addEventListener('mouseup', _this._onDragRelease);
            _this.dragProxy.addEventListener('mouseleave', _this._onDragLeave);
            _this.dragProxy.addEventListener('mousemove', _this._onDragMove);
            _this.dragProxy.addEventListener('touchend', _this._onDragRelease);
            _this.dragProxy.addEventListener('touchcancel', _this._onDragRelease);
            _this.dragProxy.addEventListener('touchmove', _this._onDragMove);
            _this.isPressed = true;
        };

        /*
        * @private
        */
        this._onRelease = function (event) {
            _this._release();
        };

        /*
        * @private
        */
        this._onLeave = function (event) {
            _this._release();
        };

        /*
        * @private
        */
        this._release = function () {
            _this.isPressed = false;
        };

        this.enable();
    }

    /**
    * @property {boolean} - Whether it is enabled or not.
    * @readonly
    */


    _createClass(DragControl, [{
        key: 'destroy',


        /**
        * Destroys the control and prepares it for garbage collection.
        *
        * @returns {this} self
        */
        value: function destroy() {
            this.disable();
            this.control.kill();
            this.config = {};
            this.dragProxy = null;

            return this;
        }

        /**
        * Disables the control.
        *
        * @returns {this} self
        */

    }, {
        key: 'disable',
        value: function disable() {
            this.control.disable();
            this.dragProxy.removeEventListener('dragstart', this._onDragstart);
            this.dragProxy.removeEventListener('mousedown', this._onPress);
            this.dragProxy.removeEventListener('mouseup', this._onRelease);
            this.dragProxy.removeEventListener('mouseleave', this._onLeave);
            this.dragProxy.removeEventListener('touchstart', this._onPress);
            this.dragProxy.removeEventListener('touchend', this._onRelease);
            this.dragProxy.removeEventListener('touchcancel', this._onRelease);
            this.dragProxy.style.cursor = null;

            return this;
        }

        /**
        * Enables the control.
        *
        * @returns {this} self
        */

    }, {
        key: 'enable',
        value: function enable() {
            this.control.enable();
            this.dragProxy.addEventListener('dragstart', this._onDragstart);
            this.dragProxy.addEventListener('mousedown', this._onPress);
            this.dragProxy.addEventListener('mouseup', this._onRelease);
            this.dragProxy.addEventListener('mouseleave', this._onLeave);
            this.dragProxy.addEventListener('touchstart', this._onPress);
            this.dragProxy.addEventListener('touchend', this._onRelease);
            this.dragProxy.addEventListener('touchcancel', this._onRelease);
            this.dragProxy.style.cursor = 'move';
            return this;
        }

        /**
        * Updates the control's x and y properties to reflect the target's position.
        *
        * @returns {this} self
        */

    }, {
        key: 'update',
        value: function update() {
            return this.control.update();
        }
    }, {
        key: 'enabled',
        get: function get() {
            return this.control.enabled();
        }

        /**
        * @property {Object} - The last pointer event that affected the instance.
        * @readonly
        */

    }, {
        key: 'pointerEvent',
        get: function get() {
            return this.control.pointerEvent;
        }

        /**
        * @property {number} - The x position of the last pointer event that affected the instance.
        * @readonly
        */

    }, {
        key: 'pointerX',
        get: function get() {
            return this.control.pointerX;
        }

        /**
        * @property {number} - The y position of the last pointer event that affected the instance.
        * @readonly
        */

    }, {
        key: 'pointerY',
        get: function get() {
            return this.control.pointerY;
        }

        /**
        * @property {Element} - The target.
        * @readonly
        */

    }, {
        key: 'target',
        get: function get() {
            return this.control.target;
        }

        /**
        * @property {number} - The current x position.
        * @readonly
        */

    }, {
        key: 'x',
        get: function get() {
            return this.control.x;
        }

        /**
        * @property {number} - The current y position.
        * @readonly
        */

    }, {
        key: 'y',
        get: function get() {
            return this.control.y;
        }
    }]);

    return DragControl;
}();

exports.default = DragControl;

},{"./utils":55}],48:[function(require,module,exports){
'use strict';

/**
* A collection of useful mathematical values and functions.
*
* @namespace Oculo.Math
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});
var _Math = {
    /**
    * Convert degrees to radians.
    *
    * @function Oculo.Math#degToRad
    * @param {number} degrees - The degrees value.
    * @return {number} - The value in radians.
    */
    degToRad: function degToRad(degrees) {
        return degrees * _Math.degToRadFactor;
    },

    /**
    * Convert radians to degrees.
    *
    * @function Oculo.Math#radToDeg
    * @param {number} radians - The radians value.
    * @return {number} - The value in degrees.
    */
    radToDeg: function radToDeg(radians) {
        return radians * _Math.radToDegFactor;
    }
};

/**
* The factor used to convert degrees to radians.
*
* @name Oculo.Math#degToRadFactor
* @property {number}
* @static
*/
Object.defineProperty(_Math, 'degToRadFactor', {
    value: Math.PI / 180
});

/**
* The factor used to convert radians to degrees.
*
* @name Oculo.Math#radToDegFactor
* @property {number}
* @static
*/
Object.defineProperty(_Math, 'radToDegFactor', {
    value: 180 / Math.PI
});

exports.default = _Math;

},{}],49:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isArrayLike = require('lodash/isArrayLike');

var _isArrayLike2 = _interopRequireDefault(_isArrayLike);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Create 2x2 matrix from a series of values.
* 
* Represented like:
* 
* | e11 | e12 |
* | e21 | e22 |
*
* @class Oculo.Matrix2
* @constructor
* @param {number} e11=1 - The value of row 1, column 1
* @param {number} e12=0 - The value of row 1, column 2
* @param {number} e21=0 - The value of row 2, column 1
* @param {number} e22=1 - The value of row 2, column 2
*/
var Matrix2 = function () {
    function Matrix2(e11, e12, e21, e22) {
        _classCallCheck(this, Matrix2);

        /**
        * @property {number} e11
        * @default
        */
        this.e11 = 1;

        /**
        * @property {number} e12
        * @default
        */
        this.e12 = 0;

        /**
        * @property {number} e21
        * @default
        */
        this.e21 = 0;

        /**
        * @property {number} e22
        * @default
        */
        this.e22 = 1;

        if (arguments.length === 4) {
            this.set(e11, e12, e21, e22);
        } else if ((0, _isArrayLike2.default)(e11) && e11.length === 4) {
            this.setFromArray(e11);
        }
    }

    /**
    * Clones the matrix.
    * {Matrix2} m - The matrix to clone.
    * @return {Matrix2} A new identical matrix.
    */


    _createClass(Matrix2, [{
        key: 'clone',


        /**
        * Clones the matrix.
        * @return {Matrix2} A new identical matrix.
        */
        value: function clone() {
            return this.constructor.clone(this);
        }

        /**
        * Copies the values from the provided matrix into this matrix.
        * {Matrix2} m - The matrix to copy.
        * @return {this} self
        */

    }, {
        key: 'copy',
        value: function copy(m) {
            return this.set(m.e11, m.e12, m.e21, m.e22);
        }

        /**
        * Gets the determinant.
        * {Matrix2} m - The matrix to get the determinant.
        * @return {number} The determinant.
        */

    }, {
        key: 'getDeterminant',


        /**
        * Gets the determinant.
        * @return {number} The determinant.
        */
        value: function getDeterminant() {
            return this.constructor.getDeterminant(this);
        }

        /**
        * Gets the inverse.
        * {Matrix2} m - The matrix to get the inverse.
        * @return {Matrix2} The inverse matrix.
        */

    }, {
        key: 'getInverse',


        /**
        * Gets the inverse.
        * @return {Matrix2} The inverse matrix.
        */
        value: function getInverse() {
            return this.constructor.getInverse(this);
        }

        /**
        * Multiplies two matrices.
        * @param {Matrix2} a - A matrix.
        * @param {Matrix2} b - Another matrix.
        * @return {Matrix2} A new matrix that is the product of the provided matrices.
        */ /**
           * Multiplies a list of matrices.
           * @param {Array} m - A list of matrices.
           * @return {Matrix2} A new matrix that is the product of the provided matrices.
           */

    }, {
        key: 'multiplyMatrices',


        /**
        * Multiplies the matrix by another matrix.
        * @param {Matrix2|Matrix2D} m - A matrix.
        * @return {this} self
        */
        value: function multiplyMatrices(m) {
            if (this.cols === m.rows) {
                var n11 = void 0,
                    n12 = void 0,
                    n21 = void 0,
                    n22 = void 0;

                n11 = this.e11 * m.e11 + this.e12 * m.e21;
                n12 = this.e11 * m.e12 + this.e12 * m.e22;
                n21 = this.e21 * m.e11 + this.e22 * m.e21;
                n22 = this.e21 * m.e12 + this.e22 * m.e22;

                this.set(n11, n12, n21, n22);
            } else {
                throw new Error('Cannot multiply incompatible matrices');
            }

            return this;
        }

        /**
        * Multiplies a matrix by a scalar.
        * @param {Matrix2} m - The matrix.
        * @param {number} s - The scalar.
        * @return {Matrix2} A new scaled matrix.
        */

    }, {
        key: 'multiplyScalar',


        /**
        * Multiplies the matrix by a scalar.
        * @param {number} s - The scalar.
        * @return {this} self
        */
        value: function multiplyScalar(s) {
            this.e11 *= s;
            this.e12 *= s;
            this.e21 *= s;
            this.e22 *= s;

            return this;
        }

        /**
        * Applies a rotation to a matrix.
        * @param {Matrix2} m - The matrix.
        * @param {number} angle - The angle in radians.
        * @return {Matrix2} A new rotated matrix.
        */

    }, {
        key: 'rotate',


        /**
        * Rotates the matrix.
        * @param {number} angle - The angle in radians.
        * @return {this} self
        */
        value: function rotate(angle) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var rotationMatrix = new Matrix2(cos, -sin, sin, cos);
            this.multiplyMatrices(rotationMatrix);

            return this;
        }

        /**
        * Applies a scale transformation to a matrix.
        * @param {Matrix2} m - The matrix.
        * @param {number} x - The amount to scale on the X axis.
        * @param {number} y - The amount to scale on the Y axis.
        * @return {Matrix2} A new scaled matrix.
        */

    }, {
        key: 'scale',


        /**
        * Scales the matrix.
        * @param {number} x - The amount to scale on the X axis.
        * @param {number} y - The amount to scale on the Y axis.
        * @return {this} self
        */
        value: function scale(x, y) {
            this.multiplyMatrices(new Matrix2(x, 0, 0, y));

            return this;
        }

        /**
        * Sets the matrix values.
        * @param {number} e11
        * @param {number} e12
        * @param {number} e21
        * @param {number} e22
        * @return {this} self
        */

    }, {
        key: 'set',
        value: function set(e11, e12, e21, e22) {
            this.e11 = e11;
            this.e12 = e12;
            this.e21 = e21;
            this.e22 = e22;

            return this;
        }

        /**
        * Sets the matrix from an array.
        * @param {Array} a - The array of matrix values.
        * @return {this} self
        */

    }, {
        key: 'setFromArray',
        value: function setFromArray(a) {
            this.set(a[0], a[1], a[2], a[3]);

            return this;
        }

        /**
        * Sets the matrix to the identity.
        * @return {this} self
        */

    }, {
        key: 'setToIdentity',
        value: function setToIdentity() {
            this.set(1, 0, 0, 1);

            return this;
        }

        /**
        * Sets the values from the matrix into a new array.
        * @param {Matrix2} m - The matrix.
        * @return {Array} The array containing the matrix values.
        */

    }, {
        key: 'toArray',


        /**
        * Sets the values from the matrix into a new array.
        * @return {Array} The array containing the matrix values.
        */
        value: function toArray() {
            return this.constructor.toArray(this);
        }

        /**
        * Sets the values from the matrix into a new Float32Array.
        * @param {Matrix2} m - The matrix.
        * @return {Float32Array} The array containing the matrix values.
        */

    }, {
        key: 'toFloat32Array',


        /**
        * Sets the values from the matrix into a new Float32Array.
        * @return {Float32Array} The array containing the matrix values.
        */
        value: function toFloat32Array() {
            return this.constructor.toFloat32Array(this);
        }
    }], [{
        key: 'clone',
        value: function clone(m) {
            return new Matrix2(Matrix2.toArray(m));
        }
    }, {
        key: 'getDeterminant',
        value: function getDeterminant(m) {
            return m.e11 * m.e22 - m.e12 * m.e21;
        }
    }, {
        key: 'getInverse',
        value: function getInverse(m) {
            return Matrix2.multiplyScalar(new Matrix2(m.e22, -m.e12, -m.e21, m.e11), 1 / Matrix2.getDeterminant(m));
        }
    }, {
        key: 'multiplyMatrices',
        value: function multiplyMatrices(a, b) {
            if (a.cols === b.rows) {
                var n11 = void 0,
                    n12 = void 0,
                    n21 = void 0,
                    n22 = void 0;

                n11 = a.e11 * b.e11 + a.e12 * b.e21;
                n12 = a.e11 * b.e12 + a.e12 * b.e22;
                n21 = a.e21 * b.e11 + a.e22 * b.e21;
                n22 = a.e21 * b.e12 + a.e22 * b.e22;

                return new Matrix2(n11, n12, n21, n22);
            } else {
                throw new Error('Cannot multiply incompatible matrices');
            }
        }
    }, {
        key: 'multiplyScalar',
        value: function multiplyScalar(m, s) {
            var e11 = m.e11 * s;
            var e12 = m.e12 * s;
            var e21 = m.e21 * s;
            var e22 = m.e22 * s;

            return new Matrix2(e11, e12, e21, e22);
        }
    }, {
        key: 'rotate',
        value: function rotate(m, angle) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var rotationMatrix = new Matrix2(cos, -sin, sin, cos);

            return Matrix2.multiplyMatrices(m, rotationMatrix);
        }
    }, {
        key: 'scale',
        value: function scale(m, x, y) {
            return Matrix2.multiplyMatrices(m, new Matrix2(x, 0, 0, y));
        }
    }, {
        key: 'toArray',
        value: function toArray(m) {
            var a = new Array(4);

            a[0] = m.e11;
            a[1] = m.e12;
            a[2] = m.e21;
            a[3] = m.e22;

            return a;
        }
    }, {
        key: 'toFloat32Array',
        value: function toFloat32Array(m) {
            var a = new Float32Array(4);

            a[0] = m.e11;
            a[1] = m.e12;
            a[2] = m.e21;
            a[3] = m.e22;

            return a;
        }
    }]);

    return Matrix2;
}();

/**
* The number of columns.
* @name Matrix2#cols
*/


Object.defineProperty(Matrix2.prototype, 'cols', {
    enumerable: true,
    value: 2
});

/**
* The number of rows.
* @name Matrix2#rows
*/
Object.defineProperty(Matrix2.prototype, 'rows', {
    enumerable: true,
    value: 2
});

exports.default = Matrix2;

},{"lodash/isArrayLike":23}],50:[function(require,module,exports){
'use strict';

/**
* Creates a 2D vector from a series of values.
* 
* @class Oculo.Vector2
* @constructor
* @param {number} x=0 - The x value.
* @param {number} y=0 - The y value.
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vector2 = function () {
    function Vector2(x, y) {
        _classCallCheck(this, Vector2);

        /**
        * The x value.
        * @default 0
        */
        this.x = x !== undefined ? x : 0;

        /**
        * The y value.
        * @default 0
        */
        this.y = y !== undefined ? y : 0;
    }

    /**
    * Adds two vectors.
    * @param {Vector2} a - A vector.
    * @param {Vector2} b - Another vector.
    * @return {Vector2} A new vector that is the sum of the provided vectors.
    */


    _createClass(Vector2, [{
        key: 'add',


        /**
        * Adds a vector to the vector.
        * @param {Vector2} v - A vector.
        * @return {Vector2} The vector.
        */
        value: function add(v) {
            this.x += v.x;
            this.y += v.y;

            return this;
        }

        /**
        * Clones the vector.
        * {Vector2} v - The vector to clone.
        * @return {Vector2} A new identical vector.
        */

    }, {
        key: 'clone',


        /**
        * Clones the vector.
        * @return {Vector2} A new identical vector.
        */
        value: function clone() {
            return this.constructor.clone(this);
        }

        /**
        * Copies the values from the provided vector into this vector.
        * {Vector2} v - The vector to copy.
        * @return {this} self
        */

    }, {
        key: 'copy',
        value: function copy(v) {
            return this.set(v.x, v.y);
        }

        /**
        * Determines if the provided vectors are equal.
        * @param {Vector2} a - The first vector.
        * @param {Vector2} b - The second vector.
        * @return {boolean} Whether the vectors are equal.
        */

    }, {
        key: 'equals',


        /**
        * Determines if the vector equals the provided vector.
        * @param {Vector2} v - The vector.
        * @return {boolean} Whether the vector equals the provided vector.
        */
        value: function equals(v) {
            return this.constructor.equals(this, v);
        }

        /**
        * Takes the max of the provided vectors.
        * @param {Vector2} a - A vector.
        * @param {Vector2} b - Another vector.
        * @return {Vector2} A new vector that is the max of the provided vectors.
        */

    }, {
        key: 'max',


        /**
        * Sets itself to the max of itself and the provided vector.
        * @param {Vector2} v - A vector.
        * @return {Vector2} The vector.
        */
        value: function max(v) {
            this.x = Math.max(this.x, v.x);
            this.y = Math.max(this.y, v.y);

            return this;
        }

        /**
        * Takes the min of the provided vectors.
        * @param {Vector2} a - A vector.
        * @param {Vector2} b - Another vector.
        * @return {Vector2} A new vector that is the min of the provided vectors.
        */

    }, {
        key: 'min',


        /**
        * Sets itself to the min of itself and the provided vector.
        * @param {Vector2} v - A vector.
        * @return {Vector2} The vector.
        */
        value: function min(v) {
            this.x = Math.min(this.x, v.x);
            this.y = Math.min(this.y, v.y);

            return this;
        }

        /**
        * Multiplies a vector by a scalar.
        * @param {Vector2} v - The vector.
        * @param {number} s - The scalar.
        * @return {Vector2} A new scaled vector.
        */

    }, {
        key: 'multiplyScalar',


        /**
        * Multiplies the vector by a scalar.
        * @param {number} s - The scalar.
        * @return {Vector2} The vector.
        */
        value: function multiplyScalar(s) {
            this.x *= s;
            this.y *= s;

            return this;
        }

        /**
        * Sets the vector values.
        * @param {number} x - The x value.
        * @param {number} y - The y value.
        * @return {Vector2} The vector.
        */

    }, {
        key: 'set',
        value: function set(x, y) {
            this.x = x;
            this.y = y;

            return this;
        }

        /**
        * Subtracts two vectors.
        * @param {Vector2} a - A vector.
        * @param {Vector2} b - Another vector.
        * @return {Vector2} A new vector that is the difference of the provided vectors.
        */

    }, {
        key: 'subtract',


        /**
        * Subtracts a vector from the vector.
        * @param {Vector2} v - A vector.
        * @return {Vector2} The vector.
        */
        value: function subtract(v) {
            this.x -= v.x;
            this.y -= v.y;

            return this;
        }

        /**
        * Sets the values from the vector into a new array.
        * @param {Vector2} v - The vector.
        * @return {Array} The array containing the vector values.
        */

    }, {
        key: 'toArray',


        /**
        * Sets the values from the vector into a new array.
        * @return {Array} The array containing the vector values.
        */
        value: function toArray() {
            return this.constructor.toArray(this);
        }

        /**
        * Transforms a vector using the provided matrix.
        * @private
        * @param {Vector2} v - A vector.
        * @param {Matrix2|Matrix2D} m - A transformation matrix.
        * @return {Vector2} A new transformed vector.
        */

    }, {
        key: 'transform',


        /**
        * Transforms the vector using the provided matrix.
        * @param {Vector2} v - A vector.
        * @param {Matrix2|Matrix2D} m - A transformation matrix.
        * @return {Vector2} The transformed vector.
        */
        value: function transform(m) {
            var x1 = this.x * m.e11 + this.y * m.e12 + (m.tx ? m.tx : 0);
            var y1 = this.x * m.e21 + this.y * m.e22 + (m.ty ? m.ty : 0);

            return this.set(x1, y1);
        }
    }], [{
        key: 'add',
        value: function add(a, b) {
            return new Vector2(a.x + b.x, a.y + b.y);
        }
    }, {
        key: 'clone',
        value: function clone(v) {
            return new Vector2(v.x, v.y);
        }
    }, {
        key: 'equals',
        value: function equals(a, b) {
            return a.x === b.x && a.y === b.y;
        }
    }, {
        key: 'max',
        value: function max(a, b) {
            return new Vector2(Math.max(a.x, b.x), Math.max(a.y, b.y));
        }
    }, {
        key: 'min',
        value: function min(a, b) {
            return new Vector2(Math.min(a.x, b.x), Math.min(a.y, b.y));
        }
    }, {
        key: 'multiplyScalar',
        value: function multiplyScalar(v, s) {
            var x = v.x * s;
            var y = v.y * s;

            return new Vector2(x, y);
        }
    }, {
        key: 'subtract',
        value: function subtract(a, b) {
            return new Vector2(a.x - b.x, a.y - b.y);
        }
    }, {
        key: 'toArray',
        value: function toArray(v) {
            var a = new Array(2);

            a[0] = v.x;
            a[1] = v.y;

            return a;
        }
    }, {
        key: 'transform',
        value: function transform(v, m) {
            var x1 = v.x * m.e11 + v.y * m.e12 + (m.tx ? m.tx : 0);
            var y1 = v.x * m.e21 + v.y * m.e22 + (m.ty ? m.ty : 0);

            return new Vector2(x1, y1);
        }
    }]);

    return Vector2;
}();

exports.default = Vector2;

},{}],51:[function(require,module,exports){
'use strict';

/**
* GSAP's TimelineMax.
* @external TimelineMax
* @see http://greensock.com/docs/#/HTML5/GSAP/TimelineMax/
*/

/**
* GSAP's TweenMax.
* @external TweenMax
* @see http://greensock.com/docs/#/HTML5/GSAP/TweenMax/
*/

/**
* GSAP's Easing.
* @external Easing
* @see http://greensock.com/docs/#/HTML5/GSAP/Easing/
*/

var _animation = require('./animation');

var _animation2 = _interopRequireDefault(_animation);

var _camera = require('./camera');

var _camera2 = _interopRequireDefault(_camera);

var _cssRenderer = require('./cssRenderer');

var _cssRenderer2 = _interopRequireDefault(_cssRenderer);

var _math = require('./math/math');

var _math2 = _interopRequireDefault(_math);

var _matrix = require('./math/matrix2');

var _matrix2 = _interopRequireDefault(_matrix);

var _scene = require('./scene');

var _scene2 = _interopRequireDefault(_scene);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _vector = require('./math/vector2');

var _vector2 = _interopRequireDefault(_vector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* @namespace Oculo
*/
var Oculo = {
    Animation: _animation2.default,
    Camera: _camera2.default,
    CSSRenderer: _cssRenderer2.default,
    Math: _math2.default,
    Matrix2: _matrix2.default,
    Scene: _scene2.default,
    Utils: _utils2.default,
    Vector2: _vector2.default
};

module.exports = Oculo;

},{"./animation":42,"./camera":44,"./cssRenderer":46,"./math/math":48,"./math/matrix2":49,"./math/vector2":50,"./scene":52,"./utils":55}],52:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _vector = require('./math/vector2');

var _vector2 = _interopRequireDefault(_vector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Creates a scene.
* 
* @class Oculo.Scene
* @constructor
* @param {Camera} [camera=null] - The camera that owns this Scene.
* @param {string|Element} [view=null] - The view for the scene. It can be a selector or an element.
*/
var Scene = function () {
    function Scene() {
        var camera = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var view = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, Scene);

        /**
        * @property {Oculo.Camera} - The camera.
        */
        this.camera = camera;

        /**
        * @property {Element} - The view. An HTML element.
        */
        this.view = _utils2.default.DOM.parseView(view);

        // View setup
        if (this.view && this.view.parentNode) {
            this.view.parentNode.removeChild(this.view);
        }
    }

    /**
    * @name Scene#width
    * @property {number} - The width.
    * @readonly
    */


    _createClass(Scene, [{
        key: 'destroy',


        /**
        * Destroys the scene and prepares it for garbage collection.
        *
        * @returns {this} self
        */
        value: function destroy() {
            this.camera = null;
            this.view = null;

            return this;
        }
    }, {
        key: 'width',
        get: function get() {
            return this.view ? this.view.offsetWidth : 0;
        }

        /**
        * @name Scene#height
        * @property {number} - The height.
        * @readonly
        */

    }, {
        key: 'height',
        get: function get() {
            return this.view ? this.view.offsetHeight : 0;
        }

        /**
        * @name Scene#scaledWidth
        * @property {number} - The scaled width.
        * @readonly
        */

    }, {
        key: 'scaledWidth',
        get: function get() {
            return this.view ? this.width * this.camera.zoom : this.width;
        }

        /**
        * @name Scene#scaledHeight
        * @property {number} - The scaled height.
        * @readonly
        */

    }, {
        key: 'scaledHeight',
        get: function get() {
            return this.view ? this.height * this.camera.zoom : this.height;
        }
    }]);

    return Scene;
}();

exports.default = Scene;

},{"./math/vector2":50,"./utils":55}],53:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _scene = require('./scene');

var _scene2 = _interopRequireDefault(_scene);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Description.
* 
* @class Oculo.SceneManager
* @constructor
* @param {Oculo.Camera} camera - The camera that owns this SceneManager.
* @param {boolean} [hasView=true] - If true, a 'div' is created and managed internally. Pass false to create a SceneManager without a view.
*/
var SceneManager = function () {
    function SceneManager(camera) {
        var hasView = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        _classCallCheck(this, SceneManager);

        /**
        * @property {Oculo.Camera} - The camera that owns this SceneManager.
        * @readonly
        */
        this.camera = camera;

        /**
        * @property {Oculo.Scene} - The active scene.
        * @readonly
        */
        this.activeScene = null;

        /**
        * @property {Element} - The view. An HTML element.
        */
        this.view = hasView === true ? document.createElement('div') : null;

        /**
        * @property {Object} - An object for storing the managed Scene instances.
        * @private
        */
        this._scenes = {};

        // View setup
        if (this.view) {
            this.view.style.position = 'absolute';
            this.view.style.willChange = 'transform';
        }
    }

    /**
    * Adds a scene.
    *
    * @param {string} name - The name to give the scene.
    * @param {Oculo.Scene} scene - The scene.
    * @returns {this} self
    */


    _createClass(SceneManager, [{
        key: 'add',
        value: function add(name, scene) {
            if (typeof scene === 'string') {
                scene = new _scene2.default(this.camera, scene);
            } else {
                scene.camera = this.camera;
            }

            this._scenes[name] = scene;

            return this;
        }

        /**
        * Destroys the SceneManager and prepares it for garbage collection.
        *
        * @returns {this} self
        */

    }, {
        key: 'destroy',
        value: function destroy() {
            for (var key in this._scenes) {
                this._scenes[key].destroy();
            }

            this.camera = null;
            this.activeScene = null;
            this.view = null;
            this._scenes = {};

            return this;
        }

        /**
        * Gets a scene.
        *
        * @param {string} name - The name of the scene.
        * @returns {Oculo.Scene} The scene.
        */

    }, {
        key: 'get',
        value: function get(name) {
            return this._scenes[name];
        }

        /**
        * Sets the active scene.
        *
        * @returns {this} self
        */

    }, {
        key: 'setActiveScene',
        value: function setActiveScene(name) {
            if (this.view && this.activeScene && this.activeScene.view) {
                this.view.removeChild(this.activeScene.view);
            }

            this.activeScene = this._scenes[name];

            if (this.view) {
                this.activeScene.view.style.visibility = 'hidden';
                this.activeScene.view.style.display = 'block';
                this.view.appendChild(this.activeScene.view);
                this.view.style.width = this.activeScene.width + 'px';
                this.view.style.height = this.activeScene.height + 'px';
            }

            return this;
        }
    }]);

    return SceneManager;
}();

exports.default = SceneManager;

},{"./scene":52}],54:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dragControl = require('./dragControl');

var _dragControl2 = _interopRequireDefault(_dragControl);

var _wheelControl = require('./wheelControl');

var _wheelControl2 = _interopRequireDefault(_wheelControl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Description.
* 
* @class Oculo.TrackControl
* @constructor
* @param {Oculo.Camera} camera - The camera.
* @param {Object} [options] - An object of configuration options.
* @param {boolean} [options.draggable] - Whether dragging is handled or not.
* @param {function} [options.onDrag] - The function to call every time the drag event occurs.
* @param {boolean} [options.wheelable] - Whether wheeling is handled or not.
* @param {function} [options.onWheel] - The function to call every time the wheel event occurs.
*
* @example
* var myTrackControl = new Oculo.TrackControl(myCamera, { 
*   draggable: true, 
*   onDrag: function () { 
*     console.log('dragging'); 
*   }, 
*   wheelable: true, 
*   onWheel: function () { 
*     console.log('wheeling'); 
*   }
* });
*/
var TrackControl = function () {
    function TrackControl(camera) {
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$draggable = _ref.draggable,
            draggable = _ref$draggable === undefined ? false : _ref$draggable,
            _ref$onDrag = _ref.onDrag,
            onDrag = _ref$onDrag === undefined ? undefined : _ref$onDrag,
            _ref$wheelable = _ref.wheelable,
            wheelable = _ref$wheelable === undefined ? false : _ref$wheelable,
            _ref$onWheel = _ref.onWheel,
            onWheel = _ref$onWheel === undefined ? undefined : _ref$onWheel;

        _classCallCheck(this, TrackControl);

        /**
        * @property {object} - The initial configuration.
        * @default {};
        */
        this.config = { draggable: draggable, onDrag: onDrag, wheelable: wheelable, onWheel: onWheel };

        /**
        * @property {Oculo.Camera} - The camera.
        */
        this.camera = camera;

        /**
        * @property {boolean} - Whether dragging is handled or not.
        * @default false
        */
        this.isDraggable = draggable === true ? true : false;

        /**
        * @property {Draggable} - The drag control.
        * @default null
        */
        this.dragControl = !this.isDraggable ? null : new _dragControl2.default(this.camera.scenes.view, {
            dragProxy: this.camera.view,
            onDrag: onDrag,
            onDragParams: [this.camera],
            zIndexBoost: false
        });

        /**
        * @property {boolean} - Whether wheeling is handled or not.
        * @default false
        */
        this.isWheelable = wheelable === true ? true : false;

        /**
        * @property {WheelControl} - The wheel control.
        * @default null
        */
        this.wheelControl = !this.isWheelable ? null : new _wheelControl2.default(this.camera.view, {
            onWheel: onWheel,
            onWheelParams: [this.camera]
        });
    }

    /**
    * @property {boolean} - Whether dragging is enabled or not.
    * @readonly
    */


    _createClass(TrackControl, [{
        key: 'destroy',


        /**
        * Destroys the control and prepares it for garbage collection.
        *
        * @returns {this} self
        */
        value: function destroy() {
            if (this.isDraggable) {
                this.dragControl.destroy();
                this.dragControl = null;
            }

            if (this.isWheelable) {
                this.wheelControl.destroy();
                this.wheelControl = null;
            }

            this.config = {};

            return this;
        }

        /**
        * Disables dragging.
        *
        * @returns {this} self
        */

    }, {
        key: 'disableDrag',
        value: function disableDrag() {
            if (this.isDraggable) {
                this.dragControl.disable();
            }

            return this;
        }

        /**
        * Enables dragging.
        *
        * @returns {this} self
        */

    }, {
        key: 'enableDrag',
        value: function enableDrag() {
            if (this.isDraggable) {
                this.dragControl.enable();
            }

            return this;
        }

        /**
        * Disables wheeling.
        *
        * @returns {this} self
        */

    }, {
        key: 'disableWheel',
        value: function disableWheel() {
            if (this.isWheelable) {
                this.wheelControl.disable();
            }

            return this;
        }

        /**
        * Enables wheeling.
        *
        * @returns {this} self
        */

    }, {
        key: 'enableWheel',
        value: function enableWheel() {
            if (this.isWheelable) {
                this.wheelControl.enable();
            }

            return this;
        }
    }, {
        key: 'dragEnabled',
        get: function get() {
            return this.isDraggable ? this.dragControl.enabled : false;
        }

        /**
        * @property {boolean} - Whether wheeling is enabled or not.
        * @readonly
        */

    }, {
        key: 'wheelEnabled',
        get: function get() {
            return this.isWheelable ? this.wheelControl.enabled : false;
        }
    }]);

    return TrackControl;
}();

exports.default = TrackControl;

},{"./dragControl":47,"./wheelControl":56}],55:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isElement = require('lodash/isElement');

var _isElement2 = _interopRequireDefault(_isElement);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _vector = require('./math/vector2');

var _vector2 = _interopRequireDefault(_vector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* Description.
* 
* @namespace Oculo.Utils
*/
var Utils = {
    /**
    * Get the CSS transform value for an element.
    *
    * @param {Element} el - The element for which to get the CSS transform value.
    * @returns {string} The CSS transform value.
    */
    getCssTransform: function getCssTransform(el) {
        var value = window.getComputedStyle(el).getPropertyValue('transform');

        // Remove 'matrix()' and all whitespace. Then separate into an array.
        value = value.replace(/^\w+\(/, '').replace(/\)$/, '').replace(/\s+/g, '').split(',');

        return value;
    },

    // TODO: This super simplistic and only handles 2D matrices.
    getTransformMatrix: function getTransformMatrix(el) {
        var styleValue = utils.getCssTransform(el);
        var matrix = [];

        if (styleValue[0] === 'none') {
            matrix = [1, 0, 0, 1, 0, 0];
        } else {
            styleValue.forEach(function (item) {
                matrix.push(parseFloat(item));
            });
        }

        return matrix;
    },

    /**
    * Set the CSS transform value for an element.
    *
    * @param {Element} el - The element for which to set the CSS transform value.
    * @param {Object} options - An object of CSS transform values.
    * @param {string} [options.scale] - A valid CSS transform 'scale' function value to apply to both X and Y axes.
    * @param {string} [options.scaleX] - A valid CSS transform 'scale' function value to apply to the X axis.
    * @param {string} [options.scaleY] - A valid CSS transform 'scale' function value to apply to the Y axis.
    * @param {string} [options.skewX] - A valid CSS transform 'skew' function value to apply to the X axis.
    * @param {string} [options.skewY] - A valid CSS transform 'skew' function value to apply to the Y axis.
    * @param {string} [options.translate] - A valid CSS transform 'translate' function value to apply to both X and Y axes.
    * @param {string} [options.translateX] - A valid CSS transform 'translate' function value to apply to the X axis.
    * @param {string} [options.translateY] - A valid CSS transform 'translate' function value to apply to the Y axis.
    * @param {Object} [tracker] - The object that is tracking the transition. 'isTransitioning' on the object will be set to 'true'.
    * @returns {Element} The element.
    */

    // TODO: This is a very simplistic solution.
    // Ideally would handle 'rotate' option.
    // Ideally would handle 3D Matrix.
    setCssTransform: function setCssTransform(el, options, tracker) {
        options = options || {};

        var value = utils.getCssTransform(el);
        var CSS_TRANSFORM_KEYWORDS = ['inherit', 'initial', 'none', 'unset'];
        var DEFAULT_MATRIX_2D = [1, 0, 0, 1, 0, 0];
        var MATRIX_2D = {
            scaleX: 0,
            scaleY: 3,
            skewY: 1,
            skewX: 2,
            translateX: 4,
            translateY: 5
        };

        if (options.scale) {
            options.scaleX = options.scaleY = options.scale;
        }

        if (options.translate) {
            options.translateX = options.translateY = options.translate;
        }

        // If the transform value is a keyword, use a default matrix.
        if (CSS_TRANSFORM_KEYWORDS.indexOf(value[0])) {
            value = DEFAULT_MATRIX_2D;
        }

        for (var key in MATRIX_2D) {
            if (options[key]) {
                if (_.isFinite(options[key])) {
                    value[MATRIX_2D[key]] = options[key];
                } else {
                    throw new Error('Cannot set an invalid CSS matrix value');
                }
            }
        }

        el.style.transform = 'matrix(' + value.join(', ') + ')';

        if (tracker) {
            tracker.isTransitioning = true;

            // If transition duration is 0, 'transitionend' event which handles 'isTransitioning' will not fire.
            if (parseFloat(window.getComputedStyle(el).getPropertyValue('transition-duration')) === 0) {
                tracker.isTransitioning = false;
            }
        }

        return el;
    },

    /**
    * Set the CSS transition properties for an element.
    *
    * @param {Element} el - The element for which to set the CSS transition properties.
    * @param {Object} properties - A camera {@link CameraModel.defaults.transition|transition} object.
    * @returns {Element} The element.
    */
    setCssTransition: function setCssTransition(el, properties) {
        properties = properties || {};

        var cssTransitionProperties = {
            transitionDelay: properties.delay || '0s',
            transitionDuration: properties.duration || '0s',
            transitionProperty: properties.property || 'all',
            transitionTimingFunction: properties.timingFunction || 'ease'
        };

        for (var key in cssTransitionProperties) {
            el.style[key] = cssTransitionProperties[key];
        }

        return el;
    },

    /**
    * Throttling using requestAnimationFrame.
    *
    * @param {Function} func - The function to throttle.
    * @returns {Function} A new function throttled to the next Animation Frame.
    */
    throttleToFrame: function throttleToFrame(func) {
        var _this = void 0,
            args = void 0;
        var isProcessing = false;

        return function () {
            _this = this;
            args = arguments;

            if (!isProcessing) {
                isProcessing = true;

                window.requestAnimationFrame(function (timestamp) {
                    Array.prototype.push.call(args, timestamp);
                    func.apply(_this, args);
                    isProcessing = false;
                });
            }
        };
    },

    /**
    * Parse the position of the given input within the world.
    *
    * @private
    * @param {string|Element|Object} [input] - The input to parse.
    * @param {Element} world - The world.
    * @returns {Object} The parsed position as an x/y position object.
    */
    parsePosition: function parsePosition(input, world) {
        var objectPosition;
        var position = null;

        if (typeof input === 'string') {
            input = document.querySelector(input);
        }

        if ((0, _isElement2.default)(input)) {
            objectPosition = Utils.DOM.getObjectWorldPosition(input, world);
            position = new _vector2.default(objectPosition.x, objectPosition.y);
        } else if ((0, _isObject2.default)(input)) {
            position = new _vector2.default(input.x, input.y);
        }

        return position;
    }
};

Utils.DOM = {
    /**
    * Get an object's position in the world.
    *
    * @param {Element} object - The object.
    * @param {Element} world - The world.
    * @returns {Vector2} The object's position.
    */
    getObjectWorldPosition: function getObjectWorldPosition(object, world) {
        var x = object.offsetWidth / 2 + object.offsetLeft - world.offsetLeft;
        var y = object.offsetHeight / 2 + object.offsetTop - world.offsetTop;

        return new _vector2.default(x, y);
    },

    /**
    * Parse a view parameter.
    *
    * @param {string|Element} input - The view parameter.
    * @returns {Element} The view.
    */
    parseView: function parseView(input) {
        var output = null;

        if (typeof input === 'string') {
            output = document.querySelector(input);
        } else if ((0, _isElement2.default)(input)) {
            output = input;
        }

        return output;
    }
};

Utils.Time = {
    /**
    * Gets a time duration given FPS and the desired unit.
    * @param {number} fps - The frames per second.
    * @param {string} unit - The unit of time.
    * @return {number} - The duration.
    */
    getFPSDuration: function getFPSDuration(fps, unit) {
        var duration = 0;

        switch (unit) {
            case 's':
                duration = 1000 / fps / 1000;
                break;
            case 'ms':
                duration = 1000 / fps;
                break;
        }

        return duration;
    }
};

exports.default = Utils;

},{"./math/vector2":50,"lodash/isElement":24,"lodash/isObject":29}],56:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _throttle = require('lodash/throttle');

var _throttle2 = _interopRequireDefault(_throttle);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Description.
* 
* @class Oculo.WheelControl
* @constructor
* @param {string|Element} target - The target.
* @param {Object} [options] - An object of configuration options.
* @param {function} [options.onWheel] - The function to call every time the wheel event occurs.
* @param {array} [options.onWheelParams] - The parameters to pass to the callback.
* @param {object} [options.onWheelScope] - What 'this' refers to inside the callback.
*
* @example
* var myWheelControl = new Oculo.WheelControl('#camera', {  
*   onWheel: function () { 
*     console.log('wheeling'); 
*   }
* });
*/
var WheelControl = function () {
    function WheelControl(target) {
        var _this = this;

        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$onWheel = _ref.onWheel,
            onWheel = _ref$onWheel === undefined ? function () {} : _ref$onWheel,
            _ref$onWheelParams = _ref.onWheelParams,
            onWheelParams = _ref$onWheelParams === undefined ? [] : _ref$onWheelParams,
            _ref$onWheelScope = _ref.onWheelScope,
            onWheelScope = _ref$onWheelScope === undefined ? this : _ref$onWheelScope;

        _classCallCheck(this, WheelControl);

        /**
        * @property {object} - The configuration.
        */
        this.config = { onWheel: onWheel, onWheelParams: onWheelParams, onWheelScope: onWheelScope };

        /**
        * @property {Element} - The target.
        * @readonly
        */
        this.target = _utils2.default.DOM.parseView(target);

        /**
        * @property {WheelEvent} - The last wheel event that affected the instance.
        * @readonly
        */
        this.wheelEvent = {};

        /**
        * @property {WheelEvent} - The previous wheel event that affected the instance.
        * @readonly
        */
        this.previousWheelEvent = {};

        /**
        * @property {boolean} - Whether it is enabled or not.
        * @private
        */
        this._enabled = true;

        /**
        * The throttled wheel event handler.
        * @private
        */
        this._throttledOnWheel = (0, _throttle2.default)(function (event) {
            this.previousWheelEvent = this.wheelEvent;
            this.wheelEvent = event;
            this.config.onWheel.apply(this.config.onWheelScope, this.config.onWheelParams);
        }, _utils2.default.Time.getFPSDuration(30, 'ms'));

        /**
        * The wheel event handler.
        * @private
        */
        this._onWheel = function (event) {
            event.preventDefault();
            event.stopPropagation();
            _this._throttledOnWheel(event);
        };

        this.enable();
    }

    /**
    * @property {boolean} - Whether it is enabled or not.
    * @readonly
    * @default true
    */


    _createClass(WheelControl, [{
        key: 'destroy',


        /**
        * Destroys the control and prepares it for garbage collection.
        *
        * @returns {this} self
        */
        value: function destroy() {
            this.disable();
            this.config = {};
            this.target = null;

            return this;
        }

        /**
        * Disables the control.
        *
        * @returns {this} self
        */

    }, {
        key: 'disable',
        value: function disable() {
            this.target.removeEventListener('wheel', this._onWheel);
            this._enabled = false;

            return this;
        }

        /**
        * Enables the control.
        *
        * @returns {this} self
        */

    }, {
        key: 'enable',
        value: function enable() {
            this.target.addEventListener('wheel', this._onWheel);
            this._enabled = true;

            return this;
        }
    }, {
        key: 'enabled',
        get: function get() {
            return this._enabled;
        }
    }]);

    return WheelControl;
}();

exports.default = WheelControl;

},{"./utils":55,"lodash/throttle":35}]},{},[51])(51)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZiZW1pdHRlci9saWIvQmFzZUV2ZW50RW1pdHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0VtaXR0ZXJTdWJzY3JpcHRpb24uanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2xpYi9FdmVudFN1YnNjcmlwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZianMvbGliL2VtcHR5RnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvZmJqcy9saWIvaW52YXJpYW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fU3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYXJyYXlNYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlQ2xhbXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlR2V0VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZVRvU3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fY3JlYXRlUm91bmQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19mcmVlR2xvYmFsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UHJvdG90eXBlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UmF3VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fb2JqZWN0VG9TdHJpbmcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19vdmVyQXJnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fcm9vdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY2xhbXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNFbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0Zpbml0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNMZW5ndGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzTmlsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1BsYWluT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1N5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbm93LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9yb3VuZC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3RvRmluaXRlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b0ludGVnZXIuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3RvTnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmMvc2NyaXB0cy9BbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb25NYW5hZ2VyLmpzIiwic3JjL3NjcmlwdHMvY2FtZXJhLmpzIiwic3JjL3NjcmlwdHMvY29uc3RhbnRzLmpzIiwic3JjL3NjcmlwdHMvY3NzUmVuZGVyZXIuanMiLCJzcmMvc2NyaXB0cy9kcmFnQ29udHJvbC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0aC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0cml4Mi5qcyIsInNyYy9zY3JpcHRzL21hdGgvdmVjdG9yMi5qcyIsInNyYy9zY3JpcHRzL29jdWxvLmpzIiwic3JjL3NjcmlwdHMvc2NlbmUuanMiLCJzcmMvc2NyaXB0cy9zY2VuZU1hbmFnZXIuanMiLCJzcmMvc2NyaXB0cy90cmFja0NvbnRyb2wuanMiLCJzcmMvc2NyaXB0cy91dGlscy5qcyIsInNyYy9zY3JpcHRzL3doZWVsQ29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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anMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKi9cblxudmFyIGZiZW1pdHRlciA9IHtcbiAgRXZlbnRFbWl0dGVyOiByZXF1aXJlKCcuL2xpYi9CYXNlRXZlbnRFbWl0dGVyJyksXG4gIEVtaXR0ZXJTdWJzY3JpcHRpb24gOiByZXF1aXJlKCcuL2xpYi9FbWl0dGVyU3Vic2NyaXB0aW9uJylcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZmJlbWl0dGVyO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBCYXNlRXZlbnRFbWl0dGVyXG4gKiBAdHlwZWNoZWNrc1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBFbWl0dGVyU3Vic2NyaXB0aW9uID0gcmVxdWlyZSgnLi9FbWl0dGVyU3Vic2NyaXB0aW9uJyk7XG52YXIgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IgPSByZXF1aXJlKCcuL0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yJyk7XG5cbnZhciBlbXB0eUZ1bmN0aW9uID0gcmVxdWlyZSgnZmJqcy9saWIvZW1wdHlGdW5jdGlvbicpO1xudmFyIGludmFyaWFudCA9IHJlcXVpcmUoJ2ZianMvbGliL2ludmFyaWFudCcpO1xuXG4vKipcbiAqIEBjbGFzcyBCYXNlRXZlbnRFbWl0dGVyXG4gKiBAZGVzY3JpcHRpb25cbiAqIEFuIEV2ZW50RW1pdHRlciBpcyByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgYSBzZXQgb2YgbGlzdGVuZXJzIGFuZCBwdWJsaXNoaW5nXG4gKiBldmVudHMgdG8gdGhlbSB3aGVuIGl0IGlzIHRvbGQgdGhhdCBzdWNoIGV2ZW50cyBoYXBwZW5lZC4gSW4gYWRkaXRpb24gdG8gdGhlXG4gKiBkYXRhIGZvciB0aGUgZ2l2ZW4gZXZlbnQgaXQgYWxzbyBzZW5kcyBhIGV2ZW50IGNvbnRyb2wgb2JqZWN0IHdoaWNoIGFsbG93c1xuICogdGhlIGxpc3RlbmVycy9oYW5kbGVycyB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGJlaGF2aW9yIG9mIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBUaGUgZW1pdHRlciBpcyBkZXNpZ25lZCB0byBiZSBnZW5lcmljIGVub3VnaCB0byBzdXBwb3J0IGFsbCB0aGUgZGlmZmVyZW50XG4gKiBjb250ZXh0cyBpbiB3aGljaCBvbmUgbWlnaHQgd2FudCB0byBlbWl0IGV2ZW50cy4gSXQgaXMgYSBzaW1wbGUgbXVsdGljYXN0XG4gKiBtZWNoYW5pc20gb24gdG9wIG9mIHdoaWNoIGV4dHJhIGZ1bmN0aW9uYWxpdHkgY2FuIGJlIGNvbXBvc2VkLiBGb3IgZXhhbXBsZSwgYVxuICogbW9yZSBhZHZhbmNlZCBlbWl0dGVyIG1heSB1c2UgYW4gRXZlbnRIb2xkZXIgYW5kIEV2ZW50RmFjdG9yeS5cbiAqL1xuXG52YXIgQmFzZUV2ZW50RW1pdHRlciA9IChmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG5cbiAgZnVuY3Rpb24gQmFzZUV2ZW50RW1pdHRlcigpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQmFzZUV2ZW50RW1pdHRlcik7XG5cbiAgICB0aGlzLl9zdWJzY3JpYmVyID0gbmV3IEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yKCk7XG4gICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIGxpc3RlbmVyIHRvIGJlIGludm9rZWQgd2hlbiBldmVudHMgb2YgdGhlIHNwZWNpZmllZCB0eXBlIGFyZVxuICAgKiBlbWl0dGVkLiBBbiBvcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgbWF5IGJlIHByb3ZpZGVkLiBUaGUgZGF0YSBhcmd1bWVudHNcbiAgICogZW1pdHRlZCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gICAqXG4gICAqIFRPRE86IEFubm90YXRlIHRoZSBsaXN0ZW5lciBhcmcncyB0eXBlLiBUaGlzIGlzIHRyaWNreSBiZWNhdXNlIGxpc3RlbmVyc1xuICAgKiAgICAgICBjYW4gYmUgaW52b2tlZCB3aXRoIHZhcmFyZ3MuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgLSBOYW1lIG9mIHRoZSBldmVudCB0byBsaXN0ZW4gdG9cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXIgLSBGdW5jdGlvbiB0byBpbnZva2Ugd2hlbiB0aGUgc3BlY2lmaWVkIGV2ZW50IGlzXG4gICAqICAgZW1pdHRlZFxuICAgKiBAcGFyYW0geyp9IGNvbnRleHQgLSBPcHRpb25hbCBjb250ZXh0IG9iamVjdCB0byB1c2Ugd2hlbiBpbnZva2luZyB0aGVcbiAgICogICBsaXN0ZW5lclxuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gdGhpcy5fc3Vic2NyaWJlci5hZGRTdWJzY3JpcHRpb24oZXZlbnRUeXBlLCBuZXcgRW1pdHRlclN1YnNjcmlwdGlvbih0aGlzLl9zdWJzY3JpYmVyLCBsaXN0ZW5lciwgY29udGV4dCkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTaW1pbGFyIHRvIGFkZExpc3RlbmVyLCBleGNlcHQgdGhhdCB0aGUgbGlzdGVuZXIgaXMgcmVtb3ZlZCBhZnRlciBpdCBpc1xuICAgKiBpbnZva2VkIG9uY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgLSBOYW1lIG9mIHRoZSBldmVudCB0byBsaXN0ZW4gdG9cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXIgLSBGdW5jdGlvbiB0byBpbnZva2Ugb25seSBvbmNlIHdoZW4gdGhlXG4gICAqICAgc3BlY2lmaWVkIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICogQHBhcmFtIHsqfSBjb250ZXh0IC0gT3B0aW9uYWwgY29udGV4dCBvYmplY3QgdG8gdXNlIHdoZW4gaW52b2tpbmcgdGhlXG4gICAqICAgbGlzdGVuZXJcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnRUeXBlLCBsaXN0ZW5lciwgY29udGV4dCkge1xuICAgIHZhciBlbWl0dGVyID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldmVudFR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGVtaXR0ZXIucmVtb3ZlQ3VycmVudExpc3RlbmVyKCk7XG4gICAgICBsaXN0ZW5lci5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCBvZiB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMsIGluY2x1ZGluZyB0aG9zZSByZWdpc3RlcmVkIGFzXG4gICAqIGxpc3RlbmVyIG1hcHMuXG4gICAqXG4gICAqIEBwYXJhbSB7P3N0cmluZ30gZXZlbnRUeXBlIC0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgd2hvc2UgcmVnaXN0ZXJlZFxuICAgKiAgIGxpc3RlbmVycyB0byByZW1vdmVcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50VHlwZSkge1xuICAgIHRoaXMuX3N1YnNjcmliZXIucmVtb3ZlQWxsU3Vic2NyaXB0aW9ucyhldmVudFR5cGUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBQcm92aWRlcyBhbiBBUEkgdGhhdCBjYW4gYmUgY2FsbGVkIGR1cmluZyBhbiBldmVudGluZyBjeWNsZSB0byByZW1vdmUgdGhlXG4gICAqIGxhc3QgbGlzdGVuZXIgdGhhdCB3YXMgaW52b2tlZC4gVGhpcyBhbGxvd3MgYSBkZXZlbG9wZXIgdG8gcHJvdmlkZSBhbiBldmVudFxuICAgKiBvYmplY3QgdGhhdCBjYW4gcmVtb3ZlIHRoZSBsaXN0ZW5lciAob3IgbGlzdGVuZXIgbWFwKSBkdXJpbmcgdGhlXG4gICAqIGludm9jYXRpb24uXG4gICAqXG4gICAqIElmIGl0IGlzIGNhbGxlZCB3aGVuIG5vdCBpbnNpZGUgb2YgYW4gZW1pdHRpbmcgY3ljbGUgaXQgd2lsbCB0aHJvdy5cbiAgICpcbiAgICogQHRocm93cyB7RXJyb3J9IFdoZW4gY2FsbGVkIG5vdCBkdXJpbmcgYW4gZXZlbnRpbmcgY3ljbGVcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogICB2YXIgc3Vic2NyaXB0aW9uID0gZW1pdHRlci5hZGRMaXN0ZW5lck1hcCh7XG4gICAqICAgICBzb21lRXZlbnQ6IGZ1bmN0aW9uKGRhdGEsIGV2ZW50KSB7XG4gICAqICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgKiAgICAgICBlbWl0dGVyLnJlbW92ZUN1cnJlbnRMaXN0ZW5lcigpO1xuICAgKiAgICAgfVxuICAgKiAgIH0pO1xuICAgKlxuICAgKiAgIGVtaXR0ZXIuZW1pdCgnc29tZUV2ZW50JywgJ2FiYycpOyAvLyBsb2dzICdhYmMnXG4gICAqICAgZW1pdHRlci5lbWl0KCdzb21lRXZlbnQnLCAnZGVmJyk7IC8vIGRvZXMgbm90IGxvZyBhbnl0aGluZ1xuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVDdXJyZW50TGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVDdXJyZW50TGlzdGVuZXIoKSB7XG4gICAgISEhdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdOb3QgaW4gYW4gZW1pdHRpbmcgY3ljbGU7IHRoZXJlIGlzIG5vIGN1cnJlbnQgc3Vic2NyaXB0aW9uJykgOiBpbnZhcmlhbnQoZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIHRoaXMuX3N1YnNjcmliZXIucmVtb3ZlU3Vic2NyaXB0aW9uKHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0aGF0IGFyZSBjdXJyZW50bHkgcmVnaXN0ZXJlZCBmb3IgdGhlIGdpdmVuXG4gICAqIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIC0gTmFtZSBvZiB0aGUgZXZlbnQgdG8gcXVlcnlcbiAgICogQHJldHVybiB7YXJyYXl9XG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudFR5cGUpIC8qIFRPRE86IEFycmF5PEV2ZW50U3Vic2NyaXB0aW9uPiAqL3tcbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHRoaXMuX3N1YnNjcmliZXIuZ2V0U3Vic2NyaXB0aW9uc0ZvclR5cGUoZXZlbnRUeXBlKTtcbiAgICByZXR1cm4gc3Vic2NyaXB0aW9ucyA/IHN1YnNjcmlwdGlvbnMuZmlsdGVyKGVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNUcnVlKS5tYXAoZnVuY3Rpb24gKHN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbi5saXN0ZW5lcjtcbiAgICB9KSA6IFtdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBldmVudCBvZiB0aGUgZ2l2ZW4gdHlwZSB3aXRoIHRoZSBnaXZlbiBkYXRhLiBBbGwgaGFuZGxlcnMgb2YgdGhhdFxuICAgKiBwYXJ0aWN1bGFyIHR5cGUgd2lsbCBiZSBub3RpZmllZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSAtIE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXRcbiAgICogQHBhcmFtIHsqfSBBcmJpdHJhcnkgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIHJlZ2lzdGVyZWQgbGlzdGVuZXJcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogICBlbWl0dGVyLmFkZExpc3RlbmVyKCdzb21lRXZlbnQnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAqICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICogICB9KTtcbiAgICpcbiAgICogICBlbWl0dGVyLmVtaXQoJ3NvbWVFdmVudCcsICdhYmMnKTsgLy8gbG9ncyAnYWJjJ1xuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudFR5cGUpIHtcbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHRoaXMuX3N1YnNjcmliZXIuZ2V0U3Vic2NyaXB0aW9uc0ZvclR5cGUoZXZlbnRUeXBlKTtcbiAgICBpZiAoc3Vic2NyaXB0aW9ucykge1xuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhzdWJzY3JpcHRpb25zKTtcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBrZXlzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpaV07XG4gICAgICAgIHZhciBzdWJzY3JpcHRpb24gPSBzdWJzY3JpcHRpb25zW2tleV07XG4gICAgICAgIC8vIFRoZSBzdWJzY3JpcHRpb24gbWF5IGhhdmUgYmVlbiByZW1vdmVkIGR1cmluZyB0aGlzIGV2ZW50IGxvb3AuXG4gICAgICAgIGlmIChzdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICB0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uID0gc3Vic2NyaXB0aW9uO1xuICAgICAgICAgIHRoaXMuX19lbWl0VG9TdWJzY3JpcHRpb24uYXBwbHkodGhpcywgW3N1YnNjcmlwdGlvbl0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBQcm92aWRlcyBhIGhvb2sgdG8gb3ZlcnJpZGUgaG93IHRoZSBlbWl0dGVyIGVtaXRzIGFuIGV2ZW50IHRvIGEgc3BlY2lmaWNcbiAgICogc3Vic2NyaXB0aW9uLiBUaGlzIGFsbG93cyB5b3UgdG8gc2V0IHVwIGxvZ2dpbmcgYW5kIGVycm9yIGJvdW5kYXJpZXNcbiAgICogc3BlY2lmaWMgdG8geW91ciBlbnZpcm9ubWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtFbWl0dGVyU3Vic2NyaXB0aW9ufSBzdWJzY3JpcHRpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICAgKiBAcGFyYW0geyp9IEFyYml0cmFyeSBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggcmVnaXN0ZXJlZCBsaXN0ZW5lclxuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fX2VtaXRUb1N1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uIF9fZW1pdFRvU3Vic2NyaXB0aW9uKHN1YnNjcmlwdGlvbiwgZXZlbnRUeXBlKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHN1YnNjcmlwdGlvbi5saXN0ZW5lci5hcHBseShzdWJzY3JpcHRpb24uY29udGV4dCwgYXJncyk7XG4gIH07XG5cbiAgcmV0dXJuIEJhc2VFdmVudEVtaXR0ZXI7XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VFdmVudEVtaXR0ZXI7IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICogXG4gKiBAcHJvdmlkZXNNb2R1bGUgRW1pdHRlclN1YnNjcmlwdGlvblxuICogQHR5cGVjaGVja3NcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgRXZlbnRTdWJzY3JpcHRpb24gPSByZXF1aXJlKCcuL0V2ZW50U3Vic2NyaXB0aW9uJyk7XG5cbi8qKlxuICogRW1pdHRlclN1YnNjcmlwdGlvbiByZXByZXNlbnRzIGEgc3Vic2NyaXB0aW9uIHdpdGggbGlzdGVuZXIgYW5kIGNvbnRleHQgZGF0YS5cbiAqL1xuXG52YXIgRW1pdHRlclN1YnNjcmlwdGlvbiA9IChmdW5jdGlvbiAoX0V2ZW50U3Vic2NyaXB0aW9uKSB7XG4gIF9pbmhlcml0cyhFbWl0dGVyU3Vic2NyaXB0aW9uLCBfRXZlbnRTdWJzY3JpcHRpb24pO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yfSBzdWJzY3JpYmVyIC0gVGhlIHN1YnNjcmliZXIgdGhhdCBjb250cm9sc1xuICAgKiAgIHRoaXMgc3Vic2NyaXB0aW9uXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gRnVuY3Rpb24gdG8gaW52b2tlIHdoZW4gdGhlIHNwZWNpZmllZCBldmVudCBpc1xuICAgKiAgIGVtaXR0ZWRcbiAgICogQHBhcmFtIHsqfSBjb250ZXh0IC0gT3B0aW9uYWwgY29udGV4dCBvYmplY3QgdG8gdXNlIHdoZW4gaW52b2tpbmcgdGhlXG4gICAqICAgbGlzdGVuZXJcbiAgICovXG5cbiAgZnVuY3Rpb24gRW1pdHRlclN1YnNjcmlwdGlvbihzdWJzY3JpYmVyLCBsaXN0ZW5lciwgY29udGV4dCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFbWl0dGVyU3Vic2NyaXB0aW9uKTtcblxuICAgIF9FdmVudFN1YnNjcmlwdGlvbi5jYWxsKHRoaXMsIHN1YnNjcmliZXIpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB9XG5cbiAgcmV0dXJuIEVtaXR0ZXJTdWJzY3JpcHRpb247XG59KShFdmVudFN1YnNjcmlwdGlvbik7XG5cbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlclN1YnNjcmlwdGlvbjsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIEV2ZW50U3Vic2NyaXB0aW9uXG4gKiBAdHlwZWNoZWNrc1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBFdmVudFN1YnNjcmlwdGlvbiByZXByZXNlbnRzIGEgc3Vic2NyaXB0aW9uIHRvIGEgcGFydGljdWxhciBldmVudC4gSXQgY2FuXG4gKiByZW1vdmUgaXRzIG93biBzdWJzY3JpcHRpb24uXG4gKi9cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBFdmVudFN1YnNjcmlwdGlvbiA9IChmdW5jdGlvbiAoKSB7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RXZlbnRTdWJzY3JpcHRpb25WZW5kb3J9IHN1YnNjcmliZXIgdGhlIHN1YnNjcmliZXIgdGhhdCBjb250cm9sc1xuICAgKiAgIHRoaXMgc3Vic2NyaXB0aW9uLlxuICAgKi9cblxuICBmdW5jdGlvbiBFdmVudFN1YnNjcmlwdGlvbihzdWJzY3JpYmVyKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEV2ZW50U3Vic2NyaXB0aW9uKTtcblxuICAgIHRoaXMuc3Vic2NyaWJlciA9IHN1YnNjcmliZXI7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGlzIHN1YnNjcmlwdGlvbiBmcm9tIHRoZSBzdWJzY3JpYmVyIHRoYXQgY29udHJvbHMgaXQuXG4gICAqL1xuXG4gIEV2ZW50U3Vic2NyaXB0aW9uLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgaWYgKHRoaXMuc3Vic2NyaWJlcikge1xuICAgICAgdGhpcy5zdWJzY3JpYmVyLnJlbW92ZVN1YnNjcmlwdGlvbih0aGlzKTtcbiAgICAgIHRoaXMuc3Vic2NyaWJlciA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBFdmVudFN1YnNjcmlwdGlvbjtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRTdWJzY3JpcHRpb247IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICogXG4gKiBAcHJvdmlkZXNNb2R1bGUgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3JcbiAqIEB0eXBlY2hlY2tzXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIGludmFyaWFudCA9IHJlcXVpcmUoJ2ZianMvbGliL2ludmFyaWFudCcpO1xuXG4vKipcbiAqIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yIHN0b3JlcyBhIHNldCBvZiBFdmVudFN1YnNjcmlwdGlvbnMgdGhhdCBhcmVcbiAqIHN1YnNjcmliZWQgdG8gYSBwYXJ0aWN1bGFyIGV2ZW50IHR5cGUuXG4gKi9cblxudmFyIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlID0ge307XG4gICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIHN1YnNjcmlwdGlvbiBrZXllZCBieSBhbiBldmVudCB0eXBlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlXG4gICAqIEBwYXJhbSB7RXZlbnRTdWJzY3JpcHRpb259IHN1YnNjcmlwdGlvblxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvblZlbmRvci5wcm90b3R5cGUuYWRkU3Vic2NyaXB0aW9uID0gZnVuY3Rpb24gYWRkU3Vic2NyaXB0aW9uKGV2ZW50VHlwZSwgc3Vic2NyaXB0aW9uKSB7XG4gICAgIShzdWJzY3JpcHRpb24uc3Vic2NyaWJlciA9PT0gdGhpcykgPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnVGhlIHN1YnNjcmliZXIgb2YgdGhlIHN1YnNjcmlwdGlvbiBpcyBpbmNvcnJlY3RseSBzZXQuJykgOiBpbnZhcmlhbnQoZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIGlmICghdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXSkge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXSA9IFtdO1xuICAgIH1cbiAgICB2YXIga2V5ID0gdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXS5sZW5ndGg7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXS5wdXNoKHN1YnNjcmlwdGlvbik7XG4gICAgc3Vic2NyaXB0aW9uLmV2ZW50VHlwZSA9IGV2ZW50VHlwZTtcbiAgICBzdWJzY3JpcHRpb24ua2V5ID0ga2V5O1xuICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBidWxrIHNldCBvZiB0aGUgc3Vic2NyaXB0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHs/c3RyaW5nfSBldmVudFR5cGUgLSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB0eXBlIHdob3NlXG4gICAqICAgcmVnaXN0ZXJlZCBzdXBzY3JpcHRpb25zIHRvIHJlbW92ZSwgaWYgbnVsbCByZW1vdmUgYWxsIHN1YnNjcmlwdGlvbnMuXG4gICAqL1xuXG4gIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLnByb3RvdHlwZS5yZW1vdmVBbGxTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gcmVtb3ZlQWxsU3Vic2NyaXB0aW9ucyhldmVudFR5cGUpIHtcbiAgICBpZiAoZXZlbnRUeXBlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlcyBhIHNwZWNpZmljIHN1YnNjcmlwdGlvbi4gSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgZnVuY3Rpb24sIGNhbGxcbiAgICogYHN1YnNjcmlwdGlvbi5yZW1vdmUoKWAgZGlyZWN0bHkuXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBzdWJzY3JpcHRpb25cbiAgICovXG5cbiAgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IucHJvdG90eXBlLnJlbW92ZVN1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uIHJlbW92ZVN1YnNjcmlwdGlvbihzdWJzY3JpcHRpb24pIHtcbiAgICB2YXIgZXZlbnRUeXBlID0gc3Vic2NyaXB0aW9uLmV2ZW50VHlwZTtcbiAgICB2YXIga2V5ID0gc3Vic2NyaXB0aW9uLmtleTtcblxuICAgIHZhciBzdWJzY3JpcHRpb25zRm9yVHlwZSA9IHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV07XG4gICAgaWYgKHN1YnNjcmlwdGlvbnNGb3JUeXBlKSB7XG4gICAgICBkZWxldGUgc3Vic2NyaXB0aW9uc0ZvclR5cGVba2V5XTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFycmF5IG9mIHN1YnNjcmlwdGlvbnMgdGhhdCBhcmUgY3VycmVudGx5IHJlZ2lzdGVyZWQgZm9yIHRoZVxuICAgKiBnaXZlbiBldmVudCB0eXBlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIGFycmF5IGNhbiBiZSBwb3RlbnRpYWxseSBzcGFyc2UgYXMgc3Vic2NyaXB0aW9ucyBhcmUgZGVsZXRlZFxuICAgKiBmcm9tIGl0IHdoZW4gdGhleSBhcmUgcmVtb3ZlZC5cbiAgICpcbiAgICogVE9ETzogVGhpcyByZXR1cm5zIGEgbnVsbGFibGUgYXJyYXkuIHdhdD9cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICAgKiBAcmV0dXJuIHs/YXJyYXl9XG4gICAqL1xuXG4gIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLnByb3RvdHlwZS5nZXRTdWJzY3JpcHRpb25zRm9yVHlwZSA9IGZ1bmN0aW9uIGdldFN1YnNjcmlwdGlvbnNGb3JUeXBlKGV2ZW50VHlwZSkge1xuICAgIHJldHVybiB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdO1xuICB9O1xuXG4gIHJldHVybiBFdmVudFN1YnNjcmlwdGlvblZlbmRvcjtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRTdWJzY3JpcHRpb25WZW5kb3I7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBcbiAqL1xuXG5mdW5jdGlvbiBtYWtlRW1wdHlGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYXJnO1xuICB9O1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gYWNjZXB0cyBhbmQgZGlzY2FyZHMgaW5wdXRzOyBpdCBoYXMgbm8gc2lkZSBlZmZlY3RzLiBUaGlzIGlzXG4gKiBwcmltYXJpbHkgdXNlZnVsIGlkaW9tYXRpY2FsbHkgZm9yIG92ZXJyaWRhYmxlIGZ1bmN0aW9uIGVuZHBvaW50cyB3aGljaFxuICogYWx3YXlzIG5lZWQgdG8gYmUgY2FsbGFibGUsIHNpbmNlIEpTIGxhY2tzIGEgbnVsbC1jYWxsIGlkaW9tIGFsYSBDb2NvYS5cbiAqL1xudmFyIGVtcHR5RnVuY3Rpb24gPSBmdW5jdGlvbiBlbXB0eUZ1bmN0aW9uKCkge307XG5cbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnMgPSBtYWtlRW1wdHlGdW5jdGlvbjtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNGYWxzZSA9IG1ha2VFbXB0eUZ1bmN0aW9uKGZhbHNlKTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNUcnVlID0gbWFrZUVtcHR5RnVuY3Rpb24odHJ1ZSk7XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zTnVsbCA9IG1ha2VFbXB0eUZ1bmN0aW9uKG51bGwpO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc1RoaXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNBcmd1bWVudCA9IGZ1bmN0aW9uIChhcmcpIHtcbiAgcmV0dXJuIGFyZztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZW1wdHlGdW5jdGlvbjsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBVc2UgaW52YXJpYW50KCkgdG8gYXNzZXJ0IHN0YXRlIHdoaWNoIHlvdXIgcHJvZ3JhbSBhc3N1bWVzIHRvIGJlIHRydWUuXG4gKlxuICogUHJvdmlkZSBzcHJpbnRmLXN0eWxlIGZvcm1hdCAob25seSAlcyBpcyBzdXBwb3J0ZWQpIGFuZCBhcmd1bWVudHNcbiAqIHRvIHByb3ZpZGUgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCBicm9rZSBhbmQgd2hhdCB5b3Ugd2VyZVxuICogZXhwZWN0aW5nLlxuICpcbiAqIFRoZSBpbnZhcmlhbnQgbWVzc2FnZSB3aWxsIGJlIHN0cmlwcGVkIGluIHByb2R1Y3Rpb24sIGJ1dCB0aGUgaW52YXJpYW50XG4gKiB3aWxsIHJlbWFpbiB0byBlbnN1cmUgbG9naWMgZG9lcyBub3QgZGlmZmVyIGluIHByb2R1Y3Rpb24uXG4gKi9cblxuZnVuY3Rpb24gaW52YXJpYW50KGNvbmRpdGlvbiwgZm9ybWF0LCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFyaWFudCByZXF1aXJlcyBhbiBlcnJvciBtZXNzYWdlIGFyZ3VtZW50Jyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb25kaXRpb24pIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcignTWluaWZpZWQgZXhjZXB0aW9uIG9jY3VycmVkOyB1c2UgdGhlIG5vbi1taW5pZmllZCBkZXYgZW52aXJvbm1lbnQgJyArICdmb3IgdGhlIGZ1bGwgZXJyb3IgbWVzc2FnZSBhbmQgYWRkaXRpb25hbCBoZWxwZnVsIHdhcm5pbmdzLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbiAgICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYXJnc1thcmdJbmRleCsrXTtcbiAgICAgIH0pKTtcbiAgICAgIGVycm9yLm5hbWUgPSAnSW52YXJpYW50IFZpb2xhdGlvbic7XG4gICAgfVxuXG4gICAgZXJyb3IuZnJhbWVzVG9Qb3AgPSAxOyAvLyB3ZSBkb24ndCBjYXJlIGFib3V0IGludmFyaWFudCdzIG93biBmcmFtZVxuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW52YXJpYW50OyIsInZhciByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBTeW1ib2wgPSByb290LlN5bWJvbDtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2w7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5tYXBgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZVxuICogc2hvcnRoYW5kcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gW2FycmF5XSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gYXJyYXlNYXAoYXJyYXksIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkgPT0gbnVsbCA/IDAgOiBhcnJheS5sZW5ndGgsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5TWFwO1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5jbGFtcGAgd2hpY2ggZG9lc24ndCBjb2VyY2UgYXJndW1lbnRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIFRoZSBudW1iZXIgdG8gY2xhbXAuXG4gKiBAcGFyYW0ge251bWJlcn0gW2xvd2VyXSBUaGUgbG93ZXIgYm91bmQuXG4gKiBAcGFyYW0ge251bWJlcn0gdXBwZXIgVGhlIHVwcGVyIGJvdW5kLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgY2xhbXBlZCBudW1iZXIuXG4gKi9cbmZ1bmN0aW9uIGJhc2VDbGFtcChudW1iZXIsIGxvd2VyLCB1cHBlcikge1xuICBpZiAobnVtYmVyID09PSBudW1iZXIpIHtcbiAgICBpZiAodXBwZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbnVtYmVyID0gbnVtYmVyIDw9IHVwcGVyID8gbnVtYmVyIDogdXBwZXI7XG4gICAgfVxuICAgIGlmIChsb3dlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBudW1iZXIgPSBudW1iZXIgPj0gbG93ZXIgPyBudW1iZXIgOiBsb3dlcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bWJlcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQ2xhbXA7XG4iLCJ2YXIgU3ltYm9sID0gcmVxdWlyZSgnLi9fU3ltYm9sJyksXG4gICAgZ2V0UmF3VGFnID0gcmVxdWlyZSgnLi9fZ2V0UmF3VGFnJyksXG4gICAgb2JqZWN0VG9TdHJpbmcgPSByZXF1aXJlKCcuL19vYmplY3RUb1N0cmluZycpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgbnVsbFRhZyA9ICdbb2JqZWN0IE51bGxdJyxcbiAgICB1bmRlZmluZWRUYWcgPSAnW29iamVjdCBVbmRlZmluZWRdJztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3ltVG9TdHJpbmdUYWcgPSBTeW1ib2wgPyBTeW1ib2wudG9TdHJpbmdUYWcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGdldFRhZ2Agd2l0aG91dCBmYWxsYmFja3MgZm9yIGJ1Z2d5IGVudmlyb25tZW50cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBgdG9TdHJpbmdUYWdgLlxuICovXG5mdW5jdGlvbiBiYXNlR2V0VGFnKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWRUYWcgOiBudWxsVGFnO1xuICB9XG4gIHZhbHVlID0gT2JqZWN0KHZhbHVlKTtcbiAgcmV0dXJuIChzeW1Ub1N0cmluZ1RhZyAmJiBzeW1Ub1N0cmluZ1RhZyBpbiB2YWx1ZSlcbiAgICA/IGdldFJhd1RhZyh2YWx1ZSlcbiAgICA6IG9iamVjdFRvU3RyaW5nKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlR2V0VGFnO1xuIiwidmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpLFxuICAgIGFycmF5TWFwID0gcmVxdWlyZSgnLi9fYXJyYXlNYXAnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi9pc0FycmF5JyksXG4gICAgaXNTeW1ib2wgPSByZXF1aXJlKCcuL2lzU3ltYm9sJyk7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDA7XG5cbi8qKiBVc2VkIHRvIGNvbnZlcnQgc3ltYm9scyB0byBwcmltaXRpdmVzIGFuZCBzdHJpbmdzLiAqL1xudmFyIHN5bWJvbFByb3RvID0gU3ltYm9sID8gU3ltYm9sLnByb3RvdHlwZSA6IHVuZGVmaW5lZCxcbiAgICBzeW1ib2xUb1N0cmluZyA9IHN5bWJvbFByb3RvID8gc3ltYm9sUHJvdG8udG9TdHJpbmcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udG9TdHJpbmdgIHdoaWNoIGRvZXNuJ3QgY29udmVydCBudWxsaXNoXG4gKiB2YWx1ZXMgdG8gZW1wdHkgc3RyaW5ncy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gYmFzZVRvU3RyaW5nKHZhbHVlKSB7XG4gIC8vIEV4aXQgZWFybHkgZm9yIHN0cmluZ3MgdG8gYXZvaWQgYSBwZXJmb3JtYW5jZSBoaXQgaW4gc29tZSBlbnZpcm9ubWVudHMuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gUmVjdXJzaXZlbHkgY29udmVydCB2YWx1ZXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKS5cbiAgICByZXR1cm4gYXJyYXlNYXAodmFsdWUsIGJhc2VUb1N0cmluZykgKyAnJztcbiAgfVxuICBpZiAoaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIHN5bWJvbFRvU3RyaW5nID8gc3ltYm9sVG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgfVxuICB2YXIgcmVzdWx0ID0gKHZhbHVlICsgJycpO1xuICByZXR1cm4gKHJlc3VsdCA9PSAnMCcgJiYgKDEgLyB2YWx1ZSkgPT0gLUlORklOSVRZKSA/ICctMCcgOiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVRvU3RyaW5nO1xuIiwidmFyIHRvSW50ZWdlciA9IHJlcXVpcmUoJy4vdG9JbnRlZ2VyJyksXG4gICAgdG9OdW1iZXIgPSByZXF1aXJlKCcuL3RvTnVtYmVyJyksXG4gICAgdG9TdHJpbmcgPSByZXF1aXJlKCcuL3RvU3RyaW5nJyk7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNaW4gPSBNYXRoLm1pbjtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gbGlrZSBgXy5yb3VuZGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2ROYW1lIFRoZSBuYW1lIG9mIHRoZSBgTWF0aGAgbWV0aG9kIHRvIHVzZSB3aGVuIHJvdW5kaW5nLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgcm91bmQgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvdW5kKG1ldGhvZE5hbWUpIHtcbiAgdmFyIGZ1bmMgPSBNYXRoW21ldGhvZE5hbWVdO1xuICByZXR1cm4gZnVuY3Rpb24obnVtYmVyLCBwcmVjaXNpb24pIHtcbiAgICBudW1iZXIgPSB0b051bWJlcihudW1iZXIpO1xuICAgIHByZWNpc2lvbiA9IG5hdGl2ZU1pbih0b0ludGVnZXIocHJlY2lzaW9uKSwgMjkyKTtcbiAgICBpZiAocHJlY2lzaW9uKSB7XG4gICAgICAvLyBTaGlmdCB3aXRoIGV4cG9uZW50aWFsIG5vdGF0aW9uIHRvIGF2b2lkIGZsb2F0aW5nLXBvaW50IGlzc3Vlcy5cbiAgICAgIC8vIFNlZSBbTUROXShodHRwczovL21kbi5pby9yb3VuZCNFeGFtcGxlcykgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgIHZhciBwYWlyID0gKHRvU3RyaW5nKG51bWJlcikgKyAnZScpLnNwbGl0KCdlJyksXG4gICAgICAgICAgdmFsdWUgPSBmdW5jKHBhaXJbMF0gKyAnZScgKyAoK3BhaXJbMV0gKyBwcmVjaXNpb24pKTtcblxuICAgICAgcGFpciA9ICh0b1N0cmluZyh2YWx1ZSkgKyAnZScpLnNwbGl0KCdlJyk7XG4gICAgICByZXR1cm4gKyhwYWlyWzBdICsgJ2UnICsgKCtwYWlyWzFdIC0gcHJlY2lzaW9uKSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jKG51bWJlcik7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUm91bmQ7XG4iLCIvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAgZnJvbSBOb2RlLmpzLiAqL1xudmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbCAmJiBnbG9iYWwuT2JqZWN0ID09PSBPYmplY3QgJiYgZ2xvYmFsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZyZWVHbG9iYWw7XG4iLCJ2YXIgb3ZlckFyZyA9IHJlcXVpcmUoJy4vX292ZXJBcmcnKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgZ2V0UHJvdG90eXBlID0gb3ZlckFyZyhPYmplY3QuZ2V0UHJvdG90eXBlT2YsIE9iamVjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0UHJvdG90eXBlO1xuIiwidmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgbmF0aXZlT2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3ltVG9TdHJpbmdUYWcgPSBTeW1ib2wgPyBTeW1ib2wudG9TdHJpbmdUYWcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlR2V0VGFnYCB3aGljaCBpZ25vcmVzIGBTeW1ib2wudG9TdHJpbmdUYWdgIHZhbHVlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSByYXcgYHRvU3RyaW5nVGFnYC5cbiAqL1xuZnVuY3Rpb24gZ2V0UmF3VGFnKHZhbHVlKSB7XG4gIHZhciBpc093biA9IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHN5bVRvU3RyaW5nVGFnKSxcbiAgICAgIHRhZyA9IHZhbHVlW3N5bVRvU3RyaW5nVGFnXTtcblxuICB0cnkge1xuICAgIHZhbHVlW3N5bVRvU3RyaW5nVGFnXSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgdW5tYXNrZWQgPSB0cnVlO1xuICB9IGNhdGNoIChlKSB7fVxuXG4gIHZhciByZXN1bHQgPSBuYXRpdmVPYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgaWYgKHVubWFza2VkKSB7XG4gICAgaWYgKGlzT3duKSB7XG4gICAgICB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ10gPSB0YWc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ107XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0UmF3VGFnO1xuIiwiLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyB1c2luZyBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0VG9TdHJpbmc7XG4iLCIvKipcbiAqIENyZWF0ZXMgYSB1bmFyeSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYGZ1bmNgIHdpdGggaXRzIGFyZ3VtZW50IHRyYW5zZm9ybWVkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gdHJhbnNmb3JtIFRoZSBhcmd1bWVudCB0cmFuc2Zvcm0uXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gb3ZlckFyZyhmdW5jLCB0cmFuc2Zvcm0pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGFyZykge1xuICAgIHJldHVybiBmdW5jKHRyYW5zZm9ybShhcmcpKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvdmVyQXJnO1xuIiwidmFyIGZyZWVHbG9iYWwgPSByZXF1aXJlKCcuL19mcmVlR2xvYmFsJyk7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgc2VsZmAuICovXG52YXIgZnJlZVNlbGYgPSB0eXBlb2Ygc2VsZiA9PSAnb2JqZWN0JyAmJiBzZWxmICYmIHNlbGYuT2JqZWN0ID09PSBPYmplY3QgJiYgc2VsZjtcblxuLyoqIFVzZWQgYXMgYSByZWZlcmVuY2UgdG8gdGhlIGdsb2JhbCBvYmplY3QuICovXG52YXIgcm9vdCA9IGZyZWVHbG9iYWwgfHwgZnJlZVNlbGYgfHwgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblxubW9kdWxlLmV4cG9ydHMgPSByb290O1xuIiwidmFyIGJhc2VDbGFtcCA9IHJlcXVpcmUoJy4vX2Jhc2VDbGFtcCcpLFxuICAgIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpO1xuXG4vKipcbiAqIENsYW1wcyBgbnVtYmVyYCB3aXRoaW4gdGhlIGluY2x1c2l2ZSBgbG93ZXJgIGFuZCBgdXBwZXJgIGJvdW5kcy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTnVtYmVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIFRoZSBudW1iZXIgdG8gY2xhbXAuXG4gKiBAcGFyYW0ge251bWJlcn0gW2xvd2VyXSBUaGUgbG93ZXIgYm91bmQuXG4gKiBAcGFyYW0ge251bWJlcn0gdXBwZXIgVGhlIHVwcGVyIGJvdW5kLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgY2xhbXBlZCBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uY2xhbXAoLTEwLCAtNSwgNSk7XG4gKiAvLyA9PiAtNVxuICpcbiAqIF8uY2xhbXAoMTAsIC01LCA1KTtcbiAqIC8vID0+IDVcbiAqL1xuZnVuY3Rpb24gY2xhbXAobnVtYmVyLCBsb3dlciwgdXBwZXIpIHtcbiAgaWYgKHVwcGVyID09PSB1bmRlZmluZWQpIHtcbiAgICB1cHBlciA9IGxvd2VyO1xuICAgIGxvd2VyID0gdW5kZWZpbmVkO1xuICB9XG4gIGlmICh1cHBlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdXBwZXIgPSB0b051bWJlcih1cHBlcik7XG4gICAgdXBwZXIgPSB1cHBlciA9PT0gdXBwZXIgPyB1cHBlciA6IDA7XG4gIH1cbiAgaWYgKGxvd2VyICE9PSB1bmRlZmluZWQpIHtcbiAgICBsb3dlciA9IHRvTnVtYmVyKGxvd2VyKTtcbiAgICBsb3dlciA9IGxvd2VyID09PSBsb3dlciA/IGxvd2VyIDogMDtcbiAgfVxuICByZXR1cm4gYmFzZUNsYW1wKHRvTnVtYmVyKG51bWJlciksIGxvd2VyLCB1cHBlcik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhbXA7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0JyksXG4gICAgbm93ID0gcmVxdWlyZSgnLi9ub3cnKSxcbiAgICB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKTtcblxuLyoqIEVycm9yIG1lc3NhZ2UgY29uc3RhbnRzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgIG5hdGl2ZU1pbiA9IE1hdGgubWluO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgaW52b2tpbmcgYGZ1bmNgIHVudGlsIGFmdGVyIGB3YWl0YFxuICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXG4gKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXG4gKiBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0byBpbW1lZGlhdGVseSBpbnZva2UgdGhlbS5cbiAqIFByb3ZpZGUgYG9wdGlvbnNgIHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZVxuICogbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFRoZSBgZnVuY2AgaXMgaW52b2tlZFxuICogd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbi4gU3Vic2VxdWVudFxuICogY2FsbHMgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbiByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2BcbiAqIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpc1xuICogaW52b2tlZCBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb25cbiAqIGlzIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBJZiBgd2FpdGAgaXMgYDBgIGFuZCBgbGVhZGluZ2AgaXMgYGZhbHNlYCwgYGZ1bmNgIGludm9jYXRpb24gaXMgZGVmZXJyZWRcbiAqIHVudGlsIHRvIHRoZSBuZXh0IHRpY2ssIHNpbWlsYXIgdG8gYHNldFRpbWVvdXRgIHdpdGggYSB0aW1lb3V0IG9mIGAwYC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8uZGVib3VuY2VgIGFuZCBgXy50aHJvdHRsZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XVxuICogIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBpbnZva2VkLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXguXG4gKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCkpO1xuICpcbiAqIC8vIEludm9rZSBgc2VuZE1haWxgIHdoZW4gY2xpY2tlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzLlxuICogalF1ZXJ5KGVsZW1lbnQpLm9uKCdjbGljaycsIF8uZGVib3VuY2Uoc2VuZE1haWwsIDMwMCwge1xuICogICAnbGVhZGluZyc6IHRydWUsXG4gKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gKiB9KSk7XG4gKlxuICogLy8gRW5zdXJlIGBiYXRjaExvZ2AgaXMgaW52b2tlZCBvbmNlIGFmdGVyIDEgc2Vjb25kIG9mIGRlYm91bmNlZCBjYWxscy5cbiAqIHZhciBkZWJvdW5jZWQgPSBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHsgJ21heFdhaXQnOiAxMDAwIH0pO1xuICogdmFyIHNvdXJjZSA9IG5ldyBFdmVudFNvdXJjZSgnL3N0cmVhbScpO1xuICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBkZWJvdW5jZWQpO1xuICpcbiAqIC8vIENhbmNlbCB0aGUgdHJhaWxpbmcgZGVib3VuY2VkIGludm9jYXRpb24uXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCBkZWJvdW5jZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGFzdEFyZ3MsXG4gICAgICBsYXN0VGhpcyxcbiAgICAgIG1heFdhaXQsXG4gICAgICByZXN1bHQsXG4gICAgICB0aW1lcklkLFxuICAgICAgbGFzdENhbGxUaW1lLFxuICAgICAgbGFzdEludm9rZVRpbWUgPSAwLFxuICAgICAgbGVhZGluZyA9IGZhbHNlLFxuICAgICAgbWF4aW5nID0gZmFsc2UsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgd2FpdCA9IHRvTnVtYmVyKHdhaXQpIHx8IDA7XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAhIW9wdGlvbnMubGVhZGluZztcbiAgICBtYXhpbmcgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucztcbiAgICBtYXhXYWl0ID0gbWF4aW5nID8gbmF0aXZlTWF4KHRvTnVtYmVyKG9wdGlvbnMubWF4V2FpdCkgfHwgMCwgd2FpdCkgOiBtYXhXYWl0O1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBpbnZva2VGdW5jKHRpbWUpIHtcbiAgICB2YXIgYXJncyA9IGxhc3RBcmdzLFxuICAgICAgICB0aGlzQXJnID0gbGFzdFRoaXM7XG5cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBsZWFkaW5nRWRnZSh0aW1lKSB7XG4gICAgLy8gUmVzZXQgYW55IGBtYXhXYWl0YCB0aW1lci5cbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgLy8gU3RhcnQgdGhlIHRpbWVyIGZvciB0aGUgdHJhaWxpbmcgZWRnZS5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIC8vIEludm9rZSB0aGUgbGVhZGluZyBlZGdlLlxuICAgIHJldHVybiBsZWFkaW5nID8gaW52b2tlRnVuYyh0aW1lKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbWFpbmluZ1dhaXQodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWUsXG4gICAgICAgIHJlc3VsdCA9IHdhaXQgLSB0aW1lU2luY2VMYXN0Q2FsbDtcblxuICAgIHJldHVybiBtYXhpbmcgPyBuYXRpdmVNaW4ocmVzdWx0LCBtYXhXYWl0IC0gdGltZVNpbmNlTGFzdEludm9rZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzaG91bGRJbnZva2UodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWU7XG5cbiAgICAvLyBFaXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgY2FsbCwgYWN0aXZpdHkgaGFzIHN0b3BwZWQgYW5kIHdlJ3JlIGF0IHRoZVxuICAgIC8vIHRyYWlsaW5nIGVkZ2UsIHRoZSBzeXN0ZW0gdGltZSBoYXMgZ29uZSBiYWNrd2FyZHMgYW5kIHdlJ3JlIHRyZWF0aW5nXG4gICAgLy8gaXQgYXMgdGhlIHRyYWlsaW5nIGVkZ2UsIG9yIHdlJ3ZlIGhpdCB0aGUgYG1heFdhaXRgIGxpbWl0LlxuICAgIHJldHVybiAobGFzdENhbGxUaW1lID09PSB1bmRlZmluZWQgfHwgKHRpbWVTaW5jZUxhc3RDYWxsID49IHdhaXQpIHx8XG4gICAgICAodGltZVNpbmNlTGFzdENhbGwgPCAwKSB8fCAobWF4aW5nICYmIHRpbWVTaW5jZUxhc3RJbnZva2UgPj0gbWF4V2FpdCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGltZXJFeHBpcmVkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCk7XG4gICAgaWYgKHNob3VsZEludm9rZSh0aW1lKSkge1xuICAgICAgcmV0dXJuIHRyYWlsaW5nRWRnZSh0aW1lKTtcbiAgICB9XG4gICAgLy8gUmVzdGFydCB0aGUgdGltZXIuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCByZW1haW5pbmdXYWl0KHRpbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYWlsaW5nRWRnZSh0aW1lKSB7XG4gICAgdGltZXJJZCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIE9ubHkgaW52b2tlIGlmIHdlIGhhdmUgYGxhc3RBcmdzYCB3aGljaCBtZWFucyBgZnVuY2AgaGFzIGJlZW5cbiAgICAvLyBkZWJvdW5jZWQgYXQgbGVhc3Qgb25jZS5cbiAgICBpZiAodHJhaWxpbmcgJiYgbGFzdEFyZ3MpIHtcbiAgICAgIHJldHVybiBpbnZva2VGdW5jKHRpbWUpO1xuICAgIH1cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgaWYgKHRpbWVySWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVySWQpO1xuICAgIH1cbiAgICBsYXN0SW52b2tlVGltZSA9IDA7XG4gICAgbGFzdEFyZ3MgPSBsYXN0Q2FsbFRpbWUgPSBsYXN0VGhpcyA9IHRpbWVySWQgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICByZXR1cm4gdGltZXJJZCA9PT0gdW5kZWZpbmVkID8gcmVzdWx0IDogdHJhaWxpbmdFZGdlKG5vdygpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlYm91bmNlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpLFxuICAgICAgICBpc0ludm9raW5nID0gc2hvdWxkSW52b2tlKHRpbWUpO1xuXG4gICAgbGFzdEFyZ3MgPSBhcmd1bWVudHM7XG4gICAgbGFzdFRoaXMgPSB0aGlzO1xuICAgIGxhc3RDYWxsVGltZSA9IHRpbWU7XG5cbiAgICBpZiAoaXNJbnZva2luZykge1xuICAgICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbGVhZGluZ0VkZ2UobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChtYXhpbmcpIHtcbiAgICAgICAgLy8gSGFuZGxlIGludm9jYXRpb25zIGluIGEgdGlnaHQgbG9vcC5cbiAgICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAgICAgcmV0dXJuIGludm9rZUZ1bmMobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBkZWJvdW5jZWQuY2FuY2VsID0gY2FuY2VsO1xuICBkZWJvdW5jZWQuZmx1c2ggPSBmbHVzaDtcbiAgcmV0dXJuIGRlYm91bmNlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgQXJyYXlgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheSgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXk7XG4iLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbicpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pc0xlbmd0aCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuIEEgdmFsdWUgaXMgY29uc2lkZXJlZCBhcnJheS1saWtlIGlmIGl0J3NcbiAqIG5vdCBhIGZ1bmN0aW9uIGFuZCBoYXMgYSBgdmFsdWUubGVuZ3RoYCB0aGF0J3MgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gb3JcbiAqIGVxdWFsIHRvIGAwYCBhbmQgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKCdhYmMnKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmICFpc0Z1bmN0aW9uKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5TGlrZTtcbiIsInZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpLFxuICAgIGlzUGxhaW5PYmplY3QgPSByZXF1aXJlKCcuL2lzUGxhaW5PYmplY3QnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBsaWtlbHkgYSBET00gZWxlbWVudC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIERPTSBlbGVtZW50LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNFbGVtZW50KGRvY3VtZW50LmJvZHkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNFbGVtZW50KCc8Ym9keT4nKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRWxlbWVudCh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiB2YWx1ZS5ub2RlVHlwZSA9PT0gMSAmJiAhaXNQbGFpbk9iamVjdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNFbGVtZW50O1xuIiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVJc0Zpbml0ZSA9IHJvb3QuaXNGaW5pdGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBmaW5pdGUgcHJpbWl0aXZlIG51bWJlci5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgYmFzZWQgb25cbiAqIFtgTnVtYmVyLmlzRmluaXRlYF0oaHR0cHM6Ly9tZG4uaW8vTnVtYmVyL2lzRmluaXRlKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGZpbml0ZSBudW1iZXIsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Zpbml0ZSgzKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRmluaXRlKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGaW5pdGUoSW5maW5pdHkpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzRmluaXRlKCczJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Zpbml0ZSh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIG5hdGl2ZUlzRmluaXRlKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Zpbml0ZTtcbiIsInZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXN5bmNUYWcgPSAnW29iamVjdCBBc3luY0Z1bmN0aW9uXScsXG4gICAgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgZ2VuVGFnID0gJ1tvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dJyxcbiAgICBwcm94eVRhZyA9ICdbb2JqZWN0IFByb3h5XSc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICghaXNPYmplY3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOSB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheXMgYW5kIG90aGVyIGNvbnN0cnVjdG9ycy5cbiAgdmFyIHRhZyA9IGJhc2VHZXRUYWcodmFsdWUpO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZyB8fCB0YWcgPT0gYXN5bmNUYWcgfHwgdGFnID09IHByb3h5VGFnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRnVuY3Rpb247XG4iLCIvKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgbGVuZ3RoLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBsb29zZWx5IGJhc2VkIG9uXG4gKiBbYFRvTGVuZ3RoYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtdG9sZW5ndGgpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNMZW5ndGgoMyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0xlbmd0aChOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0xlbmd0aChJbmZpbml0eSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoJzMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiZcbiAgICB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDw9IE1BWF9TQUZFX0lOVEVHRVI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNMZW5ndGg7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBudWxsaXNoLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNOaWwobnVsbCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc05pbCh2b2lkIDApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNOaWwoTmFOKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTmlsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PSBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTmlsO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdExpa2U7XG4iLCJ2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICBnZXRQcm90b3R5cGUgPSByZXF1aXJlKCcuL19nZXRQcm90b3R5cGUnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0VGFnID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGUsXG4gICAgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZnVuY1RvU3RyaW5nID0gZnVuY1Byb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogVXNlZCB0byBpbmZlciB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IuICovXG52YXIgb2JqZWN0Q3RvclN0cmluZyA9IGZ1bmNUb1N0cmluZy5jYWxsKE9iamVjdCk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIHRoYXQgaXMsIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZVxuICogYE9iamVjdGAgY29uc3RydWN0b3Igb3Igb25lIHdpdGggYSBgW1tQcm90b3R5cGVdXWAgb2YgYG51bGxgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC44LjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqIH1cbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QobmV3IEZvbyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoeyAneCc6IDAsICd5JzogMCB9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoT2JqZWN0LmNyZWF0ZShudWxsKSk7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgaWYgKCFpc09iamVjdExpa2UodmFsdWUpIHx8IGJhc2VHZXRUYWcodmFsdWUpICE9IG9iamVjdFRhZykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgcHJvdG8gPSBnZXRQcm90b3R5cGUodmFsdWUpO1xuICBpZiAocHJvdG8gPT09IG51bGwpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgQ3RvciA9IGhhc093blByb3BlcnR5LmNhbGwocHJvdG8sICdjb25zdHJ1Y3RvcicpICYmIHByb3RvLmNvbnN0cnVjdG9yO1xuICByZXR1cm4gdHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yIGluc3RhbmNlb2YgQ3RvciAmJlxuICAgIGZ1bmNUb1N0cmluZy5jYWxsKEN0b3IpID09IG9iamVjdEN0b3JTdHJpbmc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNQbGFpbk9iamVjdDtcbiIsInZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN5bWJvbGAgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHN5bWJvbCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3ltYm9sKFN5bWJvbC5pdGVyYXRvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N5bWJvbCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgYmFzZUdldFRhZyh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1N5bWJvbDtcbiIsInZhciByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKipcbiAqIEdldHMgdGhlIHRpbWVzdGFtcCBvZiB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZVxuICogdGhlIFVuaXggZXBvY2ggKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAyLjQuMFxuICogQGNhdGVnb3J5IERhdGVcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHRpbWVzdGFtcC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBMb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBpbnZvY2F0aW9uLlxuICovXG52YXIgbm93ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiByb290LkRhdGUubm93KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vdztcbiIsInZhciBjcmVhdGVSb3VuZCA9IHJlcXVpcmUoJy4vX2NyZWF0ZVJvdW5kJyk7XG5cbi8qKlxuICogQ29tcHV0ZXMgYG51bWJlcmAgcm91bmRlZCB0byBgcHJlY2lzaW9uYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDMuMTAuMFxuICogQGNhdGVnb3J5IE1hdGhcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIgVGhlIG51bWJlciB0byByb3VuZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbcHJlY2lzaW9uPTBdIFRoZSBwcmVjaXNpb24gdG8gcm91bmQgdG8uXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSByb3VuZGVkIG51bWJlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5yb3VuZCg0LjAwNik7XG4gKiAvLyA9PiA0XG4gKlxuICogXy5yb3VuZCg0LjAwNiwgMik7XG4gKiAvLyA9PiA0LjAxXG4gKlxuICogXy5yb3VuZCg0MDYwLCAtMik7XG4gKiAvLyA9PiA0MTAwXG4gKi9cbnZhciByb3VuZCA9IGNyZWF0ZVJvdW5kKCdyb3VuZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJvdW5kO1xuIiwidmFyIGRlYm91bmNlID0gcmVxdWlyZSgnLi9kZWJvdW5jZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKiogRXJyb3IgbWVzc2FnZSBjb25zdGFudHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKipcbiAqIENyZWF0ZXMgYSB0aHJvdHRsZWQgZnVuY3Rpb24gdGhhdCBvbmx5IGludm9rZXMgYGZ1bmNgIGF0IG1vc3Qgb25jZSBwZXJcbiAqIGV2ZXJ5IGB3YWl0YCBtaWxsaXNlY29uZHMuIFRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgXG4gKiBtZXRob2QgdG8gY2FuY2VsIGRlbGF5ZWQgYGZ1bmNgIGludm9jYXRpb25zIGFuZCBhIGBmbHVzaGAgbWV0aG9kIHRvXG4gKiBpbW1lZGlhdGVseSBpbnZva2UgdGhlbS4gUHJvdmlkZSBgb3B0aW9uc2AgdG8gaW5kaWNhdGUgd2hldGhlciBgZnVuY2BcbiAqIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGBcbiAqIHRpbWVvdXQuIFRoZSBgZnVuY2AgaXMgaW52b2tlZCB3aXRoIHRoZSBsYXN0IGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGVcbiAqIHRocm90dGxlZCBmdW5jdGlvbi4gU3Vic2VxdWVudCBjYWxscyB0byB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHJldHVybiB0aGVcbiAqIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2AgaW52b2NhdGlvbi5cbiAqXG4gKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzXG4gKiBpbnZva2VkIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIHRocm90dGxlZCBmdW5jdGlvblxuICogaXMgaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIElmIGB3YWl0YCBpcyBgMGAgYW5kIGBsZWFkaW5nYCBpcyBgZmFsc2VgLCBgZnVuY2AgaW52b2NhdGlvbiBpcyBkZWZlcnJlZFxuICogdW50aWwgdG8gdGhlIG5leHQgdGljaywgc2ltaWxhciB0byBgc2V0VGltZW91dGAgd2l0aCBhIHRpbWVvdXQgb2YgYDBgLlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwczovL2Nzcy10cmlja3MuY29tL2RlYm91bmNpbmctdGhyb3R0bGluZy1leHBsYWluZWQtZXhhbXBsZXMvKVxuICogZm9yIGRldGFpbHMgb3ZlciB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgXy50aHJvdHRsZWAgYW5kIGBfLmRlYm91bmNlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHRocm90dGxlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHRocm90dGxlIGludm9jYXRpb25zIHRvLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHRocm90dGxlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQXZvaWQgZXhjZXNzaXZlbHkgdXBkYXRpbmcgdGhlIHBvc2l0aW9uIHdoaWxlIHNjcm9sbGluZy5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdzY3JvbGwnLCBfLnRocm90dGxlKHVwZGF0ZVBvc2l0aW9uLCAxMDApKTtcbiAqXG4gKiAvLyBJbnZva2UgYHJlbmV3VG9rZW5gIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBidXQgbm90IG1vcmUgdGhhbiBvbmNlIGV2ZXJ5IDUgbWludXRlcy5cbiAqIHZhciB0aHJvdHRsZWQgPSBfLnRocm90dGxlKHJlbmV3VG9rZW4sIDMwMDAwMCwgeyAndHJhaWxpbmcnOiBmYWxzZSB9KTtcbiAqIGpRdWVyeShlbGVtZW50KS5vbignY2xpY2snLCB0aHJvdHRsZWQpO1xuICpcbiAqIC8vIENhbmNlbCB0aGUgdHJhaWxpbmcgdGhyb3R0bGVkIGludm9jYXRpb24uXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCB0aHJvdHRsZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gdGhyb3R0bGUoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGVhZGluZyA9IHRydWUsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICdsZWFkaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLmxlYWRpbmcgOiBsZWFkaW5nO1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cbiAgcmV0dXJuIGRlYm91bmNlKGZ1bmMsIHdhaXQsIHtcbiAgICAnbGVhZGluZyc6IGxlYWRpbmcsXG4gICAgJ21heFdhaXQnOiB3YWl0LFxuICAgICd0cmFpbGluZyc6IHRyYWlsaW5nXG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlO1xuIiwidmFyIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBJTkZJTklUWSA9IDEgLyAwLFxuICAgIE1BWF9JTlRFR0VSID0gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDg7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIGZpbml0ZSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjEyLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgY29udmVydGVkIG51bWJlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b0Zpbml0ZSgzLjIpO1xuICogLy8gPT4gMy4yXG4gKlxuICogXy50b0Zpbml0ZShOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IDVlLTMyNFxuICpcbiAqIF8udG9GaW5pdGUoSW5maW5pdHkpO1xuICogLy8gPT4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDhcbiAqXG4gKiBfLnRvRmluaXRlKCczLjInKTtcbiAqIC8vID0+IDMuMlxuICovXG5mdW5jdGlvbiB0b0Zpbml0ZSh2YWx1ZSkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAwID8gdmFsdWUgOiAwO1xuICB9XG4gIHZhbHVlID0gdG9OdW1iZXIodmFsdWUpO1xuICBpZiAodmFsdWUgPT09IElORklOSVRZIHx8IHZhbHVlID09PSAtSU5GSU5JVFkpIHtcbiAgICB2YXIgc2lnbiA9ICh2YWx1ZSA8IDAgPyAtMSA6IDEpO1xuICAgIHJldHVybiBzaWduICogTUFYX0lOVEVHRVI7XG4gIH1cbiAgcmV0dXJuIHZhbHVlID09PSB2YWx1ZSA/IHZhbHVlIDogMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b0Zpbml0ZTtcbiIsInZhciB0b0Zpbml0ZSA9IHJlcXVpcmUoJy4vdG9GaW5pdGUnKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGFuIGludGVnZXIuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGlzIGxvb3NlbHkgYmFzZWQgb25cbiAqIFtgVG9JbnRlZ2VyYF0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXRvaW50ZWdlcikuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgaW50ZWdlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b0ludGVnZXIoMy4yKTtcbiAqIC8vID0+IDNcbiAqXG4gKiBfLnRvSW50ZWdlcihOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IDBcbiAqXG4gKiBfLnRvSW50ZWdlcihJbmZpbml0eSk7XG4gKiAvLyA9PiAxLjc5NzY5MzEzNDg2MjMxNTdlKzMwOFxuICpcbiAqIF8udG9JbnRlZ2VyKCczLjInKTtcbiAqIC8vID0+IDNcbiAqL1xuZnVuY3Rpb24gdG9JbnRlZ2VyKHZhbHVlKSB7XG4gIHZhciByZXN1bHQgPSB0b0Zpbml0ZSh2YWx1ZSksXG4gICAgICByZW1haW5kZXIgPSByZXN1bHQgJSAxO1xuXG4gIHJldHVybiByZXN1bHQgPT09IHJlc3VsdCA/IChyZW1haW5kZXIgPyByZXN1bHQgLSByZW1haW5kZXIgOiByZXN1bHQpIDogMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b0ludGVnZXI7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0JyksXG4gICAgaXNTeW1ib2wgPSByZXF1aXJlKCcuL2lzU3ltYm9sJyk7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE5BTiA9IDAgLyAwO1xuXG4vKiogVXNlZCB0byBtYXRjaCBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLiAqL1xudmFyIHJlVHJpbSA9IC9eXFxzK3xcXHMrJC9nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmFkIHNpZ25lZCBoZXhhZGVjaW1hbCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNCYWRIZXggPSAvXlstK10weFswLTlhLWZdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJpbmFyeSBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNCaW5hcnkgPSAvXjBiWzAxXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBvY3RhbCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNPY3RhbCA9IC9eMG9bMC03XSskL2k7XG5cbi8qKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyB3aXRob3V0IGEgZGVwZW5kZW5jeSBvbiBgcm9vdGAuICovXG52YXIgZnJlZVBhcnNlSW50ID0gcGFyc2VJbnQ7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIG51bWJlci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIG51bWJlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b051bWJlcigzLjIpO1xuICogLy8gPT4gMy4yXG4gKlxuICogXy50b051bWJlcihOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IDVlLTMyNFxuICpcbiAqIF8udG9OdW1iZXIoSW5maW5pdHkpO1xuICogLy8gPT4gSW5maW5pdHlcbiAqXG4gKiBfLnRvTnVtYmVyKCczLjInKTtcbiAqIC8vID0+IDMuMlxuICovXG5mdW5jdGlvbiB0b051bWJlcih2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmIChpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gTkFOO1xuICB9XG4gIGlmIChpc09iamVjdCh2YWx1ZSkpIHtcbiAgICB2YXIgb3RoZXIgPSB0eXBlb2YgdmFsdWUudmFsdWVPZiA9PSAnZnVuY3Rpb24nID8gdmFsdWUudmFsdWVPZigpIDogdmFsdWU7XG4gICAgdmFsdWUgPSBpc09iamVjdChvdGhlcikgPyAob3RoZXIgKyAnJykgOiBvdGhlcjtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAwID8gdmFsdWUgOiArdmFsdWU7XG4gIH1cbiAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKHJlVHJpbSwgJycpO1xuICB2YXIgaXNCaW5hcnkgPSByZUlzQmluYXJ5LnRlc3QodmFsdWUpO1xuICByZXR1cm4gKGlzQmluYXJ5IHx8IHJlSXNPY3RhbC50ZXN0KHZhbHVlKSlcbiAgICA/IGZyZWVQYXJzZUludCh2YWx1ZS5zbGljZSgyKSwgaXNCaW5hcnkgPyAyIDogOClcbiAgICA6IChyZUlzQmFkSGV4LnRlc3QodmFsdWUpID8gTkFOIDogK3ZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b051bWJlcjtcbiIsInZhciBiYXNlVG9TdHJpbmcgPSByZXF1aXJlKCcuL19iYXNlVG9TdHJpbmcnKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgc3RyaW5nLiBBbiBlbXB0eSBzdHJpbmcgaXMgcmV0dXJuZWQgZm9yIGBudWxsYFxuICogYW5kIGB1bmRlZmluZWRgIHZhbHVlcy4gVGhlIHNpZ24gb2YgYC0wYCBpcyBwcmVzZXJ2ZWQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvU3RyaW5nKG51bGwpO1xuICogLy8gPT4gJydcbiAqXG4gKiBfLnRvU3RyaW5nKC0wKTtcbiAqIC8vID0+ICctMCdcbiAqXG4gKiBfLnRvU3RyaW5nKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiAnMSwyLDMnXG4gKi9cbmZ1bmN0aW9uIHRvU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiBiYXNlVG9TdHJpbmcodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvU3RyaW5nO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgaXNFbGVtZW50ICAgICAgICBmcm9tICdsb2Rhc2gvaXNFbGVtZW50JztcbmltcG9ydCBpc0Zpbml0ZSAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiAgICAgICBmcm9tICdsb2Rhc2gvaXNGdW5jdGlvbic7XG5pbXBvcnQgaXNOaWwgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNOaWwnO1xuaW1wb3J0IGlzT2JqZWN0ICAgICAgICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgX01hdGggICAgICAgICAgICBmcm9tICcuL21hdGgvbWF0aCc7XG5pbXBvcnQgTWF0cml4MiAgICAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgeyBUeXBlIH0gICAgICAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgVXRpbHMgICAgICAgICAgICBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBWZWN0b3IyICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuY29uc3QgYW5pbWF0aW9uID0ge1xuICAgIHR5cGU6IHtcbiAgICAgICAgQ09SRTogMVxuICAgIH1cbn07XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5BbmltYXRpb25cbiogQGNvbnN0cnVjdG9yXG4qIEBleHRlbmRzIGV4dGVybmFsOlRpbWVsaW5lTWF4XG4qIEBwYXJhbSB7Q2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRvIGJlIGFuaW1hdGVkLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmRlc3Ryb3lPbkNvbXBsZXRlXSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15QW5pbWF0aW9uID0gbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSwgeyBcbiogICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZVxuKiB9KS56b29tVG8oMiwgMSkuc2hha2UoMC4xLCAyKS5wbGF5KCk7XG4qL1xuY2xhc3MgQW5pbWF0aW9uIGV4dGVuZHMgVGltZWxpbmVNYXgge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF1c2VkOiB0cnVlXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgc3VwZXIoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucztcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB0eXBlIG9mIHRoaXMgb2JqZWN0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSBUeXBlLkFOSU1BVElPTjtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Q2FtZXJhfSAtIFRoZSBjYW1lcmEgb24gd2hpY2ggdGhlIGFuaW1hdGlvbiB3aWxsIGJlIGFwcGxpZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhIHx8IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2FycmF5fSAtIFRoZSBjb3JlIHR3ZWVucyBvZiB0aGlzIGFuaW1hdGlvbiBpbiBvcmRlciBvZiBleGVjdXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29yZVR3ZWVucyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUaW1lbGluZUxpdGV9IC0gVGhlIGN1cnJlbnQgYWN0aXZlIHN1Yi1hbmltYXRpb24gY29uc2lzdGluZyBvZiB0aGUgY29yZSBjYW1lcmEgYW5pbWF0aW9uIGFuZCBlZmZlY3QgYW5pbWF0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZXN0cm95T25Db21wbGV0ZSA9IG9wdGlvbnMuZGVzdHJveU9uQ29tcGxldGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY2FtZXJhIHZhbHVlcyBvZiB0aGUgcHJldmlvdXMgc3ViLWFuaW1hdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBzdGFydGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25TdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRDb3JlVHdlZW4odGhpcy5jb3JlVHdlZW5zWzBdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMuZHVyYXRpb24oKSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVEcmFnKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzTWFudWFsWm9vbWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVXaGVlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLm9uU3RhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uU3RhcnQuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25TdGFydFBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgb25jZSBkZXYgaXMgY29tcGxldGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbmltYXRpb24gc3RhcnRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyB1cGRhdGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25VcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25VcGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uVXBkYXRlLmFwcGx5KHRoaXMsIHRoaXMuY29uZmlnLm9uVXBkYXRlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jYW1lcmEucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kdXJhdGlvbigpID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZW5hYmxlRHJhZygpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnRyYWNrQ29udHJvbC5lbmFibGVXaGVlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLm9uQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uQ29tcGxldGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25Db21wbGV0ZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRlc3Ryb3lPbkNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgb25jZSBkZXYgaXMgY29tcGxldGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbmltYXRpb24gY29tcGxldGVkJyk7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50Q2FsbGJhY2soJ29uU3RhcnQnLCB0aGlzLl9vblN0YXJ0KTtcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvblVwZGF0ZScsIHRoaXMuX29uVXBkYXRlKTtcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvbkNvbXBsZXRlJywgdGhpcy5fb25Db21wbGV0ZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUaGUgcHJvcGVydGllcyB0byBhbmltYXRlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIF9hbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB2YXIgbWFpblRpbWVsaW5lID0gbmV3IFRpbWVsaW5lTGl0ZSh7XG4gICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgb25TdGFydFBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBzZWxmO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHNoYWtlVGltZWxpbmUgPSBudWxsO1xuICAgICAgICB2YXIgc2hha2UgPSB0aGlzLl9wYXJzZVNoYWtlKHByb3BzLnNoYWtlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIGNvcmUgY2FtZXJhIHByb3BlcnRpZXNcbiAgICAgICAgaWYgKHByb3BzLm9yaWdpbiB8fCBwcm9wcy5wb3NpdGlvbiB8fCBwcm9wcy5yb3RhdGlvbiB8fCBwcm9wcy56b29tKSB7XG4gICAgICAgICAgICB2YXIgY29yZVR3ZWVuID0gVHdlZW5NYXgudG8odGhpcy5jYW1lcmEsIGR1cmF0aW9uLCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgcmF3T2Zmc2V0WDogMCxcbiAgICAgICAgICAgICAgICByYXdPZmZzZXRZOiAwLFxuICAgICAgICAgICAgICAgIHJvdGF0aW9uOiAwLFxuICAgICAgICAgICAgICAgIHpvb206IDAsXG4gICAgICAgICAgICAgICAgaW1tZWRpYXRlUmVuZGVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLk5PTkU7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGltZWxpbmUuY29yZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbihzZWxmLnByb3BzLnRvLm9yaWdpbik7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5wcm9wcy50by56b29tID4gdGhpcy5jYW1lcmEuem9vbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uSU47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2VsZi5wcm9wcy50by56b29tIDwgdGhpcy5jYW1lcmEuem9vbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uT1VUO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS56b29tRGlyZWN0aW9uID0gekRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb3JlIHR3ZWVuIHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3R3ZWVuIHZhcnM6ICcsIHNlbGYudmFycyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0d2VlbiBwcm9wczogJywgc2VsZi5wcm9wcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zaXRpb24gaXMgbWFudWFsbHkgbWFpbnRhaW5lZCBzbyBhbmltYXRpb25zIGNhbiBzbW9vdGhseSBjb250aW51ZSB3aGVuIGNhbWVyYSBpcyByZXNpemVkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFJhd1Bvc2l0aW9uKHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbih0aGlzLmNhbWVyYS5yYXdPZmZzZXQsIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1hdGlvbikpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0Q29yZVR3ZWVuKHRoaXMuY29yZVR3ZWVuc1tzZWxmLmluZGV4ICsgMV0sIHNlbGYucHJvcHMuZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb3JlIHR3ZWVuIGNvbXBsZXRlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29yZVR3ZWVuLnR5cGUgPSBhbmltYXRpb24udHlwZS5DT1JFO1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzID0ge1xuICAgICAgICAgICAgICAgIHNvdXJjZToge30sXG4gICAgICAgICAgICAgICAgcGFyc2VkOiB7fSxcbiAgICAgICAgICAgICAgICB0bzoge30sXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgICAgIGVuZDoge31cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLm9yaWdpbiA9IHByb3BzLm9yaWdpbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2UucG9zaXRpb24gPSBwcm9wcy5wb3NpdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uucm90YXRpb24gPSBwcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSA9IHByb3BzLnpvb207XG4gICAgICAgICAgICBjb3JlVHdlZW4uaW5kZXggPSB0aGlzLmNvcmVUd2VlbnMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5jb3JlVHdlZW5zLnB1c2goY29yZVR3ZWVuKTtcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoY29yZVR3ZWVuLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gc2hha2UgZWZmZWN0XG4gICAgICAgIGlmIChkdXJhdGlvbiA+IDAgJiYgc2hha2UgJiYgc2hha2UuaW50ZW5zaXR5ID4gMCkge1xuICAgICAgICAgICAgc2hha2VUaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHNoYWtlLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogKHNoYWtlLmVuZm9yY2VCb3VuZHMgPT09IGZhbHNlKSA/IGZhbHNlIDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogdGhpcyxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGltZWxpbmUuc2hha2UgPSBzZWxmO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25VcGRhdGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0ZpbmFsRnJhbWUgPSBzZWxmLnRpbWUoKSA9PT0gc2VsZi5kdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0WCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXRZID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5jYW1lcmEucmF3UG9zaXRpb24uY2xvbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkhPUklaT05UQUwgfHwgc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmluYWxGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFggPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLndpZHRoICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi54ICs9IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5WRVJUSUNBTCB8fCBzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGaW5hbEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IE1hdGgucmFuZG9tKCkgKiBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0ICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueSArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRQb3NpdGlvbihwb3NpdGlvbiwgc2VsZi5kYXRhLmVuZm9yY2VCb3VuZHMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBFYXNlIGluL291dFxuICAgICAgICAgICAgaWYgKHNoYWtlLmVhc2VJbiAmJiBzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiAqIDAuNSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlSW4gfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG5cbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLnRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24gKiAwLjUsIHsgXG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZU91dCB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCBkdXJhdGlvbiAqIDAuNSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlIGluIG9yIGVhc2VcbiAgICAgICAgICAgIGVsc2UgaWYgKHNoYWtlLmVhc2VJbiAmJiAhc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZUluIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZSBvdXRcbiAgICAgICAgICAgIGVsc2UgaWYgKCFzaGFrZS5lYXNlSW4gJiYgc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHlcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZU91dCB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2VcbiAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuZWFzZSkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogb3B0aW9ucy5lYXNlIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm8gZWFzZVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5kYXRhLmludGVuc2l0eSA9IHNoYWtlLmludGVuc2l0eTtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLnRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHt9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbWFpblRpbWVsaW5lLmFkZChzaGFrZVRpbWVsaW5lLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5hZGQobWFpblRpbWVsaW5lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENhbGN1bGF0ZXMgdGhlIFwidG9cIiBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fFZlY3RvcjJ9IHNvdXJjZU9yaWdpbiAtIFRoZSBzb3VyY2Ugb3JpZ2luLlxuICAgICogQHBhcmFtIHtPYmplY3R8VmVjdG9yMn0gc291cmNlUG9zaXRpb24gLSBUaGUgc291cmNlIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHNvdXJjZVJvdGF0aW9uIC0gVGhlIHNvdXJjZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2Vab29tIC0gVGhlIHNvdXJjZSB6b29tLlxuICAgICogQHBhcmFtIHtPY3Vsby5DYW1lcmF9IGNhbWVyYSAtIFRoZSBjYW1lcmEuXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBlbmQgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9jYWxjdWxhdGVUb1Byb3BzIChwYXJzZWQsIHN0YXJ0KSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSB7XG4gICAgICAgICAgICBvcmlnaW46IChwYXJzZWQub3JpZ2luICE9PSBudWxsKSA/IHBhcnNlZC5vcmlnaW4gOiB7fSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAocGFyc2VkLnBvc2l0aW9uICE9PSBudWxsKSA/IHBhcnNlZC5wb3NpdGlvbiA6IHt9LFxuICAgICAgICAgICAgcm90YXRpb246IHBhcnNlZC5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206IHBhcnNlZC56b29tXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBpc0FuY2hvcmVkID0gZmFsc2U7XG4gICAgICAgIC8vIENoYW5naW5nIHRvIHNhbWUgb3JpZ2luIGlzIG5lY2Vzc2FyeSBmb3Igd2hlZWwgem9vbVxuICAgICAgICB2YXIgaXNPcmlnaW5YQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLm9yaWdpbi54KTtcbiAgICAgICAgdmFyIGlzT3JpZ2luWUNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5vcmlnaW4ueSk7XG4gICAgICAgIHZhciBpc09yaWdpbkNoYW5naW5nID0gaXNPcmlnaW5YQ2hhbmdpbmcgfHwgaXNPcmlnaW5ZQ2hhbmdpbmc7XG4gICAgICAgIC8vIENoYW5naW5nIHRvIHNhbWUgcG9zaXRpb24gaXMgbmVjZXNzYXJ5IGZvciBjYW1lcmEgcmVzaXplXG4gICAgICAgIHZhciBpc1Bvc2l0aW9uWENoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5wb3NpdGlvbi54KTtcbiAgICAgICAgdmFyIGlzUG9zaXRpb25ZQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgaXNQb3NpdGlvbkNoYW5naW5nID0gaXNQb3NpdGlvblhDaGFuZ2luZyB8fCBpc1Bvc2l0aW9uWUNoYW5naW5nO1xuICAgICAgICB2YXIgaXNPZmZzZXRDaGFuZ2luZyA9IGlzUG9zaXRpb25DaGFuZ2luZztcbiAgICAgICAgdmFyIGlzUm90YXRpb25DaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uucm90YXRpb24pICYmIHNvdXJjZS5yb3RhdGlvbiAhPT0gc3RhcnQucm90YXRpb247XG4gICAgICAgIHZhciBpc1pvb21DaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uuem9vbSkgJiYgc291cmNlLnpvb20gIT09IHN0YXJ0Lnpvb207XG5cbiAgICAgICAgdmFyIHN0YXJ0VHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHN0YXJ0Lnpvb20sIHN0YXJ0Lnpvb20pLnJvdGF0ZShfTWF0aC5kZWdUb1JhZCgtc3RhcnQucm90YXRpb24pKTtcbiAgICAgICAgdmFyIGZvdlBvc2l0aW9uID0gdGhpcy5jYW1lcmEuY2VudGVyO1xuICAgICAgICB2YXIgdG9PZmZzZXQ7XG4gICAgICAgIHZhciB0b09yaWdpbiA9IG5ldyBWZWN0b3IyKGlzT3JpZ2luWENoYW5naW5nID8gc291cmNlLm9yaWdpbi54IDogc3RhcnQub3JpZ2luLngsIGlzT3JpZ2luWUNoYW5naW5nID8gc291cmNlLm9yaWdpbi55IDogc3RhcnQub3JpZ2luLnkpO1xuICAgICAgICB2YXIgdG9Qb3NpdGlvbiA9IG5ldyBWZWN0b3IyKGlzUG9zaXRpb25YQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueCA6IHN0YXJ0LnBvc2l0aW9uLngsIGlzUG9zaXRpb25ZQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueSA6IHN0YXJ0LnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgdG9Sb3RhdGlvbiA9IGlzUm90YXRpb25DaGFuZ2luZyA/IHNvdXJjZS5yb3RhdGlvbiA6IHN0YXJ0LnJvdGF0aW9uO1xuICAgICAgICB2YXIgdG9ab29tID0gaXNab29tQ2hhbmdpbmcgPyBzb3VyY2Uuem9vbSA6IHN0YXJ0Lnpvb207XG4gICAgICAgIHZhciB0b1RyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZSh0b1pvb20sIHRvWm9vbSkucm90YXRlKF9NYXRoLmRlZ1RvUmFkKC10b1JvdGF0aW9uKSk7XG4gICAgICAgIFxuICAgICAgICAvLyByb3RhdGVUbywgem9vbVRvXG4gICAgICAgIGlmICghaXNPcmlnaW5DaGFuZ2luZyAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRvT3JpZ2luLmNvcHkoc3RhcnQucG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJvdGF0ZUF0LCB6b29tQXRcbiAgICAgICAgZWxzZSBpZiAoaXNPcmlnaW5DaGFuZ2luZyAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzUG9zaXRpb25DaGFuZ2luZyA9IHRydWU7XG4gICAgICAgICAgICBmb3ZQb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0U2NlbmVQb3NpdGlvblRvRk9WUG9zaXRpb24odG9PcmlnaW4sIHN0YXJ0LnBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHN0YXJ0VHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZvdiBwb3M6ICcsIGZvdlBvc2l0aW9uKTtcbiAgICAgICAgICAgIHRvUG9zaXRpb24gPSB0aGlzLmNhbWVyYS5fY29udmVydFNjZW5lUG9zaXRpb25Ub0NhbWVyYVBvc2l0aW9uKHRvT3JpZ2luLCBmb3ZQb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCB0b09yaWdpbiwgdG9UcmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRvT2Zmc2V0ID0gdGhpcy5jYW1lcmEuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRvUG9zaXRpb24sIHRoaXMuY2FtZXJhLmNlbnRlciwgdG9PcmlnaW4sIHRvVHJhbnNmb3JtYXRpb24pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9mZnNldFg6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC54IDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldFk6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIG9yaWdpbjogaXNBbmNob3JlZCB8fCBpc09yaWdpbkNoYW5naW5nID8gdG9PcmlnaW4gOiBudWxsLFxuICAgICAgICAgICAgcG9zaXRpb246IGlzUG9zaXRpb25DaGFuZ2luZyA/IHRvUG9zaXRpb24gOiBudWxsLFxuICAgICAgICAgICAgcm90YXRpb246IGlzUm90YXRpb25DaGFuZ2luZyA/IHRvUm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogaXNab29tQ2hhbmdpbmcgPyB0b1pvb20gOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgc3RhcnRpbmcgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBzdGFydGluZyBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2dldFN0YXJ0UHJvcHMgKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3JpZ2luOiB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4uY2xvbmUoKSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmNhbWVyYS5wb3NpdGlvbi5jbG9uZSgpLFxuICAgICAgICAgICAgcm90YXRpb246IHRoaXMuY2FtZXJhLnJvdGF0aW9uLFxuICAgICAgICAgICAgem9vbTogdGhpcy5jYW1lcmEuem9vbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGVuZGluZyBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIGVuZGluZyBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2dldEVuZFByb3BzICh0bywgc3RhcnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9yaWdpbjogKHRvLm9yaWdpbiAhPT0gbnVsbCkgPyB0by5vcmlnaW4gOiBzdGFydC5vcmlnaW4sXG4gICAgICAgICAgICBwb3NpdGlvbjogKHRvLnBvc2l0aW9uICE9PSBudWxsKSA/IHRvLnBvc2l0aW9uIDogc3RhcnQucG9zaXRpb24sXG4gICAgICAgICAgICByb3RhdGlvbjogKHRvLnJvdGF0aW9uICE9PSBudWxsKSA/IHRvLnJvdGF0aW9uIDogc3RhcnQucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiAodG8uem9vbSAhPT0gbnVsbCkgPyB0by56b29tIDogc3RhcnQuem9vbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEluaXRpYWxpemVzIGEgY29yZSB0d2Vlbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtUd2Vlbk1heH0gdHdlZW4gLSBUaGUgdHdlZW4uXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgX2luaXRDb3JlVHdlZW4gKHR3ZWVuLCBzdGFydFByb3BzKSB7XG4gICAgICAgIGlmICh0d2VlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzdGFydFByb3BzID0gKHN0YXJ0UHJvcHMgIT09IHVuZGVmaW5lZCkgPyBzdGFydFByb3BzIDogdGhpcy5fZ2V0U3RhcnRQcm9wcygpO1xuXG4gICAgICAgICAgICB2YXIgcGFyc2VkUHJvcHMgPSB0aGlzLl9wYXJzZVByb3BzKHR3ZWVuLnByb3BzLnNvdXJjZS5vcmlnaW4sIHR3ZWVuLnByb3BzLnNvdXJjZS5wb3NpdGlvbiwgdHdlZW4ucHJvcHMuc291cmNlLnJvdGF0aW9uLCB0d2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSk7XG4gICAgICAgICAgICB2YXIgdG9Qcm9wcyA9IHRoaXMuX2NhbGN1bGF0ZVRvUHJvcHMocGFyc2VkUHJvcHMsIHN0YXJ0UHJvcHMpO1xuICAgICAgICAgICAgdmFyIGVuZFByb3BzID0gdGhpcy5fZ2V0RW5kUHJvcHModG9Qcm9wcywgc3RhcnRQcm9wcyk7XG5cbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IHN0YXJ0UHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5zdGFydCA9IHN0YXJ0UHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5lbmQgPSBlbmRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLnBhcnNlZCA9IHBhcnNlZFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMudG8gPSB0b1Byb3BzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJhd09mZnNldFggPSB0b1Byb3BzLm9mZnNldFg7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJhd09mZnNldFkgPSB0b1Byb3BzLm9mZnNldFk7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJvdGF0aW9uID0gdG9Qcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMuem9vbSA9IHRvUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBjb3JlIGFuaW1hdGlvbiBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3JpZ2luIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3NpdGlvbiAtIFRoZSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIFRoZSB6b29tLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgcGFyc2VkIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfcGFyc2VQcm9wcyAob3JpZ2luLCBwb3NpdGlvbiwgcm90YXRpb24sIHpvb20pIHtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAncHJldmlvdXMnICYmIHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucG9zaXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyb3RhdGlvbiA9PT0gJ3ByZXZpb3VzJyAmJiAhaXNOaWwodGhpcy5wcmV2aW91c1Byb3BzLnJvdGF0aW9uKSkge1xuICAgICAgICAgICAgcm90YXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh6b29tID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMuem9vbSkpIHtcbiAgICAgICAgICAgIHpvb20gPSB0aGlzLnByZXZpb3VzUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBvcmlnaW46IFV0aWxzLnBhcnNlUG9zaXRpb24ob3JpZ2luLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBVdGlscy5wYXJzZVBvc2l0aW9uKHBvc2l0aW9uLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiAhaXNOaWwocm90YXRpb24pID8gcm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogem9vbSB8fCBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gc2hha2UgLSBUaGUgc2hha2UgcHJvcGVydGllcy5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlU2hha2UgKHNoYWtlKSB7XG4gICAgICAgIHZhciBwYXJzZWRTaGFrZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAoc2hha2UpIHtcbiAgICAgICAgICAgIHBhcnNlZFNoYWtlID0ge1xuICAgICAgICAgICAgICAgIGludGVuc2l0eTogaXNOaWwoc2hha2UuaW50ZW5zaXR5KSA/IDAgOiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc05pbChzaGFrZS5kaXJlY3Rpb24pID8gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIIDogc2hha2UuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgIGVhc2VJbjogc2hha2UuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IHNoYWtlLmVhc2VPdXQsXG4gICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogc2hha2UuZW5mb3JjZUJvdW5kc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHBhcnNlZFNoYWtlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFN0b3BzIHRoZSBhbmltYXRpb24gYW5kIHJlbGVhc2VzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uZGVzdHJveSgpO1xuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHN1cGVyLmtpbGwoKTtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IG51bGw7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLnBvc2l0aW9uXSAtIFRoZSBsb2NhdGlvbiB0byBtb3ZlIHRvLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5wb3NpdGlvbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLm9yaWdpbl0gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLm9yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Byb3BzLnJvdGF0aW9uXSAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2VdIC0gQW4gb2JqZWN0IG9mIHNoYWtlIGVmZmVjdCBwcm9wZXJ0aWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5zaGFrZS5pbnRlbnNpdHldIC0gQSB7QGxpbmsgQ2FtZXJhI3NoYWtlSW50ZW5zaXR5fHNoYWtlIGludGVuc2l0eX0uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtwcm9wcy5zaGFrZS5kaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZU91dF0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnpvb21dIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246ICcjYm94MTAwJywgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7b3JpZ2luOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjoge3g6IDIwMCwgeTogNTB9LCB6b29tOiAyfSwgMSk7XG4gICAgKi9cbiAgICBhbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBwb3NpdGlvbjogcHJvcHMucG9zaXRpb24sXG4gICAgICAgICAgICBvcmlnaW46IHByb3BzLm9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiBwcm9wcy5yb3RhdGlvbixcbiAgICAgICAgICAgIHNoYWtlOiBwcm9wcy5zaGFrZSxcbiAgICAgICAgICAgIHpvb206IHByb3BzLnpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE1vdmUgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gcG9zaXRpb24gLSBUaGUgcG9zaXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24ubW92ZVRvKCcjYm94MTAwJywgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eDoyMDAsIHk6IDUwfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6IDIwMH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt5OiAyMDB9LCAxKTtcbiAgICAqL1xuICAgIG1vdmVUbyAocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gb3JpZ2luIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgcm90YXRpb24ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KCcjYm94MTAwJywgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyMCwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCh7eDogMjAwLCB5OiA1MH0sIDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZUF0IChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogb3JpZ2luLFxuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZVRvKDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZVRvIChyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICByb3RhdGlvbjogcm90YXRpb25cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNoYWtlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGludGVuc2l0eSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbn0gW2RpcmVjdGlvbj1PY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEhdIC0gQSBzaGFrZSBkaXJlY3Rpb24uIFxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9IG9wdGlvbnMgcGx1czpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlSW5dIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uc2hha2UoMC4xLCA0KTtcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCwgT2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5IT1JJWk9OVEFMLCB7IGVhc2VJbjogUG93ZXIyLmVhc2VJbiwgZWFzZU91dDogUG93ZXIyLmVhc2VPdXQgfSlcbiAgICAqL1xuICAgIHNoYWtlIChpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2hha2U6IHtcbiAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IGludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICBlYXNlSW46IG9wdGlvbnMuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IG9wdGlvbnMuZWFzZU91dCxcbiAgICAgICAgICAgICAgICBlbmZvcmNlQm91bmRzOiBvcHRpb25zLmVuZm9yY2VCb3VuZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHpvb20ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoJyNib3gxMDAnLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm94MTAwJyksIDIsIDEpO1xuICAgICogbXlBbmltYXRpb24uem9vbUF0KHt4OiAyMDAsIHk6IDUwfSwgMiwgMSk7XG4gICAgKi9cbiAgICB6b29tQXQgKG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHpvb206IHpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogWm9vbSBpbi9vdXQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tVG8oMiwgMSk7XG4gICAgKi9cbiAgICB6b29tVG8gKHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoeyBcbiAgICAgICAgICAgIHpvb206IHpvb20gXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuKiBTaGFrZSBkaXJlY3Rpb25zLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbkFuaW1hdGlvbi5zaGFrZSA9IHtcbiAgICBkaXJlY3Rpb246IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQm90aCB0aGUgeCBhbmQgeSBheGVzLlxuICAgICAgICAqL1xuICAgICAgICBCT1RIOiAwLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeCBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBIT1JJWk9OVEFMOiAxLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeSBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBWRVJUSUNBTDogMlxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQW5pbWF0aW9uOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgaXNFbGVtZW50ICAgICAgICBmcm9tICdsb2Rhc2gvaXNFbGVtZW50JztcbmltcG9ydCBpc0Zpbml0ZSAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiAgICAgICBmcm9tICdsb2Rhc2gvaXNGdW5jdGlvbic7XG5pbXBvcnQgaXNOaWwgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNOaWwnO1xuaW1wb3J0IGlzT2JqZWN0ICAgICAgICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgX01hdGggICAgICAgICAgICBmcm9tICcuL21hdGgvbWF0aCc7XG5pbXBvcnQgTWF0cml4MiAgICAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgeyBUeXBlIH0gICAgICAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgVXRpbHMgICAgICAgICAgICBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBWZWN0b3IyICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuY29uc3QgYW5pbWF0aW9uID0ge1xuICAgIHR5cGU6IHtcbiAgICAgICAgQ09SRTogMVxuICAgIH1cbn07XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5BbmltYXRpb25cbiogQGNvbnN0cnVjdG9yXG4qIEBleHRlbmRzIGV4dGVybmFsOlRpbWVsaW5lTWF4XG4qIEBwYXJhbSB7Q2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRvIGJlIGFuaW1hdGVkLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmRlc3Ryb3lPbkNvbXBsZXRlXSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15QW5pbWF0aW9uID0gbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSwgeyBcbiogICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZVxuKiB9KS56b29tVG8oMiwgMSkuc2hha2UoMC4xLCAyKS5wbGF5KCk7XG4qL1xuY2xhc3MgQW5pbWF0aW9uIGV4dGVuZHMgVGltZWxpbmVNYXgge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF1c2VkOiB0cnVlXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgc3VwZXIoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucztcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB0eXBlIG9mIHRoaXMgb2JqZWN0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSBUeXBlLkFOSU1BVElPTjtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Q2FtZXJhfSAtIFRoZSBjYW1lcmEgb24gd2hpY2ggdGhlIGFuaW1hdGlvbiB3aWxsIGJlIGFwcGxpZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhIHx8IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2FycmF5fSAtIFRoZSBjb3JlIHR3ZWVucyBvZiB0aGlzIGFuaW1hdGlvbiBpbiBvcmRlciBvZiBleGVjdXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29yZVR3ZWVucyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUaW1lbGluZUxpdGV9IC0gVGhlIGN1cnJlbnQgYWN0aXZlIHN1Yi1hbmltYXRpb24gY29uc2lzdGluZyBvZiB0aGUgY29yZSBjYW1lcmEgYW5pbWF0aW9uIGFuZCBlZmZlY3QgYW5pbWF0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZXN0cm95T25Db21wbGV0ZSA9IG9wdGlvbnMuZGVzdHJveU9uQ29tcGxldGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY2FtZXJhIHZhbHVlcyBvZiB0aGUgcHJldmlvdXMgc3ViLWFuaW1hdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBzdGFydGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25TdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRDb3JlVHdlZW4odGhpcy5jb3JlVHdlZW5zWzBdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMuZHVyYXRpb24oKSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVEcmFnKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzTWFudWFsWm9vbWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVXaGVlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLm9uU3RhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uU3RhcnQuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25TdGFydFBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgb25jZSBkZXYgaXMgY29tcGxldGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbmltYXRpb24gc3RhcnRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyB1cGRhdGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25VcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25VcGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uVXBkYXRlLmFwcGx5KHRoaXMsIHRoaXMuY29uZmlnLm9uVXBkYXRlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jYW1lcmEucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kdXJhdGlvbigpID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZW5hYmxlRHJhZygpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnRyYWNrQ29udHJvbC5lbmFibGVXaGVlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLm9uQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uQ29tcGxldGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25Db21wbGV0ZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRlc3Ryb3lPbkNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgb25jZSBkZXYgaXMgY29tcGxldGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbmltYXRpb24gY29tcGxldGVkJyk7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50Q2FsbGJhY2soJ29uU3RhcnQnLCB0aGlzLl9vblN0YXJ0KTtcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvblVwZGF0ZScsIHRoaXMuX29uVXBkYXRlKTtcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvbkNvbXBsZXRlJywgdGhpcy5fb25Db21wbGV0ZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUaGUgcHJvcGVydGllcyB0byBhbmltYXRlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIF9hbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB2YXIgbWFpblRpbWVsaW5lID0gbmV3IFRpbWVsaW5lTGl0ZSh7XG4gICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgb25TdGFydFBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBzZWxmO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHNoYWtlVGltZWxpbmUgPSBudWxsO1xuICAgICAgICB2YXIgc2hha2UgPSB0aGlzLl9wYXJzZVNoYWtlKHByb3BzLnNoYWtlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIGNvcmUgY2FtZXJhIHByb3BlcnRpZXNcbiAgICAgICAgaWYgKHByb3BzLm9yaWdpbiB8fCBwcm9wcy5wb3NpdGlvbiB8fCBwcm9wcy5yb3RhdGlvbiB8fCBwcm9wcy56b29tKSB7XG4gICAgICAgICAgICB2YXIgY29yZVR3ZWVuID0gVHdlZW5NYXgudG8odGhpcy5jYW1lcmEsIGR1cmF0aW9uLCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgcmF3T2Zmc2V0WDogMCxcbiAgICAgICAgICAgICAgICByYXdPZmZzZXRZOiAwLFxuICAgICAgICAgICAgICAgIHJvdGF0aW9uOiAwLFxuICAgICAgICAgICAgICAgIHpvb206IDAsXG4gICAgICAgICAgICAgICAgaW1tZWRpYXRlUmVuZGVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLk5PTkU7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGltZWxpbmUuY29yZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbihzZWxmLnByb3BzLnRvLm9yaWdpbik7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5wcm9wcy50by56b29tID4gdGhpcy5jYW1lcmEuem9vbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uSU47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2VsZi5wcm9wcy50by56b29tIDwgdGhpcy5jYW1lcmEuem9vbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uT1VUO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS56b29tRGlyZWN0aW9uID0gekRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb3JlIHR3ZWVuIHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3R3ZWVuIHZhcnM6ICcsIHNlbGYudmFycyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0d2VlbiBwcm9wczogJywgc2VsZi5wcm9wcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zaXRpb24gaXMgbWFudWFsbHkgbWFpbnRhaW5lZCBzbyBhbmltYXRpb25zIGNhbiBzbW9vdGhseSBjb250aW51ZSB3aGVuIGNhbWVyYSBpcyByZXNpemVkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFJhd1Bvc2l0aW9uKHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbih0aGlzLmNhbWVyYS5yYXdPZmZzZXQsIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1hdGlvbikpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0Q29yZVR3ZWVuKHRoaXMuY29yZVR3ZWVuc1tzZWxmLmluZGV4ICsgMV0sIHNlbGYucHJvcHMuZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb3JlIHR3ZWVuIGNvbXBsZXRlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29yZVR3ZWVuLnR5cGUgPSBhbmltYXRpb24udHlwZS5DT1JFO1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzID0ge1xuICAgICAgICAgICAgICAgIHNvdXJjZToge30sXG4gICAgICAgICAgICAgICAgcGFyc2VkOiB7fSxcbiAgICAgICAgICAgICAgICB0bzoge30sXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgICAgIGVuZDoge31cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLm9yaWdpbiA9IHByb3BzLm9yaWdpbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2UucG9zaXRpb24gPSBwcm9wcy5wb3NpdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uucm90YXRpb24gPSBwcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSA9IHByb3BzLnpvb207XG4gICAgICAgICAgICBjb3JlVHdlZW4uaW5kZXggPSB0aGlzLmNvcmVUd2VlbnMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5jb3JlVHdlZW5zLnB1c2goY29yZVR3ZWVuKTtcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoY29yZVR3ZWVuLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gc2hha2UgZWZmZWN0XG4gICAgICAgIGlmIChkdXJhdGlvbiA+IDAgJiYgc2hha2UgJiYgc2hha2UuaW50ZW5zaXR5ID4gMCkge1xuICAgICAgICAgICAgc2hha2VUaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHNoYWtlLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogKHNoYWtlLmVuZm9yY2VCb3VuZHMgPT09IGZhbHNlKSA/IGZhbHNlIDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogdGhpcyxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGltZWxpbmUuc2hha2UgPSBzZWxmO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25VcGRhdGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0ZpbmFsRnJhbWUgPSBzZWxmLnRpbWUoKSA9PT0gc2VsZi5kdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0WCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXRZID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5jYW1lcmEucmF3UG9zaXRpb24uY2xvbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkhPUklaT05UQUwgfHwgc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmluYWxGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFggPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLndpZHRoICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi54ICs9IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5WRVJUSUNBTCB8fCBzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGaW5hbEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IE1hdGgucmFuZG9tKCkgKiBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0ICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueSArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRQb3NpdGlvbihwb3NpdGlvbiwgc2VsZi5kYXRhLmVuZm9yY2VCb3VuZHMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBFYXNlIGluL291dFxuICAgICAgICAgICAgaWYgKHNoYWtlLmVhc2VJbiAmJiBzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiAqIDAuNSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlSW4gfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG5cbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLnRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24gKiAwLjUsIHsgXG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZU91dCB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCBkdXJhdGlvbiAqIDAuNSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlIGluIG9yIGVhc2VcbiAgICAgICAgICAgIGVsc2UgaWYgKHNoYWtlLmVhc2VJbiAmJiAhc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZUluIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZSBvdXRcbiAgICAgICAgICAgIGVsc2UgaWYgKCFzaGFrZS5lYXNlSW4gJiYgc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHlcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZU91dCB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2VcbiAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuZWFzZSkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogb3B0aW9ucy5lYXNlIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm8gZWFzZVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5kYXRhLmludGVuc2l0eSA9IHNoYWtlLmludGVuc2l0eTtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLnRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHt9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbWFpblRpbWVsaW5lLmFkZChzaGFrZVRpbWVsaW5lLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5hZGQobWFpblRpbWVsaW5lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENhbGN1bGF0ZXMgdGhlIFwidG9cIiBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fFZlY3RvcjJ9IHNvdXJjZU9yaWdpbiAtIFRoZSBzb3VyY2Ugb3JpZ2luLlxuICAgICogQHBhcmFtIHtPYmplY3R8VmVjdG9yMn0gc291cmNlUG9zaXRpb24gLSBUaGUgc291cmNlIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHNvdXJjZVJvdGF0aW9uIC0gVGhlIHNvdXJjZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2Vab29tIC0gVGhlIHNvdXJjZSB6b29tLlxuICAgICogQHBhcmFtIHtPY3Vsby5DYW1lcmF9IGNhbWVyYSAtIFRoZSBjYW1lcmEuXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBlbmQgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9jYWxjdWxhdGVUb1Byb3BzIChwYXJzZWQsIHN0YXJ0KSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSB7XG4gICAgICAgICAgICBvcmlnaW46IChwYXJzZWQub3JpZ2luICE9PSBudWxsKSA/IHBhcnNlZC5vcmlnaW4gOiB7fSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAocGFyc2VkLnBvc2l0aW9uICE9PSBudWxsKSA/IHBhcnNlZC5wb3NpdGlvbiA6IHt9LFxuICAgICAgICAgICAgcm90YXRpb246IHBhcnNlZC5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206IHBhcnNlZC56b29tXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBpc0FuY2hvcmVkID0gZmFsc2U7XG4gICAgICAgIC8vIENoYW5naW5nIHRvIHNhbWUgb3JpZ2luIGlzIG5lY2Vzc2FyeSBmb3Igd2hlZWwgem9vbVxuICAgICAgICB2YXIgaXNPcmlnaW5YQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLm9yaWdpbi54KTtcbiAgICAgICAgdmFyIGlzT3JpZ2luWUNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5vcmlnaW4ueSk7XG4gICAgICAgIHZhciBpc09yaWdpbkNoYW5naW5nID0gaXNPcmlnaW5YQ2hhbmdpbmcgfHwgaXNPcmlnaW5ZQ2hhbmdpbmc7XG4gICAgICAgIC8vIENoYW5naW5nIHRvIHNhbWUgcG9zaXRpb24gaXMgbmVjZXNzYXJ5IGZvciBjYW1lcmEgcmVzaXplXG4gICAgICAgIHZhciBpc1Bvc2l0aW9uWENoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5wb3NpdGlvbi54KTtcbiAgICAgICAgdmFyIGlzUG9zaXRpb25ZQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgaXNQb3NpdGlvbkNoYW5naW5nID0gaXNQb3NpdGlvblhDaGFuZ2luZyB8fCBpc1Bvc2l0aW9uWUNoYW5naW5nO1xuICAgICAgICB2YXIgaXNPZmZzZXRDaGFuZ2luZyA9IGlzUG9zaXRpb25DaGFuZ2luZztcbiAgICAgICAgdmFyIGlzUm90YXRpb25DaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uucm90YXRpb24pICYmIHNvdXJjZS5yb3RhdGlvbiAhPT0gc3RhcnQucm90YXRpb247XG4gICAgICAgIHZhciBpc1pvb21DaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uuem9vbSkgJiYgc291cmNlLnpvb20gIT09IHN0YXJ0Lnpvb207XG5cbiAgICAgICAgdmFyIHN0YXJ0VHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHN0YXJ0Lnpvb20sIHN0YXJ0Lnpvb20pLnJvdGF0ZShfTWF0aC5kZWdUb1JhZCgtc3RhcnQucm90YXRpb24pKTtcbiAgICAgICAgdmFyIGZvdlBvc2l0aW9uID0gdGhpcy5jYW1lcmEuY2VudGVyO1xuICAgICAgICB2YXIgdG9PZmZzZXQ7XG4gICAgICAgIHZhciB0b09yaWdpbiA9IG5ldyBWZWN0b3IyKGlzT3JpZ2luWENoYW5naW5nID8gc291cmNlLm9yaWdpbi54IDogc3RhcnQub3JpZ2luLngsIGlzT3JpZ2luWUNoYW5naW5nID8gc291cmNlLm9yaWdpbi55IDogc3RhcnQub3JpZ2luLnkpO1xuICAgICAgICB2YXIgdG9Qb3NpdGlvbiA9IG5ldyBWZWN0b3IyKGlzUG9zaXRpb25YQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueCA6IHN0YXJ0LnBvc2l0aW9uLngsIGlzUG9zaXRpb25ZQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueSA6IHN0YXJ0LnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgdG9Sb3RhdGlvbiA9IGlzUm90YXRpb25DaGFuZ2luZyA/IHNvdXJjZS5yb3RhdGlvbiA6IHN0YXJ0LnJvdGF0aW9uO1xuICAgICAgICB2YXIgdG9ab29tID0gaXNab29tQ2hhbmdpbmcgPyBzb3VyY2Uuem9vbSA6IHN0YXJ0Lnpvb207XG4gICAgICAgIHZhciB0b1RyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZSh0b1pvb20sIHRvWm9vbSkucm90YXRlKF9NYXRoLmRlZ1RvUmFkKC10b1JvdGF0aW9uKSk7XG4gICAgICAgIFxuICAgICAgICAvLyByb3RhdGVUbywgem9vbVRvXG4gICAgICAgIGlmICghaXNPcmlnaW5DaGFuZ2luZyAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRvT3JpZ2luLmNvcHkoc3RhcnQucG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJvdGF0ZUF0LCB6b29tQXRcbiAgICAgICAgZWxzZSBpZiAoaXNPcmlnaW5DaGFuZ2luZyAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzUG9zaXRpb25DaGFuZ2luZyA9IHRydWU7XG4gICAgICAgICAgICBmb3ZQb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0U2NlbmVQb3NpdGlvblRvRk9WUG9zaXRpb24odG9PcmlnaW4sIHN0YXJ0LnBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHN0YXJ0VHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZvdiBwb3M6ICcsIGZvdlBvc2l0aW9uKTtcbiAgICAgICAgICAgIHRvUG9zaXRpb24gPSB0aGlzLmNhbWVyYS5fY29udmVydFNjZW5lUG9zaXRpb25Ub0NhbWVyYVBvc2l0aW9uKHRvT3JpZ2luLCBmb3ZQb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCB0b09yaWdpbiwgdG9UcmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRvT2Zmc2V0ID0gdGhpcy5jYW1lcmEuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRvUG9zaXRpb24sIHRoaXMuY2FtZXJhLmNlbnRlciwgdG9PcmlnaW4sIHRvVHJhbnNmb3JtYXRpb24pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9mZnNldFg6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC54IDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldFk6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIG9yaWdpbjogaXNBbmNob3JlZCB8fCBpc09yaWdpbkNoYW5naW5nID8gdG9PcmlnaW4gOiBudWxsLFxuICAgICAgICAgICAgcG9zaXRpb246IGlzUG9zaXRpb25DaGFuZ2luZyA/IHRvUG9zaXRpb24gOiBudWxsLFxuICAgICAgICAgICAgcm90YXRpb246IGlzUm90YXRpb25DaGFuZ2luZyA/IHRvUm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogaXNab29tQ2hhbmdpbmcgPyB0b1pvb20gOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgc3RhcnRpbmcgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBzdGFydGluZyBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2dldFN0YXJ0UHJvcHMgKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3JpZ2luOiB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4uY2xvbmUoKSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmNhbWVyYS5wb3NpdGlvbi5jbG9uZSgpLFxuICAgICAgICAgICAgcm90YXRpb246IHRoaXMuY2FtZXJhLnJvdGF0aW9uLFxuICAgICAgICAgICAgem9vbTogdGhpcy5jYW1lcmEuem9vbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGVuZGluZyBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIGVuZGluZyBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2dldEVuZFByb3BzICh0bywgc3RhcnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9yaWdpbjogKHRvLm9yaWdpbiAhPT0gbnVsbCkgPyB0by5vcmlnaW4gOiBzdGFydC5vcmlnaW4sXG4gICAgICAgICAgICBwb3NpdGlvbjogKHRvLnBvc2l0aW9uICE9PSBudWxsKSA/IHRvLnBvc2l0aW9uIDogc3RhcnQucG9zaXRpb24sXG4gICAgICAgICAgICByb3RhdGlvbjogKHRvLnJvdGF0aW9uICE9PSBudWxsKSA/IHRvLnJvdGF0aW9uIDogc3RhcnQucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiAodG8uem9vbSAhPT0gbnVsbCkgPyB0by56b29tIDogc3RhcnQuem9vbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEluaXRpYWxpemVzIGEgY29yZSB0d2Vlbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtUd2Vlbk1heH0gdHdlZW4gLSBUaGUgdHdlZW4uXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgX2luaXRDb3JlVHdlZW4gKHR3ZWVuLCBzdGFydFByb3BzKSB7XG4gICAgICAgIGlmICh0d2VlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzdGFydFByb3BzID0gKHN0YXJ0UHJvcHMgIT09IHVuZGVmaW5lZCkgPyBzdGFydFByb3BzIDogdGhpcy5fZ2V0U3RhcnRQcm9wcygpO1xuXG4gICAgICAgICAgICB2YXIgcGFyc2VkUHJvcHMgPSB0aGlzLl9wYXJzZVByb3BzKHR3ZWVuLnByb3BzLnNvdXJjZS5vcmlnaW4sIHR3ZWVuLnByb3BzLnNvdXJjZS5wb3NpdGlvbiwgdHdlZW4ucHJvcHMuc291cmNlLnJvdGF0aW9uLCB0d2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSk7XG4gICAgICAgICAgICB2YXIgdG9Qcm9wcyA9IHRoaXMuX2NhbGN1bGF0ZVRvUHJvcHMocGFyc2VkUHJvcHMsIHN0YXJ0UHJvcHMpO1xuICAgICAgICAgICAgdmFyIGVuZFByb3BzID0gdGhpcy5fZ2V0RW5kUHJvcHModG9Qcm9wcywgc3RhcnRQcm9wcyk7XG5cbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IHN0YXJ0UHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5zdGFydCA9IHN0YXJ0UHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5lbmQgPSBlbmRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLnBhcnNlZCA9IHBhcnNlZFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMudG8gPSB0b1Byb3BzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJhd09mZnNldFggPSB0b1Byb3BzLm9mZnNldFg7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJhd09mZnNldFkgPSB0b1Byb3BzLm9mZnNldFk7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJvdGF0aW9uID0gdG9Qcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMuem9vbSA9IHRvUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBjb3JlIGFuaW1hdGlvbiBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3JpZ2luIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3NpdGlvbiAtIFRoZSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIFRoZSB6b29tLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgcGFyc2VkIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfcGFyc2VQcm9wcyAob3JpZ2luLCBwb3NpdGlvbiwgcm90YXRpb24sIHpvb20pIHtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAncHJldmlvdXMnICYmIHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucG9zaXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyb3RhdGlvbiA9PT0gJ3ByZXZpb3VzJyAmJiAhaXNOaWwodGhpcy5wcmV2aW91c1Byb3BzLnJvdGF0aW9uKSkge1xuICAgICAgICAgICAgcm90YXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh6b29tID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMuem9vbSkpIHtcbiAgICAgICAgICAgIHpvb20gPSB0aGlzLnByZXZpb3VzUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBvcmlnaW46IFV0aWxzLnBhcnNlUG9zaXRpb24ob3JpZ2luLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBVdGlscy5wYXJzZVBvc2l0aW9uKHBvc2l0aW9uLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiAhaXNOaWwocm90YXRpb24pID8gcm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogem9vbSB8fCBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gc2hha2UgLSBUaGUgc2hha2UgcHJvcGVydGllcy5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlU2hha2UgKHNoYWtlKSB7XG4gICAgICAgIHZhciBwYXJzZWRTaGFrZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAoc2hha2UpIHtcbiAgICAgICAgICAgIHBhcnNlZFNoYWtlID0ge1xuICAgICAgICAgICAgICAgIGludGVuc2l0eTogaXNOaWwoc2hha2UuaW50ZW5zaXR5KSA/IDAgOiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc05pbChzaGFrZS5kaXJlY3Rpb24pID8gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIIDogc2hha2UuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgIGVhc2VJbjogc2hha2UuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IHNoYWtlLmVhc2VPdXQsXG4gICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogc2hha2UuZW5mb3JjZUJvdW5kc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHBhcnNlZFNoYWtlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFN0b3BzIHRoZSBhbmltYXRpb24gYW5kIHJlbGVhc2VzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uZGVzdHJveSgpO1xuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHN1cGVyLmtpbGwoKTtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IG51bGw7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLnBvc2l0aW9uXSAtIFRoZSBsb2NhdGlvbiB0byBtb3ZlIHRvLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5wb3NpdGlvbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLm9yaWdpbl0gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLm9yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Byb3BzLnJvdGF0aW9uXSAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2VdIC0gQW4gb2JqZWN0IG9mIHNoYWtlIGVmZmVjdCBwcm9wZXJ0aWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5zaGFrZS5pbnRlbnNpdHldIC0gQSB7QGxpbmsgQ2FtZXJhI3NoYWtlSW50ZW5zaXR5fHNoYWtlIGludGVuc2l0eX0uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtwcm9wcy5zaGFrZS5kaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZU91dF0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnpvb21dIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246ICcjYm94MTAwJywgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7b3JpZ2luOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjoge3g6IDIwMCwgeTogNTB9LCB6b29tOiAyfSwgMSk7XG4gICAgKi9cbiAgICBhbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBwb3NpdGlvbjogcHJvcHMucG9zaXRpb24sXG4gICAgICAgICAgICBvcmlnaW46IHByb3BzLm9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiBwcm9wcy5yb3RhdGlvbixcbiAgICAgICAgICAgIHNoYWtlOiBwcm9wcy5zaGFrZSxcbiAgICAgICAgICAgIHpvb206IHByb3BzLnpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE1vdmUgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gcG9zaXRpb24gLSBUaGUgcG9zaXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24ubW92ZVRvKCcjYm94MTAwJywgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eDoyMDAsIHk6IDUwfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6IDIwMH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt5OiAyMDB9LCAxKTtcbiAgICAqL1xuICAgIG1vdmVUbyAocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gb3JpZ2luIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgcm90YXRpb24ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KCcjYm94MTAwJywgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyMCwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCh7eDogMjAwLCB5OiA1MH0sIDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZUF0IChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogb3JpZ2luLFxuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZVRvKDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZVRvIChyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICByb3RhdGlvbjogcm90YXRpb25cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNoYWtlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGludGVuc2l0eSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbn0gW2RpcmVjdGlvbj1PY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEhdIC0gQSBzaGFrZSBkaXJlY3Rpb24uIFxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9IG9wdGlvbnMgcGx1czpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlSW5dIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uc2hha2UoMC4xLCA0KTtcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCwgT2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5IT1JJWk9OVEFMLCB7IGVhc2VJbjogUG93ZXIyLmVhc2VJbiwgZWFzZU91dDogUG93ZXIyLmVhc2VPdXQgfSlcbiAgICAqL1xuICAgIHNoYWtlIChpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2hha2U6IHtcbiAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IGludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICBlYXNlSW46IG9wdGlvbnMuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IG9wdGlvbnMuZWFzZU91dCxcbiAgICAgICAgICAgICAgICBlbmZvcmNlQm91bmRzOiBvcHRpb25zLmVuZm9yY2VCb3VuZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHpvb20ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoJyNib3gxMDAnLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm94MTAwJyksIDIsIDEpO1xuICAgICogbXlBbmltYXRpb24uem9vbUF0KHt4OiAyMDAsIHk6IDUwfSwgMiwgMSk7XG4gICAgKi9cbiAgICB6b29tQXQgKG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHpvb206IHpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogWm9vbSBpbi9vdXQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tVG8oMiwgMSk7XG4gICAgKi9cbiAgICB6b29tVG8gKHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoeyBcbiAgICAgICAgICAgIHpvb206IHpvb20gXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuKiBTaGFrZSBkaXJlY3Rpb25zLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbkFuaW1hdGlvbi5zaGFrZSA9IHtcbiAgICBkaXJlY3Rpb246IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQm90aCB0aGUgeCBhbmQgeSBheGVzLlxuICAgICAgICAqL1xuICAgICAgICBCT1RIOiAwLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeCBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBIT1JJWk9OVEFMOiAxLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeSBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBWRVJUSUNBTDogMlxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQW5pbWF0aW9uOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgQW5pbWF0aW9uIGZyb20gJy4vQW5pbWF0aW9uJztcbmltcG9ydCB7IFR5cGUgfSAgZnJvbSAnLi9jb25zdGFudHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQW5pbWF0aW9uTWFuYWdlclxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtPYmplY3R9IGNhbWVyYSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgQW5pbWF0aW9uTWFuYWdlci5cbiovXG5jbGFzcyBBbmltYXRpb25NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgQW5pbWF0aW9uTWFuYWdlci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkFuaW1hdGlvbn0gLSBUaGUgYWN0aXZlIGFuaW1hdGlvbi5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIEFuIG9iamVjdCBmb3Igc3RvcmluZyB0aGUgQW5pbWF0aW9uIGluc3RhbmNlcy5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQW5pbWF0aW9uTWFuYWdlciNpc0FuaW1hdGluZ1xuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIGlzIHJ1bm5pbmcgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNBbmltYXRpbmcgKCkge1xuICAgICAgICB2YXIgcHJvZ3Jlc3MgPSB0aGlzLmN1cnJlbnRBbmltYXRpb24gPyB0aGlzLmN1cnJlbnRBbmltYXRpb24ucHJvZ3Jlc3MoKSA6IDA7XG4gICAgICAgIHJldHVybiBwcm9ncmVzcyA+IDAgJiYgcHJvZ3Jlc3MgPCAxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIEFuaW1hdGlvbk1hbmFnZXIjaXNQYXVzZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBpcyBwYXVzZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNQYXVzZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50QW5pbWF0aW9uID8gdGhpcy5jdXJyZW50QW5pbWF0aW9uLnBhdXNlZCgpIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSB0byBnaXZlIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcGFyYW0ge29iamVjdHxPY3Vsby5BbmltYXRpb259IGFuaW1hdGlvbiAtIFRoZSBhbmltYXRpb24uIEl0IGNhbiBiZSBhbiBhY3R1YWwgYW5pbWF0aW9uIGluc3RhbmNlIG9yIGFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGFuaW1hdGlvbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYW4gYW5pbWF0aW9uIGluc3RhbmNlPC9jYXB0aW9uPlxuICAgICogbXlBbmltYXRpb25NYW5hZ2VyLmFkZCgnem9vbUluT3V0JywgbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSkuYW5pbWF0ZSh7em9vbTogMn0sIDIsIHtlYXNlOiBQb3dlcjIuZWFzZUlufSkuYW5pbWF0ZSh7em9vbTogMX0sIDIsIHtlYXNlOiBQb3dlcjIuZWFzZU91dH0pKTtcbiAgICAqIFxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYW4gb2JqZWN0IHJlcHJlc2VudGluZyBhbiBhbmltYXRpb248L2NhcHRpb24+XG4gICAgKiBteUFuaW1hdGlvbk1hbmFnZXIuYWRkKCd6b29tSW5BbmRPdXQnLCB7IFxuICAgICogICBrZXlmcmFtZXM6IFt7IFxuICAgICogICAgIHpvb206IDIsIFxuICAgICogICAgIGR1cmF0aW9uOiAyLCBcbiAgICAqICAgICBvcHRpb25zOiB7IFxuICAgICogICAgICAgZWFzZTogUG93ZXIyLmVhc2VJbiBcbiAgICAqICAgICB9XG4gICAgKiAgIH0sIHtcbiAgICAqICAgICB6b29tOiAxLFxuICAgICogICAgIGR1cmF0aW9uOiAyLFxuICAgICogICAgIG9wdGlvbnM6IHtcbiAgICAqICAgICAgIGVhc2U6IFBvd2VyMi5lYXNlT3V0XG4gICAgKiAgICAgfVxuICAgICogICB9XVxuICAgICogfSk7XG4gICAgKi8gICAgICAgIFxuICAgIGFkZCAobmFtZSwgYW5pbWF0aW9uKSB7XG4gICAgICAgIGxldCBuZXdBbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5fYW5pbWF0aW9uc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1tuYW1lXS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChhbmltYXRpb24udHlwZSA9PT0gVHlwZS5BTklNQVRJT04pIHtcbiAgICAgICAgICAgIG5ld0FuaW1hdGlvbiA9IGFuaW1hdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5ld0FuaW1hdGlvbiA9IG5ldyBBbmltYXRpb24odGhpcy5jYW1lcmEpO1xuICAgICAgICAgICAgYW5pbWF0aW9uLmtleWZyYW1lcy5mb3JFYWNoKChrZXlmcmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0FuaW1hdGlvbi5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiBrZXlmcmFtZS5vcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBrZXlmcmFtZS5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGtleWZyYW1lLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzaGFrZToga2V5ZnJhbWUuc2hha2UsXG4gICAgICAgICAgICAgICAgICAgIHpvb206IGtleWZyYW1lLnpvb21cbiAgICAgICAgICAgICAgICB9LCBrZXlmcmFtZS5kdXJhdGlvbiwga2V5ZnJhbWUub3B0aW9ucyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9hbmltYXRpb25zW25hbWVdID0gbmV3QW5pbWF0aW9uO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIEFuaW1hdGlvbk1hbmFnZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fYW5pbWF0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1trZXldLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGFuIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcmV0dXJucyB7T2N1bG8uQW5pbWF0aW9ufSBUaGUgYW5pbWF0aW9uLlxuICAgICovXG4gICAgZ2V0IChuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhdXNlcyB0aGUgYWN0aXZlIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwYXVzZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5wYXVzZShudWxsLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFBsYXlzIHRoZSBjdXJyZW50IG9yIHByb3ZpZGVkIGFuaW1hdGlvbiBmb3J3YXJkIGZyb20gdGhlIGN1cnJlbnQgcGxheWhlYWQgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWVdIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0byBwbGF5LlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwbGF5IChuYW1lKSB7XG4gICAgICAgIHZhciBhbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb247XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24uaW52YWxpZGF0ZSgpLnJlc3RhcnQoZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgfSBcbiAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gdW5kZWZpbmVkICYmIHRoaXMuY3VycmVudEFuaW1hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uLnBsYXkobnVsbCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXN1bWVzIHBsYXlpbmcgdGhlIGFuaW1hdGlvbiBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlc3VtZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXZlcnNlcyBwbGF5YmFjayBvZiBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPW51bGxdIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbi4gSWYgbm9uZSBpcyBzcGVjaWZpZWQsIHRoZSBjdXJyZW50IGFuaW1hdGlvbiB3aWxsIGJlIHJldmVyc2VkLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJldmVyc2UgKG5hbWUgPSBudWxsKSB7XG4gICAgICAgIHZhciBhbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb247XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24uaW52YWxpZGF0ZSgpLnJldmVyc2UoMCwgZmFsc2UpO1xuICAgICAgICB9IFxuICAgICAgICBlbHNlIGlmIChuYW1lID09PSBudWxsICYmIHRoaXMuY3VycmVudEFuaW1hdGlvbikge1xuICAgICAgICAgICAgbGV0IHRpbWUgPSB0aGlzLmN1cnJlbnRBbmltYXRpb24udGltZSgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uLnJldmVyc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBBbmltYXRpb25NYW5hZ2VyOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG4vLyBUT0RPOlxuLy8gMSkgSW1wb3J0IEFuaW1hdGlvbiB0byBhdm9pZCB1c2luZyBPY3VsbyBuYW1lc3BhY2VcblxuaW1wb3J0IGNsYW1wICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2NsYW1wJztcbmltcG9ydCBpc0VsZW1lbnQgICAgICAgIGZyb20gJ2xvZGFzaC9pc0VsZW1lbnQnO1xuaW1wb3J0IGlzRmluaXRlICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRmluaXRlJztcbmltcG9ydCBpc0Z1bmN0aW9uICAgICAgIGZyb20gJ2xvZGFzaC9pc0Z1bmN0aW9uJztcbmltcG9ydCBpc05pbCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc05pbCc7XG5pbXBvcnQgaXNPYmplY3QgICAgICAgICBmcm9tICdsb2Rhc2gvaXNPYmplY3QnO1xuaW1wb3J0IHsgem9vbURpcmVjdGlvbiB9ICAgIGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2ZiZW1pdHRlcic7XG5pbXBvcnQgQW5pbWF0aW9uTWFuYWdlciBmcm9tICcuL2FuaW1hdGlvbk1hbmFnZXInO1xuaW1wb3J0IENTU1JlbmRlcmVyICAgICAgZnJvbSAnLi9jc3NSZW5kZXJlcic7XG5pbXBvcnQgX01hdGggICAgICAgICAgICBmcm9tICcuL21hdGgvbWF0aCc7XG5pbXBvcnQgTWF0cml4MiAgICAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgU2NlbmUgICAgICAgICAgICBmcm9tICcuL3NjZW5lJztcbmltcG9ydCBTY2VuZU1hbmFnZXIgICAgIGZyb20gJy4vc2NlbmVNYW5hZ2VyJztcbmltcG9ydCBUcmFja0NvbnRyb2wgICAgIGZyb20gJy4vdHJhY2tDb250cm9sJztcbmltcG9ydCBVdGlscyAgICAgICAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG5jb25zdCBhbmltYXRpb25OYW1lID0ge1xuICAgIEFOT05ZTU9VUzogJ19hbm9ueW1vdXMnXG59O1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQ2FtZXJhXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIG9wdGlvbnMuXG4qIEBwYXJhbSB7ZnVuY3Rpb258T2JqZWN0fSBbb3B0aW9ucy5ib3VuZHNdIC0gVGhlIGJvdW5kcy5cbiogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5kcmFnVG9Nb3ZlXSAtIFdoZXRoZXIgdGhlIGNhbWVyYSdzIHBvc2l0aW9uIGlzIGRyYWdnYWJsZSBvciBub3QuXG4qIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5taW5ab29tXSAtIFRoZSB7QGxpbmsgQ2FtZXJhLm1pblpvb218bWluaW11bSB6b29tfS5cbiogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFpvb21dIC0gVGhlIHtAbGluayBDYW1lcmEubWF4Wm9vbXxtYXhpbXVtIHpvb219LlxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fG51bGx9IFtvcHRpb25zLnZpZXddIC0gVGhlIGNhbWVyYSdzIHZpZXcuXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMud2hlZWxUb1pvb21dIC0gV2hldGhlciB3aGVlbGluZyBjYW4gYmUgdXNlZCB0byB6b29tIG9yIG5vdC5cbiogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndoZWVsVG9ab29tSW5jcmVtZW50XSAtIFRoZSBiYXNlIHtAbGluayBDYW1lcmEud2hlZWxUb1pvb21JbmNyZW1lbnR8em9vbSBpbmNyZW1lbnR9LlxuKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtvcHRpb25zLndpZHRoXSAtIFRoZSBjYW1lcmEncyB7QGxpbmsgQ2FtZXJhLndpZHRofHdpZHRofS5cbiogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbb3B0aW9ucy5oZWlnaHRdIC0gVGhlIGNhbWVyYSdzIHtAbGluayBDYW1lcmEuaGVpZ2h0fGhlaWdodH0uXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteUNhbWVyYSA9IG5ldyBPY3Vsby5DYW1lcmEoeyBcbiogICB2aWV3OiAnI2NhbWVyYScsXG4qICAgYm91bmRzOiBPY3Vsby5DYW1lcmEuYm91bmRzLldPUkxEX0VER0UsXG4qICAgZHJhZ1RvTW92ZTogdHJ1ZSxcbiogICBtaW5ab29tOiAwLjUsXG4qICAgbWF4Wm9vbTogMyxcbiogICB3aGVlbFRvWm9vbTogdHJ1ZSxcbiogICB3aGVlbFRvWm9vbUluY3JlbWVudDogMC41LFxuKiAgIHdpZHRoOiAxMDAwLFxuKiAgIGhlaWdodDogNTAwXG4qIH0pO1xuKi9cbmNsYXNzIENhbWVyYSB7XG4gICAgY29uc3RydWN0b3IgKHsgXG4gICAgICAgIGJvdW5kcyA9IG51bGwsIFxuICAgICAgICBkcmFnVG9Nb3ZlID0gZmFsc2UsIFxuICAgICAgICBoZWlnaHQgPSAwLCBcbiAgICAgICAgbWF4Wm9vbSA9IDMsIFxuICAgICAgICBtaW5ab29tID0gMC41LCBcbiAgICAgICAgb25Jbml0aWFsaXplID0gbnVsbCxcbiAgICAgICAgb25CZWZvcmVSZW5kZXIgPSBudWxsLFxuICAgICAgICBvblJlbmRlciA9IG51bGwsXG4gICAgICAgIHZpZXcgPSB1bmRlZmluZWQsIFxuICAgICAgICB3aGVlbFRvWm9vbSA9IGZhbHNlLCBcbiAgICAgICAgd2hlZWxUb1pvb21JbmNyZW1lbnQgPSAwLjAxLCBcbiAgICAgICAgd2lkdGggPSAwXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkFuaW1hdGlvbk1hbmFnZXJ9IC0gQW4gb2JqZWN0IGZvciBtYW5hZ2luZyBhbmltYXRpb25zLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMgPSBuZXcgQW5pbWF0aW9uTWFuYWdlcih0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIGNlbnRlciBvZiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNlbnRlciA9IG5ldyBWZWN0b3IyKHdpZHRoLCBoZWlnaHQpLm11bHRpcGx5U2NhbGFyKDAuNSk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhJ3MgcG9zaXRpb24gaXMgZHJhZ2dhYmxlIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYWdUb01vdmUgPSAoZHJhZ1RvTW92ZSA9PT0gdHJ1ZSkgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGhlaWdodC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSBoYXMgYmVlbiByZW5kZXJlZCBvciBub3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1JlbmRlcmVkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8bnVtYmVyfSAtIFRoZSBtaW5pbXVtIFggcG9zaXRpb24gYWZ0ZXIgYm91bmRzIGFyZSBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1pblBvc2l0aW9uWCA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8bnVtYmVyfSAtIFRoZSBtaW5pbXVtIFkgcG9zaXRpb24gYWZ0ZXIgYm91bmRzIGFyZSBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1pblBvc2l0aW9uWSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8bnVtYmVyfSAtIFRoZSBtYXhpbXVtIFggcG9zaXRpb24gYWZ0ZXIgYm91bmRzIGFyZSBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1heFBvc2l0aW9uWCA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8bnVtYmVyfSAtIFRoZSBtYXhpbXVtIFkgcG9zaXRpb24gYWZ0ZXIgYm91bmRzIGFyZSBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1heFBvc2l0aW9uWSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgbWluaW11bSB2YWx1ZSB0aGUgY2FtZXJhIGNhbiBiZSB6b29tZWQuXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gU2VlIHtAbGluayBDYW1lcmEuem9vbXx6b29tfS5cbiAgICAgICAgKiBAZGVmYXVsdCAwLjVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5taW5ab29tID0gbWluWm9vbTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSBtYXhpbXVtIHZhbHVlIHRoZSBjYW1lcmEgY2FuIGJlIHpvb21lZC5cbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBTZWUge0BsaW5rIENhbWVyYS56b29tfHpvb219LlxuICAgICAgICAqIEBkZWZhdWx0IDNcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tYXhab29tID0gbWF4Wm9vbTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBwb3NpdGlvbiBvZiB0aGUgY2FtZXJhIG9uIHRoZSBzY2VuZS5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IyKDAsIDApO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGFueSBlZmZlY3RzIGFwcGxpZWQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucmF3T2Zmc2V0ID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgcG9zaXRpb24gb2YgdGhlIGNhbWVyYSBvbiB0aGUgc2NlbmUgd2l0aG91dCBhbnkgZWZmZWN0cyBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnJhd1Bvc2l0aW9uID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgcmVuZGVyZXIuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgQ1NTUmVuZGVyZXIodGhpcyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgYW1vdW50IG9mIHJvdGF0aW9uIGluIGRlZ3JlZXMuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvdGF0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uU2NlbmVNYW5hZ2VyfSAtIEFuIG9iamVjdCBmb3IgbWFuYWdpbmcgc2NlbmVzLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnNjZW5lcyA9IG5ldyBTY2VuZU1hbmFnZXIodGhpcyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1RyYWNrQ29udHJvbH0gLSBUaGUgdHJhY2sgY29udHJvbC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBvcmlnaW4uXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMudHJhbnNmb3JtT3JpZ2luID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdmlldy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy52aWV3ID0gKHZpZXcgPT09IG51bGwpID8gbnVsbCA6IFV0aWxzLkRPTS5wYXJzZVZpZXcodmlldykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB3aGVlbGluZyBjYW4gYmUgdXNlZCB0byB6b29tIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLndoZWVsVG9ab29tID0gKHdoZWVsVG9ab29tID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBiYXNlIGluY3JlbWVudCBhdCB3aGljaCB0aGUgY2FtZXJhIHdpbGwgYmUgem9vbWVkLiBTZWUge0BsaW5rIENhbWVyYS56b29tfHpvb219LlxuICAgICAgICAqIEBkZWZhdWx0IDAuMDFcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aGVlbFRvWm9vbUluY3JlbWVudCA9IHdoZWVsVG9ab29tSW5jcmVtZW50O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHdpZHRoLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHpvb20gZGlyZWN0aW9uLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy56b29tRGlyZWN0aW9uID0gem9vbURpcmVjdGlvbi5OT05FO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8ZnVuY3Rpb258T2JqZWN0fSAtIFRoZSBpbnRlcm5hbGx5IG1hbmFnZWQgYm91bmRzLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ib3VuZHMgPSBib3VuZHM7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7RXZlbnRFbWl0dGVyfSAtIFRoZSBpbnRlcm5hbCBldmVudCBlbWl0dGVyLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBzY2FsZSBhdCB3aGljaCB0aGUgc2NlbmUgaXMgcmFzdGVyaXplZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmFzdGVyU2NhbGUgPSAxO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgaW50ZXJuYWxseSBtYW5hZ2VkIHpvb20uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX3pvb20gPSAxO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBwb3NpdGlvblxuICAgICAgICB0aGlzLnNldFJhd1Bvc2l0aW9uKG5ldyBWZWN0b3IyKHdpZHRoICogMC41LCBoZWlnaHQgKiAwLjUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgZXZlbnRzXG4gICAgICAgIGlmIChvbkluaXRpYWxpemUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMub25Jbml0aWFsaXplID0gb25Jbml0aWFsaXplO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAob25CZWZvcmVSZW5kZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMub25CZWZvcmVSZW5kZXIgPSBvbkJlZm9yZVJlbmRlcjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG9uUmVuZGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLm9uUmVuZGVyID0gb25SZW5kZXI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMub25SZXNpemUgPSAoKSA9PiB7XG4gICAgICAgICAgICAvLyBNYWludGFpbiBjYW1lcmEgcG9zaXRpb24gYW5kIHVwZGF0ZSB0aGUgY3VycmVudCBhbmltYXRpb25cbiAgICAgICAgICAgIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcywgeyBcbiAgICAgICAgICAgICAgICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHdhc1BhdXNlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuYW5pbWF0aW9ucy5jdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAndGhpcycgaXMgYm91bmQgdG8gdGhlIEFuaW1hdGlvbiB2aWEgdGhlIEFuaW1hdGlvbiBjbGFzc1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFuaW1hdGlvbiA9IHRoaXMuY2FtZXJhLmFuaW1hdGlvbnMuY3VycmVudEFuaW1hdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aW1lID0gYW5pbWF0aW9uLnRpbWUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uLnNlZWsoMCkuaW52YWxpZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uLmNvcmVUd2VlbnNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRSYXdQb3NpdGlvbihhbmltYXRpb24uY29yZVR3ZWVuc1swXS5wcm9wcy5zdGFydC5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbi5zZWVrKHRpbWUsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF3YXNQYXVzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogW3RoaXMuYW5pbWF0aW9ucy5pc1BhdXNlZF1cbiAgICAgICAgICAgIH0pLm1vdmVUbyh0aGlzLnJhd1Bvc2l0aW9uLCAwLCB7IG92ZXJ3cml0ZTogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgIHRoaXMuX2V2ZW50cy5hZGRMaXN0ZW5lcignY2hhbmdlOnNpemUnLCB0aGlzLm9uUmVzaXplKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgdmlld1xuICAgICAgICBpZiAodGhpcy52aWV3KSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgc2NlbmUgbWFuYWdlciB2aWV3IGFuZCB0cmFjayBjb250cm9sc1xuICAgICAgICBpZiAodGhpcy52aWV3ICYmIHRoaXMuc2NlbmVzLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLnNjZW5lcy52aWV3KTtcbiAgICAgICAgICAgIHRoaXMudHJhY2tDb250cm9sID0gbmV3IFRyYWNrQ29udHJvbCh0aGlzLCB7XG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlOiB0aGlzLmRyYWdUb01vdmUsXG4gICAgICAgICAgICAgICAgb25EcmFnOiBmdW5jdGlvbiAoY2FtZXJhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IGNhbWVyYS5fY29udmVydE9mZnNldFRvUG9zaXRpb24obmV3IFZlY3RvcjIoLXRoaXMueCwgLXRoaXMueSksIGNhbWVyYS5jZW50ZXIsIGNhbWVyYS50cmFuc2Zvcm1PcmlnaW4sIGNhbWVyYS50cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIG5ldyBPY3Vsby5BbmltYXRpb24oY2FtZXJhLCB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdHJveU9uQ29tcGxldGU6IHRydWUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChkcmFnQ29udHJvbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdDb250cm9sLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFt0aGlzXVxuICAgICAgICAgICAgICAgICAgICB9KS5tb3ZlVG8ocG9zaXRpb24sIDApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2hlZWxhYmxlOiB0aGlzLndoZWVsVG9ab29tLFxuICAgICAgICAgICAgICAgIG9uV2hlZWw6IGZ1bmN0aW9uIChjYW1lcmEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgWk9PTV9JTiA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFpPT01fT1VUID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZlbG9jaXR5ID0gTWF0aC5hYnModGhpcy53aGVlbEV2ZW50LmRlbHRhWSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLndoZWVsRXZlbnQuZGVsdGFZID4gMCA/IFpPT01fT1VUIDogWk9PTV9JTjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzRGlyZWN0aW9uID0gdGhpcy5wcmV2aW91c1doZWVsRXZlbnQuZGVsdGFZID4gMCA/IFpPT01fT1VUIDogWk9PTV9JTjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbWVyYVJlY3Q7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW1lcmFGT1ZQb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzY2VuZVBvc2l0aW9uID0gbmV3IFZlY3RvcjIoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdpbiA9IGNhbWVyYS50cmFuc2Zvcm1PcmlnaW47XG4gICAgICAgICAgICAgICAgICAgIHZhciB6b29tID0gY2FtZXJhLnpvb20gKyBjYW1lcmEuem9vbSAqIGNhbWVyYS53aGVlbFRvWm9vbUluY3JlbWVudCAqICh2ZWxvY2l0eSA+IDEgPyB2ZWxvY2l0eSAqIDAuNSA6IDEpICogKGRpcmVjdGlvbiA9PT0gWk9PTV9JTiA/IDEgOiAtMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUGVyZm9ybWFuY2UgT3B0aW1pemF0aW9uOiBJZiB6b29tIGhhcyBub3QgY2hhbmdlZCBiZWNhdXNlIGl0J3MgYXQgdGhlIG1pbi9tYXgsIGRvbid0IHpvb20uXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IHByZXZpb3VzRGlyZWN0aW9uICYmIGNhbWVyYS5fY2xhbXBab29tKHpvb20pICE9PSBjYW1lcmEuem9vbSkgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYVJlY3QgPSBjYW1lcmEudmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYUZPVlBvc2l0aW9uLnNldCh0aGlzLndoZWVsRXZlbnQuY2xpZW50WCAtIGNhbWVyYVJlY3QubGVmdCwgdGhpcy53aGVlbEV2ZW50LmNsaWVudFkgLSBjYW1lcmFSZWN0LnRvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2VuZVBvc2l0aW9uID0gY2FtZXJhLl9jb252ZXJ0Rk9WUG9zaXRpb25Ub1NjZW5lUG9zaXRpb24oY2FtZXJhRk9WUG9zaXRpb24sIGNhbWVyYS5wb3NpdGlvbiwgY2FtZXJhLmNlbnRlciwgY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzIHBvczogJywgc2NlbmVQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmZsb29yKG9yaWdpbi54KSAhPT0gTWF0aC5mbG9vcihzY2VuZVBvc2l0aW9uLngpIHx8IE1hdGguZmxvb3Iob3JpZ2luLnkpICE9PSBNYXRoLmZsb29yKHNjZW5lUG9zaXRpb24ueSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW4gPSBzY2VuZVBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgT2N1bG8uQW5pbWF0aW9uKGNhbWVyYSwgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnpvb21BdChvcmlnaW4sIHpvb20sIDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMub25Jbml0aWFsaXplKGFyZ3VtZW50c1swXSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI2JvdW5kc1xuICAgICogQHByb3BlcnR5IHtudWxsfGZ1bmN0aW9ufE9iamVjdH0gLSBUaGUgY2FtZXJhJ3MgYm91bmRzLiBUaGUgbWluaW11bSBhbmQgbWF4aW11bSBwb3NpdGlvbiB2YWx1ZXMgZm9yIHRoZSBjYW1lcmEuIFNldCB0byBudWxsIGlmIG5vIGJvdW5kcyBhcmUgZGVzaXJlZC5cbiAgICAqXG4gICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcyBhIHN0b2NrIGJvdW5kczwvY2FwdGlvbj5cbiAgICAqIE9jdWxvLkNhbWVyYS5ib3VuZHMuV09STERcbiAgICAqXG4gICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcyBhIGJvdW5kcyBvYmplY3Q8L2NhcHRpb24+XG4gICAgKiB7IFxuICAgICogICBtaW5YOiAwLCBcbiAgICAqICAgbWluWTogMCwgXG4gICAgKiAgIG1heFg6IHRoaXMuc2NlbmUud2lkdGgsIFxuICAgICogICBtYXhZOiB0aGlzLnNjZW5lLmhlaWdodFxuICAgICogfVxuICAgICpcbiAgICAqIEBleGFtcGxlIDxjYXB0aW9uPkFzIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgYm91bmRzIG9iamVjdDwvY2FwdGlvbj5cbiAgICAqIGZ1bmN0aW9uICgpIHsgXG4gICAgKiAgIHZhciB0cmFuc2Zvcm1hdGlvbiA9IG5ldyBNYXRyaXgyKCkuc2NhbGUodGhpcy56b29tLCB0aGlzLnpvb20pLmdldEludmVyc2UoKTtcbiAgICAqICAgdmFyIG1pbiA9IG5ldyBWZWN0b3IyKCkuYWRkKHRoaXMuY2VudGVyKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pO1xuICAgICogICB2YXIgbWF4ID0gbmV3IFZlY3RvcjIodGhpcy5zY2VuZS5zY2FsZWRXaWR0aCwgdGhpcy5zY2VuZS5zY2FsZWRIZWlnaHQpLnN1YnRyYWN0KHRoaXMuY2VudGVyKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pO1xuICAgICogXG4gICAgKiAgIHJldHVybiB7XG4gICAgKiAgICAgbWluWDogbWluLngsXG4gICAgKiAgICAgbWluWTogbWluLnksXG4gICAgKiAgICAgbWF4WDogbWF4LngsXG4gICAgKiAgICAgbWF4WTogbWF4LnlcbiAgICAqICAgfVxuICAgICogfVxuICAgICovXG4gICAgZ2V0IGJvdW5kcyAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ib3VuZHM7XG4gICAgfVxuXG4gICAgc2V0IGJvdW5kcyAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fYm91bmRzID0gIXZhbHVlID8gbnVsbCA6IHZhbHVlO1xuICAgICAgICB0aGlzLl91cGRhdGVCb3VuZHMoKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjaGFzQm91bmRzXG4gICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhIGhhcyBib3VuZHMgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaGFzQm91bmRzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvdW5kcyAhPT0gbnVsbDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjaXNSb3RhdGVkXG4gICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhIGlzIHJvdGF0ZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNSb3RhdGVkICgpIHtcbiAgICAgICAgcmV0dXJuIChNYXRoLmFicyh0aGlzLnJvdGF0aW9uIC8gMzYwKSAlIDEpID4gMDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjaXNab29tZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaXMgem9vbWVkIG9yIG5vdC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IGlzWm9vbWVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuem9vbSAhPT0gMTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjcmF3T2Zmc2V0WFxuICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSBYIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGFueSBlZmZlY3RzIGFwcGxpZWQuXG4gICAgKi9cbiAgICBnZXQgcmF3T2Zmc2V0WCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhd09mZnNldC54O1xuICAgIH1cbiAgICBcbiAgICBzZXQgcmF3T2Zmc2V0WCAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5yYXdPZmZzZXQueCA9IHZhbHVlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNyYXdPZmZzZXRZXG4gICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIFkgb2Zmc2V0IG9mIHRoZSBjYW1lcmEncyB0b3AgbGVmdCBjb3JuZXIgcmVsYXRpdmUgdG8gdGhlIHNjZW5lIHdpdGhvdXQgYW55IGVmZmVjdHMgYXBwbGllZC5cbiAgICAqL1xuICAgIGdldCByYXdPZmZzZXRZICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3T2Zmc2V0Lnk7XG4gICAgfVxuICAgIFxuICAgIHNldCByYXdPZmZzZXRZICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnJhd09mZnNldC55ID0gdmFsdWU7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI3NjZW5lXG4gICAgKiBAcHJvcGVydHkge09jdWxvLlNjZW5lfSAtIFRoZSBhY3RpdmUgc2NlbmUuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBzY2VuZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjZW5lcy5hY3RpdmVTY2VuZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjdHJhbnNmb3JtYXRpb25cbiAgICAqIEBwcm9wZXJ0eSB7TWF0cml4Mn0gLSBUaGUgdHJhbnNmb3JtYXRpb24gb2YgdGhlIHNjZW5lLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgdHJhbnNmb3JtYXRpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDIoKS5zY2FsZSh0aGlzLnpvb20sIHRoaXMuem9vbSkucm90YXRlKF9NYXRoLmRlZ1RvUmFkKC10aGlzLnJvdGF0aW9uKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI3pvb21cbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBhbW91bnQgb2Ygem9vbS4gQSByYXRpbyB3aGVyZSAxID0gMTAwJS5cbiAgICAqIEByZWFkb25seVxuICAgICogQGRlZmF1bHQgMVxuICAgICovXG4gICAgZ2V0IHpvb20gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fem9vbTtcbiAgICB9XG4gICAgICAgIFxuICAgIHNldCB6b29tICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl96b29tID0gdGhpcy5fY2xhbXBab29tKHZhbHVlKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQm91bmRzKCk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAqIENsYW1wcyB0aGUgWCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgcG9zaXRpb24uXG4gICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgY2xhbXBlZCBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jbGFtcFBvc2l0aW9uWCAoeCkge1xuICAgICAgICBpZiAodGhpcy5fYm91bmRzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB4ID0gY2xhbXAoeCwgdGhpcy5taW5Qb3NpdGlvblgsIHRoaXMubWF4UG9zaXRpb25YKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xhbXBzIHRoZSBZIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSBwb3NpdGlvbi5cbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBjbGFtcGVkIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NsYW1wUG9zaXRpb25ZICh5KSB7XG4gICAgICAgIGlmICh0aGlzLl9ib3VuZHMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHkgPSBjbGFtcCh5LCB0aGlzLm1pblBvc2l0aW9uWSwgdGhpcy5tYXhQb3NpdGlvblkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbGFtcHMgdGhlIHpvb20uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gVGhlIHpvb20uXG4gICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgY2xhbXBlZCB6b29tLlxuICAgICovXG4gICAgX2NsYW1wWm9vbSAoem9vbSkge1xuICAgICAgICByZXR1cm4gY2xhbXAoem9vbSwgdGhpcy5taW5ab29tLCB0aGlzLm1heFpvb20pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENvbnZlcnRzIGEgRk9WIHBvc2l0aW9uIHRvIGEgc2NlbmUgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhRk9WUG9zaXRpb24gLSBUaGUgcG9pbnQgaW4gdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhUG9zaXRpb24gLSBUaGUgY2FtZXJhJ3MgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUNlbnRlciAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gdHJhbnNmb3JtYXRpb24gLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBzY2VuZSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0Rk9WUG9zaXRpb25Ub1NjZW5lUG9zaXRpb24gKGNhbWVyYUZPVlBvc2l0aW9uLCBjYW1lcmFQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICByZXR1cm4gY2FtZXJhUG9zaXRpb24uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KGNhbWVyYUNlbnRlci5jbG9uZSgpLnN1YnRyYWN0KGNhbWVyYUZPVlBvc2l0aW9uKSkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uLmdldEludmVyc2UoKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBzY2VuZSBwb3NpdGlvbiB0byBhIEZPViBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBzY2VuZVBvc2l0aW9uIC0gVGhlIHJhdyBwb2ludCBvbiB0aGUgc2NlbmUuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYVBvc2l0aW9uIC0gVGhlIGNhbWVyYSdzIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHRyYW5zZm9ybWF0aW9uIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgRk9WIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NvbnZlcnRTY2VuZVBvc2l0aW9uVG9GT1ZQb3NpdGlvbiAoc2NlbmVQb3NpdGlvbiwgY2FtZXJhUG9zaXRpb24sIGNhbWVyYUNlbnRlciwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIGNhbWVyYUNlbnRlci5jbG9uZSgpLmFkZChzY2VuZVBvc2l0aW9uLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdChjYW1lcmFQb3NpdGlvbi5jbG9uZSgpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbikpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb252ZXJ0cyBhIHNjZW5lIHBvc2l0aW9uIGxvY2F0ZWQgYXQgYSBGT1YgcG9zaXRpb24gdG8gYSBjYW1lcmEgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gc2NlbmVQb3NpdGlvbiAtIFRoZSByYXcgcG9pbnQgb24gdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFGT1ZQb3NpdGlvbiAtIFRoZSBwb2ludCBpbiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSB0cmFuc2Zvcm1hdGlvbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIGNhbWVyYSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0U2NlbmVQb3NpdGlvblRvQ2FtZXJhUG9zaXRpb24gKHNjZW5lUG9zaXRpb24sIGNhbWVyYUZPVlBvc2l0aW9uLCBjYW1lcmFDZW50ZXIsIHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybU9yaWdpbk9mZnNldCA9IHRoaXMuX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCh0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgdmFyIG9mZnNldCA9IHNjZW5lUG9zaXRpb24uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KHRyYW5zZm9ybU9yaWdpbk9mZnNldCkuc3VidHJhY3QoY2FtZXJhRk9WUG9zaXRpb24pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbihvZmZzZXQsIGNhbWVyYUNlbnRlciwgdHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBjYW1lcmEgb2Zmc2V0IHRvIGEgY2FtZXJhIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYU9mZnNldCAtIFRoZSBjYW1lcmEncyBvZmZzZXQgb24gdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSB0cmFuc2Zvcm1hdGlvbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIGNhbWVyYSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbiAoY2FtZXJhT2Zmc2V0LCBjYW1lcmFDZW50ZXIsIHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybU9yaWdpbk9mZnNldCA9IHRoaXMuX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCh0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKTtcblxuICAgICAgICByZXR1cm4gY2FtZXJhT2Zmc2V0LmNsb25lKCkuYWRkKHRyYW5zZm9ybU9yaWdpbk9mZnNldCkuYWRkKGNhbWVyYUNlbnRlcikudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uLmdldEludmVyc2UoKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBjYW1lcmEgcG9zaXRpb24gdG8gYSBjYW1lcmEgb2Zmc2V0LlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYVBvc2l0aW9uIC0gVGhlIGNhbWVyYSdzIHBvc2l0aW9uIG9uIHRoZSBzY2VuZS5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhQ2VudGVyIC0gVGhlIGNlbnRlciBvZiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB0cmFuc2Zvcm1PcmlnaW4gLSBUaGUgdHJhbnNmb3JtIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gdHJhbnNmb3JtYXRpb24gLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBjYW1lcmEgb2Zmc2V0LlxuICAgICovXG4gICAgX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0IChjYW1lcmFQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCB0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKSB7XG4gICAgICAgIHZhciB0cmFuc2Zvcm1PcmlnaW5PZmZzZXQgPSB0aGlzLl9nZXRUcmFuc2Zvcm1PcmlnaW5PZmZzZXQodHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbik7XG5cbiAgICAgICAgcmV0dXJuIGNhbWVyYVBvc2l0aW9uLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdCh0cmFuc2Zvcm1PcmlnaW5PZmZzZXQpLnN1YnRyYWN0KGNhbWVyYUNlbnRlcik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgb2Zmc2V0IG9mIHRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHRyYW5zZm9ybWF0aW9uIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgb2Zmc2V0LlxuICAgICovXG4gICAgX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCAodHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtT3JpZ2luLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdCh0cmFuc2Zvcm1PcmlnaW4pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlc2V0cyB0aGUgY2FtZXJhIHRvIHRoZSBkZWZhdWx0IHN0YXRlLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfcmVzZXQgKCkge1xuICAgICAgICB0aGlzLnRyYW5zZm9ybU9yaWdpbi5zZXQoMCwgMCk7XG4gICAgICAgIHRoaXMucm90YXRpb24gPSAwO1xuICAgICAgICB0aGlzLnpvb20gPSAxO1xuICAgICAgICB0aGlzLl9yYXN0ZXJTY2FsZSA9IDE7XG4gICAgICAgIHRoaXMuc2V0UmF3UG9zaXRpb24obmV3IFZlY3RvcjIodGhpcy53aWR0aCAqIDAuNSwgdGhpcy5oZWlnaHQgKiAwLjUpKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFVwZGF0ZXMgdGhlIGJvdW5kcy5cbiAgICAqXG4gICAgKiByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfdXBkYXRlQm91bmRzICgpIHsgXG4gICAgICAgIHZhciBib3VuZHM7XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5zY2VuZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2JvdW5kcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbWluWDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWluWTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWF4WDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWF4WTogbnVsbFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2JvdW5kcykpIHtcbiAgICAgICAgICAgICAgICBib3VuZHMgPSB0aGlzLl9ib3VuZHMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHRoaXMuX2JvdW5kcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5taW5Qb3NpdGlvblggPSBib3VuZHMubWluWDtcbiAgICAgICAgICAgIHRoaXMubWluUG9zaXRpb25ZID0gYm91bmRzLm1pblk7XG4gICAgICAgICAgICB0aGlzLm1heFBvc2l0aW9uWCA9IGJvdW5kcy5tYXhYO1xuICAgICAgICAgICAgdGhpcy5tYXhQb3NpdGlvblkgPSBib3VuZHMubWF4WTtcblxuICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXBkYXRlIGJvdW5kcycpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBZGRzIGFuIGFuaW1hdGlvbiB0byB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBzZWUgT2N1bG8uQW5pbWF0aW9uTWFuYWdlci5hZGRcbiAgICAqIHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGFkZEFuaW1hdGlvbiAobmFtZSwgYW5pbWF0aW9uKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQobmFtZSwgYW5pbWF0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgYW4gYW5pbWF0aW9uLlxuICAgICpcbiAgICAqIEBzZWUgT2N1bG8uQW5pbWF0aW9uTWFuYWdlci5nZXRcbiAgICAqL1xuICAgIGdldEFuaW1hdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbmltYXRpb25zLmdldChuYW1lKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBZGRzIGEgc2NlbmUgdG8gdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLlNjZW5lTWFuYWdlci5hZGRcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBhZGRTY2VuZSAobmFtZSwgc2NlbmUpIHtcbiAgICAgICAgdGhpcy5zY2VuZXMuYWRkKG5hbWUsIHNjZW5lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgYSBzY2VuZS5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLlNjZW5lTWFuYWdlci5nZXRcbiAgICAqL1xuICAgIGdldFNjZW5lIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjZW5lcy5nZXQobmFtZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgYWN0aXZlIHNjZW5lLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHNjZW5lLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFNjZW5lIChuYW1lKSB7XG4gICAgICAgIHRoaXMuc2NlbmVzLnNldEFjdGl2ZVNjZW5lKG5hbWUpO1xuICAgICAgICB0aGlzLl9yZXNldCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBjYW1lcmEgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBpZiAodGhpcy52aWV3ICYmIHRoaXMudmlldy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLnZpZXcgPSBudWxsO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5zY2VuZXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuX2V2ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIGRyYWctdG8tbW92ZS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGlzYWJsZURyYWdUb01vdmUgKCkge1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5kaXNhYmxlRHJhZygpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBFbmFibGVzIGRyYWctdG8tbW92ZS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlRHJhZ1RvTW92ZSAoKSB7XG4gICAgICAgIHRoaXMudHJhY2tDb250cm9sLmVuYWJsZURyYWcoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyB3aGVlbC10by16b29tLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlV2hlZWxUb1pvb20gKCkge1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5kaXNhYmxlV2hlZWwoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyB3aGVlbC10by16b29tLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBlbmFibGVXaGVlbFRvWm9vbSAoKSB7XG4gICAgICAgIHRoaXMudHJhY2tDb250cm9sLmVuYWJsZVdoZWVsKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FtZXJhIGhhcyBiZWVuIGluaXRpYWxpemVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gVGhlIG9wdGlvbnMgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvciB3aGVuIHRoZSBjYW1lcmEgd2FzIGNyZWF0ZWQuXG4gICAgKi9cbiAgICBvbkluaXRpYWxpemUgKG9wdGlvbnMpIHtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxsZWQgYmVmb3JlIHRoZSBjYW1lcmEgaGFzIHJlbmRlcmVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqL1xuICAgIG9uQmVmb3JlUmVuZGVyICgpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICogQ2FsbGVkIGFmdGVyIHRoZSBjYW1lcmEgaGFzIHJlbmRlcmVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqL1xuICAgIG9uUmVuZGVyICgpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICogUmVuZGVyIHRoZSBjYW1lcmEgdmlldy4gSWYgeW91IG5lZWQgdG8gbWFuaXB1bGF0ZSBob3cgdGhlIGNhbWVyYSByZW5kZXJzLCB1c2Uge0BsaW5rIENhbWVyYSNvbkJlZm9yZVJlbmRlcnxvbkJlZm9yZVJlbmRlcn0gYW5kIHtAbGluayBDYW1lcmEjb25SZW5kZXJ8b25SZW5kZXJ9LlxuICAgICpcbiAgICAqIEByZXR1cm5zIHtDYW1lcmF9IFRoZSB2aWV3LlxuICAgICovXG4gICAgcmVuZGVyICgpIHtcbiAgICAgICAgdGhpcy5vbkJlZm9yZVJlbmRlcigpO1xuXG4gICAgICAgIGlmICghdGhpcy5pc1JlbmRlcmVkKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlclNpemUoKTtcbiAgICAgICAgICAgIHRoaXMuaXNSZW5kZXJlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKCk7XG4gICAgICAgIHRoaXMub25SZW5kZXIoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHBvc2l0aW9uIC0gVGhlIG5ldyBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5mb3JjZUJvdW5kcyAtIFdoZXRoZXIgdG8gZW5mb3JjZSBib3VuZHMgb3Igbm90LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFBvc2l0aW9uIChwb3NpdGlvbiwgZW5mb3JjZUJvdW5kcyA9IHRydWUpIHtcbiAgICAgICAgaWYgKGVuZm9yY2VCb3VuZHMpIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24uc2V0KHRoaXMuX2NsYW1wUG9zaXRpb25YKHBvc2l0aW9uLngpLCB0aGlzLl9jbGFtcFBvc2l0aW9uWShwb3NpdGlvbi55KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLnNldChwb3NpdGlvbi54LCBwb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgcmF3IHBvc2l0aW9uIGFuZCB1cGRhdGVzIGRlcGVuZGVudCBkYXRhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gcG9zaXRpb24gLSBUaGUgbmV3IHBvc2l0aW9uLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFJhd1Bvc2l0aW9uIChwb3NpdGlvbikge1xuICAgICAgICB0aGlzLnJhd1Bvc2l0aW9uLnNldCh0aGlzLl9jbGFtcFBvc2l0aW9uWChwb3NpdGlvbi54KSwgdGhpcy5fY2xhbXBQb3NpdGlvblkocG9zaXRpb24ueSkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLmNvcHkodGhpcy5yYXdQb3NpdGlvbik7XG4gICAgICAgIHRoaXMucmF3T2Zmc2V0LmNvcHkodGhpcy5fY29udmVydFBvc2l0aW9uVG9PZmZzZXQodGhpcy5yYXdQb3NpdGlvbiwgdGhpcy5jZW50ZXIsIHRoaXMudHJhbnNmb3JtT3JpZ2luLCB0aGlzLnRyYW5zZm9ybWF0aW9uKSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBzaXplIG9mIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSB3aWR0aCAtIFRoZSB3aWR0aC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gaGVpZ2h0IC0gVGhlIGhlaWdodC5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRTaXplICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBoYXNDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzTmlsKHdpZHRoKSAmJiAod2lkdGggIT09IHRoaXMud2lkdGgpKSB7XG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICB0aGlzLmNlbnRlci54ID0gd2lkdGggKiAwLjU7XG4gICAgICAgICAgICBoYXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc05pbChoZWlnaHQpICYmIChoZWlnaHQgIT09IHRoaXMuaGVpZ2h0KSkge1xuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLmNlbnRlci55ID0gaGVpZ2h0ICogMC41O1xuICAgICAgICAgICAgaGFzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChoYXNDaGFuZ2VkKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlclNpemUoKTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5lbWl0KCdjaGFuZ2U6c2l6ZScpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB0cmFuc2Zvcm1PcmlnaW4uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gb3JpZ2luIC0gVGhlIG9yaWdpbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRUcmFuc2Zvcm1PcmlnaW4gKG9yaWdpbikge1xuICAgICAgICBpZiAob3JpZ2luICYmICFvcmlnaW4uZXF1YWxzKHRoaXMudHJhbnNmb3JtT3JpZ2luKSkge1xuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1PcmlnaW4uY29weShvcmlnaW4pO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc1JvdGF0ZWQgfHwgdGhpcy5pc1pvb21lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmF3T2Zmc2V0LmNvcHkodGhpcy5fY29udmVydFBvc2l0aW9uVG9PZmZzZXQodGhpcy5yYXdQb3NpdGlvbiwgdGhpcy5jZW50ZXIsIHRoaXMudHJhbnNmb3JtT3JpZ2luLCB0aGlzLnRyYW5zZm9ybWF0aW9uKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhdXNlcyB0aGUgY2FtZXJhIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwYXVzZSAoKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wYXVzZSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUGxheXMgdGhlIGNhbWVyYSBhbmltYXRpb24gZm9yd2FyZCBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHBsYXkgKGFuaW1hdGlvbikge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb24pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlc3VtZXMgcGxheWluZyB0aGUgY2FtZXJhIGFuaW1hdGlvbiBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlc3VtZSAoKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5yZXN1bWUoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXZlcnNlcyBwbGF5YmFjayBvZiBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24uIElmIG5vbmUgaXMgc3BlY2lmaWVkLCB0aGUgY3VycmVudCBhbmltYXRpb24gd2lsbCBiZSByZXZlcnNlZC5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZXZlcnNlIChuYW1lKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5yZXZlcnNlKG5hbWUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSBhbmltYXRlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNhbmltYXRlfEFuaW1hdGlvbi5hbmltYXRlfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGFuaW1hdGUgKHByb3BzLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLmFuaW1hdGUocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgbW92ZSB0byBhIHNwZWNpZmljIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jbW92ZVRvfEFuaW1hdGlvbi5tb3ZlVG99XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgbW92ZVRvIChwb3NpdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS5tb3ZlVG8ocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgcm90YXRlIGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNyb3RhdGVBdHxBbmltYXRpb24ucm90YXRlQXR9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcm90YXRlQXQgKG9yaWdpbiwgcm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcykucm90YXRlQXQob3JpZ2luLCByb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSByb3RhdGUgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNyb3RhdGVUb3xBbmltYXRpb24ucm90YXRlVG99XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcm90YXRlVG8gKHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLnJvdGF0ZVRvKHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHNoYWtlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNzaGFrZXxBbmltYXRpb24uc2hha2V9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2hha2UgKGludGVuc2l0eSwgZHVyYXRpb24sIGRpcmVjdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLnNoYWtlKGludGVuc2l0eSwgZHVyYXRpb24sIGRpcmVjdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHpvb20gaW4vb3V0IGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiN6b29tQXR8QW5pbWF0aW9uLnpvb21BdH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICB6b29tQXQgKG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS56b29tQXQob3JpZ2luLCB6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHpvb20gaW4vb3V0IGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jem9vbVRvfEFuaW1hdGlvbi56b29tVG99XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgem9vbVRvICh6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLnpvb21Ubyh6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5DYW1lcmEuYm91bmRzID0ge1xuICAgIE5PTkU6IG51bGwsXG4gICAgV09STEQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZSh0aGlzLnpvb20sIHRoaXMuem9vbSkuZ2V0SW52ZXJzZSgpO1xuICAgICAgICB2YXIgbWluID0gbmV3IFZlY3RvcjIoKS5hZGQodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIHZhciBtYXggPSBuZXcgVmVjdG9yMih0aGlzLnNjZW5lLnNjYWxlZFdpZHRoLCB0aGlzLnNjZW5lLnNjYWxlZEhlaWdodCkuc3VidHJhY3QodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pblg6IG1pbi54LFxuICAgICAgICAgICAgbWluWTogbWluLnksXG4gICAgICAgICAgICBtYXhYOiBtYXgueCxcbiAgICAgICAgICAgIG1heFk6IG1heC55XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBXT1JMRF9FREdFOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5YOiAwLFxuICAgICAgICAgICAgbWluWTogMCxcbiAgICAgICAgICAgIG1heFg6IHRoaXMuc2NlbmUud2lkdGgsXG4gICAgICAgICAgICBtYXhZOiB0aGlzLnNjZW5lLmhlaWdodFxuICAgICAgICB9O1xuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBDYW1lcmE7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbi8qKlxuKiBPYmplY3QgdHlwZXMuXG4qIEBlbnVtIHtudW1iZXJ9XG4qL1xuZXhwb3J0IGNvbnN0IFR5cGUgPSB7XG4gICAgQU5JTUFUSU9OOiAwXG59XG5cbi8qKlxuKiBab29tIGRpcmVjdGlvbi5cbiogQGVudW0ge251bWJlcn1cbiovXG5leHBvcnQgY29uc3Qgem9vbURpcmVjdGlvbiA9IHtcbiAgICBOT05FOiAwLFxuICAgIElOOiAxLFxuICAgIE9VVDogLTFcbn07IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCByb3VuZCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9yb3VuZCc7XG5pbXBvcnQgeyB6b29tRGlyZWN0aW9uIH0gICAgZnJvbSAnLi9jb25zdGFudHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQ1NTUmVuZGVyZXJcbiogQGNvbnN0cnVjdG9yXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteVJlbmRlcmVyID0gbmV3IENTU1JlbmRlcmVyKG15Q2FtZXJhKTtcbiovXG5jbGFzcyBDU1NSZW5kZXJlciB7XG4gICAgY29uc3RydWN0b3IgKGNhbWVyYSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gLSBUaGUgY2FtZXJhLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgcmVuZGVyZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZW5kZXIgdGhlIHNjZW5lLlxuICAgICpcbiAgICAqIHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlbmRlciAoKSB7XG4gICAgICAgIGlmICh0aGlzLmNhbWVyYS5zY2VuZSAmJiB0aGlzLmNhbWVyYS5zY2VuZXMudmlldykge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0UG9zaXRpb25Ub09mZnNldCh0aGlzLmNhbWVyYS5wb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4sIHRoaXMuY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgIHZhciByYXN0ZXJJbmNyZW1lbnQgPSAwLjM7XG4gICAgICAgICAgICB2YXIgc2NhbGVMZXZlbCA9IE1hdGguZmxvb3IodGhpcy5jYW1lcmEuem9vbSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENvbnRyb2wgcmFzdGVyaXphdGlvbiB0byBtYWludGFpbiBjbGFyaXR5IHdoZW4gem9vbWluZ1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLnpvb20gPT09IHRoaXMuY2FtZXJhLm1heFpvb20gfHwgKHRoaXMuY2FtZXJhLnpvb21EaXJlY3Rpb24gPT09IHpvb21EaXJlY3Rpb24uSU4gJiYgdGhpcy5jYW1lcmEuem9vbSA+IHRoaXMuY2FtZXJhLl9yYXN0ZXJTY2FsZSArIHJhc3RlckluY3JlbWVudCAqIHNjYWxlTGV2ZWwpICkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLl9yYXN0ZXJTY2FsZSA9IHRoaXMuY2FtZXJhLnpvb207XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2NlbmVzLnZpZXcuc3R5bGUud2lsbENoYW5nZSA9ICdhdXRvJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3LnN0eWxlLndpbGxDaGFuZ2UgPSAndHJhbnNmb3JtJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2NlbmUudmlldy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgICAgICAgICAgVHdlZW5MaXRlLnNldCh0aGlzLmNhbWVyYS5zY2VuZXMudmlldywgeyBcbiAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtT3JpZ2luOiB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4ueCArICdweCAnICsgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLnkgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICBzY2FsZVg6IHRoaXMuY2FtZXJhLnpvb20sXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlWTogdGhpcy5jYW1lcmEuem9vbSxcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IC10aGlzLmNhbWVyYS5yb3RhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgeDogLW9mZnNldC54LFxuICAgICAgICAgICAgICAgICAgICB5OiAtb2Zmc2V0LnlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlbmRlciB0aGUgZGltZW5zaW9ucy9zaXplLlxuICAgICpcbiAgICAqIHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlbmRlclNpemUgKCkge1xuICAgICAgICBpZiAodGhpcy5jYW1lcmEudmlldykge1xuICAgICAgICAgICAgVHdlZW5MaXRlLnNldCh0aGlzLmNhbWVyYS52aWV3LCB7IFxuICAgICAgICAgICAgICAgIGNzczogeyBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmNhbWVyYS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLmNhbWVyYS53aWR0aFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDU1NSZW5kZXJlcjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuLyoqXG4qIEdTQVAncyBEcmFnZ2FibGUuXG4qIEBleHRlcm5hbCBEcmFnZ2FibGVcbiogQHNlZSBodHRwOi8vZ3JlZW5zb2NrLmNvbS9kb2NzLyMvSFRNTDUvR1NBUC9VdGlscy9EcmFnZ2FibGUvXG4qL1xuXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5EcmFnQ29udHJvbFxuKiBAY29uc3RydWN0b3JcbiogQHJlcXVpcmVzIHtAbGluayBleHRlcm5hbDpEcmFnZ2FibGV9XG4qIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IHRhcmdldCAtIFRoZSB0YXJnZXQuXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2YgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSBbb3B0aW9ucy5kcmFnUHJveHldIC0gVGhlIGVsZW1lbnQgdGhhdCBjb250cm9scy9pbml0aWF0ZXMgdGhlIGRyYWcgZXZlbnRzLlxuKiBAcGFyYW0ge2Z1bmN0aW9ufSBbb3B0aW9ucy5vbkRyYWddIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZXZlcnkgdGltZSB0aGUgZHJhZyBldmVudCBvY2N1cnMuXG4qIEBwYXJhbSB7YXJyYXl9IFtvcHRpb25zLm9uRHJhZ1BhcmFtc10gLSBUaGUgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBjYWxsYmFjay5cbiogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLm9uRHJhZ1Njb3BlXSAtIFdoYXQgJ3RoaXMnIHJlZmVycyB0byBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlEcmFnQ29udHJvbCA9IG5ldyBPY3Vsby5EcmFnQ29udHJvbCgnI3NjZW5lJywgeyAgXG4qICAgb25EcmFnOiBmdW5jdGlvbiAoKSB7IFxuKiAgICAgY29uc29sZS5sb2coJ2RyYWdnaW5nJyk7IFxuKiAgIH1cbiogfSk7XG4qL1xuY2xhc3MgRHJhZ0NvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yICh0YXJnZXQsIHtcbiAgICAgICAgZHJhZ1Byb3h5ID0gdGFyZ2V0LFxuICAgICAgICBvbkRyYWcgPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgb25EcmFnUGFyYW1zID0gW10sXG4gICAgICAgIG9uRHJhZ1Njb3BlID0gdGhpc1xuICAgIH0gPSB7fSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSB7IGRyYWdQcm94eSwgb25EcmFnLCBvbkRyYWdQYXJhbXMsIG9uRHJhZ1Njb3BlIH07XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge0RyYWdnYWJsZX0gLSBUaGUgb2JqZWN0IHRoYXQgaGFuZGxlcyB0aGUgZHJhZyBiZWhhdmlvci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb250cm9sID0gbmV3IERyYWdnYWJsZSh0YXJnZXQsIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IG9uRHJhZ1Njb3BlLFxuICAgICAgICAgICAgb25EcmFnOiBvbkRyYWcsXG4gICAgICAgICAgICBvbkRyYWdQYXJhbXM6IG9uRHJhZ1BhcmFtcyxcbiAgICAgICAgICAgIHpJbmRleEJvb3N0OiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgZWxlbWVudCB0aGF0IGNvbnRyb2xzL2luaXRpYXRlcyB0aGUgZHJhZyBldmVudHMuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5ID0gVXRpbHMuRE9NLnBhcnNlVmlldyhkcmFnUHJveHkpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZHJhZ2dpbmcgb3Igbm90LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciBpdCBpcyBwcmVzc2VkIG9yIG5vdC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1ByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25EcmFnc3RhcnQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkRyYWdSZWxlYXNlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lbmREcmFnKGV2ZW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uRHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lbmREcmFnKGV2ZW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uRHJhZ01vdmUgPSAoZXZlbnQpID0+IHsgXG4gICAgICAgICAgICBpZiAodGhpcy5pc1ByZXNzZWQgJiYgIXRoaXMuaXNEcmFnZ2luZykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbC5zdGFydERyYWcoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9lbmREcmFnID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cm9sLmVuZERyYWcoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5fb25EcmFnTGVhdmUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uRHJhZ01vdmUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLl9vbkRyYWdNb3ZlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25QcmVzcyA9IChldmVudCkgPT4geyBcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLl9vbkRyYWdMZWF2ZSk7XG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbkRyYWdNb3ZlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5fb25EcmFnTW92ZSk7XG4gICAgICAgICAgICB0aGlzLmlzUHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblJlbGVhc2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlbGVhc2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uTGVhdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlbGVhc2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX3JlbGVhc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlzUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmFibGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGl0IGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgZW5hYmxlZCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wuZW5hYmxlZCgpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIFRoZSBsYXN0IHBvaW50ZXIgZXZlbnQgdGhhdCBhZmZlY3RlZCB0aGUgaW5zdGFuY2UuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBwb2ludGVyRXZlbnQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnBvaW50ZXJFdmVudDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgeCBwb3NpdGlvbiBvZiB0aGUgbGFzdCBwb2ludGVyIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgcG9pbnRlclggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnBvaW50ZXJYO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB5IHBvc2l0aW9uIG9mIHRoZSBsYXN0IHBvaW50ZXIgZXZlbnQgdGhhdCBhZmZlY3RlZCB0aGUgaW5zdGFuY2UuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBwb2ludGVyWSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wucG9pbnRlclk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSB0YXJnZXQuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB0YXJnZXQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnRhcmdldDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgY3VycmVudCB4IHBvc2l0aW9uLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgeCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wueDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgY3VycmVudCB5IHBvc2l0aW9uLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgeSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wueTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgY29udHJvbCBhbmQgcHJlcGFyZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2wua2lsbCgpO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHt9O1xuICAgICAgICB0aGlzLmRyYWdQcm94eSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyB0aGUgY29udHJvbC5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGlzYWJsZSAoKSB7XG4gICAgICAgIHRoaXMuY29udHJvbC5kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuX29uRHJhZ3N0YXJ0KTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25QcmVzcyk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5fb25MZWF2ZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblByZXNzKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnN0eWxlLmN1cnNvciA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRW5hYmxlcyB0aGUgY29udHJvbC5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlICgpIHtcbiAgICAgICAgdGhpcy5jb250cm9sLmVuYWJsZSgpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLl9vbkRyYWdzdGFydCk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uUHJlc3MpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuX29uTGVhdmUpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fb25QcmVzcyk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5zdHlsZS5jdXJzb3IgPSAnbW92ZSc7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFVwZGF0ZXMgdGhlIGNvbnRyb2wncyB4IGFuZCB5IHByb3BlcnRpZXMgdG8gcmVmbGVjdCB0aGUgdGFyZ2V0J3MgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHVwZGF0ZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wudXBkYXRlKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBEcmFnQ29udHJvbDsiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBBIGNvbGxlY3Rpb24gb2YgdXNlZnVsIG1hdGhlbWF0aWNhbCB2YWx1ZXMgYW5kIGZ1bmN0aW9ucy5cbipcbiogQG5hbWVzcGFjZSBPY3Vsby5NYXRoXG4qL1xuY29uc3QgX01hdGggPSB7XG4gICAgLyoqXG4gICAgKiBDb252ZXJ0IGRlZ3JlZXMgdG8gcmFkaWFucy5cbiAgICAqXG4gICAgKiBAZnVuY3Rpb24gT2N1bG8uTWF0aCNkZWdUb1JhZFxuICAgICogQHBhcmFtIHtudW1iZXJ9IGRlZ3JlZXMgLSBUaGUgZGVncmVlcyB2YWx1ZS5cbiAgICAqIEByZXR1cm4ge251bWJlcn0gLSBUaGUgdmFsdWUgaW4gcmFkaWFucy5cbiAgICAqL1xuICAgIGRlZ1RvUmFkOiAoZGVncmVlcykgPT4ge1xuICAgICAgICByZXR1cm4gZGVncmVlcyAqIF9NYXRoLmRlZ1RvUmFkRmFjdG9yO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAqIENvbnZlcnQgcmFkaWFucyB0byBkZWdyZWVzLlxuICAgICpcbiAgICAqIEBmdW5jdGlvbiBPY3Vsby5NYXRoI3JhZFRvRGVnXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcmFkaWFucyAtIFRoZSByYWRpYW5zIHZhbHVlLlxuICAgICogQHJldHVybiB7bnVtYmVyfSAtIFRoZSB2YWx1ZSBpbiBkZWdyZWVzLlxuICAgICovXG4gICAgcmFkVG9EZWc6IChyYWRpYW5zKSA9PiB7XG4gICAgICAgIHJldHVybiByYWRpYW5zICogX01hdGgucmFkVG9EZWdGYWN0b3I7XG4gICAgfVxufTtcblxuLyoqXG4qIFRoZSBmYWN0b3IgdXNlZCB0byBjb252ZXJ0IGRlZ3JlZXMgdG8gcmFkaWFucy5cbipcbiogQG5hbWUgT2N1bG8uTWF0aCNkZWdUb1JhZEZhY3RvclxuKiBAcHJvcGVydHkge251bWJlcn1cbiogQHN0YXRpY1xuKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShfTWF0aCwgJ2RlZ1RvUmFkRmFjdG9yJywge1xuICAgIHZhbHVlOiBNYXRoLlBJIC8gMTgwXG59KTtcblxuLyoqXG4qIFRoZSBmYWN0b3IgdXNlZCB0byBjb252ZXJ0IHJhZGlhbnMgdG8gZGVncmVlcy5cbipcbiogQG5hbWUgT2N1bG8uTWF0aCNyYWRUb0RlZ0ZhY3RvclxuKiBAcHJvcGVydHkge251bWJlcn1cbiogQHN0YXRpY1xuKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShfTWF0aCwgJ3JhZFRvRGVnRmFjdG9yJywge1xuICAgIHZhbHVlOiAxODAgLyBNYXRoLlBJXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgX01hdGg7IiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgaXNBcnJheUxpa2UgZnJvbSAnbG9kYXNoL2lzQXJyYXlMaWtlJztcblxuLyoqXG4qIENyZWF0ZSAyeDIgbWF0cml4IGZyb20gYSBzZXJpZXMgb2YgdmFsdWVzLlxuKiBcbiogUmVwcmVzZW50ZWQgbGlrZTpcbiogXG4qIHwgZTExIHwgZTEyIHxcbiogfCBlMjEgfCBlMjIgfFxuKlxuKiBAY2xhc3MgT2N1bG8uTWF0cml4MlxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtudW1iZXJ9IGUxMT0xIC0gVGhlIHZhbHVlIG9mIHJvdyAxLCBjb2x1bW4gMVxuKiBAcGFyYW0ge251bWJlcn0gZTEyPTAgLSBUaGUgdmFsdWUgb2Ygcm93IDEsIGNvbHVtbiAyXG4qIEBwYXJhbSB7bnVtYmVyfSBlMjE9MCAtIFRoZSB2YWx1ZSBvZiByb3cgMiwgY29sdW1uIDFcbiogQHBhcmFtIHtudW1iZXJ9IGUyMj0xIC0gVGhlIHZhbHVlIG9mIHJvdyAyLCBjb2x1bW4gMlxuKi9cbmNsYXNzIE1hdHJpeDIge1xuICAgIGNvbnN0cnVjdG9yIChlMTEsIGUxMiwgZTIxLCBlMjIpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGUxMVxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZTExID0gMTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlMTJcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmUxMiA9IDA7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gZTIxXG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lMjEgPSAwO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGUyMlxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZTIyID0gMTtcbiAgICAgICAgXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICB0aGlzLnNldChlMTEsIGUxMiwgZTIxLCBlMjIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQXJyYXlMaWtlKGUxMSkgJiYgZTExLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgdGhpcy5zZXRGcm9tQXJyYXkoZTExKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsb25lcyB0aGUgbWF0cml4LlxuICAgICoge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4IHRvIGNsb25lLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgaWRlbnRpY2FsIG1hdHJpeC5cbiAgICAqL1xuICAgIHN0YXRpYyBjbG9uZSAobSkge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDIoTWF0cml4Mi50b0FycmF5KG0pKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbG9uZXMgdGhlIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IGlkZW50aWNhbCBtYXRyaXguXG4gICAgKi9cbiAgICBjbG9uZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmNsb25lKHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENvcGllcyB0aGUgdmFsdWVzIGZyb20gdGhlIHByb3ZpZGVkIG1hdHJpeCBpbnRvIHRoaXMgbWF0cml4LlxuICAgICoge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4IHRvIGNvcHkuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBjb3B5IChtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldChtLmUxMSwgbS5lMTIsIG0uZTIxLCBtLmUyMik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgZGV0ZXJtaW5hbnQuXG4gICAgKiB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXggdG8gZ2V0IHRoZSBkZXRlcm1pbmFudC5cbiAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGRldGVybWluYW50LlxuICAgICovXG4gICAgc3RhdGljIGdldERldGVybWluYW50IChtKSB7XG4gICAgICAgIHJldHVybiBtLmUxMSAqIG0uZTIyIC0gbS5lMTIgKiBtLmUyMTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBkZXRlcm1pbmFudC5cbiAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGRldGVybWluYW50LlxuICAgICovXG4gICAgZ2V0RGV0ZXJtaW5hbnQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXREZXRlcm1pbmFudCh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBpbnZlcnNlLlxuICAgICoge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4IHRvIGdldCB0aGUgaW52ZXJzZS5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IFRoZSBpbnZlcnNlIG1hdHJpeC5cbiAgICAqL1xuICAgIHN0YXRpYyBnZXRJbnZlcnNlIChtKSB7XG4gICAgICAgIHJldHVybiBNYXRyaXgyLm11bHRpcGx5U2NhbGFyKG5ldyBNYXRyaXgyKG0uZTIyLCAtbS5lMTIsIC1tLmUyMSwgbS5lMTEpLCAxIC8gTWF0cml4Mi5nZXREZXRlcm1pbmFudChtKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgaW52ZXJzZS5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IFRoZSBpbnZlcnNlIG1hdHJpeC5cbiAgICAqL1xuICAgIGdldEludmVyc2UgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXRJbnZlcnNlKHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBhIC0gQSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IGIgLSBBbm90aGVyIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IG1hdHJpeCB0aGF0IGlzIHRoZSBwcm9kdWN0IG9mIHRoZSBwcm92aWRlZCBtYXRyaWNlcy5cbiAgICAqLy8qKlxuICAgICogTXVsdGlwbGllcyBhIGxpc3Qgb2YgbWF0cmljZXMuXG4gICAgKiBAcGFyYW0ge0FycmF5fSBtIC0gQSBsaXN0IG9mIG1hdHJpY2VzLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgbWF0cml4IHRoYXQgaXMgdGhlIHByb2R1Y3Qgb2YgdGhlIHByb3ZpZGVkIG1hdHJpY2VzLlxuICAgICovXG4gICAgc3RhdGljIG11bHRpcGx5TWF0cmljZXMgKGEsIGIpIHtcbiAgICAgICAgaWYgKGEuY29scyA9PT0gYi5yb3dzKSB7XG4gICAgICAgICAgICBsZXQgbjExLCBuMTIsIG4yMSwgbjIyO1xuICAgICAgICAgXG4gICAgICAgICAgICBuMTEgPSBhLmUxMSAqIGIuZTExICsgYS5lMTIgKiBiLmUyMTtcbiAgICAgICAgICAgIG4xMiA9IGEuZTExICogYi5lMTIgKyBhLmUxMiAqIGIuZTIyO1xuICAgICAgICAgICAgbjIxID0gYS5lMjEgKiBiLmUxMSArIGEuZTIyICogYi5lMjE7XG4gICAgICAgICAgICBuMjIgPSBhLmUyMSAqIGIuZTEyICsgYS5lMjIgKiBiLmUyMjtcbiAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDIobjExLCBuMTIsIG4yMSwgbjIyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IG11bHRpcGx5IGluY29tcGF0aWJsZSBtYXRyaWNlcycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTXVsdGlwbGllcyB0aGUgbWF0cml4IGJ5IGFub3RoZXIgbWF0cml4LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfE1hdHJpeDJEfSBtIC0gQSBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBtdWx0aXBseU1hdHJpY2VzIChtKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbHMgPT09IG0ucm93cykge1xuICAgICAgICAgICAgbGV0IG4xMSwgbjEyLCBuMjEsIG4yMjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbjExID0gdGhpcy5lMTEgKiBtLmUxMSArIHRoaXMuZTEyICogbS5lMjE7XG4gICAgICAgICAgICBuMTIgPSB0aGlzLmUxMSAqIG0uZTEyICsgdGhpcy5lMTIgKiBtLmUyMjtcbiAgICAgICAgICAgIG4yMSA9IHRoaXMuZTIxICogbS5lMTEgKyB0aGlzLmUyMiAqIG0uZTIxO1xuICAgICAgICAgICAgbjIyID0gdGhpcy5lMjEgKiBtLmUxMiArIHRoaXMuZTIyICogbS5lMjI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuc2V0KG4xMSwgbjEyLCBuMjEsIG4yMik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBtdWx0aXBseSBpbmNvbXBhdGlibGUgbWF0cmljZXMnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTXVsdGlwbGllcyBhIG1hdHJpeCBieSBhIHNjYWxhci5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcyAtIFRoZSBzY2FsYXIuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBzY2FsZWQgbWF0cml4LlxuICAgICovXG4gICAgc3RhdGljIG11bHRpcGx5U2NhbGFyIChtLCBzKSB7XG4gICAgICAgIHZhciBlMTEgPSBtLmUxMSAqIHM7XG4gICAgICAgIHZhciBlMTIgPSBtLmUxMiAqIHM7XG4gICAgICAgIHZhciBlMjEgPSBtLmUyMSAqIHM7XG4gICAgICAgIHZhciBlMjIgPSBtLmUyMiAqIHM7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgyKGUxMSwgZTEyLCBlMjEsIGUyMik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTXVsdGlwbGllcyB0aGUgbWF0cml4IGJ5IGEgc2NhbGFyLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHMgLSBUaGUgc2NhbGFyLlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgbXVsdGlwbHlTY2FsYXIgKHMpIHtcbiAgICAgICAgdGhpcy5lMTEgKj0gcztcbiAgICAgICAgdGhpcy5lMTIgKj0gcztcbiAgICAgICAgdGhpcy5lMjEgKj0gcztcbiAgICAgICAgdGhpcy5lMjIgKj0gcztcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBcHBsaWVzIGEgcm90YXRpb24gdG8gYSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIC0gVGhlIGFuZ2xlIGluIHJhZGlhbnMuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyByb3RhdGVkIG1hdHJpeC5cbiAgICAqL1xuICAgIHN0YXRpYyByb3RhdGUgKG0sIGFuZ2xlKSB7XG4gICAgICAgIHZhciBjb3MgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHZhciBzaW4gPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHZhciByb3RhdGlvbk1hdHJpeCA9IG5ldyBNYXRyaXgyKGNvcywgLXNpbiwgc2luLCBjb3MpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIE1hdHJpeDIubXVsdGlwbHlNYXRyaWNlcyhtLCByb3RhdGlvbk1hdHJpeCk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUm90YXRlcyB0aGUgbWF0cml4LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIC0gVGhlIGFuZ2xlIGluIHJhZGlhbnMuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByb3RhdGUgKGFuZ2xlKSB7XG4gICAgICAgIHZhciBjb3MgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHZhciBzaW4gPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHZhciByb3RhdGlvbk1hdHJpeCA9IG5ldyBNYXRyaXgyKGNvcywgLXNpbiwgc2luLCBjb3MpO1xuICAgICAgICB0aGlzLm11bHRpcGx5TWF0cmljZXMocm90YXRpb25NYXRyaXgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQXBwbGllcyBhIHNjYWxlIHRyYW5zZm9ybWF0aW9uIHRvIGEgbWF0cml4LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIGFtb3VudCB0byBzY2FsZSBvbiB0aGUgWCBheGlzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgYW1vdW50IHRvIHNjYWxlIG9uIHRoZSBZIGF4aXMuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBzY2FsZWQgbWF0cml4LlxuICAgICovXG4gICAgc3RhdGljIHNjYWxlIChtLCB4LCB5KSB7XG4gICAgICAgIHJldHVybiBNYXRyaXgyLm11bHRpcGx5TWF0cmljZXMobSwgbmV3IE1hdHJpeDIoeCwgMCwgMCwgeSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNjYWxlcyB0aGUgbWF0cml4LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgYW1vdW50IHRvIHNjYWxlIG9uIHRoZSBYIGF4aXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSBhbW91bnQgdG8gc2NhbGUgb24gdGhlIFkgYXhpcy5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNjYWxlICh4LCB5KSB7XG4gICAgICAgIHRoaXMubXVsdGlwbHlNYXRyaWNlcyhuZXcgTWF0cml4Mih4LCAwLCAwLCB5KSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBtYXRyaXggdmFsdWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGUxMVxuICAgICogQHBhcmFtIHtudW1iZXJ9IGUxMlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGUyMVxuICAgICogQHBhcmFtIHtudW1iZXJ9IGUyMlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0IChlMTEsIGUxMiwgZTIxLCBlMjIpIHtcbiAgICAgICAgdGhpcy5lMTEgPSBlMTE7XG4gICAgICAgIHRoaXMuZTEyID0gZTEyO1xuICAgICAgICB0aGlzLmUyMSA9IGUyMTtcbiAgICAgICAgdGhpcy5lMjIgPSBlMjI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBtYXRyaXggZnJvbSBhbiBhcnJheS5cbiAgICAqIEBwYXJhbSB7QXJyYXl9IGEgLSBUaGUgYXJyYXkgb2YgbWF0cml4IHZhbHVlcy5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldEZyb21BcnJheSAoYSkge1xuICAgICAgICB0aGlzLnNldChhWzBdLCBhWzFdLCBhWzJdLCBhWzNdKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBtYXRyaXggdG8gdGhlIGlkZW50aXR5LlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0VG9JZGVudGl0eSAoKSB7XG4gICAgICAgIHRoaXMuc2V0KDEsIDAsIDAsIDEpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIG1hdHJpeCBpbnRvIGEgbmV3IGFycmF5LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqL1xuICAgIHN0YXRpYyB0b0FycmF5IChtKSB7XG4gICAgICAgIHZhciBhID0gbmV3IEFycmF5KDQpO1xuICAgICAgICBcbiAgICAgICAgYVswXSA9IG0uZTExO1xuICAgICAgICBhWzFdID0gbS5lMTI7XG4gICAgICAgIGFbMl0gPSBtLmUyMTtcbiAgICAgICAgYVszXSA9IG0uZTIyO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIG1hdHJpeCBpbnRvIGEgbmV3IGFycmF5LlxuICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggdmFsdWVzLlxuICAgICovXG4gICAgdG9BcnJheSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnRvQXJyYXkodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIG1hdHJpeCBpbnRvIGEgbmV3IEZsb2F0MzJBcnJheS5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggdmFsdWVzLlxuICAgICovXG4gICAgc3RhdGljIHRvRmxvYXQzMkFycmF5IChtKSB7XG4gICAgICAgIHZhciBhID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgICAgICAgXG4gICAgICAgIGFbMF0gPSBtLmUxMTtcbiAgICAgICAgYVsxXSA9IG0uZTEyO1xuICAgICAgICBhWzJdID0gbS5lMjE7XG4gICAgICAgIGFbM10gPSBtLmUyMjtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSBtYXRyaXggaW50byBhIG5ldyBGbG9hdDMyQXJyYXkuXG4gICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggdmFsdWVzLlxuICAgICovXG4gICAgdG9GbG9hdDMyQXJyYXkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci50b0Zsb2F0MzJBcnJheSh0aGlzKTtcbiAgICB9XG59XG5cbi8qKlxuKiBUaGUgbnVtYmVyIG9mIGNvbHVtbnMuXG4qIEBuYW1lIE1hdHJpeDIjY29sc1xuKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYXRyaXgyLnByb3RvdHlwZSwgJ2NvbHMnLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogMlxufSk7XG5cbi8qKlxuKiBUaGUgbnVtYmVyIG9mIHJvd3MuXG4qIEBuYW1lIE1hdHJpeDIjcm93c1xuKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYXRyaXgyLnByb3RvdHlwZSwgJ3Jvd3MnLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogMlxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IE1hdHJpeDI7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiogQ3JlYXRlcyBhIDJEIHZlY3RvciBmcm9tIGEgc2VyaWVzIG9mIHZhbHVlcy5cbiogXG4qIEBjbGFzcyBPY3Vsby5WZWN0b3IyXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge251bWJlcn0geD0wIC0gVGhlIHggdmFsdWUuXG4qIEBwYXJhbSB7bnVtYmVyfSB5PTAgLSBUaGUgeSB2YWx1ZS5cbiovXG5jbGFzcyBWZWN0b3IyIHtcbiAgICBjb25zdHJ1Y3RvciAoeCwgeSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeCB2YWx1ZS5cbiAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICovXG4gICAgICAgIHRoaXMueCA9ICh4ICE9PSB1bmRlZmluZWQpID8geCA6IDA7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeSB2YWx1ZS5cbiAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICovXG4gICAgICAgIHRoaXMueSA9ICh5ICE9PSB1bmRlZmluZWQpID8geSA6IDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBBZGRzIHR3byB2ZWN0b3JzLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGIgLSBBbm90aGVyIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHZlY3RvciB0aGF0IGlzIHRoZSBzdW0gb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKi9cbiAgICBzdGF0aWMgYWRkIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMihhLnggKyBiLngsIGEueSArIGIueSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhIHZlY3RvciB0byB0aGUgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgYWRkICh2KSB7XG4gICAgICAgIHRoaXMueCArPSB2Lng7XG4gICAgICAgIHRoaXMueSArPSB2Lnk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xvbmVzIHRoZSB2ZWN0b3IuXG4gICAgKiB7VmVjdG9yMn0gdiAtIFRoZSB2ZWN0b3IgdG8gY2xvbmUuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyBpZGVudGljYWwgdmVjdG9yLlxuICAgICovXG4gICAgc3RhdGljIGNsb25lICh2KSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMih2LngsIHYueSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xvbmVzIHRoZSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyBpZGVudGljYWwgdmVjdG9yLlxuICAgICovXG4gICAgY2xvbmUgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5jbG9uZSh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb3BpZXMgdGhlIHZhbHVlcyBmcm9tIHRoZSBwcm92aWRlZCB2ZWN0b3IgaW50byB0aGlzIHZlY3Rvci5cbiAgICAqIHtWZWN0b3IyfSB2IC0gVGhlIHZlY3RvciB0byBjb3B5LlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgY29weSAodikge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXQodi54LCB2LnkpO1xuICAgIH1cbiAgICAgICAgXG4gICAgLyoqXG4gICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBwcm92aWRlZCB2ZWN0b3JzIGFyZSBlcXVhbC5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYSAtIFRoZSBmaXJzdCB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGIgLSBUaGUgc2Vjb25kIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHZlY3RvcnMgYXJlIGVxdWFsLlxuICAgICovXG4gICAgc3RhdGljIGVxdWFscyAoYSwgYikge1xuICAgICAgICByZXR1cm4gYS54ID09PSBiLnggJiYgYS55ID09PSBiLnk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGV0ZXJtaW5lcyBpZiB0aGUgdmVjdG9yIGVxdWFscyB0aGUgcHJvdmlkZWQgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gVGhlIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHZlY3RvciBlcXVhbHMgdGhlIHByb3ZpZGVkIHZlY3Rvci5cbiAgICAqL1xuICAgIGVxdWFscyAodikge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5lcXVhbHModGhpcywgdik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBUYWtlcyB0aGUgbWF4IG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGIgLSBBbm90aGVyIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHZlY3RvciB0aGF0IGlzIHRoZSBtYXggb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKi9cbiAgICBzdGF0aWMgbWF4IChhLCBiKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMihNYXRoLm1heChhLngsIGIueCksIE1hdGgubWF4KGEueSwgYi55KSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyBpdHNlbGYgdG8gdGhlIG1heCBvZiBpdHNlbGYgYW5kIHRoZSBwcm92aWRlZCB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBtYXggKHYpIHtcbiAgICAgICAgdGhpcy54ID0gTWF0aC5tYXgodGhpcy54LCB2LngpO1xuICAgICAgICB0aGlzLnkgPSBNYXRoLm1heCh0aGlzLnksIHYueSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogVGFrZXMgdGhlIG1pbiBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYSAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gQW5vdGhlciB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgbWluIG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICovXG4gICAgc3RhdGljIG1pbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoTWF0aC5taW4oYS54LCBiLngpLCBNYXRoLm1pbihhLnksIGIueSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgaXRzZWxmIHRvIHRoZSBtaW4gb2YgaXRzZWxmIGFuZCB0aGUgcHJvdmlkZWQgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgbWluICh2KSB7XG4gICAgICAgIHRoaXMueCA9IE1hdGgubWluKHRoaXMueCwgdi54KTtcbiAgICAgICAgdGhpcy55ID0gTWF0aC5taW4odGhpcy55LCB2LnkpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTXVsdGlwbGllcyBhIHZlY3RvciBieSBhIHNjYWxhci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIFRoZSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcyAtIFRoZSBzY2FsYXIuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyBzY2FsZWQgdmVjdG9yLlxuICAgICovXG4gICAgc3RhdGljIG11bHRpcGx5U2NhbGFyICh2LCBzKSB7XG4gICAgICAgIHZhciB4ID0gdi54ICogcztcbiAgICAgICAgdmFyIHkgPSB2LnkgKiBzO1xuXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMih4LCB5KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIHRoZSB2ZWN0b3IgYnkgYSBzY2FsYXIuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcyAtIFRoZSBzY2FsYXIuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgbXVsdGlwbHlTY2FsYXIgKHMpIHtcbiAgICAgICAgdGhpcy54ICo9IHM7XG4gICAgICAgIHRoaXMueSAqPSBzO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZlY3RvciB2YWx1ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSB4IHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSB2YWx1ZS5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBzZXQgKHgsIHkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFN1YnRyYWN0cyB0d28gdmVjdG9ycy5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYSAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gQW5vdGhlciB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgZGlmZmVyZW5jZSBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqL1xuICAgIHN0YXRpYyBzdWJ0cmFjdCAoYSwgYikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoYS54IC0gYi54LCBhLnkgLSBiLnkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFN1YnRyYWN0cyBhIHZlY3RvciBmcm9tIHRoZSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBzdWJ0cmFjdCAodikge1xuICAgICAgICB0aGlzLnggLT0gdi54O1xuICAgICAgICB0aGlzLnkgLT0gdi55O1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSB2ZWN0b3IgaW50byBhIG5ldyBhcnJheS5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIFRoZSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciB2YWx1ZXMuXG4gICAgKi9cbiAgICBzdGF0aWMgdG9BcnJheSAodikge1xuICAgICAgICB2YXIgYSA9IG5ldyBBcnJheSgyKTtcbiAgICAgICAgXG4gICAgICAgIGFbMF0gPSB2Lng7XG4gICAgICAgIGFbMV0gPSB2Lnk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgdmVjdG9yIGludG8gYSBuZXcgYXJyYXkuXG4gICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciB2YWx1ZXMuXG4gICAgKi9cbiAgICB0b0FycmF5ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9BcnJheSh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBUcmFuc2Zvcm1zIGEgdmVjdG9yIHVzaW5nIHRoZSBwcm92aWRlZCBtYXRyaXguXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ8TWF0cml4MkR9IG0gLSBBIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHRyYW5zZm9ybWVkIHZlY3Rvci5cbiAgICAqL1xuICAgIHN0YXRpYyB0cmFuc2Zvcm0gKHYsIG0pIHtcbiAgICAgICAgdmFyIHgxID0gdi54ICogbS5lMTEgKyB2LnkgKiBtLmUxMiArIChtLnR4ID8gbS50eCA6IDApO1xuICAgICAgICB2YXIgeTEgPSB2LnggKiBtLmUyMSArIHYueSAqIG0uZTIyICsgKG0udHkgPyBtLnR5IDogMCk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHgxLCB5MSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogVHJhbnNmb3JtcyB0aGUgdmVjdG9yIHVzaW5nIHRoZSBwcm92aWRlZCBtYXRyaXguXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7TWF0cml4MnxNYXRyaXgyRH0gbSAtIEEgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHRyYW5zZm9ybWVkIHZlY3Rvci5cbiAgICAqL1xuICAgIHRyYW5zZm9ybSAobSkge1xuICAgICAgICB2YXIgeDEgPSB0aGlzLnggKiBtLmUxMSArIHRoaXMueSAqIG0uZTEyICsgKG0udHggPyBtLnR4IDogMCk7XG4gICAgICAgIHZhciB5MSA9IHRoaXMueCAqIG0uZTIxICsgdGhpcy55ICogbS5lMjIgKyAobS50eSA/IG0udHkgOiAwKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5zZXQoeDEsIHkxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFZlY3RvcjI7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiogR1NBUCdzIFRpbWVsaW5lTWF4LlxuKiBAZXh0ZXJuYWwgVGltZWxpbmVNYXhcbiogQHNlZSBodHRwOi8vZ3JlZW5zb2NrLmNvbS9kb2NzLyMvSFRNTDUvR1NBUC9UaW1lbGluZU1heC9cbiovXG5cbi8qKlxuKiBHU0FQJ3MgVHdlZW5NYXguXG4qIEBleHRlcm5hbCBUd2Vlbk1heFxuKiBAc2VlIGh0dHA6Ly9ncmVlbnNvY2suY29tL2RvY3MvIy9IVE1MNS9HU0FQL1R3ZWVuTWF4L1xuKi9cblxuLyoqXG4qIEdTQVAncyBFYXNpbmcuXG4qIEBleHRlcm5hbCBFYXNpbmdcbiogQHNlZSBodHRwOi8vZ3JlZW5zb2NrLmNvbS9kb2NzLyMvSFRNTDUvR1NBUC9FYXNpbmcvXG4qL1xuXG5pbXBvcnQgQW5pbWF0aW9uICAgICBmcm9tICcuL2FuaW1hdGlvbic7XG5pbXBvcnQgQ2FtZXJhICAgICAgICBmcm9tICcuL2NhbWVyYSc7XG5pbXBvcnQgQ1NTUmVuZGVyZXIgICBmcm9tICcuL2Nzc1JlbmRlcmVyJztcbmltcG9ydCBNYXRoICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRoJztcbmltcG9ydCBNYXRyaXgyICAgICAgIGZyb20gJy4vbWF0aC9tYXRyaXgyJztcbmltcG9ydCBTY2VuZSAgICAgICAgIGZyb20gJy4vc2NlbmUnO1xuaW1wb3J0IFV0aWxzICAgICAgICAgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgVmVjdG9yMiAgICAgICBmcm9tICcuL21hdGgvdmVjdG9yMic7XG5cblxuLyoqXG4qIEBuYW1lc3BhY2UgT2N1bG9cbiovXG5jb25zdCBPY3VsbyA9IHtcbiAgICBBbmltYXRpb246IEFuaW1hdGlvbixcbiAgICBDYW1lcmE6IENhbWVyYSxcbiAgICBDU1NSZW5kZXJlcjogQ1NTUmVuZGVyZXIsXG4gICAgTWF0aDogTWF0aCxcbiAgICBNYXRyaXgyOiBNYXRyaXgyLFxuICAgIFNjZW5lOiBTY2VuZSxcbiAgICBVdGlsczogVXRpbHMsXG4gICAgVmVjdG9yMjogVmVjdG9yMlxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBPY3VsbzsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IFV0aWxzICAgICBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBWZWN0b3IyICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG4vKipcbiogQ3JlYXRlcyBhIHNjZW5lLlxuKiBcbiogQGNsYXNzIE9jdWxvLlNjZW5lXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge0NhbWVyYX0gW2NhbWVyYT1udWxsXSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgU2NlbmUuXG4qIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IFt2aWV3PW51bGxdIC0gVGhlIHZpZXcgZm9yIHRoZSBzY2VuZS4gSXQgY2FuIGJlIGEgc2VsZWN0b3Igb3IgYW4gZWxlbWVudC5cbiovXG5jbGFzcyBTY2VuZSB7XG4gICAgY29uc3RydWN0b3IgKGNhbWVyYSA9IG51bGwsIHZpZXcgPSBudWxsKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uQ2FtZXJhfSAtIFRoZSBjYW1lcmEuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSB2aWV3LiBBbiBIVE1MIGVsZW1lbnQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudmlldyA9IFV0aWxzLkRPTS5wYXJzZVZpZXcodmlldyk7XG4gICAgICAgIFxuICAgICAgICAvLyBWaWV3IHNldHVwXG4gICAgICAgIGlmICh0aGlzLnZpZXcgJiYgdGhpcy52aWV3LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMudmlldyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBTY2VuZSN3aWR0aFxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHdpZHRoLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgd2lkdGggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3ID8gdGhpcy52aWV3Lm9mZnNldFdpZHRoIDogMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBuYW1lIFNjZW5lI2hlaWdodFxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGhlaWdodC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IGhlaWdodCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcgPyB0aGlzLnZpZXcub2Zmc2V0SGVpZ2h0IDogMDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBTY2VuZSNzY2FsZWRXaWR0aFxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHNjYWxlZCB3aWR0aC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHNjYWxlZFdpZHRoICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlldyA/IHRoaXMud2lkdGggKiB0aGlzLmNhbWVyYS56b29tIDogdGhpcy53aWR0aDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBTY2VuZSNzY2FsZWRIZWlnaHRcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBzY2FsZWQgaGVpZ2h0LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgc2NhbGVkSGVpZ2h0ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlldyA/IHRoaXMuaGVpZ2h0ICogdGhpcy5jYW1lcmEuem9vbSA6IHRoaXMuaGVpZ2h0O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBzY2VuZSBhbmQgcHJlcGFyZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2NlbmU7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBTY2VuZSAgICBmcm9tICcuL3NjZW5lJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLlNjZW5lTWFuYWdlclxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtPY3Vsby5DYW1lcmF9IGNhbWVyYSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgU2NlbmVNYW5hZ2VyLlxuKiBAcGFyYW0ge2Jvb2xlYW59IFtoYXNWaWV3PXRydWVdIC0gSWYgdHJ1ZSwgYSAnZGl2JyBpcyBjcmVhdGVkIGFuZCBtYW5hZ2VkIGludGVybmFsbHkuIFBhc3MgZmFsc2UgdG8gY3JlYXRlIGEgU2NlbmVNYW5hZ2VyIHdpdGhvdXQgYSB2aWV3LlxuKi9cbmNsYXNzIFNjZW5lTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IgKGNhbWVyYSwgaGFzVmlldyA9IHRydWUpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPY3Vsby5DYW1lcmF9IC0gVGhlIGNhbWVyYSB0aGF0IG93bnMgdGhpcyBTY2VuZU1hbmFnZXIuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPY3Vsby5TY2VuZX0gLSBUaGUgYWN0aXZlIHNjZW5lLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmFjdGl2ZVNjZW5lID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdmlldy4gQW4gSFRNTCBlbGVtZW50LlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnZpZXcgPSAoaGFzVmlldyA9PT0gdHJ1ZSkgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSA6IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gLSBBbiBvYmplY3QgZm9yIHN0b3JpbmcgdGhlIG1hbmFnZWQgU2NlbmUgaW5zdGFuY2VzLlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX3NjZW5lcyA9IHt9O1xuICAgICAgICBcbiAgICAgICAgLy8gVmlldyBzZXR1cFxuICAgICAgICBpZiAodGhpcy52aWV3KSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLndpbGxDaGFuZ2UgPSAndHJhbnNmb3JtJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFkZHMgYSBzY2VuZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIHRvIGdpdmUgdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtPY3Vsby5TY2VuZX0gc2NlbmUgLSBUaGUgc2NlbmUuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgYWRkIChuYW1lLCBzY2VuZSkge1xuICAgICAgICBpZiAodHlwZW9mIHNjZW5lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2NlbmUgPSBuZXcgU2NlbmUodGhpcy5jYW1lcmEsIHNjZW5lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjZW5lLmNhbWVyYSA9IHRoaXMuY2FtZXJhO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zY2VuZXNbbmFtZV0gPSBzY2VuZTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBTY2VuZU1hbmFnZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fc2NlbmVzKSB7XG4gICAgICAgICAgICB0aGlzLl9zY2VuZXNba2V5XS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy5hY3RpdmVTY2VuZSA9IG51bGw7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NjZW5lcyA9IHt9O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyBhIHNjZW5lLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHNjZW5lLlxuICAgICogQHJldHVybnMge09jdWxvLlNjZW5lfSBUaGUgc2NlbmUuXG4gICAgKi9cbiAgICBnZXQgKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NjZW5lc1tuYW1lXTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBhY3RpdmUgc2NlbmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldEFjdGl2ZVNjZW5lIChuYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLnZpZXcgJiYgdGhpcy5hY3RpdmVTY2VuZSAmJiB0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmVDaGlsZCh0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFjdGl2ZVNjZW5lID0gdGhpcy5fc2NlbmVzW25hbWVdO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudmlldykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVTY2VuZS52aWV3LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2NlbmUudmlldy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLndpZHRoID0gdGhpcy5hY3RpdmVTY2VuZS53aWR0aCArICdweCc7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuaGVpZ2h0ID0gdGhpcy5hY3RpdmVTY2VuZS5oZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjZW5lTWFuYWdlcjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IERyYWdDb250cm9sICBmcm9tICcuL2RyYWdDb250cm9sJztcbmltcG9ydCBXaGVlbENvbnRyb2wgZnJvbSAnLi93aGVlbENvbnRyb2wnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uVHJhY2tDb250cm9sXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYS5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZHJhZ2dhYmxlXSAtIFdoZXRoZXIgZHJhZ2dpbmcgaXMgaGFuZGxlZCBvciBub3QuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uRHJhZ10gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSBkcmFnIGV2ZW50IG9jY3Vycy5cbiogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy53aGVlbGFibGVdIC0gV2hldGhlciB3aGVlbGluZyBpcyBoYW5kbGVkIG9yIG5vdC5cbiogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMub25XaGVlbF0gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSB3aGVlbCBldmVudCBvY2N1cnMuXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteVRyYWNrQ29udHJvbCA9IG5ldyBPY3Vsby5UcmFja0NvbnRyb2wobXlDYW1lcmEsIHsgXG4qICAgZHJhZ2dhYmxlOiB0cnVlLCBcbiogICBvbkRyYWc6IGZ1bmN0aW9uICgpIHsgXG4qICAgICBjb25zb2xlLmxvZygnZHJhZ2dpbmcnKTsgXG4qICAgfSwgXG4qICAgd2hlZWxhYmxlOiB0cnVlLCBcbiogICBvbldoZWVsOiBmdW5jdGlvbiAoKSB7IFxuKiAgICAgY29uc29sZS5sb2coJ3doZWVsaW5nJyk7IFxuKiAgIH1cbiogfSk7XG4qL1xuY2xhc3MgVHJhY2tDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhLCB7XG4gICAgICAgIGRyYWdnYWJsZSA9IGZhbHNlLFxuICAgICAgICBvbkRyYWcgPSB1bmRlZmluZWQsXG4gICAgICAgIHdoZWVsYWJsZSA9IGZhbHNlLFxuICAgICAgICBvbldoZWVsID0gdW5kZWZpbmVkXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0geyBkcmFnZ2FibGUsIG9uRHJhZywgd2hlZWxhYmxlLCBvbldoZWVsIH07XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkNhbWVyYX0gLSBUaGUgY2FtZXJhLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGhhbmRsZWQgb3Igbm90LlxuICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNEcmFnZ2FibGUgPSAoZHJhZ2dhYmxlID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RHJhZ2dhYmxlfSAtIFRoZSBkcmFnIGNvbnRyb2wuXG4gICAgICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYWdDb250cm9sID0gIXRoaXMuaXNEcmFnZ2FibGUgPyBudWxsIDogbmV3IERyYWdDb250cm9sKHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3LCB7XG4gICAgICAgICAgICBkcmFnUHJveHk6IHRoaXMuY2FtZXJhLnZpZXcsXG4gICAgICAgICAgICBvbkRyYWc6IG9uRHJhZyxcbiAgICAgICAgICAgIG9uRHJhZ1BhcmFtczogW3RoaXMuY2FtZXJhXSxcbiAgICAgICAgICAgIHpJbmRleEJvb3N0OiBmYWxzZVxuICAgICAgICB9KTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB3aGVlbGluZyBpcyBoYW5kbGVkIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzV2hlZWxhYmxlID0gKHdoZWVsYWJsZSA9PT0gdHJ1ZSkgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1doZWVsQ29udHJvbH0gLSBUaGUgd2hlZWwgY29udHJvbC5cbiAgICAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMud2hlZWxDb250cm9sID0gIXRoaXMuaXNXaGVlbGFibGUgPyBudWxsIDogbmV3IFdoZWVsQ29udHJvbCh0aGlzLmNhbWVyYS52aWV3LCB7XG4gICAgICAgICAgICBvbldoZWVsOiBvbldoZWVsLFxuICAgICAgICAgICAgb25XaGVlbFBhcmFtczogW3RoaXMuY2FtZXJhXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgZHJhZ0VuYWJsZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0RyYWdnYWJsZSA/IHRoaXMuZHJhZ0NvbnRyb2wuZW5hYmxlZCA6IGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHdoZWVsaW5nIGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgd2hlZWxFbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNXaGVlbGFibGUgPyB0aGlzLndoZWVsQ29udHJvbC5lbmFibGVkIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIGNvbnRyb2wgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBpZiAodGhpcy5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5kcmFnQ29udHJvbC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jb25maWcgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIGRyYWdnaW5nLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlRHJhZyAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sLmRpc2FibGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyBkcmFnZ2luZy5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlRHJhZyAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sLmVuYWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgd2hlZWxpbmcuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGVXaGVlbCAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzV2hlZWxhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLndoZWVsQ29udHJvbC5kaXNhYmxlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEVuYWJsZXMgd2hlZWxpbmcuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZVdoZWVsICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmVuYWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUcmFja0NvbnRyb2w7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBpc0VsZW1lbnQgZnJvbSAnbG9kYXNoL2lzRWxlbWVudCc7XG5pbXBvcnQgaXNPYmplY3QgIGZyb20gJ2xvZGFzaC9pc09iamVjdCc7XG5pbXBvcnQgVmVjdG9yMiAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQG5hbWVzcGFjZSBPY3Vsby5VdGlsc1xuKi9cbmNvbnN0IFV0aWxzID0ge1xuICAgIC8qKlxuICAgICogR2V0IHRoZSBDU1MgdHJhbnNmb3JtIHZhbHVlIGZvciBhbiBlbGVtZW50LlxuICAgICpcbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBUaGUgZWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBDU1MgdHJhbnNmb3JtIHZhbHVlLlxuICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKi9cbiAgICBnZXRDc3NUcmFuc2Zvcm06IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBsZXQgdmFsdWUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZ2V0UHJvcGVydHlWYWx1ZSgndHJhbnNmb3JtJyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlICdtYXRyaXgoKScgYW5kIGFsbCB3aGl0ZXNwYWNlLiBUaGVuIHNlcGFyYXRlIGludG8gYW4gYXJyYXkuXG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXlxcdytcXCgvLCcnKS5yZXBsYWNlKC9cXCkkLywnJykucmVwbGFjZSgvXFxzKy9nLCAnJykuc3BsaXQoJywnKTtcblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFRoaXMgc3VwZXIgc2ltcGxpc3RpYyBhbmQgb25seSBoYW5kbGVzIDJEIG1hdHJpY2VzLlxuICAgIGdldFRyYW5zZm9ybU1hdHJpeDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBzdHlsZVZhbHVlID0gdXRpbHMuZ2V0Q3NzVHJhbnNmb3JtKGVsKTtcbiAgICAgICAgdmFyIG1hdHJpeCA9IFtdO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN0eWxlVmFsdWVbMF0gPT09ICdub25lJykge1xuICAgICAgICAgICAgbWF0cml4ID0gWzEsIDAsIDAsIDEsIDAsIDBdXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHlsZVZhbHVlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBtYXRyaXgucHVzaChwYXJzZUZsb2F0KGl0ZW0pKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbWF0cml4O1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUgZm9yIGFuIGVsZW1lbnQuXG4gICAgKlxuICAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIFRoZSBlbGVtZW50IGZvciB3aGljaCB0byBzZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIEFuIG9iamVjdCBvZiBDU1MgdHJhbnNmb3JtIHZhbHVlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NjYWxlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byBib3RoIFggYW5kIFkgYXhlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZVhdIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdzY2FsZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZVldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdzY2FsZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFkgYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5za2V3WF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NrZXcnIGZ1bmN0aW9uIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBYIGF4aXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2tld1ldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdza2V3JyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRyYW5zbGF0ZV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3RyYW5zbGF0ZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gYm90aCBYIGFuZCBZIGF4ZXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudHJhbnNsYXRlWF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3RyYW5zbGF0ZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50cmFuc2xhdGVZXSAtIEEgdmFsaWQgQ1NTIHRyYW5zZm9ybSAndHJhbnNsYXRlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFt0cmFja2VyXSAtIFRoZSBvYmplY3QgdGhhdCBpcyB0cmFja2luZyB0aGUgdHJhbnNpdGlvbi4gJ2lzVHJhbnNpdGlvbmluZycgb24gdGhlIG9iamVjdCB3aWxsIGJlIHNldCB0byAndHJ1ZScuXG4gICAgKiBAcmV0dXJucyB7RWxlbWVudH0gVGhlIGVsZW1lbnQuXG4gICAgKi9cblxuICAgIC8vIFRPRE86IFRoaXMgaXMgYSB2ZXJ5IHNpbXBsaXN0aWMgc29sdXRpb24uXG4gICAgLy8gSWRlYWxseSB3b3VsZCBoYW5kbGUgJ3JvdGF0ZScgb3B0aW9uLlxuICAgIC8vIElkZWFsbHkgd291bGQgaGFuZGxlIDNEIE1hdHJpeC5cbiAgICBzZXRDc3NUcmFuc2Zvcm06IGZ1bmN0aW9uIChlbCwgb3B0aW9ucywgdHJhY2tlcikge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIGxldCB2YWx1ZSA9IHV0aWxzLmdldENzc1RyYW5zZm9ybShlbCk7XG4gICAgICAgIGNvbnN0IENTU19UUkFOU0ZPUk1fS0VZV09SRFMgPSBbJ2luaGVyaXQnLCAnaW5pdGlhbCcsICdub25lJywgJ3Vuc2V0J107XG4gICAgICAgIGNvbnN0IERFRkFVTFRfTUFUUklYXzJEID0gWzEsIDAsIDAsIDEsIDAsIDBdO1xuICAgICAgICBjb25zdCBNQVRSSVhfMkQgPSB7XG4gICAgICAgICAgICBzY2FsZVg6IDAsXG4gICAgICAgICAgICBzY2FsZVk6IDMsXG4gICAgICAgICAgICBza2V3WTogMSxcbiAgICAgICAgICAgIHNrZXdYOiAyLFxuICAgICAgICAgICAgdHJhbnNsYXRlWDogNCxcbiAgICAgICAgICAgIHRyYW5zbGF0ZVk6IDVcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAob3B0aW9ucy5zY2FsZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5zY2FsZVggPSBvcHRpb25zLnNjYWxlWSA9IG9wdGlvbnMuc2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy50cmFuc2xhdGUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMudHJhbnNsYXRlWCA9IG9wdGlvbnMudHJhbnNsYXRlWSA9IG9wdGlvbnMudHJhbnNsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHRyYW5zZm9ybSB2YWx1ZSBpcyBhIGtleXdvcmQsIHVzZSBhIGRlZmF1bHQgbWF0cml4LlxuICAgICAgICBpZiAoQ1NTX1RSQU5TRk9STV9LRVlXT1JEUy5pbmRleE9mKHZhbHVlWzBdKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBERUZBVUxUX01BVFJJWF8yRDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIE1BVFJJWF8yRCkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNba2V5XSkge1xuICAgICAgICAgICAgICAgIGlmIChfLmlzRmluaXRlKG9wdGlvbnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVbTUFUUklYXzJEW2tleV1dID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGFuIGludmFsaWQgQ1NTIG1hdHJpeCB2YWx1ZScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBlbC5zdHlsZS50cmFuc2Zvcm0gPSAnbWF0cml4KCcgKyB2YWx1ZS5qb2luKCcsICcpICsgJyknO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRyYWNrZXIpIHtcbiAgICAgICAgICAgIHRyYWNrZXIuaXNUcmFuc2l0aW9uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gSWYgdHJhbnNpdGlvbiBkdXJhdGlvbiBpcyAwLCAndHJhbnNpdGlvbmVuZCcgZXZlbnQgd2hpY2ggaGFuZGxlcyAnaXNUcmFuc2l0aW9uaW5nJyB3aWxsIG5vdCBmaXJlLlxuICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoJ3RyYW5zaXRpb24tZHVyYXRpb24nKSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0cmFja2VyLmlzVHJhbnNpdGlvbmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAqIFNldCB0aGUgQ1NTIHRyYW5zaXRpb24gcHJvcGVydGllcyBmb3IgYW4gZWxlbWVudC5cbiAgICAqXG4gICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gVGhlIGVsZW1lbnQgZm9yIHdoaWNoIHRvIHNldCB0aGUgQ1NTIHRyYW5zaXRpb24gcHJvcGVydGllcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIC0gQSBjYW1lcmEge0BsaW5rIENhbWVyYU1vZGVsLmRlZmF1bHRzLnRyYW5zaXRpb258dHJhbnNpdGlvbn0gb2JqZWN0LlxuICAgICogQHJldHVybnMge0VsZW1lbnR9IFRoZSBlbGVtZW50LlxuICAgICovXG4gICAgc2V0Q3NzVHJhbnNpdGlvbjogZnVuY3Rpb24gKGVsLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgbGV0IGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzID0ge1xuICAgICAgICAgICAgdHJhbnNpdGlvbkRlbGF5OiBwcm9wZXJ0aWVzLmRlbGF5IHx8ICcwcycsXG4gICAgICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IHByb3BlcnRpZXMuZHVyYXRpb24gfHwgJzBzJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogcHJvcGVydGllcy5wcm9wZXJ0eSB8fCAnYWxsJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogcHJvcGVydGllcy50aW1pbmdGdW5jdGlvbiB8fCAnZWFzZSdcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjc3NUcmFuc2l0aW9uUHJvcGVydGllcykge1xuICAgICAgICAgICAgZWwuc3R5bGVba2V5XSA9IGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogVGhyb3R0bGluZyB1c2luZyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuXG4gICAgKlxuICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gdGhyb3R0bGVkIHRvIHRoZSBuZXh0IEFuaW1hdGlvbiBGcmFtZS5cbiAgICAqL1xuICAgIHRocm90dGxlVG9GcmFtZTogZnVuY3Rpb24gKGZ1bmMpIHtcbiAgICAgICAgbGV0IF90aGlzLCBhcmdzO1xuICAgICAgICBsZXQgaXNQcm9jZXNzaW5nID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgICAgICAgIGlmICghaXNQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24odGltZXN0YW1wKSB7XG4gICAgICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoYXJncywgdGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pOyAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2UgdGhlIHBvc2l0aW9uIG9mIHRoZSBnaXZlbiBpbnB1dCB3aXRoaW4gdGhlIHdvcmxkLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW2lucHV0XSAtIFRoZSBpbnB1dCB0byBwYXJzZS5cbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gd29ybGQgLSBUaGUgd29ybGQuXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgcGFyc2VkIHBvc2l0aW9uIGFzIGFuIHgveSBwb3NpdGlvbiBvYmplY3QuXG4gICAgKi9cbiAgICBwYXJzZVBvc2l0aW9uOiBmdW5jdGlvbiAoaW5wdXQsIHdvcmxkKSB7XG4gICAgICAgIHZhciBvYmplY3RQb3NpdGlvbjtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaXNFbGVtZW50KGlucHV0KSkge1xuICAgICAgICAgICAgb2JqZWN0UG9zaXRpb24gPSBVdGlscy5ET00uZ2V0T2JqZWN0V29ybGRQb3NpdGlvbihpbnB1dCwgd29ybGQpO1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgVmVjdG9yMihvYmplY3RQb3NpdGlvbi54LCBvYmplY3RQb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc09iamVjdChpbnB1dCkpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gbmV3IFZlY3RvcjIoaW5wdXQueCwgaW5wdXQueSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG59O1xuXG5VdGlscy5ET00gPSB7XG4gICAgLyoqXG4gICAgKiBHZXQgYW4gb2JqZWN0J3MgcG9zaXRpb24gaW4gdGhlIHdvcmxkLlxuICAgICpcbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gb2JqZWN0IC0gVGhlIG9iamVjdC5cbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gd29ybGQgLSBUaGUgd29ybGQuXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIG9iamVjdCdzIHBvc2l0aW9uLlxuICAgICovXG4gICAgZ2V0T2JqZWN0V29ybGRQb3NpdGlvbjogZnVuY3Rpb24gKG9iamVjdCwgd29ybGQpIHtcbiAgICAgICAgdmFyIHggPSAob2JqZWN0Lm9mZnNldFdpZHRoIC8gMikgKyBvYmplY3Qub2Zmc2V0TGVmdCAtIHdvcmxkLm9mZnNldExlZnQ7XG4gICAgICAgIHZhciB5ID0gKG9iamVjdC5vZmZzZXRIZWlnaHQgLyAyKSArIG9iamVjdC5vZmZzZXRUb3AgLSB3b3JsZC5vZmZzZXRUb3A7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHgsIHkpO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZSBhIHZpZXcgcGFyYW1ldGVyLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IGlucHV0IC0gVGhlIHZpZXcgcGFyYW1ldGVyLlxuICAgICogQHJldHVybnMge0VsZW1lbnR9IFRoZSB2aWV3LlxuICAgICovXG4gICAgcGFyc2VWaWV3OiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgdmFyIG91dHB1dCA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgb3V0cHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNFbGVtZW50KGlucHV0KSkge1xuICAgICAgICAgICAgb3V0cHV0ID0gaW5wdXQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxufTtcblxuVXRpbHMuVGltZSA9IHtcbiAgICAvKipcbiAgICAqIEdldHMgYSB0aW1lIGR1cmF0aW9uIGdpdmVuIEZQUyBhbmQgdGhlIGRlc2lyZWQgdW5pdC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBmcHMgLSBUaGUgZnJhbWVzIHBlciBzZWNvbmQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gdW5pdCAtIFRoZSB1bml0IG9mIHRpbWUuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gVGhlIGR1cmF0aW9uLlxuICAgICovXG4gICAgZ2V0RlBTRHVyYXRpb246IChmcHMsIHVuaXQpID0+IHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodW5pdCkge1xuICAgICAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPSAoMTAwMCAvIGZwcykgLyAxMDAwO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbXMnOlxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gMTAwMCAvIGZwcztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGR1cmF0aW9uO1xuICAgIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFV0aWxzOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgdGhyb3R0bGUgZnJvbSAnbG9kYXNoL3Rocm90dGxlJztcbmltcG9ydCBVdGlscyAgICBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLldoZWVsQ29udHJvbFxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gdGFyZ2V0IC0gVGhlIHRhcmdldC5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uV2hlZWxdIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZXZlcnkgdGltZSB0aGUgd2hlZWwgZXZlbnQgb2NjdXJzLlxuKiBAcGFyYW0ge2FycmF5fSBbb3B0aW9ucy5vbldoZWVsUGFyYW1zXSAtIFRoZSBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIGNhbGxiYWNrLlxuKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMub25XaGVlbFNjb3BlXSAtIFdoYXQgJ3RoaXMnIHJlZmVycyB0byBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlXaGVlbENvbnRyb2wgPSBuZXcgT2N1bG8uV2hlZWxDb250cm9sKCcjY2FtZXJhJywgeyAgXG4qICAgb25XaGVlbDogZnVuY3Rpb24gKCkgeyBcbiogICAgIGNvbnNvbGUubG9nKCd3aGVlbGluZycpOyBcbiogICB9XG4qIH0pO1xuKi9cbmNsYXNzIFdoZWVsQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IgKHRhcmdldCwge1xuICAgICAgICBvbldoZWVsID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG9uV2hlZWxQYXJhbXMgPSBbXSxcbiAgICAgICAgb25XaGVlbFNjb3BlID0gdGhpc1xuICAgIH0gPSB7fSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSB7IG9uV2hlZWwsIG9uV2hlZWxQYXJhbXMsIG9uV2hlZWxTY29wZSB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdGFyZ2V0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRhcmdldCA9IFV0aWxzLkRPTS5wYXJzZVZpZXcodGFyZ2V0KTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7V2hlZWxFdmVudH0gLSBUaGUgbGFzdCB3aGVlbCBldmVudCB0aGF0IGFmZmVjdGVkIHRoZSBpbnN0YW5jZS5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aGVlbEV2ZW50ID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1doZWVsRXZlbnR9IC0gVGhlIHByZXZpb3VzIHdoZWVsIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnByZXZpb3VzV2hlZWxFdmVudCA9IHt9O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgdGhyb3R0bGVkIHdoZWVsIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fdGhyb3R0bGVkT25XaGVlbCA9IHRocm90dGxlKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1doZWVsRXZlbnQgPSB0aGlzLndoZWVsRXZlbnQ7XG4gICAgICAgICAgICB0aGlzLndoZWVsRXZlbnQgPSBldmVudDtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uV2hlZWwuYXBwbHkodGhpcy5jb25maWcub25XaGVlbFNjb3BlLCB0aGlzLmNvbmZpZy5vbldoZWVsUGFyYW1zKTtcbiAgICAgICAgfSwgVXRpbHMuVGltZS5nZXRGUFNEdXJhdGlvbigzMCwgJ21zJykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB3aGVlbCBldmVudCBoYW5kbGVyLlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uV2hlZWwgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuX3Rocm90dGxlZE9uV2hlZWwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmFibGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGl0IGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgKi9cbiAgICBnZXQgZW5hYmxlZCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmFibGVkO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBjb250cm9sIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0ge307XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIHRoZSBjb250cm9sLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlICgpIHtcbiAgICAgICAgdGhpcy50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLl9vbldoZWVsKTtcbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEVuYWJsZXMgdGhlIGNvbnRyb2wuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZSAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5fb25XaGVlbCk7XG4gICAgICAgIHRoaXMuX2VuYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgV2hlZWxDb250cm9sOyJdfQ==

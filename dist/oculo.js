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
            this.camera.isAnimating = true;

            if (this.camera.isDraggable) {
                this.camera.trackControl.disableDrag();
            }

            if (this.camera.isManualZoomable) {
                this.camera.trackControl.disableWheel();
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
            this.camera.isAnimating = false;

            if (this.camera.isDraggable) {
                this.camera.trackControl.enableDrag();
            }

            if (this.camera.isManualZoomable) {
                this.camera.trackControl.enableWheel();
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
                data: {
                    onStart: options.onStart,
                    onUpdate: options.onUpdate,
                    onComplete: options.onComplete,
                    onReverseComplete: options.onReverseComplete
                },
                callbackScope: this,
                onStartParams: ['{self}'],
                onStart: function onStart(self) {
                    this.currentKeyframe = self;
                    if (self.data.onStart !== undefined) {
                        self.data.onStart.apply(this, self.data.onStartParams);
                    }
                },
                onUpdateParams: ['{self}'],
                onUpdate: function onUpdate(self) {
                    if (self.data.onUpdate !== undefined) {
                        self.data.onUpdate.apply(this, self.data.onUpdateParams);
                    }
                },
                onCompleteParams: ['{self}'],
                onComplete: function onComplete(self) {
                    if (self.data.onComplete !== undefined) {
                        self.data.onComplete.apply(this, self.data.onCompleteParams);
                    }
                },
                onReverseCompleteParams: ['{self}'],
                onReverseComplete: function onReverseComplete(self) {
                    if (self.data.onReverseComplete !== undefined) {
                        self.data.onReverseComplete.apply(this, self.data.onReverseCompleteParams);
                    }
                }
            });
            var shakeTimeline = null;
            var shake = this._parseShake(props.shake);

            delete options.onStart;
            delete options.onUpdate;
            delete options.onComplete;
            delete options.onReverseComplete;

            // Tween core camera properties
            if (props.origin || props.position || props.rotation || props.zoom) {
                var coreTween = TweenMax.to(this.camera, duration !== 0 ? duration : 0.016, Object.assign({}, options, {
                    rawOffsetX: 0,
                    rawOffsetY: 0,
                    rotation: 0,
                    zoom: 0,
                    immediateRender: false,
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        var zDirection = _constants.zoomDirection.NONE;

                        if (self.props.to.zoom > this.camera.zoom) {
                            zDirection = _constants.zoomDirection.IN;
                        } else if (self.props.to.zoom < this.camera.zoom) {
                            zDirection = _constants.zoomDirection.OUT;
                        }

                        this.camera.zoomDirection = zDirection;

                        // Origin must be set in case animation was reversed (origin was reverted)
                        this.camera.setTransformOrigin(self.props.end.origin);
                        self.timeline.core = self;

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
                    },
                    onReverseCompleteParams: ['{self}'],
                    onReverseComplete: function onReverseComplete(self) {
                        this.camera.setTransformOrigin(self.props.start.origin);
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

                // Origin must be updated before tween starts
                this.camera.setTransformOrigin(toProps.origin);
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
            this.camera.isAnimating = true;

            if (this.camera.isDraggable) {
                this.camera.trackControl.disableDrag();
            }

            if (this.camera.isManualZoomable) {
                this.camera.trackControl.disableWheel();
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
            this.camera.isAnimating = false;

            if (this.camera.isDraggable) {
                this.camera.trackControl.enableDrag();
            }

            if (this.camera.isManualZoomable) {
                this.camera.trackControl.enableWheel();
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
                data: {
                    onStart: options.onStart,
                    onUpdate: options.onUpdate,
                    onComplete: options.onComplete,
                    onReverseComplete: options.onReverseComplete
                },
                callbackScope: this,
                onStartParams: ['{self}'],
                onStart: function onStart(self) {
                    this.currentKeyframe = self;
                    if (self.data.onStart !== undefined) {
                        self.data.onStart.apply(this, self.data.onStartParams);
                    }
                },
                onUpdateParams: ['{self}'],
                onUpdate: function onUpdate(self) {
                    if (self.data.onUpdate !== undefined) {
                        self.data.onUpdate.apply(this, self.data.onUpdateParams);
                    }
                },
                onCompleteParams: ['{self}'],
                onComplete: function onComplete(self) {
                    if (self.data.onComplete !== undefined) {
                        self.data.onComplete.apply(this, self.data.onCompleteParams);
                    }
                },
                onReverseCompleteParams: ['{self}'],
                onReverseComplete: function onReverseComplete(self) {
                    if (self.data.onReverseComplete !== undefined) {
                        self.data.onReverseComplete.apply(this, self.data.onReverseCompleteParams);
                    }
                }
            });
            var shakeTimeline = null;
            var shake = this._parseShake(props.shake);

            delete options.onStart;
            delete options.onUpdate;
            delete options.onComplete;
            delete options.onReverseComplete;

            // Tween core camera properties
            if (props.origin || props.position || props.rotation || props.zoom) {
                var coreTween = TweenMax.to(this.camera, duration !== 0 ? duration : 0.016, Object.assign({}, options, {
                    rawOffsetX: 0,
                    rawOffsetY: 0,
                    rotation: 0,
                    zoom: 0,
                    immediateRender: false,
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        var zDirection = _constants.zoomDirection.NONE;

                        if (self.props.to.zoom > this.camera.zoom) {
                            zDirection = _constants.zoomDirection.IN;
                        } else if (self.props.to.zoom < this.camera.zoom) {
                            zDirection = _constants.zoomDirection.OUT;
                        }

                        this.camera.zoomDirection = zDirection;

                        // Origin must be set in case animation was reversed (origin was reverted)
                        this.camera.setTransformOrigin(self.props.end.origin);
                        self.timeline.core = self;

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
                    },
                    onReverseCompleteParams: ['{self}'],
                    onReverseComplete: function onReverseComplete(self) {
                        this.camera.setTransformOrigin(self.props.start.origin);
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

                // Origin must be updated before tween starts
                this.camera.setTransformOrigin(toProps.origin);
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
// 2) Ensure directional rotation plugin works
// 3) Make sure keyframe callbacks work so that camera.shake() can execute "onComplete", etc.

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
        * @property {boolean} - Whether the camera is animating or not.
        * @readonly
        * @default
        */
        this.isAnimating = false;

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

                if (!this.isAnimating) {
                    this.setRawPosition(this._convertOffsetToPosition(this.rawOffset, this.center, this.transformOrigin, this.transformation));
                }

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
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this, options).moveTo(position, duration));
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
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this, options).rotateAt(origin, rotation, duration));
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
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this, options).rotateTo(rotation, duration));
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
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this, options).zoomAt(origin, zoom, duration));
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
            this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this, options).zoomTo(zoom, duration));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZiZW1pdHRlci9saWIvQmFzZUV2ZW50RW1pdHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0VtaXR0ZXJTdWJzY3JpcHRpb24uanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2xpYi9FdmVudFN1YnNjcmlwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZianMvbGliL2VtcHR5RnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvZmJqcy9saWIvaW52YXJpYW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fU3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYXJyYXlNYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlQ2xhbXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlR2V0VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZVRvU3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fY3JlYXRlUm91bmQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19mcmVlR2xvYmFsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UHJvdG90eXBlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UmF3VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fb2JqZWN0VG9TdHJpbmcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19vdmVyQXJnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fcm9vdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY2xhbXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNFbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0Zpbml0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNMZW5ndGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzTmlsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1BsYWluT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1N5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbm93LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9yb3VuZC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3RvRmluaXRlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b0ludGVnZXIuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3RvTnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmMvc2NyaXB0cy9BbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb25NYW5hZ2VyLmpzIiwic3JjL3NjcmlwdHMvY2FtZXJhLmpzIiwic3JjL3NjcmlwdHMvY29uc3RhbnRzLmpzIiwic3JjL3NjcmlwdHMvY3NzUmVuZGVyZXIuanMiLCJzcmMvc2NyaXB0cy9kcmFnQ29udHJvbC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0aC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0cml4Mi5qcyIsInNyYy9zY3JpcHRzL21hdGgvdmVjdG9yMi5qcyIsInNyYy9zY3JpcHRzL29jdWxvLmpzIiwic3JjL3NjcmlwdHMvc2NlbmUuanMiLCJzcmMvc2NyaXB0cy9zY2VuZU1hbmFnZXIuanMiLCJzcmMvc2NyaXB0cy90cmFja0NvbnRyb2wuanMiLCJzcmMvc2NyaXB0cy91dGlscy5qcyIsInNyYy9zY3JpcHRzL3doZWVsQ29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFNQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUVBLElBQU0sWUFBWTtBQUNkLFVBQU07QUFDRixjQUFNO0FBREo7QUFEUSxDQUFsQjs7QUFNQTs7Ozs7Ozs7Ozs7Ozs7OztJQWVNLFM7OztBQUNGLHVCQUFhLE1BQWIsRUFBcUIsT0FBckIsRUFBOEI7QUFBQTs7QUFDMUIsa0JBQVUsT0FBTyxNQUFQLENBQWM7QUFDcEIsb0JBQVE7QUFEWSxTQUFkLEVBRVAsT0FGTyxDQUFWOztBQU1BOzs7O0FBUDBCLDBIQUtwQixPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLE9BQWxCLENBTG9COztBQVcxQixjQUFLLE1BQUwsR0FBYyxPQUFkOztBQUVBOzs7O0FBSUEsY0FBSyxJQUFMLEdBQVksZ0JBQUssU0FBakI7O0FBRUE7OztBQUdBLGNBQUssTUFBTCxHQUFjLFVBQVUsSUFBeEI7O0FBRUE7OztBQUdBLGNBQUssVUFBTCxHQUFrQixFQUFsQjs7QUFFQTs7O0FBR0EsY0FBSyxlQUFMLEdBQXVCLElBQXZCOztBQUVBOzs7QUFHQSxjQUFLLGlCQUFMLEdBQXlCLFFBQVEsaUJBQVIsR0FBNEIsSUFBNUIsR0FBbUMsS0FBNUQ7O0FBRUE7OztBQUdBLGNBQUssYUFBTCxHQUFxQixFQUFyQjs7QUFFQTs7Ozs7QUFLQSxjQUFLLFFBQUwsR0FBZ0IsWUFBWTtBQUN4QixpQkFBSyxjQUFMLENBQW9CLEtBQUssVUFBTCxDQUFnQixDQUFoQixDQUFwQjtBQUNBLGlCQUFLLE1BQUwsQ0FBWSxXQUFaLEdBQTBCLElBQTFCOztBQUVBLGdCQUFJLEtBQUssTUFBTCxDQUFZLFdBQWhCLEVBQTZCO0FBQ3pCLHFCQUFLLE1BQUwsQ0FBWSxZQUFaLENBQXlCLFdBQXpCO0FBQ0g7O0FBRUQsZ0JBQUksS0FBSyxNQUFMLENBQVksZ0JBQWhCLEVBQWtDO0FBQzlCLHFCQUFLLE1BQUwsQ0FBWSxZQUFaLENBQXlCLFlBQXpCO0FBQ0g7O0FBRUQsZ0JBQUksS0FBSyxNQUFMLENBQVksT0FBWixLQUF3QixTQUE1QixFQUF1QztBQUNuQyxxQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQixLQUFwQixDQUEwQixJQUExQixFQUFnQyxLQUFLLE1BQUwsQ0FBWSxhQUE1QztBQUNIO0FBQ0Q7QUFDQSxvQkFBUSxHQUFSLENBQVksbUJBQVo7QUFDSCxTQWpCRDs7QUFtQkE7Ozs7O0FBS0EsY0FBSyxTQUFMLEdBQWlCLFlBQVk7QUFDekIsZ0JBQUksS0FBSyxNQUFMLENBQVksUUFBWixLQUF5QixTQUE3QixFQUF3QztBQUNwQyxxQkFBSyxNQUFMLENBQVksUUFBWixDQUFxQixLQUFyQixDQUEyQixJQUEzQixFQUFpQyxLQUFLLE1BQUwsQ0FBWSxjQUE3QztBQUNIOztBQUVELGlCQUFLLE1BQUwsQ0FBWSxNQUFaO0FBQ0gsU0FORDs7QUFRQTs7Ozs7QUFLQSxjQUFLLFdBQUwsR0FBbUIsWUFBWTtBQUMzQixpQkFBSyxNQUFMLENBQVksV0FBWixHQUEwQixLQUExQjs7QUFFQSxnQkFBSSxLQUFLLE1BQUwsQ0FBWSxXQUFoQixFQUE2QjtBQUN6QixxQkFBSyxNQUFMLENBQVksWUFBWixDQUF5QixVQUF6QjtBQUNIOztBQUVELGdCQUFJLEtBQUssTUFBTCxDQUFZLGdCQUFoQixFQUFrQztBQUM5QixxQkFBSyxNQUFMLENBQVksWUFBWixDQUF5QixXQUF6QjtBQUNIOztBQUVELGdCQUFJLEtBQUssTUFBTCxDQUFZLFVBQVosS0FBMkIsU0FBL0IsRUFBMEM7QUFDdEMscUJBQUssTUFBTCxDQUFZLFVBQVosQ0FBdUIsS0FBdkIsQ0FBNkIsSUFBN0IsRUFBbUMsS0FBSyxNQUFMLENBQVksZ0JBQS9DO0FBQ0g7O0FBRUQsZ0JBQUksS0FBSyxpQkFBVCxFQUE0QjtBQUN4QixxQkFBSyxPQUFMO0FBQ0g7QUFDRDtBQUNBLG9CQUFRLEdBQVIsQ0FBWSxxQkFBWjtBQUNILFNBcEJELEVBc0JBLE1BQUssYUFBTCxDQUFtQixTQUFuQixFQUE4QixNQUFLLFFBQW5DLENBdEJBO0FBdUJBLGNBQUssYUFBTCxDQUFtQixVQUFuQixFQUErQixNQUFLLFNBQXBDO0FBQ0EsY0FBSyxhQUFMLENBQW1CLFlBQW5CLEVBQWlDLE1BQUssV0FBdEM7QUE5RzBCO0FBK0c3Qjs7QUFFRDs7Ozs7Ozs7Ozs7OztpQ0FTVSxLLEVBQU8sUSxFQUFVLE8sRUFBUztBQUNoQyxzQkFBVSxXQUFXLEVBQXJCOztBQUVBLGdCQUFJLGVBQWUsSUFBSSxZQUFKLENBQWlCO0FBQ2hDLHNCQUFNO0FBQ0YsNkJBQVMsUUFBUSxPQURmO0FBRUYsOEJBQVUsUUFBUSxRQUZoQjtBQUdGLGdDQUFZLFFBQVEsVUFIbEI7QUFJRix1Q0FBbUIsUUFBUTtBQUp6QixpQkFEMEI7QUFPaEMsK0JBQWUsSUFQaUI7QUFRaEMsK0JBQWUsQ0FBQyxRQUFELENBUmlCO0FBU2hDLHlCQUFTLGlCQUFVLElBQVYsRUFBZ0I7QUFDckIseUJBQUssZUFBTCxHQUF1QixJQUF2QjtBQUNBLHdCQUFJLEtBQUssSUFBTCxDQUFVLE9BQVYsS0FBc0IsU0FBMUIsRUFBcUM7QUFDakMsNkJBQUssSUFBTCxDQUFVLE9BQVYsQ0FBa0IsS0FBbEIsQ0FBd0IsSUFBeEIsRUFBOEIsS0FBSyxJQUFMLENBQVUsYUFBeEM7QUFDSDtBQUNKLGlCQWQrQjtBQWVoQyxnQ0FBZ0IsQ0FBQyxRQUFELENBZmdCO0FBZ0JoQywwQkFBVSxrQkFBVSxJQUFWLEVBQWdCO0FBQ3RCLHdCQUFJLEtBQUssSUFBTCxDQUFVLFFBQVYsS0FBdUIsU0FBM0IsRUFBc0M7QUFDbEMsNkJBQUssSUFBTCxDQUFVLFFBQVYsQ0FBbUIsS0FBbkIsQ0FBeUIsSUFBekIsRUFBK0IsS0FBSyxJQUFMLENBQVUsY0FBekM7QUFDSDtBQUNKLGlCQXBCK0I7QUFxQmhDLGtDQUFrQixDQUFDLFFBQUQsQ0FyQmM7QUFzQmhDLDRCQUFZLG9CQUFVLElBQVYsRUFBZ0I7QUFDeEIsd0JBQUksS0FBSyxJQUFMLENBQVUsVUFBVixLQUF5QixTQUE3QixFQUF3QztBQUNwQyw2QkFBSyxJQUFMLENBQVUsVUFBVixDQUFxQixLQUFyQixDQUEyQixJQUEzQixFQUFpQyxLQUFLLElBQUwsQ0FBVSxnQkFBM0M7QUFDSDtBQUNKLGlCQTFCK0I7QUEyQmhDLHlDQUF5QixDQUFDLFFBQUQsQ0EzQk87QUE0QmhDLG1DQUFtQiwyQkFBVSxJQUFWLEVBQWdCO0FBQy9CLHdCQUFJLEtBQUssSUFBTCxDQUFVLGlCQUFWLEtBQWdDLFNBQXBDLEVBQStDO0FBQzNDLDZCQUFLLElBQUwsQ0FBVSxpQkFBVixDQUE0QixLQUE1QixDQUFrQyxJQUFsQyxFQUF3QyxLQUFLLElBQUwsQ0FBVSx1QkFBbEQ7QUFDSDtBQUNKO0FBaEMrQixhQUFqQixDQUFuQjtBQWtDQSxnQkFBSSxnQkFBZ0IsSUFBcEI7QUFDQSxnQkFBSSxRQUFRLEtBQUssV0FBTCxDQUFpQixNQUFNLEtBQXZCLENBQVo7O0FBRUEsbUJBQU8sUUFBUSxPQUFmO0FBQ0EsbUJBQU8sUUFBUSxRQUFmO0FBQ0EsbUJBQU8sUUFBUSxVQUFmO0FBQ0EsbUJBQU8sUUFBUSxpQkFBZjs7QUFFQTtBQUNBLGdCQUFJLE1BQU0sTUFBTixJQUFnQixNQUFNLFFBQXRCLElBQWtDLE1BQU0sUUFBeEMsSUFBb0QsTUFBTSxJQUE5RCxFQUFvRTtBQUNoRSxvQkFBSSxZQUFZLFNBQVMsRUFBVCxDQUFZLEtBQUssTUFBakIsRUFBeUIsYUFBYSxDQUFiLEdBQWlCLFFBQWpCLEdBQTRCLEtBQXJELEVBQTRELE9BQU8sTUFBUCxDQUFjLEVBQWQsRUFBa0IsT0FBbEIsRUFBMkI7QUFDbkcsZ0NBQVksQ0FEdUY7QUFFbkcsZ0NBQVksQ0FGdUY7QUFHbkcsOEJBQVUsQ0FIeUY7QUFJbkcsMEJBQU0sQ0FKNkY7QUFLbkcscUNBQWlCLEtBTGtGO0FBTW5HLG1DQUFlLElBTm9GO0FBT25HLG1DQUFlLENBQUMsUUFBRCxDQVBvRjtBQVFuRyw2QkFBUyxpQkFBVSxJQUFWLEVBQWdCO0FBQ3JCLDRCQUFJLGFBQWEseUJBQWMsSUFBL0I7O0FBRUEsNEJBQUksS0FBSyxLQUFMLENBQVcsRUFBWCxDQUFjLElBQWQsR0FBcUIsS0FBSyxNQUFMLENBQVksSUFBckMsRUFBMkM7QUFDdkMseUNBQWEseUJBQWMsRUFBM0I7QUFDSCx5QkFGRCxNQUdLLElBQUksS0FBSyxLQUFMLENBQVcsRUFBWCxDQUFjLElBQWQsR0FBcUIsS0FBSyxNQUFMLENBQVksSUFBckMsRUFBMkM7QUFDNUMseUNBQWEseUJBQWMsR0FBM0I7QUFDSDs7QUFFRCw2QkFBSyxNQUFMLENBQVksYUFBWixHQUE0QixVQUE1Qjs7QUFFQTtBQUNBLDZCQUFLLE1BQUwsQ0FBWSxrQkFBWixDQUErQixLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsTUFBOUM7QUFDQSw2QkFBSyxRQUFMLENBQWMsSUFBZCxHQUFxQixJQUFyQjs7QUFFQTtBQUNBLGdDQUFRLEdBQVIsQ0FBWSxvQkFBWjtBQUNBLGdDQUFRLEdBQVIsQ0FBWSxjQUFaLEVBQTRCLEtBQUssSUFBakM7QUFDQSxnQ0FBUSxHQUFSLENBQVksZUFBWixFQUE2QixLQUFLLEtBQWxDO0FBQ0gscUJBNUJrRztBQTZCbkcsb0NBQWdCLENBQUMsUUFBRCxDQTdCbUY7QUE4Qm5HLDhCQUFVLGtCQUFVLElBQVYsRUFBZ0I7QUFDdEI7QUFDQSw2QkFBSyxNQUFMLENBQVksY0FBWixDQUEyQixLQUFLLE1BQUwsQ0FBWSx3QkFBWixDQUFxQyxLQUFLLE1BQUwsQ0FBWSxTQUFqRCxFQUE0RCxLQUFLLE1BQUwsQ0FBWSxNQUF4RSxFQUFnRixLQUFLLE1BQUwsQ0FBWSxlQUE1RixFQUE2RyxLQUFLLE1BQUwsQ0FBWSxjQUF6SCxDQUEzQjtBQUNILHFCQWpDa0c7QUFrQ25HLHNDQUFrQixDQUFDLFFBQUQsQ0FsQ2lGO0FBbUNuRyxnQ0FBWSxvQkFBVSxJQUFWLEVBQWdCO0FBQ3hCLDZCQUFLLGNBQUwsQ0FBb0IsS0FBSyxVQUFMLENBQWdCLEtBQUssS0FBTCxHQUFhLENBQTdCLENBQXBCLEVBQXFELEtBQUssS0FBTCxDQUFXLEdBQWhFO0FBQ0E7QUFDQSxnQ0FBUSxHQUFSLENBQVksc0JBQVo7QUFDSCxxQkF2Q2tHO0FBd0NuRyw2Q0FBeUIsQ0FBQyxRQUFELENBeEMwRTtBQXlDbkcsdUNBQW1CLDJCQUFVLElBQVYsRUFBZ0I7QUFDL0IsNkJBQUssTUFBTCxDQUFZLGtCQUFaLENBQStCLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsTUFBaEQ7QUFDSDtBQTNDa0csaUJBQTNCLENBQTVELENBQWhCOztBQThDQSwwQkFBVSxJQUFWLEdBQWlCLFVBQVUsSUFBVixDQUFlLElBQWhDO0FBQ0EsMEJBQVUsS0FBVixHQUFrQjtBQUNkLDRCQUFRLEVBRE07QUFFZCw0QkFBUSxFQUZNO0FBR2Qsd0JBQUksRUFIVTtBQUlkLDJCQUFPLEVBSk87QUFLZCx5QkFBSztBQUxTLGlCQUFsQjtBQU9BLDBCQUFVLEtBQVYsQ0FBZ0IsTUFBaEIsQ0FBdUIsTUFBdkIsR0FBZ0MsTUFBTSxNQUF0QztBQUNBLDBCQUFVLEtBQVYsQ0FBZ0IsTUFBaEIsQ0FBdUIsUUFBdkIsR0FBa0MsTUFBTSxRQUF4QztBQUNBLDBCQUFVLEtBQVYsQ0FBZ0IsTUFBaEIsQ0FBdUIsUUFBdkIsR0FBa0MsTUFBTSxRQUF4QztBQUNBLDBCQUFVLEtBQVYsQ0FBZ0IsTUFBaEIsQ0FBdUIsSUFBdkIsR0FBOEIsTUFBTSxJQUFwQztBQUNBLDBCQUFVLEtBQVYsR0FBa0IsS0FBSyxVQUFMLENBQWdCLE1BQWxDO0FBQ0EscUJBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixTQUFyQjtBQUNBLDZCQUFhLEdBQWIsQ0FBaUIsU0FBakIsRUFBNEIsQ0FBNUI7QUFDSDs7QUFFRDtBQUNBLGdCQUFJLFdBQVcsQ0FBWCxJQUFnQixLQUFoQixJQUF5QixNQUFNLFNBQU4sR0FBa0IsQ0FBL0MsRUFBa0Q7QUFDOUMsZ0NBQWdCLElBQUksWUFBSixDQUFpQixPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLE9BQWxCLEVBQTJCO0FBQ3hELDBCQUFNO0FBQ0YsbUNBQVcsQ0FEVDtBQUVGLG1DQUFXLE1BQU0sU0FGZjtBQUdGLHVDQUFnQixNQUFNLGFBQU4sS0FBd0IsS0FBekIsR0FBa0MsS0FBbEMsR0FBMEM7QUFIdkQscUJBRGtEO0FBTXhELG1DQUFlLElBTnlDO0FBT3hELG1DQUFlLENBQUMsUUFBRCxDQVB5QztBQVF4RCw2QkFBUyxpQkFBVSxJQUFWLEVBQWdCO0FBQ3JCLDZCQUFLLFFBQUwsQ0FBYyxLQUFkLEdBQXNCLElBQXRCO0FBQ0gscUJBVnVEO0FBV3hELG9DQUFnQixDQUFDLFFBQUQsQ0FYd0M7QUFZeEQsOEJBQVUsa0JBQVUsSUFBVixFQUFnQjtBQUN0Qiw0QkFBSSxlQUFlLEtBQUssSUFBTCxPQUFnQixLQUFLLFFBQUwsRUFBbkM7QUFDQSw0QkFBSSxVQUFVLENBQWQ7QUFDQSw0QkFBSSxVQUFVLENBQWQ7QUFDQSw0QkFBSSxXQUFXLEtBQUssTUFBTCxDQUFZLFdBQVosQ0FBd0IsS0FBeEIsRUFBZjs7QUFFQSw0QkFBSSxLQUFLLElBQUwsQ0FBVSxTQUFWLEtBQXdCLFVBQVUsS0FBVixDQUFnQixTQUFoQixDQUEwQixVQUFsRCxJQUFnRSxLQUFLLElBQUwsQ0FBVSxTQUFWLEtBQXdCLFVBQVUsS0FBVixDQUFnQixTQUFoQixDQUEwQixJQUF0SCxFQUE0SDtBQUN4SCxnQ0FBSSxDQUFDLFlBQUwsRUFBbUI7QUFDZiwwQ0FBVSxLQUFLLE1BQUwsS0FBZ0IsS0FBSyxJQUFMLENBQVUsU0FBMUIsR0FBc0MsS0FBSyxNQUFMLENBQVksS0FBbEQsR0FBMEQsQ0FBMUQsR0FBOEQsS0FBSyxJQUFMLENBQVUsU0FBVixHQUFzQixLQUFLLE1BQUwsQ0FBWSxLQUExRztBQUNBLHlDQUFTLENBQVQsSUFBYyxPQUFkO0FBQ0g7QUFDSjs7QUFFRCw0QkFBSSxLQUFLLElBQUwsQ0FBVSxTQUFWLEtBQXdCLFVBQVUsS0FBVixDQUFnQixTQUFoQixDQUEwQixRQUFsRCxJQUE4RCxLQUFLLElBQUwsQ0FBVSxTQUFWLEtBQXdCLFVBQVUsS0FBVixDQUFnQixTQUFoQixDQUEwQixJQUFwSCxFQUEwSDtBQUN0SCxnQ0FBSSxDQUFDLFlBQUwsRUFBbUI7QUFDZiwwQ0FBVSxLQUFLLE1BQUwsS0FBZ0IsS0FBSyxJQUFMLENBQVUsU0FBMUIsR0FBc0MsS0FBSyxNQUFMLENBQVksTUFBbEQsR0FBMkQsQ0FBM0QsR0FBK0QsS0FBSyxJQUFMLENBQVUsU0FBVixHQUFzQixLQUFLLE1BQUwsQ0FBWSxNQUEzRztBQUNBLHlDQUFTLENBQVQsSUFBYyxPQUFkO0FBQ0g7QUFDSjs7QUFFRCw2QkFBSyxNQUFMLENBQVksV0FBWixDQUF3QixRQUF4QixFQUFrQyxLQUFLLElBQUwsQ0FBVSxhQUE1QztBQUNILHFCQWpDdUQ7QUFrQ3hELHNDQUFrQixDQUFDLFFBQUQ7QUFsQ3NDLGlCQUEzQixDQUFqQixDQUFoQjs7QUFxQ0E7QUFDQSxvQkFBSSxNQUFNLE1BQU4sSUFBZ0IsTUFBTSxPQUExQixFQUFtQztBQUMvQixrQ0FBYyxNQUFkLENBQXFCLGNBQWMsSUFBbkMsRUFBeUMsV0FBVyxHQUFwRCxFQUF5RDtBQUNyRCxtQ0FBVztBQUQwQyxxQkFBekQsRUFFRztBQUNDLG1DQUFXLE1BQU0sU0FEbEI7QUFFQyw4QkFBTSxNQUFNLE1BQU4sSUFBZ0IsT0FBTztBQUY5QixxQkFGSCxFQUtHLENBTEg7O0FBT0Esa0NBQWMsRUFBZCxDQUFpQixjQUFjLElBQS9CLEVBQXFDLFdBQVcsR0FBaEQsRUFBcUQ7QUFDakQsbUNBQVcsQ0FEc0M7QUFFakQsOEJBQU0sTUFBTSxPQUFOLElBQWlCLE9BQU87QUFGbUIscUJBQXJELEVBR0csV0FBVyxHQUhkO0FBSUg7QUFDRDtBQWJBLHFCQWNLLElBQUksTUFBTSxNQUFOLElBQWdCLENBQUMsTUFBTSxPQUEzQixFQUFvQztBQUNyQyxzQ0FBYyxNQUFkLENBQXFCLGNBQWMsSUFBbkMsRUFBeUMsUUFBekMsRUFBbUQ7QUFDL0MsdUNBQVc7QUFEb0MseUJBQW5ELEVBRUc7QUFDQyx1Q0FBVyxNQUFNLFNBRGxCO0FBRUMsa0NBQU0sTUFBTSxNQUFOLElBQWdCLE9BQU87QUFGOUIseUJBRkgsRUFLRyxDQUxIO0FBTUg7QUFDRDtBQVJLLHlCQVNBLElBQUksQ0FBQyxNQUFNLE1BQVAsSUFBaUIsTUFBTSxPQUEzQixFQUFvQztBQUNyQywwQ0FBYyxNQUFkLENBQXFCLGNBQWMsSUFBbkMsRUFBeUMsUUFBekMsRUFBbUQ7QUFDL0MsMkNBQVcsTUFBTTtBQUQ4Qiw2QkFBbkQsRUFFRztBQUNDLDJDQUFXLENBRFo7QUFFQyxzQ0FBTSxNQUFNLE9BQU4sSUFBaUIsT0FBTztBQUYvQiw2QkFGSCxFQUtHLENBTEg7QUFNSDtBQUNEO0FBUkssNkJBU0EsSUFBSSxRQUFRLElBQVosRUFBa0I7QUFDbkIsOENBQWMsTUFBZCxDQUFxQixjQUFjLElBQW5DLEVBQXlDLFFBQXpDLEVBQW1EO0FBQy9DLCtDQUFXO0FBRG9DLGlDQUFuRCxFQUVHO0FBQ0MsK0NBQVcsTUFBTSxTQURsQjtBQUVDLDBDQUFNLFFBQVEsSUFBUixJQUFnQixPQUFPO0FBRjlCLGlDQUZILEVBS0csQ0FMSDtBQU1IO0FBQ0Q7QUFSSyxpQ0FTQTtBQUNELGtEQUFjLElBQWQsQ0FBbUIsU0FBbkIsR0FBK0IsTUFBTSxTQUFyQztBQUNBLGtEQUFjLEVBQWQsQ0FBaUIsY0FBYyxJQUEvQixFQUFxQyxRQUFyQyxFQUErQyxFQUEvQyxFQUFtRCxDQUFuRDtBQUNIOztBQUVELDZCQUFhLEdBQWIsQ0FBaUIsYUFBakIsRUFBZ0MsQ0FBaEM7QUFDSDs7QUFFRCxpQkFBSyxHQUFMLENBQVMsWUFBVDs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7OzBDQVdtQixNLEVBQVEsSyxFQUFPO0FBQzlCLGdCQUFJLFNBQVM7QUFDVCx3QkFBUyxPQUFPLE1BQVAsS0FBa0IsSUFBbkIsR0FBMkIsT0FBTyxNQUFsQyxHQUEyQyxFQUQxQztBQUVULDBCQUFXLE9BQU8sUUFBUCxLQUFvQixJQUFyQixHQUE2QixPQUFPLFFBQXBDLEdBQStDLEVBRmhEO0FBR1QsMEJBQVUsT0FBTyxRQUhSO0FBSVQsc0JBQU0sT0FBTztBQUpKLGFBQWI7O0FBT0EsZ0JBQUksYUFBYSxLQUFqQjtBQUNBO0FBQ0EsZ0JBQUksb0JBQW9CLE9BQU8sUUFBUCxDQUFnQixPQUFPLE1BQVAsQ0FBYyxDQUE5QixDQUF4QjtBQUNBLGdCQUFJLG9CQUFvQixPQUFPLFFBQVAsQ0FBZ0IsT0FBTyxNQUFQLENBQWMsQ0FBOUIsQ0FBeEI7QUFDQSxnQkFBSSxtQkFBbUIscUJBQXFCLGlCQUE1QztBQUNBO0FBQ0EsZ0JBQUksc0JBQXNCLE9BQU8sUUFBUCxDQUFnQixPQUFPLFFBQVAsQ0FBZ0IsQ0FBaEMsQ0FBMUI7QUFDQSxnQkFBSSxzQkFBc0IsT0FBTyxRQUFQLENBQWdCLE9BQU8sUUFBUCxDQUFnQixDQUFoQyxDQUExQjtBQUNBLGdCQUFJLHFCQUFxQix1QkFBdUIsbUJBQWhEO0FBQ0EsZ0JBQUksbUJBQW1CLGtCQUF2QjtBQUNBLGdCQUFJLHFCQUFxQixPQUFPLFFBQVAsQ0FBZ0IsT0FBTyxRQUF2QixLQUFvQyxPQUFPLFFBQVAsS0FBb0IsTUFBTSxRQUF2RjtBQUNBLGdCQUFJLGlCQUFpQixPQUFPLFFBQVAsQ0FBZ0IsT0FBTyxJQUF2QixLQUFnQyxPQUFPLElBQVAsS0FBZ0IsTUFBTSxJQUEzRTs7QUFFQSxnQkFBSSxzQkFBc0IsdUJBQWMsS0FBZCxDQUFvQixNQUFNLElBQTFCLEVBQWdDLE1BQU0sSUFBdEMsRUFBNEMsTUFBNUMsQ0FBbUQsZUFBTSxRQUFOLENBQWUsQ0FBQyxNQUFNLFFBQXRCLENBQW5ELENBQTFCO0FBQ0EsZ0JBQUksY0FBYyxLQUFLLE1BQUwsQ0FBWSxNQUE5QjtBQUNBLGdCQUFJLFFBQUo7QUFDQSxnQkFBSSxXQUFXLHFCQUFZLG9CQUFvQixPQUFPLE1BQVAsQ0FBYyxDQUFsQyxHQUFzQyxNQUFNLE1BQU4sQ0FBYSxDQUEvRCxFQUFrRSxvQkFBb0IsT0FBTyxNQUFQLENBQWMsQ0FBbEMsR0FBc0MsTUFBTSxNQUFOLENBQWEsQ0FBckgsQ0FBZjtBQUNBLGdCQUFJLGFBQWEscUJBQVksc0JBQXNCLE9BQU8sUUFBUCxDQUFnQixDQUF0QyxHQUEwQyxNQUFNLFFBQU4sQ0FBZSxDQUFyRSxFQUF3RSxzQkFBc0IsT0FBTyxRQUFQLENBQWdCLENBQXRDLEdBQTBDLE1BQU0sUUFBTixDQUFlLENBQWpJLENBQWpCO0FBQ0EsZ0JBQUksYUFBYSxxQkFBcUIsT0FBTyxRQUE1QixHQUF1QyxNQUFNLFFBQTlEO0FBQ0EsZ0JBQUksU0FBUyxpQkFBaUIsT0FBTyxJQUF4QixHQUErQixNQUFNLElBQWxEO0FBQ0EsZ0JBQUksbUJBQW1CLHVCQUFjLEtBQWQsQ0FBb0IsTUFBcEIsRUFBNEIsTUFBNUIsRUFBb0MsTUFBcEMsQ0FBMkMsZUFBTSxRQUFOLENBQWUsQ0FBQyxVQUFoQixDQUEzQyxDQUF2Qjs7QUFFQTtBQUNBLGdCQUFJLENBQUMsZ0JBQUQsSUFBcUIsQ0FBQyxrQkFBMUIsRUFBOEM7QUFDMUMsNkJBQWEsSUFBYjtBQUNBLHlCQUFTLElBQVQsQ0FBYyxNQUFNLFFBQXBCO0FBQ0g7QUFDRDtBQUpBLGlCQUtLLElBQUksb0JBQW9CLENBQUMsa0JBQXpCLEVBQTZDO0FBQzlDLGlDQUFhLElBQWI7QUFDQSx5Q0FBcUIsSUFBckI7QUFDQSxrQ0FBYyxLQUFLLE1BQUwsQ0FBWSxrQ0FBWixDQUErQyxRQUEvQyxFQUF5RCxNQUFNLFFBQS9ELEVBQXlFLEtBQUssTUFBTCxDQUFZLE1BQXJGLEVBQTZGLG1CQUE3RixDQUFkO0FBQ0EsaUNBQWEsS0FBSyxNQUFMLENBQVkscUNBQVosQ0FBa0QsUUFBbEQsRUFBNEQsV0FBNUQsRUFBeUUsS0FBSyxNQUFMLENBQVksTUFBckYsRUFBNkYsUUFBN0YsRUFBdUcsZ0JBQXZHLENBQWI7QUFDSDs7QUFFRCx1QkFBVyxLQUFLLE1BQUwsQ0FBWSx3QkFBWixDQUFxQyxVQUFyQyxFQUFpRCxLQUFLLE1BQUwsQ0FBWSxNQUE3RCxFQUFxRSxRQUFyRSxFQUErRSxnQkFBL0UsQ0FBWDs7QUFFQSxtQkFBTztBQUNILHlCQUFTLG1CQUFtQixTQUFTLENBQTVCLEdBQWdDLElBRHRDO0FBRUgseUJBQVMsbUJBQW1CLFNBQVMsQ0FBNUIsR0FBZ0MsSUFGdEM7QUFHSCx3QkFBUSxjQUFjLGdCQUFkLEdBQWlDLFFBQWpDLEdBQTRDLElBSGpEO0FBSUgsMEJBQVUscUJBQXFCLFVBQXJCLEdBQWtDLElBSnpDO0FBS0gsMEJBQVUscUJBQXFCLFVBQXJCLEdBQWtDLElBTHpDO0FBTUgsc0JBQU0saUJBQWlCLE1BQWpCLEdBQTBCO0FBTjdCLGFBQVA7QUFRSDs7QUFFRDs7Ozs7Ozs7O3lDQU1rQjtBQUNkLG1CQUFPO0FBQ0gsd0JBQVEsS0FBSyxNQUFMLENBQVksZUFBWixDQUE0QixLQUE1QixFQURMO0FBRUgsMEJBQVUsS0FBSyxNQUFMLENBQVksUUFBWixDQUFxQixLQUFyQixFQUZQO0FBR0gsMEJBQVUsS0FBSyxNQUFMLENBQVksUUFIbkI7QUFJSCxzQkFBTSxLQUFLLE1BQUwsQ0FBWTtBQUpmLGFBQVA7QUFNSDs7QUFFRDs7Ozs7Ozs7O3FDQU1jLEUsRUFBSSxLLEVBQU87QUFDckIsbUJBQU87QUFDSCx3QkFBUyxHQUFHLE1BQUgsS0FBYyxJQUFmLEdBQXVCLEdBQUcsTUFBMUIsR0FBbUMsTUFBTSxNQUQ5QztBQUVILDBCQUFXLEdBQUcsUUFBSCxLQUFnQixJQUFqQixHQUF5QixHQUFHLFFBQTVCLEdBQXVDLE1BQU0sUUFGcEQ7QUFHSCwwQkFBVyxHQUFHLFFBQUgsS0FBZ0IsSUFBakIsR0FBeUIsR0FBRyxRQUE1QixHQUF1QyxNQUFNLFFBSHBEO0FBSUgsc0JBQU8sR0FBRyxJQUFILEtBQVksSUFBYixHQUFxQixHQUFHLElBQXhCLEdBQStCLE1BQU07QUFKeEMsYUFBUDtBQU1IOztBQUVEOzs7Ozs7Ozs7O3VDQU9nQixLLEVBQU8sVSxFQUFZO0FBQy9CLGdCQUFJLFVBQVUsU0FBZCxFQUF5QjtBQUNyQiw2QkFBYyxlQUFlLFNBQWhCLEdBQTZCLFVBQTdCLEdBQTBDLEtBQUssY0FBTCxFQUF2RDs7QUFFQSxvQkFBSSxjQUFjLEtBQUssV0FBTCxDQUFpQixNQUFNLEtBQU4sQ0FBWSxNQUFaLENBQW1CLE1BQXBDLEVBQTRDLE1BQU0sS0FBTixDQUFZLE1BQVosQ0FBbUIsUUFBL0QsRUFBeUUsTUFBTSxLQUFOLENBQVksTUFBWixDQUFtQixRQUE1RixFQUFzRyxNQUFNLEtBQU4sQ0FBWSxNQUFaLENBQW1CLElBQXpILENBQWxCO0FBQ0Esb0JBQUksVUFBVSxLQUFLLGlCQUFMLENBQXVCLFdBQXZCLEVBQW9DLFVBQXBDLENBQWQ7QUFDQSxvQkFBSSxXQUFXLEtBQUssWUFBTCxDQUFrQixPQUFsQixFQUEyQixVQUEzQixDQUFmOztBQUVBLHFCQUFLLGFBQUwsR0FBcUIsVUFBckI7QUFDQSxzQkFBTSxLQUFOLENBQVksS0FBWixHQUFvQixVQUFwQjtBQUNBLHNCQUFNLEtBQU4sQ0FBWSxHQUFaLEdBQWtCLFFBQWxCO0FBQ0Esc0JBQU0sS0FBTixDQUFZLE1BQVosR0FBcUIsV0FBckI7QUFDQSxzQkFBTSxLQUFOLENBQVksRUFBWixHQUFpQixPQUFqQjs7QUFFQTtBQUNBLHFCQUFLLE1BQUwsQ0FBWSxrQkFBWixDQUErQixRQUFRLE1BQXZDO0FBQ0Esc0JBQU0sSUFBTixDQUFXLFVBQVgsR0FBd0IsUUFBUSxPQUFoQztBQUNBLHNCQUFNLElBQU4sQ0FBVyxVQUFYLEdBQXdCLFFBQVEsT0FBaEM7QUFDQSxzQkFBTSxJQUFOLENBQVcsUUFBWCxHQUFzQixRQUFRLFFBQTlCO0FBQ0Esc0JBQU0sSUFBTixDQUFXLElBQVgsR0FBa0IsUUFBUSxJQUExQjtBQUNIOztBQUVELG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7OztvQ0FVYSxNLEVBQVEsUSxFQUFVLFEsRUFBVSxJLEVBQU07QUFDM0MsZ0JBQUksYUFBYSxVQUFiLElBQTJCLEtBQUssYUFBTCxDQUFtQixRQUFsRCxFQUE0RDtBQUN4RCwyQkFBVyxLQUFLLGFBQUwsQ0FBbUIsUUFBOUI7QUFDSDs7QUFFRCxnQkFBSSxhQUFhLFVBQWIsSUFBMkIsQ0FBQyxxQkFBTSxLQUFLLGFBQUwsQ0FBbUIsUUFBekIsQ0FBaEMsRUFBb0U7QUFDaEUsMkJBQVcsS0FBSyxhQUFMLENBQW1CLFFBQTlCO0FBQ0g7O0FBRUQsZ0JBQUksU0FBUyxVQUFULElBQXVCLENBQUMscUJBQU0sS0FBSyxhQUFMLENBQW1CLElBQXpCLENBQTVCLEVBQTREO0FBQ3hELHVCQUFPLEtBQUssYUFBTCxDQUFtQixJQUExQjtBQUNIOztBQUVELG1CQUFPO0FBQ0gsd0JBQVEsZ0JBQU0sYUFBTixDQUFvQixNQUFwQixFQUE0QixLQUFLLE1BQUwsQ0FBWSxLQUFaLENBQWtCLElBQTlDLENBREw7QUFFSCwwQkFBVSxnQkFBTSxhQUFOLENBQW9CLFFBQXBCLEVBQThCLEtBQUssTUFBTCxDQUFZLEtBQVosQ0FBa0IsSUFBaEQsQ0FGUDtBQUdILDBCQUFVLENBQUMscUJBQU0sUUFBTixDQUFELEdBQW1CLFFBQW5CLEdBQThCLElBSHJDO0FBSUgsc0JBQU0sUUFBUTtBQUpYLGFBQVA7QUFNSDs7QUFFRDs7Ozs7Ozs7OztvQ0FPYSxLLEVBQU87QUFDaEIsZ0JBQUksY0FBYyxJQUFsQjs7QUFFQSxnQkFBSSxLQUFKLEVBQVc7QUFDUCw4QkFBYztBQUNWLCtCQUFXLHFCQUFNLE1BQU0sU0FBWixJQUF5QixDQUF6QixHQUE2QixNQUFNLFNBRHBDO0FBRVYsK0JBQVcscUJBQU0sTUFBTSxTQUFaLElBQXlCLFVBQVUsS0FBVixDQUFnQixTQUFoQixDQUEwQixJQUFuRCxHQUEwRCxNQUFNLFNBRmpFO0FBR1YsNEJBQVEsTUFBTSxNQUhKO0FBSVYsNkJBQVMsTUFBTSxPQUpMO0FBS1YsbUNBQWUsTUFBTTtBQUxYLGlCQUFkO0FBT0g7O0FBRUQsbUJBQU8sV0FBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7OztrQ0FRVztBQUNQO0FBQ0EsaUJBQUssTUFBTCxHQUFjLElBQWQ7QUFDQSxpQkFBSyxlQUFMLEdBQXVCLElBQXZCO0FBQ0EsaUJBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Z0NBMkJTLEssRUFBTyxRLEVBQVUsTyxFQUFTO0FBQy9CLGlCQUFLLFFBQUwsQ0FBYztBQUNWLDBCQUFVLE1BQU0sUUFETjtBQUVWLHdCQUFRLE1BQU0sTUFGSjtBQUdWLDBCQUFVLE1BQU0sUUFITjtBQUlWLHVCQUFPLE1BQU0sS0FKSDtBQUtWLHNCQUFNLE1BQU07QUFMRixhQUFkLEVBTUcsUUFOSCxFQU1hLE9BTmI7O0FBUUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrQkFpQlEsUSxFQUFVLFEsRUFBVSxPLEVBQVM7QUFDakMsaUJBQUssUUFBTCxDQUFjO0FBQ1YsMEJBQVU7QUFEQSxhQUFkLEVBRUcsUUFGSCxFQUVhLE9BRmI7O0FBSUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O2lDQWdCVSxNLEVBQVEsUSxFQUFVLFEsRUFBVSxPLEVBQVM7QUFDM0MsaUJBQUssUUFBTCxDQUFjO0FBQ1Ysd0JBQVEsTUFERTtBQUVWLDBCQUFVO0FBRkEsYUFBZCxFQUdHLFFBSEgsRUFHYSxPQUhiOztBQUtBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7aUNBV1UsUSxFQUFVLFEsRUFBVSxPLEVBQVM7QUFDbkMsaUJBQUssUUFBTCxDQUFjO0FBQ1YsMEJBQVU7QUFEQSxhQUFkLEVBRUcsUUFGSCxFQUVhLE9BRmI7O0FBSUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OEJBZU8sUyxFQUFXLFEsRUFBVSxTLEVBQVcsTyxFQUFTO0FBQzVDLHNCQUFVLFdBQVcsRUFBckI7O0FBRUEsaUJBQUssT0FBTCxDQUFhO0FBQ1QsdUJBQU87QUFDSCwrQkFBVyxTQURSO0FBRUgsK0JBQVcsU0FGUjtBQUdILDRCQUFRLFFBQVEsTUFIYjtBQUlILDZCQUFTLFFBQVEsT0FKZDtBQUtILG1DQUFlLFFBQVE7QUFMcEI7QUFERSxhQUFiLEVBUUcsUUFSSCxFQVFhLE9BUmI7O0FBVUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OytCQWdCUSxNLEVBQVEsSSxFQUFNLFEsRUFBVSxPLEVBQVM7QUFDckMsaUJBQUssUUFBTCxDQUFjO0FBQ1Ysd0JBQVEsTUFERTtBQUVWLHNCQUFNO0FBRkksYUFBZCxFQUdHLFFBSEgsRUFHYSxPQUhiOztBQUtBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7K0JBV1EsSSxFQUFNLFEsRUFBVSxPLEVBQVM7QUFDN0IsaUJBQUssUUFBTCxDQUFjO0FBQ1Ysc0JBQU07QUFESSxhQUFkLEVBRUcsUUFGSCxFQUVhLE9BRmI7O0FBSUEsbUJBQU8sSUFBUDtBQUNIOzs7O0VBanNCbUIsVzs7QUFvc0J4Qjs7Ozs7O0FBSUEsVUFBVSxLQUFWLEdBQWtCO0FBQ2QsZUFBVztBQUNQOzs7QUFHQSxjQUFNLENBSkM7QUFLUDs7O0FBR0Esb0JBQVksQ0FSTDtBQVNQOzs7QUFHQSxrQkFBVTtBQVpIO0FBREcsQ0FBbEI7O2tCQWlCZSxTOzs7QUNqd0JmO0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBTUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxJQUFNLFlBQVk7QUFDZCxVQUFNO0FBQ0YsY0FBTTtBQURKO0FBRFEsQ0FBbEI7O0FBTUE7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlTSxTOzs7QUFDRix1QkFBYSxNQUFiLEVBQXFCLE9BQXJCLEVBQThCO0FBQUE7O0FBQzFCLGtCQUFVLE9BQU8sTUFBUCxDQUFjO0FBQ3BCLG9CQUFRO0FBRFksU0FBZCxFQUVQLE9BRk8sQ0FBVjs7QUFNQTs7OztBQVAwQiwwSEFLcEIsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixPQUFsQixDQUxvQjs7QUFXMUIsY0FBSyxNQUFMLEdBQWMsT0FBZDs7QUFFQTs7OztBQUlBLGNBQUssSUFBTCxHQUFZLGdCQUFLLFNBQWpCOztBQUVBOzs7QUFHQSxjQUFLLE1BQUwsR0FBYyxVQUFVLElBQXhCOztBQUVBOzs7QUFHQSxjQUFLLFVBQUwsR0FBa0IsRUFBbEI7O0FBRUE7OztBQUdBLGNBQUssZUFBTCxHQUF1QixJQUF2Qjs7QUFFQTs7O0FBR0EsY0FBSyxpQkFBTCxHQUF5QixRQUFRLGlCQUFSLEdBQTRCLElBQTVCLEdBQW1DLEtBQTVEOztBQUVBOzs7QUFHQSxjQUFLLGFBQUwsR0FBcUIsRUFBckI7O0FBRUE7Ozs7O0FBS0EsY0FBSyxRQUFMLEdBQWdCLFlBQVk7QUFDeEIsaUJBQUssY0FBTCxDQUFvQixLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBcEI7QUFDQSxpQkFBSyxNQUFMLENBQVksV0FBWixHQUEwQixJQUExQjs7QUFFQSxnQkFBSSxLQUFLLE1BQUwsQ0FBWSxXQUFoQixFQUE2QjtBQUN6QixxQkFBSyxNQUFMLENBQVksWUFBWixDQUF5QixXQUF6QjtBQUNIOztBQUVELGdCQUFJLEtBQUssTUFBTCxDQUFZLGdCQUFoQixFQUFrQztBQUM5QixxQkFBSyxNQUFMLENBQVksWUFBWixDQUF5QixZQUF6QjtBQUNIOztBQUVELGdCQUFJLEtBQUssTUFBTCxDQUFZLE9BQVosS0FBd0IsU0FBNUIsRUFBdUM7QUFDbkMscUJBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0IsS0FBcEIsQ0FBMEIsSUFBMUIsRUFBZ0MsS0FBSyxNQUFMLENBQVksYUFBNUM7QUFDSDtBQUNEO0FBQ0Esb0JBQVEsR0FBUixDQUFZLG1CQUFaO0FBQ0gsU0FqQkQ7O0FBbUJBOzs7OztBQUtBLGNBQUssU0FBTCxHQUFpQixZQUFZO0FBQ3pCLGdCQUFJLEtBQUssTUFBTCxDQUFZLFFBQVosS0FBeUIsU0FBN0IsRUFBd0M7QUFDcEMscUJBQUssTUFBTCxDQUFZLFFBQVosQ0FBcUIsS0FBckIsQ0FBMkIsSUFBM0IsRUFBaUMsS0FBSyxNQUFMLENBQVksY0FBN0M7QUFDSDs7QUFFRCxpQkFBSyxNQUFMLENBQVksTUFBWjtBQUNILFNBTkQ7O0FBUUE7Ozs7O0FBS0EsY0FBSyxXQUFMLEdBQW1CLFlBQVk7QUFDM0IsaUJBQUssTUFBTCxDQUFZLFdBQVosR0FBMEIsS0FBMUI7O0FBRUEsZ0JBQUksS0FBSyxNQUFMLENBQVksV0FBaEIsRUFBNkI7QUFDekIscUJBQUssTUFBTCxDQUFZLFlBQVosQ0FBeUIsVUFBekI7QUFDSDs7QUFFRCxnQkFBSSxLQUFLLE1BQUwsQ0FBWSxnQkFBaEIsRUFBa0M7QUFDOUIscUJBQUssTUFBTCxDQUFZLFlBQVosQ0FBeUIsV0FBekI7QUFDSDs7QUFFRCxnQkFBSSxLQUFLLE1BQUwsQ0FBWSxVQUFaLEtBQTJCLFNBQS9CLEVBQTBDO0FBQ3RDLHFCQUFLLE1BQUwsQ0FBWSxVQUFaLENBQXVCLEtBQXZCLENBQTZCLElBQTdCLEVBQW1DLEtBQUssTUFBTCxDQUFZLGdCQUEvQztBQUNIOztBQUVELGdCQUFJLEtBQUssaUJBQVQsRUFBNEI7QUFDeEIscUJBQUssT0FBTDtBQUNIO0FBQ0Q7QUFDQSxvQkFBUSxHQUFSLENBQVkscUJBQVo7QUFDSCxTQXBCRCxFQXNCQSxNQUFLLGFBQUwsQ0FBbUIsU0FBbkIsRUFBOEIsTUFBSyxRQUFuQyxDQXRCQTtBQXVCQSxjQUFLLGFBQUwsQ0FBbUIsVUFBbkIsRUFBK0IsTUFBSyxTQUFwQztBQUNBLGNBQUssYUFBTCxDQUFtQixZQUFuQixFQUFpQyxNQUFLLFdBQXRDO0FBOUcwQjtBQStHN0I7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7aUNBU1UsSyxFQUFPLFEsRUFBVSxPLEVBQVM7QUFDaEMsc0JBQVUsV0FBVyxFQUFyQjs7QUFFQSxnQkFBSSxlQUFlLElBQUksWUFBSixDQUFpQjtBQUNoQyxzQkFBTTtBQUNGLDZCQUFTLFFBQVEsT0FEZjtBQUVGLDhCQUFVLFFBQVEsUUFGaEI7QUFHRixnQ0FBWSxRQUFRLFVBSGxCO0FBSUYsdUNBQW1CLFFBQVE7QUFKekIsaUJBRDBCO0FBT2hDLCtCQUFlLElBUGlCO0FBUWhDLCtCQUFlLENBQUMsUUFBRCxDQVJpQjtBQVNoQyx5QkFBUyxpQkFBVSxJQUFWLEVBQWdCO0FBQ3JCLHlCQUFLLGVBQUwsR0FBdUIsSUFBdkI7QUFDQSx3QkFBSSxLQUFLLElBQUwsQ0FBVSxPQUFWLEtBQXNCLFNBQTFCLEVBQXFDO0FBQ2pDLDZCQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLEtBQWxCLENBQXdCLElBQXhCLEVBQThCLEtBQUssSUFBTCxDQUFVLGFBQXhDO0FBQ0g7QUFDSixpQkFkK0I7QUFlaEMsZ0NBQWdCLENBQUMsUUFBRCxDQWZnQjtBQWdCaEMsMEJBQVUsa0JBQVUsSUFBVixFQUFnQjtBQUN0Qix3QkFBSSxLQUFLLElBQUwsQ0FBVSxRQUFWLEtBQXVCLFNBQTNCLEVBQXNDO0FBQ2xDLDZCQUFLLElBQUwsQ0FBVSxRQUFWLENBQW1CLEtBQW5CLENBQXlCLElBQXpCLEVBQStCLEtBQUssSUFBTCxDQUFVLGNBQXpDO0FBQ0g7QUFDSixpQkFwQitCO0FBcUJoQyxrQ0FBa0IsQ0FBQyxRQUFELENBckJjO0FBc0JoQyw0QkFBWSxvQkFBVSxJQUFWLEVBQWdCO0FBQ3hCLHdCQUFJLEtBQUssSUFBTCxDQUFVLFVBQVYsS0FBeUIsU0FBN0IsRUFBd0M7QUFDcEMsNkJBQUssSUFBTCxDQUFVLFVBQVYsQ0FBcUIsS0FBckIsQ0FBMkIsSUFBM0IsRUFBaUMsS0FBSyxJQUFMLENBQVUsZ0JBQTNDO0FBQ0g7QUFDSixpQkExQitCO0FBMkJoQyx5Q0FBeUIsQ0FBQyxRQUFELENBM0JPO0FBNEJoQyxtQ0FBbUIsMkJBQVUsSUFBVixFQUFnQjtBQUMvQix3QkFBSSxLQUFLLElBQUwsQ0FBVSxpQkFBVixLQUFnQyxTQUFwQyxFQUErQztBQUMzQyw2QkFBSyxJQUFMLENBQVUsaUJBQVYsQ0FBNEIsS0FBNUIsQ0FBa0MsSUFBbEMsRUFBd0MsS0FBSyxJQUFMLENBQVUsdUJBQWxEO0FBQ0g7QUFDSjtBQWhDK0IsYUFBakIsQ0FBbkI7QUFrQ0EsZ0JBQUksZ0JBQWdCLElBQXBCO0FBQ0EsZ0JBQUksUUFBUSxLQUFLLFdBQUwsQ0FBaUIsTUFBTSxLQUF2QixDQUFaOztBQUVBLG1CQUFPLFFBQVEsT0FBZjtBQUNBLG1CQUFPLFFBQVEsUUFBZjtBQUNBLG1CQUFPLFFBQVEsVUFBZjtBQUNBLG1CQUFPLFFBQVEsaUJBQWY7O0FBRUE7QUFDQSxnQkFBSSxNQUFNLE1BQU4sSUFBZ0IsTUFBTSxRQUF0QixJQUFrQyxNQUFNLFFBQXhDLElBQW9ELE1BQU0sSUFBOUQsRUFBb0U7QUFDaEUsb0JBQUksWUFBWSxTQUFTLEVBQVQsQ0FBWSxLQUFLLE1BQWpCLEVBQXlCLGFBQWEsQ0FBYixHQUFpQixRQUFqQixHQUE0QixLQUFyRCxFQUE0RCxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLE9BQWxCLEVBQTJCO0FBQ25HLGdDQUFZLENBRHVGO0FBRW5HLGdDQUFZLENBRnVGO0FBR25HLDhCQUFVLENBSHlGO0FBSW5HLDBCQUFNLENBSjZGO0FBS25HLHFDQUFpQixLQUxrRjtBQU1uRyxtQ0FBZSxJQU5vRjtBQU9uRyxtQ0FBZSxDQUFDLFFBQUQsQ0FQb0Y7QUFRbkcsNkJBQVMsaUJBQVUsSUFBVixFQUFnQjtBQUNyQiw0QkFBSSxhQUFhLHlCQUFjLElBQS9COztBQUVBLDRCQUFJLEtBQUssS0FBTCxDQUFXLEVBQVgsQ0FBYyxJQUFkLEdBQXFCLEtBQUssTUFBTCxDQUFZLElBQXJDLEVBQTJDO0FBQ3ZDLHlDQUFhLHlCQUFjLEVBQTNCO0FBQ0gseUJBRkQsTUFHSyxJQUFJLEtBQUssS0FBTCxDQUFXLEVBQVgsQ0FBYyxJQUFkLEdBQXFCLEtBQUssTUFBTCxDQUFZLElBQXJDLEVBQTJDO0FBQzVDLHlDQUFhLHlCQUFjLEdBQTNCO0FBQ0g7O0FBRUQsNkJBQUssTUFBTCxDQUFZLGFBQVosR0FBNEIsVUFBNUI7O0FBRUE7QUFDQSw2QkFBSyxNQUFMLENBQVksa0JBQVosQ0FBK0IsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFlLE1BQTlDO0FBQ0EsNkJBQUssUUFBTCxDQUFjLElBQWQsR0FBcUIsSUFBckI7O0FBRUE7QUFDQSxnQ0FBUSxHQUFSLENBQVksb0JBQVo7QUFDQSxnQ0FBUSxHQUFSLENBQVksY0FBWixFQUE0QixLQUFLLElBQWpDO0FBQ0EsZ0NBQVEsR0FBUixDQUFZLGVBQVosRUFBNkIsS0FBSyxLQUFsQztBQUNILHFCQTVCa0c7QUE2Qm5HLG9DQUFnQixDQUFDLFFBQUQsQ0E3Qm1GO0FBOEJuRyw4QkFBVSxrQkFBVSxJQUFWLEVBQWdCO0FBQ3RCO0FBQ0EsNkJBQUssTUFBTCxDQUFZLGNBQVosQ0FBMkIsS0FBSyxNQUFMLENBQVksd0JBQVosQ0FBcUMsS0FBSyxNQUFMLENBQVksU0FBakQsRUFBNEQsS0FBSyxNQUFMLENBQVksTUFBeEUsRUFBZ0YsS0FBSyxNQUFMLENBQVksZUFBNUYsRUFBNkcsS0FBSyxNQUFMLENBQVksY0FBekgsQ0FBM0I7QUFDSCxxQkFqQ2tHO0FBa0NuRyxzQ0FBa0IsQ0FBQyxRQUFELENBbENpRjtBQW1DbkcsZ0NBQVksb0JBQVUsSUFBVixFQUFnQjtBQUN4Qiw2QkFBSyxjQUFMLENBQW9CLEtBQUssVUFBTCxDQUFnQixLQUFLLEtBQUwsR0FBYSxDQUE3QixDQUFwQixFQUFxRCxLQUFLLEtBQUwsQ0FBVyxHQUFoRTtBQUNBO0FBQ0EsZ0NBQVEsR0FBUixDQUFZLHNCQUFaO0FBQ0gscUJBdkNrRztBQXdDbkcsNkNBQXlCLENBQUMsUUFBRCxDQXhDMEU7QUF5Q25HLHVDQUFtQiwyQkFBVSxJQUFWLEVBQWdCO0FBQy9CLDZCQUFLLE1BQUwsQ0FBWSxrQkFBWixDQUErQixLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLE1BQWhEO0FBQ0g7QUEzQ2tHLGlCQUEzQixDQUE1RCxDQUFoQjs7QUE4Q0EsMEJBQVUsSUFBVixHQUFpQixVQUFVLElBQVYsQ0FBZSxJQUFoQztBQUNBLDBCQUFVLEtBQVYsR0FBa0I7QUFDZCw0QkFBUSxFQURNO0FBRWQsNEJBQVEsRUFGTTtBQUdkLHdCQUFJLEVBSFU7QUFJZCwyQkFBTyxFQUpPO0FBS2QseUJBQUs7QUFMUyxpQkFBbEI7QUFPQSwwQkFBVSxLQUFWLENBQWdCLE1BQWhCLENBQXVCLE1BQXZCLEdBQWdDLE1BQU0sTUFBdEM7QUFDQSwwQkFBVSxLQUFWLENBQWdCLE1BQWhCLENBQXVCLFFBQXZCLEdBQWtDLE1BQU0sUUFBeEM7QUFDQSwwQkFBVSxLQUFWLENBQWdCLE1BQWhCLENBQXVCLFFBQXZCLEdBQWtDLE1BQU0sUUFBeEM7QUFDQSwwQkFBVSxLQUFWLENBQWdCLE1BQWhCLENBQXVCLElBQXZCLEdBQThCLE1BQU0sSUFBcEM7QUFDQSwwQkFBVSxLQUFWLEdBQWtCLEtBQUssVUFBTCxDQUFnQixNQUFsQztBQUNBLHFCQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBcUIsU0FBckI7QUFDQSw2QkFBYSxHQUFiLENBQWlCLFNBQWpCLEVBQTRCLENBQTVCO0FBQ0g7O0FBRUQ7QUFDQSxnQkFBSSxXQUFXLENBQVgsSUFBZ0IsS0FBaEIsSUFBeUIsTUFBTSxTQUFOLEdBQWtCLENBQS9DLEVBQWtEO0FBQzlDLGdDQUFnQixJQUFJLFlBQUosQ0FBaUIsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixPQUFsQixFQUEyQjtBQUN4RCwwQkFBTTtBQUNGLG1DQUFXLENBRFQ7QUFFRixtQ0FBVyxNQUFNLFNBRmY7QUFHRix1Q0FBZ0IsTUFBTSxhQUFOLEtBQXdCLEtBQXpCLEdBQWtDLEtBQWxDLEdBQTBDO0FBSHZELHFCQURrRDtBQU14RCxtQ0FBZSxJQU55QztBQU94RCxtQ0FBZSxDQUFDLFFBQUQsQ0FQeUM7QUFReEQsNkJBQVMsaUJBQVUsSUFBVixFQUFnQjtBQUNyQiw2QkFBSyxRQUFMLENBQWMsS0FBZCxHQUFzQixJQUF0QjtBQUNILHFCQVZ1RDtBQVd4RCxvQ0FBZ0IsQ0FBQyxRQUFELENBWHdDO0FBWXhELDhCQUFVLGtCQUFVLElBQVYsRUFBZ0I7QUFDdEIsNEJBQUksZUFBZSxLQUFLLElBQUwsT0FBZ0IsS0FBSyxRQUFMLEVBQW5DO0FBQ0EsNEJBQUksVUFBVSxDQUFkO0FBQ0EsNEJBQUksVUFBVSxDQUFkO0FBQ0EsNEJBQUksV0FBVyxLQUFLLE1BQUwsQ0FBWSxXQUFaLENBQXdCLEtBQXhCLEVBQWY7O0FBRUEsNEJBQUksS0FBSyxJQUFMLENBQVUsU0FBVixLQUF3QixVQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsQ0FBMEIsVUFBbEQsSUFBZ0UsS0FBSyxJQUFMLENBQVUsU0FBVixLQUF3QixVQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsQ0FBMEIsSUFBdEgsRUFBNEg7QUFDeEgsZ0NBQUksQ0FBQyxZQUFMLEVBQW1CO0FBQ2YsMENBQVUsS0FBSyxNQUFMLEtBQWdCLEtBQUssSUFBTCxDQUFVLFNBQTFCLEdBQXNDLEtBQUssTUFBTCxDQUFZLEtBQWxELEdBQTBELENBQTFELEdBQThELEtBQUssSUFBTCxDQUFVLFNBQVYsR0FBc0IsS0FBSyxNQUFMLENBQVksS0FBMUc7QUFDQSx5Q0FBUyxDQUFULElBQWMsT0FBZDtBQUNIO0FBQ0o7O0FBRUQsNEJBQUksS0FBSyxJQUFMLENBQVUsU0FBVixLQUF3QixVQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsQ0FBMEIsUUFBbEQsSUFBOEQsS0FBSyxJQUFMLENBQVUsU0FBVixLQUF3QixVQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsQ0FBMEIsSUFBcEgsRUFBMEg7QUFDdEgsZ0NBQUksQ0FBQyxZQUFMLEVBQW1CO0FBQ2YsMENBQVUsS0FBSyxNQUFMLEtBQWdCLEtBQUssSUFBTCxDQUFVLFNBQTFCLEdBQXNDLEtBQUssTUFBTCxDQUFZLE1BQWxELEdBQTJELENBQTNELEdBQStELEtBQUssSUFBTCxDQUFVLFNBQVYsR0FBc0IsS0FBSyxNQUFMLENBQVksTUFBM0c7QUFDQSx5Q0FBUyxDQUFULElBQWMsT0FBZDtBQUNIO0FBQ0o7O0FBRUQsNkJBQUssTUFBTCxDQUFZLFdBQVosQ0FBd0IsUUFBeEIsRUFBa0MsS0FBSyxJQUFMLENBQVUsYUFBNUM7QUFDSCxxQkFqQ3VEO0FBa0N4RCxzQ0FBa0IsQ0FBQyxRQUFEO0FBbENzQyxpQkFBM0IsQ0FBakIsQ0FBaEI7O0FBcUNBO0FBQ0Esb0JBQUksTUFBTSxNQUFOLElBQWdCLE1BQU0sT0FBMUIsRUFBbUM7QUFDL0Isa0NBQWMsTUFBZCxDQUFxQixjQUFjLElBQW5DLEVBQXlDLFdBQVcsR0FBcEQsRUFBeUQ7QUFDckQsbUNBQVc7QUFEMEMscUJBQXpELEVBRUc7QUFDQyxtQ0FBVyxNQUFNLFNBRGxCO0FBRUMsOEJBQU0sTUFBTSxNQUFOLElBQWdCLE9BQU87QUFGOUIscUJBRkgsRUFLRyxDQUxIOztBQU9BLGtDQUFjLEVBQWQsQ0FBaUIsY0FBYyxJQUEvQixFQUFxQyxXQUFXLEdBQWhELEVBQXFEO0FBQ2pELG1DQUFXLENBRHNDO0FBRWpELDhCQUFNLE1BQU0sT0FBTixJQUFpQixPQUFPO0FBRm1CLHFCQUFyRCxFQUdHLFdBQVcsR0FIZDtBQUlIO0FBQ0Q7QUFiQSxxQkFjSyxJQUFJLE1BQU0sTUFBTixJQUFnQixDQUFDLE1BQU0sT0FBM0IsRUFBb0M7QUFDckMsc0NBQWMsTUFBZCxDQUFxQixjQUFjLElBQW5DLEVBQXlDLFFBQXpDLEVBQW1EO0FBQy9DLHVDQUFXO0FBRG9DLHlCQUFuRCxFQUVHO0FBQ0MsdUNBQVcsTUFBTSxTQURsQjtBQUVDLGtDQUFNLE1BQU0sTUFBTixJQUFnQixPQUFPO0FBRjlCLHlCQUZILEVBS0csQ0FMSDtBQU1IO0FBQ0Q7QUFSSyx5QkFTQSxJQUFJLENBQUMsTUFBTSxNQUFQLElBQWlCLE1BQU0sT0FBM0IsRUFBb0M7QUFDckMsMENBQWMsTUFBZCxDQUFxQixjQUFjLElBQW5DLEVBQXlDLFFBQXpDLEVBQW1EO0FBQy9DLDJDQUFXLE1BQU07QUFEOEIsNkJBQW5ELEVBRUc7QUFDQywyQ0FBVyxDQURaO0FBRUMsc0NBQU0sTUFBTSxPQUFOLElBQWlCLE9BQU87QUFGL0IsNkJBRkgsRUFLRyxDQUxIO0FBTUg7QUFDRDtBQVJLLDZCQVNBLElBQUksUUFBUSxJQUFaLEVBQWtCO0FBQ25CLDhDQUFjLE1BQWQsQ0FBcUIsY0FBYyxJQUFuQyxFQUF5QyxRQUF6QyxFQUFtRDtBQUMvQywrQ0FBVztBQURvQyxpQ0FBbkQsRUFFRztBQUNDLCtDQUFXLE1BQU0sU0FEbEI7QUFFQywwQ0FBTSxRQUFRLElBQVIsSUFBZ0IsT0FBTztBQUY5QixpQ0FGSCxFQUtHLENBTEg7QUFNSDtBQUNEO0FBUkssaUNBU0E7QUFDRCxrREFBYyxJQUFkLENBQW1CLFNBQW5CLEdBQStCLE1BQU0sU0FBckM7QUFDQSxrREFBYyxFQUFkLENBQWlCLGNBQWMsSUFBL0IsRUFBcUMsUUFBckMsRUFBK0MsRUFBL0MsRUFBbUQsQ0FBbkQ7QUFDSDs7QUFFRCw2QkFBYSxHQUFiLENBQWlCLGFBQWpCLEVBQWdDLENBQWhDO0FBQ0g7O0FBRUQsaUJBQUssR0FBTCxDQUFTLFlBQVQ7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7OzswQ0FXbUIsTSxFQUFRLEssRUFBTztBQUM5QixnQkFBSSxTQUFTO0FBQ1Qsd0JBQVMsT0FBTyxNQUFQLEtBQWtCLElBQW5CLEdBQTJCLE9BQU8sTUFBbEMsR0FBMkMsRUFEMUM7QUFFVCwwQkFBVyxPQUFPLFFBQVAsS0FBb0IsSUFBckIsR0FBNkIsT0FBTyxRQUFwQyxHQUErQyxFQUZoRDtBQUdULDBCQUFVLE9BQU8sUUFIUjtBQUlULHNCQUFNLE9BQU87QUFKSixhQUFiOztBQU9BLGdCQUFJLGFBQWEsS0FBakI7QUFDQTtBQUNBLGdCQUFJLG9CQUFvQixPQUFPLFFBQVAsQ0FBZ0IsT0FBTyxNQUFQLENBQWMsQ0FBOUIsQ0FBeEI7QUFDQSxnQkFBSSxvQkFBb0IsT0FBTyxRQUFQLENBQWdCLE9BQU8sTUFBUCxDQUFjLENBQTlCLENBQXhCO0FBQ0EsZ0JBQUksbUJBQW1CLHFCQUFxQixpQkFBNUM7QUFDQTtBQUNBLGdCQUFJLHNCQUFzQixPQUFPLFFBQVAsQ0FBZ0IsT0FBTyxRQUFQLENBQWdCLENBQWhDLENBQTFCO0FBQ0EsZ0JBQUksc0JBQXNCLE9BQU8sUUFBUCxDQUFnQixPQUFPLFFBQVAsQ0FBZ0IsQ0FBaEMsQ0FBMUI7QUFDQSxnQkFBSSxxQkFBcUIsdUJBQXVCLG1CQUFoRDtBQUNBLGdCQUFJLG1CQUFtQixrQkFBdkI7QUFDQSxnQkFBSSxxQkFBcUIsT0FBTyxRQUFQLENBQWdCLE9BQU8sUUFBdkIsS0FBb0MsT0FBTyxRQUFQLEtBQW9CLE1BQU0sUUFBdkY7QUFDQSxnQkFBSSxpQkFBaUIsT0FBTyxRQUFQLENBQWdCLE9BQU8sSUFBdkIsS0FBZ0MsT0FBTyxJQUFQLEtBQWdCLE1BQU0sSUFBM0U7O0FBRUEsZ0JBQUksc0JBQXNCLHVCQUFjLEtBQWQsQ0FBb0IsTUFBTSxJQUExQixFQUFnQyxNQUFNLElBQXRDLEVBQTRDLE1BQTVDLENBQW1ELGVBQU0sUUFBTixDQUFlLENBQUMsTUFBTSxRQUF0QixDQUFuRCxDQUExQjtBQUNBLGdCQUFJLGNBQWMsS0FBSyxNQUFMLENBQVksTUFBOUI7QUFDQSxnQkFBSSxRQUFKO0FBQ0EsZ0JBQUksV0FBVyxxQkFBWSxvQkFBb0IsT0FBTyxNQUFQLENBQWMsQ0FBbEMsR0FBc0MsTUFBTSxNQUFOLENBQWEsQ0FBL0QsRUFBa0Usb0JBQW9CLE9BQU8sTUFBUCxDQUFjLENBQWxDLEdBQXNDLE1BQU0sTUFBTixDQUFhLENBQXJILENBQWY7QUFDQSxnQkFBSSxhQUFhLHFCQUFZLHNCQUFzQixPQUFPLFFBQVAsQ0FBZ0IsQ0FBdEMsR0FBMEMsTUFBTSxRQUFOLENBQWUsQ0FBckUsRUFBd0Usc0JBQXNCLE9BQU8sUUFBUCxDQUFnQixDQUF0QyxHQUEwQyxNQUFNLFFBQU4sQ0FBZSxDQUFqSSxDQUFqQjtBQUNBLGdCQUFJLGFBQWEscUJBQXFCLE9BQU8sUUFBNUIsR0FBdUMsTUFBTSxRQUE5RDtBQUNBLGdCQUFJLFNBQVMsaUJBQWlCLE9BQU8sSUFBeEIsR0FBK0IsTUFBTSxJQUFsRDtBQUNBLGdCQUFJLG1CQUFtQix1QkFBYyxLQUFkLENBQW9CLE1BQXBCLEVBQTRCLE1BQTVCLEVBQW9DLE1BQXBDLENBQTJDLGVBQU0sUUFBTixDQUFlLENBQUMsVUFBaEIsQ0FBM0MsQ0FBdkI7O0FBRUE7QUFDQSxnQkFBSSxDQUFDLGdCQUFELElBQXFCLENBQUMsa0JBQTFCLEVBQThDO0FBQzFDLDZCQUFhLElBQWI7QUFDQSx5QkFBUyxJQUFULENBQWMsTUFBTSxRQUFwQjtBQUNIO0FBQ0Q7QUFKQSxpQkFLSyxJQUFJLG9CQUFvQixDQUFDLGtCQUF6QixFQUE2QztBQUM5QyxpQ0FBYSxJQUFiO0FBQ0EseUNBQXFCLElBQXJCO0FBQ0Esa0NBQWMsS0FBSyxNQUFMLENBQVksa0NBQVosQ0FBK0MsUUFBL0MsRUFBeUQsTUFBTSxRQUEvRCxFQUF5RSxLQUFLLE1BQUwsQ0FBWSxNQUFyRixFQUE2RixtQkFBN0YsQ0FBZDtBQUNBLGlDQUFhLEtBQUssTUFBTCxDQUFZLHFDQUFaLENBQWtELFFBQWxELEVBQTRELFdBQTVELEVBQXlFLEtBQUssTUFBTCxDQUFZLE1BQXJGLEVBQTZGLFFBQTdGLEVBQXVHLGdCQUF2RyxDQUFiO0FBQ0g7O0FBRUQsdUJBQVcsS0FBSyxNQUFMLENBQVksd0JBQVosQ0FBcUMsVUFBckMsRUFBaUQsS0FBSyxNQUFMLENBQVksTUFBN0QsRUFBcUUsUUFBckUsRUFBK0UsZ0JBQS9FLENBQVg7O0FBRUEsbUJBQU87QUFDSCx5QkFBUyxtQkFBbUIsU0FBUyxDQUE1QixHQUFnQyxJQUR0QztBQUVILHlCQUFTLG1CQUFtQixTQUFTLENBQTVCLEdBQWdDLElBRnRDO0FBR0gsd0JBQVEsY0FBYyxnQkFBZCxHQUFpQyxRQUFqQyxHQUE0QyxJQUhqRDtBQUlILDBCQUFVLHFCQUFxQixVQUFyQixHQUFrQyxJQUp6QztBQUtILDBCQUFVLHFCQUFxQixVQUFyQixHQUFrQyxJQUx6QztBQU1ILHNCQUFNLGlCQUFpQixNQUFqQixHQUEwQjtBQU43QixhQUFQO0FBUUg7O0FBRUQ7Ozs7Ozs7Ozt5Q0FNa0I7QUFDZCxtQkFBTztBQUNILHdCQUFRLEtBQUssTUFBTCxDQUFZLGVBQVosQ0FBNEIsS0FBNUIsRUFETDtBQUVILDBCQUFVLEtBQUssTUFBTCxDQUFZLFFBQVosQ0FBcUIsS0FBckIsRUFGUDtBQUdILDBCQUFVLEtBQUssTUFBTCxDQUFZLFFBSG5CO0FBSUgsc0JBQU0sS0FBSyxNQUFMLENBQVk7QUFKZixhQUFQO0FBTUg7O0FBRUQ7Ozs7Ozs7OztxQ0FNYyxFLEVBQUksSyxFQUFPO0FBQ3JCLG1CQUFPO0FBQ0gsd0JBQVMsR0FBRyxNQUFILEtBQWMsSUFBZixHQUF1QixHQUFHLE1BQTFCLEdBQW1DLE1BQU0sTUFEOUM7QUFFSCwwQkFBVyxHQUFHLFFBQUgsS0FBZ0IsSUFBakIsR0FBeUIsR0FBRyxRQUE1QixHQUF1QyxNQUFNLFFBRnBEO0FBR0gsMEJBQVcsR0FBRyxRQUFILEtBQWdCLElBQWpCLEdBQXlCLEdBQUcsUUFBNUIsR0FBdUMsTUFBTSxRQUhwRDtBQUlILHNCQUFPLEdBQUcsSUFBSCxLQUFZLElBQWIsR0FBcUIsR0FBRyxJQUF4QixHQUErQixNQUFNO0FBSnhDLGFBQVA7QUFNSDs7QUFFRDs7Ozs7Ozs7Ozt1Q0FPZ0IsSyxFQUFPLFUsRUFBWTtBQUMvQixnQkFBSSxVQUFVLFNBQWQsRUFBeUI7QUFDckIsNkJBQWMsZUFBZSxTQUFoQixHQUE2QixVQUE3QixHQUEwQyxLQUFLLGNBQUwsRUFBdkQ7O0FBRUEsb0JBQUksY0FBYyxLQUFLLFdBQUwsQ0FBaUIsTUFBTSxLQUFOLENBQVksTUFBWixDQUFtQixNQUFwQyxFQUE0QyxNQUFNLEtBQU4sQ0FBWSxNQUFaLENBQW1CLFFBQS9ELEVBQXlFLE1BQU0sS0FBTixDQUFZLE1BQVosQ0FBbUIsUUFBNUYsRUFBc0csTUFBTSxLQUFOLENBQVksTUFBWixDQUFtQixJQUF6SCxDQUFsQjtBQUNBLG9CQUFJLFVBQVUsS0FBSyxpQkFBTCxDQUF1QixXQUF2QixFQUFvQyxVQUFwQyxDQUFkO0FBQ0Esb0JBQUksV0FBVyxLQUFLLFlBQUwsQ0FBa0IsT0FBbEIsRUFBMkIsVUFBM0IsQ0FBZjs7QUFFQSxxQkFBSyxhQUFMLEdBQXFCLFVBQXJCO0FBQ0Esc0JBQU0sS0FBTixDQUFZLEtBQVosR0FBb0IsVUFBcEI7QUFDQSxzQkFBTSxLQUFOLENBQVksR0FBWixHQUFrQixRQUFsQjtBQUNBLHNCQUFNLEtBQU4sQ0FBWSxNQUFaLEdBQXFCLFdBQXJCO0FBQ0Esc0JBQU0sS0FBTixDQUFZLEVBQVosR0FBaUIsT0FBakI7O0FBRUE7QUFDQSxxQkFBSyxNQUFMLENBQVksa0JBQVosQ0FBK0IsUUFBUSxNQUF2QztBQUNBLHNCQUFNLElBQU4sQ0FBVyxVQUFYLEdBQXdCLFFBQVEsT0FBaEM7QUFDQSxzQkFBTSxJQUFOLENBQVcsVUFBWCxHQUF3QixRQUFRLE9BQWhDO0FBQ0Esc0JBQU0sSUFBTixDQUFXLFFBQVgsR0FBc0IsUUFBUSxRQUE5QjtBQUNBLHNCQUFNLElBQU4sQ0FBVyxJQUFYLEdBQWtCLFFBQVEsSUFBMUI7QUFDSDs7QUFFRCxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7b0NBVWEsTSxFQUFRLFEsRUFBVSxRLEVBQVUsSSxFQUFNO0FBQzNDLGdCQUFJLGFBQWEsVUFBYixJQUEyQixLQUFLLGFBQUwsQ0FBbUIsUUFBbEQsRUFBNEQ7QUFDeEQsMkJBQVcsS0FBSyxhQUFMLENBQW1CLFFBQTlCO0FBQ0g7O0FBRUQsZ0JBQUksYUFBYSxVQUFiLElBQTJCLENBQUMscUJBQU0sS0FBSyxhQUFMLENBQW1CLFFBQXpCLENBQWhDLEVBQW9FO0FBQ2hFLDJCQUFXLEtBQUssYUFBTCxDQUFtQixRQUE5QjtBQUNIOztBQUVELGdCQUFJLFNBQVMsVUFBVCxJQUF1QixDQUFDLHFCQUFNLEtBQUssYUFBTCxDQUFtQixJQUF6QixDQUE1QixFQUE0RDtBQUN4RCx1QkFBTyxLQUFLLGFBQUwsQ0FBbUIsSUFBMUI7QUFDSDs7QUFFRCxtQkFBTztBQUNILHdCQUFRLGdCQUFNLGFBQU4sQ0FBb0IsTUFBcEIsRUFBNEIsS0FBSyxNQUFMLENBQVksS0FBWixDQUFrQixJQUE5QyxDQURMO0FBRUgsMEJBQVUsZ0JBQU0sYUFBTixDQUFvQixRQUFwQixFQUE4QixLQUFLLE1BQUwsQ0FBWSxLQUFaLENBQWtCLElBQWhELENBRlA7QUFHSCwwQkFBVSxDQUFDLHFCQUFNLFFBQU4sQ0FBRCxHQUFtQixRQUFuQixHQUE4QixJQUhyQztBQUlILHNCQUFNLFFBQVE7QUFKWCxhQUFQO0FBTUg7O0FBRUQ7Ozs7Ozs7Ozs7b0NBT2EsSyxFQUFPO0FBQ2hCLGdCQUFJLGNBQWMsSUFBbEI7O0FBRUEsZ0JBQUksS0FBSixFQUFXO0FBQ1AsOEJBQWM7QUFDViwrQkFBVyxxQkFBTSxNQUFNLFNBQVosSUFBeUIsQ0FBekIsR0FBNkIsTUFBTSxTQURwQztBQUVWLCtCQUFXLHFCQUFNLE1BQU0sU0FBWixJQUF5QixVQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsQ0FBMEIsSUFBbkQsR0FBMEQsTUFBTSxTQUZqRTtBQUdWLDRCQUFRLE1BQU0sTUFISjtBQUlWLDZCQUFTLE1BQU0sT0FKTDtBQUtWLG1DQUFlLE1BQU07QUFMWCxpQkFBZDtBQU9IOztBQUVELG1CQUFPLFdBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7a0NBUVc7QUFDUDtBQUNBLGlCQUFLLE1BQUwsR0FBYyxJQUFkO0FBQ0EsaUJBQUssZUFBTCxHQUF1QixJQUF2QjtBQUNBLGlCQUFLLGFBQUwsR0FBcUIsSUFBckI7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2dDQTJCUyxLLEVBQU8sUSxFQUFVLE8sRUFBUztBQUMvQixpQkFBSyxRQUFMLENBQWM7QUFDViwwQkFBVSxNQUFNLFFBRE47QUFFVix3QkFBUSxNQUFNLE1BRko7QUFHViwwQkFBVSxNQUFNLFFBSE47QUFJVix1QkFBTyxNQUFNLEtBSkg7QUFLVixzQkFBTSxNQUFNO0FBTEYsYUFBZCxFQU1HLFFBTkgsRUFNYSxPQU5iOztBQVFBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0JBaUJRLFEsRUFBVSxRLEVBQVUsTyxFQUFTO0FBQ2pDLGlCQUFLLFFBQUwsQ0FBYztBQUNWLDBCQUFVO0FBREEsYUFBZCxFQUVHLFFBRkgsRUFFYSxPQUZiOztBQUlBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQ0FnQlUsTSxFQUFRLFEsRUFBVSxRLEVBQVUsTyxFQUFTO0FBQzNDLGlCQUFLLFFBQUwsQ0FBYztBQUNWLHdCQUFRLE1BREU7QUFFViwwQkFBVTtBQUZBLGFBQWQsRUFHRyxRQUhILEVBR2EsT0FIYjs7QUFLQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7O2lDQVdVLFEsRUFBVSxRLEVBQVUsTyxFQUFTO0FBQ25DLGlCQUFLLFFBQUwsQ0FBYztBQUNWLDBCQUFVO0FBREEsYUFBZCxFQUVHLFFBRkgsRUFFYSxPQUZiOztBQUlBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OzhCQWVPLFMsRUFBVyxRLEVBQVUsUyxFQUFXLE8sRUFBUztBQUM1QyxzQkFBVSxXQUFXLEVBQXJCOztBQUVBLGlCQUFLLE9BQUwsQ0FBYTtBQUNULHVCQUFPO0FBQ0gsK0JBQVcsU0FEUjtBQUVILCtCQUFXLFNBRlI7QUFHSCw0QkFBUSxRQUFRLE1BSGI7QUFJSCw2QkFBUyxRQUFRLE9BSmQ7QUFLSCxtQ0FBZSxRQUFRO0FBTHBCO0FBREUsYUFBYixFQVFHLFFBUkgsRUFRYSxPQVJiOztBQVVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrQkFnQlEsTSxFQUFRLEksRUFBTSxRLEVBQVUsTyxFQUFTO0FBQ3JDLGlCQUFLLFFBQUwsQ0FBYztBQUNWLHdCQUFRLE1BREU7QUFFVixzQkFBTTtBQUZJLGFBQWQsRUFHRyxRQUhILEVBR2EsT0FIYjs7QUFLQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7OytCQVdRLEksRUFBTSxRLEVBQVUsTyxFQUFTO0FBQzdCLGlCQUFLLFFBQUwsQ0FBYztBQUNWLHNCQUFNO0FBREksYUFBZCxFQUVHLFFBRkgsRUFFYSxPQUZiOztBQUlBLG1CQUFPLElBQVA7QUFDSDs7OztFQWpzQm1CLFc7O0FBb3NCeEI7Ozs7OztBQUlBLFVBQVUsS0FBVixHQUFrQjtBQUNkLGVBQVc7QUFDUDs7O0FBR0EsY0FBTSxDQUpDO0FBS1A7OztBQUdBLG9CQUFZLENBUkw7QUFTUDs7O0FBR0Esa0JBQVU7QUFaSDtBQURHLENBQWxCOztrQkFpQmUsUzs7O0FDandCZjtBQUNBOzs7Ozs7Ozs7Ozs7QUFNQTs7OztBQUNBOzs7Ozs7QUFFQTs7Ozs7OztJQU9NLGdCO0FBQ0YsOEJBQWEsTUFBYixFQUFxQjtBQUFBOztBQUNqQjs7OztBQUlBLGFBQUssTUFBTCxHQUFjLE1BQWQ7O0FBRUE7Ozs7QUFJQSxhQUFLLGdCQUFMLEdBQXdCLElBQXhCOztBQUVBOzs7O0FBSUEsYUFBSyxXQUFMLEdBQW1CLEVBQW5CO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7O0FBbUJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NEJBMkJLLEksRUFBTSxTLEVBQVc7QUFDbEIsZ0JBQUkscUJBQUo7O0FBRUEsZ0JBQUksS0FBSyxXQUFMLENBQWlCLElBQWpCLENBQUosRUFBNEI7QUFDeEIscUJBQUssV0FBTCxDQUFpQixJQUFqQixFQUF1QixPQUF2QjtBQUNIOztBQUVELGdCQUFJLFVBQVUsSUFBVixLQUFtQixnQkFBSyxTQUE1QixFQUF1QztBQUNuQywrQkFBZSxTQUFmO0FBQ0gsYUFGRCxNQUdLO0FBQ0QsK0JBQWUsd0JBQWMsS0FBSyxNQUFuQixDQUFmO0FBQ0EsMEJBQVUsU0FBVixDQUFvQixPQUFwQixDQUE0QixVQUFDLFFBQUQsRUFBYztBQUN0QyxpQ0FBYSxPQUFiLENBQXFCO0FBQ2pCLGdDQUFRLFNBQVMsTUFEQTtBQUVqQixrQ0FBVSxTQUFTLFFBRkY7QUFHakIsa0NBQVUsU0FBUyxRQUhGO0FBSWpCLCtCQUFPLFNBQVMsS0FKQztBQUtqQiw4QkFBTSxTQUFTO0FBTEUscUJBQXJCLEVBTUcsU0FBUyxRQU5aLEVBTXNCLFNBQVMsT0FOL0I7QUFPSCxpQkFSRDtBQVVIOztBQUVELGlCQUFLLFdBQUwsQ0FBaUIsSUFBakIsSUFBeUIsWUFBekI7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7OztrQ0FLVztBQUNQLGlCQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLFdBQXJCLEVBQWtDO0FBQzlCLHFCQUFLLFdBQUwsQ0FBaUIsR0FBakIsRUFBc0IsT0FBdEI7QUFDSDs7QUFFRCxpQkFBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLGlCQUFLLGdCQUFMLEdBQXdCLElBQXhCO0FBQ0EsaUJBQUssV0FBTCxHQUFtQixFQUFuQjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs0QkFNSyxJLEVBQU07QUFDUCxtQkFBTyxLQUFLLFdBQUwsQ0FBaUIsSUFBakIsQ0FBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Z0NBTVM7QUFDTCxnQkFBSSxLQUFLLGdCQUFULEVBQTJCO0FBQ3ZCLHFCQUFLLGdCQUFMLENBQXNCLEtBQXRCLENBQTRCLElBQTVCLEVBQWtDLEtBQWxDO0FBQ0g7O0FBRUQsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7NkJBTU0sSSxFQUFNO0FBQ1IsZ0JBQUksU0FBSjs7QUFFQSxnQkFBSSxPQUFPLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDMUIsNEJBQVksS0FBSyxXQUFMLENBQWlCLElBQWpCLENBQVo7QUFDSDs7QUFFRCxnQkFBSSxTQUFKLEVBQWU7QUFDWCxxQkFBSyxnQkFBTCxHQUF3QixTQUF4QjtBQUNBLHFCQUFLLGdCQUFMLENBQXNCLFVBQXRCLEdBQW1DLE9BQW5DLENBQTJDLEtBQTNDLEVBQWtELEtBQWxEO0FBQ0gsYUFIRCxNQUlLLElBQUksU0FBUyxTQUFULElBQXNCLEtBQUssZ0JBQS9CLEVBQWlEO0FBQ2xELHFCQUFLLGdCQUFMLENBQXNCLElBQXRCLENBQTJCLElBQTNCLEVBQWlDLEtBQWpDO0FBQ0g7O0FBRUQsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7aUNBTVU7QUFDTixnQkFBSSxLQUFLLGdCQUFULEVBQTJCO0FBQ3ZCLHFCQUFLLGdCQUFMLENBQXNCLE1BQXRCLENBQTZCLElBQTdCLEVBQW1DLEtBQW5DO0FBQ0g7O0FBRUQsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7a0NBTXNCO0FBQUEsZ0JBQWIsSUFBYSx1RUFBTixJQUFNOztBQUNsQixnQkFBSSxTQUFKOztBQUVBLGdCQUFJLE9BQU8sSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUMxQiw0QkFBWSxLQUFLLFdBQUwsQ0FBaUIsSUFBakIsQ0FBWjtBQUNIOztBQUVELGdCQUFJLFNBQUosRUFBZTtBQUNYLHFCQUFLLGdCQUFMLEdBQXdCLFNBQXhCO0FBQ0EscUJBQUssZ0JBQUwsQ0FBc0IsVUFBdEIsR0FBbUMsT0FBbkMsQ0FBMkMsQ0FBM0MsRUFBOEMsS0FBOUM7QUFDSCxhQUhELE1BSUssSUFBSSxTQUFTLElBQVQsSUFBaUIsS0FBSyxnQkFBMUIsRUFBNEM7QUFDN0Msb0JBQUksT0FBTyxLQUFLLGdCQUFMLENBQXNCLElBQXRCLEVBQVg7QUFDQSxxQkFBSyxnQkFBTCxDQUFzQixPQUF0QjtBQUNIOztBQUVELG1CQUFPLElBQVA7QUFDSDs7OzRCQTVLa0I7QUFDZixnQkFBSSxXQUFXLEtBQUssZ0JBQUwsR0FBd0IsS0FBSyxnQkFBTCxDQUFzQixRQUF0QixFQUF4QixHQUEyRCxDQUExRTtBQUNBLG1CQUFPLFdBQVcsQ0FBWCxJQUFnQixXQUFXLENBQWxDO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzRCQUtnQjtBQUNaLG1CQUFPLEtBQUssZ0JBQUwsR0FBd0IsS0FBSyxnQkFBTCxDQUFzQixNQUF0QixFQUF4QixHQUF5RCxLQUFoRTtBQUNIOzs7Ozs7a0JBbUtVLGdCOzs7QUMxTmY7QUFDQTs7Ozs7O0FBTUE7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7OztBQUVBLElBQU0sZ0JBQWdCO0FBQ2xCLGVBQVc7QUFETyxDQUF0Qjs7QUFJQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBNkJNLE07QUFDRixzQkFhUTtBQUFBOztBQUFBLHVGQUFKLEVBQUk7QUFBQSwrQkFaSixNQVlJO0FBQUEsWUFaSixNQVlJLCtCQVpLLElBWUw7QUFBQSxtQ0FYSixVQVdJO0FBQUEsWUFYSixVQVdJLG1DQVhTLEtBV1Q7QUFBQSwrQkFWSixNQVVJO0FBQUEsWUFWSixNQVVJLCtCQVZLLENBVUw7QUFBQSxnQ0FUSixPQVNJO0FBQUEsWUFUSixPQVNJLGdDQVRNLENBU047QUFBQSxnQ0FSSixPQVFJO0FBQUEsWUFSSixPQVFJLGdDQVJNLEdBUU47QUFBQSxxQ0FQSixZQU9JO0FBQUEsWUFQSixZQU9JLHFDQVBXLElBT1g7QUFBQSx1Q0FOSixjQU1JO0FBQUEsWUFOSixjQU1JLHVDQU5hLElBTWI7QUFBQSxpQ0FMSixRQUtJO0FBQUEsWUFMSixRQUtJLGlDQUxPLElBS1A7QUFBQSw2QkFKSixJQUlJO0FBQUEsWUFKSixJQUlJLDZCQUpHLFNBSUg7QUFBQSxvQ0FISixXQUdJO0FBQUEsWUFISixXQUdJLG9DQUhVLEtBR1Y7QUFBQSx5Q0FGSixvQkFFSTtBQUFBLFlBRkosb0JBRUkseUNBRm1CLElBRW5CO0FBQUEsOEJBREosS0FDSTtBQUFBLFlBREosS0FDSSw4QkFESSxDQUNKOztBQUFBOztBQUVKOzs7O0FBSUEsYUFBSyxVQUFMLEdBQWtCLCtCQUFxQixJQUFyQixDQUFsQjs7QUFFQTs7OztBQUlBLGFBQUssTUFBTCxHQUFjLHFCQUFZLEtBQVosRUFBbUIsTUFBbkIsRUFBMkIsY0FBM0IsQ0FBMEMsR0FBMUMsQ0FBZDs7QUFFQTs7OztBQUlBLGFBQUssVUFBTCxHQUFtQixlQUFlLElBQWhCLEdBQXdCLElBQXhCLEdBQStCLEtBQWpEOztBQUVBOzs7OztBQUtBLGFBQUssTUFBTCxHQUFjLE1BQWQ7O0FBRUE7Ozs7O0FBS0EsYUFBSyxXQUFMLEdBQW1CLEtBQW5COztBQUVBOzs7OztBQUtBLGFBQUssVUFBTCxHQUFrQixLQUFsQjs7QUFFQTs7OztBQUlBLGFBQUssWUFBTCxHQUFvQixJQUFwQjs7QUFFQTs7OztBQUlBLGFBQUssWUFBTCxHQUFvQixJQUFwQjs7QUFFQTs7OztBQUlBLGFBQUssWUFBTCxHQUFvQixJQUFwQjs7QUFFQTs7OztBQUlBLGFBQUssWUFBTCxHQUFvQixJQUFwQjs7QUFFQTs7Ozs7QUFLQSxhQUFLLE9BQUwsR0FBZSxPQUFmOztBQUVBOzs7OztBQUtBLGFBQUssT0FBTCxHQUFlLE9BQWY7O0FBRUE7Ozs7QUFJQSxhQUFLLFFBQUwsR0FBZ0IscUJBQVksQ0FBWixFQUFlLENBQWYsQ0FBaEI7O0FBRUE7Ozs7QUFJQSxhQUFLLFNBQUwsR0FBaUIscUJBQVksQ0FBWixFQUFlLENBQWYsQ0FBakI7O0FBRUE7Ozs7QUFJQSxhQUFLLFdBQUwsR0FBbUIscUJBQVksQ0FBWixFQUFlLENBQWYsQ0FBbkI7O0FBRUE7Ozs7QUFJQSxhQUFLLFFBQUwsR0FBZ0IsMEJBQWdCLElBQWhCLENBQWhCOztBQUVBOzs7OztBQUtBLGFBQUssUUFBTCxHQUFnQixDQUFoQjs7QUFFQTs7OztBQUlBLGFBQUssTUFBTCxHQUFjLDJCQUFpQixJQUFqQixDQUFkOztBQUVBOzs7OztBQUtBLGFBQUssWUFBTCxHQUFvQixJQUFwQjs7QUFFQTs7OztBQUlBLGFBQUssZUFBTCxHQUF1QixxQkFBWSxDQUFaLEVBQWUsQ0FBZixDQUF2Qjs7QUFFQTs7OztBQUlBLGFBQUssSUFBTCxHQUFhLFNBQVMsSUFBVixHQUFrQixJQUFsQixHQUF5QixnQkFBTSxHQUFOLENBQVUsU0FBVixDQUFvQixJQUFwQixLQUE2QixTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBbEU7O0FBRUE7Ozs7QUFJQSxhQUFLLFdBQUwsR0FBb0IsZ0JBQWdCLElBQWpCLEdBQXlCLElBQXpCLEdBQWdDLEtBQW5EOztBQUVBOzs7O0FBSUEsYUFBSyxvQkFBTCxHQUE0QixvQkFBNUI7O0FBRUE7Ozs7O0FBS0EsYUFBSyxLQUFMLEdBQWEsS0FBYjs7QUFFQTs7Ozs7QUFLQSxhQUFLLGFBQUwsR0FBcUIseUJBQWMsSUFBbkM7O0FBRUE7Ozs7QUFJQSxhQUFLLE9BQUwsR0FBZSxNQUFmOztBQUVBOzs7O0FBSUEsYUFBSyxPQUFMLEdBQWUsNkJBQWY7O0FBRUE7Ozs7QUFJQSxhQUFLLFlBQUwsR0FBb0IsQ0FBcEI7O0FBRUE7Ozs7QUFJQSxhQUFLLEtBQUwsR0FBYSxDQUFiOztBQUVBO0FBQ0EsYUFBSyxjQUFMLENBQW9CLHFCQUFZLFFBQVEsR0FBcEIsRUFBeUIsU0FBUyxHQUFsQyxDQUFwQjs7QUFFQTtBQUNBLFlBQUksaUJBQWlCLElBQXJCLEVBQTJCO0FBQ3ZCLGlCQUFLLFlBQUwsR0FBb0IsWUFBcEI7QUFDSDs7QUFFRCxZQUFJLG1CQUFtQixJQUF2QixFQUE2QjtBQUN6QixpQkFBSyxjQUFMLEdBQXNCLGNBQXRCO0FBQ0g7O0FBRUQsWUFBSSxhQUFhLElBQWpCLEVBQXVCO0FBQ25CLGlCQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDSDs7QUFFRCxhQUFLLFFBQUwsR0FBZ0IsWUFBTTtBQUNsQjtBQUNBLGdCQUFJLE1BQU0sU0FBVixRQUEwQjtBQUN0QixtQ0FBbUIsSUFERztBQUV0Qix3QkFBUSxLQUZjO0FBR3RCLDRCQUFZLG9CQUFVLFNBQVYsRUFBcUI7QUFDN0Isd0JBQUksS0FBSyxNQUFMLENBQVksVUFBWixDQUF1QixnQkFBM0IsRUFBNkM7QUFDekM7QUFDQSw0QkFBSSxZQUFZLEtBQUssTUFBTCxDQUFZLFVBQVosQ0FBdUIsZ0JBQXZDO0FBQ0EsNEJBQUksT0FBTyxVQUFVLElBQVYsRUFBWDs7QUFFQSxrQ0FBVSxJQUFWLENBQWUsQ0FBZixFQUFrQixVQUFsQjs7QUFFQSw0QkFBSSxVQUFVLFVBQVYsQ0FBcUIsQ0FBckIsQ0FBSixFQUE2QjtBQUN6QixpQ0FBSyxNQUFMLENBQVksY0FBWixDQUEyQixVQUFVLFVBQVYsQ0FBcUIsQ0FBckIsRUFBd0IsS0FBeEIsQ0FBOEIsS0FBOUIsQ0FBb0MsUUFBL0Q7QUFDSDs7QUFFRCxrQ0FBVSxJQUFWLENBQWUsSUFBZixFQUFxQixLQUFyQjs7QUFFQSw0QkFBSSxDQUFDLFNBQUwsRUFBZ0I7QUFDWixpQ0FBSyxNQUFMLENBQVksTUFBWjtBQUNIO0FBQ0o7QUFDSixpQkFyQnFCO0FBc0J0QixrQ0FBa0IsQ0FBQyxNQUFLLFVBQUwsQ0FBZ0IsUUFBakI7QUF0QkksYUFBMUIsRUF1QkcsTUF2QkgsQ0F1QlUsTUFBSyxXQXZCZixFQXVCNEIsQ0F2QjVCLEVBdUIrQixFQUFFLFdBQVcsS0FBYixFQXZCL0I7QUF3QkgsU0ExQkQ7O0FBNEJBO0FBQ0EsYUFBSyxPQUFMLENBQWEsV0FBYixDQUF5QixhQUF6QixFQUF3QyxLQUFLLFFBQTdDOztBQUVBO0FBQ0EsWUFBSSxLQUFLLElBQVQsRUFBZTtBQUNYLGlCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFFBQWhCLEdBQTJCLFFBQTNCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsUUFBaEIsR0FBMkIsVUFBM0I7QUFDSDs7QUFFRDtBQUNBLFlBQUksS0FBSyxJQUFMLElBQWEsS0FBSyxNQUFMLENBQVksSUFBN0IsRUFBbUM7QUFDL0IsaUJBQUssSUFBTCxDQUFVLFdBQVYsQ0FBc0IsS0FBSyxNQUFMLENBQVksSUFBbEM7QUFDQSxpQkFBSyxZQUFMLEdBQW9CLDJCQUFpQixJQUFqQixFQUF1QjtBQUN2QywyQkFBVyxLQUFLLFVBRHVCO0FBRXZDLHdCQUFRLGdCQUFVLE1BQVYsRUFBa0I7QUFDdEIsd0JBQUksV0FBVyxPQUFPLHdCQUFQLENBQWdDLHFCQUFZLENBQUMsS0FBSyxDQUFsQixFQUFxQixDQUFDLEtBQUssQ0FBM0IsQ0FBaEMsRUFBK0QsT0FBTyxNQUF0RSxFQUE4RSxPQUFPLGVBQXJGLEVBQXNHLE9BQU8sY0FBN0csQ0FBZjtBQUNBLHdCQUFJLE1BQU0sU0FBVixDQUFvQixNQUFwQixFQUE0QjtBQUN4QiwyQ0FBbUIsSUFESztBQUV4QixnQ0FBUSxLQUZnQjtBQUd4QixvQ0FBWSxvQkFBVSxXQUFWLEVBQXVCO0FBQy9CLHdDQUFZLE1BQVo7QUFDSCx5QkFMdUI7QUFNeEIsMENBQWtCLENBQUMsSUFBRDtBQU5NLHFCQUE1QixFQU9HLE1BUEgsQ0FPVSxRQVBWLEVBT29CLENBUHBCO0FBUUgsaUJBWnNDO0FBYXZDLDJCQUFXLEtBQUssV0FidUI7QUFjdkMseUJBQVMsaUJBQVUsTUFBVixFQUFrQjtBQUN2Qix3QkFBTSxVQUFVLENBQWhCO0FBQ0Esd0JBQU0sV0FBVyxDQUFqQjtBQUNBLHdCQUFJLFdBQVcsS0FBSyxHQUFMLENBQVMsS0FBSyxVQUFMLENBQWdCLE1BQXpCLENBQWY7QUFDQSx3QkFBSSxZQUFZLEtBQUssVUFBTCxDQUFnQixNQUFoQixHQUF5QixDQUF6QixHQUE2QixRQUE3QixHQUF3QyxPQUF4RDtBQUNBLHdCQUFJLG9CQUFvQixLQUFLLGtCQUFMLENBQXdCLE1BQXhCLEdBQWlDLENBQWpDLEdBQXFDLFFBQXJDLEdBQWdELE9BQXhFO0FBQ0Esd0JBQUksVUFBSjtBQUNBLHdCQUFJLG9CQUFvQixzQkFBeEI7QUFDQSx3QkFBSSxnQkFBZ0Isc0JBQXBCO0FBQ0Esd0JBQUksU0FBUyxPQUFPLGVBQXBCO0FBQ0Esd0JBQUksT0FBTyxPQUFPLElBQVAsR0FBYyxPQUFPLElBQVAsR0FBYyxPQUFPLG9CQUFyQixJQUE2QyxXQUFXLENBQVgsR0FBZSxXQUFXLEdBQTFCLEdBQWdDLENBQTdFLEtBQW1GLGNBQWMsT0FBZCxHQUF3QixDQUF4QixHQUE0QixDQUFDLENBQWhILENBQXpCOztBQUVBO0FBQ0Esd0JBQUksY0FBYyxpQkFBZCxJQUFtQyxPQUFPLFVBQVAsQ0FBa0IsSUFBbEIsTUFBNEIsT0FBTyxJQUExRSxFQUFnRjtBQUM1RSxxQ0FBYSxPQUFPLElBQVAsQ0FBWSxxQkFBWixFQUFiO0FBQ0EsMENBQWtCLEdBQWxCLENBQXNCLEtBQUssVUFBTCxDQUFnQixPQUFoQixHQUEwQixXQUFXLElBQTNELEVBQWlFLEtBQUssVUFBTCxDQUFnQixPQUFoQixHQUEwQixXQUFXLEdBQXRHO0FBQ0Esd0NBQWdCLE9BQU8sa0NBQVAsQ0FBMEMsaUJBQTFDLEVBQTZELE9BQU8sUUFBcEUsRUFBOEUsT0FBTyxNQUFyRixFQUE2RixPQUFPLGNBQXBHLENBQWhCO0FBQ0EsZ0NBQVEsR0FBUixDQUFZLFNBQVosRUFBdUIsYUFBdkI7O0FBRUEsNEJBQUksS0FBSyxLQUFMLENBQVcsT0FBTyxDQUFsQixNQUF5QixLQUFLLEtBQUwsQ0FBVyxjQUFjLENBQXpCLENBQXpCLElBQXdELEtBQUssS0FBTCxDQUFXLE9BQU8sQ0FBbEIsTUFBeUIsS0FBSyxLQUFMLENBQVcsY0FBYyxDQUF6QixDQUFyRixFQUFrSDtBQUM5RyxxQ0FBUyxhQUFUO0FBQ0g7O0FBRUQsNEJBQUksTUFBTSxTQUFWLENBQW9CLE1BQXBCLEVBQTRCO0FBQ3hCLCtDQUFtQixJQURLO0FBRXhCLG9DQUFRO0FBRmdCLHlCQUE1QixFQUdHLE1BSEgsQ0FHVSxNQUhWLEVBR2tCLElBSGxCLEVBR3dCLENBSHhCO0FBSUg7QUFDSjtBQTFDc0MsYUFBdkIsQ0FBcEI7QUE0Q0g7O0FBRUQsYUFBSyxZQUFMLENBQWtCLFVBQVUsQ0FBVixDQUFsQjtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBIQTs7Ozs7Ozt3Q0FPaUIsQyxFQUFHO0FBQ2hCLGdCQUFJLEtBQUssT0FBTCxLQUFpQixJQUFyQixFQUEyQjtBQUN2QixvQkFBSSxxQkFBTSxDQUFOLEVBQVMsS0FBSyxZQUFkLEVBQTRCLEtBQUssWUFBakMsQ0FBSjtBQUNIOztBQUVELG1CQUFPLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozt3Q0FPaUIsQyxFQUFHO0FBQ2hCLGdCQUFJLEtBQUssT0FBTCxLQUFpQixJQUFyQixFQUEyQjtBQUN2QixvQkFBSSxxQkFBTSxDQUFOLEVBQVMsS0FBSyxZQUFkLEVBQTRCLEtBQUssWUFBakMsQ0FBSjtBQUNIOztBQUVELG1CQUFPLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OzttQ0FPWSxJLEVBQU07QUFDZCxtQkFBTyxxQkFBTSxJQUFOLEVBQVksS0FBSyxPQUFqQixFQUEwQixLQUFLLE9BQS9CLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7OzsyREFVb0MsaUIsRUFBbUIsYyxFQUFnQixZLEVBQWMsYyxFQUFnQjtBQUNqRyxtQkFBTyxlQUFlLEtBQWYsR0FBdUIsU0FBdkIsQ0FBaUMsY0FBakMsRUFBaUQsUUFBakQsQ0FBMEQsYUFBYSxLQUFiLEdBQXFCLFFBQXJCLENBQThCLGlCQUE5QixDQUExRCxFQUE0RyxTQUE1RyxDQUFzSCxlQUFlLFVBQWYsRUFBdEgsQ0FBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7OzJEQVVvQyxhLEVBQWUsYyxFQUFnQixZLEVBQWMsYyxFQUFnQjtBQUM3RixtQkFBTyxhQUFhLEtBQWIsR0FBcUIsR0FBckIsQ0FBeUIsY0FBYyxLQUFkLEdBQXNCLFNBQXRCLENBQWdDLGNBQWhDLEVBQWdELFFBQWhELENBQXlELGVBQWUsS0FBZixHQUF1QixTQUF2QixDQUFpQyxjQUFqQyxDQUF6RCxDQUF6QixDQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7OzhEQVd1QyxhLEVBQWUsaUIsRUFBbUIsWSxFQUFjLGUsRUFBaUIsYyxFQUFnQjtBQUNwSCxnQkFBSSx3QkFBd0IsS0FBSyx5QkFBTCxDQUErQixlQUEvQixFQUFnRCxjQUFoRCxDQUE1QjtBQUNBLGdCQUFJLFNBQVMsY0FBYyxLQUFkLEdBQXNCLFNBQXRCLENBQWdDLGNBQWhDLEVBQWdELFFBQWhELENBQXlELHFCQUF6RCxFQUFnRixRQUFoRixDQUF5RixpQkFBekYsQ0FBYjs7QUFFQSxtQkFBTyxLQUFLLHdCQUFMLENBQThCLE1BQTlCLEVBQXNDLFlBQXRDLEVBQW9ELGVBQXBELEVBQXFFLGNBQXJFLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7OztpREFVMEIsWSxFQUFjLFksRUFBYyxlLEVBQWlCLGMsRUFBZ0I7QUFDbkYsZ0JBQUksd0JBQXdCLEtBQUsseUJBQUwsQ0FBK0IsZUFBL0IsRUFBZ0QsY0FBaEQsQ0FBNUI7O0FBRUEsbUJBQU8sYUFBYSxLQUFiLEdBQXFCLEdBQXJCLENBQXlCLHFCQUF6QixFQUFnRCxHQUFoRCxDQUFvRCxZQUFwRCxFQUFrRSxTQUFsRSxDQUE0RSxlQUFlLFVBQWYsRUFBNUUsQ0FBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7O2lEQVUwQixjLEVBQWdCLFksRUFBYyxlLEVBQWlCLGMsRUFBZ0I7QUFDckYsZ0JBQUksd0JBQXdCLEtBQUsseUJBQUwsQ0FBK0IsZUFBL0IsRUFBZ0QsY0FBaEQsQ0FBNUI7O0FBRUEsbUJBQU8sZUFBZSxLQUFmLEdBQXVCLFNBQXZCLENBQWlDLGNBQWpDLEVBQWlELFFBQWpELENBQTBELHFCQUExRCxFQUFpRixRQUFqRixDQUEwRixZQUExRixDQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7O2tEQVEyQixlLEVBQWlCLGMsRUFBZ0I7QUFDeEQsbUJBQU8sZ0JBQWdCLEtBQWhCLEdBQXdCLFNBQXhCLENBQWtDLGNBQWxDLEVBQWtELFFBQWxELENBQTJELGVBQTNELENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7aUNBS1U7QUFDTixpQkFBSyxlQUFMLENBQXFCLEdBQXJCLENBQXlCLENBQXpCLEVBQTRCLENBQTVCO0FBQ0EsaUJBQUssUUFBTCxHQUFnQixDQUFoQjtBQUNBLGlCQUFLLElBQUwsR0FBWSxDQUFaO0FBQ0EsaUJBQUssWUFBTCxHQUFvQixDQUFwQjtBQUNBLGlCQUFLLGNBQUwsQ0FBb0IscUJBQVksS0FBSyxLQUFMLEdBQWEsR0FBekIsRUFBOEIsS0FBSyxNQUFMLEdBQWMsR0FBNUMsQ0FBcEI7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozt3Q0FLaUI7QUFDYixnQkFBSSxNQUFKOztBQUVBLGdCQUFJLEtBQUssS0FBVCxFQUFnQjtBQUNaLG9CQUFJLEtBQUssT0FBTCxLQUFpQixJQUFyQixFQUEyQjtBQUN2Qiw2QkFBUztBQUNMLDhCQUFNLElBREQ7QUFFTCw4QkFBTSxJQUZEO0FBR0wsOEJBQU0sSUFIRDtBQUlMLDhCQUFNO0FBSkQscUJBQVQ7QUFNSCxpQkFQRCxNQVFLLElBQUksMEJBQVcsS0FBSyxPQUFoQixDQUFKLEVBQThCO0FBQy9CLDZCQUFTLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsSUFBbEIsQ0FBVDtBQUNILGlCQUZJLE1BR0E7QUFDRCw2QkFBUyxLQUFLLE9BQWQ7QUFDSDs7QUFFRCxxQkFBSyxZQUFMLEdBQW9CLE9BQU8sSUFBM0I7QUFDQSxxQkFBSyxZQUFMLEdBQW9CLE9BQU8sSUFBM0I7QUFDQSxxQkFBSyxZQUFMLEdBQW9CLE9BQU8sSUFBM0I7QUFDQSxxQkFBSyxZQUFMLEdBQW9CLE9BQU8sSUFBM0I7O0FBRUEsb0JBQUksQ0FBQyxLQUFLLFdBQVYsRUFBdUI7QUFDbkIseUJBQUssY0FBTCxDQUFvQixLQUFLLHdCQUFMLENBQThCLEtBQUssU0FBbkMsRUFBOEMsS0FBSyxNQUFuRCxFQUEyRCxLQUFLLGVBQWhFLEVBQWlGLEtBQUssY0FBdEYsQ0FBcEI7QUFDSDs7QUFFRDtBQUNBLHdCQUFRLEdBQVIsQ0FBWSxlQUFaO0FBQ0g7O0FBRUQsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7cUNBTWMsSSxFQUFNLFMsRUFBVztBQUMzQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLElBQXBCLEVBQTBCLFNBQTFCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7cUNBS2MsSSxFQUFNO0FBQ2hCLG1CQUFPLEtBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixJQUFwQixDQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7OztpQ0FNVSxJLEVBQU0sSyxFQUFPO0FBQ25CLGlCQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWdCLElBQWhCLEVBQXNCLEtBQXRCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7aUNBS1UsSSxFQUFNO0FBQ1osbUJBQU8sS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixJQUFoQixDQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7OztpQ0FNVSxJLEVBQU07QUFDWixpQkFBSyxNQUFMLENBQVksY0FBWixDQUEyQixJQUEzQjtBQUNBLGlCQUFLLE1BQUw7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7OztrQ0FLVztBQUNQLGdCQUFJLEtBQUssSUFBTCxJQUFhLEtBQUssSUFBTCxDQUFVLFVBQTNCLEVBQXVDO0FBQ25DLHFCQUFLLElBQUwsQ0FBVSxVQUFWLENBQXFCLFdBQXJCLENBQWlDLEtBQUssSUFBdEM7QUFDSDs7QUFFRCxpQkFBSyxJQUFMLEdBQVksSUFBWjtBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDQSxpQkFBSyxRQUFMLENBQWMsT0FBZDtBQUNBLGlCQUFLLE1BQUwsQ0FBWSxPQUFaO0FBQ0EsaUJBQUssWUFBTCxDQUFrQixPQUFsQjtBQUNBLGlCQUFLLE9BQUwsQ0FBYSxrQkFBYjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzRDQUtxQjtBQUNqQixpQkFBSyxZQUFMLENBQWtCLFdBQWxCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7MkNBS29CO0FBQ2hCLGlCQUFLLFlBQUwsQ0FBa0IsVUFBbEI7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs2Q0FLc0I7QUFDbEIsaUJBQUssWUFBTCxDQUFrQixZQUFsQjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzRDQUtxQjtBQUNqQixpQkFBSyxZQUFMLENBQWtCLFdBQWxCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7cUNBS2MsTyxFQUFTLENBRXRCOztBQUVEOzs7Ozs7eUNBR2tCLENBRWpCOztBQUVEOzs7Ozs7bUNBR1ksQ0FFWDs7QUFFRDs7Ozs7Ozs7aUNBS1U7QUFDTixpQkFBSyxjQUFMOztBQUVBLGdCQUFJLENBQUMsS0FBSyxVQUFWLEVBQXNCO0FBQ2xCLHFCQUFLLFFBQUwsQ0FBYyxVQUFkO0FBQ0EscUJBQUssVUFBTCxHQUFrQixJQUFsQjtBQUNIOztBQUVELGlCQUFLLFFBQUwsQ0FBYyxNQUFkO0FBQ0EsaUJBQUssUUFBTDs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7b0NBT2EsUSxFQUFnQztBQUFBLGdCQUF0QixhQUFzQix1RUFBTixJQUFNOztBQUN6QyxnQkFBSSxhQUFKLEVBQW1CO0FBQ2YscUJBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsS0FBSyxlQUFMLENBQXFCLFNBQVMsQ0FBOUIsQ0FBbEIsRUFBb0QsS0FBSyxlQUFMLENBQXFCLFNBQVMsQ0FBOUIsQ0FBcEQ7QUFDSCxhQUZELE1BR0s7QUFDRCxxQkFBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixTQUFTLENBQTNCLEVBQThCLFNBQVMsQ0FBdkM7QUFDSDs7QUFFRCxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozt1Q0FNZ0IsUSxFQUFVO0FBQ3RCLGlCQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsS0FBSyxlQUFMLENBQXFCLFNBQVMsQ0FBOUIsQ0FBckIsRUFBdUQsS0FBSyxlQUFMLENBQXFCLFNBQVMsQ0FBOUIsQ0FBdkQ7QUFDQSxpQkFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixLQUFLLFdBQXhCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLElBQWYsQ0FBb0IsS0FBSyx3QkFBTCxDQUE4QixLQUFLLFdBQW5DLEVBQWdELEtBQUssTUFBckQsRUFBNkQsS0FBSyxlQUFsRSxFQUFtRixLQUFLLGNBQXhGLENBQXBCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OztnQ0FPUyxLLEVBQU8sTSxFQUFRO0FBQ3BCLGdCQUFJLGFBQWEsS0FBakI7O0FBRUEsZ0JBQUksQ0FBQyxxQkFBTSxLQUFOLENBQUQsSUFBa0IsVUFBVSxLQUFLLEtBQXJDLEVBQTZDO0FBQ3pDLHFCQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0EscUJBQUssTUFBTCxDQUFZLENBQVosR0FBZ0IsUUFBUSxHQUF4QjtBQUNBLDZCQUFhLElBQWI7QUFDSDs7QUFFRCxnQkFBSSxDQUFDLHFCQUFNLE1BQU4sQ0FBRCxJQUFtQixXQUFXLEtBQUssTUFBdkMsRUFBZ0Q7QUFDNUMscUJBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxxQkFBSyxNQUFMLENBQVksQ0FBWixHQUFnQixTQUFTLEdBQXpCO0FBQ0EsNkJBQWEsSUFBYjtBQUNIOztBQUVELGdCQUFJLFVBQUosRUFBZ0I7QUFDWixxQkFBSyxRQUFMLENBQWMsVUFBZDtBQUNBLHFCQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLGFBQWxCO0FBQ0g7O0FBRUQsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7OzJDQU9vQixNLEVBQVE7QUFDeEIsZ0JBQUksVUFBVSxDQUFDLE9BQU8sTUFBUCxDQUFjLEtBQUssZUFBbkIsQ0FBZixFQUFvRDtBQUNoRCxxQkFBSyxlQUFMLENBQXFCLElBQXJCLENBQTBCLE1BQTFCOztBQUVBLG9CQUFJLEtBQUssU0FBTCxJQUFrQixLQUFLLFFBQTNCLEVBQXFDO0FBQ2pDLHlCQUFLLFNBQUwsQ0FBZSxJQUFmLENBQW9CLEtBQUssd0JBQUwsQ0FBOEIsS0FBSyxXQUFuQyxFQUFnRCxLQUFLLE1BQXJELEVBQTZELEtBQUssZUFBbEUsRUFBbUYsS0FBSyxjQUF4RixDQUFwQjtBQUNIO0FBQ0o7O0FBRUQsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Z0NBTVM7QUFDTCxpQkFBSyxVQUFMLENBQWdCLEtBQWhCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OzZCQU1NLFMsRUFBVztBQUNiLGlCQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBcUIsU0FBckI7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7aUNBTVU7QUFDTixpQkFBSyxVQUFMLENBQWdCLE1BQWhCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7O2dDQU1TLEksRUFBTTtBQUNYLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FBd0IsSUFBeEI7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Z0NBTVMsSyxFQUFPLFEsRUFBVSxPLEVBQVM7QUFDL0IsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixjQUFjLFNBQWxDLEVBQTZDLElBQUksTUFBTSxTQUFWLENBQW9CLElBQXBCLEVBQTBCLE9BQTFCLENBQWtDLEtBQWxDLEVBQXlDLFFBQXpDLEVBQW1ELE9BQW5ELENBQTdDO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixjQUFjLFNBQW5DOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OytCQU1RLFEsRUFBVSxRLEVBQVUsTyxFQUFTO0FBQ2pDLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsY0FBYyxTQUFsQyxFQUE2QyxJQUFJLE1BQU0sU0FBVixDQUFvQixJQUFwQixFQUEwQixPQUExQixFQUFtQyxNQUFuQyxDQUEwQyxRQUExQyxFQUFvRCxRQUFwRCxDQUE3QztBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBcUIsY0FBYyxTQUFuQzs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7OztpQ0FNVSxNLEVBQVEsUSxFQUFVLFEsRUFBVSxPLEVBQVM7QUFDM0MsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixjQUFjLFNBQWxDLEVBQTZDLElBQUksTUFBTSxTQUFWLENBQW9CLElBQXBCLEVBQTBCLE9BQTFCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELFFBQXBELEVBQThELFFBQTlELENBQTdDO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixjQUFjLFNBQW5DOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7O2lDQU1VLFEsRUFBVSxRLEVBQVUsTyxFQUFTO0FBQ25DLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsY0FBYyxTQUFsQyxFQUE2QyxJQUFJLE1BQU0sU0FBVixDQUFvQixJQUFwQixFQUEwQixPQUExQixFQUFtQyxRQUFuQyxDQUE0QyxRQUE1QyxFQUFzRCxRQUF0RCxDQUE3QztBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBcUIsY0FBYyxTQUFuQzs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs4QkFNTyxTLEVBQVcsUSxFQUFVLFMsRUFBVyxPLEVBQVM7QUFDNUMsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixjQUFjLFNBQWxDLEVBQTZDLElBQUksTUFBTSxTQUFWLENBQW9CLElBQXBCLEVBQTBCLEtBQTFCLENBQWdDLFNBQWhDLEVBQTJDLFFBQTNDLEVBQXFELFNBQXJELEVBQWdFLE9BQWhFLENBQTdDO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixjQUFjLFNBQW5DOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OytCQU1RLE0sRUFBUSxJLEVBQU0sUSxFQUFVLE8sRUFBUztBQUNyQyxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLGNBQWMsU0FBbEMsRUFBNkMsSUFBSSxNQUFNLFNBQVYsQ0FBb0IsSUFBcEIsRUFBMEIsT0FBMUIsRUFBbUMsTUFBbkMsQ0FBMEMsTUFBMUMsRUFBa0QsSUFBbEQsRUFBd0QsUUFBeEQsQ0FBN0M7QUFDQSxpQkFBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLGNBQWMsU0FBbkM7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7K0JBTVEsSSxFQUFNLFEsRUFBVSxPLEVBQVM7QUFDN0IsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixjQUFjLFNBQWxDLEVBQTZDLElBQUksTUFBTSxTQUFWLENBQW9CLElBQXBCLEVBQTBCLE9BQTFCLEVBQW1DLE1BQW5DLENBQTBDLElBQTFDLEVBQWdELFFBQWhELENBQTdDO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixjQUFjLFNBQW5DOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7OzRCQWxwQmE7QUFDVixtQkFBTyxLQUFLLE9BQVo7QUFDSCxTOzBCQUVXLEssRUFBTztBQUNmLGlCQUFLLE9BQUwsR0FBZSxDQUFDLEtBQUQsR0FBUyxJQUFULEdBQWdCLEtBQS9CO0FBQ0EsaUJBQUssYUFBTDtBQUNIOztBQUVEOzs7Ozs7Ozs0QkFLaUI7QUFDYixtQkFBTyxLQUFLLE9BQUwsS0FBaUIsSUFBeEI7QUFDSDs7QUFFRDs7Ozs7Ozs7NEJBS2lCO0FBQ2IsbUJBQVEsS0FBSyxHQUFMLENBQVMsS0FBSyxRQUFMLEdBQWdCLEdBQXpCLElBQWdDLENBQWpDLEdBQXNDLENBQTdDO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzRCQUtnQjtBQUNaLG1CQUFPLEtBQUssSUFBTCxLQUFjLENBQXJCO0FBQ0g7O0FBRUQ7Ozs7Ozs7NEJBSWtCO0FBQ2QsbUJBQU8sS0FBSyxTQUFMLENBQWUsQ0FBdEI7QUFDSCxTOzBCQUVlLEssRUFBTztBQUNuQixpQkFBSyxTQUFMLENBQWUsQ0FBZixHQUFtQixLQUFuQjtBQUNIOztBQUVEOzs7Ozs7OzRCQUlrQjtBQUNkLG1CQUFPLEtBQUssU0FBTCxDQUFlLENBQXRCO0FBQ0gsUzswQkFFZSxLLEVBQU87QUFDbkIsaUJBQUssU0FBTCxDQUFlLENBQWYsR0FBbUIsS0FBbkI7QUFDSDs7QUFFRDs7Ozs7Ozs7NEJBS2E7QUFDVCxtQkFBTyxLQUFLLE1BQUwsQ0FBWSxXQUFuQjtBQUNIOztBQUVEOzs7Ozs7Ozs0QkFLc0I7QUFDbEIsbUJBQU8sdUJBQWMsS0FBZCxDQUFvQixLQUFLLElBQXpCLEVBQStCLEtBQUssSUFBcEMsRUFBMEMsTUFBMUMsQ0FBaUQsZUFBTSxRQUFOLENBQWUsQ0FBQyxLQUFLLFFBQXJCLENBQWpELENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OzRCQU1ZO0FBQ1IsbUJBQU8sS0FBSyxLQUFaO0FBQ0gsUzswQkFFUyxLLEVBQU87QUFDYixpQkFBSyxLQUFMLEdBQWEsS0FBSyxVQUFMLENBQWdCLEtBQWhCLENBQWI7QUFDQSxpQkFBSyxhQUFMO0FBQ0g7Ozs7OztBQTBqQkwsT0FBTyxNQUFQLEdBQWdCO0FBQ1osVUFBTSxJQURNO0FBRVosV0FBTyxpQkFBWTtBQUNmLFlBQUksaUJBQWlCLHVCQUFjLEtBQWQsQ0FBb0IsS0FBSyxJQUF6QixFQUErQixLQUFLLElBQXBDLEVBQTBDLFVBQTFDLEVBQXJCO0FBQ0EsWUFBSSxNQUFNLHVCQUFjLEdBQWQsQ0FBa0IsS0FBSyxNQUF2QixFQUErQixTQUEvQixDQUF5QyxjQUF6QyxDQUFWO0FBQ0EsWUFBSSxNQUFNLHFCQUFZLEtBQUssS0FBTCxDQUFXLFdBQXZCLEVBQW9DLEtBQUssS0FBTCxDQUFXLFlBQS9DLEVBQTZELFFBQTdELENBQXNFLEtBQUssTUFBM0UsRUFBbUYsU0FBbkYsQ0FBNkYsY0FBN0YsQ0FBVjs7QUFFQSxlQUFPO0FBQ0gsa0JBQU0sSUFBSSxDQURQO0FBRUgsa0JBQU0sSUFBSSxDQUZQO0FBR0gsa0JBQU0sSUFBSSxDQUhQO0FBSUgsa0JBQU0sSUFBSTtBQUpQLFNBQVA7QUFNSCxLQWJXO0FBY1osZ0JBQVksc0JBQVk7QUFDcEIsZUFBTztBQUNILGtCQUFNLENBREg7QUFFSCxrQkFBTSxDQUZIO0FBR0gsa0JBQU0sS0FBSyxLQUFMLENBQVcsS0FIZDtBQUlILGtCQUFNLEtBQUssS0FBTCxDQUFXO0FBSmQsU0FBUDtBQU1IO0FBckJXLENBQWhCOztrQkF3QmUsTTs7O0FDempDZjtBQUNBOzs7Ozs7QUFNQTs7Ozs7Ozs7QUFJTyxJQUFNLHNCQUFPO0FBQ2hCLGVBQVc7QUFESyxDQUFiOztBQUlQOzs7O0FBSU8sSUFBTSx3Q0FBZ0I7QUFDekIsVUFBTSxDQURtQjtBQUV6QixRQUFJLENBRnFCO0FBR3pCLFNBQUssQ0FBQztBQUhtQixDQUF0Qjs7O0FDbkJQO0FBQ0E7Ozs7Ozs7Ozs7OztBQU1BOzs7O0FBQ0E7Ozs7OztBQUVBOzs7Ozs7Ozs7SUFTTSxXO0FBQ0YseUJBQWEsTUFBYixFQUFxQjtBQUFBOztBQUNqQjs7OztBQUlBLGFBQUssTUFBTCxHQUFjLE1BQWQ7QUFDSDs7QUFFRDs7Ozs7Ozs7O2tDQUtXO0FBQ1AsaUJBQUssTUFBTCxHQUFjLElBQWQ7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7OztpQ0FLVTtBQUNOLGdCQUFJLEtBQUssTUFBTCxDQUFZLEtBQVosSUFBcUIsS0FBSyxNQUFMLENBQVksTUFBWixDQUFtQixJQUE1QyxFQUFrRDtBQUM5QyxvQkFBSSxTQUFTLEtBQUssTUFBTCxDQUFZLHdCQUFaLENBQXFDLEtBQUssTUFBTCxDQUFZLFFBQWpELEVBQTJELEtBQUssTUFBTCxDQUFZLE1BQXZFLEVBQStFLEtBQUssTUFBTCxDQUFZLGVBQTNGLEVBQTRHLEtBQUssTUFBTCxDQUFZLGNBQXhILENBQWI7QUFDQSxvQkFBSSxrQkFBa0IsR0FBdEI7QUFDQSxvQkFBSSxhQUFhLEtBQUssS0FBTCxDQUFXLEtBQUssTUFBTCxDQUFZLElBQXZCLENBQWpCOztBQUVBO0FBQ0Esb0JBQUksS0FBSyxNQUFMLENBQVksSUFBWixLQUFxQixLQUFLLE1BQUwsQ0FBWSxPQUFqQyxJQUE2QyxLQUFLLE1BQUwsQ0FBWSxhQUFaLEtBQThCLHlCQUFjLEVBQTVDLElBQWtELEtBQUssTUFBTCxDQUFZLElBQVosR0FBbUIsS0FBSyxNQUFMLENBQVksWUFBWixHQUEyQixrQkFBa0IsVUFBbkssRUFBaUw7QUFDN0sseUJBQUssTUFBTCxDQUFZLFlBQVosR0FBMkIsS0FBSyxNQUFMLENBQVksSUFBdkM7QUFDQSx5QkFBSyxNQUFMLENBQVksTUFBWixDQUFtQixJQUFuQixDQUF3QixLQUF4QixDQUE4QixVQUE5QixHQUEyQyxNQUEzQztBQUNILGlCQUhELE1BSUs7QUFDRCx5QkFBSyxNQUFMLENBQVksTUFBWixDQUFtQixJQUFuQixDQUF3QixLQUF4QixDQUE4QixVQUE5QixHQUEyQyxXQUEzQztBQUNIOztBQUVELHFCQUFLLE1BQUwsQ0FBWSxLQUFaLENBQWtCLElBQWxCLENBQXVCLEtBQXZCLENBQTZCLFVBQTdCLEdBQTBDLFNBQTFDO0FBQ0EsMEJBQVUsR0FBVixDQUFjLEtBQUssTUFBTCxDQUFZLE1BQVosQ0FBbUIsSUFBakMsRUFBdUM7QUFDbkMseUJBQUs7QUFDRCx5Q0FBaUIsS0FBSyxNQUFMLENBQVksZUFBWixDQUE0QixDQUE1QixHQUFnQyxLQUFoQyxHQUF3QyxLQUFLLE1BQUwsQ0FBWSxlQUFaLENBQTRCLENBQXBFLEdBQXdFLElBRHhGO0FBRUQsZ0NBQVEsS0FBSyxNQUFMLENBQVksSUFGbkI7QUFHRCxnQ0FBUSxLQUFLLE1BQUwsQ0FBWSxJQUhuQjtBQUlELGtDQUFVLENBQUMsS0FBSyxNQUFMLENBQVksUUFKdEI7QUFLRCwyQkFBRyxDQUFDLE9BQU8sQ0FMVjtBQU1ELDJCQUFHLENBQUMsT0FBTztBQU5WO0FBRDhCLGlCQUF2QztBQVVIO0FBQ0o7O0FBRUQ7Ozs7Ozs7O3FDQUtjO0FBQ1YsZ0JBQUksS0FBSyxNQUFMLENBQVksSUFBaEIsRUFBc0I7QUFDbEIsMEJBQVUsR0FBVixDQUFjLEtBQUssTUFBTCxDQUFZLElBQTFCLEVBQWdDO0FBQzVCLHlCQUFLO0FBQ0QsZ0NBQVEsS0FBSyxNQUFMLENBQVksTUFEbkI7QUFFRCwrQkFBTyxLQUFLLE1BQUwsQ0FBWTtBQUZsQjtBQUR1QixpQkFBaEM7QUFNSDtBQUNKOzs7Ozs7a0JBR1UsVzs7O0FDMUZmO0FBQ0E7Ozs7OztBQU1BOzs7Ozs7Ozs7Ozs7QUFNQTs7Ozs7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFvQk0sVztBQUNGLHlCQUFhLE1BQWIsRUFLUTtBQUFBOztBQUFBLHVGQUFKLEVBQUk7QUFBQSxrQ0FKSixTQUlJO0FBQUEsWUFKSixTQUlJLGtDQUpRLE1BSVI7QUFBQSwrQkFISixNQUdJO0FBQUEsWUFISixNQUdJLCtCQUhLLFlBQVksQ0FBRSxDQUduQjtBQUFBLHFDQUZKLFlBRUk7QUFBQSxZQUZKLFlBRUkscUNBRlcsRUFFWDtBQUFBLG9DQURKLFdBQ0k7QUFBQSxZQURKLFdBQ0ksb0NBRFUsSUFDVjs7QUFBQTs7QUFDSjs7O0FBR0EsYUFBSyxNQUFMLEdBQWMsRUFBRSxvQkFBRixFQUFhLGNBQWIsRUFBcUIsMEJBQXJCLEVBQW1DLHdCQUFuQyxFQUFkOztBQUVBOzs7O0FBSUEsYUFBSyxPQUFMLEdBQWUsSUFBSSxTQUFKLENBQWMsTUFBZCxFQUFzQjtBQUNqQywyQkFBZSxXQURrQjtBQUVqQyxvQkFBUSxNQUZ5QjtBQUdqQywwQkFBYyxZQUhtQjtBQUlqQyx5QkFBYTtBQUpvQixTQUF0QixDQUFmOztBQU9BOzs7O0FBSUEsYUFBSyxTQUFMLEdBQWlCLGdCQUFNLEdBQU4sQ0FBVSxTQUFWLENBQW9CLFNBQXBCLENBQWpCOztBQUVBOzs7O0FBSUEsYUFBSyxVQUFMLEdBQWtCLEtBQWxCOztBQUVBOzs7O0FBSUEsYUFBSyxTQUFMLEdBQWlCLEtBQWpCOztBQUVBOzs7QUFHQSxhQUFLLFlBQUwsR0FBb0IsVUFBQyxLQUFELEVBQVc7QUFDM0Isa0JBQU0sY0FBTjtBQUNBLGtCQUFNLGVBQU47O0FBRUEsbUJBQU8sS0FBUDtBQUNILFNBTEQ7O0FBT0E7OztBQUdBLGFBQUssY0FBTCxHQUFzQixVQUFDLEtBQUQsRUFBVztBQUM3QixrQkFBSyxRQUFMLENBQWMsS0FBZDtBQUNILFNBRkQ7O0FBSUE7OztBQUdBLGFBQUssWUFBTCxHQUFvQixVQUFDLEtBQUQsRUFBVztBQUMzQixrQkFBSyxRQUFMLENBQWMsS0FBZDtBQUNILFNBRkQ7O0FBSUE7OztBQUdBLGFBQUssV0FBTCxHQUFtQixVQUFDLEtBQUQsRUFBVztBQUMxQixnQkFBSSxNQUFLLFNBQUwsSUFBa0IsQ0FBQyxNQUFLLFVBQTVCLEVBQXdDO0FBQ3BDLHNCQUFLLE9BQUwsQ0FBYSxTQUFiLENBQXVCLEtBQXZCO0FBQ0Esc0JBQUssVUFBTCxHQUFrQixJQUFsQjtBQUNIO0FBQ0osU0FMRDs7QUFPQTs7O0FBR0EsYUFBSyxRQUFMLEdBQWdCLFVBQUMsS0FBRCxFQUFXO0FBQ3ZCLGdCQUFJLE1BQUssVUFBVCxFQUFxQjtBQUNqQixzQkFBSyxPQUFMLENBQWEsT0FBYixDQUFxQixLQUFyQjtBQUNBLHNCQUFLLFNBQUwsQ0FBZSxtQkFBZixDQUFtQyxTQUFuQyxFQUE4QyxNQUFLLGNBQW5EO0FBQ0Esc0JBQUssU0FBTCxDQUFlLG1CQUFmLENBQW1DLFlBQW5DLEVBQWlELE1BQUssWUFBdEQ7QUFDQSxzQkFBSyxTQUFMLENBQWUsbUJBQWYsQ0FBbUMsV0FBbkMsRUFBZ0QsTUFBSyxXQUFyRDtBQUNBLHNCQUFLLFNBQUwsQ0FBZSxtQkFBZixDQUFtQyxVQUFuQyxFQUErQyxNQUFLLGNBQXBEO0FBQ0Esc0JBQUssU0FBTCxDQUFlLG1CQUFmLENBQW1DLGFBQW5DLEVBQWtELE1BQUssY0FBdkQ7QUFDQSxzQkFBSyxTQUFMLENBQWUsbUJBQWYsQ0FBbUMsV0FBbkMsRUFBZ0QsTUFBSyxXQUFyRDtBQUNBLHNCQUFLLFVBQUwsR0FBa0IsS0FBbEI7QUFDSDtBQUNKLFNBWEQ7O0FBYUE7OztBQUdBLGFBQUssUUFBTCxHQUFnQixVQUFDLEtBQUQsRUFBVztBQUN2QixrQkFBSyxTQUFMLENBQWUsZ0JBQWYsQ0FBZ0MsU0FBaEMsRUFBMkMsTUFBSyxjQUFoRDtBQUNBLGtCQUFLLFNBQUwsQ0FBZSxnQkFBZixDQUFnQyxZQUFoQyxFQUE4QyxNQUFLLFlBQW5EO0FBQ0Esa0JBQUssU0FBTCxDQUFlLGdCQUFmLENBQWdDLFdBQWhDLEVBQTZDLE1BQUssV0FBbEQ7QUFDQSxrQkFBSyxTQUFMLENBQWUsZ0JBQWYsQ0FBZ0MsVUFBaEMsRUFBNEMsTUFBSyxjQUFqRDtBQUNBLGtCQUFLLFNBQUwsQ0FBZSxnQkFBZixDQUFnQyxhQUFoQyxFQUErQyxNQUFLLGNBQXBEO0FBQ0Esa0JBQUssU0FBTCxDQUFlLGdCQUFmLENBQWdDLFdBQWhDLEVBQTZDLE1BQUssV0FBbEQ7QUFDQSxrQkFBSyxTQUFMLEdBQWlCLElBQWpCO0FBQ0gsU0FSRDs7QUFVQTs7O0FBR0EsYUFBSyxVQUFMLEdBQWtCLFVBQUMsS0FBRCxFQUFXO0FBQ3pCLGtCQUFLLFFBQUw7QUFDSCxTQUZEOztBQUlBOzs7QUFHQSxhQUFLLFFBQUwsR0FBZ0IsVUFBQyxLQUFELEVBQVc7QUFDdkIsa0JBQUssUUFBTDtBQUNILFNBRkQ7O0FBSUE7OztBQUdBLGFBQUssUUFBTCxHQUFnQixZQUFNO0FBQ2xCLGtCQUFLLFNBQUwsR0FBaUIsS0FBakI7QUFDSCxTQUZEOztBQUlBLGFBQUssTUFBTDtBQUNIOztBQUVEOzs7Ozs7Ozs7O0FBd0RBOzs7OztrQ0FLVztBQUNQLGlCQUFLLE9BQUw7QUFDQSxpQkFBSyxPQUFMLENBQWEsSUFBYjtBQUNBLGlCQUFLLE1BQUwsR0FBYyxFQUFkO0FBQ0EsaUJBQUssU0FBTCxHQUFpQixJQUFqQjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7O2tDQUtXO0FBQ1AsaUJBQUssT0FBTCxDQUFhLE9BQWI7QUFDQSxpQkFBSyxTQUFMLENBQWUsbUJBQWYsQ0FBbUMsV0FBbkMsRUFBZ0QsS0FBSyxZQUFyRDtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxtQkFBZixDQUFtQyxXQUFuQyxFQUFnRCxLQUFLLFFBQXJEO0FBQ0EsaUJBQUssU0FBTCxDQUFlLG1CQUFmLENBQW1DLFNBQW5DLEVBQThDLEtBQUssVUFBbkQ7QUFDQSxpQkFBSyxTQUFMLENBQWUsbUJBQWYsQ0FBbUMsWUFBbkMsRUFBaUQsS0FBSyxRQUF0RDtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxtQkFBZixDQUFtQyxZQUFuQyxFQUFpRCxLQUFLLFFBQXREO0FBQ0EsaUJBQUssU0FBTCxDQUFlLG1CQUFmLENBQW1DLFVBQW5DLEVBQStDLEtBQUssVUFBcEQ7QUFDQSxpQkFBSyxTQUFMLENBQWUsbUJBQWYsQ0FBbUMsYUFBbkMsRUFBa0QsS0FBSyxVQUF2RDtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxLQUFmLENBQXFCLE1BQXJCLEdBQThCLElBQTlCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7aUNBS1U7QUFDTixpQkFBSyxPQUFMLENBQWEsTUFBYjtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxnQkFBZixDQUFnQyxXQUFoQyxFQUE2QyxLQUFLLFlBQWxEO0FBQ0EsaUJBQUssU0FBTCxDQUFlLGdCQUFmLENBQWdDLFdBQWhDLEVBQTZDLEtBQUssUUFBbEQ7QUFDQSxpQkFBSyxTQUFMLENBQWUsZ0JBQWYsQ0FBZ0MsU0FBaEMsRUFBMkMsS0FBSyxVQUFoRDtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxnQkFBZixDQUFnQyxZQUFoQyxFQUE4QyxLQUFLLFFBQW5EO0FBQ0EsaUJBQUssU0FBTCxDQUFlLGdCQUFmLENBQWdDLFlBQWhDLEVBQThDLEtBQUssUUFBbkQ7QUFDQSxpQkFBSyxTQUFMLENBQWUsZ0JBQWYsQ0FBZ0MsVUFBaEMsRUFBNEMsS0FBSyxVQUFqRDtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxnQkFBZixDQUFnQyxhQUFoQyxFQUErQyxLQUFLLFVBQXBEO0FBQ0EsaUJBQUssU0FBTCxDQUFlLEtBQWYsQ0FBcUIsTUFBckIsR0FBOEIsTUFBOUI7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7O2lDQUtVO0FBQ04sbUJBQU8sS0FBSyxPQUFMLENBQWEsTUFBYixFQUFQO0FBQ0g7Ozs0QkE5R2M7QUFDWCxtQkFBTyxLQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs0QkFJb0I7QUFDaEIsbUJBQU8sS0FBSyxPQUFMLENBQWEsWUFBcEI7QUFDSDs7QUFFRDs7Ozs7Ozs0QkFJZ0I7QUFDWixtQkFBTyxLQUFLLE9BQUwsQ0FBYSxRQUFwQjtBQUNIOztBQUVEOzs7Ozs7OzRCQUlnQjtBQUNaLG1CQUFPLEtBQUssT0FBTCxDQUFhLFFBQXBCO0FBQ0g7O0FBRUQ7Ozs7Ozs7NEJBSWM7QUFDVixtQkFBTyxLQUFLLE9BQUwsQ0FBYSxNQUFwQjtBQUNIOztBQUVEOzs7Ozs7OzRCQUlTO0FBQ0wsbUJBQU8sS0FBSyxPQUFMLENBQWEsQ0FBcEI7QUFDSDs7QUFFRDs7Ozs7Ozs0QkFJUztBQUNMLG1CQUFPLEtBQUssT0FBTCxDQUFhLENBQXBCO0FBQ0g7Ozs7OztrQkErRFUsVzs7O0FDeFJmOztBQUVBOzs7Ozs7Ozs7QUFLQSxJQUFNLFFBQVE7QUFDVjs7Ozs7OztBQU9BLGNBQVUsa0JBQUMsT0FBRCxFQUFhO0FBQ25CLGVBQU8sVUFBVSxNQUFNLGNBQXZCO0FBQ0gsS0FWUzs7QUFZVjs7Ozs7OztBQU9BLGNBQVUsa0JBQUMsT0FBRCxFQUFhO0FBQ25CLGVBQU8sVUFBVSxNQUFNLGNBQXZCO0FBQ0g7QUFyQlMsQ0FBZDs7QUF3QkE7Ozs7Ozs7QUFPQSxPQUFPLGNBQVAsQ0FBc0IsS0FBdEIsRUFBNkIsZ0JBQTdCLEVBQStDO0FBQzNDLFdBQU8sS0FBSyxFQUFMLEdBQVU7QUFEMEIsQ0FBL0M7O0FBSUE7Ozs7Ozs7QUFPQSxPQUFPLGNBQVAsQ0FBc0IsS0FBdEIsRUFBNkIsZ0JBQTdCLEVBQStDO0FBQzNDLFdBQU8sTUFBTSxLQUFLO0FBRHlCLENBQS9DOztrQkFJZSxLOzs7QUNyRGY7Ozs7Ozs7O0FBRUE7Ozs7Ozs7O0FBRUE7Ozs7Ozs7Ozs7Ozs7OztJQWVNLE87QUFDRixxQkFBYSxHQUFiLEVBQWtCLEdBQWxCLEVBQXVCLEdBQXZCLEVBQTRCLEdBQTVCLEVBQWlDO0FBQUE7O0FBQzdCOzs7O0FBSUEsYUFBSyxHQUFMLEdBQVcsQ0FBWDs7QUFFQTs7OztBQUlBLGFBQUssR0FBTCxHQUFXLENBQVg7O0FBRUE7Ozs7QUFJQSxhQUFLLEdBQUwsR0FBVyxDQUFYOztBQUVBOzs7O0FBSUEsYUFBSyxHQUFMLEdBQVcsQ0FBWDs7QUFFQSxZQUFJLFVBQVUsTUFBVixLQUFxQixDQUF6QixFQUE0QjtBQUN4QixpQkFBSyxHQUFMLENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0IsR0FBeEI7QUFDSCxTQUZELE1BR0ssSUFBSSwyQkFBWSxHQUFaLEtBQW9CLElBQUksTUFBSixLQUFlLENBQXZDLEVBQTBDO0FBQzNDLGlCQUFLLFlBQUwsQ0FBa0IsR0FBbEI7QUFDSDtBQUNKOztBQUVEOzs7Ozs7Ozs7OztBQVNBOzs7O2dDQUlTO0FBQ0wsbUJBQU8sS0FBSyxXQUFMLENBQWlCLEtBQWpCLENBQXVCLElBQXZCLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7NkJBS00sQyxFQUFHO0FBQ0wsbUJBQU8sS0FBSyxHQUFMLENBQVMsRUFBRSxHQUFYLEVBQWdCLEVBQUUsR0FBbEIsRUFBdUIsRUFBRSxHQUF6QixFQUE4QixFQUFFLEdBQWhDLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OztBQVNBOzs7O3lDQUlrQjtBQUNkLG1CQUFPLEtBQUssV0FBTCxDQUFpQixjQUFqQixDQUFnQyxJQUFoQyxDQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7QUFTQTs7OztxQ0FJYztBQUNWLG1CQUFPLEtBQUssV0FBTCxDQUFpQixVQUFqQixDQUE0QixJQUE1QixDQUFQO0FBQ0g7O0FBRUQ7Ozs7O1dBS0U7Ozs7Ozs7Ozs7QUFxQkY7Ozs7O3lDQUtrQixDLEVBQUc7QUFDakIsZ0JBQUksS0FBSyxJQUFMLEtBQWMsRUFBRSxJQUFwQixFQUEwQjtBQUN0QixvQkFBSSxZQUFKO0FBQUEsb0JBQVMsWUFBVDtBQUFBLG9CQUFjLFlBQWQ7QUFBQSxvQkFBbUIsWUFBbkI7O0FBRUEsc0JBQU0sS0FBSyxHQUFMLEdBQVcsRUFBRSxHQUFiLEdBQW1CLEtBQUssR0FBTCxHQUFXLEVBQUUsR0FBdEM7QUFDQSxzQkFBTSxLQUFLLEdBQUwsR0FBVyxFQUFFLEdBQWIsR0FBbUIsS0FBSyxHQUFMLEdBQVcsRUFBRSxHQUF0QztBQUNBLHNCQUFNLEtBQUssR0FBTCxHQUFXLEVBQUUsR0FBYixHQUFtQixLQUFLLEdBQUwsR0FBVyxFQUFFLEdBQXRDO0FBQ0Esc0JBQU0sS0FBSyxHQUFMLEdBQVcsRUFBRSxHQUFiLEdBQW1CLEtBQUssR0FBTCxHQUFXLEVBQUUsR0FBdEM7O0FBRUEscUJBQUssR0FBTCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLEVBQXdCLEdBQXhCO0FBQ0gsYUFURCxNQVVLO0FBQ0Qsc0JBQU0sSUFBSSxLQUFKLENBQVUsdUNBQVYsQ0FBTjtBQUNIOztBQUVELG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7QUFlQTs7Ozs7dUNBS2dCLEMsRUFBRztBQUNmLGlCQUFLLEdBQUwsSUFBWSxDQUFaO0FBQ0EsaUJBQUssR0FBTCxJQUFZLENBQVo7QUFDQSxpQkFBSyxHQUFMLElBQVksQ0FBWjtBQUNBLGlCQUFLLEdBQUwsSUFBWSxDQUFaOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7QUFjQTs7Ozs7K0JBS1EsSyxFQUFPO0FBQ1gsZ0JBQUksTUFBTSxLQUFLLEdBQUwsQ0FBUyxLQUFULENBQVY7QUFDQSxnQkFBSSxNQUFNLEtBQUssR0FBTCxDQUFTLEtBQVQsQ0FBVjtBQUNBLGdCQUFJLGlCQUFpQixJQUFJLE9BQUosQ0FBWSxHQUFaLEVBQWlCLENBQUMsR0FBbEIsRUFBdUIsR0FBdkIsRUFBNEIsR0FBNUIsQ0FBckI7QUFDQSxpQkFBSyxnQkFBTCxDQUFzQixjQUF0Qjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7OztBQVdBOzs7Ozs7OEJBTU8sQyxFQUFHLEMsRUFBRztBQUNULGlCQUFLLGdCQUFMLENBQXNCLElBQUksT0FBSixDQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLENBQXRCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7NEJBUUssRyxFQUFLLEcsRUFBSyxHLEVBQUssRyxFQUFLO0FBQ3JCLGlCQUFLLEdBQUwsR0FBVyxHQUFYO0FBQ0EsaUJBQUssR0FBTCxHQUFXLEdBQVg7QUFDQSxpQkFBSyxHQUFMLEdBQVcsR0FBWDtBQUNBLGlCQUFLLEdBQUwsR0FBVyxHQUFYOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7cUNBS2MsQyxFQUFHO0FBQ2IsaUJBQUssR0FBTCxDQUFTLEVBQUUsQ0FBRixDQUFULEVBQWUsRUFBRSxDQUFGLENBQWYsRUFBcUIsRUFBRSxDQUFGLENBQXJCLEVBQTJCLEVBQUUsQ0FBRixDQUEzQjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7d0NBSWlCO0FBQ2IsaUJBQUssR0FBTCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixDQUFsQjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7QUFnQkE7Ozs7a0NBSVc7QUFDUCxtQkFBTyxLQUFLLFdBQUwsQ0FBaUIsT0FBakIsQ0FBeUIsSUFBekIsQ0FBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7O0FBZ0JBOzs7O3lDQUlrQjtBQUNkLG1CQUFPLEtBQUssV0FBTCxDQUFpQixjQUFqQixDQUFnQyxJQUFoQyxDQUFQO0FBQ0g7Ozs4QkE1UWEsQyxFQUFHO0FBQ2IsbUJBQU8sSUFBSSxPQUFKLENBQVksUUFBUSxPQUFSLENBQWdCLENBQWhCLENBQVosQ0FBUDtBQUNIOzs7dUNBd0JzQixDLEVBQUc7QUFDdEIsbUJBQU8sRUFBRSxHQUFGLEdBQVEsRUFBRSxHQUFWLEdBQWdCLEVBQUUsR0FBRixHQUFRLEVBQUUsR0FBakM7QUFDSDs7O21DQWVrQixDLEVBQUc7QUFDbEIsbUJBQU8sUUFBUSxjQUFSLENBQXVCLElBQUksT0FBSixDQUFZLEVBQUUsR0FBZCxFQUFtQixDQUFDLEVBQUUsR0FBdEIsRUFBMkIsQ0FBQyxFQUFFLEdBQTlCLEVBQW1DLEVBQUUsR0FBckMsQ0FBdkIsRUFBa0UsSUFBSSxRQUFRLGNBQVIsQ0FBdUIsQ0FBdkIsQ0FBdEUsQ0FBUDtBQUNIOzs7eUNBb0J3QixDLEVBQUcsQyxFQUFHO0FBQzNCLGdCQUFJLEVBQUUsSUFBRixLQUFXLEVBQUUsSUFBakIsRUFBdUI7QUFDbkIsb0JBQUksWUFBSjtBQUFBLG9CQUFTLFlBQVQ7QUFBQSxvQkFBYyxZQUFkO0FBQUEsb0JBQW1CLFlBQW5COztBQUVBLHNCQUFNLEVBQUUsR0FBRixHQUFRLEVBQUUsR0FBVixHQUFnQixFQUFFLEdBQUYsR0FBUSxFQUFFLEdBQWhDO0FBQ0Esc0JBQU0sRUFBRSxHQUFGLEdBQVEsRUFBRSxHQUFWLEdBQWdCLEVBQUUsR0FBRixHQUFRLEVBQUUsR0FBaEM7QUFDQSxzQkFBTSxFQUFFLEdBQUYsR0FBUSxFQUFFLEdBQVYsR0FBZ0IsRUFBRSxHQUFGLEdBQVEsRUFBRSxHQUFoQztBQUNBLHNCQUFNLEVBQUUsR0FBRixHQUFRLEVBQUUsR0FBVixHQUFnQixFQUFFLEdBQUYsR0FBUSxFQUFFLEdBQWhDOztBQUVBLHVCQUFPLElBQUksT0FBSixDQUFZLEdBQVosRUFBaUIsR0FBakIsRUFBc0IsR0FBdEIsRUFBMkIsR0FBM0IsQ0FBUDtBQUNILGFBVEQsTUFVSztBQUNELHNCQUFNLElBQUksS0FBSixDQUFVLHVDQUFWLENBQU47QUFDSDtBQUNKOzs7dUNBK0JzQixDLEVBQUcsQyxFQUFHO0FBQ3pCLGdCQUFJLE1BQU0sRUFBRSxHQUFGLEdBQVEsQ0FBbEI7QUFDQSxnQkFBSSxNQUFNLEVBQUUsR0FBRixHQUFRLENBQWxCO0FBQ0EsZ0JBQUksTUFBTSxFQUFFLEdBQUYsR0FBUSxDQUFsQjtBQUNBLGdCQUFJLE1BQU0sRUFBRSxHQUFGLEdBQVEsQ0FBbEI7O0FBRUEsbUJBQU8sSUFBSSxPQUFKLENBQVksR0FBWixFQUFpQixHQUFqQixFQUFzQixHQUF0QixFQUEyQixHQUEzQixDQUFQO0FBQ0g7OzsrQkFzQmMsQyxFQUFHLEssRUFBTztBQUNyQixnQkFBSSxNQUFNLEtBQUssR0FBTCxDQUFTLEtBQVQsQ0FBVjtBQUNBLGdCQUFJLE1BQU0sS0FBSyxHQUFMLENBQVMsS0FBVCxDQUFWO0FBQ0EsZ0JBQUksaUJBQWlCLElBQUksT0FBSixDQUFZLEdBQVosRUFBaUIsQ0FBQyxHQUFsQixFQUF1QixHQUF2QixFQUE0QixHQUE1QixDQUFyQjs7QUFFQSxtQkFBTyxRQUFRLGdCQUFSLENBQXlCLENBQXpCLEVBQTRCLGNBQTVCLENBQVA7QUFDSDs7OzhCQXVCYSxDLEVBQUcsQyxFQUFHLEMsRUFBRztBQUNuQixtQkFBTyxRQUFRLGdCQUFSLENBQXlCLENBQXpCLEVBQTRCLElBQUksT0FBSixDQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLENBQTVCLENBQVA7QUFDSDs7O2dDQXlEZSxDLEVBQUc7QUFDZixnQkFBSSxJQUFJLElBQUksS0FBSixDQUFVLENBQVYsQ0FBUjs7QUFFQSxjQUFFLENBQUYsSUFBTyxFQUFFLEdBQVQ7QUFDQSxjQUFFLENBQUYsSUFBTyxFQUFFLEdBQVQ7QUFDQSxjQUFFLENBQUYsSUFBTyxFQUFFLEdBQVQ7QUFDQSxjQUFFLENBQUYsSUFBTyxFQUFFLEdBQVQ7O0FBRUEsbUJBQU8sQ0FBUDtBQUNIOzs7dUNBZXNCLEMsRUFBRztBQUN0QixnQkFBSSxJQUFJLElBQUksWUFBSixDQUFpQixDQUFqQixDQUFSOztBQUVBLGNBQUUsQ0FBRixJQUFPLEVBQUUsR0FBVDtBQUNBLGNBQUUsQ0FBRixJQUFPLEVBQUUsR0FBVDtBQUNBLGNBQUUsQ0FBRixJQUFPLEVBQUUsR0FBVDtBQUNBLGNBQUUsQ0FBRixJQUFPLEVBQUUsR0FBVDs7QUFFQSxtQkFBTyxDQUFQO0FBQ0g7Ozs7OztBQVdMOzs7Ozs7QUFJQSxPQUFPLGNBQVAsQ0FBc0IsUUFBUSxTQUE5QixFQUF5QyxNQUF6QyxFQUFpRDtBQUM3QyxnQkFBWSxJQURpQztBQUU3QyxXQUFPO0FBRnNDLENBQWpEOztBQUtBOzs7O0FBSUEsT0FBTyxjQUFQLENBQXNCLFFBQVEsU0FBOUIsRUFBeUMsTUFBekMsRUFBaUQ7QUFDN0MsZ0JBQVksSUFEaUM7QUFFN0MsV0FBTztBQUZzQyxDQUFqRDs7a0JBS2UsTzs7O0FDM1ZmOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7OztJQVFNLE87QUFDRixxQkFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CO0FBQUE7O0FBQ2Y7Ozs7QUFJQSxhQUFLLENBQUwsR0FBVSxNQUFNLFNBQVAsR0FBb0IsQ0FBcEIsR0FBd0IsQ0FBakM7O0FBRUE7Ozs7QUFJQSxhQUFLLENBQUwsR0FBVSxNQUFNLFNBQVAsR0FBb0IsQ0FBcEIsR0FBd0IsQ0FBakM7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7O0FBVUE7Ozs7OzRCQUtLLEMsRUFBRztBQUNKLGlCQUFLLENBQUwsSUFBVSxFQUFFLENBQVo7QUFDQSxpQkFBSyxDQUFMLElBQVUsRUFBRSxDQUFaOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OztBQVNBOzs7O2dDQUlTO0FBQ0wsbUJBQU8sS0FBSyxXQUFMLENBQWlCLEtBQWpCLENBQXVCLElBQXZCLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7NkJBS00sQyxFQUFHO0FBQ0wsbUJBQU8sS0FBSyxHQUFMLENBQVMsRUFBRSxDQUFYLEVBQWMsRUFBRSxDQUFoQixDQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7O0FBVUE7Ozs7OytCQUtRLEMsRUFBRztBQUNQLG1CQUFPLEtBQUssV0FBTCxDQUFpQixNQUFqQixDQUF3QixJQUF4QixFQUE4QixDQUE5QixDQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7O0FBVUE7Ozs7OzRCQUtLLEMsRUFBRztBQUNKLGlCQUFLLENBQUwsR0FBUyxLQUFLLEdBQUwsQ0FBUyxLQUFLLENBQWQsRUFBaUIsRUFBRSxDQUFuQixDQUFUO0FBQ0EsaUJBQUssQ0FBTCxHQUFTLEtBQUssR0FBTCxDQUFTLEtBQUssQ0FBZCxFQUFpQixFQUFFLENBQW5CLENBQVQ7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7OztBQVVBOzs7Ozs0QkFLSyxDLEVBQUc7QUFDSixpQkFBSyxDQUFMLEdBQVMsS0FBSyxHQUFMLENBQVMsS0FBSyxDQUFkLEVBQWlCLEVBQUUsQ0FBbkIsQ0FBVDtBQUNBLGlCQUFLLENBQUwsR0FBUyxLQUFLLEdBQUwsQ0FBUyxLQUFLLENBQWQsRUFBaUIsRUFBRSxDQUFuQixDQUFUOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7QUFhQTs7Ozs7dUNBS2dCLEMsRUFBRztBQUNmLGlCQUFLLENBQUwsSUFBVSxDQUFWO0FBQ0EsaUJBQUssQ0FBTCxJQUFVLENBQVY7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7NEJBTUssQyxFQUFHLEMsRUFBRztBQUNQLGlCQUFLLENBQUwsR0FBUyxDQUFUO0FBQ0EsaUJBQUssQ0FBTCxHQUFTLENBQVQ7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7OztBQVVBOzs7OztpQ0FLVSxDLEVBQUc7QUFDVCxpQkFBSyxDQUFMLElBQVUsRUFBRSxDQUFaO0FBQ0EsaUJBQUssQ0FBTCxJQUFVLEVBQUUsQ0FBWjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7QUFjQTs7OztrQ0FJVztBQUNQLG1CQUFPLEtBQUssV0FBTCxDQUFpQixPQUFqQixDQUF5QixJQUF6QixDQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7OztBQWNBOzs7Ozs7a0NBTVcsQyxFQUFHO0FBQ1YsZ0JBQUksS0FBSyxLQUFLLENBQUwsR0FBUyxFQUFFLEdBQVgsR0FBaUIsS0FBSyxDQUFMLEdBQVMsRUFBRSxHQUE1QixJQUFtQyxFQUFFLEVBQUYsR0FBTyxFQUFFLEVBQVQsR0FBYyxDQUFqRCxDQUFUO0FBQ0EsZ0JBQUksS0FBSyxLQUFLLENBQUwsR0FBUyxFQUFFLEdBQVgsR0FBaUIsS0FBSyxDQUFMLEdBQVMsRUFBRSxHQUE1QixJQUFtQyxFQUFFLEVBQUYsR0FBTyxFQUFFLEVBQVQsR0FBYyxDQUFqRCxDQUFUOztBQUVBLG1CQUFPLEtBQUssR0FBTCxDQUFTLEVBQVQsRUFBYSxFQUFiLENBQVA7QUFDSDs7OzRCQXBOVyxDLEVBQUcsQyxFQUFHO0FBQ2QsbUJBQU8sSUFBSSxPQUFKLENBQVksRUFBRSxDQUFGLEdBQU0sRUFBRSxDQUFwQixFQUF1QixFQUFFLENBQUYsR0FBTSxFQUFFLENBQS9CLENBQVA7QUFDSDs7OzhCQW1CYSxDLEVBQUc7QUFDYixtQkFBTyxJQUFJLE9BQUosQ0FBWSxFQUFFLENBQWQsRUFBaUIsRUFBRSxDQUFuQixDQUFQO0FBQ0g7OzsrQkF5QmMsQyxFQUFHLEMsRUFBRztBQUNqQixtQkFBTyxFQUFFLENBQUYsS0FBUSxFQUFFLENBQVYsSUFBZSxFQUFFLENBQUYsS0FBUSxFQUFFLENBQWhDO0FBQ0g7Ozs0QkFpQlcsQyxFQUFHLEMsRUFBRztBQUNkLG1CQUFPLElBQUksT0FBSixDQUFZLEtBQUssR0FBTCxDQUFTLEVBQUUsQ0FBWCxFQUFjLEVBQUUsQ0FBaEIsQ0FBWixFQUFnQyxLQUFLLEdBQUwsQ0FBUyxFQUFFLENBQVgsRUFBYyxFQUFFLENBQWhCLENBQWhDLENBQVA7QUFDSDs7OzRCQW9CVyxDLEVBQUcsQyxFQUFHO0FBQ2QsbUJBQU8sSUFBSSxPQUFKLENBQVksS0FBSyxHQUFMLENBQVMsRUFBRSxDQUFYLEVBQWMsRUFBRSxDQUFoQixDQUFaLEVBQWdDLEtBQUssR0FBTCxDQUFTLEVBQUUsQ0FBWCxFQUFjLEVBQUUsQ0FBaEIsQ0FBaEMsQ0FBUDtBQUNIOzs7dUNBb0JzQixDLEVBQUcsQyxFQUFHO0FBQ3pCLGdCQUFJLElBQUksRUFBRSxDQUFGLEdBQU0sQ0FBZDtBQUNBLGdCQUFJLElBQUksRUFBRSxDQUFGLEdBQU0sQ0FBZDs7QUFFQSxtQkFBTyxJQUFJLE9BQUosQ0FBWSxDQUFaLEVBQWUsQ0FBZixDQUFQO0FBQ0g7OztpQ0FpQ2dCLEMsRUFBRyxDLEVBQUc7QUFDbkIsbUJBQU8sSUFBSSxPQUFKLENBQVksRUFBRSxDQUFGLEdBQU0sRUFBRSxDQUFwQixFQUF1QixFQUFFLENBQUYsR0FBTSxFQUFFLENBQS9CLENBQVA7QUFDSDs7O2dDQW1CZSxDLEVBQUc7QUFDZixnQkFBSSxJQUFJLElBQUksS0FBSixDQUFVLENBQVYsQ0FBUjs7QUFFQSxjQUFFLENBQUYsSUFBTyxFQUFFLENBQVQ7QUFDQSxjQUFFLENBQUYsSUFBTyxFQUFFLENBQVQ7O0FBRUEsbUJBQU8sQ0FBUDtBQUNIOzs7a0NBaUJpQixDLEVBQUcsQyxFQUFHO0FBQ3BCLGdCQUFJLEtBQUssRUFBRSxDQUFGLEdBQU0sRUFBRSxHQUFSLEdBQWMsRUFBRSxDQUFGLEdBQU0sRUFBRSxHQUF0QixJQUE2QixFQUFFLEVBQUYsR0FBTyxFQUFFLEVBQVQsR0FBYyxDQUEzQyxDQUFUO0FBQ0EsZ0JBQUksS0FBSyxFQUFFLENBQUYsR0FBTSxFQUFFLEdBQVIsR0FBYyxFQUFFLENBQUYsR0FBTSxFQUFFLEdBQXRCLElBQTZCLEVBQUUsRUFBRixHQUFPLEVBQUUsRUFBVCxHQUFjLENBQTNDLENBQVQ7O0FBRUEsbUJBQU8sSUFBSSxPQUFKLENBQVksRUFBWixFQUFnQixFQUFoQixDQUFQO0FBQ0g7Ozs7OztrQkFnQlUsTzs7O0FDdFBmOztBQUVBOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUdBOzs7QUFHQSxJQUFNLFFBQVE7QUFDVixrQ0FEVTtBQUVWLDRCQUZVO0FBR1Ysc0NBSFU7QUFJVix3QkFKVTtBQUtWLDZCQUxVO0FBTVYsMEJBTlU7QUFPViwwQkFQVTtBQVFWO0FBUlUsQ0FBZDs7QUFXQSxPQUFPLE9BQVAsR0FBaUIsS0FBakI7OztBQzVDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUFNQTs7OztBQUNBOzs7Ozs7OztBQUVBOzs7Ozs7OztJQVFNLEs7QUFDRixxQkFBeUM7QUFBQSxZQUE1QixNQUE0Qix1RUFBbkIsSUFBbUI7QUFBQSxZQUFiLElBQWEsdUVBQU4sSUFBTTs7QUFBQTs7QUFDckM7OztBQUdBLGFBQUssTUFBTCxHQUFjLE1BQWQ7O0FBRUE7OztBQUdBLGFBQUssSUFBTCxHQUFZLGdCQUFNLEdBQU4sQ0FBVSxTQUFWLENBQW9CLElBQXBCLENBQVo7O0FBRUE7QUFDQSxZQUFJLEtBQUssSUFBTCxJQUFhLEtBQUssSUFBTCxDQUFVLFVBQTNCLEVBQXVDO0FBQ25DLGlCQUFLLElBQUwsQ0FBVSxVQUFWLENBQXFCLFdBQXJCLENBQWlDLEtBQUssSUFBdEM7QUFDSDtBQUNKOztBQUVEOzs7Ozs7Ozs7OztBQW9DQTs7Ozs7a0NBS1c7QUFDUCxpQkFBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLGlCQUFLLElBQUwsR0FBWSxJQUFaOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7OzRCQXpDWTtBQUNULG1CQUFPLEtBQUssSUFBTCxHQUFZLEtBQUssSUFBTCxDQUFVLFdBQXRCLEdBQW9DLENBQTNDO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzRCQUtjO0FBQ1YsbUJBQU8sS0FBSyxJQUFMLEdBQVksS0FBSyxJQUFMLENBQVUsWUFBdEIsR0FBcUMsQ0FBNUM7QUFDSDs7QUFFRDs7Ozs7Ozs7NEJBS21CO0FBQ2YsbUJBQU8sS0FBSyxJQUFMLEdBQVksS0FBSyxLQUFMLEdBQWEsS0FBSyxNQUFMLENBQVksSUFBckMsR0FBNEMsS0FBSyxLQUF4RDtBQUNIOztBQUVEOzs7Ozs7Ozs0QkFLb0I7QUFDaEIsbUJBQU8sS0FBSyxJQUFMLEdBQVksS0FBSyxNQUFMLEdBQWMsS0FBSyxNQUFMLENBQVksSUFBdEMsR0FBNkMsS0FBSyxNQUF6RDtBQUNIOzs7Ozs7a0JBZVUsSzs7O0FDckZmO0FBQ0E7Ozs7Ozs7Ozs7OztBQU1BOzs7Ozs7OztBQUVBOzs7Ozs7OztJQVFNLFk7QUFDRiwwQkFBYSxNQUFiLEVBQXFDO0FBQUEsWUFBaEIsT0FBZ0IsdUVBQU4sSUFBTTs7QUFBQTs7QUFDakM7Ozs7QUFJQSxhQUFLLE1BQUwsR0FBYyxNQUFkOztBQUVBOzs7O0FBSUEsYUFBSyxXQUFMLEdBQW1CLElBQW5COztBQUVBOzs7QUFHQSxhQUFLLElBQUwsR0FBYSxZQUFZLElBQWIsR0FBcUIsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQXJCLEdBQXFELElBQWpFOztBQUVBOzs7O0FBSUEsYUFBSyxPQUFMLEdBQWUsRUFBZjs7QUFFQTtBQUNBLFlBQUksS0FBSyxJQUFULEVBQWU7QUFDWCxpQkFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixRQUFoQixHQUEyQixVQUEzQjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFVBQWhCLEdBQTZCLFdBQTdCO0FBQ0g7QUFDSjs7QUFFRDs7Ozs7Ozs7Ozs7NEJBT0ssSSxFQUFNLEssRUFBTztBQUNkLGdCQUFJLE9BQU8sS0FBUCxLQUFpQixRQUFyQixFQUErQjtBQUMzQix3QkFBUSxvQkFBVSxLQUFLLE1BQWYsRUFBdUIsS0FBdkIsQ0FBUjtBQUNILGFBRkQsTUFHSztBQUNELHNCQUFNLE1BQU4sR0FBZSxLQUFLLE1BQXBCO0FBQ0g7O0FBRUQsaUJBQUssT0FBTCxDQUFhLElBQWIsSUFBcUIsS0FBckI7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7OztrQ0FLVztBQUNQLGlCQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLE9BQXJCLEVBQThCO0FBQzFCLHFCQUFLLE9BQUwsQ0FBYSxHQUFiLEVBQWtCLE9BQWxCO0FBQ0g7O0FBRUQsaUJBQUssTUFBTCxHQUFjLElBQWQ7QUFDQSxpQkFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EsaUJBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxpQkFBSyxPQUFMLEdBQWUsRUFBZjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs0QkFNSyxJLEVBQU07QUFDUCxtQkFBTyxLQUFLLE9BQUwsQ0FBYSxJQUFiLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7dUNBS2dCLEksRUFBTTtBQUNsQixnQkFBSSxLQUFLLElBQUwsSUFBYSxLQUFLLFdBQWxCLElBQWlDLEtBQUssV0FBTCxDQUFpQixJQUF0RCxFQUE0RDtBQUN4RCxxQkFBSyxJQUFMLENBQVUsV0FBVixDQUFzQixLQUFLLFdBQUwsQ0FBaUIsSUFBdkM7QUFDSDs7QUFFRCxpQkFBSyxXQUFMLEdBQW1CLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FBbkI7O0FBRUEsZ0JBQUksS0FBSyxJQUFULEVBQWU7QUFDWCxxQkFBSyxXQUFMLENBQWlCLElBQWpCLENBQXNCLEtBQXRCLENBQTRCLFVBQTVCLEdBQXlDLFFBQXpDO0FBQ0EscUJBQUssV0FBTCxDQUFpQixJQUFqQixDQUFzQixLQUF0QixDQUE0QixPQUE1QixHQUFzQyxPQUF0QztBQUNBLHFCQUFLLElBQUwsQ0FBVSxXQUFWLENBQXNCLEtBQUssV0FBTCxDQUFpQixJQUF2QztBQUNBLHFCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLEtBQWhCLEdBQXdCLEtBQUssV0FBTCxDQUFpQixLQUFqQixHQUF5QixJQUFqRDtBQUNBLHFCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE1BQWhCLEdBQXlCLEtBQUssV0FBTCxDQUFpQixNQUFqQixHQUEwQixJQUFuRDtBQUNIOztBQUVELG1CQUFPLElBQVA7QUFDSDs7Ozs7O2tCQUdVLFk7OztBQ3pIZjtBQUNBOzs7Ozs7Ozs7Ozs7QUFNQTs7OztBQUNBOzs7Ozs7OztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF3Qk0sWTtBQUNGLDBCQUFhLE1BQWIsRUFLUTtBQUFBLHVGQUFKLEVBQUk7QUFBQSxrQ0FKSixTQUlJO0FBQUEsWUFKSixTQUlJLGtDQUpRLEtBSVI7QUFBQSwrQkFISixNQUdJO0FBQUEsWUFISixNQUdJLCtCQUhLLFNBR0w7QUFBQSxrQ0FGSixTQUVJO0FBQUEsWUFGSixTQUVJLGtDQUZRLEtBRVI7QUFBQSxnQ0FESixPQUNJO0FBQUEsWUFESixPQUNJLGdDQURNLFNBQ047O0FBQUE7O0FBQ0o7Ozs7QUFJQSxhQUFLLE1BQUwsR0FBYyxFQUFFLG9CQUFGLEVBQWEsY0FBYixFQUFxQixvQkFBckIsRUFBZ0MsZ0JBQWhDLEVBQWQ7O0FBRUE7OztBQUdBLGFBQUssTUFBTCxHQUFjLE1BQWQ7O0FBRUE7Ozs7QUFJQSxhQUFLLFdBQUwsR0FBb0IsY0FBYyxJQUFmLEdBQXVCLElBQXZCLEdBQThCLEtBQWpEOztBQUVBOzs7O0FBSUEsYUFBSyxXQUFMLEdBQW1CLENBQUMsS0FBSyxXQUFOLEdBQW9CLElBQXBCLEdBQTJCLDBCQUFnQixLQUFLLE1BQUwsQ0FBWSxNQUFaLENBQW1CLElBQW5DLEVBQXlDO0FBQ25GLHVCQUFXLEtBQUssTUFBTCxDQUFZLElBRDREO0FBRW5GLG9CQUFRLE1BRjJFO0FBR25GLDBCQUFjLENBQUMsS0FBSyxNQUFOLENBSHFFO0FBSW5GLHlCQUFhO0FBSnNFLFNBQXpDLENBQTlDOztBQU9BOzs7O0FBSUEsYUFBSyxXQUFMLEdBQW9CLGNBQWMsSUFBZixHQUF1QixJQUF2QixHQUE4QixLQUFqRDs7QUFFQTs7OztBQUlBLGFBQUssWUFBTCxHQUFvQixDQUFDLEtBQUssV0FBTixHQUFvQixJQUFwQixHQUEyQiwyQkFBaUIsS0FBSyxNQUFMLENBQVksSUFBN0IsRUFBbUM7QUFDOUUscUJBQVMsT0FEcUU7QUFFOUUsMkJBQWUsQ0FBQyxLQUFLLE1BQU47QUFGK0QsU0FBbkMsQ0FBL0M7QUFJSDs7QUFFRDs7Ozs7Ozs7OztBQWdCQTs7Ozs7a0NBS1c7QUFDUCxnQkFBSSxLQUFLLFdBQVQsRUFBc0I7QUFDbEIscUJBQUssV0FBTCxDQUFpQixPQUFqQjtBQUNBLHFCQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDSDs7QUFFRCxnQkFBSSxLQUFLLFdBQVQsRUFBc0I7QUFDbEIscUJBQUssWUFBTCxDQUFrQixPQUFsQjtBQUNBLHFCQUFLLFlBQUwsR0FBb0IsSUFBcEI7QUFDSDs7QUFFRCxpQkFBSyxNQUFMLEdBQWMsRUFBZDs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7O3NDQUtlO0FBQ1gsZ0JBQUksS0FBSyxXQUFULEVBQXNCO0FBQ2xCLHFCQUFLLFdBQUwsQ0FBaUIsT0FBakI7QUFDSDs7QUFFRCxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7O3FDQUtjO0FBQ1YsZ0JBQUksS0FBSyxXQUFULEVBQXNCO0FBQ2xCLHFCQUFLLFdBQUwsQ0FBaUIsTUFBakI7QUFDSDs7QUFFRCxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7O3VDQUtnQjtBQUNaLGdCQUFJLEtBQUssV0FBVCxFQUFzQjtBQUNsQixxQkFBSyxZQUFMLENBQWtCLE9BQWxCO0FBQ0g7O0FBRUQsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7OztzQ0FLZTtBQUNYLGdCQUFJLEtBQUssV0FBVCxFQUFzQjtBQUNsQixxQkFBSyxZQUFMLENBQWtCLE1BQWxCO0FBQ0g7O0FBRUQsbUJBQU8sSUFBUDtBQUNIOzs7NEJBbkZrQjtBQUNmLG1CQUFPLEtBQUssV0FBTCxHQUFtQixLQUFLLFdBQUwsQ0FBaUIsT0FBcEMsR0FBOEMsS0FBckQ7QUFDSDs7QUFFRDs7Ozs7Ozs0QkFJb0I7QUFDaEIsbUJBQU8sS0FBSyxXQUFMLEdBQW1CLEtBQUssWUFBTCxDQUFrQixPQUFyQyxHQUErQyxLQUF0RDtBQUNIOzs7Ozs7a0JBNEVVLFk7OztBQy9LZjtBQUNBOzs7Ozs7Ozs7O0FBTUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQTs7Ozs7QUFLQSxJQUFNLFFBQVE7QUFDVjs7Ozs7O0FBTUEscUJBQWlCLHlCQUFVLEVBQVYsRUFBYztBQUMzQixZQUFJLFFBQVEsT0FBTyxnQkFBUCxDQUF3QixFQUF4QixFQUE0QixnQkFBNUIsQ0FBNkMsV0FBN0MsQ0FBWjs7QUFFQTtBQUNBLGdCQUFRLE1BQU0sT0FBTixDQUFjLFFBQWQsRUFBdUIsRUFBdkIsRUFBMkIsT0FBM0IsQ0FBbUMsS0FBbkMsRUFBeUMsRUFBekMsRUFBNkMsT0FBN0MsQ0FBcUQsTUFBckQsRUFBNkQsRUFBN0QsRUFBaUUsS0FBakUsQ0FBdUUsR0FBdkUsQ0FBUjs7QUFFQSxlQUFPLEtBQVA7QUFDSCxLQWRTOztBQWdCVjtBQUNBLHdCQUFvQiw0QkFBVSxFQUFWLEVBQWM7QUFDOUIsWUFBSSxhQUFhLE1BQU0sZUFBTixDQUFzQixFQUF0QixDQUFqQjtBQUNBLFlBQUksU0FBUyxFQUFiOztBQUVBLFlBQUksV0FBVyxDQUFYLE1BQWtCLE1BQXRCLEVBQThCO0FBQzFCLHFCQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsQ0FBVDtBQUNILFNBRkQsTUFHSztBQUNELHVCQUFXLE9BQVgsQ0FBbUIsVUFBVSxJQUFWLEVBQWdCO0FBQy9CLHVCQUFPLElBQVAsQ0FBWSxXQUFXLElBQVgsQ0FBWjtBQUNILGFBRkQ7QUFHSDs7QUFFRCxlQUFPLE1BQVA7QUFDSCxLQS9CUzs7QUFpQ1Y7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBO0FBQ0E7QUFDQTtBQUNBLHFCQUFpQix5QkFBVSxFQUFWLEVBQWMsT0FBZCxFQUF1QixPQUF2QixFQUFnQztBQUM3QyxrQkFBVSxXQUFXLEVBQXJCOztBQUVBLFlBQUksUUFBUSxNQUFNLGVBQU4sQ0FBc0IsRUFBdEIsQ0FBWjtBQUNBLFlBQU0seUJBQXlCLENBQUMsU0FBRCxFQUFZLFNBQVosRUFBdUIsTUFBdkIsRUFBK0IsT0FBL0IsQ0FBL0I7QUFDQSxZQUFNLG9CQUFvQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLENBQTFCO0FBQ0EsWUFBTSxZQUFZO0FBQ2Qsb0JBQVEsQ0FETTtBQUVkLG9CQUFRLENBRk07QUFHZCxtQkFBTyxDQUhPO0FBSWQsbUJBQU8sQ0FKTztBQUtkLHdCQUFZLENBTEU7QUFNZCx3QkFBWTtBQU5FLFNBQWxCOztBQVNBLFlBQUksUUFBUSxLQUFaLEVBQW1CO0FBQ2Ysb0JBQVEsTUFBUixHQUFpQixRQUFRLE1BQVIsR0FBaUIsUUFBUSxLQUExQztBQUNIOztBQUVELFlBQUksUUFBUSxTQUFaLEVBQXVCO0FBQ25CLG9CQUFRLFVBQVIsR0FBcUIsUUFBUSxVQUFSLEdBQXFCLFFBQVEsU0FBbEQ7QUFDSDs7QUFFRDtBQUNBLFlBQUksdUJBQXVCLE9BQXZCLENBQStCLE1BQU0sQ0FBTixDQUEvQixDQUFKLEVBQThDO0FBQzFDLG9CQUFRLGlCQUFSO0FBQ0g7O0FBRUQsYUFBSyxJQUFJLEdBQVQsSUFBZ0IsU0FBaEIsRUFBMkI7QUFDdkIsZ0JBQUksUUFBUSxHQUFSLENBQUosRUFBa0I7QUFDZCxvQkFBSSxFQUFFLFFBQUYsQ0FBVyxRQUFRLEdBQVIsQ0FBWCxDQUFKLEVBQThCO0FBQzFCLDBCQUFNLFVBQVUsR0FBVixDQUFOLElBQXdCLFFBQVEsR0FBUixDQUF4QjtBQUNILGlCQUZELE1BR0s7QUFDRCwwQkFBTSxJQUFJLEtBQUosQ0FBVSx3Q0FBVixDQUFOO0FBQ0g7QUFFSjtBQUNKOztBQUVELFdBQUcsS0FBSCxDQUFTLFNBQVQsR0FBcUIsWUFBWSxNQUFNLElBQU4sQ0FBVyxJQUFYLENBQVosR0FBK0IsR0FBcEQ7O0FBRUEsWUFBSSxPQUFKLEVBQWE7QUFDVCxvQkFBUSxlQUFSLEdBQTBCLElBQTFCOztBQUVBO0FBQ0EsZ0JBQUksV0FBVyxPQUFPLGdCQUFQLENBQXdCLEVBQXhCLEVBQTRCLGdCQUE1QixDQUE2QyxxQkFBN0MsQ0FBWCxNQUFvRixDQUF4RixFQUEyRjtBQUN2Rix3QkFBUSxlQUFSLEdBQTBCLEtBQTFCO0FBQ0g7QUFDSjs7QUFFRCxlQUFPLEVBQVA7QUFDSCxLQXpHUzs7QUEyR1Y7Ozs7Ozs7QUFPQSxzQkFBa0IsMEJBQVUsRUFBVixFQUFjLFVBQWQsRUFBMEI7QUFDeEMscUJBQWEsY0FBYyxFQUEzQjs7QUFFQSxZQUFJLDBCQUEwQjtBQUMxQiw2QkFBaUIsV0FBVyxLQUFYLElBQW9CLElBRFg7QUFFMUIsZ0NBQW9CLFdBQVcsUUFBWCxJQUF1QixJQUZqQjtBQUcxQixnQ0FBb0IsV0FBVyxRQUFYLElBQXVCLEtBSGpCO0FBSTFCLHNDQUEwQixXQUFXLGNBQVgsSUFBNkI7QUFKN0IsU0FBOUI7O0FBT0EsYUFBSyxJQUFJLEdBQVQsSUFBZ0IsdUJBQWhCLEVBQXlDO0FBQ3JDLGVBQUcsS0FBSCxDQUFTLEdBQVQsSUFBZ0Isd0JBQXdCLEdBQXhCLENBQWhCO0FBQ0g7O0FBRUQsZUFBTyxFQUFQO0FBQ0gsS0FqSVM7O0FBbUlWOzs7Ozs7QUFNQSxxQkFBaUIseUJBQVUsSUFBVixFQUFnQjtBQUM3QixZQUFJLGNBQUo7QUFBQSxZQUFXLGFBQVg7QUFDQSxZQUFJLGVBQWUsS0FBbkI7O0FBRUEsZUFBTyxZQUFZO0FBQ2Ysb0JBQVEsSUFBUjtBQUNBLG1CQUFPLFNBQVA7O0FBRUEsZ0JBQUksQ0FBQyxZQUFMLEVBQW1CO0FBQ2YsK0JBQWUsSUFBZjs7QUFFQSx1QkFBTyxxQkFBUCxDQUE2QixVQUFTLFNBQVQsRUFBb0I7QUFDN0MsMEJBQU0sU0FBTixDQUFnQixJQUFoQixDQUFxQixJQUFyQixDQUEwQixJQUExQixFQUFnQyxTQUFoQztBQUNBLHlCQUFLLEtBQUwsQ0FBVyxLQUFYLEVBQWtCLElBQWxCO0FBQ0EsbUNBQWUsS0FBZjtBQUNILGlCQUpEO0FBS0g7QUFDSixTQWJEO0FBY0gsS0EzSlM7O0FBNkpWOzs7Ozs7OztBQVFBLG1CQUFlLHVCQUFVLEtBQVYsRUFBaUIsS0FBakIsRUFBd0I7QUFDbkMsWUFBSSxjQUFKO0FBQ0EsWUFBSSxXQUFXLElBQWY7O0FBRUEsWUFBSSxPQUFPLEtBQVAsS0FBaUIsUUFBckIsRUFBK0I7QUFDM0Isb0JBQVEsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQVI7QUFDSDs7QUFFRCxZQUFJLHlCQUFVLEtBQVYsQ0FBSixFQUFzQjtBQUNsQiw2QkFBaUIsTUFBTSxHQUFOLENBQVUsc0JBQVYsQ0FBaUMsS0FBakMsRUFBd0MsS0FBeEMsQ0FBakI7QUFDQSx1QkFBVyxxQkFBWSxlQUFlLENBQTNCLEVBQThCLGVBQWUsQ0FBN0MsQ0FBWDtBQUNILFNBSEQsTUFJSyxJQUFJLHdCQUFTLEtBQVQsQ0FBSixFQUFxQjtBQUN0Qix1QkFBVyxxQkFBWSxNQUFNLENBQWxCLEVBQXFCLE1BQU0sQ0FBM0IsQ0FBWDtBQUNIOztBQUVELGVBQU8sUUFBUDtBQUNIO0FBdExTLENBQWQ7O0FBeUxBLE1BQU0sR0FBTixHQUFZO0FBQ1I7Ozs7Ozs7QUFPQSw0QkFBd0IsZ0NBQVUsTUFBVixFQUFrQixLQUFsQixFQUF5QjtBQUM3QyxZQUFJLElBQUssT0FBTyxXQUFQLEdBQXFCLENBQXRCLEdBQTJCLE9BQU8sVUFBbEMsR0FBK0MsTUFBTSxVQUE3RDtBQUNBLFlBQUksSUFBSyxPQUFPLFlBQVAsR0FBc0IsQ0FBdkIsR0FBNEIsT0FBTyxTQUFuQyxHQUErQyxNQUFNLFNBQTdEOztBQUVBLGVBQU8scUJBQVksQ0FBWixFQUFlLENBQWYsQ0FBUDtBQUNILEtBYk87O0FBZVI7Ozs7OztBQU1BLGVBQVcsbUJBQVUsS0FBVixFQUFpQjtBQUN4QixZQUFJLFNBQVMsSUFBYjs7QUFFQSxZQUFJLE9BQU8sS0FBUCxLQUFpQixRQUFyQixFQUErQjtBQUMzQixxQkFBUyxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBVDtBQUNILFNBRkQsTUFHSyxJQUFJLHlCQUFVLEtBQVYsQ0FBSixFQUFzQjtBQUN2QixxQkFBUyxLQUFUO0FBQ0g7O0FBRUQsZUFBTyxNQUFQO0FBQ0g7QUFoQ08sQ0FBWjs7QUFtQ0EsTUFBTSxJQUFOLEdBQWE7QUFDVDs7Ozs7O0FBTUEsb0JBQWdCLHdCQUFDLEdBQUQsRUFBTSxJQUFOLEVBQWU7QUFDM0IsWUFBSSxXQUFXLENBQWY7O0FBRUEsZ0JBQVEsSUFBUjtBQUNJLGlCQUFLLEdBQUw7QUFDSSwyQkFBWSxPQUFPLEdBQVIsR0FBZSxJQUExQjtBQUNBO0FBQ0osaUJBQUssSUFBTDtBQUNJLDJCQUFXLE9BQU8sR0FBbEI7QUFDQTtBQU5SOztBQVNBLGVBQU8sUUFBUDtBQUNIO0FBcEJRLENBQWI7O2tCQXVCZSxLOzs7QUNuUWY7QUFDQTs7Ozs7Ozs7Ozs7O0FBTUE7Ozs7QUFDQTs7Ozs7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBa0JNLFk7QUFDRiwwQkFBYSxNQUFiLEVBSVE7QUFBQTs7QUFBQSx1RkFBSixFQUFJO0FBQUEsZ0NBSEosT0FHSTtBQUFBLFlBSEosT0FHSSxnQ0FITSxZQUFZLENBQUUsQ0FHcEI7QUFBQSxzQ0FGSixhQUVJO0FBQUEsWUFGSixhQUVJLHNDQUZZLEVBRVo7QUFBQSxxQ0FESixZQUNJO0FBQUEsWUFESixZQUNJLHFDQURXLElBQ1g7O0FBQUE7O0FBQ0o7OztBQUdBLGFBQUssTUFBTCxHQUFjLEVBQUUsZ0JBQUYsRUFBVyw0QkFBWCxFQUEwQiwwQkFBMUIsRUFBZDs7QUFFQTs7OztBQUlBLGFBQUssTUFBTCxHQUFjLGdCQUFNLEdBQU4sQ0FBVSxTQUFWLENBQW9CLE1BQXBCLENBQWQ7O0FBRUE7Ozs7QUFJQSxhQUFLLFVBQUwsR0FBa0IsRUFBbEI7O0FBRUE7Ozs7QUFJQSxhQUFLLGtCQUFMLEdBQTBCLEVBQTFCOztBQUVBOzs7O0FBSUEsYUFBSyxRQUFMLEdBQWdCLElBQWhCOztBQUVBOzs7O0FBSUEsYUFBSyxpQkFBTCxHQUF5Qix3QkFBUyxVQUFVLEtBQVYsRUFBaUI7QUFDL0MsaUJBQUssa0JBQUwsR0FBMEIsS0FBSyxVQUEvQjtBQUNBLGlCQUFLLFVBQUwsR0FBa0IsS0FBbEI7QUFDQSxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQixLQUFwQixDQUEwQixLQUFLLE1BQUwsQ0FBWSxZQUF0QyxFQUFvRCxLQUFLLE1BQUwsQ0FBWSxhQUFoRTtBQUNILFNBSndCLEVBSXRCLGdCQUFNLElBQU4sQ0FBVyxjQUFYLENBQTBCLEVBQTFCLEVBQThCLElBQTlCLENBSnNCLENBQXpCOztBQU1BOzs7O0FBSUEsYUFBSyxRQUFMLEdBQWdCLFVBQUMsS0FBRCxFQUFXO0FBQ3ZCLGtCQUFNLGNBQU47QUFDQSxrQkFBTSxlQUFOO0FBQ0Esa0JBQUssaUJBQUwsQ0FBdUIsS0FBdkI7QUFDSCxTQUpEOztBQU1BLGFBQUssTUFBTDtBQUNIOztBQUVEOzs7Ozs7Ozs7OztBQVNBOzs7OztrQ0FLVztBQUNQLGlCQUFLLE9BQUw7QUFDQSxpQkFBSyxNQUFMLEdBQWMsRUFBZDtBQUNBLGlCQUFLLE1BQUwsR0FBYyxJQUFkOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7a0NBS1c7QUFDUCxpQkFBSyxNQUFMLENBQVksbUJBQVosQ0FBZ0MsT0FBaEMsRUFBeUMsS0FBSyxRQUE5QztBQUNBLGlCQUFLLFFBQUwsR0FBZ0IsS0FBaEI7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7OztpQ0FLVTtBQUNOLGlCQUFLLE1BQUwsQ0FBWSxnQkFBWixDQUE2QixPQUE3QixFQUFzQyxLQUFLLFFBQTNDO0FBQ0EsaUJBQUssUUFBTCxHQUFnQixJQUFoQjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7Ozs0QkF2Q2M7QUFDWCxtQkFBTyxLQUFLLFFBQVo7QUFDSDs7Ozs7O2tCQXdDVSxZIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuXG52YXIgZmJlbWl0dGVyID0ge1xuICBFdmVudEVtaXR0ZXI6IHJlcXVpcmUoJy4vbGliL0Jhc2VFdmVudEVtaXR0ZXInKSxcbiAgRW1pdHRlclN1YnNjcmlwdGlvbiA6IHJlcXVpcmUoJy4vbGliL0VtaXR0ZXJTdWJzY3JpcHRpb24nKVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmYmVtaXR0ZXI7XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIEJhc2VFdmVudEVtaXR0ZXJcbiAqIEB0eXBlY2hlY2tzXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIEVtaXR0ZXJTdWJzY3JpcHRpb24gPSByZXF1aXJlKCcuL0VtaXR0ZXJTdWJzY3JpcHRpb24nKTtcbnZhciBFdmVudFN1YnNjcmlwdGlvblZlbmRvciA9IHJlcXVpcmUoJy4vRXZlbnRTdWJzY3JpcHRpb25WZW5kb3InKTtcblxudmFyIGVtcHR5RnVuY3Rpb24gPSByZXF1aXJlKCdmYmpzL2xpYi9lbXB0eUZ1bmN0aW9uJyk7XG52YXIgaW52YXJpYW50ID0gcmVxdWlyZSgnZmJqcy9saWIvaW52YXJpYW50Jyk7XG5cbi8qKlxuICogQGNsYXNzIEJhc2VFdmVudEVtaXR0ZXJcbiAqIEBkZXNjcmlwdGlvblxuICogQW4gRXZlbnRFbWl0dGVyIGlzIHJlc3BvbnNpYmxlIGZvciBtYW5hZ2luZyBhIHNldCBvZiBsaXN0ZW5lcnMgYW5kIHB1Ymxpc2hpbmdcbiAqIGV2ZW50cyB0byB0aGVtIHdoZW4gaXQgaXMgdG9sZCB0aGF0IHN1Y2ggZXZlbnRzIGhhcHBlbmVkLiBJbiBhZGRpdGlvbiB0byB0aGVcbiAqIGRhdGEgZm9yIHRoZSBnaXZlbiBldmVudCBpdCBhbHNvIHNlbmRzIGEgZXZlbnQgY29udHJvbCBvYmplY3Qgd2hpY2ggYWxsb3dzXG4gKiB0aGUgbGlzdGVuZXJzL2hhbmRsZXJzIHRvIHByZXZlbnQgdGhlIGRlZmF1bHQgYmVoYXZpb3Igb2YgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIFRoZSBlbWl0dGVyIGlzIGRlc2lnbmVkIHRvIGJlIGdlbmVyaWMgZW5vdWdoIHRvIHN1cHBvcnQgYWxsIHRoZSBkaWZmZXJlbnRcbiAqIGNvbnRleHRzIGluIHdoaWNoIG9uZSBtaWdodCB3YW50IHRvIGVtaXQgZXZlbnRzLiBJdCBpcyBhIHNpbXBsZSBtdWx0aWNhc3RcbiAqIG1lY2hhbmlzbSBvbiB0b3Agb2Ygd2hpY2ggZXh0cmEgZnVuY3Rpb25hbGl0eSBjYW4gYmUgY29tcG9zZWQuIEZvciBleGFtcGxlLCBhXG4gKiBtb3JlIGFkdmFuY2VkIGVtaXR0ZXIgbWF5IHVzZSBhbiBFdmVudEhvbGRlciBhbmQgRXZlbnRGYWN0b3J5LlxuICovXG5cbnZhciBCYXNlRXZlbnRFbWl0dGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cblxuICBmdW5jdGlvbiBCYXNlRXZlbnRFbWl0dGVyKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBCYXNlRXZlbnRFbWl0dGVyKTtcblxuICAgIHRoaXMuX3N1YnNjcmliZXIgPSBuZXcgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IoKTtcbiAgICB0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbGlzdGVuZXIgdG8gYmUgaW52b2tlZCB3aGVuIGV2ZW50cyBvZiB0aGUgc3BlY2lmaWVkIHR5cGUgYXJlXG4gICAqIGVtaXR0ZWQuIEFuIG9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBtYXkgYmUgcHJvdmlkZWQuIFRoZSBkYXRhIGFyZ3VtZW50c1xuICAgKiBlbWl0dGVkIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAgICpcbiAgICogVE9ETzogQW5ub3RhdGUgdGhlIGxpc3RlbmVyIGFyZydzIHR5cGUuIFRoaXMgaXMgdHJpY2t5IGJlY2F1c2UgbGlzdGVuZXJzXG4gICAqICAgICAgIGNhbiBiZSBpbnZva2VkIHdpdGggdmFyYXJncy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSAtIE5hbWUgb2YgdGhlIGV2ZW50IHRvIGxpc3RlbiB0b1xuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lciAtIEZ1bmN0aW9uIHRvIGludm9rZSB3aGVuIHRoZSBzcGVjaWZpZWQgZXZlbnQgaXNcbiAgICogICBlbWl0dGVkXG4gICAqIEBwYXJhbSB7Kn0gY29udGV4dCAtIE9wdGlvbmFsIGNvbnRleHQgb2JqZWN0IHRvIHVzZSB3aGVuIGludm9raW5nIHRoZVxuICAgKiAgIGxpc3RlbmVyXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZlbnRUeXBlLCBsaXN0ZW5lciwgY29udGV4dCkge1xuICAgIHJldHVybiB0aGlzLl9zdWJzY3JpYmVyLmFkZFN1YnNjcmlwdGlvbihldmVudFR5cGUsIG5ldyBFbWl0dGVyU3Vic2NyaXB0aW9uKHRoaXMuX3N1YnNjcmliZXIsIGxpc3RlbmVyLCBjb250ZXh0KSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNpbWlsYXIgdG8gYWRkTGlzdGVuZXIsIGV4Y2VwdCB0aGF0IHRoZSBsaXN0ZW5lciBpcyByZW1vdmVkIGFmdGVyIGl0IGlzXG4gICAqIGludm9rZWQgb25jZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSAtIE5hbWUgb2YgdGhlIGV2ZW50IHRvIGxpc3RlbiB0b1xuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lciAtIEZ1bmN0aW9uIHRvIGludm9rZSBvbmx5IG9uY2Ugd2hlbiB0aGVcbiAgICogICBzcGVjaWZpZWQgZXZlbnQgaXMgZW1pdHRlZFxuICAgKiBAcGFyYW0geyp9IGNvbnRleHQgLSBPcHRpb25hbCBjb250ZXh0IG9iamVjdCB0byB1c2Ugd2hlbiBpbnZva2luZyB0aGVcbiAgICogICBsaXN0ZW5lclxuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudFR5cGUsIGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgdmFyIGVtaXR0ZXIgPSB0aGlzO1xuICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2ZW50VHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgZW1pdHRlci5yZW1vdmVDdXJyZW50TGlzdGVuZXIoKTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIG9mIHRoZSByZWdpc3RlcmVkIGxpc3RlbmVycywgaW5jbHVkaW5nIHRob3NlIHJlZ2lzdGVyZWQgYXNcbiAgICogbGlzdGVuZXIgbWFwcy5cbiAgICpcbiAgICogQHBhcmFtIHs/c3RyaW5nfSBldmVudFR5cGUgLSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB3aG9zZSByZWdpc3RlcmVkXG4gICAqICAgbGlzdGVuZXJzIHRvIHJlbW92ZVxuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnRUeXBlKSB7XG4gICAgdGhpcy5fc3Vic2NyaWJlci5yZW1vdmVBbGxTdWJzY3JpcHRpb25zKGV2ZW50VHlwZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFByb3ZpZGVzIGFuIEFQSSB0aGF0IGNhbiBiZSBjYWxsZWQgZHVyaW5nIGFuIGV2ZW50aW5nIGN5Y2xlIHRvIHJlbW92ZSB0aGVcbiAgICogbGFzdCBsaXN0ZW5lciB0aGF0IHdhcyBpbnZva2VkLiBUaGlzIGFsbG93cyBhIGRldmVsb3BlciB0byBwcm92aWRlIGFuIGV2ZW50XG4gICAqIG9iamVjdCB0aGF0IGNhbiByZW1vdmUgdGhlIGxpc3RlbmVyIChvciBsaXN0ZW5lciBtYXApIGR1cmluZyB0aGVcbiAgICogaW52b2NhdGlvbi5cbiAgICpcbiAgICogSWYgaXQgaXMgY2FsbGVkIHdoZW4gbm90IGluc2lkZSBvZiBhbiBlbWl0dGluZyBjeWNsZSBpdCB3aWxsIHRocm93LlxuICAgKlxuICAgKiBAdGhyb3dzIHtFcnJvcn0gV2hlbiBjYWxsZWQgbm90IGR1cmluZyBhbiBldmVudGluZyBjeWNsZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgIHZhciBzdWJzY3JpcHRpb24gPSBlbWl0dGVyLmFkZExpc3RlbmVyTWFwKHtcbiAgICogICAgIHNvbWVFdmVudDogZnVuY3Rpb24oZGF0YSwgZXZlbnQpIHtcbiAgICogICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAqICAgICAgIGVtaXR0ZXIucmVtb3ZlQ3VycmVudExpc3RlbmVyKCk7XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqXG4gICAqICAgZW1pdHRlci5lbWl0KCdzb21lRXZlbnQnLCAnYWJjJyk7IC8vIGxvZ3MgJ2FiYydcbiAgICogICBlbWl0dGVyLmVtaXQoJ3NvbWVFdmVudCcsICdkZWYnKTsgLy8gZG9lcyBub3QgbG9nIGFueXRoaW5nXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUN1cnJlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUN1cnJlbnRMaXN0ZW5lcigpIHtcbiAgICAhISF0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ05vdCBpbiBhbiBlbWl0dGluZyBjeWNsZTsgdGhlcmUgaXMgbm8gY3VycmVudCBzdWJzY3JpcHRpb24nKSA6IGludmFyaWFudChmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc3Vic2NyaWJlci5yZW1vdmVTdWJzY3JpcHRpb24odGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbik7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRoYXQgYXJlIGN1cnJlbnRseSByZWdpc3RlcmVkIGZvciB0aGUgZ2l2ZW5cbiAgICogZXZlbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgLSBOYW1lIG9mIHRoZSBldmVudCB0byBxdWVyeVxuICAgKiBAcmV0dXJuIHthcnJheX1cbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50VHlwZSkgLyogVE9ETzogQXJyYXk8RXZlbnRTdWJzY3JpcHRpb24+ICove1xuICAgIHZhciBzdWJzY3JpcHRpb25zID0gdGhpcy5fc3Vic2NyaWJlci5nZXRTdWJzY3JpcHRpb25zRm9yVHlwZShldmVudFR5cGUpO1xuICAgIHJldHVybiBzdWJzY3JpcHRpb25zID8gc3Vic2NyaXB0aW9ucy5maWx0ZXIoZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc1RydWUpLm1hcChmdW5jdGlvbiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm4gc3Vic2NyaXB0aW9uLmxpc3RlbmVyO1xuICAgIH0pIDogW107XG4gIH07XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IG9mIHRoZSBnaXZlbiB0eXBlIHdpdGggdGhlIGdpdmVuIGRhdGEuIEFsbCBoYW5kbGVycyBvZiB0aGF0XG4gICAqIHBhcnRpY3VsYXIgdHlwZSB3aWxsIGJlIG5vdGlmaWVkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIC0gTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdFxuICAgKiBAcGFyYW0geyp9IEFyYml0cmFyeSBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggcmVnaXN0ZXJlZCBsaXN0ZW5lclxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgIGVtaXR0ZXIuYWRkTGlzdGVuZXIoJ3NvbWVFdmVudCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICogICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgKiAgIH0pO1xuICAgKlxuICAgKiAgIGVtaXR0ZXIuZW1pdCgnc29tZUV2ZW50JywgJ2FiYycpOyAvLyBsb2dzICdhYmMnXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50VHlwZSkge1xuICAgIHZhciBzdWJzY3JpcHRpb25zID0gdGhpcy5fc3Vic2NyaWJlci5nZXRTdWJzY3JpcHRpb25zRm9yVHlwZShldmVudFR5cGUpO1xuICAgIGlmIChzdWJzY3JpcHRpb25zKSB7XG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHN1YnNjcmlwdGlvbnMpO1xuICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGtleXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2lpXTtcbiAgICAgICAgdmFyIHN1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbnNba2V5XTtcbiAgICAgICAgLy8gVGhlIHN1YnNjcmlwdGlvbiBtYXkgaGF2ZSBiZWVuIHJlbW92ZWQgZHVyaW5nIHRoaXMgZXZlbnQgbG9vcC5cbiAgICAgICAgaWYgKHN1YnNjcmlwdGlvbikge1xuICAgICAgICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBzdWJzY3JpcHRpb247XG4gICAgICAgICAgdGhpcy5fX2VtaXRUb1N1YnNjcmlwdGlvbi5hcHBseSh0aGlzLCBbc3Vic2NyaXB0aW9uXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFByb3ZpZGVzIGEgaG9vayB0byBvdmVycmlkZSBob3cgdGhlIGVtaXR0ZXIgZW1pdHMgYW4gZXZlbnQgdG8gYSBzcGVjaWZpY1xuICAgKiBzdWJzY3JpcHRpb24uIFRoaXMgYWxsb3dzIHlvdSB0byBzZXQgdXAgbG9nZ2luZyBhbmQgZXJyb3IgYm91bmRhcmllc1xuICAgKiBzcGVjaWZpYyB0byB5b3VyIGVudmlyb25tZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0VtaXR0ZXJTdWJzY3JpcHRpb259IHN1YnNjcmlwdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlXG4gICAqIEBwYXJhbSB7Kn0gQXJiaXRyYXJ5IGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCByZWdpc3RlcmVkIGxpc3RlbmVyXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9fZW1pdFRvU3Vic2NyaXB0aW9uID0gZnVuY3Rpb24gX19lbWl0VG9TdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uLCBldmVudFR5cGUpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgc3Vic2NyaXB0aW9uLmxpc3RlbmVyLmFwcGx5KHN1YnNjcmlwdGlvbi5jb250ZXh0LCBhcmdzKTtcbiAgfTtcblxuICByZXR1cm4gQmFzZUV2ZW50RW1pdHRlcjtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZUV2ZW50RW1pdHRlcjsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKiBcbiAqIEBwcm92aWRlc01vZHVsZSBFbWl0dGVyU3Vic2NyaXB0aW9uXG4gKiBAdHlwZWNoZWNrc1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBFdmVudFN1YnNjcmlwdGlvbiA9IHJlcXVpcmUoJy4vRXZlbnRTdWJzY3JpcHRpb24nKTtcblxuLyoqXG4gKiBFbWl0dGVyU3Vic2NyaXB0aW9uIHJlcHJlc2VudHMgYSBzdWJzY3JpcHRpb24gd2l0aCBsaXN0ZW5lciBhbmQgY29udGV4dCBkYXRhLlxuICovXG5cbnZhciBFbWl0dGVyU3Vic2NyaXB0aW9uID0gKGZ1bmN0aW9uIChfRXZlbnRTdWJzY3JpcHRpb24pIHtcbiAgX2luaGVyaXRzKEVtaXR0ZXJTdWJzY3JpcHRpb24sIF9FdmVudFN1YnNjcmlwdGlvbik7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RXZlbnRTdWJzY3JpcHRpb25WZW5kb3J9IHN1YnNjcmliZXIgLSBUaGUgc3Vic2NyaWJlciB0aGF0IGNvbnRyb2xzXG4gICAqICAgdGhpcyBzdWJzY3JpcHRpb25cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXIgLSBGdW5jdGlvbiB0byBpbnZva2Ugd2hlbiB0aGUgc3BlY2lmaWVkIGV2ZW50IGlzXG4gICAqICAgZW1pdHRlZFxuICAgKiBAcGFyYW0geyp9IGNvbnRleHQgLSBPcHRpb25hbCBjb250ZXh0IG9iamVjdCB0byB1c2Ugd2hlbiBpbnZva2luZyB0aGVcbiAgICogICBsaXN0ZW5lclxuICAgKi9cblxuICBmdW5jdGlvbiBFbWl0dGVyU3Vic2NyaXB0aW9uKHN1YnNjcmliZXIsIGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEVtaXR0ZXJTdWJzY3JpcHRpb24pO1xuXG4gICAgX0V2ZW50U3Vic2NyaXB0aW9uLmNhbGwodGhpcywgc3Vic2NyaWJlcik7XG4gICAgdGhpcy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIH1cblxuICByZXR1cm4gRW1pdHRlclN1YnNjcmlwdGlvbjtcbn0pKEV2ZW50U3Vic2NyaXB0aW9uKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyU3Vic2NyaXB0aW9uOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgRXZlbnRTdWJzY3JpcHRpb25cbiAqIEB0eXBlY2hlY2tzXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEV2ZW50U3Vic2NyaXB0aW9uIHJlcHJlc2VudHMgYSBzdWJzY3JpcHRpb24gdG8gYSBwYXJ0aWN1bGFyIGV2ZW50LiBJdCBjYW5cbiAqIHJlbW92ZSBpdHMgb3duIHN1YnNjcmlwdGlvbi5cbiAqL1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIEV2ZW50U3Vic2NyaXB0aW9uID0gKGZ1bmN0aW9uICgpIHtcblxuICAvKipcbiAgICogQHBhcmFtIHtFdmVudFN1YnNjcmlwdGlvblZlbmRvcn0gc3Vic2NyaWJlciB0aGUgc3Vic2NyaWJlciB0aGF0IGNvbnRyb2xzXG4gICAqICAgdGhpcyBzdWJzY3JpcHRpb24uXG4gICAqL1xuXG4gIGZ1bmN0aW9uIEV2ZW50U3Vic2NyaXB0aW9uKHN1YnNjcmliZXIpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRTdWJzY3JpcHRpb24pO1xuXG4gICAgdGhpcy5zdWJzY3JpYmVyID0gc3Vic2NyaWJlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoaXMgc3Vic2NyaXB0aW9uIGZyb20gdGhlIHN1YnNjcmliZXIgdGhhdCBjb250cm9scyBpdC5cbiAgICovXG5cbiAgRXZlbnRTdWJzY3JpcHRpb24ucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICBpZiAodGhpcy5zdWJzY3JpYmVyKSB7XG4gICAgICB0aGlzLnN1YnNjcmliZXIucmVtb3ZlU3Vic2NyaXB0aW9uKHRoaXMpO1xuICAgICAgdGhpcy5zdWJzY3JpYmVyID0gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIEV2ZW50U3Vic2NyaXB0aW9uO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudFN1YnNjcmlwdGlvbjsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKiBcbiAqIEBwcm92aWRlc01vZHVsZSBFdmVudFN1YnNjcmlwdGlvblZlbmRvclxuICogQHR5cGVjaGVja3NcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgaW52YXJpYW50ID0gcmVxdWlyZSgnZmJqcy9saWIvaW52YXJpYW50Jyk7XG5cbi8qKlxuICogRXZlbnRTdWJzY3JpcHRpb25WZW5kb3Igc3RvcmVzIGEgc2V0IG9mIEV2ZW50U3Vic2NyaXB0aW9ucyB0aGF0IGFyZVxuICogc3Vic2NyaWJlZCB0byBhIHBhcnRpY3VsYXIgZXZlbnQgdHlwZS5cbiAqL1xuXG52YXIgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFdmVudFN1YnNjcmlwdGlvblZlbmRvcigpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGUgPSB7fTtcbiAgICB0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgc3Vic2NyaXB0aW9uIGtleWVkIGJ5IGFuIGV2ZW50IHR5cGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICogQHBhcmFtIHtFdmVudFN1YnNjcmlwdGlvbn0gc3Vic2NyaXB0aW9uXG4gICAqL1xuXG4gIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLnByb3RvdHlwZS5hZGRTdWJzY3JpcHRpb24gPSBmdW5jdGlvbiBhZGRTdWJzY3JpcHRpb24oZXZlbnRUeXBlLCBzdWJzY3JpcHRpb24pIHtcbiAgICAhKHN1YnNjcmlwdGlvbi5zdWJzY3JpYmVyID09PSB0aGlzKSA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdUaGUgc3Vic2NyaWJlciBvZiB0aGUgc3Vic2NyaXB0aW9uIGlzIGluY29ycmVjdGx5IHNldC4nKSA6IGludmFyaWFudChmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKCF0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdID0gW107XG4gICAgfVxuICAgIHZhciBrZXkgPSB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdLmxlbmd0aDtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdLnB1c2goc3Vic2NyaXB0aW9uKTtcbiAgICBzdWJzY3JpcHRpb24uZXZlbnRUeXBlID0gZXZlbnRUeXBlO1xuICAgIHN1YnNjcmlwdGlvbi5rZXkgPSBrZXk7XG4gICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGJ1bGsgc2V0IG9mIHRoZSBzdWJzY3JpcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gez9zdHJpbmd9IGV2ZW50VHlwZSAtIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGUgd2hvc2VcbiAgICogICByZWdpc3RlcmVkIHN1cHNjcmlwdGlvbnMgdG8gcmVtb3ZlLCBpZiBudWxsIHJlbW92ZSBhbGwgc3Vic2NyaXB0aW9ucy5cbiAgICovXG5cbiAgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IucHJvdG90eXBlLnJlbW92ZUFsbFN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiByZW1vdmVBbGxTdWJzY3JpcHRpb25zKGV2ZW50VHlwZSkge1xuICAgIGlmIChldmVudFR5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGUgPSB7fTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV07XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgc3BlY2lmaWMgc3Vic2NyaXB0aW9uLiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBmdW5jdGlvbiwgY2FsbFxuICAgKiBgc3Vic2NyaXB0aW9uLnJlbW92ZSgpYCBkaXJlY3RseS5cbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IHN1YnNjcmlwdGlvblxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvblZlbmRvci5wcm90b3R5cGUucmVtb3ZlU3Vic2NyaXB0aW9uID0gZnVuY3Rpb24gcmVtb3ZlU3Vic2NyaXB0aW9uKHN1YnNjcmlwdGlvbikge1xuICAgIHZhciBldmVudFR5cGUgPSBzdWJzY3JpcHRpb24uZXZlbnRUeXBlO1xuICAgIHZhciBrZXkgPSBzdWJzY3JpcHRpb24ua2V5O1xuXG4gICAgdmFyIHN1YnNjcmlwdGlvbnNGb3JUeXBlID0gdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXTtcbiAgICBpZiAoc3Vic2NyaXB0aW9uc0ZvclR5cGUpIHtcbiAgICAgIGRlbGV0ZSBzdWJzY3JpcHRpb25zRm9yVHlwZVtrZXldO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2Ygc3Vic2NyaXB0aW9ucyB0aGF0IGFyZSBjdXJyZW50bHkgcmVnaXN0ZXJlZCBmb3IgdGhlXG4gICAqIGdpdmVuIGV2ZW50IHR5cGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgYXJyYXkgY2FuIGJlIHBvdGVudGlhbGx5IHNwYXJzZSBhcyBzdWJzY3JpcHRpb25zIGFyZSBkZWxldGVkXG4gICAqIGZyb20gaXQgd2hlbiB0aGV5IGFyZSByZW1vdmVkLlxuICAgKlxuICAgKiBUT0RPOiBUaGlzIHJldHVybnMgYSBudWxsYWJsZSBhcnJheS4gd2F0P1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlXG4gICAqIEByZXR1cm4gez9hcnJheX1cbiAgICovXG5cbiAgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IucHJvdG90eXBlLmdldFN1YnNjcmlwdGlvbnNGb3JUeXBlID0gZnVuY3Rpb24gZ2V0U3Vic2NyaXB0aW9uc0ZvclR5cGUoZXZlbnRUeXBlKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV07XG4gIH07XG5cbiAgcmV0dXJuIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudFN1YnNjcmlwdGlvblZlbmRvcjsiLCJcInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIFxuICovXG5cbmZ1bmN0aW9uIG1ha2VFbXB0eUZ1bmN0aW9uKGFyZykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhcmc7XG4gIH07XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBhY2NlcHRzIGFuZCBkaXNjYXJkcyBpbnB1dHM7IGl0IGhhcyBubyBzaWRlIGVmZmVjdHMuIFRoaXMgaXNcbiAqIHByaW1hcmlseSB1c2VmdWwgaWRpb21hdGljYWxseSBmb3Igb3ZlcnJpZGFibGUgZnVuY3Rpb24gZW5kcG9pbnRzIHdoaWNoXG4gKiBhbHdheXMgbmVlZCB0byBiZSBjYWxsYWJsZSwgc2luY2UgSlMgbGFja3MgYSBudWxsLWNhbGwgaWRpb20gYWxhIENvY29hLlxuICovXG52YXIgZW1wdHlGdW5jdGlvbiA9IGZ1bmN0aW9uIGVtcHR5RnVuY3Rpb24oKSB7fTtcblxuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJucyA9IG1ha2VFbXB0eUZ1bmN0aW9uO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc0ZhbHNlID0gbWFrZUVtcHR5RnVuY3Rpb24oZmFsc2UpO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc1RydWUgPSBtYWtlRW1wdHlGdW5jdGlvbih0cnVlKTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNOdWxsID0gbWFrZUVtcHR5RnVuY3Rpb24obnVsbCk7XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVGhpcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc0FyZ3VtZW50ID0gZnVuY3Rpb24gKGFyZykge1xuICByZXR1cm4gYXJnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBlbXB0eUZ1bmN0aW9uOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFVzZSBpbnZhcmlhbnQoKSB0byBhc3NlcnQgc3RhdGUgd2hpY2ggeW91ciBwcm9ncmFtIGFzc3VtZXMgdG8gYmUgdHJ1ZS5cbiAqXG4gKiBQcm92aWRlIHNwcmludGYtc3R5bGUgZm9ybWF0IChvbmx5ICVzIGlzIHN1cHBvcnRlZCkgYW5kIGFyZ3VtZW50c1xuICogdG8gcHJvdmlkZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IGJyb2tlIGFuZCB3aGF0IHlvdSB3ZXJlXG4gKiBleHBlY3RpbmcuXG4gKlxuICogVGhlIGludmFyaWFudCBtZXNzYWdlIHdpbGwgYmUgc3RyaXBwZWQgaW4gcHJvZHVjdGlvbiwgYnV0IHRoZSBpbnZhcmlhbnRcbiAqIHdpbGwgcmVtYWluIHRvIGVuc3VyZSBsb2dpYyBkb2VzIG5vdCBkaWZmZXIgaW4gcHJvZHVjdGlvbi5cbiAqL1xuXG5mdW5jdGlvbiBpbnZhcmlhbnQoY29uZGl0aW9uLCBmb3JtYXQsIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YXJpYW50IHJlcXVpcmVzIGFuIGVycm9yIG1lc3NhZ2UgYXJndW1lbnQnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbmRpdGlvbikge1xuICAgIHZhciBlcnJvcjtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKCdNaW5pZmllZCBleGNlcHRpb24gb2NjdXJyZWQ7IHVzZSB0aGUgbm9uLW1pbmlmaWVkIGRldiBlbnZpcm9ubWVudCAnICsgJ2ZvciB0aGUgZnVsbCBlcnJvciBtZXNzYWdlIGFuZCBhZGRpdGlvbmFsIGhlbHBmdWwgd2FybmluZ3MuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhcmdzID0gW2EsIGIsIGMsIGQsIGUsIGZdO1xuICAgICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBhcmdzW2FyZ0luZGV4KytdO1xuICAgICAgfSkpO1xuICAgICAgZXJyb3IubmFtZSA9ICdJbnZhcmlhbnQgVmlvbGF0aW9uJztcbiAgICB9XG5cbiAgICBlcnJvci5mcmFtZXNUb1BvcCA9IDE7IC8vIHdlIGRvbid0IGNhcmUgYWJvdXQgaW52YXJpYW50J3Mgb3duIGZyYW1lXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbnZhcmlhbnQ7IiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbDtcbiIsIi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLm1hcGAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlXG4gKiBzaG9ydGhhbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgbWFwcGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBhcnJheU1hcChhcnJheSwgaXRlcmF0ZWUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheSA9PSBudWxsID8gMCA6IGFycmF5Lmxlbmd0aCxcbiAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0ZWUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlNYXA7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmNsYW1wYCB3aGljaCBkb2Vzbid0IGNvZXJjZSBhcmd1bWVudHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIgVGhlIG51bWJlciB0byBjbGFtcC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbbG93ZXJdIFRoZSBsb3dlciBib3VuZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSB1cHBlciBUaGUgdXBwZXIgYm91bmQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBjbGFtcGVkIG51bWJlci5cbiAqL1xuZnVuY3Rpb24gYmFzZUNsYW1wKG51bWJlciwgbG93ZXIsIHVwcGVyKSB7XG4gIGlmIChudW1iZXIgPT09IG51bWJlcikge1xuICAgIGlmICh1cHBlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBudW1iZXIgPSBudW1iZXIgPD0gdXBwZXIgPyBudW1iZXIgOiB1cHBlcjtcbiAgICB9XG4gICAgaWYgKGxvd2VyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG51bWJlciA9IG51bWJlciA+PSBsb3dlciA/IG51bWJlciA6IGxvd2VyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVtYmVyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VDbGFtcDtcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKSxcbiAgICBnZXRSYXdUYWcgPSByZXF1aXJlKCcuL19nZXRSYXdUYWcnKSxcbiAgICBvYmplY3RUb1N0cmluZyA9IHJlcXVpcmUoJy4vX29iamVjdFRvU3RyaW5nJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBudWxsVGFnID0gJ1tvYmplY3QgTnVsbF0nLFxuICAgIHVuZGVmaW5lZFRhZyA9ICdbb2JqZWN0IFVuZGVmaW5lZF0nO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1Ub1N0cmluZ1RhZyA9IFN5bWJvbCA/IFN5bWJvbC50b1N0cmluZ1RhZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgZ2V0VGFnYCB3aXRob3V0IGZhbGxiYWNrcyBmb3IgYnVnZ3kgZW52aXJvbm1lbnRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGB0b1N0cmluZ1RhZ2AuXG4gKi9cbmZ1bmN0aW9uIGJhc2VHZXRUYWcodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZFRhZyA6IG51bGxUYWc7XG4gIH1cbiAgdmFsdWUgPSBPYmplY3QodmFsdWUpO1xuICByZXR1cm4gKHN5bVRvU3RyaW5nVGFnICYmIHN5bVRvU3RyaW5nVGFnIGluIHZhbHVlKVxuICAgID8gZ2V0UmF3VGFnKHZhbHVlKVxuICAgIDogb2JqZWN0VG9TdHJpbmcodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VHZXRUYWc7XG4iLCJ2YXIgU3ltYm9sID0gcmVxdWlyZSgnLi9fU3ltYm9sJyksXG4gICAgYXJyYXlNYXAgPSByZXF1aXJlKCcuL19hcnJheU1hcCcpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuL2lzQXJyYXknKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgSU5GSU5JVFkgPSAxIC8gMDtcblxuLyoqIFVzZWQgdG8gY29udmVydCBzeW1ib2xzIHRvIHByaW1pdGl2ZXMgYW5kIHN0cmluZ3MuICovXG52YXIgc3ltYm9sUHJvdG8gPSBTeW1ib2wgPyBTeW1ib2wucHJvdG90eXBlIDogdW5kZWZpbmVkLFxuICAgIHN5bWJvbFRvU3RyaW5nID0gc3ltYm9sUHJvdG8gPyBzeW1ib2xQcm90by50b1N0cmluZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy50b1N0cmluZ2Agd2hpY2ggZG9lc24ndCBjb252ZXJ0IG51bGxpc2hcbiAqIHZhbHVlcyB0byBlbXB0eSBzdHJpbmdzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBiYXNlVG9TdHJpbmcodmFsdWUpIHtcbiAgLy8gRXhpdCBlYXJseSBmb3Igc3RyaW5ncyB0byBhdm9pZCBhIHBlcmZvcm1hbmNlIGhpdCBpbiBzb21lIGVudmlyb25tZW50cy5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAvLyBSZWN1cnNpdmVseSBjb252ZXJ0IHZhbHVlcyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgIHJldHVybiBhcnJheU1hcCh2YWx1ZSwgYmFzZVRvU3RyaW5nKSArICcnO1xuICB9XG4gIGlmIChpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gc3ltYm9sVG9TdHJpbmcgPyBzeW1ib2xUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICB9XG4gIHZhciByZXN1bHQgPSAodmFsdWUgKyAnJyk7XG4gIHJldHVybiAocmVzdWx0ID09ICcwJyAmJiAoMSAvIHZhbHVlKSA9PSAtSU5GSU5JVFkpID8gJy0wJyA6IHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlVG9TdHJpbmc7XG4iLCJ2YXIgdG9JbnRlZ2VyID0gcmVxdWlyZSgnLi90b0ludGVnZXInKSxcbiAgICB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKSxcbiAgICB0b1N0cmluZyA9IHJlcXVpcmUoJy4vdG9TdHJpbmcnKTtcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1pbiA9IE1hdGgubWluO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiBsaWtlIGBfLnJvdW5kYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZE5hbWUgVGhlIG5hbWUgb2YgdGhlIGBNYXRoYCBtZXRob2QgdG8gdXNlIHdoZW4gcm91bmRpbmcuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyByb3VuZCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUm91bmQobWV0aG9kTmFtZSkge1xuICB2YXIgZnVuYyA9IE1hdGhbbWV0aG9kTmFtZV07XG4gIHJldHVybiBmdW5jdGlvbihudW1iZXIsIHByZWNpc2lvbikge1xuICAgIG51bWJlciA9IHRvTnVtYmVyKG51bWJlcik7XG4gICAgcHJlY2lzaW9uID0gbmF0aXZlTWluKHRvSW50ZWdlcihwcmVjaXNpb24pLCAyOTIpO1xuICAgIGlmIChwcmVjaXNpb24pIHtcbiAgICAgIC8vIFNoaWZ0IHdpdGggZXhwb25lbnRpYWwgbm90YXRpb24gdG8gYXZvaWQgZmxvYXRpbmctcG9pbnQgaXNzdWVzLlxuICAgICAgLy8gU2VlIFtNRE5dKGh0dHBzOi8vbWRuLmlvL3JvdW5kI0V4YW1wbGVzKSBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAgdmFyIHBhaXIgPSAodG9TdHJpbmcobnVtYmVyKSArICdlJykuc3BsaXQoJ2UnKSxcbiAgICAgICAgICB2YWx1ZSA9IGZ1bmMocGFpclswXSArICdlJyArICgrcGFpclsxXSArIHByZWNpc2lvbikpO1xuXG4gICAgICBwYWlyID0gKHRvU3RyaW5nKHZhbHVlKSArICdlJykuc3BsaXQoJ2UnKTtcbiAgICAgIHJldHVybiArKHBhaXJbMF0gKyAnZScgKyAoK3BhaXJbMV0gLSBwcmVjaXNpb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmMobnVtYmVyKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVSb3VuZDtcbiIsIi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCBmcm9tIE5vZGUuanMuICovXG52YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsICYmIGdsb2JhbC5PYmplY3QgPT09IE9iamVjdCAmJiBnbG9iYWw7XG5cbm1vZHVsZS5leHBvcnRzID0gZnJlZUdsb2JhbDtcbiIsInZhciBvdmVyQXJnID0gcmVxdWlyZSgnLi9fb3ZlckFyZycpO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBnZXRQcm90b3R5cGUgPSBvdmVyQXJnKE9iamVjdC5nZXRQcm90b3R5cGVPZiwgT2JqZWN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRQcm90b3R5cGU7XG4iLCJ2YXIgU3ltYm9sID0gcmVxdWlyZSgnLi9fU3ltYm9sJyk7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBuYXRpdmVPYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1Ub1N0cmluZ1RhZyA9IFN5bWJvbCA/IFN5bWJvbC50b1N0cmluZ1RhZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VHZXRUYWdgIHdoaWNoIGlnbm9yZXMgYFN5bWJvbC50b1N0cmluZ1RhZ2AgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHJhdyBgdG9TdHJpbmdUYWdgLlxuICovXG5mdW5jdGlvbiBnZXRSYXdUYWcodmFsdWUpIHtcbiAgdmFyIGlzT3duID0gaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgc3ltVG9TdHJpbmdUYWcpLFxuICAgICAgdGFnID0gdmFsdWVbc3ltVG9TdHJpbmdUYWddO1xuXG4gIHRyeSB7XG4gICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdW5kZWZpbmVkO1xuICAgIHZhciB1bm1hc2tlZCA9IHRydWU7XG4gIH0gY2F0Y2ggKGUpIHt9XG5cbiAgdmFyIHJlc3VsdCA9IG5hdGl2ZU9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICBpZiAodW5tYXNrZWQpIHtcbiAgICBpZiAoaXNPd24pIHtcbiAgICAgIHZhbHVlW3N5bVRvU3RyaW5nVGFnXSA9IHRhZztcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIHZhbHVlW3N5bVRvU3RyaW5nVGFnXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRSYXdUYWc7XG4iLCIvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgbmF0aXZlT2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgc3RyaW5nIHVzaW5nIGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiBuYXRpdmVPYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RUb1N0cmluZztcbiIsIi8qKlxuICogQ3JlYXRlcyBhIHVuYXJ5IGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCBpdHMgYXJndW1lbnQgdHJhbnNmb3JtZWQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0cmFuc2Zvcm0gVGhlIGFyZ3VtZW50IHRyYW5zZm9ybS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBvdmVyQXJnKGZ1bmMsIHRyYW5zZm9ybSkge1xuICByZXR1cm4gZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIGZ1bmModHJhbnNmb3JtKGFyZykpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG92ZXJBcmc7XG4iLCJ2YXIgZnJlZUdsb2JhbCA9IHJlcXVpcmUoJy4vX2ZyZWVHbG9iYWwnKTtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYgJiYgc2VsZi5PYmplY3QgPT09IE9iamVjdCAmJiBzZWxmO1xuXG4vKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciByb290ID0gZnJlZUdsb2JhbCB8fCBmcmVlU2VsZiB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJvb3Q7XG4iLCJ2YXIgYmFzZUNsYW1wID0gcmVxdWlyZSgnLi9fYmFzZUNsYW1wJyksXG4gICAgdG9OdW1iZXIgPSByZXF1aXJlKCcuL3RvTnVtYmVyJyk7XG5cbi8qKlxuICogQ2xhbXBzIGBudW1iZXJgIHdpdGhpbiB0aGUgaW5jbHVzaXZlIGBsb3dlcmAgYW5kIGB1cHBlcmAgYm91bmRzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBOdW1iZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIgVGhlIG51bWJlciB0byBjbGFtcC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbbG93ZXJdIFRoZSBsb3dlciBib3VuZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSB1cHBlciBUaGUgdXBwZXIgYm91bmQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBjbGFtcGVkIG51bWJlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5jbGFtcCgtMTAsIC01LCA1KTtcbiAqIC8vID0+IC01XG4gKlxuICogXy5jbGFtcCgxMCwgLTUsIDUpO1xuICogLy8gPT4gNVxuICovXG5mdW5jdGlvbiBjbGFtcChudW1iZXIsIGxvd2VyLCB1cHBlcikge1xuICBpZiAodXBwZXIgPT09IHVuZGVmaW5lZCkge1xuICAgIHVwcGVyID0gbG93ZXI7XG4gICAgbG93ZXIgPSB1bmRlZmluZWQ7XG4gIH1cbiAgaWYgKHVwcGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICB1cHBlciA9IHRvTnVtYmVyKHVwcGVyKTtcbiAgICB1cHBlciA9IHVwcGVyID09PSB1cHBlciA/IHVwcGVyIDogMDtcbiAgfVxuICBpZiAobG93ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIGxvd2VyID0gdG9OdW1iZXIobG93ZXIpO1xuICAgIGxvd2VyID0gbG93ZXIgPT09IGxvd2VyID8gbG93ZXIgOiAwO1xuICB9XG4gIHJldHVybiBiYXNlQ2xhbXAodG9OdW1iZXIobnVtYmVyKSwgbG93ZXIsIHVwcGVyKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFtcDtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBub3cgPSByZXF1aXJlKCcuL25vdycpLFxuICAgIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpO1xuXG4vKiogRXJyb3IgbWVzc2FnZSBjb25zdGFudHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXG4gICAgbmF0aXZlTWluID0gTWF0aC5taW47XG5cbi8qKlxuICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXG4gKiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiB3YXNcbiAqIGludm9rZWQuIFRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgIG1ldGhvZCB0byBjYW5jZWxcbiAqIGRlbGF5ZWQgYGZ1bmNgIGludm9jYXRpb25zIGFuZCBhIGBmbHVzaGAgbWV0aG9kIHRvIGltbWVkaWF0ZWx5IGludm9rZSB0aGVtLlxuICogUHJvdmlkZSBgb3B0aW9uc2AgdG8gaW5kaWNhdGUgd2hldGhlciBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb24gdGhlXG4gKiBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gVGhlIGBmdW5jYCBpcyBpbnZva2VkXG4gKiB3aXRoIHRoZSBsYXN0IGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uLiBTdWJzZXF1ZW50XG4gKiBjYWxscyB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYFxuICogaW52b2NhdGlvbi5cbiAqXG4gKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzXG4gKiBpbnZva2VkIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIGRlYm91bmNlZCBmdW5jdGlvblxuICogaXMgaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIElmIGB3YWl0YCBpcyBgMGAgYW5kIGBsZWFkaW5nYCBpcyBgZmFsc2VgLCBgZnVuY2AgaW52b2NhdGlvbiBpcyBkZWZlcnJlZFxuICogdW50aWwgdG8gdGhlIG5leHQgdGljaywgc2ltaWxhciB0byBgc2V0VGltZW91dGAgd2l0aCBhIHRpbWVvdXQgb2YgYDBgLlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwczovL2Nzcy10cmlja3MuY29tL2RlYm91bmNpbmctdGhyb3R0bGluZy1leHBsYWluZWQtZXhhbXBsZXMvKVxuICogZm9yIGRldGFpbHMgb3ZlciB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgXy5kZWJvdW5jZWAgYW5kIGBfLnRocm90dGxlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlYm91bmNlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdXG4gKiAgVGhlIG1heGltdW0gdGltZSBgZnVuY2AgaXMgYWxsb3dlZCB0byBiZSBkZWxheWVkIGJlZm9yZSBpdCdzIGludm9rZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGRlYm91bmNlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQXZvaWQgY29zdGx5IGNhbGN1bGF0aW9ucyB3aGlsZSB0aGUgd2luZG93IHNpemUgaXMgaW4gZmx1eC5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUnLCBfLmRlYm91bmNlKGNhbGN1bGF0ZUxheW91dCwgMTUwKSk7XG4gKlxuICogLy8gSW52b2tlIGBzZW5kTWFpbGAgd2hlbiBjbGlja2VkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHMuXG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBFbnN1cmUgYGJhdGNoTG9nYCBpcyBpbnZva2VkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzLlxuICogdmFyIGRlYm91bmNlZCA9IF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwgeyAnbWF4V2FpdCc6IDEwMDAgfSk7XG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBqUXVlcnkoc291cmNlKS5vbignbWVzc2FnZScsIGRlYm91bmNlZCk7XG4gKlxuICogLy8gQ2FuY2VsIHRoZSB0cmFpbGluZyBkZWJvdW5jZWQgaW52b2NhdGlvbi5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGRlYm91bmNlZC5jYW5jZWwpO1xuICovXG5mdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsYXN0QXJncyxcbiAgICAgIGxhc3RUaGlzLFxuICAgICAgbWF4V2FpdCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHRpbWVySWQsXG4gICAgICBsYXN0Q2FsbFRpbWUsXG4gICAgICBsYXN0SW52b2tlVGltZSA9IDAsXG4gICAgICBsZWFkaW5nID0gZmFsc2UsXG4gICAgICBtYXhpbmcgPSBmYWxzZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICB3YWl0ID0gdG9OdW1iZXIod2FpdCkgfHwgMDtcbiAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICEhb3B0aW9ucy5sZWFkaW5nO1xuICAgIG1heGluZyA9ICdtYXhXYWl0JyBpbiBvcHRpb25zO1xuICAgIG1heFdhaXQgPSBtYXhpbmcgPyBuYXRpdmVNYXgodG9OdW1iZXIob3B0aW9ucy5tYXhXYWl0KSB8fCAwLCB3YWl0KSA6IG1heFdhaXQ7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZUZ1bmModGltZSkge1xuICAgIHZhciBhcmdzID0gbGFzdEFyZ3MsXG4gICAgICAgIHRoaXNBcmcgPSBsYXN0VGhpcztcblxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxlYWRpbmdFZGdlKHRpbWUpIHtcbiAgICAvLyBSZXNldCBhbnkgYG1heFdhaXRgIHRpbWVyLlxuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICAvLyBTdGFydCB0aGUgdGltZXIgZm9yIHRoZSB0cmFpbGluZyBlZGdlLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgLy8gSW52b2tlIHRoZSBsZWFkaW5nIGVkZ2UuXG4gICAgcmV0dXJuIGxlYWRpbmcgPyBpbnZva2VGdW5jKHRpbWUpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtYWluaW5nV2FpdCh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZSxcbiAgICAgICAgcmVzdWx0ID0gd2FpdCAtIHRpbWVTaW5jZUxhc3RDYWxsO1xuXG4gICAgcmV0dXJuIG1heGluZyA/IG5hdGl2ZU1pbihyZXN1bHQsIG1heFdhaXQgLSB0aW1lU2luY2VMYXN0SW52b2tlKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3VsZEludm9rZSh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZTtcblxuICAgIC8vIEVpdGhlciB0aGlzIGlzIHRoZSBmaXJzdCBjYWxsLCBhY3Rpdml0eSBoYXMgc3RvcHBlZCBhbmQgd2UncmUgYXQgdGhlXG4gICAgLy8gdHJhaWxpbmcgZWRnZSwgdGhlIHN5c3RlbSB0aW1lIGhhcyBnb25lIGJhY2t3YXJkcyBhbmQgd2UncmUgdHJlYXRpbmdcbiAgICAvLyBpdCBhcyB0aGUgdHJhaWxpbmcgZWRnZSwgb3Igd2UndmUgaGl0IHRoZSBgbWF4V2FpdGAgbGltaXQuXG4gICAgcmV0dXJuIChsYXN0Q2FsbFRpbWUgPT09IHVuZGVmaW5lZCB8fCAodGltZVNpbmNlTGFzdENhbGwgPj0gd2FpdCkgfHxcbiAgICAgICh0aW1lU2luY2VMYXN0Q2FsbCA8IDApIHx8IChtYXhpbmcgJiYgdGltZVNpbmNlTGFzdEludm9rZSA+PSBtYXhXYWl0KSk7XG4gIH1cblxuICBmdW5jdGlvbiB0aW1lckV4cGlyZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKTtcbiAgICBpZiAoc2hvdWxkSW52b2tlKHRpbWUpKSB7XG4gICAgICByZXR1cm4gdHJhaWxpbmdFZGdlKHRpbWUpO1xuICAgIH1cbiAgICAvLyBSZXN0YXJ0IHRoZSB0aW1lci5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHJlbWFpbmluZ1dhaXQodGltZSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhaWxpbmdFZGdlKHRpbWUpIHtcbiAgICB0aW1lcklkID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gT25seSBpbnZva2UgaWYgd2UgaGF2ZSBgbGFzdEFyZ3NgIHdoaWNoIG1lYW5zIGBmdW5jYCBoYXMgYmVlblxuICAgIC8vIGRlYm91bmNlZCBhdCBsZWFzdCBvbmNlLlxuICAgIGlmICh0cmFpbGluZyAmJiBsYXN0QXJncykge1xuICAgICAgcmV0dXJuIGludm9rZUZ1bmModGltZSk7XG4gICAgfVxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICBpZiAodGltZXJJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXJJZCk7XG4gICAgfVxuICAgIGxhc3RJbnZva2VUaW1lID0gMDtcbiAgICBsYXN0QXJncyA9IGxhc3RDYWxsVGltZSA9IGxhc3RUaGlzID0gdGltZXJJZCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIHJldHVybiB0aW1lcklkID09PSB1bmRlZmluZWQgPyByZXN1bHQgOiB0cmFpbGluZ0VkZ2Uobm93KCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVib3VuY2VkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCksXG4gICAgICAgIGlzSW52b2tpbmcgPSBzaG91bGRJbnZva2UodGltZSk7XG5cbiAgICBsYXN0QXJncyA9IGFyZ3VtZW50cztcbiAgICBsYXN0VGhpcyA9IHRoaXM7XG4gICAgbGFzdENhbGxUaW1lID0gdGltZTtcblxuICAgIGlmIChpc0ludm9raW5nKSB7XG4gICAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBsZWFkaW5nRWRnZShsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgICAgaWYgKG1heGluZykge1xuICAgICAgICAvLyBIYW5kbGUgaW52b2NhdGlvbnMgaW4gYSB0aWdodCBsb29wLlxuICAgICAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgICAgICByZXR1cm4gaW52b2tlRnVuYyhsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGRlYm91bmNlZC5jYW5jZWwgPSBjYW5jZWw7XG4gIGRlYm91bmNlZC5mbHVzaCA9IGZsdXNoO1xuICByZXR1cm4gZGVib3VuY2VkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGFycmF5LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheTtcbiIsInZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnLi9pc0Z1bmN0aW9uJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZS4gQSB2YWx1ZSBpcyBjb25zaWRlcmVkIGFycmF5LWxpa2UgaWYgaXQnc1xuICogbm90IGEgZnVuY3Rpb24gYW5kIGhhcyBhIGB2YWx1ZS5sZW5ndGhgIHRoYXQncyBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiBvclxuICogZXF1YWwgdG8gYDBgIGFuZCBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYE51bWJlci5NQVhfU0FGRV9JTlRFR0VSYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoJ2FiYycpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgIWlzRnVuY3Rpb24odmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXlMaWtlO1xuIiwidmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyksXG4gICAgaXNQbGFpbk9iamVjdCA9IHJlcXVpcmUoJy4vaXNQbGFpbk9iamVjdCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGxpa2VseSBhIERPTSBlbGVtZW50LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgRE9NIGVsZW1lbnQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0VsZW1lbnQoZG9jdW1lbnQuYm9keSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0VsZW1lbnQoJzxib2R5PicpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNFbGVtZW50KHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIHZhbHVlLm5vZGVUeXBlID09PSAxICYmICFpc1BsYWluT2JqZWN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0VsZW1lbnQ7XG4iLCJ2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUlzRmluaXRlID0gcm9vdC5pc0Zpbml0ZTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGZpbml0ZSBwcmltaXRpdmUgbnVtYmVyLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBiYXNlZCBvblxuICogW2BOdW1iZXIuaXNGaW5pdGVgXShodHRwczovL21kbi5pby9OdW1iZXIvaXNGaW5pdGUpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgZmluaXRlIG51bWJlciwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRmluaXRlKDMpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGaW5pdGUoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Zpbml0ZShJbmZpbml0eSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNGaW5pdGUoJzMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRmluaXRlKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgbmF0aXZlSXNGaW5pdGUodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRmluaXRlO1xuIiwidmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0Jyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhc3luY1RhZyA9ICdbb2JqZWN0IEFzeW5jRnVuY3Rpb25dJyxcbiAgICBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nLFxuICAgIHByb3h5VGFnID0gJ1tvYmplY3QgUHJveHldJztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Z1bmN0aW9uKC9hYmMvKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKCFpc09iamVjdCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gIC8vIGluIFNhZmFyaSA5IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5cyBhbmQgb3RoZXIgY29uc3RydWN0b3JzLlxuICB2YXIgdGFnID0gYmFzZUdldFRhZyh2YWx1ZSk7XG4gIHJldHVybiB0YWcgPT0gZnVuY1RhZyB8fCB0YWcgPT0gZ2VuVGFnIHx8IHRhZyA9PSBhc3luY1RhZyB8fCB0YWcgPT0gcHJveHlUYWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiIsIi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGlzIGxvb3NlbHkgYmFzZWQgb25cbiAqIFtgVG9MZW5ndGhgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy10b2xlbmd0aCkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBsZW5ndGgsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0xlbmd0aCgzKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzTGVuZ3RoKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzTGVuZ3RoKEluZmluaXR5KTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0xlbmd0aCgnMycpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNMZW5ndGgodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJlxuICAgIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPD0gTUFYX1NBRkVfSU5URUdFUjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0xlbmd0aDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG51bGxpc2gsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc05pbChudWxsKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzTmlsKHZvaWQgMCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc05pbChOYU4pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNOaWwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09IG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNOaWw7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZVxuICogW2xhbmd1YWdlIHR5cGVdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzKVxuICogb2YgYE9iamVjdGAuIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0TGlrZTtcbiIsInZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgIGdldFByb3RvdHlwZSA9IHJlcXVpcmUoJy4vX2dldFByb3RvdHlwZScpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZSxcbiAgICBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbnZhciBmdW5jVG9TdHJpbmcgPSBmdW5jUHJvdG8udG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKiBVc2VkIHRvIGluZmVyIHRoZSBgT2JqZWN0YCBjb25zdHJ1Y3Rvci4gKi9cbnZhciBvYmplY3RDdG9yU3RyaW5nID0gZnVuY1RvU3RyaW5nLmNhbGwoT2JqZWN0KTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgdGhhdCBpcywgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlXG4gKiBgT2JqZWN0YCBjb25zdHJ1Y3RvciBvciBvbmUgd2l0aCBhIGBbW1Byb3RvdHlwZV1dYCBvZiBgbnVsbGAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjguMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogfVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChuZXcgRm9vKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdCh7ICd4JzogMCwgJ3knOiAwIH0pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChPYmplY3QuY3JlYXRlKG51bGwpKTtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0TGlrZSh2YWx1ZSkgfHwgYmFzZUdldFRhZyh2YWx1ZSkgIT0gb2JqZWN0VGFnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBwcm90byA9IGdldFByb3RvdHlwZSh2YWx1ZSk7XG4gIGlmIChwcm90byA9PT0gbnVsbCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHZhciBDdG9yID0gaGFzT3duUHJvcGVydHkuY2FsbChwcm90bywgJ2NvbnN0cnVjdG9yJykgJiYgcHJvdG8uY29uc3RydWN0b3I7XG4gIHJldHVybiB0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmIEN0b3IgaW5zdGFuY2VvZiBDdG9yICYmXG4gICAgZnVuY1RvU3RyaW5nLmNhbGwoQ3RvcikgPT0gb2JqZWN0Q3RvclN0cmluZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1BsYWluT2JqZWN0O1xuIiwidmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3ltYm9sLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBiYXNlR2V0VGFnKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzU3ltYm9sO1xuIiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qKlxuICogR2V0cyB0aGUgdGltZXN0YW1wIG9mIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlXG4gKiB0aGUgVW5peCBlcG9jaCAoMSBKYW51YXJ5IDE5NzAgMDA6MDA6MDAgVVRDKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDIuNC4wXG4gKiBAY2F0ZWdvcnkgRGF0ZVxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgdGltZXN0YW1wLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmRlZmVyKGZ1bmN0aW9uKHN0YW1wKSB7XG4gKiAgIGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7XG4gKiB9LCBfLm5vdygpKTtcbiAqIC8vID0+IExvZ3MgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaXQgdG9vayBmb3IgdGhlIGRlZmVycmVkIGludm9jYXRpb24uXG4gKi9cbnZhciBub3cgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHJvb3QuRGF0ZS5ub3coKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbm93O1xuIiwidmFyIGNyZWF0ZVJvdW5kID0gcmVxdWlyZSgnLi9fY3JlYXRlUm91bmQnKTtcblxuLyoqXG4gKiBDb21wdXRlcyBgbnVtYmVyYCByb3VuZGVkIHRvIGBwcmVjaXNpb25gLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMy4xMC4wXG4gKiBAY2F0ZWdvcnkgTWF0aFxuICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciBUaGUgbnVtYmVyIHRvIHJvdW5kLlxuICogQHBhcmFtIHtudW1iZXJ9IFtwcmVjaXNpb249MF0gVGhlIHByZWNpc2lvbiB0byByb3VuZCB0by5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHJvdW5kZWQgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnJvdW5kKDQuMDA2KTtcbiAqIC8vID0+IDRcbiAqXG4gKiBfLnJvdW5kKDQuMDA2LCAyKTtcbiAqIC8vID0+IDQuMDFcbiAqXG4gKiBfLnJvdW5kKDQwNjAsIC0yKTtcbiAqIC8vID0+IDQxMDBcbiAqL1xudmFyIHJvdW5kID0gY3JlYXRlUm91bmQoJ3JvdW5kJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gcm91bmQ7XG4iLCJ2YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0Jyk7XG5cbi8qKiBFcnJvciBtZXNzYWdlIGNvbnN0YW50cy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHRocm90dGxlZCBmdW5jdGlvbiB0aGF0IG9ubHkgaW52b2tlcyBgZnVuY2AgYXQgbW9zdCBvbmNlIHBlclxuICogZXZlcnkgYHdhaXRgIG1pbGxpc2Vjb25kcy4gVGhlIHRocm90dGxlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGBcbiAqIG1ldGhvZCB0byBjYW5jZWwgZGVsYXllZCBgZnVuY2AgaW52b2NhdGlvbnMgYW5kIGEgYGZsdXNoYCBtZXRob2QgdG9cbiAqIGltbWVkaWF0ZWx5IGludm9rZSB0aGVtLiBQcm92aWRlIGBvcHRpb25zYCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBmdW5jYFxuICogc2hvdWxkIGJlIGludm9rZWQgb24gdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YFxuICogdGltZW91dC4gVGhlIGBmdW5jYCBpcyBpbnZva2VkIHdpdGggdGhlIGxhc3QgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZVxuICogdGhyb3R0bGVkIGZ1bmN0aW9uLiBTdWJzZXF1ZW50IGNhbGxzIHRvIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gcmV0dXJuIHRoZVxuICogcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXNcbiAqIGludm9rZWQgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uXG4gKiBpcyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogSWYgYHdhaXRgIGlzIGAwYCBhbmQgYGxlYWRpbmdgIGlzIGBmYWxzZWAsIGBmdW5jYCBpbnZvY2F0aW9uIGlzIGRlZmVycmVkXG4gKiB1bnRpbCB0byB0aGUgbmV4dCB0aWNrLCBzaW1pbGFyIHRvIGBzZXRUaW1lb3V0YCB3aXRoIGEgdGltZW91dCBvZiBgMGAuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZGVib3VuY2luZy10aHJvdHRsaW5nLWV4cGxhaW5lZC1leGFtcGxlcy8pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLnRocm90dGxlYCBhbmQgYF8uZGVib3VuY2VgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gdGhyb3R0bGUuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgaW52b2NhdGlvbnMgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgdGhyb3R0bGVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCBleGNlc3NpdmVseSB1cGRhdGluZyB0aGUgcG9zaXRpb24gd2hpbGUgc2Nyb2xsaW5nLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Njcm9sbCcsIF8udGhyb3R0bGUodXBkYXRlUG9zaXRpb24sIDEwMCkpO1xuICpcbiAqIC8vIEludm9rZSBgcmVuZXdUb2tlbmAgd2hlbiB0aGUgY2xpY2sgZXZlbnQgaXMgZmlyZWQsIGJ1dCBub3QgbW9yZSB0aGFuIG9uY2UgZXZlcnkgNSBtaW51dGVzLlxuICogdmFyIHRocm90dGxlZCA9IF8udGhyb3R0bGUocmVuZXdUb2tlbiwgMzAwMDAwLCB7ICd0cmFpbGluZyc6IGZhbHNlIH0pO1xuICogalF1ZXJ5KGVsZW1lbnQpLm9uKCdjbGljaycsIHRocm90dGxlZCk7XG4gKlxuICogLy8gQ2FuY2VsIHRoZSB0cmFpbGluZyB0aHJvdHRsZWQgaW52b2NhdGlvbi5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIHRocm90dGxlZC5jYW5jZWwpO1xuICovXG5mdW5jdGlvbiB0aHJvdHRsZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsZWFkaW5nID0gdHJ1ZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gJ2xlYWRpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMubGVhZGluZyA6IGxlYWRpbmc7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuICByZXR1cm4gZGVib3VuY2UoZnVuYywgd2FpdCwge1xuICAgICdsZWFkaW5nJzogbGVhZGluZyxcbiAgICAnbWF4V2FpdCc6IHdhaXQsXG4gICAgJ3RyYWlsaW5nJzogdHJhaWxpbmdcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGhyb3R0bGU7XG4iLCJ2YXIgdG9OdW1iZXIgPSByZXF1aXJlKCcuL3RvTnVtYmVyJyk7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDAsXG4gICAgTUFYX0lOVEVHRVIgPSAxLjc5NzY5MzEzNDg2MjMxNTdlKzMwODtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgZmluaXRlIG51bWJlci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMTIuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvRmluaXRlKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvRmluaXRlKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b0Zpbml0ZShJbmZpbml0eSk7XG4gKiAvLyA9PiAxLjc5NzY5MzEzNDg2MjMxNTdlKzMwOFxuICpcbiAqIF8udG9GaW5pdGUoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvRmluaXRlKHZhbHVlKSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6IDA7XG4gIH1cbiAgdmFsdWUgPSB0b051bWJlcih2YWx1ZSk7XG4gIGlmICh2YWx1ZSA9PT0gSU5GSU5JVFkgfHwgdmFsdWUgPT09IC1JTkZJTklUWSkge1xuICAgIHZhciBzaWduID0gKHZhbHVlIDwgMCA/IC0xIDogMSk7XG4gICAgcmV0dXJuIHNpZ24gKiBNQVhfSU5URUdFUjtcbiAgfVxuICByZXR1cm4gdmFsdWUgPT09IHZhbHVlID8gdmFsdWUgOiAwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvRmluaXRlO1xuIiwidmFyIHRvRmluaXRlID0gcmVxdWlyZSgnLi90b0Zpbml0ZScpO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYW4gaW50ZWdlci5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgbG9vc2VseSBiYXNlZCBvblxuICogW2BUb0ludGVnZXJgXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtdG9pbnRlZ2VyKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBpbnRlZ2VyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvSW50ZWdlcigzLjIpO1xuICogLy8gPT4gM1xuICpcbiAqIF8udG9JbnRlZ2VyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gMFxuICpcbiAqIF8udG9JbnRlZ2VyKEluZmluaXR5KTtcbiAqIC8vID0+IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4XG4gKlxuICogXy50b0ludGVnZXIoJzMuMicpO1xuICogLy8gPT4gM1xuICovXG5mdW5jdGlvbiB0b0ludGVnZXIodmFsdWUpIHtcbiAgdmFyIHJlc3VsdCA9IHRvRmluaXRlKHZhbHVlKSxcbiAgICAgIHJlbWFpbmRlciA9IHJlc3VsdCAlIDE7XG5cbiAgcmV0dXJuIHJlc3VsdCA9PT0gcmVzdWx0ID8gKHJlbWFpbmRlciA/IHJlc3VsdCAtIHJlbWFpbmRlciA6IHJlc3VsdCkgOiAwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvSW50ZWdlcjtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTkFOID0gMCAvIDA7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBOQU47XG4gIH1cbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IHR5cGVvZiB2YWx1ZS52YWx1ZU9mID09ICdmdW5jdGlvbicgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UocmVUcmltLCAnJyk7XG4gIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gIHJldHVybiAoaXNCaW5hcnkgfHwgcmVJc09jdGFsLnRlc3QodmFsdWUpKVxuICAgID8gZnJlZVBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCBpc0JpbmFyeSA/IDIgOiA4KVxuICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvTnVtYmVyO1xuIiwidmFyIGJhc2VUb1N0cmluZyA9IHJlcXVpcmUoJy4vX2Jhc2VUb1N0cmluZycpO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcuIEFuIGVtcHR5IHN0cmluZyBpcyByZXR1cm5lZCBmb3IgYG51bGxgXG4gKiBhbmQgYHVuZGVmaW5lZGAgdmFsdWVzLiBUaGUgc2lnbiBvZiBgLTBgIGlzIHByZXNlcnZlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBzdHJpbmcuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9TdHJpbmcobnVsbCk7XG4gKiAvLyA9PiAnJ1xuICpcbiAqIF8udG9TdHJpbmcoLTApO1xuICogLy8gPT4gJy0wJ1xuICpcbiAqIF8udG9TdHJpbmcoWzEsIDIsIDNdKTtcbiAqIC8vID0+ICcxLDIsMydcbiAqL1xuZnVuY3Rpb24gdG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IGJhc2VUb1N0cmluZyh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9TdHJpbmc7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBpc0VsZW1lbnQgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNFbGVtZW50JztcbmltcG9ydCBpc0Zpbml0ZSAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNGaW5pdGUnO1xuaW1wb3J0IGlzRnVuY3Rpb24gICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Z1bmN0aW9uJztcbmltcG9ydCBpc05pbCAgICAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNOaWwnO1xuaW1wb3J0IGlzT2JqZWN0ICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc09iamVjdCc7XG5pbXBvcnQgeyB6b29tRGlyZWN0aW9uIH0gICAgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IF9NYXRoICAgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRoJztcbmltcG9ydCBNYXRyaXgyICAgICAgICAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgeyBUeXBlIH0gICAgICAgICAgICAgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IFV0aWxzICAgICAgICAgICAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuY29uc3QgYW5pbWF0aW9uID0ge1xuICAgIHR5cGU6IHtcbiAgICAgICAgQ09SRTogMVxuICAgIH1cbn07XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5BbmltYXRpb25cbiogQGNvbnN0cnVjdG9yXG4qIEBleHRlbmRzIGV4dGVybmFsOlRpbWVsaW5lTWF4XG4qIEBwYXJhbSB7Q2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRvIGJlIGFuaW1hdGVkLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmRlc3Ryb3lPbkNvbXBsZXRlXSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15QW5pbWF0aW9uID0gbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSwgeyBcbiogICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZVxuKiB9KS56b29tVG8oMiwgMSkuc2hha2UoMC4xLCAyKS5wbGF5KCk7XG4qL1xuY2xhc3MgQW5pbWF0aW9uIGV4dGVuZHMgVGltZWxpbmVNYXgge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF1c2VkOiB0cnVlXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgc3VwZXIoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucztcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB0eXBlIG9mIHRoaXMgb2JqZWN0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSBUeXBlLkFOSU1BVElPTjtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Q2FtZXJhfSAtIFRoZSBjYW1lcmEgb24gd2hpY2ggdGhlIGFuaW1hdGlvbiB3aWxsIGJlIGFwcGxpZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhIHx8IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2FycmF5fSAtIFRoZSBjb3JlIHR3ZWVucyBvZiB0aGlzIGFuaW1hdGlvbiBpbiBvcmRlciBvZiBleGVjdXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29yZVR3ZWVucyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUaW1lbGluZUxpdGV9IC0gVGhlIGN1cnJlbnQgYWN0aXZlIHN1Yi1hbmltYXRpb24gY29uc2lzdGluZyBvZiB0aGUgY29yZSBjYW1lcmEgYW5pbWF0aW9uIGFuZCBlZmZlY3QgYW5pbWF0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZXN0cm95T25Db21wbGV0ZSA9IG9wdGlvbnMuZGVzdHJveU9uQ29tcGxldGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY2FtZXJhIHZhbHVlcyBvZiB0aGUgcHJldmlvdXMgc3ViLWFuaW1hdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBzdGFydGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25TdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRDb3JlVHdlZW4odGhpcy5jb3JlVHdlZW5zWzBdKTtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVEcmFnKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVXaGVlbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25TdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25TdGFydC5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vblN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBvbmNlIGRldiBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBzdGFydGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIHVwZGF0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vblVwZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25VcGRhdGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25VcGRhdGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmVuYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vbkNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5vbkNvbXBsZXRlLmFwcGx5KHRoaXMsIHRoaXMuY29uZmlnLm9uQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5kZXN0cm95T25Db21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIG9uY2UgZGV2IGlzIGNvbXBsZXRlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGNvbXBsZXRlZCcpO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvblN0YXJ0JywgdGhpcy5fb25TdGFydCk7XG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25VcGRhdGUnLCB0aGlzLl9vblVwZGF0ZSk7XG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25Db21wbGV0ZScsIHRoaXMuX29uQ29tcGxldGUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGhlIHByb3BlcnRpZXMgdG8gYW5pbWF0ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfYW5pbWF0ZSAocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgdmFyIG1haW5UaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoe1xuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IG9wdGlvbnMub25TdGFydCxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogb3B0aW9ucy5vblVwZGF0ZSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBvcHRpb25zLm9uQ29tcGxldGUsXG4gICAgICAgICAgICAgICAgb25SZXZlcnNlQ29tcGxldGU6IG9wdGlvbnMub25SZXZlcnNlQ29tcGxldGVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgb25TdGFydFBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBzZWxmO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25TdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGF0YS5vblN0YXJ0LmFwcGx5KHRoaXMsIHNlbGYuZGF0YS5vblN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25VcGRhdGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLm9uVXBkYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uVXBkYXRlLmFwcGx5KHRoaXMsIHNlbGYuZGF0YS5vblVwZGF0ZVBhcmFtcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25Db21wbGV0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGF0YS5vbkNvbXBsZXRlLmFwcGx5KHRoaXMsIHNlbGYuZGF0YS5vbkNvbXBsZXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25SZXZlcnNlQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLm9uUmV2ZXJzZUNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uUmV2ZXJzZUNvbXBsZXRlLmFwcGx5KHRoaXMsIHNlbGYuZGF0YS5vblJldmVyc2VDb21wbGV0ZVBhcmFtcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHNoYWtlVGltZWxpbmUgPSBudWxsO1xuICAgICAgICB2YXIgc2hha2UgPSB0aGlzLl9wYXJzZVNoYWtlKHByb3BzLnNoYWtlKTtcbiAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uU3RhcnQ7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uVXBkYXRlO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5vbkNvbXBsZXRlO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZTtcbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIGNvcmUgY2FtZXJhIHByb3BlcnRpZXNcbiAgICAgICAgaWYgKHByb3BzLm9yaWdpbiB8fCBwcm9wcy5wb3NpdGlvbiB8fCBwcm9wcy5yb3RhdGlvbiB8fCBwcm9wcy56b29tKSB7XG4gICAgICAgICAgICB2YXIgY29yZVR3ZWVuID0gVHdlZW5NYXgudG8odGhpcy5jYW1lcmEsIGR1cmF0aW9uICE9PSAwID8gZHVyYXRpb24gOiAwLjAxNiwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIHJhd09mZnNldFg6IDAsXG4gICAgICAgICAgICAgICAgcmF3T2Zmc2V0WTogMCxcbiAgICAgICAgICAgICAgICByb3RhdGlvbjogMCxcbiAgICAgICAgICAgICAgICB6b29tOiAwLFxuICAgICAgICAgICAgICAgIGltbWVkaWF0ZVJlbmRlcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogdGhpcyxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB6RGlyZWN0aW9uID0gem9vbURpcmVjdGlvbi5OT05FO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYucHJvcHMudG8uem9vbSA+IHRoaXMuY2FtZXJhLnpvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLklOO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlbGYucHJvcHMudG8uem9vbSA8IHRoaXMuY2FtZXJhLnpvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLk9VVDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuem9vbURpcmVjdGlvbiA9IHpEaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBPcmlnaW4gbXVzdCBiZSBzZXQgaW4gY2FzZSBhbmltYXRpb24gd2FzIHJldmVyc2VkIChvcmlnaW4gd2FzIHJldmVydGVkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRUcmFuc2Zvcm1PcmlnaW4oc2VsZi5wcm9wcy5lbmQub3JpZ2luKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aW1lbGluZS5jb3JlID0gc2VsZjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb3JlIHR3ZWVuIHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3R3ZWVuIHZhcnM6ICcsIHNlbGYudmFycyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0d2VlbiBwcm9wczogJywgc2VsZi5wcm9wcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zaXRpb24gaXMgbWFudWFsbHkgbWFpbnRhaW5lZCBzbyBhbmltYXRpb25zIGNhbiBzbW9vdGhseSBjb250aW51ZSB3aGVuIGNhbWVyYSBpcyByZXNpemVkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFJhd1Bvc2l0aW9uKHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbih0aGlzLmNhbWVyYS5yYXdPZmZzZXQsIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1hdGlvbikpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0Q29yZVR3ZWVuKHRoaXMuY29yZVR3ZWVuc1tzZWxmLmluZGV4ICsgMV0sIHNlbGYucHJvcHMuZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb3JlIHR3ZWVuIGNvbXBsZXRlZCcpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25SZXZlcnNlQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25SZXZlcnNlQ29tcGxldGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbihzZWxmLnByb3BzLnN0YXJ0Lm9yaWdpbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb3JlVHdlZW4udHlwZSA9IGFuaW1hdGlvbi50eXBlLkNPUkU7XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgc291cmNlOiB7fSxcbiAgICAgICAgICAgICAgICBwYXJzZWQ6IHt9LFxuICAgICAgICAgICAgICAgIHRvOiB7fSxcbiAgICAgICAgICAgICAgICBzdGFydDoge30sXG4gICAgICAgICAgICAgICAgZW5kOiB7fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uub3JpZ2luID0gcHJvcHMub3JpZ2luO1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzLnNvdXJjZS5wb3NpdGlvbiA9IHByb3BzLnBvc2l0aW9uO1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzLnNvdXJjZS5yb3RhdGlvbiA9IHByb3BzLnJvdGF0aW9uO1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzLnNvdXJjZS56b29tID0gcHJvcHMuem9vbTtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5pbmRleCA9IHRoaXMuY29yZVR3ZWVucy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLmNvcmVUd2VlbnMucHVzaChjb3JlVHdlZW4pO1xuICAgICAgICAgICAgbWFpblRpbWVsaW5lLmFkZChjb3JlVHdlZW4sIDApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBUd2VlbiBzaGFrZSBlZmZlY3RcbiAgICAgICAgaWYgKGR1cmF0aW9uID4gMCAmJiBzaGFrZSAmJiBzaGFrZS5pbnRlbnNpdHkgPiAwKSB7XG4gICAgICAgICAgICBzaGFrZVRpbWVsaW5lID0gbmV3IFRpbWVsaW5lTGl0ZShPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogc2hha2UuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICBlbmZvcmNlQm91bmRzOiAoc2hha2UuZW5mb3JjZUJvdW5kcyA9PT0gZmFsc2UpID8gZmFsc2UgOiB0cnVlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aW1lbGluZS5zaGFrZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzRmluYWxGcmFtZSA9IHNlbGYudGltZSgpID09PSBzZWxmLmR1cmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXRYID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldFkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSB0aGlzLmNhbWVyYS5yYXdQb3NpdGlvbi5jbG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uSE9SSVpPTlRBTCB8fCBzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGaW5hbEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WCA9IE1hdGgucmFuZG9tKCkgKiBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEud2lkdGggKiAyIC0gc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnggKz0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLlZFUlRJQ0FMIHx8IHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZpbmFsRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRZID0gTWF0aC5yYW5kb20oKSAqIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS5oZWlnaHQgKiAyIC0gc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi55ICs9IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFBvc2l0aW9uKHBvc2l0aW9uLCBzZWxmLmRhdGEuZW5mb3JjZUJvdW5kcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlUGFyYW1zOiBbJ3tzZWxmfSddXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEVhc2UgaW4vb3V0XG4gICAgICAgICAgICBpZiAoc2hha2UuZWFzZUluICYmIHNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uICogMC41LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VJbiB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcblxuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUudG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiAqIDAuNSwgeyBcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlT3V0IHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIGR1cmF0aW9uICogMC41KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2UgaW4gb3IgZWFzZVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hha2UuZWFzZUluICYmICFzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlSW4gfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlIG91dFxuICAgICAgICAgICAgZWxzZSBpZiAoIXNoYWtlLmVhc2VJbiAmJiBzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eVxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlT3V0IHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZVxuICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5lYXNlKSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBvcHRpb25zLmVhc2UgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBObyBlYXNlXG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmRhdGEuaW50ZW5zaXR5ID0gc2hha2UuaW50ZW5zaXR5O1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUudG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge30sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBtYWluVGltZWxpbmUuYWRkKHNoYWtlVGltZWxpbmUsIDApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFkZChtYWluVGltZWxpbmUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2FsY3VsYXRlcyB0aGUgXCJ0b1wiIHByb3BlcnR5IHZhbHVlcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R8VmVjdG9yMn0gc291cmNlT3JpZ2luIC0gVGhlIHNvdXJjZSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge09iamVjdHxWZWN0b3IyfSBzb3VyY2VQb3NpdGlvbiAtIFRoZSBzb3VyY2UgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc291cmNlUm90YXRpb24gLSBUaGUgc291cmNlIHJvdGF0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHNvdXJjZVpvb20gLSBUaGUgc291cmNlIHpvb20uXG4gICAgKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYS5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIGVuZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2NhbGN1bGF0ZVRvUHJvcHMgKHBhcnNlZCwgc3RhcnQpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IHtcbiAgICAgICAgICAgIG9yaWdpbjogKHBhcnNlZC5vcmlnaW4gIT09IG51bGwpID8gcGFyc2VkLm9yaWdpbiA6IHt9LFxuICAgICAgICAgICAgcG9zaXRpb246IChwYXJzZWQucG9zaXRpb24gIT09IG51bGwpID8gcGFyc2VkLnBvc2l0aW9uIDoge30sXG4gICAgICAgICAgICByb3RhdGlvbjogcGFyc2VkLnJvdGF0aW9uLFxuICAgICAgICAgICAgem9vbTogcGFyc2VkLnpvb21cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIGlzQW5jaG9yZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gQ2hhbmdpbmcgdG8gc2FtZSBvcmlnaW4gaXMgbmVjZXNzYXJ5IGZvciB3aGVlbCB6b29tXG4gICAgICAgIHZhciBpc09yaWdpblhDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uub3JpZ2luLngpO1xuICAgICAgICB2YXIgaXNPcmlnaW5ZQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLm9yaWdpbi55KTtcbiAgICAgICAgdmFyIGlzT3JpZ2luQ2hhbmdpbmcgPSBpc09yaWdpblhDaGFuZ2luZyB8fCBpc09yaWdpbllDaGFuZ2luZztcbiAgICAgICAgLy8gQ2hhbmdpbmcgdG8gc2FtZSBwb3NpdGlvbiBpcyBuZWNlc3NhcnkgZm9yIGNhbWVyYSByZXNpemVcbiAgICAgICAgdmFyIGlzUG9zaXRpb25YQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnBvc2l0aW9uLngpO1xuICAgICAgICB2YXIgaXNQb3NpdGlvbllDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2UucG9zaXRpb24ueSk7XG4gICAgICAgIHZhciBpc1Bvc2l0aW9uQ2hhbmdpbmcgPSBpc1Bvc2l0aW9uWENoYW5naW5nIHx8IGlzUG9zaXRpb25ZQ2hhbmdpbmc7XG4gICAgICAgIHZhciBpc09mZnNldENoYW5naW5nID0gaXNQb3NpdGlvbkNoYW5naW5nO1xuICAgICAgICB2YXIgaXNSb3RhdGlvbkNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5yb3RhdGlvbikgJiYgc291cmNlLnJvdGF0aW9uICE9PSBzdGFydC5yb3RhdGlvbjtcbiAgICAgICAgdmFyIGlzWm9vbUNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS56b29tKSAmJiBzb3VyY2Uuem9vbSAhPT0gc3RhcnQuem9vbTtcblxuICAgICAgICB2YXIgc3RhcnRUcmFuc2Zvcm1hdGlvbiA9IG5ldyBNYXRyaXgyKCkuc2NhbGUoc3RhcnQuem9vbSwgc3RhcnQuem9vbSkucm90YXRlKF9NYXRoLmRlZ1RvUmFkKC1zdGFydC5yb3RhdGlvbikpO1xuICAgICAgICB2YXIgZm92UG9zaXRpb24gPSB0aGlzLmNhbWVyYS5jZW50ZXI7XG4gICAgICAgIHZhciB0b09mZnNldDtcbiAgICAgICAgdmFyIHRvT3JpZ2luID0gbmV3IFZlY3RvcjIoaXNPcmlnaW5YQ2hhbmdpbmcgPyBzb3VyY2Uub3JpZ2luLnggOiBzdGFydC5vcmlnaW4ueCwgaXNPcmlnaW5ZQ2hhbmdpbmcgPyBzb3VyY2Uub3JpZ2luLnkgOiBzdGFydC5vcmlnaW4ueSk7XG4gICAgICAgIHZhciB0b1Bvc2l0aW9uID0gbmV3IFZlY3RvcjIoaXNQb3NpdGlvblhDaGFuZ2luZyA/IHNvdXJjZS5wb3NpdGlvbi54IDogc3RhcnQucG9zaXRpb24ueCwgaXNQb3NpdGlvbllDaGFuZ2luZyA/IHNvdXJjZS5wb3NpdGlvbi55IDogc3RhcnQucG9zaXRpb24ueSk7XG4gICAgICAgIHZhciB0b1JvdGF0aW9uID0gaXNSb3RhdGlvbkNoYW5naW5nID8gc291cmNlLnJvdGF0aW9uIDogc3RhcnQucm90YXRpb247XG4gICAgICAgIHZhciB0b1pvb20gPSBpc1pvb21DaGFuZ2luZyA/IHNvdXJjZS56b29tIDogc3RhcnQuem9vbTtcbiAgICAgICAgdmFyIHRvVHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHRvWm9vbSwgdG9ab29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXRvUm90YXRpb24pKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJvdGF0ZVRvLCB6b29tVG9cbiAgICAgICAgaWYgKCFpc09yaWdpbkNoYW5naW5nICYmICFpc1Bvc2l0aW9uQ2hhbmdpbmcpIHtcbiAgICAgICAgICAgIGlzQW5jaG9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgdG9PcmlnaW4uY29weShzdGFydC5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcm90YXRlQXQsIHpvb21BdFxuICAgICAgICBlbHNlIGlmIChpc09yaWdpbkNoYW5naW5nICYmICFpc1Bvc2l0aW9uQ2hhbmdpbmcpIHtcbiAgICAgICAgICAgIGlzQW5jaG9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgaXNQb3NpdGlvbkNoYW5naW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvdlBvc2l0aW9uID0gdGhpcy5jYW1lcmEuX2NvbnZlcnRTY2VuZVBvc2l0aW9uVG9GT1ZQb3NpdGlvbih0b09yaWdpbiwgc3RhcnQucG9zaXRpb24sIHRoaXMuY2FtZXJhLmNlbnRlciwgc3RhcnRUcmFuc2Zvcm1hdGlvbik7XG4gICAgICAgICAgICB0b1Bvc2l0aW9uID0gdGhpcy5jYW1lcmEuX2NvbnZlcnRTY2VuZVBvc2l0aW9uVG9DYW1lcmFQb3NpdGlvbih0b09yaWdpbiwgZm92UG9zaXRpb24sIHRoaXMuY2FtZXJhLmNlbnRlciwgdG9PcmlnaW4sIHRvVHJhbnNmb3JtYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0b09mZnNldCA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0UG9zaXRpb25Ub09mZnNldCh0b1Bvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRvT3JpZ2luLCB0b1RyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvZmZzZXRYOiBpc09mZnNldENoYW5naW5nID8gdG9PZmZzZXQueCA6IG51bGwsXG4gICAgICAgICAgICBvZmZzZXRZOiBpc09mZnNldENoYW5naW5nID8gdG9PZmZzZXQueSA6IG51bGwsXG4gICAgICAgICAgICBvcmlnaW46IGlzQW5jaG9yZWQgfHwgaXNPcmlnaW5DaGFuZ2luZyA/IHRvT3JpZ2luIDogbnVsbCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBpc1Bvc2l0aW9uQ2hhbmdpbmcgPyB0b1Bvc2l0aW9uIDogbnVsbCxcbiAgICAgICAgICAgIHJvdGF0aW9uOiBpc1JvdGF0aW9uQ2hhbmdpbmcgPyB0b1JvdGF0aW9uIDogbnVsbCxcbiAgICAgICAgICAgIHpvb206IGlzWm9vbUNoYW5naW5nID8gdG9ab29tIDogbnVsbFxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIHN0YXJ0aW5nIHByb3BlcnR5IHZhbHVlcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgc3RhcnRpbmcgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9nZXRTdGFydFByb3BzICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9yaWdpbjogdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLmNsb25lKCksXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5jYW1lcmEucG9zaXRpb24uY2xvbmUoKSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiB0aGlzLmNhbWVyYS5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206IHRoaXMuY2FtZXJhLnpvb21cbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBlbmRpbmcgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBlbmRpbmcgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9nZXRFbmRQcm9wcyAodG8sIHN0YXJ0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcmlnaW46ICh0by5vcmlnaW4gIT09IG51bGwpID8gdG8ub3JpZ2luIDogc3RhcnQub3JpZ2luLFxuICAgICAgICAgICAgcG9zaXRpb246ICh0by5wb3NpdGlvbiAhPT0gbnVsbCkgPyB0by5wb3NpdGlvbiA6IHN0YXJ0LnBvc2l0aW9uLFxuICAgICAgICAgICAgcm90YXRpb246ICh0by5yb3RhdGlvbiAhPT0gbnVsbCkgPyB0by5yb3RhdGlvbiA6IHN0YXJ0LnJvdGF0aW9uLFxuICAgICAgICAgICAgem9vbTogKHRvLnpvb20gIT09IG51bGwpID8gdG8uem9vbSA6IHN0YXJ0Lnpvb21cbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBJbml0aWFsaXplcyBhIGNvcmUgdHdlZW4uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VHdlZW5NYXh9IHR3ZWVuIC0gVGhlIHR3ZWVuLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIF9pbml0Q29yZVR3ZWVuICh0d2Vlbiwgc3RhcnRQcm9wcykge1xuICAgICAgICBpZiAodHdlZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc3RhcnRQcm9wcyA9IChzdGFydFByb3BzICE9PSB1bmRlZmluZWQpID8gc3RhcnRQcm9wcyA6IHRoaXMuX2dldFN0YXJ0UHJvcHMoKTtcblxuICAgICAgICAgICAgdmFyIHBhcnNlZFByb3BzID0gdGhpcy5fcGFyc2VQcm9wcyh0d2Vlbi5wcm9wcy5zb3VyY2Uub3JpZ2luLCB0d2Vlbi5wcm9wcy5zb3VyY2UucG9zaXRpb24sIHR3ZWVuLnByb3BzLnNvdXJjZS5yb3RhdGlvbiwgdHdlZW4ucHJvcHMuc291cmNlLnpvb20pO1xuICAgICAgICAgICAgdmFyIHRvUHJvcHMgPSB0aGlzLl9jYWxjdWxhdGVUb1Byb3BzKHBhcnNlZFByb3BzLCBzdGFydFByb3BzKTtcbiAgICAgICAgICAgIHZhciBlbmRQcm9wcyA9IHRoaXMuX2dldEVuZFByb3BzKHRvUHJvcHMsIHN0YXJ0UHJvcHMpO1xuXG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzUHJvcHMgPSBzdGFydFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMuc3RhcnQgPSBzdGFydFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMuZW5kID0gZW5kUHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5wYXJzZWQgPSBwYXJzZWRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLnRvID0gdG9Qcm9wcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gT3JpZ2luIG11c3QgYmUgdXBkYXRlZCBiZWZvcmUgdHdlZW4gc3RhcnRzXG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRUcmFuc2Zvcm1PcmlnaW4odG9Qcm9wcy5vcmlnaW4pO1xuICAgICAgICAgICAgdHdlZW4udmFycy5yYXdPZmZzZXRYID0gdG9Qcm9wcy5vZmZzZXRYO1xuICAgICAgICAgICAgdHdlZW4udmFycy5yYXdPZmZzZXRZID0gdG9Qcm9wcy5vZmZzZXRZO1xuICAgICAgICAgICAgdHdlZW4udmFycy5yb3RhdGlvbiA9IHRvUHJvcHMucm90YXRpb247XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnpvb20gPSB0b1Byb3BzLnpvb207XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhcnNlcyB0aGUgY29yZSBhbmltYXRpb24gcHJvcGVydGllcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R9IG9yaWdpbiAtIFRoZSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcG9zaXRpb24gLSBUaGUgb3JpZ2luLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHJvdGF0aW9uIC0gVGhlIHJvdGF0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBUaGUgem9vbS5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlUHJvcHMgKG9yaWdpbiwgcG9zaXRpb24sIHJvdGF0aW9uLCB6b29tKSB7XG4gICAgICAgIGlmIChwb3NpdGlvbiA9PT0gJ3ByZXZpb3VzJyAmJiB0aGlzLnByZXZpb3VzUHJvcHMucG9zaXRpb24pIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gdGhpcy5wcmV2aW91c1Byb3BzLnBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAocm90YXRpb24gPT09ICdwcmV2aW91cycgJiYgIWlzTmlsKHRoaXMucHJldmlvdXNQcm9wcy5yb3RhdGlvbikpIHtcbiAgICAgICAgICAgIHJvdGF0aW9uID0gdGhpcy5wcmV2aW91c1Byb3BzLnJvdGF0aW9uO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoem9vbSA9PT0gJ3ByZXZpb3VzJyAmJiAhaXNOaWwodGhpcy5wcmV2aW91c1Byb3BzLnpvb20pKSB7XG4gICAgICAgICAgICB6b29tID0gdGhpcy5wcmV2aW91c1Byb3BzLnpvb207XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgb3JpZ2luOiBVdGlscy5wYXJzZVBvc2l0aW9uKG9yaWdpbiwgdGhpcy5jYW1lcmEuc2NlbmUudmlldyksXG4gICAgICAgICAgICBwb3NpdGlvbjogVXRpbHMucGFyc2VQb3NpdGlvbihwb3NpdGlvbiwgdGhpcy5jYW1lcmEuc2NlbmUudmlldyksXG4gICAgICAgICAgICByb3RhdGlvbjogIWlzTmlsKHJvdGF0aW9uKSA/IHJvdGF0aW9uIDogbnVsbCxcbiAgICAgICAgICAgIHpvb206IHpvb20gfHwgbnVsbFxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhcnNlcyB0aGUgc2hha2UgcHJvcGVydGllcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R9IHNoYWtlIC0gVGhlIHNoYWtlIHByb3BlcnRpZXMuXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBwYXJzZWQgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9wYXJzZVNoYWtlIChzaGFrZSkge1xuICAgICAgICB2YXIgcGFyc2VkU2hha2UgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgaWYgKHNoYWtlKSB7XG4gICAgICAgICAgICBwYXJzZWRTaGFrZSA9IHtcbiAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IGlzTmlsKHNoYWtlLmludGVuc2l0eSkgPyAwIDogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogaXNOaWwoc2hha2UuZGlyZWN0aW9uKSA/IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USCA6IHNoYWtlLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICBlYXNlSW46IHNoYWtlLmVhc2VJbixcbiAgICAgICAgICAgICAgICBlYXNlT3V0OiBzaGFrZS5lYXNlT3V0LFxuICAgICAgICAgICAgICAgIGVuZm9yY2VCb3VuZHM6IHNoYWtlLmVuZm9yY2VCb3VuZHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBwYXJzZWRTaGFrZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTdG9wcyB0aGUgYW5pbWF0aW9uIGFuZCByZWxlYXNlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLmRlc3Ryb3koKTtcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBzdXBlci5raWxsKCk7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICB0aGlzLnByZXZpb3VzUHJvcHMgPSBudWxsO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUaGUgcHJvcGVydGllcyB0byBhbmltYXRlLlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IFtwcm9wcy5wb3NpdGlvbl0gLSBUaGUgbG9jYXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnBvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IFtwcm9wcy5vcmlnaW5dIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgem9vbSdzIG9yaWdpbi4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMub3JpZ2luLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtwcm9wcy5yb3RhdGlvbl0gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlXSAtIEFuIG9iamVjdCBvZiBzaGFrZSBlZmZlY3QgcHJvcGVydGllcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMuc2hha2UuaW50ZW5zaXR5XSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtPY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9ufSBbcHJvcHMuc2hha2UuZGlyZWN0aW9uPU9jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USF0gLSBBIHNoYWtlIGRpcmVjdGlvbi4gXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlLmVhc2VJbl0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy56b29tXSAtIEEgem9vbSB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe3Bvc2l0aW9uOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe3Bvc2l0aW9uOiB7eDogMjAwLCB5OiA1MH0sIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjogJyNib3gxMDAnLCB6b29tOiAyfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5hbmltYXRlKHtvcmlnaW46IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICovXG4gICAgYW5pbWF0ZSAocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHByb3BzLnBvc2l0aW9uLFxuICAgICAgICAgICAgb3JpZ2luOiBwcm9wcy5vcmlnaW4sXG4gICAgICAgICAgICByb3RhdGlvbjogcHJvcHMucm90YXRpb24sXG4gICAgICAgICAgICBzaGFrZTogcHJvcHMuc2hha2UsXG4gICAgICAgICAgICB6b29tOiBwcm9wcy56b29tXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNb3ZlIHRvIGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IHBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uIHRvIG1vdmUgdG8uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwb3NpdGlvbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbygnI2JveDEwMCcsIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib3gxMDAnKSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6MjAwLCB5OiA1MH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt4OiAyMDB9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eTogMjAwfSwgMSk7XG4gICAgKi9cbiAgICBtb3ZlVG8gKHBvc2l0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvblxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUm90YXRlIGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHJvdGF0aW9uJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCgnI2JveDEwMCcsIDIwLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib3gxMDAnKSwgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoe3g6IDIwMCwgeTogNTB9LCAyMCwgMSk7XG4gICAgKi9cbiAgICByb3RhdGVBdCAob3JpZ2luLCByb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiByb3RhdGlvblxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUm90YXRlIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVUbygyMCwgMSk7XG4gICAgKi9cbiAgICByb3RhdGVUbyAocm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTaGFrZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbnRlbnNpdHkgLSBBIHtAbGluayBDYW1lcmEjc2hha2VJbnRlbnNpdHl8c2hha2UgaW50ZW5zaXR5fS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtkaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fSBvcHRpb25zIHBsdXM6XG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlT3V0XSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCk7XG4gICAgKiBteUFuaW1hdGlvbi5zaGFrZSgwLjEsIDQsIE9jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uSE9SSVpPTlRBTCwgeyBlYXNlSW46IFBvd2VyMi5lYXNlSW4sIGVhc2VPdXQ6IFBvd2VyMi5lYXNlT3V0IH0pXG4gICAgKi9cbiAgICBzaGFrZSAoaW50ZW5zaXR5LCBkdXJhdGlvbiwgZGlyZWN0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hbmltYXRlKHtcbiAgICAgICAgICAgIHNoYWtlOiB7XG4gICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBpbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgZWFzZUluOiBvcHRpb25zLmVhc2VJbixcbiAgICAgICAgICAgICAgICBlYXNlT3V0OiBvcHRpb25zLmVhc2VPdXQsXG4gICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogb3B0aW9ucy5lbmZvcmNlQm91bmRzXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBab29tIGluL291dCBhdCBhIHNwZWNpZmljIGxvY2F0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBvcmlnaW4gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uem9vbUF0KCcjYm94MTAwJywgMiwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdCh7eDogMjAwLCB5OiA1MH0sIDIsIDEpO1xuICAgICovXG4gICAgem9vbUF0IChvcmlnaW4sIHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgb3JpZ2luOiBvcmlnaW4sXG4gICAgICAgICAgICB6b29tOiB6b29tXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uem9vbVRvKDIsIDEpO1xuICAgICovXG4gICAgem9vbVRvICh6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHsgXG4gICAgICAgICAgICB6b29tOiB6b29tIFxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG4vKipcbiogU2hha2UgZGlyZWN0aW9ucy5cbiogQGVudW0ge251bWJlcn1cbiovXG5BbmltYXRpb24uc2hha2UgPSB7XG4gICAgZGlyZWN0aW9uOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEJvdGggdGhlIHggYW5kIHkgYXhlcy5cbiAgICAgICAgKi9cbiAgICAgICAgQk9USDogMCxcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHggYXhpcy5cbiAgICAgICAgKi9cbiAgICAgICAgSE9SSVpPTlRBTDogMSxcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHkgYXhpcy5cbiAgICAgICAgKi9cbiAgICAgICAgVkVSVElDQUw6IDJcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEFuaW1hdGlvbjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IGlzRWxlbWVudCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0VsZW1lbnQnO1xuaW1wb3J0IGlzRmluaXRlICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRnVuY3Rpb24nO1xuaW1wb3J0IGlzTmlsICAgICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc05pbCc7XG5pbXBvcnQgaXNPYmplY3QgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgX01hdGggICAgICAgICAgICAgICAgZnJvbSAnLi9tYXRoL21hdGgnO1xuaW1wb3J0IE1hdHJpeDIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRyaXgyJztcbmltcG9ydCB7IFR5cGUgfSAgICAgICAgICAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgVXRpbHMgICAgICAgICAgICAgICAgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgVmVjdG9yMiAgICAgICAgICAgICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG5jb25zdCBhbmltYXRpb24gPSB7XG4gICAgdHlwZToge1xuICAgICAgICBDT1JFOiAxXG4gICAgfVxufTtcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLkFuaW1hdGlvblxuKiBAY29uc3RydWN0b3JcbiogQGV4dGVuZHMgZXh0ZXJuYWw6VGltZWxpbmVNYXhcbiogQHBhcmFtIHtDYW1lcmF9IGNhbWVyYSAtIFRoZSBjYW1lcmEgdG8gYmUgYW5pbWF0ZWQuXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuZGVzdHJveU9uQ29tcGxldGVdIC0gV2hldGhlciB0aGUgYW5pbWF0aW9uIHNob3VsZCBiZSBkZXN0cm95ZWQgb25jZSBpdCBoYXMgY29tcGxldGVkLlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlBbmltYXRpb24gPSBuZXcgT2N1bG8uQW5pbWF0aW9uKG15Q2FtZXJhLCB7IFxuKiAgIGRlc3Ryb3lPbkNvbXBsZXRlOiB0cnVlXG4qIH0pLnpvb21UbygyLCAxKS5zaGFrZSgwLjEsIDIpLnBsYXkoKTtcbiovXG5jbGFzcyBBbmltYXRpb24gZXh0ZW5kcyBUaW1lbGluZU1heCB7XG4gICAgY29uc3RydWN0b3IgKGNhbWVyYSwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICBwYXVzZWQ6IHRydWVcbiAgICAgICAgfSwgb3B0aW9ucyk7XG4gICAgICAgIFxuICAgICAgICBzdXBlcihPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtvYmplY3R9IC0gVGhlIGluaXRpYWwgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKiBAZGVmYXVsdCB7fTtcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHR5cGUgb2YgdGhpcyBvYmplY3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMudHlwZSA9IFR5cGUuQU5JTUFUSU9OO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtDYW1lcmF9IC0gVGhlIGNhbWVyYSBvbiB3aGljaCB0aGUgYW5pbWF0aW9uIHdpbGwgYmUgYXBwbGllZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmEgfHwgbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7YXJyYXl9IC0gVGhlIGNvcmUgdHdlZW5zIG9mIHRoaXMgYW5pbWF0aW9uIGluIG9yZGVyIG9mIGV4ZWN1dGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb3JlVHdlZW5zID0gW107XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1RpbWVsaW5lTGl0ZX0gLSBUaGUgY3VycmVudCBhY3RpdmUgc3ViLWFuaW1hdGlvbiBjb25zaXN0aW5nIG9mIHRoZSBjb3JlIGNhbWVyYSBhbmltYXRpb24gYW5kIGVmZmVjdCBhbmltYXRpb25zLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgYW5pbWF0aW9uIHNob3VsZCBiZSBkZXN0cm95ZWQgb25jZSBpdCBoYXMgY29tcGxldGVkLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRlc3Ryb3lPbkNvbXBsZXRlID0gb3B0aW9ucy5kZXN0cm95T25Db21wbGV0ZSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBjYW1lcmEgdmFsdWVzIG9mIHRoZSBwcmV2aW91cyBzdWItYW5pbWF0aW9uLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnByZXZpb3VzUHJvcHMgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIHN0YXJ0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5faW5pdENvcmVUd2Vlbih0aGlzLmNvcmVUd2VlbnNbMF0pO1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuaXNBbmltYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZGlzYWJsZURyYWcoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzTWFudWFsWm9vbWFibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZGlzYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vblN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5vblN0YXJ0LmFwcGx5KHRoaXMsIHRoaXMuY29uZmlnLm9uU3RhcnRQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIG9uY2UgZGV2IGlzIGNvbXBsZXRlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIHN0YXJ0ZWQnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgdXBkYXRlZC5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLm9uVXBkYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5vblVwZGF0ZS5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vblVwZGF0ZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBjb21wbGV0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuaXNBbmltYXRpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmVuYWJsZURyYWcoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzTWFudWFsWm9vbWFibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZW5hYmxlV2hlZWwoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLm9uQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uQ29tcGxldGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25Db21wbGV0ZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRlc3Ryb3lPbkNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgb25jZSBkZXYgaXMgY29tcGxldGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbmltYXRpb24gY29tcGxldGVkJyk7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50Q2FsbGJhY2soJ29uU3RhcnQnLCB0aGlzLl9vblN0YXJ0KTtcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvblVwZGF0ZScsIHRoaXMuX29uVXBkYXRlKTtcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvbkNvbXBsZXRlJywgdGhpcy5fb25Db21wbGV0ZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUaGUgcHJvcGVydGllcyB0byBhbmltYXRlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIF9hbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB2YXIgbWFpblRpbWVsaW5lID0gbmV3IFRpbWVsaW5lTGl0ZSh7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgb25TdGFydDogb3B0aW9ucy5vblN0YXJ0LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBvcHRpb25zLm9uVXBkYXRlLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6IG9wdGlvbnMub25Db21wbGV0ZSxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZTogb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vblN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uU3RhcnQuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uU3RhcnRQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25VcGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25VcGRhdGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uVXBkYXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vbkNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uQ29tcGxldGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgc2hha2VUaW1lbGluZSA9IG51bGw7XG4gICAgICAgIHZhciBzaGFrZSA9IHRoaXMuX3BhcnNlU2hha2UocHJvcHMuc2hha2UpO1xuICAgICAgICBcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25TdGFydDtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25VcGRhdGU7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uQ29tcGxldGU7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uUmV2ZXJzZUNvbXBsZXRlO1xuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gY29yZSBjYW1lcmEgcHJvcGVydGllc1xuICAgICAgICBpZiAocHJvcHMub3JpZ2luIHx8IHByb3BzLnBvc2l0aW9uIHx8IHByb3BzLnJvdGF0aW9uIHx8IHByb3BzLnpvb20pIHtcbiAgICAgICAgICAgIHZhciBjb3JlVHdlZW4gPSBUd2Vlbk1heC50byh0aGlzLmNhbWVyYSwgZHVyYXRpb24gIT09IDAgPyBkdXJhdGlvbiA6IDAuMDE2LCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgcmF3T2Zmc2V0WDogMCxcbiAgICAgICAgICAgICAgICByYXdPZmZzZXRZOiAwLFxuICAgICAgICAgICAgICAgIHJvdGF0aW9uOiAwLFxuICAgICAgICAgICAgICAgIHpvb206IDAsXG4gICAgICAgICAgICAgICAgaW1tZWRpYXRlUmVuZGVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLk5PTkU7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5wcm9wcy50by56b29tID4gdGhpcy5jYW1lcmEuem9vbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uSU47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2VsZi5wcm9wcy50by56b29tIDwgdGhpcy5jYW1lcmEuem9vbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uT1VUO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS56b29tRGlyZWN0aW9uID0gekRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIE9yaWdpbiBtdXN0IGJlIHNldCBpbiBjYXNlIGFuaW1hdGlvbiB3YXMgcmV2ZXJzZWQgKG9yaWdpbiB3YXMgcmV2ZXJ0ZWQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbihzZWxmLnByb3BzLmVuZC5vcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLmNvcmUgPSBzZWxmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGb3IgZGV2IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvcmUgdHdlZW4gc3RhcnRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndHdlZW4gdmFyczogJywgc2VsZi52YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3R3ZWVuIHByb3BzOiAnLCBzZWxmLnByb3BzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAvLyBQb3NpdGlvbiBpcyBtYW51YWxseSBtYWludGFpbmVkIHNvIGFuaW1hdGlvbnMgY2FuIHNtb290aGx5IGNvbnRpbnVlIHdoZW4gY2FtZXJhIGlzIHJlc2l6ZWRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0UmF3UG9zaXRpb24odGhpcy5jYW1lcmEuX2NvbnZlcnRPZmZzZXRUb1Bvc2l0aW9uKHRoaXMuY2FtZXJhLnJhd09mZnNldCwgdGhpcy5jYW1lcmEuY2VudGVyLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4sIHRoaXMuY2FtZXJhLnRyYW5zZm9ybWF0aW9uKSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luaXRDb3JlVHdlZW4odGhpcy5jb3JlVHdlZW5zW3NlbGYuaW5kZXggKyAxXSwgc2VsZi5wcm9wcy5lbmQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGb3IgZGV2IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvcmUgdHdlZW4gY29tcGxldGVkJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0VHJhbnNmb3JtT3JpZ2luKHNlbGYucHJvcHMuc3RhcnQub3JpZ2luKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvcmVUd2Vlbi50eXBlID0gYW5pbWF0aW9uLnR5cGUuQ09SRTtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHt9LFxuICAgICAgICAgICAgICAgIHBhcnNlZDoge30sXG4gICAgICAgICAgICAgICAgdG86IHt9LFxuICAgICAgICAgICAgICAgIHN0YXJ0OiB7fSxcbiAgICAgICAgICAgICAgICBlbmQ6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzLnNvdXJjZS5vcmlnaW4gPSBwcm9wcy5vcmlnaW47XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLnBvc2l0aW9uID0gcHJvcHMucG9zaXRpb247XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLnJvdGF0aW9uID0gcHJvcHMucm90YXRpb247XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLnpvb20gPSBwcm9wcy56b29tO1xuICAgICAgICAgICAgY29yZVR3ZWVuLmluZGV4ID0gdGhpcy5jb3JlVHdlZW5zLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMuY29yZVR3ZWVucy5wdXNoKGNvcmVUd2Vlbik7XG4gICAgICAgICAgICBtYWluVGltZWxpbmUuYWRkKGNvcmVUd2VlbiwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIHNoYWtlIGVmZmVjdFxuICAgICAgICBpZiAoZHVyYXRpb24gPiAwICYmIHNoYWtlICYmIHNoYWtlLmludGVuc2l0eSA+IDApIHtcbiAgICAgICAgICAgIHNoYWtlVGltZWxpbmUgPSBuZXcgVGltZWxpbmVMaXRlKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBzaGFrZS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgIGVuZm9yY2VCb3VuZHM6IChzaGFrZS5lbmZvcmNlQm91bmRzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICAgICAgb25TdGFydFBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblN0YXJ0OiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLnNoYWtlID0gc2VsZjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNGaW5hbEZyYW1lID0gc2VsZi50aW1lKCkgPT09IHNlbGYuZHVyYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldFggPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0WSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuY2FtZXJhLnJhd1Bvc2l0aW9uLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5IT1JJWk9OVEFMIHx8IHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZpbmFsRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5yYW5kb20oKSAqIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS53aWR0aCAqIDIgLSBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueCArPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uVkVSVElDQUwgfHwgc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmluYWxGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLmhlaWdodCAqIDIgLSBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnkgKz0gb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0UG9zaXRpb24ocG9zaXRpb24sIHNlbGYuZGF0YS5lbmZvcmNlQm91bmRzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J11cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRWFzZSBpbi9vdXRcbiAgICAgICAgICAgIGlmIChzaGFrZS5lYXNlSW4gJiYgc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24gKiAwLjUsIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZUluIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuXG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS50byhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uICogMC41LCB7IFxuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VPdXQgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgZHVyYXRpb24gKiAwLjUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZSBpbiBvciBlYXNlXG4gICAgICAgICAgICBlbHNlIGlmIChzaGFrZS5lYXNlSW4gJiYgIXNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VJbiB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2Ugb3V0XG4gICAgICAgICAgICBlbHNlIGlmICghc2hha2UuZWFzZUluICYmIHNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VPdXQgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlXG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmVhc2UpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IG9wdGlvbnMuZWFzZSB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vIGVhc2VcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZGF0YS5pbnRlbnNpdHkgPSBzaGFrZS5pbnRlbnNpdHk7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS50byhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7fSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoc2hha2VUaW1lbGluZSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWRkKG1haW5UaW1lbGluZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDYWxjdWxhdGVzIHRoZSBcInRvXCIgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdHxWZWN0b3IyfSBzb3VyY2VPcmlnaW4gLSBUaGUgc291cmNlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fFZlY3RvcjJ9IHNvdXJjZVBvc2l0aW9uIC0gVGhlIHNvdXJjZSBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2VSb3RhdGlvbiAtIFRoZSBzb3VyY2Ugcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc291cmNlWm9vbSAtIFRoZSBzb3VyY2Ugem9vbS5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQ2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgZW5kIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfY2FsY3VsYXRlVG9Qcm9wcyAocGFyc2VkLCBzdGFydCkge1xuICAgICAgICB2YXIgc291cmNlID0ge1xuICAgICAgICAgICAgb3JpZ2luOiAocGFyc2VkLm9yaWdpbiAhPT0gbnVsbCkgPyBwYXJzZWQub3JpZ2luIDoge30sXG4gICAgICAgICAgICBwb3NpdGlvbjogKHBhcnNlZC5wb3NpdGlvbiAhPT0gbnVsbCkgPyBwYXJzZWQucG9zaXRpb24gOiB7fSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiBwYXJzZWQucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiBwYXJzZWQuem9vbVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgaXNBbmNob3JlZCA9IGZhbHNlO1xuICAgICAgICAvLyBDaGFuZ2luZyB0byBzYW1lIG9yaWdpbiBpcyBuZWNlc3NhcnkgZm9yIHdoZWVsIHpvb21cbiAgICAgICAgdmFyIGlzT3JpZ2luWENoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5vcmlnaW4ueCk7XG4gICAgICAgIHZhciBpc09yaWdpbllDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uub3JpZ2luLnkpO1xuICAgICAgICB2YXIgaXNPcmlnaW5DaGFuZ2luZyA9IGlzT3JpZ2luWENoYW5naW5nIHx8IGlzT3JpZ2luWUNoYW5naW5nO1xuICAgICAgICAvLyBDaGFuZ2luZyB0byBzYW1lIHBvc2l0aW9uIGlzIG5lY2Vzc2FyeSBmb3IgY2FtZXJhIHJlc2l6ZVxuICAgICAgICB2YXIgaXNQb3NpdGlvblhDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2UucG9zaXRpb24ueCk7XG4gICAgICAgIHZhciBpc1Bvc2l0aW9uWUNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5wb3NpdGlvbi55KTtcbiAgICAgICAgdmFyIGlzUG9zaXRpb25DaGFuZ2luZyA9IGlzUG9zaXRpb25YQ2hhbmdpbmcgfHwgaXNQb3NpdGlvbllDaGFuZ2luZztcbiAgICAgICAgdmFyIGlzT2Zmc2V0Q2hhbmdpbmcgPSBpc1Bvc2l0aW9uQ2hhbmdpbmc7XG4gICAgICAgIHZhciBpc1JvdGF0aW9uQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnJvdGF0aW9uKSAmJiBzb3VyY2Uucm90YXRpb24gIT09IHN0YXJ0LnJvdGF0aW9uO1xuICAgICAgICB2YXIgaXNab29tQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnpvb20pICYmIHNvdXJjZS56b29tICE9PSBzdGFydC56b29tO1xuXG4gICAgICAgIHZhciBzdGFydFRyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZShzdGFydC56b29tLCBzdGFydC56b29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXN0YXJ0LnJvdGF0aW9uKSk7XG4gICAgICAgIHZhciBmb3ZQb3NpdGlvbiA9IHRoaXMuY2FtZXJhLmNlbnRlcjtcbiAgICAgICAgdmFyIHRvT2Zmc2V0O1xuICAgICAgICB2YXIgdG9PcmlnaW4gPSBuZXcgVmVjdG9yMihpc09yaWdpblhDaGFuZ2luZyA/IHNvdXJjZS5vcmlnaW4ueCA6IHN0YXJ0Lm9yaWdpbi54LCBpc09yaWdpbllDaGFuZ2luZyA/IHNvdXJjZS5vcmlnaW4ueSA6IHN0YXJ0Lm9yaWdpbi55KTtcbiAgICAgICAgdmFyIHRvUG9zaXRpb24gPSBuZXcgVmVjdG9yMihpc1Bvc2l0aW9uWENoYW5naW5nID8gc291cmNlLnBvc2l0aW9uLnggOiBzdGFydC5wb3NpdGlvbi54LCBpc1Bvc2l0aW9uWUNoYW5naW5nID8gc291cmNlLnBvc2l0aW9uLnkgOiBzdGFydC5wb3NpdGlvbi55KTtcbiAgICAgICAgdmFyIHRvUm90YXRpb24gPSBpc1JvdGF0aW9uQ2hhbmdpbmcgPyBzb3VyY2Uucm90YXRpb24gOiBzdGFydC5yb3RhdGlvbjtcbiAgICAgICAgdmFyIHRvWm9vbSA9IGlzWm9vbUNoYW5naW5nID8gc291cmNlLnpvb20gOiBzdGFydC56b29tO1xuICAgICAgICB2YXIgdG9UcmFuc2Zvcm1hdGlvbiA9IG5ldyBNYXRyaXgyKCkuc2NhbGUodG9ab29tLCB0b1pvb20pLnJvdGF0ZShfTWF0aC5kZWdUb1JhZCgtdG9Sb3RhdGlvbikpO1xuICAgICAgICBcbiAgICAgICAgLy8gcm90YXRlVG8sIHpvb21Ub1xuICAgICAgICBpZiAoIWlzT3JpZ2luQ2hhbmdpbmcgJiYgIWlzUG9zaXRpb25DaGFuZ2luZykge1xuICAgICAgICAgICAgaXNBbmNob3JlZCA9IHRydWU7XG4gICAgICAgICAgICB0b09yaWdpbi5jb3B5KHN0YXJ0LnBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByb3RhdGVBdCwgem9vbUF0XG4gICAgICAgIGVsc2UgaWYgKGlzT3JpZ2luQ2hhbmdpbmcgJiYgIWlzUG9zaXRpb25DaGFuZ2luZykge1xuICAgICAgICAgICAgaXNBbmNob3JlZCA9IHRydWU7XG4gICAgICAgICAgICBpc1Bvc2l0aW9uQ2hhbmdpbmcgPSB0cnVlO1xuICAgICAgICAgICAgZm92UG9zaXRpb24gPSB0aGlzLmNhbWVyYS5fY29udmVydFNjZW5lUG9zaXRpb25Ub0ZPVlBvc2l0aW9uKHRvT3JpZ2luLCBzdGFydC5wb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCBzdGFydFRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgIHRvUG9zaXRpb24gPSB0aGlzLmNhbWVyYS5fY29udmVydFNjZW5lUG9zaXRpb25Ub0NhbWVyYVBvc2l0aW9uKHRvT3JpZ2luLCBmb3ZQb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCB0b09yaWdpbiwgdG9UcmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRvT2Zmc2V0ID0gdGhpcy5jYW1lcmEuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRvUG9zaXRpb24sIHRoaXMuY2FtZXJhLmNlbnRlciwgdG9PcmlnaW4sIHRvVHJhbnNmb3JtYXRpb24pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9mZnNldFg6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC54IDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldFk6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIG9yaWdpbjogaXNBbmNob3JlZCB8fCBpc09yaWdpbkNoYW5naW5nID8gdG9PcmlnaW4gOiBudWxsLFxuICAgICAgICAgICAgcG9zaXRpb246IGlzUG9zaXRpb25DaGFuZ2luZyA/IHRvUG9zaXRpb24gOiBudWxsLFxuICAgICAgICAgICAgcm90YXRpb246IGlzUm90YXRpb25DaGFuZ2luZyA/IHRvUm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogaXNab29tQ2hhbmdpbmcgPyB0b1pvb20gOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgc3RhcnRpbmcgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBzdGFydGluZyBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2dldFN0YXJ0UHJvcHMgKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3JpZ2luOiB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4uY2xvbmUoKSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmNhbWVyYS5wb3NpdGlvbi5jbG9uZSgpLFxuICAgICAgICAgICAgcm90YXRpb246IHRoaXMuY2FtZXJhLnJvdGF0aW9uLFxuICAgICAgICAgICAgem9vbTogdGhpcy5jYW1lcmEuem9vbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGVuZGluZyBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIGVuZGluZyBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2dldEVuZFByb3BzICh0bywgc3RhcnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9yaWdpbjogKHRvLm9yaWdpbiAhPT0gbnVsbCkgPyB0by5vcmlnaW4gOiBzdGFydC5vcmlnaW4sXG4gICAgICAgICAgICBwb3NpdGlvbjogKHRvLnBvc2l0aW9uICE9PSBudWxsKSA/IHRvLnBvc2l0aW9uIDogc3RhcnQucG9zaXRpb24sXG4gICAgICAgICAgICByb3RhdGlvbjogKHRvLnJvdGF0aW9uICE9PSBudWxsKSA/IHRvLnJvdGF0aW9uIDogc3RhcnQucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiAodG8uem9vbSAhPT0gbnVsbCkgPyB0by56b29tIDogc3RhcnQuem9vbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEluaXRpYWxpemVzIGEgY29yZSB0d2Vlbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtUd2Vlbk1heH0gdHdlZW4gLSBUaGUgdHdlZW4uXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgX2luaXRDb3JlVHdlZW4gKHR3ZWVuLCBzdGFydFByb3BzKSB7XG4gICAgICAgIGlmICh0d2VlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzdGFydFByb3BzID0gKHN0YXJ0UHJvcHMgIT09IHVuZGVmaW5lZCkgPyBzdGFydFByb3BzIDogdGhpcy5fZ2V0U3RhcnRQcm9wcygpO1xuXG4gICAgICAgICAgICB2YXIgcGFyc2VkUHJvcHMgPSB0aGlzLl9wYXJzZVByb3BzKHR3ZWVuLnByb3BzLnNvdXJjZS5vcmlnaW4sIHR3ZWVuLnByb3BzLnNvdXJjZS5wb3NpdGlvbiwgdHdlZW4ucHJvcHMuc291cmNlLnJvdGF0aW9uLCB0d2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSk7XG4gICAgICAgICAgICB2YXIgdG9Qcm9wcyA9IHRoaXMuX2NhbGN1bGF0ZVRvUHJvcHMocGFyc2VkUHJvcHMsIHN0YXJ0UHJvcHMpO1xuICAgICAgICAgICAgdmFyIGVuZFByb3BzID0gdGhpcy5fZ2V0RW5kUHJvcHModG9Qcm9wcywgc3RhcnRQcm9wcyk7XG5cbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IHN0YXJ0UHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5zdGFydCA9IHN0YXJ0UHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5lbmQgPSBlbmRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLnBhcnNlZCA9IHBhcnNlZFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMudG8gPSB0b1Byb3BzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBPcmlnaW4gbXVzdCBiZSB1cGRhdGVkIGJlZm9yZSB0d2VlbiBzdGFydHNcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbih0b1Byb3BzLm9yaWdpbik7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJhd09mZnNldFggPSB0b1Byb3BzLm9mZnNldFg7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJhd09mZnNldFkgPSB0b1Byb3BzLm9mZnNldFk7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJvdGF0aW9uID0gdG9Qcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMuem9vbSA9IHRvUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBjb3JlIGFuaW1hdGlvbiBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3JpZ2luIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3NpdGlvbiAtIFRoZSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIFRoZSB6b29tLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgcGFyc2VkIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfcGFyc2VQcm9wcyAob3JpZ2luLCBwb3NpdGlvbiwgcm90YXRpb24sIHpvb20pIHtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAncHJldmlvdXMnICYmIHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucG9zaXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyb3RhdGlvbiA9PT0gJ3ByZXZpb3VzJyAmJiAhaXNOaWwodGhpcy5wcmV2aW91c1Byb3BzLnJvdGF0aW9uKSkge1xuICAgICAgICAgICAgcm90YXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh6b29tID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMuem9vbSkpIHtcbiAgICAgICAgICAgIHpvb20gPSB0aGlzLnByZXZpb3VzUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBvcmlnaW46IFV0aWxzLnBhcnNlUG9zaXRpb24ob3JpZ2luLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBVdGlscy5wYXJzZVBvc2l0aW9uKHBvc2l0aW9uLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiAhaXNOaWwocm90YXRpb24pID8gcm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogem9vbSB8fCBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gc2hha2UgLSBUaGUgc2hha2UgcHJvcGVydGllcy5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlU2hha2UgKHNoYWtlKSB7XG4gICAgICAgIHZhciBwYXJzZWRTaGFrZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAoc2hha2UpIHtcbiAgICAgICAgICAgIHBhcnNlZFNoYWtlID0ge1xuICAgICAgICAgICAgICAgIGludGVuc2l0eTogaXNOaWwoc2hha2UuaW50ZW5zaXR5KSA/IDAgOiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc05pbChzaGFrZS5kaXJlY3Rpb24pID8gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIIDogc2hha2UuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgIGVhc2VJbjogc2hha2UuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IHNoYWtlLmVhc2VPdXQsXG4gICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogc2hha2UuZW5mb3JjZUJvdW5kc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHBhcnNlZFNoYWtlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFN0b3BzIHRoZSBhbmltYXRpb24gYW5kIHJlbGVhc2VzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uZGVzdHJveSgpO1xuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHN1cGVyLmtpbGwoKTtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IG51bGw7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLnBvc2l0aW9uXSAtIFRoZSBsb2NhdGlvbiB0byBtb3ZlIHRvLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5wb3NpdGlvbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLm9yaWdpbl0gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLm9yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Byb3BzLnJvdGF0aW9uXSAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2VdIC0gQW4gb2JqZWN0IG9mIHNoYWtlIGVmZmVjdCBwcm9wZXJ0aWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5zaGFrZS5pbnRlbnNpdHldIC0gQSB7QGxpbmsgQ2FtZXJhI3NoYWtlSW50ZW5zaXR5fHNoYWtlIGludGVuc2l0eX0uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtwcm9wcy5zaGFrZS5kaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZU91dF0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnpvb21dIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246ICcjYm94MTAwJywgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7b3JpZ2luOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjoge3g6IDIwMCwgeTogNTB9LCB6b29tOiAyfSwgMSk7XG4gICAgKi9cbiAgICBhbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBwb3NpdGlvbjogcHJvcHMucG9zaXRpb24sXG4gICAgICAgICAgICBvcmlnaW46IHByb3BzLm9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiBwcm9wcy5yb3RhdGlvbixcbiAgICAgICAgICAgIHNoYWtlOiBwcm9wcy5zaGFrZSxcbiAgICAgICAgICAgIHpvb206IHByb3BzLnpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE1vdmUgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gcG9zaXRpb24gLSBUaGUgcG9zaXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24ubW92ZVRvKCcjYm94MTAwJywgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eDoyMDAsIHk6IDUwfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6IDIwMH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt5OiAyMDB9LCAxKTtcbiAgICAqL1xuICAgIG1vdmVUbyAocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gb3JpZ2luIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgcm90YXRpb24ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KCcjYm94MTAwJywgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyMCwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCh7eDogMjAwLCB5OiA1MH0sIDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZUF0IChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogb3JpZ2luLFxuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZVRvKDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZVRvIChyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICByb3RhdGlvbjogcm90YXRpb25cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNoYWtlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGludGVuc2l0eSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbn0gW2RpcmVjdGlvbj1PY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEhdIC0gQSBzaGFrZSBkaXJlY3Rpb24uIFxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9IG9wdGlvbnMgcGx1czpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlSW5dIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uc2hha2UoMC4xLCA0KTtcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCwgT2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5IT1JJWk9OVEFMLCB7IGVhc2VJbjogUG93ZXIyLmVhc2VJbiwgZWFzZU91dDogUG93ZXIyLmVhc2VPdXQgfSlcbiAgICAqL1xuICAgIHNoYWtlIChpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2hha2U6IHtcbiAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IGludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICBlYXNlSW46IG9wdGlvbnMuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IG9wdGlvbnMuZWFzZU91dCxcbiAgICAgICAgICAgICAgICBlbmZvcmNlQm91bmRzOiBvcHRpb25zLmVuZm9yY2VCb3VuZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHpvb20ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoJyNib3gxMDAnLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm94MTAwJyksIDIsIDEpO1xuICAgICogbXlBbmltYXRpb24uem9vbUF0KHt4OiAyMDAsIHk6IDUwfSwgMiwgMSk7XG4gICAgKi9cbiAgICB6b29tQXQgKG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHpvb206IHpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogWm9vbSBpbi9vdXQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tVG8oMiwgMSk7XG4gICAgKi9cbiAgICB6b29tVG8gKHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoeyBcbiAgICAgICAgICAgIHpvb206IHpvb20gXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuKiBTaGFrZSBkaXJlY3Rpb25zLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbkFuaW1hdGlvbi5zaGFrZSA9IHtcbiAgICBkaXJlY3Rpb246IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQm90aCB0aGUgeCBhbmQgeSBheGVzLlxuICAgICAgICAqL1xuICAgICAgICBCT1RIOiAwLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeCBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBIT1JJWk9OVEFMOiAxLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeSBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBWRVJUSUNBTDogMlxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQW5pbWF0aW9uOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgQW5pbWF0aW9uIGZyb20gJy4vQW5pbWF0aW9uJztcbmltcG9ydCB7IFR5cGUgfSAgZnJvbSAnLi9jb25zdGFudHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQW5pbWF0aW9uTWFuYWdlclxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtPYmplY3R9IGNhbWVyYSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgQW5pbWF0aW9uTWFuYWdlci5cbiovXG5jbGFzcyBBbmltYXRpb25NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgQW5pbWF0aW9uTWFuYWdlci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkFuaW1hdGlvbn0gLSBUaGUgYWN0aXZlIGFuaW1hdGlvbi5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIEFuIG9iamVjdCBmb3Igc3RvcmluZyB0aGUgQW5pbWF0aW9uIGluc3RhbmNlcy5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQW5pbWF0aW9uTWFuYWdlciNpc0FuaW1hdGluZ1xuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIGlzIHJ1bm5pbmcgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNBbmltYXRpbmcgKCkge1xuICAgICAgICB2YXIgcHJvZ3Jlc3MgPSB0aGlzLmN1cnJlbnRBbmltYXRpb24gPyB0aGlzLmN1cnJlbnRBbmltYXRpb24ucHJvZ3Jlc3MoKSA6IDA7XG4gICAgICAgIHJldHVybiBwcm9ncmVzcyA+IDAgJiYgcHJvZ3Jlc3MgPCAxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIEFuaW1hdGlvbk1hbmFnZXIjaXNQYXVzZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBpcyBwYXVzZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNQYXVzZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50QW5pbWF0aW9uID8gdGhpcy5jdXJyZW50QW5pbWF0aW9uLnBhdXNlZCgpIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSB0byBnaXZlIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcGFyYW0ge29iamVjdHxPY3Vsby5BbmltYXRpb259IGFuaW1hdGlvbiAtIFRoZSBhbmltYXRpb24uIEl0IGNhbiBiZSBhbiBhY3R1YWwgYW5pbWF0aW9uIGluc3RhbmNlIG9yIGFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGFuaW1hdGlvbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYW4gYW5pbWF0aW9uIGluc3RhbmNlPC9jYXB0aW9uPlxuICAgICogbXlBbmltYXRpb25NYW5hZ2VyLmFkZCgnem9vbUluT3V0JywgbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSkuYW5pbWF0ZSh7em9vbTogMn0sIDIsIHtlYXNlOiBQb3dlcjIuZWFzZUlufSkuYW5pbWF0ZSh7em9vbTogMX0sIDIsIHtlYXNlOiBQb3dlcjIuZWFzZU91dH0pKTtcbiAgICAqIFxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYW4gb2JqZWN0IHJlcHJlc2VudGluZyBhbiBhbmltYXRpb248L2NhcHRpb24+XG4gICAgKiBteUFuaW1hdGlvbk1hbmFnZXIuYWRkKCd6b29tSW5BbmRPdXQnLCB7IFxuICAgICogICBrZXlmcmFtZXM6IFt7IFxuICAgICogICAgIHpvb206IDIsIFxuICAgICogICAgIGR1cmF0aW9uOiAyLCBcbiAgICAqICAgICBvcHRpb25zOiB7IFxuICAgICogICAgICAgZWFzZTogUG93ZXIyLmVhc2VJbiBcbiAgICAqICAgICB9XG4gICAgKiAgIH0sIHtcbiAgICAqICAgICB6b29tOiAxLFxuICAgICogICAgIGR1cmF0aW9uOiAyLFxuICAgICogICAgIG9wdGlvbnM6IHtcbiAgICAqICAgICAgIGVhc2U6IFBvd2VyMi5lYXNlT3V0XG4gICAgKiAgICAgfVxuICAgICogICB9XVxuICAgICogfSk7XG4gICAgKi8gICAgICAgIFxuICAgIGFkZCAobmFtZSwgYW5pbWF0aW9uKSB7XG4gICAgICAgIGxldCBuZXdBbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5fYW5pbWF0aW9uc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1tuYW1lXS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChhbmltYXRpb24udHlwZSA9PT0gVHlwZS5BTklNQVRJT04pIHtcbiAgICAgICAgICAgIG5ld0FuaW1hdGlvbiA9IGFuaW1hdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5ld0FuaW1hdGlvbiA9IG5ldyBBbmltYXRpb24odGhpcy5jYW1lcmEpO1xuICAgICAgICAgICAgYW5pbWF0aW9uLmtleWZyYW1lcy5mb3JFYWNoKChrZXlmcmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0FuaW1hdGlvbi5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiBrZXlmcmFtZS5vcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBrZXlmcmFtZS5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGtleWZyYW1lLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzaGFrZToga2V5ZnJhbWUuc2hha2UsXG4gICAgICAgICAgICAgICAgICAgIHpvb206IGtleWZyYW1lLnpvb21cbiAgICAgICAgICAgICAgICB9LCBrZXlmcmFtZS5kdXJhdGlvbiwga2V5ZnJhbWUub3B0aW9ucyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9hbmltYXRpb25zW25hbWVdID0gbmV3QW5pbWF0aW9uO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIEFuaW1hdGlvbk1hbmFnZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fYW5pbWF0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1trZXldLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGFuIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcmV0dXJucyB7T2N1bG8uQW5pbWF0aW9ufSBUaGUgYW5pbWF0aW9uLlxuICAgICovXG4gICAgZ2V0IChuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhdXNlcyB0aGUgYWN0aXZlIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwYXVzZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5wYXVzZShudWxsLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFBsYXlzIHRoZSBjdXJyZW50IG9yIHByb3ZpZGVkIGFuaW1hdGlvbiBmb3J3YXJkIGZyb20gdGhlIGN1cnJlbnQgcGxheWhlYWQgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWVdIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0byBwbGF5LlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwbGF5IChuYW1lKSB7XG4gICAgICAgIHZhciBhbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb247XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24uaW52YWxpZGF0ZSgpLnJlc3RhcnQoZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgfSBcbiAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gdW5kZWZpbmVkICYmIHRoaXMuY3VycmVudEFuaW1hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uLnBsYXkobnVsbCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXN1bWVzIHBsYXlpbmcgdGhlIGFuaW1hdGlvbiBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlc3VtZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXZlcnNlcyBwbGF5YmFjayBvZiBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPW51bGxdIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbi4gSWYgbm9uZSBpcyBzcGVjaWZpZWQsIHRoZSBjdXJyZW50IGFuaW1hdGlvbiB3aWxsIGJlIHJldmVyc2VkLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJldmVyc2UgKG5hbWUgPSBudWxsKSB7XG4gICAgICAgIHZhciBhbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb247XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24uaW52YWxpZGF0ZSgpLnJldmVyc2UoMCwgZmFsc2UpO1xuICAgICAgICB9IFxuICAgICAgICBlbHNlIGlmIChuYW1lID09PSBudWxsICYmIHRoaXMuY3VycmVudEFuaW1hdGlvbikge1xuICAgICAgICAgICAgbGV0IHRpbWUgPSB0aGlzLmN1cnJlbnRBbmltYXRpb24udGltZSgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uLnJldmVyc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBBbmltYXRpb25NYW5hZ2VyOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG4vLyBUT0RPOlxuLy8gMSkgSW1wb3J0IEFuaW1hdGlvbiB0byBhdm9pZCB1c2luZyBPY3VsbyBuYW1lc3BhY2Vcbi8vIDIpIEVuc3VyZSBkaXJlY3Rpb25hbCByb3RhdGlvbiBwbHVnaW4gd29ya3Ncbi8vIDMpIE1ha2Ugc3VyZSBrZXlmcmFtZSBjYWxsYmFja3Mgd29yayBzbyB0aGF0IGNhbWVyYS5zaGFrZSgpIGNhbiBleGVjdXRlIFwib25Db21wbGV0ZVwiLCBldGMuXG5cbmltcG9ydCBjbGFtcCAgICAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvY2xhbXAnO1xuaW1wb3J0IGlzRWxlbWVudCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0VsZW1lbnQnO1xuaW1wb3J0IGlzRmluaXRlICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRnVuY3Rpb24nO1xuaW1wb3J0IGlzTmlsICAgICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc05pbCc7XG5pbXBvcnQgaXNPYmplY3QgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSAgICAgZnJvbSAnZmJlbWl0dGVyJztcbmltcG9ydCBBbmltYXRpb25NYW5hZ2VyICAgICBmcm9tICcuL2FuaW1hdGlvbk1hbmFnZXInO1xuaW1wb3J0IENTU1JlbmRlcmVyICAgICAgICAgIGZyb20gJy4vY3NzUmVuZGVyZXInO1xuaW1wb3J0IF9NYXRoICAgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRoJztcbmltcG9ydCBNYXRyaXgyICAgICAgICAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgU2NlbmUgICAgICAgICAgICAgICAgZnJvbSAnLi9zY2VuZSc7XG5pbXBvcnQgU2NlbmVNYW5hZ2VyICAgICAgICAgZnJvbSAnLi9zY2VuZU1hbmFnZXInO1xuaW1wb3J0IFRyYWNrQ29udHJvbCAgICAgICAgIGZyb20gJy4vdHJhY2tDb250cm9sJztcbmltcG9ydCBVdGlscyAgICAgICAgICAgICAgICBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBWZWN0b3IyICAgICAgICAgICAgICBmcm9tICcuL21hdGgvdmVjdG9yMic7XG5cbmNvbnN0IGFuaW1hdGlvbk5hbWUgPSB7XG4gICAgQU5PTllNT1VTOiAnX2Fub255bW91cydcbn07XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5DYW1lcmFcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Ygb3B0aW9ucy5cbiogQHBhcmFtIHtmdW5jdGlvbnxPYmplY3R9IFtvcHRpb25zLmJvdW5kc10gLSBUaGUgYm91bmRzLlxuKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmRyYWdUb01vdmVdIC0gV2hldGhlciB0aGUgY2FtZXJhJ3MgcG9zaXRpb24gaXMgZHJhZ2dhYmxlIG9yIG5vdC5cbiogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1pblpvb21dIC0gVGhlIHtAbGluayBDYW1lcmEubWluWm9vbXxtaW5pbXVtIHpvb219LlxuKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4Wm9vbV0gLSBUaGUge0BsaW5rIENhbWVyYS5tYXhab29tfG1heGltdW0gem9vbX0uXG4qIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8bnVsbH0gW29wdGlvbnMudmlld10gLSBUaGUgY2FtZXJhJ3Mgdmlldy5cbiogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy53aGVlbFRvWm9vbV0gLSBXaGV0aGVyIHdoZWVsaW5nIGNhbiBiZSB1c2VkIHRvIHpvb20gb3Igbm90LlxuKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMud2hlZWxUb1pvb21JbmNyZW1lbnRdIC0gVGhlIGJhc2Uge0BsaW5rIENhbWVyYS53aGVlbFRvWm9vbUluY3JlbWVudHx6b29tIGluY3JlbWVudH0uXG4qIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW29wdGlvbnMud2lkdGhdIC0gVGhlIGNhbWVyYSdzIHtAbGluayBDYW1lcmEud2lkdGh8d2lkdGh9LlxuKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtvcHRpb25zLmhlaWdodF0gLSBUaGUgY2FtZXJhJ3Mge0BsaW5rIENhbWVyYS5oZWlnaHR8aGVpZ2h0fS5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15Q2FtZXJhID0gbmV3IE9jdWxvLkNhbWVyYSh7IFxuKiAgIHZpZXc6ICcjY2FtZXJhJyxcbiogICBib3VuZHM6IE9jdWxvLkNhbWVyYS5ib3VuZHMuV09STERfRURHRSxcbiogICBkcmFnVG9Nb3ZlOiB0cnVlLFxuKiAgIG1pblpvb206IDAuNSxcbiogICBtYXhab29tOiAzLFxuKiAgIHdoZWVsVG9ab29tOiB0cnVlLFxuKiAgIHdoZWVsVG9ab29tSW5jcmVtZW50OiAwLjUsXG4qICAgd2lkdGg6IDEwMDAsXG4qICAgaGVpZ2h0OiA1MDBcbiogfSk7XG4qL1xuY2xhc3MgQ2FtZXJhIHtcbiAgICBjb25zdHJ1Y3RvciAoeyBcbiAgICAgICAgYm91bmRzID0gbnVsbCwgXG4gICAgICAgIGRyYWdUb01vdmUgPSBmYWxzZSwgXG4gICAgICAgIGhlaWdodCA9IDAsIFxuICAgICAgICBtYXhab29tID0gMywgXG4gICAgICAgIG1pblpvb20gPSAwLjUsIFxuICAgICAgICBvbkluaXRpYWxpemUgPSBudWxsLFxuICAgICAgICBvbkJlZm9yZVJlbmRlciA9IG51bGwsXG4gICAgICAgIG9uUmVuZGVyID0gbnVsbCxcbiAgICAgICAgdmlldyA9IHVuZGVmaW5lZCwgXG4gICAgICAgIHdoZWVsVG9ab29tID0gZmFsc2UsIFxuICAgICAgICB3aGVlbFRvWm9vbUluY3JlbWVudCA9IDAuMDEsIFxuICAgICAgICB3aWR0aCA9IDBcbiAgICB9ID0ge30pIHtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uQW5pbWF0aW9uTWFuYWdlcn0gLSBBbiBvYmplY3QgZm9yIG1hbmFnaW5nIGFuaW1hdGlvbnMuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucyA9IG5ldyBBbmltYXRpb25NYW5hZ2VyKHRoaXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7VmVjdG9yMn0gLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2VudGVyID0gbmV3IFZlY3RvcjIod2lkdGgsIGhlaWdodCkubXVsdGlwbHlTY2FsYXIoMC41KTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEncyBwb3NpdGlvbiBpcyBkcmFnZ2FibGUgb3Igbm90LlxuICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZHJhZ1RvTW92ZSA9IChkcmFnVG9Nb3ZlID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgaGVpZ2h0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhIGlzIGFuaW1hdGluZyBvciBub3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0FuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSBoYXMgYmVlbiByZW5kZXJlZCBvciBub3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1JlbmRlcmVkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8bnVtYmVyfSAtIFRoZSBtaW5pbXVtIFggcG9zaXRpb24gYWZ0ZXIgYm91bmRzIGFyZSBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1pblBvc2l0aW9uWCA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8bnVtYmVyfSAtIFRoZSBtaW5pbXVtIFkgcG9zaXRpb24gYWZ0ZXIgYm91bmRzIGFyZSBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1pblBvc2l0aW9uWSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8bnVtYmVyfSAtIFRoZSBtYXhpbXVtIFggcG9zaXRpb24gYWZ0ZXIgYm91bmRzIGFyZSBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1heFBvc2l0aW9uWCA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8bnVtYmVyfSAtIFRoZSBtYXhpbXVtIFkgcG9zaXRpb24gYWZ0ZXIgYm91bmRzIGFyZSBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1heFBvc2l0aW9uWSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgbWluaW11bSB2YWx1ZSB0aGUgY2FtZXJhIGNhbiBiZSB6b29tZWQuXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gU2VlIHtAbGluayBDYW1lcmEuem9vbXx6b29tfS5cbiAgICAgICAgKiBAZGVmYXVsdCAwLjVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5taW5ab29tID0gbWluWm9vbTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSBtYXhpbXVtIHZhbHVlIHRoZSBjYW1lcmEgY2FuIGJlIHpvb21lZC5cbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBTZWUge0BsaW5rIENhbWVyYS56b29tfHpvb219LlxuICAgICAgICAqIEBkZWZhdWx0IDNcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tYXhab29tID0gbWF4Wm9vbTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBwb3NpdGlvbiBvZiB0aGUgY2FtZXJhIG9uIHRoZSBzY2VuZS5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IyKDAsIDApO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGFueSBlZmZlY3RzIGFwcGxpZWQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucmF3T2Zmc2V0ID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgcG9zaXRpb24gb2YgdGhlIGNhbWVyYSBvbiB0aGUgc2NlbmUgd2l0aG91dCBhbnkgZWZmZWN0cyBhcHBsaWVkLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnJhd1Bvc2l0aW9uID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgcmVuZGVyZXIuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgQ1NTUmVuZGVyZXIodGhpcyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgYW1vdW50IG9mIHJvdGF0aW9uIGluIGRlZ3JlZXMuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvdGF0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uU2NlbmVNYW5hZ2VyfSAtIEFuIG9iamVjdCBmb3IgbWFuYWdpbmcgc2NlbmVzLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnNjZW5lcyA9IG5ldyBTY2VuZU1hbmFnZXIodGhpcyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1RyYWNrQ29udHJvbH0gLSBUaGUgdHJhY2sgY29udHJvbC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBvcmlnaW4uXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMudHJhbnNmb3JtT3JpZ2luID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdmlldy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy52aWV3ID0gKHZpZXcgPT09IG51bGwpID8gbnVsbCA6IFV0aWxzLkRPTS5wYXJzZVZpZXcodmlldykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB3aGVlbGluZyBjYW4gYmUgdXNlZCB0byB6b29tIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLndoZWVsVG9ab29tID0gKHdoZWVsVG9ab29tID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBiYXNlIGluY3JlbWVudCBhdCB3aGljaCB0aGUgY2FtZXJhIHdpbGwgYmUgem9vbWVkLiBTZWUge0BsaW5rIENhbWVyYS56b29tfHpvb219LlxuICAgICAgICAqIEBkZWZhdWx0IDAuMDFcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aGVlbFRvWm9vbUluY3JlbWVudCA9IHdoZWVsVG9ab29tSW5jcmVtZW50O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHdpZHRoLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHpvb20gZGlyZWN0aW9uLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy56b29tRGlyZWN0aW9uID0gem9vbURpcmVjdGlvbi5OT05FO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8ZnVuY3Rpb258T2JqZWN0fSAtIFRoZSBpbnRlcm5hbGx5IG1hbmFnZWQgYm91bmRzLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ib3VuZHMgPSBib3VuZHM7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7RXZlbnRFbWl0dGVyfSAtIFRoZSBpbnRlcm5hbCBldmVudCBlbWl0dGVyLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBzY2FsZSBhdCB3aGljaCB0aGUgc2NlbmUgaXMgcmFzdGVyaXplZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmFzdGVyU2NhbGUgPSAxO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgaW50ZXJuYWxseSBtYW5hZ2VkIHpvb20uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX3pvb20gPSAxO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBwb3NpdGlvblxuICAgICAgICB0aGlzLnNldFJhd1Bvc2l0aW9uKG5ldyBWZWN0b3IyKHdpZHRoICogMC41LCBoZWlnaHQgKiAwLjUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgZXZlbnRzXG4gICAgICAgIGlmIChvbkluaXRpYWxpemUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMub25Jbml0aWFsaXplID0gb25Jbml0aWFsaXplO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAob25CZWZvcmVSZW5kZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMub25CZWZvcmVSZW5kZXIgPSBvbkJlZm9yZVJlbmRlcjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG9uUmVuZGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLm9uUmVuZGVyID0gb25SZW5kZXI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMub25SZXNpemUgPSAoKSA9PiB7XG4gICAgICAgICAgICAvLyBNYWludGFpbiBjYW1lcmEgcG9zaXRpb24gYW5kIHVwZGF0ZSB0aGUgY3VycmVudCBhbmltYXRpb25cbiAgICAgICAgICAgIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcywgeyBcbiAgICAgICAgICAgICAgICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHdhc1BhdXNlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuYW5pbWF0aW9ucy5jdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAndGhpcycgaXMgYm91bmQgdG8gdGhlIEFuaW1hdGlvbiB2aWEgdGhlIEFuaW1hdGlvbiBjbGFzc1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFuaW1hdGlvbiA9IHRoaXMuY2FtZXJhLmFuaW1hdGlvbnMuY3VycmVudEFuaW1hdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aW1lID0gYW5pbWF0aW9uLnRpbWUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uLnNlZWsoMCkuaW52YWxpZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uLmNvcmVUd2VlbnNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRSYXdQb3NpdGlvbihhbmltYXRpb24uY29yZVR3ZWVuc1swXS5wcm9wcy5zdGFydC5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbi5zZWVrKHRpbWUsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF3YXNQYXVzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogW3RoaXMuYW5pbWF0aW9ucy5pc1BhdXNlZF1cbiAgICAgICAgICAgIH0pLm1vdmVUbyh0aGlzLnJhd1Bvc2l0aW9uLCAwLCB7IG92ZXJ3cml0ZTogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgIHRoaXMuX2V2ZW50cy5hZGRMaXN0ZW5lcignY2hhbmdlOnNpemUnLCB0aGlzLm9uUmVzaXplKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgdmlld1xuICAgICAgICBpZiAodGhpcy52aWV3KSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgc2NlbmUgbWFuYWdlciB2aWV3IGFuZCB0cmFjayBjb250cm9sc1xuICAgICAgICBpZiAodGhpcy52aWV3ICYmIHRoaXMuc2NlbmVzLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLnNjZW5lcy52aWV3KTtcbiAgICAgICAgICAgIHRoaXMudHJhY2tDb250cm9sID0gbmV3IFRyYWNrQ29udHJvbCh0aGlzLCB7XG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlOiB0aGlzLmRyYWdUb01vdmUsXG4gICAgICAgICAgICAgICAgb25EcmFnOiBmdW5jdGlvbiAoY2FtZXJhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IGNhbWVyYS5fY29udmVydE9mZnNldFRvUG9zaXRpb24obmV3IFZlY3RvcjIoLXRoaXMueCwgLXRoaXMueSksIGNhbWVyYS5jZW50ZXIsIGNhbWVyYS50cmFuc2Zvcm1PcmlnaW4sIGNhbWVyYS50cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIG5ldyBPY3Vsby5BbmltYXRpb24oY2FtZXJhLCB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdHJveU9uQ29tcGxldGU6IHRydWUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChkcmFnQ29udHJvbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdDb250cm9sLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFt0aGlzXVxuICAgICAgICAgICAgICAgICAgICB9KS5tb3ZlVG8ocG9zaXRpb24sIDApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2hlZWxhYmxlOiB0aGlzLndoZWVsVG9ab29tLFxuICAgICAgICAgICAgICAgIG9uV2hlZWw6IGZ1bmN0aW9uIChjYW1lcmEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgWk9PTV9JTiA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFpPT01fT1VUID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZlbG9jaXR5ID0gTWF0aC5hYnModGhpcy53aGVlbEV2ZW50LmRlbHRhWSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLndoZWVsRXZlbnQuZGVsdGFZID4gMCA/IFpPT01fT1VUIDogWk9PTV9JTjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzRGlyZWN0aW9uID0gdGhpcy5wcmV2aW91c1doZWVsRXZlbnQuZGVsdGFZID4gMCA/IFpPT01fT1VUIDogWk9PTV9JTjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbWVyYVJlY3Q7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW1lcmFGT1ZQb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzY2VuZVBvc2l0aW9uID0gbmV3IFZlY3RvcjIoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdpbiA9IGNhbWVyYS50cmFuc2Zvcm1PcmlnaW47XG4gICAgICAgICAgICAgICAgICAgIHZhciB6b29tID0gY2FtZXJhLnpvb20gKyBjYW1lcmEuem9vbSAqIGNhbWVyYS53aGVlbFRvWm9vbUluY3JlbWVudCAqICh2ZWxvY2l0eSA+IDEgPyB2ZWxvY2l0eSAqIDAuNSA6IDEpICogKGRpcmVjdGlvbiA9PT0gWk9PTV9JTiA/IDEgOiAtMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUGVyZm9ybWFuY2UgT3B0aW1pemF0aW9uOiBJZiB6b29tIGhhcyBub3QgY2hhbmdlZCBiZWNhdXNlIGl0J3MgYXQgdGhlIG1pbi9tYXgsIGRvbid0IHpvb20uXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IHByZXZpb3VzRGlyZWN0aW9uICYmIGNhbWVyYS5fY2xhbXBab29tKHpvb20pICE9PSBjYW1lcmEuem9vbSkgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYVJlY3QgPSBjYW1lcmEudmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYUZPVlBvc2l0aW9uLnNldCh0aGlzLndoZWVsRXZlbnQuY2xpZW50WCAtIGNhbWVyYVJlY3QubGVmdCwgdGhpcy53aGVlbEV2ZW50LmNsaWVudFkgLSBjYW1lcmFSZWN0LnRvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2VuZVBvc2l0aW9uID0gY2FtZXJhLl9jb252ZXJ0Rk9WUG9zaXRpb25Ub1NjZW5lUG9zaXRpb24oY2FtZXJhRk9WUG9zaXRpb24sIGNhbWVyYS5wb3NpdGlvbiwgY2FtZXJhLmNlbnRlciwgY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzIHBvczogJywgc2NlbmVQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmZsb29yKG9yaWdpbi54KSAhPT0gTWF0aC5mbG9vcihzY2VuZVBvc2l0aW9uLngpIHx8IE1hdGguZmxvb3Iob3JpZ2luLnkpICE9PSBNYXRoLmZsb29yKHNjZW5lUG9zaXRpb24ueSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW4gPSBzY2VuZVBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgT2N1bG8uQW5pbWF0aW9uKGNhbWVyYSwgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnpvb21BdChvcmlnaW4sIHpvb20sIDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMub25Jbml0aWFsaXplKGFyZ3VtZW50c1swXSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI2JvdW5kc1xuICAgICogQHByb3BlcnR5IHtudWxsfGZ1bmN0aW9ufE9iamVjdH0gLSBUaGUgY2FtZXJhJ3MgYm91bmRzLiBUaGUgbWluaW11bSBhbmQgbWF4aW11bSBwb3NpdGlvbiB2YWx1ZXMgZm9yIHRoZSBjYW1lcmEuIFNldCB0byBudWxsIGlmIG5vIGJvdW5kcyBhcmUgZGVzaXJlZC5cbiAgICAqXG4gICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcyBhIHN0b2NrIGJvdW5kczwvY2FwdGlvbj5cbiAgICAqIE9jdWxvLkNhbWVyYS5ib3VuZHMuV09STERcbiAgICAqXG4gICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcyBhIGJvdW5kcyBvYmplY3Q8L2NhcHRpb24+XG4gICAgKiB7IFxuICAgICogICBtaW5YOiAwLCBcbiAgICAqICAgbWluWTogMCwgXG4gICAgKiAgIG1heFg6IHRoaXMuc2NlbmUud2lkdGgsIFxuICAgICogICBtYXhZOiB0aGlzLnNjZW5lLmhlaWdodFxuICAgICogfVxuICAgICpcbiAgICAqIEBleGFtcGxlIDxjYXB0aW9uPkFzIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgYm91bmRzIG9iamVjdDwvY2FwdGlvbj5cbiAgICAqIGZ1bmN0aW9uICgpIHsgXG4gICAgKiAgIHZhciB0cmFuc2Zvcm1hdGlvbiA9IG5ldyBNYXRyaXgyKCkuc2NhbGUodGhpcy56b29tLCB0aGlzLnpvb20pLmdldEludmVyc2UoKTtcbiAgICAqICAgdmFyIG1pbiA9IG5ldyBWZWN0b3IyKCkuYWRkKHRoaXMuY2VudGVyKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pO1xuICAgICogICB2YXIgbWF4ID0gbmV3IFZlY3RvcjIodGhpcy5zY2VuZS5zY2FsZWRXaWR0aCwgdGhpcy5zY2VuZS5zY2FsZWRIZWlnaHQpLnN1YnRyYWN0KHRoaXMuY2VudGVyKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pO1xuICAgICogXG4gICAgKiAgIHJldHVybiB7XG4gICAgKiAgICAgbWluWDogbWluLngsXG4gICAgKiAgICAgbWluWTogbWluLnksXG4gICAgKiAgICAgbWF4WDogbWF4LngsXG4gICAgKiAgICAgbWF4WTogbWF4LnlcbiAgICAqICAgfVxuICAgICogfVxuICAgICovXG4gICAgZ2V0IGJvdW5kcyAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ib3VuZHM7XG4gICAgfVxuXG4gICAgc2V0IGJvdW5kcyAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fYm91bmRzID0gIXZhbHVlID8gbnVsbCA6IHZhbHVlO1xuICAgICAgICB0aGlzLl91cGRhdGVCb3VuZHMoKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjaGFzQm91bmRzXG4gICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhIGhhcyBib3VuZHMgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaGFzQm91bmRzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvdW5kcyAhPT0gbnVsbDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjaXNSb3RhdGVkXG4gICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhIGlzIHJvdGF0ZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNSb3RhdGVkICgpIHtcbiAgICAgICAgcmV0dXJuIChNYXRoLmFicyh0aGlzLnJvdGF0aW9uIC8gMzYwKSAlIDEpID4gMDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjaXNab29tZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaXMgem9vbWVkIG9yIG5vdC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IGlzWm9vbWVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuem9vbSAhPT0gMTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjcmF3T2Zmc2V0WFxuICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSBYIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGFueSBlZmZlY3RzIGFwcGxpZWQuXG4gICAgKi9cbiAgICBnZXQgcmF3T2Zmc2V0WCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhd09mZnNldC54O1xuICAgIH1cbiAgICBcbiAgICBzZXQgcmF3T2Zmc2V0WCAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5yYXdPZmZzZXQueCA9IHZhbHVlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNyYXdPZmZzZXRZXG4gICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIFkgb2Zmc2V0IG9mIHRoZSBjYW1lcmEncyB0b3AgbGVmdCBjb3JuZXIgcmVsYXRpdmUgdG8gdGhlIHNjZW5lIHdpdGhvdXQgYW55IGVmZmVjdHMgYXBwbGllZC5cbiAgICAqL1xuICAgIGdldCByYXdPZmZzZXRZICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3T2Zmc2V0Lnk7XG4gICAgfVxuICAgIFxuICAgIHNldCByYXdPZmZzZXRZICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnJhd09mZnNldC55ID0gdmFsdWU7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI3NjZW5lXG4gICAgKiBAcHJvcGVydHkge09jdWxvLlNjZW5lfSAtIFRoZSBhY3RpdmUgc2NlbmUuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBzY2VuZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjZW5lcy5hY3RpdmVTY2VuZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjdHJhbnNmb3JtYXRpb25cbiAgICAqIEBwcm9wZXJ0eSB7TWF0cml4Mn0gLSBUaGUgdHJhbnNmb3JtYXRpb24gb2YgdGhlIHNjZW5lLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgdHJhbnNmb3JtYXRpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDIoKS5zY2FsZSh0aGlzLnpvb20sIHRoaXMuem9vbSkucm90YXRlKF9NYXRoLmRlZ1RvUmFkKC10aGlzLnJvdGF0aW9uKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI3pvb21cbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBhbW91bnQgb2Ygem9vbS4gQSByYXRpbyB3aGVyZSAxID0gMTAwJS5cbiAgICAqIEByZWFkb25seVxuICAgICogQGRlZmF1bHQgMVxuICAgICovXG4gICAgZ2V0IHpvb20gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fem9vbTtcbiAgICB9XG4gICAgICAgIFxuICAgIHNldCB6b29tICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl96b29tID0gdGhpcy5fY2xhbXBab29tKHZhbHVlKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQm91bmRzKCk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAqIENsYW1wcyB0aGUgWCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgcG9zaXRpb24uXG4gICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgY2xhbXBlZCBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jbGFtcFBvc2l0aW9uWCAoeCkge1xuICAgICAgICBpZiAodGhpcy5fYm91bmRzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB4ID0gY2xhbXAoeCwgdGhpcy5taW5Qb3NpdGlvblgsIHRoaXMubWF4UG9zaXRpb25YKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xhbXBzIHRoZSBZIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSBwb3NpdGlvbi5cbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBjbGFtcGVkIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NsYW1wUG9zaXRpb25ZICh5KSB7XG4gICAgICAgIGlmICh0aGlzLl9ib3VuZHMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHkgPSBjbGFtcCh5LCB0aGlzLm1pblBvc2l0aW9uWSwgdGhpcy5tYXhQb3NpdGlvblkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbGFtcHMgdGhlIHpvb20uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gVGhlIHpvb20uXG4gICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgY2xhbXBlZCB6b29tLlxuICAgICovXG4gICAgX2NsYW1wWm9vbSAoem9vbSkge1xuICAgICAgICByZXR1cm4gY2xhbXAoem9vbSwgdGhpcy5taW5ab29tLCB0aGlzLm1heFpvb20pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENvbnZlcnRzIGEgRk9WIHBvc2l0aW9uIHRvIGEgc2NlbmUgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhRk9WUG9zaXRpb24gLSBUaGUgcG9pbnQgaW4gdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhUG9zaXRpb24gLSBUaGUgY2FtZXJhJ3MgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUNlbnRlciAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gdHJhbnNmb3JtYXRpb24gLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBzY2VuZSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0Rk9WUG9zaXRpb25Ub1NjZW5lUG9zaXRpb24gKGNhbWVyYUZPVlBvc2l0aW9uLCBjYW1lcmFQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICByZXR1cm4gY2FtZXJhUG9zaXRpb24uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KGNhbWVyYUNlbnRlci5jbG9uZSgpLnN1YnRyYWN0KGNhbWVyYUZPVlBvc2l0aW9uKSkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uLmdldEludmVyc2UoKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBzY2VuZSBwb3NpdGlvbiB0byBhIEZPViBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBzY2VuZVBvc2l0aW9uIC0gVGhlIHJhdyBwb2ludCBvbiB0aGUgc2NlbmUuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYVBvc2l0aW9uIC0gVGhlIGNhbWVyYSdzIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHRyYW5zZm9ybWF0aW9uIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgRk9WIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NvbnZlcnRTY2VuZVBvc2l0aW9uVG9GT1ZQb3NpdGlvbiAoc2NlbmVQb3NpdGlvbiwgY2FtZXJhUG9zaXRpb24sIGNhbWVyYUNlbnRlciwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIGNhbWVyYUNlbnRlci5jbG9uZSgpLmFkZChzY2VuZVBvc2l0aW9uLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdChjYW1lcmFQb3NpdGlvbi5jbG9uZSgpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbikpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb252ZXJ0cyBhIHNjZW5lIHBvc2l0aW9uIGxvY2F0ZWQgYXQgYSBGT1YgcG9zaXRpb24gdG8gYSBjYW1lcmEgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gc2NlbmVQb3NpdGlvbiAtIFRoZSByYXcgcG9pbnQgb24gdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFGT1ZQb3NpdGlvbiAtIFRoZSBwb2ludCBpbiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSB0cmFuc2Zvcm1hdGlvbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIGNhbWVyYSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0U2NlbmVQb3NpdGlvblRvQ2FtZXJhUG9zaXRpb24gKHNjZW5lUG9zaXRpb24sIGNhbWVyYUZPVlBvc2l0aW9uLCBjYW1lcmFDZW50ZXIsIHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybU9yaWdpbk9mZnNldCA9IHRoaXMuX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCh0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgdmFyIG9mZnNldCA9IHNjZW5lUG9zaXRpb24uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KHRyYW5zZm9ybU9yaWdpbk9mZnNldCkuc3VidHJhY3QoY2FtZXJhRk9WUG9zaXRpb24pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbihvZmZzZXQsIGNhbWVyYUNlbnRlciwgdHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBjYW1lcmEgb2Zmc2V0IHRvIGEgY2FtZXJhIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYU9mZnNldCAtIFRoZSBjYW1lcmEncyBvZmZzZXQgb24gdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSB0cmFuc2Zvcm1hdGlvbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIGNhbWVyYSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbiAoY2FtZXJhT2Zmc2V0LCBjYW1lcmFDZW50ZXIsIHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybU9yaWdpbk9mZnNldCA9IHRoaXMuX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCh0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKTtcblxuICAgICAgICByZXR1cm4gY2FtZXJhT2Zmc2V0LmNsb25lKCkuYWRkKHRyYW5zZm9ybU9yaWdpbk9mZnNldCkuYWRkKGNhbWVyYUNlbnRlcikudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uLmdldEludmVyc2UoKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBjYW1lcmEgcG9zaXRpb24gdG8gYSBjYW1lcmEgb2Zmc2V0LlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYVBvc2l0aW9uIC0gVGhlIGNhbWVyYSdzIHBvc2l0aW9uIG9uIHRoZSBzY2VuZS5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhQ2VudGVyIC0gVGhlIGNlbnRlciBvZiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB0cmFuc2Zvcm1PcmlnaW4gLSBUaGUgdHJhbnNmb3JtIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gdHJhbnNmb3JtYXRpb24gLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBjYW1lcmEgb2Zmc2V0LlxuICAgICovXG4gICAgX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0IChjYW1lcmFQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCB0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKSB7XG4gICAgICAgIHZhciB0cmFuc2Zvcm1PcmlnaW5PZmZzZXQgPSB0aGlzLl9nZXRUcmFuc2Zvcm1PcmlnaW5PZmZzZXQodHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbik7XG5cbiAgICAgICAgcmV0dXJuIGNhbWVyYVBvc2l0aW9uLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdCh0cmFuc2Zvcm1PcmlnaW5PZmZzZXQpLnN1YnRyYWN0KGNhbWVyYUNlbnRlcik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgb2Zmc2V0IG9mIHRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHRyYW5zZm9ybWF0aW9uIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgb2Zmc2V0LlxuICAgICovXG4gICAgX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCAodHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtT3JpZ2luLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdCh0cmFuc2Zvcm1PcmlnaW4pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlc2V0cyB0aGUgY2FtZXJhIHRvIHRoZSBkZWZhdWx0IHN0YXRlLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfcmVzZXQgKCkge1xuICAgICAgICB0aGlzLnRyYW5zZm9ybU9yaWdpbi5zZXQoMCwgMCk7XG4gICAgICAgIHRoaXMucm90YXRpb24gPSAwO1xuICAgICAgICB0aGlzLnpvb20gPSAxO1xuICAgICAgICB0aGlzLl9yYXN0ZXJTY2FsZSA9IDE7XG4gICAgICAgIHRoaXMuc2V0UmF3UG9zaXRpb24obmV3IFZlY3RvcjIodGhpcy53aWR0aCAqIDAuNSwgdGhpcy5oZWlnaHQgKiAwLjUpKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFVwZGF0ZXMgdGhlIGJvdW5kcy5cbiAgICAqXG4gICAgKiByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfdXBkYXRlQm91bmRzICgpIHsgXG4gICAgICAgIHZhciBib3VuZHM7XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5zY2VuZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2JvdW5kcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbWluWDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWluWTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWF4WDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWF4WTogbnVsbFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2JvdW5kcykpIHtcbiAgICAgICAgICAgICAgICBib3VuZHMgPSB0aGlzLl9ib3VuZHMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHRoaXMuX2JvdW5kcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5taW5Qb3NpdGlvblggPSBib3VuZHMubWluWDtcbiAgICAgICAgICAgIHRoaXMubWluUG9zaXRpb25ZID0gYm91bmRzLm1pblk7XG4gICAgICAgICAgICB0aGlzLm1heFBvc2l0aW9uWCA9IGJvdW5kcy5tYXhYO1xuICAgICAgICAgICAgdGhpcy5tYXhQb3NpdGlvblkgPSBib3VuZHMubWF4WTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRSYXdQb3NpdGlvbih0aGlzLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbih0aGlzLnJhd09mZnNldCwgdGhpcy5jZW50ZXIsIHRoaXMudHJhbnNmb3JtT3JpZ2luLCB0aGlzLnRyYW5zZm9ybWF0aW9uKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRPRE86IEZvciBkZXYgb25seVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3VwZGF0ZSBib3VuZHMnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhbiBhbmltYXRpb24gdG8gdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLkFuaW1hdGlvbk1hbmFnZXIuYWRkXG4gICAgKiByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBhZGRBbmltYXRpb24gKG5hbWUsIGFuaW1hdGlvbikge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKG5hbWUsIGFuaW1hdGlvbik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGFuIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLkFuaW1hdGlvbk1hbmFnZXIuZ2V0XG4gICAgKi9cbiAgICBnZXRBbmltYXRpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5pbWF0aW9ucy5nZXQobmFtZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhIHNjZW5lIHRvIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHNlZSBPY3Vsby5TY2VuZU1hbmFnZXIuYWRkXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgYWRkU2NlbmUgKG5hbWUsIHNjZW5lKSB7XG4gICAgICAgIHRoaXMuc2NlbmVzLmFkZChuYW1lLCBzY2VuZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGEgc2NlbmUuXG4gICAgKlxuICAgICogQHNlZSBPY3Vsby5TY2VuZU1hbmFnZXIuZ2V0XG4gICAgKi9cbiAgICBnZXRTY2VuZSAobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2VuZXMuZ2V0KG5hbWUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIGFjdGl2ZSBzY2VuZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzY2VuZS5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRTY2VuZSAobmFtZSkge1xuICAgICAgICB0aGlzLnNjZW5lcy5zZXRBY3RpdmVTY2VuZShuYW1lKTtcbiAgICAgICAgdGhpcy5fcmVzZXQoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgY2FtZXJhIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgaWYgKHRoaXMudmlldyAmJiB0aGlzLnZpZXcucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgdGhpcy52aWV3LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy52aWV3KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuc2NlbmVzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ldmVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyBkcmFnLXRvLW1vdmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGVEcmFnVG9Nb3ZlICgpIHtcbiAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGlzYWJsZURyYWcoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyBkcmFnLXRvLW1vdmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZURyYWdUb01vdmUgKCkge1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgd2hlZWwtdG8tem9vbS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGlzYWJsZVdoZWVsVG9ab29tICgpIHtcbiAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGlzYWJsZVdoZWVsKCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEVuYWJsZXMgd2hlZWwtdG8tem9vbS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlV2hlZWxUb1pvb20gKCkge1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5lbmFibGVXaGVlbCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbWVyYSBoYXMgYmVlbiBpbml0aWFsaXplZC4gVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMgYSBuby1vcC4gT3ZlcnJpZGUgdGhpcyBmdW5jdGlvbiB3aXRoIHlvdXIgb3duIGNvZGUuXG4gICAgKlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIFRoZSBvcHRpb25zIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3Igd2hlbiB0aGUgY2FtZXJhIHdhcyBjcmVhdGVkLlxuICAgICovXG4gICAgb25Jbml0aWFsaXplIChvcHRpb25zKSB7XG4gICAgICAgIFxuICAgIH1cblxuICAgIC8qKlxuICAgICogQ2FsbGVkIGJlZm9yZSB0aGUgY2FtZXJhIGhhcyByZW5kZXJlZC4gVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMgYSBuby1vcC4gT3ZlcnJpZGUgdGhpcyBmdW5jdGlvbiB3aXRoIHlvdXIgb3duIGNvZGUuXG4gICAgKi9cbiAgICBvbkJlZm9yZVJlbmRlciAoKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIENhbGxlZCBhZnRlciB0aGUgY2FtZXJhIGhhcyByZW5kZXJlZC4gVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMgYSBuby1vcC4gT3ZlcnJpZGUgdGhpcyBmdW5jdGlvbiB3aXRoIHlvdXIgb3duIGNvZGUuXG4gICAgKi9cbiAgICBvblJlbmRlciAoKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFJlbmRlciB0aGUgY2FtZXJhIHZpZXcuIElmIHlvdSBuZWVkIHRvIG1hbmlwdWxhdGUgaG93IHRoZSBjYW1lcmEgcmVuZGVycywgdXNlIHtAbGluayBDYW1lcmEjb25CZWZvcmVSZW5kZXJ8b25CZWZvcmVSZW5kZXJ9IGFuZCB7QGxpbmsgQ2FtZXJhI29uUmVuZGVyfG9uUmVuZGVyfS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7Q2FtZXJhfSBUaGUgdmlldy5cbiAgICAqL1xuICAgIHJlbmRlciAoKSB7XG4gICAgICAgIHRoaXMub25CZWZvcmVSZW5kZXIoKTtcblxuICAgICAgICBpZiAoIXRoaXMuaXNSZW5kZXJlZCkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXJTaXplKCk7XG4gICAgICAgICAgICB0aGlzLmlzUmVuZGVyZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcigpO1xuICAgICAgICB0aGlzLm9uUmVuZGVyKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBwb3NpdGlvbiAtIFRoZSBuZXcgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IGVuZm9yY2VCb3VuZHMgLSBXaGV0aGVyIHRvIGVuZm9yY2UgYm91bmRzIG9yIG5vdC5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRQb3NpdGlvbiAocG9zaXRpb24sIGVuZm9yY2VCb3VuZHMgPSB0cnVlKSB7XG4gICAgICAgIGlmIChlbmZvcmNlQm91bmRzKSB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLnNldCh0aGlzLl9jbGFtcFBvc2l0aW9uWChwb3NpdGlvbi54KSwgdGhpcy5fY2xhbXBQb3NpdGlvblkocG9zaXRpb24ueSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi5zZXQocG9zaXRpb24ueCwgcG9zaXRpb24ueSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHJhdyBwb3NpdGlvbiBhbmQgdXBkYXRlcyBkZXBlbmRlbnQgZGF0YS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHBvc2l0aW9uIC0gVGhlIG5ldyBwb3NpdGlvbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRSYXdQb3NpdGlvbiAocG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5yYXdQb3NpdGlvbi5zZXQodGhpcy5fY2xhbXBQb3NpdGlvblgocG9zaXRpb24ueCksIHRoaXMuX2NsYW1wUG9zaXRpb25ZKHBvc2l0aW9uLnkpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi5jb3B5KHRoaXMucmF3UG9zaXRpb24pO1xuICAgICAgICB0aGlzLnJhd09mZnNldC5jb3B5KHRoaXMuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRoaXMucmF3UG9zaXRpb24sIHRoaXMuY2VudGVyLCB0aGlzLnRyYW5zZm9ybU9yaWdpbiwgdGhpcy50cmFuc2Zvcm1hdGlvbikpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgc2l6ZSBvZiB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gd2lkdGggLSBUaGUgd2lkdGguXG4gICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IGhlaWdodCAtIFRoZSBoZWlnaHQuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0U2l6ZSAod2lkdGgsIGhlaWdodCkge1xuICAgICAgICB2YXIgaGFzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFpc05pbCh3aWR0aCkgJiYgKHdpZHRoICE9PSB0aGlzLndpZHRoKSkge1xuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgdGhpcy5jZW50ZXIueCA9IHdpZHRoICogMC41O1xuICAgICAgICAgICAgaGFzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghaXNOaWwoaGVpZ2h0KSAmJiAoaGVpZ2h0ICE9PSB0aGlzLmhlaWdodCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5jZW50ZXIueSA9IGhlaWdodCAqIDAuNTtcbiAgICAgICAgICAgIGhhc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaGFzQ2hhbmdlZCkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXJTaXplKCk7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMuZW1pdCgnY2hhbmdlOnNpemUnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdHJhbnNmb3JtT3JpZ2luLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IG9yaWdpbiAtIFRoZSBvcmlnaW4uXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0VHJhbnNmb3JtT3JpZ2luIChvcmlnaW4pIHtcbiAgICAgICAgaWYgKG9yaWdpbiAmJiAhb3JpZ2luLmVxdWFscyh0aGlzLnRyYW5zZm9ybU9yaWdpbikpIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtT3JpZ2luLmNvcHkob3JpZ2luKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNSb3RhdGVkIHx8IHRoaXMuaXNab29tZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJhd09mZnNldC5jb3B5KHRoaXMuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRoaXMucmF3UG9zaXRpb24sIHRoaXMuY2VudGVyLCB0aGlzLnRyYW5zZm9ybU9yaWdpbiwgdGhpcy50cmFuc2Zvcm1hdGlvbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXVzZXMgdGhlIGNhbWVyYSBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcGF1c2UgKCkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGF1c2UoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFBsYXlzIHRoZSBjYW1lcmEgYW5pbWF0aW9uIGZvcndhcmQgZnJvbSB0aGUgY3VycmVudCBwbGF5aGVhZCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwbGF5IChhbmltYXRpb24pIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXN1bWVzIHBsYXlpbmcgdGhlIGNhbWVyYSBhbmltYXRpb24gZnJvbSB0aGUgY3VycmVudCBwbGF5aGVhZCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZXN1bWUgKCkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucmVzdW1lKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmV2ZXJzZXMgcGxheWJhY2sgb2YgYW4gYW5pbWF0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV0gLSBUaGUgbmFtZSBvZiB0aGUgYW5pbWF0aW9uLiBJZiBub25lIGlzIHNwZWNpZmllZCwgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIHdpbGwgYmUgcmV2ZXJzZWQuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcmV2ZXJzZSAobmFtZSkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucmV2ZXJzZShuYW1lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgYW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jYW5pbWF0ZXxBbmltYXRpb24uYW5pbWF0ZX1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBhbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS5hbmltYXRlKHByb3BzLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IG1vdmUgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI21vdmVUb3xBbmltYXRpb24ubW92ZVRvfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIG1vdmVUbyAocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcywgb3B0aW9ucykubW92ZVRvKHBvc2l0aW9uLCBkdXJhdGlvbikpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHJvdGF0ZSBhdCB0aGUgc3BlY2lmaWVkIGxvY2F0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jcm90YXRlQXR8QW5pbWF0aW9uLnJvdGF0ZUF0fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJvdGF0ZUF0IChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMsIG9wdGlvbnMpLnJvdGF0ZUF0KG9yaWdpbiwgcm90YXRpb24sIGR1cmF0aW9uKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgcm90YXRlIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jcm90YXRlVG98QW5pbWF0aW9uLnJvdGF0ZVRvfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJvdGF0ZVRvIChyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzLCBvcHRpb25zKS5yb3RhdGVUbyhyb3RhdGlvbiwgZHVyYXRpb24pKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSBzaGFrZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jc2hha2V8QW5pbWF0aW9uLnNoYWtlfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNoYWtlIChpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS5zaGFrZShpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSB6b29tIGluL291dCBhdCBhIHNwZWNpZmljIGxvY2F0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jem9vbUF0fEFuaW1hdGlvbi56b29tQXR9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgem9vbUF0IChvcmlnaW4sIHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcywgb3B0aW9ucykuem9vbUF0KG9yaWdpbiwgem9vbSwgZHVyYXRpb24pKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSB6b29tIGluL291dCBhdCB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI3pvb21Ub3xBbmltYXRpb24uem9vbVRvfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHpvb21UbyAoem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzLCBvcHRpb25zKS56b29tVG8oem9vbSwgZHVyYXRpb24pKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuQ2FtZXJhLmJvdW5kcyA9IHtcbiAgICBOT05FOiBudWxsLFxuICAgIFdPUkxEOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0cmFuc2Zvcm1hdGlvbiA9IG5ldyBNYXRyaXgyKCkuc2NhbGUodGhpcy56b29tLCB0aGlzLnpvb20pLmdldEludmVyc2UoKTtcbiAgICAgICAgdmFyIG1pbiA9IG5ldyBWZWN0b3IyKCkuYWRkKHRoaXMuY2VudGVyKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pO1xuICAgICAgICB2YXIgbWF4ID0gbmV3IFZlY3RvcjIodGhpcy5zY2VuZS5zY2FsZWRXaWR0aCwgdGhpcy5zY2VuZS5zY2FsZWRIZWlnaHQpLnN1YnRyYWN0KHRoaXMuY2VudGVyKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5YOiBtaW4ueCxcbiAgICAgICAgICAgIG1pblk6IG1pbi55LFxuICAgICAgICAgICAgbWF4WDogbWF4LngsXG4gICAgICAgICAgICBtYXhZOiBtYXgueVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgV09STERfRURHRTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluWDogMCxcbiAgICAgICAgICAgIG1pblk6IDAsXG4gICAgICAgICAgICBtYXhYOiB0aGlzLnNjZW5lLndpZHRoLFxuICAgICAgICAgICAgbWF4WTogdGhpcy5zY2VuZS5oZWlnaHRcbiAgICAgICAgfTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgQ2FtZXJhOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG4vKipcbiogT2JqZWN0IHR5cGVzLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbmV4cG9ydCBjb25zdCBUeXBlID0ge1xuICAgIEFOSU1BVElPTjogMFxufVxuXG4vKipcbiogWm9vbSBkaXJlY3Rpb24uXG4qIEBlbnVtIHtudW1iZXJ9XG4qL1xuZXhwb3J0IGNvbnN0IHpvb21EaXJlY3Rpb24gPSB7XG4gICAgTk9ORTogMCxcbiAgICBJTjogMSxcbiAgICBPVVQ6IC0xXG59OyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgcm91bmQgICAgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL3JvdW5kJztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5DU1NSZW5kZXJlclxuKiBAY29uc3RydWN0b3JcbipcbiogQGV4YW1wbGVcbiogdmFyIG15UmVuZGVyZXIgPSBuZXcgQ1NTUmVuZGVyZXIobXlDYW1lcmEpO1xuKi9cbmNsYXNzIENTU1JlbmRlcmVyIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIFRoZSBjYW1lcmEuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSByZW5kZXJlciBhbmQgcHJlcGFyZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlbmRlciB0aGUgc2NlbmUuXG4gICAgKlxuICAgICogcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcmVuZGVyICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FtZXJhLnNjZW5lICYmIHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3KSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5jYW1lcmEuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRoaXMuY2FtZXJhLnBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbiwgdGhpcy5jYW1lcmEudHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgdmFyIHJhc3RlckluY3JlbWVudCA9IDAuMztcbiAgICAgICAgICAgIHZhciBzY2FsZUxldmVsID0gTWF0aC5mbG9vcih0aGlzLmNhbWVyYS56b29tKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ29udHJvbCByYXN0ZXJpemF0aW9uIHRvIG1haW50YWluIGNsYXJpdHkgd2hlbiB6b29taW5nXG4gICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuem9vbSA9PT0gdGhpcy5jYW1lcmEubWF4Wm9vbSB8fCAodGhpcy5jYW1lcmEuem9vbURpcmVjdGlvbiA9PT0gem9vbURpcmVjdGlvbi5JTiAmJiB0aGlzLmNhbWVyYS56b29tID4gdGhpcy5jYW1lcmEuX3Jhc3RlclNjYWxlICsgcmFzdGVySW5jcmVtZW50ICogc2NhbGVMZXZlbCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuX3Jhc3RlclNjYWxlID0gdGhpcy5jYW1lcmEuem9vbTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zY2VuZXMudmlldy5zdHlsZS53aWxsQ2hhbmdlID0gJ2F1dG8nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2NlbmVzLnZpZXcuc3R5bGUud2lsbENoYW5nZSA9ICd0cmFuc2Zvcm0nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5zY2VuZS52aWV3LnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICBUd2VlbkxpdGUuc2V0KHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3LCB7IFxuICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1PcmlnaW46IHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi54ICsgJ3B4ICcgKyB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4ueSArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlWDogdGhpcy5jYW1lcmEuem9vbSxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVZOiB0aGlzLmNhbWVyYS56b29tLFxuICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogLXRoaXMuY2FtZXJhLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICB4OiAtb2Zmc2V0LngsXG4gICAgICAgICAgICAgICAgICAgIHk6IC1vZmZzZXQueVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmVuZGVyIHRoZSBkaW1lbnNpb25zL3NpemUuXG4gICAgKlxuICAgICogcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcmVuZGVyU2l6ZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmNhbWVyYS52aWV3KSB7XG4gICAgICAgICAgICBUd2VlbkxpdGUuc2V0KHRoaXMuY2FtZXJhLnZpZXcsIHsgXG4gICAgICAgICAgICAgICAgY3NzOiB7IFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuY2FtZXJhLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMuY2FtZXJhLndpZHRoXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENTU1JlbmRlcmVyOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG4vKipcbiogR1NBUCdzIERyYWdnYWJsZS5cbiogQGV4dGVybmFsIERyYWdnYWJsZVxuKiBAc2VlIGh0dHA6Ly9ncmVlbnNvY2suY29tL2RvY3MvIy9IVE1MNS9HU0FQL1V0aWxzL0RyYWdnYWJsZS9cbiovXG5cbmltcG9ydCBVdGlscyBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLkRyYWdDb250cm9sXG4qIEBjb25zdHJ1Y3RvclxuKiBAcmVxdWlyZXMge0BsaW5rIGV4dGVybmFsOkRyYWdnYWJsZX1cbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gdGFyZ2V0IC0gVGhlIHRhcmdldC5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4qIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IFtvcHRpb25zLmRyYWdQcm94eV0gLSBUaGUgZWxlbWVudCB0aGF0IGNvbnRyb2xzL2luaXRpYXRlcyB0aGUgZHJhZyBldmVudHMuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uRHJhZ10gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSBkcmFnIGV2ZW50IG9jY3Vycy5cbiogQHBhcmFtIHthcnJheX0gW29wdGlvbnMub25EcmFnUGFyYW1zXSAtIFRoZSBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIGNhbGxiYWNrLlxuKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMub25EcmFnU2NvcGVdIC0gV2hhdCAndGhpcycgcmVmZXJzIHRvIGluc2lkZSB0aGUgY2FsbGJhY2suXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteURyYWdDb250cm9sID0gbmV3IE9jdWxvLkRyYWdDb250cm9sKCcjc2NlbmUnLCB7ICBcbiogICBvbkRyYWc6IGZ1bmN0aW9uICgpIHsgXG4qICAgICBjb25zb2xlLmxvZygnZHJhZ2dpbmcnKTsgXG4qICAgfVxuKiB9KTtcbiovXG5jbGFzcyBEcmFnQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IgKHRhcmdldCwge1xuICAgICAgICBkcmFnUHJveHkgPSB0YXJnZXQsXG4gICAgICAgIG9uRHJhZyA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBvbkRyYWdQYXJhbXMgPSBbXSxcbiAgICAgICAgb25EcmFnU2NvcGUgPSB0aGlzXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBjb25maWd1cmF0aW9uLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHsgZHJhZ1Byb3h5LCBvbkRyYWcsIG9uRHJhZ1BhcmFtcywgb25EcmFnU2NvcGUgfTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RHJhZ2dhYmxlfSAtIFRoZSBvYmplY3QgdGhhdCBoYW5kbGVzIHRoZSBkcmFnIGJlaGF2aW9yLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbnRyb2wgPSBuZXcgRHJhZ2dhYmxlKHRhcmdldCwge1xuICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogb25EcmFnU2NvcGUsXG4gICAgICAgICAgICBvbkRyYWc6IG9uRHJhZyxcbiAgICAgICAgICAgIG9uRHJhZ1BhcmFtczogb25EcmFnUGFyYW1zLFxuICAgICAgICAgICAgekluZGV4Qm9vc3Q6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSBlbGVtZW50IHRoYXQgY29udHJvbHMvaW5pdGlhdGVzIHRoZSBkcmFnIGV2ZW50cy5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kcmFnUHJveHkgPSBVdGlscy5ET00ucGFyc2VWaWV3KGRyYWdQcm94eSk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciBpdCBpcyBkcmFnZ2luZyBvciBub3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGl0IGlzIHByZXNzZWQgb3Igbm90LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkRyYWdzdGFydCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uRHJhZ1JlbGVhc2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VuZERyYWcoZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25EcmFnTGVhdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VuZERyYWcoZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25EcmFnTW92ZSA9IChldmVudCkgPT4geyBcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUHJlc3NlZCAmJiAhdGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cm9sLnN0YXJ0RHJhZyhldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX2VuZERyYWcgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2wuZW5kRHJhZyhldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLl9vbkRyYWdMZWF2ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fb25EcmFnTW92ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuX29uRHJhZ01vdmUpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblByZXNzID0gKGV2ZW50KSA9PiB7IFxuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuX29uRHJhZ0xlYXZlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uRHJhZ01vdmUpO1xuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLl9vbkRyYWdNb3ZlKTtcbiAgICAgICAgICAgIHRoaXMuaXNQcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uUmVsZWFzZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVsZWFzZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25MZWF2ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVsZWFzZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmVsZWFzZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNQcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVuYWJsZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBlbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC5lbmFibGVkKCk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtPYmplY3R9IC0gVGhlIGxhc3QgcG9pbnRlciBldmVudCB0aGF0IGFmZmVjdGVkIHRoZSBpbnN0YW5jZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHBvaW50ZXJFdmVudCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wucG9pbnRlckV2ZW50O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB4IHBvc2l0aW9uIG9mIHRoZSBsYXN0IHBvaW50ZXIgZXZlbnQgdGhhdCBhZmZlY3RlZCB0aGUgaW5zdGFuY2UuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBwb2ludGVyWCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wucG9pbnRlclg7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHkgcG9zaXRpb24gb2YgdGhlIGxhc3QgcG9pbnRlciBldmVudCB0aGF0IGFmZmVjdGVkIHRoZSBpbnN0YW5jZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHBvaW50ZXJZICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC5wb2ludGVyWTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge0VsZW1lbnR9IC0gVGhlIHRhcmdldC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHRhcmdldCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wudGFyZ2V0O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBjdXJyZW50IHggcG9zaXRpb24uXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB4ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC54O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBjdXJyZW50IHkgcG9zaXRpb24uXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB5ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC55O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBjb250cm9sIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuY29udHJvbC5raWxsKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0ge307XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIHRoZSBjb250cm9sLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlICgpIHtcbiAgICAgICAgdGhpcy5jb250cm9sLmRpc2FibGUoKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnc3RhcnQpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vblByZXNzKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLl9vbkxlYXZlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX29uUHJlc3MpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuc3R5bGUuY3Vyc29yID0gbnVsbDtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBFbmFibGVzIHRoZSBjb250cm9sLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBlbmFibGUgKCkge1xuICAgICAgICB0aGlzLmNvbnRyb2wuZW5hYmxlKCk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuX29uRHJhZ3N0YXJ0KTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25QcmVzcyk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5fb25MZWF2ZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblByZXNzKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnN0eWxlLmN1cnNvciA9ICdtb3ZlJztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogVXBkYXRlcyB0aGUgY29udHJvbCdzIHggYW5kIHkgcHJvcGVydGllcyB0byByZWZsZWN0IHRoZSB0YXJnZXQncyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgdXBkYXRlICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC51cGRhdGUoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IERyYWdDb250cm9sOyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4qIEEgY29sbGVjdGlvbiBvZiB1c2VmdWwgbWF0aGVtYXRpY2FsIHZhbHVlcyBhbmQgZnVuY3Rpb25zLlxuKlxuKiBAbmFtZXNwYWNlIE9jdWxvLk1hdGhcbiovXG5jb25zdCBfTWF0aCA9IHtcbiAgICAvKipcbiAgICAqIENvbnZlcnQgZGVncmVlcyB0byByYWRpYW5zLlxuICAgICpcbiAgICAqIEBmdW5jdGlvbiBPY3Vsby5NYXRoI2RlZ1RvUmFkXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZGVncmVlcyAtIFRoZSBkZWdyZWVzIHZhbHVlLlxuICAgICogQHJldHVybiB7bnVtYmVyfSAtIFRoZSB2YWx1ZSBpbiByYWRpYW5zLlxuICAgICovXG4gICAgZGVnVG9SYWQ6IChkZWdyZWVzKSA9PiB7XG4gICAgICAgIHJldHVybiBkZWdyZWVzICogX01hdGguZGVnVG9SYWRGYWN0b3I7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICogQ29udmVydCByYWRpYW5zIHRvIGRlZ3JlZXMuXG4gICAgKlxuICAgICogQGZ1bmN0aW9uIE9jdWxvLk1hdGgjcmFkVG9EZWdcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSByYWRpYW5zIC0gVGhlIHJhZGlhbnMgdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gVGhlIHZhbHVlIGluIGRlZ3JlZXMuXG4gICAgKi9cbiAgICByYWRUb0RlZzogKHJhZGlhbnMpID0+IHtcbiAgICAgICAgcmV0dXJuIHJhZGlhbnMgKiBfTWF0aC5yYWRUb0RlZ0ZhY3RvcjtcbiAgICB9XG59O1xuXG4vKipcbiogVGhlIGZhY3RvciB1c2VkIHRvIGNvbnZlcnQgZGVncmVlcyB0byByYWRpYW5zLlxuKlxuKiBAbmFtZSBPY3Vsby5NYXRoI2RlZ1RvUmFkRmFjdG9yXG4qIEBwcm9wZXJ0eSB7bnVtYmVyfVxuKiBAc3RhdGljXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KF9NYXRoLCAnZGVnVG9SYWRGYWN0b3InLCB7XG4gICAgdmFsdWU6IE1hdGguUEkgLyAxODBcbn0pO1xuXG4vKipcbiogVGhlIGZhY3RvciB1c2VkIHRvIGNvbnZlcnQgcmFkaWFucyB0byBkZWdyZWVzLlxuKlxuKiBAbmFtZSBPY3Vsby5NYXRoI3JhZFRvRGVnRmFjdG9yXG4qIEBwcm9wZXJ0eSB7bnVtYmVyfVxuKiBAc3RhdGljXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KF9NYXRoLCAncmFkVG9EZWdGYWN0b3InLCB7XG4gICAgdmFsdWU6IDE4MCAvIE1hdGguUElcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBfTWF0aDsiLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBpc0FycmF5TGlrZSBmcm9tICdsb2Rhc2gvaXNBcnJheUxpa2UnO1xuXG4vKipcbiogQ3JlYXRlIDJ4MiBtYXRyaXggZnJvbSBhIHNlcmllcyBvZiB2YWx1ZXMuXG4qIFxuKiBSZXByZXNlbnRlZCBsaWtlOlxuKiBcbiogfCBlMTEgfCBlMTIgfFxuKiB8IGUyMSB8IGUyMiB8XG4qXG4qIEBjbGFzcyBPY3Vsby5NYXRyaXgyXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge251bWJlcn0gZTExPTEgLSBUaGUgdmFsdWUgb2Ygcm93IDEsIGNvbHVtbiAxXG4qIEBwYXJhbSB7bnVtYmVyfSBlMTI9MCAtIFRoZSB2YWx1ZSBvZiByb3cgMSwgY29sdW1uIDJcbiogQHBhcmFtIHtudW1iZXJ9IGUyMT0wIC0gVGhlIHZhbHVlIG9mIHJvdyAyLCBjb2x1bW4gMVxuKiBAcGFyYW0ge251bWJlcn0gZTIyPTEgLSBUaGUgdmFsdWUgb2Ygcm93IDIsIGNvbHVtbiAyXG4qL1xuY2xhc3MgTWF0cml4MiB7XG4gICAgY29uc3RydWN0b3IgKGUxMSwgZTEyLCBlMjEsIGUyMikge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gZTExXG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lMTEgPSAxO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGUxMlxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZTEyID0gMDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlMjFcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmUyMSA9IDA7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gZTIyXG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lMjIgPSAxO1xuICAgICAgICBcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGUxMSwgZTEyLCBlMjEsIGUyMik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNBcnJheUxpa2UoZTExKSAmJiBlMTEubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICB0aGlzLnNldEZyb21BcnJheShlMTEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xvbmVzIHRoZSBtYXRyaXguXG4gICAgKiB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXggdG8gY2xvbmUuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBpZGVudGljYWwgbWF0cml4LlxuICAgICovXG4gICAgc3RhdGljIGNsb25lIChtKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4MihNYXRyaXgyLnRvQXJyYXkobSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsb25lcyB0aGUgbWF0cml4LlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgaWRlbnRpY2FsIG1hdHJpeC5cbiAgICAqL1xuICAgIGNsb25lICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuY2xvbmUodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29waWVzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgcHJvdmlkZWQgbWF0cml4IGludG8gdGhpcyBtYXRyaXguXG4gICAgKiB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXggdG8gY29weS5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGNvcHkgKG0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KG0uZTExLCBtLmUxMiwgbS5lMjEsIG0uZTIyKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBkZXRlcm1pbmFudC5cbiAgICAqIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeCB0byBnZXQgdGhlIGRldGVybWluYW50LlxuICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgZGV0ZXJtaW5hbnQuXG4gICAgKi9cbiAgICBzdGF0aWMgZ2V0RGV0ZXJtaW5hbnQgKG0pIHtcbiAgICAgICAgcmV0dXJuIG0uZTExICogbS5lMjIgLSBtLmUxMiAqIG0uZTIxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGRldGVybWluYW50LlxuICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgZGV0ZXJtaW5hbnQuXG4gICAgKi9cbiAgICBnZXREZXRlcm1pbmFudCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldERldGVybWluYW50KHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGludmVyc2UuXG4gICAgKiB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXggdG8gZ2V0IHRoZSBpbnZlcnNlLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gVGhlIGludmVyc2UgbWF0cml4LlxuICAgICovXG4gICAgc3RhdGljIGdldEludmVyc2UgKG0pIHtcbiAgICAgICAgcmV0dXJuIE1hdHJpeDIubXVsdGlwbHlTY2FsYXIobmV3IE1hdHJpeDIobS5lMjIsIC1tLmUxMiwgLW0uZTIxLCBtLmUxMSksIDEgLyBNYXRyaXgyLmdldERldGVybWluYW50KG0pKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBpbnZlcnNlLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gVGhlIGludmVyc2UgbWF0cml4LlxuICAgICovXG4gICAgZ2V0SW52ZXJzZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldEludmVyc2UodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTXVsdGlwbGllcyB0d28gbWF0cmljZXMuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IGEgLSBBIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gYiAtIEFub3RoZXIgbWF0cml4LlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgbWF0cml4IHRoYXQgaXMgdGhlIHByb2R1Y3Qgb2YgdGhlIHByb3ZpZGVkIG1hdHJpY2VzLlxuICAgICovLyoqXG4gICAgKiBNdWx0aXBsaWVzIGEgbGlzdCBvZiBtYXRyaWNlcy5cbiAgICAqIEBwYXJhbSB7QXJyYXl9IG0gLSBBIGxpc3Qgb2YgbWF0cmljZXMuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBtYXRyaXggdGhhdCBpcyB0aGUgcHJvZHVjdCBvZiB0aGUgcHJvdmlkZWQgbWF0cmljZXMuXG4gICAgKi9cbiAgICBzdGF0aWMgbXVsdGlwbHlNYXRyaWNlcyAoYSwgYikge1xuICAgICAgICBpZiAoYS5jb2xzID09PSBiLnJvd3MpIHtcbiAgICAgICAgICAgIGxldCBuMTEsIG4xMiwgbjIxLCBuMjI7XG4gICAgICAgICBcbiAgICAgICAgICAgIG4xMSA9IGEuZTExICogYi5lMTEgKyBhLmUxMiAqIGIuZTIxO1xuICAgICAgICAgICAgbjEyID0gYS5lMTEgKiBiLmUxMiArIGEuZTEyICogYi5lMjI7XG4gICAgICAgICAgICBuMjEgPSBhLmUyMSAqIGIuZTExICsgYS5lMjIgKiBiLmUyMTtcbiAgICAgICAgICAgIG4yMiA9IGEuZTIxICogYi5lMTIgKyBhLmUyMiAqIGIuZTIyO1xuICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWF0cml4MihuMTEsIG4xMiwgbjIxLCBuMjIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbXVsdGlwbHkgaW5jb21wYXRpYmxlIG1hdHJpY2VzJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIHRoZSBtYXRyaXggYnkgYW5vdGhlciBtYXRyaXguXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ8TWF0cml4MkR9IG0gLSBBIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIG11bHRpcGx5TWF0cmljZXMgKG0pIHtcbiAgICAgICAgaWYgKHRoaXMuY29scyA9PT0gbS5yb3dzKSB7XG4gICAgICAgICAgICBsZXQgbjExLCBuMTIsIG4yMSwgbjIyO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBuMTEgPSB0aGlzLmUxMSAqIG0uZTExICsgdGhpcy5lMTIgKiBtLmUyMTtcbiAgICAgICAgICAgIG4xMiA9IHRoaXMuZTExICogbS5lMTIgKyB0aGlzLmUxMiAqIG0uZTIyO1xuICAgICAgICAgICAgbjIxID0gdGhpcy5lMjEgKiBtLmUxMSArIHRoaXMuZTIyICogbS5lMjE7XG4gICAgICAgICAgICBuMjIgPSB0aGlzLmUyMSAqIG0uZTEyICsgdGhpcy5lMjIgKiBtLmUyMjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5zZXQobjExLCBuMTIsIG4yMSwgbjIyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IG11bHRpcGx5IGluY29tcGF0aWJsZSBtYXRyaWNlcycpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIGEgbWF0cml4IGJ5IGEgc2NhbGFyLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzIC0gVGhlIHNjYWxhci5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IHNjYWxlZCBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgbXVsdGlwbHlTY2FsYXIgKG0sIHMpIHtcbiAgICAgICAgdmFyIGUxMSA9IG0uZTExICogcztcbiAgICAgICAgdmFyIGUxMiA9IG0uZTEyICogcztcbiAgICAgICAgdmFyIGUyMSA9IG0uZTIxICogcztcbiAgICAgICAgdmFyIGUyMiA9IG0uZTIyICogcztcblxuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDIoZTExLCBlMTIsIGUyMSwgZTIyKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIHRoZSBtYXRyaXggYnkgYSBzY2FsYXIuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcyAtIFRoZSBzY2FsYXIuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBtdWx0aXBseVNjYWxhciAocykge1xuICAgICAgICB0aGlzLmUxMSAqPSBzO1xuICAgICAgICB0aGlzLmUxMiAqPSBzO1xuICAgICAgICB0aGlzLmUyMSAqPSBzO1xuICAgICAgICB0aGlzLmUyMiAqPSBzO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFwcGxpZXMgYSByb3RhdGlvbiB0byBhIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBUaGUgYW5nbGUgaW4gcmFkaWFucy5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IHJvdGF0ZWQgbWF0cml4LlxuICAgICovXG4gICAgc3RhdGljIHJvdGF0ZSAobSwgYW5nbGUpIHtcbiAgICAgICAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgdmFyIHJvdGF0aW9uTWF0cml4ID0gbmV3IE1hdHJpeDIoY29zLCAtc2luLCBzaW4sIGNvcyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gTWF0cml4Mi5tdWx0aXBseU1hdHJpY2VzKG0sIHJvdGF0aW9uTWF0cml4KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGVzIHRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBUaGUgYW5nbGUgaW4gcmFkaWFucy5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJvdGF0ZSAoYW5nbGUpIHtcbiAgICAgICAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgdmFyIHJvdGF0aW9uTWF0cml4ID0gbmV3IE1hdHJpeDIoY29zLCAtc2luLCBzaW4sIGNvcyk7XG4gICAgICAgIHRoaXMubXVsdGlwbHlNYXRyaWNlcyhyb3RhdGlvbk1hdHJpeCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBcHBsaWVzIGEgc2NhbGUgdHJhbnNmb3JtYXRpb24gdG8gYSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgYW1vdW50IHRvIHNjYWxlIG9uIHRoZSBYIGF4aXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSBhbW91bnQgdG8gc2NhbGUgb24gdGhlIFkgYXhpcy5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IHNjYWxlZCBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgc2NhbGUgKG0sIHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIE1hdHJpeDIubXVsdGlwbHlNYXRyaWNlcyhtLCBuZXcgTWF0cml4Mih4LCAwLCAwLCB5KSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2NhbGVzIHRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSBhbW91bnQgdG8gc2NhbGUgb24gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIGFtb3VudCB0byBzY2FsZSBvbiB0aGUgWSBheGlzLlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2NhbGUgKHgsIHkpIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseU1hdHJpY2VzKG5ldyBNYXRyaXgyKHgsIDAsIDAsIHkpKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZTExXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZTEyXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZTIxXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZTIyXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXQgKGUxMSwgZTEyLCBlMjEsIGUyMikge1xuICAgICAgICB0aGlzLmUxMSA9IGUxMTtcbiAgICAgICAgdGhpcy5lMTIgPSBlMTI7XG4gICAgICAgIHRoaXMuZTIxID0gZTIxO1xuICAgICAgICB0aGlzLmUyMiA9IGUyMjtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIG1hdHJpeCBmcm9tIGFuIGFycmF5LlxuICAgICogQHBhcmFtIHtBcnJheX0gYSAtIFRoZSBhcnJheSBvZiBtYXRyaXggdmFsdWVzLlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0RnJvbUFycmF5IChhKSB7XG4gICAgICAgIHRoaXMuc2V0KGFbMF0sIGFbMV0sIGFbMl0sIGFbM10pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIG1hdHJpeCB0byB0aGUgaWRlbnRpdHkuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRUb0lkZW50aXR5ICgpIHtcbiAgICAgICAgdGhpcy5zZXQoMSwgMCwgMCwgMSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgbWF0cml4IGludG8gYSBuZXcgYXJyYXkuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggdmFsdWVzLlxuICAgICovXG4gICAgc3RhdGljIHRvQXJyYXkgKG0pIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIFxuICAgICAgICBhWzBdID0gbS5lMTE7XG4gICAgICAgIGFbMV0gPSBtLmUxMjtcbiAgICAgICAgYVsyXSA9IG0uZTIxO1xuICAgICAgICBhWzNdID0gbS5lMjI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgbWF0cml4IGludG8gYSBuZXcgYXJyYXkuXG4gICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKi9cbiAgICB0b0FycmF5ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9BcnJheSh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgbWF0cml4IGludG8gYSBuZXcgRmxvYXQzMkFycmF5LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKi9cbiAgICBzdGF0aWMgdG9GbG9hdDMyQXJyYXkgKG0pIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAgICAgICBcbiAgICAgICAgYVswXSA9IG0uZTExO1xuICAgICAgICBhWzFdID0gbS5lMTI7XG4gICAgICAgIGFbMl0gPSBtLmUyMTtcbiAgICAgICAgYVszXSA9IG0uZTIyO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIG1hdHJpeCBpbnRvIGEgbmV3IEZsb2F0MzJBcnJheS5cbiAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKi9cbiAgICB0b0Zsb2F0MzJBcnJheSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnRvRmxvYXQzMkFycmF5KHRoaXMpO1xuICAgIH1cbn1cblxuLyoqXG4qIFRoZSBudW1iZXIgb2YgY29sdW1ucy5cbiogQG5hbWUgTWF0cml4MiNjb2xzXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hdHJpeDIucHJvdG90eXBlLCAnY29scycsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAyXG59KTtcblxuLyoqXG4qIFRoZSBudW1iZXIgb2Ygcm93cy5cbiogQG5hbWUgTWF0cml4MiNyb3dzXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hdHJpeDIucHJvdG90eXBlLCAncm93cycsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAyXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgTWF0cml4MjsiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBDcmVhdGVzIGEgMkQgdmVjdG9yIGZyb20gYSBzZXJpZXMgb2YgdmFsdWVzLlxuKiBcbiogQGNsYXNzIE9jdWxvLlZlY3RvcjJcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7bnVtYmVyfSB4PTAgLSBUaGUgeCB2YWx1ZS5cbiogQHBhcmFtIHtudW1iZXJ9IHk9MCAtIFRoZSB5IHZhbHVlLlxuKi9cbmNsYXNzIFZlY3RvcjIge1xuICAgIGNvbnN0cnVjdG9yICh4LCB5KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB4IHZhbHVlLlxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy54ID0gKHggIT09IHVuZGVmaW5lZCkgPyB4IDogMDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB5IHZhbHVlLlxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy55ID0gKHkgIT09IHVuZGVmaW5lZCkgPyB5IDogMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEFkZHMgdHdvIHZlY3RvcnMuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEFub3RoZXIgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIHN1bSBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqL1xuICAgIHN0YXRpYyBhZGQgKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKGEueCArIGIueCwgYS55ICsgYi55KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBZGRzIGEgdmVjdG9yIHRvIHRoZSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBhZGQgKHYpIHtcbiAgICAgICAgdGhpcy54ICs9IHYueDtcbiAgICAgICAgdGhpcy55ICs9IHYueTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbG9uZXMgdGhlIHZlY3Rvci5cbiAgICAqIHtWZWN0b3IyfSB2IC0gVGhlIHZlY3RvciB0byBjbG9uZS5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IGlkZW50aWNhbCB2ZWN0b3IuXG4gICAgKi9cbiAgICBzdGF0aWMgY2xvbmUgKHYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHYueCwgdi55KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbG9uZXMgdGhlIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IGlkZW50aWNhbCB2ZWN0b3IuXG4gICAgKi9cbiAgICBjbG9uZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmNsb25lKHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENvcGllcyB0aGUgdmFsdWVzIGZyb20gdGhlIHByb3ZpZGVkIHZlY3RvciBpbnRvIHRoaXMgdmVjdG9yLlxuICAgICoge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yIHRvIGNvcHkuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBjb3B5ICh2KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldCh2LngsIHYueSk7XG4gICAgfVxuICAgICAgICBcbiAgICAvKipcbiAgICAqIERldGVybWluZXMgaWYgdGhlIHByb3ZpZGVkIHZlY3RvcnMgYXJlIGVxdWFsLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gVGhlIGZpcnN0IHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIFRoZSBzZWNvbmQgdmVjdG9yLlxuICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdmVjdG9ycyBhcmUgZXF1YWwuXG4gICAgKi9cbiAgICBzdGF0aWMgZXF1YWxzIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBhLnggPT09IGIueCAmJiBhLnkgPT09IGIueTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXRlcm1pbmVzIGlmIHRoZSB2ZWN0b3IgZXF1YWxzIHRoZSBwcm92aWRlZCB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yLlxuICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdmVjdG9yIGVxdWFscyB0aGUgcHJvdmlkZWQgdmVjdG9yLlxuICAgICovXG4gICAgZXF1YWxzICh2KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmVxdWFscyh0aGlzLCB2KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFRha2VzIHRoZSBtYXggb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEFub3RoZXIgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIG1heCBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqL1xuICAgIHN0YXRpYyBtYXggKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKE1hdGgubWF4KGEueCwgYi54KSwgTWF0aC5tYXgoYS55LCBiLnkpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIGl0c2VsZiB0byB0aGUgbWF4IG9mIGl0c2VsZiBhbmQgdGhlIHByb3ZpZGVkIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIG1heCAodikge1xuICAgICAgICB0aGlzLnggPSBNYXRoLm1heCh0aGlzLngsIHYueCk7XG4gICAgICAgIHRoaXMueSA9IE1hdGgubWF4KHRoaXMueSwgdi55KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBUYWtlcyB0aGUgbWluIG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGIgLSBBbm90aGVyIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHZlY3RvciB0aGF0IGlzIHRoZSBtaW4gb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKi9cbiAgICBzdGF0aWMgbWluIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMihNYXRoLm1pbihhLngsIGIueCksIE1hdGgubWluKGEueSwgYi55KSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyBpdHNlbGYgdG8gdGhlIG1pbiBvZiBpdHNlbGYgYW5kIHRoZSBwcm92aWRlZCB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBtaW4gKHYpIHtcbiAgICAgICAgdGhpcy54ID0gTWF0aC5taW4odGhpcy54LCB2LngpO1xuICAgICAgICB0aGlzLnkgPSBNYXRoLm1pbih0aGlzLnksIHYueSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gVGhlIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzIC0gVGhlIHNjYWxhci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHNjYWxlZCB2ZWN0b3IuXG4gICAgKi9cbiAgICBzdGF0aWMgbXVsdGlwbHlTY2FsYXIgKHYsIHMpIHtcbiAgICAgICAgdmFyIHggPSB2LnggKiBzO1xuICAgICAgICB2YXIgeSA9IHYueSAqIHM7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHgsIHkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgdGhlIHZlY3RvciBieSBhIHNjYWxhci5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzIC0gVGhlIHNjYWxhci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBtdWx0aXBseVNjYWxhciAocykge1xuICAgICAgICB0aGlzLnggKj0gcztcbiAgICAgICAgdGhpcy55ICo9IHM7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmVjdG9yIHZhbHVlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIHggdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSB5IHZhbHVlLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIHNldCAoeCwgeSkge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU3VidHJhY3RzIHR3byB2ZWN0b3JzLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGIgLSBBbm90aGVyIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHZlY3RvciB0aGF0IGlzIHRoZSBkaWZmZXJlbmNlIG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICovXG4gICAgc3RhdGljIHN1YnRyYWN0IChhLCBiKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMihhLnggLSBiLngsIGEueSAtIGIueSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU3VidHJhY3RzIGEgdmVjdG9yIGZyb20gdGhlIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIHN1YnRyYWN0ICh2KSB7XG4gICAgICAgIHRoaXMueCAtPSB2Lng7XG4gICAgICAgIHRoaXMueSAtPSB2Lnk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIHZlY3RvciBpbnRvIGEgbmV3IGFycmF5LlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gVGhlIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIHZhbHVlcy5cbiAgICAqL1xuICAgIHN0YXRpYyB0b0FycmF5ICh2KSB7XG4gICAgICAgIHZhciBhID0gbmV3IEFycmF5KDIpO1xuICAgICAgICBcbiAgICAgICAgYVswXSA9IHYueDtcbiAgICAgICAgYVsxXSA9IHYueTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSB2ZWN0b3IgaW50byBhIG5ldyBhcnJheS5cbiAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIHZhbHVlcy5cbiAgICAqL1xuICAgIHRvQXJyYXkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci50b0FycmF5KHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFRyYW5zZm9ybXMgYSB2ZWN0b3IgdXNpbmcgdGhlIHByb3ZpZGVkIG1hdHJpeC5cbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7TWF0cml4MnxNYXRyaXgyRH0gbSAtIEEgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdHJhbnNmb3JtZWQgdmVjdG9yLlxuICAgICovXG4gICAgc3RhdGljIHRyYW5zZm9ybSAodiwgbSkge1xuICAgICAgICB2YXIgeDEgPSB2LnggKiBtLmUxMSArIHYueSAqIG0uZTEyICsgKG0udHggPyBtLnR4IDogMCk7XG4gICAgICAgIHZhciB5MSA9IHYueCAqIG0uZTIxICsgdi55ICogbS5lMjIgKyAobS50eSA/IG0udHkgOiAwKTtcblxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoeDEsIHkxKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBUcmFuc2Zvcm1zIHRoZSB2ZWN0b3IgdXNpbmcgdGhlIHByb3ZpZGVkIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfE1hdHJpeDJEfSBtIC0gQSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdHJhbnNmb3JtZWQgdmVjdG9yLlxuICAgICovXG4gICAgdHJhbnNmb3JtIChtKSB7XG4gICAgICAgIHZhciB4MSA9IHRoaXMueCAqIG0uZTExICsgdGhpcy55ICogbS5lMTIgKyAobS50eCA/IG0udHggOiAwKTtcbiAgICAgICAgdmFyIHkxID0gdGhpcy54ICogbS5lMjEgKyB0aGlzLnkgKiBtLmUyMiArIChtLnR5ID8gbS50eSA6IDApO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnNldCh4MSwgeTEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVmVjdG9yMjsiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBHU0FQJ3MgVGltZWxpbmVNYXguXG4qIEBleHRlcm5hbCBUaW1lbGluZU1heFxuKiBAc2VlIGh0dHA6Ly9ncmVlbnNvY2suY29tL2RvY3MvIy9IVE1MNS9HU0FQL1RpbWVsaW5lTWF4L1xuKi9cblxuLyoqXG4qIEdTQVAncyBUd2Vlbk1heC5cbiogQGV4dGVybmFsIFR3ZWVuTWF4XG4qIEBzZWUgaHR0cDovL2dyZWVuc29jay5jb20vZG9jcy8jL0hUTUw1L0dTQVAvVHdlZW5NYXgvXG4qL1xuXG4vKipcbiogR1NBUCdzIEVhc2luZy5cbiogQGV4dGVybmFsIEVhc2luZ1xuKiBAc2VlIGh0dHA6Ly9ncmVlbnNvY2suY29tL2RvY3MvIy9IVE1MNS9HU0FQL0Vhc2luZy9cbiovXG5cbmltcG9ydCBBbmltYXRpb24gICAgIGZyb20gJy4vYW5pbWF0aW9uJztcbmltcG9ydCBDYW1lcmEgICAgICAgIGZyb20gJy4vY2FtZXJhJztcbmltcG9ydCBDU1NSZW5kZXJlciAgIGZyb20gJy4vY3NzUmVuZGVyZXInO1xuaW1wb3J0IE1hdGggICAgICAgICAgZnJvbSAnLi9tYXRoL21hdGgnO1xuaW1wb3J0IE1hdHJpeDIgICAgICAgZnJvbSAnLi9tYXRoL21hdHJpeDInO1xuaW1wb3J0IFNjZW5lICAgICAgICAgZnJvbSAnLi9zY2VuZSc7XG5pbXBvcnQgVXRpbHMgICAgICAgICBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBWZWN0b3IyICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuXG4vKipcbiogQG5hbWVzcGFjZSBPY3Vsb1xuKi9cbmNvbnN0IE9jdWxvID0ge1xuICAgIEFuaW1hdGlvbjogQW5pbWF0aW9uLFxuICAgIENhbWVyYTogQ2FtZXJhLFxuICAgIENTU1JlbmRlcmVyOiBDU1NSZW5kZXJlcixcbiAgICBNYXRoOiBNYXRoLFxuICAgIE1hdHJpeDI6IE1hdHJpeDIsXG4gICAgU2NlbmU6IFNjZW5lLFxuICAgIFV0aWxzOiBVdGlscyxcbiAgICBWZWN0b3IyOiBWZWN0b3IyXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE9jdWxvOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgVXRpbHMgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICBmcm9tICcuL21hdGgvdmVjdG9yMic7XG5cbi8qKlxuKiBDcmVhdGVzIGEgc2NlbmUuXG4qIFxuKiBAY2xhc3MgT2N1bG8uU2NlbmVcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7Q2FtZXJhfSBbY2FtZXJhPW51bGxdIC0gVGhlIGNhbWVyYSB0aGF0IG93bnMgdGhpcyBTY2VuZS5cbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gW3ZpZXc9bnVsbF0gLSBUaGUgdmlldyBmb3IgdGhlIHNjZW5lLiBJdCBjYW4gYmUgYSBzZWxlY3RvciBvciBhbiBlbGVtZW50LlxuKi9cbmNsYXNzIFNjZW5lIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhID0gbnVsbCwgdmlldyA9IG51bGwpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPY3Vsby5DYW1lcmF9IC0gVGhlIGNhbWVyYS5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge0VsZW1lbnR9IC0gVGhlIHZpZXcuIEFuIEhUTUwgZWxlbWVudC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy52aWV3ID0gVXRpbHMuRE9NLnBhcnNlVmlldyh2aWV3KTtcbiAgICAgICAgXG4gICAgICAgIC8vIFZpZXcgc2V0dXBcbiAgICAgICAgaWYgKHRoaXMudmlldyAmJiB0aGlzLnZpZXcucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgdGhpcy52aWV3LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy52aWV3KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIFNjZW5lI3dpZHRoXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgd2lkdGguXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB3aWR0aCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcgPyB0aGlzLnZpZXcub2Zmc2V0V2lkdGggOiAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQG5hbWUgU2NlbmUjaGVpZ2h0XG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgaGVpZ2h0LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaGVpZ2h0ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlldyA/IHRoaXMudmlldy5vZmZzZXRIZWlnaHQgOiAwO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIFNjZW5lI3NjYWxlZFdpZHRoXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgc2NhbGVkIHdpZHRoLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgc2NhbGVkV2lkdGggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3ID8gdGhpcy53aWR0aCAqIHRoaXMuY2FtZXJhLnpvb20gOiB0aGlzLndpZHRoO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIFNjZW5lI3NjYWxlZEhlaWdodFxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHNjYWxlZCBoZWlnaHQuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBzY2FsZWRIZWlnaHQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3ID8gdGhpcy5oZWlnaHQgKiB0aGlzLmNhbWVyYS56b29tIDogdGhpcy5oZWlnaHQ7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIHNjZW5lIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLnZpZXcgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTY2VuZTsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IFNjZW5lICAgIGZyb20gJy4vc2NlbmUnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uU2NlbmVNYW5hZ2VyXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYSB0aGF0IG93bnMgdGhpcyBTY2VuZU1hbmFnZXIuXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW2hhc1ZpZXc9dHJ1ZV0gLSBJZiB0cnVlLCBhICdkaXYnIGlzIGNyZWF0ZWQgYW5kIG1hbmFnZWQgaW50ZXJuYWxseS4gUGFzcyBmYWxzZSB0byBjcmVhdGUgYSBTY2VuZU1hbmFnZXIgd2l0aG91dCBhIHZpZXcuXG4qL1xuY2xhc3MgU2NlbmVNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhLCBoYXNWaWV3ID0gdHJ1ZSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkNhbWVyYX0gLSBUaGUgY2FtZXJhIHRoYXQgb3ducyB0aGlzIFNjZW5lTWFuYWdlci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLlNjZW5lfSAtIFRoZSBhY3RpdmUgc2NlbmUuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSB2aWV3LiBBbiBIVE1MIGVsZW1lbnQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudmlldyA9IChoYXNWaWV3ID09PSB0cnVlKSA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpIDogbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIEFuIG9iamVjdCBmb3Igc3RvcmluZyB0aGUgbWFuYWdlZCBTY2VuZSBpbnN0YW5jZXMuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc2NlbmVzID0ge307XG4gICAgICAgIFxuICAgICAgICAvLyBWaWV3IHNldHVwXG4gICAgICAgIGlmICh0aGlzLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUud2lsbENoYW5nZSA9ICd0cmFuc2Zvcm0nO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhIHNjZW5lLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgdG8gZ2l2ZSB0aGUgc2NlbmUuXG4gICAgKiBAcGFyYW0ge09jdWxvLlNjZW5lfSBzY2VuZSAtIFRoZSBzY2VuZS5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBhZGQgKG5hbWUsIHNjZW5lKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2NlbmUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBzY2VuZSA9IG5ldyBTY2VuZSh0aGlzLmNhbWVyYSwgc2NlbmUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2NlbmUuY2FtZXJhID0gdGhpcy5jYW1lcmE7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3NjZW5lc1tuYW1lXSA9IHNjZW5lO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIFNjZW5lTWFuYWdlciBhbmQgcHJlcGFyZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLl9zY2VuZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NjZW5lc1trZXldLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmFjdGl2ZVNjZW5lID0gbnVsbDtcbiAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc2NlbmVzID0ge307XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGEgc2NlbmUuXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc2NlbmUuXG4gICAgKiBAcmV0dXJucyB7T2N1bG8uU2NlbmV9IFRoZSBzY2VuZS5cbiAgICAqL1xuICAgIGdldCAobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2NlbmVzW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIGFjdGl2ZSBzY2VuZS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0QWN0aXZlU2NlbmUgKG5hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMudmlldyAmJiB0aGlzLmFjdGl2ZVNjZW5lICYmIHRoaXMuYWN0aXZlU2NlbmUudmlldykge1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNoaWxkKHRoaXMuYWN0aXZlU2NlbmUudmlldyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWN0aXZlU2NlbmUgPSB0aGlzLl9zY2VuZXNbbmFtZV07XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy52aWV3KSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVNjZW5lLnZpZXcuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVTY2VuZS52aWV3LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgdGhpcy52aWV3LmFwcGVuZENoaWxkKHRoaXMuYWN0aXZlU2NlbmUudmlldyk7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUud2lkdGggPSB0aGlzLmFjdGl2ZVNjZW5lLndpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5oZWlnaHQgPSB0aGlzLmFjdGl2ZVNjZW5lLmhlaWdodCArICdweCc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2NlbmVNYW5hZ2VyOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgRHJhZ0NvbnRyb2wgIGZyb20gJy4vZHJhZ0NvbnRyb2wnO1xuaW1wb3J0IFdoZWVsQ29udHJvbCBmcm9tICcuL3doZWVsQ29udHJvbCc7XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5UcmFja0NvbnRyb2xcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7T2N1bG8uQ2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5kcmFnZ2FibGVdIC0gV2hldGhlciBkcmFnZ2luZyBpcyBoYW5kbGVkIG9yIG5vdC5cbiogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMub25EcmFnXSAtIFRoZSBmdW5jdGlvbiB0byBjYWxsIGV2ZXJ5IHRpbWUgdGhlIGRyYWcgZXZlbnQgb2NjdXJzLlxuKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLndoZWVsYWJsZV0gLSBXaGV0aGVyIHdoZWVsaW5nIGlzIGhhbmRsZWQgb3Igbm90LlxuKiBAcGFyYW0ge2Z1bmN0aW9ufSBbb3B0aW9ucy5vbldoZWVsXSAtIFRoZSBmdW5jdGlvbiB0byBjYWxsIGV2ZXJ5IHRpbWUgdGhlIHdoZWVsIGV2ZW50IG9jY3Vycy5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15VHJhY2tDb250cm9sID0gbmV3IE9jdWxvLlRyYWNrQ29udHJvbChteUNhbWVyYSwgeyBcbiogICBkcmFnZ2FibGU6IHRydWUsIFxuKiAgIG9uRHJhZzogZnVuY3Rpb24gKCkgeyBcbiogICAgIGNvbnNvbGUubG9nKCdkcmFnZ2luZycpOyBcbiogICB9LCBcbiogICB3aGVlbGFibGU6IHRydWUsIFxuKiAgIG9uV2hlZWw6IGZ1bmN0aW9uICgpIHsgXG4qICAgICBjb25zb2xlLmxvZygnd2hlZWxpbmcnKTsgXG4qICAgfVxuKiB9KTtcbiovXG5jbGFzcyBUcmFja0NvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIHtcbiAgICAgICAgZHJhZ2dhYmxlID0gZmFsc2UsXG4gICAgICAgIG9uRHJhZyA9IHVuZGVmaW5lZCxcbiAgICAgICAgd2hlZWxhYmxlID0gZmFsc2UsXG4gICAgICAgIG9uV2hlZWwgPSB1bmRlZmluZWRcbiAgICB9ID0ge30pIHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtvYmplY3R9IC0gVGhlIGluaXRpYWwgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKiBAZGVmYXVsdCB7fTtcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSB7IGRyYWdnYWJsZSwgb25EcmFnLCB3aGVlbGFibGUsIG9uV2hlZWwgfTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uQ2FtZXJhfSAtIFRoZSBjYW1lcmEuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgZHJhZ2dpbmcgaXMgaGFuZGxlZCBvciBub3QuXG4gICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0RyYWdnYWJsZSA9IChkcmFnZ2FibGUgPT09IHRydWUpID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtEcmFnZ2FibGV9IC0gVGhlIGRyYWcgY29udHJvbC5cbiAgICAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZHJhZ0NvbnRyb2wgPSAhdGhpcy5pc0RyYWdnYWJsZSA/IG51bGwgOiBuZXcgRHJhZ0NvbnRyb2wodGhpcy5jYW1lcmEuc2NlbmVzLnZpZXcsIHtcbiAgICAgICAgICAgIGRyYWdQcm94eTogdGhpcy5jYW1lcmEudmlldyxcbiAgICAgICAgICAgIG9uRHJhZzogb25EcmFnLFxuICAgICAgICAgICAgb25EcmFnUGFyYW1zOiBbdGhpcy5jYW1lcmFdLFxuICAgICAgICAgICAgekluZGV4Qm9vc3Q6IGZhbHNlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHdoZWVsaW5nIGlzIGhhbmRsZWQgb3Igbm90LlxuICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNXaGVlbGFibGUgPSAod2hlZWxhYmxlID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7V2hlZWxDb250cm9sfSAtIFRoZSB3aGVlbCBjb250cm9sLlxuICAgICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aGVlbENvbnRyb2wgPSAhdGhpcy5pc1doZWVsYWJsZSA/IG51bGwgOiBuZXcgV2hlZWxDb250cm9sKHRoaXMuY2FtZXJhLnZpZXcsIHtcbiAgICAgICAgICAgIG9uV2hlZWw6IG9uV2hlZWwsXG4gICAgICAgICAgICBvbldoZWVsUGFyYW1zOiBbdGhpcy5jYW1lcmFdXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgZHJhZ2dpbmcgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBkcmFnRW5hYmxlZCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzRHJhZ2dhYmxlID8gdGhpcy5kcmFnQ29udHJvbC5lbmFibGVkIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgd2hlZWxpbmcgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB3aGVlbEVuYWJsZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1doZWVsYWJsZSA/IHRoaXMud2hlZWxDb250cm9sLmVuYWJsZWQgOiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgY29udHJvbCBhbmQgcHJlcGFyZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ0NvbnRyb2wgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5pc1doZWVsYWJsZSkge1xuICAgICAgICAgICAgdGhpcy53aGVlbENvbnRyb2wuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy53aGVlbENvbnRyb2wgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNvbmZpZyA9IHt9O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgZHJhZ2dpbmcuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGVEcmFnICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ0NvbnRyb2wuZGlzYWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBFbmFibGVzIGRyYWdnaW5nLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBlbmFibGVEcmFnICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ0NvbnRyb2wuZW5hYmxlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyB3aGVlbGluZy5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGlzYWJsZVdoZWVsICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmRpc2FibGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyB3aGVlbGluZy5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlV2hlZWwgKCkge1xuICAgICAgICBpZiAodGhpcy5pc1doZWVsYWJsZSkge1xuICAgICAgICAgICAgdGhpcy53aGVlbENvbnRyb2wuZW5hYmxlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRyYWNrQ29udHJvbDsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IGlzRWxlbWVudCBmcm9tICdsb2Rhc2gvaXNFbGVtZW50JztcbmltcG9ydCBpc09iamVjdCAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCBWZWN0b3IyICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAbmFtZXNwYWNlIE9jdWxvLlV0aWxzXG4qL1xuY29uc3QgVXRpbHMgPSB7XG4gICAgLyoqXG4gICAgKiBHZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUgZm9yIGFuIGVsZW1lbnQuXG4gICAgKlxuICAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIFRoZSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgQ1NTIHRyYW5zZm9ybSB2YWx1ZS5cbiAgICAqL1xuICAgIGdldENzc1RyYW5zZm9ybTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKCd0cmFuc2Zvcm0nKTtcblxuICAgICAgICAvLyBSZW1vdmUgJ21hdHJpeCgpJyBhbmQgYWxsIHdoaXRlc3BhY2UuIFRoZW4gc2VwYXJhdGUgaW50byBhbiBhcnJheS5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9eXFx3K1xcKC8sJycpLnJlcGxhY2UoL1xcKSQvLCcnKS5yZXBsYWNlKC9cXHMrL2csICcnKS5zcGxpdCgnLCcpO1xuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETzogVGhpcyBzdXBlciBzaW1wbGlzdGljIGFuZCBvbmx5IGhhbmRsZXMgMkQgbWF0cmljZXMuXG4gICAgZ2V0VHJhbnNmb3JtTWF0cml4OiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgdmFyIHN0eWxlVmFsdWUgPSB1dGlscy5nZXRDc3NUcmFuc2Zvcm0oZWwpO1xuICAgICAgICB2YXIgbWF0cml4ID0gW107XG4gICAgICAgIFxuICAgICAgICBpZiAoc3R5bGVWYWx1ZVswXSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICBtYXRyaXggPSBbMSwgMCwgMCwgMSwgMCwgMF1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN0eWxlVmFsdWUuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIG1hdHJpeC5wdXNoKHBhcnNlRmxvYXQoaXRlbSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBtYXRyaXg7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAqIFNldCB0aGUgQ1NTIHRyYW5zZm9ybSB2YWx1ZSBmb3IgYW4gZWxlbWVudC5cbiAgICAqXG4gICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gVGhlIGVsZW1lbnQgZm9yIHdoaWNoIHRvIHNldCB0aGUgQ1NTIHRyYW5zZm9ybSB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gQW4gb2JqZWN0IG9mIENTUyB0cmFuc2Zvcm0gdmFsdWVzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNjYWxlXSAtIEEgdmFsaWQgQ1NTIHRyYW5zZm9ybSAnc2NhbGUnIGZ1bmN0aW9uIHZhbHVlIHRvIGFwcGx5IHRvIGJvdGggWCBhbmQgWSBheGVzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNjYWxlWF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NjYWxlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWCBheGlzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNjYWxlWV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NjYWxlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNrZXdYXSAtIEEgdmFsaWQgQ1NTIHRyYW5zZm9ybSAnc2tldycgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5za2V3WV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NrZXcnIGZ1bmN0aW9uIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBZIGF4aXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudHJhbnNsYXRlXSAtIEEgdmFsaWQgQ1NTIHRyYW5zZm9ybSAndHJhbnNsYXRlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byBib3RoIFggYW5kIFkgYXhlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50cmFuc2xhdGVYXSAtIEEgdmFsaWQgQ1NTIHRyYW5zZm9ybSAndHJhbnNsYXRlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWCBheGlzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRyYW5zbGF0ZVldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICd0cmFuc2xhdGUnIGZ1bmN0aW9uIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBZIGF4aXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3RyYWNrZXJdIC0gVGhlIG9iamVjdCB0aGF0IGlzIHRyYWNraW5nIHRoZSB0cmFuc2l0aW9uLiAnaXNUcmFuc2l0aW9uaW5nJyBvbiB0aGUgb2JqZWN0IHdpbGwgYmUgc2V0IHRvICd0cnVlJy5cbiAgICAqIEByZXR1cm5zIHtFbGVtZW50fSBUaGUgZWxlbWVudC5cbiAgICAqL1xuXG4gICAgLy8gVE9ETzogVGhpcyBpcyBhIHZlcnkgc2ltcGxpc3RpYyBzb2x1dGlvbi5cbiAgICAvLyBJZGVhbGx5IHdvdWxkIGhhbmRsZSAncm90YXRlJyBvcHRpb24uXG4gICAgLy8gSWRlYWxseSB3b3VsZCBoYW5kbGUgM0QgTWF0cml4LlxuICAgIHNldENzc1RyYW5zZm9ybTogZnVuY3Rpb24gKGVsLCBvcHRpb25zLCB0cmFja2VyKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgbGV0IHZhbHVlID0gdXRpbHMuZ2V0Q3NzVHJhbnNmb3JtKGVsKTtcbiAgICAgICAgY29uc3QgQ1NTX1RSQU5TRk9STV9LRVlXT1JEUyA9IFsnaW5oZXJpdCcsICdpbml0aWFsJywgJ25vbmUnLCAndW5zZXQnXTtcbiAgICAgICAgY29uc3QgREVGQVVMVF9NQVRSSVhfMkQgPSBbMSwgMCwgMCwgMSwgMCwgMF07XG4gICAgICAgIGNvbnN0IE1BVFJJWF8yRCA9IHtcbiAgICAgICAgICAgIHNjYWxlWDogMCxcbiAgICAgICAgICAgIHNjYWxlWTogMyxcbiAgICAgICAgICAgIHNrZXdZOiAxLFxuICAgICAgICAgICAgc2tld1g6IDIsXG4gICAgICAgICAgICB0cmFuc2xhdGVYOiA0LFxuICAgICAgICAgICAgdHJhbnNsYXRlWTogNVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChvcHRpb25zLnNjYWxlKSB7XG4gICAgICAgICAgICBvcHRpb25zLnNjYWxlWCA9IG9wdGlvbnMuc2NhbGVZID0gb3B0aW9ucy5zY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgb3B0aW9ucy50cmFuc2xhdGVYID0gb3B0aW9ucy50cmFuc2xhdGVZID0gb3B0aW9ucy50cmFuc2xhdGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgdHJhbnNmb3JtIHZhbHVlIGlzIGEga2V5d29yZCwgdXNlIGEgZGVmYXVsdCBtYXRyaXguXG4gICAgICAgIGlmIChDU1NfVFJBTlNGT1JNX0tFWVdPUkRTLmluZGV4T2YodmFsdWVbMF0pKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IERFRkFVTFRfTUFUUklYXzJEO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gTUFUUklYXzJEKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9uc1trZXldKSB7XG4gICAgICAgICAgICAgICAgaWYgKF8uaXNGaW5pdGUob3B0aW9uc1trZXldKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVtNQVRSSVhfMkRba2V5XV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZXQgYW4gaW52YWxpZCBDU1MgbWF0cml4IHZhbHVlJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGVsLnN0eWxlLnRyYW5zZm9ybSA9ICdtYXRyaXgoJyArIHZhbHVlLmpvaW4oJywgJykgKyAnKSc7XG4gICAgICAgIFxuICAgICAgICBpZiAodHJhY2tlcikge1xuICAgICAgICAgICAgdHJhY2tlci5pc1RyYW5zaXRpb25pbmcgPSB0cnVlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJZiB0cmFuc2l0aW9uIGR1cmF0aW9uIGlzIDAsICd0cmFuc2l0aW9uZW5kJyBldmVudCB3aGljaCBoYW5kbGVzICdpc1RyYW5zaXRpb25pbmcnIHdpbGwgbm90IGZpcmUuXG4gICAgICAgICAgICBpZiAocGFyc2VGbG9hdCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZ2V0UHJvcGVydHlWYWx1ZSgndHJhbnNpdGlvbi1kdXJhdGlvbicpKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRyYWNrZXIuaXNUcmFuc2l0aW9uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogU2V0IHRoZSBDU1MgdHJhbnNpdGlvbiBwcm9wZXJ0aWVzIGZvciBhbiBlbGVtZW50LlxuICAgICpcbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBUaGUgZWxlbWVudCBmb3Igd2hpY2ggdG8gc2V0IHRoZSBDU1MgdHJhbnNpdGlvbiBwcm9wZXJ0aWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BlcnRpZXMgLSBBIGNhbWVyYSB7QGxpbmsgQ2FtZXJhTW9kZWwuZGVmYXVsdHMudHJhbnNpdGlvbnx0cmFuc2l0aW9ufSBvYmplY3QuXG4gICAgKiBAcmV0dXJucyB7RWxlbWVudH0gVGhlIGVsZW1lbnQuXG4gICAgKi9cbiAgICBzZXRDc3NUcmFuc2l0aW9uOiBmdW5jdGlvbiAoZWwsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgcHJvcGVydGllcyA9IHByb3BlcnRpZXMgfHwge307XG4gICAgICAgIFxuICAgICAgICBsZXQgY3NzVHJhbnNpdGlvblByb3BlcnRpZXMgPSB7XG4gICAgICAgICAgICB0cmFuc2l0aW9uRGVsYXk6IHByb3BlcnRpZXMuZGVsYXkgfHwgJzBzJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogcHJvcGVydGllcy5kdXJhdGlvbiB8fCAnMHMnLFxuICAgICAgICAgICAgdHJhbnNpdGlvblByb3BlcnR5OiBwcm9wZXJ0aWVzLnByb3BlcnR5IHx8ICdhbGwnLFxuICAgICAgICAgICAgdHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uOiBwcm9wZXJ0aWVzLnRpbWluZ0Z1bmN0aW9uIHx8ICdlYXNlJ1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBlbC5zdHlsZVtrZXldID0gY3NzVHJhbnNpdGlvblByb3BlcnRpZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBUaHJvdHRsaW5nIHVzaW5nIHJlcXVlc3RBbmltYXRpb25GcmFtZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIC0gVGhlIGZ1bmN0aW9uIHRvIHRocm90dGxlLlxuICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB0aHJvdHRsZWQgdG8gdGhlIG5leHQgQW5pbWF0aW9uIEZyYW1lLlxuICAgICovXG4gICAgdGhyb3R0bGVUb0ZyYW1lOiBmdW5jdGlvbiAoZnVuYykge1xuICAgICAgICBsZXQgX3RoaXMsIGFyZ3M7XG4gICAgICAgIGxldCBpc1Byb2Nlc3NpbmcgPSBmYWxzZTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcblxuICAgICAgICAgICAgaWYgKCFpc1Byb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgICAgICBpc1Byb2Nlc3NpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbih0aW1lc3RhbXApIHtcbiAgICAgICAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbChhcmdzLCB0aW1lc3RhbXApO1xuICAgICAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7ICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZSB0aGUgcG9zaXRpb24gb2YgdGhlIGdpdmVuIGlucHV0IHdpdGhpbiB0aGUgd29ybGQuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBbaW5wdXRdIC0gVGhlIGlucHV0IHRvIHBhcnNlLlxuICAgICogQHBhcmFtIHtFbGVtZW50fSB3b3JsZCAtIFRoZSB3b3JsZC5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBwYXJzZWQgcG9zaXRpb24gYXMgYW4geC95IHBvc2l0aW9uIG9iamVjdC5cbiAgICAqL1xuICAgIHBhcnNlUG9zaXRpb246IGZ1bmN0aW9uIChpbnB1dCwgd29ybGQpIHtcbiAgICAgICAgdmFyIG9iamVjdFBvc2l0aW9uO1xuICAgICAgICB2YXIgcG9zaXRpb24gPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpc0VsZW1lbnQoaW5wdXQpKSB7XG4gICAgICAgICAgICBvYmplY3RQb3NpdGlvbiA9IFV0aWxzLkRPTS5nZXRPYmplY3RXb3JsZFBvc2l0aW9uKGlucHV0LCB3b3JsZCk7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IG5ldyBWZWN0b3IyKG9iamVjdFBvc2l0aW9uLngsIG9iamVjdFBvc2l0aW9uLnkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzT2JqZWN0KGlucHV0KSkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgVmVjdG9yMihpbnB1dC54LCBpbnB1dC55KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH1cbn07XG5cblV0aWxzLkRPTSA9IHtcbiAgICAvKipcbiAgICAqIEdldCBhbiBvYmplY3QncyBwb3NpdGlvbiBpbiB0aGUgd29ybGQuXG4gICAgKlxuICAgICogQHBhcmFtIHtFbGVtZW50fSBvYmplY3QgLSBUaGUgb2JqZWN0LlxuICAgICogQHBhcmFtIHtFbGVtZW50fSB3b3JsZCAtIFRoZSB3b3JsZC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgb2JqZWN0J3MgcG9zaXRpb24uXG4gICAgKi9cbiAgICBnZXRPYmplY3RXb3JsZFBvc2l0aW9uOiBmdW5jdGlvbiAob2JqZWN0LCB3b3JsZCkge1xuICAgICAgICB2YXIgeCA9IChvYmplY3Qub2Zmc2V0V2lkdGggLyAyKSArIG9iamVjdC5vZmZzZXRMZWZ0IC0gd29ybGQub2Zmc2V0TGVmdDtcbiAgICAgICAgdmFyIHkgPSAob2JqZWN0Lm9mZnNldEhlaWdodCAvIDIpICsgb2JqZWN0Lm9mZnNldFRvcCAtIHdvcmxkLm9mZnNldFRvcDtcblxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoeCwgeSk7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAqIFBhcnNlIGEgdmlldyBwYXJhbWV0ZXIuXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gaW5wdXQgLSBUaGUgdmlldyBwYXJhbWV0ZXIuXG4gICAgKiBAcmV0dXJucyB7RWxlbWVudH0gVGhlIHZpZXcuXG4gICAgKi9cbiAgICBwYXJzZVZpZXc6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICB2YXIgb3V0cHV0ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0VsZW1lbnQoaW5wdXQpKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBpbnB1dDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG59O1xuXG5VdGlscy5UaW1lID0ge1xuICAgIC8qKlxuICAgICogR2V0cyBhIHRpbWUgZHVyYXRpb24gZ2l2ZW4gRlBTIGFuZCB0aGUgZGVzaXJlZCB1bml0LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGZwcyAtIFRoZSBmcmFtZXMgcGVyIHNlY29uZC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSB1bml0IC0gVGhlIHVuaXQgb2YgdGltZS5cbiAgICAqIEByZXR1cm4ge251bWJlcn0gLSBUaGUgZHVyYXRpb24uXG4gICAgKi9cbiAgICBnZXRGUFNEdXJhdGlvbjogKGZwcywgdW5pdCkgPT4ge1xuICAgICAgICB2YXIgZHVyYXRpb24gPSAwO1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh1bml0KSB7XG4gICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9ICgxMDAwIC8gZnBzKSAvIDEwMDA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdtcyc6XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPSAxMDAwIC8gZnBzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZHVyYXRpb247XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgVXRpbHM7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCB0aHJvdHRsZSBmcm9tICdsb2Rhc2gvdGhyb3R0bGUnO1xuaW1wb3J0IFV0aWxzICAgIGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uV2hlZWxDb250cm9sXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSB0YXJnZXQgLSBUaGUgdGFyZ2V0LlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMub25XaGVlbF0gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSB3aGVlbCBldmVudCBvY2N1cnMuXG4qIEBwYXJhbSB7YXJyYXl9IFtvcHRpb25zLm9uV2hlZWxQYXJhbXNdIC0gVGhlIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgY2FsbGJhY2suXG4qIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5vbldoZWVsU2NvcGVdIC0gV2hhdCAndGhpcycgcmVmZXJzIHRvIGluc2lkZSB0aGUgY2FsbGJhY2suXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteVdoZWVsQ29udHJvbCA9IG5ldyBPY3Vsby5XaGVlbENvbnRyb2woJyNjYW1lcmEnLCB7ICBcbiogICBvbldoZWVsOiBmdW5jdGlvbiAoKSB7IFxuKiAgICAgY29uc29sZS5sb2coJ3doZWVsaW5nJyk7IFxuKiAgIH1cbiogfSk7XG4qL1xuY2xhc3MgV2hlZWxDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvciAodGFyZ2V0LCB7XG4gICAgICAgIG9uV2hlZWwgPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgb25XaGVlbFBhcmFtcyA9IFtdLFxuICAgICAgICBvbldoZWVsU2NvcGUgPSB0aGlzXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBjb25maWd1cmF0aW9uLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHsgb25XaGVlbCwgb25XaGVlbFBhcmFtcywgb25XaGVlbFNjb3BlIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSB0YXJnZXQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gVXRpbHMuRE9NLnBhcnNlVmlldyh0YXJnZXQpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtXaGVlbEV2ZW50fSAtIFRoZSBsYXN0IHdoZWVsIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLndoZWVsRXZlbnQgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7V2hlZWxFdmVudH0gLSBUaGUgcHJldmlvdXMgd2hlZWwgZXZlbnQgdGhhdCBhZmZlY3RlZCB0aGUgaW5zdGFuY2UuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucHJldmlvdXNXaGVlbEV2ZW50ID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciBpdCBpcyBlbmFibGVkIG9yIG5vdC5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB0aHJvdHRsZWQgd2hlZWwgZXZlbnQgaGFuZGxlci5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl90aHJvdHRsZWRPbldoZWVsID0gdGhyb3R0bGUoZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzV2hlZWxFdmVudCA9IHRoaXMud2hlZWxFdmVudDtcbiAgICAgICAgICAgIHRoaXMud2hlZWxFdmVudCA9IGV2ZW50O1xuICAgICAgICAgICAgdGhpcy5jb25maWcub25XaGVlbC5hcHBseSh0aGlzLmNvbmZpZy5vbldoZWVsU2NvcGUsIHRoaXMuY29uZmlnLm9uV2hlZWxQYXJhbXMpO1xuICAgICAgICB9LCBVdGlscy5UaW1lLmdldEZQU0R1cmF0aW9uKDMwLCAnbXMnKSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHdoZWVsIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25XaGVlbCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5fdGhyb3R0bGVkT25XaGVlbChldmVudCk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVuYWJsZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqIEBkZWZhdWx0IHRydWVcbiAgICAqL1xuICAgIGdldCBlbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIGNvbnRyb2wgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSB7fTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgdGhlIGNvbnRyb2wuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGUgKCkge1xuICAgICAgICB0aGlzLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuX29uV2hlZWwpO1xuICAgICAgICB0aGlzLl9lbmFibGVkID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRW5hYmxlcyB0aGUgY29udHJvbC5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlICgpIHtcbiAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLl9vbldoZWVsKTtcbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBXaGVlbENvbnRyb2w7Il19

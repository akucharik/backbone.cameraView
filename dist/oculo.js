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
                    onStartParams: options.onStartParams,
                    onUpdate: options.onUpdate,
                    onUpdateParams: options.onUpdateParams,
                    onComplete: options.onComplete,
                    onCompleteParams: options.onCompleteParams,
                    onReverseComplete: options.onReverseComplete,
                    onReverseCompleteParams: options.onReverseCompleteParams
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

            // Delete callbacks so children don't pick them up but get other options
            delete options.onStart;
            delete options.onStartParams;
            delete options.onUpdate;
            delete options.onUpdateParams;
            delete options.onComplete;
            delete options.onCompleteParams;
            delete options.onReverseComplete;
            delete options.onReverseCompleteParams;

            // Tween core camera properties
            if (props.origin || props.position || props.rotation || props.zoom) {
                var coreTween = TweenMax.to(this.camera, duration !== 0 ? duration : 0.016, Object.assign({}, options, {
                    data: {
                        enforceBounds: options.enforceBounds === false ? false : true
                    },
                    _rawOffsetX: 0,
                    _rawOffsetY: 0,
                    _rawScaleOffsetX: 0,
                    _rawScaleOffsetY: 0,
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
                        this.camera.setTransformOrigin(self.props.to.origin);
                        self.timeline.core = self;

                        // TODO: For dev only
                        console.log('core tween started');
                        console.log('tween vars: ', self.vars);
                        console.log('tween props: ', self.props);
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        var offset = this.camera._rawOffset;
                        var position;

                        // Handle direct offset tweening, then apply rotation
                        if (self.props.to.isOriginAuto && self.props.to.isPositionChanging && self.props.to.isRotationChanging) {
                            position = this.camera._convertOffsetToPosition(this.camera._rawScaleOffset, this.camera.center, this.camera.transformOrigin, this.camera.scaleTransformation);
                            offset = this.camera._convertPositionToOffset(position, this.camera.center, this.camera.transformOrigin, this.camera.transformation);
                        }

                        // Position is manually maintained so animations can smoothly continue when camera is resized
                        this.camera.setPosition(this.camera._convertOffsetToPosition(offset, this.camera.center, this.camera.transformOrigin, this.camera.transformation), self.data.enforceBounds);
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
                        enforceBounds: options.enforceBounds === false ? false : true
                    },
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        self.timeline.shake = self;
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        var isFirstFrame = self.progress() === 0;
                        var isFinalFrame = self.progress() === 1;
                        var offsetX = 0;
                        var offsetY = 0;
                        var position = this.camera._clampPosition(this.camera._convertOffsetToPosition(this.camera._rawOffset, this.camera.center, this.camera.transformOrigin, this.camera.transformation));

                        if (self.data.direction === Animation.shake.direction.HORIZONTAL || self.data.direction === Animation.shake.direction.BOTH) {
                            if (!isFirstFrame && !isFinalFrame) {
                                offsetX = Math.random() * self.data.intensity * this.camera.width * 2 - self.data.intensity * this.camera.width;
                                position.x += offsetX;
                            }
                        }

                        if (self.data.direction === Animation.shake.direction.VERTICAL || self.data.direction === Animation.shake.direction.BOTH) {
                            if (!isFirstFrame && !isFinalFrame) {
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
                origin: parsed.origin !== _constants.originKeyword.AUTO ? parsed.origin : {},
                position: parsed.position !== null ? parsed.position : {},
                rotation: parsed.rotation,
                zoom: parsed.zoom
            };

            var isAnchored = false;

            // Changing to same origin is necessary for wheel zoom
            var isOriginAuto = parsed.origin === _constants.originKeyword.AUTO;
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

            var fovPosition = this.camera.center;
            var startTransformation = new _matrix2.default().scale(start.zoom, start.zoom).rotate(_math2.default.degToRad(-start.rotation));
            var toScaleOffset;
            var toOffset;
            var toOrigin = new _vector2.default(isOriginXChanging ? source.origin.x : start.origin.x, isOriginYChanging ? source.origin.y : start.origin.y);
            var toPosition = new _vector2.default(isPositionXChanging ? source.position.x : start.position.x, isPositionYChanging ? source.position.y : start.position.y);
            var toRotation = isRotationChanging ? source.rotation : start.rotation;
            var toZoom = isZoomChanging ? source.zoom : start.zoom;
            var toScaleTransformation = new _matrix2.default().scale(toZoom, toZoom);
            var toTransformation = new _matrix2.default().scale(toZoom, toZoom).rotate(_math2.default.degToRad(-toRotation));

            // rotateTo, zoomTo
            if (isOriginAuto && !isPositionChanging) {
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
                // animate (with auto origin)
                else if (isOriginAuto && isPositionChanging && isRotationChanging) {
                        toOrigin.copy(toPosition);
                    }

            toScaleOffset = this.camera._convertPositionToOffset(toPosition, this.camera.center, toOrigin, toScaleTransformation);
            toOffset = this.camera._convertPositionToOffset(toPosition, this.camera.center, toOrigin, toTransformation);

            return {
                isOriginAuto: isOriginAuto,
                isPositionChanging: isPositionChanging,
                isRotationChanging: isRotationChanging,
                scaleOffsetX: isOffsetChanging ? toScaleOffset.x : null,
                scaleOffsetY: isOffsetChanging ? toScaleOffset.y : null,
                offsetX: isOffsetChanging ? toOffset.x : null,
                offsetY: isOffsetChanging ? toOffset.y : null,
                origin: isAnchored || isOriginChanging || isOriginAuto && isPositionChanging && isRotationChanging ? toOrigin : null,
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

                // Ensure offset matches current position before tween starts
                this.camera._updateRawOffset();

                // Origin and offset must be updated before tween starts
                this.camera.setTransformOrigin(toProps.origin);

                tween.vars._rawOffsetX = toProps.offsetX;
                tween.vars._rawOffsetY = toProps.offsetY;
                tween.vars._rawScaleOffsetX = toProps.scaleOffsetX;
                tween.vars._rawScaleOffsetY = toProps.scaleOffsetY;
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
                origin: _utils2.default.parseOrigin(origin, this.camera.scene.view),
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
                    easeOut: shake.easeOut
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
                    onStartParams: options.onStartParams,
                    onUpdate: options.onUpdate,
                    onUpdateParams: options.onUpdateParams,
                    onComplete: options.onComplete,
                    onCompleteParams: options.onCompleteParams,
                    onReverseComplete: options.onReverseComplete,
                    onReverseCompleteParams: options.onReverseCompleteParams
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

            // Delete callbacks so children don't pick them up but get other options
            delete options.onStart;
            delete options.onStartParams;
            delete options.onUpdate;
            delete options.onUpdateParams;
            delete options.onComplete;
            delete options.onCompleteParams;
            delete options.onReverseComplete;
            delete options.onReverseCompleteParams;

            // Tween core camera properties
            if (props.origin || props.position || props.rotation || props.zoom) {
                var coreTween = TweenMax.to(this.camera, duration !== 0 ? duration : 0.016, Object.assign({}, options, {
                    data: {
                        enforceBounds: options.enforceBounds === false ? false : true
                    },
                    _rawOffsetX: 0,
                    _rawOffsetY: 0,
                    _rawScaleOffsetX: 0,
                    _rawScaleOffsetY: 0,
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
                        this.camera.setTransformOrigin(self.props.to.origin);
                        self.timeline.core = self;

                        // TODO: For dev only
                        console.log('core tween started');
                        console.log('tween vars: ', self.vars);
                        console.log('tween props: ', self.props);
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        var offset = this.camera._rawOffset;
                        var position;

                        // Handle direct offset tweening, then apply rotation
                        if (self.props.to.isOriginAuto && self.props.to.isPositionChanging && self.props.to.isRotationChanging) {
                            position = this.camera._convertOffsetToPosition(this.camera._rawScaleOffset, this.camera.center, this.camera.transformOrigin, this.camera.scaleTransformation);
                            offset = this.camera._convertPositionToOffset(position, this.camera.center, this.camera.transformOrigin, this.camera.transformation);
                        }

                        // Position is manually maintained so animations can smoothly continue when camera is resized
                        this.camera.setPosition(this.camera._convertOffsetToPosition(offset, this.camera.center, this.camera.transformOrigin, this.camera.transformation), self.data.enforceBounds);
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
                        enforceBounds: options.enforceBounds === false ? false : true
                    },
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        self.timeline.shake = self;
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        var isFirstFrame = self.progress() === 0;
                        var isFinalFrame = self.progress() === 1;
                        var offsetX = 0;
                        var offsetY = 0;
                        var position = this.camera._clampPosition(this.camera._convertOffsetToPosition(this.camera._rawOffset, this.camera.center, this.camera.transformOrigin, this.camera.transformation));

                        if (self.data.direction === Animation.shake.direction.HORIZONTAL || self.data.direction === Animation.shake.direction.BOTH) {
                            if (!isFirstFrame && !isFinalFrame) {
                                offsetX = Math.random() * self.data.intensity * this.camera.width * 2 - self.data.intensity * this.camera.width;
                                position.x += offsetX;
                            }
                        }

                        if (self.data.direction === Animation.shake.direction.VERTICAL || self.data.direction === Animation.shake.direction.BOTH) {
                            if (!isFirstFrame && !isFinalFrame) {
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
                origin: parsed.origin !== _constants.originKeyword.AUTO ? parsed.origin : {},
                position: parsed.position !== null ? parsed.position : {},
                rotation: parsed.rotation,
                zoom: parsed.zoom
            };

            var isAnchored = false;

            // Changing to same origin is necessary for wheel zoom
            var isOriginAuto = parsed.origin === _constants.originKeyword.AUTO;
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

            var fovPosition = this.camera.center;
            var startTransformation = new _matrix2.default().scale(start.zoom, start.zoom).rotate(_math2.default.degToRad(-start.rotation));
            var toScaleOffset;
            var toOffset;
            var toOrigin = new _vector2.default(isOriginXChanging ? source.origin.x : start.origin.x, isOriginYChanging ? source.origin.y : start.origin.y);
            var toPosition = new _vector2.default(isPositionXChanging ? source.position.x : start.position.x, isPositionYChanging ? source.position.y : start.position.y);
            var toRotation = isRotationChanging ? source.rotation : start.rotation;
            var toZoom = isZoomChanging ? source.zoom : start.zoom;
            var toScaleTransformation = new _matrix2.default().scale(toZoom, toZoom);
            var toTransformation = new _matrix2.default().scale(toZoom, toZoom).rotate(_math2.default.degToRad(-toRotation));

            // rotateTo, zoomTo
            if (isOriginAuto && !isPositionChanging) {
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
                // animate (with auto origin)
                else if (isOriginAuto && isPositionChanging && isRotationChanging) {
                        toOrigin.copy(toPosition);
                    }

            toScaleOffset = this.camera._convertPositionToOffset(toPosition, this.camera.center, toOrigin, toScaleTransformation);
            toOffset = this.camera._convertPositionToOffset(toPosition, this.camera.center, toOrigin, toTransformation);

            return {
                isOriginAuto: isOriginAuto,
                isPositionChanging: isPositionChanging,
                isRotationChanging: isRotationChanging,
                scaleOffsetX: isOffsetChanging ? toScaleOffset.x : null,
                scaleOffsetY: isOffsetChanging ? toScaleOffset.y : null,
                offsetX: isOffsetChanging ? toOffset.x : null,
                offsetY: isOffsetChanging ? toOffset.y : null,
                origin: isAnchored || isOriginChanging || isOriginAuto && isPositionChanging && isRotationChanging ? toOrigin : null,
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

                // Ensure offset matches current position before tween starts
                this.camera._updateRawOffset();

                // Origin and offset must be updated before tween starts
                this.camera.setTransformOrigin(toProps.origin);

                tween.vars._rawOffsetX = toProps.offsetX;
                tween.vars._rawOffsetY = toProps.offsetY;
                tween.vars._rawScaleOffsetX = toProps.scaleOffsetX;
                tween.vars._rawScaleOffsetY = toProps.scaleOffsetY;
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
                origin: _utils2.default.parseOrigin(origin, this.camera.scene.view),
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
                    easeOut: shake.easeOut
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
            view = _ref$view === undefined ? null : _ref$view,
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
        this.scenes = new _sceneManager2.default();

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
        this.view = null;

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
        * @property {Vector2} - The offset of the camera's top left corner relative to the scene without clamping or effects applied. Used to animate the camera.
        */
        this._rawOffset = new _vector2.default(0, 0);

        /**
        * @private
        * @property {Vector2} - The offset of the camera's top left corner relative to the scene without clamping or effects applied and only taking scale into account. Used to animate the camera.
        */
        this._rawScaleOffset = new _vector2.default(0, 0);

        /**
        * @private
        * @property {Vector2} - The offset of the scene's transform origin from 0,0.
        */
        this._transformOriginOffset = new _vector2.default(0, 0);

        /**
        * @private
        * @property {number} - The internally managed zoom.
        */
        this._zoom = 1;

        // Initialize position
        this.setPosition(new _vector2.default(width * 0.5, height * 0.5));

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

                        if (animation.totalProgress() > 0) {
                            animation.seek(0).invalidate();

                            if (animation.coreTweens[0]) {
                                this.camera.setPosition(animation.coreTweens[0].props.start.position);
                            }

                            animation.seek(time, false);
                        }

                        if (!wasPaused) {
                            this.camera.resume();
                        }
                    }
                },
                onCompleteParams: [_this.animations.isPaused]
            }).moveTo(_this.position, 0, { overwrite: false });
        };

        // Initialize event listeners
        this._events.addListener('change:size', this.onResize);

        // Initialize view
        this.setView(view);

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
    *   var transformation = this.scaleTransform.getInverse();
    *   var min = this.center.clone().transform(transformation);
    *   var max = new Vector2(this.scene.width, this.scene.height).transform(this.scaleTransform).subtract(this.center).transform(transformation);
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
        key: '_clampPosition',


        /**
        * Clamps the position.
        *
        * @private
        * @param {Vector2} position - The position.
        * @returns {Vector2} The clamped position.
        */
        value: function _clampPosition(position) {
            return position.clone().set(this._clampPositionX(position.x), this._clampPositionY(position.y));
        }

        /**
        * Clamps the X position.
        *
        * @private
        * @param {number} x - The position.
        * @returns {number} The clamped position.
        */

    }, {
        key: '_clampPositionX',
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
        * @private
        * @returns {this} self
        */

    }, {
        key: '_reset',
        value: function _reset() {
            this.transformOrigin.set(0, 0);
            this.setPosition(new _vector2.default(this.width * 0.5, this.height * 0.5));
            this.rotation = 0;
            this.zoom = 1;
            this._rasterScale = 1;
            this._updateRawOffset();

            return this;
        }

        /**
        * Updates the bounds.
        *
        * @private
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

                // TODO: Turn applyBounds into a separate function that calls _updateBounds, then applies them
                if (!this.isAnimating) {
                    this.setPosition(this.position);
                }

                // TODO: For dev only
                console.log('update bounds');
            }

            return this;
        }

        /**
        * Updates the raw offset.
        *
        * @private
        * @returns {this} self
        */

    }, {
        key: '_updateRawOffset',
        value: function _updateRawOffset() {
            this._rawOffset.copy(this._convertPositionToOffset(this.position, this.center, this.transformOrigin, this.transformation));
            this._rawScaleOffset.copy(this._convertPositionToOffset(this.position, this.center, this.transformOrigin, this.scaleTransformation));

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
            this.setView(null);
            this.animations.destroy();
            this.renderer.destroy();
            this.scenes.destroy();
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
            if (this.trackControl && this.dragToMove) {
                this.trackControl.disableDrag();
            }

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
            if (this.trackControl && this.dragToMove) {
                this.trackControl.enableDrag();
            }

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
            if (this.trackControl && this.wheelToZoom) {
                this.trackControl.disableWheel();
            }

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
            if (this.trackControl && this.wheelToZoom) {
                this.trackControl.enableWheel();
            }

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
        * Render the camera. If you need to manipulate how the camera renders, use {@link Camera#onBeforeRender|onBeforeRender} and {@link Camera#onRender|onRender}.
        *
        * @returns {this} self
        */

    }, {
        key: 'render',
        value: function render() {
            this.onBeforeRender();

            if (this.view !== null) {
                this.renderer.render();
            }

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
                if (this.view !== null) {
                    this.renderer.renderSize();
                }
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
                    this._updateRawOffset();
                }
            }

            return this;
        }

        /**
        * Sets the view.
        *
        * @param {string|Element} view - The view. This can be a selector or an element.
        * @returns {this} self
        */

    }, {
        key: 'setView',
        value: function setView(view) {
            view = _utils2.default.DOM.parseView(view);

            if (this.view) {
                if (this.view.parentNode) {
                    this.view.parentNode.removeChild(this.view);
                }

                this.trackControl.destroy();
                this.trackControl = null;
                this.view = null;
                this.isRendered = false;
                this._rasterScale = this.zoom;
            }

            if (view) {
                this.view = view;
                this.scenes.ensureView();
                this.view.style.display = 'none';
                this.view.style.overflow = 'hidden';
                this.view.style.position = 'relative';
                this.view.appendChild(this.scenes.view);
                this.trackControl = new _trackControl2.default(this, {
                    draggable: this.dragToMove,
                    onDrag: function onDrag(camera) {
                        var position = camera._convertOffsetToPosition(new _vector2.default(-this.x, -this.y), camera.center, camera.transformOrigin, camera.transformation);

                        camera.moveTo(position, 0, {
                            onCompleteParams: [this],
                            onComplete: function onComplete(dragControl) {
                                dragControl.update();
                            }
                        });
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

                            camera.zoomAt(origin, zoom, 0);
                        }
                    }
                });
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
        * @name Camera#_rawOffsetX
        * @property {Vector2} - The X offset of the camera's top left corner relative to the scene without clamping or effects applied.
        */

    }, {
        key: '_rawOffsetX',
        get: function get() {
            return this._rawOffset.x;
        },
        set: function set(value) {
            this._rawOffset.x = value;
        }

        /**
        * @name Camera#_rawOffsetY
        * @property {Vector2} - The Y offset of the camera's top left corner relative to the scene without clamping or effects applied.
        */

    }, {
        key: '_rawOffsetY',
        get: function get() {
            return this._rawOffset.y;
        },
        set: function set(value) {
            this._rawOffset.y = value;
        }

        /**
        * @name Camera#_rawScaleOffsetX
        * @property {Vector2} - The X offset of the camera's top left corner relative to the scene without clamping or effects applied and only taking scale into account.
        */

    }, {
        key: '_rawScaleOffsetX',
        get: function get() {
            return this._rawScaleOffset.x;
        },
        set: function set(value) {
            this._rawScaleOffset.x = value;
        }

        /**
        * @name Camera#_rawScaleOffsetY
        * @property {Vector2} - The Y offset of the camera's top left corner relative to the scene without clamping or effects applied and only taking scale into account.
        */

    }, {
        key: '_rawScaleOffsetY',
        get: function get() {
            return this._rawScaleOffset.y;
        },
        set: function set(value) {
            this._rawScaleOffset.y = value;
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
        * @name Camera#scaleTransformation
        * @property {Matrix2} - The scale transformation of the scene.
        * @readonly
        */

    }, {
        key: 'scaleTransformation',
        get: function get() {
            return new _matrix2.default().scale(this.zoom, this.zoom);
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
        var transformation = this.scaleTransform.getInverse();
        var min = this.center.clone().transform(transformation);
        var max = new _vector2.default(this.scene.width, this.scene.height).transform(this.scaleTransform).subtract(this.center).transform(transformation);

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

Object.defineProperty(exports, "__esModule", {
    value: true
});
var originKeyword = exports.originKeyword = {
    AUTO: 'auto'
};

/**
* Object types.
* @enum {number}
*/
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
            var offset = this.camera._convertPositionToOffset(this.camera.position, this.camera.center, this.camera.transformOrigin, this.camera.transformation);
            var rasterIncrement = 0.3;
            var scaleFactor = this.camera.zoom >= 1 ? Math.floor(this.camera.zoom) : 0.5;

            // Ensure scene is visible. In order for scene auto-size to work, it must have been included during browser layout.
            this.camera.scene.view.style.visibility = 'visible';

            // Control rasterization to maintain clarity when zooming
            if (this.camera.zoom === this.camera.maxZoom || this.camera.zoomDirection === _constants.zoomDirection.IN && this.camera.zoom > this.camera._rasterScale + rasterIncrement * scaleFactor) {
                this.camera._rasterScale = this.camera.zoom;
                this.camera.scenes.view.style.willChange = 'auto';
            } else {
                this.camera.scenes.view.style.willChange = 'transform';
            }

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

            if (this.camera.isRendered === false) {
                this.renderSize();
                this.camera.view.style.display = 'block';
                this.camera.isRendered = true;
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
            TweenLite.set(this.camera.view, {
                css: {
                    height: this.camera.height,
                    width: this.camera.width
                }
            });
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

var _sceneManager = require('./sceneManager');

var _sceneManager2 = _interopRequireDefault(_sceneManager);

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
    SceneManager: _sceneManager2.default,
    Utils: _utils2.default,
    Vector2: _vector2.default
};

module.exports = Oculo;

},{"./animation":42,"./camera":44,"./cssRenderer":46,"./math/math":48,"./math/matrix2":49,"./math/vector2":50,"./scene":52,"./sceneManager":53,"./utils":55}],52:[function(require,module,exports){
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sceneSize = {
    AUTO: 'auto'
};

/**
* Creates a scene.
* 
* @class Oculo.Scene
* @constructor
* @param {string|Element} [view=null] - The view for the scene. It can be a selector or an element.
* @param {number} [width='auto'] - The width of the scene.
* @param {number} [height='auto'] - The height of the scene.
*/

var Scene = function () {
    function Scene() {
        var view = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'auto';
        var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'auto';

        _classCallCheck(this, Scene);

        /**
        * @property {Element} - The view. An HTML element.
        */
        this.view = null;

        /**
        * @private
        * @property {number|string} - The width.
        */
        this._width = width;

        /**
        * @private
        * @property {number|string} - The height.
        */
        this._height = height;

        // Set up view
        this.setView(view);
    }

    /**
    * @name Scene#width
    * @property {number} - The width.
    */


    _createClass(Scene, [{
        key: 'activateView',


        /**
        * Activates the view.
        *
        * @returns {this} self
        */
        value: function activateView() {
            if (!this.view) {
                this.view = document.createElement('div');
            }

            this.view.style.visibility = 'hidden';
            this.view.style.display = 'block';

            return this;
        }

        /**
        * Destroys the scene and prepares it for garbage collection.
        *
        * @returns {this} self
        */

    }, {
        key: 'destroy',
        value: function destroy() {
            this.removeView();
            this.view = null;

            return this;
        }

        /**
        * Removes the view from the document.
        *
        * @param {Element} view - The view.
        * @returns {this} self
        */

    }, {
        key: 'removeView',
        value: function removeView() {
            if (this.view && this.view.parentNode) {
                this.view.parentNode.removeChild(this.view);
            }

            return this;
        }

        /**
        * Sets the view.
        *
        * @param {string|Element} view - The view. This can be a selector or an element.
        * @returns {this} self
        */

    }, {
        key: 'setView',
        value: function setView(view) {
            view = _utils2.default.DOM.parseView(view);

            this.removeView();
            this.view = view;
            // Ensure the new view is not in the DOM if it originated there
            this.removeView();
        }
    }, {
        key: 'width',
        get: function get() {
            return this._width !== sceneSize.AUTO ? this._width : this.view ? this.view.offsetWidth : 0;
        },
        set: function set(value) {
            this._width = value;
        }

        /**
        * @name Scene#height
        * @property {number} - The height.
        */

    }, {
        key: 'height',
        get: function get() {
            return this._height !== sceneSize.AUTO ? this._height : this.view ? this.view.offsetHeight : 0;
        },
        set: function set(value) {
            this._height = value;
        }
    }]);

    return Scene;
}();

exports.default = Scene;

},{"./utils":55}],53:[function(require,module,exports){
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
* Creates a scene manager.
* 
* @class Oculo.SceneManager
* @constructor
*/
var SceneManager = function () {
    function SceneManager() {
        _classCallCheck(this, SceneManager);

        /**
        * @property {Oculo.Scene} - The active scene.
        * @readonly
        */
        this.activeScene = null;

        /**
        * @property {Element} - The view. An HTML element.
        */
        this.view = null;

        /**
        * @property {Object} - An object for storing the managed Scene instances.
        * @private
        */
        this._scenes = {};
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
                scene = new _scene2.default(scene);
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

            this.activeScene = null;
            this.view = null;
            this._scenes = {};

            return this;
        }

        /**
        * Ensures a view is ready.
        *
        * @returns {this} self
        */

    }, {
        key: 'ensureView',
        value: function ensureView() {
            if (!this.view) {
                this.view = document.createElement('div');
                this.view.style.position = 'absolute';
            }

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
            if (this.activeScene) {
                this.activeScene.removeView();
            }

            this.activeScene = this._scenes[name];

            if (this.view) {
                this.activeScene.activateView();
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
            this.camera = null;

            if (this.isDraggable) {
                this.dragControl.destroy();
                this.dragControl = null;
            }

            if (this.isWheelable) {
                this.wheelControl.destroy();
                this.wheelControl = null;
            }

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

var _constants = require('./constants');

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
    * Parse the origin of the given input.
    *
    * @private
    * @param {string|Element|Object} [input] - The origin to parse.
    * @param {Element} world - The world.
    * @returns {string|Object} The parsed origin.
    */
    parseOrigin: function parseOrigin(input, world) {
        var origin = _constants.originKeyword.AUTO;
        var position = Utils.parsePosition(input, world);

        if (position !== null) {
            origin = position;
        }

        return origin;
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

},{"./constants":45,"./math/vector2":50,"lodash/isElement":24,"lodash/isObject":29}],56:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZiZW1pdHRlci9saWIvQmFzZUV2ZW50RW1pdHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0VtaXR0ZXJTdWJzY3JpcHRpb24uanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2xpYi9FdmVudFN1YnNjcmlwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZianMvbGliL2VtcHR5RnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvZmJqcy9saWIvaW52YXJpYW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fU3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYXJyYXlNYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlQ2xhbXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlR2V0VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZVRvU3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fY3JlYXRlUm91bmQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19mcmVlR2xvYmFsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UHJvdG90eXBlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UmF3VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fb2JqZWN0VG9TdHJpbmcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19vdmVyQXJnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fcm9vdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY2xhbXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNFbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0Zpbml0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNMZW5ndGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzTmlsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1BsYWluT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1N5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbm93LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9yb3VuZC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3RvRmluaXRlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b0ludGVnZXIuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3RvTnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmMvc2NyaXB0cy9BbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb25NYW5hZ2VyLmpzIiwic3JjL3NjcmlwdHMvY2FtZXJhLmpzIiwic3JjL3NjcmlwdHMvY29uc3RhbnRzLmpzIiwic3JjL3NjcmlwdHMvY3NzUmVuZGVyZXIuanMiLCJzcmMvc2NyaXB0cy9kcmFnQ29udHJvbC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0aC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0cml4Mi5qcyIsInNyYy9zY3JpcHRzL21hdGgvdmVjdG9yMi5qcyIsInNyYy9zY3JpcHRzL29jdWxvLmpzIiwic3JjL3NjcmlwdHMvc2NlbmUuanMiLCJzcmMvc2NyaXB0cy9zY2VuZU1hbmFnZXIuanMiLCJzcmMvc2NyaXB0cy90cmFja0NvbnRyb2wuanMiLCJzcmMvc2NyaXB0cy91dGlscy5qcyIsInNyYy9zY3JpcHRzL3doZWVsQ29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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LE1BQUwsQ0FBWSxtQkFBWixDQUFnQyxPQUFoQyxFQUF5QyxLQUFLLFFBQTlDO0FBQ0EsaUJBQUssUUFBTCxHQUFnQixLQUFoQjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7O2lDQUtVO0FBQ04saUJBQUssTUFBTCxDQUFZLGdCQUFaLENBQTZCLE9BQTdCLEVBQXNDLEtBQUssUUFBM0M7QUFDQSxpQkFBSyxRQUFMLEdBQWdCLElBQWhCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7OzRCQXZDYztBQUNYLG1CQUFPLEtBQUssUUFBWjtBQUNIOzs7Ozs7a0JBd0NVLFkiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICovXG5cbnZhciBmYmVtaXR0ZXIgPSB7XG4gIEV2ZW50RW1pdHRlcjogcmVxdWlyZSgnLi9saWIvQmFzZUV2ZW50RW1pdHRlcicpLFxuICBFbWl0dGVyU3Vic2NyaXB0aW9uIDogcmVxdWlyZSgnLi9saWIvRW1pdHRlclN1YnNjcmlwdGlvbicpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZiZW1pdHRlcjtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgQmFzZUV2ZW50RW1pdHRlclxuICogQHR5cGVjaGVja3NcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgRW1pdHRlclN1YnNjcmlwdGlvbiA9IHJlcXVpcmUoJy4vRW1pdHRlclN1YnNjcmlwdGlvbicpO1xudmFyIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yID0gcmVxdWlyZSgnLi9FdmVudFN1YnNjcmlwdGlvblZlbmRvcicpO1xuXG52YXIgZW1wdHlGdW5jdGlvbiA9IHJlcXVpcmUoJ2ZianMvbGliL2VtcHR5RnVuY3Rpb24nKTtcbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcblxuLyoqXG4gKiBAY2xhc3MgQmFzZUV2ZW50RW1pdHRlclxuICogQGRlc2NyaXB0aW9uXG4gKiBBbiBFdmVudEVtaXR0ZXIgaXMgcmVzcG9uc2libGUgZm9yIG1hbmFnaW5nIGEgc2V0IG9mIGxpc3RlbmVycyBhbmQgcHVibGlzaGluZ1xuICogZXZlbnRzIHRvIHRoZW0gd2hlbiBpdCBpcyB0b2xkIHRoYXQgc3VjaCBldmVudHMgaGFwcGVuZWQuIEluIGFkZGl0aW9uIHRvIHRoZVxuICogZGF0YSBmb3IgdGhlIGdpdmVuIGV2ZW50IGl0IGFsc28gc2VuZHMgYSBldmVudCBjb250cm9sIG9iamVjdCB3aGljaCBhbGxvd3NcbiAqIHRoZSBsaXN0ZW5lcnMvaGFuZGxlcnMgdG8gcHJldmVudCB0aGUgZGVmYXVsdCBiZWhhdmlvciBvZiB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogVGhlIGVtaXR0ZXIgaXMgZGVzaWduZWQgdG8gYmUgZ2VuZXJpYyBlbm91Z2ggdG8gc3VwcG9ydCBhbGwgdGhlIGRpZmZlcmVudFxuICogY29udGV4dHMgaW4gd2hpY2ggb25lIG1pZ2h0IHdhbnQgdG8gZW1pdCBldmVudHMuIEl0IGlzIGEgc2ltcGxlIG11bHRpY2FzdFxuICogbWVjaGFuaXNtIG9uIHRvcCBvZiB3aGljaCBleHRyYSBmdW5jdGlvbmFsaXR5IGNhbiBiZSBjb21wb3NlZC4gRm9yIGV4YW1wbGUsIGFcbiAqIG1vcmUgYWR2YW5jZWQgZW1pdHRlciBtYXkgdXNlIGFuIEV2ZW50SG9sZGVyIGFuZCBFdmVudEZhY3RvcnkuXG4gKi9cblxudmFyIEJhc2VFdmVudEVtaXR0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuXG4gIGZ1bmN0aW9uIEJhc2VFdmVudEVtaXR0ZXIoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEJhc2VFdmVudEVtaXR0ZXIpO1xuXG4gICAgdGhpcy5fc3Vic2NyaWJlciA9IG5ldyBFdmVudFN1YnNjcmlwdGlvblZlbmRvcigpO1xuICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBsaXN0ZW5lciB0byBiZSBpbnZva2VkIHdoZW4gZXZlbnRzIG9mIHRoZSBzcGVjaWZpZWQgdHlwZSBhcmVcbiAgICogZW1pdHRlZC4gQW4gb3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG1heSBiZSBwcm92aWRlZC4gVGhlIGRhdGEgYXJndW1lbnRzXG4gICAqIGVtaXR0ZWQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUT0RPOiBBbm5vdGF0ZSB0aGUgbGlzdGVuZXIgYXJnJ3MgdHlwZS4gVGhpcyBpcyB0cmlja3kgYmVjYXVzZSBsaXN0ZW5lcnNcbiAgICogICAgICAgY2FuIGJlIGludm9rZWQgd2l0aCB2YXJhcmdzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIC0gTmFtZSBvZiB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gRnVuY3Rpb24gdG8gaW52b2tlIHdoZW4gdGhlIHNwZWNpZmllZCBldmVudCBpc1xuICAgKiAgIGVtaXR0ZWRcbiAgICogQHBhcmFtIHsqfSBjb250ZXh0IC0gT3B0aW9uYWwgY29udGV4dCBvYmplY3QgdG8gdXNlIHdoZW4gaW52b2tpbmcgdGhlXG4gICAqICAgbGlzdGVuZXJcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldmVudFR5cGUsIGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX3N1YnNjcmliZXIuYWRkU3Vic2NyaXB0aW9uKGV2ZW50VHlwZSwgbmV3IEVtaXR0ZXJTdWJzY3JpcHRpb24odGhpcy5fc3Vic2NyaWJlciwgbGlzdGVuZXIsIGNvbnRleHQpKTtcbiAgfTtcblxuICAvKipcbiAgICogU2ltaWxhciB0byBhZGRMaXN0ZW5lciwgZXhjZXB0IHRoYXQgdGhlIGxpc3RlbmVyIGlzIHJlbW92ZWQgYWZ0ZXIgaXQgaXNcbiAgICogaW52b2tlZCBvbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIC0gTmFtZSBvZiB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gRnVuY3Rpb24gdG8gaW52b2tlIG9ubHkgb25jZSB3aGVuIHRoZVxuICAgKiAgIHNwZWNpZmllZCBldmVudCBpcyBlbWl0dGVkXG4gICAqIEBwYXJhbSB7Kn0gY29udGV4dCAtIE9wdGlvbmFsIGNvbnRleHQgb2JqZWN0IHRvIHVzZSB3aGVuIGludm9raW5nIHRoZVxuICAgKiAgIGxpc3RlbmVyXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICB2YXIgZW1pdHRlciA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZlbnRUeXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICBlbWl0dGVyLnJlbW92ZUN1cnJlbnRMaXN0ZW5lcigpO1xuICAgICAgbGlzdGVuZXIuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgb2YgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzLCBpbmNsdWRpbmcgdGhvc2UgcmVnaXN0ZXJlZCBhc1xuICAgKiBsaXN0ZW5lciBtYXBzLlxuICAgKlxuICAgKiBAcGFyYW0gez9zdHJpbmd9IGV2ZW50VHlwZSAtIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHdob3NlIHJlZ2lzdGVyZWRcbiAgICogICBsaXN0ZW5lcnMgdG8gcmVtb3ZlXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudFR5cGUpIHtcbiAgICB0aGlzLl9zdWJzY3JpYmVyLnJlbW92ZUFsbFN1YnNjcmlwdGlvbnMoZXZlbnRUeXBlKTtcbiAgfTtcblxuICAvKipcbiAgICogUHJvdmlkZXMgYW4gQVBJIHRoYXQgY2FuIGJlIGNhbGxlZCBkdXJpbmcgYW4gZXZlbnRpbmcgY3ljbGUgdG8gcmVtb3ZlIHRoZVxuICAgKiBsYXN0IGxpc3RlbmVyIHRoYXQgd2FzIGludm9rZWQuIFRoaXMgYWxsb3dzIGEgZGV2ZWxvcGVyIHRvIHByb3ZpZGUgYW4gZXZlbnRcbiAgICogb2JqZWN0IHRoYXQgY2FuIHJlbW92ZSB0aGUgbGlzdGVuZXIgKG9yIGxpc3RlbmVyIG1hcCkgZHVyaW5nIHRoZVxuICAgKiBpbnZvY2F0aW9uLlxuICAgKlxuICAgKiBJZiBpdCBpcyBjYWxsZWQgd2hlbiBub3QgaW5zaWRlIG9mIGFuIGVtaXR0aW5nIGN5Y2xlIGl0IHdpbGwgdGhyb3cuXG4gICAqXG4gICAqIEB0aHJvd3Mge0Vycm9yfSBXaGVuIGNhbGxlZCBub3QgZHVyaW5nIGFuIGV2ZW50aW5nIGN5Y2xlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgdmFyIHN1YnNjcmlwdGlvbiA9IGVtaXR0ZXIuYWRkTGlzdGVuZXJNYXAoe1xuICAgKiAgICAgc29tZUV2ZW50OiBmdW5jdGlvbihkYXRhLCBldmVudCkge1xuICAgKiAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICogICAgICAgZW1pdHRlci5yZW1vdmVDdXJyZW50TGlzdGVuZXIoKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICpcbiAgICogICBlbWl0dGVyLmVtaXQoJ3NvbWVFdmVudCcsICdhYmMnKTsgLy8gbG9ncyAnYWJjJ1xuICAgKiAgIGVtaXR0ZXIuZW1pdCgnc29tZUV2ZW50JywgJ2RlZicpOyAvLyBkb2VzIG5vdCBsb2cgYW55dGhpbmdcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQ3VycmVudExpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlQ3VycmVudExpc3RlbmVyKCkge1xuICAgICEhIXRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnTm90IGluIGFuIGVtaXR0aW5nIGN5Y2xlOyB0aGVyZSBpcyBubyBjdXJyZW50IHN1YnNjcmlwdGlvbicpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zdWJzY3JpYmVyLnJlbW92ZVN1YnNjcmlwdGlvbih0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uKTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdGhhdCBhcmUgY3VycmVudGx5IHJlZ2lzdGVyZWQgZm9yIHRoZSBnaXZlblxuICAgKiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSAtIE5hbWUgb2YgdGhlIGV2ZW50IHRvIHF1ZXJ5XG4gICAqIEByZXR1cm4ge2FycmF5fVxuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnRUeXBlKSAvKiBUT0RPOiBBcnJheTxFdmVudFN1YnNjcmlwdGlvbj4gKi97XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB0aGlzLl9zdWJzY3JpYmVyLmdldFN1YnNjcmlwdGlvbnNGb3JUeXBlKGV2ZW50VHlwZSk7XG4gICAgcmV0dXJuIHN1YnNjcmlwdGlvbnMgPyBzdWJzY3JpcHRpb25zLmZpbHRlcihlbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVHJ1ZSkubWFwKGZ1bmN0aW9uIChzdWJzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybiBzdWJzY3JpcHRpb24ubGlzdGVuZXI7XG4gICAgfSkgOiBbXTtcbiAgfTtcblxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgb2YgdGhlIGdpdmVuIHR5cGUgd2l0aCB0aGUgZ2l2ZW4gZGF0YS4gQWxsIGhhbmRsZXJzIG9mIHRoYXRcbiAgICogcGFydGljdWxhciB0eXBlIHdpbGwgYmUgbm90aWZpZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgLSBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0XG4gICAqIEBwYXJhbSB7Kn0gQXJiaXRyYXJ5IGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCByZWdpc3RlcmVkIGxpc3RlbmVyXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgZW1pdHRlci5hZGRMaXN0ZW5lcignc29tZUV2ZW50JywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgKiAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAqICAgfSk7XG4gICAqXG4gICAqICAgZW1pdHRlci5lbWl0KCdzb21lRXZlbnQnLCAnYWJjJyk7IC8vIGxvZ3MgJ2FiYydcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnRUeXBlKSB7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB0aGlzLl9zdWJzY3JpYmVyLmdldFN1YnNjcmlwdGlvbnNGb3JUeXBlKGV2ZW50VHlwZSk7XG4gICAgaWYgKHN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3Vic2NyaXB0aW9ucyk7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwga2V5cy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaWldO1xuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gc3Vic2NyaXB0aW9uc1trZXldO1xuICAgICAgICAvLyBUaGUgc3Vic2NyaXB0aW9uIG1heSBoYXZlIGJlZW4gcmVtb3ZlZCBkdXJpbmcgdGhpcyBldmVudCBsb29wLlxuICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICB0aGlzLl9fZW1pdFRvU3Vic2NyaXB0aW9uLmFwcGx5KHRoaXMsIFtzdWJzY3JpcHRpb25dLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUHJvdmlkZXMgYSBob29rIHRvIG92ZXJyaWRlIGhvdyB0aGUgZW1pdHRlciBlbWl0cyBhbiBldmVudCB0byBhIHNwZWNpZmljXG4gICAqIHN1YnNjcmlwdGlvbi4gVGhpcyBhbGxvd3MgeW91IHRvIHNldCB1cCBsb2dnaW5nIGFuZCBlcnJvciBib3VuZGFyaWVzXG4gICAqIHNwZWNpZmljIHRvIHlvdXIgZW52aXJvbm1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7RW1pdHRlclN1YnNjcmlwdGlvbn0gc3Vic2NyaXB0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICogQHBhcmFtIHsqfSBBcmJpdHJhcnkgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIHJlZ2lzdGVyZWQgbGlzdGVuZXJcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuX19lbWl0VG9TdWJzY3JpcHRpb24gPSBmdW5jdGlvbiBfX2VtaXRUb1N1YnNjcmlwdGlvbihzdWJzY3JpcHRpb24sIGV2ZW50VHlwZSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICBzdWJzY3JpcHRpb24ubGlzdGVuZXIuYXBwbHkoc3Vic2NyaXB0aW9uLmNvbnRleHQsIGFyZ3MpO1xuICB9O1xuXG4gIHJldHVybiBCYXNlRXZlbnRFbWl0dGVyO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlRXZlbnRFbWl0dGVyOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqIFxuICogQHByb3ZpZGVzTW9kdWxlIEVtaXR0ZXJTdWJzY3JpcHRpb25cbiAqIEB0eXBlY2hlY2tzXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIEV2ZW50U3Vic2NyaXB0aW9uID0gcmVxdWlyZSgnLi9FdmVudFN1YnNjcmlwdGlvbicpO1xuXG4vKipcbiAqIEVtaXR0ZXJTdWJzY3JpcHRpb24gcmVwcmVzZW50cyBhIHN1YnNjcmlwdGlvbiB3aXRoIGxpc3RlbmVyIGFuZCBjb250ZXh0IGRhdGEuXG4gKi9cblxudmFyIEVtaXR0ZXJTdWJzY3JpcHRpb24gPSAoZnVuY3Rpb24gKF9FdmVudFN1YnNjcmlwdGlvbikge1xuICBfaW5oZXJpdHMoRW1pdHRlclN1YnNjcmlwdGlvbiwgX0V2ZW50U3Vic2NyaXB0aW9uKTtcblxuICAvKipcbiAgICogQHBhcmFtIHtFdmVudFN1YnNjcmlwdGlvblZlbmRvcn0gc3Vic2NyaWJlciAtIFRoZSBzdWJzY3JpYmVyIHRoYXQgY29udHJvbHNcbiAgICogICB0aGlzIHN1YnNjcmlwdGlvblxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lciAtIEZ1bmN0aW9uIHRvIGludm9rZSB3aGVuIHRoZSBzcGVjaWZpZWQgZXZlbnQgaXNcbiAgICogICBlbWl0dGVkXG4gICAqIEBwYXJhbSB7Kn0gY29udGV4dCAtIE9wdGlvbmFsIGNvbnRleHQgb2JqZWN0IHRvIHVzZSB3aGVuIGludm9raW5nIHRoZVxuICAgKiAgIGxpc3RlbmVyXG4gICAqL1xuXG4gIGZ1bmN0aW9uIEVtaXR0ZXJTdWJzY3JpcHRpb24oc3Vic2NyaWJlciwgbGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRW1pdHRlclN1YnNjcmlwdGlvbik7XG5cbiAgICBfRXZlbnRTdWJzY3JpcHRpb24uY2FsbCh0aGlzLCBzdWJzY3JpYmVyKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgfVxuXG4gIHJldHVybiBFbWl0dGVyU3Vic2NyaXB0aW9uO1xufSkoRXZlbnRTdWJzY3JpcHRpb24pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXJTdWJzY3JpcHRpb247IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBFdmVudFN1YnNjcmlwdGlvblxuICogQHR5cGVjaGVja3NcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRXZlbnRTdWJzY3JpcHRpb24gcmVwcmVzZW50cyBhIHN1YnNjcmlwdGlvbiB0byBhIHBhcnRpY3VsYXIgZXZlbnQuIEl0IGNhblxuICogcmVtb3ZlIGl0cyBvd24gc3Vic2NyaXB0aW9uLlxuICovXG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgRXZlbnRTdWJzY3JpcHRpb24gPSAoZnVuY3Rpb24gKCkge1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yfSBzdWJzY3JpYmVyIHRoZSBzdWJzY3JpYmVyIHRoYXQgY29udHJvbHNcbiAgICogICB0aGlzIHN1YnNjcmlwdGlvbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gRXZlbnRTdWJzY3JpcHRpb24oc3Vic2NyaWJlcikge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudFN1YnNjcmlwdGlvbik7XG5cbiAgICB0aGlzLnN1YnNjcmliZXIgPSBzdWJzY3JpYmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhpcyBzdWJzY3JpcHRpb24gZnJvbSB0aGUgc3Vic2NyaWJlciB0aGF0IGNvbnRyb2xzIGl0LlxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvbi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgIGlmICh0aGlzLnN1YnNjcmliZXIpIHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlci5yZW1vdmVTdWJzY3JpcHRpb24odGhpcyk7XG4gICAgICB0aGlzLnN1YnNjcmliZXIgPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gRXZlbnRTdWJzY3JpcHRpb247XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50U3Vic2NyaXB0aW9uOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqIFxuICogQHByb3ZpZGVzTW9kdWxlIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yXG4gKiBAdHlwZWNoZWNrc1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcblxuLyoqXG4gKiBFdmVudFN1YnNjcmlwdGlvblZlbmRvciBzdG9yZXMgYSBzZXQgb2YgRXZlbnRTdWJzY3JpcHRpb25zIHRoYXQgYXJlXG4gKiBzdWJzY3JpYmVkIHRvIGEgcGFydGljdWxhciBldmVudCB0eXBlLlxuICovXG5cbnZhciBFdmVudFN1YnNjcmlwdGlvblZlbmRvciA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudFN1YnNjcmlwdGlvblZlbmRvcik7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZSA9IHt9O1xuICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBzdWJzY3JpcHRpb24ga2V5ZWQgYnkgYW4gZXZlbnQgdHlwZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICAgKiBAcGFyYW0ge0V2ZW50U3Vic2NyaXB0aW9ufSBzdWJzY3JpcHRpb25cbiAgICovXG5cbiAgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IucHJvdG90eXBlLmFkZFN1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uIGFkZFN1YnNjcmlwdGlvbihldmVudFR5cGUsIHN1YnNjcmlwdGlvbikge1xuICAgICEoc3Vic2NyaXB0aW9uLnN1YnNjcmliZXIgPT09IHRoaXMpID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ1RoZSBzdWJzY3JpYmVyIG9mIHRoZSBzdWJzY3JpcHRpb24gaXMgaW5jb3JyZWN0bHkgc2V0LicpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoIXRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0pIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0gPSBbXTtcbiAgICB9XG4gICAgdmFyIGtleSA9IHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0ubGVuZ3RoO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0ucHVzaChzdWJzY3JpcHRpb24pO1xuICAgIHN1YnNjcmlwdGlvbi5ldmVudFR5cGUgPSBldmVudFR5cGU7XG4gICAgc3Vic2NyaXB0aW9uLmtleSA9IGtleTtcbiAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgYnVsayBzZXQgb2YgdGhlIHN1YnNjcmlwdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7P3N0cmluZ30gZXZlbnRUeXBlIC0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZSB3aG9zZVxuICAgKiAgIHJlZ2lzdGVyZWQgc3Vwc2NyaXB0aW9ucyB0byByZW1vdmUsIGlmIG51bGwgcmVtb3ZlIGFsbCBzdWJzY3JpcHRpb25zLlxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvblZlbmRvci5wcm90b3R5cGUucmVtb3ZlQWxsU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIHJlbW92ZUFsbFN1YnNjcmlwdGlvbnMoZXZlbnRUeXBlKSB7XG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZSA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBzcGVjaWZpYyBzdWJzY3JpcHRpb24uIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIGZ1bmN0aW9uLCBjYWxsXG4gICAqIGBzdWJzY3JpcHRpb24ucmVtb3ZlKClgIGRpcmVjdGx5LlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gc3Vic2NyaXB0aW9uXG4gICAqL1xuXG4gIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLnByb3RvdHlwZS5yZW1vdmVTdWJzY3JpcHRpb24gPSBmdW5jdGlvbiByZW1vdmVTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uKSB7XG4gICAgdmFyIGV2ZW50VHlwZSA9IHN1YnNjcmlwdGlvbi5ldmVudFR5cGU7XG4gICAgdmFyIGtleSA9IHN1YnNjcmlwdGlvbi5rZXk7XG5cbiAgICB2YXIgc3Vic2NyaXB0aW9uc0ZvclR5cGUgPSB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdO1xuICAgIGlmIChzdWJzY3JpcHRpb25zRm9yVHlwZSkge1xuICAgICAgZGVsZXRlIHN1YnNjcmlwdGlvbnNGb3JUeXBlW2tleV07XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBzdWJzY3JpcHRpb25zIHRoYXQgYXJlIGN1cnJlbnRseSByZWdpc3RlcmVkIGZvciB0aGVcbiAgICogZ2l2ZW4gZXZlbnQgdHlwZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyBhcnJheSBjYW4gYmUgcG90ZW50aWFsbHkgc3BhcnNlIGFzIHN1YnNjcmlwdGlvbnMgYXJlIGRlbGV0ZWRcbiAgICogZnJvbSBpdCB3aGVuIHRoZXkgYXJlIHJlbW92ZWQuXG4gICAqXG4gICAqIFRPRE86IFRoaXMgcmV0dXJucyBhIG51bGxhYmxlIGFycmF5LiB3YXQ/XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICogQHJldHVybiB7P2FycmF5fVxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvblZlbmRvci5wcm90b3R5cGUuZ2V0U3Vic2NyaXB0aW9uc0ZvclR5cGUgPSBmdW5jdGlvbiBnZXRTdWJzY3JpcHRpb25zRm9yVHlwZShldmVudFR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXTtcbiAgfTtcblxuICByZXR1cm4gRXZlbnRTdWJzY3JpcHRpb25WZW5kb3I7XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogXG4gKi9cblxuZnVuY3Rpb24gbWFrZUVtcHR5RnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFyZztcbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGFjY2VwdHMgYW5kIGRpc2NhcmRzIGlucHV0czsgaXQgaGFzIG5vIHNpZGUgZWZmZWN0cy4gVGhpcyBpc1xuICogcHJpbWFyaWx5IHVzZWZ1bCBpZGlvbWF0aWNhbGx5IGZvciBvdmVycmlkYWJsZSBmdW5jdGlvbiBlbmRwb2ludHMgd2hpY2hcbiAqIGFsd2F5cyBuZWVkIHRvIGJlIGNhbGxhYmxlLCBzaW5jZSBKUyBsYWNrcyBhIG51bGwtY2FsbCBpZGlvbSBhbGEgQ29jb2EuXG4gKi9cbnZhciBlbXB0eUZ1bmN0aW9uID0gZnVuY3Rpb24gZW1wdHlGdW5jdGlvbigpIHt9O1xuXG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zID0gbWFrZUVtcHR5RnVuY3Rpb247XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zRmFsc2UgPSBtYWtlRW1wdHlGdW5jdGlvbihmYWxzZSk7XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVHJ1ZSA9IG1ha2VFbXB0eUZ1bmN0aW9uKHRydWUpO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc051bGwgPSBtYWtlRW1wdHlGdW5jdGlvbihudWxsKTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNUaGlzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zQXJndW1lbnQgPSBmdW5jdGlvbiAoYXJnKSB7XG4gIHJldHVybiBhcmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVtcHR5RnVuY3Rpb247IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVXNlIGludmFyaWFudCgpIHRvIGFzc2VydCBzdGF0ZSB3aGljaCB5b3VyIHByb2dyYW0gYXNzdW1lcyB0byBiZSB0cnVlLlxuICpcbiAqIFByb3ZpZGUgc3ByaW50Zi1zdHlsZSBmb3JtYXQgKG9ubHkgJXMgaXMgc3VwcG9ydGVkKSBhbmQgYXJndW1lbnRzXG4gKiB0byBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgYnJva2UgYW5kIHdoYXQgeW91IHdlcmVcbiAqIGV4cGVjdGluZy5cbiAqXG4gKiBUaGUgaW52YXJpYW50IG1lc3NhZ2Ugd2lsbCBiZSBzdHJpcHBlZCBpbiBwcm9kdWN0aW9uLCBidXQgdGhlIGludmFyaWFudFxuICogd2lsbCByZW1haW4gdG8gZW5zdXJlIGxvZ2ljIGRvZXMgbm90IGRpZmZlciBpbiBwcm9kdWN0aW9uLlxuICovXG5cbmZ1bmN0aW9uIGludmFyaWFudChjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgKyAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107XG4gICAgICB9KSk7XG4gICAgICBlcnJvci5uYW1lID0gJ0ludmFyaWFudCBWaW9sYXRpb24nO1xuICAgIH1cblxuICAgIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBpbnZhcmlhbnQncyBvd24gZnJhbWVcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDsiLCJ2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ubWFwYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgaXRlcmF0ZWVcbiAqIHNob3J0aGFuZHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFthcnJheV0gVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBtYXBwZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGFycmF5TWFwKGFycmF5LCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5ID09IG51bGwgPyAwIDogYXJyYXkubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRlZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheU1hcDtcbiIsIi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY2xhbXBgIHdoaWNoIGRvZXNuJ3QgY29lcmNlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciBUaGUgbnVtYmVyIHRvIGNsYW1wLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsb3dlcl0gVGhlIGxvd2VyIGJvdW5kLlxuICogQHBhcmFtIHtudW1iZXJ9IHVwcGVyIFRoZSB1cHBlciBib3VuZC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNsYW1wZWQgbnVtYmVyLlxuICovXG5mdW5jdGlvbiBiYXNlQ2xhbXAobnVtYmVyLCBsb3dlciwgdXBwZXIpIHtcbiAgaWYgKG51bWJlciA9PT0gbnVtYmVyKSB7XG4gICAgaWYgKHVwcGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG51bWJlciA9IG51bWJlciA8PSB1cHBlciA/IG51bWJlciA6IHVwcGVyO1xuICAgIH1cbiAgICBpZiAobG93ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbnVtYmVyID0gbnVtYmVyID49IGxvd2VyID8gbnVtYmVyIDogbG93ZXI7XG4gICAgfVxuICB9XG4gIHJldHVybiBudW1iZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUNsYW1wO1xuIiwidmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpLFxuICAgIGdldFJhd1RhZyA9IHJlcXVpcmUoJy4vX2dldFJhd1RhZycpLFxuICAgIG9iamVjdFRvU3RyaW5nID0gcmVxdWlyZSgnLi9fb2JqZWN0VG9TdHJpbmcnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIG51bGxUYWcgPSAnW29iamVjdCBOdWxsXScsXG4gICAgdW5kZWZpbmVkVGFnID0gJ1tvYmplY3QgVW5kZWZpbmVkXSc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBnZXRUYWdgIHdpdGhvdXQgZmFsbGJhY2tzIGZvciBidWdneSBlbnZpcm9ubWVudHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgYHRvU3RyaW5nVGFnYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUdldFRhZyh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkVGFnIDogbnVsbFRhZztcbiAgfVxuICB2YWx1ZSA9IE9iamVjdCh2YWx1ZSk7XG4gIHJldHVybiAoc3ltVG9TdHJpbmdUYWcgJiYgc3ltVG9TdHJpbmdUYWcgaW4gdmFsdWUpXG4gICAgPyBnZXRSYXdUYWcodmFsdWUpXG4gICAgOiBvYmplY3RUb1N0cmluZyh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUdldFRhZztcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKSxcbiAgICBhcnJheU1hcCA9IHJlcXVpcmUoJy4vX2FycmF5TWFwJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4vaXNBcnJheScpLFxuICAgIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBJTkZJTklUWSA9IDEgLyAwO1xuXG4vKiogVXNlZCB0byBjb252ZXJ0IHN5bWJvbHMgdG8gcHJpbWl0aXZlcyBhbmQgc3RyaW5ncy4gKi9cbnZhciBzeW1ib2xQcm90byA9IFN5bWJvbCA/IFN5bWJvbC5wcm90b3R5cGUgOiB1bmRlZmluZWQsXG4gICAgc3ltYm9sVG9TdHJpbmcgPSBzeW1ib2xQcm90byA/IHN5bWJvbFByb3RvLnRvU3RyaW5nIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnRvU3RyaW5nYCB3aGljaCBkb2Vzbid0IGNvbnZlcnQgbnVsbGlzaFxuICogdmFsdWVzIHRvIGVtcHR5IHN0cmluZ3MuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUb1N0cmluZyh2YWx1ZSkge1xuICAvLyBFeGl0IGVhcmx5IGZvciBzdHJpbmdzIHRvIGF2b2lkIGEgcGVyZm9ybWFuY2UgaGl0IGluIHNvbWUgZW52aXJvbm1lbnRzLlxuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbnZlcnQgdmFsdWVzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgcmV0dXJuIGFycmF5TWFwKHZhbHVlLCBiYXNlVG9TdHJpbmcpICsgJyc7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBzeW1ib2xUb1N0cmluZyA/IHN5bWJvbFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VUb1N0cmluZztcbiIsInZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuL3RvSW50ZWdlcicpLFxuICAgIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpLFxuICAgIHRvU3RyaW5nID0gcmVxdWlyZSgnLi90b1N0cmluZycpO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWluID0gTWF0aC5taW47XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGxpa2UgYF8ucm91bmRgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kTmFtZSBUaGUgbmFtZSBvZiB0aGUgYE1hdGhgIG1ldGhvZCB0byB1c2Ugd2hlbiByb3VuZGluZy5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHJvdW5kIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVSb3VuZChtZXRob2ROYW1lKSB7XG4gIHZhciBmdW5jID0gTWF0aFttZXRob2ROYW1lXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKG51bWJlciwgcHJlY2lzaW9uKSB7XG4gICAgbnVtYmVyID0gdG9OdW1iZXIobnVtYmVyKTtcbiAgICBwcmVjaXNpb24gPSBuYXRpdmVNaW4odG9JbnRlZ2VyKHByZWNpc2lvbiksIDI5Mik7XG4gICAgaWYgKHByZWNpc2lvbikge1xuICAgICAgLy8gU2hpZnQgd2l0aCBleHBvbmVudGlhbCBub3RhdGlvbiB0byBhdm9pZCBmbG9hdGluZy1wb2ludCBpc3N1ZXMuXG4gICAgICAvLyBTZWUgW01ETl0oaHR0cHM6Ly9tZG4uaW8vcm91bmQjRXhhbXBsZXMpIGZvciBtb3JlIGRldGFpbHMuXG4gICAgICB2YXIgcGFpciA9ICh0b1N0cmluZyhudW1iZXIpICsgJ2UnKS5zcGxpdCgnZScpLFxuICAgICAgICAgIHZhbHVlID0gZnVuYyhwYWlyWzBdICsgJ2UnICsgKCtwYWlyWzFdICsgcHJlY2lzaW9uKSk7XG5cbiAgICAgIHBhaXIgPSAodG9TdHJpbmcodmFsdWUpICsgJ2UnKS5zcGxpdCgnZScpO1xuICAgICAgcmV0dXJuICsocGFpclswXSArICdlJyArICgrcGFpclsxXSAtIHByZWNpc2lvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuYyhudW1iZXIpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVJvdW5kO1xuIiwiLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmcmVlR2xvYmFsO1xuIiwidmFyIG92ZXJBcmcgPSByZXF1aXJlKCcuL19vdmVyQXJnJyk7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIGdldFByb3RvdHlwZSA9IG92ZXJBcmcoT2JqZWN0LmdldFByb3RvdHlwZU9mLCBPYmplY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFByb3RvdHlwZTtcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKTtcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUdldFRhZ2Agd2hpY2ggaWdub3JlcyBgU3ltYm9sLnRvU3RyaW5nVGFnYCB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgcmF3IGB0b1N0cmluZ1RhZ2AuXG4gKi9cbmZ1bmN0aW9uIGdldFJhd1RhZyh2YWx1ZSkge1xuICB2YXIgaXNPd24gPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBzeW1Ub1N0cmluZ1RhZyksXG4gICAgICB0YWcgPSB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ107XG5cbiAgdHJ5IHtcbiAgICB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ10gPSB1bmRlZmluZWQ7XG4gICAgdmFyIHVubWFza2VkID0gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge31cblxuICB2YXIgcmVzdWx0ID0gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIGlmICh1bm1hc2tlZCkge1xuICAgIGlmIChpc093bikge1xuICAgICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdGFnO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdmFsdWVbc3ltVG9TdHJpbmdUYWddO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFJhd1RhZztcbiIsIi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBuYXRpdmVPYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgdXNpbmcgYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY29udmVydGVkIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIG5hdGl2ZU9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFRvU3RyaW5nO1xuIiwiLyoqXG4gKiBDcmVhdGVzIGEgdW5hcnkgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGBmdW5jYCB3aXRoIGl0cyBhcmd1bWVudCB0cmFuc2Zvcm1lZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gd3JhcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRyYW5zZm9ybSBUaGUgYXJndW1lbnQgdHJhbnNmb3JtLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIG92ZXJBcmcoZnVuYywgdHJhbnNmb3JtKSB7XG4gIHJldHVybiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gZnVuYyh0cmFuc2Zvcm0oYXJnKSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb3ZlckFyZztcbiIsInZhciBmcmVlR2xvYmFsID0gcmVxdWlyZSgnLi9fZnJlZUdsb2JhbCcpO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHNlbGZgLiAqL1xudmFyIGZyZWVTZWxmID0gdHlwZW9mIHNlbGYgPT0gJ29iamVjdCcgJiYgc2VsZiAmJiBzZWxmLk9iamVjdCA9PT0gT2JqZWN0ICYmIHNlbGY7XG5cbi8qKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0LiAqL1xudmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8IGZyZWVTZWxmIHx8IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gcm9vdDtcbiIsInZhciBiYXNlQ2xhbXAgPSByZXF1aXJlKCcuL19iYXNlQ2xhbXAnKSxcbiAgICB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKTtcblxuLyoqXG4gKiBDbGFtcHMgYG51bWJlcmAgd2l0aGluIHRoZSBpbmNsdXNpdmUgYGxvd2VyYCBhbmQgYHVwcGVyYCBib3VuZHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IE51bWJlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciBUaGUgbnVtYmVyIHRvIGNsYW1wLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsb3dlcl0gVGhlIGxvd2VyIGJvdW5kLlxuICogQHBhcmFtIHtudW1iZXJ9IHVwcGVyIFRoZSB1cHBlciBib3VuZC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNsYW1wZWQgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmNsYW1wKC0xMCwgLTUsIDUpO1xuICogLy8gPT4gLTVcbiAqXG4gKiBfLmNsYW1wKDEwLCAtNSwgNSk7XG4gKiAvLyA9PiA1XG4gKi9cbmZ1bmN0aW9uIGNsYW1wKG51bWJlciwgbG93ZXIsIHVwcGVyKSB7XG4gIGlmICh1cHBlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdXBwZXIgPSBsb3dlcjtcbiAgICBsb3dlciA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAodXBwZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIHVwcGVyID0gdG9OdW1iZXIodXBwZXIpO1xuICAgIHVwcGVyID0gdXBwZXIgPT09IHVwcGVyID8gdXBwZXIgOiAwO1xuICB9XG4gIGlmIChsb3dlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbG93ZXIgPSB0b051bWJlcihsb3dlcik7XG4gICAgbG93ZXIgPSBsb3dlciA9PT0gbG93ZXIgPyBsb3dlciA6IDA7XG4gIH1cbiAgcmV0dXJuIGJhc2VDbGFtcCh0b051bWJlcihudW1iZXIpLCBsb3dlciwgdXBwZXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYW1wO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJy4vbm93JyksXG4gICAgdG9OdW1iZXIgPSByZXF1aXJlKCcuL3RvTnVtYmVyJyk7XG5cbi8qKiBFcnJvciBtZXNzYWdlIGNvbnN0YW50cy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heCxcbiAgICBuYXRpdmVNaW4gPSBNYXRoLm1pbjtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZGVib3VuY2VkIGZ1bmN0aW9uIHRoYXQgZGVsYXlzIGludm9raW5nIGBmdW5jYCB1bnRpbCBhZnRlciBgd2FpdGBcbiAqIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHdhc1xuICogaW52b2tlZC4gVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGAgbWV0aG9kIHRvIGNhbmNlbFxuICogZGVsYXllZCBgZnVuY2AgaW52b2NhdGlvbnMgYW5kIGEgYGZsdXNoYCBtZXRob2QgdG8gaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uXG4gKiBQcm92aWRlIGBvcHRpb25zYCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGVcbiAqIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWRcbiAqIHdpdGggdGhlIGxhc3QgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnRcbiAqIGNhbGxzIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgXG4gKiBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXNcbiAqIGludm9rZWQgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uXG4gKiBpcyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogSWYgYHdhaXRgIGlzIGAwYCBhbmQgYGxlYWRpbmdgIGlzIGBmYWxzZWAsIGBmdW5jYCBpbnZvY2F0aW9uIGlzIGRlZmVycmVkXG4gKiB1bnRpbCB0byB0aGUgbmV4dCB0aWNrLCBzaW1pbGFyIHRvIGBzZXRUaW1lb3V0YCB3aXRoIGEgdGltZW91dCBvZiBgMGAuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZGVib3VuY2luZy10aHJvdHRsaW5nLWV4cGxhaW5lZC1leGFtcGxlcy8pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2FpdF1cbiAqICBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4LlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcbiAqXG4gKiAvLyBJbnZva2UgYHNlbmRNYWlsYCB3aGVuIGNsaWNrZWQsIGRlYm91bmNpbmcgc3Vic2VxdWVudCBjYWxscy5cbiAqIGpRdWVyeShlbGVtZW50KS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICpcbiAqIC8vIEVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHMuXG4gKiB2YXIgZGVib3VuY2VkID0gXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7ICdtYXhXYWl0JzogMTAwMCB9KTtcbiAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAqIGpRdWVyeShzb3VyY2UpLm9uKCdtZXNzYWdlJywgZGVib3VuY2VkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIGRlYm91bmNlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgZGVib3VuY2VkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxhc3RBcmdzLFxuICAgICAgbGFzdFRoaXMsXG4gICAgICBtYXhXYWl0LFxuICAgICAgcmVzdWx0LFxuICAgICAgdGltZXJJZCxcbiAgICAgIGxhc3RDYWxsVGltZSxcbiAgICAgIGxhc3RJbnZva2VUaW1lID0gMCxcbiAgICAgIGxlYWRpbmcgPSBmYWxzZSxcbiAgICAgIG1heGluZyA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHdhaXQgPSB0b051bWJlcih3YWl0KSB8fCAwO1xuICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XG4gICAgbWF4aW5nID0gJ21heFdhaXQnIGluIG9wdGlvbnM7XG4gICAgbWF4V2FpdCA9IG1heGluZyA/IG5hdGl2ZU1heCh0b051bWJlcihvcHRpb25zLm1heFdhaXQpIHx8IDAsIHdhaXQpIDogbWF4V2FpdDtcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gaW52b2tlRnVuYyh0aW1lKSB7XG4gICAgdmFyIGFyZ3MgPSBsYXN0QXJncyxcbiAgICAgICAgdGhpc0FyZyA9IGxhc3RUaGlzO1xuXG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gbGVhZGluZ0VkZ2UodGltZSkge1xuICAgIC8vIFJlc2V0IGFueSBgbWF4V2FpdGAgdGltZXIuXG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIC8vIFN0YXJ0IHRoZSB0aW1lciBmb3IgdGhlIHRyYWlsaW5nIGVkZ2UuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAvLyBJbnZva2UgdGhlIGxlYWRpbmcgZWRnZS5cbiAgICByZXR1cm4gbGVhZGluZyA/IGludm9rZUZ1bmModGltZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiByZW1haW5pbmdXYWl0KHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lLFxuICAgICAgICByZXN1bHQgPSB3YWl0IC0gdGltZVNpbmNlTGFzdENhbGw7XG5cbiAgICByZXR1cm4gbWF4aW5nID8gbmF0aXZlTWluKHJlc3VsdCwgbWF4V2FpdCAtIHRpbWVTaW5jZUxhc3RJbnZva2UpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkSW52b2tlKHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lO1xuXG4gICAgLy8gRWl0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGNhbGwsIGFjdGl2aXR5IGhhcyBzdG9wcGVkIGFuZCB3ZSdyZSBhdCB0aGVcbiAgICAvLyB0cmFpbGluZyBlZGdlLCB0aGUgc3lzdGVtIHRpbWUgaGFzIGdvbmUgYmFja3dhcmRzIGFuZCB3ZSdyZSB0cmVhdGluZ1xuICAgIC8vIGl0IGFzIHRoZSB0cmFpbGluZyBlZGdlLCBvciB3ZSd2ZSBoaXQgdGhlIGBtYXhXYWl0YCBsaW1pdC5cbiAgICByZXR1cm4gKGxhc3RDYWxsVGltZSA9PT0gdW5kZWZpbmVkIHx8ICh0aW1lU2luY2VMYXN0Q2FsbCA+PSB3YWl0KSB8fFxuICAgICAgKHRpbWVTaW5jZUxhc3RDYWxsIDwgMCkgfHwgKG1heGluZyAmJiB0aW1lU2luY2VMYXN0SW52b2tlID49IG1heFdhaXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRXhwaXJlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpO1xuICAgIGlmIChzaG91bGRJbnZva2UodGltZSkpIHtcbiAgICAgIHJldHVybiB0cmFpbGluZ0VkZ2UodGltZSk7XG4gICAgfVxuICAgIC8vIFJlc3RhcnQgdGhlIHRpbWVyLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgcmVtYWluaW5nV2FpdCh0aW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFpbGluZ0VkZ2UodGltZSkge1xuICAgIHRpbWVySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBPbmx5IGludm9rZSBpZiB3ZSBoYXZlIGBsYXN0QXJnc2Agd2hpY2ggbWVhbnMgYGZ1bmNgIGhhcyBiZWVuXG4gICAgLy8gZGVib3VuY2VkIGF0IGxlYXN0IG9uY2UuXG4gICAgaWYgKHRyYWlsaW5nICYmIGxhc3RBcmdzKSB7XG4gICAgICByZXR1cm4gaW52b2tlRnVuYyh0aW1lKTtcbiAgICB9XG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgIGlmICh0aW1lcklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkKTtcbiAgICB9XG4gICAgbGFzdEludm9rZVRpbWUgPSAwO1xuICAgIGxhc3RBcmdzID0gbGFzdENhbGxUaW1lID0gbGFzdFRoaXMgPSB0aW1lcklkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgcmV0dXJuIHRpbWVySWQgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IHRyYWlsaW5nRWRnZShub3coKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKSxcbiAgICAgICAgaXNJbnZva2luZyA9IHNob3VsZEludm9rZSh0aW1lKTtcblxuICAgIGxhc3RBcmdzID0gYXJndW1lbnRzO1xuICAgIGxhc3RUaGlzID0gdGhpcztcbiAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKGlzSW52b2tpbmcpIHtcbiAgICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGxlYWRpbmdFZGdlKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgICBpZiAobWF4aW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSBpbnZvY2F0aW9ucyBpbiBhIHRpZ2h0IGxvb3AuXG4gICAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgICAgIHJldHVybiBpbnZva2VGdW5jKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgZGVib3VuY2VkLmZsdXNoID0gZmx1c2g7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXksIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5KGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5O1xuIiwidmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuL2lzRnVuY3Rpb24nKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLiBBIHZhbHVlIGlzIGNvbnNpZGVyZWQgYXJyYXktbGlrZSBpZiBpdCdzXG4gKiBub3QgYSBmdW5jdGlvbiBhbmQgaGFzIGEgYHZhbHVlLmxlbmd0aGAgdGhhdCdzIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIG9yXG4gKiBlcXVhbCB0byBgMGAgYW5kIGxlc3MgdGhhbiBvciBlcXVhbCB0byBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZSgnYWJjJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiAhaXNGdW5jdGlvbih2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheUxpa2U7XG4iLCJ2YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKSxcbiAgICBpc1BsYWluT2JqZWN0ID0gcmVxdWlyZSgnLi9pc1BsYWluT2JqZWN0Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGEgRE9NIGVsZW1lbnQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBET00gZWxlbWVudCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRWxlbWVudChkb2N1bWVudC5ib2R5KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRWxlbWVudCgnPGJvZHk+Jyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0VsZW1lbnQodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgdmFsdWUubm9kZVR5cGUgPT09IDEgJiYgIWlzUGxhaW5PYmplY3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRWxlbWVudDtcbiIsInZhciByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlSXNGaW5pdGUgPSByb290LmlzRmluaXRlO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgZmluaXRlIHByaW1pdGl2ZSBudW1iZXIuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGlzIGJhc2VkIG9uXG4gKiBbYE51bWJlci5pc0Zpbml0ZWBdKGh0dHBzOi8vbWRuLmlvL051bWJlci9pc0Zpbml0ZSkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBmaW5pdGUgbnVtYmVyLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGaW5pdGUoMyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Zpbml0ZShOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRmluaXRlKEluZmluaXR5KTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0Zpbml0ZSgnMycpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGaW5pdGUodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiBuYXRpdmVJc0Zpbml0ZSh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGaW5pdGU7XG4iLCJ2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFzeW5jVGFnID0gJ1tvYmplY3QgQXN5bmNGdW5jdGlvbl0nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXScsXG4gICAgcHJveHlUYWcgPSAnW29iamVjdCBQcm94eV0nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDkgd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXlzIGFuZCBvdGhlciBjb25zdHJ1Y3RvcnMuXG4gIHZhciB0YWcgPSBiYXNlR2V0VGFnKHZhbHVlKTtcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWcgfHwgdGFnID09IGFzeW5jVGFnIHx8IHRhZyA9PSBwcm94eVRhZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uO1xuIiwiLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgbG9vc2VseSBiYXNlZCBvblxuICogW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXRvbGVuZ3RoKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTGVuZ3RoKDMpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNMZW5ndGgoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoSW5maW5pdHkpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzTGVuZ3RoKCczJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmXG4gICAgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTGVuZ3RoO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgbnVsbGlzaCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTmlsKG51bGwpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNOaWwodm9pZCAwKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzTmlsKE5hTik7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc05pbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc05pbDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlXG4gKiBbbGFuZ3VhZ2UgdHlwZV0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMpXG4gKiBvZiBgT2JqZWN0YC4gKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3RMaWtlO1xuIiwidmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgZ2V0UHJvdG90eXBlID0gcmVxdWlyZSgnLi9fZ2V0UHJvdG90eXBlJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgZnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlLFxuICAgIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgZGVjb21waWxlZCBzb3VyY2Ugb2YgZnVuY3Rpb25zLiAqL1xudmFyIGZ1bmNUb1N0cmluZyA9IGZ1bmNQcm90by50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqIFVzZWQgdG8gaW5mZXIgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yLiAqL1xudmFyIG9iamVjdEN0b3JTdHJpbmcgPSBmdW5jVG9TdHJpbmcuY2FsbChPYmplY3QpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCB0aGF0IGlzLCBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGVcbiAqIGBPYmplY3RgIGNvbnN0cnVjdG9yIG9yIG9uZSB3aXRoIGEgYFtbUHJvdG90eXBlXV1gIG9mIGBudWxsYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuOC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiB9XG4gKlxuICogXy5pc1BsYWluT2JqZWN0KG5ldyBGb28pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KHsgJ3gnOiAwLCAneSc6IDAgfSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KE9iamVjdC5jcmVhdGUobnVsbCkpO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIGlmICghaXNPYmplY3RMaWtlKHZhbHVlKSB8fCBiYXNlR2V0VGFnKHZhbHVlKSAhPSBvYmplY3RUYWcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHByb3RvID0gZ2V0UHJvdG90eXBlKHZhbHVlKTtcbiAgaWYgKHByb3RvID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdmFyIEN0b3IgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKHByb3RvLCAnY29uc3RydWN0b3InKSAmJiBwcm90by5jb25zdHJ1Y3RvcjtcbiAgcmV0dXJuIHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3RvciBpbnN0YW5jZW9mIEN0b3IgJiZcbiAgICBmdW5jVG9TdHJpbmcuY2FsbChDdG9yKSA9PSBvYmplY3RDdG9yU3RyaW5nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzUGxhaW5PYmplY3Q7XG4iLCJ2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgc3ltYm9sVGFnID0gJ1tvYmplY3QgU3ltYm9sXSc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBzeW1ib2wsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1N5bWJvbChTeW1ib2wuaXRlcmF0b3IpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNTeW1ib2woJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNTeW1ib2wodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3ltYm9sJyB8fFxuICAgIChpc09iamVjdExpa2UodmFsdWUpICYmIGJhc2VHZXRUYWcodmFsdWUpID09IHN5bWJvbFRhZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNTeW1ib2w7XG4iLCJ2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSB0aW1lc3RhbXAgb2YgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdGhhdCBoYXZlIGVsYXBzZWQgc2luY2VcbiAqIHRoZSBVbml4IGVwb2NoICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMi40LjBcbiAqIEBjYXRlZ29yeSBEYXRlXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSB0aW1lc3RhbXAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZGVmZXIoZnVuY3Rpb24oc3RhbXApIHtcbiAqICAgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTtcbiAqIH0sIF8ubm93KCkpO1xuICogLy8gPT4gTG9ncyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpdCB0b29rIGZvciB0aGUgZGVmZXJyZWQgaW52b2NhdGlvbi5cbiAqL1xudmFyIG5vdyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gcm9vdC5EYXRlLm5vdygpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBub3c7XG4iLCJ2YXIgY3JlYXRlUm91bmQgPSByZXF1aXJlKCcuL19jcmVhdGVSb3VuZCcpO1xuXG4vKipcbiAqIENvbXB1dGVzIGBudW1iZXJgIHJvdW5kZWQgdG8gYHByZWNpc2lvbmAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAzLjEwLjBcbiAqIEBjYXRlZ29yeSBNYXRoXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIFRoZSBudW1iZXIgdG8gcm91bmQuXG4gKiBAcGFyYW0ge251bWJlcn0gW3ByZWNpc2lvbj0wXSBUaGUgcHJlY2lzaW9uIHRvIHJvdW5kIHRvLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgcm91bmRlZCBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ucm91bmQoNC4wMDYpO1xuICogLy8gPT4gNFxuICpcbiAqIF8ucm91bmQoNC4wMDYsIDIpO1xuICogLy8gPT4gNC4wMVxuICpcbiAqIF8ucm91bmQoNDA2MCwgLTIpO1xuICogLy8gPT4gNDEwMFxuICovXG52YXIgcm91bmQgPSBjcmVhdGVSb3VuZCgncm91bmQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSByb3VuZDtcbiIsInZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIEVycm9yIG1lc3NhZ2UgY29uc3RhbnRzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgdGhyb3R0bGVkIGZ1bmN0aW9uIHRoYXQgb25seSBpbnZva2VzIGBmdW5jYCBhdCBtb3N0IG9uY2UgcGVyXG4gKiBldmVyeSBgd2FpdGAgbWlsbGlzZWNvbmRzLiBUaGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYFxuICogbWV0aG9kIHRvIGNhbmNlbCBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0b1xuICogaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uIFByb3ZpZGUgYG9wdGlvbnNgIHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgXG4gKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgXG4gKiB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWQgd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlXG4gKiB0aHJvdHRsZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIHRocm90dGxlZCBmdW5jdGlvbiByZXR1cm4gdGhlXG4gKiByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpc1xuICogaW52b2tlZCBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb25cbiAqIGlzIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBJZiBgd2FpdGAgaXMgYDBgIGFuZCBgbGVhZGluZ2AgaXMgYGZhbHNlYCwgYGZ1bmNgIGludm9jYXRpb24gaXMgZGVmZXJyZWRcbiAqIHVudGlsIHRvIHRoZSBuZXh0IHRpY2ssIHNpbWlsYXIgdG8gYHNldFRpbWVvdXRgIHdpdGggYSB0aW1lb3V0IG9mIGAwYC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8udGhyb3R0bGVgIGFuZCBgXy5kZWJvdW5jZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB0aHJvdHRsZSBpbnZvY2F0aW9ucyB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGV4Y2Vzc2l2ZWx5IHVwZGF0aW5nIHRoZSBwb3NpdGlvbiB3aGlsZSBzY3JvbGxpbmcuXG4gKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKSk7XG4gKlxuICogLy8gSW52b2tlIGByZW5ld1Rva2VuYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgYnV0IG5vdCBtb3JlIHRoYW4gb25jZSBldmVyeSA1IG1pbnV0ZXMuXG4gKiB2YXIgdGhyb3R0bGVkID0gXy50aHJvdHRsZShyZW5ld1Rva2VuLCAzMDAwMDAsIHsgJ3RyYWlsaW5nJzogZmFsc2UgfSk7XG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgdGhyb3R0bGVkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIHRocm90dGxlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgdGhyb3R0bGVkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxlYWRpbmcgPSB0cnVlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy5sZWFkaW5nIDogbGVhZGluZztcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG4gIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCB7XG4gICAgJ2xlYWRpbmcnOiBsZWFkaW5nLFxuICAgICdtYXhXYWl0Jzogd2FpdCxcbiAgICAndHJhaWxpbmcnOiB0cmFpbGluZ1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aHJvdHRsZTtcbiIsInZhciB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgSU5GSU5JVFkgPSAxIC8gMCxcbiAgICBNQVhfSU5URUdFUiA9IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4O1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBmaW5pdGUgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4xMi4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9GaW5pdGUoMy4yKTtcbiAqIC8vID0+IDMuMlxuICpcbiAqIF8udG9GaW5pdGUoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvRmluaXRlKEluZmluaXR5KTtcbiAqIC8vID0+IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4XG4gKlxuICogXy50b0Zpbml0ZSgnMy4yJyk7XG4gKiAvLyA9PiAzLjJcbiAqL1xuZnVuY3Rpb24gdG9GaW5pdGUodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogMDtcbiAgfVxuICB2YWx1ZSA9IHRvTnVtYmVyKHZhbHVlKTtcbiAgaWYgKHZhbHVlID09PSBJTkZJTklUWSB8fCB2YWx1ZSA9PT0gLUlORklOSVRZKSB7XG4gICAgdmFyIHNpZ24gPSAodmFsdWUgPCAwID8gLTEgOiAxKTtcbiAgICByZXR1cm4gc2lnbiAqIE1BWF9JTlRFR0VSO1xuICB9XG4gIHJldHVybiB2YWx1ZSA9PT0gdmFsdWUgPyB2YWx1ZSA6IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9GaW5pdGU7XG4iLCJ2YXIgdG9GaW5pdGUgPSByZXF1aXJlKCcuL3RvRmluaXRlJyk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhbiBpbnRlZ2VyLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBsb29zZWx5IGJhc2VkIG9uXG4gKiBbYFRvSW50ZWdlcmBdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy10b2ludGVnZXIpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgY29udmVydGVkIGludGVnZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9JbnRlZ2VyKDMuMik7XG4gKiAvLyA9PiAzXG4gKlxuICogXy50b0ludGVnZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiAwXG4gKlxuICogXy50b0ludGVnZXIoSW5maW5pdHkpO1xuICogLy8gPT4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDhcbiAqXG4gKiBfLnRvSW50ZWdlcignMy4yJyk7XG4gKiAvLyA9PiAzXG4gKi9cbmZ1bmN0aW9uIHRvSW50ZWdlcih2YWx1ZSkge1xuICB2YXIgcmVzdWx0ID0gdG9GaW5pdGUodmFsdWUpLFxuICAgICAgcmVtYWluZGVyID0gcmVzdWx0ICUgMTtcblxuICByZXR1cm4gcmVzdWx0ID09PSByZXN1bHQgPyAocmVtYWluZGVyID8gcmVzdWx0IC0gcmVtYWluZGVyIDogcmVzdWx0KSA6IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9JbnRlZ2VyO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBOQU4gPSAwIC8gMDtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZS4gKi9cbnZhciByZVRyaW0gPSAvXlxccyt8XFxzKyQvZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJhZCBzaWduZWQgaGV4YWRlY2ltYWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmFkSGV4ID0gL15bLStdMHhbMC05YS1mXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiaW5hcnkgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmluYXJ5ID0gL14wYlswMV0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3Qgb2N0YWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzT2N0YWwgPSAvXjBvWzAtN10rJC9pO1xuXG4vKiogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgd2l0aG91dCBhIGRlcGVuZGVuY3kgb24gYHJvb3RgLiAqL1xudmFyIGZyZWVQYXJzZUludCA9IHBhcnNlSW50O1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9OdW1iZXIoMy4yKTtcbiAqIC8vID0+IDMuMlxuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMy4yJyk7XG4gKiAvLyA9PiAzLjJcbiAqL1xuZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAoaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIE5BTjtcbiAgfVxuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gdHlwZW9mIHZhbHVlLnZhbHVlT2YgPT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9OdW1iZXI7XG4iLCJ2YXIgYmFzZVRvU3RyaW5nID0gcmVxdWlyZSgnLi9fYmFzZVRvU3RyaW5nJyk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZy4gQW4gZW1wdHkgc3RyaW5nIGlzIHJldHVybmVkIGZvciBgbnVsbGBcbiAqIGFuZCBgdW5kZWZpbmVkYCB2YWx1ZXMuIFRoZSBzaWduIG9mIGAtMGAgaXMgcHJlc2VydmVkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY29udmVydGVkIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b1N0cmluZyhudWxsKTtcbiAqIC8vID0+ICcnXG4gKlxuICogXy50b1N0cmluZygtMCk7XG4gKiAvLyA9PiAnLTAnXG4gKlxuICogXy50b1N0cmluZyhbMSwgMiwgM10pO1xuICogLy8gPT4gJzEsMiwzJ1xuICovXG5mdW5jdGlvbiB0b1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogYmFzZVRvU3RyaW5nKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b1N0cmluZztcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IGlzRWxlbWVudCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0VsZW1lbnQnO1xuaW1wb3J0IGlzRmluaXRlICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRnVuY3Rpb24nO1xuaW1wb3J0IGlzTmlsICAgICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc05pbCc7XG5pbXBvcnQgaXNPYmplY3QgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgX01hdGggICAgICAgICAgICAgICAgZnJvbSAnLi9tYXRoL21hdGgnO1xuaW1wb3J0IE1hdHJpeDIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRyaXgyJztcbmltcG9ydCB7IG9yaWdpbktleXdvcmQgfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBUeXBlIH0gICAgICAgICAgICAgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IFV0aWxzICAgICAgICAgICAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuY29uc3QgYW5pbWF0aW9uID0ge1xuICAgIHR5cGU6IHtcbiAgICAgICAgQ09SRTogMVxuICAgIH1cbn07XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5BbmltYXRpb25cbiogQGNvbnN0cnVjdG9yXG4qIEBleHRlbmRzIGV4dGVybmFsOlRpbWVsaW5lTWF4XG4qIEBwYXJhbSB7Q2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRvIGJlIGFuaW1hdGVkLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmRlc3Ryb3lPbkNvbXBsZXRlXSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15QW5pbWF0aW9uID0gbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSwgeyBcbiogICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZVxuKiB9KS56b29tVG8oMiwgMSkuc2hha2UoMC4xLCAyKS5wbGF5KCk7XG4qL1xuY2xhc3MgQW5pbWF0aW9uIGV4dGVuZHMgVGltZWxpbmVNYXgge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF1c2VkOiB0cnVlXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgc3VwZXIoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucztcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB0eXBlIG9mIHRoaXMgb2JqZWN0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSBUeXBlLkFOSU1BVElPTjtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Q2FtZXJhfSAtIFRoZSBjYW1lcmEgb24gd2hpY2ggdGhlIGFuaW1hdGlvbiB3aWxsIGJlIGFwcGxpZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhIHx8IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2FycmF5fSAtIFRoZSBjb3JlIHR3ZWVucyBvZiB0aGlzIGFuaW1hdGlvbiBpbiBvcmRlciBvZiBleGVjdXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29yZVR3ZWVucyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUaW1lbGluZUxpdGV9IC0gVGhlIGN1cnJlbnQgYWN0aXZlIHN1Yi1hbmltYXRpb24gY29uc2lzdGluZyBvZiB0aGUgY29yZSBjYW1lcmEgYW5pbWF0aW9uIGFuZCBlZmZlY3QgYW5pbWF0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZXN0cm95T25Db21wbGV0ZSA9IG9wdGlvbnMuZGVzdHJveU9uQ29tcGxldGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY2FtZXJhIHZhbHVlcyBvZiB0aGUgcHJldmlvdXMgc3ViLWFuaW1hdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBzdGFydGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25TdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRDb3JlVHdlZW4odGhpcy5jb3JlVHdlZW5zWzBdKTtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVEcmFnKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVXaGVlbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25TdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25TdGFydC5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vblN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBvbmNlIGRldiBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBzdGFydGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIHVwZGF0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vblVwZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25VcGRhdGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25VcGRhdGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmVuYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vbkNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5vbkNvbXBsZXRlLmFwcGx5KHRoaXMsIHRoaXMuY29uZmlnLm9uQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5kZXN0cm95T25Db21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIG9uY2UgZGV2IGlzIGNvbXBsZXRlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGNvbXBsZXRlZCcpO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvblN0YXJ0JywgdGhpcy5fb25TdGFydCk7XG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25VcGRhdGUnLCB0aGlzLl9vblVwZGF0ZSk7XG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25Db21wbGV0ZScsIHRoaXMuX29uQ29tcGxldGUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGhlIHByb3BlcnRpZXMgdG8gYW5pbWF0ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfYW5pbWF0ZSAocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgdmFyIG1haW5UaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoe1xuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IG9wdGlvbnMub25TdGFydCxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBvcHRpb25zLm9uU3RhcnRQYXJhbXMsXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IG9wdGlvbnMub25VcGRhdGUsXG4gICAgICAgICAgICAgICAgb25VcGRhdGVQYXJhbXM6IG9wdGlvbnMub25VcGRhdGVQYXJhbXMsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogb3B0aW9ucy5vbkNvbXBsZXRlLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IG9wdGlvbnMub25Db21wbGV0ZVBhcmFtcyxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZTogb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZSxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZVBhcmFtc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vblN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uU3RhcnQuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uU3RhcnRQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25VcGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25VcGRhdGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uVXBkYXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vbkNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uQ29tcGxldGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgc2hha2VUaW1lbGluZSA9IG51bGw7XG4gICAgICAgIHZhciBzaGFrZSA9IHRoaXMuX3BhcnNlU2hha2UocHJvcHMuc2hha2UpO1xuICAgICAgICBcbiAgICAgICAgLy8gRGVsZXRlIGNhbGxiYWNrcyBzbyBjaGlsZHJlbiBkb24ndCBwaWNrIHRoZW0gdXAgYnV0IGdldCBvdGhlciBvcHRpb25zXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uU3RhcnQ7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uU3RhcnRQYXJhbXM7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uVXBkYXRlO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5vblVwZGF0ZVBhcmFtcztcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25Db21wbGV0ZTtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25Db21wbGV0ZVBhcmFtcztcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25SZXZlcnNlQ29tcGxldGU7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zO1xuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gY29yZSBjYW1lcmEgcHJvcGVydGllc1xuICAgICAgICBpZiAocHJvcHMub3JpZ2luIHx8IHByb3BzLnBvc2l0aW9uIHx8IHByb3BzLnJvdGF0aW9uIHx8IHByb3BzLnpvb20pIHtcbiAgICAgICAgICAgIHZhciBjb3JlVHdlZW4gPSBUd2Vlbk1heC50byh0aGlzLmNhbWVyYSwgZHVyYXRpb24gIT09IDAgPyBkdXJhdGlvbiA6IDAuMDE2LCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBlbmZvcmNlQm91bmRzOiAob3B0aW9ucy5lbmZvcmNlQm91bmRzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9yYXdPZmZzZXRYOiAwLFxuICAgICAgICAgICAgICAgIF9yYXdPZmZzZXRZOiAwLFxuICAgICAgICAgICAgICAgIF9yYXdTY2FsZU9mZnNldFg6IDAsXG4gICAgICAgICAgICAgICAgX3Jhd1NjYWxlT2Zmc2V0WTogMCxcbiAgICAgICAgICAgICAgICByb3RhdGlvbjogMCxcbiAgICAgICAgICAgICAgICB6b29tOiAwLFxuICAgICAgICAgICAgICAgIGltbWVkaWF0ZVJlbmRlcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogdGhpcyxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB6RGlyZWN0aW9uID0gem9vbURpcmVjdGlvbi5OT05FO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYucHJvcHMudG8uem9vbSA+IHRoaXMuY2FtZXJhLnpvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLklOO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlbGYucHJvcHMudG8uem9vbSA8IHRoaXMuY2FtZXJhLnpvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLk9VVDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuem9vbURpcmVjdGlvbiA9IHpEaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBPcmlnaW4gbXVzdCBiZSBzZXQgaW4gY2FzZSBhbmltYXRpb24gd2FzIHJldmVyc2VkIChvcmlnaW4gd2FzIHJldmVydGVkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRUcmFuc2Zvcm1PcmlnaW4oc2VsZi5wcm9wcy50by5vcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLmNvcmUgPSBzZWxmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGb3IgZGV2IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvcmUgdHdlZW4gc3RhcnRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndHdlZW4gdmFyczogJywgc2VsZi52YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3R3ZWVuIHByb3BzOiAnLCBzZWxmLnByb3BzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5jYW1lcmEuX3Jhd09mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlIGRpcmVjdCBvZmZzZXQgdHdlZW5pbmcsIHRoZW4gYXBwbHkgcm90YXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYucHJvcHMudG8uaXNPcmlnaW5BdXRvICYmIHNlbGYucHJvcHMudG8uaXNQb3NpdGlvbkNoYW5naW5nICYmIHNlbGYucHJvcHMudG8uaXNSb3RhdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbih0aGlzLmNhbWVyYS5fcmF3U2NhbGVPZmZzZXQsIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS5zY2FsZVRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0UG9zaXRpb25Ub09mZnNldChwb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4sIHRoaXMuY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zaXRpb24gaXMgbWFudWFsbHkgbWFpbnRhaW5lZCBzbyBhbmltYXRpb25zIGNhbiBzbW9vdGhseSBjb250aW51ZSB3aGVuIGNhbWVyYSBpcyByZXNpemVkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFBvc2l0aW9uKHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbihvZmZzZXQsIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1hdGlvbiksIHNlbGYuZGF0YS5lbmZvcmNlQm91bmRzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5pdENvcmVUd2Vlbih0aGlzLmNvcmVUd2VlbnNbc2VsZi5pbmRleCArIDFdLCBzZWxmLnByb3BzLmVuZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZvciBkZXYgb25seVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY29yZSB0d2VlbiBjb21wbGV0ZWQnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRUcmFuc2Zvcm1PcmlnaW4oc2VsZi5wcm9wcy5zdGFydC5vcmlnaW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29yZVR3ZWVuLnR5cGUgPSBhbmltYXRpb24udHlwZS5DT1JFO1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzID0ge1xuICAgICAgICAgICAgICAgIHNvdXJjZToge30sXG4gICAgICAgICAgICAgICAgcGFyc2VkOiB7fSxcbiAgICAgICAgICAgICAgICB0bzoge30sXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgICAgIGVuZDoge31cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLm9yaWdpbiA9IHByb3BzLm9yaWdpbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2UucG9zaXRpb24gPSBwcm9wcy5wb3NpdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uucm90YXRpb24gPSBwcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSA9IHByb3BzLnpvb207XG4gICAgICAgICAgICBjb3JlVHdlZW4uaW5kZXggPSB0aGlzLmNvcmVUd2VlbnMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5jb3JlVHdlZW5zLnB1c2goY29yZVR3ZWVuKTtcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoY29yZVR3ZWVuLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gc2hha2UgZWZmZWN0XG4gICAgICAgIGlmIChkdXJhdGlvbiA+IDAgJiYgc2hha2UgJiYgc2hha2UuaW50ZW5zaXR5ID4gMCkge1xuICAgICAgICAgICAgc2hha2VUaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHNoYWtlLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogKG9wdGlvbnMuZW5mb3JjZUJvdW5kcyA9PT0gZmFsc2UpID8gZmFsc2UgOiB0cnVlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aW1lbGluZS5zaGFrZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzRmlyc3RGcmFtZSA9IHNlbGYucHJvZ3Jlc3MoKSA9PT0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzRmluYWxGcmFtZSA9IHNlbGYucHJvZ3Jlc3MoKSA9PT0gMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldFggPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0WSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jbGFtcFBvc2l0aW9uKHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbih0aGlzLmNhbWVyYS5fcmF3T2Zmc2V0LCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbiwgdGhpcy5jYW1lcmEudHJhbnNmb3JtYXRpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkhPUklaT05UQUwgfHwgc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmlyc3RGcmFtZSAmJiAhaXNGaW5hbEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WCA9IE1hdGgucmFuZG9tKCkgKiBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEud2lkdGggKiAyIC0gc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnggKz0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLlZFUlRJQ0FMIHx8IHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZpcnN0RnJhbWUgJiYgIWlzRmluYWxGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLmhlaWdodCAqIDIgLSBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnkgKz0gb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0UG9zaXRpb24ocG9zaXRpb24sIHNlbGYuZGF0YS5lbmZvcmNlQm91bmRzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J11cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRWFzZSBpbi9vdXRcbiAgICAgICAgICAgIGlmIChzaGFrZS5lYXNlSW4gJiYgc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24gKiAwLjUsIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZUluIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuXG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS50byhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uICogMC41LCB7IFxuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VPdXQgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgZHVyYXRpb24gKiAwLjUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZSBpbiBvciBlYXNlXG4gICAgICAgICAgICBlbHNlIGlmIChzaGFrZS5lYXNlSW4gJiYgIXNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VJbiB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2Ugb3V0XG4gICAgICAgICAgICBlbHNlIGlmICghc2hha2UuZWFzZUluICYmIHNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VPdXQgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlXG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmVhc2UpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IG9wdGlvbnMuZWFzZSB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vIGVhc2VcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZGF0YS5pbnRlbnNpdHkgPSBzaGFrZS5pbnRlbnNpdHk7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS50byhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7fSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoc2hha2VUaW1lbGluZSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWRkKG1haW5UaW1lbGluZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDYWxjdWxhdGVzIHRoZSBcInRvXCIgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdHxWZWN0b3IyfSBzb3VyY2VPcmlnaW4gLSBUaGUgc291cmNlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fFZlY3RvcjJ9IHNvdXJjZVBvc2l0aW9uIC0gVGhlIHNvdXJjZSBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2VSb3RhdGlvbiAtIFRoZSBzb3VyY2Ugcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc291cmNlWm9vbSAtIFRoZSBzb3VyY2Ugem9vbS5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQ2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgZW5kIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfY2FsY3VsYXRlVG9Qcm9wcyAocGFyc2VkLCBzdGFydCkge1xuICAgICAgICB2YXIgc291cmNlID0ge1xuICAgICAgICAgICAgb3JpZ2luOiAocGFyc2VkLm9yaWdpbiAhPT0gb3JpZ2luS2V5d29yZC5BVVRPKSA/IHBhcnNlZC5vcmlnaW4gOiB7fSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAocGFyc2VkLnBvc2l0aW9uICE9PSBudWxsKSA/IHBhcnNlZC5wb3NpdGlvbiA6IHt9LFxuICAgICAgICAgICAgcm90YXRpb246IHBhcnNlZC5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206IHBhcnNlZC56b29tXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBpc0FuY2hvcmVkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGFuZ2luZyB0byBzYW1lIG9yaWdpbiBpcyBuZWNlc3NhcnkgZm9yIHdoZWVsIHpvb21cbiAgICAgICAgdmFyIGlzT3JpZ2luQXV0byA9IHBhcnNlZC5vcmlnaW4gPT09IG9yaWdpbktleXdvcmQuQVVUTztcbiAgICAgICAgdmFyIGlzT3JpZ2luWENoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5vcmlnaW4ueCk7XG4gICAgICAgIHZhciBpc09yaWdpbllDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uub3JpZ2luLnkpO1xuICAgICAgICB2YXIgaXNPcmlnaW5DaGFuZ2luZyA9IGlzT3JpZ2luWENoYW5naW5nIHx8IGlzT3JpZ2luWUNoYW5naW5nO1xuICAgICAgICBcbiAgICAgICAgLy8gQ2hhbmdpbmcgdG8gc2FtZSBwb3NpdGlvbiBpcyBuZWNlc3NhcnkgZm9yIGNhbWVyYSByZXNpemVcbiAgICAgICAgdmFyIGlzUG9zaXRpb25YQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnBvc2l0aW9uLngpO1xuICAgICAgICB2YXIgaXNQb3NpdGlvbllDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2UucG9zaXRpb24ueSk7XG4gICAgICAgIHZhciBpc1Bvc2l0aW9uQ2hhbmdpbmcgPSBpc1Bvc2l0aW9uWENoYW5naW5nIHx8IGlzUG9zaXRpb25ZQ2hhbmdpbmc7XG4gICAgICAgIHZhciBpc09mZnNldENoYW5naW5nID0gaXNQb3NpdGlvbkNoYW5naW5nO1xuICAgICAgICB2YXIgaXNSb3RhdGlvbkNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5yb3RhdGlvbikgJiYgc291cmNlLnJvdGF0aW9uICE9PSBzdGFydC5yb3RhdGlvbjtcbiAgICAgICAgdmFyIGlzWm9vbUNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS56b29tKSAmJiBzb3VyY2Uuem9vbSAhPT0gc3RhcnQuem9vbTtcblxuICAgICAgICB2YXIgZm92UG9zaXRpb24gPSB0aGlzLmNhbWVyYS5jZW50ZXI7XG4gICAgICAgIHZhciBzdGFydFRyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZShzdGFydC56b29tLCBzdGFydC56b29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXN0YXJ0LnJvdGF0aW9uKSk7XG4gICAgICAgIHZhciB0b1NjYWxlT2Zmc2V0O1xuICAgICAgICB2YXIgdG9PZmZzZXQ7XG4gICAgICAgIHZhciB0b09yaWdpbiA9IG5ldyBWZWN0b3IyKGlzT3JpZ2luWENoYW5naW5nID8gc291cmNlLm9yaWdpbi54IDogc3RhcnQub3JpZ2luLngsIGlzT3JpZ2luWUNoYW5naW5nID8gc291cmNlLm9yaWdpbi55IDogc3RhcnQub3JpZ2luLnkpO1xuICAgICAgICB2YXIgdG9Qb3NpdGlvbiA9IG5ldyBWZWN0b3IyKGlzUG9zaXRpb25YQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueCA6IHN0YXJ0LnBvc2l0aW9uLngsIGlzUG9zaXRpb25ZQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueSA6IHN0YXJ0LnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgdG9Sb3RhdGlvbiA9IGlzUm90YXRpb25DaGFuZ2luZyA/IHNvdXJjZS5yb3RhdGlvbiA6IHN0YXJ0LnJvdGF0aW9uO1xuICAgICAgICB2YXIgdG9ab29tID0gaXNab29tQ2hhbmdpbmcgPyBzb3VyY2Uuem9vbSA6IHN0YXJ0Lnpvb207XG4gICAgICAgIHZhciB0b1NjYWxlVHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHRvWm9vbSwgdG9ab29tKTtcbiAgICAgICAgdmFyIHRvVHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHRvWm9vbSwgdG9ab29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXRvUm90YXRpb24pKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJvdGF0ZVRvLCB6b29tVG9cbiAgICAgICAgaWYgKGlzT3JpZ2luQXV0byAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRvT3JpZ2luLmNvcHkoc3RhcnQucG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJvdGF0ZUF0LCB6b29tQXRcbiAgICAgICAgZWxzZSBpZiAoaXNPcmlnaW5DaGFuZ2luZyAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzUG9zaXRpb25DaGFuZ2luZyA9IHRydWU7XG4gICAgICAgICAgICBmb3ZQb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0U2NlbmVQb3NpdGlvblRvRk9WUG9zaXRpb24odG9PcmlnaW4sIHN0YXJ0LnBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHN0YXJ0VHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgdG9Qb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0U2NlbmVQb3NpdGlvblRvQ2FtZXJhUG9zaXRpb24odG9PcmlnaW4sIGZvdlBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRvT3JpZ2luLCB0b1RyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBhbmltYXRlICh3aXRoIGF1dG8gb3JpZ2luKVxuICAgICAgICBlbHNlIGlmIChpc09yaWdpbkF1dG8gJiYgaXNQb3NpdGlvbkNoYW5naW5nICYmIGlzUm90YXRpb25DaGFuZ2luZykge1xuICAgICAgICAgICAgdG9PcmlnaW4uY29weSh0b1Bvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdG9TY2FsZU9mZnNldCA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0UG9zaXRpb25Ub09mZnNldCh0b1Bvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRvT3JpZ2luLCB0b1NjYWxlVHJhbnNmb3JtYXRpb24pO1xuICAgICAgICB0b09mZnNldCA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0UG9zaXRpb25Ub09mZnNldCh0b1Bvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRvT3JpZ2luLCB0b1RyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc09yaWdpbkF1dG86IGlzT3JpZ2luQXV0byxcbiAgICAgICAgICAgIGlzUG9zaXRpb25DaGFuZ2luZzogaXNQb3NpdGlvbkNoYW5naW5nLFxuICAgICAgICAgICAgaXNSb3RhdGlvbkNoYW5naW5nOiBpc1JvdGF0aW9uQ2hhbmdpbmcsXG4gICAgICAgICAgICBzY2FsZU9mZnNldFg6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b1NjYWxlT2Zmc2V0LnggOiBudWxsLFxuICAgICAgICAgICAgc2NhbGVPZmZzZXRZOiBpc09mZnNldENoYW5naW5nID8gdG9TY2FsZU9mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldFg6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC54IDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldFk6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIG9yaWdpbjogaXNBbmNob3JlZCB8fCBpc09yaWdpbkNoYW5naW5nIHx8IChpc09yaWdpbkF1dG8gJiYgaXNQb3NpdGlvbkNoYW5naW5nICYmIGlzUm90YXRpb25DaGFuZ2luZykgPyB0b09yaWdpbiA6IG51bGwsXG4gICAgICAgICAgICBwb3NpdGlvbjogaXNQb3NpdGlvbkNoYW5naW5nID8gdG9Qb3NpdGlvbiA6IG51bGwsXG4gICAgICAgICAgICByb3RhdGlvbjogaXNSb3RhdGlvbkNoYW5naW5nID8gdG9Sb3RhdGlvbiA6IG51bGwsXG4gICAgICAgICAgICB6b29tOiBpc1pvb21DaGFuZ2luZyA/IHRvWm9vbSA6IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBzdGFydGluZyBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHN0YXJ0aW5nIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfZ2V0U3RhcnRQcm9wcyAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcmlnaW46IHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi5jbG9uZSgpLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuY2FtZXJhLnBvc2l0aW9uLmNsb25lKCksXG4gICAgICAgICAgICByb3RhdGlvbjogdGhpcy5jYW1lcmEucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiB0aGlzLmNhbWVyYS56b29tXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgZW5kaW5nIHByb3BlcnR5IHZhbHVlcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgZW5kaW5nIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfZ2V0RW5kUHJvcHMgKHRvLCBzdGFydCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3JpZ2luOiAodG8ub3JpZ2luICE9PSBudWxsKSA/IHRvLm9yaWdpbiA6IHN0YXJ0Lm9yaWdpbixcbiAgICAgICAgICAgIHBvc2l0aW9uOiAodG8ucG9zaXRpb24gIT09IG51bGwpID8gdG8ucG9zaXRpb24gOiBzdGFydC5wb3NpdGlvbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiAodG8ucm90YXRpb24gIT09IG51bGwpID8gdG8ucm90YXRpb24gOiBzdGFydC5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206ICh0by56b29tICE9PSBudWxsKSA/IHRvLnpvb20gOiBzdGFydC56b29tXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogSW5pdGlhbGl6ZXMgYSBjb3JlIHR3ZWVuLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1R3ZWVuTWF4fSB0d2VlbiAtIFRoZSB0d2Vlbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfaW5pdENvcmVUd2VlbiAodHdlZW4sIHN0YXJ0UHJvcHMpIHtcbiAgICAgICAgaWYgKHR3ZWVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHN0YXJ0UHJvcHMgPSAoc3RhcnRQcm9wcyAhPT0gdW5kZWZpbmVkKSA/IHN0YXJ0UHJvcHMgOiB0aGlzLl9nZXRTdGFydFByb3BzKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwYXJzZWRQcm9wcyA9IHRoaXMuX3BhcnNlUHJvcHModHdlZW4ucHJvcHMuc291cmNlLm9yaWdpbiwgdHdlZW4ucHJvcHMuc291cmNlLnBvc2l0aW9uLCB0d2Vlbi5wcm9wcy5zb3VyY2Uucm90YXRpb24sIHR3ZWVuLnByb3BzLnNvdXJjZS56b29tKTtcbiAgICAgICAgICAgIHZhciB0b1Byb3BzID0gdGhpcy5fY2FsY3VsYXRlVG9Qcm9wcyhwYXJzZWRQcm9wcywgc3RhcnRQcm9wcyk7XG4gICAgICAgICAgICB2YXIgZW5kUHJvcHMgPSB0aGlzLl9nZXRFbmRQcm9wcyh0b1Byb3BzLCBzdGFydFByb3BzKTtcblxuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0gc3RhcnRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLnN0YXJ0ID0gc3RhcnRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLmVuZCA9IGVuZFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMucGFyc2VkID0gcGFyc2VkUHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy50byA9IHRvUHJvcHM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEVuc3VyZSBvZmZzZXQgbWF0Y2hlcyBjdXJyZW50IHBvc2l0aW9uIGJlZm9yZSB0d2VlbiBzdGFydHNcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLl91cGRhdGVSYXdPZmZzZXQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gT3JpZ2luIGFuZCBvZmZzZXQgbXVzdCBiZSB1cGRhdGVkIGJlZm9yZSB0d2VlbiBzdGFydHNcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbih0b1Byb3BzLm9yaWdpbik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMuX3Jhd09mZnNldFggPSB0b1Byb3BzLm9mZnNldFg7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLl9yYXdPZmZzZXRZID0gdG9Qcm9wcy5vZmZzZXRZO1xuICAgICAgICAgICAgdHdlZW4udmFycy5fcmF3U2NhbGVPZmZzZXRYID0gdG9Qcm9wcy5zY2FsZU9mZnNldFg7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLl9yYXdTY2FsZU9mZnNldFkgPSB0b1Byb3BzLnNjYWxlT2Zmc2V0WTtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMucm90YXRpb24gPSB0b1Byb3BzLnJvdGF0aW9uO1xuICAgICAgICAgICAgdHdlZW4udmFycy56b29tID0gdG9Qcm9wcy56b29tO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZXMgdGhlIGNvcmUgYW5pbWF0aW9uIHByb3BlcnRpZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcmlnaW4gLSBUaGUgb3JpZ2luLlxuICAgICogQHBhcmFtIHtPYmplY3R9IHBvc2l0aW9uIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gVGhlIHpvb20uXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBwYXJzZWQgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9wYXJzZVByb3BzIChvcmlnaW4sIHBvc2l0aW9uLCByb3RhdGlvbiwgem9vbSkge1xuICAgICAgICBpZiAocG9zaXRpb24gPT09ICdwcmV2aW91cycgJiYgdGhpcy5wcmV2aW91c1Byb3BzLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHJvdGF0aW9uID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb24pKSB7XG4gICAgICAgICAgICByb3RhdGlvbiA9IHRoaXMucHJldmlvdXNQcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHpvb20gPT09ICdwcmV2aW91cycgJiYgIWlzTmlsKHRoaXMucHJldmlvdXNQcm9wcy56b29tKSkge1xuICAgICAgICAgICAgem9vbSA9IHRoaXMucHJldmlvdXNQcm9wcy56b29tO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIG9yaWdpbjogVXRpbHMucGFyc2VPcmlnaW4ob3JpZ2luLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBVdGlscy5wYXJzZVBvc2l0aW9uKHBvc2l0aW9uLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiAhaXNOaWwocm90YXRpb24pID8gcm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogem9vbSB8fCBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gc2hha2UgLSBUaGUgc2hha2UgcHJvcGVydGllcy5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlU2hha2UgKHNoYWtlKSB7XG4gICAgICAgIHZhciBwYXJzZWRTaGFrZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAoc2hha2UpIHtcbiAgICAgICAgICAgIHBhcnNlZFNoYWtlID0ge1xuICAgICAgICAgICAgICAgIGludGVuc2l0eTogaXNOaWwoc2hha2UuaW50ZW5zaXR5KSA/IDAgOiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc05pbChzaGFrZS5kaXJlY3Rpb24pID8gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIIDogc2hha2UuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgIGVhc2VJbjogc2hha2UuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IHNoYWtlLmVhc2VPdXRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBwYXJzZWRTaGFrZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTdG9wcyB0aGUgYW5pbWF0aW9uIGFuZCByZWxlYXNlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLmRlc3Ryb3koKTtcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBzdXBlci5raWxsKCk7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICB0aGlzLnByZXZpb3VzUHJvcHMgPSBudWxsO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUaGUgcHJvcGVydGllcyB0byBhbmltYXRlLlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IFtwcm9wcy5wb3NpdGlvbl0gLSBUaGUgbG9jYXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnBvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IFtwcm9wcy5vcmlnaW5dIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgem9vbSdzIG9yaWdpbi4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMub3JpZ2luLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtwcm9wcy5yb3RhdGlvbl0gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlXSAtIEFuIG9iamVjdCBvZiBzaGFrZSBlZmZlY3QgcHJvcGVydGllcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMuc2hha2UuaW50ZW5zaXR5XSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtPY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9ufSBbcHJvcHMuc2hha2UuZGlyZWN0aW9uPU9jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USF0gLSBBIHNoYWtlIGRpcmVjdGlvbi4gXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlLmVhc2VJbl0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy56b29tXSAtIEEgem9vbSB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe3Bvc2l0aW9uOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe3Bvc2l0aW9uOiB7eDogMjAwLCB5OiA1MH0sIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjogJyNib3gxMDAnLCB6b29tOiAyfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5hbmltYXRlKHtvcmlnaW46IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICovXG4gICAgYW5pbWF0ZSAocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHByb3BzLnBvc2l0aW9uLFxuICAgICAgICAgICAgb3JpZ2luOiBwcm9wcy5vcmlnaW4sXG4gICAgICAgICAgICByb3RhdGlvbjogcHJvcHMucm90YXRpb24sXG4gICAgICAgICAgICBzaGFrZTogcHJvcHMuc2hha2UsXG4gICAgICAgICAgICB6b29tOiBwcm9wcy56b29tXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNb3ZlIHRvIGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IHBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uIHRvIG1vdmUgdG8uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwb3NpdGlvbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbygnI2JveDEwMCcsIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib3gxMDAnKSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6MjAwLCB5OiA1MH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt4OiAyMDB9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eTogMjAwfSwgMSk7XG4gICAgKi9cbiAgICBtb3ZlVG8gKHBvc2l0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvblxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUm90YXRlIGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHJvdGF0aW9uJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCgnI2JveDEwMCcsIDIwLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib3gxMDAnKSwgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoe3g6IDIwMCwgeTogNTB9LCAyMCwgMSk7XG4gICAgKi9cbiAgICByb3RhdGVBdCAob3JpZ2luLCByb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiByb3RhdGlvblxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUm90YXRlIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVUbygyMCwgMSk7XG4gICAgKi9cbiAgICByb3RhdGVUbyAocm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTaGFrZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbnRlbnNpdHkgLSBBIHtAbGluayBDYW1lcmEjc2hha2VJbnRlbnNpdHl8c2hha2UgaW50ZW5zaXR5fS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtkaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fSBvcHRpb25zIHBsdXM6XG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlT3V0XSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCk7XG4gICAgKiBteUFuaW1hdGlvbi5zaGFrZSgwLjEsIDQsIE9jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uSE9SSVpPTlRBTCwgeyBlYXNlSW46IFBvd2VyMi5lYXNlSW4sIGVhc2VPdXQ6IFBvd2VyMi5lYXNlT3V0IH0pXG4gICAgKi9cbiAgICBzaGFrZSAoaW50ZW5zaXR5LCBkdXJhdGlvbiwgZGlyZWN0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hbmltYXRlKHtcbiAgICAgICAgICAgIHNoYWtlOiB7XG4gICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBpbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgZWFzZUluOiBvcHRpb25zLmVhc2VJbixcbiAgICAgICAgICAgICAgICBlYXNlT3V0OiBvcHRpb25zLmVhc2VPdXQsXG4gICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogb3B0aW9ucy5lbmZvcmNlQm91bmRzXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBab29tIGluL291dCBhdCBhIHNwZWNpZmljIGxvY2F0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBvcmlnaW4gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uem9vbUF0KCcjYm94MTAwJywgMiwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdCh7eDogMjAwLCB5OiA1MH0sIDIsIDEpO1xuICAgICovXG4gICAgem9vbUF0IChvcmlnaW4sIHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgb3JpZ2luOiBvcmlnaW4sXG4gICAgICAgICAgICB6b29tOiB6b29tXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uem9vbVRvKDIsIDEpO1xuICAgICovXG4gICAgem9vbVRvICh6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHsgXG4gICAgICAgICAgICB6b29tOiB6b29tIFxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG4vKipcbiogU2hha2UgZGlyZWN0aW9ucy5cbiogQGVudW0ge251bWJlcn1cbiovXG5BbmltYXRpb24uc2hha2UgPSB7XG4gICAgZGlyZWN0aW9uOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEJvdGggdGhlIHggYW5kIHkgYXhlcy5cbiAgICAgICAgKi9cbiAgICAgICAgQk9USDogMCxcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHggYXhpcy5cbiAgICAgICAgKi9cbiAgICAgICAgSE9SSVpPTlRBTDogMSxcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHkgYXhpcy5cbiAgICAgICAgKi9cbiAgICAgICAgVkVSVElDQUw6IDJcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEFuaW1hdGlvbjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IGlzRWxlbWVudCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0VsZW1lbnQnO1xuaW1wb3J0IGlzRmluaXRlICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRnVuY3Rpb24nO1xuaW1wb3J0IGlzTmlsICAgICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc05pbCc7XG5pbXBvcnQgaXNPYmplY3QgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgX01hdGggICAgICAgICAgICAgICAgZnJvbSAnLi9tYXRoL21hdGgnO1xuaW1wb3J0IE1hdHJpeDIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRyaXgyJztcbmltcG9ydCB7IG9yaWdpbktleXdvcmQgfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBUeXBlIH0gICAgICAgICAgICAgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IFV0aWxzICAgICAgICAgICAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuY29uc3QgYW5pbWF0aW9uID0ge1xuICAgIHR5cGU6IHtcbiAgICAgICAgQ09SRTogMVxuICAgIH1cbn07XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5BbmltYXRpb25cbiogQGNvbnN0cnVjdG9yXG4qIEBleHRlbmRzIGV4dGVybmFsOlRpbWVsaW5lTWF4XG4qIEBwYXJhbSB7Q2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRvIGJlIGFuaW1hdGVkLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmRlc3Ryb3lPbkNvbXBsZXRlXSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15QW5pbWF0aW9uID0gbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSwgeyBcbiogICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZVxuKiB9KS56b29tVG8oMiwgMSkuc2hha2UoMC4xLCAyKS5wbGF5KCk7XG4qL1xuY2xhc3MgQW5pbWF0aW9uIGV4dGVuZHMgVGltZWxpbmVNYXgge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF1c2VkOiB0cnVlXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgc3VwZXIoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucztcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB0eXBlIG9mIHRoaXMgb2JqZWN0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSBUeXBlLkFOSU1BVElPTjtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Q2FtZXJhfSAtIFRoZSBjYW1lcmEgb24gd2hpY2ggdGhlIGFuaW1hdGlvbiB3aWxsIGJlIGFwcGxpZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhIHx8IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2FycmF5fSAtIFRoZSBjb3JlIHR3ZWVucyBvZiB0aGlzIGFuaW1hdGlvbiBpbiBvcmRlciBvZiBleGVjdXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29yZVR3ZWVucyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUaW1lbGluZUxpdGV9IC0gVGhlIGN1cnJlbnQgYWN0aXZlIHN1Yi1hbmltYXRpb24gY29uc2lzdGluZyBvZiB0aGUgY29yZSBjYW1lcmEgYW5pbWF0aW9uIGFuZCBlZmZlY3QgYW5pbWF0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZXN0cm95T25Db21wbGV0ZSA9IG9wdGlvbnMuZGVzdHJveU9uQ29tcGxldGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY2FtZXJhIHZhbHVlcyBvZiB0aGUgcHJldmlvdXMgc3ViLWFuaW1hdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBzdGFydGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25TdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRDb3JlVHdlZW4odGhpcy5jb3JlVHdlZW5zWzBdKTtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVEcmFnKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVXaGVlbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25TdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25TdGFydC5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vblN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBvbmNlIGRldiBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBzdGFydGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIHVwZGF0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vblVwZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25VcGRhdGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25VcGRhdGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmVuYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vbkNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5vbkNvbXBsZXRlLmFwcGx5KHRoaXMsIHRoaXMuY29uZmlnLm9uQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5kZXN0cm95T25Db21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIG9uY2UgZGV2IGlzIGNvbXBsZXRlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGNvbXBsZXRlZCcpO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvblN0YXJ0JywgdGhpcy5fb25TdGFydCk7XG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25VcGRhdGUnLCB0aGlzLl9vblVwZGF0ZSk7XG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25Db21wbGV0ZScsIHRoaXMuX29uQ29tcGxldGUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGhlIHByb3BlcnRpZXMgdG8gYW5pbWF0ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfYW5pbWF0ZSAocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgdmFyIG1haW5UaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoe1xuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IG9wdGlvbnMub25TdGFydCxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBvcHRpb25zLm9uU3RhcnRQYXJhbXMsXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IG9wdGlvbnMub25VcGRhdGUsXG4gICAgICAgICAgICAgICAgb25VcGRhdGVQYXJhbXM6IG9wdGlvbnMub25VcGRhdGVQYXJhbXMsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogb3B0aW9ucy5vbkNvbXBsZXRlLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IG9wdGlvbnMub25Db21wbGV0ZVBhcmFtcyxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZTogb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZSxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZVBhcmFtc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vblN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uU3RhcnQuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uU3RhcnRQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25VcGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25VcGRhdGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uVXBkYXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vbkNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uQ29tcGxldGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgc2hha2VUaW1lbGluZSA9IG51bGw7XG4gICAgICAgIHZhciBzaGFrZSA9IHRoaXMuX3BhcnNlU2hha2UocHJvcHMuc2hha2UpO1xuICAgICAgICBcbiAgICAgICAgLy8gRGVsZXRlIGNhbGxiYWNrcyBzbyBjaGlsZHJlbiBkb24ndCBwaWNrIHRoZW0gdXAgYnV0IGdldCBvdGhlciBvcHRpb25zXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uU3RhcnQ7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uU3RhcnRQYXJhbXM7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uVXBkYXRlO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5vblVwZGF0ZVBhcmFtcztcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25Db21wbGV0ZTtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25Db21wbGV0ZVBhcmFtcztcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25SZXZlcnNlQ29tcGxldGU7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zO1xuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gY29yZSBjYW1lcmEgcHJvcGVydGllc1xuICAgICAgICBpZiAocHJvcHMub3JpZ2luIHx8IHByb3BzLnBvc2l0aW9uIHx8IHByb3BzLnJvdGF0aW9uIHx8IHByb3BzLnpvb20pIHtcbiAgICAgICAgICAgIHZhciBjb3JlVHdlZW4gPSBUd2Vlbk1heC50byh0aGlzLmNhbWVyYSwgZHVyYXRpb24gIT09IDAgPyBkdXJhdGlvbiA6IDAuMDE2LCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBlbmZvcmNlQm91bmRzOiAob3B0aW9ucy5lbmZvcmNlQm91bmRzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9yYXdPZmZzZXRYOiAwLFxuICAgICAgICAgICAgICAgIF9yYXdPZmZzZXRZOiAwLFxuICAgICAgICAgICAgICAgIF9yYXdTY2FsZU9mZnNldFg6IDAsXG4gICAgICAgICAgICAgICAgX3Jhd1NjYWxlT2Zmc2V0WTogMCxcbiAgICAgICAgICAgICAgICByb3RhdGlvbjogMCxcbiAgICAgICAgICAgICAgICB6b29tOiAwLFxuICAgICAgICAgICAgICAgIGltbWVkaWF0ZVJlbmRlcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogdGhpcyxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB6RGlyZWN0aW9uID0gem9vbURpcmVjdGlvbi5OT05FO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYucHJvcHMudG8uem9vbSA+IHRoaXMuY2FtZXJhLnpvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLklOO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlbGYucHJvcHMudG8uem9vbSA8IHRoaXMuY2FtZXJhLnpvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLk9VVDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuem9vbURpcmVjdGlvbiA9IHpEaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBPcmlnaW4gbXVzdCBiZSBzZXQgaW4gY2FzZSBhbmltYXRpb24gd2FzIHJldmVyc2VkIChvcmlnaW4gd2FzIHJldmVydGVkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRUcmFuc2Zvcm1PcmlnaW4oc2VsZi5wcm9wcy50by5vcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLmNvcmUgPSBzZWxmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGb3IgZGV2IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvcmUgdHdlZW4gc3RhcnRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndHdlZW4gdmFyczogJywgc2VsZi52YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3R3ZWVuIHByb3BzOiAnLCBzZWxmLnByb3BzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5jYW1lcmEuX3Jhd09mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlIGRpcmVjdCBvZmZzZXQgdHdlZW5pbmcsIHRoZW4gYXBwbHkgcm90YXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYucHJvcHMudG8uaXNPcmlnaW5BdXRvICYmIHNlbGYucHJvcHMudG8uaXNQb3NpdGlvbkNoYW5naW5nICYmIHNlbGYucHJvcHMudG8uaXNSb3RhdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbih0aGlzLmNhbWVyYS5fcmF3U2NhbGVPZmZzZXQsIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS5zY2FsZVRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0UG9zaXRpb25Ub09mZnNldChwb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4sIHRoaXMuY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zaXRpb24gaXMgbWFudWFsbHkgbWFpbnRhaW5lZCBzbyBhbmltYXRpb25zIGNhbiBzbW9vdGhseSBjb250aW51ZSB3aGVuIGNhbWVyYSBpcyByZXNpemVkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFBvc2l0aW9uKHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbihvZmZzZXQsIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1hdGlvbiksIHNlbGYuZGF0YS5lbmZvcmNlQm91bmRzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5pdENvcmVUd2Vlbih0aGlzLmNvcmVUd2VlbnNbc2VsZi5pbmRleCArIDFdLCBzZWxmLnByb3BzLmVuZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZvciBkZXYgb25seVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY29yZSB0d2VlbiBjb21wbGV0ZWQnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRUcmFuc2Zvcm1PcmlnaW4oc2VsZi5wcm9wcy5zdGFydC5vcmlnaW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29yZVR3ZWVuLnR5cGUgPSBhbmltYXRpb24udHlwZS5DT1JFO1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzID0ge1xuICAgICAgICAgICAgICAgIHNvdXJjZToge30sXG4gICAgICAgICAgICAgICAgcGFyc2VkOiB7fSxcbiAgICAgICAgICAgICAgICB0bzoge30sXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgICAgIGVuZDoge31cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLm9yaWdpbiA9IHByb3BzLm9yaWdpbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2UucG9zaXRpb24gPSBwcm9wcy5wb3NpdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uucm90YXRpb24gPSBwcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSA9IHByb3BzLnpvb207XG4gICAgICAgICAgICBjb3JlVHdlZW4uaW5kZXggPSB0aGlzLmNvcmVUd2VlbnMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5jb3JlVHdlZW5zLnB1c2goY29yZVR3ZWVuKTtcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoY29yZVR3ZWVuLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gc2hha2UgZWZmZWN0XG4gICAgICAgIGlmIChkdXJhdGlvbiA+IDAgJiYgc2hha2UgJiYgc2hha2UuaW50ZW5zaXR5ID4gMCkge1xuICAgICAgICAgICAgc2hha2VUaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHNoYWtlLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogKG9wdGlvbnMuZW5mb3JjZUJvdW5kcyA9PT0gZmFsc2UpID8gZmFsc2UgOiB0cnVlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aW1lbGluZS5zaGFrZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzRmlyc3RGcmFtZSA9IHNlbGYucHJvZ3Jlc3MoKSA9PT0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzRmluYWxGcmFtZSA9IHNlbGYucHJvZ3Jlc3MoKSA9PT0gMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldFggPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0WSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jbGFtcFBvc2l0aW9uKHRoaXMuY2FtZXJhLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbih0aGlzLmNhbWVyYS5fcmF3T2Zmc2V0LCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbiwgdGhpcy5jYW1lcmEudHJhbnNmb3JtYXRpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkhPUklaT05UQUwgfHwgc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmlyc3RGcmFtZSAmJiAhaXNGaW5hbEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WCA9IE1hdGgucmFuZG9tKCkgKiBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEud2lkdGggKiAyIC0gc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnggKz0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLlZFUlRJQ0FMIHx8IHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZpcnN0RnJhbWUgJiYgIWlzRmluYWxGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLmhlaWdodCAqIDIgLSBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnkgKz0gb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0UG9zaXRpb24ocG9zaXRpb24sIHNlbGYuZGF0YS5lbmZvcmNlQm91bmRzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J11cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRWFzZSBpbi9vdXRcbiAgICAgICAgICAgIGlmIChzaGFrZS5lYXNlSW4gJiYgc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24gKiAwLjUsIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZUluIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuXG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS50byhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uICogMC41LCB7IFxuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VPdXQgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgZHVyYXRpb24gKiAwLjUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZSBpbiBvciBlYXNlXG4gICAgICAgICAgICBlbHNlIGlmIChzaGFrZS5lYXNlSW4gJiYgIXNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VJbiB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2Ugb3V0XG4gICAgICAgICAgICBlbHNlIGlmICghc2hha2UuZWFzZUluICYmIHNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VPdXQgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlXG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmVhc2UpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IG9wdGlvbnMuZWFzZSB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vIGVhc2VcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZGF0YS5pbnRlbnNpdHkgPSBzaGFrZS5pbnRlbnNpdHk7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS50byhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7fSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoc2hha2VUaW1lbGluZSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWRkKG1haW5UaW1lbGluZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDYWxjdWxhdGVzIHRoZSBcInRvXCIgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdHxWZWN0b3IyfSBzb3VyY2VPcmlnaW4gLSBUaGUgc291cmNlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fFZlY3RvcjJ9IHNvdXJjZVBvc2l0aW9uIC0gVGhlIHNvdXJjZSBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2VSb3RhdGlvbiAtIFRoZSBzb3VyY2Ugcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc291cmNlWm9vbSAtIFRoZSBzb3VyY2Ugem9vbS5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQ2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgZW5kIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfY2FsY3VsYXRlVG9Qcm9wcyAocGFyc2VkLCBzdGFydCkge1xuICAgICAgICB2YXIgc291cmNlID0ge1xuICAgICAgICAgICAgb3JpZ2luOiAocGFyc2VkLm9yaWdpbiAhPT0gb3JpZ2luS2V5d29yZC5BVVRPKSA/IHBhcnNlZC5vcmlnaW4gOiB7fSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAocGFyc2VkLnBvc2l0aW9uICE9PSBudWxsKSA/IHBhcnNlZC5wb3NpdGlvbiA6IHt9LFxuICAgICAgICAgICAgcm90YXRpb246IHBhcnNlZC5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206IHBhcnNlZC56b29tXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBpc0FuY2hvcmVkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGFuZ2luZyB0byBzYW1lIG9yaWdpbiBpcyBuZWNlc3NhcnkgZm9yIHdoZWVsIHpvb21cbiAgICAgICAgdmFyIGlzT3JpZ2luQXV0byA9IHBhcnNlZC5vcmlnaW4gPT09IG9yaWdpbktleXdvcmQuQVVUTztcbiAgICAgICAgdmFyIGlzT3JpZ2luWENoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5vcmlnaW4ueCk7XG4gICAgICAgIHZhciBpc09yaWdpbllDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uub3JpZ2luLnkpO1xuICAgICAgICB2YXIgaXNPcmlnaW5DaGFuZ2luZyA9IGlzT3JpZ2luWENoYW5naW5nIHx8IGlzT3JpZ2luWUNoYW5naW5nO1xuICAgICAgICBcbiAgICAgICAgLy8gQ2hhbmdpbmcgdG8gc2FtZSBwb3NpdGlvbiBpcyBuZWNlc3NhcnkgZm9yIGNhbWVyYSByZXNpemVcbiAgICAgICAgdmFyIGlzUG9zaXRpb25YQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnBvc2l0aW9uLngpO1xuICAgICAgICB2YXIgaXNQb3NpdGlvbllDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2UucG9zaXRpb24ueSk7XG4gICAgICAgIHZhciBpc1Bvc2l0aW9uQ2hhbmdpbmcgPSBpc1Bvc2l0aW9uWENoYW5naW5nIHx8IGlzUG9zaXRpb25ZQ2hhbmdpbmc7XG4gICAgICAgIHZhciBpc09mZnNldENoYW5naW5nID0gaXNQb3NpdGlvbkNoYW5naW5nO1xuICAgICAgICB2YXIgaXNSb3RhdGlvbkNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5yb3RhdGlvbikgJiYgc291cmNlLnJvdGF0aW9uICE9PSBzdGFydC5yb3RhdGlvbjtcbiAgICAgICAgdmFyIGlzWm9vbUNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS56b29tKSAmJiBzb3VyY2Uuem9vbSAhPT0gc3RhcnQuem9vbTtcblxuICAgICAgICB2YXIgZm92UG9zaXRpb24gPSB0aGlzLmNhbWVyYS5jZW50ZXI7XG4gICAgICAgIHZhciBzdGFydFRyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZShzdGFydC56b29tLCBzdGFydC56b29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXN0YXJ0LnJvdGF0aW9uKSk7XG4gICAgICAgIHZhciB0b1NjYWxlT2Zmc2V0O1xuICAgICAgICB2YXIgdG9PZmZzZXQ7XG4gICAgICAgIHZhciB0b09yaWdpbiA9IG5ldyBWZWN0b3IyKGlzT3JpZ2luWENoYW5naW5nID8gc291cmNlLm9yaWdpbi54IDogc3RhcnQub3JpZ2luLngsIGlzT3JpZ2luWUNoYW5naW5nID8gc291cmNlLm9yaWdpbi55IDogc3RhcnQub3JpZ2luLnkpO1xuICAgICAgICB2YXIgdG9Qb3NpdGlvbiA9IG5ldyBWZWN0b3IyKGlzUG9zaXRpb25YQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueCA6IHN0YXJ0LnBvc2l0aW9uLngsIGlzUG9zaXRpb25ZQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueSA6IHN0YXJ0LnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgdG9Sb3RhdGlvbiA9IGlzUm90YXRpb25DaGFuZ2luZyA/IHNvdXJjZS5yb3RhdGlvbiA6IHN0YXJ0LnJvdGF0aW9uO1xuICAgICAgICB2YXIgdG9ab29tID0gaXNab29tQ2hhbmdpbmcgPyBzb3VyY2Uuem9vbSA6IHN0YXJ0Lnpvb207XG4gICAgICAgIHZhciB0b1NjYWxlVHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHRvWm9vbSwgdG9ab29tKTtcbiAgICAgICAgdmFyIHRvVHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHRvWm9vbSwgdG9ab29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXRvUm90YXRpb24pKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJvdGF0ZVRvLCB6b29tVG9cbiAgICAgICAgaWYgKGlzT3JpZ2luQXV0byAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRvT3JpZ2luLmNvcHkoc3RhcnQucG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJvdGF0ZUF0LCB6b29tQXRcbiAgICAgICAgZWxzZSBpZiAoaXNPcmlnaW5DaGFuZ2luZyAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzUG9zaXRpb25DaGFuZ2luZyA9IHRydWU7XG4gICAgICAgICAgICBmb3ZQb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0U2NlbmVQb3NpdGlvblRvRk9WUG9zaXRpb24odG9PcmlnaW4sIHN0YXJ0LnBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHN0YXJ0VHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgdG9Qb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0U2NlbmVQb3NpdGlvblRvQ2FtZXJhUG9zaXRpb24odG9PcmlnaW4sIGZvdlBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRvT3JpZ2luLCB0b1RyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBhbmltYXRlICh3aXRoIGF1dG8gb3JpZ2luKVxuICAgICAgICBlbHNlIGlmIChpc09yaWdpbkF1dG8gJiYgaXNQb3NpdGlvbkNoYW5naW5nICYmIGlzUm90YXRpb25DaGFuZ2luZykge1xuICAgICAgICAgICAgdG9PcmlnaW4uY29weSh0b1Bvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdG9TY2FsZU9mZnNldCA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0UG9zaXRpb25Ub09mZnNldCh0b1Bvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRvT3JpZ2luLCB0b1NjYWxlVHJhbnNmb3JtYXRpb24pO1xuICAgICAgICB0b09mZnNldCA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0UG9zaXRpb25Ub09mZnNldCh0b1Bvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRvT3JpZ2luLCB0b1RyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc09yaWdpbkF1dG86IGlzT3JpZ2luQXV0byxcbiAgICAgICAgICAgIGlzUG9zaXRpb25DaGFuZ2luZzogaXNQb3NpdGlvbkNoYW5naW5nLFxuICAgICAgICAgICAgaXNSb3RhdGlvbkNoYW5naW5nOiBpc1JvdGF0aW9uQ2hhbmdpbmcsXG4gICAgICAgICAgICBzY2FsZU9mZnNldFg6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b1NjYWxlT2Zmc2V0LnggOiBudWxsLFxuICAgICAgICAgICAgc2NhbGVPZmZzZXRZOiBpc09mZnNldENoYW5naW5nID8gdG9TY2FsZU9mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldFg6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC54IDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldFk6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIG9yaWdpbjogaXNBbmNob3JlZCB8fCBpc09yaWdpbkNoYW5naW5nIHx8IChpc09yaWdpbkF1dG8gJiYgaXNQb3NpdGlvbkNoYW5naW5nICYmIGlzUm90YXRpb25DaGFuZ2luZykgPyB0b09yaWdpbiA6IG51bGwsXG4gICAgICAgICAgICBwb3NpdGlvbjogaXNQb3NpdGlvbkNoYW5naW5nID8gdG9Qb3NpdGlvbiA6IG51bGwsXG4gICAgICAgICAgICByb3RhdGlvbjogaXNSb3RhdGlvbkNoYW5naW5nID8gdG9Sb3RhdGlvbiA6IG51bGwsXG4gICAgICAgICAgICB6b29tOiBpc1pvb21DaGFuZ2luZyA/IHRvWm9vbSA6IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBzdGFydGluZyBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHN0YXJ0aW5nIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfZ2V0U3RhcnRQcm9wcyAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcmlnaW46IHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi5jbG9uZSgpLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuY2FtZXJhLnBvc2l0aW9uLmNsb25lKCksXG4gICAgICAgICAgICByb3RhdGlvbjogdGhpcy5jYW1lcmEucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiB0aGlzLmNhbWVyYS56b29tXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgZW5kaW5nIHByb3BlcnR5IHZhbHVlcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgZW5kaW5nIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfZ2V0RW5kUHJvcHMgKHRvLCBzdGFydCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3JpZ2luOiAodG8ub3JpZ2luICE9PSBudWxsKSA/IHRvLm9yaWdpbiA6IHN0YXJ0Lm9yaWdpbixcbiAgICAgICAgICAgIHBvc2l0aW9uOiAodG8ucG9zaXRpb24gIT09IG51bGwpID8gdG8ucG9zaXRpb24gOiBzdGFydC5wb3NpdGlvbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiAodG8ucm90YXRpb24gIT09IG51bGwpID8gdG8ucm90YXRpb24gOiBzdGFydC5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206ICh0by56b29tICE9PSBudWxsKSA/IHRvLnpvb20gOiBzdGFydC56b29tXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogSW5pdGlhbGl6ZXMgYSBjb3JlIHR3ZWVuLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1R3ZWVuTWF4fSB0d2VlbiAtIFRoZSB0d2Vlbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfaW5pdENvcmVUd2VlbiAodHdlZW4sIHN0YXJ0UHJvcHMpIHtcbiAgICAgICAgaWYgKHR3ZWVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHN0YXJ0UHJvcHMgPSAoc3RhcnRQcm9wcyAhPT0gdW5kZWZpbmVkKSA/IHN0YXJ0UHJvcHMgOiB0aGlzLl9nZXRTdGFydFByb3BzKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwYXJzZWRQcm9wcyA9IHRoaXMuX3BhcnNlUHJvcHModHdlZW4ucHJvcHMuc291cmNlLm9yaWdpbiwgdHdlZW4ucHJvcHMuc291cmNlLnBvc2l0aW9uLCB0d2Vlbi5wcm9wcy5zb3VyY2Uucm90YXRpb24sIHR3ZWVuLnByb3BzLnNvdXJjZS56b29tKTtcbiAgICAgICAgICAgIHZhciB0b1Byb3BzID0gdGhpcy5fY2FsY3VsYXRlVG9Qcm9wcyhwYXJzZWRQcm9wcywgc3RhcnRQcm9wcyk7XG4gICAgICAgICAgICB2YXIgZW5kUHJvcHMgPSB0aGlzLl9nZXRFbmRQcm9wcyh0b1Byb3BzLCBzdGFydFByb3BzKTtcblxuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0gc3RhcnRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLnN0YXJ0ID0gc3RhcnRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLmVuZCA9IGVuZFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMucGFyc2VkID0gcGFyc2VkUHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy50byA9IHRvUHJvcHM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEVuc3VyZSBvZmZzZXQgbWF0Y2hlcyBjdXJyZW50IHBvc2l0aW9uIGJlZm9yZSB0d2VlbiBzdGFydHNcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLl91cGRhdGVSYXdPZmZzZXQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gT3JpZ2luIGFuZCBvZmZzZXQgbXVzdCBiZSB1cGRhdGVkIGJlZm9yZSB0d2VlbiBzdGFydHNcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbih0b1Byb3BzLm9yaWdpbik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMuX3Jhd09mZnNldFggPSB0b1Byb3BzLm9mZnNldFg7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLl9yYXdPZmZzZXRZID0gdG9Qcm9wcy5vZmZzZXRZO1xuICAgICAgICAgICAgdHdlZW4udmFycy5fcmF3U2NhbGVPZmZzZXRYID0gdG9Qcm9wcy5zY2FsZU9mZnNldFg7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLl9yYXdTY2FsZU9mZnNldFkgPSB0b1Byb3BzLnNjYWxlT2Zmc2V0WTtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMucm90YXRpb24gPSB0b1Byb3BzLnJvdGF0aW9uO1xuICAgICAgICAgICAgdHdlZW4udmFycy56b29tID0gdG9Qcm9wcy56b29tO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZXMgdGhlIGNvcmUgYW5pbWF0aW9uIHByb3BlcnRpZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcmlnaW4gLSBUaGUgb3JpZ2luLlxuICAgICogQHBhcmFtIHtPYmplY3R9IHBvc2l0aW9uIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gVGhlIHpvb20uXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBwYXJzZWQgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9wYXJzZVByb3BzIChvcmlnaW4sIHBvc2l0aW9uLCByb3RhdGlvbiwgem9vbSkge1xuICAgICAgICBpZiAocG9zaXRpb24gPT09ICdwcmV2aW91cycgJiYgdGhpcy5wcmV2aW91c1Byb3BzLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHJvdGF0aW9uID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb24pKSB7XG4gICAgICAgICAgICByb3RhdGlvbiA9IHRoaXMucHJldmlvdXNQcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHpvb20gPT09ICdwcmV2aW91cycgJiYgIWlzTmlsKHRoaXMucHJldmlvdXNQcm9wcy56b29tKSkge1xuICAgICAgICAgICAgem9vbSA9IHRoaXMucHJldmlvdXNQcm9wcy56b29tO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIG9yaWdpbjogVXRpbHMucGFyc2VPcmlnaW4ob3JpZ2luLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBVdGlscy5wYXJzZVBvc2l0aW9uKHBvc2l0aW9uLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiAhaXNOaWwocm90YXRpb24pID8gcm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogem9vbSB8fCBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gc2hha2UgLSBUaGUgc2hha2UgcHJvcGVydGllcy5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlU2hha2UgKHNoYWtlKSB7XG4gICAgICAgIHZhciBwYXJzZWRTaGFrZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAoc2hha2UpIHtcbiAgICAgICAgICAgIHBhcnNlZFNoYWtlID0ge1xuICAgICAgICAgICAgICAgIGludGVuc2l0eTogaXNOaWwoc2hha2UuaW50ZW5zaXR5KSA/IDAgOiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc05pbChzaGFrZS5kaXJlY3Rpb24pID8gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIIDogc2hha2UuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgIGVhc2VJbjogc2hha2UuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IHNoYWtlLmVhc2VPdXRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBwYXJzZWRTaGFrZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTdG9wcyB0aGUgYW5pbWF0aW9uIGFuZCByZWxlYXNlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLmRlc3Ryb3koKTtcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBzdXBlci5raWxsKCk7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICB0aGlzLnByZXZpb3VzUHJvcHMgPSBudWxsO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUaGUgcHJvcGVydGllcyB0byBhbmltYXRlLlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IFtwcm9wcy5wb3NpdGlvbl0gLSBUaGUgbG9jYXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnBvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IFtwcm9wcy5vcmlnaW5dIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgem9vbSdzIG9yaWdpbi4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMub3JpZ2luLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtwcm9wcy5yb3RhdGlvbl0gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlXSAtIEFuIG9iamVjdCBvZiBzaGFrZSBlZmZlY3QgcHJvcGVydGllcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMuc2hha2UuaW50ZW5zaXR5XSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtPY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9ufSBbcHJvcHMuc2hha2UuZGlyZWN0aW9uPU9jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USF0gLSBBIHNoYWtlIGRpcmVjdGlvbi4gXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlLmVhc2VJbl0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnNoYWtlLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy56b29tXSAtIEEgem9vbSB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe3Bvc2l0aW9uOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe3Bvc2l0aW9uOiB7eDogMjAwLCB5OiA1MH0sIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjogJyNib3gxMDAnLCB6b29tOiAyfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5hbmltYXRlKHtvcmlnaW46IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICovXG4gICAgYW5pbWF0ZSAocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHByb3BzLnBvc2l0aW9uLFxuICAgICAgICAgICAgb3JpZ2luOiBwcm9wcy5vcmlnaW4sXG4gICAgICAgICAgICByb3RhdGlvbjogcHJvcHMucm90YXRpb24sXG4gICAgICAgICAgICBzaGFrZTogcHJvcHMuc2hha2UsXG4gICAgICAgICAgICB6b29tOiBwcm9wcy56b29tXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNb3ZlIHRvIGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IHBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uIHRvIG1vdmUgdG8uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwb3NpdGlvbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbygnI2JveDEwMCcsIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib3gxMDAnKSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6MjAwLCB5OiA1MH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt4OiAyMDB9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eTogMjAwfSwgMSk7XG4gICAgKi9cbiAgICBtb3ZlVG8gKHBvc2l0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvblxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUm90YXRlIGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHJvdGF0aW9uJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCgnI2JveDEwMCcsIDIwLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib3gxMDAnKSwgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoe3g6IDIwMCwgeTogNTB9LCAyMCwgMSk7XG4gICAgKi9cbiAgICByb3RhdGVBdCAob3JpZ2luLCByb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiByb3RhdGlvblxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUm90YXRlIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVUbygyMCwgMSk7XG4gICAgKi9cbiAgICByb3RhdGVUbyAocm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTaGFrZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbnRlbnNpdHkgLSBBIHtAbGluayBDYW1lcmEjc2hha2VJbnRlbnNpdHl8c2hha2UgaW50ZW5zaXR5fS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtkaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fSBvcHRpb25zIHBsdXM6XG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlT3V0XSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCk7XG4gICAgKiBteUFuaW1hdGlvbi5zaGFrZSgwLjEsIDQsIE9jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uSE9SSVpPTlRBTCwgeyBlYXNlSW46IFBvd2VyMi5lYXNlSW4sIGVhc2VPdXQ6IFBvd2VyMi5lYXNlT3V0IH0pXG4gICAgKi9cbiAgICBzaGFrZSAoaW50ZW5zaXR5LCBkdXJhdGlvbiwgZGlyZWN0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hbmltYXRlKHtcbiAgICAgICAgICAgIHNoYWtlOiB7XG4gICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBpbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgZWFzZUluOiBvcHRpb25zLmVhc2VJbixcbiAgICAgICAgICAgICAgICBlYXNlT3V0OiBvcHRpb25zLmVhc2VPdXQsXG4gICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogb3B0aW9ucy5lbmZvcmNlQm91bmRzXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBab29tIGluL291dCBhdCBhIHNwZWNpZmljIGxvY2F0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBvcmlnaW4gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uem9vbUF0KCcjYm94MTAwJywgMiwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdCh7eDogMjAwLCB5OiA1MH0sIDIsIDEpO1xuICAgICovXG4gICAgem9vbUF0IChvcmlnaW4sIHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgb3JpZ2luOiBvcmlnaW4sXG4gICAgICAgICAgICB6b29tOiB6b29tXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uem9vbVRvKDIsIDEpO1xuICAgICovXG4gICAgem9vbVRvICh6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHsgXG4gICAgICAgICAgICB6b29tOiB6b29tIFxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG4vKipcbiogU2hha2UgZGlyZWN0aW9ucy5cbiogQGVudW0ge251bWJlcn1cbiovXG5BbmltYXRpb24uc2hha2UgPSB7XG4gICAgZGlyZWN0aW9uOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEJvdGggdGhlIHggYW5kIHkgYXhlcy5cbiAgICAgICAgKi9cbiAgICAgICAgQk9USDogMCxcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHggYXhpcy5cbiAgICAgICAgKi9cbiAgICAgICAgSE9SSVpPTlRBTDogMSxcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHkgYXhpcy5cbiAgICAgICAgKi9cbiAgICAgICAgVkVSVElDQUw6IDJcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEFuaW1hdGlvbjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IEFuaW1hdGlvbiBmcm9tICcuL0FuaW1hdGlvbic7XG5pbXBvcnQgeyBUeXBlIH0gIGZyb20gJy4vY29uc3RhbnRzJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLkFuaW1hdGlvbk1hbmFnZXJcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7T2JqZWN0fSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRoYXQgb3ducyB0aGlzIEFuaW1hdGlvbk1hbmFnZXIuXG4qL1xuY2xhc3MgQW5pbWF0aW9uTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IgKGNhbWVyYSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gLSBUaGUgY2FtZXJhIHRoYXQgb3ducyB0aGlzIEFuaW1hdGlvbk1hbmFnZXIuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPY3Vsby5BbmltYXRpb259IC0gVGhlIGFjdGl2ZSBhbmltYXRpb24uXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbiA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gLSBBbiBvYmplY3QgZm9yIHN0b3JpbmcgdGhlIEFuaW1hdGlvbiBpbnN0YW5jZXMuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYW5pbWF0aW9ucyA9IHt9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIEFuaW1hdGlvbk1hbmFnZXIjaXNBbmltYXRpbmdcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBpcyBydW5uaW5nIG9yIG5vdC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IGlzQW5pbWF0aW5nICgpIHtcbiAgICAgICAgdmFyIHByb2dyZXNzID0gdGhpcy5jdXJyZW50QW5pbWF0aW9uID8gdGhpcy5jdXJyZW50QW5pbWF0aW9uLnByb2dyZXNzKCkgOiAwO1xuICAgICAgICByZXR1cm4gcHJvZ3Jlc3MgPiAwICYmIHByb2dyZXNzIDwgMTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBBbmltYXRpb25NYW5hZ2VyI2lzUGF1c2VkXG4gICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY3VycmVudCBhbmltYXRpb24gaXMgcGF1c2VkIG9yIG5vdC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IGlzUGF1c2VkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEFuaW1hdGlvbiA/IHRoaXMuY3VycmVudEFuaW1hdGlvbi5wYXVzZWQoKSA6IGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFkZHMgYW4gYW5pbWF0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgdG8gZ2l2ZSB0aGUgYW5pbWF0aW9uLlxuICAgICogQHBhcmFtIHtvYmplY3R8T2N1bG8uQW5pbWF0aW9ufSBhbmltYXRpb24gLSBUaGUgYW5pbWF0aW9uLiBJdCBjYW4gYmUgYW4gYWN0dWFsIGFuaW1hdGlvbiBpbnN0YW5jZSBvciBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlIDxjYXB0aW9uPkFzIGFuIGFuaW1hdGlvbiBpbnN0YW5jZTwvY2FwdGlvbj5cbiAgICAqIG15QW5pbWF0aW9uTWFuYWdlci5hZGQoJ3pvb21Jbk91dCcsIG5ldyBPY3Vsby5BbmltYXRpb24obXlDYW1lcmEpLmFuaW1hdGUoe3pvb206IDJ9LCAyLCB7ZWFzZTogUG93ZXIyLmVhc2VJbn0pLmFuaW1hdGUoe3pvb206IDF9LCAyLCB7ZWFzZTogUG93ZXIyLmVhc2VPdXR9KSk7XG4gICAgKiBcbiAgICAqIEBleGFtcGxlIDxjYXB0aW9uPkFzIGFuIG9iamVjdCByZXByZXNlbnRpbmcgYW4gYW5pbWF0aW9uPC9jYXB0aW9uPlxuICAgICogbXlBbmltYXRpb25NYW5hZ2VyLmFkZCgnem9vbUluQW5kT3V0JywgeyBcbiAgICAqICAga2V5ZnJhbWVzOiBbeyBcbiAgICAqICAgICB6b29tOiAyLCBcbiAgICAqICAgICBkdXJhdGlvbjogMiwgXG4gICAgKiAgICAgb3B0aW9uczogeyBcbiAgICAqICAgICAgIGVhc2U6IFBvd2VyMi5lYXNlSW4gXG4gICAgKiAgICAgfVxuICAgICogICB9LCB7XG4gICAgKiAgICAgem9vbTogMSxcbiAgICAqICAgICBkdXJhdGlvbjogMixcbiAgICAqICAgICBvcHRpb25zOiB7XG4gICAgKiAgICAgICBlYXNlOiBQb3dlcjIuZWFzZU91dFxuICAgICogICAgIH1cbiAgICAqICAgfV1cbiAgICAqIH0pO1xuICAgICovICAgICAgICBcbiAgICBhZGQgKG5hbWUsIGFuaW1hdGlvbikge1xuICAgICAgICBsZXQgbmV3QW5pbWF0aW9uO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuX2FuaW1hdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2FuaW1hdGlvbnNbbmFtZV0uZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYW5pbWF0aW9uLnR5cGUgPT09IFR5cGUuQU5JTUFUSU9OKSB7XG4gICAgICAgICAgICBuZXdBbmltYXRpb24gPSBhbmltYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXdBbmltYXRpb24gPSBuZXcgQW5pbWF0aW9uKHRoaXMuY2FtZXJhKTtcbiAgICAgICAgICAgIGFuaW1hdGlvbi5rZXlmcmFtZXMuZm9yRWFjaCgoa2V5ZnJhbWUpID0+IHtcbiAgICAgICAgICAgICAgICBuZXdBbmltYXRpb24uYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbjoga2V5ZnJhbWUub3JpZ2luLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoga2V5ZnJhbWUucG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBrZXlmcmFtZS5yb3RhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgc2hha2U6IGtleWZyYW1lLnNoYWtlLFxuICAgICAgICAgICAgICAgICAgICB6b29tOiBrZXlmcmFtZS56b29tXG4gICAgICAgICAgICAgICAgfSwga2V5ZnJhbWUuZHVyYXRpb24sIGtleWZyYW1lLm9wdGlvbnMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1tuYW1lXSA9IG5ld0FuaW1hdGlvbjtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBBbmltYXRpb25NYW5hZ2VyIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuX2FuaW1hdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2FuaW1hdGlvbnNba2V5XS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9ucyA9IHt9O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgYW5pbWF0aW9uLlxuICAgICogQHJldHVybnMge09jdWxvLkFuaW1hdGlvbn0gVGhlIGFuaW1hdGlvbi5cbiAgICAqL1xuICAgIGdldCAobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYW5pbWF0aW9uc1tuYW1lXTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXVzZXMgdGhlIGFjdGl2ZSBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcGF1c2UgKCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24ucGF1c2UobnVsbCwgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBQbGF5cyB0aGUgY3VycmVudCBvciBwcm92aWRlZCBhbmltYXRpb24gZm9yd2FyZCBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdG8gcGxheS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcGxheSAobmFtZSkge1xuICAgICAgICB2YXIgYW5pbWF0aW9uO1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgYW5pbWF0aW9uID0gdGhpcy5fYW5pbWF0aW9uc1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGFuaW1hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uID0gYW5pbWF0aW9uO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uLmludmFsaWRhdGUoKS5yZXN0YXJ0KGZhbHNlLCBmYWxzZSk7XG4gICAgICAgIH0gXG4gICAgICAgIGVsc2UgaWYgKG5hbWUgPT09IHVuZGVmaW5lZCAmJiB0aGlzLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5wbGF5KG51bGwsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmVzdW1lcyBwbGF5aW5nIHRoZSBhbmltYXRpb24gZnJvbSB0aGUgY3VycmVudCBwbGF5aGVhZCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZXN1bWUgKCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24ucmVzdW1lKG51bGwsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmV2ZXJzZXMgcGxheWJhY2sgb2YgYW4gYW5pbWF0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZT1udWxsXSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24uIElmIG5vbmUgaXMgc3BlY2lmaWVkLCB0aGUgY3VycmVudCBhbmltYXRpb24gd2lsbCBiZSByZXZlcnNlZC5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZXZlcnNlIChuYW1lID0gbnVsbCkge1xuICAgICAgICB2YXIgYW5pbWF0aW9uO1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgYW5pbWF0aW9uID0gdGhpcy5fYW5pbWF0aW9uc1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGFuaW1hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uID0gYW5pbWF0aW9uO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uLmludmFsaWRhdGUoKS5yZXZlcnNlKDAsIGZhbHNlKTtcbiAgICAgICAgfSBcbiAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gbnVsbCAmJiB0aGlzLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIGxldCB0aW1lID0gdGhpcy5jdXJyZW50QW5pbWF0aW9uLnRpbWUoKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5yZXZlcnNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQW5pbWF0aW9uTWFuYWdlcjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuLy8gVE9ETzpcbi8vIDEpIEltcG9ydCBBbmltYXRpb24gdG8gYXZvaWQgdXNpbmcgT2N1bG8gbmFtZXNwYWNlXG4vLyAyKSBFbnN1cmUgZGlyZWN0aW9uYWwgcm90YXRpb24gcGx1Z2luIHdvcmtzXG5cbmltcG9ydCBjbGFtcCAgICAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvY2xhbXAnO1xuaW1wb3J0IGlzRWxlbWVudCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0VsZW1lbnQnO1xuaW1wb3J0IGlzRmluaXRlICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRnVuY3Rpb24nO1xuaW1wb3J0IGlzTmlsICAgICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc05pbCc7XG5pbXBvcnQgaXNPYmplY3QgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSAgICAgZnJvbSAnZmJlbWl0dGVyJztcbmltcG9ydCBBbmltYXRpb25NYW5hZ2VyICAgICBmcm9tICcuL2FuaW1hdGlvbk1hbmFnZXInO1xuaW1wb3J0IENTU1JlbmRlcmVyICAgICAgICAgIGZyb20gJy4vY3NzUmVuZGVyZXInO1xuaW1wb3J0IF9NYXRoICAgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRoJztcbmltcG9ydCBNYXRyaXgyICAgICAgICAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgU2NlbmUgICAgICAgICAgICAgICAgZnJvbSAnLi9zY2VuZSc7XG5pbXBvcnQgU2NlbmVNYW5hZ2VyICAgICAgICAgZnJvbSAnLi9zY2VuZU1hbmFnZXInO1xuaW1wb3J0IFRyYWNrQ29udHJvbCAgICAgICAgIGZyb20gJy4vdHJhY2tDb250cm9sJztcbmltcG9ydCBVdGlscyAgICAgICAgICAgICAgICBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBWZWN0b3IyICAgICAgICAgICAgICBmcm9tICcuL21hdGgvdmVjdG9yMic7XG5cbmNvbnN0IGFuaW1hdGlvbk5hbWUgPSB7XG4gICAgQU5PTllNT1VTOiAnX2Fub255bW91cydcbn07XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5DYW1lcmFcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Ygb3B0aW9ucy5cbiogQHBhcmFtIHtmdW5jdGlvbnxPYmplY3R9IFtvcHRpb25zLmJvdW5kc10gLSBUaGUgYm91bmRzLlxuKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmRyYWdUb01vdmVdIC0gV2hldGhlciB0aGUgY2FtZXJhJ3MgcG9zaXRpb24gaXMgZHJhZ2dhYmxlIG9yIG5vdC5cbiogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1pblpvb21dIC0gVGhlIHtAbGluayBDYW1lcmEubWluWm9vbXxtaW5pbXVtIHpvb219LlxuKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4Wm9vbV0gLSBUaGUge0BsaW5rIENhbWVyYS5tYXhab29tfG1heGltdW0gem9vbX0uXG4qIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8bnVsbH0gW29wdGlvbnMudmlld10gLSBUaGUgY2FtZXJhJ3Mgdmlldy5cbiogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy53aGVlbFRvWm9vbV0gLSBXaGV0aGVyIHdoZWVsaW5nIGNhbiBiZSB1c2VkIHRvIHpvb20gb3Igbm90LlxuKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMud2hlZWxUb1pvb21JbmNyZW1lbnRdIC0gVGhlIGJhc2Uge0BsaW5rIENhbWVyYS53aGVlbFRvWm9vbUluY3JlbWVudHx6b29tIGluY3JlbWVudH0uXG4qIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW29wdGlvbnMud2lkdGhdIC0gVGhlIGNhbWVyYSdzIHtAbGluayBDYW1lcmEud2lkdGh8d2lkdGh9LlxuKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtvcHRpb25zLmhlaWdodF0gLSBUaGUgY2FtZXJhJ3Mge0BsaW5rIENhbWVyYS5oZWlnaHR8aGVpZ2h0fS5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15Q2FtZXJhID0gbmV3IE9jdWxvLkNhbWVyYSh7IFxuKiAgIHZpZXc6ICcjY2FtZXJhJyxcbiogICBib3VuZHM6IE9jdWxvLkNhbWVyYS5ib3VuZHMuV09STERfRURHRSxcbiogICBkcmFnVG9Nb3ZlOiB0cnVlLFxuKiAgIG1pblpvb206IDAuNSxcbiogICBtYXhab29tOiAzLFxuKiAgIHdoZWVsVG9ab29tOiB0cnVlLFxuKiAgIHdoZWVsVG9ab29tSW5jcmVtZW50OiAwLjUsXG4qICAgd2lkdGg6IDEwMDAsXG4qICAgaGVpZ2h0OiA1MDBcbiogfSk7XG4qL1xuY2xhc3MgQ2FtZXJhIHtcbiAgICBjb25zdHJ1Y3RvciAoeyBcbiAgICAgICAgYm91bmRzID0gbnVsbCwgXG4gICAgICAgIGRyYWdUb01vdmUgPSBmYWxzZSwgXG4gICAgICAgIGhlaWdodCA9IDAsIFxuICAgICAgICBtYXhab29tID0gMywgXG4gICAgICAgIG1pblpvb20gPSAwLjUsIFxuICAgICAgICBvbkluaXRpYWxpemUgPSBudWxsLFxuICAgICAgICBvbkJlZm9yZVJlbmRlciA9IG51bGwsXG4gICAgICAgIG9uUmVuZGVyID0gbnVsbCxcbiAgICAgICAgdmlldyA9IG51bGwsIFxuICAgICAgICB3aGVlbFRvWm9vbSA9IGZhbHNlLCBcbiAgICAgICAgd2hlZWxUb1pvb21JbmNyZW1lbnQgPSAwLjAxLCBcbiAgICAgICAgd2lkdGggPSAwXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkFuaW1hdGlvbk1hbmFnZXJ9IC0gQW4gb2JqZWN0IGZvciBtYW5hZ2luZyBhbmltYXRpb25zLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMgPSBuZXcgQW5pbWF0aW9uTWFuYWdlcih0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIGNlbnRlciBvZiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNlbnRlciA9IG5ldyBWZWN0b3IyKHdpZHRoLCBoZWlnaHQpLm11bHRpcGx5U2NhbGFyKDAuNSk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhJ3MgcG9zaXRpb24gaXMgZHJhZ2dhYmxlIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYWdUb01vdmUgPSAoZHJhZ1RvTW92ZSA9PT0gdHJ1ZSkgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGhlaWdodC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSBpcyBhbmltYXRpbmcgb3Igbm90LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNBbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaGFzIGJlZW4gcmVuZGVyZWQgb3Igbm90LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudWxsfG51bWJlcn0gLSBUaGUgbWluaW11bSBYIHBvc2l0aW9uIGFmdGVyIGJvdW5kcyBhcmUgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5taW5Qb3NpdGlvblggPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudWxsfG51bWJlcn0gLSBUaGUgbWluaW11bSBZIHBvc2l0aW9uIGFmdGVyIGJvdW5kcyBhcmUgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5taW5Qb3NpdGlvblkgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudWxsfG51bWJlcn0gLSBUaGUgbWF4aW11bSBYIHBvc2l0aW9uIGFmdGVyIGJvdW5kcyBhcmUgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tYXhQb3NpdGlvblggPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudWxsfG51bWJlcn0gLSBUaGUgbWF4aW11bSBZIHBvc2l0aW9uIGFmdGVyIGJvdW5kcyBhcmUgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tYXhQb3NpdGlvblkgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIG1pbmltdW0gdmFsdWUgdGhlIGNhbWVyYSBjYW4gYmUgem9vbWVkLlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFNlZSB7QGxpbmsgQ2FtZXJhLnpvb218em9vbX0uXG4gICAgICAgICogQGRlZmF1bHQgMC41XG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWluWm9vbSA9IG1pblpvb207XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgbWF4aW11bSB2YWx1ZSB0aGUgY2FtZXJhIGNhbiBiZSB6b29tZWQuXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gU2VlIHtAbGluayBDYW1lcmEuem9vbXx6b29tfS5cbiAgICAgICAgKiBAZGVmYXVsdCAzXG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWF4Wm9vbSA9IG1heFpvb207XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgcG9zaXRpb24gb2YgdGhlIGNhbWVyYSBvbiB0aGUgc2NlbmUuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjdG9yMigwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSByZW5kZXJlci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBDU1NSZW5kZXJlcih0aGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBhbW91bnQgb2Ygcm90YXRpb24gaW4gZGVncmVlcy5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICovXG4gICAgICAgIHRoaXMucm90YXRpb24gPSAwO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPY3Vsby5TY2VuZU1hbmFnZXJ9IC0gQW4gb2JqZWN0IGZvciBtYW5hZ2luZyBzY2VuZXMuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2NlbmVzID0gbmV3IFNjZW5lTWFuYWdlcigpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUcmFja0NvbnRyb2x9IC0gVGhlIHRyYWNrIGNvbnRyb2wuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmFja0NvbnRyb2wgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7VmVjdG9yMn0gLSBUaGUgdHJhbnNmb3JtYXRpb24gb3JpZ2luLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyYW5zZm9ybU9yaWdpbiA9IG5ldyBWZWN0b3IyKDAsIDApO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge0VsZW1lbnR9IC0gVGhlIHZpZXcuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB3aGVlbGluZyBjYW4gYmUgdXNlZCB0byB6b29tIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLndoZWVsVG9ab29tID0gKHdoZWVsVG9ab29tID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBiYXNlIGluY3JlbWVudCBhdCB3aGljaCB0aGUgY2FtZXJhIHdpbGwgYmUgem9vbWVkLiBTZWUge0BsaW5rIENhbWVyYS56b29tfHpvb219LlxuICAgICAgICAqIEBkZWZhdWx0IDAuMDFcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aGVlbFRvWm9vbUluY3JlbWVudCA9IHdoZWVsVG9ab29tSW5jcmVtZW50O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHdpZHRoLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHpvb20gZGlyZWN0aW9uLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy56b29tRGlyZWN0aW9uID0gem9vbURpcmVjdGlvbi5OT05FO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8ZnVuY3Rpb258T2JqZWN0fSAtIFRoZSBpbnRlcm5hbGx5IG1hbmFnZWQgYm91bmRzLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ib3VuZHMgPSBib3VuZHM7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7RXZlbnRFbWl0dGVyfSAtIFRoZSBpbnRlcm5hbCBldmVudCBlbWl0dGVyLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBzY2FsZSBhdCB3aGljaCB0aGUgc2NlbmUgaXMgcmFzdGVyaXplZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmFzdGVyU2NhbGUgPSAxO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGNsYW1waW5nIG9yIGVmZmVjdHMgYXBwbGllZC4gVXNlZCB0byBhbmltYXRlIHRoZSBjYW1lcmEuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX3Jhd09mZnNldCA9IG5ldyBWZWN0b3IyKDAsIDApO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGNsYW1waW5nIG9yIGVmZmVjdHMgYXBwbGllZCBhbmQgb25seSB0YWtpbmcgc2NhbGUgaW50byBhY2NvdW50LiBVc2VkIHRvIGFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmF3U2NhbGVPZmZzZXQgPSBuZXcgVmVjdG9yMigwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSBvZmZzZXQgb2YgdGhlIHNjZW5lJ3MgdHJhbnNmb3JtIG9yaWdpbiBmcm9tIDAsMC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fdHJhbnNmb3JtT3JpZ2luT2Zmc2V0ID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBpbnRlcm5hbGx5IG1hbmFnZWQgem9vbS5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fem9vbSA9IDE7XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0aWFsaXplIHBvc2l0aW9uXG4gICAgICAgIHRoaXMuc2V0UG9zaXRpb24obmV3IFZlY3RvcjIod2lkdGggKiAwLjUsIGhlaWdodCAqIDAuNSkpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBldmVudHNcbiAgICAgICAgaWYgKG9uSW5pdGlhbGl6ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5vbkluaXRpYWxpemUgPSBvbkluaXRpYWxpemU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChvbkJlZm9yZVJlbmRlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5vbkJlZm9yZVJlbmRlciA9IG9uQmVmb3JlUmVuZGVyO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAob25SZW5kZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMub25SZW5kZXIgPSBvblJlbmRlcjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5vblJlc2l6ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIC8vIE1haW50YWluIGNhbWVyYSBwb3NpdGlvbiBhbmQgdXBkYXRlIHRoZSBjdXJyZW50IGFuaW1hdGlvblxuICAgICAgICAgICAgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzLCB7IFxuICAgICAgICAgICAgICAgIGRlc3Ryb3lPbkNvbXBsZXRlOiB0cnVlLCBcbiAgICAgICAgICAgICAgICBwYXVzZWQ6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAod2FzUGF1c2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5hbmltYXRpb25zLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICd0aGlzJyBpcyBib3VuZCB0byB0aGUgQW5pbWF0aW9uIHZpYSB0aGUgQW5pbWF0aW9uIGNsYXNzXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW5pbWF0aW9uID0gdGhpcy5jYW1lcmEuYW5pbWF0aW9ucy5jdXJyZW50QW5pbWF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRpbWUgPSBhbmltYXRpb24udGltZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uLnRvdGFsUHJvZ3Jlc3MoKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb24uc2VlaygwKS5pbnZhbGlkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uLmNvcmVUd2VlbnNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0UG9zaXRpb24oYW5pbWF0aW9uLmNvcmVUd2VlbnNbMF0ucHJvcHMuc3RhcnQucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbi5zZWVrKHRpbWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF3YXNQYXVzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogW3RoaXMuYW5pbWF0aW9ucy5pc1BhdXNlZF1cbiAgICAgICAgICAgIH0pLm1vdmVUbyh0aGlzLnBvc2l0aW9uLCAwLCB7IG92ZXJ3cml0ZTogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgIHRoaXMuX2V2ZW50cy5hZGRMaXN0ZW5lcignY2hhbmdlOnNpemUnLCB0aGlzLm9uUmVzaXplKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgdmlld1xuICAgICAgICB0aGlzLnNldFZpZXcodmlldyk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm9uSW5pdGlhbGl6ZShhcmd1bWVudHNbMF0pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNib3VuZHNcbiAgICAqIEBwcm9wZXJ0eSB7bnVsbHxmdW5jdGlvbnxPYmplY3R9IC0gVGhlIGNhbWVyYSdzIGJvdW5kcy4gVGhlIG1pbmltdW0gYW5kIG1heGltdW0gcG9zaXRpb24gdmFsdWVzIGZvciB0aGUgY2FtZXJhLiBTZXQgdG8gbnVsbCBpZiBubyBib3VuZHMgYXJlIGRlc2lyZWQuXG4gICAgKlxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYSBzdG9jayBib3VuZHM8L2NhcHRpb24+XG4gICAgKiBPY3Vsby5DYW1lcmEuYm91bmRzLldPUkxEXG4gICAgKlxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYSBib3VuZHMgb2JqZWN0PC9jYXB0aW9uPlxuICAgICogeyBcbiAgICAqICAgbWluWDogMCwgXG4gICAgKiAgIG1pblk6IDAsIFxuICAgICogICBtYXhYOiB0aGlzLnNjZW5lLndpZHRoLCBcbiAgICAqICAgbWF4WTogdGhpcy5zY2VuZS5oZWlnaHRcbiAgICAqIH1cbiAgICAqXG4gICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGJvdW5kcyBvYmplY3Q8L2NhcHRpb24+XG4gICAgKiBmdW5jdGlvbiAoKSB7IFxuICAgICogICB2YXIgdHJhbnNmb3JtYXRpb24gPSB0aGlzLnNjYWxlVHJhbnNmb3JtLmdldEludmVyc2UoKTtcbiAgICAqICAgdmFyIG1pbiA9IHRoaXMuY2VudGVyLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKTtcbiAgICAqICAgdmFyIG1heCA9IG5ldyBWZWN0b3IyKHRoaXMuc2NlbmUud2lkdGgsIHRoaXMuc2NlbmUuaGVpZ2h0KS50cmFuc2Zvcm0odGhpcy5zY2FsZVRyYW5zZm9ybSkuc3VidHJhY3QodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG4gICAgKiBcbiAgICAqICAgcmV0dXJuIHtcbiAgICAqICAgICBtaW5YOiBtaW4ueCxcbiAgICAqICAgICBtaW5ZOiBtaW4ueSxcbiAgICAqICAgICBtYXhYOiBtYXgueCxcbiAgICAqICAgICBtYXhZOiBtYXgueVxuICAgICogICB9XG4gICAgKiB9XG4gICAgKi9cbiAgICBnZXQgYm91bmRzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvdW5kcztcbiAgICB9XG5cbiAgICBzZXQgYm91bmRzICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9ib3VuZHMgPSAhdmFsdWUgPyBudWxsIDogdmFsdWU7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUJvdW5kcygpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNoYXNCb3VuZHNcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaGFzIGJvdW5kcyBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBoYXNCb3VuZHMgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmRzICE9PSBudWxsO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNpc1JvdGF0ZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaXMgcm90YXRlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBpc1JvdGF0ZWQgKCkge1xuICAgICAgICByZXR1cm4gKE1hdGguYWJzKHRoaXMucm90YXRpb24gLyAzNjApICUgMSkgPiAwO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNpc1pvb21lZFxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSBpcyB6b29tZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNab29tZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy56b29tICE9PSAxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNfcmF3T2Zmc2V0WFxuICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSBYIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGNsYW1waW5nIG9yIGVmZmVjdHMgYXBwbGllZC5cbiAgICAqL1xuICAgIGdldCBfcmF3T2Zmc2V0WCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yYXdPZmZzZXQueDtcbiAgICB9XG4gICAgXG4gICAgc2V0IF9yYXdPZmZzZXRYICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9yYXdPZmZzZXQueCA9IHZhbHVlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNfcmF3T2Zmc2V0WVxuICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSBZIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGNsYW1waW5nIG9yIGVmZmVjdHMgYXBwbGllZC5cbiAgICAqL1xuICAgIGdldCBfcmF3T2Zmc2V0WSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yYXdPZmZzZXQueTtcbiAgICB9XG4gICAgXG4gICAgc2V0IF9yYXdPZmZzZXRZICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9yYXdPZmZzZXQueSA9IHZhbHVlO1xuICAgIH1cbiAgICBcbiAgICAgICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjX3Jhd1NjYWxlT2Zmc2V0WFxuICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSBYIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGNsYW1waW5nIG9yIGVmZmVjdHMgYXBwbGllZCBhbmQgb25seSB0YWtpbmcgc2NhbGUgaW50byBhY2NvdW50LlxuICAgICovXG4gICAgZ2V0IF9yYXdTY2FsZU9mZnNldFggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmF3U2NhbGVPZmZzZXQueDtcbiAgICB9XG4gICAgXG4gICAgc2V0IF9yYXdTY2FsZU9mZnNldFggKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3Jhd1NjYWxlT2Zmc2V0LnggPSB2YWx1ZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjX3Jhd1NjYWxlT2Zmc2V0WVxuICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSBZIG9mZnNldCBvZiB0aGUgY2FtZXJhJ3MgdG9wIGxlZnQgY29ybmVyIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSB3aXRob3V0IGNsYW1waW5nIG9yIGVmZmVjdHMgYXBwbGllZCBhbmQgb25seSB0YWtpbmcgc2NhbGUgaW50byBhY2NvdW50LlxuICAgICovXG4gICAgZ2V0IF9yYXdTY2FsZU9mZnNldFkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmF3U2NhbGVPZmZzZXQueTtcbiAgICB9XG4gICAgXG4gICAgc2V0IF9yYXdTY2FsZU9mZnNldFkgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3Jhd1NjYWxlT2Zmc2V0LnkgPSB2YWx1ZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjc2NlbmVcbiAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uU2NlbmV9IC0gVGhlIGFjdGl2ZSBzY2VuZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHNjZW5lICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NlbmVzLmFjdGl2ZVNjZW5lO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNzY2FsZVRyYW5zZm9ybWF0aW9uXG4gICAgKiBAcHJvcGVydHkge01hdHJpeDJ9IC0gVGhlIHNjYWxlIHRyYW5zZm9ybWF0aW9uIG9mIHRoZSBzY2VuZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHNjYWxlVHJhbnNmb3JtYXRpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDIoKS5zY2FsZSh0aGlzLnpvb20sIHRoaXMuem9vbSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI3RyYW5zZm9ybWF0aW9uXG4gICAgKiBAcHJvcGVydHkge01hdHJpeDJ9IC0gVGhlIHRyYW5zZm9ybWF0aW9uIG9mIHRoZSBzY2VuZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHRyYW5zZm9ybWF0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgyKCkuc2NhbGUodGhpcy56b29tLCB0aGlzLnpvb20pLnJvdGF0ZShfTWF0aC5kZWdUb1JhZCgtdGhpcy5yb3RhdGlvbikpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSN6b29tXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgYW1vdW50IG9mIHpvb20uIEEgcmF0aW8gd2hlcmUgMSA9IDEwMCUuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqIEBkZWZhdWx0IDFcbiAgICAqL1xuICAgIGdldCB6b29tICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3pvb207XG4gICAgfVxuICAgICAgICBcbiAgICBzZXQgem9vbSAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fem9vbSA9IHRoaXMuX2NsYW1wWm9vbSh2YWx1ZSk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUJvdW5kcygpO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbGFtcHMgdGhlIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uLlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBjbGFtcGVkIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NsYW1wUG9zaXRpb24gKHBvc2l0aW9uKSB7XG4gICAgICAgIHJldHVybiBwb3NpdGlvbi5jbG9uZSgpLnNldCh0aGlzLl9jbGFtcFBvc2l0aW9uWChwb3NpdGlvbi54KSwgdGhpcy5fY2xhbXBQb3NpdGlvblkocG9zaXRpb24ueSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsYW1wcyB0aGUgWCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgcG9zaXRpb24uXG4gICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgY2xhbXBlZCBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jbGFtcFBvc2l0aW9uWCAoeCkge1xuICAgICAgICBpZiAodGhpcy5fYm91bmRzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB4ID0gY2xhbXAoeCwgdGhpcy5taW5Qb3NpdGlvblgsIHRoaXMubWF4UG9zaXRpb25YKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xhbXBzIHRoZSBZIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSBwb3NpdGlvbi5cbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBjbGFtcGVkIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NsYW1wUG9zaXRpb25ZICh5KSB7XG4gICAgICAgIGlmICh0aGlzLl9ib3VuZHMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHkgPSBjbGFtcCh5LCB0aGlzLm1pblBvc2l0aW9uWSwgdGhpcy5tYXhQb3NpdGlvblkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbGFtcHMgdGhlIHpvb20uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gVGhlIHpvb20uXG4gICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgY2xhbXBlZCB6b29tLlxuICAgICovXG4gICAgX2NsYW1wWm9vbSAoem9vbSkge1xuICAgICAgICByZXR1cm4gY2xhbXAoem9vbSwgdGhpcy5taW5ab29tLCB0aGlzLm1heFpvb20pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENvbnZlcnRzIGEgRk9WIHBvc2l0aW9uIHRvIGEgc2NlbmUgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhRk9WUG9zaXRpb24gLSBUaGUgcG9pbnQgaW4gdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhUG9zaXRpb24gLSBUaGUgY2FtZXJhJ3MgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUNlbnRlciAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gdHJhbnNmb3JtYXRpb24gLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBzY2VuZSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0Rk9WUG9zaXRpb25Ub1NjZW5lUG9zaXRpb24gKGNhbWVyYUZPVlBvc2l0aW9uLCBjYW1lcmFQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICByZXR1cm4gY2FtZXJhUG9zaXRpb24uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KGNhbWVyYUNlbnRlci5jbG9uZSgpLnN1YnRyYWN0KGNhbWVyYUZPVlBvc2l0aW9uKSkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uLmdldEludmVyc2UoKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBzY2VuZSBwb3NpdGlvbiB0byBhIEZPViBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBzY2VuZVBvc2l0aW9uIC0gVGhlIHJhdyBwb2ludCBvbiB0aGUgc2NlbmUuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYVBvc2l0aW9uIC0gVGhlIGNhbWVyYSdzIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHRyYW5zZm9ybWF0aW9uIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgRk9WIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NvbnZlcnRTY2VuZVBvc2l0aW9uVG9GT1ZQb3NpdGlvbiAoc2NlbmVQb3NpdGlvbiwgY2FtZXJhUG9zaXRpb24sIGNhbWVyYUNlbnRlciwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIGNhbWVyYUNlbnRlci5jbG9uZSgpLmFkZChzY2VuZVBvc2l0aW9uLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdChjYW1lcmFQb3NpdGlvbi5jbG9uZSgpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbikpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb252ZXJ0cyBhIHNjZW5lIHBvc2l0aW9uIGxvY2F0ZWQgYXQgYSBGT1YgcG9zaXRpb24gdG8gYSBjYW1lcmEgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gc2NlbmVQb3NpdGlvbiAtIFRoZSByYXcgcG9pbnQgb24gdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFGT1ZQb3NpdGlvbiAtIFRoZSBwb2ludCBpbiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSB0cmFuc2Zvcm1hdGlvbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIGNhbWVyYSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0U2NlbmVQb3NpdGlvblRvQ2FtZXJhUG9zaXRpb24gKHNjZW5lUG9zaXRpb24sIGNhbWVyYUZPVlBvc2l0aW9uLCBjYW1lcmFDZW50ZXIsIHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybU9yaWdpbk9mZnNldCA9IHRoaXMuX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCh0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgdmFyIG9mZnNldCA9IHNjZW5lUG9zaXRpb24uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KHRyYW5zZm9ybU9yaWdpbk9mZnNldCkuc3VidHJhY3QoY2FtZXJhRk9WUG9zaXRpb24pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbihvZmZzZXQsIGNhbWVyYUNlbnRlciwgdHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBjYW1lcmEgb2Zmc2V0IHRvIGEgY2FtZXJhIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYU9mZnNldCAtIFRoZSBjYW1lcmEncyBvZmZzZXQgb24gdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSB0cmFuc2Zvcm1hdGlvbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIGNhbWVyYSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIF9jb252ZXJ0T2Zmc2V0VG9Qb3NpdGlvbiAoY2FtZXJhT2Zmc2V0LCBjYW1lcmFDZW50ZXIsIHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybU9yaWdpbk9mZnNldCA9IHRoaXMuX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCh0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKTtcblxuICAgICAgICByZXR1cm4gY2FtZXJhT2Zmc2V0LmNsb25lKCkuYWRkKHRyYW5zZm9ybU9yaWdpbk9mZnNldCkuYWRkKGNhbWVyYUNlbnRlcikudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uLmdldEludmVyc2UoKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBjYW1lcmEgcG9zaXRpb24gdG8gYSBjYW1lcmEgb2Zmc2V0LlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYVBvc2l0aW9uIC0gVGhlIGNhbWVyYSdzIHBvc2l0aW9uIG9uIHRoZSBzY2VuZS5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhQ2VudGVyIC0gVGhlIGNlbnRlciBvZiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB0cmFuc2Zvcm1PcmlnaW4gLSBUaGUgdHJhbnNmb3JtIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gdHJhbnNmb3JtYXRpb24gLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBjYW1lcmEgb2Zmc2V0LlxuICAgICovXG4gICAgX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0IChjYW1lcmFQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCB0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKSB7XG4gICAgICAgIHZhciB0cmFuc2Zvcm1PcmlnaW5PZmZzZXQgPSB0aGlzLl9nZXRUcmFuc2Zvcm1PcmlnaW5PZmZzZXQodHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbik7XG5cbiAgICAgICAgcmV0dXJuIGNhbWVyYVBvc2l0aW9uLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdCh0cmFuc2Zvcm1PcmlnaW5PZmZzZXQpLnN1YnRyYWN0KGNhbWVyYUNlbnRlcik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgb2Zmc2V0IG9mIHRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHRyYW5zZm9ybWF0aW9uIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgb2Zmc2V0LlxuICAgICovXG4gICAgX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCAodHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtT3JpZ2luLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdCh0cmFuc2Zvcm1PcmlnaW4pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlc2V0cyB0aGUgY2FtZXJhIHRvIHRoZSBkZWZhdWx0IHN0YXRlLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgX3Jlc2V0ICgpIHtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1PcmlnaW4uc2V0KDAsIDApO1xuICAgICAgICB0aGlzLnNldFBvc2l0aW9uKG5ldyBWZWN0b3IyKHRoaXMud2lkdGggKiAwLjUsIHRoaXMuaGVpZ2h0ICogMC41KSk7XG4gICAgICAgIHRoaXMucm90YXRpb24gPSAwO1xuICAgICAgICB0aGlzLnpvb20gPSAxO1xuICAgICAgICB0aGlzLl9yYXN0ZXJTY2FsZSA9IDE7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVJhd09mZnNldCgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogVXBkYXRlcyB0aGUgYm91bmRzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfdXBkYXRlQm91bmRzICgpIHsgXG4gICAgICAgIHZhciBib3VuZHM7XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5zY2VuZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2JvdW5kcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbWluWDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWluWTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWF4WDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWF4WTogbnVsbFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2JvdW5kcykpIHtcbiAgICAgICAgICAgICAgICBib3VuZHMgPSB0aGlzLl9ib3VuZHMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHRoaXMuX2JvdW5kcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5taW5Qb3NpdGlvblggPSBib3VuZHMubWluWDtcbiAgICAgICAgICAgIHRoaXMubWluUG9zaXRpb25ZID0gYm91bmRzLm1pblk7XG4gICAgICAgICAgICB0aGlzLm1heFBvc2l0aW9uWCA9IGJvdW5kcy5tYXhYO1xuICAgICAgICAgICAgdGhpcy5tYXhQb3NpdGlvblkgPSBib3VuZHMubWF4WTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVE9ETzogVHVybiBhcHBseUJvdW5kcyBpbnRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gdGhhdCBjYWxscyBfdXBkYXRlQm91bmRzLCB0aGVuIGFwcGxpZXMgdGhlbVxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbih0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXBkYXRlIGJvdW5kcycpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBVcGRhdGVzIHRoZSByYXcgb2Zmc2V0LlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgX3VwZGF0ZVJhd09mZnNldCAoKSB7XG4gICAgICAgIHRoaXMuX3Jhd09mZnNldC5jb3B5KHRoaXMuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRoaXMucG9zaXRpb24sIHRoaXMuY2VudGVyLCB0aGlzLnRyYW5zZm9ybU9yaWdpbiwgdGhpcy50cmFuc2Zvcm1hdGlvbikpO1xuICAgICAgICB0aGlzLl9yYXdTY2FsZU9mZnNldC5jb3B5KHRoaXMuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRoaXMucG9zaXRpb24sIHRoaXMuY2VudGVyLCB0aGlzLnRyYW5zZm9ybU9yaWdpbiwgdGhpcy5zY2FsZVRyYW5zZm9ybWF0aW9uKSk7IFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhbiBhbmltYXRpb24gdG8gdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLkFuaW1hdGlvbk1hbmFnZXIuYWRkXG4gICAgKiByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBhZGRBbmltYXRpb24gKG5hbWUsIGFuaW1hdGlvbikge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKG5hbWUsIGFuaW1hdGlvbik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGFuIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLkFuaW1hdGlvbk1hbmFnZXIuZ2V0XG4gICAgKi9cbiAgICBnZXRBbmltYXRpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5pbWF0aW9ucy5nZXQobmFtZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhIHNjZW5lIHRvIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHNlZSBPY3Vsby5TY2VuZU1hbmFnZXIuYWRkXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgYWRkU2NlbmUgKG5hbWUsIHNjZW5lKSB7XG4gICAgICAgIHRoaXMuc2NlbmVzLmFkZChuYW1lLCBzY2VuZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGEgc2NlbmUuXG4gICAgKlxuICAgICogQHNlZSBPY3Vsby5TY2VuZU1hbmFnZXIuZ2V0XG4gICAgKi9cbiAgICBnZXRTY2VuZSAobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2VuZXMuZ2V0KG5hbWUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIGFjdGl2ZSBzY2VuZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzY2VuZS5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRTY2VuZSAobmFtZSkge1xuICAgICAgICB0aGlzLnNjZW5lcy5zZXRBY3RpdmVTY2VuZShuYW1lKTtcbiAgICAgICAgdGhpcy5fcmVzZXQoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgY2FtZXJhIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5zZXRWaWV3KG51bGwpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5zY2VuZXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ldmVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyBkcmFnLXRvLW1vdmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGVEcmFnVG9Nb3ZlICgpIHtcbiAgICAgICAgaWYgKHRoaXMudHJhY2tDb250cm9sICYmIHRoaXMuZHJhZ1RvTW92ZSkge1xuICAgICAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGlzYWJsZURyYWcoKTtcbiAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyBkcmFnLXRvLW1vdmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZURyYWdUb01vdmUgKCkge1xuICAgICAgICBpZiAodGhpcy50cmFja0NvbnRyb2wgJiYgdGhpcy5kcmFnVG9Nb3ZlKSB7XG4gICAgICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyB3aGVlbC10by16b29tLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlV2hlZWxUb1pvb20gKCkge1xuICAgICAgICBpZiAodGhpcy50cmFja0NvbnRyb2wgJiYgdGhpcy53aGVlbFRvWm9vbSkge1xuICAgICAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGlzYWJsZVdoZWVsKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyB3aGVlbC10by16b29tLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBlbmFibGVXaGVlbFRvWm9vbSAoKSB7XG4gICAgICAgIGlmICh0aGlzLnRyYWNrQ29udHJvbCAmJiB0aGlzLndoZWVsVG9ab29tKSB7XG4gICAgICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5lbmFibGVXaGVlbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FtZXJhIGhhcyBiZWVuIGluaXRpYWxpemVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gVGhlIG9wdGlvbnMgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvciB3aGVuIHRoZSBjYW1lcmEgd2FzIGNyZWF0ZWQuXG4gICAgKi9cbiAgICBvbkluaXRpYWxpemUgKG9wdGlvbnMpIHtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxsZWQgYmVmb3JlIHRoZSBjYW1lcmEgaGFzIHJlbmRlcmVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqL1xuICAgIG9uQmVmb3JlUmVuZGVyICgpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICogQ2FsbGVkIGFmdGVyIHRoZSBjYW1lcmEgaGFzIHJlbmRlcmVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqL1xuICAgIG9uUmVuZGVyICgpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICogUmVuZGVyIHRoZSBjYW1lcmEuIElmIHlvdSBuZWVkIHRvIG1hbmlwdWxhdGUgaG93IHRoZSBjYW1lcmEgcmVuZGVycywgdXNlIHtAbGluayBDYW1lcmEjb25CZWZvcmVSZW5kZXJ8b25CZWZvcmVSZW5kZXJ9IGFuZCB7QGxpbmsgQ2FtZXJhI29uUmVuZGVyfG9uUmVuZGVyfS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcmVuZGVyICgpIHtcbiAgICAgICAgdGhpcy5vbkJlZm9yZVJlbmRlcigpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudmlldyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5vblJlbmRlcigpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gcG9zaXRpb24gLSBUaGUgbmV3IHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtib29sZWFufSBlbmZvcmNlQm91bmRzIC0gV2hldGhlciB0byBlbmZvcmNlIGJvdW5kcyBvciBub3QuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0UG9zaXRpb24gKHBvc2l0aW9uLCBlbmZvcmNlQm91bmRzID0gdHJ1ZSkge1xuICAgICAgICBpZiAoZW5mb3JjZUJvdW5kcykge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi5zZXQodGhpcy5fY2xhbXBQb3NpdGlvblgocG9zaXRpb24ueCksIHRoaXMuX2NsYW1wUG9zaXRpb25ZKHBvc2l0aW9uLnkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24uc2V0KHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBzaXplIG9mIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSB3aWR0aCAtIFRoZSB3aWR0aC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gaGVpZ2h0IC0gVGhlIGhlaWdodC5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRTaXplICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBoYXNDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzTmlsKHdpZHRoKSAmJiAod2lkdGggIT09IHRoaXMud2lkdGgpKSB7XG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICB0aGlzLmNlbnRlci54ID0gd2lkdGggKiAwLjU7XG4gICAgICAgICAgICBoYXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc05pbChoZWlnaHQpICYmIChoZWlnaHQgIT09IHRoaXMuaGVpZ2h0KSkge1xuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLmNlbnRlci55ID0gaGVpZ2h0ICogMC41O1xuICAgICAgICAgICAgaGFzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChoYXNDaGFuZ2VkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy52aWV3ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXJTaXplKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMuZW1pdCgnY2hhbmdlOnNpemUnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdHJhbnNmb3JtT3JpZ2luLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IG9yaWdpbiAtIFRoZSBvcmlnaW4uXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0VHJhbnNmb3JtT3JpZ2luIChvcmlnaW4pIHtcbiAgICAgICAgaWYgKG9yaWdpbiAmJiAhb3JpZ2luLmVxdWFscyh0aGlzLnRyYW5zZm9ybU9yaWdpbikpIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtT3JpZ2luLmNvcHkob3JpZ2luKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNSb3RhdGVkIHx8IHRoaXMuaXNab29tZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVSYXdPZmZzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmlldy5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSB2aWV3IC0gVGhlIHZpZXcuIFRoaXMgY2FuIGJlIGEgc2VsZWN0b3Igb3IgYW4gZWxlbWVudC5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRWaWV3ICh2aWV3KSB7XG4gICAgICAgIHZpZXcgPSBVdGlscy5ET00ucGFyc2VWaWV3KHZpZXcpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudmlldykge1xuICAgICAgICAgICAgaWYgKHRoaXMudmlldy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy52aWV3KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy50cmFja0NvbnRyb2wgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuaXNSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fcmFzdGVyU2NhbGUgPSB0aGlzLnpvb207XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh2aWV3KSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcgPSB2aWV3O1xuICAgICAgICAgICAgdGhpcy5zY2VuZXMuZW5zdXJlVmlldygpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5zY2VuZXMudmlldyk7XG4gICAgICAgICAgICB0aGlzLnRyYWNrQ29udHJvbCA9IG5ldyBUcmFja0NvbnRyb2wodGhpcywge1xuICAgICAgICAgICAgICAgIGRyYWdnYWJsZTogdGhpcy5kcmFnVG9Nb3ZlLFxuICAgICAgICAgICAgICAgIG9uRHJhZzogZnVuY3Rpb24gKGNhbWVyYSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBjYW1lcmEuX2NvbnZlcnRPZmZzZXRUb1Bvc2l0aW9uKG5ldyBWZWN0b3IyKC10aGlzLngsIC10aGlzLnkpLCBjYW1lcmEuY2VudGVyLCBjYW1lcmEudHJhbnNmb3JtT3JpZ2luLCBjYW1lcmEudHJhbnNmb3JtYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhbWVyYS5tb3ZlVG8ocG9zaXRpb24sIDAsIHsgXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlUGFyYW1zOiBbdGhpc10sXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoZHJhZ0NvbnRyb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcmFnQ29udHJvbC51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3aGVlbGFibGU6IHRoaXMud2hlZWxUb1pvb20sXG4gICAgICAgICAgICAgICAgb25XaGVlbDogZnVuY3Rpb24gKGNhbWVyYSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBaT09NX0lOID0gMTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgWk9PTV9PVVQgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmVsb2NpdHkgPSBNYXRoLmFicyh0aGlzLndoZWVsRXZlbnQuZGVsdGFZKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMud2hlZWxFdmVudC5kZWx0YVkgPiAwID8gWk9PTV9PVVQgOiBaT09NX0lOO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlvdXNEaXJlY3Rpb24gPSB0aGlzLnByZXZpb3VzV2hlZWxFdmVudC5kZWx0YVkgPiAwID8gWk9PTV9PVVQgOiBaT09NX0lOO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FtZXJhUmVjdDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbWVyYUZPVlBvc2l0aW9uID0gbmV3IFZlY3RvcjIoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjZW5lUG9zaXRpb24gPSBuZXcgVmVjdG9yMigpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3JpZ2luID0gY2FtZXJhLnRyYW5zZm9ybU9yaWdpbjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpvb20gPSBjYW1lcmEuem9vbSArIGNhbWVyYS56b29tICogY2FtZXJhLndoZWVsVG9ab29tSW5jcmVtZW50ICogKHZlbG9jaXR5ID4gMSA/IHZlbG9jaXR5ICogMC41IDogMSkgKiAoZGlyZWN0aW9uID09PSBaT09NX0lOID8gMSA6IC0xKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBQZXJmb3JtYW5jZSBPcHRpbWl6YXRpb246IElmIHpvb20gaGFzIG5vdCBjaGFuZ2VkIGJlY2F1c2UgaXQncyBhdCB0aGUgbWluL21heCwgZG9uJ3Qgem9vbS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gcHJldmlvdXNEaXJlY3Rpb24gJiYgY2FtZXJhLl9jbGFtcFpvb20oem9vbSkgIT09IGNhbWVyYS56b29tKSB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FtZXJhUmVjdCA9IGNhbWVyYS52aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FtZXJhRk9WUG9zaXRpb24uc2V0KHRoaXMud2hlZWxFdmVudC5jbGllbnRYIC0gY2FtZXJhUmVjdC5sZWZ0LCB0aGlzLndoZWVsRXZlbnQuY2xpZW50WSAtIGNhbWVyYVJlY3QudG9wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lUG9zaXRpb24gPSBjYW1lcmEuX2NvbnZlcnRGT1ZQb3NpdGlvblRvU2NlbmVQb3NpdGlvbihjYW1lcmFGT1ZQb3NpdGlvbiwgY2FtZXJhLnBvc2l0aW9uLCBjYW1lcmEuY2VudGVyLCBjYW1lcmEudHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3MgcG9zOiAnLCBzY2VuZVBvc2l0aW9uKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguZmxvb3Iob3JpZ2luLngpICE9PSBNYXRoLmZsb29yKHNjZW5lUG9zaXRpb24ueCkgfHwgTWF0aC5mbG9vcihvcmlnaW4ueSkgIT09IE1hdGguZmxvb3Ioc2NlbmVQb3NpdGlvbi55KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbiA9IHNjZW5lUG9zaXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYS56b29tQXQob3JpZ2luLCB6b29tLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXVzZXMgdGhlIGNhbWVyYSBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcGF1c2UgKCkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGF1c2UoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFBsYXlzIHRoZSBjYW1lcmEgYW5pbWF0aW9uIGZvcndhcmQgZnJvbSB0aGUgY3VycmVudCBwbGF5aGVhZCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwbGF5IChhbmltYXRpb24pIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXN1bWVzIHBsYXlpbmcgdGhlIGNhbWVyYSBhbmltYXRpb24gZnJvbSB0aGUgY3VycmVudCBwbGF5aGVhZCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZXN1bWUgKCkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucmVzdW1lKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmV2ZXJzZXMgcGxheWJhY2sgb2YgYW4gYW5pbWF0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV0gLSBUaGUgbmFtZSBvZiB0aGUgYW5pbWF0aW9uLiBJZiBub25lIGlzIHNwZWNpZmllZCwgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIHdpbGwgYmUgcmV2ZXJzZWQuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcmV2ZXJzZSAobmFtZSkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucmV2ZXJzZShuYW1lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgYW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jYW5pbWF0ZXxBbmltYXRpb24uYW5pbWF0ZX1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBhbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS5hbmltYXRlKHByb3BzLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IG1vdmUgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI21vdmVUb3xBbmltYXRpb24ubW92ZVRvfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIG1vdmVUbyAocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcykubW92ZVRvKHBvc2l0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHJvdGF0ZSBhdCB0aGUgc3BlY2lmaWVkIGxvY2F0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jcm90YXRlQXR8QW5pbWF0aW9uLnJvdGF0ZUF0fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJvdGF0ZUF0IChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLnJvdGF0ZUF0KG9yaWdpbiwgcm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgcm90YXRlIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jcm90YXRlVG98QW5pbWF0aW9uLnJvdGF0ZVRvfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJvdGF0ZVRvIChyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS5yb3RhdGVUbyhyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSBzaGFrZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jc2hha2V8QW5pbWF0aW9uLnNoYWtlfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNoYWtlIChpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS5zaGFrZShpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSB6b29tIGluL291dCBhdCBhIHNwZWNpZmljIGxvY2F0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jem9vbUF0fEFuaW1hdGlvbi56b29tQXR9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgem9vbUF0IChvcmlnaW4sIHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcykuem9vbUF0KG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSB6b29tIGluL291dCBhdCB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI3pvb21Ub3xBbmltYXRpb24uem9vbVRvfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHpvb21UbyAoem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS56b29tVG8oem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuQ2FtZXJhLmJvdW5kcyA9IHtcbiAgICBOT05FOiBudWxsLFxuICAgIFdPUkxEOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0cmFuc2Zvcm1hdGlvbiA9IHRoaXMuc2NhbGVUcmFuc2Zvcm0uZ2V0SW52ZXJzZSgpO1xuICAgICAgICB2YXIgbWluID0gdGhpcy5jZW50ZXIuY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pO1xuICAgICAgICB2YXIgbWF4ID0gbmV3IFZlY3RvcjIodGhpcy5zY2VuZS53aWR0aCwgdGhpcy5zY2VuZS5oZWlnaHQpLnRyYW5zZm9ybSh0aGlzLnNjYWxlVHJhbnNmb3JtKS5zdWJ0cmFjdCh0aGlzLmNlbnRlcikudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluWDogbWluLngsXG4gICAgICAgICAgICBtaW5ZOiBtaW4ueSxcbiAgICAgICAgICAgIG1heFg6IG1heC54LFxuICAgICAgICAgICAgbWF4WTogbWF4LnlcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFdPUkxEX0VER0U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pblg6IDAsXG4gICAgICAgICAgICBtaW5ZOiAwLFxuICAgICAgICAgICAgbWF4WDogdGhpcy5zY2VuZS53aWR0aCxcbiAgICAgICAgICAgIG1heFk6IHRoaXMuc2NlbmUuaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENhbWVyYTsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuZXhwb3J0IGNvbnN0IG9yaWdpbktleXdvcmQgPSB7XG4gICAgQVVUTzogJ2F1dG8nXG59O1xuXG4vKipcbiogT2JqZWN0IHR5cGVzLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbmV4cG9ydCBjb25zdCBUeXBlID0ge1xuICAgIEFOSU1BVElPTjogMFxufTtcblxuLyoqXG4qIFpvb20gZGlyZWN0aW9uLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbmV4cG9ydCBjb25zdCB6b29tRGlyZWN0aW9uID0ge1xuICAgIE5PTkU6IDAsXG4gICAgSU46IDEsXG4gICAgT1VUOiAtMVxufTsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IHJvdW5kICAgICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9yb3VuZCc7XG5pbXBvcnQgeyB6b29tRGlyZWN0aW9uIH0gICAgZnJvbSAnLi9jb25zdGFudHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQ1NTUmVuZGVyZXJcbiogQGNvbnN0cnVjdG9yXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteVJlbmRlcmVyID0gbmV3IENTU1JlbmRlcmVyKG15Q2FtZXJhKTtcbiovXG5jbGFzcyBDU1NSZW5kZXJlciB7XG4gICAgY29uc3RydWN0b3IgKGNhbWVyYSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gLSBUaGUgY2FtZXJhLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgcmVuZGVyZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZW5kZXIgdGhlIHNjZW5lLlxuICAgICpcbiAgICAqIHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlbmRlciAoKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNhbWVyYS5fY29udmVydFBvc2l0aW9uVG9PZmZzZXQodGhpcy5jYW1lcmEucG9zaXRpb24sIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIHZhciByYXN0ZXJJbmNyZW1lbnQgPSAwLjM7XG4gICAgICAgIHZhciBzY2FsZUZhY3RvciA9ICh0aGlzLmNhbWVyYS56b29tID49IDEpID8gTWF0aC5mbG9vcih0aGlzLmNhbWVyYS56b29tKSA6IDAuNTtcblxuICAgICAgICAvLyBFbnN1cmUgc2NlbmUgaXMgdmlzaWJsZS4gSW4gb3JkZXIgZm9yIHNjZW5lIGF1dG8tc2l6ZSB0byB3b3JrLCBpdCBtdXN0IGhhdmUgYmVlbiBpbmNsdWRlZCBkdXJpbmcgYnJvd3NlciBsYXlvdXQuXG4gICAgICAgIHRoaXMuY2FtZXJhLnNjZW5lLnZpZXcuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcblxuICAgICAgICAvLyBDb250cm9sIHJhc3Rlcml6YXRpb24gdG8gbWFpbnRhaW4gY2xhcml0eSB3aGVuIHpvb21pbmdcbiAgICAgICAgaWYgKHRoaXMuY2FtZXJhLnpvb20gPT09IHRoaXMuY2FtZXJhLm1heFpvb20gfHwgKHRoaXMuY2FtZXJhLnpvb21EaXJlY3Rpb24gPT09IHpvb21EaXJlY3Rpb24uSU4gJiYgdGhpcy5jYW1lcmEuem9vbSA+IHRoaXMuY2FtZXJhLl9yYXN0ZXJTY2FsZSArIHJhc3RlckluY3JlbWVudCAqIHNjYWxlRmFjdG9yKSApIHtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLl9yYXN0ZXJTY2FsZSA9IHRoaXMuY2FtZXJhLnpvb207XG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5zY2VuZXMudmlldy5zdHlsZS53aWxsQ2hhbmdlID0gJ2F1dG8nO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2NlbmVzLnZpZXcuc3R5bGUud2lsbENoYW5nZSA9ICd0cmFuc2Zvcm0nO1xuICAgICAgICB9XG5cbiAgICAgICAgVHdlZW5MaXRlLnNldCh0aGlzLmNhbWVyYS5zY2VuZXMudmlldywgeyBcbiAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybU9yaWdpbjogdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLnggKyAncHggJyArIHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi55ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICBzY2FsZVg6IHRoaXMuY2FtZXJhLnpvb20sXG4gICAgICAgICAgICAgICAgc2NhbGVZOiB0aGlzLmNhbWVyYS56b29tLFxuICAgICAgICAgICAgICAgIHJvdGF0aW9uOiAtdGhpcy5jYW1lcmEucm90YXRpb24sXG4gICAgICAgICAgICAgICAgeDogLW9mZnNldC54LFxuICAgICAgICAgICAgICAgIHk6IC1vZmZzZXQueVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc1JlbmRlcmVkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJTaXplKCk7XG4gICAgICAgICAgICB0aGlzLmNhbWVyYS52aWV3LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuaXNSZW5kZXJlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZW5kZXIgdGhlIGRpbWVuc2lvbnMvc2l6ZS5cbiAgICAqXG4gICAgKiByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZW5kZXJTaXplICgpIHtcbiAgICAgICAgVHdlZW5MaXRlLnNldCh0aGlzLmNhbWVyYS52aWV3LCB7IFxuICAgICAgICAgICAgY3NzOiB7IFxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5jYW1lcmEuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLmNhbWVyYS53aWR0aFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENTU1JlbmRlcmVyOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG4vKipcbiogR1NBUCdzIERyYWdnYWJsZS5cbiogQGV4dGVybmFsIERyYWdnYWJsZVxuKiBAc2VlIGh0dHA6Ly9ncmVlbnNvY2suY29tL2RvY3MvIy9IVE1MNS9HU0FQL1V0aWxzL0RyYWdnYWJsZS9cbiovXG5cbmltcG9ydCBVdGlscyBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLkRyYWdDb250cm9sXG4qIEBjb25zdHJ1Y3RvclxuKiBAcmVxdWlyZXMge0BsaW5rIGV4dGVybmFsOkRyYWdnYWJsZX1cbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gdGFyZ2V0IC0gVGhlIHRhcmdldC5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4qIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IFtvcHRpb25zLmRyYWdQcm94eV0gLSBUaGUgZWxlbWVudCB0aGF0IGNvbnRyb2xzL2luaXRpYXRlcyB0aGUgZHJhZyBldmVudHMuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uRHJhZ10gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSBkcmFnIGV2ZW50IG9jY3Vycy5cbiogQHBhcmFtIHthcnJheX0gW29wdGlvbnMub25EcmFnUGFyYW1zXSAtIFRoZSBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIGNhbGxiYWNrLlxuKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMub25EcmFnU2NvcGVdIC0gV2hhdCAndGhpcycgcmVmZXJzIHRvIGluc2lkZSB0aGUgY2FsbGJhY2suXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteURyYWdDb250cm9sID0gbmV3IE9jdWxvLkRyYWdDb250cm9sKCcjc2NlbmUnLCB7ICBcbiogICBvbkRyYWc6IGZ1bmN0aW9uICgpIHsgXG4qICAgICBjb25zb2xlLmxvZygnZHJhZ2dpbmcnKTsgXG4qICAgfVxuKiB9KTtcbiovXG5jbGFzcyBEcmFnQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IgKHRhcmdldCwge1xuICAgICAgICBkcmFnUHJveHkgPSB0YXJnZXQsXG4gICAgICAgIG9uRHJhZyA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBvbkRyYWdQYXJhbXMgPSBbXSxcbiAgICAgICAgb25EcmFnU2NvcGUgPSB0aGlzXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBjb25maWd1cmF0aW9uLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHsgZHJhZ1Byb3h5LCBvbkRyYWcsIG9uRHJhZ1BhcmFtcywgb25EcmFnU2NvcGUgfTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RHJhZ2dhYmxlfSAtIFRoZSBvYmplY3QgdGhhdCBoYW5kbGVzIHRoZSBkcmFnIGJlaGF2aW9yLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbnRyb2wgPSBuZXcgRHJhZ2dhYmxlKHRhcmdldCwge1xuICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogb25EcmFnU2NvcGUsXG4gICAgICAgICAgICBvbkRyYWc6IG9uRHJhZyxcbiAgICAgICAgICAgIG9uRHJhZ1BhcmFtczogb25EcmFnUGFyYW1zLFxuICAgICAgICAgICAgekluZGV4Qm9vc3Q6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSBlbGVtZW50IHRoYXQgY29udHJvbHMvaW5pdGlhdGVzIHRoZSBkcmFnIGV2ZW50cy5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kcmFnUHJveHkgPSBVdGlscy5ET00ucGFyc2VWaWV3KGRyYWdQcm94eSk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciBpdCBpcyBkcmFnZ2luZyBvciBub3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGl0IGlzIHByZXNzZWQgb3Igbm90LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkRyYWdzdGFydCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uRHJhZ1JlbGVhc2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VuZERyYWcoZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25EcmFnTGVhdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VuZERyYWcoZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25EcmFnTW92ZSA9IChldmVudCkgPT4geyBcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUHJlc3NlZCAmJiAhdGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cm9sLnN0YXJ0RHJhZyhldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX2VuZERyYWcgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2wuZW5kRHJhZyhldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLl9vbkRyYWdMZWF2ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fb25EcmFnTW92ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuX29uRHJhZ01vdmUpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblByZXNzID0gKGV2ZW50KSA9PiB7IFxuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuX29uRHJhZ0xlYXZlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uRHJhZ01vdmUpO1xuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLl9vbkRyYWdNb3ZlKTtcbiAgICAgICAgICAgIHRoaXMuaXNQcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uUmVsZWFzZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVsZWFzZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25MZWF2ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVsZWFzZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcmVsZWFzZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNQcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVuYWJsZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBlbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC5lbmFibGVkKCk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtPYmplY3R9IC0gVGhlIGxhc3QgcG9pbnRlciBldmVudCB0aGF0IGFmZmVjdGVkIHRoZSBpbnN0YW5jZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHBvaW50ZXJFdmVudCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wucG9pbnRlckV2ZW50O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB4IHBvc2l0aW9uIG9mIHRoZSBsYXN0IHBvaW50ZXIgZXZlbnQgdGhhdCBhZmZlY3RlZCB0aGUgaW5zdGFuY2UuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBwb2ludGVyWCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wucG9pbnRlclg7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHkgcG9zaXRpb24gb2YgdGhlIGxhc3QgcG9pbnRlciBldmVudCB0aGF0IGFmZmVjdGVkIHRoZSBpbnN0YW5jZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHBvaW50ZXJZICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC5wb2ludGVyWTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge0VsZW1lbnR9IC0gVGhlIHRhcmdldC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHRhcmdldCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wudGFyZ2V0O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBjdXJyZW50IHggcG9zaXRpb24uXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB4ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC54O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBjdXJyZW50IHkgcG9zaXRpb24uXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB5ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC55O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBjb250cm9sIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuY29udHJvbC5raWxsKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0ge307XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIHRoZSBjb250cm9sLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlICgpIHtcbiAgICAgICAgdGhpcy5jb250cm9sLmRpc2FibGUoKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnc3RhcnQpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vblByZXNzKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLl9vbkxlYXZlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX29uUHJlc3MpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuc3R5bGUuY3Vyc29yID0gbnVsbDtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBFbmFibGVzIHRoZSBjb250cm9sLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBlbmFibGUgKCkge1xuICAgICAgICB0aGlzLmNvbnRyb2wuZW5hYmxlKCk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuX29uRHJhZ3N0YXJ0KTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25QcmVzcyk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5fb25MZWF2ZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblByZXNzKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnN0eWxlLmN1cnNvciA9ICdtb3ZlJztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogVXBkYXRlcyB0aGUgY29udHJvbCdzIHggYW5kIHkgcHJvcGVydGllcyB0byByZWZsZWN0IHRoZSB0YXJnZXQncyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgdXBkYXRlICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC51cGRhdGUoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IERyYWdDb250cm9sOyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4qIEEgY29sbGVjdGlvbiBvZiB1c2VmdWwgbWF0aGVtYXRpY2FsIHZhbHVlcyBhbmQgZnVuY3Rpb25zLlxuKlxuKiBAbmFtZXNwYWNlIE9jdWxvLk1hdGhcbiovXG5jb25zdCBfTWF0aCA9IHtcbiAgICAvKipcbiAgICAqIENvbnZlcnQgZGVncmVlcyB0byByYWRpYW5zLlxuICAgICpcbiAgICAqIEBmdW5jdGlvbiBPY3Vsby5NYXRoI2RlZ1RvUmFkXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZGVncmVlcyAtIFRoZSBkZWdyZWVzIHZhbHVlLlxuICAgICogQHJldHVybiB7bnVtYmVyfSAtIFRoZSB2YWx1ZSBpbiByYWRpYW5zLlxuICAgICovXG4gICAgZGVnVG9SYWQ6IChkZWdyZWVzKSA9PiB7XG4gICAgICAgIHJldHVybiBkZWdyZWVzICogX01hdGguZGVnVG9SYWRGYWN0b3I7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICogQ29udmVydCByYWRpYW5zIHRvIGRlZ3JlZXMuXG4gICAgKlxuICAgICogQGZ1bmN0aW9uIE9jdWxvLk1hdGgjcmFkVG9EZWdcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSByYWRpYW5zIC0gVGhlIHJhZGlhbnMgdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gVGhlIHZhbHVlIGluIGRlZ3JlZXMuXG4gICAgKi9cbiAgICByYWRUb0RlZzogKHJhZGlhbnMpID0+IHtcbiAgICAgICAgcmV0dXJuIHJhZGlhbnMgKiBfTWF0aC5yYWRUb0RlZ0ZhY3RvcjtcbiAgICB9XG59O1xuXG4vKipcbiogVGhlIGZhY3RvciB1c2VkIHRvIGNvbnZlcnQgZGVncmVlcyB0byByYWRpYW5zLlxuKlxuKiBAbmFtZSBPY3Vsby5NYXRoI2RlZ1RvUmFkRmFjdG9yXG4qIEBwcm9wZXJ0eSB7bnVtYmVyfVxuKiBAc3RhdGljXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KF9NYXRoLCAnZGVnVG9SYWRGYWN0b3InLCB7XG4gICAgdmFsdWU6IE1hdGguUEkgLyAxODBcbn0pO1xuXG4vKipcbiogVGhlIGZhY3RvciB1c2VkIHRvIGNvbnZlcnQgcmFkaWFucyB0byBkZWdyZWVzLlxuKlxuKiBAbmFtZSBPY3Vsby5NYXRoI3JhZFRvRGVnRmFjdG9yXG4qIEBwcm9wZXJ0eSB7bnVtYmVyfVxuKiBAc3RhdGljXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KF9NYXRoLCAncmFkVG9EZWdGYWN0b3InLCB7XG4gICAgdmFsdWU6IDE4MCAvIE1hdGguUElcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBfTWF0aDsiLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBpc0FycmF5TGlrZSBmcm9tICdsb2Rhc2gvaXNBcnJheUxpa2UnO1xuXG4vKipcbiogQ3JlYXRlIDJ4MiBtYXRyaXggZnJvbSBhIHNlcmllcyBvZiB2YWx1ZXMuXG4qIFxuKiBSZXByZXNlbnRlZCBsaWtlOlxuKiBcbiogfCBlMTEgfCBlMTIgfFxuKiB8IGUyMSB8IGUyMiB8XG4qXG4qIEBjbGFzcyBPY3Vsby5NYXRyaXgyXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge251bWJlcn0gZTExPTEgLSBUaGUgdmFsdWUgb2Ygcm93IDEsIGNvbHVtbiAxXG4qIEBwYXJhbSB7bnVtYmVyfSBlMTI9MCAtIFRoZSB2YWx1ZSBvZiByb3cgMSwgY29sdW1uIDJcbiogQHBhcmFtIHtudW1iZXJ9IGUyMT0wIC0gVGhlIHZhbHVlIG9mIHJvdyAyLCBjb2x1bW4gMVxuKiBAcGFyYW0ge251bWJlcn0gZTIyPTEgLSBUaGUgdmFsdWUgb2Ygcm93IDIsIGNvbHVtbiAyXG4qL1xuY2xhc3MgTWF0cml4MiB7XG4gICAgY29uc3RydWN0b3IgKGUxMSwgZTEyLCBlMjEsIGUyMikge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gZTExXG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lMTEgPSAxO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGUxMlxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZTEyID0gMDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlMjFcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmUyMSA9IDA7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gZTIyXG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lMjIgPSAxO1xuICAgICAgICBcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGUxMSwgZTEyLCBlMjEsIGUyMik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNBcnJheUxpa2UoZTExKSAmJiBlMTEubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICB0aGlzLnNldEZyb21BcnJheShlMTEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xvbmVzIHRoZSBtYXRyaXguXG4gICAgKiB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXggdG8gY2xvbmUuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBpZGVudGljYWwgbWF0cml4LlxuICAgICovXG4gICAgc3RhdGljIGNsb25lIChtKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4MihNYXRyaXgyLnRvQXJyYXkobSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsb25lcyB0aGUgbWF0cml4LlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgaWRlbnRpY2FsIG1hdHJpeC5cbiAgICAqL1xuICAgIGNsb25lICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuY2xvbmUodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29waWVzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgcHJvdmlkZWQgbWF0cml4IGludG8gdGhpcyBtYXRyaXguXG4gICAgKiB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXggdG8gY29weS5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGNvcHkgKG0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KG0uZTExLCBtLmUxMiwgbS5lMjEsIG0uZTIyKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBkZXRlcm1pbmFudC5cbiAgICAqIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeCB0byBnZXQgdGhlIGRldGVybWluYW50LlxuICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgZGV0ZXJtaW5hbnQuXG4gICAgKi9cbiAgICBzdGF0aWMgZ2V0RGV0ZXJtaW5hbnQgKG0pIHtcbiAgICAgICAgcmV0dXJuIG0uZTExICogbS5lMjIgLSBtLmUxMiAqIG0uZTIxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGRldGVybWluYW50LlxuICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgZGV0ZXJtaW5hbnQuXG4gICAgKi9cbiAgICBnZXREZXRlcm1pbmFudCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldERldGVybWluYW50KHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGludmVyc2UuXG4gICAgKiB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXggdG8gZ2V0IHRoZSBpbnZlcnNlLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gVGhlIGludmVyc2UgbWF0cml4LlxuICAgICovXG4gICAgc3RhdGljIGdldEludmVyc2UgKG0pIHtcbiAgICAgICAgcmV0dXJuIE1hdHJpeDIubXVsdGlwbHlTY2FsYXIobmV3IE1hdHJpeDIobS5lMjIsIC1tLmUxMiwgLW0uZTIxLCBtLmUxMSksIDEgLyBNYXRyaXgyLmdldERldGVybWluYW50KG0pKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBpbnZlcnNlLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gVGhlIGludmVyc2UgbWF0cml4LlxuICAgICovXG4gICAgZ2V0SW52ZXJzZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldEludmVyc2UodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTXVsdGlwbGllcyB0d28gbWF0cmljZXMuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IGEgLSBBIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gYiAtIEFub3RoZXIgbWF0cml4LlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgbWF0cml4IHRoYXQgaXMgdGhlIHByb2R1Y3Qgb2YgdGhlIHByb3ZpZGVkIG1hdHJpY2VzLlxuICAgICovLyoqXG4gICAgKiBNdWx0aXBsaWVzIGEgbGlzdCBvZiBtYXRyaWNlcy5cbiAgICAqIEBwYXJhbSB7QXJyYXl9IG0gLSBBIGxpc3Qgb2YgbWF0cmljZXMuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBtYXRyaXggdGhhdCBpcyB0aGUgcHJvZHVjdCBvZiB0aGUgcHJvdmlkZWQgbWF0cmljZXMuXG4gICAgKi9cbiAgICBzdGF0aWMgbXVsdGlwbHlNYXRyaWNlcyAoYSwgYikge1xuICAgICAgICBpZiAoYS5jb2xzID09PSBiLnJvd3MpIHtcbiAgICAgICAgICAgIGxldCBuMTEsIG4xMiwgbjIxLCBuMjI7XG4gICAgICAgICBcbiAgICAgICAgICAgIG4xMSA9IGEuZTExICogYi5lMTEgKyBhLmUxMiAqIGIuZTIxO1xuICAgICAgICAgICAgbjEyID0gYS5lMTEgKiBiLmUxMiArIGEuZTEyICogYi5lMjI7XG4gICAgICAgICAgICBuMjEgPSBhLmUyMSAqIGIuZTExICsgYS5lMjIgKiBiLmUyMTtcbiAgICAgICAgICAgIG4yMiA9IGEuZTIxICogYi5lMTIgKyBhLmUyMiAqIGIuZTIyO1xuICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWF0cml4MihuMTEsIG4xMiwgbjIxLCBuMjIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbXVsdGlwbHkgaW5jb21wYXRpYmxlIG1hdHJpY2VzJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIHRoZSBtYXRyaXggYnkgYW5vdGhlciBtYXRyaXguXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ8TWF0cml4MkR9IG0gLSBBIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIG11bHRpcGx5TWF0cmljZXMgKG0pIHtcbiAgICAgICAgaWYgKHRoaXMuY29scyA9PT0gbS5yb3dzKSB7XG4gICAgICAgICAgICBsZXQgbjExLCBuMTIsIG4yMSwgbjIyO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBuMTEgPSB0aGlzLmUxMSAqIG0uZTExICsgdGhpcy5lMTIgKiBtLmUyMTtcbiAgICAgICAgICAgIG4xMiA9IHRoaXMuZTExICogbS5lMTIgKyB0aGlzLmUxMiAqIG0uZTIyO1xuICAgICAgICAgICAgbjIxID0gdGhpcy5lMjEgKiBtLmUxMSArIHRoaXMuZTIyICogbS5lMjE7XG4gICAgICAgICAgICBuMjIgPSB0aGlzLmUyMSAqIG0uZTEyICsgdGhpcy5lMjIgKiBtLmUyMjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5zZXQobjExLCBuMTIsIG4yMSwgbjIyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IG11bHRpcGx5IGluY29tcGF0aWJsZSBtYXRyaWNlcycpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIGEgbWF0cml4IGJ5IGEgc2NhbGFyLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzIC0gVGhlIHNjYWxhci5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IHNjYWxlZCBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgbXVsdGlwbHlTY2FsYXIgKG0sIHMpIHtcbiAgICAgICAgdmFyIGUxMSA9IG0uZTExICogcztcbiAgICAgICAgdmFyIGUxMiA9IG0uZTEyICogcztcbiAgICAgICAgdmFyIGUyMSA9IG0uZTIxICogcztcbiAgICAgICAgdmFyIGUyMiA9IG0uZTIyICogcztcblxuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeDIoZTExLCBlMTIsIGUyMSwgZTIyKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIHRoZSBtYXRyaXggYnkgYSBzY2FsYXIuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcyAtIFRoZSBzY2FsYXIuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBtdWx0aXBseVNjYWxhciAocykge1xuICAgICAgICB0aGlzLmUxMSAqPSBzO1xuICAgICAgICB0aGlzLmUxMiAqPSBzO1xuICAgICAgICB0aGlzLmUyMSAqPSBzO1xuICAgICAgICB0aGlzLmUyMiAqPSBzO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFwcGxpZXMgYSByb3RhdGlvbiB0byBhIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBUaGUgYW5nbGUgaW4gcmFkaWFucy5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IHJvdGF0ZWQgbWF0cml4LlxuICAgICovXG4gICAgc3RhdGljIHJvdGF0ZSAobSwgYW5nbGUpIHtcbiAgICAgICAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgdmFyIHJvdGF0aW9uTWF0cml4ID0gbmV3IE1hdHJpeDIoY29zLCAtc2luLCBzaW4sIGNvcyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gTWF0cml4Mi5tdWx0aXBseU1hdHJpY2VzKG0sIHJvdGF0aW9uTWF0cml4KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGVzIHRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBUaGUgYW5nbGUgaW4gcmFkaWFucy5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJvdGF0ZSAoYW5nbGUpIHtcbiAgICAgICAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgdmFyIHJvdGF0aW9uTWF0cml4ID0gbmV3IE1hdHJpeDIoY29zLCAtc2luLCBzaW4sIGNvcyk7XG4gICAgICAgIHRoaXMubXVsdGlwbHlNYXRyaWNlcyhyb3RhdGlvbk1hdHJpeCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBcHBsaWVzIGEgc2NhbGUgdHJhbnNmb3JtYXRpb24gdG8gYSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgYW1vdW50IHRvIHNjYWxlIG9uIHRoZSBYIGF4aXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSBhbW91bnQgdG8gc2NhbGUgb24gdGhlIFkgYXhpcy5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IHNjYWxlZCBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgc2NhbGUgKG0sIHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIE1hdHJpeDIubXVsdGlwbHlNYXRyaWNlcyhtLCBuZXcgTWF0cml4Mih4LCAwLCAwLCB5KSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2NhbGVzIHRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSBhbW91bnQgdG8gc2NhbGUgb24gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIGFtb3VudCB0byBzY2FsZSBvbiB0aGUgWSBheGlzLlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2NhbGUgKHgsIHkpIHtcbiAgICAgICAgdGhpcy5tdWx0aXBseU1hdHJpY2VzKG5ldyBNYXRyaXgyKHgsIDAsIDAsIHkpKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZTExXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZTEyXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZTIxXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZTIyXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXQgKGUxMSwgZTEyLCBlMjEsIGUyMikge1xuICAgICAgICB0aGlzLmUxMSA9IGUxMTtcbiAgICAgICAgdGhpcy5lMTIgPSBlMTI7XG4gICAgICAgIHRoaXMuZTIxID0gZTIxO1xuICAgICAgICB0aGlzLmUyMiA9IGUyMjtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIG1hdHJpeCBmcm9tIGFuIGFycmF5LlxuICAgICogQHBhcmFtIHtBcnJheX0gYSAtIFRoZSBhcnJheSBvZiBtYXRyaXggdmFsdWVzLlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0RnJvbUFycmF5IChhKSB7XG4gICAgICAgIHRoaXMuc2V0KGFbMF0sIGFbMV0sIGFbMl0sIGFbM10pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIG1hdHJpeCB0byB0aGUgaWRlbnRpdHkuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRUb0lkZW50aXR5ICgpIHtcbiAgICAgICAgdGhpcy5zZXQoMSwgMCwgMCwgMSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgbWF0cml4IGludG8gYSBuZXcgYXJyYXkuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggdmFsdWVzLlxuICAgICovXG4gICAgc3RhdGljIHRvQXJyYXkgKG0pIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIFxuICAgICAgICBhWzBdID0gbS5lMTE7XG4gICAgICAgIGFbMV0gPSBtLmUxMjtcbiAgICAgICAgYVsyXSA9IG0uZTIxO1xuICAgICAgICBhWzNdID0gbS5lMjI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgbWF0cml4IGludG8gYSBuZXcgYXJyYXkuXG4gICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKi9cbiAgICB0b0FycmF5ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9BcnJheSh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgbWF0cml4IGludG8gYSBuZXcgRmxvYXQzMkFycmF5LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKi9cbiAgICBzdGF0aWMgdG9GbG9hdDMyQXJyYXkgKG0pIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAgICAgICBcbiAgICAgICAgYVswXSA9IG0uZTExO1xuICAgICAgICBhWzFdID0gbS5lMTI7XG4gICAgICAgIGFbMl0gPSBtLmUyMTtcbiAgICAgICAgYVszXSA9IG0uZTIyO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIG1hdHJpeCBpbnRvIGEgbmV3IEZsb2F0MzJBcnJheS5cbiAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKi9cbiAgICB0b0Zsb2F0MzJBcnJheSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnRvRmxvYXQzMkFycmF5KHRoaXMpO1xuICAgIH1cbn1cblxuLyoqXG4qIFRoZSBudW1iZXIgb2YgY29sdW1ucy5cbiogQG5hbWUgTWF0cml4MiNjb2xzXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hdHJpeDIucHJvdG90eXBlLCAnY29scycsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAyXG59KTtcblxuLyoqXG4qIFRoZSBudW1iZXIgb2Ygcm93cy5cbiogQG5hbWUgTWF0cml4MiNyb3dzXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hdHJpeDIucHJvdG90eXBlLCAncm93cycsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAyXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgTWF0cml4MjsiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBDcmVhdGVzIGEgMkQgdmVjdG9yIGZyb20gYSBzZXJpZXMgb2YgdmFsdWVzLlxuKiBcbiogQGNsYXNzIE9jdWxvLlZlY3RvcjJcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7bnVtYmVyfSB4PTAgLSBUaGUgeCB2YWx1ZS5cbiogQHBhcmFtIHtudW1iZXJ9IHk9MCAtIFRoZSB5IHZhbHVlLlxuKi9cbmNsYXNzIFZlY3RvcjIge1xuICAgIGNvbnN0cnVjdG9yICh4LCB5KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB4IHZhbHVlLlxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy54ID0gKHggIT09IHVuZGVmaW5lZCkgPyB4IDogMDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB5IHZhbHVlLlxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy55ID0gKHkgIT09IHVuZGVmaW5lZCkgPyB5IDogMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEFkZHMgdHdvIHZlY3RvcnMuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEFub3RoZXIgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIHN1bSBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqL1xuICAgIHN0YXRpYyBhZGQgKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKGEueCArIGIueCwgYS55ICsgYi55KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBZGRzIGEgdmVjdG9yIHRvIHRoZSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBhZGQgKHYpIHtcbiAgICAgICAgdGhpcy54ICs9IHYueDtcbiAgICAgICAgdGhpcy55ICs9IHYueTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbG9uZXMgdGhlIHZlY3Rvci5cbiAgICAqIHtWZWN0b3IyfSB2IC0gVGhlIHZlY3RvciB0byBjbG9uZS5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IGlkZW50aWNhbCB2ZWN0b3IuXG4gICAgKi9cbiAgICBzdGF0aWMgY2xvbmUgKHYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHYueCwgdi55KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbG9uZXMgdGhlIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IGlkZW50aWNhbCB2ZWN0b3IuXG4gICAgKi9cbiAgICBjbG9uZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmNsb25lKHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENvcGllcyB0aGUgdmFsdWVzIGZyb20gdGhlIHByb3ZpZGVkIHZlY3RvciBpbnRvIHRoaXMgdmVjdG9yLlxuICAgICoge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yIHRvIGNvcHkuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBjb3B5ICh2KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldCh2LngsIHYueSk7XG4gICAgfVxuICAgICAgICBcbiAgICAvKipcbiAgICAqIERldGVybWluZXMgaWYgdGhlIHByb3ZpZGVkIHZlY3RvcnMgYXJlIGVxdWFsLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gVGhlIGZpcnN0IHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIFRoZSBzZWNvbmQgdmVjdG9yLlxuICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdmVjdG9ycyBhcmUgZXF1YWwuXG4gICAgKi9cbiAgICBzdGF0aWMgZXF1YWxzIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBhLnggPT09IGIueCAmJiBhLnkgPT09IGIueTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXRlcm1pbmVzIGlmIHRoZSB2ZWN0b3IgZXF1YWxzIHRoZSBwcm92aWRlZCB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yLlxuICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdmVjdG9yIGVxdWFscyB0aGUgcHJvdmlkZWQgdmVjdG9yLlxuICAgICovXG4gICAgZXF1YWxzICh2KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmVxdWFscyh0aGlzLCB2KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFRha2VzIHRoZSBtYXggb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEFub3RoZXIgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIG1heCBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqL1xuICAgIHN0YXRpYyBtYXggKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKE1hdGgubWF4KGEueCwgYi54KSwgTWF0aC5tYXgoYS55LCBiLnkpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIGl0c2VsZiB0byB0aGUgbWF4IG9mIGl0c2VsZiBhbmQgdGhlIHByb3ZpZGVkIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIG1heCAodikge1xuICAgICAgICB0aGlzLnggPSBNYXRoLm1heCh0aGlzLngsIHYueCk7XG4gICAgICAgIHRoaXMueSA9IE1hdGgubWF4KHRoaXMueSwgdi55KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBUYWtlcyB0aGUgbWluIG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGIgLSBBbm90aGVyIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHZlY3RvciB0aGF0IGlzIHRoZSBtaW4gb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKi9cbiAgICBzdGF0aWMgbWluIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMihNYXRoLm1pbihhLngsIGIueCksIE1hdGgubWluKGEueSwgYi55KSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyBpdHNlbGYgdG8gdGhlIG1pbiBvZiBpdHNlbGYgYW5kIHRoZSBwcm92aWRlZCB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBtaW4gKHYpIHtcbiAgICAgICAgdGhpcy54ID0gTWF0aC5taW4odGhpcy54LCB2LngpO1xuICAgICAgICB0aGlzLnkgPSBNYXRoLm1pbih0aGlzLnksIHYueSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gVGhlIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzIC0gVGhlIHNjYWxhci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHNjYWxlZCB2ZWN0b3IuXG4gICAgKi9cbiAgICBzdGF0aWMgbXVsdGlwbHlTY2FsYXIgKHYsIHMpIHtcbiAgICAgICAgdmFyIHggPSB2LnggKiBzO1xuICAgICAgICB2YXIgeSA9IHYueSAqIHM7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHgsIHkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgdGhlIHZlY3RvciBieSBhIHNjYWxhci5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzIC0gVGhlIHNjYWxhci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB2ZWN0b3IuXG4gICAgKi9cbiAgICBtdWx0aXBseVNjYWxhciAocykge1xuICAgICAgICB0aGlzLnggKj0gcztcbiAgICAgICAgdGhpcy55ICo9IHM7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmVjdG9yIHZhbHVlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIHggdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSB5IHZhbHVlLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIHNldCAoeCwgeSkge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU3VidHJhY3RzIHR3byB2ZWN0b3JzLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBhIC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGIgLSBBbm90aGVyIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IEEgbmV3IHZlY3RvciB0aGF0IGlzIHRoZSBkaWZmZXJlbmNlIG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICovXG4gICAgc3RhdGljIHN1YnRyYWN0IChhLCBiKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMihhLnggLSBiLngsIGEueSAtIGIueSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU3VidHJhY3RzIGEgdmVjdG9yIGZyb20gdGhlIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIHN1YnRyYWN0ICh2KSB7XG4gICAgICAgIHRoaXMueCAtPSB2Lng7XG4gICAgICAgIHRoaXMueSAtPSB2Lnk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIHZlY3RvciBpbnRvIGEgbmV3IGFycmF5LlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gVGhlIHZlY3Rvci5cbiAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIHZhbHVlcy5cbiAgICAqL1xuICAgIHN0YXRpYyB0b0FycmF5ICh2KSB7XG4gICAgICAgIHZhciBhID0gbmV3IEFycmF5KDIpO1xuICAgICAgICBcbiAgICAgICAgYVswXSA9IHYueDtcbiAgICAgICAgYVsxXSA9IHYueTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSB2ZWN0b3IgaW50byBhIG5ldyBhcnJheS5cbiAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIHZhbHVlcy5cbiAgICAqL1xuICAgIHRvQXJyYXkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci50b0FycmF5KHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFRyYW5zZm9ybXMgYSB2ZWN0b3IgdXNpbmcgdGhlIHByb3ZpZGVkIG1hdHJpeC5cbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7TWF0cml4MnxNYXRyaXgyRH0gbSAtIEEgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdHJhbnNmb3JtZWQgdmVjdG9yLlxuICAgICovXG4gICAgc3RhdGljIHRyYW5zZm9ybSAodiwgbSkge1xuICAgICAgICB2YXIgeDEgPSB2LnggKiBtLmUxMSArIHYueSAqIG0uZTEyICsgKG0udHggPyBtLnR4IDogMCk7XG4gICAgICAgIHZhciB5MSA9IHYueCAqIG0uZTIxICsgdi55ICogbS5lMjIgKyAobS50eSA/IG0udHkgOiAwKTtcblxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoeDEsIHkxKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBUcmFuc2Zvcm1zIHRoZSB2ZWN0b3IgdXNpbmcgdGhlIHByb3ZpZGVkIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfE1hdHJpeDJEfSBtIC0gQSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdHJhbnNmb3JtZWQgdmVjdG9yLlxuICAgICovXG4gICAgdHJhbnNmb3JtIChtKSB7XG4gICAgICAgIHZhciB4MSA9IHRoaXMueCAqIG0uZTExICsgdGhpcy55ICogbS5lMTIgKyAobS50eCA/IG0udHggOiAwKTtcbiAgICAgICAgdmFyIHkxID0gdGhpcy54ICogbS5lMjEgKyB0aGlzLnkgKiBtLmUyMiArIChtLnR5ID8gbS50eSA6IDApO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnNldCh4MSwgeTEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVmVjdG9yMjsiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBHU0FQJ3MgVGltZWxpbmVNYXguXG4qIEBleHRlcm5hbCBUaW1lbGluZU1heFxuKiBAc2VlIGh0dHA6Ly9ncmVlbnNvY2suY29tL2RvY3MvIy9IVE1MNS9HU0FQL1RpbWVsaW5lTWF4L1xuKi9cblxuLyoqXG4qIEdTQVAncyBUd2Vlbk1heC5cbiogQGV4dGVybmFsIFR3ZWVuTWF4XG4qIEBzZWUgaHR0cDovL2dyZWVuc29jay5jb20vZG9jcy8jL0hUTUw1L0dTQVAvVHdlZW5NYXgvXG4qL1xuXG4vKipcbiogR1NBUCdzIEVhc2luZy5cbiogQGV4dGVybmFsIEVhc2luZ1xuKiBAc2VlIGh0dHA6Ly9ncmVlbnNvY2suY29tL2RvY3MvIy9IVE1MNS9HU0FQL0Vhc2luZy9cbiovXG5cbmltcG9ydCBBbmltYXRpb24gICAgIGZyb20gJy4vYW5pbWF0aW9uJztcbmltcG9ydCBDYW1lcmEgICAgICAgIGZyb20gJy4vY2FtZXJhJztcbmltcG9ydCBDU1NSZW5kZXJlciAgIGZyb20gJy4vY3NzUmVuZGVyZXInO1xuaW1wb3J0IE1hdGggICAgICAgICAgZnJvbSAnLi9tYXRoL21hdGgnO1xuaW1wb3J0IE1hdHJpeDIgICAgICAgZnJvbSAnLi9tYXRoL21hdHJpeDInO1xuaW1wb3J0IFNjZW5lICAgICAgICAgZnJvbSAnLi9zY2VuZSc7XG5pbXBvcnQgU2NlbmVNYW5hZ2VyICBmcm9tICcuL3NjZW5lTWFuYWdlcic7XG5pbXBvcnQgVXRpbHMgICAgICAgICBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBWZWN0b3IyICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuXG4vKipcbiogQG5hbWVzcGFjZSBPY3Vsb1xuKi9cbmNvbnN0IE9jdWxvID0ge1xuICAgIEFuaW1hdGlvbjogQW5pbWF0aW9uLFxuICAgIENhbWVyYTogQ2FtZXJhLFxuICAgIENTU1JlbmRlcmVyOiBDU1NSZW5kZXJlcixcbiAgICBNYXRoOiBNYXRoLFxuICAgIE1hdHJpeDI6IE1hdHJpeDIsXG4gICAgU2NlbmU6IFNjZW5lLFxuICAgIFNjZW5lTWFuYWdlcjogU2NlbmVNYW5hZ2VyLFxuICAgIFV0aWxzOiBVdGlscyxcbiAgICBWZWN0b3IyOiBWZWN0b3IyXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE9jdWxvOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgVXRpbHMgICAgIGZyb20gJy4vdXRpbHMnO1xuXG5jb25zdCBzY2VuZVNpemUgPSB7XG4gICAgQVVUTzogJ2F1dG8nXG59O1xuXG4vKipcbiogQ3JlYXRlcyBhIHNjZW5lLlxuKiBcbiogQGNsYXNzIE9jdWxvLlNjZW5lXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSBbdmlldz1udWxsXSAtIFRoZSB2aWV3IGZvciB0aGUgc2NlbmUuIEl0IGNhbiBiZSBhIHNlbGVjdG9yIG9yIGFuIGVsZW1lbnQuXG4qIEBwYXJhbSB7bnVtYmVyfSBbd2lkdGg9J2F1dG8nXSAtIFRoZSB3aWR0aCBvZiB0aGUgc2NlbmUuXG4qIEBwYXJhbSB7bnVtYmVyfSBbaGVpZ2h0PSdhdXRvJ10gLSBUaGUgaGVpZ2h0IG9mIHRoZSBzY2VuZS5cbiovXG5jbGFzcyBTY2VuZSB7XG4gICAgY29uc3RydWN0b3IgKHZpZXcgPSBudWxsLCB3aWR0aCA9ICdhdXRvJywgaGVpZ2h0ID0gJ2F1dG8nKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdmlldy4gQW4gSFRNTCBlbGVtZW50LlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnZpZXcgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcnxzdHJpbmd9IC0gVGhlIHdpZHRoLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcnxzdHJpbmd9IC0gVGhlIGhlaWdodC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgLy8gU2V0IHVwIHZpZXdcbiAgICAgICAgdGhpcy5zZXRWaWV3KHZpZXcpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIFNjZW5lI3dpZHRoXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgd2lkdGguXG4gICAgKi9cbiAgICBnZXQgd2lkdGggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fd2lkdGggIT09IHNjZW5lU2l6ZS5BVVRPID8gdGhpcy5fd2lkdGggOiAodGhpcy52aWV3ID8gdGhpcy52aWV3Lm9mZnNldFdpZHRoIDogMCk7XG4gICAgfVxuICAgIFxuICAgIHNldCB3aWR0aCAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fd2lkdGggPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBuYW1lIFNjZW5lI2hlaWdodFxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGhlaWdodC5cbiAgICAqL1xuICAgIGdldCBoZWlnaHQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGVpZ2h0ICE9PSBzY2VuZVNpemUuQVVUTyA/IHRoaXMuX2hlaWdodCA6ICh0aGlzLnZpZXcgPyB0aGlzLnZpZXcub2Zmc2V0SGVpZ2h0IDogMCk7XG4gICAgfVxuICAgIFxuICAgIHNldCBoZWlnaHQgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2hlaWdodCA9IHZhbHVlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFjdGl2YXRlcyB0aGUgdmlldy5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgYWN0aXZhdGVWaWV3ICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLnZpZXcuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgc2NlbmUgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLnJlbW92ZVZpZXcoKTtcbiAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlbW92ZXMgdGhlIHZpZXcgZnJvbSB0aGUgZG9jdW1lbnQuXG4gICAgKlxuICAgICogQHBhcmFtIHtFbGVtZW50fSB2aWV3IC0gVGhlIHZpZXcuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcmVtb3ZlVmlldyAoKSB7XG4gICAgICAgIGlmICh0aGlzLnZpZXcgJiYgdGhpcy52aWV3LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMudmlldyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZpZXcuXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gdmlldyAtIFRoZSB2aWV3LiBUaGlzIGNhbiBiZSBhIHNlbGVjdG9yIG9yIGFuIGVsZW1lbnQuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2V0VmlldyAodmlldykge1xuICAgICAgICB2aWV3ID0gVXRpbHMuRE9NLnBhcnNlVmlldyh2aWV3KTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVtb3ZlVmlldygpO1xuICAgICAgICB0aGlzLnZpZXcgPSB2aWV3O1xuICAgICAgICAvLyBFbnN1cmUgdGhlIG5ldyB2aWV3IGlzIG5vdCBpbiB0aGUgRE9NIGlmIGl0IG9yaWdpbmF0ZWQgdGhlcmVcbiAgICAgICAgdGhpcy5yZW1vdmVWaWV3KCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTY2VuZTsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IFNjZW5lICAgIGZyb20gJy4vc2NlbmUnO1xuXG4vKipcbiogQ3JlYXRlcyBhIHNjZW5lIG1hbmFnZXIuXG4qIFxuKiBAY2xhc3MgT2N1bG8uU2NlbmVNYW5hZ2VyXG4qIEBjb25zdHJ1Y3RvclxuKi9cbmNsYXNzIFNjZW5lTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLlNjZW5lfSAtIFRoZSBhY3RpdmUgc2NlbmUuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSB2aWV3LiBBbiBIVE1MIGVsZW1lbnQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gLSBBbiBvYmplY3QgZm9yIHN0b3JpbmcgdGhlIG1hbmFnZWQgU2NlbmUgaW5zdGFuY2VzLlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX3NjZW5lcyA9IHt9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFkZHMgYSBzY2VuZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIHRvIGdpdmUgdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtPY3Vsby5TY2VuZX0gc2NlbmUgLSBUaGUgc2NlbmUuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgYWRkIChuYW1lLCBzY2VuZSkge1xuICAgICAgICBpZiAodHlwZW9mIHNjZW5lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2NlbmUgPSBuZXcgU2NlbmUoc2NlbmUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zY2VuZXNbbmFtZV0gPSBzY2VuZTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBTY2VuZU1hbmFnZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fc2NlbmVzKSB7XG4gICAgICAgICAgICB0aGlzLl9zY2VuZXNba2V5XS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBudWxsO1xuICAgICAgICB0aGlzLnZpZXcgPSBudWxsO1xuICAgICAgICB0aGlzLl9zY2VuZXMgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEVuc3VyZXMgYSB2aWV3IGlzIHJlYWR5LlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBlbnN1cmVWaWV3ICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyBhIHNjZW5lLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHNjZW5lLlxuICAgICogQHJldHVybnMge09jdWxvLlNjZW5lfSBUaGUgc2NlbmUuXG4gICAgKi9cbiAgICBnZXQgKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NjZW5lc1tuYW1lXTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBhY3RpdmUgc2NlbmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldEFjdGl2ZVNjZW5lIChuYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZVNjZW5lKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVNjZW5lLnJlbW92ZVZpZXcoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5hY3RpdmVTY2VuZSA9IHRoaXMuX3NjZW5lc1tuYW1lXTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2NlbmUuYWN0aXZhdGVWaWV3KCk7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5hY3RpdmVTY2VuZS52aWV3KTtcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS53aWR0aCA9IHRoaXMuYWN0aXZlU2NlbmUud2lkdGggKyAncHgnO1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmhlaWdodCA9IHRoaXMuYWN0aXZlU2NlbmUuaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTY2VuZU1hbmFnZXI7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBEcmFnQ29udHJvbCAgZnJvbSAnLi9kcmFnQ29udHJvbCc7XG5pbXBvcnQgV2hlZWxDb250cm9sIGZyb20gJy4vd2hlZWxDb250cm9sJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLlRyYWNrQ29udHJvbFxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtPY3Vsby5DYW1lcmF9IGNhbWVyYSAtIFRoZSBjYW1lcmEuXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2YgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmRyYWdnYWJsZV0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGhhbmRsZWQgb3Igbm90LlxuKiBAcGFyYW0ge2Z1bmN0aW9ufSBbb3B0aW9ucy5vbkRyYWddIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZXZlcnkgdGltZSB0aGUgZHJhZyBldmVudCBvY2N1cnMuXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMud2hlZWxhYmxlXSAtIFdoZXRoZXIgd2hlZWxpbmcgaXMgaGFuZGxlZCBvciBub3QuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uV2hlZWxdIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZXZlcnkgdGltZSB0aGUgd2hlZWwgZXZlbnQgb2NjdXJzLlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlUcmFja0NvbnRyb2wgPSBuZXcgT2N1bG8uVHJhY2tDb250cm9sKG15Q2FtZXJhLCB7IFxuKiAgIGRyYWdnYWJsZTogdHJ1ZSwgXG4qICAgb25EcmFnOiBmdW5jdGlvbiAoKSB7IFxuKiAgICAgY29uc29sZS5sb2coJ2RyYWdnaW5nJyk7IFxuKiAgIH0sIFxuKiAgIHdoZWVsYWJsZTogdHJ1ZSwgXG4qICAgb25XaGVlbDogZnVuY3Rpb24gKCkgeyBcbiogICAgIGNvbnNvbGUubG9nKCd3aGVlbGluZycpOyBcbiogICB9XG4qIH0pO1xuKi9cbmNsYXNzIFRyYWNrQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IgKGNhbWVyYSwge1xuICAgICAgICBkcmFnZ2FibGUgPSBmYWxzZSxcbiAgICAgICAgb25EcmFnID0gdW5kZWZpbmVkLFxuICAgICAgICB3aGVlbGFibGUgPSBmYWxzZSxcbiAgICAgICAgb25XaGVlbCA9IHVuZGVmaW5lZFxuICAgIH0gPSB7fSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkNhbWVyYX0gLSBUaGUgY2FtZXJhLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGhhbmRsZWQgb3Igbm90LlxuICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNEcmFnZ2FibGUgPSAoZHJhZ2dhYmxlID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RHJhZ2dhYmxlfSAtIFRoZSBkcmFnIGNvbnRyb2wuXG4gICAgICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYWdDb250cm9sID0gIXRoaXMuaXNEcmFnZ2FibGUgPyBudWxsIDogbmV3IERyYWdDb250cm9sKHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3LCB7XG4gICAgICAgICAgICBkcmFnUHJveHk6IHRoaXMuY2FtZXJhLnZpZXcsXG4gICAgICAgICAgICBvbkRyYWc6IG9uRHJhZyxcbiAgICAgICAgICAgIG9uRHJhZ1BhcmFtczogW3RoaXMuY2FtZXJhXSxcbiAgICAgICAgICAgIHpJbmRleEJvb3N0OiBmYWxzZVxuICAgICAgICB9KTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB3aGVlbGluZyBpcyBoYW5kbGVkIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzV2hlZWxhYmxlID0gKHdoZWVsYWJsZSA9PT0gdHJ1ZSkgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1doZWVsQ29udHJvbH0gLSBUaGUgd2hlZWwgY29udHJvbC5cbiAgICAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMud2hlZWxDb250cm9sID0gIXRoaXMuaXNXaGVlbGFibGUgPyBudWxsIDogbmV3IFdoZWVsQ29udHJvbCh0aGlzLmNhbWVyYS52aWV3LCB7XG4gICAgICAgICAgICBvbldoZWVsOiBvbldoZWVsLFxuICAgICAgICAgICAgb25XaGVlbFBhcmFtczogW3RoaXMuY2FtZXJhXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgZHJhZ0VuYWJsZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0RyYWdnYWJsZSA/IHRoaXMuZHJhZ0NvbnRyb2wuZW5hYmxlZCA6IGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHdoZWVsaW5nIGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgd2hlZWxFbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNXaGVlbGFibGUgPyB0aGlzLndoZWVsQ29udHJvbC5lbmFibGVkIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIGNvbnRyb2wgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5kcmFnQ29udHJvbC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgZHJhZ2dpbmcuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGVEcmFnICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ0NvbnRyb2wuZGlzYWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBFbmFibGVzIGRyYWdnaW5nLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBlbmFibGVEcmFnICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ0NvbnRyb2wuZW5hYmxlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyB3aGVlbGluZy5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGlzYWJsZVdoZWVsICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmRpc2FibGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyB3aGVlbGluZy5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlV2hlZWwgKCkge1xuICAgICAgICBpZiAodGhpcy5pc1doZWVsYWJsZSkge1xuICAgICAgICAgICAgdGhpcy53aGVlbENvbnRyb2wuZW5hYmxlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRyYWNrQ29udHJvbDsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IGlzRWxlbWVudCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0VsZW1lbnQnO1xuaW1wb3J0IGlzT2JqZWN0ICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc09iamVjdCc7XG5pbXBvcnQgeyBvcmlnaW5LZXl3b3JkIH0gICAgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQG5hbWVzcGFjZSBPY3Vsby5VdGlsc1xuKi9cbmNvbnN0IFV0aWxzID0ge1xuICAgIC8qKlxuICAgICogR2V0IHRoZSBDU1MgdHJhbnNmb3JtIHZhbHVlIGZvciBhbiBlbGVtZW50LlxuICAgICpcbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBUaGUgZWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBDU1MgdHJhbnNmb3JtIHZhbHVlLlxuICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKi9cbiAgICBnZXRDc3NUcmFuc2Zvcm06IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBsZXQgdmFsdWUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZ2V0UHJvcGVydHlWYWx1ZSgndHJhbnNmb3JtJyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlICdtYXRyaXgoKScgYW5kIGFsbCB3aGl0ZXNwYWNlLiBUaGVuIHNlcGFyYXRlIGludG8gYW4gYXJyYXkuXG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXlxcdytcXCgvLCcnKS5yZXBsYWNlKC9cXCkkLywnJykucmVwbGFjZSgvXFxzKy9nLCAnJykuc3BsaXQoJywnKTtcblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFRoaXMgc3VwZXIgc2ltcGxpc3RpYyBhbmQgb25seSBoYW5kbGVzIDJEIG1hdHJpY2VzLlxuICAgIGdldFRyYW5zZm9ybU1hdHJpeDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBzdHlsZVZhbHVlID0gdXRpbHMuZ2V0Q3NzVHJhbnNmb3JtKGVsKTtcbiAgICAgICAgdmFyIG1hdHJpeCA9IFtdO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN0eWxlVmFsdWVbMF0gPT09ICdub25lJykge1xuICAgICAgICAgICAgbWF0cml4ID0gWzEsIDAsIDAsIDEsIDAsIDBdXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHlsZVZhbHVlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBtYXRyaXgucHVzaChwYXJzZUZsb2F0KGl0ZW0pKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbWF0cml4O1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUgZm9yIGFuIGVsZW1lbnQuXG4gICAgKlxuICAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIFRoZSBlbGVtZW50IGZvciB3aGljaCB0byBzZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIEFuIG9iamVjdCBvZiBDU1MgdHJhbnNmb3JtIHZhbHVlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NjYWxlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byBib3RoIFggYW5kIFkgYXhlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZVhdIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdzY2FsZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZVldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdzY2FsZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFkgYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5za2V3WF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NrZXcnIGZ1bmN0aW9uIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBYIGF4aXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2tld1ldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdza2V3JyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRyYW5zbGF0ZV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3RyYW5zbGF0ZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gYm90aCBYIGFuZCBZIGF4ZXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudHJhbnNsYXRlWF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3RyYW5zbGF0ZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50cmFuc2xhdGVZXSAtIEEgdmFsaWQgQ1NTIHRyYW5zZm9ybSAndHJhbnNsYXRlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFt0cmFja2VyXSAtIFRoZSBvYmplY3QgdGhhdCBpcyB0cmFja2luZyB0aGUgdHJhbnNpdGlvbi4gJ2lzVHJhbnNpdGlvbmluZycgb24gdGhlIG9iamVjdCB3aWxsIGJlIHNldCB0byAndHJ1ZScuXG4gICAgKiBAcmV0dXJucyB7RWxlbWVudH0gVGhlIGVsZW1lbnQuXG4gICAgKi9cblxuICAgIC8vIFRPRE86IFRoaXMgaXMgYSB2ZXJ5IHNpbXBsaXN0aWMgc29sdXRpb24uXG4gICAgLy8gSWRlYWxseSB3b3VsZCBoYW5kbGUgJ3JvdGF0ZScgb3B0aW9uLlxuICAgIC8vIElkZWFsbHkgd291bGQgaGFuZGxlIDNEIE1hdHJpeC5cbiAgICBzZXRDc3NUcmFuc2Zvcm06IGZ1bmN0aW9uIChlbCwgb3B0aW9ucywgdHJhY2tlcikge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIGxldCB2YWx1ZSA9IHV0aWxzLmdldENzc1RyYW5zZm9ybShlbCk7XG4gICAgICAgIGNvbnN0IENTU19UUkFOU0ZPUk1fS0VZV09SRFMgPSBbJ2luaGVyaXQnLCAnaW5pdGlhbCcsICdub25lJywgJ3Vuc2V0J107XG4gICAgICAgIGNvbnN0IERFRkFVTFRfTUFUUklYXzJEID0gWzEsIDAsIDAsIDEsIDAsIDBdO1xuICAgICAgICBjb25zdCBNQVRSSVhfMkQgPSB7XG4gICAgICAgICAgICBzY2FsZVg6IDAsXG4gICAgICAgICAgICBzY2FsZVk6IDMsXG4gICAgICAgICAgICBza2V3WTogMSxcbiAgICAgICAgICAgIHNrZXdYOiAyLFxuICAgICAgICAgICAgdHJhbnNsYXRlWDogNCxcbiAgICAgICAgICAgIHRyYW5zbGF0ZVk6IDVcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAob3B0aW9ucy5zY2FsZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5zY2FsZVggPSBvcHRpb25zLnNjYWxlWSA9IG9wdGlvbnMuc2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy50cmFuc2xhdGUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMudHJhbnNsYXRlWCA9IG9wdGlvbnMudHJhbnNsYXRlWSA9IG9wdGlvbnMudHJhbnNsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHRyYW5zZm9ybSB2YWx1ZSBpcyBhIGtleXdvcmQsIHVzZSBhIGRlZmF1bHQgbWF0cml4LlxuICAgICAgICBpZiAoQ1NTX1RSQU5TRk9STV9LRVlXT1JEUy5pbmRleE9mKHZhbHVlWzBdKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBERUZBVUxUX01BVFJJWF8yRDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIE1BVFJJWF8yRCkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNba2V5XSkge1xuICAgICAgICAgICAgICAgIGlmIChfLmlzRmluaXRlKG9wdGlvbnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVbTUFUUklYXzJEW2tleV1dID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGFuIGludmFsaWQgQ1NTIG1hdHJpeCB2YWx1ZScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBlbC5zdHlsZS50cmFuc2Zvcm0gPSAnbWF0cml4KCcgKyB2YWx1ZS5qb2luKCcsICcpICsgJyknO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRyYWNrZXIpIHtcbiAgICAgICAgICAgIHRyYWNrZXIuaXNUcmFuc2l0aW9uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gSWYgdHJhbnNpdGlvbiBkdXJhdGlvbiBpcyAwLCAndHJhbnNpdGlvbmVuZCcgZXZlbnQgd2hpY2ggaGFuZGxlcyAnaXNUcmFuc2l0aW9uaW5nJyB3aWxsIG5vdCBmaXJlLlxuICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoJ3RyYW5zaXRpb24tZHVyYXRpb24nKSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0cmFja2VyLmlzVHJhbnNpdGlvbmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAqIFNldCB0aGUgQ1NTIHRyYW5zaXRpb24gcHJvcGVydGllcyBmb3IgYW4gZWxlbWVudC5cbiAgICAqXG4gICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gVGhlIGVsZW1lbnQgZm9yIHdoaWNoIHRvIHNldCB0aGUgQ1NTIHRyYW5zaXRpb24gcHJvcGVydGllcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIC0gQSBjYW1lcmEge0BsaW5rIENhbWVyYU1vZGVsLmRlZmF1bHRzLnRyYW5zaXRpb258dHJhbnNpdGlvbn0gb2JqZWN0LlxuICAgICogQHJldHVybnMge0VsZW1lbnR9IFRoZSBlbGVtZW50LlxuICAgICovXG4gICAgc2V0Q3NzVHJhbnNpdGlvbjogZnVuY3Rpb24gKGVsLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgbGV0IGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzID0ge1xuICAgICAgICAgICAgdHJhbnNpdGlvbkRlbGF5OiBwcm9wZXJ0aWVzLmRlbGF5IHx8ICcwcycsXG4gICAgICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IHByb3BlcnRpZXMuZHVyYXRpb24gfHwgJzBzJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogcHJvcGVydGllcy5wcm9wZXJ0eSB8fCAnYWxsJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogcHJvcGVydGllcy50aW1pbmdGdW5jdGlvbiB8fCAnZWFzZSdcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjc3NUcmFuc2l0aW9uUHJvcGVydGllcykge1xuICAgICAgICAgICAgZWwuc3R5bGVba2V5XSA9IGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogVGhyb3R0bGluZyB1c2luZyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuXG4gICAgKlxuICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gdGhyb3R0bGVkIHRvIHRoZSBuZXh0IEFuaW1hdGlvbiBGcmFtZS5cbiAgICAqL1xuICAgIHRocm90dGxlVG9GcmFtZTogZnVuY3Rpb24gKGZ1bmMpIHtcbiAgICAgICAgbGV0IF90aGlzLCBhcmdzO1xuICAgICAgICBsZXQgaXNQcm9jZXNzaW5nID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgICAgICAgIGlmICghaXNQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24odGltZXN0YW1wKSB7XG4gICAgICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoYXJncywgdGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pOyAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2UgdGhlIG9yaWdpbiBvZiB0aGUgZ2l2ZW4gaW5wdXQuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBbaW5wdXRdIC0gVGhlIG9yaWdpbiB0byBwYXJzZS5cbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gd29ybGQgLSBUaGUgd29ybGQuXG4gICAgKiBAcmV0dXJucyB7c3RyaW5nfE9iamVjdH0gVGhlIHBhcnNlZCBvcmlnaW4uXG4gICAgKi9cbiAgICBwYXJzZU9yaWdpbjogZnVuY3Rpb24gKGlucHV0LCB3b3JsZCkge1xuICAgICAgICB2YXIgb3JpZ2luID0gb3JpZ2luS2V5d29yZC5BVVRPO1xuICAgICAgICB2YXIgcG9zaXRpb24gPSBVdGlscy5wYXJzZVBvc2l0aW9uKGlucHV0LCB3b3JsZCk7XG4gICAgICAgIFxuICAgICAgICBpZiAocG9zaXRpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgIG9yaWdpbiA9IHBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gb3JpZ2luO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZSB0aGUgcG9zaXRpb24gb2YgdGhlIGdpdmVuIGlucHV0IHdpdGhpbiB0aGUgd29ybGQuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBbaW5wdXRdIC0gVGhlIGlucHV0IHRvIHBhcnNlLlxuICAgICogQHBhcmFtIHtFbGVtZW50fSB3b3JsZCAtIFRoZSB3b3JsZC5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBwYXJzZWQgcG9zaXRpb24gYXMgYW4geC95IHBvc2l0aW9uIG9iamVjdC5cbiAgICAqL1xuICAgIHBhcnNlUG9zaXRpb246IGZ1bmN0aW9uIChpbnB1dCwgd29ybGQpIHtcbiAgICAgICAgdmFyIG9iamVjdFBvc2l0aW9uO1xuICAgICAgICB2YXIgcG9zaXRpb24gPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpc0VsZW1lbnQoaW5wdXQpKSB7XG4gICAgICAgICAgICBvYmplY3RQb3NpdGlvbiA9IFV0aWxzLkRPTS5nZXRPYmplY3RXb3JsZFBvc2l0aW9uKGlucHV0LCB3b3JsZCk7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IG5ldyBWZWN0b3IyKG9iamVjdFBvc2l0aW9uLngsIG9iamVjdFBvc2l0aW9uLnkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzT2JqZWN0KGlucHV0KSkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgVmVjdG9yMihpbnB1dC54LCBpbnB1dC55KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH1cbn07XG5cblV0aWxzLkRPTSA9IHtcbiAgICAvKipcbiAgICAqIEdldCBhbiBvYmplY3QncyBwb3NpdGlvbiBpbiB0aGUgd29ybGQuXG4gICAgKlxuICAgICogQHBhcmFtIHtFbGVtZW50fSBvYmplY3QgLSBUaGUgb2JqZWN0LlxuICAgICogQHBhcmFtIHtFbGVtZW50fSB3b3JsZCAtIFRoZSB3b3JsZC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgb2JqZWN0J3MgcG9zaXRpb24uXG4gICAgKi9cbiAgICBnZXRPYmplY3RXb3JsZFBvc2l0aW9uOiBmdW5jdGlvbiAob2JqZWN0LCB3b3JsZCkge1xuICAgICAgICB2YXIgeCA9IChvYmplY3Qub2Zmc2V0V2lkdGggLyAyKSArIG9iamVjdC5vZmZzZXRMZWZ0IC0gd29ybGQub2Zmc2V0TGVmdDtcbiAgICAgICAgdmFyIHkgPSAob2JqZWN0Lm9mZnNldEhlaWdodCAvIDIpICsgb2JqZWN0Lm9mZnNldFRvcCAtIHdvcmxkLm9mZnNldFRvcDtcblxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoeCwgeSk7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAqIFBhcnNlIGEgdmlldyBwYXJhbWV0ZXIuXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gaW5wdXQgLSBUaGUgdmlldyBwYXJhbWV0ZXIuXG4gICAgKiBAcmV0dXJucyB7RWxlbWVudH0gVGhlIHZpZXcuXG4gICAgKi9cbiAgICBwYXJzZVZpZXc6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICB2YXIgb3V0cHV0ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0VsZW1lbnQoaW5wdXQpKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBpbnB1dDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG59O1xuXG5VdGlscy5UaW1lID0ge1xuICAgIC8qKlxuICAgICogR2V0cyBhIHRpbWUgZHVyYXRpb24gZ2l2ZW4gRlBTIGFuZCB0aGUgZGVzaXJlZCB1bml0LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGZwcyAtIFRoZSBmcmFtZXMgcGVyIHNlY29uZC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSB1bml0IC0gVGhlIHVuaXQgb2YgdGltZS5cbiAgICAqIEByZXR1cm4ge251bWJlcn0gLSBUaGUgZHVyYXRpb24uXG4gICAgKi9cbiAgICBnZXRGUFNEdXJhdGlvbjogKGZwcywgdW5pdCkgPT4ge1xuICAgICAgICB2YXIgZHVyYXRpb24gPSAwO1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh1bml0KSB7XG4gICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9ICgxMDAwIC8gZnBzKSAvIDEwMDA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdtcyc6XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPSAxMDAwIC8gZnBzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZHVyYXRpb247XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgVXRpbHM7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCB0aHJvdHRsZSBmcm9tICdsb2Rhc2gvdGhyb3R0bGUnO1xuaW1wb3J0IFV0aWxzICAgIGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uV2hlZWxDb250cm9sXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSB0YXJnZXQgLSBUaGUgdGFyZ2V0LlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMub25XaGVlbF0gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSB3aGVlbCBldmVudCBvY2N1cnMuXG4qIEBwYXJhbSB7YXJyYXl9IFtvcHRpb25zLm9uV2hlZWxQYXJhbXNdIC0gVGhlIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgY2FsbGJhY2suXG4qIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5vbldoZWVsU2NvcGVdIC0gV2hhdCAndGhpcycgcmVmZXJzIHRvIGluc2lkZSB0aGUgY2FsbGJhY2suXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteVdoZWVsQ29udHJvbCA9IG5ldyBPY3Vsby5XaGVlbENvbnRyb2woJyNjYW1lcmEnLCB7ICBcbiogICBvbldoZWVsOiBmdW5jdGlvbiAoKSB7IFxuKiAgICAgY29uc29sZS5sb2coJ3doZWVsaW5nJyk7IFxuKiAgIH1cbiogfSk7XG4qL1xuY2xhc3MgV2hlZWxDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvciAodGFyZ2V0LCB7XG4gICAgICAgIG9uV2hlZWwgPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgb25XaGVlbFBhcmFtcyA9IFtdLFxuICAgICAgICBvbldoZWVsU2NvcGUgPSB0aGlzXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBjb25maWd1cmF0aW9uLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHsgb25XaGVlbCwgb25XaGVlbFBhcmFtcywgb25XaGVlbFNjb3BlIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSB0YXJnZXQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gVXRpbHMuRE9NLnBhcnNlVmlldyh0YXJnZXQpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtXaGVlbEV2ZW50fSAtIFRoZSBsYXN0IHdoZWVsIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLndoZWVsRXZlbnQgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7V2hlZWxFdmVudH0gLSBUaGUgcHJldmlvdXMgd2hlZWwgZXZlbnQgdGhhdCBhZmZlY3RlZCB0aGUgaW5zdGFuY2UuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucHJldmlvdXNXaGVlbEV2ZW50ID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciBpdCBpcyBlbmFibGVkIG9yIG5vdC5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB0aHJvdHRsZWQgd2hlZWwgZXZlbnQgaGFuZGxlci5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl90aHJvdHRsZWRPbldoZWVsID0gdGhyb3R0bGUoZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzV2hlZWxFdmVudCA9IHRoaXMud2hlZWxFdmVudDtcbiAgICAgICAgICAgIHRoaXMud2hlZWxFdmVudCA9IGV2ZW50O1xuICAgICAgICAgICAgdGhpcy5jb25maWcub25XaGVlbC5hcHBseSh0aGlzLmNvbmZpZy5vbldoZWVsU2NvcGUsIHRoaXMuY29uZmlnLm9uV2hlZWxQYXJhbXMpO1xuICAgICAgICB9LCBVdGlscy5UaW1lLmdldEZQU0R1cmF0aW9uKDMwLCAnbXMnKSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHdoZWVsIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25XaGVlbCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5fdGhyb3R0bGVkT25XaGVlbChldmVudCk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVuYWJsZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqIEBkZWZhdWx0IHRydWVcbiAgICAqL1xuICAgIGdldCBlbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIGNvbnRyb2wgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSB7fTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgdGhlIGNvbnRyb2wuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGUgKCkge1xuICAgICAgICB0aGlzLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuX29uV2hlZWwpO1xuICAgICAgICB0aGlzLl9lbmFibGVkID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRW5hYmxlcyB0aGUgY29udHJvbC5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlICgpIHtcbiAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLl9vbldoZWVsKTtcbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBXaGVlbENvbnRyb2w7Il19

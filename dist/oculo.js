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

                        if (animation.totalProgress() > 0) {
                            animation.seek(0).invalidate();

                            if (animation.coreTweens[0]) {
                                this.camera.setRawPosition(animation.coreTweens[0].props.start.position);
                            }

                            animation.seek(time, false);
                        }

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
            //this.view.style.willChange = 'transform';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZiZW1pdHRlci9saWIvQmFzZUV2ZW50RW1pdHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0VtaXR0ZXJTdWJzY3JpcHRpb24uanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2xpYi9FdmVudFN1YnNjcmlwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZianMvbGliL2VtcHR5RnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvZmJqcy9saWIvaW52YXJpYW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fU3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYXJyYXlNYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlQ2xhbXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlR2V0VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZVRvU3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fY3JlYXRlUm91bmQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19mcmVlR2xvYmFsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UHJvdG90eXBlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UmF3VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fb2JqZWN0VG9TdHJpbmcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19vdmVyQXJnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fcm9vdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY2xhbXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNFbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0Zpbml0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNMZW5ndGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzTmlsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1BsYWluT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1N5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbm93LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9yb3VuZC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3RvRmluaXRlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b0ludGVnZXIuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3RvTnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmMvc2NyaXB0cy9BbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb25NYW5hZ2VyLmpzIiwic3JjL3NjcmlwdHMvY2FtZXJhLmpzIiwic3JjL3NjcmlwdHMvY29uc3RhbnRzLmpzIiwic3JjL3NjcmlwdHMvY3NzUmVuZGVyZXIuanMiLCJzcmMvc2NyaXB0cy9kcmFnQ29udHJvbC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0aC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0cml4Mi5qcyIsInNyYy9zY3JpcHRzL21hdGgvdmVjdG9yMi5qcyIsInNyYy9zY3JpcHRzL29jdWxvLmpzIiwic3JjL3NjcmlwdHMvc2NlbmUuanMiLCJzcmMvc2NyaXB0cy9zY2VuZU1hbmFnZXIuanMiLCJzcmMvc2NyaXB0cy90cmFja0NvbnRyb2wuanMiLCJzcmMvc2NyaXB0cy91dGlscy5qcyIsInNyYy9zY3JpcHRzL3doZWVsQ29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICovXG5cbnZhciBmYmVtaXR0ZXIgPSB7XG4gIEV2ZW50RW1pdHRlcjogcmVxdWlyZSgnLi9saWIvQmFzZUV2ZW50RW1pdHRlcicpLFxuICBFbWl0dGVyU3Vic2NyaXB0aW9uIDogcmVxdWlyZSgnLi9saWIvRW1pdHRlclN1YnNjcmlwdGlvbicpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZiZW1pdHRlcjtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgQmFzZUV2ZW50RW1pdHRlclxuICogQHR5cGVjaGVja3NcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgRW1pdHRlclN1YnNjcmlwdGlvbiA9IHJlcXVpcmUoJy4vRW1pdHRlclN1YnNjcmlwdGlvbicpO1xudmFyIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yID0gcmVxdWlyZSgnLi9FdmVudFN1YnNjcmlwdGlvblZlbmRvcicpO1xuXG52YXIgZW1wdHlGdW5jdGlvbiA9IHJlcXVpcmUoJ2ZianMvbGliL2VtcHR5RnVuY3Rpb24nKTtcbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcblxuLyoqXG4gKiBAY2xhc3MgQmFzZUV2ZW50RW1pdHRlclxuICogQGRlc2NyaXB0aW9uXG4gKiBBbiBFdmVudEVtaXR0ZXIgaXMgcmVzcG9uc2libGUgZm9yIG1hbmFnaW5nIGEgc2V0IG9mIGxpc3RlbmVycyBhbmQgcHVibGlzaGluZ1xuICogZXZlbnRzIHRvIHRoZW0gd2hlbiBpdCBpcyB0b2xkIHRoYXQgc3VjaCBldmVudHMgaGFwcGVuZWQuIEluIGFkZGl0aW9uIHRvIHRoZVxuICogZGF0YSBmb3IgdGhlIGdpdmVuIGV2ZW50IGl0IGFsc28gc2VuZHMgYSBldmVudCBjb250cm9sIG9iamVjdCB3aGljaCBhbGxvd3NcbiAqIHRoZSBsaXN0ZW5lcnMvaGFuZGxlcnMgdG8gcHJldmVudCB0aGUgZGVmYXVsdCBiZWhhdmlvciBvZiB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogVGhlIGVtaXR0ZXIgaXMgZGVzaWduZWQgdG8gYmUgZ2VuZXJpYyBlbm91Z2ggdG8gc3VwcG9ydCBhbGwgdGhlIGRpZmZlcmVudFxuICogY29udGV4dHMgaW4gd2hpY2ggb25lIG1pZ2h0IHdhbnQgdG8gZW1pdCBldmVudHMuIEl0IGlzIGEgc2ltcGxlIG11bHRpY2FzdFxuICogbWVjaGFuaXNtIG9uIHRvcCBvZiB3aGljaCBleHRyYSBmdW5jdGlvbmFsaXR5IGNhbiBiZSBjb21wb3NlZC4gRm9yIGV4YW1wbGUsIGFcbiAqIG1vcmUgYWR2YW5jZWQgZW1pdHRlciBtYXkgdXNlIGFuIEV2ZW50SG9sZGVyIGFuZCBFdmVudEZhY3RvcnkuXG4gKi9cblxudmFyIEJhc2VFdmVudEVtaXR0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuXG4gIGZ1bmN0aW9uIEJhc2VFdmVudEVtaXR0ZXIoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEJhc2VFdmVudEVtaXR0ZXIpO1xuXG4gICAgdGhpcy5fc3Vic2NyaWJlciA9IG5ldyBFdmVudFN1YnNjcmlwdGlvblZlbmRvcigpO1xuICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBsaXN0ZW5lciB0byBiZSBpbnZva2VkIHdoZW4gZXZlbnRzIG9mIHRoZSBzcGVjaWZpZWQgdHlwZSBhcmVcbiAgICogZW1pdHRlZC4gQW4gb3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG1heSBiZSBwcm92aWRlZC4gVGhlIGRhdGEgYXJndW1lbnRzXG4gICAqIGVtaXR0ZWQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUT0RPOiBBbm5vdGF0ZSB0aGUgbGlzdGVuZXIgYXJnJ3MgdHlwZS4gVGhpcyBpcyB0cmlja3kgYmVjYXVzZSBsaXN0ZW5lcnNcbiAgICogICAgICAgY2FuIGJlIGludm9rZWQgd2l0aCB2YXJhcmdzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIC0gTmFtZSBvZiB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gRnVuY3Rpb24gdG8gaW52b2tlIHdoZW4gdGhlIHNwZWNpZmllZCBldmVudCBpc1xuICAgKiAgIGVtaXR0ZWRcbiAgICogQHBhcmFtIHsqfSBjb250ZXh0IC0gT3B0aW9uYWwgY29udGV4dCBvYmplY3QgdG8gdXNlIHdoZW4gaW52b2tpbmcgdGhlXG4gICAqICAgbGlzdGVuZXJcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldmVudFR5cGUsIGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX3N1YnNjcmliZXIuYWRkU3Vic2NyaXB0aW9uKGV2ZW50VHlwZSwgbmV3IEVtaXR0ZXJTdWJzY3JpcHRpb24odGhpcy5fc3Vic2NyaWJlciwgbGlzdGVuZXIsIGNvbnRleHQpKTtcbiAgfTtcblxuICAvKipcbiAgICogU2ltaWxhciB0byBhZGRMaXN0ZW5lciwgZXhjZXB0IHRoYXQgdGhlIGxpc3RlbmVyIGlzIHJlbW92ZWQgYWZ0ZXIgaXQgaXNcbiAgICogaW52b2tlZCBvbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIC0gTmFtZSBvZiB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gRnVuY3Rpb24gdG8gaW52b2tlIG9ubHkgb25jZSB3aGVuIHRoZVxuICAgKiAgIHNwZWNpZmllZCBldmVudCBpcyBlbWl0dGVkXG4gICAqIEBwYXJhbSB7Kn0gY29udGV4dCAtIE9wdGlvbmFsIGNvbnRleHQgb2JqZWN0IHRvIHVzZSB3aGVuIGludm9raW5nIHRoZVxuICAgKiAgIGxpc3RlbmVyXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICB2YXIgZW1pdHRlciA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZlbnRUeXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICBlbWl0dGVyLnJlbW92ZUN1cnJlbnRMaXN0ZW5lcigpO1xuICAgICAgbGlzdGVuZXIuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgb2YgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzLCBpbmNsdWRpbmcgdGhvc2UgcmVnaXN0ZXJlZCBhc1xuICAgKiBsaXN0ZW5lciBtYXBzLlxuICAgKlxuICAgKiBAcGFyYW0gez9zdHJpbmd9IGV2ZW50VHlwZSAtIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHdob3NlIHJlZ2lzdGVyZWRcbiAgICogICBsaXN0ZW5lcnMgdG8gcmVtb3ZlXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudFR5cGUpIHtcbiAgICB0aGlzLl9zdWJzY3JpYmVyLnJlbW92ZUFsbFN1YnNjcmlwdGlvbnMoZXZlbnRUeXBlKTtcbiAgfTtcblxuICAvKipcbiAgICogUHJvdmlkZXMgYW4gQVBJIHRoYXQgY2FuIGJlIGNhbGxlZCBkdXJpbmcgYW4gZXZlbnRpbmcgY3ljbGUgdG8gcmVtb3ZlIHRoZVxuICAgKiBsYXN0IGxpc3RlbmVyIHRoYXQgd2FzIGludm9rZWQuIFRoaXMgYWxsb3dzIGEgZGV2ZWxvcGVyIHRvIHByb3ZpZGUgYW4gZXZlbnRcbiAgICogb2JqZWN0IHRoYXQgY2FuIHJlbW92ZSB0aGUgbGlzdGVuZXIgKG9yIGxpc3RlbmVyIG1hcCkgZHVyaW5nIHRoZVxuICAgKiBpbnZvY2F0aW9uLlxuICAgKlxuICAgKiBJZiBpdCBpcyBjYWxsZWQgd2hlbiBub3QgaW5zaWRlIG9mIGFuIGVtaXR0aW5nIGN5Y2xlIGl0IHdpbGwgdGhyb3cuXG4gICAqXG4gICAqIEB0aHJvd3Mge0Vycm9yfSBXaGVuIGNhbGxlZCBub3QgZHVyaW5nIGFuIGV2ZW50aW5nIGN5Y2xlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgdmFyIHN1YnNjcmlwdGlvbiA9IGVtaXR0ZXIuYWRkTGlzdGVuZXJNYXAoe1xuICAgKiAgICAgc29tZUV2ZW50OiBmdW5jdGlvbihkYXRhLCBldmVudCkge1xuICAgKiAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICogICAgICAgZW1pdHRlci5yZW1vdmVDdXJyZW50TGlzdGVuZXIoKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICpcbiAgICogICBlbWl0dGVyLmVtaXQoJ3NvbWVFdmVudCcsICdhYmMnKTsgLy8gbG9ncyAnYWJjJ1xuICAgKiAgIGVtaXR0ZXIuZW1pdCgnc29tZUV2ZW50JywgJ2RlZicpOyAvLyBkb2VzIG5vdCBsb2cgYW55dGhpbmdcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQ3VycmVudExpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlQ3VycmVudExpc3RlbmVyKCkge1xuICAgICEhIXRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnTm90IGluIGFuIGVtaXR0aW5nIGN5Y2xlOyB0aGVyZSBpcyBubyBjdXJyZW50IHN1YnNjcmlwdGlvbicpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zdWJzY3JpYmVyLnJlbW92ZVN1YnNjcmlwdGlvbih0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uKTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdGhhdCBhcmUgY3VycmVudGx5IHJlZ2lzdGVyZWQgZm9yIHRoZSBnaXZlblxuICAgKiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSAtIE5hbWUgb2YgdGhlIGV2ZW50IHRvIHF1ZXJ5XG4gICAqIEByZXR1cm4ge2FycmF5fVxuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnRUeXBlKSAvKiBUT0RPOiBBcnJheTxFdmVudFN1YnNjcmlwdGlvbj4gKi97XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB0aGlzLl9zdWJzY3JpYmVyLmdldFN1YnNjcmlwdGlvbnNGb3JUeXBlKGV2ZW50VHlwZSk7XG4gICAgcmV0dXJuIHN1YnNjcmlwdGlvbnMgPyBzdWJzY3JpcHRpb25zLmZpbHRlcihlbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVHJ1ZSkubWFwKGZ1bmN0aW9uIChzdWJzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybiBzdWJzY3JpcHRpb24ubGlzdGVuZXI7XG4gICAgfSkgOiBbXTtcbiAgfTtcblxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgb2YgdGhlIGdpdmVuIHR5cGUgd2l0aCB0aGUgZ2l2ZW4gZGF0YS4gQWxsIGhhbmRsZXJzIG9mIHRoYXRcbiAgICogcGFydGljdWxhciB0eXBlIHdpbGwgYmUgbm90aWZpZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgLSBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0XG4gICAqIEBwYXJhbSB7Kn0gQXJiaXRyYXJ5IGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCByZWdpc3RlcmVkIGxpc3RlbmVyXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgZW1pdHRlci5hZGRMaXN0ZW5lcignc29tZUV2ZW50JywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgKiAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAqICAgfSk7XG4gICAqXG4gICAqICAgZW1pdHRlci5lbWl0KCdzb21lRXZlbnQnLCAnYWJjJyk7IC8vIGxvZ3MgJ2FiYydcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnRUeXBlKSB7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB0aGlzLl9zdWJzY3JpYmVyLmdldFN1YnNjcmlwdGlvbnNGb3JUeXBlKGV2ZW50VHlwZSk7XG4gICAgaWYgKHN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3Vic2NyaXB0aW9ucyk7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwga2V5cy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaWldO1xuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gc3Vic2NyaXB0aW9uc1trZXldO1xuICAgICAgICAvLyBUaGUgc3Vic2NyaXB0aW9uIG1heSBoYXZlIGJlZW4gcmVtb3ZlZCBkdXJpbmcgdGhpcyBldmVudCBsb29wLlxuICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICB0aGlzLl9fZW1pdFRvU3Vic2NyaXB0aW9uLmFwcGx5KHRoaXMsIFtzdWJzY3JpcHRpb25dLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUHJvdmlkZXMgYSBob29rIHRvIG92ZXJyaWRlIGhvdyB0aGUgZW1pdHRlciBlbWl0cyBhbiBldmVudCB0byBhIHNwZWNpZmljXG4gICAqIHN1YnNjcmlwdGlvbi4gVGhpcyBhbGxvd3MgeW91IHRvIHNldCB1cCBsb2dnaW5nIGFuZCBlcnJvciBib3VuZGFyaWVzXG4gICAqIHNwZWNpZmljIHRvIHlvdXIgZW52aXJvbm1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7RW1pdHRlclN1YnNjcmlwdGlvbn0gc3Vic2NyaXB0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICogQHBhcmFtIHsqfSBBcmJpdHJhcnkgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIHJlZ2lzdGVyZWQgbGlzdGVuZXJcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuX19lbWl0VG9TdWJzY3JpcHRpb24gPSBmdW5jdGlvbiBfX2VtaXRUb1N1YnNjcmlwdGlvbihzdWJzY3JpcHRpb24sIGV2ZW50VHlwZSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICBzdWJzY3JpcHRpb24ubGlzdGVuZXIuYXBwbHkoc3Vic2NyaXB0aW9uLmNvbnRleHQsIGFyZ3MpO1xuICB9O1xuXG4gIHJldHVybiBCYXNlRXZlbnRFbWl0dGVyO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlRXZlbnRFbWl0dGVyOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqIFxuICogQHByb3ZpZGVzTW9kdWxlIEVtaXR0ZXJTdWJzY3JpcHRpb25cbiAqIEB0eXBlY2hlY2tzXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIEV2ZW50U3Vic2NyaXB0aW9uID0gcmVxdWlyZSgnLi9FdmVudFN1YnNjcmlwdGlvbicpO1xuXG4vKipcbiAqIEVtaXR0ZXJTdWJzY3JpcHRpb24gcmVwcmVzZW50cyBhIHN1YnNjcmlwdGlvbiB3aXRoIGxpc3RlbmVyIGFuZCBjb250ZXh0IGRhdGEuXG4gKi9cblxudmFyIEVtaXR0ZXJTdWJzY3JpcHRpb24gPSAoZnVuY3Rpb24gKF9FdmVudFN1YnNjcmlwdGlvbikge1xuICBfaW5oZXJpdHMoRW1pdHRlclN1YnNjcmlwdGlvbiwgX0V2ZW50U3Vic2NyaXB0aW9uKTtcblxuICAvKipcbiAgICogQHBhcmFtIHtFdmVudFN1YnNjcmlwdGlvblZlbmRvcn0gc3Vic2NyaWJlciAtIFRoZSBzdWJzY3JpYmVyIHRoYXQgY29udHJvbHNcbiAgICogICB0aGlzIHN1YnNjcmlwdGlvblxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lciAtIEZ1bmN0aW9uIHRvIGludm9rZSB3aGVuIHRoZSBzcGVjaWZpZWQgZXZlbnQgaXNcbiAgICogICBlbWl0dGVkXG4gICAqIEBwYXJhbSB7Kn0gY29udGV4dCAtIE9wdGlvbmFsIGNvbnRleHQgb2JqZWN0IHRvIHVzZSB3aGVuIGludm9raW5nIHRoZVxuICAgKiAgIGxpc3RlbmVyXG4gICAqL1xuXG4gIGZ1bmN0aW9uIEVtaXR0ZXJTdWJzY3JpcHRpb24oc3Vic2NyaWJlciwgbGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRW1pdHRlclN1YnNjcmlwdGlvbik7XG5cbiAgICBfRXZlbnRTdWJzY3JpcHRpb24uY2FsbCh0aGlzLCBzdWJzY3JpYmVyKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgfVxuXG4gIHJldHVybiBFbWl0dGVyU3Vic2NyaXB0aW9uO1xufSkoRXZlbnRTdWJzY3JpcHRpb24pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXJTdWJzY3JpcHRpb247IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBFdmVudFN1YnNjcmlwdGlvblxuICogQHR5cGVjaGVja3NcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRXZlbnRTdWJzY3JpcHRpb24gcmVwcmVzZW50cyBhIHN1YnNjcmlwdGlvbiB0byBhIHBhcnRpY3VsYXIgZXZlbnQuIEl0IGNhblxuICogcmVtb3ZlIGl0cyBvd24gc3Vic2NyaXB0aW9uLlxuICovXG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgRXZlbnRTdWJzY3JpcHRpb24gPSAoZnVuY3Rpb24gKCkge1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yfSBzdWJzY3JpYmVyIHRoZSBzdWJzY3JpYmVyIHRoYXQgY29udHJvbHNcbiAgICogICB0aGlzIHN1YnNjcmlwdGlvbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gRXZlbnRTdWJzY3JpcHRpb24oc3Vic2NyaWJlcikge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudFN1YnNjcmlwdGlvbik7XG5cbiAgICB0aGlzLnN1YnNjcmliZXIgPSBzdWJzY3JpYmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhpcyBzdWJzY3JpcHRpb24gZnJvbSB0aGUgc3Vic2NyaWJlciB0aGF0IGNvbnRyb2xzIGl0LlxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvbi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgIGlmICh0aGlzLnN1YnNjcmliZXIpIHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlci5yZW1vdmVTdWJzY3JpcHRpb24odGhpcyk7XG4gICAgICB0aGlzLnN1YnNjcmliZXIgPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gRXZlbnRTdWJzY3JpcHRpb247XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50U3Vic2NyaXB0aW9uOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqIFxuICogQHByb3ZpZGVzTW9kdWxlIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yXG4gKiBAdHlwZWNoZWNrc1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcblxuLyoqXG4gKiBFdmVudFN1YnNjcmlwdGlvblZlbmRvciBzdG9yZXMgYSBzZXQgb2YgRXZlbnRTdWJzY3JpcHRpb25zIHRoYXQgYXJlXG4gKiBzdWJzY3JpYmVkIHRvIGEgcGFydGljdWxhciBldmVudCB0eXBlLlxuICovXG5cbnZhciBFdmVudFN1YnNjcmlwdGlvblZlbmRvciA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudFN1YnNjcmlwdGlvblZlbmRvcik7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZSA9IHt9O1xuICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBzdWJzY3JpcHRpb24ga2V5ZWQgYnkgYW4gZXZlbnQgdHlwZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICAgKiBAcGFyYW0ge0V2ZW50U3Vic2NyaXB0aW9ufSBzdWJzY3JpcHRpb25cbiAgICovXG5cbiAgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IucHJvdG90eXBlLmFkZFN1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uIGFkZFN1YnNjcmlwdGlvbihldmVudFR5cGUsIHN1YnNjcmlwdGlvbikge1xuICAgICEoc3Vic2NyaXB0aW9uLnN1YnNjcmliZXIgPT09IHRoaXMpID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ1RoZSBzdWJzY3JpYmVyIG9mIHRoZSBzdWJzY3JpcHRpb24gaXMgaW5jb3JyZWN0bHkgc2V0LicpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoIXRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0pIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0gPSBbXTtcbiAgICB9XG4gICAgdmFyIGtleSA9IHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0ubGVuZ3RoO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0ucHVzaChzdWJzY3JpcHRpb24pO1xuICAgIHN1YnNjcmlwdGlvbi5ldmVudFR5cGUgPSBldmVudFR5cGU7XG4gICAgc3Vic2NyaXB0aW9uLmtleSA9IGtleTtcbiAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgYnVsayBzZXQgb2YgdGhlIHN1YnNjcmlwdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7P3N0cmluZ30gZXZlbnRUeXBlIC0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZSB3aG9zZVxuICAgKiAgIHJlZ2lzdGVyZWQgc3Vwc2NyaXB0aW9ucyB0byByZW1vdmUsIGlmIG51bGwgcmVtb3ZlIGFsbCBzdWJzY3JpcHRpb25zLlxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvblZlbmRvci5wcm90b3R5cGUucmVtb3ZlQWxsU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIHJlbW92ZUFsbFN1YnNjcmlwdGlvbnMoZXZlbnRUeXBlKSB7XG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZSA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBzcGVjaWZpYyBzdWJzY3JpcHRpb24uIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIGZ1bmN0aW9uLCBjYWxsXG4gICAqIGBzdWJzY3JpcHRpb24ucmVtb3ZlKClgIGRpcmVjdGx5LlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gc3Vic2NyaXB0aW9uXG4gICAqL1xuXG4gIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLnByb3RvdHlwZS5yZW1vdmVTdWJzY3JpcHRpb24gPSBmdW5jdGlvbiByZW1vdmVTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uKSB7XG4gICAgdmFyIGV2ZW50VHlwZSA9IHN1YnNjcmlwdGlvbi5ldmVudFR5cGU7XG4gICAgdmFyIGtleSA9IHN1YnNjcmlwdGlvbi5rZXk7XG5cbiAgICB2YXIgc3Vic2NyaXB0aW9uc0ZvclR5cGUgPSB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdO1xuICAgIGlmIChzdWJzY3JpcHRpb25zRm9yVHlwZSkge1xuICAgICAgZGVsZXRlIHN1YnNjcmlwdGlvbnNGb3JUeXBlW2tleV07XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBzdWJzY3JpcHRpb25zIHRoYXQgYXJlIGN1cnJlbnRseSByZWdpc3RlcmVkIGZvciB0aGVcbiAgICogZ2l2ZW4gZXZlbnQgdHlwZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyBhcnJheSBjYW4gYmUgcG90ZW50aWFsbHkgc3BhcnNlIGFzIHN1YnNjcmlwdGlvbnMgYXJlIGRlbGV0ZWRcbiAgICogZnJvbSBpdCB3aGVuIHRoZXkgYXJlIHJlbW92ZWQuXG4gICAqXG4gICAqIFRPRE86IFRoaXMgcmV0dXJucyBhIG51bGxhYmxlIGFycmF5LiB3YXQ/XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICogQHJldHVybiB7P2FycmF5fVxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvblZlbmRvci5wcm90b3R5cGUuZ2V0U3Vic2NyaXB0aW9uc0ZvclR5cGUgPSBmdW5jdGlvbiBnZXRTdWJzY3JpcHRpb25zRm9yVHlwZShldmVudFR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXTtcbiAgfTtcblxuICByZXR1cm4gRXZlbnRTdWJzY3JpcHRpb25WZW5kb3I7XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogXG4gKi9cblxuZnVuY3Rpb24gbWFrZUVtcHR5RnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFyZztcbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGFjY2VwdHMgYW5kIGRpc2NhcmRzIGlucHV0czsgaXQgaGFzIG5vIHNpZGUgZWZmZWN0cy4gVGhpcyBpc1xuICogcHJpbWFyaWx5IHVzZWZ1bCBpZGlvbWF0aWNhbGx5IGZvciBvdmVycmlkYWJsZSBmdW5jdGlvbiBlbmRwb2ludHMgd2hpY2hcbiAqIGFsd2F5cyBuZWVkIHRvIGJlIGNhbGxhYmxlLCBzaW5jZSBKUyBsYWNrcyBhIG51bGwtY2FsbCBpZGlvbSBhbGEgQ29jb2EuXG4gKi9cbnZhciBlbXB0eUZ1bmN0aW9uID0gZnVuY3Rpb24gZW1wdHlGdW5jdGlvbigpIHt9O1xuXG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zID0gbWFrZUVtcHR5RnVuY3Rpb247XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zRmFsc2UgPSBtYWtlRW1wdHlGdW5jdGlvbihmYWxzZSk7XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVHJ1ZSA9IG1ha2VFbXB0eUZ1bmN0aW9uKHRydWUpO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc051bGwgPSBtYWtlRW1wdHlGdW5jdGlvbihudWxsKTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNUaGlzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zQXJndW1lbnQgPSBmdW5jdGlvbiAoYXJnKSB7XG4gIHJldHVybiBhcmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVtcHR5RnVuY3Rpb247IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVXNlIGludmFyaWFudCgpIHRvIGFzc2VydCBzdGF0ZSB3aGljaCB5b3VyIHByb2dyYW0gYXNzdW1lcyB0byBiZSB0cnVlLlxuICpcbiAqIFByb3ZpZGUgc3ByaW50Zi1zdHlsZSBmb3JtYXQgKG9ubHkgJXMgaXMgc3VwcG9ydGVkKSBhbmQgYXJndW1lbnRzXG4gKiB0byBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgYnJva2UgYW5kIHdoYXQgeW91IHdlcmVcbiAqIGV4cGVjdGluZy5cbiAqXG4gKiBUaGUgaW52YXJpYW50IG1lc3NhZ2Ugd2lsbCBiZSBzdHJpcHBlZCBpbiBwcm9kdWN0aW9uLCBidXQgdGhlIGludmFyaWFudFxuICogd2lsbCByZW1haW4gdG8gZW5zdXJlIGxvZ2ljIGRvZXMgbm90IGRpZmZlciBpbiBwcm9kdWN0aW9uLlxuICovXG5cbmZ1bmN0aW9uIGludmFyaWFudChjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgKyAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107XG4gICAgICB9KSk7XG4gICAgICBlcnJvci5uYW1lID0gJ0ludmFyaWFudCBWaW9sYXRpb24nO1xuICAgIH1cblxuICAgIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBpbnZhcmlhbnQncyBvd24gZnJhbWVcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDsiLCJ2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ubWFwYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgaXRlcmF0ZWVcbiAqIHNob3J0aGFuZHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFthcnJheV0gVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBtYXBwZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGFycmF5TWFwKGFycmF5LCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5ID09IG51bGwgPyAwIDogYXJyYXkubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRlZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheU1hcDtcbiIsIi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY2xhbXBgIHdoaWNoIGRvZXNuJ3QgY29lcmNlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciBUaGUgbnVtYmVyIHRvIGNsYW1wLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsb3dlcl0gVGhlIGxvd2VyIGJvdW5kLlxuICogQHBhcmFtIHtudW1iZXJ9IHVwcGVyIFRoZSB1cHBlciBib3VuZC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNsYW1wZWQgbnVtYmVyLlxuICovXG5mdW5jdGlvbiBiYXNlQ2xhbXAobnVtYmVyLCBsb3dlciwgdXBwZXIpIHtcbiAgaWYgKG51bWJlciA9PT0gbnVtYmVyKSB7XG4gICAgaWYgKHVwcGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG51bWJlciA9IG51bWJlciA8PSB1cHBlciA/IG51bWJlciA6IHVwcGVyO1xuICAgIH1cbiAgICBpZiAobG93ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbnVtYmVyID0gbnVtYmVyID49IGxvd2VyID8gbnVtYmVyIDogbG93ZXI7XG4gICAgfVxuICB9XG4gIHJldHVybiBudW1iZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUNsYW1wO1xuIiwidmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpLFxuICAgIGdldFJhd1RhZyA9IHJlcXVpcmUoJy4vX2dldFJhd1RhZycpLFxuICAgIG9iamVjdFRvU3RyaW5nID0gcmVxdWlyZSgnLi9fb2JqZWN0VG9TdHJpbmcnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIG51bGxUYWcgPSAnW29iamVjdCBOdWxsXScsXG4gICAgdW5kZWZpbmVkVGFnID0gJ1tvYmplY3QgVW5kZWZpbmVkXSc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBnZXRUYWdgIHdpdGhvdXQgZmFsbGJhY2tzIGZvciBidWdneSBlbnZpcm9ubWVudHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgYHRvU3RyaW5nVGFnYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUdldFRhZyh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkVGFnIDogbnVsbFRhZztcbiAgfVxuICB2YWx1ZSA9IE9iamVjdCh2YWx1ZSk7XG4gIHJldHVybiAoc3ltVG9TdHJpbmdUYWcgJiYgc3ltVG9TdHJpbmdUYWcgaW4gdmFsdWUpXG4gICAgPyBnZXRSYXdUYWcodmFsdWUpXG4gICAgOiBvYmplY3RUb1N0cmluZyh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUdldFRhZztcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKSxcbiAgICBhcnJheU1hcCA9IHJlcXVpcmUoJy4vX2FycmF5TWFwJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4vaXNBcnJheScpLFxuICAgIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBJTkZJTklUWSA9IDEgLyAwO1xuXG4vKiogVXNlZCB0byBjb252ZXJ0IHN5bWJvbHMgdG8gcHJpbWl0aXZlcyBhbmQgc3RyaW5ncy4gKi9cbnZhciBzeW1ib2xQcm90byA9IFN5bWJvbCA/IFN5bWJvbC5wcm90b3R5cGUgOiB1bmRlZmluZWQsXG4gICAgc3ltYm9sVG9TdHJpbmcgPSBzeW1ib2xQcm90byA/IHN5bWJvbFByb3RvLnRvU3RyaW5nIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnRvU3RyaW5nYCB3aGljaCBkb2Vzbid0IGNvbnZlcnQgbnVsbGlzaFxuICogdmFsdWVzIHRvIGVtcHR5IHN0cmluZ3MuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUb1N0cmluZyh2YWx1ZSkge1xuICAvLyBFeGl0IGVhcmx5IGZvciBzdHJpbmdzIHRvIGF2b2lkIGEgcGVyZm9ybWFuY2UgaGl0IGluIHNvbWUgZW52aXJvbm1lbnRzLlxuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbnZlcnQgdmFsdWVzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgcmV0dXJuIGFycmF5TWFwKHZhbHVlLCBiYXNlVG9TdHJpbmcpICsgJyc7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBzeW1ib2xUb1N0cmluZyA/IHN5bWJvbFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VUb1N0cmluZztcbiIsInZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuL3RvSW50ZWdlcicpLFxuICAgIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpLFxuICAgIHRvU3RyaW5nID0gcmVxdWlyZSgnLi90b1N0cmluZycpO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWluID0gTWF0aC5taW47XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGxpa2UgYF8ucm91bmRgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kTmFtZSBUaGUgbmFtZSBvZiB0aGUgYE1hdGhgIG1ldGhvZCB0byB1c2Ugd2hlbiByb3VuZGluZy5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHJvdW5kIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVSb3VuZChtZXRob2ROYW1lKSB7XG4gIHZhciBmdW5jID0gTWF0aFttZXRob2ROYW1lXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKG51bWJlciwgcHJlY2lzaW9uKSB7XG4gICAgbnVtYmVyID0gdG9OdW1iZXIobnVtYmVyKTtcbiAgICBwcmVjaXNpb24gPSBuYXRpdmVNaW4odG9JbnRlZ2VyKHByZWNpc2lvbiksIDI5Mik7XG4gICAgaWYgKHByZWNpc2lvbikge1xuICAgICAgLy8gU2hpZnQgd2l0aCBleHBvbmVudGlhbCBub3RhdGlvbiB0byBhdm9pZCBmbG9hdGluZy1wb2ludCBpc3N1ZXMuXG4gICAgICAvLyBTZWUgW01ETl0oaHR0cHM6Ly9tZG4uaW8vcm91bmQjRXhhbXBsZXMpIGZvciBtb3JlIGRldGFpbHMuXG4gICAgICB2YXIgcGFpciA9ICh0b1N0cmluZyhudW1iZXIpICsgJ2UnKS5zcGxpdCgnZScpLFxuICAgICAgICAgIHZhbHVlID0gZnVuYyhwYWlyWzBdICsgJ2UnICsgKCtwYWlyWzFdICsgcHJlY2lzaW9uKSk7XG5cbiAgICAgIHBhaXIgPSAodG9TdHJpbmcodmFsdWUpICsgJ2UnKS5zcGxpdCgnZScpO1xuICAgICAgcmV0dXJuICsocGFpclswXSArICdlJyArICgrcGFpclsxXSAtIHByZWNpc2lvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuYyhudW1iZXIpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVJvdW5kO1xuIiwiLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmcmVlR2xvYmFsO1xuIiwidmFyIG92ZXJBcmcgPSByZXF1aXJlKCcuL19vdmVyQXJnJyk7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIGdldFByb3RvdHlwZSA9IG92ZXJBcmcoT2JqZWN0LmdldFByb3RvdHlwZU9mLCBPYmplY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFByb3RvdHlwZTtcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKTtcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUdldFRhZ2Agd2hpY2ggaWdub3JlcyBgU3ltYm9sLnRvU3RyaW5nVGFnYCB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgcmF3IGB0b1N0cmluZ1RhZ2AuXG4gKi9cbmZ1bmN0aW9uIGdldFJhd1RhZyh2YWx1ZSkge1xuICB2YXIgaXNPd24gPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBzeW1Ub1N0cmluZ1RhZyksXG4gICAgICB0YWcgPSB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ107XG5cbiAgdHJ5IHtcbiAgICB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ10gPSB1bmRlZmluZWQ7XG4gICAgdmFyIHVubWFza2VkID0gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge31cblxuICB2YXIgcmVzdWx0ID0gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIGlmICh1bm1hc2tlZCkge1xuICAgIGlmIChpc093bikge1xuICAgICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdGFnO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdmFsdWVbc3ltVG9TdHJpbmdUYWddO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFJhd1RhZztcbiIsIi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBuYXRpdmVPYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgdXNpbmcgYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY29udmVydGVkIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIG5hdGl2ZU9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFRvU3RyaW5nO1xuIiwiLyoqXG4gKiBDcmVhdGVzIGEgdW5hcnkgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGBmdW5jYCB3aXRoIGl0cyBhcmd1bWVudCB0cmFuc2Zvcm1lZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gd3JhcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRyYW5zZm9ybSBUaGUgYXJndW1lbnQgdHJhbnNmb3JtLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIG92ZXJBcmcoZnVuYywgdHJhbnNmb3JtKSB7XG4gIHJldHVybiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gZnVuYyh0cmFuc2Zvcm0oYXJnKSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb3ZlckFyZztcbiIsInZhciBmcmVlR2xvYmFsID0gcmVxdWlyZSgnLi9fZnJlZUdsb2JhbCcpO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHNlbGZgLiAqL1xudmFyIGZyZWVTZWxmID0gdHlwZW9mIHNlbGYgPT0gJ29iamVjdCcgJiYgc2VsZiAmJiBzZWxmLk9iamVjdCA9PT0gT2JqZWN0ICYmIHNlbGY7XG5cbi8qKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0LiAqL1xudmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8IGZyZWVTZWxmIHx8IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gcm9vdDtcbiIsInZhciBiYXNlQ2xhbXAgPSByZXF1aXJlKCcuL19iYXNlQ2xhbXAnKSxcbiAgICB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKTtcblxuLyoqXG4gKiBDbGFtcHMgYG51bWJlcmAgd2l0aGluIHRoZSBpbmNsdXNpdmUgYGxvd2VyYCBhbmQgYHVwcGVyYCBib3VuZHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IE51bWJlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciBUaGUgbnVtYmVyIHRvIGNsYW1wLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsb3dlcl0gVGhlIGxvd2VyIGJvdW5kLlxuICogQHBhcmFtIHtudW1iZXJ9IHVwcGVyIFRoZSB1cHBlciBib3VuZC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNsYW1wZWQgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmNsYW1wKC0xMCwgLTUsIDUpO1xuICogLy8gPT4gLTVcbiAqXG4gKiBfLmNsYW1wKDEwLCAtNSwgNSk7XG4gKiAvLyA9PiA1XG4gKi9cbmZ1bmN0aW9uIGNsYW1wKG51bWJlciwgbG93ZXIsIHVwcGVyKSB7XG4gIGlmICh1cHBlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdXBwZXIgPSBsb3dlcjtcbiAgICBsb3dlciA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAodXBwZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIHVwcGVyID0gdG9OdW1iZXIodXBwZXIpO1xuICAgIHVwcGVyID0gdXBwZXIgPT09IHVwcGVyID8gdXBwZXIgOiAwO1xuICB9XG4gIGlmIChsb3dlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbG93ZXIgPSB0b051bWJlcihsb3dlcik7XG4gICAgbG93ZXIgPSBsb3dlciA9PT0gbG93ZXIgPyBsb3dlciA6IDA7XG4gIH1cbiAgcmV0dXJuIGJhc2VDbGFtcCh0b051bWJlcihudW1iZXIpLCBsb3dlciwgdXBwZXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYW1wO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJy4vbm93JyksXG4gICAgdG9OdW1iZXIgPSByZXF1aXJlKCcuL3RvTnVtYmVyJyk7XG5cbi8qKiBFcnJvciBtZXNzYWdlIGNvbnN0YW50cy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heCxcbiAgICBuYXRpdmVNaW4gPSBNYXRoLm1pbjtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZGVib3VuY2VkIGZ1bmN0aW9uIHRoYXQgZGVsYXlzIGludm9raW5nIGBmdW5jYCB1bnRpbCBhZnRlciBgd2FpdGBcbiAqIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHdhc1xuICogaW52b2tlZC4gVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGAgbWV0aG9kIHRvIGNhbmNlbFxuICogZGVsYXllZCBgZnVuY2AgaW52b2NhdGlvbnMgYW5kIGEgYGZsdXNoYCBtZXRob2QgdG8gaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uXG4gKiBQcm92aWRlIGBvcHRpb25zYCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGVcbiAqIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWRcbiAqIHdpdGggdGhlIGxhc3QgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnRcbiAqIGNhbGxzIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgXG4gKiBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXNcbiAqIGludm9rZWQgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uXG4gKiBpcyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogSWYgYHdhaXRgIGlzIGAwYCBhbmQgYGxlYWRpbmdgIGlzIGBmYWxzZWAsIGBmdW5jYCBpbnZvY2F0aW9uIGlzIGRlZmVycmVkXG4gKiB1bnRpbCB0byB0aGUgbmV4dCB0aWNrLCBzaW1pbGFyIHRvIGBzZXRUaW1lb3V0YCB3aXRoIGEgdGltZW91dCBvZiBgMGAuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZGVib3VuY2luZy10aHJvdHRsaW5nLWV4cGxhaW5lZC1leGFtcGxlcy8pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2FpdF1cbiAqICBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4LlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcbiAqXG4gKiAvLyBJbnZva2UgYHNlbmRNYWlsYCB3aGVuIGNsaWNrZWQsIGRlYm91bmNpbmcgc3Vic2VxdWVudCBjYWxscy5cbiAqIGpRdWVyeShlbGVtZW50KS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICpcbiAqIC8vIEVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHMuXG4gKiB2YXIgZGVib3VuY2VkID0gXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7ICdtYXhXYWl0JzogMTAwMCB9KTtcbiAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAqIGpRdWVyeShzb3VyY2UpLm9uKCdtZXNzYWdlJywgZGVib3VuY2VkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIGRlYm91bmNlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgZGVib3VuY2VkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxhc3RBcmdzLFxuICAgICAgbGFzdFRoaXMsXG4gICAgICBtYXhXYWl0LFxuICAgICAgcmVzdWx0LFxuICAgICAgdGltZXJJZCxcbiAgICAgIGxhc3RDYWxsVGltZSxcbiAgICAgIGxhc3RJbnZva2VUaW1lID0gMCxcbiAgICAgIGxlYWRpbmcgPSBmYWxzZSxcbiAgICAgIG1heGluZyA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHdhaXQgPSB0b051bWJlcih3YWl0KSB8fCAwO1xuICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XG4gICAgbWF4aW5nID0gJ21heFdhaXQnIGluIG9wdGlvbnM7XG4gICAgbWF4V2FpdCA9IG1heGluZyA/IG5hdGl2ZU1heCh0b051bWJlcihvcHRpb25zLm1heFdhaXQpIHx8IDAsIHdhaXQpIDogbWF4V2FpdDtcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gaW52b2tlRnVuYyh0aW1lKSB7XG4gICAgdmFyIGFyZ3MgPSBsYXN0QXJncyxcbiAgICAgICAgdGhpc0FyZyA9IGxhc3RUaGlzO1xuXG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gbGVhZGluZ0VkZ2UodGltZSkge1xuICAgIC8vIFJlc2V0IGFueSBgbWF4V2FpdGAgdGltZXIuXG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIC8vIFN0YXJ0IHRoZSB0aW1lciBmb3IgdGhlIHRyYWlsaW5nIGVkZ2UuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAvLyBJbnZva2UgdGhlIGxlYWRpbmcgZWRnZS5cbiAgICByZXR1cm4gbGVhZGluZyA/IGludm9rZUZ1bmModGltZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiByZW1haW5pbmdXYWl0KHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lLFxuICAgICAgICByZXN1bHQgPSB3YWl0IC0gdGltZVNpbmNlTGFzdENhbGw7XG5cbiAgICByZXR1cm4gbWF4aW5nID8gbmF0aXZlTWluKHJlc3VsdCwgbWF4V2FpdCAtIHRpbWVTaW5jZUxhc3RJbnZva2UpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkSW52b2tlKHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lO1xuXG4gICAgLy8gRWl0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGNhbGwsIGFjdGl2aXR5IGhhcyBzdG9wcGVkIGFuZCB3ZSdyZSBhdCB0aGVcbiAgICAvLyB0cmFpbGluZyBlZGdlLCB0aGUgc3lzdGVtIHRpbWUgaGFzIGdvbmUgYmFja3dhcmRzIGFuZCB3ZSdyZSB0cmVhdGluZ1xuICAgIC8vIGl0IGFzIHRoZSB0cmFpbGluZyBlZGdlLCBvciB3ZSd2ZSBoaXQgdGhlIGBtYXhXYWl0YCBsaW1pdC5cbiAgICByZXR1cm4gKGxhc3RDYWxsVGltZSA9PT0gdW5kZWZpbmVkIHx8ICh0aW1lU2luY2VMYXN0Q2FsbCA+PSB3YWl0KSB8fFxuICAgICAgKHRpbWVTaW5jZUxhc3RDYWxsIDwgMCkgfHwgKG1heGluZyAmJiB0aW1lU2luY2VMYXN0SW52b2tlID49IG1heFdhaXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRXhwaXJlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpO1xuICAgIGlmIChzaG91bGRJbnZva2UodGltZSkpIHtcbiAgICAgIHJldHVybiB0cmFpbGluZ0VkZ2UodGltZSk7XG4gICAgfVxuICAgIC8vIFJlc3RhcnQgdGhlIHRpbWVyLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgcmVtYWluaW5nV2FpdCh0aW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFpbGluZ0VkZ2UodGltZSkge1xuICAgIHRpbWVySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBPbmx5IGludm9rZSBpZiB3ZSBoYXZlIGBsYXN0QXJnc2Agd2hpY2ggbWVhbnMgYGZ1bmNgIGhhcyBiZWVuXG4gICAgLy8gZGVib3VuY2VkIGF0IGxlYXN0IG9uY2UuXG4gICAgaWYgKHRyYWlsaW5nICYmIGxhc3RBcmdzKSB7XG4gICAgICByZXR1cm4gaW52b2tlRnVuYyh0aW1lKTtcbiAgICB9XG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgIGlmICh0aW1lcklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkKTtcbiAgICB9XG4gICAgbGFzdEludm9rZVRpbWUgPSAwO1xuICAgIGxhc3RBcmdzID0gbGFzdENhbGxUaW1lID0gbGFzdFRoaXMgPSB0aW1lcklkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgcmV0dXJuIHRpbWVySWQgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IHRyYWlsaW5nRWRnZShub3coKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKSxcbiAgICAgICAgaXNJbnZva2luZyA9IHNob3VsZEludm9rZSh0aW1lKTtcblxuICAgIGxhc3RBcmdzID0gYXJndW1lbnRzO1xuICAgIGxhc3RUaGlzID0gdGhpcztcbiAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKGlzSW52b2tpbmcpIHtcbiAgICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGxlYWRpbmdFZGdlKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgICBpZiAobWF4aW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSBpbnZvY2F0aW9ucyBpbiBhIHRpZ2h0IGxvb3AuXG4gICAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgICAgIHJldHVybiBpbnZva2VGdW5jKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgZGVib3VuY2VkLmZsdXNoID0gZmx1c2g7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXksIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5KGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5O1xuIiwidmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuL2lzRnVuY3Rpb24nKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLiBBIHZhbHVlIGlzIGNvbnNpZGVyZWQgYXJyYXktbGlrZSBpZiBpdCdzXG4gKiBub3QgYSBmdW5jdGlvbiBhbmQgaGFzIGEgYHZhbHVlLmxlbmd0aGAgdGhhdCdzIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIG9yXG4gKiBlcXVhbCB0byBgMGAgYW5kIGxlc3MgdGhhbiBvciBlcXVhbCB0byBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZSgnYWJjJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiAhaXNGdW5jdGlvbih2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheUxpa2U7XG4iLCJ2YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKSxcbiAgICBpc1BsYWluT2JqZWN0ID0gcmVxdWlyZSgnLi9pc1BsYWluT2JqZWN0Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGEgRE9NIGVsZW1lbnQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBET00gZWxlbWVudCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRWxlbWVudChkb2N1bWVudC5ib2R5KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRWxlbWVudCgnPGJvZHk+Jyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0VsZW1lbnQodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgdmFsdWUubm9kZVR5cGUgPT09IDEgJiYgIWlzUGxhaW5PYmplY3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRWxlbWVudDtcbiIsInZhciByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlSXNGaW5pdGUgPSByb290LmlzRmluaXRlO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgZmluaXRlIHByaW1pdGl2ZSBudW1iZXIuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGlzIGJhc2VkIG9uXG4gKiBbYE51bWJlci5pc0Zpbml0ZWBdKGh0dHBzOi8vbWRuLmlvL051bWJlci9pc0Zpbml0ZSkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBmaW5pdGUgbnVtYmVyLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGaW5pdGUoMyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Zpbml0ZShOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRmluaXRlKEluZmluaXR5KTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0Zpbml0ZSgnMycpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGaW5pdGUodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiBuYXRpdmVJc0Zpbml0ZSh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGaW5pdGU7XG4iLCJ2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFzeW5jVGFnID0gJ1tvYmplY3QgQXN5bmNGdW5jdGlvbl0nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXScsXG4gICAgcHJveHlUYWcgPSAnW29iamVjdCBQcm94eV0nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDkgd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXlzIGFuZCBvdGhlciBjb25zdHJ1Y3RvcnMuXG4gIHZhciB0YWcgPSBiYXNlR2V0VGFnKHZhbHVlKTtcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWcgfHwgdGFnID09IGFzeW5jVGFnIHx8IHRhZyA9PSBwcm94eVRhZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uO1xuIiwiLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgbG9vc2VseSBiYXNlZCBvblxuICogW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXRvbGVuZ3RoKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTGVuZ3RoKDMpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNMZW5ndGgoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoSW5maW5pdHkpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzTGVuZ3RoKCczJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmXG4gICAgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTGVuZ3RoO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgbnVsbGlzaCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTmlsKG51bGwpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNOaWwodm9pZCAwKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzTmlsKE5hTik7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc05pbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc05pbDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlXG4gKiBbbGFuZ3VhZ2UgdHlwZV0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMpXG4gKiBvZiBgT2JqZWN0YC4gKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3RMaWtlO1xuIiwidmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgZ2V0UHJvdG90eXBlID0gcmVxdWlyZSgnLi9fZ2V0UHJvdG90eXBlJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgZnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlLFxuICAgIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgZGVjb21waWxlZCBzb3VyY2Ugb2YgZnVuY3Rpb25zLiAqL1xudmFyIGZ1bmNUb1N0cmluZyA9IGZ1bmNQcm90by50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqIFVzZWQgdG8gaW5mZXIgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yLiAqL1xudmFyIG9iamVjdEN0b3JTdHJpbmcgPSBmdW5jVG9TdHJpbmcuY2FsbChPYmplY3QpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCB0aGF0IGlzLCBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGVcbiAqIGBPYmplY3RgIGNvbnN0cnVjdG9yIG9yIG9uZSB3aXRoIGEgYFtbUHJvdG90eXBlXV1gIG9mIGBudWxsYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuOC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiB9XG4gKlxuICogXy5pc1BsYWluT2JqZWN0KG5ldyBGb28pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KHsgJ3gnOiAwLCAneSc6IDAgfSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KE9iamVjdC5jcmVhdGUobnVsbCkpO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIGlmICghaXNPYmplY3RMaWtlKHZhbHVlKSB8fCBiYXNlR2V0VGFnKHZhbHVlKSAhPSBvYmplY3RUYWcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHByb3RvID0gZ2V0UHJvdG90eXBlKHZhbHVlKTtcbiAgaWYgKHByb3RvID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdmFyIEN0b3IgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKHByb3RvLCAnY29uc3RydWN0b3InKSAmJiBwcm90by5jb25zdHJ1Y3RvcjtcbiAgcmV0dXJuIHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3RvciBpbnN0YW5jZW9mIEN0b3IgJiZcbiAgICBmdW5jVG9TdHJpbmcuY2FsbChDdG9yKSA9PSBvYmplY3RDdG9yU3RyaW5nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzUGxhaW5PYmplY3Q7XG4iLCJ2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgc3ltYm9sVGFnID0gJ1tvYmplY3QgU3ltYm9sXSc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBzeW1ib2wsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1N5bWJvbChTeW1ib2wuaXRlcmF0b3IpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNTeW1ib2woJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNTeW1ib2wodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3ltYm9sJyB8fFxuICAgIChpc09iamVjdExpa2UodmFsdWUpICYmIGJhc2VHZXRUYWcodmFsdWUpID09IHN5bWJvbFRhZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNTeW1ib2w7XG4iLCJ2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSB0aW1lc3RhbXAgb2YgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdGhhdCBoYXZlIGVsYXBzZWQgc2luY2VcbiAqIHRoZSBVbml4IGVwb2NoICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMi40LjBcbiAqIEBjYXRlZ29yeSBEYXRlXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSB0aW1lc3RhbXAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZGVmZXIoZnVuY3Rpb24oc3RhbXApIHtcbiAqICAgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTtcbiAqIH0sIF8ubm93KCkpO1xuICogLy8gPT4gTG9ncyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpdCB0b29rIGZvciB0aGUgZGVmZXJyZWQgaW52b2NhdGlvbi5cbiAqL1xudmFyIG5vdyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gcm9vdC5EYXRlLm5vdygpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBub3c7XG4iLCJ2YXIgY3JlYXRlUm91bmQgPSByZXF1aXJlKCcuL19jcmVhdGVSb3VuZCcpO1xuXG4vKipcbiAqIENvbXB1dGVzIGBudW1iZXJgIHJvdW5kZWQgdG8gYHByZWNpc2lvbmAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAzLjEwLjBcbiAqIEBjYXRlZ29yeSBNYXRoXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIFRoZSBudW1iZXIgdG8gcm91bmQuXG4gKiBAcGFyYW0ge251bWJlcn0gW3ByZWNpc2lvbj0wXSBUaGUgcHJlY2lzaW9uIHRvIHJvdW5kIHRvLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgcm91bmRlZCBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ucm91bmQoNC4wMDYpO1xuICogLy8gPT4gNFxuICpcbiAqIF8ucm91bmQoNC4wMDYsIDIpO1xuICogLy8gPT4gNC4wMVxuICpcbiAqIF8ucm91bmQoNDA2MCwgLTIpO1xuICogLy8gPT4gNDEwMFxuICovXG52YXIgcm91bmQgPSBjcmVhdGVSb3VuZCgncm91bmQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSByb3VuZDtcbiIsInZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIEVycm9yIG1lc3NhZ2UgY29uc3RhbnRzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgdGhyb3R0bGVkIGZ1bmN0aW9uIHRoYXQgb25seSBpbnZva2VzIGBmdW5jYCBhdCBtb3N0IG9uY2UgcGVyXG4gKiBldmVyeSBgd2FpdGAgbWlsbGlzZWNvbmRzLiBUaGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYFxuICogbWV0aG9kIHRvIGNhbmNlbCBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0b1xuICogaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uIFByb3ZpZGUgYG9wdGlvbnNgIHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgXG4gKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgXG4gKiB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWQgd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlXG4gKiB0aHJvdHRsZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIHRocm90dGxlZCBmdW5jdGlvbiByZXR1cm4gdGhlXG4gKiByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpc1xuICogaW52b2tlZCBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb25cbiAqIGlzIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBJZiBgd2FpdGAgaXMgYDBgIGFuZCBgbGVhZGluZ2AgaXMgYGZhbHNlYCwgYGZ1bmNgIGludm9jYXRpb24gaXMgZGVmZXJyZWRcbiAqIHVudGlsIHRvIHRoZSBuZXh0IHRpY2ssIHNpbWlsYXIgdG8gYHNldFRpbWVvdXRgIHdpdGggYSB0aW1lb3V0IG9mIGAwYC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8udGhyb3R0bGVgIGFuZCBgXy5kZWJvdW5jZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB0aHJvdHRsZSBpbnZvY2F0aW9ucyB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGV4Y2Vzc2l2ZWx5IHVwZGF0aW5nIHRoZSBwb3NpdGlvbiB3aGlsZSBzY3JvbGxpbmcuXG4gKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKSk7XG4gKlxuICogLy8gSW52b2tlIGByZW5ld1Rva2VuYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgYnV0IG5vdCBtb3JlIHRoYW4gb25jZSBldmVyeSA1IG1pbnV0ZXMuXG4gKiB2YXIgdGhyb3R0bGVkID0gXy50aHJvdHRsZShyZW5ld1Rva2VuLCAzMDAwMDAsIHsgJ3RyYWlsaW5nJzogZmFsc2UgfSk7XG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgdGhyb3R0bGVkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIHRocm90dGxlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgdGhyb3R0bGVkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxlYWRpbmcgPSB0cnVlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy5sZWFkaW5nIDogbGVhZGluZztcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG4gIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCB7XG4gICAgJ2xlYWRpbmcnOiBsZWFkaW5nLFxuICAgICdtYXhXYWl0Jzogd2FpdCxcbiAgICAndHJhaWxpbmcnOiB0cmFpbGluZ1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aHJvdHRsZTtcbiIsInZhciB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgSU5GSU5JVFkgPSAxIC8gMCxcbiAgICBNQVhfSU5URUdFUiA9IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4O1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBmaW5pdGUgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4xMi4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9GaW5pdGUoMy4yKTtcbiAqIC8vID0+IDMuMlxuICpcbiAqIF8udG9GaW5pdGUoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvRmluaXRlKEluZmluaXR5KTtcbiAqIC8vID0+IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4XG4gKlxuICogXy50b0Zpbml0ZSgnMy4yJyk7XG4gKiAvLyA9PiAzLjJcbiAqL1xuZnVuY3Rpb24gdG9GaW5pdGUodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogMDtcbiAgfVxuICB2YWx1ZSA9IHRvTnVtYmVyKHZhbHVlKTtcbiAgaWYgKHZhbHVlID09PSBJTkZJTklUWSB8fCB2YWx1ZSA9PT0gLUlORklOSVRZKSB7XG4gICAgdmFyIHNpZ24gPSAodmFsdWUgPCAwID8gLTEgOiAxKTtcbiAgICByZXR1cm4gc2lnbiAqIE1BWF9JTlRFR0VSO1xuICB9XG4gIHJldHVybiB2YWx1ZSA9PT0gdmFsdWUgPyB2YWx1ZSA6IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9GaW5pdGU7XG4iLCJ2YXIgdG9GaW5pdGUgPSByZXF1aXJlKCcuL3RvRmluaXRlJyk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhbiBpbnRlZ2VyLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBsb29zZWx5IGJhc2VkIG9uXG4gKiBbYFRvSW50ZWdlcmBdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy10b2ludGVnZXIpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgY29udmVydGVkIGludGVnZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9JbnRlZ2VyKDMuMik7XG4gKiAvLyA9PiAzXG4gKlxuICogXy50b0ludGVnZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiAwXG4gKlxuICogXy50b0ludGVnZXIoSW5maW5pdHkpO1xuICogLy8gPT4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDhcbiAqXG4gKiBfLnRvSW50ZWdlcignMy4yJyk7XG4gKiAvLyA9PiAzXG4gKi9cbmZ1bmN0aW9uIHRvSW50ZWdlcih2YWx1ZSkge1xuICB2YXIgcmVzdWx0ID0gdG9GaW5pdGUodmFsdWUpLFxuICAgICAgcmVtYWluZGVyID0gcmVzdWx0ICUgMTtcblxuICByZXR1cm4gcmVzdWx0ID09PSByZXN1bHQgPyAocmVtYWluZGVyID8gcmVzdWx0IC0gcmVtYWluZGVyIDogcmVzdWx0KSA6IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9JbnRlZ2VyO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBOQU4gPSAwIC8gMDtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZS4gKi9cbnZhciByZVRyaW0gPSAvXlxccyt8XFxzKyQvZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJhZCBzaWduZWQgaGV4YWRlY2ltYWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmFkSGV4ID0gL15bLStdMHhbMC05YS1mXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiaW5hcnkgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmluYXJ5ID0gL14wYlswMV0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3Qgb2N0YWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzT2N0YWwgPSAvXjBvWzAtN10rJC9pO1xuXG4vKiogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgd2l0aG91dCBhIGRlcGVuZGVuY3kgb24gYHJvb3RgLiAqL1xudmFyIGZyZWVQYXJzZUludCA9IHBhcnNlSW50O1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9OdW1iZXIoMy4yKTtcbiAqIC8vID0+IDMuMlxuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMy4yJyk7XG4gKiAvLyA9PiAzLjJcbiAqL1xuZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAoaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIE5BTjtcbiAgfVxuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gdHlwZW9mIHZhbHVlLnZhbHVlT2YgPT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9OdW1iZXI7XG4iLCJ2YXIgYmFzZVRvU3RyaW5nID0gcmVxdWlyZSgnLi9fYmFzZVRvU3RyaW5nJyk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZy4gQW4gZW1wdHkgc3RyaW5nIGlzIHJldHVybmVkIGZvciBgbnVsbGBcbiAqIGFuZCBgdW5kZWZpbmVkYCB2YWx1ZXMuIFRoZSBzaWduIG9mIGAtMGAgaXMgcHJlc2VydmVkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY29udmVydGVkIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b1N0cmluZyhudWxsKTtcbiAqIC8vID0+ICcnXG4gKlxuICogXy50b1N0cmluZygtMCk7XG4gKiAvLyA9PiAnLTAnXG4gKlxuICogXy50b1N0cmluZyhbMSwgMiwgM10pO1xuICogLy8gPT4gJzEsMiwzJ1xuICovXG5mdW5jdGlvbiB0b1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogYmFzZVRvU3RyaW5nKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b1N0cmluZztcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IGlzRWxlbWVudCAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0VsZW1lbnQnO1xuaW1wb3J0IGlzRmluaXRlICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRnVuY3Rpb24nO1xuaW1wb3J0IGlzTmlsICAgICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc05pbCc7XG5pbXBvcnQgaXNPYmplY3QgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCB7IHpvb21EaXJlY3Rpb24gfSAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgX01hdGggICAgICAgICAgICAgICAgZnJvbSAnLi9tYXRoL21hdGgnO1xuaW1wb3J0IE1hdHJpeDIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRyaXgyJztcbmltcG9ydCB7IFR5cGUgfSAgICAgICAgICAgICBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgVXRpbHMgICAgICAgICAgICAgICAgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgVmVjdG9yMiAgICAgICAgICAgICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG5jb25zdCBhbmltYXRpb24gPSB7XG4gICAgdHlwZToge1xuICAgICAgICBDT1JFOiAxXG4gICAgfVxufTtcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLkFuaW1hdGlvblxuKiBAY29uc3RydWN0b3JcbiogQGV4dGVuZHMgZXh0ZXJuYWw6VGltZWxpbmVNYXhcbiogQHBhcmFtIHtDYW1lcmF9IGNhbWVyYSAtIFRoZSBjYW1lcmEgdG8gYmUgYW5pbWF0ZWQuXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuZGVzdHJveU9uQ29tcGxldGVdIC0gV2hldGhlciB0aGUgYW5pbWF0aW9uIHNob3VsZCBiZSBkZXN0cm95ZWQgb25jZSBpdCBoYXMgY29tcGxldGVkLlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlBbmltYXRpb24gPSBuZXcgT2N1bG8uQW5pbWF0aW9uKG15Q2FtZXJhLCB7IFxuKiAgIGRlc3Ryb3lPbkNvbXBsZXRlOiB0cnVlXG4qIH0pLnpvb21UbygyLCAxKS5zaGFrZSgwLjEsIDIpLnBsYXkoKTtcbiovXG5jbGFzcyBBbmltYXRpb24gZXh0ZW5kcyBUaW1lbGluZU1heCB7XG4gICAgY29uc3RydWN0b3IgKGNhbWVyYSwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICBwYXVzZWQ6IHRydWVcbiAgICAgICAgfSwgb3B0aW9ucyk7XG4gICAgICAgIFxuICAgICAgICBzdXBlcihPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtvYmplY3R9IC0gVGhlIGluaXRpYWwgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKiBAZGVmYXVsdCB7fTtcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHR5cGUgb2YgdGhpcyBvYmplY3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMudHlwZSA9IFR5cGUuQU5JTUFUSU9OO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtDYW1lcmF9IC0gVGhlIGNhbWVyYSBvbiB3aGljaCB0aGUgYW5pbWF0aW9uIHdpbGwgYmUgYXBwbGllZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmEgfHwgbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7YXJyYXl9IC0gVGhlIGNvcmUgdHdlZW5zIG9mIHRoaXMgYW5pbWF0aW9uIGluIG9yZGVyIG9mIGV4ZWN1dGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb3JlVHdlZW5zID0gW107XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1RpbWVsaW5lTGl0ZX0gLSBUaGUgY3VycmVudCBhY3RpdmUgc3ViLWFuaW1hdGlvbiBjb25zaXN0aW5nIG9mIHRoZSBjb3JlIGNhbWVyYSBhbmltYXRpb24gYW5kIGVmZmVjdCBhbmltYXRpb25zLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgYW5pbWF0aW9uIHNob3VsZCBiZSBkZXN0cm95ZWQgb25jZSBpdCBoYXMgY29tcGxldGVkLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRlc3Ryb3lPbkNvbXBsZXRlID0gb3B0aW9ucy5kZXN0cm95T25Db21wbGV0ZSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBjYW1lcmEgdmFsdWVzIG9mIHRoZSBwcmV2aW91cyBzdWItYW5pbWF0aW9uLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnByZXZpb3VzUHJvcHMgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIHN0YXJ0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5faW5pdENvcmVUd2Vlbih0aGlzLmNvcmVUd2VlbnNbMF0pO1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuaXNBbmltYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZGlzYWJsZURyYWcoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzTWFudWFsWm9vbWFibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZGlzYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vblN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5vblN0YXJ0LmFwcGx5KHRoaXMsIHRoaXMuY29uZmlnLm9uU3RhcnRQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIG9uY2UgZGV2IGlzIGNvbXBsZXRlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIHN0YXJ0ZWQnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgdXBkYXRlZC5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLm9uVXBkYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5vblVwZGF0ZS5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vblVwZGF0ZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBjb21wbGV0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuaXNBbmltYXRpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmVuYWJsZURyYWcoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzTWFudWFsWm9vbWFibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZW5hYmxlV2hlZWwoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLm9uQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uQ29tcGxldGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25Db21wbGV0ZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRlc3Ryb3lPbkNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgb25jZSBkZXYgaXMgY29tcGxldGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbmltYXRpb24gY29tcGxldGVkJyk7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50Q2FsbGJhY2soJ29uU3RhcnQnLCB0aGlzLl9vblN0YXJ0KTtcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvblVwZGF0ZScsIHRoaXMuX29uVXBkYXRlKTtcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvbkNvbXBsZXRlJywgdGhpcy5fb25Db21wbGV0ZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUaGUgcHJvcGVydGllcyB0byBhbmltYXRlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIF9hbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB2YXIgbWFpblRpbWVsaW5lID0gbmV3IFRpbWVsaW5lTGl0ZSh7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgb25TdGFydDogb3B0aW9ucy5vblN0YXJ0LFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IG9wdGlvbnMub25TdGFydFBhcmFtcyxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogb3B0aW9ucy5vblVwZGF0ZSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogb3B0aW9ucy5vblVwZGF0ZVBhcmFtcyxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBvcHRpb25zLm9uQ29tcGxldGUsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogb3B0aW9ucy5vbkNvbXBsZXRlUGFyYW1zLFxuICAgICAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlOiBvcHRpb25zLm9uUmV2ZXJzZUNvbXBsZXRlLFxuICAgICAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zOiBvcHRpb25zLm9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogdGhpcyxcbiAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICBvblN0YXJ0OiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEtleWZyYW1lID0gc2VsZjtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLm9uU3RhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25TdGFydC5hcHBseSh0aGlzLCBzZWxmLmRhdGEub25TdGFydFBhcmFtcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uVXBkYXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vblVwZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGF0YS5vblVwZGF0ZS5hcHBseSh0aGlzLCBzZWxmLmRhdGEub25VcGRhdGVQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkNvbXBsZXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLm9uQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25Db21wbGV0ZS5hcHBseSh0aGlzLCBzZWxmLmRhdGEub25Db21wbGV0ZVBhcmFtcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25SZXZlcnNlQ29tcGxldGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vblJldmVyc2VDb21wbGV0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGF0YS5vblJldmVyc2VDb21wbGV0ZS5hcHBseSh0aGlzLCBzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBzaGFrZVRpbWVsaW5lID0gbnVsbDtcbiAgICAgICAgdmFyIHNoYWtlID0gdGhpcy5fcGFyc2VTaGFrZShwcm9wcy5zaGFrZSk7XG4gICAgICAgIFxuICAgICAgICAvLyBEZWxldGUgY2FsbGJhY2tzIHNvIGNoaWxkcmVuIGRvbid0IHBpY2sgdGhlbSB1cCBidXQgZ2V0IG90aGVyIG9wdGlvbnNcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25TdGFydDtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25TdGFydFBhcmFtcztcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25VcGRhdGU7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uVXBkYXRlUGFyYW1zO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5vbkNvbXBsZXRlO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5vbkNvbXBsZXRlUGFyYW1zO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZTtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25SZXZlcnNlQ29tcGxldGVQYXJhbXM7XG4gICAgICAgIFxuICAgICAgICAvLyBUd2VlbiBjb3JlIGNhbWVyYSBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIChwcm9wcy5vcmlnaW4gfHwgcHJvcHMucG9zaXRpb24gfHwgcHJvcHMucm90YXRpb24gfHwgcHJvcHMuem9vbSkge1xuICAgICAgICAgICAgdmFyIGNvcmVUd2VlbiA9IFR3ZWVuTWF4LnRvKHRoaXMuY2FtZXJhLCBkdXJhdGlvbiAhPT0gMCA/IGR1cmF0aW9uIDogMC4wMTYsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICByYXdPZmZzZXRYOiAwLFxuICAgICAgICAgICAgICAgIHJhd09mZnNldFk6IDAsXG4gICAgICAgICAgICAgICAgcm90YXRpb246IDAsXG4gICAgICAgICAgICAgICAgem9vbTogMCxcbiAgICAgICAgICAgICAgICBpbW1lZGlhdGVSZW5kZXI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICAgICAgb25TdGFydFBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblN0YXJ0OiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uTk9ORTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLnByb3BzLnRvLnpvb20gPiB0aGlzLmNhbWVyYS56b29tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6RGlyZWN0aW9uID0gem9vbURpcmVjdGlvbi5JTjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzZWxmLnByb3BzLnRvLnpvb20gPCB0aGlzLmNhbWVyYS56b29tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6RGlyZWN0aW9uID0gem9vbURpcmVjdGlvbi5PVVQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnpvb21EaXJlY3Rpb24gPSB6RGlyZWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gT3JpZ2luIG11c3QgYmUgc2V0IGluIGNhc2UgYW5pbWF0aW9uIHdhcyByZXZlcnNlZCAob3JpZ2luIHdhcyByZXZlcnRlZClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0VHJhbnNmb3JtT3JpZ2luKHNlbGYucHJvcHMuZW5kLm9yaWdpbik7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGltZWxpbmUuY29yZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZvciBkZXYgb25seVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY29yZSB0d2VlbiBzdGFydGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0d2VlbiB2YXJzOiAnLCBzZWxmLnZhcnMpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndHdlZW4gcHJvcHM6ICcsIHNlbGYucHJvcHMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25VcGRhdGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBvc2l0aW9uIGlzIG1hbnVhbGx5IG1haW50YWluZWQgc28gYW5pbWF0aW9ucyBjYW4gc21vb3RobHkgY29udGludWUgd2hlbiBjYW1lcmEgaXMgcmVzaXplZFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRSYXdQb3NpdGlvbih0aGlzLmNhbWVyYS5fY29udmVydE9mZnNldFRvUG9zaXRpb24odGhpcy5jYW1lcmEucmF3T2Zmc2V0LCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbiwgdGhpcy5jYW1lcmEudHJhbnNmb3JtYXRpb24pKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5pdENvcmVUd2Vlbih0aGlzLmNvcmVUd2VlbnNbc2VsZi5pbmRleCArIDFdLCBzZWxmLnByb3BzLmVuZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZvciBkZXYgb25seVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY29yZSB0d2VlbiBjb21wbGV0ZWQnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRUcmFuc2Zvcm1PcmlnaW4oc2VsZi5wcm9wcy5zdGFydC5vcmlnaW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29yZVR3ZWVuLnR5cGUgPSBhbmltYXRpb24udHlwZS5DT1JFO1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzID0ge1xuICAgICAgICAgICAgICAgIHNvdXJjZToge30sXG4gICAgICAgICAgICAgICAgcGFyc2VkOiB7fSxcbiAgICAgICAgICAgICAgICB0bzoge30sXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHt9LFxuICAgICAgICAgICAgICAgIGVuZDoge31cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLm9yaWdpbiA9IHByb3BzLm9yaWdpbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2UucG9zaXRpb24gPSBwcm9wcy5wb3NpdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uucm90YXRpb24gPSBwcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSA9IHByb3BzLnpvb207XG4gICAgICAgICAgICBjb3JlVHdlZW4uaW5kZXggPSB0aGlzLmNvcmVUd2VlbnMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5jb3JlVHdlZW5zLnB1c2goY29yZVR3ZWVuKTtcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoY29yZVR3ZWVuLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gc2hha2UgZWZmZWN0XG4gICAgICAgIGlmIChkdXJhdGlvbiA+IDAgJiYgc2hha2UgJiYgc2hha2UuaW50ZW5zaXR5ID4gMCkge1xuICAgICAgICAgICAgc2hha2VUaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHNoYWtlLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogKHNoYWtlLmVuZm9yY2VCb3VuZHMgPT09IGZhbHNlKSA/IGZhbHNlIDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tTY29wZTogdGhpcyxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGltZWxpbmUuc2hha2UgPSBzZWxmO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25VcGRhdGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0ZpbmFsRnJhbWUgPSBzZWxmLnRpbWUoKSA9PT0gc2VsZi5kdXJhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0WCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXRZID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5jYW1lcmEucmF3UG9zaXRpb24uY2xvbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkhPUklaT05UQUwgfHwgc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmluYWxGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFggPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLndpZHRoICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi54ICs9IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5WRVJUSUNBTCB8fCBzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGaW5hbEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IE1hdGgucmFuZG9tKCkgKiBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0ICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueSArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zZXRQb3NpdGlvbihwb3NpdGlvbiwgc2VsZi5kYXRhLmVuZm9yY2VCb3VuZHMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBFYXNlIGluL291dFxuICAgICAgICAgICAgaWYgKHNoYWtlLmVhc2VJbiAmJiBzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiAqIDAuNSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlSW4gfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG5cbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLnRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24gKiAwLjUsIHsgXG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZU91dCB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCBkdXJhdGlvbiAqIDAuNSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlIGluIG9yIGVhc2VcbiAgICAgICAgICAgIGVsc2UgaWYgKHNoYWtlLmVhc2VJbiAmJiAhc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZUluIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZSBvdXRcbiAgICAgICAgICAgIGVsc2UgaWYgKCFzaGFrZS5lYXNlSW4gJiYgc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHlcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZU91dCB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2VcbiAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuZWFzZSkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogb3B0aW9ucy5lYXNlIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm8gZWFzZVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5kYXRhLmludGVuc2l0eSA9IHNoYWtlLmludGVuc2l0eTtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLnRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24sIHt9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbWFpblRpbWVsaW5lLmFkZChzaGFrZVRpbWVsaW5lLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5hZGQobWFpblRpbWVsaW5lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENhbGN1bGF0ZXMgdGhlIFwidG9cIiBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fFZlY3RvcjJ9IHNvdXJjZU9yaWdpbiAtIFRoZSBzb3VyY2Ugb3JpZ2luLlxuICAgICogQHBhcmFtIHtPYmplY3R8VmVjdG9yMn0gc291cmNlUG9zaXRpb24gLSBUaGUgc291cmNlIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHNvdXJjZVJvdGF0aW9uIC0gVGhlIHNvdXJjZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2Vab29tIC0gVGhlIHNvdXJjZSB6b29tLlxuICAgICogQHBhcmFtIHtPY3Vsby5DYW1lcmF9IGNhbWVyYSAtIFRoZSBjYW1lcmEuXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBlbmQgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9jYWxjdWxhdGVUb1Byb3BzIChwYXJzZWQsIHN0YXJ0KSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSB7XG4gICAgICAgICAgICBvcmlnaW46IChwYXJzZWQub3JpZ2luICE9PSBudWxsKSA/IHBhcnNlZC5vcmlnaW4gOiB7fSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAocGFyc2VkLnBvc2l0aW9uICE9PSBudWxsKSA/IHBhcnNlZC5wb3NpdGlvbiA6IHt9LFxuICAgICAgICAgICAgcm90YXRpb246IHBhcnNlZC5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206IHBhcnNlZC56b29tXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBpc0FuY2hvcmVkID0gZmFsc2U7XG4gICAgICAgIC8vIENoYW5naW5nIHRvIHNhbWUgb3JpZ2luIGlzIG5lY2Vzc2FyeSBmb3Igd2hlZWwgem9vbVxuICAgICAgICB2YXIgaXNPcmlnaW5YQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLm9yaWdpbi54KTtcbiAgICAgICAgdmFyIGlzT3JpZ2luWUNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5vcmlnaW4ueSk7XG4gICAgICAgIHZhciBpc09yaWdpbkNoYW5naW5nID0gaXNPcmlnaW5YQ2hhbmdpbmcgfHwgaXNPcmlnaW5ZQ2hhbmdpbmc7XG4gICAgICAgIC8vIENoYW5naW5nIHRvIHNhbWUgcG9zaXRpb24gaXMgbmVjZXNzYXJ5IGZvciBjYW1lcmEgcmVzaXplXG4gICAgICAgIHZhciBpc1Bvc2l0aW9uWENoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5wb3NpdGlvbi54KTtcbiAgICAgICAgdmFyIGlzUG9zaXRpb25ZQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgaXNQb3NpdGlvbkNoYW5naW5nID0gaXNQb3NpdGlvblhDaGFuZ2luZyB8fCBpc1Bvc2l0aW9uWUNoYW5naW5nO1xuICAgICAgICB2YXIgaXNPZmZzZXRDaGFuZ2luZyA9IGlzUG9zaXRpb25DaGFuZ2luZztcbiAgICAgICAgdmFyIGlzUm90YXRpb25DaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uucm90YXRpb24pICYmIHNvdXJjZS5yb3RhdGlvbiAhPT0gc3RhcnQucm90YXRpb247XG4gICAgICAgIHZhciBpc1pvb21DaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uuem9vbSkgJiYgc291cmNlLnpvb20gIT09IHN0YXJ0Lnpvb207XG5cbiAgICAgICAgdmFyIHN0YXJ0VHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHN0YXJ0Lnpvb20sIHN0YXJ0Lnpvb20pLnJvdGF0ZShfTWF0aC5kZWdUb1JhZCgtc3RhcnQucm90YXRpb24pKTtcbiAgICAgICAgdmFyIGZvdlBvc2l0aW9uID0gdGhpcy5jYW1lcmEuY2VudGVyO1xuICAgICAgICB2YXIgdG9PZmZzZXQ7XG4gICAgICAgIHZhciB0b09yaWdpbiA9IG5ldyBWZWN0b3IyKGlzT3JpZ2luWENoYW5naW5nID8gc291cmNlLm9yaWdpbi54IDogc3RhcnQub3JpZ2luLngsIGlzT3JpZ2luWUNoYW5naW5nID8gc291cmNlLm9yaWdpbi55IDogc3RhcnQub3JpZ2luLnkpO1xuICAgICAgICB2YXIgdG9Qb3NpdGlvbiA9IG5ldyBWZWN0b3IyKGlzUG9zaXRpb25YQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueCA6IHN0YXJ0LnBvc2l0aW9uLngsIGlzUG9zaXRpb25ZQ2hhbmdpbmcgPyBzb3VyY2UucG9zaXRpb24ueSA6IHN0YXJ0LnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgdG9Sb3RhdGlvbiA9IGlzUm90YXRpb25DaGFuZ2luZyA/IHNvdXJjZS5yb3RhdGlvbiA6IHN0YXJ0LnJvdGF0aW9uO1xuICAgICAgICB2YXIgdG9ab29tID0gaXNab29tQ2hhbmdpbmcgPyBzb3VyY2Uuem9vbSA6IHN0YXJ0Lnpvb207XG4gICAgICAgIHZhciB0b1RyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZSh0b1pvb20sIHRvWm9vbSkucm90YXRlKF9NYXRoLmRlZ1RvUmFkKC10b1JvdGF0aW9uKSk7XG4gICAgICAgIFxuICAgICAgICAvLyByb3RhdGVUbywgem9vbVRvXG4gICAgICAgIGlmICghaXNPcmlnaW5DaGFuZ2luZyAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRvT3JpZ2luLmNvcHkoc3RhcnQucG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJvdGF0ZUF0LCB6b29tQXRcbiAgICAgICAgZWxzZSBpZiAoaXNPcmlnaW5DaGFuZ2luZyAmJiAhaXNQb3NpdGlvbkNoYW5naW5nKSB7XG4gICAgICAgICAgICBpc0FuY2hvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzUG9zaXRpb25DaGFuZ2luZyA9IHRydWU7XG4gICAgICAgICAgICBmb3ZQb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0U2NlbmVQb3NpdGlvblRvRk9WUG9zaXRpb24odG9PcmlnaW4sIHN0YXJ0LnBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHN0YXJ0VHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgdG9Qb3NpdGlvbiA9IHRoaXMuY2FtZXJhLl9jb252ZXJ0U2NlbmVQb3NpdGlvblRvQ2FtZXJhUG9zaXRpb24odG9PcmlnaW4sIGZvdlBvc2l0aW9uLCB0aGlzLmNhbWVyYS5jZW50ZXIsIHRvT3JpZ2luLCB0b1RyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdG9PZmZzZXQgPSB0aGlzLmNhbWVyYS5fY29udmVydFBvc2l0aW9uVG9PZmZzZXQodG9Qb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCB0b09yaWdpbiwgdG9UcmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb2Zmc2V0WDogaXNPZmZzZXRDaGFuZ2luZyA/IHRvT2Zmc2V0LnggOiBudWxsLFxuICAgICAgICAgICAgb2Zmc2V0WTogaXNPZmZzZXRDaGFuZ2luZyA/IHRvT2Zmc2V0LnkgOiBudWxsLFxuICAgICAgICAgICAgb3JpZ2luOiBpc0FuY2hvcmVkIHx8IGlzT3JpZ2luQ2hhbmdpbmcgPyB0b09yaWdpbiA6IG51bGwsXG4gICAgICAgICAgICBwb3NpdGlvbjogaXNQb3NpdGlvbkNoYW5naW5nID8gdG9Qb3NpdGlvbiA6IG51bGwsXG4gICAgICAgICAgICByb3RhdGlvbjogaXNSb3RhdGlvbkNoYW5naW5nID8gdG9Sb3RhdGlvbiA6IG51bGwsXG4gICAgICAgICAgICB6b29tOiBpc1pvb21DaGFuZ2luZyA/IHRvWm9vbSA6IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBzdGFydGluZyBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHN0YXJ0aW5nIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfZ2V0U3RhcnRQcm9wcyAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcmlnaW46IHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi5jbG9uZSgpLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuY2FtZXJhLnBvc2l0aW9uLmNsb25lKCksXG4gICAgICAgICAgICByb3RhdGlvbjogdGhpcy5jYW1lcmEucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiB0aGlzLmNhbWVyYS56b29tXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgZW5kaW5nIHByb3BlcnR5IHZhbHVlcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgZW5kaW5nIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfZ2V0RW5kUHJvcHMgKHRvLCBzdGFydCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3JpZ2luOiAodG8ub3JpZ2luICE9PSBudWxsKSA/IHRvLm9yaWdpbiA6IHN0YXJ0Lm9yaWdpbixcbiAgICAgICAgICAgIHBvc2l0aW9uOiAodG8ucG9zaXRpb24gIT09IG51bGwpID8gdG8ucG9zaXRpb24gOiBzdGFydC5wb3NpdGlvbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiAodG8ucm90YXRpb24gIT09IG51bGwpID8gdG8ucm90YXRpb24gOiBzdGFydC5yb3RhdGlvbixcbiAgICAgICAgICAgIHpvb206ICh0by56b29tICE9PSBudWxsKSA/IHRvLnpvb20gOiBzdGFydC56b29tXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogSW5pdGlhbGl6ZXMgYSBjb3JlIHR3ZWVuLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1R3ZWVuTWF4fSB0d2VlbiAtIFRoZSB0d2Vlbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfaW5pdENvcmVUd2VlbiAodHdlZW4sIHN0YXJ0UHJvcHMpIHtcbiAgICAgICAgaWYgKHR3ZWVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHN0YXJ0UHJvcHMgPSAoc3RhcnRQcm9wcyAhPT0gdW5kZWZpbmVkKSA/IHN0YXJ0UHJvcHMgOiB0aGlzLl9nZXRTdGFydFByb3BzKCk7XG5cbiAgICAgICAgICAgIHZhciBwYXJzZWRQcm9wcyA9IHRoaXMuX3BhcnNlUHJvcHModHdlZW4ucHJvcHMuc291cmNlLm9yaWdpbiwgdHdlZW4ucHJvcHMuc291cmNlLnBvc2l0aW9uLCB0d2Vlbi5wcm9wcy5zb3VyY2Uucm90YXRpb24sIHR3ZWVuLnByb3BzLnNvdXJjZS56b29tKTtcbiAgICAgICAgICAgIHZhciB0b1Byb3BzID0gdGhpcy5fY2FsY3VsYXRlVG9Qcm9wcyhwYXJzZWRQcm9wcywgc3RhcnRQcm9wcyk7XG4gICAgICAgICAgICB2YXIgZW5kUHJvcHMgPSB0aGlzLl9nZXRFbmRQcm9wcyh0b1Byb3BzLCBzdGFydFByb3BzKTtcblxuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0gc3RhcnRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLnN0YXJ0ID0gc3RhcnRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLmVuZCA9IGVuZFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMucGFyc2VkID0gcGFyc2VkUHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy50byA9IHRvUHJvcHM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE9yaWdpbiBtdXN0IGJlIHVwZGF0ZWQgYmVmb3JlIHR3ZWVuIHN0YXJ0c1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0VHJhbnNmb3JtT3JpZ2luKHRvUHJvcHMub3JpZ2luKTtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMucmF3T2Zmc2V0WCA9IHRvUHJvcHMub2Zmc2V0WDtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMucmF3T2Zmc2V0WSA9IHRvUHJvcHMub2Zmc2V0WTtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMucm90YXRpb24gPSB0b1Byb3BzLnJvdGF0aW9uO1xuICAgICAgICAgICAgdHdlZW4udmFycy56b29tID0gdG9Qcm9wcy56b29tO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZXMgdGhlIGNvcmUgYW5pbWF0aW9uIHByb3BlcnRpZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcmlnaW4gLSBUaGUgb3JpZ2luLlxuICAgICogQHBhcmFtIHtPYmplY3R9IHBvc2l0aW9uIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0gVGhlIHpvb20uXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBwYXJzZWQgcHJvcGVydGllcy5cbiAgICAqL1xuICAgIF9wYXJzZVByb3BzIChvcmlnaW4sIHBvc2l0aW9uLCByb3RhdGlvbiwgem9vbSkge1xuICAgICAgICBpZiAocG9zaXRpb24gPT09ICdwcmV2aW91cycgJiYgdGhpcy5wcmV2aW91c1Byb3BzLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHJvdGF0aW9uID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb24pKSB7XG4gICAgICAgICAgICByb3RhdGlvbiA9IHRoaXMucHJldmlvdXNQcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHpvb20gPT09ICdwcmV2aW91cycgJiYgIWlzTmlsKHRoaXMucHJldmlvdXNQcm9wcy56b29tKSkge1xuICAgICAgICAgICAgem9vbSA9IHRoaXMucHJldmlvdXNQcm9wcy56b29tO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIG9yaWdpbjogVXRpbHMucGFyc2VQb3NpdGlvbihvcmlnaW4sIHRoaXMuY2FtZXJhLnNjZW5lLnZpZXcpLFxuICAgICAgICAgICAgcG9zaXRpb246IFV0aWxzLnBhcnNlUG9zaXRpb24ocG9zaXRpb24sIHRoaXMuY2FtZXJhLnNjZW5lLnZpZXcpLFxuICAgICAgICAgICAgcm90YXRpb246ICFpc05pbChyb3RhdGlvbikgPyByb3RhdGlvbiA6IG51bGwsXG4gICAgICAgICAgICB6b29tOiB6b29tIHx8IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZXMgdGhlIHNoYWtlIHByb3BlcnRpZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBzaGFrZSAtIFRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgcGFyc2VkIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfcGFyc2VTaGFrZSAoc2hha2UpIHtcbiAgICAgICAgdmFyIHBhcnNlZFNoYWtlID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmIChzaGFrZSkge1xuICAgICAgICAgICAgcGFyc2VkU2hha2UgPSB7XG4gICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBpc05pbChzaGFrZS5pbnRlbnNpdHkpID8gMCA6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGlzTmlsKHNoYWtlLmRpcmVjdGlvbikgPyBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEggOiBzaGFrZS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgZWFzZUluOiBzaGFrZS5lYXNlSW4sXG4gICAgICAgICAgICAgICAgZWFzZU91dDogc2hha2UuZWFzZU91dCxcbiAgICAgICAgICAgICAgICBlbmZvcmNlQm91bmRzOiBzaGFrZS5lbmZvcmNlQm91bmRzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcGFyc2VkU2hha2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU3RvcHMgdGhlIGFuaW1hdGlvbiBhbmQgcmVsZWFzZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5kZXN0cm95KCk7XG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgc3VwZXIua2lsbCgpO1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIHRoaXMuY3VycmVudEtleWZyYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0gbnVsbDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBbmltYXRlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGhlIHByb3BlcnRpZXMgdG8gYW5pbWF0ZS5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBbcHJvcHMucG9zaXRpb25dIC0gVGhlIGxvY2F0aW9uIHRvIG1vdmUgdG8uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnBvc2l0aW9uLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5wb3NpdGlvbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBbcHJvcHMub3JpZ2luXSAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHpvb20ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLm9yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMub3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbcHJvcHMucm90YXRpb25dIC0gVGhlIHJvdGF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wcy5zaGFrZV0gLSBBbiBvYmplY3Qgb2Ygc2hha2UgZWZmZWN0IHByb3BlcnRpZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnNoYWtlLmludGVuc2l0eV0gLSBBIHtAbGluayBDYW1lcmEjc2hha2VJbnRlbnNpdHl8c2hha2UgaW50ZW5zaXR5fS5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbn0gW3Byb3BzLnNoYWtlLmRpcmVjdGlvbj1PY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEhdIC0gQSBzaGFrZSBkaXJlY3Rpb24uIFxuICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wcy5zaGFrZS5lYXNlSW5dIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wcy5zaGFrZS5lYXNlT3V0XSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMuem9vbV0gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5hbmltYXRlKHtwb3NpdGlvbjogJyNib3gxMDAnLCB6b29tOiAyfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5hbmltYXRlKHtwb3NpdGlvbjoge3g6IDIwMCwgeTogNTB9LCB6b29tOiAyfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5hbmltYXRlKHtvcmlnaW46ICcjYm94MTAwJywgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7b3JpZ2luOiB7eDogMjAwLCB5OiA1MH0sIHpvb206IDJ9LCAxKTtcbiAgICAqL1xuICAgIGFuaW1hdGUgKHByb3BzLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBwcm9wcy5wb3NpdGlvbixcbiAgICAgICAgICAgIG9yaWdpbjogcHJvcHMub3JpZ2luLFxuICAgICAgICAgICAgcm90YXRpb246IHByb3BzLnJvdGF0aW9uLFxuICAgICAgICAgICAgc2hha2U6IHByb3BzLnNoYWtlLFxuICAgICAgICAgICAgem9vbTogcHJvcHMuem9vbVxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTW92ZSB0byBhIHNwZWNpZmljIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBwb3NpdGlvbiAtIFRoZSBwb3NpdGlvbiB0byBtb3ZlIHRvLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwb3NpdGlvbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcG9zaXRpb24ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oJyNib3gxMDAnLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm94MTAwJyksIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt4OjIwMCwgeTogNTB9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eDogMjAwfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3k6IDIwMH0sIDEpO1xuICAgICovXG4gICAgbW92ZVRvIChwb3NpdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb25cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJvdGF0ZSBhdCB0aGUgc3BlY2lmaWVkIGxvY2F0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR8T2JqZWN0fSBvcmlnaW4gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSByb3RhdGlvbidzIG9yaWdpbi4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcmlnaW4ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IHJvdGF0aW9uIC0gVGhlIHJvdGF0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoJyNib3gxMDAnLCAyMCwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm94MTAwJyksIDIwLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KHt4OiAyMDAsIHk6IDUwfSwgMjAsIDEpO1xuICAgICovXG4gICAgcm90YXRlQXQgKG9yaWdpbiwgcm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgb3JpZ2luOiBvcmlnaW4sXG4gICAgICAgICAgICByb3RhdGlvbjogcm90YXRpb25cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJvdGF0ZSBhdCB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IHJvdGF0aW9uIC0gVGhlIHJvdGF0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24ucm90YXRlVG8oMjAsIDEpO1xuICAgICovXG4gICAgcm90YXRlVG8gKHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIHJvdGF0aW9uOiByb3RhdGlvblxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2hha2UgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge251bWJlcn0gaW50ZW5zaXR5IC0gQSB7QGxpbmsgQ2FtZXJhI3NoYWtlSW50ZW5zaXR5fHNoYWtlIGludGVuc2l0eX0uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9ufSBbZGlyZWN0aW9uPU9jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USF0gLSBBIHNoYWtlIGRpcmVjdGlvbi4gXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH0gb3B0aW9ucyBwbHVzOlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmVhc2VJbl0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuZWFzZU91dF0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5zaGFrZSgwLjEsIDQpO1xuICAgICogbXlBbmltYXRpb24uc2hha2UoMC4xLCA0LCBPY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkhPUklaT05UQUwsIHsgZWFzZUluOiBQb3dlcjIuZWFzZUluLCBlYXNlT3V0OiBQb3dlcjIuZWFzZU91dCB9KVxuICAgICovXG4gICAgc2hha2UgKGludGVuc2l0eSwgZHVyYXRpb24sIGRpcmVjdGlvbiwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzaGFrZToge1xuICAgICAgICAgICAgICAgIGludGVuc2l0eTogaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgIGVhc2VJbjogb3B0aW9ucy5lYXNlSW4sXG4gICAgICAgICAgICAgICAgZWFzZU91dDogb3B0aW9ucy5lYXNlT3V0LFxuICAgICAgICAgICAgICAgIGVuZm9yY2VCb3VuZHM6IG9wdGlvbnMuZW5mb3JjZUJvdW5kc1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogWm9vbSBpbi9vdXQgYXQgYSBzcGVjaWZpYyBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gb3JpZ2luIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgem9vbSdzIG9yaWdpbi4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnhdIC0gVGhlIHggY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcmlnaW4ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIEEgem9vbSB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdCgnI2JveDEwMCcsIDIsIDEpO1xuICAgICogbXlBbmltYXRpb24uem9vbUF0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib3gxMDAnKSwgMiwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoe3g6IDIwMCwgeTogNTB9LCAyLCAxKTtcbiAgICAqL1xuICAgIHpvb21BdCAob3JpZ2luLCB6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogb3JpZ2luLFxuICAgICAgICAgICAgem9vbTogem9vbVxuICAgICAgICB9LCBkdXJhdGlvbiwgb3B0aW9ucyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBab29tIGluL291dCBhdCB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIEEgem9vbSB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnpvb21UbygyLCAxKTtcbiAgICAqL1xuICAgIHpvb21UbyAoem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7IFxuICAgICAgICAgICAgem9vbTogem9vbSBcbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuLyoqXG4qIFNoYWtlIGRpcmVjdGlvbnMuXG4qIEBlbnVtIHtudW1iZXJ9XG4qL1xuQW5pbWF0aW9uLnNoYWtlID0ge1xuICAgIGRpcmVjdGlvbjoge1xuICAgICAgICAvKipcbiAgICAgICAgKiBCb3RoIHRoZSB4IGFuZCB5IGF4ZXMuXG4gICAgICAgICovXG4gICAgICAgIEJPVEg6IDAsXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB4IGF4aXMuXG4gICAgICAgICovXG4gICAgICAgIEhPUklaT05UQUw6IDEsXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB5IGF4aXMuXG4gICAgICAgICovXG4gICAgICAgIFZFUlRJQ0FMOiAyXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBBbmltYXRpb247IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBpc0VsZW1lbnQgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNFbGVtZW50JztcbmltcG9ydCBpc0Zpbml0ZSAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNGaW5pdGUnO1xuaW1wb3J0IGlzRnVuY3Rpb24gICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc0Z1bmN0aW9uJztcbmltcG9ydCBpc05pbCAgICAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNOaWwnO1xuaW1wb3J0IGlzT2JqZWN0ICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9pc09iamVjdCc7XG5pbXBvcnQgeyB6b29tRGlyZWN0aW9uIH0gICAgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IF9NYXRoICAgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRoJztcbmltcG9ydCBNYXRyaXgyICAgICAgICAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgeyBUeXBlIH0gICAgICAgICAgICAgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IFV0aWxzICAgICAgICAgICAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuY29uc3QgYW5pbWF0aW9uID0ge1xuICAgIHR5cGU6IHtcbiAgICAgICAgQ09SRTogMVxuICAgIH1cbn07XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5BbmltYXRpb25cbiogQGNvbnN0cnVjdG9yXG4qIEBleHRlbmRzIGV4dGVybmFsOlRpbWVsaW5lTWF4XG4qIEBwYXJhbSB7Q2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRvIGJlIGFuaW1hdGVkLlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmRlc3Ryb3lPbkNvbXBsZXRlXSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15QW5pbWF0aW9uID0gbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSwgeyBcbiogICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZVxuKiB9KS56b29tVG8oMiwgMSkuc2hha2UoMC4xLCAyKS5wbGF5KCk7XG4qL1xuY2xhc3MgQW5pbWF0aW9uIGV4dGVuZHMgVGltZWxpbmVNYXgge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF1c2VkOiB0cnVlXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgc3VwZXIoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucztcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB0eXBlIG9mIHRoaXMgb2JqZWN0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSBUeXBlLkFOSU1BVElPTjtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Q2FtZXJhfSAtIFRoZSBjYW1lcmEgb24gd2hpY2ggdGhlIGFuaW1hdGlvbiB3aWxsIGJlIGFwcGxpZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhIHx8IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2FycmF5fSAtIFRoZSBjb3JlIHR3ZWVucyBvZiB0aGlzIGFuaW1hdGlvbiBpbiBvcmRlciBvZiBleGVjdXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29yZVR3ZWVucyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUaW1lbGluZUxpdGV9IC0gVGhlIGN1cnJlbnQgYWN0aXZlIHN1Yi1hbmltYXRpb24gY29uc2lzdGluZyBvZiB0aGUgY29yZSBjYW1lcmEgYW5pbWF0aW9uIGFuZCBlZmZlY3QgYW5pbWF0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50S2V5ZnJhbWUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGFuaW1hdGlvbiBzaG91bGQgYmUgZGVzdHJveWVkIG9uY2UgaXQgaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZXN0cm95T25Db21wbGV0ZSA9IG9wdGlvbnMuZGVzdHJveU9uQ29tcGxldGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY2FtZXJhIHZhbHVlcyBvZiB0aGUgcHJldmlvdXMgc3ViLWFuaW1hdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBzdGFydGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25TdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRDb3JlVHdlZW4odGhpcy5jb3JlVHdlZW5zWzBdKTtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVEcmFnKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmRpc2FibGVXaGVlbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25TdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25TdGFydC5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vblN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBvbmNlIGRldiBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBzdGFydGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIHVwZGF0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vblVwZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25VcGRhdGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25VcGRhdGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc01hbnVhbFpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmVuYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vbkNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5vbkNvbXBsZXRlLmFwcGx5KHRoaXMsIHRoaXMuY29uZmlnLm9uQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5kZXN0cm95T25Db21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIG9uY2UgZGV2IGlzIGNvbXBsZXRlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYW5pbWF0aW9uIGNvbXBsZXRlZCcpO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudENhbGxiYWNrKCdvblN0YXJ0JywgdGhpcy5fb25TdGFydCk7XG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25VcGRhdGUnLCB0aGlzLl9vblVwZGF0ZSk7XG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25Db21wbGV0ZScsIHRoaXMuX29uQ29tcGxldGUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gVGhlIHByb3BlcnRpZXMgdG8gYW5pbWF0ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfYW5pbWF0ZSAocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgdmFyIG1haW5UaW1lbGluZSA9IG5ldyBUaW1lbGluZUxpdGUoe1xuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IG9wdGlvbnMub25TdGFydCxcbiAgICAgICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBvcHRpb25zLm9uU3RhcnRQYXJhbXMsXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IG9wdGlvbnMub25VcGRhdGUsXG4gICAgICAgICAgICAgICAgb25VcGRhdGVQYXJhbXM6IG9wdGlvbnMub25VcGRhdGVQYXJhbXMsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogb3B0aW9ucy5vbkNvbXBsZXRlLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IG9wdGlvbnMub25Db21wbGV0ZVBhcmFtcyxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZTogb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZSxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogb3B0aW9ucy5vblJldmVyc2VDb21wbGV0ZVBhcmFtc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IHNlbGY7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vblN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uU3RhcnQuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uU3RhcnRQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25VcGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25VcGRhdGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uVXBkYXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5vbkNvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kYXRhLm9uQ29tcGxldGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uQ29tcGxldGVQYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgIG9uUmV2ZXJzZUNvbXBsZXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRhdGEub25SZXZlcnNlQ29tcGxldGUuYXBwbHkodGhpcywgc2VsZi5kYXRhLm9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgc2hha2VUaW1lbGluZSA9IG51bGw7XG4gICAgICAgIHZhciBzaGFrZSA9IHRoaXMuX3BhcnNlU2hha2UocHJvcHMuc2hha2UpO1xuICAgICAgICBcbiAgICAgICAgLy8gRGVsZXRlIGNhbGxiYWNrcyBzbyBjaGlsZHJlbiBkb24ndCBwaWNrIHRoZW0gdXAgYnV0IGdldCBvdGhlciBvcHRpb25zXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uU3RhcnQ7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uU3RhcnRQYXJhbXM7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uVXBkYXRlO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5vblVwZGF0ZVBhcmFtcztcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25Db21wbGV0ZTtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25Db21wbGV0ZVBhcmFtcztcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMub25SZXZlcnNlQ29tcGxldGU7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLm9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zO1xuICAgICAgICBcbiAgICAgICAgLy8gVHdlZW4gY29yZSBjYW1lcmEgcHJvcGVydGllc1xuICAgICAgICBpZiAocHJvcHMub3JpZ2luIHx8IHByb3BzLnBvc2l0aW9uIHx8IHByb3BzLnJvdGF0aW9uIHx8IHByb3BzLnpvb20pIHtcbiAgICAgICAgICAgIHZhciBjb3JlVHdlZW4gPSBUd2Vlbk1heC50byh0aGlzLmNhbWVyYSwgZHVyYXRpb24gIT09IDAgPyBkdXJhdGlvbiA6IDAuMDE2LCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgcmF3T2Zmc2V0WDogMCxcbiAgICAgICAgICAgICAgICByYXdPZmZzZXRZOiAwLFxuICAgICAgICAgICAgICAgIHJvdGF0aW9uOiAwLFxuICAgICAgICAgICAgICAgIHpvb206IDAsXG4gICAgICAgICAgICAgICAgaW1tZWRpYXRlUmVuZGVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpEaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLk5PTkU7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5wcm9wcy50by56b29tID4gdGhpcy5jYW1lcmEuem9vbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uSU47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2VsZi5wcm9wcy50by56b29tIDwgdGhpcy5jYW1lcmEuem9vbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgekRpcmVjdGlvbiA9IHpvb21EaXJlY3Rpb24uT1VUO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS56b29tRGlyZWN0aW9uID0gekRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIE9yaWdpbiBtdXN0IGJlIHNldCBpbiBjYXNlIGFuaW1hdGlvbiB3YXMgcmV2ZXJzZWQgKG9yaWdpbiB3YXMgcmV2ZXJ0ZWQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbihzZWxmLnByb3BzLmVuZC5vcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLmNvcmUgPSBzZWxmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGb3IgZGV2IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvcmUgdHdlZW4gc3RhcnRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndHdlZW4gdmFyczogJywgc2VsZi52YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3R3ZWVuIHByb3BzOiAnLCBzZWxmLnByb3BzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAvLyBQb3NpdGlvbiBpcyBtYW51YWxseSBtYWludGFpbmVkIHNvIGFuaW1hdGlvbnMgY2FuIHNtb290aGx5IGNvbnRpbnVlIHdoZW4gY2FtZXJhIGlzIHJlc2l6ZWRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0UmF3UG9zaXRpb24odGhpcy5jYW1lcmEuX2NvbnZlcnRPZmZzZXRUb1Bvc2l0aW9uKHRoaXMuY2FtZXJhLnJhd09mZnNldCwgdGhpcy5jYW1lcmEuY2VudGVyLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4sIHRoaXMuY2FtZXJhLnRyYW5zZm9ybWF0aW9uKSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luaXRDb3JlVHdlZW4odGhpcy5jb3JlVHdlZW5zW3NlbGYuaW5kZXggKyAxXSwgc2VsZi5wcm9wcy5lbmQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGb3IgZGV2IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvcmUgdHdlZW4gY29tcGxldGVkJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblJldmVyc2VDb21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0VHJhbnNmb3JtT3JpZ2luKHNlbGYucHJvcHMuc3RhcnQub3JpZ2luKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvcmVUd2Vlbi50eXBlID0gYW5pbWF0aW9uLnR5cGUuQ09SRTtcbiAgICAgICAgICAgIGNvcmVUd2Vlbi5wcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHt9LFxuICAgICAgICAgICAgICAgIHBhcnNlZDoge30sXG4gICAgICAgICAgICAgICAgdG86IHt9LFxuICAgICAgICAgICAgICAgIHN0YXJ0OiB7fSxcbiAgICAgICAgICAgICAgICBlbmQ6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29yZVR3ZWVuLnByb3BzLnNvdXJjZS5vcmlnaW4gPSBwcm9wcy5vcmlnaW47XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLnBvc2l0aW9uID0gcHJvcHMucG9zaXRpb247XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLnJvdGF0aW9uID0gcHJvcHMucm90YXRpb247XG4gICAgICAgICAgICBjb3JlVHdlZW4ucHJvcHMuc291cmNlLnpvb20gPSBwcm9wcy56b29tO1xuICAgICAgICAgICAgY29yZVR3ZWVuLmluZGV4ID0gdGhpcy5jb3JlVHdlZW5zLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMuY29yZVR3ZWVucy5wdXNoKGNvcmVUd2Vlbik7XG4gICAgICAgICAgICBtYWluVGltZWxpbmUuYWRkKGNvcmVUd2VlbiwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIHNoYWtlIGVmZmVjdFxuICAgICAgICBpZiAoZHVyYXRpb24gPiAwICYmIHNoYWtlICYmIHNoYWtlLmludGVuc2l0eSA+IDApIHtcbiAgICAgICAgICAgIHNoYWtlVGltZWxpbmUgPSBuZXcgVGltZWxpbmVMaXRlKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBzaGFrZS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgIGVuZm9yY2VCb3VuZHM6IChzaGFrZS5lbmZvcmNlQm91bmRzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICAgICAgb25TdGFydFBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblN0YXJ0OiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLnNoYWtlID0gc2VsZjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlUGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNGaW5hbEZyYW1lID0gc2VsZi50aW1lKCkgPT09IHNlbGYuZHVyYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldFggPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0WSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuY2FtZXJhLnJhd1Bvc2l0aW9uLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5IT1JJWk9OVEFMIHx8IHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZpbmFsRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5yYW5kb20oKSAqIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS53aWR0aCAqIDIgLSBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueCArPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uVkVSVElDQUwgfHwgc2VsZi5kYXRhLmRpcmVjdGlvbiA9PT0gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmluYWxGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLmhlaWdodCAqIDIgLSBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnkgKz0gb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0UG9zaXRpb24ocG9zaXRpb24sIHNlbGYuZGF0YS5lbmZvcmNlQm91bmRzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J11cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRWFzZSBpbi9vdXRcbiAgICAgICAgICAgIGlmIChzaGFrZS5lYXNlSW4gJiYgc2hha2UuZWFzZU91dCkge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZnJvbVRvKHNoYWtlVGltZWxpbmUuZGF0YSwgZHVyYXRpb24gKiAwLjUsIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogc2hha2UuZWFzZUluIHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuXG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS50byhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uICogMC41LCB7IFxuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VPdXQgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgZHVyYXRpb24gKiAwLjUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZSBpbiBvciBlYXNlXG4gICAgICAgICAgICBlbHNlIGlmIChzaGFrZS5lYXNlSW4gJiYgIXNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VJbiB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2Ugb3V0XG4gICAgICAgICAgICBlbHNlIGlmICghc2hha2UuZWFzZUluICYmIHNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VPdXQgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlXG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmVhc2UpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IG9wdGlvbnMuZWFzZSB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vIGVhc2VcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUuZGF0YS5pbnRlbnNpdHkgPSBzaGFrZS5pbnRlbnNpdHk7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS50byhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uLCB7fSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1haW5UaW1lbGluZS5hZGQoc2hha2VUaW1lbGluZSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWRkKG1haW5UaW1lbGluZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDYWxjdWxhdGVzIHRoZSBcInRvXCIgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdHxWZWN0b3IyfSBzb3VyY2VPcmlnaW4gLSBUaGUgc291cmNlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fFZlY3RvcjJ9IHNvdXJjZVBvc2l0aW9uIC0gVGhlIHNvdXJjZSBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2VSb3RhdGlvbiAtIFRoZSBzb3VyY2Ugcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc291cmNlWm9vbSAtIFRoZSBzb3VyY2Ugem9vbS5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQ2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgZW5kIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfY2FsY3VsYXRlVG9Qcm9wcyAocGFyc2VkLCBzdGFydCkge1xuICAgICAgICB2YXIgc291cmNlID0ge1xuICAgICAgICAgICAgb3JpZ2luOiAocGFyc2VkLm9yaWdpbiAhPT0gbnVsbCkgPyBwYXJzZWQub3JpZ2luIDoge30sXG4gICAgICAgICAgICBwb3NpdGlvbjogKHBhcnNlZC5wb3NpdGlvbiAhPT0gbnVsbCkgPyBwYXJzZWQucG9zaXRpb24gOiB7fSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiBwYXJzZWQucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiBwYXJzZWQuem9vbVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgaXNBbmNob3JlZCA9IGZhbHNlO1xuICAgICAgICAvLyBDaGFuZ2luZyB0byBzYW1lIG9yaWdpbiBpcyBuZWNlc3NhcnkgZm9yIHdoZWVsIHpvb21cbiAgICAgICAgdmFyIGlzT3JpZ2luWENoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5vcmlnaW4ueCk7XG4gICAgICAgIHZhciBpc09yaWdpbllDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2Uub3JpZ2luLnkpO1xuICAgICAgICB2YXIgaXNPcmlnaW5DaGFuZ2luZyA9IGlzT3JpZ2luWENoYW5naW5nIHx8IGlzT3JpZ2luWUNoYW5naW5nO1xuICAgICAgICAvLyBDaGFuZ2luZyB0byBzYW1lIHBvc2l0aW9uIGlzIG5lY2Vzc2FyeSBmb3IgY2FtZXJhIHJlc2l6ZVxuICAgICAgICB2YXIgaXNQb3NpdGlvblhDaGFuZ2luZyA9IE51bWJlci5pc0Zpbml0ZShzb3VyY2UucG9zaXRpb24ueCk7XG4gICAgICAgIHZhciBpc1Bvc2l0aW9uWUNoYW5naW5nID0gTnVtYmVyLmlzRmluaXRlKHNvdXJjZS5wb3NpdGlvbi55KTtcbiAgICAgICAgdmFyIGlzUG9zaXRpb25DaGFuZ2luZyA9IGlzUG9zaXRpb25YQ2hhbmdpbmcgfHwgaXNQb3NpdGlvbllDaGFuZ2luZztcbiAgICAgICAgdmFyIGlzT2Zmc2V0Q2hhbmdpbmcgPSBpc1Bvc2l0aW9uQ2hhbmdpbmc7XG4gICAgICAgIHZhciBpc1JvdGF0aW9uQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnJvdGF0aW9uKSAmJiBzb3VyY2Uucm90YXRpb24gIT09IHN0YXJ0LnJvdGF0aW9uO1xuICAgICAgICB2YXIgaXNab29tQ2hhbmdpbmcgPSBOdW1iZXIuaXNGaW5pdGUoc291cmNlLnpvb20pICYmIHNvdXJjZS56b29tICE9PSBzdGFydC56b29tO1xuXG4gICAgICAgIHZhciBzdGFydFRyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZShzdGFydC56b29tLCBzdGFydC56b29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXN0YXJ0LnJvdGF0aW9uKSk7XG4gICAgICAgIHZhciBmb3ZQb3NpdGlvbiA9IHRoaXMuY2FtZXJhLmNlbnRlcjtcbiAgICAgICAgdmFyIHRvT2Zmc2V0O1xuICAgICAgICB2YXIgdG9PcmlnaW4gPSBuZXcgVmVjdG9yMihpc09yaWdpblhDaGFuZ2luZyA/IHNvdXJjZS5vcmlnaW4ueCA6IHN0YXJ0Lm9yaWdpbi54LCBpc09yaWdpbllDaGFuZ2luZyA/IHNvdXJjZS5vcmlnaW4ueSA6IHN0YXJ0Lm9yaWdpbi55KTtcbiAgICAgICAgdmFyIHRvUG9zaXRpb24gPSBuZXcgVmVjdG9yMihpc1Bvc2l0aW9uWENoYW5naW5nID8gc291cmNlLnBvc2l0aW9uLnggOiBzdGFydC5wb3NpdGlvbi54LCBpc1Bvc2l0aW9uWUNoYW5naW5nID8gc291cmNlLnBvc2l0aW9uLnkgOiBzdGFydC5wb3NpdGlvbi55KTtcbiAgICAgICAgdmFyIHRvUm90YXRpb24gPSBpc1JvdGF0aW9uQ2hhbmdpbmcgPyBzb3VyY2Uucm90YXRpb24gOiBzdGFydC5yb3RhdGlvbjtcbiAgICAgICAgdmFyIHRvWm9vbSA9IGlzWm9vbUNoYW5naW5nID8gc291cmNlLnpvb20gOiBzdGFydC56b29tO1xuICAgICAgICB2YXIgdG9UcmFuc2Zvcm1hdGlvbiA9IG5ldyBNYXRyaXgyKCkuc2NhbGUodG9ab29tLCB0b1pvb20pLnJvdGF0ZShfTWF0aC5kZWdUb1JhZCgtdG9Sb3RhdGlvbikpO1xuICAgICAgICBcbiAgICAgICAgLy8gcm90YXRlVG8sIHpvb21Ub1xuICAgICAgICBpZiAoIWlzT3JpZ2luQ2hhbmdpbmcgJiYgIWlzUG9zaXRpb25DaGFuZ2luZykge1xuICAgICAgICAgICAgaXNBbmNob3JlZCA9IHRydWU7XG4gICAgICAgICAgICB0b09yaWdpbi5jb3B5KHN0YXJ0LnBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByb3RhdGVBdCwgem9vbUF0XG4gICAgICAgIGVsc2UgaWYgKGlzT3JpZ2luQ2hhbmdpbmcgJiYgIWlzUG9zaXRpb25DaGFuZ2luZykge1xuICAgICAgICAgICAgaXNBbmNob3JlZCA9IHRydWU7XG4gICAgICAgICAgICBpc1Bvc2l0aW9uQ2hhbmdpbmcgPSB0cnVlO1xuICAgICAgICAgICAgZm92UG9zaXRpb24gPSB0aGlzLmNhbWVyYS5fY29udmVydFNjZW5lUG9zaXRpb25Ub0ZPVlBvc2l0aW9uKHRvT3JpZ2luLCBzdGFydC5wb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCBzdGFydFRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgIHRvUG9zaXRpb24gPSB0aGlzLmNhbWVyYS5fY29udmVydFNjZW5lUG9zaXRpb25Ub0NhbWVyYVBvc2l0aW9uKHRvT3JpZ2luLCBmb3ZQb3NpdGlvbiwgdGhpcy5jYW1lcmEuY2VudGVyLCB0b09yaWdpbiwgdG9UcmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRvT2Zmc2V0ID0gdGhpcy5jYW1lcmEuX2NvbnZlcnRQb3NpdGlvblRvT2Zmc2V0KHRvUG9zaXRpb24sIHRoaXMuY2FtZXJhLmNlbnRlciwgdG9PcmlnaW4sIHRvVHJhbnNmb3JtYXRpb24pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9mZnNldFg6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC54IDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldFk6IGlzT2Zmc2V0Q2hhbmdpbmcgPyB0b09mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIG9yaWdpbjogaXNBbmNob3JlZCB8fCBpc09yaWdpbkNoYW5naW5nID8gdG9PcmlnaW4gOiBudWxsLFxuICAgICAgICAgICAgcG9zaXRpb246IGlzUG9zaXRpb25DaGFuZ2luZyA/IHRvUG9zaXRpb24gOiBudWxsLFxuICAgICAgICAgICAgcm90YXRpb246IGlzUm90YXRpb25DaGFuZ2luZyA/IHRvUm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogaXNab29tQ2hhbmdpbmcgPyB0b1pvb20gOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgc3RhcnRpbmcgcHJvcGVydHkgdmFsdWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBzdGFydGluZyBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2dldFN0YXJ0UHJvcHMgKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3JpZ2luOiB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4uY2xvbmUoKSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmNhbWVyYS5wb3NpdGlvbi5jbG9uZSgpLFxuICAgICAgICAgICAgcm90YXRpb246IHRoaXMuY2FtZXJhLnJvdGF0aW9uLFxuICAgICAgICAgICAgem9vbTogdGhpcy5jYW1lcmEuem9vbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGVuZGluZyBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIGVuZGluZyBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2dldEVuZFByb3BzICh0bywgc3RhcnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9yaWdpbjogKHRvLm9yaWdpbiAhPT0gbnVsbCkgPyB0by5vcmlnaW4gOiBzdGFydC5vcmlnaW4sXG4gICAgICAgICAgICBwb3NpdGlvbjogKHRvLnBvc2l0aW9uICE9PSBudWxsKSA/IHRvLnBvc2l0aW9uIDogc3RhcnQucG9zaXRpb24sXG4gICAgICAgICAgICByb3RhdGlvbjogKHRvLnJvdGF0aW9uICE9PSBudWxsKSA/IHRvLnJvdGF0aW9uIDogc3RhcnQucm90YXRpb24sXG4gICAgICAgICAgICB6b29tOiAodG8uem9vbSAhPT0gbnVsbCkgPyB0by56b29tIDogc3RhcnQuem9vbVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEluaXRpYWxpemVzIGEgY29yZSB0d2Vlbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtUd2Vlbk1heH0gdHdlZW4gLSBUaGUgdHdlZW4uXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgX2luaXRDb3JlVHdlZW4gKHR3ZWVuLCBzdGFydFByb3BzKSB7XG4gICAgICAgIGlmICh0d2VlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzdGFydFByb3BzID0gKHN0YXJ0UHJvcHMgIT09IHVuZGVmaW5lZCkgPyBzdGFydFByb3BzIDogdGhpcy5fZ2V0U3RhcnRQcm9wcygpO1xuXG4gICAgICAgICAgICB2YXIgcGFyc2VkUHJvcHMgPSB0aGlzLl9wYXJzZVByb3BzKHR3ZWVuLnByb3BzLnNvdXJjZS5vcmlnaW4sIHR3ZWVuLnByb3BzLnNvdXJjZS5wb3NpdGlvbiwgdHdlZW4ucHJvcHMuc291cmNlLnJvdGF0aW9uLCB0d2Vlbi5wcm9wcy5zb3VyY2Uuem9vbSk7XG4gICAgICAgICAgICB2YXIgdG9Qcm9wcyA9IHRoaXMuX2NhbGN1bGF0ZVRvUHJvcHMocGFyc2VkUHJvcHMsIHN0YXJ0UHJvcHMpO1xuICAgICAgICAgICAgdmFyIGVuZFByb3BzID0gdGhpcy5fZ2V0RW5kUHJvcHModG9Qcm9wcywgc3RhcnRQcm9wcyk7XG5cbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IHN0YXJ0UHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5zdGFydCA9IHN0YXJ0UHJvcHM7XG4gICAgICAgICAgICB0d2Vlbi5wcm9wcy5lbmQgPSBlbmRQcm9wcztcbiAgICAgICAgICAgIHR3ZWVuLnByb3BzLnBhcnNlZCA9IHBhcnNlZFByb3BzO1xuICAgICAgICAgICAgdHdlZW4ucHJvcHMudG8gPSB0b1Byb3BzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBPcmlnaW4gbXVzdCBiZSB1cGRhdGVkIGJlZm9yZSB0d2VlbiBzdGFydHNcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNldFRyYW5zZm9ybU9yaWdpbih0b1Byb3BzLm9yaWdpbik7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJhd09mZnNldFggPSB0b1Byb3BzLm9mZnNldFg7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJhd09mZnNldFkgPSB0b1Byb3BzLm9mZnNldFk7XG4gICAgICAgICAgICB0d2Vlbi52YXJzLnJvdGF0aW9uID0gdG9Qcm9wcy5yb3RhdGlvbjtcbiAgICAgICAgICAgIHR3ZWVuLnZhcnMuem9vbSA9IHRvUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBjb3JlIGFuaW1hdGlvbiBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3JpZ2luIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3NpdGlvbiAtIFRoZSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcm90YXRpb24gLSBUaGUgcm90YXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIFRoZSB6b29tLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgcGFyc2VkIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfcGFyc2VQcm9wcyAob3JpZ2luLCBwb3NpdGlvbiwgcm90YXRpb24sIHpvb20pIHtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAncHJldmlvdXMnICYmIHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucG9zaXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyb3RhdGlvbiA9PT0gJ3ByZXZpb3VzJyAmJiAhaXNOaWwodGhpcy5wcmV2aW91c1Byb3BzLnJvdGF0aW9uKSkge1xuICAgICAgICAgICAgcm90YXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh6b29tID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMuem9vbSkpIHtcbiAgICAgICAgICAgIHpvb20gPSB0aGlzLnByZXZpb3VzUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBvcmlnaW46IFV0aWxzLnBhcnNlUG9zaXRpb24ob3JpZ2luLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBVdGlscy5wYXJzZVBvc2l0aW9uKHBvc2l0aW9uLCB0aGlzLmNhbWVyYS5zY2VuZS52aWV3KSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiAhaXNOaWwocm90YXRpb24pID8gcm90YXRpb24gOiBudWxsLFxuICAgICAgICAgICAgem9vbTogem9vbSB8fCBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2VzIHRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gc2hha2UgLSBUaGUgc2hha2UgcHJvcGVydGllcy5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlU2hha2UgKHNoYWtlKSB7XG4gICAgICAgIHZhciBwYXJzZWRTaGFrZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAoc2hha2UpIHtcbiAgICAgICAgICAgIHBhcnNlZFNoYWtlID0ge1xuICAgICAgICAgICAgICAgIGludGVuc2l0eTogaXNOaWwoc2hha2UuaW50ZW5zaXR5KSA/IDAgOiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc05pbChzaGFrZS5kaXJlY3Rpb24pID8gQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIIDogc2hha2UuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgIGVhc2VJbjogc2hha2UuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IHNoYWtlLmVhc2VPdXQsXG4gICAgICAgICAgICAgICAgZW5mb3JjZUJvdW5kczogc2hha2UuZW5mb3JjZUJvdW5kc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHBhcnNlZFNoYWtlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFN0b3BzIHRoZSBhbmltYXRpb24gYW5kIHJlbGVhc2VzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uZGVzdHJveSgpO1xuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHN1cGVyLmtpbGwoKTtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRLZXlmcmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IG51bGw7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLnBvc2l0aW9uXSAtIFRoZSBsb2NhdGlvbiB0byBtb3ZlIHRvLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5wb3NpdGlvbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLm9yaWdpbl0gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLm9yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Byb3BzLnJvdGF0aW9uXSAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2VdIC0gQW4gb2JqZWN0IG9mIHNoYWtlIGVmZmVjdCBwcm9wZXJ0aWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5zaGFrZS5pbnRlbnNpdHldIC0gQSB7QGxpbmsgQ2FtZXJhI3NoYWtlSW50ZW5zaXR5fHNoYWtlIGludGVuc2l0eX0uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtwcm9wcy5zaGFrZS5kaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZU91dF0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnpvb21dIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246ICcjYm94MTAwJywgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7b3JpZ2luOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjoge3g6IDIwMCwgeTogNTB9LCB6b29tOiAyfSwgMSk7XG4gICAgKi9cbiAgICBhbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBwb3NpdGlvbjogcHJvcHMucG9zaXRpb24sXG4gICAgICAgICAgICBvcmlnaW46IHByb3BzLm9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiBwcm9wcy5yb3RhdGlvbixcbiAgICAgICAgICAgIHNoYWtlOiBwcm9wcy5zaGFrZSxcbiAgICAgICAgICAgIHpvb206IHByb3BzLnpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE1vdmUgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gcG9zaXRpb24gLSBUaGUgcG9zaXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24ubW92ZVRvKCcjYm94MTAwJywgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eDoyMDAsIHk6IDUwfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6IDIwMH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt5OiAyMDB9LCAxKTtcbiAgICAqL1xuICAgIG1vdmVUbyAocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gb3JpZ2luIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgcm90YXRpb24ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KCcjYm94MTAwJywgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyMCwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCh7eDogMjAwLCB5OiA1MH0sIDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZUF0IChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogb3JpZ2luLFxuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZVRvKDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZVRvIChyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICByb3RhdGlvbjogcm90YXRpb25cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNoYWtlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGludGVuc2l0eSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbn0gW2RpcmVjdGlvbj1PY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEhdIC0gQSBzaGFrZSBkaXJlY3Rpb24uIFxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9IG9wdGlvbnMgcGx1czpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlSW5dIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uc2hha2UoMC4xLCA0KTtcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCwgT2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5IT1JJWk9OVEFMLCB7IGVhc2VJbjogUG93ZXIyLmVhc2VJbiwgZWFzZU91dDogUG93ZXIyLmVhc2VPdXQgfSlcbiAgICAqL1xuICAgIHNoYWtlIChpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2hha2U6IHtcbiAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IGludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICBlYXNlSW46IG9wdGlvbnMuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IG9wdGlvbnMuZWFzZU91dCxcbiAgICAgICAgICAgICAgICBlbmZvcmNlQm91bmRzOiBvcHRpb25zLmVuZm9yY2VCb3VuZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHpvb20ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoJyNib3gxMDAnLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm94MTAwJyksIDIsIDEpO1xuICAgICogbXlBbmltYXRpb24uem9vbUF0KHt4OiAyMDAsIHk6IDUwfSwgMiwgMSk7XG4gICAgKi9cbiAgICB6b29tQXQgKG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHpvb206IHpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogWm9vbSBpbi9vdXQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tVG8oMiwgMSk7XG4gICAgKi9cbiAgICB6b29tVG8gKHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoeyBcbiAgICAgICAgICAgIHpvb206IHpvb20gXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuKiBTaGFrZSBkaXJlY3Rpb25zLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbkFuaW1hdGlvbi5zaGFrZSA9IHtcbiAgICBkaXJlY3Rpb246IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQm90aCB0aGUgeCBhbmQgeSBheGVzLlxuICAgICAgICAqL1xuICAgICAgICBCT1RIOiAwLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeCBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBIT1JJWk9OVEFMOiAxLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeSBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBWRVJUSUNBTDogMlxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQW5pbWF0aW9uOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgQW5pbWF0aW9uIGZyb20gJy4vQW5pbWF0aW9uJztcbmltcG9ydCB7IFR5cGUgfSAgZnJvbSAnLi9jb25zdGFudHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQW5pbWF0aW9uTWFuYWdlclxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtPYmplY3R9IGNhbWVyYSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgQW5pbWF0aW9uTWFuYWdlci5cbiovXG5jbGFzcyBBbmltYXRpb25NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgQW5pbWF0aW9uTWFuYWdlci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkFuaW1hdGlvbn0gLSBUaGUgYWN0aXZlIGFuaW1hdGlvbi5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIEFuIG9iamVjdCBmb3Igc3RvcmluZyB0aGUgQW5pbWF0aW9uIGluc3RhbmNlcy5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQW5pbWF0aW9uTWFuYWdlciNpc0FuaW1hdGluZ1xuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIGlzIHJ1bm5pbmcgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNBbmltYXRpbmcgKCkge1xuICAgICAgICB2YXIgcHJvZ3Jlc3MgPSB0aGlzLmN1cnJlbnRBbmltYXRpb24gPyB0aGlzLmN1cnJlbnRBbmltYXRpb24ucHJvZ3Jlc3MoKSA6IDA7XG4gICAgICAgIHJldHVybiBwcm9ncmVzcyA+IDAgJiYgcHJvZ3Jlc3MgPCAxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIEFuaW1hdGlvbk1hbmFnZXIjaXNQYXVzZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBpcyBwYXVzZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNQYXVzZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50QW5pbWF0aW9uID8gdGhpcy5jdXJyZW50QW5pbWF0aW9uLnBhdXNlZCgpIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSB0byBnaXZlIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcGFyYW0ge29iamVjdHxPY3Vsby5BbmltYXRpb259IGFuaW1hdGlvbiAtIFRoZSBhbmltYXRpb24uIEl0IGNhbiBiZSBhbiBhY3R1YWwgYW5pbWF0aW9uIGluc3RhbmNlIG9yIGFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGFuaW1hdGlvbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYW4gYW5pbWF0aW9uIGluc3RhbmNlPC9jYXB0aW9uPlxuICAgICogbXlBbmltYXRpb25NYW5hZ2VyLmFkZCgnem9vbUluT3V0JywgbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSkuYW5pbWF0ZSh7em9vbTogMn0sIDIsIHtlYXNlOiBQb3dlcjIuZWFzZUlufSkuYW5pbWF0ZSh7em9vbTogMX0sIDIsIHtlYXNlOiBQb3dlcjIuZWFzZU91dH0pKTtcbiAgICAqIFxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYW4gb2JqZWN0IHJlcHJlc2VudGluZyBhbiBhbmltYXRpb248L2NhcHRpb24+XG4gICAgKiBteUFuaW1hdGlvbk1hbmFnZXIuYWRkKCd6b29tSW5BbmRPdXQnLCB7IFxuICAgICogICBrZXlmcmFtZXM6IFt7IFxuICAgICogICAgIHpvb206IDIsIFxuICAgICogICAgIGR1cmF0aW9uOiAyLCBcbiAgICAqICAgICBvcHRpb25zOiB7IFxuICAgICogICAgICAgZWFzZTogUG93ZXIyLmVhc2VJbiBcbiAgICAqICAgICB9XG4gICAgKiAgIH0sIHtcbiAgICAqICAgICB6b29tOiAxLFxuICAgICogICAgIGR1cmF0aW9uOiAyLFxuICAgICogICAgIG9wdGlvbnM6IHtcbiAgICAqICAgICAgIGVhc2U6IFBvd2VyMi5lYXNlT3V0XG4gICAgKiAgICAgfVxuICAgICogICB9XVxuICAgICogfSk7XG4gICAgKi8gICAgICAgIFxuICAgIGFkZCAobmFtZSwgYW5pbWF0aW9uKSB7XG4gICAgICAgIGxldCBuZXdBbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5fYW5pbWF0aW9uc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1tuYW1lXS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChhbmltYXRpb24udHlwZSA9PT0gVHlwZS5BTklNQVRJT04pIHtcbiAgICAgICAgICAgIG5ld0FuaW1hdGlvbiA9IGFuaW1hdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5ld0FuaW1hdGlvbiA9IG5ldyBBbmltYXRpb24odGhpcy5jYW1lcmEpO1xuICAgICAgICAgICAgYW5pbWF0aW9uLmtleWZyYW1lcy5mb3JFYWNoKChrZXlmcmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0FuaW1hdGlvbi5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiBrZXlmcmFtZS5vcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBrZXlmcmFtZS5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGtleWZyYW1lLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzaGFrZToga2V5ZnJhbWUuc2hha2UsXG4gICAgICAgICAgICAgICAgICAgIHpvb206IGtleWZyYW1lLnpvb21cbiAgICAgICAgICAgICAgICB9LCBrZXlmcmFtZS5kdXJhdGlvbiwga2V5ZnJhbWUub3B0aW9ucyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9hbmltYXRpb25zW25hbWVdID0gbmV3QW5pbWF0aW9uO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIEFuaW1hdGlvbk1hbmFnZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fYW5pbWF0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1trZXldLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGFuIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcmV0dXJucyB7T2N1bG8uQW5pbWF0aW9ufSBUaGUgYW5pbWF0aW9uLlxuICAgICovXG4gICAgZ2V0IChuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhdXNlcyB0aGUgYWN0aXZlIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwYXVzZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5wYXVzZShudWxsLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFBsYXlzIHRoZSBjdXJyZW50IG9yIHByb3ZpZGVkIGFuaW1hdGlvbiBmb3J3YXJkIGZyb20gdGhlIGN1cnJlbnQgcGxheWhlYWQgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWVdIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0byBwbGF5LlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwbGF5IChuYW1lKSB7XG4gICAgICAgIHZhciBhbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb247XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24uaW52YWxpZGF0ZSgpLnJlc3RhcnQoZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgfSBcbiAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gdW5kZWZpbmVkICYmIHRoaXMuY3VycmVudEFuaW1hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uLnBsYXkobnVsbCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXN1bWVzIHBsYXlpbmcgdGhlIGFuaW1hdGlvbiBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlc3VtZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXZlcnNlcyBwbGF5YmFjayBvZiBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPW51bGxdIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbi4gSWYgbm9uZSBpcyBzcGVjaWZpZWQsIHRoZSBjdXJyZW50IGFuaW1hdGlvbiB3aWxsIGJlIHJldmVyc2VkLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJldmVyc2UgKG5hbWUgPSBudWxsKSB7XG4gICAgICAgIHZhciBhbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb247XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24uaW52YWxpZGF0ZSgpLnJldmVyc2UoMCwgZmFsc2UpO1xuICAgICAgICB9IFxuICAgICAgICBlbHNlIGlmIChuYW1lID09PSBudWxsICYmIHRoaXMuY3VycmVudEFuaW1hdGlvbikge1xuICAgICAgICAgICAgbGV0IHRpbWUgPSB0aGlzLmN1cnJlbnRBbmltYXRpb24udGltZSgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uLnJldmVyc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBBbmltYXRpb25NYW5hZ2VyOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG4vLyBUT0RPOlxuLy8gMSkgSW1wb3J0IEFuaW1hdGlvbiB0byBhdm9pZCB1c2luZyBPY3VsbyBuYW1lc3BhY2Vcbi8vIDIpIEVuc3VyZSBkaXJlY3Rpb25hbCByb3RhdGlvbiBwbHVnaW4gd29ya3NcblxuaW1wb3J0IGNsYW1wICAgICAgICAgICAgICAgIGZyb20gJ2xvZGFzaC9jbGFtcCc7XG5pbXBvcnQgaXNFbGVtZW50ICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRWxlbWVudCc7XG5pbXBvcnQgaXNGaW5pdGUgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzRmluaXRlJztcbmltcG9ydCBpc0Z1bmN0aW9uICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNGdW5jdGlvbic7XG5pbXBvcnQgaXNOaWwgICAgICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzTmlsJztcbmltcG9ydCBpc09iamVjdCAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvaXNPYmplY3QnO1xuaW1wb3J0IHsgem9vbURpcmVjdGlvbiB9ICAgIGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9ICAgICBmcm9tICdmYmVtaXR0ZXInO1xuaW1wb3J0IEFuaW1hdGlvbk1hbmFnZXIgICAgIGZyb20gJy4vYW5pbWF0aW9uTWFuYWdlcic7XG5pbXBvcnQgQ1NTUmVuZGVyZXIgICAgICAgICAgZnJvbSAnLi9jc3NSZW5kZXJlcic7XG5pbXBvcnQgX01hdGggICAgICAgICAgICAgICAgZnJvbSAnLi9tYXRoL21hdGgnO1xuaW1wb3J0IE1hdHJpeDIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC9tYXRyaXgyJztcbmltcG9ydCBTY2VuZSAgICAgICAgICAgICAgICBmcm9tICcuL3NjZW5lJztcbmltcG9ydCBTY2VuZU1hbmFnZXIgICAgICAgICBmcm9tICcuL3NjZW5lTWFuYWdlcic7XG5pbXBvcnQgVHJhY2tDb250cm9sICAgICAgICAgZnJvbSAnLi90cmFja0NvbnRyb2wnO1xuaW1wb3J0IFV0aWxzICAgICAgICAgICAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuY29uc3QgYW5pbWF0aW9uTmFtZSA9IHtcbiAgICBBTk9OWU1PVVM6ICdfYW5vbnltb3VzJ1xufTtcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLkNhbWVyYVxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBvcHRpb25zLlxuKiBAcGFyYW0ge2Z1bmN0aW9ufE9iamVjdH0gW29wdGlvbnMuYm91bmRzXSAtIFRoZSBib3VuZHMuXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZHJhZ1RvTW92ZV0gLSBXaGV0aGVyIHRoZSBjYW1lcmEncyBwb3NpdGlvbiBpcyBkcmFnZ2FibGUgb3Igbm90LlxuKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWluWm9vbV0gLSBUaGUge0BsaW5rIENhbWVyYS5taW5ab29tfG1pbmltdW0gem9vbX0uXG4qIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhab29tXSAtIFRoZSB7QGxpbmsgQ2FtZXJhLm1heFpvb218bWF4aW11bSB6b29tfS5cbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxudWxsfSBbb3B0aW9ucy52aWV3XSAtIFRoZSBjYW1lcmEncyB2aWV3LlxuKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLndoZWVsVG9ab29tXSAtIFdoZXRoZXIgd2hlZWxpbmcgY2FuIGJlIHVzZWQgdG8gem9vbSBvciBub3QuXG4qIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy53aGVlbFRvWm9vbUluY3JlbWVudF0gLSBUaGUgYmFzZSB7QGxpbmsgQ2FtZXJhLndoZWVsVG9ab29tSW5jcmVtZW50fHpvb20gaW5jcmVtZW50fS5cbiogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbb3B0aW9ucy53aWR0aF0gLSBUaGUgY2FtZXJhJ3Mge0BsaW5rIENhbWVyYS53aWR0aHx3aWR0aH0uXG4qIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW29wdGlvbnMuaGVpZ2h0XSAtIFRoZSBjYW1lcmEncyB7QGxpbmsgQ2FtZXJhLmhlaWdodHxoZWlnaHR9LlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlDYW1lcmEgPSBuZXcgT2N1bG8uQ2FtZXJhKHsgXG4qICAgdmlldzogJyNjYW1lcmEnLFxuKiAgIGJvdW5kczogT2N1bG8uQ2FtZXJhLmJvdW5kcy5XT1JMRF9FREdFLFxuKiAgIGRyYWdUb01vdmU6IHRydWUsXG4qICAgbWluWm9vbTogMC41LFxuKiAgIG1heFpvb206IDMsXG4qICAgd2hlZWxUb1pvb206IHRydWUsXG4qICAgd2hlZWxUb1pvb21JbmNyZW1lbnQ6IDAuNSxcbiogICB3aWR0aDogMTAwMCxcbiogICBoZWlnaHQ6IDUwMFxuKiB9KTtcbiovXG5jbGFzcyBDYW1lcmEge1xuICAgIGNvbnN0cnVjdG9yICh7IFxuICAgICAgICBib3VuZHMgPSBudWxsLCBcbiAgICAgICAgZHJhZ1RvTW92ZSA9IGZhbHNlLCBcbiAgICAgICAgaGVpZ2h0ID0gMCwgXG4gICAgICAgIG1heFpvb20gPSAzLCBcbiAgICAgICAgbWluWm9vbSA9IDAuNSwgXG4gICAgICAgIG9uSW5pdGlhbGl6ZSA9IG51bGwsXG4gICAgICAgIG9uQmVmb3JlUmVuZGVyID0gbnVsbCxcbiAgICAgICAgb25SZW5kZXIgPSBudWxsLFxuICAgICAgICB2aWV3ID0gdW5kZWZpbmVkLCBcbiAgICAgICAgd2hlZWxUb1pvb20gPSBmYWxzZSwgXG4gICAgICAgIHdoZWVsVG9ab29tSW5jcmVtZW50ID0gMC4wMSwgXG4gICAgICAgIHdpZHRoID0gMFxuICAgIH0gPSB7fSkge1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPY3Vsby5BbmltYXRpb25NYW5hZ2VyfSAtIEFuIG9iamVjdCBmb3IgbWFuYWdpbmcgYW5pbWF0aW9ucy5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5hbmltYXRpb25zID0gbmV3IEFuaW1hdGlvbk1hbmFnZXIodGhpcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtWZWN0b3IyfSAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jZW50ZXIgPSBuZXcgVmVjdG9yMih3aWR0aCwgaGVpZ2h0KS5tdWx0aXBseVNjYWxhcigwLjUpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSdzIHBvc2l0aW9uIGlzIGRyYWdnYWJsZSBvciBub3QuXG4gICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kcmFnVG9Nb3ZlID0gKGRyYWdUb01vdmUgPT09IHRydWUpID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBoZWlnaHQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaXMgYW5pbWF0aW5nIG9yIG5vdC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhIGhhcyBiZWVuIHJlbmRlcmVkIG9yIG5vdC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzUmVuZGVyZWQgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVsbHxudW1iZXJ9IC0gVGhlIG1pbmltdW0gWCBwb3NpdGlvbiBhZnRlciBib3VuZHMgYXJlIGFwcGxpZWQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWluUG9zaXRpb25YID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVsbHxudW1iZXJ9IC0gVGhlIG1pbmltdW0gWSBwb3NpdGlvbiBhZnRlciBib3VuZHMgYXJlIGFwcGxpZWQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWluUG9zaXRpb25ZID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVsbHxudW1iZXJ9IC0gVGhlIG1heGltdW0gWCBwb3NpdGlvbiBhZnRlciBib3VuZHMgYXJlIGFwcGxpZWQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWF4UG9zaXRpb25YID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVsbHxudW1iZXJ9IC0gVGhlIG1heGltdW0gWSBwb3NpdGlvbiBhZnRlciBib3VuZHMgYXJlIGFwcGxpZWQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWF4UG9zaXRpb25ZID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSBtaW5pbXVtIHZhbHVlIHRoZSBjYW1lcmEgY2FuIGJlIHpvb21lZC5cbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBTZWUge0BsaW5rIENhbWVyYS56b29tfHpvb219LlxuICAgICAgICAqIEBkZWZhdWx0IDAuNVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1pblpvb20gPSBtaW5ab29tO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIG1heGltdW0gdmFsdWUgdGhlIGNhbWVyYSBjYW4gYmUgem9vbWVkLlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFNlZSB7QGxpbmsgQ2FtZXJhLnpvb218em9vbX0uXG4gICAgICAgICogQGRlZmF1bHQgM1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1heFpvb20gPSBtYXhab29tO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHBvc2l0aW9uIG9mIHRoZSBjYW1lcmEgb24gdGhlIHNjZW5lLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgb2Zmc2V0IG9mIHRoZSBjYW1lcmEncyB0b3AgbGVmdCBjb3JuZXIgcmVsYXRpdmUgdG8gdGhlIHNjZW5lIHdpdGhvdXQgYW55IGVmZmVjdHMgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yYXdPZmZzZXQgPSBuZXcgVmVjdG9yMigwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBwb3NpdGlvbiBvZiB0aGUgY2FtZXJhIG9uIHRoZSBzY2VuZSB3aXRob3V0IGFueSBlZmZlY3RzIGFwcGxpZWQuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucmF3UG9zaXRpb24gPSBuZXcgVmVjdG9yMigwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSByZW5kZXJlci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBDU1NSZW5kZXJlcih0aGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBhbW91bnQgb2Ygcm90YXRpb24gaW4gZGVncmVlcy5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICovXG4gICAgICAgIHRoaXMucm90YXRpb24gPSAwO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPY3Vsby5TY2VuZU1hbmFnZXJ9IC0gQW4gb2JqZWN0IGZvciBtYW5hZ2luZyBzY2VuZXMuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2NlbmVzID0gbmV3IFNjZW5lTWFuYWdlcih0aGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7VHJhY2tDb250cm9sfSAtIFRoZSB0cmFjayBjb250cm9sLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMudHJhY2tDb250cm9sID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIHRyYW5zZm9ybWF0aW9uIG9yaWdpbi5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmFuc2Zvcm1PcmlnaW4gPSBuZXcgVmVjdG9yMigwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSB2aWV3LlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnZpZXcgPSAodmlldyA9PT0gbnVsbCkgPyBudWxsIDogVXRpbHMuRE9NLnBhcnNlVmlldyh2aWV3KSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHdoZWVsaW5nIGNhbiBiZSB1c2VkIHRvIHpvb20gb3Igbm90LlxuICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMud2hlZWxUb1pvb20gPSAod2hlZWxUb1pvb20gPT09IHRydWUpID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGJhc2UgaW5jcmVtZW50IGF0IHdoaWNoIHRoZSBjYW1lcmEgd2lsbCBiZSB6b29tZWQuIFNlZSB7QGxpbmsgQ2FtZXJhLnpvb218em9vbX0uXG4gICAgICAgICogQGRlZmF1bHQgMC4wMVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLndoZWVsVG9ab29tSW5jcmVtZW50ID0gd2hlZWxUb1pvb21JbmNyZW1lbnQ7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgd2lkdGguXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgem9vbSBkaXJlY3Rpb24uXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnpvb21EaXJlY3Rpb24gPSB6b29tRGlyZWN0aW9uLk5PTkU7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVsbHxmdW5jdGlvbnxPYmplY3R9IC0gVGhlIGludGVybmFsbHkgbWFuYWdlZCBib3VuZHMuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX2JvdW5kcyA9IGJvdW5kcztcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICogQHByb3BlcnR5IHtFdmVudEVtaXR0ZXJ9IC0gVGhlIGludGVybmFsIGV2ZW50IGVtaXR0ZXIuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHNjYWxlIGF0IHdoaWNoIHRoZSBzY2VuZSBpcyByYXN0ZXJpemVkLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9yYXN0ZXJTY2FsZSA9IDE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBpbnRlcm5hbGx5IG1hbmFnZWQgem9vbS5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fem9vbSA9IDE7XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0aWFsaXplIHBvc2l0aW9uXG4gICAgICAgIHRoaXMuc2V0UmF3UG9zaXRpb24obmV3IFZlY3RvcjIod2lkdGggKiAwLjUsIGhlaWdodCAqIDAuNSkpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBldmVudHNcbiAgICAgICAgaWYgKG9uSW5pdGlhbGl6ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5vbkluaXRpYWxpemUgPSBvbkluaXRpYWxpemU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChvbkJlZm9yZVJlbmRlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5vbkJlZm9yZVJlbmRlciA9IG9uQmVmb3JlUmVuZGVyO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAob25SZW5kZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMub25SZW5kZXIgPSBvblJlbmRlcjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5vblJlc2l6ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIC8vIE1haW50YWluIGNhbWVyYSBwb3NpdGlvbiBhbmQgdXBkYXRlIHRoZSBjdXJyZW50IGFuaW1hdGlvblxuICAgICAgICAgICAgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzLCB7IFxuICAgICAgICAgICAgICAgIGRlc3Ryb3lPbkNvbXBsZXRlOiB0cnVlLCBcbiAgICAgICAgICAgICAgICBwYXVzZWQ6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAod2FzUGF1c2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5hbmltYXRpb25zLmN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICd0aGlzJyBpcyBib3VuZCB0byB0aGUgQW5pbWF0aW9uIHZpYSB0aGUgQW5pbWF0aW9uIGNsYXNzXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW5pbWF0aW9uID0gdGhpcy5jYW1lcmEuYW5pbWF0aW9ucy5jdXJyZW50QW5pbWF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRpbWUgPSBhbmltYXRpb24udGltZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uLnRvdGFsUHJvZ3Jlc3MoKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb24uc2VlaygwKS5pbnZhbGlkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uLmNvcmVUd2VlbnNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2V0UmF3UG9zaXRpb24oYW5pbWF0aW9uLmNvcmVUd2VlbnNbMF0ucHJvcHMuc3RhcnQucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbi5zZWVrKHRpbWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF3YXNQYXVzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogW3RoaXMuYW5pbWF0aW9ucy5pc1BhdXNlZF1cbiAgICAgICAgICAgIH0pLm1vdmVUbyh0aGlzLnJhd1Bvc2l0aW9uLCAwLCB7IG92ZXJ3cml0ZTogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgIHRoaXMuX2V2ZW50cy5hZGRMaXN0ZW5lcignY2hhbmdlOnNpemUnLCB0aGlzLm9uUmVzaXplKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgdmlld1xuICAgICAgICBpZiAodGhpcy52aWV3KSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgc2NlbmUgbWFuYWdlciB2aWV3IGFuZCB0cmFjayBjb250cm9sc1xuICAgICAgICBpZiAodGhpcy52aWV3ICYmIHRoaXMuc2NlbmVzLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLnNjZW5lcy52aWV3KTtcbiAgICAgICAgICAgIHRoaXMudHJhY2tDb250cm9sID0gbmV3IFRyYWNrQ29udHJvbCh0aGlzLCB7XG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlOiB0aGlzLmRyYWdUb01vdmUsXG4gICAgICAgICAgICAgICAgb25EcmFnOiBmdW5jdGlvbiAoY2FtZXJhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IGNhbWVyYS5fY29udmVydE9mZnNldFRvUG9zaXRpb24obmV3IFZlY3RvcjIoLXRoaXMueCwgLXRoaXMueSksIGNhbWVyYS5jZW50ZXIsIGNhbWVyYS50cmFuc2Zvcm1PcmlnaW4sIGNhbWVyYS50cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjYW1lcmEubW92ZVRvKHBvc2l0aW9uLCAwLCB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZVBhcmFtczogW3RoaXNdLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKGRyYWdDb250cm9sKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJhZ0NvbnRyb2wudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2hlZWxhYmxlOiB0aGlzLndoZWVsVG9ab29tLFxuICAgICAgICAgICAgICAgIG9uV2hlZWw6IGZ1bmN0aW9uIChjYW1lcmEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgWk9PTV9JTiA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFpPT01fT1VUID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZlbG9jaXR5ID0gTWF0aC5hYnModGhpcy53aGVlbEV2ZW50LmRlbHRhWSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLndoZWVsRXZlbnQuZGVsdGFZID4gMCA/IFpPT01fT1VUIDogWk9PTV9JTjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzRGlyZWN0aW9uID0gdGhpcy5wcmV2aW91c1doZWVsRXZlbnQuZGVsdGFZID4gMCA/IFpPT01fT1VUIDogWk9PTV9JTjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbWVyYVJlY3Q7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW1lcmFGT1ZQb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzY2VuZVBvc2l0aW9uID0gbmV3IFZlY3RvcjIoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdpbiA9IGNhbWVyYS50cmFuc2Zvcm1PcmlnaW47XG4gICAgICAgICAgICAgICAgICAgIHZhciB6b29tID0gY2FtZXJhLnpvb20gKyBjYW1lcmEuem9vbSAqIGNhbWVyYS53aGVlbFRvWm9vbUluY3JlbWVudCAqICh2ZWxvY2l0eSA+IDEgPyB2ZWxvY2l0eSAqIDAuNSA6IDEpICogKGRpcmVjdGlvbiA9PT0gWk9PTV9JTiA/IDEgOiAtMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUGVyZm9ybWFuY2UgT3B0aW1pemF0aW9uOiBJZiB6b29tIGhhcyBub3QgY2hhbmdlZCBiZWNhdXNlIGl0J3MgYXQgdGhlIG1pbi9tYXgsIGRvbid0IHpvb20uXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IHByZXZpb3VzRGlyZWN0aW9uICYmIGNhbWVyYS5fY2xhbXBab29tKHpvb20pICE9PSBjYW1lcmEuem9vbSkgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYVJlY3QgPSBjYW1lcmEudmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYUZPVlBvc2l0aW9uLnNldCh0aGlzLndoZWVsRXZlbnQuY2xpZW50WCAtIGNhbWVyYVJlY3QubGVmdCwgdGhpcy53aGVlbEV2ZW50LmNsaWVudFkgLSBjYW1lcmFSZWN0LnRvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2VuZVBvc2l0aW9uID0gY2FtZXJhLl9jb252ZXJ0Rk9WUG9zaXRpb25Ub1NjZW5lUG9zaXRpb24oY2FtZXJhRk9WUG9zaXRpb24sIGNhbWVyYS5wb3NpdGlvbiwgY2FtZXJhLmNlbnRlciwgY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzIHBvczogJywgc2NlbmVQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmZsb29yKG9yaWdpbi54KSAhPT0gTWF0aC5mbG9vcihzY2VuZVBvc2l0aW9uLngpIHx8IE1hdGguZmxvb3Iob3JpZ2luLnkpICE9PSBNYXRoLmZsb29yKHNjZW5lUG9zaXRpb24ueSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW4gPSBzY2VuZVBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW1lcmEuem9vbUF0KG9yaWdpbiwgem9vbSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5vbkluaXRpYWxpemUoYXJndW1lbnRzWzBdKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjYm91bmRzXG4gICAgKiBAcHJvcGVydHkge251bGx8ZnVuY3Rpb258T2JqZWN0fSAtIFRoZSBjYW1lcmEncyBib3VuZHMuIFRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIHBvc2l0aW9uIHZhbHVlcyBmb3IgdGhlIGNhbWVyYS4gU2V0IHRvIG51bGwgaWYgbm8gYm91bmRzIGFyZSBkZXNpcmVkLlxuICAgICpcbiAgICAqIEBleGFtcGxlIDxjYXB0aW9uPkFzIGEgc3RvY2sgYm91bmRzPC9jYXB0aW9uPlxuICAgICogT2N1bG8uQ2FtZXJhLmJvdW5kcy5XT1JMRFxuICAgICpcbiAgICAqIEBleGFtcGxlIDxjYXB0aW9uPkFzIGEgYm91bmRzIG9iamVjdDwvY2FwdGlvbj5cbiAgICAqIHsgXG4gICAgKiAgIG1pblg6IDAsIFxuICAgICogICBtaW5ZOiAwLCBcbiAgICAqICAgbWF4WDogdGhpcy5zY2VuZS53aWR0aCwgXG4gICAgKiAgIG1heFk6IHRoaXMuc2NlbmUuaGVpZ2h0XG4gICAgKiB9XG4gICAgKlxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBib3VuZHMgb2JqZWN0PC9jYXB0aW9uPlxuICAgICogZnVuY3Rpb24gKCkgeyBcbiAgICAqICAgdmFyIHRyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZSh0aGlzLnpvb20sIHRoaXMuem9vbSkuZ2V0SW52ZXJzZSgpO1xuICAgICogICB2YXIgbWluID0gbmV3IFZlY3RvcjIoKS5hZGQodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG4gICAgKiAgIHZhciBtYXggPSBuZXcgVmVjdG9yMih0aGlzLnNjZW5lLnNjYWxlZFdpZHRoLCB0aGlzLnNjZW5lLnNjYWxlZEhlaWdodCkuc3VidHJhY3QodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG4gICAgKiBcbiAgICAqICAgcmV0dXJuIHtcbiAgICAqICAgICBtaW5YOiBtaW4ueCxcbiAgICAqICAgICBtaW5ZOiBtaW4ueSxcbiAgICAqICAgICBtYXhYOiBtYXgueCxcbiAgICAqICAgICBtYXhZOiBtYXgueVxuICAgICogICB9XG4gICAgKiB9XG4gICAgKi9cbiAgICBnZXQgYm91bmRzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvdW5kcztcbiAgICB9XG5cbiAgICBzZXQgYm91bmRzICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9ib3VuZHMgPSAhdmFsdWUgPyBudWxsIDogdmFsdWU7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUJvdW5kcygpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNoYXNCb3VuZHNcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaGFzIGJvdW5kcyBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBoYXNCb3VuZHMgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmRzICE9PSBudWxsO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNpc1JvdGF0ZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaXMgcm90YXRlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBpc1JvdGF0ZWQgKCkge1xuICAgICAgICByZXR1cm4gKE1hdGguYWJzKHRoaXMucm90YXRpb24gLyAzNjApICUgMSkgPiAwO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNpc1pvb21lZFxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSBpcyB6b29tZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNab29tZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy56b29tICE9PSAxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNyYXdPZmZzZXRYXG4gICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIFggb2Zmc2V0IG9mIHRoZSBjYW1lcmEncyB0b3AgbGVmdCBjb3JuZXIgcmVsYXRpdmUgdG8gdGhlIHNjZW5lIHdpdGhvdXQgYW55IGVmZmVjdHMgYXBwbGllZC5cbiAgICAqL1xuICAgIGdldCByYXdPZmZzZXRYICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3T2Zmc2V0Lng7XG4gICAgfVxuICAgIFxuICAgIHNldCByYXdPZmZzZXRYICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnJhd09mZnNldC54ID0gdmFsdWU7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI3Jhd09mZnNldFlcbiAgICAqIEBwcm9wZXJ0eSB7VmVjdG9yMn0gLSBUaGUgWSBvZmZzZXQgb2YgdGhlIGNhbWVyYSdzIHRvcCBsZWZ0IGNvcm5lciByZWxhdGl2ZSB0byB0aGUgc2NlbmUgd2l0aG91dCBhbnkgZWZmZWN0cyBhcHBsaWVkLlxuICAgICovXG4gICAgZ2V0IHJhd09mZnNldFkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXdPZmZzZXQueTtcbiAgICB9XG4gICAgXG4gICAgc2V0IHJhd09mZnNldFkgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMucmF3T2Zmc2V0LnkgPSB2YWx1ZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjc2NlbmVcbiAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uU2NlbmV9IC0gVGhlIGFjdGl2ZSBzY2VuZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHNjZW5lICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NlbmVzLmFjdGl2ZVNjZW5lO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSN0cmFuc2Zvcm1hdGlvblxuICAgICogQHByb3BlcnR5IHtNYXRyaXgyfSAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBvZiB0aGUgc2NlbmUuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB0cmFuc2Zvcm1hdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4MigpLnNjYWxlKHRoaXMuem9vbSwgdGhpcy56b29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXRoaXMucm90YXRpb24pKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjem9vbVxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGFtb3VudCBvZiB6b29tLiBBIHJhdGlvIHdoZXJlIDEgPSAxMDAlLlxuICAgICogQHJlYWRvbmx5XG4gICAgKiBAZGVmYXVsdCAxXG4gICAgKi9cbiAgICBnZXQgem9vbSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl96b29tO1xuICAgIH1cbiAgICAgICAgXG4gICAgc2V0IHpvb20gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3pvb20gPSB0aGlzLl9jbGFtcFpvb20odmFsdWUpO1xuICAgICAgICB0aGlzLl91cGRhdGVCb3VuZHMoKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICogQ2xhbXBzIHRoZSBYIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSBwb3NpdGlvbi5cbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBjbGFtcGVkIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NsYW1wUG9zaXRpb25YICh4KSB7XG4gICAgICAgIGlmICh0aGlzLl9ib3VuZHMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHggPSBjbGFtcCh4LCB0aGlzLm1pblBvc2l0aW9uWCwgdGhpcy5tYXhQb3NpdGlvblgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbGFtcHMgdGhlIFkgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIHBvc2l0aW9uLlxuICAgICogQHJldHVybnMge251bWJlcn0gVGhlIGNsYW1wZWQgcG9zaXRpb24uXG4gICAgKi9cbiAgICBfY2xhbXBQb3NpdGlvblkgKHkpIHtcbiAgICAgICAgaWYgKHRoaXMuX2JvdW5kcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgeSA9IGNsYW1wKHksIHRoaXMubWluUG9zaXRpb25ZLCB0aGlzLm1heFBvc2l0aW9uWSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB5O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsYW1wcyB0aGUgem9vbS5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBUaGUgem9vbS5cbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBjbGFtcGVkIHpvb20uXG4gICAgKi9cbiAgICBfY2xhbXBab29tICh6b29tKSB7XG4gICAgICAgIHJldHVybiBjbGFtcCh6b29tLCB0aGlzLm1pblpvb20sIHRoaXMubWF4Wm9vbSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29udmVydHMgYSBGT1YgcG9zaXRpb24gdG8gYSBzY2VuZSBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFGT1ZQb3NpdGlvbiAtIFRoZSBwb2ludCBpbiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFQb3NpdGlvbiAtIFRoZSBjYW1lcmEncyBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhQ2VudGVyIC0gVGhlIGNlbnRlciBvZiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSB0cmFuc2Zvcm1hdGlvbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIHNjZW5lIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NvbnZlcnRGT1ZQb3NpdGlvblRvU2NlbmVQb3NpdGlvbiAoY2FtZXJhRk9WUG9zaXRpb24sIGNhbWVyYVBvc2l0aW9uLCBjYW1lcmFDZW50ZXIsIHRyYW5zZm9ybWF0aW9uKSB7XG4gICAgICAgIHJldHVybiBjYW1lcmFQb3NpdGlvbi5jbG9uZSgpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbikuc3VidHJhY3QoY2FtZXJhQ2VudGVyLmNsb25lKCkuc3VidHJhY3QoY2FtZXJhRk9WUG9zaXRpb24pKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24uZ2V0SW52ZXJzZSgpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb252ZXJ0cyBhIHNjZW5lIHBvc2l0aW9uIHRvIGEgRk9WIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHNjZW5lUG9zaXRpb24gLSBUaGUgcmF3IHBvaW50IG9uIHRoZSBzY2VuZS5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhUG9zaXRpb24gLSBUaGUgY2FtZXJhJ3MgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUNlbnRlciAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gdHJhbnNmb3JtYXRpb24gLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBGT1YgcG9zaXRpb24uXG4gICAgKi9cbiAgICBfY29udmVydFNjZW5lUG9zaXRpb25Ub0ZPVlBvc2l0aW9uIChzY2VuZVBvc2l0aW9uLCBjYW1lcmFQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICByZXR1cm4gY2FtZXJhQ2VudGVyLmNsb25lKCkuYWRkKHNjZW5lUG9zaXRpb24uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KGNhbWVyYVBvc2l0aW9uLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENvbnZlcnRzIGEgc2NlbmUgcG9zaXRpb24gbG9jYXRlZCBhdCBhIEZPViBwb3NpdGlvbiB0byBhIGNhbWVyYSBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBzY2VuZVBvc2l0aW9uIC0gVGhlIHJhdyBwb2ludCBvbiB0aGUgc2NlbmUuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUZPVlBvc2l0aW9uIC0gVGhlIHBvaW50IGluIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUNlbnRlciAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdHJhbnNmb3JtT3JpZ2luIC0gVGhlIHRyYW5zZm9ybSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHRyYW5zZm9ybWF0aW9uIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgY2FtZXJhIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NvbnZlcnRTY2VuZVBvc2l0aW9uVG9DYW1lcmFQb3NpdGlvbiAoc2NlbmVQb3NpdGlvbiwgY2FtZXJhRk9WUG9zaXRpb24sIGNhbWVyYUNlbnRlciwgdHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICB2YXIgdHJhbnNmb3JtT3JpZ2luT2Zmc2V0ID0gdGhpcy5fZ2V0VHJhbnNmb3JtT3JpZ2luT2Zmc2V0KHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gc2NlbmVQb3NpdGlvbi5jbG9uZSgpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbikuc3VidHJhY3QodHJhbnNmb3JtT3JpZ2luT2Zmc2V0KS5zdWJ0cmFjdChjYW1lcmFGT1ZQb3NpdGlvbik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnZlcnRPZmZzZXRUb1Bvc2l0aW9uKG9mZnNldCwgY2FtZXJhQ2VudGVyLCB0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb252ZXJ0cyBhIGNhbWVyYSBvZmZzZXQgdG8gYSBjYW1lcmEgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhT2Zmc2V0IC0gVGhlIGNhbWVyYSdzIG9mZnNldCBvbiB0aGUgc2NlbmUuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUNlbnRlciAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdHJhbnNmb3JtT3JpZ2luIC0gVGhlIHRyYW5zZm9ybSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHRyYW5zZm9ybWF0aW9uIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgY2FtZXJhIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NvbnZlcnRPZmZzZXRUb1Bvc2l0aW9uIChjYW1lcmFPZmZzZXQsIGNhbWVyYUNlbnRlciwgdHJhbnNmb3JtT3JpZ2luLCB0cmFuc2Zvcm1hdGlvbikge1xuICAgICAgICB2YXIgdHJhbnNmb3JtT3JpZ2luT2Zmc2V0ID0gdGhpcy5fZ2V0VHJhbnNmb3JtT3JpZ2luT2Zmc2V0KHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pO1xuXG4gICAgICAgIHJldHVybiBjYW1lcmFPZmZzZXQuY2xvbmUoKS5hZGQodHJhbnNmb3JtT3JpZ2luT2Zmc2V0KS5hZGQoY2FtZXJhQ2VudGVyKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24uZ2V0SW52ZXJzZSgpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb252ZXJ0cyBhIGNhbWVyYSBwb3NpdGlvbiB0byBhIGNhbWVyYSBvZmZzZXQuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhUG9zaXRpb24gLSBUaGUgY2FtZXJhJ3MgcG9zaXRpb24gb24gdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFDZW50ZXIgLSBUaGUgY2VudGVyIG9mIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHRyYW5zZm9ybU9yaWdpbiAtIFRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSB0cmFuc2Zvcm1hdGlvbiAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIGNhbWVyYSBvZmZzZXQuXG4gICAgKi9cbiAgICBfY29udmVydFBvc2l0aW9uVG9PZmZzZXQgKGNhbWVyYVBvc2l0aW9uLCBjYW1lcmFDZW50ZXIsIHRyYW5zZm9ybU9yaWdpbiwgdHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybU9yaWdpbk9mZnNldCA9IHRoaXMuX2dldFRyYW5zZm9ybU9yaWdpbk9mZnNldCh0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKTtcblxuICAgICAgICByZXR1cm4gY2FtZXJhUG9zaXRpb24uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KHRyYW5zZm9ybU9yaWdpbk9mZnNldCkuc3VidHJhY3QoY2FtZXJhQ2VudGVyKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIHRoZSBvZmZzZXQgb2YgdGhlIHRyYW5zZm9ybSBvcmlnaW4uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdHJhbnNmb3JtT3JpZ2luIC0gVGhlIHRyYW5zZm9ybWF0aW9uIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gdHJhbnNmb3JtYXRpb24gLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBvZmZzZXQuXG4gICAgKi9cbiAgICBfZ2V0VHJhbnNmb3JtT3JpZ2luT2Zmc2V0ICh0cmFuc2Zvcm1PcmlnaW4sIHRyYW5zZm9ybWF0aW9uKSB7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1PcmlnaW4uY2xvbmUoKS50cmFuc2Zvcm0odHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KHRyYW5zZm9ybU9yaWdpbik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmVzZXRzIHRoZSBjYW1lcmEgdG8gdGhlIGRlZmF1bHQgc3RhdGUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIF9yZXNldCAoKSB7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtT3JpZ2luLnNldCgwLCAwKTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IDA7XG4gICAgICAgIHRoaXMuem9vbSA9IDE7XG4gICAgICAgIHRoaXMuX3Jhc3RlclNjYWxlID0gMTtcbiAgICAgICAgdGhpcy5zZXRSYXdQb3NpdGlvbihuZXcgVmVjdG9yMih0aGlzLndpZHRoICogMC41LCB0aGlzLmhlaWdodCAqIDAuNSkpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogVXBkYXRlcyB0aGUgYm91bmRzLlxuICAgICpcbiAgICAqIHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIF91cGRhdGVCb3VuZHMgKCkgeyBcbiAgICAgICAgdmFyIGJvdW5kcztcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnNjZW5lKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYm91bmRzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYm91bmRzID0ge1xuICAgICAgICAgICAgICAgICAgICBtaW5YOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBtaW5ZOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBtYXhYOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBtYXhZOiBudWxsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fYm91bmRzKSkge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHRoaXMuX2JvdW5kcy5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYm91bmRzID0gdGhpcy5fYm91bmRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLm1pblBvc2l0aW9uWCA9IGJvdW5kcy5taW5YO1xuICAgICAgICAgICAgdGhpcy5taW5Qb3NpdGlvblkgPSBib3VuZHMubWluWTtcbiAgICAgICAgICAgIHRoaXMubWF4UG9zaXRpb25YID0gYm91bmRzLm1heFg7XG4gICAgICAgICAgICB0aGlzLm1heFBvc2l0aW9uWSA9IGJvdW5kcy5tYXhZO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNBbmltYXRpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJhd1Bvc2l0aW9uKHRoaXMuX2NvbnZlcnRPZmZzZXRUb1Bvc2l0aW9uKHRoaXMucmF3T2Zmc2V0LCB0aGlzLmNlbnRlciwgdGhpcy50cmFuc2Zvcm1PcmlnaW4sIHRoaXMudHJhbnNmb3JtYXRpb24pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXBkYXRlIGJvdW5kcycpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBZGRzIGFuIGFuaW1hdGlvbiB0byB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBzZWUgT2N1bG8uQW5pbWF0aW9uTWFuYWdlci5hZGRcbiAgICAqIHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGFkZEFuaW1hdGlvbiAobmFtZSwgYW5pbWF0aW9uKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQobmFtZSwgYW5pbWF0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgYW4gYW5pbWF0aW9uLlxuICAgICpcbiAgICAqIEBzZWUgT2N1bG8uQW5pbWF0aW9uTWFuYWdlci5nZXRcbiAgICAqL1xuICAgIGdldEFuaW1hdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbmltYXRpb25zLmdldChuYW1lKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBZGRzIGEgc2NlbmUgdG8gdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLlNjZW5lTWFuYWdlci5hZGRcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBhZGRTY2VuZSAobmFtZSwgc2NlbmUpIHtcbiAgICAgICAgdGhpcy5zY2VuZXMuYWRkKG5hbWUsIHNjZW5lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgYSBzY2VuZS5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLlNjZW5lTWFuYWdlci5nZXRcbiAgICAqL1xuICAgIGdldFNjZW5lIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjZW5lcy5nZXQobmFtZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgYWN0aXZlIHNjZW5lLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHNjZW5lLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFNjZW5lIChuYW1lKSB7XG4gICAgICAgIHRoaXMuc2NlbmVzLnNldEFjdGl2ZVNjZW5lKG5hbWUpO1xuICAgICAgICB0aGlzLl9yZXNldCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBjYW1lcmEgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBpZiAodGhpcy52aWV3ICYmIHRoaXMudmlldy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLnZpZXcgPSBudWxsO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5zY2VuZXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuX2V2ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIGRyYWctdG8tbW92ZS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGlzYWJsZURyYWdUb01vdmUgKCkge1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5kaXNhYmxlRHJhZygpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBFbmFibGVzIGRyYWctdG8tbW92ZS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlRHJhZ1RvTW92ZSAoKSB7XG4gICAgICAgIHRoaXMudHJhY2tDb250cm9sLmVuYWJsZURyYWcoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyB3aGVlbC10by16b29tLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlV2hlZWxUb1pvb20gKCkge1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5kaXNhYmxlV2hlZWwoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyB3aGVlbC10by16b29tLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBlbmFibGVXaGVlbFRvWm9vbSAoKSB7XG4gICAgICAgIHRoaXMudHJhY2tDb250cm9sLmVuYWJsZVdoZWVsKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FtZXJhIGhhcyBiZWVuIGluaXRpYWxpemVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gVGhlIG9wdGlvbnMgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvciB3aGVuIHRoZSBjYW1lcmEgd2FzIGNyZWF0ZWQuXG4gICAgKi9cbiAgICBvbkluaXRpYWxpemUgKG9wdGlvbnMpIHtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxsZWQgYmVmb3JlIHRoZSBjYW1lcmEgaGFzIHJlbmRlcmVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqL1xuICAgIG9uQmVmb3JlUmVuZGVyICgpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICogQ2FsbGVkIGFmdGVyIHRoZSBjYW1lcmEgaGFzIHJlbmRlcmVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBhIG5vLW9wLiBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHdpdGggeW91ciBvd24gY29kZS5cbiAgICAqL1xuICAgIG9uUmVuZGVyICgpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICogUmVuZGVyIHRoZSBjYW1lcmEgdmlldy4gSWYgeW91IG5lZWQgdG8gbWFuaXB1bGF0ZSBob3cgdGhlIGNhbWVyYSByZW5kZXJzLCB1c2Uge0BsaW5rIENhbWVyYSNvbkJlZm9yZVJlbmRlcnxvbkJlZm9yZVJlbmRlcn0gYW5kIHtAbGluayBDYW1lcmEjb25SZW5kZXJ8b25SZW5kZXJ9LlxuICAgICpcbiAgICAqIEByZXR1cm5zIHtDYW1lcmF9IFRoZSB2aWV3LlxuICAgICovXG4gICAgcmVuZGVyICgpIHtcbiAgICAgICAgdGhpcy5vbkJlZm9yZVJlbmRlcigpO1xuXG4gICAgICAgIGlmICghdGhpcy5pc1JlbmRlcmVkKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlclNpemUoKTtcbiAgICAgICAgICAgIHRoaXMuaXNSZW5kZXJlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKCk7XG4gICAgICAgIHRoaXMub25SZW5kZXIoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHBvc2l0aW9uIC0gVGhlIG5ldyBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5mb3JjZUJvdW5kcyAtIFdoZXRoZXIgdG8gZW5mb3JjZSBib3VuZHMgb3Igbm90LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFBvc2l0aW9uIChwb3NpdGlvbiwgZW5mb3JjZUJvdW5kcyA9IHRydWUpIHtcbiAgICAgICAgaWYgKGVuZm9yY2VCb3VuZHMpIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24uc2V0KHRoaXMuX2NsYW1wUG9zaXRpb25YKHBvc2l0aW9uLngpLCB0aGlzLl9jbGFtcFBvc2l0aW9uWShwb3NpdGlvbi55KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLnNldChwb3NpdGlvbi54LCBwb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgcmF3IHBvc2l0aW9uIGFuZCB1cGRhdGVzIGRlcGVuZGVudCBkYXRhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gcG9zaXRpb24gLSBUaGUgbmV3IHBvc2l0aW9uLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFJhd1Bvc2l0aW9uIChwb3NpdGlvbikge1xuICAgICAgICB0aGlzLnJhd1Bvc2l0aW9uLnNldCh0aGlzLl9jbGFtcFBvc2l0aW9uWChwb3NpdGlvbi54KSwgdGhpcy5fY2xhbXBQb3NpdGlvblkocG9zaXRpb24ueSkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLmNvcHkodGhpcy5yYXdQb3NpdGlvbik7XG4gICAgICAgIHRoaXMucmF3T2Zmc2V0LmNvcHkodGhpcy5fY29udmVydFBvc2l0aW9uVG9PZmZzZXQodGhpcy5yYXdQb3NpdGlvbiwgdGhpcy5jZW50ZXIsIHRoaXMudHJhbnNmb3JtT3JpZ2luLCB0aGlzLnRyYW5zZm9ybWF0aW9uKSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBzaXplIG9mIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSB3aWR0aCAtIFRoZSB3aWR0aC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gaGVpZ2h0IC0gVGhlIGhlaWdodC5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRTaXplICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBoYXNDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzTmlsKHdpZHRoKSAmJiAod2lkdGggIT09IHRoaXMud2lkdGgpKSB7XG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICB0aGlzLmNlbnRlci54ID0gd2lkdGggKiAwLjU7XG4gICAgICAgICAgICBoYXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc05pbChoZWlnaHQpICYmIChoZWlnaHQgIT09IHRoaXMuaGVpZ2h0KSkge1xuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLmNlbnRlci55ID0gaGVpZ2h0ICogMC41O1xuICAgICAgICAgICAgaGFzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChoYXNDaGFuZ2VkKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlclNpemUoKTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5lbWl0KCdjaGFuZ2U6c2l6ZScpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB0cmFuc2Zvcm1PcmlnaW4uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gb3JpZ2luIC0gVGhlIG9yaWdpbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRUcmFuc2Zvcm1PcmlnaW4gKG9yaWdpbikge1xuICAgICAgICBpZiAob3JpZ2luICYmICFvcmlnaW4uZXF1YWxzKHRoaXMudHJhbnNmb3JtT3JpZ2luKSkge1xuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1PcmlnaW4uY29weShvcmlnaW4pO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc1JvdGF0ZWQgfHwgdGhpcy5pc1pvb21lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmF3T2Zmc2V0LmNvcHkodGhpcy5fY29udmVydFBvc2l0aW9uVG9PZmZzZXQodGhpcy5yYXdQb3NpdGlvbiwgdGhpcy5jZW50ZXIsIHRoaXMudHJhbnNmb3JtT3JpZ2luLCB0aGlzLnRyYW5zZm9ybWF0aW9uKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhdXNlcyB0aGUgY2FtZXJhIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwYXVzZSAoKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wYXVzZSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUGxheXMgdGhlIGNhbWVyYSBhbmltYXRpb24gZm9yd2FyZCBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHBsYXkgKGFuaW1hdGlvbikge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb24pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlc3VtZXMgcGxheWluZyB0aGUgY2FtZXJhIGFuaW1hdGlvbiBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlc3VtZSAoKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5yZXN1bWUoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZXZlcnNlcyBwbGF5YmFjayBvZiBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24uIElmIG5vbmUgaXMgc3BlY2lmaWVkLCB0aGUgY3VycmVudCBhbmltYXRpb24gd2lsbCBiZSByZXZlcnNlZC5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZXZlcnNlIChuYW1lKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5yZXZlcnNlKG5hbWUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSBhbmltYXRlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNhbmltYXRlfEFuaW1hdGlvbi5hbmltYXRlfVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGFuaW1hdGUgKHByb3BzLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLmFuaW1hdGUocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgbW92ZSB0byBhIHNwZWNpZmljIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jbW92ZVRvfEFuaW1hdGlvbi5tb3ZlVG99XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgbW92ZVRvIChwb3NpdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS5tb3ZlVG8ocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgcm90YXRlIGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNyb3RhdGVBdHxBbmltYXRpb24ucm90YXRlQXR9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcm90YXRlQXQgKG9yaWdpbiwgcm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcykucm90YXRlQXQob3JpZ2luLCByb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSByb3RhdGUgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNyb3RhdGVUb3xBbmltYXRpb24ucm90YXRlVG99XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcm90YXRlVG8gKHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLnJvdGF0ZVRvKHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHNoYWtlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNzaGFrZXxBbmltYXRpb24uc2hha2V9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgc2hha2UgKGludGVuc2l0eSwgZHVyYXRpb24sIGRpcmVjdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLnNoYWtlKGludGVuc2l0eSwgZHVyYXRpb24sIGRpcmVjdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHpvb20gaW4vb3V0IGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiN6b29tQXR8QW5pbWF0aW9uLnpvb21BdH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICB6b29tQXQgKG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS56b29tQXQob3JpZ2luLCB6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHpvb20gaW4vb3V0IGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIENhbWVyYS5BbmltYXRpb24jem9vbVRvfEFuaW1hdGlvbi56b29tVG99XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgem9vbVRvICh6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLnpvb21Ubyh6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5DYW1lcmEuYm91bmRzID0ge1xuICAgIE5PTkU6IG51bGwsXG4gICAgV09STEQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZSh0aGlzLnpvb20sIHRoaXMuem9vbSkuZ2V0SW52ZXJzZSgpO1xuICAgICAgICB2YXIgbWluID0gbmV3IFZlY3RvcjIoKS5hZGQodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIHZhciBtYXggPSBuZXcgVmVjdG9yMih0aGlzLnNjZW5lLnNjYWxlZFdpZHRoLCB0aGlzLnNjZW5lLnNjYWxlZEhlaWdodCkuc3VidHJhY3QodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pblg6IG1pbi54LFxuICAgICAgICAgICAgbWluWTogbWluLnksXG4gICAgICAgICAgICBtYXhYOiBtYXgueCxcbiAgICAgICAgICAgIG1heFk6IG1heC55XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBXT1JMRF9FREdFOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5YOiAwLFxuICAgICAgICAgICAgbWluWTogMCxcbiAgICAgICAgICAgIG1heFg6IHRoaXMuc2NlbmUud2lkdGgsXG4gICAgICAgICAgICBtYXhZOiB0aGlzLnNjZW5lLmhlaWdodFxuICAgICAgICB9O1xuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBDYW1lcmE7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbi8qKlxuKiBPYmplY3QgdHlwZXMuXG4qIEBlbnVtIHtudW1iZXJ9XG4qL1xuZXhwb3J0IGNvbnN0IFR5cGUgPSB7XG4gICAgQU5JTUFUSU9OOiAwXG59XG5cbi8qKlxuKiBab29tIGRpcmVjdGlvbi5cbiogQGVudW0ge251bWJlcn1cbiovXG5leHBvcnQgY29uc3Qgem9vbURpcmVjdGlvbiA9IHtcbiAgICBOT05FOiAwLFxuICAgIElOOiAxLFxuICAgIE9VVDogLTFcbn07IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCByb3VuZCAgICAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvcm91bmQnO1xuaW1wb3J0IHsgem9vbURpcmVjdGlvbiB9ICAgIGZyb20gJy4vY29uc3RhbnRzJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLkNTU1JlbmRlcmVyXG4qIEBjb25zdHJ1Y3RvclxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlSZW5kZXJlciA9IG5ldyBDU1NSZW5kZXJlcihteUNhbWVyYSk7XG4qL1xuY2xhc3MgQ1NTUmVuZGVyZXIge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IC0gVGhlIGNhbWVyYS5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIHJlbmRlcmVyIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmVuZGVyIHRoZSBzY2VuZS5cbiAgICAqXG4gICAgKiByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZW5kZXIgKCkge1xuICAgICAgICBpZiAodGhpcy5jYW1lcmEuc2NlbmUgJiYgdGhpcy5jYW1lcmEuc2NlbmVzLnZpZXcpIHtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNhbWVyYS5fY29udmVydFBvc2l0aW9uVG9PZmZzZXQodGhpcy5jYW1lcmEucG9zaXRpb24sIHRoaXMuY2FtZXJhLmNlbnRlciwgdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLCB0aGlzLmNhbWVyYS50cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgICAgICB2YXIgcmFzdGVySW5jcmVtZW50ID0gMC4zO1xuICAgICAgICAgICAgdmFyIHNjYWxlTGV2ZWwgPSBNYXRoLmZsb29yKHRoaXMuY2FtZXJhLnpvb20pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDb250cm9sIHJhc3Rlcml6YXRpb24gdG8gbWFpbnRhaW4gY2xhcml0eSB3aGVuIHpvb21pbmdcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS56b29tID09PSB0aGlzLmNhbWVyYS5tYXhab29tIHx8ICh0aGlzLmNhbWVyYS56b29tRGlyZWN0aW9uID09PSB6b29tRGlyZWN0aW9uLklOICYmIHRoaXMuY2FtZXJhLnpvb20gPiB0aGlzLmNhbWVyYS5fcmFzdGVyU2NhbGUgKyByYXN0ZXJJbmNyZW1lbnQgKiBzY2FsZUxldmVsKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5fcmFzdGVyU2NhbGUgPSB0aGlzLmNhbWVyYS56b29tO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3LnN0eWxlLndpbGxDaGFuZ2UgPSAnYXV0byc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5zY2VuZXMudmlldy5zdHlsZS53aWxsQ2hhbmdlID0gJ3RyYW5zZm9ybSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNjZW5lLnZpZXcuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbiAgICAgICAgICAgIFR3ZWVuTGl0ZS5zZXQodGhpcy5jYW1lcmEuc2NlbmVzLnZpZXcsIHsgXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU9yaWdpbjogdGhpcy5jYW1lcmEudHJhbnNmb3JtT3JpZ2luLnggKyAncHggJyArIHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi55ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVYOiB0aGlzLmNhbWVyYS56b29tLFxuICAgICAgICAgICAgICAgICAgICBzY2FsZVk6IHRoaXMuY2FtZXJhLnpvb20sXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiAtdGhpcy5jYW1lcmEucm90YXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHg6IC1vZmZzZXQueCxcbiAgICAgICAgICAgICAgICAgICAgeTogLW9mZnNldC55XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSZW5kZXIgdGhlIGRpbWVuc2lvbnMvc2l6ZS5cbiAgICAqXG4gICAgKiByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZW5kZXJTaXplICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FtZXJhLnZpZXcpIHtcbiAgICAgICAgICAgIFR3ZWVuTGl0ZS5zZXQodGhpcy5jYW1lcmEudmlldywgeyBcbiAgICAgICAgICAgICAgICBjc3M6IHsgXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5jYW1lcmEuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogdGhpcy5jYW1lcmEud2lkdGhcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ1NTUmVuZGVyZXI7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbi8qKlxuKiBHU0FQJ3MgRHJhZ2dhYmxlLlxuKiBAZXh0ZXJuYWwgRHJhZ2dhYmxlXG4qIEBzZWUgaHR0cDovL2dyZWVuc29jay5jb20vZG9jcy8jL0hUTUw1L0dTQVAvVXRpbHMvRHJhZ2dhYmxlL1xuKi9cblxuaW1wb3J0IFV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uRHJhZ0NvbnRyb2xcbiogQGNvbnN0cnVjdG9yXG4qIEByZXF1aXJlcyB7QGxpbmsgZXh0ZXJuYWw6RHJhZ2dhYmxlfVxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSB0YXJnZXQgLSBUaGUgdGFyZ2V0LlxuKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gW29wdGlvbnMuZHJhZ1Byb3h5XSAtIFRoZSBlbGVtZW50IHRoYXQgY29udHJvbHMvaW5pdGlhdGVzIHRoZSBkcmFnIGV2ZW50cy5cbiogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMub25EcmFnXSAtIFRoZSBmdW5jdGlvbiB0byBjYWxsIGV2ZXJ5IHRpbWUgdGhlIGRyYWcgZXZlbnQgb2NjdXJzLlxuKiBAcGFyYW0ge2FycmF5fSBbb3B0aW9ucy5vbkRyYWdQYXJhbXNdIC0gVGhlIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgY2FsbGJhY2suXG4qIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5vbkRyYWdTY29wZV0gLSBXaGF0ICd0aGlzJyByZWZlcnMgdG8gaW5zaWRlIHRoZSBjYWxsYmFjay5cbipcbiogQGV4YW1wbGVcbiogdmFyIG15RHJhZ0NvbnRyb2wgPSBuZXcgT2N1bG8uRHJhZ0NvbnRyb2woJyNzY2VuZScsIHsgIFxuKiAgIG9uRHJhZzogZnVuY3Rpb24gKCkgeyBcbiogICAgIGNvbnNvbGUubG9nKCdkcmFnZ2luZycpOyBcbiogICB9XG4qIH0pO1xuKi9cbmNsYXNzIERyYWdDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvciAodGFyZ2V0LCB7XG4gICAgICAgIGRyYWdQcm94eSA9IHRhcmdldCxcbiAgICAgICAgb25EcmFnID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG9uRHJhZ1BhcmFtcyA9IFtdLFxuICAgICAgICBvbkRyYWdTY29wZSA9IHRoaXNcbiAgICB9ID0ge30pIHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtvYmplY3R9IC0gVGhlIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0geyBkcmFnUHJveHksIG9uRHJhZywgb25EcmFnUGFyYW1zLCBvbkRyYWdTY29wZSB9O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtEcmFnZ2FibGV9IC0gVGhlIG9iamVjdCB0aGF0IGhhbmRsZXMgdGhlIGRyYWcgYmVoYXZpb3IuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29udHJvbCA9IG5ldyBEcmFnZ2FibGUodGFyZ2V0LCB7XG4gICAgICAgICAgICBjYWxsYmFja1Njb3BlOiBvbkRyYWdTY29wZSxcbiAgICAgICAgICAgIG9uRHJhZzogb25EcmFnLFxuICAgICAgICAgICAgb25EcmFnUGFyYW1zOiBvbkRyYWdQYXJhbXMsXG4gICAgICAgICAgICB6SW5kZXhCb29zdDogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge0VsZW1lbnR9IC0gVGhlIGVsZW1lbnQgdGhhdCBjb250cm9scy9pbml0aWF0ZXMgdGhlIGRyYWcgZXZlbnRzLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYWdQcm94eSA9IFV0aWxzLkRPTS5wYXJzZVZpZXcoZHJhZ1Byb3h5KTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGl0IGlzIGRyYWdnaW5nIG9yIG5vdC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgcHJlc3NlZCBvciBub3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNQcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uRHJhZ3N0YXJ0ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25EcmFnUmVsZWFzZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZW5kRHJhZyhldmVudCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkRyYWdMZWF2ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZW5kRHJhZyhldmVudCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkRyYWdNb3ZlID0gKGV2ZW50KSA9PiB7IFxuICAgICAgICAgICAgaWYgKHRoaXMuaXNQcmVzc2VkICYmICF0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2wuc3RhcnREcmFnKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZW5kRHJhZyA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbC5lbmREcmFnKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuX29uRHJhZ0xlYXZlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbkRyYWdNb3ZlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5fb25EcmFnTW92ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uUHJlc3MgPSAoZXZlbnQpID0+IHsgXG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5fb25EcmFnTGVhdmUpO1xuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fb25EcmFnTW92ZSk7XG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuX29uRHJhZ01vdmUpO1xuICAgICAgICAgICAgdGhpcy5pc1ByZXNzZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25SZWxlYXNlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZWxlYXNlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkxlYXZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZWxlYXNlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9yZWxlYXNlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pc1ByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW5hYmxlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciBpdCBpcyBlbmFibGVkIG9yIG5vdC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IGVuYWJsZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLmVuYWJsZWQoKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge09iamVjdH0gLSBUaGUgbGFzdCBwb2ludGVyIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgcG9pbnRlckV2ZW50ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC5wb2ludGVyRXZlbnQ7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIHggcG9zaXRpb24gb2YgdGhlIGxhc3QgcG9pbnRlciBldmVudCB0aGF0IGFmZmVjdGVkIHRoZSBpbnN0YW5jZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHBvaW50ZXJYICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC5wb2ludGVyWDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgeSBwb3NpdGlvbiBvZiB0aGUgbGFzdCBwb2ludGVyIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgcG9pbnRlclkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnBvaW50ZXJZO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdGFyZ2V0LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgdGFyZ2V0ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbC50YXJnZXQ7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGN1cnJlbnQgeCBwb3NpdGlvbi5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLng7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGN1cnJlbnQgeSBwb3NpdGlvbi5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIGNvbnRyb2wgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgICAgdGhpcy5jb250cm9sLmtpbGwoKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSB7fTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgdGhlIGNvbnRyb2wuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGUgKCkge1xuICAgICAgICB0aGlzLmNvbnRyb2wuZGlzYWJsZSgpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLl9vbkRyYWdzdGFydCk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uUHJlc3MpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuX29uTGVhdmUpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fb25QcmVzcyk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5zdHlsZS5jdXJzb3IgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEVuYWJsZXMgdGhlIGNvbnRyb2wuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZSAoKSB7XG4gICAgICAgIHRoaXMuY29udHJvbC5lbmFibGUoKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnc3RhcnQpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vblByZXNzKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLl9vbkxlYXZlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX29uUHJlc3MpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuc3R5bGUuY3Vyc29yID0gJ21vdmUnO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBVcGRhdGVzIHRoZSBjb250cm9sJ3MgeCBhbmQgeSBwcm9wZXJ0aWVzIHRvIHJlZmxlY3QgdGhlIHRhcmdldCdzIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICB1cGRhdGUgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnVwZGF0ZSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRHJhZ0NvbnRyb2w7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiogQSBjb2xsZWN0aW9uIG9mIHVzZWZ1bCBtYXRoZW1hdGljYWwgdmFsdWVzIGFuZCBmdW5jdGlvbnMuXG4qXG4qIEBuYW1lc3BhY2UgT2N1bG8uTWF0aFxuKi9cbmNvbnN0IF9NYXRoID0ge1xuICAgIC8qKlxuICAgICogQ29udmVydCBkZWdyZWVzIHRvIHJhZGlhbnMuXG4gICAgKlxuICAgICogQGZ1bmN0aW9uIE9jdWxvLk1hdGgjZGVnVG9SYWRcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZWdyZWVzIC0gVGhlIGRlZ3JlZXMgdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gVGhlIHZhbHVlIGluIHJhZGlhbnMuXG4gICAgKi9cbiAgICBkZWdUb1JhZDogKGRlZ3JlZXMpID0+IHtcbiAgICAgICAgcmV0dXJuIGRlZ3JlZXMgKiBfTWF0aC5kZWdUb1JhZEZhY3RvcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgKiBDb252ZXJ0IHJhZGlhbnMgdG8gZGVncmVlcy5cbiAgICAqXG4gICAgKiBAZnVuY3Rpb24gT2N1bG8uTWF0aCNyYWRUb0RlZ1xuICAgICogQHBhcmFtIHtudW1iZXJ9IHJhZGlhbnMgLSBUaGUgcmFkaWFucyB2YWx1ZS5cbiAgICAqIEByZXR1cm4ge251bWJlcn0gLSBUaGUgdmFsdWUgaW4gZGVncmVlcy5cbiAgICAqL1xuICAgIHJhZFRvRGVnOiAocmFkaWFucykgPT4ge1xuICAgICAgICByZXR1cm4gcmFkaWFucyAqIF9NYXRoLnJhZFRvRGVnRmFjdG9yO1xuICAgIH1cbn07XG5cbi8qKlxuKiBUaGUgZmFjdG9yIHVzZWQgdG8gY29udmVydCBkZWdyZWVzIHRvIHJhZGlhbnMuXG4qXG4qIEBuYW1lIE9jdWxvLk1hdGgjZGVnVG9SYWRGYWN0b3JcbiogQHByb3BlcnR5IHtudW1iZXJ9XG4qIEBzdGF0aWNcbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoX01hdGgsICdkZWdUb1JhZEZhY3RvcicsIHtcbiAgICB2YWx1ZTogTWF0aC5QSSAvIDE4MFxufSk7XG5cbi8qKlxuKiBUaGUgZmFjdG9yIHVzZWQgdG8gY29udmVydCByYWRpYW5zIHRvIGRlZ3JlZXMuXG4qXG4qIEBuYW1lIE9jdWxvLk1hdGgjcmFkVG9EZWdGYWN0b3JcbiogQHByb3BlcnR5IHtudW1iZXJ9XG4qIEBzdGF0aWNcbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoX01hdGgsICdyYWRUb0RlZ0ZhY3RvcicsIHtcbiAgICB2YWx1ZTogMTgwIC8gTWF0aC5QSVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IF9NYXRoOyIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGlzQXJyYXlMaWtlIGZyb20gJ2xvZGFzaC9pc0FycmF5TGlrZSc7XG5cbi8qKlxuKiBDcmVhdGUgMngyIG1hdHJpeCBmcm9tIGEgc2VyaWVzIG9mIHZhbHVlcy5cbiogXG4qIFJlcHJlc2VudGVkIGxpa2U6XG4qIFxuKiB8IGUxMSB8IGUxMiB8XG4qIHwgZTIxIHwgZTIyIHxcbipcbiogQGNsYXNzIE9jdWxvLk1hdHJpeDJcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7bnVtYmVyfSBlMTE9MSAtIFRoZSB2YWx1ZSBvZiByb3cgMSwgY29sdW1uIDFcbiogQHBhcmFtIHtudW1iZXJ9IGUxMj0wIC0gVGhlIHZhbHVlIG9mIHJvdyAxLCBjb2x1bW4gMlxuKiBAcGFyYW0ge251bWJlcn0gZTIxPTAgLSBUaGUgdmFsdWUgb2Ygcm93IDIsIGNvbHVtbiAxXG4qIEBwYXJhbSB7bnVtYmVyfSBlMjI9MSAtIFRoZSB2YWx1ZSBvZiByb3cgMiwgY29sdW1uIDJcbiovXG5jbGFzcyBNYXRyaXgyIHtcbiAgICBjb25zdHJ1Y3RvciAoZTExLCBlMTIsIGUyMSwgZTIyKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlMTFcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmUxMSA9IDE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gZTEyXG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lMTIgPSAwO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGUyMVxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZTIxID0gMDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlMjJcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmUyMiA9IDE7XG4gICAgICAgIFxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgdGhpcy5zZXQoZTExLCBlMTIsIGUyMSwgZTIyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0FycmF5TGlrZShlMTEpICYmIGUxMS5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RnJvbUFycmF5KGUxMSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbG9uZXMgdGhlIG1hdHJpeC5cbiAgICAqIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeCB0byBjbG9uZS5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IGlkZW50aWNhbCBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgY2xvbmUgKG0pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgyKE1hdHJpeDIudG9BcnJheShtKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xvbmVzIHRoZSBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBpZGVudGljYWwgbWF0cml4LlxuICAgICovXG4gICAgY2xvbmUgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5jbG9uZSh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb3BpZXMgdGhlIHZhbHVlcyBmcm9tIHRoZSBwcm92aWRlZCBtYXRyaXggaW50byB0aGlzIG1hdHJpeC5cbiAgICAqIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeCB0byBjb3B5LlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgY29weSAobSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXQobS5lMTEsIG0uZTEyLCBtLmUyMSwgbS5lMjIpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGRldGVybWluYW50LlxuICAgICoge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4IHRvIGdldCB0aGUgZGV0ZXJtaW5hbnQuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBkZXRlcm1pbmFudC5cbiAgICAqL1xuICAgIHN0YXRpYyBnZXREZXRlcm1pbmFudCAobSkge1xuICAgICAgICByZXR1cm4gbS5lMTEgKiBtLmUyMiAtIG0uZTEyICogbS5lMjE7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgZGV0ZXJtaW5hbnQuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBkZXRlcm1pbmFudC5cbiAgICAqL1xuICAgIGdldERldGVybWluYW50ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0RGV0ZXJtaW5hbnQodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgaW52ZXJzZS5cbiAgICAqIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeCB0byBnZXQgdGhlIGludmVyc2UuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBUaGUgaW52ZXJzZSBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgZ2V0SW52ZXJzZSAobSkge1xuICAgICAgICByZXR1cm4gTWF0cml4Mi5tdWx0aXBseVNjYWxhcihuZXcgTWF0cml4MihtLmUyMiwgLW0uZTEyLCAtbS5lMjEsIG0uZTExKSwgMSAvIE1hdHJpeDIuZ2V0RGV0ZXJtaW5hbnQobSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGludmVyc2UuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBUaGUgaW52ZXJzZSBtYXRyaXguXG4gICAgKi9cbiAgICBnZXRJbnZlcnNlICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0SW52ZXJzZSh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIHR3byBtYXRyaWNlcy5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gYSAtIEEgbWF0cml4LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBiIC0gQW5vdGhlciBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBtYXRyaXggdGhhdCBpcyB0aGUgcHJvZHVjdCBvZiB0aGUgcHJvdmlkZWQgbWF0cmljZXMuXG4gICAgKi8vKipcbiAgICAqIE11bHRpcGxpZXMgYSBsaXN0IG9mIG1hdHJpY2VzLlxuICAgICogQHBhcmFtIHtBcnJheX0gbSAtIEEgbGlzdCBvZiBtYXRyaWNlcy5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IG1hdHJpeCB0aGF0IGlzIHRoZSBwcm9kdWN0IG9mIHRoZSBwcm92aWRlZCBtYXRyaWNlcy5cbiAgICAqL1xuICAgIHN0YXRpYyBtdWx0aXBseU1hdHJpY2VzIChhLCBiKSB7XG4gICAgICAgIGlmIChhLmNvbHMgPT09IGIucm93cykge1xuICAgICAgICAgICAgbGV0IG4xMSwgbjEyLCBuMjEsIG4yMjtcbiAgICAgICAgIFxuICAgICAgICAgICAgbjExID0gYS5lMTEgKiBiLmUxMSArIGEuZTEyICogYi5lMjE7XG4gICAgICAgICAgICBuMTIgPSBhLmUxMSAqIGIuZTEyICsgYS5lMTIgKiBiLmUyMjtcbiAgICAgICAgICAgIG4yMSA9IGEuZTIxICogYi5lMTEgKyBhLmUyMiAqIGIuZTIxO1xuICAgICAgICAgICAgbjIyID0gYS5lMjEgKiBiLmUxMiArIGEuZTIyICogYi5lMjI7XG4gICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgyKG4xMSwgbjEyLCBuMjEsIG4yMik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBtdWx0aXBseSBpbmNvbXBhdGlibGUgbWF0cmljZXMnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgdGhlIG1hdHJpeCBieSBhbm90aGVyIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7TWF0cml4MnxNYXRyaXgyRH0gbSAtIEEgbWF0cml4LlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgbXVsdGlwbHlNYXRyaWNlcyAobSkge1xuICAgICAgICBpZiAodGhpcy5jb2xzID09PSBtLnJvd3MpIHtcbiAgICAgICAgICAgIGxldCBuMTEsIG4xMiwgbjIxLCBuMjI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG4xMSA9IHRoaXMuZTExICogbS5lMTEgKyB0aGlzLmUxMiAqIG0uZTIxO1xuICAgICAgICAgICAgbjEyID0gdGhpcy5lMTEgKiBtLmUxMiArIHRoaXMuZTEyICogbS5lMjI7XG4gICAgICAgICAgICBuMjEgPSB0aGlzLmUyMSAqIG0uZTExICsgdGhpcy5lMjIgKiBtLmUyMTtcbiAgICAgICAgICAgIG4yMiA9IHRoaXMuZTIxICogbS5lMTIgKyB0aGlzLmUyMiAqIG0uZTIyO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnNldChuMTEsIG4xMiwgbjIxLCBuMjIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbXVsdGlwbHkgaW5jb21wYXRpYmxlIG1hdHJpY2VzJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgYSBtYXRyaXggYnkgYSBzY2FsYXIuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHMgLSBUaGUgc2NhbGFyLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgc2NhbGVkIG1hdHJpeC5cbiAgICAqL1xuICAgIHN0YXRpYyBtdWx0aXBseVNjYWxhciAobSwgcykge1xuICAgICAgICB2YXIgZTExID0gbS5lMTEgKiBzO1xuICAgICAgICB2YXIgZTEyID0gbS5lMTIgKiBzO1xuICAgICAgICB2YXIgZTIxID0gbS5lMjEgKiBzO1xuICAgICAgICB2YXIgZTIyID0gbS5lMjIgKiBzO1xuXG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4MihlMTEsIGUxMiwgZTIxLCBlMjIpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgdGhlIG1hdHJpeCBieSBhIHNjYWxhci5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzIC0gVGhlIHNjYWxhci5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIG11bHRpcGx5U2NhbGFyIChzKSB7XG4gICAgICAgIHRoaXMuZTExICo9IHM7XG4gICAgICAgIHRoaXMuZTEyICo9IHM7XG4gICAgICAgIHRoaXMuZTIxICo9IHM7XG4gICAgICAgIHRoaXMuZTIyICo9IHM7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQXBwbGllcyBhIHJvdGF0aW9uIHRvIGEgbWF0cml4LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIFRoZSBhbmdsZSBpbiByYWRpYW5zLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgcm90YXRlZCBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgcm90YXRlIChtLCBhbmdsZSkge1xuICAgICAgICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICB2YXIgc2luID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICB2YXIgcm90YXRpb25NYXRyaXggPSBuZXcgTWF0cml4Mihjb3MsIC1zaW4sIHNpbiwgY29zKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBNYXRyaXgyLm11bHRpcGx5TWF0cmljZXMobSwgcm90YXRpb25NYXRyaXgpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJvdGF0ZXMgdGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIFRoZSBhbmdsZSBpbiByYWRpYW5zLlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcm90YXRlIChhbmdsZSkge1xuICAgICAgICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICB2YXIgc2luID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICB2YXIgcm90YXRpb25NYXRyaXggPSBuZXcgTWF0cml4Mihjb3MsIC1zaW4sIHNpbiwgY29zKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseU1hdHJpY2VzKHJvdGF0aW9uTWF0cml4KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFwcGxpZXMgYSBzY2FsZSB0cmFuc2Zvcm1hdGlvbiB0byBhIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSBhbW91bnQgdG8gc2NhbGUgb24gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIGFtb3VudCB0byBzY2FsZSBvbiB0aGUgWSBheGlzLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgc2NhbGVkIG1hdHJpeC5cbiAgICAqL1xuICAgIHN0YXRpYyBzY2FsZSAobSwgeCwgeSkge1xuICAgICAgICByZXR1cm4gTWF0cml4Mi5tdWx0aXBseU1hdHJpY2VzKG0sIG5ldyBNYXRyaXgyKHgsIDAsIDAsIHkpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTY2FsZXMgdGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIGFtb3VudCB0byBzY2FsZSBvbiB0aGUgWCBheGlzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgYW1vdW50IHRvIHNjYWxlIG9uIHRoZSBZIGF4aXMuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzY2FsZSAoeCwgeSkge1xuICAgICAgICB0aGlzLm11bHRpcGx5TWF0cmljZXMobmV3IE1hdHJpeDIoeCwgMCwgMCwgeSkpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBlMTFcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBlMTJcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBlMjFcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBlMjJcbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldCAoZTExLCBlMTIsIGUyMSwgZTIyKSB7XG4gICAgICAgIHRoaXMuZTExID0gZTExO1xuICAgICAgICB0aGlzLmUxMiA9IGUxMjtcbiAgICAgICAgdGhpcy5lMjEgPSBlMjE7XG4gICAgICAgIHRoaXMuZTIyID0gZTIyO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgbWF0cml4IGZyb20gYW4gYXJyYXkuXG4gICAgKiBAcGFyYW0ge0FycmF5fSBhIC0gVGhlIGFycmF5IG9mIG1hdHJpeCB2YWx1ZXMuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRGcm9tQXJyYXkgKGEpIHtcbiAgICAgICAgdGhpcy5zZXQoYVswXSwgYVsxXSwgYVsyXSwgYVszXSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgbWF0cml4IHRvIHRoZSBpZGVudGl0eS5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFRvSWRlbnRpdHkgKCkge1xuICAgICAgICB0aGlzLnNldCgxLCAwLCAwLCAxKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSBtYXRyaXggaW50byBhIG5ldyBhcnJheS5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKi9cbiAgICBzdGF0aWMgdG9BcnJheSAobSkge1xuICAgICAgICB2YXIgYSA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgXG4gICAgICAgIGFbMF0gPSBtLmUxMTtcbiAgICAgICAgYVsxXSA9IG0uZTEyO1xuICAgICAgICBhWzJdID0gbS5lMjE7XG4gICAgICAgIGFbM10gPSBtLmUyMjtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSBtYXRyaXggaW50byBhIG5ldyBhcnJheS5cbiAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqL1xuICAgIHRvQXJyYXkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci50b0FycmF5KHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSBtYXRyaXggaW50byBhIG5ldyBGbG9hdDMyQXJyYXkuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqL1xuICAgIHN0YXRpYyB0b0Zsb2F0MzJBcnJheSAobSkge1xuICAgICAgICB2YXIgYSA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICAgIFxuICAgICAgICBhWzBdID0gbS5lMTE7XG4gICAgICAgIGFbMV0gPSBtLmUxMjtcbiAgICAgICAgYVsyXSA9IG0uZTIxO1xuICAgICAgICBhWzNdID0gbS5lMjI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgbWF0cml4IGludG8gYSBuZXcgRmxvYXQzMkFycmF5LlxuICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqL1xuICAgIHRvRmxvYXQzMkFycmF5ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9GbG9hdDMyQXJyYXkodGhpcyk7XG4gICAgfVxufVxuXG4vKipcbiogVGhlIG51bWJlciBvZiBjb2x1bW5zLlxuKiBAbmFtZSBNYXRyaXgyI2NvbHNcbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTWF0cml4Mi5wcm90b3R5cGUsICdjb2xzJywge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6IDJcbn0pO1xuXG4vKipcbiogVGhlIG51bWJlciBvZiByb3dzLlxuKiBAbmFtZSBNYXRyaXgyI3Jvd3NcbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTWF0cml4Mi5wcm90b3R5cGUsICdyb3dzJywge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6IDJcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBNYXRyaXgyOyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4qIENyZWF0ZXMgYSAyRCB2ZWN0b3IgZnJvbSBhIHNlcmllcyBvZiB2YWx1ZXMuXG4qIFxuKiBAY2xhc3MgT2N1bG8uVmVjdG9yMlxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtudW1iZXJ9IHg9MCAtIFRoZSB4IHZhbHVlLlxuKiBAcGFyYW0ge251bWJlcn0geT0wIC0gVGhlIHkgdmFsdWUuXG4qL1xuY2xhc3MgVmVjdG9yMiB7XG4gICAgY29uc3RydWN0b3IgKHgsIHkpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHggdmFsdWUuXG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnggPSAoeCAhPT0gdW5kZWZpbmVkKSA/IHggOiAwO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHkgdmFsdWUuXG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnkgPSAoeSAhPT0gdW5kZWZpbmVkKSA/IHkgOiAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQWRkcyB0d28gdmVjdG9ycy5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYSAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gQW5vdGhlciB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgc3VtIG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICovXG4gICAgc3RhdGljIGFkZCAoYSwgYikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoYS54ICsgYi54LCBhLnkgKyBiLnkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFkZHMgYSB2ZWN0b3IgdG8gdGhlIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIGFkZCAodikge1xuICAgICAgICB0aGlzLnggKz0gdi54O1xuICAgICAgICB0aGlzLnkgKz0gdi55O1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsb25lcyB0aGUgdmVjdG9yLlxuICAgICoge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yIHRvIGNsb25lLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgaWRlbnRpY2FsIHZlY3Rvci5cbiAgICAqL1xuICAgIHN0YXRpYyBjbG9uZSAodikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIodi54LCB2LnkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsb25lcyB0aGUgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgaWRlbnRpY2FsIHZlY3Rvci5cbiAgICAqL1xuICAgIGNsb25lICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuY2xvbmUodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29waWVzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgcHJvdmlkZWQgdmVjdG9yIGludG8gdGhpcyB2ZWN0b3IuXG4gICAgKiB7VmVjdG9yMn0gdiAtIFRoZSB2ZWN0b3IgdG8gY29weS5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGNvcHkgKHYpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHYueCwgdi55KTtcbiAgICB9XG4gICAgICAgIFxuICAgIC8qKlxuICAgICogRGV0ZXJtaW5lcyBpZiB0aGUgcHJvdmlkZWQgdmVjdG9ycyBhcmUgZXF1YWwuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBUaGUgZmlyc3QgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gVGhlIHNlY29uZCB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSB2ZWN0b3JzIGFyZSBlcXVhbC5cbiAgICAqL1xuICAgIHN0YXRpYyBlcXVhbHMgKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEueCA9PT0gYi54ICYmIGEueSA9PT0gYi55O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERldGVybWluZXMgaWYgdGhlIHZlY3RvciBlcXVhbHMgdGhlIHByb3ZpZGVkIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIFRoZSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSB2ZWN0b3IgZXF1YWxzIHRoZSBwcm92aWRlZCB2ZWN0b3IuXG4gICAgKi9cbiAgICBlcXVhbHMgKHYpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZXF1YWxzKHRoaXMsIHYpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogVGFrZXMgdGhlIG1heCBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYSAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gQW5vdGhlciB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgbWF4IG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICovXG4gICAgc3RhdGljIG1heCAoYSwgYikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoTWF0aC5tYXgoYS54LCBiLngpLCBNYXRoLm1heChhLnksIGIueSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgaXRzZWxmIHRvIHRoZSBtYXggb2YgaXRzZWxmIGFuZCB0aGUgcHJvdmlkZWQgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgbWF4ICh2KSB7XG4gICAgICAgIHRoaXMueCA9IE1hdGgubWF4KHRoaXMueCwgdi54KTtcbiAgICAgICAgdGhpcy55ID0gTWF0aC5tYXgodGhpcy55LCB2LnkpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFRha2VzIHRoZSBtaW4gb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEFub3RoZXIgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIG1pbiBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqL1xuICAgIHN0YXRpYyBtaW4gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKE1hdGgubWluKGEueCwgYi54KSwgTWF0aC5taW4oYS55LCBiLnkpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIGl0c2VsZiB0byB0aGUgbWluIG9mIGl0c2VsZiBhbmQgdGhlIHByb3ZpZGVkIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIG1pbiAodikge1xuICAgICAgICB0aGlzLnggPSBNYXRoLm1pbih0aGlzLngsIHYueCk7XG4gICAgICAgIHRoaXMueSA9IE1hdGgubWluKHRoaXMueSwgdi55KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHMgLSBUaGUgc2NhbGFyLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgc2NhbGVkIHZlY3Rvci5cbiAgICAqL1xuICAgIHN0YXRpYyBtdWx0aXBseVNjYWxhciAodiwgcykge1xuICAgICAgICB2YXIgeCA9IHYueCAqIHM7XG4gICAgICAgIHZhciB5ID0gdi55ICogcztcblxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoeCwgeSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTXVsdGlwbGllcyB0aGUgdmVjdG9yIGJ5IGEgc2NhbGFyLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHMgLSBUaGUgc2NhbGFyLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIG11bHRpcGx5U2NhbGFyIChzKSB7XG4gICAgICAgIHRoaXMueCAqPSBzO1xuICAgICAgICB0aGlzLnkgKj0gcztcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2ZWN0b3IgdmFsdWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgeCB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIHkgdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgc2V0ICh4LCB5KSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTdWJ0cmFjdHMgdHdvIHZlY3RvcnMuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEFub3RoZXIgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIGRpZmZlcmVuY2Ugb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKi9cbiAgICBzdGF0aWMgc3VidHJhY3QgKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKGEueCAtIGIueCwgYS55IC0gYi55KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTdWJ0cmFjdHMgYSB2ZWN0b3IgZnJvbSB0aGUgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgc3VidHJhY3QgKHYpIHtcbiAgICAgICAgdGhpcy54IC09IHYueDtcbiAgICAgICAgdGhpcy55IC09IHYueTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgdmVjdG9yIGludG8gYSBuZXcgYXJyYXkuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yLlxuICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgdmFsdWVzLlxuICAgICovXG4gICAgc3RhdGljIHRvQXJyYXkgKHYpIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgQXJyYXkoMik7XG4gICAgICAgIFxuICAgICAgICBhWzBdID0gdi54O1xuICAgICAgICBhWzFdID0gdi55O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIHZlY3RvciBpbnRvIGEgbmV3IGFycmF5LlxuICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgdmFsdWVzLlxuICAgICovXG4gICAgdG9BcnJheSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnRvQXJyYXkodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogVHJhbnNmb3JtcyBhIHZlY3RvciB1c2luZyB0aGUgcHJvdmlkZWQgbWF0cml4LlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfE1hdHJpeDJEfSBtIC0gQSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyB0cmFuc2Zvcm1lZCB2ZWN0b3IuXG4gICAgKi9cbiAgICBzdGF0aWMgdHJhbnNmb3JtICh2LCBtKSB7XG4gICAgICAgIHZhciB4MSA9IHYueCAqIG0uZTExICsgdi55ICogbS5lMTIgKyAobS50eCA/IG0udHggOiAwKTtcbiAgICAgICAgdmFyIHkxID0gdi54ICogbS5lMjEgKyB2LnkgKiBtLmUyMiArIChtLnR5ID8gbS50eSA6IDApO1xuXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMih4MSwgeTEpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFRyYW5zZm9ybXMgdGhlIHZlY3RvciB1c2luZyB0aGUgcHJvdmlkZWQgbWF0cml4LlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ8TWF0cml4MkR9IG0gLSBBIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB0cmFuc2Zvcm1lZCB2ZWN0b3IuXG4gICAgKi9cbiAgICB0cmFuc2Zvcm0gKG0pIHtcbiAgICAgICAgdmFyIHgxID0gdGhpcy54ICogbS5lMTEgKyB0aGlzLnkgKiBtLmUxMiArIChtLnR4ID8gbS50eCA6IDApO1xuICAgICAgICB2YXIgeTEgPSB0aGlzLnggKiBtLmUyMSArIHRoaXMueSAqIG0uZTIyICsgKG0udHkgPyBtLnR5IDogMCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHgxLCB5MSk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBWZWN0b3IyOyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4qIEdTQVAncyBUaW1lbGluZU1heC5cbiogQGV4dGVybmFsIFRpbWVsaW5lTWF4XG4qIEBzZWUgaHR0cDovL2dyZWVuc29jay5jb20vZG9jcy8jL0hUTUw1L0dTQVAvVGltZWxpbmVNYXgvXG4qL1xuXG4vKipcbiogR1NBUCdzIFR3ZWVuTWF4LlxuKiBAZXh0ZXJuYWwgVHdlZW5NYXhcbiogQHNlZSBodHRwOi8vZ3JlZW5zb2NrLmNvbS9kb2NzLyMvSFRNTDUvR1NBUC9Ud2Vlbk1heC9cbiovXG5cbi8qKlxuKiBHU0FQJ3MgRWFzaW5nLlxuKiBAZXh0ZXJuYWwgRWFzaW5nXG4qIEBzZWUgaHR0cDovL2dyZWVuc29jay5jb20vZG9jcy8jL0hUTUw1L0dTQVAvRWFzaW5nL1xuKi9cblxuaW1wb3J0IEFuaW1hdGlvbiAgICAgZnJvbSAnLi9hbmltYXRpb24nO1xuaW1wb3J0IENhbWVyYSAgICAgICAgZnJvbSAnLi9jYW1lcmEnO1xuaW1wb3J0IENTU1JlbmRlcmVyICAgZnJvbSAnLi9jc3NSZW5kZXJlcic7XG5pbXBvcnQgTWF0aCAgICAgICAgICBmcm9tICcuL21hdGgvbWF0aCc7XG5pbXBvcnQgTWF0cml4MiAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgU2NlbmUgICAgICAgICBmcm9tICcuL3NjZW5lJztcbmltcG9ydCBVdGlscyAgICAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG5cbi8qKlxuKiBAbmFtZXNwYWNlIE9jdWxvXG4qL1xuY29uc3QgT2N1bG8gPSB7XG4gICAgQW5pbWF0aW9uOiBBbmltYXRpb24sXG4gICAgQ2FtZXJhOiBDYW1lcmEsXG4gICAgQ1NTUmVuZGVyZXI6IENTU1JlbmRlcmVyLFxuICAgIE1hdGg6IE1hdGgsXG4gICAgTWF0cml4MjogTWF0cml4MixcbiAgICBTY2VuZTogU2NlbmUsXG4gICAgVXRpbHM6IFV0aWxzLFxuICAgIFZlY3RvcjI6IFZlY3RvcjJcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT2N1bG87IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBVdGlscyAgICAgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgVmVjdG9yMiAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuLyoqXG4qIENyZWF0ZXMgYSBzY2VuZS5cbiogXG4qIEBjbGFzcyBPY3Vsby5TY2VuZVxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtDYW1lcmF9IFtjYW1lcmE9bnVsbF0gLSBUaGUgY2FtZXJhIHRoYXQgb3ducyB0aGlzIFNjZW5lLlxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSBbdmlldz1udWxsXSAtIFRoZSB2aWV3IGZvciB0aGUgc2NlbmUuIEl0IGNhbiBiZSBhIHNlbGVjdG9yIG9yIGFuIGVsZW1lbnQuXG4qL1xuY2xhc3MgU2NlbmUge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEgPSBudWxsLCB2aWV3ID0gbnVsbCkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkNhbWVyYX0gLSBUaGUgY2FtZXJhLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdmlldy4gQW4gSFRNTCBlbGVtZW50LlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnZpZXcgPSBVdGlscy5ET00ucGFyc2VWaWV3KHZpZXcpO1xuICAgICAgICBcbiAgICAgICAgLy8gVmlldyBzZXR1cFxuICAgICAgICBpZiAodGhpcy52aWV3ICYmIHRoaXMudmlldy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnZpZXcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgU2NlbmUjd2lkdGhcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB3aWR0aC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHdpZHRoICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlldyA/IHRoaXMudmlldy5vZmZzZXRXaWR0aCA6IDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBAbmFtZSBTY2VuZSNoZWlnaHRcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBoZWlnaHQuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBoZWlnaHQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3ID8gdGhpcy52aWV3Lm9mZnNldEhlaWdodCA6IDA7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgU2NlbmUjc2NhbGVkV2lkdGhcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBzY2FsZWQgd2lkdGguXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBzY2FsZWRXaWR0aCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcgPyB0aGlzLndpZHRoICogdGhpcy5jYW1lcmEuem9vbSA6IHRoaXMud2lkdGg7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgU2NlbmUjc2NhbGVkSGVpZ2h0XG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgc2NhbGVkIGhlaWdodC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHNjYWxlZEhlaWdodCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcgPyB0aGlzLmhlaWdodCAqIHRoaXMuY2FtZXJhLnpvb20gOiB0aGlzLmhlaWdodDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgc2NlbmUgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjZW5lOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgU2NlbmUgICAgZnJvbSAnLi9zY2VuZSc7XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5TY2VuZU1hbmFnZXJcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7T2N1bG8uQ2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRoYXQgb3ducyB0aGlzIFNjZW5lTWFuYWdlci5cbiogQHBhcmFtIHtib29sZWFufSBbaGFzVmlldz10cnVlXSAtIElmIHRydWUsIGEgJ2RpdicgaXMgY3JlYXRlZCBhbmQgbWFuYWdlZCBpbnRlcm5hbGx5LiBQYXNzIGZhbHNlIHRvIGNyZWF0ZSBhIFNjZW5lTWFuYWdlciB3aXRob3V0IGEgdmlldy5cbiovXG5jbGFzcyBTY2VuZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIGhhc1ZpZXcgPSB0cnVlKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uQ2FtZXJhfSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgU2NlbmVNYW5hZ2VyLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uU2NlbmV9IC0gVGhlIGFjdGl2ZSBzY2VuZS5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5hY3RpdmVTY2VuZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge0VsZW1lbnR9IC0gVGhlIHZpZXcuIEFuIEhUTUwgZWxlbWVudC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy52aWV3ID0gKGhhc1ZpZXcgPT09IHRydWUpID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykgOiBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IC0gQW4gb2JqZWN0IGZvciBzdG9yaW5nIHRoZSBtYW5hZ2VkIFNjZW5lIGluc3RhbmNlcy5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zY2VuZXMgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIC8vIFZpZXcgc2V0dXBcbiAgICAgICAgaWYgKHRoaXMudmlldykge1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgICAgIC8vdGhpcy52aWV3LnN0eWxlLndpbGxDaGFuZ2UgPSAndHJhbnNmb3JtJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFkZHMgYSBzY2VuZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIHRvIGdpdmUgdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtPY3Vsby5TY2VuZX0gc2NlbmUgLSBUaGUgc2NlbmUuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgYWRkIChuYW1lLCBzY2VuZSkge1xuICAgICAgICBpZiAodHlwZW9mIHNjZW5lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2NlbmUgPSBuZXcgU2NlbmUodGhpcy5jYW1lcmEsIHNjZW5lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjZW5lLmNhbWVyYSA9IHRoaXMuY2FtZXJhO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zY2VuZXNbbmFtZV0gPSBzY2VuZTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBTY2VuZU1hbmFnZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fc2NlbmVzKSB7XG4gICAgICAgICAgICB0aGlzLl9zY2VuZXNba2V5XS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy5hY3RpdmVTY2VuZSA9IG51bGw7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NjZW5lcyA9IHt9O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyBhIHNjZW5lLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHNjZW5lLlxuICAgICogQHJldHVybnMge09jdWxvLlNjZW5lfSBUaGUgc2NlbmUuXG4gICAgKi9cbiAgICBnZXQgKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NjZW5lc1tuYW1lXTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBhY3RpdmUgc2NlbmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldEFjdGl2ZVNjZW5lIChuYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLnZpZXcgJiYgdGhpcy5hY3RpdmVTY2VuZSAmJiB0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmVDaGlsZCh0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFjdGl2ZVNjZW5lID0gdGhpcy5fc2NlbmVzW25hbWVdO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudmlldykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVTY2VuZS52aWV3LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2NlbmUudmlldy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLndpZHRoID0gdGhpcy5hY3RpdmVTY2VuZS53aWR0aCArICdweCc7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuaGVpZ2h0ID0gdGhpcy5hY3RpdmVTY2VuZS5oZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjZW5lTWFuYWdlcjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IERyYWdDb250cm9sICBmcm9tICcuL2RyYWdDb250cm9sJztcbmltcG9ydCBXaGVlbENvbnRyb2wgZnJvbSAnLi93aGVlbENvbnRyb2wnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uVHJhY2tDb250cm9sXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYS5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZHJhZ2dhYmxlXSAtIFdoZXRoZXIgZHJhZ2dpbmcgaXMgaGFuZGxlZCBvciBub3QuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uRHJhZ10gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSBkcmFnIGV2ZW50IG9jY3Vycy5cbiogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy53aGVlbGFibGVdIC0gV2hldGhlciB3aGVlbGluZyBpcyBoYW5kbGVkIG9yIG5vdC5cbiogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMub25XaGVlbF0gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSB3aGVlbCBldmVudCBvY2N1cnMuXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteVRyYWNrQ29udHJvbCA9IG5ldyBPY3Vsby5UcmFja0NvbnRyb2wobXlDYW1lcmEsIHsgXG4qICAgZHJhZ2dhYmxlOiB0cnVlLCBcbiogICBvbkRyYWc6IGZ1bmN0aW9uICgpIHsgXG4qICAgICBjb25zb2xlLmxvZygnZHJhZ2dpbmcnKTsgXG4qICAgfSwgXG4qICAgd2hlZWxhYmxlOiB0cnVlLCBcbiogICBvbldoZWVsOiBmdW5jdGlvbiAoKSB7IFxuKiAgICAgY29uc29sZS5sb2coJ3doZWVsaW5nJyk7IFxuKiAgIH1cbiogfSk7XG4qL1xuY2xhc3MgVHJhY2tDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhLCB7XG4gICAgICAgIGRyYWdnYWJsZSA9IGZhbHNlLFxuICAgICAgICBvbkRyYWcgPSB1bmRlZmluZWQsXG4gICAgICAgIHdoZWVsYWJsZSA9IGZhbHNlLFxuICAgICAgICBvbldoZWVsID0gdW5kZWZpbmVkXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0geyBkcmFnZ2FibGUsIG9uRHJhZywgd2hlZWxhYmxlLCBvbldoZWVsIH07XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkNhbWVyYX0gLSBUaGUgY2FtZXJhLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGhhbmRsZWQgb3Igbm90LlxuICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNEcmFnZ2FibGUgPSAoZHJhZ2dhYmxlID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RHJhZ2dhYmxlfSAtIFRoZSBkcmFnIGNvbnRyb2wuXG4gICAgICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYWdDb250cm9sID0gIXRoaXMuaXNEcmFnZ2FibGUgPyBudWxsIDogbmV3IERyYWdDb250cm9sKHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3LCB7XG4gICAgICAgICAgICBkcmFnUHJveHk6IHRoaXMuY2FtZXJhLnZpZXcsXG4gICAgICAgICAgICBvbkRyYWc6IG9uRHJhZyxcbiAgICAgICAgICAgIG9uRHJhZ1BhcmFtczogW3RoaXMuY2FtZXJhXSxcbiAgICAgICAgICAgIHpJbmRleEJvb3N0OiBmYWxzZVxuICAgICAgICB9KTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB3aGVlbGluZyBpcyBoYW5kbGVkIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzV2hlZWxhYmxlID0gKHdoZWVsYWJsZSA9PT0gdHJ1ZSkgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1doZWVsQ29udHJvbH0gLSBUaGUgd2hlZWwgY29udHJvbC5cbiAgICAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMud2hlZWxDb250cm9sID0gIXRoaXMuaXNXaGVlbGFibGUgPyBudWxsIDogbmV3IFdoZWVsQ29udHJvbCh0aGlzLmNhbWVyYS52aWV3LCB7XG4gICAgICAgICAgICBvbldoZWVsOiBvbldoZWVsLFxuICAgICAgICAgICAgb25XaGVlbFBhcmFtczogW3RoaXMuY2FtZXJhXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgZHJhZ0VuYWJsZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0RyYWdnYWJsZSA/IHRoaXMuZHJhZ0NvbnRyb2wuZW5hYmxlZCA6IGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHdoZWVsaW5nIGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgd2hlZWxFbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNXaGVlbGFibGUgPyB0aGlzLndoZWVsQ29udHJvbC5lbmFibGVkIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIGNvbnRyb2wgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBpZiAodGhpcy5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5kcmFnQ29udHJvbC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jb25maWcgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIGRyYWdnaW5nLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlRHJhZyAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sLmRpc2FibGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyBkcmFnZ2luZy5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlRHJhZyAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sLmVuYWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgd2hlZWxpbmcuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGVXaGVlbCAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzV2hlZWxhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLndoZWVsQ29udHJvbC5kaXNhYmxlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEVuYWJsZXMgd2hlZWxpbmcuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZVdoZWVsICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmVuYWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUcmFja0NvbnRyb2w7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBpc0VsZW1lbnQgZnJvbSAnbG9kYXNoL2lzRWxlbWVudCc7XG5pbXBvcnQgaXNPYmplY3QgIGZyb20gJ2xvZGFzaC9pc09iamVjdCc7XG5pbXBvcnQgVmVjdG9yMiAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQG5hbWVzcGFjZSBPY3Vsby5VdGlsc1xuKi9cbmNvbnN0IFV0aWxzID0ge1xuICAgIC8qKlxuICAgICogR2V0IHRoZSBDU1MgdHJhbnNmb3JtIHZhbHVlIGZvciBhbiBlbGVtZW50LlxuICAgICpcbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBUaGUgZWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBDU1MgdHJhbnNmb3JtIHZhbHVlLlxuICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKi9cbiAgICBnZXRDc3NUcmFuc2Zvcm06IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBsZXQgdmFsdWUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZ2V0UHJvcGVydHlWYWx1ZSgndHJhbnNmb3JtJyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlICdtYXRyaXgoKScgYW5kIGFsbCB3aGl0ZXNwYWNlLiBUaGVuIHNlcGFyYXRlIGludG8gYW4gYXJyYXkuXG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXlxcdytcXCgvLCcnKS5yZXBsYWNlKC9cXCkkLywnJykucmVwbGFjZSgvXFxzKy9nLCAnJykuc3BsaXQoJywnKTtcblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFRoaXMgc3VwZXIgc2ltcGxpc3RpYyBhbmQgb25seSBoYW5kbGVzIDJEIG1hdHJpY2VzLlxuICAgIGdldFRyYW5zZm9ybU1hdHJpeDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBzdHlsZVZhbHVlID0gdXRpbHMuZ2V0Q3NzVHJhbnNmb3JtKGVsKTtcbiAgICAgICAgdmFyIG1hdHJpeCA9IFtdO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN0eWxlVmFsdWVbMF0gPT09ICdub25lJykge1xuICAgICAgICAgICAgbWF0cml4ID0gWzEsIDAsIDAsIDEsIDAsIDBdXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHlsZVZhbHVlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBtYXRyaXgucHVzaChwYXJzZUZsb2F0KGl0ZW0pKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbWF0cml4O1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUgZm9yIGFuIGVsZW1lbnQuXG4gICAgKlxuICAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIFRoZSBlbGVtZW50IGZvciB3aGljaCB0byBzZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIEFuIG9iamVjdCBvZiBDU1MgdHJhbnNmb3JtIHZhbHVlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NjYWxlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byBib3RoIFggYW5kIFkgYXhlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZVhdIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdzY2FsZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZVldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdzY2FsZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFkgYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5za2V3WF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NrZXcnIGZ1bmN0aW9uIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBYIGF4aXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2tld1ldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdza2V3JyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRyYW5zbGF0ZV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3RyYW5zbGF0ZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gYm90aCBYIGFuZCBZIGF4ZXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudHJhbnNsYXRlWF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3RyYW5zbGF0ZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50cmFuc2xhdGVZXSAtIEEgdmFsaWQgQ1NTIHRyYW5zZm9ybSAndHJhbnNsYXRlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFt0cmFja2VyXSAtIFRoZSBvYmplY3QgdGhhdCBpcyB0cmFja2luZyB0aGUgdHJhbnNpdGlvbi4gJ2lzVHJhbnNpdGlvbmluZycgb24gdGhlIG9iamVjdCB3aWxsIGJlIHNldCB0byAndHJ1ZScuXG4gICAgKiBAcmV0dXJucyB7RWxlbWVudH0gVGhlIGVsZW1lbnQuXG4gICAgKi9cblxuICAgIC8vIFRPRE86IFRoaXMgaXMgYSB2ZXJ5IHNpbXBsaXN0aWMgc29sdXRpb24uXG4gICAgLy8gSWRlYWxseSB3b3VsZCBoYW5kbGUgJ3JvdGF0ZScgb3B0aW9uLlxuICAgIC8vIElkZWFsbHkgd291bGQgaGFuZGxlIDNEIE1hdHJpeC5cbiAgICBzZXRDc3NUcmFuc2Zvcm06IGZ1bmN0aW9uIChlbCwgb3B0aW9ucywgdHJhY2tlcikge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIGxldCB2YWx1ZSA9IHV0aWxzLmdldENzc1RyYW5zZm9ybShlbCk7XG4gICAgICAgIGNvbnN0IENTU19UUkFOU0ZPUk1fS0VZV09SRFMgPSBbJ2luaGVyaXQnLCAnaW5pdGlhbCcsICdub25lJywgJ3Vuc2V0J107XG4gICAgICAgIGNvbnN0IERFRkFVTFRfTUFUUklYXzJEID0gWzEsIDAsIDAsIDEsIDAsIDBdO1xuICAgICAgICBjb25zdCBNQVRSSVhfMkQgPSB7XG4gICAgICAgICAgICBzY2FsZVg6IDAsXG4gICAgICAgICAgICBzY2FsZVk6IDMsXG4gICAgICAgICAgICBza2V3WTogMSxcbiAgICAgICAgICAgIHNrZXdYOiAyLFxuICAgICAgICAgICAgdHJhbnNsYXRlWDogNCxcbiAgICAgICAgICAgIHRyYW5zbGF0ZVk6IDVcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAob3B0aW9ucy5zY2FsZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5zY2FsZVggPSBvcHRpb25zLnNjYWxlWSA9IG9wdGlvbnMuc2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy50cmFuc2xhdGUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMudHJhbnNsYXRlWCA9IG9wdGlvbnMudHJhbnNsYXRlWSA9IG9wdGlvbnMudHJhbnNsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHRyYW5zZm9ybSB2YWx1ZSBpcyBhIGtleXdvcmQsIHVzZSBhIGRlZmF1bHQgbWF0cml4LlxuICAgICAgICBpZiAoQ1NTX1RSQU5TRk9STV9LRVlXT1JEUy5pbmRleE9mKHZhbHVlWzBdKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBERUZBVUxUX01BVFJJWF8yRDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIE1BVFJJWF8yRCkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNba2V5XSkge1xuICAgICAgICAgICAgICAgIGlmIChfLmlzRmluaXRlKG9wdGlvbnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVbTUFUUklYXzJEW2tleV1dID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGFuIGludmFsaWQgQ1NTIG1hdHJpeCB2YWx1ZScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBlbC5zdHlsZS50cmFuc2Zvcm0gPSAnbWF0cml4KCcgKyB2YWx1ZS5qb2luKCcsICcpICsgJyknO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRyYWNrZXIpIHtcbiAgICAgICAgICAgIHRyYWNrZXIuaXNUcmFuc2l0aW9uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gSWYgdHJhbnNpdGlvbiBkdXJhdGlvbiBpcyAwLCAndHJhbnNpdGlvbmVuZCcgZXZlbnQgd2hpY2ggaGFuZGxlcyAnaXNUcmFuc2l0aW9uaW5nJyB3aWxsIG5vdCBmaXJlLlxuICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoJ3RyYW5zaXRpb24tZHVyYXRpb24nKSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0cmFja2VyLmlzVHJhbnNpdGlvbmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAqIFNldCB0aGUgQ1NTIHRyYW5zaXRpb24gcHJvcGVydGllcyBmb3IgYW4gZWxlbWVudC5cbiAgICAqXG4gICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gVGhlIGVsZW1lbnQgZm9yIHdoaWNoIHRvIHNldCB0aGUgQ1NTIHRyYW5zaXRpb24gcHJvcGVydGllcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIC0gQSBjYW1lcmEge0BsaW5rIENhbWVyYU1vZGVsLmRlZmF1bHRzLnRyYW5zaXRpb258dHJhbnNpdGlvbn0gb2JqZWN0LlxuICAgICogQHJldHVybnMge0VsZW1lbnR9IFRoZSBlbGVtZW50LlxuICAgICovXG4gICAgc2V0Q3NzVHJhbnNpdGlvbjogZnVuY3Rpb24gKGVsLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgbGV0IGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzID0ge1xuICAgICAgICAgICAgdHJhbnNpdGlvbkRlbGF5OiBwcm9wZXJ0aWVzLmRlbGF5IHx8ICcwcycsXG4gICAgICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IHByb3BlcnRpZXMuZHVyYXRpb24gfHwgJzBzJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogcHJvcGVydGllcy5wcm9wZXJ0eSB8fCAnYWxsJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogcHJvcGVydGllcy50aW1pbmdGdW5jdGlvbiB8fCAnZWFzZSdcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjc3NUcmFuc2l0aW9uUHJvcGVydGllcykge1xuICAgICAgICAgICAgZWwuc3R5bGVba2V5XSA9IGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogVGhyb3R0bGluZyB1c2luZyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuXG4gICAgKlxuICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gdGhyb3R0bGVkIHRvIHRoZSBuZXh0IEFuaW1hdGlvbiBGcmFtZS5cbiAgICAqL1xuICAgIHRocm90dGxlVG9GcmFtZTogZnVuY3Rpb24gKGZ1bmMpIHtcbiAgICAgICAgbGV0IF90aGlzLCBhcmdzO1xuICAgICAgICBsZXQgaXNQcm9jZXNzaW5nID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgICAgICAgIGlmICghaXNQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24odGltZXN0YW1wKSB7XG4gICAgICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoYXJncywgdGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pOyAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2UgdGhlIHBvc2l0aW9uIG9mIHRoZSBnaXZlbiBpbnB1dCB3aXRoaW4gdGhlIHdvcmxkLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW2lucHV0XSAtIFRoZSBpbnB1dCB0byBwYXJzZS5cbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gd29ybGQgLSBUaGUgd29ybGQuXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgcGFyc2VkIHBvc2l0aW9uIGFzIGFuIHgveSBwb3NpdGlvbiBvYmplY3QuXG4gICAgKi9cbiAgICBwYXJzZVBvc2l0aW9uOiBmdW5jdGlvbiAoaW5wdXQsIHdvcmxkKSB7XG4gICAgICAgIHZhciBvYmplY3RQb3NpdGlvbjtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaXNFbGVtZW50KGlucHV0KSkge1xuICAgICAgICAgICAgb2JqZWN0UG9zaXRpb24gPSBVdGlscy5ET00uZ2V0T2JqZWN0V29ybGRQb3NpdGlvbihpbnB1dCwgd29ybGQpO1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgVmVjdG9yMihvYmplY3RQb3NpdGlvbi54LCBvYmplY3RQb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc09iamVjdChpbnB1dCkpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gbmV3IFZlY3RvcjIoaW5wdXQueCwgaW5wdXQueSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG59O1xuXG5VdGlscy5ET00gPSB7XG4gICAgLyoqXG4gICAgKiBHZXQgYW4gb2JqZWN0J3MgcG9zaXRpb24gaW4gdGhlIHdvcmxkLlxuICAgICpcbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gb2JqZWN0IC0gVGhlIG9iamVjdC5cbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gd29ybGQgLSBUaGUgd29ybGQuXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIG9iamVjdCdzIHBvc2l0aW9uLlxuICAgICovXG4gICAgZ2V0T2JqZWN0V29ybGRQb3NpdGlvbjogZnVuY3Rpb24gKG9iamVjdCwgd29ybGQpIHtcbiAgICAgICAgdmFyIHggPSAob2JqZWN0Lm9mZnNldFdpZHRoIC8gMikgKyBvYmplY3Qub2Zmc2V0TGVmdCAtIHdvcmxkLm9mZnNldExlZnQ7XG4gICAgICAgIHZhciB5ID0gKG9iamVjdC5vZmZzZXRIZWlnaHQgLyAyKSArIG9iamVjdC5vZmZzZXRUb3AgLSB3b3JsZC5vZmZzZXRUb3A7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHgsIHkpO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZSBhIHZpZXcgcGFyYW1ldGVyLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IGlucHV0IC0gVGhlIHZpZXcgcGFyYW1ldGVyLlxuICAgICogQHJldHVybnMge0VsZW1lbnR9IFRoZSB2aWV3LlxuICAgICovXG4gICAgcGFyc2VWaWV3OiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgdmFyIG91dHB1dCA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgb3V0cHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNFbGVtZW50KGlucHV0KSkge1xuICAgICAgICAgICAgb3V0cHV0ID0gaW5wdXQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxufTtcblxuVXRpbHMuVGltZSA9IHtcbiAgICAvKipcbiAgICAqIEdldHMgYSB0aW1lIGR1cmF0aW9uIGdpdmVuIEZQUyBhbmQgdGhlIGRlc2lyZWQgdW5pdC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBmcHMgLSBUaGUgZnJhbWVzIHBlciBzZWNvbmQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gdW5pdCAtIFRoZSB1bml0IG9mIHRpbWUuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gVGhlIGR1cmF0aW9uLlxuICAgICovXG4gICAgZ2V0RlBTRHVyYXRpb246IChmcHMsIHVuaXQpID0+IHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodW5pdCkge1xuICAgICAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPSAoMTAwMCAvIGZwcykgLyAxMDAwO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbXMnOlxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gMTAwMCAvIGZwcztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGR1cmF0aW9uO1xuICAgIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFV0aWxzOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgdGhyb3R0bGUgZnJvbSAnbG9kYXNoL3Rocm90dGxlJztcbmltcG9ydCBVdGlscyAgICBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLldoZWVsQ29udHJvbFxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gdGFyZ2V0IC0gVGhlIHRhcmdldC5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uV2hlZWxdIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZXZlcnkgdGltZSB0aGUgd2hlZWwgZXZlbnQgb2NjdXJzLlxuKiBAcGFyYW0ge2FycmF5fSBbb3B0aW9ucy5vbldoZWVsUGFyYW1zXSAtIFRoZSBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIGNhbGxiYWNrLlxuKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMub25XaGVlbFNjb3BlXSAtIFdoYXQgJ3RoaXMnIHJlZmVycyB0byBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlXaGVlbENvbnRyb2wgPSBuZXcgT2N1bG8uV2hlZWxDb250cm9sKCcjY2FtZXJhJywgeyAgXG4qICAgb25XaGVlbDogZnVuY3Rpb24gKCkgeyBcbiogICAgIGNvbnNvbGUubG9nKCd3aGVlbGluZycpOyBcbiogICB9XG4qIH0pO1xuKi9cbmNsYXNzIFdoZWVsQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IgKHRhcmdldCwge1xuICAgICAgICBvbldoZWVsID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG9uV2hlZWxQYXJhbXMgPSBbXSxcbiAgICAgICAgb25XaGVlbFNjb3BlID0gdGhpc1xuICAgIH0gPSB7fSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSB7IG9uV2hlZWwsIG9uV2hlZWxQYXJhbXMsIG9uV2hlZWxTY29wZSB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdGFyZ2V0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRhcmdldCA9IFV0aWxzLkRPTS5wYXJzZVZpZXcodGFyZ2V0KTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7V2hlZWxFdmVudH0gLSBUaGUgbGFzdCB3aGVlbCBldmVudCB0aGF0IGFmZmVjdGVkIHRoZSBpbnN0YW5jZS5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aGVlbEV2ZW50ID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1doZWVsRXZlbnR9IC0gVGhlIHByZXZpb3VzIHdoZWVsIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnByZXZpb3VzV2hlZWxFdmVudCA9IHt9O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgdGhyb3R0bGVkIHdoZWVsIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fdGhyb3R0bGVkT25XaGVlbCA9IHRocm90dGxlKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1doZWVsRXZlbnQgPSB0aGlzLndoZWVsRXZlbnQ7XG4gICAgICAgICAgICB0aGlzLndoZWVsRXZlbnQgPSBldmVudDtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uV2hlZWwuYXBwbHkodGhpcy5jb25maWcub25XaGVlbFNjb3BlLCB0aGlzLmNvbmZpZy5vbldoZWVsUGFyYW1zKTtcbiAgICAgICAgfSwgVXRpbHMuVGltZS5nZXRGUFNEdXJhdGlvbigzMCwgJ21zJykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB3aGVlbCBldmVudCBoYW5kbGVyLlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uV2hlZWwgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuX3Rocm90dGxlZE9uV2hlZWwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmFibGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGl0IGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgKi9cbiAgICBnZXQgZW5hYmxlZCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmFibGVkO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBjb250cm9sIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0ge307XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIHRoZSBjb250cm9sLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlICgpIHtcbiAgICAgICAgdGhpcy50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLl9vbldoZWVsKTtcbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEVuYWJsZXMgdGhlIGNvbnRyb2wuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZSAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5fb25XaGVlbCk7XG4gICAgICAgIHRoaXMuX2VuYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgV2hlZWxDb250cm9sOyJdfQ==

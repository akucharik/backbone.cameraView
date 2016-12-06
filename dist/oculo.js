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

},{"./EmitterSubscription":3,"./EventSubscriptionVendor":5,"_process":32,"fbjs/lib/emptyFunction":6,"fbjs/lib/invariant":7}],3:[function(require,module,exports){
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

},{"_process":32,"fbjs/lib/invariant":7}],6:[function(require,module,exports){
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

},{"_process":32}],8:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"./_root":16}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./_Symbol":8,"./_getRawTag":13,"./_objectToString":14}],11:[function(require,module,exports){
(function (global){
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],12:[function(require,module,exports){
var overArg = require('./_overArg');

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;

},{"./_overArg":15}],13:[function(require,module,exports){
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

},{"./_Symbol":8}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":11}],17:[function(require,module,exports){
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

},{"./_baseClamp":9,"./toNumber":31}],18:[function(require,module,exports){
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

},{"./isObject":25,"./now":29,"./toNumber":31}],19:[function(require,module,exports){
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

},{"./isFunction":22,"./isLength":23}],20:[function(require,module,exports){
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

},{"./isObjectLike":26,"./isPlainObject":27}],21:[function(require,module,exports){
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

},{"./_root":16}],22:[function(require,module,exports){
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

},{"./_baseGetTag":10,"./isObject":25}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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

},{"./_baseGetTag":10,"./_getPrototype":12,"./isObjectLike":26}],28:[function(require,module,exports){
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

},{"./_baseGetTag":10,"./isObjectLike":26}],29:[function(require,module,exports){
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

},{"./_root":16}],30:[function(require,module,exports){
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

},{"./debounce":18,"./isObject":25}],31:[function(require,module,exports){
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

},{"./isObject":25,"./isSymbol":28}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

var _math = require('./math/math');

var _math2 = _interopRequireDefault(_math);

var _matrix = require('./math/matrix2');

var _matrix2 = _interopRequireDefault(_matrix);

var _constants = require('./constants');

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _vector = require('./math/vector2');

var _vector2 = _interopRequireDefault(_vector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
        * @property {TimelineLite} - The current active sub-animation consisting of the core camera animation and effect animations.
        */
        _this.currentSubAnimation = null;

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
                    this.currentSubAnimation = self;
                }
            });
            var shakeTimeline = null;
            var shake = this._parseShake(props.shake);

            // Tween core camera properties
            if (props.origin || props.position || props.rotation || props.zoom) {
                mainTimeline.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
                    data: {
                        sourceOrigin: props.origin,
                        sourcePosition: props.position,
                        sourceRotation: props.rotation,
                        sourceZoom: props.zoom
                    },
                    immediateRender: false,
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        var parsedProps = this._parseProps(self.data.sourceOrigin, self.data.sourcePosition, self.data.sourceRotation, self.data.sourceZoom, this.camera);
                        var endProps = this._calculateEndProps(parsedProps.parsedOrigin, parsedProps.parsedPosition, parsedProps.parsedRotation, parsedProps.parsedZoom, this.camera);
                        Object.assign(self.data, parsedProps, endProps);

                        this.previousProps.position = this.camera.position;
                        this.previousProps.rotation = this.camera.rotation;
                        this.previousProps.zoom = this.camera.zoom;

                        // Smooth origin change
                        this.camera._setTransformOrigin(endProps.endOrigin);

                        // TODO: For dev only
                        console.log('tween data: ', self.data);

                        self.updateTo({
                            rawOffsetX: endProps.endOffsetX,
                            rawOffsetY: endProps.endOffsetY,
                            rotation: endProps.endRotation,
                            zoom: endProps.endZoom
                        });

                        self.timeline.core = self;
                    }
                })), 0);
            }

            // Tween shake effect
            if (duration > 0 && shake && shake.intensity > 0) {
                shakeTimeline = new TimelineLite(Object.assign({}, options, {
                    data: {
                        intensity: 0,
                        direction: shake.direction,
                        respectBounds: shake.respectBounds
                    },
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        self.timeline.shake = self;
                        this.camera.isShaking = true;
                        this.camera.shakeRespectBounds = this.data.respectBounds === false ? false : true;
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        if (self.data.direction === Animation.shake.direction.HORIZONTAL || self.data.direction === Animation.shake.direction.BOTH) {
                            this.camera.shakeOffset.x = Math.random() * self.data.intensity * this.camera.width * 2 - self.data.intensity * this.camera.width;
                        }

                        if (self.data.direction === Animation.shake.direction.VERTICAL || self.data.direction === Animation.shake.direction.BOTH) {
                            this.camera.shakeOffset.y = Math.random() * self.data.intensity * this.camera.height * 2 - self.data.intensity * this.camera.height;
                        }
                    },
                    onCompleteParams: ['{self}'],
                    onComplete: function onComplete(self) {
                        this.camera.shakeOffset.x = 0;
                        this.camera.shakeOffset.y = 0;
                        this.camera.isShaking = false;
                        this.camera.shakeRespectBounds = true;
                    }
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
        * Calculates the end property values.
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
        key: '_calculateEndProps',
        value: function _calculateEndProps(sourceOrigin, sourcePosition, sourceRotation, sourceZoom, camera) {
            sourceOrigin = sourceOrigin || {};
            sourcePosition = sourcePosition || {};

            var endPosition, endOffset;
            var position = new _vector2.default((0, _isFinite2.default)(sourcePosition.x) ? sourcePosition.x : camera.position.x, (0, _isFinite2.default)(sourcePosition.y) ? sourcePosition.y : camera.position.y);
            var origin = new _vector2.default((0, _isFinite2.default)(sourceOrigin.x) ? sourceOrigin.x : camera.transformOrigin.x, (0, _isFinite2.default)(sourceOrigin.y) ? sourceOrigin.y : camera.transformOrigin.y);
            var rotation = (0, _isFinite2.default)(sourceRotation) ? sourceRotation : camera.rotation;
            var zoom = camera._clampZoom((0, _isFinite2.default)(sourceZoom) ? sourceZoom : camera.zoom);
            var transformation = new _matrix2.default().scale(zoom, zoom).rotate(_math2.default.degToRad(-rotation));
            var cameraFOVPosition = camera.center;

            var isMoving = (0, _isFinite2.default)(sourcePosition.x) || (0, _isFinite2.default)(sourcePosition.y);
            var isRotating = (0, _isFinite2.default)(sourceRotation) && sourceRotation !== camera.rotation;
            var isZooming = (0, _isFinite2.default)(sourceZoom) && sourceZoom !== camera.zoom;

            // rotateTo, zoomTo
            if (!isMoving && !(0, _isFinite2.default)(sourceOrigin.x) && !(0, _isFinite2.default)(sourceOrigin.y)) {
                origin.copy(camera.position);
            }

            // rotateAt, rotateTo, zoomAt, zoomTo
            if (!isMoving) {
                position.copy(origin);
                cameraFOVPosition = camera._calculateContextPosition(origin, camera.position, camera.center, camera.transformation);
            }

            endPosition = camera._calculatePositionFromPosition(position, cameraFOVPosition, camera.center, origin, transformation);
            endOffset = camera._calculateOffsetFromPosition(endPosition, camera.center, origin, transformation);

            return {
                isMoving: isMoving,
                isRotating: isRotating,
                isZooming: isZooming,
                endOffsetX: isMoving ? endOffset.x : null,
                endOffsetY: isMoving ? endOffset.y : null,
                endOrigin: sourceOrigin.x || sourceOrigin.y || !isMoving ? origin : null,
                endRotation: !(0, _isNil2.default)(sourceRotation) ? rotation : null,
                endZoom: sourceZoom ? zoom : null
            };
        }

        /**
        * Parses the core animation properties.
        *
        * @private
        * @param {Object} sourceOrigin - The origin.
        * @param {Object} sourcePosition - The origin.
        * @param {number} sourceRotation - The rotation.
        * @param {number} sourceZoom - The zoom.
        * @param {Oculo.Camera} camera - The camera.
        * @returns {Object} - The parsed properties.
        */

    }, {
        key: '_parseProps',
        value: function _parseProps(sourceOrigin, sourcePosition, sourceRotation, sourceZoom, camera) {
            if (sourcePosition === 'previous' && this.previousProps.position) {
                sourcePosition = this.previousProps.position;
            }

            if (sourceRotation === 'previous' && !(0, _isNil2.default)(this.previousProps.rotation)) {
                sourceRotation = this.previousProps.rotation;
            }

            if (sourceZoom === 'previous' && !(0, _isNil2.default)(this.previousProps.zoom)) {
                sourceZoom = this.previousProps.zoom;
            }

            return {
                parsedOrigin: _utils2.default.parsePosition(sourceOrigin, camera.scene.view),
                parsedPosition: _utils2.default.parsePosition(sourcePosition, camera.scene.view),
                parsedRotation: !(0, _isNil2.default)(sourceRotation) ? sourceRotation : null,
                parsedZoom: sourceZoom || null
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
                    respectBounds: shake.respectBounds
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
            this.currentSubAnimation = null;
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
                    respectBounds: options.respectBounds
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

},{"./constants":37,"./math/math":40,"./math/matrix2":41,"./math/vector2":42,"./utils":47,"lodash/isElement":20,"lodash/isFinite":21,"lodash/isFunction":22,"lodash/isNil":24,"lodash/isObject":25}],34:[function(require,module,exports){
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

var _math = require('./math/math');

var _math2 = _interopRequireDefault(_math);

var _matrix = require('./math/matrix2');

var _matrix2 = _interopRequireDefault(_matrix);

var _constants = require('./constants');

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _vector = require('./math/vector2');

var _vector2 = _interopRequireDefault(_vector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
        * @property {TimelineLite} - The current active sub-animation consisting of the core camera animation and effect animations.
        */
        _this.currentSubAnimation = null;

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
                    this.currentSubAnimation = self;
                }
            });
            var shakeTimeline = null;
            var shake = this._parseShake(props.shake);

            // Tween core camera properties
            if (props.origin || props.position || props.rotation || props.zoom) {
                mainTimeline.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
                    data: {
                        sourceOrigin: props.origin,
                        sourcePosition: props.position,
                        sourceRotation: props.rotation,
                        sourceZoom: props.zoom
                    },
                    immediateRender: false,
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        var parsedProps = this._parseProps(self.data.sourceOrigin, self.data.sourcePosition, self.data.sourceRotation, self.data.sourceZoom, this.camera);
                        var endProps = this._calculateEndProps(parsedProps.parsedOrigin, parsedProps.parsedPosition, parsedProps.parsedRotation, parsedProps.parsedZoom, this.camera);
                        Object.assign(self.data, parsedProps, endProps);

                        this.previousProps.position = this.camera.position;
                        this.previousProps.rotation = this.camera.rotation;
                        this.previousProps.zoom = this.camera.zoom;

                        // Smooth origin change
                        this.camera._setTransformOrigin(endProps.endOrigin);

                        // TODO: For dev only
                        console.log('tween data: ', self.data);

                        self.updateTo({
                            rawOffsetX: endProps.endOffsetX,
                            rawOffsetY: endProps.endOffsetY,
                            rotation: endProps.endRotation,
                            zoom: endProps.endZoom
                        });

                        self.timeline.core = self;
                    }
                })), 0);
            }

            // Tween shake effect
            if (duration > 0 && shake && shake.intensity > 0) {
                shakeTimeline = new TimelineLite(Object.assign({}, options, {
                    data: {
                        intensity: 0,
                        direction: shake.direction,
                        respectBounds: shake.respectBounds
                    },
                    callbackScope: this,
                    onStartParams: ['{self}'],
                    onStart: function onStart(self) {
                        self.timeline.shake = self;
                        this.camera.isShaking = true;
                        this.camera.shakeRespectBounds = this.data.respectBounds === false ? false : true;
                    },
                    onUpdateParams: ['{self}'],
                    onUpdate: function onUpdate(self) {
                        if (self.data.direction === Animation.shake.direction.HORIZONTAL || self.data.direction === Animation.shake.direction.BOTH) {
                            this.camera.shakeOffset.x = Math.random() * self.data.intensity * this.camera.width * 2 - self.data.intensity * this.camera.width;
                        }

                        if (self.data.direction === Animation.shake.direction.VERTICAL || self.data.direction === Animation.shake.direction.BOTH) {
                            this.camera.shakeOffset.y = Math.random() * self.data.intensity * this.camera.height * 2 - self.data.intensity * this.camera.height;
                        }
                    },
                    onCompleteParams: ['{self}'],
                    onComplete: function onComplete(self) {
                        this.camera.shakeOffset.x = 0;
                        this.camera.shakeOffset.y = 0;
                        this.camera.isShaking = false;
                        this.camera.shakeRespectBounds = true;
                    }
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
        * Calculates the end property values.
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
        key: '_calculateEndProps',
        value: function _calculateEndProps(sourceOrigin, sourcePosition, sourceRotation, sourceZoom, camera) {
            sourceOrigin = sourceOrigin || {};
            sourcePosition = sourcePosition || {};

            var endPosition, endOffset;
            var position = new _vector2.default((0, _isFinite2.default)(sourcePosition.x) ? sourcePosition.x : camera.position.x, (0, _isFinite2.default)(sourcePosition.y) ? sourcePosition.y : camera.position.y);
            var origin = new _vector2.default((0, _isFinite2.default)(sourceOrigin.x) ? sourceOrigin.x : camera.transformOrigin.x, (0, _isFinite2.default)(sourceOrigin.y) ? sourceOrigin.y : camera.transformOrigin.y);
            var rotation = (0, _isFinite2.default)(sourceRotation) ? sourceRotation : camera.rotation;
            var zoom = camera._clampZoom((0, _isFinite2.default)(sourceZoom) ? sourceZoom : camera.zoom);
            var transformation = new _matrix2.default().scale(zoom, zoom).rotate(_math2.default.degToRad(-rotation));
            var cameraFOVPosition = camera.center;

            var isMoving = (0, _isFinite2.default)(sourcePosition.x) || (0, _isFinite2.default)(sourcePosition.y);
            var isRotating = (0, _isFinite2.default)(sourceRotation) && sourceRotation !== camera.rotation;
            var isZooming = (0, _isFinite2.default)(sourceZoom) && sourceZoom !== camera.zoom;

            // rotateTo, zoomTo
            if (!isMoving && !(0, _isFinite2.default)(sourceOrigin.x) && !(0, _isFinite2.default)(sourceOrigin.y)) {
                origin.copy(camera.position);
            }

            // rotateAt, rotateTo, zoomAt, zoomTo
            if (!isMoving) {
                position.copy(origin);
                cameraFOVPosition = camera._calculateContextPosition(origin, camera.position, camera.center, camera.transformation);
            }

            endPosition = camera._calculatePositionFromPosition(position, cameraFOVPosition, camera.center, origin, transformation);
            endOffset = camera._calculateOffsetFromPosition(endPosition, camera.center, origin, transformation);

            return {
                isMoving: isMoving,
                isRotating: isRotating,
                isZooming: isZooming,
                endOffsetX: isMoving ? endOffset.x : null,
                endOffsetY: isMoving ? endOffset.y : null,
                endOrigin: sourceOrigin.x || sourceOrigin.y || !isMoving ? origin : null,
                endRotation: !(0, _isNil2.default)(sourceRotation) ? rotation : null,
                endZoom: sourceZoom ? zoom : null
            };
        }

        /**
        * Parses the core animation properties.
        *
        * @private
        * @param {Object} sourceOrigin - The origin.
        * @param {Object} sourcePosition - The origin.
        * @param {number} sourceRotation - The rotation.
        * @param {number} sourceZoom - The zoom.
        * @param {Oculo.Camera} camera - The camera.
        * @returns {Object} - The parsed properties.
        */

    }, {
        key: '_parseProps',
        value: function _parseProps(sourceOrigin, sourcePosition, sourceRotation, sourceZoom, camera) {
            if (sourcePosition === 'previous' && this.previousProps.position) {
                sourcePosition = this.previousProps.position;
            }

            if (sourceRotation === 'previous' && !(0, _isNil2.default)(this.previousProps.rotation)) {
                sourceRotation = this.previousProps.rotation;
            }

            if (sourceZoom === 'previous' && !(0, _isNil2.default)(this.previousProps.zoom)) {
                sourceZoom = this.previousProps.zoom;
            }

            return {
                parsedOrigin: _utils2.default.parsePosition(sourceOrigin, camera.scene.view),
                parsedPosition: _utils2.default.parsePosition(sourcePosition, camera.scene.view),
                parsedRotation: !(0, _isNil2.default)(sourceRotation) ? sourceRotation : null,
                parsedZoom: sourceZoom || null
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
                    respectBounds: shake.respectBounds
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
            this.currentSubAnimation = null;
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
                    respectBounds: options.respectBounds
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

},{"./constants":37,"./math/math":40,"./math/matrix2":41,"./math/vector2":42,"./utils":47,"lodash/isElement":20,"lodash/isFinite":21,"lodash/isFunction":22,"lodash/isNil":24,"lodash/isObject":25}],35:[function(require,module,exports){
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
            this.currentAnimation.pause(null, false);

            return this;
        }

        /**
        * Plays the current or provided animation. forward from the current playhead position.
        *
        * @returns {this} self
        */

    }, {
        key: 'play',
        value: function play(animation) {
            if (typeof animation === 'string') {
                animation = this._animations[animation];
            }

            if (animation) {
                this.currentAnimation = animation;
                this.currentAnimation.invalidate().restart(false, false);
            } else {
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
            this.currentAnimation.resume(null, false);

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

},{"./Animation":33,"./constants":37}],36:[function(require,module,exports){
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
        * @property {boolean} - Whether the camera's position is draggable or not.
        * @default false
        */
        this.dragToMove = dragToMove === true ? true : false;

        /**
        * @property {boolean} - Whether the camera has been rendered or not.
        * @readonly
        * @default
        */
        this.isRendered = false;

        /**
        * @property {boolean} - Whether the camera is shaking or not.
        * @readonly
        * @default
        */
        this.isShaking = false;

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
        * @property {number} - The offset of the camera's top left corner relative to the scene without any effects applied.
        * @readonly
        */
        this.rawOffset = new _vector2.default(0, 0);

        /**
        * @property {number} - The offset of the camera's top left corner relative to the scene.
        * @readonly
        */
        this.offset = new _vector2.default(0, 0);

        /**
        * @property {number} - The position of the camera on the scene.
        * @readonly
        */
        this.position = new _vector2.default(width * 0.5, height * 0.5);

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
        * @property {number} - The amount of shake offset.
        * @readonly
        * @default
        */
        this.shakeOffset = new _vector2.default(0, 0);

        /**
        * @property {boolean} - Whether the shake effect respects the bounds or not.
        * @readonly
        * @default
        */
        this.shakeRespectBounds = true;

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
        * @property {number} - The height.
        * @readonly
        * @default 0
        */
        this.height = height;

        /**
        * @property {Vector2} - The center of the camera's FOV.
        * @readonly
        */
        this.center = new _vector2.default(this.width, this.height).multiplyScalar(0.5);

        /**
        * @private
        * @property {number} - The internally managed zoom.
        */
        this._zoom = 1;

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

        // Initialize custom events
        this.onResize = function () {
            var wasAnimating = _this.animations.isAnimating;
            var wasPaused = _this.animations.isPaused;

            if (wasAnimating) {
                _this.pause();
            }

            // Maintain camera position and update the current animation
            new Oculo.Animation(_this, {
                destroyOnComplete: true,
                paused: false,
                onComplete: function onComplete(wasAnimating, wasPaused) {
                    // 'this' is bound to the Animation via the Animation class
                    if (wasAnimating) {
                        var endProps;
                        var coreAnimation = this.camera.animations.currentAnimation.currentSubAnimation.core;

                        if (coreAnimation.data.isMoving) {
                            endProps = this._calculateEndProps(coreAnimation.data.parsedOrigin, coreAnimation.data.parsedPosition, coreAnimation.data.parsedRotation, coreAnimation.data.parsedZoom, this.camera);
                            Object.assign(coreAnimation.data, endProps);

                            // TODO: for dev only
                            console.log('tween data after resize: ', coreAnimation.data);
                            coreAnimation.updateTo({
                                zoom: endProps.endZoom,
                                rotation: endProps.endRotation,
                                rawOffsetX: endProps.endOffsetX,
                                rawOffsetY: endProps.endOffsetY
                            });
                        }

                        if (!wasPaused) {
                            this.camera.resume();
                        }
                    }
                },
                onCompleteParams: [wasAnimating, wasPaused]
            }).moveTo(_this.position, 0, { overwrite: false });
        };

        // Initialize event listeners
        this._events.addListener('change:size', this.onResize);

        // Initialize scene manager view and track controls
        if (this.view && this.scenes.view) {
            this.view.appendChild(this.scenes.view);
            this.trackControl = new _trackControl2.default(this, {
                draggable: this.dragToMove,
                onDrag: function onDrag(camera) {
                    var position = camera._calculatePositionFromOffset(new _vector2.default(-this.x, -this.y), camera.center, camera.transformOrigin, camera.transformation);
                    new Oculo.Animation(camera, {
                        destroyOnComplete: true,
                        paused: false
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
                    var sceneContextPosition = new _vector2.default();
                    var origin = camera.transformOrigin;
                    var zoom = camera.zoom + camera.zoom * camera.wheelToZoomIncrement * (velocity > 1 ? velocity * 0.5 : 1) * (direction === ZOOM_IN ? 1 : -1);

                    // Performance Optimization: If zoom has not changed because it's at the min/max, don't zoom.
                    if (direction === previousDirection && camera._clampZoom(zoom) !== camera.zoom) {
                        cameraRect = camera.view.getBoundingClientRect();
                        cameraFOVPosition.set(this.wheelEvent.clientX - cameraRect.left, this.wheelEvent.clientY - cameraRect.top);
                        sceneContextPosition = camera._calculatePositionFromOffset(camera.offset, cameraFOVPosition, camera.transformOrigin, camera.transformation);

                        if (Math.round(origin.x) !== Math.round(sceneContextPosition.x) || Math.round(origin.y) !== Math.round(sceneContextPosition.y)) {
                            origin = camera._calculatePositionFromOffset(camera.offset, cameraFOVPosition, camera.transformOrigin, camera.transformation);
                        }

                        new Oculo.Animation(camera, {
                            destroyOnComplete: true,
                            paused: false
                        }).zoomAt(origin, zoom, 0);
                    }
                }
            });
        }

        this.initialize(arguments[0]);
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
        key: '_applyShake',


        /**
        * Apply the shake effect to the camera.
        *
        * @private
        * @returns {this} self
        */
        value: function _applyShake() {
            if (this.isShaking) {
                this.position.add(this.shakeOffset);

                if (this.shakeRespectBounds) {
                    this._clampPosition(this.position);
                }
            }

            return this;
        }

        /**
        * Calculate the position of the camera on the scene given a scene position to be located a point in the camera's FOV.
        *
        * @private
        * @param {Vector2} scenePosition - The raw point on the scene.
        * @param {Vector2} cameraFOVPosition - The point in the camera's FOV.
        * @param {Vector2} cameraCenter - The center of the camera's FOV.
        * @param {Vector2} sceneOrigin - The scene's origin.
        * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
        * @returns {Vector2} The camera's position.
        */

    }, {
        key: '_calculatePositionFromPosition',
        value: function _calculatePositionFromPosition(scenePosition, cameraFOVPosition, cameraCenter, sceneOrigin, sceneTransformation) {
            if (cameraFOVPosition.equals(cameraCenter)) {
                return scenePosition.clone();
            } else {
                var offset = this._calculateOffsetFromPosition(scenePosition, cameraFOVPosition, sceneOrigin, sceneTransformation);

                return this._calculatePositionFromOffset(offset, cameraCenter, sceneOrigin, sceneTransformation);
            }
        }

        /**
        * Calculate the position of the camera on the scene given the camera's offset.
        *
        * @private
        * @param {Vector2} cameraOffset - The camera's offset on the scene.
        * @param {Vector2} cameraCenter - The center of the camera's FOV.
        * @param {Vector2} sceneOrigin - The scene's origin.
        * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
        * @returns {Vector2} The camera's position.
        */

    }, {
        key: '_calculatePositionFromOffset',
        value: function _calculatePositionFromOffset(cameraOffset, cameraCenter, sceneOrigin, sceneTransformation) {
            var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

            return cameraOffset.clone().add(sceneOriginOffset).add(cameraCenter).transform(sceneTransformation.getInverse());
        }

        /**
        * Calculate the position in the camera's FOV of the provided scene position.
        *
        * @private
        * @param {Vector2} scenePosition - The raw point on the scene.
        * @param {Vector2} cameraPosition - The camera's position.
        * @param {Vector2} cameraCenter - The center of the camera's FOV.
        * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
        * @returns {Vector2} The position in the camera's FOV.
        */

    }, {
        key: '_calculateContextPosition',
        value: function _calculateContextPosition(scenePosition, cameraPosition, cameraCenter, sceneTransformation) {
            var cameraOffset = this._calculateOffsetFromPosition(cameraPosition, cameraCenter, new _vector2.default(), sceneTransformation);

            return scenePosition.clone().transform(sceneTransformation).subtract(cameraOffset);
        }

        /**
        * Calculate the offset of the camera on the scene given a scene position to be located a point in the camera's FOV.
        *
        * @private
        * @param {Vector2} scenePosition - The raw point on the scene.
        * @param {Vector2} cameraFOVPosition - The point in the camera's FOV.
        * @param {Vector2} sceneOrigin - The scene's origin.
        * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
        * @returns {Vector2} The camera's offset.
        */

    }, {
        key: '_calculateOffsetFromPosition',
        value: function _calculateOffsetFromPosition(scenePosition, cameraFOVPosition, sceneOrigin, sceneTransformation) {
            var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

            return scenePosition.clone().transform(sceneTransformation).subtract(sceneOriginOffset).subtract(cameraFOVPosition);
        }

        /**
        * Clamp the position.
        *
        * @private
        * @param {Vector2} position - The position.
        * @returns {Vector2} The clamped position.
        */

    }, {
        key: '_clampPosition',
        value: function _clampPosition(position) {
            if (this._bounds !== null) {
                position.x = (0, _clamp2.default)(position.x, this.minPositionX, this.maxPositionX);
                position.y = (0, _clamp2.default)(position.y, this.minPositionY, this.maxPositionY);
            }

            // TODO: For dev only
            console.log('clamp position');

            return position;
        }

        /**
        * Clamp the zoom.
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
        * Resets the camera to the default state.
        *
        * @returns {this} self
        */

    }, {
        key: '_reset',
        value: function _reset() {
            this.transformOrigin.set(0, 0);
            this.position.set(this.width * 0.5, this.height * 0.5);
            this.rotation = 0;
            this.zoom = 1;
            this.rawOffset = this._calculateOffsetFromPosition(this.position, this.center, this.transformOrigin, this.transformation);
            this.offset.copy(this.rawOffset);

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
        key: '_setTransformOrigin',
        value: function _setTransformOrigin(origin) {
            if (origin && !origin.equals(this.transformOrigin)) {
                var transformation = this.transformation;
                var originOffset = origin.clone().transform(transformation).subtract(this.transformOrigin.clone().transform(transformation)).subtract(origin.clone().subtract(this.transformOrigin));

                if (this.isRotated || this.isZoomed) {
                    this.rawOffset.x -= originOffset.x;
                    this.rawOffset.y -= originOffset.y;
                }

                this.transformOrigin.copy(origin);
            }

            return this;
        }
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
                //console.log('update bounds');
            }
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
            this._updateBounds();

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
        * Called when the camera has been created. The default implementation of initialize is a no-op. Override this function with your own code.
        *
        * @param {Object} [options] - The options passed to the constructor when the camera was created.
        */

    }, {
        key: 'initialize',
        value: function initialize(options) {}

        /**
        * Called before the camera has rendered. The default implementation of initialize is a no-op. Override this function with your own code.
        */

    }, {
        key: 'onBeforeRender',
        value: function onBeforeRender() {}

        /**
        * Called after the camera has rendered. The default implementation of initialize is a no-op. Override this function with your own code.
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

            // Clamping here ensures bounds have been updated (if zoom has changed) and bounds are enforced during rotateAt
            // Position is manually maintained so animations can smoothly continue when camera is resized
            this.position = this._clampPosition(this._calculatePositionFromOffset(this.rawOffset, this.center, this.transformOrigin, this.transformation));
            this._applyShake();
            this.offset = this._calculateOffsetFromPosition(this.position, this.center, this.transformOrigin, this.transformation);
            this.renderer.render();
            this.onRender();

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
        * @property {Vector2} - The X offset of the camera's top left corner relative to the world without any effects applied.
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
        * @property {Vector2} - The Y offset of the camera's top left corner relative to the world without any effects applied.
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

},{"./animationManager":35,"./cssRenderer":38,"./math/math":40,"./math/matrix2":41,"./math/vector2":42,"./scene":44,"./sceneManager":45,"./trackControl":46,"./utils":47,"fbemitter":1,"lodash/clamp":17,"lodash/isElement":20,"lodash/isFinite":21,"lodash/isFunction":22,"lodash/isNil":24,"lodash/isObject":25}],37:[function(require,module,exports){
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
var Type = {
    ANIMATION: 0
};

exports.Type = Type;

},{}],38:[function(require,module,exports){
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Description.
* 
* @class Oculo.CSSRenderer
* @constructor
*
* @example
* var myRenderer = new CSSRenderer(myCamera);
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
                this.camera.scene.view.style.visibility = 'visible';
                TweenLite.set(this.camera.scenes.view, {
                    css: {
                        transformOrigin: this.camera.transformOrigin.x + 'px ' + this.camera.transformOrigin.y + 'px',
                        scaleX: this.camera.zoom,
                        scaleY: this.camera.zoom,
                        rotation: -this.camera.rotation,
                        x: -this.camera.offset.x,
                        y: -this.camera.offset.y
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

},{}],39:[function(require,module,exports){
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

},{"./utils":47}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{"lodash/isArrayLike":19}],42:[function(require,module,exports){
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
            this.x = this.x * m.e11 + this.y * m.e12 + (m.tx ? m.tx : 0);
            this.y = this.x * m.e21 + this.y * m.e22 + (m.ty ? m.ty : 0);

            return this;
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

},{}],43:[function(require,module,exports){
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

},{"./animation":34,"./camera":36,"./cssRenderer":38,"./math/math":40,"./math/matrix2":41,"./math/vector2":42,"./scene":44,"./utils":47}],44:[function(require,module,exports){
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

},{"./math/vector2":42,"./utils":47}],45:[function(require,module,exports){
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

},{"./scene":44}],46:[function(require,module,exports){
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

},{"./dragControl":39,"./wheelControl":48}],47:[function(require,module,exports){
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

},{"./math/vector2":42,"lodash/isElement":20,"lodash/isObject":25}],48:[function(require,module,exports){
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

},{"./utils":47,"lodash/throttle":30}]},{},[43])(43)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZiZW1pdHRlci9saWIvQmFzZUV2ZW50RW1pdHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0VtaXR0ZXJTdWJzY3JpcHRpb24uanMiLCJub2RlX21vZHVsZXMvZmJlbWl0dGVyL2xpYi9FdmVudFN1YnNjcmlwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9mYmVtaXR0ZXIvbGliL0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZianMvbGliL2VtcHR5RnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvZmJqcy9saWIvaW52YXJpYW50LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fU3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUNsYW1wLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUdldFRhZy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvX2ZyZWVHbG9iYWwuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19nZXRQcm90b3R5cGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19nZXRSYXdUYWcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19vYmplY3RUb1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvX292ZXJBcmcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL19yb290LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9jbGFtcC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvZGVib3VuY2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzQXJyYXlMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0VsZW1lbnQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzRmluaXRlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0Z1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0xlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNOaWwuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdExpa2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzU3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9ub3cuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3Rocm90dGxlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b051bWJlci5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmMvc2NyaXB0cy9BbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb24uanMiLCJzcmMvc2NyaXB0cy9hbmltYXRpb25NYW5hZ2VyLmpzIiwic3JjL3NjcmlwdHMvY2FtZXJhLmpzIiwic3JjL3NjcmlwdHMvY29uc3RhbnRzLmpzIiwic3JjL3NjcmlwdHMvY3NzUmVuZGVyZXIuanMiLCJzcmMvc2NyaXB0cy9kcmFnQ29udHJvbC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0aC5qcyIsInNyYy9zY3JpcHRzL21hdGgvbWF0cml4Mi5qcyIsInNyYy9zY3JpcHRzL21hdGgvdmVjdG9yMi5qcyIsInNyYy9zY3JpcHRzL29jdWxvLmpzIiwic3JjL3NjcmlwdHMvc2NlbmUuanMiLCJzcmMvc2NyaXB0cy9zY2VuZU1hbmFnZXIuanMiLCJzcmMvc2NyaXB0cy90cmFja0NvbnRyb2wuanMiLCJzcmMvc2NyaXB0cy91dGlscy5qcyIsInNyYy9zY3JpcHRzL3doZWVsQ29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBTUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7O0lBZU0sUzs7O0FBQ0YsdUJBQWEsTUFBYixFQUFxQixPQUFyQixFQUE4QjtBQUFBOztB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QUFkO0FBQ0EsaUJBQUssTUFBTCxHQUFjLElBQWQ7O0FBRUEsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7OztrQ0FLVztBQUNQLGlCQUFLLE1BQUwsQ0FBWSxtQkFBWixDQUFnQyxPQUFoQyxFQUF5QyxLQUFLLFFBQTlDO0FBQ0EsaUJBQUssUUFBTCxHQUFnQixLQUFoQjs7QUFFQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7O2lDQUtVO0FBQ04saUJBQUssTUFBTCxDQUFZLGdCQUFaLENBQTZCLE9BQTdCLEVBQXNDLEtBQUssUUFBM0M7QUFDQSxpQkFBSyxRQUFMLEdBQWdCLElBQWhCOztBQUVBLG1CQUFPLElBQVA7QUFDSDs7OzRCQXZDYztBQUNYLG1CQUFPLEtBQUssUUFBWjtBQUNIOzs7Ozs7a0JBd0NVLFkiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICovXG5cbnZhciBmYmVtaXR0ZXIgPSB7XG4gIEV2ZW50RW1pdHRlcjogcmVxdWlyZSgnLi9saWIvQmFzZUV2ZW50RW1pdHRlcicpLFxuICBFbWl0dGVyU3Vic2NyaXB0aW9uIDogcmVxdWlyZSgnLi9saWIvRW1pdHRlclN1YnNjcmlwdGlvbicpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZiZW1pdHRlcjtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgQmFzZUV2ZW50RW1pdHRlclxuICogQHR5cGVjaGVja3NcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgRW1pdHRlclN1YnNjcmlwdGlvbiA9IHJlcXVpcmUoJy4vRW1pdHRlclN1YnNjcmlwdGlvbicpO1xudmFyIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yID0gcmVxdWlyZSgnLi9FdmVudFN1YnNjcmlwdGlvblZlbmRvcicpO1xuXG52YXIgZW1wdHlGdW5jdGlvbiA9IHJlcXVpcmUoJ2ZianMvbGliL2VtcHR5RnVuY3Rpb24nKTtcbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcblxuLyoqXG4gKiBAY2xhc3MgQmFzZUV2ZW50RW1pdHRlclxuICogQGRlc2NyaXB0aW9uXG4gKiBBbiBFdmVudEVtaXR0ZXIgaXMgcmVzcG9uc2libGUgZm9yIG1hbmFnaW5nIGEgc2V0IG9mIGxpc3RlbmVycyBhbmQgcHVibGlzaGluZ1xuICogZXZlbnRzIHRvIHRoZW0gd2hlbiBpdCBpcyB0b2xkIHRoYXQgc3VjaCBldmVudHMgaGFwcGVuZWQuIEluIGFkZGl0aW9uIHRvIHRoZVxuICogZGF0YSBmb3IgdGhlIGdpdmVuIGV2ZW50IGl0IGFsc28gc2VuZHMgYSBldmVudCBjb250cm9sIG9iamVjdCB3aGljaCBhbGxvd3NcbiAqIHRoZSBsaXN0ZW5lcnMvaGFuZGxlcnMgdG8gcHJldmVudCB0aGUgZGVmYXVsdCBiZWhhdmlvciBvZiB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogVGhlIGVtaXR0ZXIgaXMgZGVzaWduZWQgdG8gYmUgZ2VuZXJpYyBlbm91Z2ggdG8gc3VwcG9ydCBhbGwgdGhlIGRpZmZlcmVudFxuICogY29udGV4dHMgaW4gd2hpY2ggb25lIG1pZ2h0IHdhbnQgdG8gZW1pdCBldmVudHMuIEl0IGlzIGEgc2ltcGxlIG11bHRpY2FzdFxuICogbWVjaGFuaXNtIG9uIHRvcCBvZiB3aGljaCBleHRyYSBmdW5jdGlvbmFsaXR5IGNhbiBiZSBjb21wb3NlZC4gRm9yIGV4YW1wbGUsIGFcbiAqIG1vcmUgYWR2YW5jZWQgZW1pdHRlciBtYXkgdXNlIGFuIEV2ZW50SG9sZGVyIGFuZCBFdmVudEZhY3RvcnkuXG4gKi9cblxudmFyIEJhc2VFdmVudEVtaXR0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuXG4gIGZ1bmN0aW9uIEJhc2VFdmVudEVtaXR0ZXIoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEJhc2VFdmVudEVtaXR0ZXIpO1xuXG4gICAgdGhpcy5fc3Vic2NyaWJlciA9IG5ldyBFdmVudFN1YnNjcmlwdGlvblZlbmRvcigpO1xuICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBsaXN0ZW5lciB0byBiZSBpbnZva2VkIHdoZW4gZXZlbnRzIG9mIHRoZSBzcGVjaWZpZWQgdHlwZSBhcmVcbiAgICogZW1pdHRlZC4gQW4gb3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG1heSBiZSBwcm92aWRlZC4gVGhlIGRhdGEgYXJndW1lbnRzXG4gICAqIGVtaXR0ZWQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUT0RPOiBBbm5vdGF0ZSB0aGUgbGlzdGVuZXIgYXJnJ3MgdHlwZS4gVGhpcyBpcyB0cmlja3kgYmVjYXVzZSBsaXN0ZW5lcnNcbiAgICogICAgICAgY2FuIGJlIGludm9rZWQgd2l0aCB2YXJhcmdzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIC0gTmFtZSBvZiB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gRnVuY3Rpb24gdG8gaW52b2tlIHdoZW4gdGhlIHNwZWNpZmllZCBldmVudCBpc1xuICAgKiAgIGVtaXR0ZWRcbiAgICogQHBhcmFtIHsqfSBjb250ZXh0IC0gT3B0aW9uYWwgY29udGV4dCBvYmplY3QgdG8gdXNlIHdoZW4gaW52b2tpbmcgdGhlXG4gICAqICAgbGlzdGVuZXJcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldmVudFR5cGUsIGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX3N1YnNjcmliZXIuYWRkU3Vic2NyaXB0aW9uKGV2ZW50VHlwZSwgbmV3IEVtaXR0ZXJTdWJzY3JpcHRpb24odGhpcy5fc3Vic2NyaWJlciwgbGlzdGVuZXIsIGNvbnRleHQpKTtcbiAgfTtcblxuICAvKipcbiAgICogU2ltaWxhciB0byBhZGRMaXN0ZW5lciwgZXhjZXB0IHRoYXQgdGhlIGxpc3RlbmVyIGlzIHJlbW92ZWQgYWZ0ZXIgaXQgaXNcbiAgICogaW52b2tlZCBvbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIC0gTmFtZSBvZiB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gRnVuY3Rpb24gdG8gaW52b2tlIG9ubHkgb25jZSB3aGVuIHRoZVxuICAgKiAgIHNwZWNpZmllZCBldmVudCBpcyBlbWl0dGVkXG4gICAqIEBwYXJhbSB7Kn0gY29udGV4dCAtIE9wdGlvbmFsIGNvbnRleHQgb2JqZWN0IHRvIHVzZSB3aGVuIGludm9raW5nIHRoZVxuICAgKiAgIGxpc3RlbmVyXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICB2YXIgZW1pdHRlciA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZlbnRUeXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICBlbWl0dGVyLnJlbW92ZUN1cnJlbnRMaXN0ZW5lcigpO1xuICAgICAgbGlzdGVuZXIuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgb2YgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzLCBpbmNsdWRpbmcgdGhvc2UgcmVnaXN0ZXJlZCBhc1xuICAgKiBsaXN0ZW5lciBtYXBzLlxuICAgKlxuICAgKiBAcGFyYW0gez9zdHJpbmd9IGV2ZW50VHlwZSAtIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHdob3NlIHJlZ2lzdGVyZWRcbiAgICogICBsaXN0ZW5lcnMgdG8gcmVtb3ZlXG4gICAqL1xuXG4gIEJhc2VFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudFR5cGUpIHtcbiAgICB0aGlzLl9zdWJzY3JpYmVyLnJlbW92ZUFsbFN1YnNjcmlwdGlvbnMoZXZlbnRUeXBlKTtcbiAgfTtcblxuICAvKipcbiAgICogUHJvdmlkZXMgYW4gQVBJIHRoYXQgY2FuIGJlIGNhbGxlZCBkdXJpbmcgYW4gZXZlbnRpbmcgY3ljbGUgdG8gcmVtb3ZlIHRoZVxuICAgKiBsYXN0IGxpc3RlbmVyIHRoYXQgd2FzIGludm9rZWQuIFRoaXMgYWxsb3dzIGEgZGV2ZWxvcGVyIHRvIHByb3ZpZGUgYW4gZXZlbnRcbiAgICogb2JqZWN0IHRoYXQgY2FuIHJlbW92ZSB0aGUgbGlzdGVuZXIgKG9yIGxpc3RlbmVyIG1hcCkgZHVyaW5nIHRoZVxuICAgKiBpbnZvY2F0aW9uLlxuICAgKlxuICAgKiBJZiBpdCBpcyBjYWxsZWQgd2hlbiBub3QgaW5zaWRlIG9mIGFuIGVtaXR0aW5nIGN5Y2xlIGl0IHdpbGwgdGhyb3cuXG4gICAqXG4gICAqIEB0aHJvd3Mge0Vycm9yfSBXaGVuIGNhbGxlZCBub3QgZHVyaW5nIGFuIGV2ZW50aW5nIGN5Y2xlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgdmFyIHN1YnNjcmlwdGlvbiA9IGVtaXR0ZXIuYWRkTGlzdGVuZXJNYXAoe1xuICAgKiAgICAgc29tZUV2ZW50OiBmdW5jdGlvbihkYXRhLCBldmVudCkge1xuICAgKiAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICogICAgICAgZW1pdHRlci5yZW1vdmVDdXJyZW50TGlzdGVuZXIoKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICpcbiAgICogICBlbWl0dGVyLmVtaXQoJ3NvbWVFdmVudCcsICdhYmMnKTsgLy8gbG9ncyAnYWJjJ1xuICAgKiAgIGVtaXR0ZXIuZW1pdCgnc29tZUV2ZW50JywgJ2RlZicpOyAvLyBkb2VzIG5vdCBsb2cgYW55dGhpbmdcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQ3VycmVudExpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlQ3VycmVudExpc3RlbmVyKCkge1xuICAgICEhIXRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnTm90IGluIGFuIGVtaXR0aW5nIGN5Y2xlOyB0aGVyZSBpcyBubyBjdXJyZW50IHN1YnNjcmlwdGlvbicpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zdWJzY3JpYmVyLnJlbW92ZVN1YnNjcmlwdGlvbih0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uKTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdGhhdCBhcmUgY3VycmVudGx5IHJlZ2lzdGVyZWQgZm9yIHRoZSBnaXZlblxuICAgKiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSAtIE5hbWUgb2YgdGhlIGV2ZW50IHRvIHF1ZXJ5XG4gICAqIEByZXR1cm4ge2FycmF5fVxuICAgKi9cblxuICBCYXNlRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnRUeXBlKSAvKiBUT0RPOiBBcnJheTxFdmVudFN1YnNjcmlwdGlvbj4gKi97XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB0aGlzLl9zdWJzY3JpYmVyLmdldFN1YnNjcmlwdGlvbnNGb3JUeXBlKGV2ZW50VHlwZSk7XG4gICAgcmV0dXJuIHN1YnNjcmlwdGlvbnMgPyBzdWJzY3JpcHRpb25zLmZpbHRlcihlbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVHJ1ZSkubWFwKGZ1bmN0aW9uIChzdWJzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybiBzdWJzY3JpcHRpb24ubGlzdGVuZXI7XG4gICAgfSkgOiBbXTtcbiAgfTtcblxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgb2YgdGhlIGdpdmVuIHR5cGUgd2l0aCB0aGUgZ2l2ZW4gZGF0YS4gQWxsIGhhbmRsZXJzIG9mIHRoYXRcbiAgICogcGFydGljdWxhciB0eXBlIHdpbGwgYmUgbm90aWZpZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgLSBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0XG4gICAqIEBwYXJhbSB7Kn0gQXJiaXRyYXJ5IGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCByZWdpc3RlcmVkIGxpc3RlbmVyXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgZW1pdHRlci5hZGRMaXN0ZW5lcignc29tZUV2ZW50JywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgKiAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAqICAgfSk7XG4gICAqXG4gICAqICAgZW1pdHRlci5lbWl0KCdzb21lRXZlbnQnLCAnYWJjJyk7IC8vIGxvZ3MgJ2FiYydcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnRUeXBlKSB7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB0aGlzLl9zdWJzY3JpYmVyLmdldFN1YnNjcmlwdGlvbnNGb3JUeXBlKGV2ZW50VHlwZSk7XG4gICAgaWYgKHN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3Vic2NyaXB0aW9ucyk7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwga2V5cy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaWldO1xuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gc3Vic2NyaXB0aW9uc1trZXldO1xuICAgICAgICAvLyBUaGUgc3Vic2NyaXB0aW9uIG1heSBoYXZlIGJlZW4gcmVtb3ZlZCBkdXJpbmcgdGhpcyBldmVudCBsb29wLlxuICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICB0aGlzLl9fZW1pdFRvU3Vic2NyaXB0aW9uLmFwcGx5KHRoaXMsIFtzdWJzY3JpcHRpb25dLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUHJvdmlkZXMgYSBob29rIHRvIG92ZXJyaWRlIGhvdyB0aGUgZW1pdHRlciBlbWl0cyBhbiBldmVudCB0byBhIHNwZWNpZmljXG4gICAqIHN1YnNjcmlwdGlvbi4gVGhpcyBhbGxvd3MgeW91IHRvIHNldCB1cCBsb2dnaW5nIGFuZCBlcnJvciBib3VuZGFyaWVzXG4gICAqIHNwZWNpZmljIHRvIHlvdXIgZW52aXJvbm1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7RW1pdHRlclN1YnNjcmlwdGlvbn0gc3Vic2NyaXB0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICogQHBhcmFtIHsqfSBBcmJpdHJhcnkgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIHJlZ2lzdGVyZWQgbGlzdGVuZXJcbiAgICovXG5cbiAgQmFzZUV2ZW50RW1pdHRlci5wcm90b3R5cGUuX19lbWl0VG9TdWJzY3JpcHRpb24gPSBmdW5jdGlvbiBfX2VtaXRUb1N1YnNjcmlwdGlvbihzdWJzY3JpcHRpb24sIGV2ZW50VHlwZSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICBzdWJzY3JpcHRpb24ubGlzdGVuZXIuYXBwbHkoc3Vic2NyaXB0aW9uLmNvbnRleHQsIGFyZ3MpO1xuICB9O1xuXG4gIHJldHVybiBCYXNlRXZlbnRFbWl0dGVyO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlRXZlbnRFbWl0dGVyOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqIFxuICogQHByb3ZpZGVzTW9kdWxlIEVtaXR0ZXJTdWJzY3JpcHRpb25cbiAqIEB0eXBlY2hlY2tzXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIEV2ZW50U3Vic2NyaXB0aW9uID0gcmVxdWlyZSgnLi9FdmVudFN1YnNjcmlwdGlvbicpO1xuXG4vKipcbiAqIEVtaXR0ZXJTdWJzY3JpcHRpb24gcmVwcmVzZW50cyBhIHN1YnNjcmlwdGlvbiB3aXRoIGxpc3RlbmVyIGFuZCBjb250ZXh0IGRhdGEuXG4gKi9cblxudmFyIEVtaXR0ZXJTdWJzY3JpcHRpb24gPSAoZnVuY3Rpb24gKF9FdmVudFN1YnNjcmlwdGlvbikge1xuICBfaW5oZXJpdHMoRW1pdHRlclN1YnNjcmlwdGlvbiwgX0V2ZW50U3Vic2NyaXB0aW9uKTtcblxuICAvKipcbiAgICogQHBhcmFtIHtFdmVudFN1YnNjcmlwdGlvblZlbmRvcn0gc3Vic2NyaWJlciAtIFRoZSBzdWJzY3JpYmVyIHRoYXQgY29udHJvbHNcbiAgICogICB0aGlzIHN1YnNjcmlwdGlvblxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lciAtIEZ1bmN0aW9uIHRvIGludm9rZSB3aGVuIHRoZSBzcGVjaWZpZWQgZXZlbnQgaXNcbiAgICogICBlbWl0dGVkXG4gICAqIEBwYXJhbSB7Kn0gY29udGV4dCAtIE9wdGlvbmFsIGNvbnRleHQgb2JqZWN0IHRvIHVzZSB3aGVuIGludm9raW5nIHRoZVxuICAgKiAgIGxpc3RlbmVyXG4gICAqL1xuXG4gIGZ1bmN0aW9uIEVtaXR0ZXJTdWJzY3JpcHRpb24oc3Vic2NyaWJlciwgbGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRW1pdHRlclN1YnNjcmlwdGlvbik7XG5cbiAgICBfRXZlbnRTdWJzY3JpcHRpb24uY2FsbCh0aGlzLCBzdWJzY3JpYmVyKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgfVxuXG4gIHJldHVybiBFbWl0dGVyU3Vic2NyaXB0aW9uO1xufSkoRXZlbnRTdWJzY3JpcHRpb24pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXJTdWJzY3JpcHRpb247IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBFdmVudFN1YnNjcmlwdGlvblxuICogQHR5cGVjaGVja3NcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRXZlbnRTdWJzY3JpcHRpb24gcmVwcmVzZW50cyBhIHN1YnNjcmlwdGlvbiB0byBhIHBhcnRpY3VsYXIgZXZlbnQuIEl0IGNhblxuICogcmVtb3ZlIGl0cyBvd24gc3Vic2NyaXB0aW9uLlxuICovXG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgRXZlbnRTdWJzY3JpcHRpb24gPSAoZnVuY3Rpb24gKCkge1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0V2ZW50U3Vic2NyaXB0aW9uVmVuZG9yfSBzdWJzY3JpYmVyIHRoZSBzdWJzY3JpYmVyIHRoYXQgY29udHJvbHNcbiAgICogICB0aGlzIHN1YnNjcmlwdGlvbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gRXZlbnRTdWJzY3JpcHRpb24oc3Vic2NyaWJlcikge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudFN1YnNjcmlwdGlvbik7XG5cbiAgICB0aGlzLnN1YnNjcmliZXIgPSBzdWJzY3JpYmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhpcyBzdWJzY3JpcHRpb24gZnJvbSB0aGUgc3Vic2NyaWJlciB0aGF0IGNvbnRyb2xzIGl0LlxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvbi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgIGlmICh0aGlzLnN1YnNjcmliZXIpIHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlci5yZW1vdmVTdWJzY3JpcHRpb24odGhpcyk7XG4gICAgICB0aGlzLnN1YnNjcmliZXIgPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gRXZlbnRTdWJzY3JpcHRpb247XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50U3Vic2NyaXB0aW9uOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqIFxuICogQHByb3ZpZGVzTW9kdWxlIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yXG4gKiBAdHlwZWNoZWNrc1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcblxuLyoqXG4gKiBFdmVudFN1YnNjcmlwdGlvblZlbmRvciBzdG9yZXMgYSBzZXQgb2YgRXZlbnRTdWJzY3JpcHRpb25zIHRoYXQgYXJlXG4gKiBzdWJzY3JpYmVkIHRvIGEgcGFydGljdWxhciBldmVudCB0eXBlLlxuICovXG5cbnZhciBFdmVudFN1YnNjcmlwdGlvblZlbmRvciA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudFN1YnNjcmlwdGlvblZlbmRvcik7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZSA9IHt9O1xuICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBzdWJzY3JpcHRpb24ga2V5ZWQgYnkgYW4gZXZlbnQgdHlwZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICAgKiBAcGFyYW0ge0V2ZW50U3Vic2NyaXB0aW9ufSBzdWJzY3JpcHRpb25cbiAgICovXG5cbiAgRXZlbnRTdWJzY3JpcHRpb25WZW5kb3IucHJvdG90eXBlLmFkZFN1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uIGFkZFN1YnNjcmlwdGlvbihldmVudFR5cGUsIHN1YnNjcmlwdGlvbikge1xuICAgICEoc3Vic2NyaXB0aW9uLnN1YnNjcmliZXIgPT09IHRoaXMpID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ1RoZSBzdWJzY3JpYmVyIG9mIHRoZSBzdWJzY3JpcHRpb24gaXMgaW5jb3JyZWN0bHkgc2V0LicpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoIXRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0pIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0gPSBbXTtcbiAgICB9XG4gICAgdmFyIGtleSA9IHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0ubGVuZ3RoO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNGb3JUeXBlW2V2ZW50VHlwZV0ucHVzaChzdWJzY3JpcHRpb24pO1xuICAgIHN1YnNjcmlwdGlvbi5ldmVudFR5cGUgPSBldmVudFR5cGU7XG4gICAgc3Vic2NyaXB0aW9uLmtleSA9IGtleTtcbiAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgYnVsayBzZXQgb2YgdGhlIHN1YnNjcmlwdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7P3N0cmluZ30gZXZlbnRUeXBlIC0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZSB3aG9zZVxuICAgKiAgIHJlZ2lzdGVyZWQgc3Vwc2NyaXB0aW9ucyB0byByZW1vdmUsIGlmIG51bGwgcmVtb3ZlIGFsbCBzdWJzY3JpcHRpb25zLlxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvblZlbmRvci5wcm90b3R5cGUucmVtb3ZlQWxsU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIHJlbW92ZUFsbFN1YnNjcmlwdGlvbnMoZXZlbnRUeXBlKSB7XG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZSA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBzcGVjaWZpYyBzdWJzY3JpcHRpb24uIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIGZ1bmN0aW9uLCBjYWxsXG4gICAqIGBzdWJzY3JpcHRpb24ucmVtb3ZlKClgIGRpcmVjdGx5LlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gc3Vic2NyaXB0aW9uXG4gICAqL1xuXG4gIEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yLnByb3RvdHlwZS5yZW1vdmVTdWJzY3JpcHRpb24gPSBmdW5jdGlvbiByZW1vdmVTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uKSB7XG4gICAgdmFyIGV2ZW50VHlwZSA9IHN1YnNjcmlwdGlvbi5ldmVudFR5cGU7XG4gICAgdmFyIGtleSA9IHN1YnNjcmlwdGlvbi5rZXk7XG5cbiAgICB2YXIgc3Vic2NyaXB0aW9uc0ZvclR5cGUgPSB0aGlzLl9zdWJzY3JpcHRpb25zRm9yVHlwZVtldmVudFR5cGVdO1xuICAgIGlmIChzdWJzY3JpcHRpb25zRm9yVHlwZSkge1xuICAgICAgZGVsZXRlIHN1YnNjcmlwdGlvbnNGb3JUeXBlW2tleV07XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBzdWJzY3JpcHRpb25zIHRoYXQgYXJlIGN1cnJlbnRseSByZWdpc3RlcmVkIGZvciB0aGVcbiAgICogZ2l2ZW4gZXZlbnQgdHlwZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyBhcnJheSBjYW4gYmUgcG90ZW50aWFsbHkgc3BhcnNlIGFzIHN1YnNjcmlwdGlvbnMgYXJlIGRlbGV0ZWRcbiAgICogZnJvbSBpdCB3aGVuIHRoZXkgYXJlIHJlbW92ZWQuXG4gICAqXG4gICAqIFRPRE86IFRoaXMgcmV0dXJucyBhIG51bGxhYmxlIGFycmF5LiB3YXQ/XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICogQHJldHVybiB7P2FycmF5fVxuICAgKi9cblxuICBFdmVudFN1YnNjcmlwdGlvblZlbmRvci5wcm90b3R5cGUuZ2V0U3Vic2NyaXB0aW9uc0ZvclR5cGUgPSBmdW5jdGlvbiBnZXRTdWJzY3JpcHRpb25zRm9yVHlwZShldmVudFR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5fc3Vic2NyaXB0aW9uc0ZvclR5cGVbZXZlbnRUeXBlXTtcbiAgfTtcblxuICByZXR1cm4gRXZlbnRTdWJzY3JpcHRpb25WZW5kb3I7XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50U3Vic2NyaXB0aW9uVmVuZG9yOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogXG4gKi9cblxuZnVuY3Rpb24gbWFrZUVtcHR5RnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFyZztcbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGFjY2VwdHMgYW5kIGRpc2NhcmRzIGlucHV0czsgaXQgaGFzIG5vIHNpZGUgZWZmZWN0cy4gVGhpcyBpc1xuICogcHJpbWFyaWx5IHVzZWZ1bCBpZGlvbWF0aWNhbGx5IGZvciBvdmVycmlkYWJsZSBmdW5jdGlvbiBlbmRwb2ludHMgd2hpY2hcbiAqIGFsd2F5cyBuZWVkIHRvIGJlIGNhbGxhYmxlLCBzaW5jZSBKUyBsYWNrcyBhIG51bGwtY2FsbCBpZGlvbSBhbGEgQ29jb2EuXG4gKi9cbnZhciBlbXB0eUZ1bmN0aW9uID0gZnVuY3Rpb24gZW1wdHlGdW5jdGlvbigpIHt9O1xuXG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zID0gbWFrZUVtcHR5RnVuY3Rpb247XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zRmFsc2UgPSBtYWtlRW1wdHlGdW5jdGlvbihmYWxzZSk7XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVHJ1ZSA9IG1ha2VFbXB0eUZ1bmN0aW9uKHRydWUpO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc051bGwgPSBtYWtlRW1wdHlGdW5jdGlvbihudWxsKTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNUaGlzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zQXJndW1lbnQgPSBmdW5jdGlvbiAoYXJnKSB7XG4gIHJldHVybiBhcmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVtcHR5RnVuY3Rpb247IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVXNlIGludmFyaWFudCgpIHRvIGFzc2VydCBzdGF0ZSB3aGljaCB5b3VyIHByb2dyYW0gYXNzdW1lcyB0byBiZSB0cnVlLlxuICpcbiAqIFByb3ZpZGUgc3ByaW50Zi1zdHlsZSBmb3JtYXQgKG9ubHkgJXMgaXMgc3VwcG9ydGVkKSBhbmQgYXJndW1lbnRzXG4gKiB0byBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgYnJva2UgYW5kIHdoYXQgeW91IHdlcmVcbiAqIGV4cGVjdGluZy5cbiAqXG4gKiBUaGUgaW52YXJpYW50IG1lc3NhZ2Ugd2lsbCBiZSBzdHJpcHBlZCBpbiBwcm9kdWN0aW9uLCBidXQgdGhlIGludmFyaWFudFxuICogd2lsbCByZW1haW4gdG8gZW5zdXJlIGxvZ2ljIGRvZXMgbm90IGRpZmZlciBpbiBwcm9kdWN0aW9uLlxuICovXG5cbmZ1bmN0aW9uIGludmFyaWFudChjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgKyAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107XG4gICAgICB9KSk7XG4gICAgICBlcnJvci5uYW1lID0gJ0ludmFyaWFudCBWaW9sYXRpb24nO1xuICAgIH1cblxuICAgIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBpbnZhcmlhbnQncyBvd24gZnJhbWVcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDsiLCJ2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sO1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5jbGFtcGAgd2hpY2ggZG9lc24ndCBjb2VyY2UgYXJndW1lbnRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIFRoZSBudW1iZXIgdG8gY2xhbXAuXG4gKiBAcGFyYW0ge251bWJlcn0gW2xvd2VyXSBUaGUgbG93ZXIgYm91bmQuXG4gKiBAcGFyYW0ge251bWJlcn0gdXBwZXIgVGhlIHVwcGVyIGJvdW5kLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgY2xhbXBlZCBudW1iZXIuXG4gKi9cbmZ1bmN0aW9uIGJhc2VDbGFtcChudW1iZXIsIGxvd2VyLCB1cHBlcikge1xuICBpZiAobnVtYmVyID09PSBudW1iZXIpIHtcbiAgICBpZiAodXBwZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbnVtYmVyID0gbnVtYmVyIDw9IHVwcGVyID8gbnVtYmVyIDogdXBwZXI7XG4gICAgfVxuICAgIGlmIChsb3dlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBudW1iZXIgPSBudW1iZXIgPj0gbG93ZXIgPyBudW1iZXIgOiBsb3dlcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bWJlcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQ2xhbXA7XG4iLCJ2YXIgU3ltYm9sID0gcmVxdWlyZSgnLi9fU3ltYm9sJyksXG4gICAgZ2V0UmF3VGFnID0gcmVxdWlyZSgnLi9fZ2V0UmF3VGFnJyksXG4gICAgb2JqZWN0VG9TdHJpbmcgPSByZXF1aXJlKCcuL19vYmplY3RUb1N0cmluZycpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgbnVsbFRhZyA9ICdbb2JqZWN0IE51bGxdJyxcbiAgICB1bmRlZmluZWRUYWcgPSAnW29iamVjdCBVbmRlZmluZWRdJztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3ltVG9TdHJpbmdUYWcgPSBTeW1ib2wgPyBTeW1ib2wudG9TdHJpbmdUYWcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGdldFRhZ2Agd2l0aG91dCBmYWxsYmFja3MgZm9yIGJ1Z2d5IGVudmlyb25tZW50cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBgdG9TdHJpbmdUYWdgLlxuICovXG5mdW5jdGlvbiBiYXNlR2V0VGFnKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWRUYWcgOiBudWxsVGFnO1xuICB9XG4gIHZhbHVlID0gT2JqZWN0KHZhbHVlKTtcbiAgcmV0dXJuIChzeW1Ub1N0cmluZ1RhZyAmJiBzeW1Ub1N0cmluZ1RhZyBpbiB2YWx1ZSlcbiAgICA/IGdldFJhd1RhZyh2YWx1ZSlcbiAgICA6IG9iamVjdFRvU3RyaW5nKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlR2V0VGFnO1xuIiwiLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmcmVlR2xvYmFsO1xuIiwidmFyIG92ZXJBcmcgPSByZXF1aXJlKCcuL19vdmVyQXJnJyk7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIGdldFByb3RvdHlwZSA9IG92ZXJBcmcoT2JqZWN0LmdldFByb3RvdHlwZU9mLCBPYmplY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFByb3RvdHlwZTtcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKTtcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUdldFRhZ2Agd2hpY2ggaWdub3JlcyBgU3ltYm9sLnRvU3RyaW5nVGFnYCB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgcmF3IGB0b1N0cmluZ1RhZ2AuXG4gKi9cbmZ1bmN0aW9uIGdldFJhd1RhZyh2YWx1ZSkge1xuICB2YXIgaXNPd24gPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBzeW1Ub1N0cmluZ1RhZyksXG4gICAgICB0YWcgPSB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ107XG5cbiAgdHJ5IHtcbiAgICB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ10gPSB1bmRlZmluZWQ7XG4gICAgdmFyIHVubWFza2VkID0gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge31cblxuICB2YXIgcmVzdWx0ID0gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIGlmICh1bm1hc2tlZCkge1xuICAgIGlmIChpc093bikge1xuICAgICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdGFnO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdmFsdWVbc3ltVG9TdHJpbmdUYWddO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFJhd1RhZztcbiIsIi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBuYXRpdmVPYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgdXNpbmcgYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY29udmVydGVkIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIG5hdGl2ZU9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFRvU3RyaW5nO1xuIiwiLyoqXG4gKiBDcmVhdGVzIGEgdW5hcnkgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGBmdW5jYCB3aXRoIGl0cyBhcmd1bWVudCB0cmFuc2Zvcm1lZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gd3JhcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRyYW5zZm9ybSBUaGUgYXJndW1lbnQgdHJhbnNmb3JtLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIG92ZXJBcmcoZnVuYywgdHJhbnNmb3JtKSB7XG4gIHJldHVybiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gZnVuYyh0cmFuc2Zvcm0oYXJnKSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb3ZlckFyZztcbiIsInZhciBmcmVlR2xvYmFsID0gcmVxdWlyZSgnLi9fZnJlZUdsb2JhbCcpO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHNlbGZgLiAqL1xudmFyIGZyZWVTZWxmID0gdHlwZW9mIHNlbGYgPT0gJ29iamVjdCcgJiYgc2VsZiAmJiBzZWxmLk9iamVjdCA9PT0gT2JqZWN0ICYmIHNlbGY7XG5cbi8qKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0LiAqL1xudmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8IGZyZWVTZWxmIHx8IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gcm9vdDtcbiIsInZhciBiYXNlQ2xhbXAgPSByZXF1aXJlKCcuL19iYXNlQ2xhbXAnKSxcbiAgICB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKTtcblxuLyoqXG4gKiBDbGFtcHMgYG51bWJlcmAgd2l0aGluIHRoZSBpbmNsdXNpdmUgYGxvd2VyYCBhbmQgYHVwcGVyYCBib3VuZHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IE51bWJlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciBUaGUgbnVtYmVyIHRvIGNsYW1wLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsb3dlcl0gVGhlIGxvd2VyIGJvdW5kLlxuICogQHBhcmFtIHtudW1iZXJ9IHVwcGVyIFRoZSB1cHBlciBib3VuZC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNsYW1wZWQgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmNsYW1wKC0xMCwgLTUsIDUpO1xuICogLy8gPT4gLTVcbiAqXG4gKiBfLmNsYW1wKDEwLCAtNSwgNSk7XG4gKiAvLyA9PiA1XG4gKi9cbmZ1bmN0aW9uIGNsYW1wKG51bWJlciwgbG93ZXIsIHVwcGVyKSB7XG4gIGlmICh1cHBlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdXBwZXIgPSBsb3dlcjtcbiAgICBsb3dlciA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAodXBwZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIHVwcGVyID0gdG9OdW1iZXIodXBwZXIpO1xuICAgIHVwcGVyID0gdXBwZXIgPT09IHVwcGVyID8gdXBwZXIgOiAwO1xuICB9XG4gIGlmIChsb3dlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbG93ZXIgPSB0b051bWJlcihsb3dlcik7XG4gICAgbG93ZXIgPSBsb3dlciA9PT0gbG93ZXIgPyBsb3dlciA6IDA7XG4gIH1cbiAgcmV0dXJuIGJhc2VDbGFtcCh0b051bWJlcihudW1iZXIpLCBsb3dlciwgdXBwZXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYW1wO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJy4vbm93JyksXG4gICAgdG9OdW1iZXIgPSByZXF1aXJlKCcuL3RvTnVtYmVyJyk7XG5cbi8qKiBFcnJvciBtZXNzYWdlIGNvbnN0YW50cy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heCxcbiAgICBuYXRpdmVNaW4gPSBNYXRoLm1pbjtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZGVib3VuY2VkIGZ1bmN0aW9uIHRoYXQgZGVsYXlzIGludm9raW5nIGBmdW5jYCB1bnRpbCBhZnRlciBgd2FpdGBcbiAqIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHdhc1xuICogaW52b2tlZC4gVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGAgbWV0aG9kIHRvIGNhbmNlbFxuICogZGVsYXllZCBgZnVuY2AgaW52b2NhdGlvbnMgYW5kIGEgYGZsdXNoYCBtZXRob2QgdG8gaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uXG4gKiBQcm92aWRlIGBvcHRpb25zYCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGVcbiAqIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWRcbiAqIHdpdGggdGhlIGxhc3QgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnRcbiAqIGNhbGxzIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgXG4gKiBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXNcbiAqIGludm9rZWQgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uXG4gKiBpcyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogSWYgYHdhaXRgIGlzIGAwYCBhbmQgYGxlYWRpbmdgIGlzIGBmYWxzZWAsIGBmdW5jYCBpbnZvY2F0aW9uIGlzIGRlZmVycmVkXG4gKiB1bnRpbCB0byB0aGUgbmV4dCB0aWNrLCBzaW1pbGFyIHRvIGBzZXRUaW1lb3V0YCB3aXRoIGEgdGltZW91dCBvZiBgMGAuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZGVib3VuY2luZy10aHJvdHRsaW5nLWV4cGxhaW5lZC1leGFtcGxlcy8pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2FpdF1cbiAqICBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4LlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcbiAqXG4gKiAvLyBJbnZva2UgYHNlbmRNYWlsYCB3aGVuIGNsaWNrZWQsIGRlYm91bmNpbmcgc3Vic2VxdWVudCBjYWxscy5cbiAqIGpRdWVyeShlbGVtZW50KS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICpcbiAqIC8vIEVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHMuXG4gKiB2YXIgZGVib3VuY2VkID0gXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7ICdtYXhXYWl0JzogMTAwMCB9KTtcbiAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAqIGpRdWVyeShzb3VyY2UpLm9uKCdtZXNzYWdlJywgZGVib3VuY2VkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIGRlYm91bmNlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgZGVib3VuY2VkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxhc3RBcmdzLFxuICAgICAgbGFzdFRoaXMsXG4gICAgICBtYXhXYWl0LFxuICAgICAgcmVzdWx0LFxuICAgICAgdGltZXJJZCxcbiAgICAgIGxhc3RDYWxsVGltZSxcbiAgICAgIGxhc3RJbnZva2VUaW1lID0gMCxcbiAgICAgIGxlYWRpbmcgPSBmYWxzZSxcbiAgICAgIG1heGluZyA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHdhaXQgPSB0b051bWJlcih3YWl0KSB8fCAwO1xuICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XG4gICAgbWF4aW5nID0gJ21heFdhaXQnIGluIG9wdGlvbnM7XG4gICAgbWF4V2FpdCA9IG1heGluZyA/IG5hdGl2ZU1heCh0b051bWJlcihvcHRpb25zLm1heFdhaXQpIHx8IDAsIHdhaXQpIDogbWF4V2FpdDtcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gaW52b2tlRnVuYyh0aW1lKSB7XG4gICAgdmFyIGFyZ3MgPSBsYXN0QXJncyxcbiAgICAgICAgdGhpc0FyZyA9IGxhc3RUaGlzO1xuXG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gbGVhZGluZ0VkZ2UodGltZSkge1xuICAgIC8vIFJlc2V0IGFueSBgbWF4V2FpdGAgdGltZXIuXG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIC8vIFN0YXJ0IHRoZSB0aW1lciBmb3IgdGhlIHRyYWlsaW5nIGVkZ2UuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAvLyBJbnZva2UgdGhlIGxlYWRpbmcgZWRnZS5cbiAgICByZXR1cm4gbGVhZGluZyA/IGludm9rZUZ1bmModGltZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiByZW1haW5pbmdXYWl0KHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lLFxuICAgICAgICByZXN1bHQgPSB3YWl0IC0gdGltZVNpbmNlTGFzdENhbGw7XG5cbiAgICByZXR1cm4gbWF4aW5nID8gbmF0aXZlTWluKHJlc3VsdCwgbWF4V2FpdCAtIHRpbWVTaW5jZUxhc3RJbnZva2UpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkSW52b2tlKHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lO1xuXG4gICAgLy8gRWl0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGNhbGwsIGFjdGl2aXR5IGhhcyBzdG9wcGVkIGFuZCB3ZSdyZSBhdCB0aGVcbiAgICAvLyB0cmFpbGluZyBlZGdlLCB0aGUgc3lzdGVtIHRpbWUgaGFzIGdvbmUgYmFja3dhcmRzIGFuZCB3ZSdyZSB0cmVhdGluZ1xuICAgIC8vIGl0IGFzIHRoZSB0cmFpbGluZyBlZGdlLCBvciB3ZSd2ZSBoaXQgdGhlIGBtYXhXYWl0YCBsaW1pdC5cbiAgICByZXR1cm4gKGxhc3RDYWxsVGltZSA9PT0gdW5kZWZpbmVkIHx8ICh0aW1lU2luY2VMYXN0Q2FsbCA+PSB3YWl0KSB8fFxuICAgICAgKHRpbWVTaW5jZUxhc3RDYWxsIDwgMCkgfHwgKG1heGluZyAmJiB0aW1lU2luY2VMYXN0SW52b2tlID49IG1heFdhaXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRXhwaXJlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpO1xuICAgIGlmIChzaG91bGRJbnZva2UodGltZSkpIHtcbiAgICAgIHJldHVybiB0cmFpbGluZ0VkZ2UodGltZSk7XG4gICAgfVxuICAgIC8vIFJlc3RhcnQgdGhlIHRpbWVyLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgcmVtYWluaW5nV2FpdCh0aW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFpbGluZ0VkZ2UodGltZSkge1xuICAgIHRpbWVySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBPbmx5IGludm9rZSBpZiB3ZSBoYXZlIGBsYXN0QXJnc2Agd2hpY2ggbWVhbnMgYGZ1bmNgIGhhcyBiZWVuXG4gICAgLy8gZGVib3VuY2VkIGF0IGxlYXN0IG9uY2UuXG4gICAgaWYgKHRyYWlsaW5nICYmIGxhc3RBcmdzKSB7XG4gICAgICByZXR1cm4gaW52b2tlRnVuYyh0aW1lKTtcbiAgICB9XG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgIGlmICh0aW1lcklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkKTtcbiAgICB9XG4gICAgbGFzdEludm9rZVRpbWUgPSAwO1xuICAgIGxhc3RBcmdzID0gbGFzdENhbGxUaW1lID0gbGFzdFRoaXMgPSB0aW1lcklkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgcmV0dXJuIHRpbWVySWQgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IHRyYWlsaW5nRWRnZShub3coKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKSxcbiAgICAgICAgaXNJbnZva2luZyA9IHNob3VsZEludm9rZSh0aW1lKTtcblxuICAgIGxhc3RBcmdzID0gYXJndW1lbnRzO1xuICAgIGxhc3RUaGlzID0gdGhpcztcbiAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKGlzSW52b2tpbmcpIHtcbiAgICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGxlYWRpbmdFZGdlKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgICBpZiAobWF4aW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSBpbnZvY2F0aW9ucyBpbiBhIHRpZ2h0IGxvb3AuXG4gICAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgICAgIHJldHVybiBpbnZva2VGdW5jKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgZGVib3VuY2VkLmZsdXNoID0gZmx1c2g7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbicpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pc0xlbmd0aCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuIEEgdmFsdWUgaXMgY29uc2lkZXJlZCBhcnJheS1saWtlIGlmIGl0J3NcbiAqIG5vdCBhIGZ1bmN0aW9uIGFuZCBoYXMgYSBgdmFsdWUubGVuZ3RoYCB0aGF0J3MgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gb3JcbiAqIGVxdWFsIHRvIGAwYCBhbmQgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKCdhYmMnKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmICFpc0Z1bmN0aW9uKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5TGlrZTtcbiIsInZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpLFxuICAgIGlzUGxhaW5PYmplY3QgPSByZXF1aXJlKCcuL2lzUGxhaW5PYmplY3QnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBsaWtlbHkgYSBET00gZWxlbWVudC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIERPTSBlbGVtZW50LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNFbGVtZW50KGRvY3VtZW50LmJvZHkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNFbGVtZW50KCc8Ym9keT4nKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRWxlbWVudCh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiB2YWx1ZS5ub2RlVHlwZSA9PT0gMSAmJiAhaXNQbGFpbk9iamVjdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNFbGVtZW50O1xuIiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVJc0Zpbml0ZSA9IHJvb3QuaXNGaW5pdGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBmaW5pdGUgcHJpbWl0aXZlIG51bWJlci5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgYmFzZWQgb25cbiAqIFtgTnVtYmVyLmlzRmluaXRlYF0oaHR0cHM6Ly9tZG4uaW8vTnVtYmVyL2lzRmluaXRlKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGZpbml0ZSBudW1iZXIsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Zpbml0ZSgzKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRmluaXRlKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGaW5pdGUoSW5maW5pdHkpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzRmluaXRlKCczJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Zpbml0ZSh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIG5hdGl2ZUlzRmluaXRlKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Zpbml0ZTtcbiIsInZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXN5bmNUYWcgPSAnW29iamVjdCBBc3luY0Z1bmN0aW9uXScsXG4gICAgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgZ2VuVGFnID0gJ1tvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dJyxcbiAgICBwcm94eVRhZyA9ICdbb2JqZWN0IFByb3h5XSc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICghaXNPYmplY3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOSB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheXMgYW5kIG90aGVyIGNvbnN0cnVjdG9ycy5cbiAgdmFyIHRhZyA9IGJhc2VHZXRUYWcodmFsdWUpO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZyB8fCB0YWcgPT0gYXN5bmNUYWcgfHwgdGFnID09IHByb3h5VGFnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRnVuY3Rpb247XG4iLCIvKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgbGVuZ3RoLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBsb29zZWx5IGJhc2VkIG9uXG4gKiBbYFRvTGVuZ3RoYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtdG9sZW5ndGgpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNMZW5ndGgoMyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0xlbmd0aChOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0xlbmd0aChJbmZpbml0eSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoJzMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiZcbiAgICB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDw9IE1BWF9TQUZFX0lOVEVHRVI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNMZW5ndGg7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBudWxsaXNoLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNOaWwobnVsbCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc05pbCh2b2lkIDApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNOaWwoTmFOKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTmlsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PSBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTmlsO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdExpa2U7XG4iLCJ2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICBnZXRQcm90b3R5cGUgPSByZXF1aXJlKCcuL19nZXRQcm90b3R5cGUnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0VGFnID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGUsXG4gICAgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZnVuY1RvU3RyaW5nID0gZnVuY1Byb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogVXNlZCB0byBpbmZlciB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IuICovXG52YXIgb2JqZWN0Q3RvclN0cmluZyA9IGZ1bmNUb1N0cmluZy5jYWxsKE9iamVjdCk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIHRoYXQgaXMsIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZVxuICogYE9iamVjdGAgY29uc3RydWN0b3Igb3Igb25lIHdpdGggYSBgW1tQcm90b3R5cGVdXWAgb2YgYG51bGxgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC44LjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqIH1cbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QobmV3IEZvbyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoeyAneCc6IDAsICd5JzogMCB9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoT2JqZWN0LmNyZWF0ZShudWxsKSk7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgaWYgKCFpc09iamVjdExpa2UodmFsdWUpIHx8IGJhc2VHZXRUYWcodmFsdWUpICE9IG9iamVjdFRhZykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgcHJvdG8gPSBnZXRQcm90b3R5cGUodmFsdWUpO1xuICBpZiAocHJvdG8gPT09IG51bGwpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgQ3RvciA9IGhhc093blByb3BlcnR5LmNhbGwocHJvdG8sICdjb25zdHJ1Y3RvcicpICYmIHByb3RvLmNvbnN0cnVjdG9yO1xuICByZXR1cm4gdHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yIGluc3RhbmNlb2YgQ3RvciAmJlxuICAgIGZ1bmNUb1N0cmluZy5jYWxsKEN0b3IpID09IG9iamVjdEN0b3JTdHJpbmc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNQbGFpbk9iamVjdDtcbiIsInZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN5bWJvbGAgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHN5bWJvbCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3ltYm9sKFN5bWJvbC5pdGVyYXRvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N5bWJvbCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgYmFzZUdldFRhZyh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1N5bWJvbDtcbiIsInZhciByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKipcbiAqIEdldHMgdGhlIHRpbWVzdGFtcCBvZiB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZVxuICogdGhlIFVuaXggZXBvY2ggKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAyLjQuMFxuICogQGNhdGVnb3J5IERhdGVcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHRpbWVzdGFtcC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBMb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBpbnZvY2F0aW9uLlxuICovXG52YXIgbm93ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiByb290LkRhdGUubm93KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vdztcbiIsInZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIEVycm9yIG1lc3NhZ2UgY29uc3RhbnRzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgdGhyb3R0bGVkIGZ1bmN0aW9uIHRoYXQgb25seSBpbnZva2VzIGBmdW5jYCBhdCBtb3N0IG9uY2UgcGVyXG4gKiBldmVyeSBgd2FpdGAgbWlsbGlzZWNvbmRzLiBUaGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYFxuICogbWV0aG9kIHRvIGNhbmNlbCBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0b1xuICogaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uIFByb3ZpZGUgYG9wdGlvbnNgIHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgXG4gKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgXG4gKiB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWQgd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlXG4gKiB0aHJvdHRsZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIHRocm90dGxlZCBmdW5jdGlvbiByZXR1cm4gdGhlXG4gKiByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpc1xuICogaW52b2tlZCBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb25cbiAqIGlzIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBJZiBgd2FpdGAgaXMgYDBgIGFuZCBgbGVhZGluZ2AgaXMgYGZhbHNlYCwgYGZ1bmNgIGludm9jYXRpb24gaXMgZGVmZXJyZWRcbiAqIHVudGlsIHRvIHRoZSBuZXh0IHRpY2ssIHNpbWlsYXIgdG8gYHNldFRpbWVvdXRgIHdpdGggYSB0aW1lb3V0IG9mIGAwYC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8udGhyb3R0bGVgIGFuZCBgXy5kZWJvdW5jZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB0aHJvdHRsZSBpbnZvY2F0aW9ucyB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGV4Y2Vzc2l2ZWx5IHVwZGF0aW5nIHRoZSBwb3NpdGlvbiB3aGlsZSBzY3JvbGxpbmcuXG4gKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKSk7XG4gKlxuICogLy8gSW52b2tlIGByZW5ld1Rva2VuYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgYnV0IG5vdCBtb3JlIHRoYW4gb25jZSBldmVyeSA1IG1pbnV0ZXMuXG4gKiB2YXIgdGhyb3R0bGVkID0gXy50aHJvdHRsZShyZW5ld1Rva2VuLCAzMDAwMDAsIHsgJ3RyYWlsaW5nJzogZmFsc2UgfSk7XG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgdGhyb3R0bGVkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIHRocm90dGxlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgdGhyb3R0bGVkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxlYWRpbmcgPSB0cnVlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy5sZWFkaW5nIDogbGVhZGluZztcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG4gIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCB7XG4gICAgJ2xlYWRpbmcnOiBsZWFkaW5nLFxuICAgICdtYXhXYWl0Jzogd2FpdCxcbiAgICAndHJhaWxpbmcnOiB0cmFpbGluZ1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aHJvdHRsZTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTkFOID0gMCAvIDA7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBOQU47XG4gIH1cbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IHR5cGVvZiB2YWx1ZS52YWx1ZU9mID09ICdmdW5jdGlvbicgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UocmVUcmltLCAnJyk7XG4gIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gIHJldHVybiAoaXNCaW5hcnkgfHwgcmVJc09jdGFsLnRlc3QodmFsdWUpKVxuICAgID8gZnJlZVBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCBpc0JpbmFyeSA/IDIgOiA4KVxuICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvTnVtYmVyO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgaXNFbGVtZW50ICBmcm9tICdsb2Rhc2gvaXNFbGVtZW50JztcbmltcG9ydCBpc0Zpbml0ZSAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiBmcm9tICdsb2Rhc2gvaXNGdW5jdGlvbic7XG5pbXBvcnQgaXNOaWwgICAgICBmcm9tICdsb2Rhc2gvaXNOaWwnO1xuaW1wb3J0IGlzT2JqZWN0ICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCBfTWF0aCAgICAgIGZyb20gJy4vbWF0aC9tYXRoJztcbmltcG9ydCBNYXRyaXgyICAgIGZyb20gJy4vbWF0aC9tYXRyaXgyJztcbmltcG9ydCB7IFR5cGUgfSAgIGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCBVdGlscyAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQW5pbWF0aW9uXG4qIEBjb25zdHJ1Y3RvclxuKiBAZXh0ZW5kcyBleHRlcm5hbDpUaW1lbGluZU1heFxuKiBAcGFyYW0ge0NhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYSB0byBiZSBhbmltYXRlZC5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5kZXN0cm95T25Db21wbGV0ZV0gLSBXaGV0aGVyIHRoZSBhbmltYXRpb24gc2hvdWxkIGJlIGRlc3Ryb3llZCBvbmNlIGl0IGhhcyBjb21wbGV0ZWQuXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteUFuaW1hdGlvbiA9IG5ldyBPY3Vsby5BbmltYXRpb24obXlDYW1lcmEsIHsgXG4qICAgZGVzdHJveU9uQ29tcGxldGU6IHRydWVcbiogfSkuem9vbVRvKDIsIDEpLnNoYWtlKDAuMSwgMikucGxheSgpO1xuKi9cbmNsYXNzIEFuaW1hdGlvbiBleHRlbmRzIFRpbWVsaW5lTWF4IHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIHBhdXNlZDogdHJ1ZVxuICAgICAgICB9LCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIHN1cGVyKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpKTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgaW5pdGlhbCBjb25maWd1cmF0aW9uLlxuICAgICAgICAqIEBkZWZhdWx0IHt9O1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnM7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgdHlwZSBvZiB0aGlzIG9iamVjdC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy50eXBlID0gVHlwZS5BTklNQVRJT047XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge0NhbWVyYX0gLSBUaGUgY2FtZXJhIG9uIHdoaWNoIHRoZSBhbmltYXRpb24gd2lsbCBiZSBhcHBsaWVkLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYSB8fCBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUaW1lbGluZUxpdGV9IC0gVGhlIGN1cnJlbnQgYWN0aXZlIHN1Yi1hbmltYXRpb24gY29uc2lzdGluZyBvZiB0aGUgY29yZSBjYW1lcmEgYW5pbWF0aW9uIGFuZCBlZmZlY3QgYW5pbWF0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50U3ViQW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBhbmltYXRpb24gc2hvdWxkIGJlIGRlc3Ryb3llZCBvbmNlIGl0IGhhcyBjb21wbGV0ZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZGVzdHJveU9uQ29tcGxldGUgPSBvcHRpb25zLmRlc3Ryb3lPbkNvbXBsZXRlID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtvYmplY3R9IC0gVGhlIGNhbWVyYSB2YWx1ZXMgb2YgdGhlIHByZXZpb3VzIHN1Yi1hbmltYXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IHt9O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgc3RhcnRlZC5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uU3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kdXJhdGlvbigpID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZGlzYWJsZURyYWcoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuaXNNYW51YWxab29tYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZGlzYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25TdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25TdGFydC5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vblN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBvbmNlIGRldiBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBzdGFydGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIHVwZGF0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vblVwZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25VcGRhdGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25VcGRhdGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmR1cmF0aW9uKCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzTWFudWFsWm9vbWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmVuYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25Db21wbGV0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25Db21wbGV0ZS5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vbkNvbXBsZXRlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuZGVzdHJveU9uQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBvbmNlIGRldiBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBjb21wbGV0ZWQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25TdGFydCcsIHRoaXMuX29uU3RhcnQpO1xuICAgICAgICB0aGlzLmV2ZW50Q2FsbGJhY2soJ29uVXBkYXRlJywgdGhpcy5fb25VcGRhdGUpO1xuICAgICAgICB0aGlzLmV2ZW50Q2FsbGJhY2soJ29uQ29tcGxldGUnLCB0aGlzLl9vbkNvbXBsZXRlKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBbmltYXRlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgX2FuaW1hdGUgKHByb3BzLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIHZhciBtYWluVGltZWxpbmUgPSBuZXcgVGltZWxpbmVMaXRlKHtcbiAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdWJBbmltYXRpb24gPSBzZWxmO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHNoYWtlVGltZWxpbmUgPSBudWxsO1xuICAgICAgICB2YXIgc2hha2UgPSB0aGlzLl9wYXJzZVNoYWtlKHByb3BzLnNoYWtlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIGNvcmUgY2FtZXJhIHByb3BlcnRpZXNcbiAgICAgICAgaWYgKHByb3BzLm9yaWdpbiB8fCBwcm9wcy5wb3NpdGlvbiB8fCBwcm9wcy5yb3RhdGlvbiB8fCBwcm9wcy56b29tKSB7XG4gICAgICAgICAgICBtYWluVGltZWxpbmUuYWRkKFR3ZWVuTWF4LnRvKHRoaXMuY2FtZXJhLCBkdXJhdGlvbiwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlT3JpZ2luOiBwcm9wcy5vcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZVBvc2l0aW9uOiBwcm9wcy5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgc291cmNlUm90YXRpb246IHByb3BzLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2Vab29tOiBwcm9wcy56b29tXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgaW1tZWRpYXRlUmVuZGVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnNlZFByb3BzID0gdGhpcy5fcGFyc2VQcm9wcyhzZWxmLmRhdGEuc291cmNlT3JpZ2luLCBzZWxmLmRhdGEuc291cmNlUG9zaXRpb24sIHNlbGYuZGF0YS5zb3VyY2VSb3RhdGlvbiwgc2VsZi5kYXRhLnNvdXJjZVpvb20sIHRoaXMuY2FtZXJhKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVuZFByb3BzID0gdGhpcy5fY2FsY3VsYXRlRW5kUHJvcHMocGFyc2VkUHJvcHMucGFyc2VkT3JpZ2luLCBwYXJzZWRQcm9wcy5wYXJzZWRQb3NpdGlvbiwgcGFyc2VkUHJvcHMucGFyc2VkUm90YXRpb24sIHBhcnNlZFByb3BzLnBhcnNlZFpvb20sIHRoaXMuY2FtZXJhKTtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihzZWxmLmRhdGEsIHBhcnNlZFByb3BzLCBlbmRQcm9wcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzLnBvc2l0aW9uID0gdGhpcy5jYW1lcmEucG9zaXRpb247XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNQcm9wcy5yb3RhdGlvbiA9IHRoaXMuY2FtZXJhLnJvdGF0aW9uO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzUHJvcHMuem9vbSA9IHRoaXMuY2FtZXJhLnpvb207XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU21vb3RoIG9yaWdpbiBjaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuX3NldFRyYW5zZm9ybU9yaWdpbihlbmRQcm9wcy5lbmRPcmlnaW4pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZvciBkZXYgb25seVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndHdlZW4gZGF0YTogJywgc2VsZi5kYXRhKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZVRvKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhd09mZnNldFg6IGVuZFByb3BzLmVuZE9mZnNldFgsXG4gICAgICAgICAgICAgICAgICAgICAgICByYXdPZmZzZXRZOiBlbmRQcm9wcy5lbmRPZmZzZXRZLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGVuZFByb3BzLmVuZFJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogZW5kUHJvcHMuZW5kWm9vbVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLmNvcmUgPSBzZWxmO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIHNoYWtlIGVmZmVjdFxuICAgICAgICBpZiAoZHVyYXRpb24gPiAwICYmIHNoYWtlICYmIHNoYWtlLmludGVuc2l0eSA+IDApIHtcbiAgICAgICAgICAgIHNoYWtlVGltZWxpbmUgPSBuZXcgVGltZWxpbmVMaXRlKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBzaGFrZS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgIHJlc3BlY3RCb3VuZHM6IHNoYWtlLnJlc3BlY3RCb3VuZHNcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICAgICAgb25TdGFydFBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblN0YXJ0OiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLnNoYWtlID0gc2VsZjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuaXNTaGFraW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2hha2VSZXNwZWN0Qm91bmRzID0gKHRoaXMuZGF0YS5yZXNwZWN0Qm91bmRzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uSE9SSVpPTlRBTCB8fCBzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNoYWtlT2Zmc2V0LnggPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLndpZHRoICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLlZFUlRJQ0FMIHx8IHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2hha2VPZmZzZXQueSA9IE1hdGgucmFuZG9tKCkgKiBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0ICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2hha2VPZmZzZXQueCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNoYWtlT2Zmc2V0LnkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5pc1NoYWtpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2hha2VSZXNwZWN0Qm91bmRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEVhc2UgaW4vb3V0XG4gICAgICAgICAgICBpZiAoc2hha2UuZWFzZUluICYmIHNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uICogMC41LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VJbiB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcblxuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUudG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiAqIDAuNSwgeyBcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlT3V0IHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIGR1cmF0aW9uICogMC41KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2UgaW4gb3IgZWFzZVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hha2UuZWFzZUluICYmICFzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlSW4gfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlIG91dFxuICAgICAgICAgICAgZWxzZSBpZiAoIXNoYWtlLmVhc2VJbiAmJiBzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eVxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlT3V0IHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZVxuICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5lYXNlKSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBvcHRpb25zLmVhc2UgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBObyBlYXNlXG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmRhdGEuaW50ZW5zaXR5ID0gc2hha2UuaW50ZW5zaXR5O1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUudG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge30sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBtYWluVGltZWxpbmUuYWRkKHNoYWtlVGltZWxpbmUsIDApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFkZChtYWluVGltZWxpbmUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2FsY3VsYXRlcyB0aGUgZW5kIHByb3BlcnR5IHZhbHVlcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R8VmVjdG9yMn0gc291cmNlT3JpZ2luIC0gVGhlIHNvdXJjZSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge09iamVjdHxWZWN0b3IyfSBzb3VyY2VQb3NpdGlvbiAtIFRoZSBzb3VyY2UgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc291cmNlUm90YXRpb24gLSBUaGUgc291cmNlIHJvdGF0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHNvdXJjZVpvb20gLSBUaGUgc291cmNlIHpvb20uXG4gICAgKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYS5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIGVuZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2NhbGN1bGF0ZUVuZFByb3BzIChzb3VyY2VPcmlnaW4sIHNvdXJjZVBvc2l0aW9uLCBzb3VyY2VSb3RhdGlvbiwgc291cmNlWm9vbSwgY2FtZXJhKSB7XG4gICAgICAgIHNvdXJjZU9yaWdpbiA9IHNvdXJjZU9yaWdpbiB8fCB7fTtcbiAgICAgICAgc291cmNlUG9zaXRpb24gPSBzb3VyY2VQb3NpdGlvbiB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIHZhciBlbmRQb3NpdGlvbiwgZW5kT2Zmc2V0O1xuICAgICAgICB2YXIgcG9zaXRpb24gPSBuZXcgVmVjdG9yMihpc0Zpbml0ZShzb3VyY2VQb3NpdGlvbi54KSA/IHNvdXJjZVBvc2l0aW9uLnggOiBjYW1lcmEucG9zaXRpb24ueCwgaXNGaW5pdGUoc291cmNlUG9zaXRpb24ueSkgPyBzb3VyY2VQb3NpdGlvbi55IDogY2FtZXJhLnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgb3JpZ2luID0gbmV3IFZlY3RvcjIoaXNGaW5pdGUoc291cmNlT3JpZ2luLngpID8gc291cmNlT3JpZ2luLnggOiBjYW1lcmEudHJhbnNmb3JtT3JpZ2luLngsIGlzRmluaXRlKHNvdXJjZU9yaWdpbi55KSA/IHNvdXJjZU9yaWdpbi55IDogY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi55KTtcbiAgICAgICAgdmFyIHJvdGF0aW9uID0gaXNGaW5pdGUoc291cmNlUm90YXRpb24pID8gc291cmNlUm90YXRpb24gOiBjYW1lcmEucm90YXRpb247XG4gICAgICAgIHZhciB6b29tID0gY2FtZXJhLl9jbGFtcFpvb20oaXNGaW5pdGUoc291cmNlWm9vbSkgPyBzb3VyY2Vab29tIDogY2FtZXJhLnpvb20pO1xuICAgICAgICB2YXIgdHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHpvb20sIHpvb20pLnJvdGF0ZShfTWF0aC5kZWdUb1JhZCgtcm90YXRpb24pKTtcbiAgICAgICAgdmFyIGNhbWVyYUZPVlBvc2l0aW9uID0gY2FtZXJhLmNlbnRlcjtcblxuICAgICAgICB2YXIgaXNNb3ZpbmcgPSBpc0Zpbml0ZShzb3VyY2VQb3NpdGlvbi54KSB8fCBpc0Zpbml0ZShzb3VyY2VQb3NpdGlvbi55KTtcbiAgICAgICAgdmFyIGlzUm90YXRpbmcgPSBpc0Zpbml0ZShzb3VyY2VSb3RhdGlvbikgJiYgc291cmNlUm90YXRpb24gIT09IGNhbWVyYS5yb3RhdGlvbjtcbiAgICAgICAgdmFyIGlzWm9vbWluZyA9IGlzRmluaXRlKHNvdXJjZVpvb20pICYmIHNvdXJjZVpvb20gIT09IGNhbWVyYS56b29tO1xuXG4gICAgICAgIC8vIHJvdGF0ZVRvLCB6b29tVG9cbiAgICAgICAgaWYgKCFpc01vdmluZyAmJiAhaXNGaW5pdGUoc291cmNlT3JpZ2luLngpICYmICFpc0Zpbml0ZShzb3VyY2VPcmlnaW4ueSkpIHtcbiAgICAgICAgICAgIG9yaWdpbi5jb3B5KGNhbWVyYS5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHJvdGF0ZUF0LCByb3RhdGVUbywgem9vbUF0LCB6b29tVG9cbiAgICAgICAgaWYgKCFpc01vdmluZykge1xuICAgICAgICAgICAgcG9zaXRpb24uY29weShvcmlnaW4pO1xuICAgICAgICAgICAgY2FtZXJhRk9WUG9zaXRpb24gPSBjYW1lcmEuX2NhbGN1bGF0ZUNvbnRleHRQb3NpdGlvbihvcmlnaW4sIGNhbWVyYS5wb3NpdGlvbiwgY2FtZXJhLmNlbnRlciwgY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVuZFBvc2l0aW9uID0gY2FtZXJhLl9jYWxjdWxhdGVQb3NpdGlvbkZyb21Qb3NpdGlvbihwb3NpdGlvbiwgY2FtZXJhRk9WUG9zaXRpb24sIGNhbWVyYS5jZW50ZXIsIG9yaWdpbiwgdHJhbnNmb3JtYXRpb24pO1xuICAgICAgICBlbmRPZmZzZXQgPSBjYW1lcmEuX2NhbGN1bGF0ZU9mZnNldEZyb21Qb3NpdGlvbihlbmRQb3NpdGlvbiwgY2FtZXJhLmNlbnRlciwgb3JpZ2luLCB0cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNNb3Zpbmc6IGlzTW92aW5nLFxuICAgICAgICAgICAgaXNSb3RhdGluZzogaXNSb3RhdGluZyxcbiAgICAgICAgICAgIGlzWm9vbWluZzogaXNab29taW5nLFxuICAgICAgICAgICAgZW5kT2Zmc2V0WDogaXNNb3ZpbmcgPyBlbmRPZmZzZXQueCA6IG51bGwsXG4gICAgICAgICAgICBlbmRPZmZzZXRZOiBpc01vdmluZyA/IGVuZE9mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIGVuZE9yaWdpbjogKHNvdXJjZU9yaWdpbi54IHx8IHNvdXJjZU9yaWdpbi55IHx8ICFpc01vdmluZykgPyBvcmlnaW4gOiBudWxsLFxuICAgICAgICAgICAgZW5kUm90YXRpb246ICFpc05pbChzb3VyY2VSb3RhdGlvbikgPyByb3RhdGlvbiA6IG51bGwsXG4gICAgICAgICAgICBlbmRab29tOiBzb3VyY2Vab29tID8gem9vbSA6IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZXMgdGhlIGNvcmUgYW5pbWF0aW9uIHByb3BlcnRpZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2VPcmlnaW4gLSBUaGUgb3JpZ2luLlxuICAgICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZVBvc2l0aW9uIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2VSb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2Vab29tIC0gVGhlIHpvb20uXG4gICAgKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYS5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlUHJvcHMgKHNvdXJjZU9yaWdpbiwgc291cmNlUG9zaXRpb24sIHNvdXJjZVJvdGF0aW9uLCBzb3VyY2Vab29tLCBjYW1lcmEpIHtcbiAgICAgICAgaWYgKHNvdXJjZVBvc2l0aW9uID09PSAncHJldmlvdXMnICYmIHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgc291cmNlUG9zaXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucG9zaXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChzb3VyY2VSb3RhdGlvbiA9PT0gJ3ByZXZpb3VzJyAmJiAhaXNOaWwodGhpcy5wcmV2aW91c1Byb3BzLnJvdGF0aW9uKSkge1xuICAgICAgICAgICAgc291cmNlUm90YXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChzb3VyY2Vab29tID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMuem9vbSkpIHtcbiAgICAgICAgICAgIHNvdXJjZVpvb20gPSB0aGlzLnByZXZpb3VzUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBwYXJzZWRPcmlnaW46IFV0aWxzLnBhcnNlUG9zaXRpb24oc291cmNlT3JpZ2luLCBjYW1lcmEuc2NlbmUudmlldyksXG4gICAgICAgICAgICBwYXJzZWRQb3NpdGlvbjogVXRpbHMucGFyc2VQb3NpdGlvbihzb3VyY2VQb3NpdGlvbiwgY2FtZXJhLnNjZW5lLnZpZXcpLFxuICAgICAgICAgICAgcGFyc2VkUm90YXRpb246ICFpc05pbChzb3VyY2VSb3RhdGlvbikgPyBzb3VyY2VSb3RhdGlvbiA6IG51bGwsXG4gICAgICAgICAgICBwYXJzZWRab29tOiBzb3VyY2Vab29tIHx8IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZXMgdGhlIHNoYWtlIHByb3BlcnRpZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBzaGFrZSAtIFRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgcGFyc2VkIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfcGFyc2VTaGFrZSAoc2hha2UpIHtcbiAgICAgICAgdmFyIHBhcnNlZFNoYWtlID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmIChzaGFrZSkge1xuICAgICAgICAgICAgcGFyc2VkU2hha2UgPSB7XG4gICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBpc05pbChzaGFrZS5pbnRlbnNpdHkpID8gMCA6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGlzTmlsKHNoYWtlLmRpcmVjdGlvbikgPyBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEggOiBzaGFrZS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgZWFzZUluOiBzaGFrZS5lYXNlSW4sXG4gICAgICAgICAgICAgICAgZWFzZU91dDogc2hha2UuZWFzZU91dCxcbiAgICAgICAgICAgICAgICByZXNwZWN0Qm91bmRzOiBzaGFrZS5yZXNwZWN0Qm91bmRzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcGFyc2VkU2hha2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU3RvcHMgdGhlIGFuaW1hdGlvbiBhbmQgcmVsZWFzZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5kZXN0cm95KCk7XG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgc3VwZXIua2lsbCgpO1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIHRoaXMuY3VycmVudFN1YkFuaW1hdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IG51bGw7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLnBvc2l0aW9uXSAtIFRoZSBsb2NhdGlvbiB0byBtb3ZlIHRvLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5wb3NpdGlvbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLm9yaWdpbl0gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLm9yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Byb3BzLnJvdGF0aW9uXSAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2VdIC0gQW4gb2JqZWN0IG9mIHNoYWtlIGVmZmVjdCBwcm9wZXJ0aWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5zaGFrZS5pbnRlbnNpdHldIC0gQSB7QGxpbmsgQ2FtZXJhI3NoYWtlSW50ZW5zaXR5fHNoYWtlIGludGVuc2l0eX0uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtwcm9wcy5zaGFrZS5kaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZU91dF0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnpvb21dIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246ICcjYm94MTAwJywgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7b3JpZ2luOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjoge3g6IDIwMCwgeTogNTB9LCB6b29tOiAyfSwgMSk7XG4gICAgKi9cbiAgICBhbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBwb3NpdGlvbjogcHJvcHMucG9zaXRpb24sXG4gICAgICAgICAgICBvcmlnaW46IHByb3BzLm9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiBwcm9wcy5yb3RhdGlvbixcbiAgICAgICAgICAgIHNoYWtlOiBwcm9wcy5zaGFrZSxcbiAgICAgICAgICAgIHpvb206IHByb3BzLnpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE1vdmUgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gcG9zaXRpb24gLSBUaGUgcG9zaXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24ubW92ZVRvKCcjYm94MTAwJywgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eDoyMDAsIHk6IDUwfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6IDIwMH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt5OiAyMDB9LCAxKTtcbiAgICAqL1xuICAgIG1vdmVUbyAocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gb3JpZ2luIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgcm90YXRpb24ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KCcjYm94MTAwJywgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyMCwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCh7eDogMjAwLCB5OiA1MH0sIDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZUF0IChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogb3JpZ2luLFxuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZVRvKDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZVRvIChyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICByb3RhdGlvbjogcm90YXRpb25cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNoYWtlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGludGVuc2l0eSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbn0gW2RpcmVjdGlvbj1PY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEhdIC0gQSBzaGFrZSBkaXJlY3Rpb24uIFxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9IG9wdGlvbnMgcGx1czpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlSW5dIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uc2hha2UoMC4xLCA0KTtcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCwgT2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5IT1JJWk9OVEFMLCB7IGVhc2VJbjogUG93ZXIyLmVhc2VJbiwgZWFzZU91dDogUG93ZXIyLmVhc2VPdXQgfSlcbiAgICAqL1xuICAgIHNoYWtlIChpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2hha2U6IHtcbiAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IGludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICBlYXNlSW46IG9wdGlvbnMuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IG9wdGlvbnMuZWFzZU91dCxcbiAgICAgICAgICAgICAgICByZXNwZWN0Qm91bmRzOiBvcHRpb25zLnJlc3BlY3RCb3VuZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHpvb20ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoJyNib3gxMDAnLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm94MTAwJyksIDIsIDEpO1xuICAgICogbXlBbmltYXRpb24uem9vbUF0KHt4OiAyMDAsIHk6IDUwfSwgMiwgMSk7XG4gICAgKi9cbiAgICB6b29tQXQgKG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHpvb206IHpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogWm9vbSBpbi9vdXQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tVG8oMiwgMSk7XG4gICAgKi9cbiAgICB6b29tVG8gKHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoeyBcbiAgICAgICAgICAgIHpvb206IHpvb20gXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuKiBTaGFrZSBkaXJlY3Rpb25zLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbkFuaW1hdGlvbi5zaGFrZSA9IHtcbiAgICBkaXJlY3Rpb246IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQm90aCB0aGUgeCBhbmQgeSBheGVzLlxuICAgICAgICAqL1xuICAgICAgICBCT1RIOiAwLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeCBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBIT1JJWk9OVEFMOiAxLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeSBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBWRVJUSUNBTDogMlxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQW5pbWF0aW9uOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgaXNFbGVtZW50ICBmcm9tICdsb2Rhc2gvaXNFbGVtZW50JztcbmltcG9ydCBpc0Zpbml0ZSAgIGZyb20gJ2xvZGFzaC9pc0Zpbml0ZSc7XG5pbXBvcnQgaXNGdW5jdGlvbiBmcm9tICdsb2Rhc2gvaXNGdW5jdGlvbic7XG5pbXBvcnQgaXNOaWwgICAgICBmcm9tICdsb2Rhc2gvaXNOaWwnO1xuaW1wb3J0IGlzT2JqZWN0ICAgZnJvbSAnbG9kYXNoL2lzT2JqZWN0JztcbmltcG9ydCBfTWF0aCAgICAgIGZyb20gJy4vbWF0aC9tYXRoJztcbmltcG9ydCBNYXRyaXgyICAgIGZyb20gJy4vbWF0aC9tYXRyaXgyJztcbmltcG9ydCB7IFR5cGUgfSAgIGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCBVdGlscyAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQW5pbWF0aW9uXG4qIEBjb25zdHJ1Y3RvclxuKiBAZXh0ZW5kcyBleHRlcm5hbDpUaW1lbGluZU1heFxuKiBAcGFyYW0ge0NhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYSB0byBiZSBhbmltYXRlZC5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5kZXN0cm95T25Db21wbGV0ZV0gLSBXaGV0aGVyIHRoZSBhbmltYXRpb24gc2hvdWxkIGJlIGRlc3Ryb3llZCBvbmNlIGl0IGhhcyBjb21wbGV0ZWQuXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteUFuaW1hdGlvbiA9IG5ldyBPY3Vsby5BbmltYXRpb24obXlDYW1lcmEsIHsgXG4qICAgZGVzdHJveU9uQ29tcGxldGU6IHRydWVcbiogfSkuem9vbVRvKDIsIDEpLnNoYWtlKDAuMSwgMikucGxheSgpO1xuKi9cbmNsYXNzIEFuaW1hdGlvbiBleHRlbmRzIFRpbWVsaW5lTWF4IHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIHBhdXNlZDogdHJ1ZVxuICAgICAgICB9LCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIHN1cGVyKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpKTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgaW5pdGlhbCBjb25maWd1cmF0aW9uLlxuICAgICAgICAqIEBkZWZhdWx0IHt9O1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnM7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgdHlwZSBvZiB0aGlzIG9iamVjdC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy50eXBlID0gVHlwZS5BTklNQVRJT047XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge0NhbWVyYX0gLSBUaGUgY2FtZXJhIG9uIHdoaWNoIHRoZSBhbmltYXRpb24gd2lsbCBiZSBhcHBsaWVkLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYSB8fCBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUaW1lbGluZUxpdGV9IC0gVGhlIGN1cnJlbnQgYWN0aXZlIHN1Yi1hbmltYXRpb24gY29uc2lzdGluZyBvZiB0aGUgY29yZSBjYW1lcmEgYW5pbWF0aW9uIGFuZCBlZmZlY3QgYW5pbWF0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50U3ViQW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBhbmltYXRpb24gc2hvdWxkIGJlIGRlc3Ryb3llZCBvbmNlIGl0IGhhcyBjb21wbGV0ZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZGVzdHJveU9uQ29tcGxldGUgPSBvcHRpb25zLmRlc3Ryb3lPbkNvbXBsZXRlID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtvYmplY3R9IC0gVGhlIGNhbWVyYSB2YWx1ZXMgb2YgdGhlIHByZXZpb3VzIHN1Yi1hbmltYXRpb24uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IHt9O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgc3RhcnRlZC5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uU3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kdXJhdGlvbigpID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbWVyYS5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZGlzYWJsZURyYWcoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYW1lcmEuaXNNYW51YWxab29tYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS50cmFja0NvbnRyb2wuZGlzYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25TdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25TdGFydC5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vblN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBvbmNlIGRldiBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBzdGFydGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIHVwZGF0ZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5vblVwZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25VcGRhdGUuYXBwbHkodGhpcywgdGhpcy5jb25maWcub25VcGRhdGVQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLlxuICAgICAgICAqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmR1cmF0aW9uKCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FtZXJhLmlzTWFudWFsWm9vbWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEudHJhY2tDb250cm9sLmVuYWJsZVdoZWVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcub25Db21wbGV0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcub25Db21wbGV0ZS5hcHBseSh0aGlzLCB0aGlzLmNvbmZpZy5vbkNvbXBsZXRlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuZGVzdHJveU9uQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBvbmNlIGRldiBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuaW1hdGlvbiBjb21wbGV0ZWQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRDYWxsYmFjaygnb25TdGFydCcsIHRoaXMuX29uU3RhcnQpO1xuICAgICAgICB0aGlzLmV2ZW50Q2FsbGJhY2soJ29uVXBkYXRlJywgdGhpcy5fb25VcGRhdGUpO1xuICAgICAgICB0aGlzLmV2ZW50Q2FsbGJhY2soJ29uQ29tcGxldGUnLCB0aGlzLl9vbkNvbXBsZXRlKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBbmltYXRlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgX2FuaW1hdGUgKHByb3BzLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIHZhciBtYWluVGltZWxpbmUgPSBuZXcgVGltZWxpbmVMaXRlKHtcbiAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICBvblN0YXJ0UGFyYW1zOiBbJ3tzZWxmfSddLFxuICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdWJBbmltYXRpb24gPSBzZWxmO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHNoYWtlVGltZWxpbmUgPSBudWxsO1xuICAgICAgICB2YXIgc2hha2UgPSB0aGlzLl9wYXJzZVNoYWtlKHByb3BzLnNoYWtlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIGNvcmUgY2FtZXJhIHByb3BlcnRpZXNcbiAgICAgICAgaWYgKHByb3BzLm9yaWdpbiB8fCBwcm9wcy5wb3NpdGlvbiB8fCBwcm9wcy5yb3RhdGlvbiB8fCBwcm9wcy56b29tKSB7XG4gICAgICAgICAgICBtYWluVGltZWxpbmUuYWRkKFR3ZWVuTWF4LnRvKHRoaXMuY2FtZXJhLCBkdXJhdGlvbiwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlT3JpZ2luOiBwcm9wcy5vcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZVBvc2l0aW9uOiBwcm9wcy5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgc291cmNlUm90YXRpb246IHByb3BzLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2Vab29tOiBwcm9wcy56b29tXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgaW1tZWRpYXRlUmVuZGVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1Njb3BlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG9uU3RhcnRQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25TdGFydDogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnNlZFByb3BzID0gdGhpcy5fcGFyc2VQcm9wcyhzZWxmLmRhdGEuc291cmNlT3JpZ2luLCBzZWxmLmRhdGEuc291cmNlUG9zaXRpb24sIHNlbGYuZGF0YS5zb3VyY2VSb3RhdGlvbiwgc2VsZi5kYXRhLnNvdXJjZVpvb20sIHRoaXMuY2FtZXJhKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVuZFByb3BzID0gdGhpcy5fY2FsY3VsYXRlRW5kUHJvcHMocGFyc2VkUHJvcHMucGFyc2VkT3JpZ2luLCBwYXJzZWRQcm9wcy5wYXJzZWRQb3NpdGlvbiwgcGFyc2VkUHJvcHMucGFyc2VkUm90YXRpb24sIHBhcnNlZFByb3BzLnBhcnNlZFpvb20sIHRoaXMuY2FtZXJhKTtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihzZWxmLmRhdGEsIHBhcnNlZFByb3BzLCBlbmRQcm9wcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91c1Byb3BzLnBvc2l0aW9uID0gdGhpcy5jYW1lcmEucG9zaXRpb247XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNQcm9wcy5yb3RhdGlvbiA9IHRoaXMuY2FtZXJhLnJvdGF0aW9uO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzUHJvcHMuem9vbSA9IHRoaXMuY2FtZXJhLnpvb207XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU21vb3RoIG9yaWdpbiBjaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuX3NldFRyYW5zZm9ybU9yaWdpbihlbmRQcm9wcy5lbmRPcmlnaW4pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZvciBkZXYgb25seVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndHdlZW4gZGF0YTogJywgc2VsZi5kYXRhKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZVRvKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhd09mZnNldFg6IGVuZFByb3BzLmVuZE9mZnNldFgsXG4gICAgICAgICAgICAgICAgICAgICAgICByYXdPZmZzZXRZOiBlbmRQcm9wcy5lbmRPZmZzZXRZLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGVuZFByb3BzLmVuZFJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogZW5kUHJvcHMuZW5kWm9vbVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLmNvcmUgPSBzZWxmO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFR3ZWVuIHNoYWtlIGVmZmVjdFxuICAgICAgICBpZiAoZHVyYXRpb24gPiAwICYmIHNoYWtlICYmIHNoYWtlLmludGVuc2l0eSA+IDApIHtcbiAgICAgICAgICAgIHNoYWtlVGltZWxpbmUgPSBuZXcgVGltZWxpbmVMaXRlKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBzaGFrZS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgIHJlc3BlY3RCb3VuZHM6IHNoYWtlLnJlc3BlY3RCb3VuZHNcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IHRoaXMsXG4gICAgICAgICAgICAgICAgb25TdGFydFBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblN0YXJ0OiBmdW5jdGlvbiAoc2VsZikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVsaW5lLnNoYWtlID0gc2VsZjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuaXNTaGFraW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2hha2VSZXNwZWN0Qm91bmRzID0gKHRoaXMuZGF0YS5yZXNwZWN0Qm91bmRzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZVBhcmFtczogWyd7c2VsZn0nXSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uSE9SSVpPTlRBTCB8fCBzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNoYWtlT2Zmc2V0LnggPSBNYXRoLnJhbmRvbSgpICogc2VsZi5kYXRhLmludGVuc2l0eSAqIHRoaXMuY2FtZXJhLndpZHRoICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRhdGEuZGlyZWN0aW9uID09PSBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLlZFUlRJQ0FMIHx8IHNlbGYuZGF0YS5kaXJlY3Rpb24gPT09IEFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb24uQk9USCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2hha2VPZmZzZXQueSA9IE1hdGgucmFuZG9tKCkgKiBzZWxmLmRhdGEuaW50ZW5zaXR5ICogdGhpcy5jYW1lcmEuaGVpZ2h0ICogMiAtIHNlbGYuZGF0YS5pbnRlbnNpdHkgKiB0aGlzLmNhbWVyYS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFsne3NlbGZ9J10sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2hha2VPZmZzZXQueCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhLnNoYWtlT2Zmc2V0LnkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbWVyYS5pc1NoYWtpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEuc2hha2VSZXNwZWN0Qm91bmRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEVhc2UgaW4vb3V0XG4gICAgICAgICAgICBpZiAoc2hha2UuZWFzZUluICYmIHNoYWtlLmVhc2VPdXQpIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmZyb21UbyhzaGFrZVRpbWVsaW5lLmRhdGEsIGR1cmF0aW9uICogMC41LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBzaGFrZS5pbnRlbnNpdHksXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IHNoYWtlLmVhc2VJbiB8fCBQb3dlcjAuZWFzZU5vbmVcbiAgICAgICAgICAgICAgICB9LCAwKTtcblxuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUudG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiAqIDAuNSwgeyBcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlT3V0IHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIGR1cmF0aW9uICogMC41KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVhc2UgaW4gb3IgZWFzZVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hha2UuZWFzZUluICYmICFzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlSW4gfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFYXNlIG91dFxuICAgICAgICAgICAgZWxzZSBpZiAoIXNoYWtlLmVhc2VJbiAmJiBzaGFrZS5lYXNlT3V0KSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IHNoYWtlLmludGVuc2l0eVxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBzaGFrZS5lYXNlT3V0IHx8IFBvd2VyMC5lYXNlTm9uZVxuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRWFzZVxuICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5lYXNlKSB7XG4gICAgICAgICAgICAgICAgc2hha2VUaW1lbGluZS5mcm9tVG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge1xuICAgICAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGludGVuc2l0eTogc2hha2UuaW50ZW5zaXR5LFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBvcHRpb25zLmVhc2UgfHwgUG93ZXIwLmVhc2VOb25lXG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBObyBlYXNlXG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaGFrZVRpbWVsaW5lLmRhdGEuaW50ZW5zaXR5ID0gc2hha2UuaW50ZW5zaXR5O1xuICAgICAgICAgICAgICAgIHNoYWtlVGltZWxpbmUudG8oc2hha2VUaW1lbGluZS5kYXRhLCBkdXJhdGlvbiwge30sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBtYWluVGltZWxpbmUuYWRkKHNoYWtlVGltZWxpbmUsIDApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFkZChtYWluVGltZWxpbmUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2FsY3VsYXRlcyB0aGUgZW5kIHByb3BlcnR5IHZhbHVlcy5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R8VmVjdG9yMn0gc291cmNlT3JpZ2luIC0gVGhlIHNvdXJjZSBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge09iamVjdHxWZWN0b3IyfSBzb3VyY2VQb3NpdGlvbiAtIFRoZSBzb3VyY2UgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc291cmNlUm90YXRpb24gLSBUaGUgc291cmNlIHJvdGF0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHNvdXJjZVpvb20gLSBUaGUgc291cmNlIHpvb20uXG4gICAgKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYS5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIGVuZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX2NhbGN1bGF0ZUVuZFByb3BzIChzb3VyY2VPcmlnaW4sIHNvdXJjZVBvc2l0aW9uLCBzb3VyY2VSb3RhdGlvbiwgc291cmNlWm9vbSwgY2FtZXJhKSB7XG4gICAgICAgIHNvdXJjZU9yaWdpbiA9IHNvdXJjZU9yaWdpbiB8fCB7fTtcbiAgICAgICAgc291cmNlUG9zaXRpb24gPSBzb3VyY2VQb3NpdGlvbiB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIHZhciBlbmRQb3NpdGlvbiwgZW5kT2Zmc2V0O1xuICAgICAgICB2YXIgcG9zaXRpb24gPSBuZXcgVmVjdG9yMihpc0Zpbml0ZShzb3VyY2VQb3NpdGlvbi54KSA/IHNvdXJjZVBvc2l0aW9uLnggOiBjYW1lcmEucG9zaXRpb24ueCwgaXNGaW5pdGUoc291cmNlUG9zaXRpb24ueSkgPyBzb3VyY2VQb3NpdGlvbi55IDogY2FtZXJhLnBvc2l0aW9uLnkpO1xuICAgICAgICB2YXIgb3JpZ2luID0gbmV3IFZlY3RvcjIoaXNGaW5pdGUoc291cmNlT3JpZ2luLngpID8gc291cmNlT3JpZ2luLnggOiBjYW1lcmEudHJhbnNmb3JtT3JpZ2luLngsIGlzRmluaXRlKHNvdXJjZU9yaWdpbi55KSA/IHNvdXJjZU9yaWdpbi55IDogY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi55KTtcbiAgICAgICAgdmFyIHJvdGF0aW9uID0gaXNGaW5pdGUoc291cmNlUm90YXRpb24pID8gc291cmNlUm90YXRpb24gOiBjYW1lcmEucm90YXRpb247XG4gICAgICAgIHZhciB6b29tID0gY2FtZXJhLl9jbGFtcFpvb20oaXNGaW5pdGUoc291cmNlWm9vbSkgPyBzb3VyY2Vab29tIDogY2FtZXJhLnpvb20pO1xuICAgICAgICB2YXIgdHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHpvb20sIHpvb20pLnJvdGF0ZShfTWF0aC5kZWdUb1JhZCgtcm90YXRpb24pKTtcbiAgICAgICAgdmFyIGNhbWVyYUZPVlBvc2l0aW9uID0gY2FtZXJhLmNlbnRlcjtcblxuICAgICAgICB2YXIgaXNNb3ZpbmcgPSBpc0Zpbml0ZShzb3VyY2VQb3NpdGlvbi54KSB8fCBpc0Zpbml0ZShzb3VyY2VQb3NpdGlvbi55KTtcbiAgICAgICAgdmFyIGlzUm90YXRpbmcgPSBpc0Zpbml0ZShzb3VyY2VSb3RhdGlvbikgJiYgc291cmNlUm90YXRpb24gIT09IGNhbWVyYS5yb3RhdGlvbjtcbiAgICAgICAgdmFyIGlzWm9vbWluZyA9IGlzRmluaXRlKHNvdXJjZVpvb20pICYmIHNvdXJjZVpvb20gIT09IGNhbWVyYS56b29tO1xuXG4gICAgICAgIC8vIHJvdGF0ZVRvLCB6b29tVG9cbiAgICAgICAgaWYgKCFpc01vdmluZyAmJiAhaXNGaW5pdGUoc291cmNlT3JpZ2luLngpICYmICFpc0Zpbml0ZShzb3VyY2VPcmlnaW4ueSkpIHtcbiAgICAgICAgICAgIG9yaWdpbi5jb3B5KGNhbWVyYS5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHJvdGF0ZUF0LCByb3RhdGVUbywgem9vbUF0LCB6b29tVG9cbiAgICAgICAgaWYgKCFpc01vdmluZykge1xuICAgICAgICAgICAgcG9zaXRpb24uY29weShvcmlnaW4pO1xuICAgICAgICAgICAgY2FtZXJhRk9WUG9zaXRpb24gPSBjYW1lcmEuX2NhbGN1bGF0ZUNvbnRleHRQb3NpdGlvbihvcmlnaW4sIGNhbWVyYS5wb3NpdGlvbiwgY2FtZXJhLmNlbnRlciwgY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVuZFBvc2l0aW9uID0gY2FtZXJhLl9jYWxjdWxhdGVQb3NpdGlvbkZyb21Qb3NpdGlvbihwb3NpdGlvbiwgY2FtZXJhRk9WUG9zaXRpb24sIGNhbWVyYS5jZW50ZXIsIG9yaWdpbiwgdHJhbnNmb3JtYXRpb24pO1xuICAgICAgICBlbmRPZmZzZXQgPSBjYW1lcmEuX2NhbGN1bGF0ZU9mZnNldEZyb21Qb3NpdGlvbihlbmRQb3NpdGlvbiwgY2FtZXJhLmNlbnRlciwgb3JpZ2luLCB0cmFuc2Zvcm1hdGlvbik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNNb3Zpbmc6IGlzTW92aW5nLFxuICAgICAgICAgICAgaXNSb3RhdGluZzogaXNSb3RhdGluZyxcbiAgICAgICAgICAgIGlzWm9vbWluZzogaXNab29taW5nLFxuICAgICAgICAgICAgZW5kT2Zmc2V0WDogaXNNb3ZpbmcgPyBlbmRPZmZzZXQueCA6IG51bGwsXG4gICAgICAgICAgICBlbmRPZmZzZXRZOiBpc01vdmluZyA/IGVuZE9mZnNldC55IDogbnVsbCxcbiAgICAgICAgICAgIGVuZE9yaWdpbjogKHNvdXJjZU9yaWdpbi54IHx8IHNvdXJjZU9yaWdpbi55IHx8ICFpc01vdmluZykgPyBvcmlnaW4gOiBudWxsLFxuICAgICAgICAgICAgZW5kUm90YXRpb246ICFpc05pbChzb3VyY2VSb3RhdGlvbikgPyByb3RhdGlvbiA6IG51bGwsXG4gICAgICAgICAgICBlbmRab29tOiBzb3VyY2Vab29tID8gem9vbSA6IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZXMgdGhlIGNvcmUgYW5pbWF0aW9uIHByb3BlcnRpZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2VPcmlnaW4gLSBUaGUgb3JpZ2luLlxuICAgICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZVBvc2l0aW9uIC0gVGhlIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2VSb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzb3VyY2Vab29tIC0gVGhlIHpvb20uXG4gICAgKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYS5cbiAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIHBhcnNlZCBwcm9wZXJ0aWVzLlxuICAgICovXG4gICAgX3BhcnNlUHJvcHMgKHNvdXJjZU9yaWdpbiwgc291cmNlUG9zaXRpb24sIHNvdXJjZVJvdGF0aW9uLCBzb3VyY2Vab29tLCBjYW1lcmEpIHtcbiAgICAgICAgaWYgKHNvdXJjZVBvc2l0aW9uID09PSAncHJldmlvdXMnICYmIHRoaXMucHJldmlvdXNQcm9wcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgc291cmNlUG9zaXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucG9zaXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChzb3VyY2VSb3RhdGlvbiA9PT0gJ3ByZXZpb3VzJyAmJiAhaXNOaWwodGhpcy5wcmV2aW91c1Byb3BzLnJvdGF0aW9uKSkge1xuICAgICAgICAgICAgc291cmNlUm90YXRpb24gPSB0aGlzLnByZXZpb3VzUHJvcHMucm90YXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChzb3VyY2Vab29tID09PSAncHJldmlvdXMnICYmICFpc05pbCh0aGlzLnByZXZpb3VzUHJvcHMuem9vbSkpIHtcbiAgICAgICAgICAgIHNvdXJjZVpvb20gPSB0aGlzLnByZXZpb3VzUHJvcHMuem9vbTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBwYXJzZWRPcmlnaW46IFV0aWxzLnBhcnNlUG9zaXRpb24oc291cmNlT3JpZ2luLCBjYW1lcmEuc2NlbmUudmlldyksXG4gICAgICAgICAgICBwYXJzZWRQb3NpdGlvbjogVXRpbHMucGFyc2VQb3NpdGlvbihzb3VyY2VQb3NpdGlvbiwgY2FtZXJhLnNjZW5lLnZpZXcpLFxuICAgICAgICAgICAgcGFyc2VkUm90YXRpb246ICFpc05pbChzb3VyY2VSb3RhdGlvbikgPyBzb3VyY2VSb3RhdGlvbiA6IG51bGwsXG4gICAgICAgICAgICBwYXJzZWRab29tOiBzb3VyY2Vab29tIHx8IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZXMgdGhlIHNoYWtlIHByb3BlcnRpZXMuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBzaGFrZSAtIFRoZSBzaGFrZSBwcm9wZXJ0aWVzLlxuICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgcGFyc2VkIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICBfcGFyc2VTaGFrZSAoc2hha2UpIHtcbiAgICAgICAgdmFyIHBhcnNlZFNoYWtlID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmIChzaGFrZSkge1xuICAgICAgICAgICAgcGFyc2VkU2hha2UgPSB7XG4gICAgICAgICAgICAgICAgaW50ZW5zaXR5OiBpc05pbChzaGFrZS5pbnRlbnNpdHkpID8gMCA6IHNoYWtlLmludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGlzTmlsKHNoYWtlLmRpcmVjdGlvbikgPyBBbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEggOiBzaGFrZS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgZWFzZUluOiBzaGFrZS5lYXNlSW4sXG4gICAgICAgICAgICAgICAgZWFzZU91dDogc2hha2UuZWFzZU91dCxcbiAgICAgICAgICAgICAgICByZXNwZWN0Qm91bmRzOiBzaGFrZS5yZXNwZWN0Qm91bmRzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcGFyc2VkU2hha2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU3RvcHMgdGhlIGFuaW1hdGlvbiBhbmQgcmVsZWFzZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi5kZXN0cm95KCk7XG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgc3VwZXIua2lsbCgpO1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIHRoaXMuY3VycmVudFN1YkFuaW1hdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMucHJldmlvdXNQcm9wcyA9IG51bGw7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQW5pbWF0ZSB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLnBvc2l0aW9uXSAtIFRoZSBsb2NhdGlvbiB0byBtb3ZlIHRvLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5wb3NpdGlvbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvcHMucG9zaXRpb24ueV0gLSBUaGUgeSBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW3Byb3BzLm9yaWdpbl0gLSBUaGUgbG9jYXRpb24gZm9yIHRoZSB6b29tJ3Mgb3JpZ2luLiBJdCBjYW4gYmUgYSBzZWxlY3RvciwgYW4gZWxlbWVudCwgb3IgYW4gb2JqZWN0IHdpdGggeC95IGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5vcmlnaW4ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLm9yaWdpbi55XSAtIFRoZSB5IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Byb3BzLnJvdGF0aW9uXSAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2VdIC0gQW4gb2JqZWN0IG9mIHNoYWtlIGVmZmVjdCBwcm9wZXJ0aWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcm9wcy5zaGFrZS5pbnRlbnNpdHldIC0gQSB7QGxpbmsgQ2FtZXJhI3NoYWtlSW50ZW5zaXR5fHNoYWtlIGludGVuc2l0eX0uXG4gICAgKiBAcGFyYW0ge09jdWxvLkFuaW1hdGlvbi5zaGFrZS5kaXJlY3Rpb259IFtwcm9wcy5zaGFrZS5kaXJlY3Rpb249T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5CT1RIXSAtIEEgc2hha2UgZGlyZWN0aW9uLiBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZUluXSAtIEFuIHtAbGluayBleHRlcm5hbDpFYXNpbmd8RWFzaW5nfS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc2hha2UuZWFzZU91dF0gLSBBbiB7QGxpbmsgZXh0ZXJuYWw6RWFzaW5nfEVhc2luZ30uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Byb3BzLnpvb21dIC0gQSB6b29tIHZhbHVlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246ICcjYm94MTAwJywgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7cG9zaXRpb246IHt4OiAyMDAsIHk6IDUwfSwgem9vbTogMn0sIDEpO1xuICAgICogbXlBbmltYXRpb24uYW5pbWF0ZSh7b3JpZ2luOiAnI2JveDEwMCcsIHpvb206IDJ9LCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLmFuaW1hdGUoe29yaWdpbjoge3g6IDIwMCwgeTogNTB9LCB6b29tOiAyfSwgMSk7XG4gICAgKi9cbiAgICBhbmltYXRlIChwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBwb3NpdGlvbjogcHJvcHMucG9zaXRpb24sXG4gICAgICAgICAgICBvcmlnaW46IHByb3BzLm9yaWdpbixcbiAgICAgICAgICAgIHJvdGF0aW9uOiBwcm9wcy5yb3RhdGlvbixcbiAgICAgICAgICAgIHNoYWtlOiBwcm9wcy5zaGFrZSxcbiAgICAgICAgICAgIHpvb206IHByb3BzLnpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE1vdmUgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gcG9zaXRpb24gLSBUaGUgcG9zaXRpb24gdG8gbW92ZSB0by4gSXQgY2FuIGJlIGEgc2VsZWN0b3IsIGFuIGVsZW1lbnQsIG9yIGFuIG9iamVjdCB3aXRoIHgveSBjb29yZGluYXRlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcG9zaXRpb24ueF0gLSBUaGUgeCBjb29yZGluYXRlIG9uIHRoZSByYXcgc2NlbmUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW3Bvc2l0aW9uLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2Yge0BsaW5rIGV4dGVybmFsOlR3ZWVuTWF4fFR3ZWVuTWF4fSBvcHRpb25zLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24ubW92ZVRvKCcjYm94MTAwJywgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLm1vdmVUbyh7eDoyMDAsIHk6IDUwfSwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5tb3ZlVG8oe3g6IDIwMH0sIDEpO1xuICAgICogbXlBbmltYXRpb24ubW92ZVRvKHt5OiAyMDB9LCAxKTtcbiAgICAqL1xuICAgIG1vdmVUbyAocG9zaXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gb3JpZ2luIC0gVGhlIGxvY2F0aW9uIGZvciB0aGUgcm90YXRpb24ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZUF0KCcjYm94MTAwJywgMjAsIDEpO1xuICAgICogbXlBbmltYXRpb24ucm90YXRlQXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JveDEwMCcpLCAyMCwgMSk7XG4gICAgKiBteUFuaW1hdGlvbi5yb3RhdGVBdCh7eDogMjAwLCB5OiA1MH0sIDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZUF0IChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9hbmltYXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogb3JpZ2luLFxuICAgICAgICAgICAgcm90YXRpb246IHJvdGF0aW9uXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBSb3RhdGUgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIEEgZHVyYXRpb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IG9mIHtAbGluayBleHRlcm5hbDpUd2Vlbk1heHxUd2Vlbk1heH0gb3B0aW9ucy5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIG15QW5pbWF0aW9uLnJvdGF0ZVRvKDIwLCAxKTtcbiAgICAqL1xuICAgIHJvdGF0ZVRvIChyb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICByb3RhdGlvbjogcm90YXRpb25cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNoYWtlIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGludGVuc2l0eSAtIEEge0BsaW5rIENhbWVyYSNzaGFrZUludGVuc2l0eXxzaGFrZSBpbnRlbnNpdHl9LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gQSBkdXJhdGlvbi5cbiAgICAqIEBwYXJhbSB7T2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbn0gW2RpcmVjdGlvbj1PY3Vsby5BbmltYXRpb24uc2hha2UuZGlyZWN0aW9uLkJPVEhdIC0gQSBzaGFrZSBkaXJlY3Rpb24uIFxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VGltZWxpbmVNYXh8VGltZWxpbmVNYXh9IG9wdGlvbnMgcGx1czpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5lYXNlSW5dIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmVhc2VPdXRdIC0gQW4ge0BsaW5rIGV4dGVybmFsOkVhc2luZ3xFYXNpbmd9LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogbXlBbmltYXRpb24uc2hha2UoMC4xLCA0KTtcbiAgICAqIG15QW5pbWF0aW9uLnNoYWtlKDAuMSwgNCwgT2N1bG8uQW5pbWF0aW9uLnNoYWtlLmRpcmVjdGlvbi5IT1JJWk9OVEFMLCB7IGVhc2VJbjogUG93ZXIyLmVhc2VJbiwgZWFzZU91dDogUG93ZXIyLmVhc2VPdXQgfSlcbiAgICAqL1xuICAgIHNoYWtlIChpbnRlbnNpdHksIGR1cmF0aW9uLCBkaXJlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2hha2U6IHtcbiAgICAgICAgICAgICAgICBpbnRlbnNpdHk6IGludGVuc2l0eSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICBlYXNlSW46IG9wdGlvbnMuZWFzZUluLFxuICAgICAgICAgICAgICAgIGVhc2VPdXQ6IG9wdGlvbnMuZWFzZU91dCxcbiAgICAgICAgICAgICAgICByZXNwZWN0Qm91bmRzOiBvcHRpb25zLnJlc3BlY3RCb3VuZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFpvb20gaW4vb3V0IGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxPYmplY3R9IG9yaWdpbiAtIFRoZSBsb2NhdGlvbiBmb3IgdGhlIHpvb20ncyBvcmlnaW4uIEl0IGNhbiBiZSBhIHNlbGVjdG9yLCBhbiBlbGVtZW50LCBvciBhbiBvYmplY3Qgd2l0aCB4L3kgY29vcmRpbmF0ZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gW29yaWdpbi54XSAtIFRoZSB4IGNvb3JkaW5hdGUgb24gdGhlIHJhdyBzY2VuZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3JpZ2luLnldIC0gVGhlIHkgY29vcmRpbmF0ZSBvbiB0aGUgcmF3IHNjZW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tQXQoJyNib3gxMDAnLCAyLCAxKTtcbiAgICAqIG15QW5pbWF0aW9uLnpvb21BdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm94MTAwJyksIDIsIDEpO1xuICAgICogbXlBbmltYXRpb24uem9vbUF0KHt4OiAyMDAsIHk6IDUwfSwgMiwgMSk7XG4gICAgKi9cbiAgICB6b29tQXQgKG9yaWdpbiwgem9vbSwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0ZSh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgICAgIHpvb206IHpvb21cbiAgICAgICAgfSwgZHVyYXRpb24sIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogWm9vbSBpbi9vdXQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBBIHpvb20gdmFsdWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBBIGR1cmF0aW9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiB7QGxpbmsgZXh0ZXJuYWw6VHdlZW5NYXh8VHdlZW5NYXh9IG9wdGlvbnMuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICpcbiAgICAqIEBleGFtcGxlXG4gICAgKiBteUFuaW1hdGlvbi56b29tVG8oMiwgMSk7XG4gICAgKi9cbiAgICB6b29tVG8gKHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGUoeyBcbiAgICAgICAgICAgIHpvb206IHpvb20gXG4gICAgICAgIH0sIGR1cmF0aW9uLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuKiBTaGFrZSBkaXJlY3Rpb25zLlxuKiBAZW51bSB7bnVtYmVyfVxuKi9cbkFuaW1hdGlvbi5zaGFrZSA9IHtcbiAgICBkaXJlY3Rpb246IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQm90aCB0aGUgeCBhbmQgeSBheGVzLlxuICAgICAgICAqL1xuICAgICAgICBCT1RIOiAwLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeCBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBIT1JJWk9OVEFMOiAxLFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgeSBheGlzLlxuICAgICAgICAqL1xuICAgICAgICBWRVJUSUNBTDogMlxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQW5pbWF0aW9uOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgQW5pbWF0aW9uIGZyb20gJy4vQW5pbWF0aW9uJztcbmltcG9ydCB7IFR5cGUgfSAgZnJvbSAnLi9jb25zdGFudHMnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uQW5pbWF0aW9uTWFuYWdlclxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtPYmplY3R9IGNhbWVyYSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgQW5pbWF0aW9uTWFuYWdlci5cbiovXG5jbGFzcyBBbmltYXRpb25NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgQW5pbWF0aW9uTWFuYWdlci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkFuaW1hdGlvbn0gLSBUaGUgYWN0aXZlIGFuaW1hdGlvbi5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jdXJyZW50QW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIEFuIG9iamVjdCBmb3Igc3RvcmluZyB0aGUgQW5pbWF0aW9uIGluc3RhbmNlcy5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQW5pbWF0aW9uTWFuYWdlciNpc0FuaW1hdGluZ1xuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIGlzIHJ1bm5pbmcgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNBbmltYXRpbmcgKCkge1xuICAgICAgICB2YXIgcHJvZ3Jlc3MgPSB0aGlzLmN1cnJlbnRBbmltYXRpb24gPyB0aGlzLmN1cnJlbnRBbmltYXRpb24ucHJvZ3Jlc3MoKSA6IDA7XG4gICAgICAgIHJldHVybiBwcm9ncmVzcyA+IDAgJiYgcHJvZ3Jlc3MgPCAxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIEFuaW1hdGlvbk1hbmFnZXIjaXNQYXVzZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBpcyBwYXVzZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNQYXVzZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50QW5pbWF0aW9uID8gdGhpcy5jdXJyZW50QW5pbWF0aW9uLnBhdXNlZCgpIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQWRkcyBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSB0byBnaXZlIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcGFyYW0ge29iamVjdHxPY3Vsby5BbmltYXRpb259IGFuaW1hdGlvbiAtIFRoZSBhbmltYXRpb24uIEl0IGNhbiBiZSBhbiBhY3R1YWwgYW5pbWF0aW9uIGluc3RhbmNlIG9yIGFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGFuaW1hdGlvbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKlxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYW4gYW5pbWF0aW9uIGluc3RhbmNlPC9jYXB0aW9uPlxuICAgICogbXlBbmltYXRpb25NYW5hZ2VyLmFkZCgnem9vbUluT3V0JywgbmV3IE9jdWxvLkFuaW1hdGlvbihteUNhbWVyYSkuYW5pbWF0ZSh7em9vbTogMn0sIDIsIHtlYXNlOiBQb3dlcjIuZWFzZUlufSkuYW5pbWF0ZSh7em9vbTogMX0sIDIsIHtlYXNlOiBQb3dlcjIuZWFzZU91dH0pKTtcbiAgICAqIFxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYW4gb2JqZWN0IHJlcHJlc2VudGluZyBhbiBhbmltYXRpb248L2NhcHRpb24+XG4gICAgKiBteUFuaW1hdGlvbk1hbmFnZXIuYWRkKCd6b29tSW5BbmRPdXQnLCB7IFxuICAgICogICBrZXlmcmFtZXM6IFt7IFxuICAgICogICAgIHpvb206IDIsIFxuICAgICogICAgIGR1cmF0aW9uOiAyLCBcbiAgICAqICAgICBvcHRpb25zOiB7IFxuICAgICogICAgICAgZWFzZTogUG93ZXIyLmVhc2VJbiBcbiAgICAqICAgICB9XG4gICAgKiAgIH0sIHtcbiAgICAqICAgICB6b29tOiAxLFxuICAgICogICAgIGR1cmF0aW9uOiAyLFxuICAgICogICAgIG9wdGlvbnM6IHtcbiAgICAqICAgICAgIGVhc2U6IFBvd2VyMi5lYXNlT3V0XG4gICAgKiAgICAgfVxuICAgICogICB9XVxuICAgICogfSk7XG4gICAgKi8gICAgICAgIFxuICAgIGFkZCAobmFtZSwgYW5pbWF0aW9uKSB7XG4gICAgICAgIGxldCBuZXdBbmltYXRpb247XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5fYW5pbWF0aW9uc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1tuYW1lXS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChhbmltYXRpb24udHlwZSA9PT0gVHlwZS5BTklNQVRJT04pIHtcbiAgICAgICAgICAgIG5ld0FuaW1hdGlvbiA9IGFuaW1hdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5ld0FuaW1hdGlvbiA9IG5ldyBBbmltYXRpb24odGhpcy5jYW1lcmEpO1xuICAgICAgICAgICAgYW5pbWF0aW9uLmtleWZyYW1lcy5mb3JFYWNoKChrZXlmcmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0FuaW1hdGlvbi5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiBrZXlmcmFtZS5vcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBrZXlmcmFtZS5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGtleWZyYW1lLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzaGFrZToga2V5ZnJhbWUuc2hha2UsXG4gICAgICAgICAgICAgICAgICAgIHpvb206IGtleWZyYW1lLnpvb21cbiAgICAgICAgICAgICAgICB9LCBrZXlmcmFtZS5kdXJhdGlvbiwga2V5ZnJhbWUub3B0aW9ucyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9hbmltYXRpb25zW25hbWVdID0gbmV3QW5pbWF0aW9uO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIEFuaW1hdGlvbk1hbmFnZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fYW5pbWF0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uc1trZXldLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBHZXRzIGFuIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24uXG4gICAgKiBAcmV0dXJucyB7T2N1bG8uQW5pbWF0aW9ufSBUaGUgYW5pbWF0aW9uLlxuICAgICovXG4gICAgZ2V0IChuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbmltYXRpb25zW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhdXNlcyB0aGUgYWN0aXZlIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwYXVzZSAoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5wYXVzZShudWxsLCBmYWxzZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBQbGF5cyB0aGUgY3VycmVudCBvciBwcm92aWRlZCBhbmltYXRpb24uIGZvcndhcmQgZnJvbSB0aGUgY3VycmVudCBwbGF5aGVhZCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcGxheSAoYW5pbWF0aW9uKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYW5pbWF0aW9uID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgYW5pbWF0aW9uID0gdGhpcy5fYW5pbWF0aW9uc1thbmltYXRpb25dO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24gPSBhbmltYXRpb247XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24uaW52YWxpZGF0ZSgpLnJlc3RhcnQoZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1hdGlvbi5wbGF5KG51bGwsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmVzdW1lcyBwbGF5aW5nIHRoZSBhbmltYXRpb24gZnJvbSB0aGUgY3VycmVudCBwbGF5aGVhZCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByZXN1bWUgKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRBbmltYXRpb24ucmVzdW1lKG51bGwsIGZhbHNlKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEFuaW1hdGlvbk1hbmFnZXI7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbi8vIFRPRE86XG4vLyAxKSBJbXBvcnQgQW5pbWF0aW9uIHRvIGF2b2lkIHVzaW5nIE9jdWxvIG5hbWVzcGFjZVxuXG5pbXBvcnQgY2xhbXAgICAgICAgICAgICBmcm9tICdsb2Rhc2gvY2xhbXAnO1xuaW1wb3J0IGlzRWxlbWVudCAgICAgICAgZnJvbSAnbG9kYXNoL2lzRWxlbWVudCc7XG5pbXBvcnQgaXNGaW5pdGUgICAgICAgICBmcm9tICdsb2Rhc2gvaXNGaW5pdGUnO1xuaW1wb3J0IGlzRnVuY3Rpb24gICAgICAgZnJvbSAnbG9kYXNoL2lzRnVuY3Rpb24nO1xuaW1wb3J0IGlzTmlsICAgICAgICAgICAgZnJvbSAnbG9kYXNoL2lzTmlsJztcbmltcG9ydCBpc09iamVjdCAgICAgICAgIGZyb20gJ2xvZGFzaC9pc09iamVjdCc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdmYmVtaXR0ZXInO1xuaW1wb3J0IEFuaW1hdGlvbk1hbmFnZXIgZnJvbSAnLi9hbmltYXRpb25NYW5hZ2VyJztcbmltcG9ydCBDU1NSZW5kZXJlciAgICAgIGZyb20gJy4vY3NzUmVuZGVyZXInO1xuaW1wb3J0IF9NYXRoICAgICAgICAgICAgZnJvbSAnLi9tYXRoL21hdGgnO1xuaW1wb3J0IE1hdHJpeDIgICAgICAgICAgZnJvbSAnLi9tYXRoL21hdHJpeDInO1xuaW1wb3J0IFNjZW5lICAgICAgICAgICAgZnJvbSAnLi9zY2VuZSc7XG5pbXBvcnQgU2NlbmVNYW5hZ2VyICAgICBmcm9tICcuL3NjZW5lTWFuYWdlcic7XG5pbXBvcnQgVHJhY2tDb250cm9sICAgICBmcm9tICcuL3RyYWNrQ29udHJvbCc7XG5pbXBvcnQgVXRpbHMgICAgICAgICAgICBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBWZWN0b3IyICAgICAgICAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuY29uc3QgYW5pbWF0aW9uTmFtZSA9IHtcbiAgICBBTk9OWU1PVVM6ICdfYW5vbnltb3VzJ1xufTtcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLkNhbWVyYVxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBvcHRpb25zLlxuKiBAcGFyYW0ge2Z1bmN0aW9ufE9iamVjdH0gW29wdGlvbnMuYm91bmRzXSAtIFRoZSBib3VuZHMuXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZHJhZ1RvTW92ZV0gLSBXaGV0aGVyIHRoZSBjYW1lcmEncyBwb3NpdGlvbiBpcyBkcmFnZ2FibGUgb3Igbm90LlxuKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWluWm9vbV0gLSBUaGUge0BsaW5rIENhbWVyYS5taW5ab29tfG1pbmltdW0gem9vbX0uXG4qIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhab29tXSAtIFRoZSB7QGxpbmsgQ2FtZXJhLm1heFpvb218bWF4aW11bSB6b29tfS5cbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudHxudWxsfSBbb3B0aW9ucy52aWV3XSAtIFRoZSBjYW1lcmEncyB2aWV3LlxuKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLndoZWVsVG9ab29tXSAtIFdoZXRoZXIgd2hlZWxpbmcgY2FuIGJlIHVzZWQgdG8gem9vbSBvciBub3QuXG4qIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy53aGVlbFRvWm9vbUluY3JlbWVudF0gLSBUaGUgYmFzZSB7QGxpbmsgQ2FtZXJhLndoZWVsVG9ab29tSW5jcmVtZW50fHpvb20gaW5jcmVtZW50fS5cbiogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbb3B0aW9ucy53aWR0aF0gLSBUaGUgY2FtZXJhJ3Mge0BsaW5rIENhbWVyYS53aWR0aHx3aWR0aH0uXG4qIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW29wdGlvbnMuaGVpZ2h0XSAtIFRoZSBjYW1lcmEncyB7QGxpbmsgQ2FtZXJhLmhlaWdodHxoZWlnaHR9LlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlDYW1lcmEgPSBuZXcgT2N1bG8uQ2FtZXJhKHsgXG4qICAgdmlldzogJyNjYW1lcmEnLFxuKiAgIGJvdW5kczogT2N1bG8uQ2FtZXJhLmJvdW5kcy5XT1JMRF9FREdFLFxuKiAgIGRyYWdUb01vdmU6IHRydWUsXG4qICAgbWluWm9vbTogMC41LFxuKiAgIG1heFpvb206IDMsXG4qICAgd2hlZWxUb1pvb206IHRydWUsXG4qICAgd2hlZWxUb1pvb21JbmNyZW1lbnQ6IDAuNSxcbiogICB3aWR0aDogMTAwMCxcbiogICBoZWlnaHQ6IDUwMFxuKiB9KTtcbiovXG5jbGFzcyBDYW1lcmEge1xuICAgIGNvbnN0cnVjdG9yICh7IFxuICAgICAgICBib3VuZHMgPSBudWxsLCBcbiAgICAgICAgZHJhZ1RvTW92ZSA9IGZhbHNlLCBcbiAgICAgICAgaGVpZ2h0ID0gMCwgXG4gICAgICAgIG1heFpvb20gPSAzLCBcbiAgICAgICAgbWluWm9vbSA9IDAuNSwgXG4gICAgICAgIHZpZXcgPSB1bmRlZmluZWQsIFxuICAgICAgICB3aGVlbFRvWm9vbSA9IGZhbHNlLCBcbiAgICAgICAgd2hlZWxUb1pvb21JbmNyZW1lbnQgPSAwLjAxLCBcbiAgICAgICAgd2lkdGggPSAwXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkFuaW1hdGlvbk1hbmFnZXJ9IC0gQW4gb2JqZWN0IGZvciBtYW5hZ2luZyBhbmltYXRpb25zLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMgPSBuZXcgQW5pbWF0aW9uTWFuYWdlcih0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgY2FtZXJhJ3MgcG9zaXRpb24gaXMgZHJhZ2dhYmxlIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYWdUb01vdmUgPSAoZHJhZ1RvTW92ZSA9PT0gdHJ1ZSkgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSBoYXMgYmVlbiByZW5kZXJlZCBvciBub3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1JlbmRlcmVkID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSBpcyBzaGFraW5nIG9yIG5vdC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzU2hha2luZyA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudWxsfG51bWJlcn0gLSBUaGUgbWluaW11bSBYIHBvc2l0aW9uIGFmdGVyIGJvdW5kcyBhcmUgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5taW5Qb3NpdGlvblggPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudWxsfG51bWJlcn0gLSBUaGUgbWluaW11bSBZIHBvc2l0aW9uIGFmdGVyIGJvdW5kcyBhcmUgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5taW5Qb3NpdGlvblkgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudWxsfG51bWJlcn0gLSBUaGUgbWF4aW11bSBYIHBvc2l0aW9uIGFmdGVyIGJvdW5kcyBhcmUgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tYXhQb3NpdGlvblggPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudWxsfG51bWJlcn0gLSBUaGUgbWF4aW11bSBZIHBvc2l0aW9uIGFmdGVyIGJvdW5kcyBhcmUgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tYXhQb3NpdGlvblkgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIG1pbmltdW0gdmFsdWUgdGhlIGNhbWVyYSBjYW4gYmUgem9vbWVkLlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFNlZSB7QGxpbmsgQ2FtZXJhLnpvb218em9vbX0uXG4gICAgICAgICogQGRlZmF1bHQgMC41XG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWluWm9vbSA9IG1pblpvb207XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgbWF4aW11bSB2YWx1ZSB0aGUgY2FtZXJhIGNhbiBiZSB6b29tZWQuXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gU2VlIHtAbGluayBDYW1lcmEuem9vbXx6b29tfS5cbiAgICAgICAgKiBAZGVmYXVsdCAzXG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWF4Wm9vbSA9IG1heFpvb207XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgb2Zmc2V0IG9mIHRoZSBjYW1lcmEncyB0b3AgbGVmdCBjb3JuZXIgcmVsYXRpdmUgdG8gdGhlIHNjZW5lIHdpdGhvdXQgYW55IGVmZmVjdHMgYXBwbGllZC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yYXdPZmZzZXQgPSBuZXcgVmVjdG9yMigwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBvZmZzZXQgb2YgdGhlIGNhbWVyYSdzIHRvcCBsZWZ0IGNvcm5lciByZWxhdGl2ZSB0byB0aGUgc2NlbmUuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMub2Zmc2V0ID0gbmV3IFZlY3RvcjIoMCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgcG9zaXRpb24gb2YgdGhlIGNhbWVyYSBvbiB0aGUgc2NlbmUuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjdG9yMih3aWR0aCAqIDAuNSwgaGVpZ2h0ICogMC41KTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSByZW5kZXJlci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBDU1NSZW5kZXJlcih0aGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBhbW91bnQgb2Ygcm90YXRpb24gaW4gZGVncmVlcy5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICovXG4gICAgICAgIHRoaXMucm90YXRpb24gPSAwO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPY3Vsby5TY2VuZU1hbmFnZXJ9IC0gQW4gb2JqZWN0IGZvciBtYW5hZ2luZyBzY2VuZXMuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2NlbmVzID0gbmV3IFNjZW5lTWFuYWdlcih0aGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBhbW91bnQgb2Ygc2hha2Ugb2Zmc2V0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2hha2VPZmZzZXQgPSBuZXcgVmVjdG9yMigwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBzaGFrZSBlZmZlY3QgcmVzcGVjdHMgdGhlIGJvdW5kcyBvciBub3QuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zaGFrZVJlc3BlY3RCb3VuZHMgPSB0cnVlO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtUcmFja0NvbnRyb2x9IC0gVGhlIHRyYWNrIGNvbnRyb2wuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmFja0NvbnRyb2wgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7VmVjdG9yMn0gLSBUaGUgdHJhbnNmb3JtYXRpb24gb3JpZ2luLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyYW5zZm9ybU9yaWdpbiA9IG5ldyBWZWN0b3IyKDAsIDApO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge0VsZW1lbnR9IC0gVGhlIHZpZXcuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudmlldyA9ICh2aWV3ID09PSBudWxsKSA/IG51bGwgOiBVdGlscy5ET00ucGFyc2VWaWV3KHZpZXcpIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgd2hlZWxpbmcgY2FuIGJlIHVzZWQgdG8gem9vbSBvciBub3QuXG4gICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aGVlbFRvWm9vbSA9ICh3aGVlbFRvWm9vbSA9PT0gdHJ1ZSkgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgYmFzZSBpbmNyZW1lbnQgYXQgd2hpY2ggdGhlIGNhbWVyYSB3aWxsIGJlIHpvb21lZC4gU2VlIHtAbGluayBDYW1lcmEuem9vbXx6b29tfS5cbiAgICAgICAgKiBAZGVmYXVsdCAwLjAxXG4gICAgICAgICovXG4gICAgICAgIHRoaXMud2hlZWxUb1pvb21JbmNyZW1lbnQgPSB3aGVlbFRvWm9vbUluY3JlbWVudDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB3aWR0aC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICovXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgaGVpZ2h0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIGNlbnRlciBvZiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNlbnRlciA9IG5ldyBWZWN0b3IyKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KS5tdWx0aXBseVNjYWxhcigwLjUpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgaW50ZXJuYWxseSBtYW5hZ2VkIHpvb20uXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX3pvb20gPSAxO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKiBAcHJvcGVydHkge251bGx8ZnVuY3Rpb258T2JqZWN0fSAtIFRoZSBpbnRlcm5hbGx5IG1hbmFnZWQgYm91bmRzLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ib3VuZHMgPSBib3VuZHM7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqIEBwcm9wZXJ0eSB7RXZlbnRFbWl0dGVyfSAtIFRoZSBpbnRlcm5hbCBldmVudCBlbWl0dGVyLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0aWFsaXplIGN1c3RvbSBldmVudHNcbiAgICAgICAgdGhpcy5vblJlc2l6ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHZhciB3YXNBbmltYXRpbmcgPSB0aGlzLmFuaW1hdGlvbnMuaXNBbmltYXRpbmc7XG4gICAgICAgICAgICB2YXIgd2FzUGF1c2VkID0gdGhpcy5hbmltYXRpb25zLmlzUGF1c2VkO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAod2FzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBNYWludGFpbiBjYW1lcmEgcG9zaXRpb24gYW5kIHVwZGF0ZSB0aGUgY3VycmVudCBhbmltYXRpb25cbiAgICAgICAgICAgIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcywgeyBcbiAgICAgICAgICAgICAgICBkZXN0cm95T25Db21wbGV0ZTogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKHdhc0FuaW1hdGluZywgd2FzUGF1c2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICd0aGlzJyBpcyBib3VuZCB0byB0aGUgQW5pbWF0aW9uIHZpYSB0aGUgQW5pbWF0aW9uIGNsYXNzXG4gICAgICAgICAgICAgICAgICAgIGlmICh3YXNBbmltYXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmRQcm9wcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb3JlQW5pbWF0aW9uID0gdGhpcy5jYW1lcmEuYW5pbWF0aW9ucy5jdXJyZW50QW5pbWF0aW9uLmN1cnJlbnRTdWJBbmltYXRpb24uY29yZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcmVBbmltYXRpb24uZGF0YS5pc01vdmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFByb3BzID0gdGhpcy5fY2FsY3VsYXRlRW5kUHJvcHMoY29yZUFuaW1hdGlvbi5kYXRhLnBhcnNlZE9yaWdpbiwgY29yZUFuaW1hdGlvbi5kYXRhLnBhcnNlZFBvc2l0aW9uLCBjb3JlQW5pbWF0aW9uLmRhdGEucGFyc2VkUm90YXRpb24sIGNvcmVBbmltYXRpb24uZGF0YS5wYXJzZWRab29tLCB0aGlzLmNhbWVyYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihjb3JlQW5pbWF0aW9uLmRhdGEsIGVuZFByb3BzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGZvciBkZXYgb25seVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0d2VlbiBkYXRhIGFmdGVyIHJlc2l6ZTogJywgY29yZUFuaW1hdGlvbi5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3JlQW5pbWF0aW9uLnVwZGF0ZVRvKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogZW5kUHJvcHMuZW5kWm9vbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGVuZFByb3BzLmVuZFJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdPZmZzZXRYOiBlbmRQcm9wcy5lbmRPZmZzZXRYLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdPZmZzZXRZOiBlbmRQcm9wcy5lbmRPZmZzZXRZXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghd2FzUGF1c2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW1lcmEucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGVQYXJhbXM6IFt3YXNBbmltYXRpbmcsIHdhc1BhdXNlZF1cbiAgICAgICAgICAgIH0pLm1vdmVUbyh0aGlzLnBvc2l0aW9uLCAwLCB7IG92ZXJ3cml0ZTogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICAgIHRoaXMuX2V2ZW50cy5hZGRMaXN0ZW5lcignY2hhbmdlOnNpemUnLCB0aGlzLm9uUmVzaXplKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgc2NlbmUgbWFuYWdlciB2aWV3IGFuZCB0cmFjayBjb250cm9sc1xuICAgICAgICBpZiAodGhpcy52aWV3ICYmIHRoaXMuc2NlbmVzLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLnNjZW5lcy52aWV3KTtcbiAgICAgICAgICAgIHRoaXMudHJhY2tDb250cm9sID0gbmV3IFRyYWNrQ29udHJvbCh0aGlzLCB7XG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlOiB0aGlzLmRyYWdUb01vdmUsXG4gICAgICAgICAgICAgICAgb25EcmFnOiBmdW5jdGlvbiAoY2FtZXJhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IGNhbWVyYS5fY2FsY3VsYXRlUG9zaXRpb25Gcm9tT2Zmc2V0KG5ldyBWZWN0b3IyKC10aGlzLngsIC10aGlzLnkpLCBjYW1lcmEuY2VudGVyLCBjYW1lcmEudHJhbnNmb3JtT3JpZ2luLCBjYW1lcmEudHJhbnNmb3JtYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBuZXcgT2N1bG8uQW5pbWF0aW9uKGNhbWVyYSwgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Ryb3lPbkNvbXBsZXRlOiB0cnVlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdXNlZDogZmFsc2UgXG4gICAgICAgICAgICAgICAgICAgIH0pLm1vdmVUbyhwb3NpdGlvbiwgMCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3aGVlbGFibGU6IHRoaXMud2hlZWxUb1pvb20sXG4gICAgICAgICAgICAgICAgb25XaGVlbDogZnVuY3Rpb24gKGNhbWVyYSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBaT09NX0lOID0gMTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgWk9PTV9PVVQgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmVsb2NpdHkgPSBNYXRoLmFicyh0aGlzLndoZWVsRXZlbnQuZGVsdGFZKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMud2hlZWxFdmVudC5kZWx0YVkgPiAwID8gWk9PTV9PVVQgOiBaT09NX0lOO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlvdXNEaXJlY3Rpb24gPSB0aGlzLnByZXZpb3VzV2hlZWxFdmVudC5kZWx0YVkgPiAwID8gWk9PTV9PVVQgOiBaT09NX0lOO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FtZXJhUmVjdDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbWVyYUZPVlBvc2l0aW9uID0gbmV3IFZlY3RvcjIoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjZW5lQ29udGV4dFBvc2l0aW9uID0gbmV3IFZlY3RvcjIoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdpbiA9IGNhbWVyYS50cmFuc2Zvcm1PcmlnaW47XG4gICAgICAgICAgICAgICAgICAgIHZhciB6b29tID0gY2FtZXJhLnpvb20gKyBjYW1lcmEuem9vbSAqIGNhbWVyYS53aGVlbFRvWm9vbUluY3JlbWVudCAqICh2ZWxvY2l0eSA+IDEgPyB2ZWxvY2l0eSAqIDAuNSA6IDEpICogKGRpcmVjdGlvbiA9PT0gWk9PTV9JTiA/IDEgOiAtMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUGVyZm9ybWFuY2UgT3B0aW1pemF0aW9uOiBJZiB6b29tIGhhcyBub3QgY2hhbmdlZCBiZWNhdXNlIGl0J3MgYXQgdGhlIG1pbi9tYXgsIGRvbid0IHpvb20uXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IHByZXZpb3VzRGlyZWN0aW9uICYmIGNhbWVyYS5fY2xhbXBab29tKHpvb20pICE9PSBjYW1lcmEuem9vbSkgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYVJlY3QgPSBjYW1lcmEudmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbWVyYUZPVlBvc2l0aW9uLnNldCh0aGlzLndoZWVsRXZlbnQuY2xpZW50WCAtIGNhbWVyYVJlY3QubGVmdCwgdGhpcy53aGVlbEV2ZW50LmNsaWVudFkgLSBjYW1lcmFSZWN0LnRvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2VuZUNvbnRleHRQb3NpdGlvbiA9IGNhbWVyYS5fY2FsY3VsYXRlUG9zaXRpb25Gcm9tT2Zmc2V0KGNhbWVyYS5vZmZzZXQsIGNhbWVyYUZPVlBvc2l0aW9uLCBjYW1lcmEudHJhbnNmb3JtT3JpZ2luLCBjYW1lcmEudHJhbnNmb3JtYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5yb3VuZChvcmlnaW4ueCkgIT09IE1hdGgucm91bmQoc2NlbmVDb250ZXh0UG9zaXRpb24ueCkgfHwgTWF0aC5yb3VuZChvcmlnaW4ueSkgIT09IE1hdGgucm91bmQoc2NlbmVDb250ZXh0UG9zaXRpb24ueSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW4gPSBjYW1lcmEuX2NhbGN1bGF0ZVBvc2l0aW9uRnJvbU9mZnNldChjYW1lcmEub2Zmc2V0LCBjYW1lcmFGT1ZQb3NpdGlvbiwgY2FtZXJhLnRyYW5zZm9ybU9yaWdpbiwgY2FtZXJhLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE9jdWxvLkFuaW1hdGlvbihjYW1lcmEsIHsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdHJveU9uQ29tcGxldGU6IHRydWUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdXNlZDogZmFsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS56b29tQXQob3JpZ2luLCB6b29tLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluaXRpYWxpemUoYXJndW1lbnRzWzBdKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjYm91bmRzXG4gICAgKiBAcHJvcGVydHkge251bGx8ZnVuY3Rpb258T2JqZWN0fSAtIFRoZSBjYW1lcmEncyBib3VuZHMuIFRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIHBvc2l0aW9uIHZhbHVlcyBmb3IgdGhlIGNhbWVyYS4gU2V0IHRvIG51bGwgaWYgbm8gYm91bmRzIGFyZSBkZXNpcmVkLlxuICAgICpcbiAgICAqIEBleGFtcGxlIDxjYXB0aW9uPkFzIGEgc3RvY2sgYm91bmRzPC9jYXB0aW9uPlxuICAgICogT2N1bG8uQ2FtZXJhLmJvdW5kcy5XT1JMRFxuICAgICpcbiAgICAqIEBleGFtcGxlIDxjYXB0aW9uPkFzIGEgYm91bmRzIG9iamVjdDwvY2FwdGlvbj5cbiAgICAqIHsgXG4gICAgKiAgIG1pblg6IDAsIFxuICAgICogICBtaW5ZOiAwLCBcbiAgICAqICAgbWF4WDogdGhpcy5zY2VuZS53aWR0aCwgXG4gICAgKiAgIG1heFk6IHRoaXMuc2NlbmUuaGVpZ2h0XG4gICAgKiB9XG4gICAgKlxuICAgICogQGV4YW1wbGUgPGNhcHRpb24+QXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBib3VuZHMgb2JqZWN0PC9jYXB0aW9uPlxuICAgICogZnVuY3Rpb24gKCkgeyBcbiAgICAqICAgdmFyIHRyYW5zZm9ybWF0aW9uID0gbmV3IE1hdHJpeDIoKS5zY2FsZSh0aGlzLnpvb20sIHRoaXMuem9vbSkuZ2V0SW52ZXJzZSgpO1xuICAgICogICB2YXIgbWluID0gbmV3IFZlY3RvcjIoKS5hZGQodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG4gICAgKiAgIHZhciBtYXggPSBuZXcgVmVjdG9yMih0aGlzLnNjZW5lLnNjYWxlZFdpZHRoLCB0aGlzLnNjZW5lLnNjYWxlZEhlaWdodCkuc3VidHJhY3QodGhpcy5jZW50ZXIpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbik7XG4gICAgKiBcbiAgICAqICAgcmV0dXJuIHtcbiAgICAqICAgICBtaW5YOiBtaW4ueCxcbiAgICAqICAgICBtaW5ZOiBtaW4ueSxcbiAgICAqICAgICBtYXhYOiBtYXgueCxcbiAgICAqICAgICBtYXhZOiBtYXgueVxuICAgICogICB9XG4gICAgKiB9XG4gICAgKi9cbiAgICBnZXQgYm91bmRzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvdW5kcztcbiAgICB9XG5cbiAgICBzZXQgYm91bmRzICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9ib3VuZHMgPSAhdmFsdWUgPyBudWxsIDogdmFsdWU7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUJvdW5kcygpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNoYXNCb3VuZHNcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaGFzIGJvdW5kcyBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBoYXNCb3VuZHMgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmRzICE9PSBudWxsO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNpc1JvdGF0ZWRcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSBjYW1lcmEgaXMgcm90YXRlZCBvciBub3QuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBpc1JvdGF0ZWQgKCkge1xuICAgICAgICByZXR1cm4gKE1hdGguYWJzKHRoaXMucm90YXRpb24gLyAzNjApICUgMSkgPiAwO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNpc1pvb21lZFxuICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgdGhlIGNhbWVyYSBpcyB6b29tZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgaXNab29tZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy56b29tICE9PSAxO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSNyYXdPZmZzZXRYXG4gICAgKiBAcHJvcGVydHkge1ZlY3RvcjJ9IC0gVGhlIFggb2Zmc2V0IG9mIHRoZSBjYW1lcmEncyB0b3AgbGVmdCBjb3JuZXIgcmVsYXRpdmUgdG8gdGhlIHdvcmxkIHdpdGhvdXQgYW55IGVmZmVjdHMgYXBwbGllZC5cbiAgICAqL1xuICAgIGdldCByYXdPZmZzZXRYICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3T2Zmc2V0Lng7XG4gICAgfVxuICAgIFxuICAgIHNldCByYXdPZmZzZXRYICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnJhd09mZnNldC54ID0gdmFsdWU7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgQ2FtZXJhI3Jhd09mZnNldFlcbiAgICAqIEBwcm9wZXJ0eSB7VmVjdG9yMn0gLSBUaGUgWSBvZmZzZXQgb2YgdGhlIGNhbWVyYSdzIHRvcCBsZWZ0IGNvcm5lciByZWxhdGl2ZSB0byB0aGUgd29ybGQgd2l0aG91dCBhbnkgZWZmZWN0cyBhcHBsaWVkLlxuICAgICovXG4gICAgZ2V0IHJhd09mZnNldFkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXdPZmZzZXQueTtcbiAgICB9XG4gICAgXG4gICAgc2V0IHJhd09mZnNldFkgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMucmF3T2Zmc2V0LnkgPSB2YWx1ZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjc2NlbmVcbiAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uU2NlbmV9IC0gVGhlIGFjdGl2ZSBzY2VuZS5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHNjZW5lICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NlbmVzLmFjdGl2ZVNjZW5lO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBuYW1lIENhbWVyYSN0cmFuc2Zvcm1hdGlvblxuICAgICogQHByb3BlcnR5IHtNYXRyaXgyfSAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBvZiB0aGUgc2NlbmUuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB0cmFuc2Zvcm1hdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4MigpLnNjYWxlKHRoaXMuem9vbSwgdGhpcy56b29tKS5yb3RhdGUoX01hdGguZGVnVG9SYWQoLXRoaXMucm90YXRpb24pKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAbmFtZSBDYW1lcmEjem9vbVxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IC0gVGhlIGFtb3VudCBvZiB6b29tLiBBIHJhdGlvIHdoZXJlIDEgPSAxMDAlLlxuICAgICogQHJlYWRvbmx5XG4gICAgKiBAZGVmYXVsdCAxXG4gICAgKi9cbiAgICBnZXQgem9vbSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl96b29tO1xuICAgIH1cbiAgICAgICAgXG4gICAgc2V0IHpvb20gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3pvb20gPSB0aGlzLl9jbGFtcFpvb20odmFsdWUpO1xuICAgICAgICB0aGlzLl91cGRhdGVCb3VuZHMoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgKiBBcHBseSB0aGUgc2hha2UgZWZmZWN0IHRvIHRoZSBjYW1lcmEuXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfYXBwbHlTaGFrZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzU2hha2luZykge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi5hZGQodGhpcy5zaGFrZU9mZnNldCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0aGlzLnNoYWtlUmVzcGVjdEJvdW5kcykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NsYW1wUG9zaXRpb24odGhpcy5wb3NpdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENhbGN1bGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIGNhbWVyYSBvbiB0aGUgc2NlbmUgZ2l2ZW4gYSBzY2VuZSBwb3NpdGlvbiB0byBiZSBsb2NhdGVkIGEgcG9pbnQgaW4gdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBzY2VuZVBvc2l0aW9uIC0gVGhlIHJhdyBwb2ludCBvbiB0aGUgc2NlbmUuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUZPVlBvc2l0aW9uIC0gVGhlIHBvaW50IGluIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUNlbnRlciAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gc2NlbmVPcmlnaW4gLSBUaGUgc2NlbmUncyBvcmlnaW4uXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IHNjZW5lVHJhbnNmb3JtYXRpb24gLSBUaGUgc2NlbmUncyB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIGNhbWVyYSdzIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NhbGN1bGF0ZVBvc2l0aW9uRnJvbVBvc2l0aW9uIChzY2VuZVBvc2l0aW9uLCBjYW1lcmFGT1ZQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCBzY2VuZU9yaWdpbiwgc2NlbmVUcmFuc2Zvcm1hdGlvbikge1xuICAgICAgICBpZiAoY2FtZXJhRk9WUG9zaXRpb24uZXF1YWxzKGNhbWVyYUNlbnRlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBzY2VuZVBvc2l0aW9uLmNsb25lKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gdGhpcy5fY2FsY3VsYXRlT2Zmc2V0RnJvbVBvc2l0aW9uKHNjZW5lUG9zaXRpb24sIGNhbWVyYUZPVlBvc2l0aW9uLCBzY2VuZU9yaWdpbiwgc2NlbmVUcmFuc2Zvcm1hdGlvbik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYWxjdWxhdGVQb3NpdGlvbkZyb21PZmZzZXQob2Zmc2V0LCBjYW1lcmFDZW50ZXIsIHNjZW5lT3JpZ2luLCBzY2VuZVRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENhbGN1bGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIGNhbWVyYSBvbiB0aGUgc2NlbmUgZ2l2ZW4gdGhlIGNhbWVyYSdzIG9mZnNldC5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBjYW1lcmFPZmZzZXQgLSBUaGUgY2FtZXJhJ3Mgb2Zmc2V0IG9uIHRoZSBzY2VuZS5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhQ2VudGVyIC0gVGhlIGNlbnRlciBvZiB0aGUgY2FtZXJhJ3MgRk9WLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBzY2VuZU9yaWdpbiAtIFRoZSBzY2VuZSdzIG9yaWdpbi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gc2NlbmVUcmFuc2Zvcm1hdGlvbiAtIFRoZSBzY2VuZSdzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgY2FtZXJhJ3MgcG9zaXRpb24uXG4gICAgKi9cbiAgICBfY2FsY3VsYXRlUG9zaXRpb25Gcm9tT2Zmc2V0IChjYW1lcmFPZmZzZXQsIGNhbWVyYUNlbnRlciwgc2NlbmVPcmlnaW4sIHNjZW5lVHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHNjZW5lT3JpZ2luT2Zmc2V0ID0gc2NlbmVPcmlnaW4uY2xvbmUoKS50cmFuc2Zvcm0oc2NlbmVUcmFuc2Zvcm1hdGlvbikuc3VidHJhY3Qoc2NlbmVPcmlnaW4pO1xuXG4gICAgICAgIHJldHVybiBjYW1lcmFPZmZzZXQuY2xvbmUoKS5hZGQoc2NlbmVPcmlnaW5PZmZzZXQpLmFkZChjYW1lcmFDZW50ZXIpLnRyYW5zZm9ybShzY2VuZVRyYW5zZm9ybWF0aW9uLmdldEludmVyc2UoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxjdWxhdGUgdGhlIHBvc2l0aW9uIGluIHRoZSBjYW1lcmEncyBGT1Ygb2YgdGhlIHByb3ZpZGVkIHNjZW5lIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHNjZW5lUG9zaXRpb24gLSBUaGUgcmF3IHBvaW50IG9uIHRoZSBzY2VuZS5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gY2FtZXJhUG9zaXRpb24gLSBUaGUgY2FtZXJhJ3MgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUNlbnRlciAtIFRoZSBjZW50ZXIgb2YgdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gc2NlbmVUcmFuc2Zvcm1hdGlvbiAtIFRoZSBzY2VuZSdzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm5zIHtWZWN0b3IyfSBUaGUgcG9zaXRpb24gaW4gdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqL1xuICAgIF9jYWxjdWxhdGVDb250ZXh0UG9zaXRpb24gKHNjZW5lUG9zaXRpb24sIGNhbWVyYVBvc2l0aW9uLCBjYW1lcmFDZW50ZXIsIHNjZW5lVHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIGNhbWVyYU9mZnNldCA9IHRoaXMuX2NhbGN1bGF0ZU9mZnNldEZyb21Qb3NpdGlvbihjYW1lcmFQb3NpdGlvbiwgY2FtZXJhQ2VudGVyLCBuZXcgVmVjdG9yMigpLCBzY2VuZVRyYW5zZm9ybWF0aW9uKTtcblxuICAgICAgICByZXR1cm4gc2NlbmVQb3NpdGlvbi5jbG9uZSgpLnRyYW5zZm9ybShzY2VuZVRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdChjYW1lcmFPZmZzZXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQ2FsY3VsYXRlIHRoZSBvZmZzZXQgb2YgdGhlIGNhbWVyYSBvbiB0aGUgc2NlbmUgZ2l2ZW4gYSBzY2VuZSBwb3NpdGlvbiB0byBiZSBsb2NhdGVkIGEgcG9pbnQgaW4gdGhlIGNhbWVyYSdzIEZPVi5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBzY2VuZVBvc2l0aW9uIC0gVGhlIHJhdyBwb2ludCBvbiB0aGUgc2NlbmUuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGNhbWVyYUZPVlBvc2l0aW9uIC0gVGhlIHBvaW50IGluIHRoZSBjYW1lcmEncyBGT1YuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHNjZW5lT3JpZ2luIC0gVGhlIHNjZW5lJ3Mgb3JpZ2luLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBzY2VuZVRyYW5zZm9ybWF0aW9uIC0gVGhlIHNjZW5lJ3MgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBjYW1lcmEncyBvZmZzZXQuXG4gICAgKi9cbiAgICBfY2FsY3VsYXRlT2Zmc2V0RnJvbVBvc2l0aW9uIChzY2VuZVBvc2l0aW9uLCBjYW1lcmFGT1ZQb3NpdGlvbiwgc2NlbmVPcmlnaW4sIHNjZW5lVHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdmFyIHNjZW5lT3JpZ2luT2Zmc2V0ID0gc2NlbmVPcmlnaW4uY2xvbmUoKS50cmFuc2Zvcm0oc2NlbmVUcmFuc2Zvcm1hdGlvbikuc3VidHJhY3Qoc2NlbmVPcmlnaW4pO1xuXG4gICAgICAgIHJldHVybiBzY2VuZVBvc2l0aW9uLmNsb25lKCkudHJhbnNmb3JtKHNjZW5lVHJhbnNmb3JtYXRpb24pLnN1YnRyYWN0KHNjZW5lT3JpZ2luT2Zmc2V0KS5zdWJ0cmFjdChjYW1lcmFGT1ZQb3NpdGlvbik7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xhbXAgdGhlIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uLlxuICAgICogQHJldHVybnMge1ZlY3RvcjJ9IFRoZSBjbGFtcGVkIHBvc2l0aW9uLlxuICAgICovXG4gICAgX2NsYW1wUG9zaXRpb24gKHBvc2l0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzLl9ib3VuZHMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uLnggPSBjbGFtcChwb3NpdGlvbi54LCB0aGlzLm1pblBvc2l0aW9uWCwgdGhpcy5tYXhQb3NpdGlvblgpO1xuICAgICAgICAgICAgcG9zaXRpb24ueSA9IGNsYW1wKHBvc2l0aW9uLnksIHRoaXMubWluUG9zaXRpb25ZLCB0aGlzLm1heFBvc2l0aW9uWSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFRPRE86IEZvciBkZXYgb25seVxuICAgICAgICBjb25zb2xlLmxvZygnY2xhbXAgcG9zaXRpb24nKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbGFtcCB0aGUgem9vbS5cbiAgICAqXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSBUaGUgem9vbS5cbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBjbGFtcGVkIHpvb20uXG4gICAgKi9cbiAgICBfY2xhbXBab29tICh6b29tKSB7XG4gICAgICAgIHJldHVybiBjbGFtcCh6b29tLCB0aGlzLm1pblpvb20sIHRoaXMubWF4Wm9vbSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogUmVzZXRzIHRoZSBjYW1lcmEgdG8gdGhlIGRlZmF1bHQgc3RhdGUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIF9yZXNldCAoKSB7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtT3JpZ2luLnNldCgwLCAwKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi5zZXQodGhpcy53aWR0aCAqIDAuNSwgdGhpcy5oZWlnaHQgKiAwLjUpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uID0gMDtcbiAgICAgICAgdGhpcy56b29tID0gMTtcbiAgICAgICAgdGhpcy5yYXdPZmZzZXQgPSB0aGlzLl9jYWxjdWxhdGVPZmZzZXRGcm9tUG9zaXRpb24odGhpcy5wb3NpdGlvbiwgdGhpcy5jZW50ZXIsIHRoaXMudHJhbnNmb3JtT3JpZ2luLCB0aGlzLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgdGhpcy5vZmZzZXQuY29weSh0aGlzLnJhd09mZnNldCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB0cmFuc2Zvcm1PcmlnaW4uXG4gICAgKlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gb3JpZ2luIC0gVGhlIG9yaWdpbi5cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBfc2V0VHJhbnNmb3JtT3JpZ2luIChvcmlnaW4pIHtcbiAgICAgICAgaWYgKG9yaWdpbiAmJiAhb3JpZ2luLmVxdWFscyh0aGlzLnRyYW5zZm9ybU9yaWdpbikpIHtcbiAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1hdGlvbiA9IHRoaXMudHJhbnNmb3JtYXRpb247XG4gICAgICAgICAgICB2YXIgb3JpZ2luT2Zmc2V0ID0gb3JpZ2luLmNsb25lKCkudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKS5zdWJ0cmFjdCh0aGlzLnRyYW5zZm9ybU9yaWdpbi5jbG9uZSgpLnRyYW5zZm9ybSh0cmFuc2Zvcm1hdGlvbikpLnN1YnRyYWN0KG9yaWdpbi5jbG9uZSgpLnN1YnRyYWN0KHRoaXMudHJhbnNmb3JtT3JpZ2luKSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzUm90YXRlZCB8fCB0aGlzLmlzWm9vbWVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yYXdPZmZzZXQueCAtPSBvcmlnaW5PZmZzZXQueDtcbiAgICAgICAgICAgICAgICB0aGlzLnJhd09mZnNldC55IC09IG9yaWdpbk9mZnNldC55O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnRyYW5zZm9ybU9yaWdpbi5jb3B5KG9yaWdpbik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICBfdXBkYXRlQm91bmRzICgpIHsgXG4gICAgICAgIHZhciBib3VuZHM7XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5zY2VuZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2JvdW5kcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbWluWDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWluWTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWF4WDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbWF4WTogbnVsbFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2JvdW5kcykpIHtcbiAgICAgICAgICAgICAgICBib3VuZHMgPSB0aGlzLl9ib3VuZHMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGJvdW5kcyA9IHRoaXMuX2JvdW5kcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5taW5Qb3NpdGlvblggPSBib3VuZHMubWluWDtcbiAgICAgICAgICAgIHRoaXMubWluUG9zaXRpb25ZID0gYm91bmRzLm1pblk7XG4gICAgICAgICAgICB0aGlzLm1heFBvc2l0aW9uWCA9IGJvdW5kcy5tYXhYO1xuICAgICAgICAgICAgdGhpcy5tYXhQb3NpdGlvblkgPSBib3VuZHMubWF4WTtcblxuICAgICAgICAgICAgLy8gVE9ETzogRm9yIGRldiBvbmx5XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd1cGRhdGUgYm91bmRzJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBZGRzIGFuIGFuaW1hdGlvbiB0byB0aGUgY2FtZXJhLlxuICAgICpcbiAgICAqIEBzZWUgT2N1bG8uQW5pbWF0aW9uTWFuYWdlci5hZGRcbiAgICAqIHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGFkZEFuaW1hdGlvbiAobmFtZSwgYW5pbWF0aW9uKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQobmFtZSwgYW5pbWF0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgYW4gYW5pbWF0aW9uLlxuICAgICpcbiAgICAqIEBzZWUgT2N1bG8uQW5pbWF0aW9uTWFuYWdlci5nZXRcbiAgICAqL1xuICAgIGdldEFuaW1hdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbmltYXRpb25zLmdldChuYW1lKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBBZGRzIGEgc2NlbmUgdG8gdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLlNjZW5lTWFuYWdlci5hZGRcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBhZGRTY2VuZSAobmFtZSwgc2NlbmUpIHtcbiAgICAgICAgdGhpcy5zY2VuZXMuYWRkKG5hbWUsIHNjZW5lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgYSBzY2VuZS5cbiAgICAqXG4gICAgKiBAc2VlIE9jdWxvLlNjZW5lTWFuYWdlci5nZXRcbiAgICAqL1xuICAgIGdldFNjZW5lIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjZW5lcy5nZXQobmFtZSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgYWN0aXZlIHNjZW5lLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHNjZW5lLlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFNjZW5lIChuYW1lKSB7XG4gICAgICAgIHRoaXMuc2NlbmVzLnNldEFjdGl2ZVNjZW5lKG5hbWUpO1xuICAgICAgICB0aGlzLl9yZXNldCgpO1xuICAgICAgICB0aGlzLl91cGRhdGVCb3VuZHMoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgY2FtZXJhIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgaWYgKHRoaXMudmlldyAmJiB0aGlzLnZpZXcucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgdGhpcy52aWV3LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy52aWV3KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuc2NlbmVzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ldmVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyBkcmFnLXRvLW1vdmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGVEcmFnVG9Nb3ZlICgpIHtcbiAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGlzYWJsZURyYWcoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyBkcmFnLXRvLW1vdmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZURyYWdUb01vdmUgKCkge1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5lbmFibGVEcmFnKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgd2hlZWwtdG8tem9vbS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGlzYWJsZVdoZWVsVG9ab29tICgpIHtcbiAgICAgICAgdGhpcy50cmFja0NvbnRyb2wuZGlzYWJsZVdoZWVsKCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEVuYWJsZXMgd2hlZWwtdG8tem9vbS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlV2hlZWxUb1pvb20gKCkge1xuICAgICAgICB0aGlzLnRyYWNrQ29udHJvbC5lbmFibGVXaGVlbCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbWVyYSBoYXMgYmVlbiBjcmVhdGVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiBpbml0aWFsaXplIGlzIGEgbm8tb3AuIE92ZXJyaWRlIHRoaXMgZnVuY3Rpb24gd2l0aCB5b3VyIG93biBjb2RlLlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBUaGUgb3B0aW9ucyBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yIHdoZW4gdGhlIGNhbWVyYSB3YXMgY3JlYXRlZC5cbiAgICAqL1xuICAgIGluaXRpYWxpemUgKG9wdGlvbnMpIHtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxsZWQgYmVmb3JlIHRoZSBjYW1lcmEgaGFzIHJlbmRlcmVkLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiBpbml0aWFsaXplIGlzIGEgbm8tb3AuIE92ZXJyaWRlIHRoaXMgZnVuY3Rpb24gd2l0aCB5b3VyIG93biBjb2RlLlxuICAgICovXG4gICAgb25CZWZvcmVSZW5kZXIgKCkge1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBDYWxsZWQgYWZ0ZXIgdGhlIGNhbWVyYSBoYXMgcmVuZGVyZWQuIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIGluaXRpYWxpemUgaXMgYSBuby1vcC4gT3ZlcnJpZGUgdGhpcyBmdW5jdGlvbiB3aXRoIHlvdXIgb3duIGNvZGUuXG4gICAgKi9cbiAgICBvblJlbmRlciAoKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFJlbmRlciB0aGUgY2FtZXJhIHZpZXcuIElmIHlvdSBuZWVkIHRvIG1hbmlwdWxhdGUgaG93IHRoZSBjYW1lcmEgcmVuZGVycywgdXNlIHtAbGluayBDYW1lcmEjb25CZWZvcmVSZW5kZXJ8b25CZWZvcmVSZW5kZXJ9IGFuZCB7QGxpbmsgQ2FtZXJhI29uUmVuZGVyfG9uUmVuZGVyfS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7Q2FtZXJhfSBUaGUgdmlldy5cbiAgICAqL1xuICAgIHJlbmRlciAoKSB7XG4gICAgICAgIHRoaXMub25CZWZvcmVSZW5kZXIoKTtcblxuICAgICAgICBpZiAoIXRoaXMuaXNSZW5kZXJlZCkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXJTaXplKCk7XG4gICAgICAgICAgICB0aGlzLmlzUmVuZGVyZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDbGFtcGluZyBoZXJlIGVuc3VyZXMgYm91bmRzIGhhdmUgYmVlbiB1cGRhdGVkIChpZiB6b29tIGhhcyBjaGFuZ2VkKSBhbmQgYm91bmRzIGFyZSBlbmZvcmNlZCBkdXJpbmcgcm90YXRlQXRcbiAgICAgICAgLy8gUG9zaXRpb24gaXMgbWFudWFsbHkgbWFpbnRhaW5lZCBzbyBhbmltYXRpb25zIGNhbiBzbW9vdGhseSBjb250aW51ZSB3aGVuIGNhbWVyYSBpcyByZXNpemVkXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLl9jbGFtcFBvc2l0aW9uKHRoaXMuX2NhbGN1bGF0ZVBvc2l0aW9uRnJvbU9mZnNldCh0aGlzLnJhd09mZnNldCwgdGhpcy5jZW50ZXIsIHRoaXMudHJhbnNmb3JtT3JpZ2luLCB0aGlzLnRyYW5zZm9ybWF0aW9uKSk7XG4gICAgICAgIHRoaXMuX2FwcGx5U2hha2UoKTtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLl9jYWxjdWxhdGVPZmZzZXRGcm9tUG9zaXRpb24odGhpcy5wb3NpdGlvbiwgdGhpcy5jZW50ZXIsIHRoaXMudHJhbnNmb3JtT3JpZ2luLCB0aGlzLnRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5vblJlbmRlcigpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHNpemUgb2YgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IHdpZHRoIC0gVGhlIHdpZHRoLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBoZWlnaHQgLSBUaGUgaGVpZ2h0LlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFNpemUgKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIGhhc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIGlmICghaXNOaWwod2lkdGgpICYmICh3aWR0aCAhPT0gdGhpcy53aWR0aCkpIHtcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgIHRoaXMuY2VudGVyLnggPSB3aWR0aCAqIDAuNTtcbiAgICAgICAgICAgIGhhc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzTmlsKGhlaWdodCkgJiYgKGhlaWdodCAhPT0gdGhpcy5oZWlnaHQpKSB7XG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuY2VudGVyLnkgPSBoZWlnaHQgKiAwLjU7XG4gICAgICAgICAgICBoYXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGhhc0NoYW5nZWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyU2l6ZSgpO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLmVtaXQoJ2NoYW5nZTpzaXplJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFBhdXNlcyB0aGUgY2FtZXJhIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBleHRlcm5hbDpUaW1lbGluZU1heHxUaW1lbGluZU1heH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBwYXVzZSAoKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wYXVzZSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUGxheXMgdGhlIGNhbWVyYSBhbmltYXRpb24gZm9yd2FyZCBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHBsYXkgKGFuaW1hdGlvbikge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb24pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlc3VtZXMgcGxheWluZyB0aGUgY2FtZXJhIGFuaW1hdGlvbiBmcm9tIHRoZSBjdXJyZW50IHBsYXloZWFkIHBvc2l0aW9uLlxuICAgICpcbiAgICAqIEBzZWUge0BsaW5rIGV4dGVybmFsOlRpbWVsaW5lTWF4fFRpbWVsaW5lTWF4fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlc3VtZSAoKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5yZXN1bWUoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IGFuaW1hdGUgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI2FuaW1hdGV8QW5pbWF0aW9uLmFuaW1hdGV9XG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgYW5pbWF0ZSAocHJvcHMsIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcykuYW5pbWF0ZShwcm9wcywgZHVyYXRpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSBtb3ZlIHRvIGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiNtb3ZlVG98QW5pbWF0aW9uLm1vdmVUb31cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBtb3ZlVG8gKHBvc2l0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLm1vdmVUbyhwb3NpdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLnBsYXkoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBJbW1lZGlhdGVseSByb3RhdGUgYXQgdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI3JvdGF0ZUF0fEFuaW1hdGlvbi5yb3RhdGVBdH1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByb3RhdGVBdCAob3JpZ2luLCByb3RhdGlvbiwgZHVyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLmFkZChhbmltYXRpb25OYW1lLkFOT05ZTU9VUywgbmV3IE9jdWxvLkFuaW1hdGlvbih0aGlzKS5yb3RhdGVBdChvcmlnaW4sIHJvdGF0aW9uLCBkdXJhdGlvbiwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShhbmltYXRpb25OYW1lLkFOT05ZTU9VUyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEltbWVkaWF0ZWx5IHJvdGF0ZSBhdCB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI3JvdGF0ZVRvfEFuaW1hdGlvbi5yb3RhdGVUb31cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICByb3RhdGVUbyAocm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcykucm90YXRlVG8ocm90YXRpb24sIGR1cmF0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgc2hha2UgdGhlIGNhbWVyYS5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI3NoYWtlfEFuaW1hdGlvbi5zaGFrZX1cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzaGFrZSAoaW50ZW5zaXR5LCBkdXJhdGlvbiwgZGlyZWN0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcykuc2hha2UoaW50ZW5zaXR5LCBkdXJhdGlvbiwgZGlyZWN0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgem9vbSBpbi9vdXQgYXQgYSBzcGVjaWZpYyBsb2NhdGlvbi5cbiAgICAqXG4gICAgKiBAc2VlIHtAbGluayBDYW1lcmEuQW5pbWF0aW9uI3pvb21BdHxBbmltYXRpb24uem9vbUF0fVxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHpvb21BdCAob3JpZ2luLCB6b29tLCBkdXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTLCBuZXcgT2N1bG8uQW5pbWF0aW9uKHRoaXMpLnpvb21BdChvcmlnaW4sIHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogSW1tZWRpYXRlbHkgem9vbSBpbi9vdXQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQHNlZSB7QGxpbmsgQ2FtZXJhLkFuaW1hdGlvbiN6b29tVG98QW5pbWF0aW9uLnpvb21Ub31cbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICB6b29tVG8gKHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoYW5pbWF0aW9uTmFtZS5BTk9OWU1PVVMsIG5ldyBPY3Vsby5BbmltYXRpb24odGhpcykuem9vbVRvKHpvb20sIGR1cmF0aW9uLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KGFuaW1hdGlvbk5hbWUuQU5PTllNT1VTKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbkNhbWVyYS5ib3VuZHMgPSB7XG4gICAgTk9ORTogbnVsbCxcbiAgICBXT1JMRDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdHJhbnNmb3JtYXRpb24gPSBuZXcgTWF0cml4MigpLnNjYWxlKHRoaXMuem9vbSwgdGhpcy56b29tKS5nZXRJbnZlcnNlKCk7XG4gICAgICAgIHZhciBtaW4gPSBuZXcgVmVjdG9yMigpLmFkZCh0aGlzLmNlbnRlcikudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKTtcbiAgICAgICAgdmFyIG1heCA9IG5ldyBWZWN0b3IyKHRoaXMuc2NlbmUuc2NhbGVkV2lkdGgsIHRoaXMuc2NlbmUuc2NhbGVkSGVpZ2h0KS5zdWJ0cmFjdCh0aGlzLmNlbnRlcikudHJhbnNmb3JtKHRyYW5zZm9ybWF0aW9uKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluWDogbWluLngsXG4gICAgICAgICAgICBtaW5ZOiBtaW4ueSxcbiAgICAgICAgICAgIG1heFg6IG1heC54LFxuICAgICAgICAgICAgbWF4WTogbWF4LnlcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFdPUkxEX0VER0U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pblg6IDAsXG4gICAgICAgICAgICBtaW5ZOiAwLFxuICAgICAgICAgICAgbWF4WDogdGhpcy5zY2VuZS53aWR0aCxcbiAgICAgICAgICAgIG1heFk6IHRoaXMuc2NlbmUuaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENhbWVyYTsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuLyoqXG4qIE9iamVjdCB0eXBlcy5cbiogQGVudW0ge251bWJlcn1cbiovXG5jb25zdCBUeXBlID0ge1xuICAgIEFOSU1BVElPTjogMFxufVxuXG5leHBvcnQgeyBUeXBlIH07IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5DU1NSZW5kZXJlclxuKiBAY29uc3RydWN0b3JcbipcbiogQGV4YW1wbGVcbiogdmFyIG15UmVuZGVyZXIgPSBuZXcgQ1NTUmVuZGVyZXIobXlDYW1lcmEpO1xuKi9cbmNsYXNzIENTU1JlbmRlcmVyIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIFRoZSBjYW1lcmEuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSByZW5kZXJlciBhbmQgcHJlcGFyZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlbmRlciB0aGUgc2NlbmUuXG4gICAgKlxuICAgICogcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcmVuZGVyICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FtZXJhLnNjZW5lICYmIHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3KSB7XG4gICAgICAgICAgICB0aGlzLmNhbWVyYS5zY2VuZS52aWV3LnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICBUd2VlbkxpdGUuc2V0KHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3LCB7IFxuICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1PcmlnaW46IHRoaXMuY2FtZXJhLnRyYW5zZm9ybU9yaWdpbi54ICsgJ3B4ICcgKyB0aGlzLmNhbWVyYS50cmFuc2Zvcm1PcmlnaW4ueSArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlWDogdGhpcy5jYW1lcmEuem9vbSxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVZOiB0aGlzLmNhbWVyYS56b29tLFxuICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogLXRoaXMuY2FtZXJhLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICB4OiAtdGhpcy5jYW1lcmEub2Zmc2V0LngsXG4gICAgICAgICAgICAgICAgICAgIHk6IC10aGlzLmNhbWVyYS5vZmZzZXQueVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pOyAgICBcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJlbmRlciB0aGUgZGltZW5zaW9ucy9zaXplLlxuICAgICpcbiAgICAqIHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHJlbmRlclNpemUgKCkge1xuICAgICAgICBpZiAodGhpcy5jYW1lcmEudmlldykge1xuICAgICAgICAgICAgVHdlZW5MaXRlLnNldCh0aGlzLmNhbWVyYS52aWV3LCB7IFxuICAgICAgICAgICAgICAgIGNzczogeyBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmNhbWVyYS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLmNhbWVyYS53aWR0aFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDU1NSZW5kZXJlcjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuLyoqXG4qIEdTQVAncyBEcmFnZ2FibGUuXG4qIEBleHRlcm5hbCBEcmFnZ2FibGVcbiogQHNlZSBodHRwOi8vZ3JlZW5zb2NrLmNvbS9kb2NzLyMvSFRNTDUvR1NBUC9VdGlscy9EcmFnZ2FibGUvXG4qL1xuXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5EcmFnQ29udHJvbFxuKiBAY29uc3RydWN0b3JcbiogQHJlcXVpcmVzIHtAbGluayBleHRlcm5hbDpEcmFnZ2FibGV9XG4qIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IHRhcmdldCAtIFRoZSB0YXJnZXQuXG4qIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3Qgb2YgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSBbb3B0aW9ucy5kcmFnUHJveHldIC0gVGhlIGVsZW1lbnQgdGhhdCBjb250cm9scy9pbml0aWF0ZXMgdGhlIGRyYWcgZXZlbnRzLlxuKiBAcGFyYW0ge2Z1bmN0aW9ufSBbb3B0aW9ucy5vbkRyYWddIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZXZlcnkgdGltZSB0aGUgZHJhZyBldmVudCBvY2N1cnMuXG4qIEBwYXJhbSB7YXJyYXl9IFtvcHRpb25zLm9uRHJhZ1BhcmFtc10gLSBUaGUgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBjYWxsYmFjay5cbiogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLm9uRHJhZ1Njb3BlXSAtIFdoYXQgJ3RoaXMnIHJlZmVycyB0byBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlEcmFnQ29udHJvbCA9IG5ldyBPY3Vsby5EcmFnQ29udHJvbCgnI3NjZW5lJywgeyAgXG4qICAgb25EcmFnOiBmdW5jdGlvbiAoKSB7IFxuKiAgICAgY29uc29sZS5sb2coJ2RyYWdnaW5nJyk7IFxuKiAgIH1cbiogfSk7XG4qL1xuY2xhc3MgRHJhZ0NvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yICh0YXJnZXQsIHtcbiAgICAgICAgZHJhZ1Byb3h5ID0gdGFyZ2V0LFxuICAgICAgICBvbkRyYWcgPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgb25EcmFnUGFyYW1zID0gW10sXG4gICAgICAgIG9uRHJhZ1Njb3BlID0gdGhpc1xuICAgIH0gPSB7fSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSB7IGRyYWdQcm94eSwgb25EcmFnLCBvbkRyYWdQYXJhbXMsIG9uRHJhZ1Njb3BlIH07XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge0RyYWdnYWJsZX0gLSBUaGUgb2JqZWN0IHRoYXQgaGFuZGxlcyB0aGUgZHJhZyBiZWhhdmlvci5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb250cm9sID0gbmV3IERyYWdnYWJsZSh0YXJnZXQsIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU2NvcGU6IG9uRHJhZ1Njb3BlLFxuICAgICAgICAgICAgb25EcmFnOiBvbkRyYWcsXG4gICAgICAgICAgICBvbkRyYWdQYXJhbXM6IG9uRHJhZ1BhcmFtcyxcbiAgICAgICAgICAgIHpJbmRleEJvb3N0OiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgZWxlbWVudCB0aGF0IGNvbnRyb2xzL2luaXRpYXRlcyB0aGUgZHJhZyBldmVudHMuXG4gICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5ID0gVXRpbHMuRE9NLnBhcnNlVmlldyhkcmFnUHJveHkpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZHJhZ2dpbmcgb3Igbm90LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciBpdCBpcyBwcmVzc2VkIG9yIG5vdC5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1ByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25EcmFnc3RhcnQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkRyYWdSZWxlYXNlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lbmREcmFnKGV2ZW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uRHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lbmREcmFnKGV2ZW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uRHJhZ01vdmUgPSAoZXZlbnQpID0+IHsgXG4gICAgICAgICAgICBpZiAodGhpcy5pc1ByZXNzZWQgJiYgIXRoaXMuaXNEcmFnZ2luZykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbC5zdGFydERyYWcoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9lbmREcmFnID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cm9sLmVuZERyYWcoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5fb25EcmFnTGVhdmUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uRHJhZ01vdmUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLl9vbkRyYWdNb3ZlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25QcmVzcyA9IChldmVudCkgPT4geyBcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vbkRyYWdSZWxlYXNlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLl9vbkRyYWdMZWF2ZSk7XG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbkRyYWdNb3ZlKTtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fb25EcmFnUmVsZWFzZSk7XG4gICAgICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX29uRHJhZ1JlbGVhc2UpO1xuICAgICAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5fb25EcmFnTW92ZSk7XG4gICAgICAgICAgICB0aGlzLmlzUHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vblJlbGVhc2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlbGVhc2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uTGVhdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlbGVhc2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX3JlbGVhc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlzUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmFibGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGl0IGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgZW5hYmxlZCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wuZW5hYmxlZCgpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAtIFRoZSBsYXN0IHBvaW50ZXIgZXZlbnQgdGhhdCBhZmZlY3RlZCB0aGUgaW5zdGFuY2UuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBwb2ludGVyRXZlbnQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnBvaW50ZXJFdmVudDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgeCBwb3NpdGlvbiBvZiB0aGUgbGFzdCBwb2ludGVyIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgcG9pbnRlclggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnBvaW50ZXJYO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB5IHBvc2l0aW9uIG9mIHRoZSBsYXN0IHBvaW50ZXIgZXZlbnQgdGhhdCBhZmZlY3RlZCB0aGUgaW5zdGFuY2UuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBwb2ludGVyWSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wucG9pbnRlclk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtFbGVtZW50fSAtIFRoZSB0YXJnZXQuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCB0YXJnZXQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLnRhcmdldDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgY3VycmVudCB4IHBvc2l0aW9uLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgeCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wueDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgY3VycmVudCB5IHBvc2l0aW9uLlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgeSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wueTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgY29udHJvbCBhbmQgcHJlcGFyZXMgaXQgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgICB0aGlzLmNvbnRyb2wua2lsbCgpO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHt9O1xuICAgICAgICB0aGlzLmRyYWdQcm94eSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEaXNhYmxlcyB0aGUgY29udHJvbC5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZGlzYWJsZSAoKSB7XG4gICAgICAgIHRoaXMuY29udHJvbC5kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuX29uRHJhZ3N0YXJ0KTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25QcmVzcyk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5fb25MZWF2ZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblByZXNzKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX29uUmVsZWFzZSk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LnN0eWxlLmN1cnNvciA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRW5hYmxlcyB0aGUgY29udHJvbC5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlICgpIHtcbiAgICAgICAgdGhpcy5jb250cm9sLmVuYWJsZSgpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLl9vbkRyYWdzdGFydCk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uUHJlc3MpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuX29uTGVhdmUpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fb25QcmVzcyk7XG4gICAgICAgIHRoaXMuZHJhZ1Byb3h5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fb25SZWxlYXNlKTtcbiAgICAgICAgdGhpcy5kcmFnUHJveHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLl9vblJlbGVhc2UpO1xuICAgICAgICB0aGlzLmRyYWdQcm94eS5zdHlsZS5jdXJzb3IgPSAnbW92ZSc7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRHJhZ0NvbnRyb2w7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiogQSBjb2xsZWN0aW9uIG9mIHVzZWZ1bCBtYXRoZW1hdGljYWwgdmFsdWVzIGFuZCBmdW5jdGlvbnMuXG4qXG4qIEBuYW1lc3BhY2UgT2N1bG8uTWF0aFxuKi9cbmNvbnN0IF9NYXRoID0ge1xuICAgIC8qKlxuICAgICogQ29udmVydCBkZWdyZWVzIHRvIHJhZGlhbnMuXG4gICAgKlxuICAgICogQGZ1bmN0aW9uIE9jdWxvLk1hdGgjZGVnVG9SYWRcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZWdyZWVzIC0gVGhlIGRlZ3JlZXMgdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gVGhlIHZhbHVlIGluIHJhZGlhbnMuXG4gICAgKi9cbiAgICBkZWdUb1JhZDogKGRlZ3JlZXMpID0+IHtcbiAgICAgICAgcmV0dXJuIGRlZ3JlZXMgKiBfTWF0aC5kZWdUb1JhZEZhY3RvcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgKiBDb252ZXJ0IHJhZGlhbnMgdG8gZGVncmVlcy5cbiAgICAqXG4gICAgKiBAZnVuY3Rpb24gT2N1bG8uTWF0aCNyYWRUb0RlZ1xuICAgICogQHBhcmFtIHtudW1iZXJ9IHJhZGlhbnMgLSBUaGUgcmFkaWFucyB2YWx1ZS5cbiAgICAqIEByZXR1cm4ge251bWJlcn0gLSBUaGUgdmFsdWUgaW4gZGVncmVlcy5cbiAgICAqL1xuICAgIHJhZFRvRGVnOiAocmFkaWFucykgPT4ge1xuICAgICAgICByZXR1cm4gcmFkaWFucyAqIF9NYXRoLnJhZFRvRGVnRmFjdG9yO1xuICAgIH1cbn07XG5cbi8qKlxuKiBUaGUgZmFjdG9yIHVzZWQgdG8gY29udmVydCBkZWdyZWVzIHRvIHJhZGlhbnMuXG4qXG4qIEBuYW1lIE9jdWxvLk1hdGgjZGVnVG9SYWRGYWN0b3JcbiogQHByb3BlcnR5IHtudW1iZXJ9XG4qIEBzdGF0aWNcbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoX01hdGgsICdkZWdUb1JhZEZhY3RvcicsIHtcbiAgICB2YWx1ZTogTWF0aC5QSSAvIDE4MFxufSk7XG5cbi8qKlxuKiBUaGUgZmFjdG9yIHVzZWQgdG8gY29udmVydCByYWRpYW5zIHRvIGRlZ3JlZXMuXG4qXG4qIEBuYW1lIE9jdWxvLk1hdGgjcmFkVG9EZWdGYWN0b3JcbiogQHByb3BlcnR5IHtudW1iZXJ9XG4qIEBzdGF0aWNcbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoX01hdGgsICdyYWRUb0RlZ0ZhY3RvcicsIHtcbiAgICB2YWx1ZTogMTgwIC8gTWF0aC5QSVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IF9NYXRoOyIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGlzQXJyYXlMaWtlIGZyb20gJ2xvZGFzaC9pc0FycmF5TGlrZSc7XG5cbi8qKlxuKiBDcmVhdGUgMngyIG1hdHJpeCBmcm9tIGEgc2VyaWVzIG9mIHZhbHVlcy5cbiogXG4qIFJlcHJlc2VudGVkIGxpa2U6XG4qIFxuKiB8IGUxMSB8IGUxMiB8XG4qIHwgZTIxIHwgZTIyIHxcbipcbiogQGNsYXNzIE9jdWxvLk1hdHJpeDJcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7bnVtYmVyfSBlMTE9MSAtIFRoZSB2YWx1ZSBvZiByb3cgMSwgY29sdW1uIDFcbiogQHBhcmFtIHtudW1iZXJ9IGUxMj0wIC0gVGhlIHZhbHVlIG9mIHJvdyAxLCBjb2x1bW4gMlxuKiBAcGFyYW0ge251bWJlcn0gZTIxPTAgLSBUaGUgdmFsdWUgb2Ygcm93IDIsIGNvbHVtbiAxXG4qIEBwYXJhbSB7bnVtYmVyfSBlMjI9MSAtIFRoZSB2YWx1ZSBvZiByb3cgMiwgY29sdW1uIDJcbiovXG5jbGFzcyBNYXRyaXgyIHtcbiAgICBjb25zdHJ1Y3RvciAoZTExLCBlMTIsIGUyMSwgZTIyKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlMTFcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmUxMSA9IDE7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gZTEyXG4gICAgICAgICogQGRlZmF1bHRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lMTIgPSAwO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGUyMVxuICAgICAgICAqIEBkZWZhdWx0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZTIxID0gMDtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlMjJcbiAgICAgICAgKiBAZGVmYXVsdFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmUyMiA9IDE7XG4gICAgICAgIFxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgdGhpcy5zZXQoZTExLCBlMTIsIGUyMSwgZTIyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0FycmF5TGlrZShlMTEpICYmIGUxMS5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RnJvbUFycmF5KGUxMSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDbG9uZXMgdGhlIG1hdHJpeC5cbiAgICAqIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeCB0byBjbG9uZS5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IGlkZW50aWNhbCBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgY2xvbmUgKG0pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgyKE1hdHJpeDIudG9BcnJheShtKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ2xvbmVzIHRoZSBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBpZGVudGljYWwgbWF0cml4LlxuICAgICovXG4gICAgY2xvbmUgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5jbG9uZSh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBDb3BpZXMgdGhlIHZhbHVlcyBmcm9tIHRoZSBwcm92aWRlZCBtYXRyaXggaW50byB0aGlzIG1hdHJpeC5cbiAgICAqIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeCB0byBjb3B5LlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgY29weSAobSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXQobS5lMTEsIG0uZTEyLCBtLmUyMSwgbS5lMjIpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGRldGVybWluYW50LlxuICAgICoge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4IHRvIGdldCB0aGUgZGV0ZXJtaW5hbnQuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBkZXRlcm1pbmFudC5cbiAgICAqL1xuICAgIHN0YXRpYyBnZXREZXRlcm1pbmFudCAobSkge1xuICAgICAgICByZXR1cm4gbS5lMTEgKiBtLmUyMiAtIG0uZTEyICogbS5lMjE7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgZGV0ZXJtaW5hbnQuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBkZXRlcm1pbmFudC5cbiAgICAqL1xuICAgIGdldERldGVybWluYW50ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0RGV0ZXJtaW5hbnQodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyB0aGUgaW52ZXJzZS5cbiAgICAqIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeCB0byBnZXQgdGhlIGludmVyc2UuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBUaGUgaW52ZXJzZSBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgZ2V0SW52ZXJzZSAobSkge1xuICAgICAgICByZXR1cm4gTWF0cml4Mi5tdWx0aXBseVNjYWxhcihuZXcgTWF0cml4MihtLmUyMiwgLW0uZTEyLCAtbS5lMjEsIG0uZTExKSwgMSAvIE1hdHJpeDIuZ2V0RGV0ZXJtaW5hbnQobSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEdldHMgdGhlIGludmVyc2UuXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBUaGUgaW52ZXJzZSBtYXRyaXguXG4gICAgKi9cbiAgICBnZXRJbnZlcnNlICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0SW52ZXJzZSh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBNdWx0aXBsaWVzIHR3byBtYXRyaWNlcy5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gYSAtIEEgbWF0cml4LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBiIC0gQW5vdGhlciBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtNYXRyaXgyfSBBIG5ldyBtYXRyaXggdGhhdCBpcyB0aGUgcHJvZHVjdCBvZiB0aGUgcHJvdmlkZWQgbWF0cmljZXMuXG4gICAgKi8vKipcbiAgICAqIE11bHRpcGxpZXMgYSBsaXN0IG9mIG1hdHJpY2VzLlxuICAgICogQHBhcmFtIHtBcnJheX0gbSAtIEEgbGlzdCBvZiBtYXRyaWNlcy5cbiAgICAqIEByZXR1cm4ge01hdHJpeDJ9IEEgbmV3IG1hdHJpeCB0aGF0IGlzIHRoZSBwcm9kdWN0IG9mIHRoZSBwcm92aWRlZCBtYXRyaWNlcy5cbiAgICAqL1xuICAgIHN0YXRpYyBtdWx0aXBseU1hdHJpY2VzIChhLCBiKSB7XG4gICAgICAgIGlmIChhLmNvbHMgPT09IGIucm93cykge1xuICAgICAgICAgICAgbGV0IG4xMSwgbjEyLCBuMjEsIG4yMjtcbiAgICAgICAgIFxuICAgICAgICAgICAgbjExID0gYS5lMTEgKiBiLmUxMSArIGEuZTEyICogYi5lMjE7XG4gICAgICAgICAgICBuMTIgPSBhLmUxMSAqIGIuZTEyICsgYS5lMTIgKiBiLmUyMjtcbiAgICAgICAgICAgIG4yMSA9IGEuZTIxICogYi5lMTEgKyBhLmUyMiAqIGIuZTIxO1xuICAgICAgICAgICAgbjIyID0gYS5lMjEgKiBiLmUxMiArIGEuZTIyICogYi5lMjI7XG4gICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgyKG4xMSwgbjEyLCBuMjEsIG4yMik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBtdWx0aXBseSBpbmNvbXBhdGlibGUgbWF0cmljZXMnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgdGhlIG1hdHJpeCBieSBhbm90aGVyIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7TWF0cml4MnxNYXRyaXgyRH0gbSAtIEEgbWF0cml4LlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgbXVsdGlwbHlNYXRyaWNlcyAobSkge1xuICAgICAgICBpZiAodGhpcy5jb2xzID09PSBtLnJvd3MpIHtcbiAgICAgICAgICAgIGxldCBuMTEsIG4xMiwgbjIxLCBuMjI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG4xMSA9IHRoaXMuZTExICogbS5lMTEgKyB0aGlzLmUxMiAqIG0uZTIxO1xuICAgICAgICAgICAgbjEyID0gdGhpcy5lMTEgKiBtLmUxMiArIHRoaXMuZTEyICogbS5lMjI7XG4gICAgICAgICAgICBuMjEgPSB0aGlzLmUyMSAqIG0uZTExICsgdGhpcy5lMjIgKiBtLmUyMTtcbiAgICAgICAgICAgIG4yMiA9IHRoaXMuZTIxICogbS5lMTIgKyB0aGlzLmUyMiAqIG0uZTIyO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnNldChuMTEsIG4xMiwgbjIxLCBuMjIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbXVsdGlwbHkgaW5jb21wYXRpYmxlIG1hdHJpY2VzJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgYSBtYXRyaXggYnkgYSBzY2FsYXIuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHMgLSBUaGUgc2NhbGFyLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgc2NhbGVkIG1hdHJpeC5cbiAgICAqL1xuICAgIHN0YXRpYyBtdWx0aXBseVNjYWxhciAobSwgcykge1xuICAgICAgICB2YXIgZTExID0gbS5lMTEgKiBzO1xuICAgICAgICB2YXIgZTEyID0gbS5lMTIgKiBzO1xuICAgICAgICB2YXIgZTIxID0gbS5lMjEgKiBzO1xuICAgICAgICB2YXIgZTIyID0gbS5lMjIgKiBzO1xuXG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4MihlMTEsIGUxMiwgZTIxLCBlMjIpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgdGhlIG1hdHJpeCBieSBhIHNjYWxhci5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzIC0gVGhlIHNjYWxhci5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIG11bHRpcGx5U2NhbGFyIChzKSB7XG4gICAgICAgIHRoaXMuZTExICo9IHM7XG4gICAgICAgIHRoaXMuZTEyICo9IHM7XG4gICAgICAgIHRoaXMuZTIxICo9IHM7XG4gICAgICAgIHRoaXMuZTIyICo9IHM7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQXBwbGllcyBhIHJvdGF0aW9uIHRvIGEgbWF0cml4LlxuICAgICogQHBhcmFtIHtNYXRyaXgyfSBtIC0gVGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIFRoZSBhbmdsZSBpbiByYWRpYW5zLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgcm90YXRlZCBtYXRyaXguXG4gICAgKi9cbiAgICBzdGF0aWMgcm90YXRlIChtLCBhbmdsZSkge1xuICAgICAgICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICB2YXIgc2luID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICB2YXIgcm90YXRpb25NYXRyaXggPSBuZXcgTWF0cml4Mihjb3MsIC1zaW4sIHNpbiwgY29zKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBNYXRyaXgyLm11bHRpcGx5TWF0cmljZXMobSwgcm90YXRpb25NYXRyaXgpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFJvdGF0ZXMgdGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIFRoZSBhbmdsZSBpbiByYWRpYW5zLlxuICAgICogQHJldHVybiB7dGhpc30gc2VsZlxuICAgICovXG4gICAgcm90YXRlIChhbmdsZSkge1xuICAgICAgICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICB2YXIgc2luID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICB2YXIgcm90YXRpb25NYXRyaXggPSBuZXcgTWF0cml4Mihjb3MsIC1zaW4sIHNpbiwgY29zKTtcbiAgICAgICAgdGhpcy5tdWx0aXBseU1hdHJpY2VzKHJvdGF0aW9uTWF0cml4KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFwcGxpZXMgYSBzY2FsZSB0cmFuc2Zvcm1hdGlvbiB0byBhIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXguXG4gICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSBhbW91bnQgdG8gc2NhbGUgb24gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIGFtb3VudCB0byBzY2FsZSBvbiB0aGUgWSBheGlzLlxuICAgICogQHJldHVybiB7TWF0cml4Mn0gQSBuZXcgc2NhbGVkIG1hdHJpeC5cbiAgICAqL1xuICAgIHN0YXRpYyBzY2FsZSAobSwgeCwgeSkge1xuICAgICAgICByZXR1cm4gTWF0cml4Mi5tdWx0aXBseU1hdHJpY2VzKG0sIG5ldyBNYXRyaXgyKHgsIDAsIDAsIHkpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTY2FsZXMgdGhlIG1hdHJpeC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIGFtb3VudCB0byBzY2FsZSBvbiB0aGUgWCBheGlzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgYW1vdW50IHRvIHNjYWxlIG9uIHRoZSBZIGF4aXMuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzY2FsZSAoeCwgeSkge1xuICAgICAgICB0aGlzLm11bHRpcGx5TWF0cmljZXMobmV3IE1hdHJpeDIoeCwgMCwgMCwgeSkpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBlMTFcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBlMTJcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBlMjFcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBlMjJcbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldCAoZTExLCBlMTIsIGUyMSwgZTIyKSB7XG4gICAgICAgIHRoaXMuZTExID0gZTExO1xuICAgICAgICB0aGlzLmUxMiA9IGUxMjtcbiAgICAgICAgdGhpcy5lMjEgPSBlMjE7XG4gICAgICAgIHRoaXMuZTIyID0gZTIyO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgbWF0cml4IGZyb20gYW4gYXJyYXkuXG4gICAgKiBAcGFyYW0ge0FycmF5fSBhIC0gVGhlIGFycmF5IG9mIG1hdHJpeCB2YWx1ZXMuXG4gICAgKiBAcmV0dXJuIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBzZXRGcm9tQXJyYXkgKGEpIHtcbiAgICAgICAgdGhpcy5zZXQoYVswXSwgYVsxXSwgYVsyXSwgYVszXSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgbWF0cml4IHRvIHRoZSBpZGVudGl0eS5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldFRvSWRlbnRpdHkgKCkge1xuICAgICAgICB0aGlzLnNldCgxLCAwLCAwLCAxKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSBtYXRyaXggaW50byBhIG5ldyBhcnJheS5cbiAgICAqIEBwYXJhbSB7TWF0cml4Mn0gbSAtIFRoZSBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCB2YWx1ZXMuXG4gICAgKi9cbiAgICBzdGF0aWMgdG9BcnJheSAobSkge1xuICAgICAgICB2YXIgYSA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgXG4gICAgICAgIGFbMF0gPSBtLmUxMTtcbiAgICAgICAgYVsxXSA9IG0uZTEyO1xuICAgICAgICBhWzJdID0gbS5lMjE7XG4gICAgICAgIGFbM10gPSBtLmUyMjtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSBtYXRyaXggaW50byBhIG5ldyBhcnJheS5cbiAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqL1xuICAgIHRvQXJyYXkgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci50b0FycmF5KHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgdGhlIHZhbHVlcyBmcm9tIHRoZSBtYXRyaXggaW50byBhIG5ldyBGbG9hdDMyQXJyYXkuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ9IG0gLSBUaGUgbWF0cml4LlxuICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqL1xuICAgIHN0YXRpYyB0b0Zsb2F0MzJBcnJheSAobSkge1xuICAgICAgICB2YXIgYSA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICAgIFxuICAgICAgICBhWzBdID0gbS5lMTE7XG4gICAgICAgIGFbMV0gPSBtLmUxMjtcbiAgICAgICAgYVsyXSA9IG0uZTIxO1xuICAgICAgICBhWzNdID0gbS5lMjI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgbWF0cml4IGludG8gYSBuZXcgRmxvYXQzMkFycmF5LlxuICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IHZhbHVlcy5cbiAgICAqL1xuICAgIHRvRmxvYXQzMkFycmF5ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9GbG9hdDMyQXJyYXkodGhpcyk7XG4gICAgfVxufVxuXG4vKipcbiogVGhlIG51bWJlciBvZiBjb2x1bW5zLlxuKiBAbmFtZSBNYXRyaXgyI2NvbHNcbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTWF0cml4Mi5wcm90b3R5cGUsICdjb2xzJywge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6IDJcbn0pO1xuXG4vKipcbiogVGhlIG51bWJlciBvZiByb3dzLlxuKiBAbmFtZSBNYXRyaXgyI3Jvd3NcbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTWF0cml4Mi5wcm90b3R5cGUsICdyb3dzJywge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6IDJcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBNYXRyaXgyOyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4qIENyZWF0ZXMgYSAyRCB2ZWN0b3IgZnJvbSBhIHNlcmllcyBvZiB2YWx1ZXMuXG4qIFxuKiBAY2xhc3MgT2N1bG8uVmVjdG9yMlxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtudW1iZXJ9IHg9MCAtIFRoZSB4IHZhbHVlLlxuKiBAcGFyYW0ge251bWJlcn0geT0wIC0gVGhlIHkgdmFsdWUuXG4qL1xuY2xhc3MgVmVjdG9yMiB7XG4gICAgY29uc3RydWN0b3IgKHgsIHkpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHggdmFsdWUuXG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnggPSAoeCAhPT0gdW5kZWZpbmVkKSA/IHggOiAwO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogVGhlIHkgdmFsdWUuXG4gICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnkgPSAoeSAhPT0gdW5kZWZpbmVkKSA/IHkgOiAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQWRkcyB0d28gdmVjdG9ycy5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYSAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gQW5vdGhlciB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgc3VtIG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICovXG4gICAgc3RhdGljIGFkZCAoYSwgYikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoYS54ICsgYi54LCBhLnkgKyBiLnkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFkZHMgYSB2ZWN0b3IgdG8gdGhlIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIGFkZCAodikge1xuICAgICAgICB0aGlzLnggKz0gdi54O1xuICAgICAgICB0aGlzLnkgKz0gdi55O1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsb25lcyB0aGUgdmVjdG9yLlxuICAgICoge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yIHRvIGNsb25lLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgaWRlbnRpY2FsIHZlY3Rvci5cbiAgICAqL1xuICAgIHN0YXRpYyBjbG9uZSAodikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIodi54LCB2LnkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIENsb25lcyB0aGUgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgaWRlbnRpY2FsIHZlY3Rvci5cbiAgICAqL1xuICAgIGNsb25lICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuY2xvbmUodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQ29waWVzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgcHJvdmlkZWQgdmVjdG9yIGludG8gdGhpcyB2ZWN0b3IuXG4gICAgKiB7VmVjdG9yMn0gdiAtIFRoZSB2ZWN0b3IgdG8gY29weS5cbiAgICAqIEByZXR1cm4ge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGNvcHkgKHYpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHYueCwgdi55KTtcbiAgICB9XG4gICAgICAgIFxuICAgIC8qKlxuICAgICogRGV0ZXJtaW5lcyBpZiB0aGUgcHJvdmlkZWQgdmVjdG9ycyBhcmUgZXF1YWwuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBUaGUgZmlyc3QgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gVGhlIHNlY29uZCB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSB2ZWN0b3JzIGFyZSBlcXVhbC5cbiAgICAqL1xuICAgIHN0YXRpYyBlcXVhbHMgKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEueCA9PT0gYi54ICYmIGEueSA9PT0gYi55O1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERldGVybWluZXMgaWYgdGhlIHZlY3RvciBlcXVhbHMgdGhlIHByb3ZpZGVkIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIFRoZSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSB2ZWN0b3IgZXF1YWxzIHRoZSBwcm92aWRlZCB2ZWN0b3IuXG4gICAgKi9cbiAgICBlcXVhbHMgKHYpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZXF1YWxzKHRoaXMsIHYpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogVGFrZXMgdGhlIG1heCBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYSAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSBiIC0gQW5vdGhlciB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgbWF4IG9mIHRoZSBwcm92aWRlZCB2ZWN0b3JzLlxuICAgICovXG4gICAgc3RhdGljIG1heCAoYSwgYikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoTWF0aC5tYXgoYS54LCBiLngpLCBNYXRoLm1heChhLnksIGIueSkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFNldHMgaXRzZWxmIHRvIHRoZSBtYXggb2YgaXRzZWxmIGFuZCB0aGUgcHJvdmlkZWQgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgbWF4ICh2KSB7XG4gICAgICAgIHRoaXMueCA9IE1hdGgubWF4KHRoaXMueCwgdi54KTtcbiAgICAgICAgdGhpcy55ID0gTWF0aC5tYXgodGhpcy55LCB2LnkpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFRha2VzIHRoZSBtaW4gb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEFub3RoZXIgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIG1pbiBvZiB0aGUgcHJvdmlkZWQgdmVjdG9ycy5cbiAgICAqL1xuICAgIHN0YXRpYyBtaW4gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKE1hdGgubWluKGEueCwgYi54KSwgTWF0aC5taW4oYS55LCBiLnkpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIGl0c2VsZiB0byB0aGUgbWluIG9mIGl0c2VsZiBhbmQgdGhlIHByb3ZpZGVkIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIG1pbiAodikge1xuICAgICAgICB0aGlzLnggPSBNYXRoLm1pbih0aGlzLngsIHYueCk7XG4gICAgICAgIHRoaXMueSA9IE1hdGgubWluKHRoaXMueSwgdi55KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIE11bHRpcGxpZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHMgLSBUaGUgc2NhbGFyLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgc2NhbGVkIHZlY3Rvci5cbiAgICAqL1xuICAgIHN0YXRpYyBtdWx0aXBseVNjYWxhciAodiwgcykge1xuICAgICAgICB2YXIgeCA9IHYueCAqIHM7XG4gICAgICAgIHZhciB5ID0gdi55ICogcztcblxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjIoeCwgeSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogTXVsdGlwbGllcyB0aGUgdmVjdG9yIGJ5IGEgc2NhbGFyLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHMgLSBUaGUgc2NhbGFyLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gVGhlIHZlY3Rvci5cbiAgICAqL1xuICAgIG11bHRpcGx5U2NhbGFyIChzKSB7XG4gICAgICAgIHRoaXMueCAqPSBzO1xuICAgICAgICB0aGlzLnkgKj0gcztcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2ZWN0b3IgdmFsdWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgeCB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIHkgdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgc2V0ICh4LCB5KSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTdWJ0cmFjdHMgdHdvIHZlY3RvcnMuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IGEgLSBBIHZlY3Rvci5cbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gYiAtIEFub3RoZXIgdmVjdG9yLlxuICAgICogQHJldHVybiB7VmVjdG9yMn0gQSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIGRpZmZlcmVuY2Ugb2YgdGhlIHByb3ZpZGVkIHZlY3RvcnMuXG4gICAgKi9cbiAgICBzdGF0aWMgc3VidHJhY3QgKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKGEueCAtIGIueCwgYS55IC0gYi55KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTdWJ0cmFjdHMgYSB2ZWN0b3IgZnJvbSB0aGUgdmVjdG9yLlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBUaGUgdmVjdG9yLlxuICAgICovXG4gICAgc3VidHJhY3QgKHYpIHtcbiAgICAgICAgdGhpcy54IC09IHYueDtcbiAgICAgICAgdGhpcy55IC09IHYueTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZXMgZnJvbSB0aGUgdmVjdG9yIGludG8gYSBuZXcgYXJyYXkuXG4gICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHYgLSBUaGUgdmVjdG9yLlxuICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgdmFsdWVzLlxuICAgICovXG4gICAgc3RhdGljIHRvQXJyYXkgKHYpIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgQXJyYXkoMik7XG4gICAgICAgIFxuICAgICAgICBhWzBdID0gdi54O1xuICAgICAgICBhWzFdID0gdi55O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogU2V0cyB0aGUgdmFsdWVzIGZyb20gdGhlIHZlY3RvciBpbnRvIGEgbmV3IGFycmF5LlxuICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgdmFsdWVzLlxuICAgICovXG4gICAgdG9BcnJheSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnRvQXJyYXkodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogVHJhbnNmb3JtcyBhIHZlY3RvciB1c2luZyB0aGUgcHJvdmlkZWQgbWF0cml4LlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdiAtIEEgdmVjdG9yLlxuICAgICogQHBhcmFtIHtNYXRyaXgyfE1hdHJpeDJEfSBtIC0gQSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgKiBAcmV0dXJuIHtWZWN0b3IyfSBBIG5ldyB0cmFuc2Zvcm1lZCB2ZWN0b3IuXG4gICAgKi9cbiAgICBzdGF0aWMgdHJhbnNmb3JtICh2LCBtKSB7XG4gICAgICAgIHZhciB4MSA9IHYueCAqIG0uZTExICsgdi55ICogbS5lMTIgKyAobS50eCA/IG0udHggOiAwKTtcbiAgICAgICAgdmFyIHkxID0gdi54ICogbS5lMjEgKyB2LnkgKiBtLmUyMiArIChtLnR5ID8gbS50eSA6IDApO1xuXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMih4MSwgeTEpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIFRyYW5zZm9ybXMgdGhlIHZlY3RvciB1c2luZyB0aGUgcHJvdmlkZWQgbWF0cml4LlxuICAgICogQHBhcmFtIHtWZWN0b3IyfSB2IC0gQSB2ZWN0b3IuXG4gICAgKiBAcGFyYW0ge01hdHJpeDJ8TWF0cml4MkR9IG0gLSBBIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAqIEByZXR1cm4ge1ZlY3RvcjJ9IFRoZSB0cmFuc2Zvcm1lZCB2ZWN0b3IuXG4gICAgKi9cbiAgICB0cmFuc2Zvcm0gKG0pIHtcbiAgICAgICAgdGhpcy54ID0gdGhpcy54ICogbS5lMTEgKyB0aGlzLnkgKiBtLmUxMiArIChtLnR4ID8gbS50eCA6IDApO1xuICAgICAgICB0aGlzLnkgPSB0aGlzLnggKiBtLmUyMSArIHRoaXMueSAqIG0uZTIyICsgKG0udHkgPyBtLnR5IDogMCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBWZWN0b3IyOyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4qIEdTQVAncyBUaW1lbGluZU1heC5cbiogQGV4dGVybmFsIFRpbWVsaW5lTWF4XG4qIEBzZWUgaHR0cDovL2dyZWVuc29jay5jb20vZG9jcy8jL0hUTUw1L0dTQVAvVGltZWxpbmVNYXgvXG4qL1xuXG4vKipcbiogR1NBUCdzIFR3ZWVuTWF4LlxuKiBAZXh0ZXJuYWwgVHdlZW5NYXhcbiogQHNlZSBodHRwOi8vZ3JlZW5zb2NrLmNvbS9kb2NzLyMvSFRNTDUvR1NBUC9Ud2Vlbk1heC9cbiovXG5cbi8qKlxuKiBHU0FQJ3MgRWFzaW5nLlxuKiBAZXh0ZXJuYWwgRWFzaW5nXG4qIEBzZWUgaHR0cDovL2dyZWVuc29jay5jb20vZG9jcy8jL0hUTUw1L0dTQVAvRWFzaW5nL1xuKi9cblxuaW1wb3J0IEFuaW1hdGlvbiAgICAgZnJvbSAnLi9hbmltYXRpb24nO1xuaW1wb3J0IENhbWVyYSAgICAgICAgZnJvbSAnLi9jYW1lcmEnO1xuaW1wb3J0IENTU1JlbmRlcmVyICAgZnJvbSAnLi9jc3NSZW5kZXJlcic7XG5pbXBvcnQgTWF0aCAgICAgICAgICBmcm9tICcuL21hdGgvbWF0aCc7XG5pbXBvcnQgTWF0cml4MiAgICAgICBmcm9tICcuL21hdGgvbWF0cml4Mic7XG5pbXBvcnQgU2NlbmUgICAgICAgICBmcm9tICcuL3NjZW5lJztcbmltcG9ydCBVdGlscyAgICAgICAgIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IFZlY3RvcjIgICAgICAgZnJvbSAnLi9tYXRoL3ZlY3RvcjInO1xuXG5cbi8qKlxuKiBAbmFtZXNwYWNlIE9jdWxvXG4qL1xuY29uc3QgT2N1bG8gPSB7XG4gICAgQW5pbWF0aW9uOiBBbmltYXRpb24sXG4gICAgQ2FtZXJhOiBDYW1lcmEsXG4gICAgQ1NTUmVuZGVyZXI6IENTU1JlbmRlcmVyLFxuICAgIE1hdGg6IE1hdGgsXG4gICAgTWF0cml4MjogTWF0cml4MixcbiAgICBTY2VuZTogU2NlbmUsXG4gICAgVXRpbHM6IFV0aWxzLFxuICAgIFZlY3RvcjI6IFZlY3RvcjJcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT2N1bG87IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBVdGlscyAgICAgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgVmVjdG9yMiAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuLyoqXG4qIENyZWF0ZXMgYSBzY2VuZS5cbiogXG4qIEBjbGFzcyBPY3Vsby5TY2VuZVxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtDYW1lcmF9IFtjYW1lcmE9bnVsbF0gLSBUaGUgY2FtZXJhIHRoYXQgb3ducyB0aGlzIFNjZW5lLlxuKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSBbdmlldz1udWxsXSAtIFRoZSB2aWV3IGZvciB0aGUgc2NlbmUuIEl0IGNhbiBiZSBhIHNlbGVjdG9yIG9yIGFuIGVsZW1lbnQuXG4qL1xuY2xhc3MgU2NlbmUge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEgPSBudWxsLCB2aWV3ID0gbnVsbCkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkNhbWVyYX0gLSBUaGUgY2FtZXJhLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdmlldy4gQW4gSFRNTCBlbGVtZW50LlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnZpZXcgPSBVdGlscy5ET00ucGFyc2VWaWV3KHZpZXcpO1xuICAgICAgICBcbiAgICAgICAgLy8gVmlldyBzZXR1cFxuICAgICAgICBpZiAodGhpcy52aWV3ICYmIHRoaXMudmlldy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnZpZXcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgU2NlbmUjd2lkdGhcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSB3aWR0aC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHdpZHRoICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlldyA/IHRoaXMudmlldy5vZmZzZXRXaWR0aCA6IDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBAbmFtZSBTY2VuZSNoZWlnaHRcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBoZWlnaHQuXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBoZWlnaHQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3ID8gdGhpcy52aWV3Lm9mZnNldEhlaWdodCA6IDA7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgU2NlbmUjc2NhbGVkV2lkdGhcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAtIFRoZSBzY2FsZWQgd2lkdGguXG4gICAgKiBAcmVhZG9ubHlcbiAgICAqL1xuICAgIGdldCBzY2FsZWRXaWR0aCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcgPyB0aGlzLndpZHRoICogdGhpcy5jYW1lcmEuem9vbSA6IHRoaXMud2lkdGg7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogQG5hbWUgU2NlbmUjc2NhbGVkSGVpZ2h0XG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gLSBUaGUgc2NhbGVkIGhlaWdodC5cbiAgICAqIEByZWFkb25seVxuICAgICovXG4gICAgZ2V0IHNjYWxlZEhlaWdodCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcgPyB0aGlzLmhlaWdodCAqIHRoaXMuY2FtZXJhLnpvb20gOiB0aGlzLmhlaWdodDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBEZXN0cm95cyB0aGUgc2NlbmUgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjZW5lOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgU2NlbmUgICAgZnJvbSAnLi9zY2VuZSc7XG5cbi8qKlxuKiBEZXNjcmlwdGlvbi5cbiogXG4qIEBjbGFzcyBPY3Vsby5TY2VuZU1hbmFnZXJcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7T2N1bG8uQ2FtZXJhfSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRoYXQgb3ducyB0aGlzIFNjZW5lTWFuYWdlci5cbiogQHBhcmFtIHtib29sZWFufSBbaGFzVmlldz10cnVlXSAtIElmIHRydWUsIGEgJ2RpdicgaXMgY3JlYXRlZCBhbmQgbWFuYWdlZCBpbnRlcm5hbGx5LiBQYXNzIGZhbHNlIHRvIGNyZWF0ZSBhIFNjZW5lTWFuYWdlciB3aXRob3V0IGEgdmlldy5cbiovXG5jbGFzcyBTY2VuZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yIChjYW1lcmEsIGhhc1ZpZXcgPSB0cnVlKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uQ2FtZXJhfSAtIFRoZSBjYW1lcmEgdGhhdCBvd25zIHRoaXMgU2NlbmVNYW5hZ2VyLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7T2N1bG8uU2NlbmV9IC0gVGhlIGFjdGl2ZSBzY2VuZS5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5hY3RpdmVTY2VuZSA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge0VsZW1lbnR9IC0gVGhlIHZpZXcuIEFuIEhUTUwgZWxlbWVudC5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy52aWV3ID0gKGhhc1ZpZXcgPT09IHRydWUpID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykgOiBudWxsO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IC0gQW4gb2JqZWN0IGZvciBzdG9yaW5nIHRoZSBtYW5hZ2VkIFNjZW5lIGluc3RhbmNlcy5cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zY2VuZXMgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIC8vIFZpZXcgc2V0dXBcbiAgICAgICAgaWYgKHRoaXMudmlldykge1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLndpbGxDaGFuZ2UgPSAndHJhbnNmb3JtJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEFkZHMgYSBzY2VuZS5cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIHRvIGdpdmUgdGhlIHNjZW5lLlxuICAgICogQHBhcmFtIHtPY3Vsby5TY2VuZX0gc2NlbmUgLSBUaGUgc2NlbmUuXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgYWRkIChuYW1lLCBzY2VuZSkge1xuICAgICAgICBpZiAodHlwZW9mIHNjZW5lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2NlbmUgPSBuZXcgU2NlbmUodGhpcy5jYW1lcmEsIHNjZW5lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjZW5lLmNhbWVyYSA9IHRoaXMuY2FtZXJhO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zY2VuZXNbbmFtZV0gPSBzY2VuZTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBTY2VuZU1hbmFnZXIgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fc2NlbmVzKSB7XG4gICAgICAgICAgICB0aGlzLl9zY2VuZXNba2V5XS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FtZXJhID0gbnVsbDtcbiAgICAgICAgdGhpcy5hY3RpdmVTY2VuZSA9IG51bGw7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NjZW5lcyA9IHt9O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogR2V0cyBhIHNjZW5lLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHNjZW5lLlxuICAgICogQHJldHVybnMge09jdWxvLlNjZW5lfSBUaGUgc2NlbmUuXG4gICAgKi9cbiAgICBnZXQgKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NjZW5lc1tuYW1lXTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXRzIHRoZSBhY3RpdmUgc2NlbmUuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIHNldEFjdGl2ZVNjZW5lIChuYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLnZpZXcgJiYgdGhpcy5hY3RpdmVTY2VuZSAmJiB0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmVDaGlsZCh0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFjdGl2ZVNjZW5lID0gdGhpcy5fc2NlbmVzW25hbWVdO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudmlldykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVTY2VuZS52aWV3LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2NlbmUudmlldy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLmFjdGl2ZVNjZW5lLnZpZXcpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLndpZHRoID0gdGhpcy5hY3RpdmVTY2VuZS53aWR0aCArICdweCc7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuaGVpZ2h0ID0gdGhpcy5hY3RpdmVTY2VuZS5oZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjZW5lTWFuYWdlcjsiLCIndXNlIHN0cmljdCc7XG4vKipcbiogQGF1dGhvciAgICAgICBBZGFtIEt1Y2hhcmlrIDxha3VjaGFyaWtAZ21haWwuY29tPlxuKiBAY29weXJpZ2h0ICAgIEFkYW0gS3VjaGFyaWtcbiogQGxpY2Vuc2UgICAgICB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FrdWNoYXJpay9iYWNrYm9uZS5jYW1lcmFWaWV3L2xpY2Vuc2UudHh0fE1JVCBMaWNlbnNlfVxuKi9cblxuaW1wb3J0IERyYWdDb250cm9sICBmcm9tICcuL2RyYWdDb250cm9sJztcbmltcG9ydCBXaGVlbENvbnRyb2wgZnJvbSAnLi93aGVlbENvbnRyb2wnO1xuXG4vKipcbiogRGVzY3JpcHRpb24uXG4qIFxuKiBAY2xhc3MgT2N1bG8uVHJhY2tDb250cm9sXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge09jdWxvLkNhbWVyYX0gY2FtZXJhIC0gVGhlIGNhbWVyYS5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZHJhZ2dhYmxlXSAtIFdoZXRoZXIgZHJhZ2dpbmcgaXMgaGFuZGxlZCBvciBub3QuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uRHJhZ10gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSBkcmFnIGV2ZW50IG9jY3Vycy5cbiogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy53aGVlbGFibGVdIC0gV2hldGhlciB3aGVlbGluZyBpcyBoYW5kbGVkIG9yIG5vdC5cbiogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMub25XaGVlbF0gLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBldmVyeSB0aW1lIHRoZSB3aGVlbCBldmVudCBvY2N1cnMuXG4qXG4qIEBleGFtcGxlXG4qIHZhciBteVRyYWNrQ29udHJvbCA9IG5ldyBPY3Vsby5UcmFja0NvbnRyb2wobXlDYW1lcmEsIHsgXG4qICAgZHJhZ2dhYmxlOiB0cnVlLCBcbiogICBvbkRyYWc6IGZ1bmN0aW9uICgpIHsgXG4qICAgICBjb25zb2xlLmxvZygnZHJhZ2dpbmcnKTsgXG4qICAgfSwgXG4qICAgd2hlZWxhYmxlOiB0cnVlLCBcbiogICBvbldoZWVsOiBmdW5jdGlvbiAoKSB7IFxuKiAgICAgY29uc29sZS5sb2coJ3doZWVsaW5nJyk7IFxuKiAgIH1cbiogfSk7XG4qL1xuY2xhc3MgVHJhY2tDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvciAoY2FtZXJhLCB7XG4gICAgICAgIGRyYWdnYWJsZSA9IGZhbHNlLFxuICAgICAgICBvbkRyYWcgPSB1bmRlZmluZWQsXG4gICAgICAgIHdoZWVsYWJsZSA9IGZhbHNlLFxuICAgICAgICBvbldoZWVsID0gdW5kZWZpbmVkXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAtIFRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICogQGRlZmF1bHQge307XG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY29uZmlnID0geyBkcmFnZ2FibGUsIG9uRHJhZywgd2hlZWxhYmxlLCBvbldoZWVsIH07XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge09jdWxvLkNhbWVyYX0gLSBUaGUgY2FtZXJhLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGhhbmRsZWQgb3Igbm90LlxuICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuaXNEcmFnZ2FibGUgPSAoZHJhZ2dhYmxlID09PSB0cnVlKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RHJhZ2dhYmxlfSAtIFRoZSBkcmFnIGNvbnRyb2wuXG4gICAgICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYWdDb250cm9sID0gIXRoaXMuaXNEcmFnZ2FibGUgPyBudWxsIDogbmV3IERyYWdDb250cm9sKHRoaXMuY2FtZXJhLnNjZW5lcy52aWV3LCB7XG4gICAgICAgICAgICBkcmFnUHJveHk6IHRoaXMuY2FtZXJhLnZpZXcsXG4gICAgICAgICAgICBvbkRyYWc6IG9uRHJhZyxcbiAgICAgICAgICAgIG9uRHJhZ1BhcmFtczogW3RoaXMuY2FtZXJhXSxcbiAgICAgICAgICAgIHpJbmRleEJvb3N0OiBmYWxzZVxuICAgICAgICB9KTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IC0gV2hldGhlciB3aGVlbGluZyBpcyBoYW5kbGVkIG9yIG5vdC5cbiAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzV2hlZWxhYmxlID0gKHdoZWVsYWJsZSA9PT0gdHJ1ZSkgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1doZWVsQ29udHJvbH0gLSBUaGUgd2hlZWwgY29udHJvbC5cbiAgICAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMud2hlZWxDb250cm9sID0gIXRoaXMuaXNXaGVlbGFibGUgPyBudWxsIDogbmV3IFdoZWVsQ29udHJvbCh0aGlzLmNhbWVyYS52aWV3LCB7XG4gICAgICAgICAgICBvbldoZWVsOiBvbldoZWVsLFxuICAgICAgICAgICAgb25XaGVlbFBhcmFtczogW3RoaXMuY2FtZXJhXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGRyYWdnaW5nIGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgZHJhZ0VuYWJsZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0RyYWdnYWJsZSA/IHRoaXMuZHJhZ0NvbnRyb2wuZW5hYmxlZCA6IGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHdoZWVsaW5nIGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKi9cbiAgICBnZXQgd2hlZWxFbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNXaGVlbGFibGUgPyB0aGlzLndoZWVsQ29udHJvbC5lbmFibGVkIDogZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGVzdHJveXMgdGhlIGNvbnRyb2wgYW5kIHByZXBhcmVzIGl0IGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBpZiAodGhpcy5pc0RyYWdnYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5kcmFnQ29udHJvbC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jb25maWcgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIGRyYWdnaW5nLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlRHJhZyAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sLmRpc2FibGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogRW5hYmxlcyBkcmFnZ2luZy5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7dGhpc30gc2VsZlxuICAgICovXG4gICAgZW5hYmxlRHJhZyAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdDb250cm9sLmVuYWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICogRGlzYWJsZXMgd2hlZWxpbmcuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGRpc2FibGVXaGVlbCAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzV2hlZWxhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLndoZWVsQ29udHJvbC5kaXNhYmxlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEVuYWJsZXMgd2hlZWxpbmcuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZVdoZWVsICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNXaGVlbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMud2hlZWxDb250cm9sLmVuYWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUcmFja0NvbnRyb2w7IiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qIEBhdXRob3IgICAgICAgQWRhbSBLdWNoYXJpayA8YWt1Y2hhcmlrQGdtYWlsLmNvbT5cbiogQGNvcHlyaWdodCAgICBBZGFtIEt1Y2hhcmlrXG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9ha3VjaGFyaWsvYmFja2JvbmUuY2FtZXJhVmlldy9saWNlbnNlLnR4dHxNSVQgTGljZW5zZX1cbiovXG5cbmltcG9ydCBpc0VsZW1lbnQgZnJvbSAnbG9kYXNoL2lzRWxlbWVudCc7XG5pbXBvcnQgaXNPYmplY3QgIGZyb20gJ2xvZGFzaC9pc09iamVjdCc7XG5pbXBvcnQgVmVjdG9yMiAgIGZyb20gJy4vbWF0aC92ZWN0b3IyJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQG5hbWVzcGFjZSBPY3Vsby5VdGlsc1xuKi9cbmNvbnN0IFV0aWxzID0ge1xuICAgIC8qKlxuICAgICogR2V0IHRoZSBDU1MgdHJhbnNmb3JtIHZhbHVlIGZvciBhbiBlbGVtZW50LlxuICAgICpcbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWwgLSBUaGUgZWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBDU1MgdHJhbnNmb3JtIHZhbHVlLlxuICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKi9cbiAgICBnZXRDc3NUcmFuc2Zvcm06IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBsZXQgdmFsdWUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZ2V0UHJvcGVydHlWYWx1ZSgndHJhbnNmb3JtJyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlICdtYXRyaXgoKScgYW5kIGFsbCB3aGl0ZXNwYWNlLiBUaGVuIHNlcGFyYXRlIGludG8gYW4gYXJyYXkuXG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXlxcdytcXCgvLCcnKS5yZXBsYWNlKC9cXCkkLywnJykucmVwbGFjZSgvXFxzKy9nLCAnJykuc3BsaXQoJywnKTtcblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFRoaXMgc3VwZXIgc2ltcGxpc3RpYyBhbmQgb25seSBoYW5kbGVzIDJEIG1hdHJpY2VzLlxuICAgIGdldFRyYW5zZm9ybU1hdHJpeDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBzdHlsZVZhbHVlID0gdXRpbHMuZ2V0Q3NzVHJhbnNmb3JtKGVsKTtcbiAgICAgICAgdmFyIG1hdHJpeCA9IFtdO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN0eWxlVmFsdWVbMF0gPT09ICdub25lJykge1xuICAgICAgICAgICAgbWF0cml4ID0gWzEsIDAsIDAsIDEsIDAsIDBdXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHlsZVZhbHVlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBtYXRyaXgucHVzaChwYXJzZUZsb2F0KGl0ZW0pKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbWF0cml4O1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBTZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUgZm9yIGFuIGVsZW1lbnQuXG4gICAgKlxuICAgICogQHBhcmFtIHtFbGVtZW50fSBlbCAtIFRoZSBlbGVtZW50IGZvciB3aGljaCB0byBzZXQgdGhlIENTUyB0cmFuc2Zvcm0gdmFsdWUuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIEFuIG9iamVjdCBvZiBDU1MgdHJhbnNmb3JtIHZhbHVlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NjYWxlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byBib3RoIFggYW5kIFkgYXhlcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZVhdIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdzY2FsZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2FsZVldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdzY2FsZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFkgYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5za2V3WF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3NrZXcnIGZ1bmN0aW9uIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBYIGF4aXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2tld1ldIC0gQSB2YWxpZCBDU1MgdHJhbnNmb3JtICdza2V3JyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRyYW5zbGF0ZV0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3RyYW5zbGF0ZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gYm90aCBYIGFuZCBZIGF4ZXMuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudHJhbnNsYXRlWF0gLSBBIHZhbGlkIENTUyB0cmFuc2Zvcm0gJ3RyYW5zbGF0ZScgZnVuY3Rpb24gdmFsdWUgdG8gYXBwbHkgdG8gdGhlIFggYXhpcy5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50cmFuc2xhdGVZXSAtIEEgdmFsaWQgQ1NTIHRyYW5zZm9ybSAndHJhbnNsYXRlJyBmdW5jdGlvbiB2YWx1ZSB0byBhcHBseSB0byB0aGUgWSBheGlzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IFt0cmFja2VyXSAtIFRoZSBvYmplY3QgdGhhdCBpcyB0cmFja2luZyB0aGUgdHJhbnNpdGlvbi4gJ2lzVHJhbnNpdGlvbmluZycgb24gdGhlIG9iamVjdCB3aWxsIGJlIHNldCB0byAndHJ1ZScuXG4gICAgKiBAcmV0dXJucyB7RWxlbWVudH0gVGhlIGVsZW1lbnQuXG4gICAgKi9cblxuICAgIC8vIFRPRE86IFRoaXMgaXMgYSB2ZXJ5IHNpbXBsaXN0aWMgc29sdXRpb24uXG4gICAgLy8gSWRlYWxseSB3b3VsZCBoYW5kbGUgJ3JvdGF0ZScgb3B0aW9uLlxuICAgIC8vIElkZWFsbHkgd291bGQgaGFuZGxlIDNEIE1hdHJpeC5cbiAgICBzZXRDc3NUcmFuc2Zvcm06IGZ1bmN0aW9uIChlbCwgb3B0aW9ucywgdHJhY2tlcikge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgXG4gICAgICAgIGxldCB2YWx1ZSA9IHV0aWxzLmdldENzc1RyYW5zZm9ybShlbCk7XG4gICAgICAgIGNvbnN0IENTU19UUkFOU0ZPUk1fS0VZV09SRFMgPSBbJ2luaGVyaXQnLCAnaW5pdGlhbCcsICdub25lJywgJ3Vuc2V0J107XG4gICAgICAgIGNvbnN0IERFRkFVTFRfTUFUUklYXzJEID0gWzEsIDAsIDAsIDEsIDAsIDBdO1xuICAgICAgICBjb25zdCBNQVRSSVhfMkQgPSB7XG4gICAgICAgICAgICBzY2FsZVg6IDAsXG4gICAgICAgICAgICBzY2FsZVk6IDMsXG4gICAgICAgICAgICBza2V3WTogMSxcbiAgICAgICAgICAgIHNrZXdYOiAyLFxuICAgICAgICAgICAgdHJhbnNsYXRlWDogNCxcbiAgICAgICAgICAgIHRyYW5zbGF0ZVk6IDVcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAob3B0aW9ucy5zY2FsZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5zY2FsZVggPSBvcHRpb25zLnNjYWxlWSA9IG9wdGlvbnMuc2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy50cmFuc2xhdGUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMudHJhbnNsYXRlWCA9IG9wdGlvbnMudHJhbnNsYXRlWSA9IG9wdGlvbnMudHJhbnNsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHRyYW5zZm9ybSB2YWx1ZSBpcyBhIGtleXdvcmQsIHVzZSBhIGRlZmF1bHQgbWF0cml4LlxuICAgICAgICBpZiAoQ1NTX1RSQU5TRk9STV9LRVlXT1JEUy5pbmRleE9mKHZhbHVlWzBdKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBERUZBVUxUX01BVFJJWF8yRDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIE1BVFJJWF8yRCkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNba2V5XSkge1xuICAgICAgICAgICAgICAgIGlmIChfLmlzRmluaXRlKG9wdGlvbnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVbTUFUUklYXzJEW2tleV1dID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGFuIGludmFsaWQgQ1NTIG1hdHJpeCB2YWx1ZScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBlbC5zdHlsZS50cmFuc2Zvcm0gPSAnbWF0cml4KCcgKyB2YWx1ZS5qb2luKCcsICcpICsgJyknO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRyYWNrZXIpIHtcbiAgICAgICAgICAgIHRyYWNrZXIuaXNUcmFuc2l0aW9uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gSWYgdHJhbnNpdGlvbiBkdXJhdGlvbiBpcyAwLCAndHJhbnNpdGlvbmVuZCcgZXZlbnQgd2hpY2ggaGFuZGxlcyAnaXNUcmFuc2l0aW9uaW5nJyB3aWxsIG5vdCBmaXJlLlxuICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoJ3RyYW5zaXRpb24tZHVyYXRpb24nKSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0cmFja2VyLmlzVHJhbnNpdGlvbmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAqIFNldCB0aGUgQ1NTIHRyYW5zaXRpb24gcHJvcGVydGllcyBmb3IgYW4gZWxlbWVudC5cbiAgICAqXG4gICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsIC0gVGhlIGVsZW1lbnQgZm9yIHdoaWNoIHRvIHNldCB0aGUgQ1NTIHRyYW5zaXRpb24gcHJvcGVydGllcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIC0gQSBjYW1lcmEge0BsaW5rIENhbWVyYU1vZGVsLmRlZmF1bHRzLnRyYW5zaXRpb258dHJhbnNpdGlvbn0gb2JqZWN0LlxuICAgICogQHJldHVybnMge0VsZW1lbnR9IFRoZSBlbGVtZW50LlxuICAgICovXG4gICAgc2V0Q3NzVHJhbnNpdGlvbjogZnVuY3Rpb24gKGVsLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzIHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgbGV0IGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzID0ge1xuICAgICAgICAgICAgdHJhbnNpdGlvbkRlbGF5OiBwcm9wZXJ0aWVzLmRlbGF5IHx8ICcwcycsXG4gICAgICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IHByb3BlcnRpZXMuZHVyYXRpb24gfHwgJzBzJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogcHJvcGVydGllcy5wcm9wZXJ0eSB8fCAnYWxsJyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogcHJvcGVydGllcy50aW1pbmdGdW5jdGlvbiB8fCAnZWFzZSdcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjc3NUcmFuc2l0aW9uUHJvcGVydGllcykge1xuICAgICAgICAgICAgZWwuc3R5bGVba2V5XSA9IGNzc1RyYW5zaXRpb25Qcm9wZXJ0aWVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogVGhyb3R0bGluZyB1c2luZyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuXG4gICAgKlxuICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gdGhyb3R0bGVkIHRvIHRoZSBuZXh0IEFuaW1hdGlvbiBGcmFtZS5cbiAgICAqL1xuICAgIHRocm90dGxlVG9GcmFtZTogZnVuY3Rpb24gKGZ1bmMpIHtcbiAgICAgICAgbGV0IF90aGlzLCBhcmdzO1xuICAgICAgICBsZXQgaXNQcm9jZXNzaW5nID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgICAgICAgIGlmICghaXNQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24odGltZXN0YW1wKSB7XG4gICAgICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoYXJncywgdGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pOyAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICogUGFyc2UgdGhlIHBvc2l0aW9uIG9mIHRoZSBnaXZlbiBpbnB1dCB3aXRoaW4gdGhlIHdvcmxkLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fE9iamVjdH0gW2lucHV0XSAtIFRoZSBpbnB1dCB0byBwYXJzZS5cbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gd29ybGQgLSBUaGUgd29ybGQuXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgcGFyc2VkIHBvc2l0aW9uIGFzIGFuIHgveSBwb3NpdGlvbiBvYmplY3QuXG4gICAgKi9cbiAgICBwYXJzZVBvc2l0aW9uOiBmdW5jdGlvbiAoaW5wdXQsIHdvcmxkKSB7XG4gICAgICAgIHZhciBvYmplY3RQb3NpdGlvbjtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaXNFbGVtZW50KGlucHV0KSkge1xuICAgICAgICAgICAgb2JqZWN0UG9zaXRpb24gPSBVdGlscy5ET00uZ2V0T2JqZWN0V29ybGRQb3NpdGlvbihpbnB1dCwgd29ybGQpO1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgVmVjdG9yMihvYmplY3RQb3NpdGlvbi54LCBvYmplY3RQb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc09iamVjdChpbnB1dCkpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gbmV3IFZlY3RvcjIoaW5wdXQueCwgaW5wdXQueSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG59O1xuXG5VdGlscy5ET00gPSB7XG4gICAgLyoqXG4gICAgKiBHZXQgYW4gb2JqZWN0J3MgcG9zaXRpb24gaW4gdGhlIHdvcmxkLlxuICAgICpcbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gb2JqZWN0IC0gVGhlIG9iamVjdC5cbiAgICAqIEBwYXJhbSB7RWxlbWVudH0gd29ybGQgLSBUaGUgd29ybGQuXG4gICAgKiBAcmV0dXJucyB7VmVjdG9yMn0gVGhlIG9iamVjdCdzIHBvc2l0aW9uLlxuICAgICovXG4gICAgZ2V0T2JqZWN0V29ybGRQb3NpdGlvbjogZnVuY3Rpb24gKG9iamVjdCwgd29ybGQpIHtcbiAgICAgICAgdmFyIHggPSAob2JqZWN0Lm9mZnNldFdpZHRoIC8gMikgKyBvYmplY3Qub2Zmc2V0TGVmdCAtIHdvcmxkLm9mZnNldExlZnQ7XG4gICAgICAgIHZhciB5ID0gKG9iamVjdC5vZmZzZXRIZWlnaHQgLyAyKSArIG9iamVjdC5vZmZzZXRUb3AgLSB3b3JsZC5vZmZzZXRUb3A7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHgsIHkpO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgKiBQYXJzZSBhIHZpZXcgcGFyYW1ldGVyLlxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IGlucHV0IC0gVGhlIHZpZXcgcGFyYW1ldGVyLlxuICAgICogQHJldHVybnMge0VsZW1lbnR9IFRoZSB2aWV3LlxuICAgICovXG4gICAgcGFyc2VWaWV3OiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgdmFyIG91dHB1dCA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgb3V0cHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNFbGVtZW50KGlucHV0KSkge1xuICAgICAgICAgICAgb3V0cHV0ID0gaW5wdXQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxufTtcblxuVXRpbHMuVGltZSA9IHtcbiAgICAvKipcbiAgICAqIEdldHMgYSB0aW1lIGR1cmF0aW9uIGdpdmVuIEZQUyBhbmQgdGhlIGRlc2lyZWQgdW5pdC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBmcHMgLSBUaGUgZnJhbWVzIHBlciBzZWNvbmQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gdW5pdCAtIFRoZSB1bml0IG9mIHRpbWUuXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gVGhlIGR1cmF0aW9uLlxuICAgICovXG4gICAgZ2V0RlBTRHVyYXRpb246IChmcHMsIHVuaXQpID0+IHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodW5pdCkge1xuICAgICAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPSAoMTAwMCAvIGZwcykgLyAxMDAwO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbXMnOlxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gMTAwMCAvIGZwcztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGR1cmF0aW9uO1xuICAgIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFV0aWxzOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiBAYXV0aG9yICAgICAgIEFkYW0gS3VjaGFyaWsgPGFrdWNoYXJpa0BnbWFpbC5jb20+XG4qIEBjb3B5cmlnaHQgICAgQWRhbSBLdWNoYXJpa1xuKiBAbGljZW5zZSAgICAgIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYWt1Y2hhcmlrL2JhY2tib25lLmNhbWVyYVZpZXcvbGljZW5zZS50eHR8TUlUIExpY2Vuc2V9XG4qL1xuXG5pbXBvcnQgdGhyb3R0bGUgZnJvbSAnbG9kYXNoL3Rocm90dGxlJztcbmltcG9ydCBVdGlscyAgICBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4qIERlc2NyaXB0aW9uLlxuKiBcbiogQGNsYXNzIE9jdWxvLldoZWVsQ29udHJvbFxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gdGFyZ2V0IC0gVGhlIHRhcmdldC5cbiogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIEFuIG9iamVjdCBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4qIEBwYXJhbSB7ZnVuY3Rpb259IFtvcHRpb25zLm9uV2hlZWxdIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZXZlcnkgdGltZSB0aGUgd2hlZWwgZXZlbnQgb2NjdXJzLlxuKiBAcGFyYW0ge2FycmF5fSBbb3B0aW9ucy5vbldoZWVsUGFyYW1zXSAtIFRoZSBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIGNhbGxiYWNrLlxuKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMub25XaGVlbFNjb3BlXSAtIFdoYXQgJ3RoaXMnIHJlZmVycyB0byBpbnNpZGUgdGhlIGNhbGxiYWNrLlxuKlxuKiBAZXhhbXBsZVxuKiB2YXIgbXlXaGVlbENvbnRyb2wgPSBuZXcgT2N1bG8uV2hlZWxDb250cm9sKCcjY2FtZXJhJywgeyAgXG4qICAgb25XaGVlbDogZnVuY3Rpb24gKCkgeyBcbiogICAgIGNvbnNvbGUubG9nKCd3aGVlbGluZycpOyBcbiogICB9XG4qIH0pO1xuKi9cbmNsYXNzIFdoZWVsQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IgKHRhcmdldCwge1xuICAgICAgICBvbldoZWVsID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG9uV2hlZWxQYXJhbXMgPSBbXSxcbiAgICAgICAgb25XaGVlbFNjb3BlID0gdGhpc1xuICAgIH0gPSB7fSkge1xuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge29iamVjdH0gLSBUaGUgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSB7IG9uV2hlZWwsIG9uV2hlZWxQYXJhbXMsIG9uV2hlZWxTY29wZSB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7RWxlbWVudH0gLSBUaGUgdGFyZ2V0LlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRhcmdldCA9IFV0aWxzLkRPTS5wYXJzZVZpZXcodGFyZ2V0KTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAqIEBwcm9wZXJ0eSB7V2hlZWxFdmVudH0gLSBUaGUgbGFzdCB3aGVlbCBldmVudCB0aGF0IGFmZmVjdGVkIHRoZSBpbnN0YW5jZS5cbiAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy53aGVlbEV2ZW50ID0ge307XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBAcHJvcGVydHkge1doZWVsRXZlbnR9IC0gVGhlIHByZXZpb3VzIHdoZWVsIGV2ZW50IHRoYXQgYWZmZWN0ZWQgdGhlIGluc3RhbmNlLlxuICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnByZXZpb3VzV2hlZWxFdmVudCA9IHt9O1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSAtIFdoZXRoZXIgaXQgaXMgZW5hYmxlZCBvciBub3QuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGUgdGhyb3R0bGVkIHdoZWVsIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICogQHByaXZhdGVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fdGhyb3R0bGVkT25XaGVlbCA9IHRocm90dGxlKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1doZWVsRXZlbnQgPSB0aGlzLndoZWVsRXZlbnQ7XG4gICAgICAgICAgICB0aGlzLndoZWVsRXZlbnQgPSBldmVudDtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLm9uV2hlZWwuYXBwbHkodGhpcy5jb25maWcub25XaGVlbFNjb3BlLCB0aGlzLmNvbmZpZy5vbldoZWVsUGFyYW1zKTtcbiAgICAgICAgfSwgVXRpbHMuVGltZS5nZXRGUFNEdXJhdGlvbigzMCwgJ21zJykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFRoZSB3aGVlbCBldmVudCBoYW5kbGVyLlxuICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuX29uV2hlZWwgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuX3Rocm90dGxlZE9uV2hlZWwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmFibGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gLSBXaGV0aGVyIGl0IGlzIGVuYWJsZWQgb3Igbm90LlxuICAgICogQHJlYWRvbmx5XG4gICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgKi9cbiAgICBnZXQgZW5hYmxlZCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmFibGVkO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERlc3Ryb3lzIHRoZSBjb250cm9sIGFuZCBwcmVwYXJlcyBpdCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0ge307XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIERpc2FibGVzIHRoZSBjb250cm9sLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHt0aGlzfSBzZWxmXG4gICAgKi9cbiAgICBkaXNhYmxlICgpIHtcbiAgICAgICAgdGhpcy50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLl9vbldoZWVsKTtcbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAqIEVuYWJsZXMgdGhlIGNvbnRyb2wuXG4gICAgKlxuICAgICogQHJldHVybnMge3RoaXN9IHNlbGZcbiAgICAqL1xuICAgIGVuYWJsZSAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5fb25XaGVlbCk7XG4gICAgICAgIHRoaXMuX2VuYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgV2hlZWxDb250cm9sOyJdfQ==

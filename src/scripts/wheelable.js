'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import throttle from 'lodash/throttle';
import Utils    from './utils';

/**
* @class Oculo.WheelControl
* @constructor
* @memberof Oculo
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
class WheelControl {
    constructor (target, options) {
        /**
        * @property {object} - The configuration.
        * @readonly
        */
        this.config = Object.assign({
            onWheel: function () {},
            onWheelParams: [],
            onWheelScope: null
        }, options);
        
        /**
        * @property {Element} - The target.
        * @readonly
        */
        this.target = Utils.DOM.parseView(target);
        
        /**
        * @property {WheelEvent} - The last wheel event that affected the instance.
        * @readonly
        */
        this.wheelEvent = null;
        
        /**
        * @property {boolean} - Whether it is enabled or not.
        * @readonly
        * @default false
        */
        this._enabled = true;
        
        /**
        * The throttled wheel event handler.
        * @private
        */
        this._throttledOnWheel = throttle(function () {
            this.config.onWheel.apply(this.config.onWheelScope || this, this.config.onWheelParams);
        }, Utils.Time.getFPSDuration(30, 'ms'));

        /**
        * The wheel event handler.
        * @private
        */
        this._onWheel = (event) => {
            if (!this._enabled) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            this.wheelEvent = event;
            this._throttledOnWheel();   
        };
        
        this.enable();
    }

    /**
    * Destroys the control and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        this.disable();
        
        return this;
    }
    
    /**
    * Disables the control.
    *
    * @returns {this} self
    */
    disable () {
        this.target.removeEventListener('wheel', this._onWheel);
        this._enabled = false;

        return this;
    }
    
    /**
    * Enables the control.
    *
    * @returns {this} self
    */
    enable () {
        this.target.addEventListener('wheel', this._onWheel);
        this._enabled = true;

        return this;
    }
    
    /**
    * Whether it is enabled or not.
    *
    * @returns {boolean}
    */
    get enabled () {
        return this._enabled;
    }
}

/**
* The configuration property names.
* @static
* @property {Array}
*/
WheelControl.CONFIG_PROP_NAMES = ['onWheel', 'onWheelParams', 'onWheelScope'];

export default WheelControl;
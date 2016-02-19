'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Factory: Creates a CameraView's model.
* Requires {@link http://backbonejs.org|Backbone}, {@link http://lodash.com|lodash}, and {@link http://jquery.com|jQuery} or {@link http://zeptojs.com|Zepto}.
*
* @constructs CameraModel
* @extends Backbone.Model
* @param {Object} [options] - An object of options. See {@link http://backbonejs.org/#Model|Backbone.Model}.
* @param {Object} [options.defaultState] - The default {@link CameraModel.defaultState|state}.
* @param {Object} [options.defaultTransition] - The default {@link CameraModel.defaultTransition|transition}.
* @param {number|string|Element} [options.height] - The camera's {@link CameraModel.height|height}.
* @param {number} [options.increment] - The base {@link CameraModel.increment|scale increment}.
* @param {number} [options.maxScale] - The {@link CameraModel.maxScale|maximum scale}.
* @param {number} [options.minScale] - The {@link CameraModel.minScale|minimum scale}.
* @param {Object} [options.state] - The starting {@link CameraModel.defaultState|state}.
* @param {Object} [options.transition] - The starting {@link CameraModel.defaultTransition|transition}.
* @param {number|string|Element} [options.width] - The camera's {@link CameraModel.width|width}.
* @returns {CameraModel} A new CameraModel object.
*/
var CameraModel = function (options) {
    /**
    * @lends CameraModel.prototype
    */
    let prototype = {
        defaults: {
            /**
            * The camera's default state.
            * @property {Object} - An object of state properties.
            * @memberOf CameraModel
            * @namespace CameraModel.defaultState
            */
            defaultState: {
                /**
                * The default scale.
                * @property {number} - A scale ratio where 1 = 100%.
                * @memberOf CameraModel.defaultState
                * @default
                */
                scale: 1,
                /**
                * The default scale origin.
                * @property {Object|Element} - An 'x' {number}, 'y' {number} pixel coordinate object or an Element.
                * @memberOf CameraModel.defaultState
                * @default null
                */
                scaleOrigin: null,
                /**
                * The default focus.
                * @property {Object|Element} - An 'x' {number}, 'y' {number} pixel coordinate object or an Element.
                * @memberOf CameraModel.defaultState
                * @default null
                */
                focus: null
            },
            /**
            * The default transition.
            * @property {Object} - An object of transition properties.
            * @memberOf CameraModel
            * @namespace CameraModel.defaultTransition
            */
            defaultTransition: {
                /**
                * The default transition delay.
                * @property {string} - A valid CSS transition-delay value.
                * @memberOf CameraModel.defaultTransition
                * @default
                */
                delay: '0s',
                /**
                * The default transition duration.
                * @property {string} - A valid CSS transition-duration value.
                * @memberOf CameraModel.defaultTransition
                * @default
                */
                duration: '500ms',
                /**
                * The default transition property.
                * @private
                * @property {string} - A valid CSS transition-property value.
                * @memberOf CameraModel.defaultTransition
                * @default
                */
                property: 'transform',
                /**
                * The default transition timing function.
                * @property {string} - A valid CSS transition-timing-function value.
                * @memberOf CameraModel.defaultTransition
                * @default
                */
                timingFunction: 'ease-out'
            },
            /**
            * The camera's height.
            * @property {number|string|Element} - A number, a valid CSS height value, or an element. If an element is set, the camera's height will be sized to match the element.
            * @memberOf CameraModel
            * @default null
            */
            height: null,
            /**
            * The base increment at which the content will be scaled.
            * @property {number} - See {@link CameraModel.defaultState.scale|scale}.
            * @memberOf CameraModel
            * @default
            */
            increment: 0.01,
            /**
            * The maximum value the content can be scaled.
            * @property {number} - See {@link CameraModel.defaultState.scale|scale}.
            * @memberOf CameraModel
            * @default
            */
            maxScale: 6.0,
            /**
            * The minimum value the content can be scaled.
            * @property {number} - See {@link CameraModel.defaultState.scale|scale}.
            * @memberOf CameraModel
            * @default
            */
            minScale: 0.25,
            /**
            * The camera's current state.
            * @property {Object} - A {@link CameraModel.defaultState|state} object.
            * @memberOf CameraModel
            * @default See {@link CameraModel.defaultState|defaultState}.
            */
            state: null,
            /**
            * The camera's current transition.
            * @property {Object} - A {@link CameraModel.defaultTransition|transition} object.
            * @memberOf CameraModel
            * @default See {@link CameraModel.defaultTransition|defaultTransition}.
            */
            transition: null,
            /**
            * The camera's width.
            * @property {number|string|Element} - A number, a valid CSS width value, or an element. If an element is set, the camera's width will be sized to match the element.
            * @memberOf CameraModel
            * @default null
            */
            width: null
        },
        
        initialize: function () {
            // Needed to set up initial state based on defaults and model options
            this.setState();
        },
        
        /**
        * Sets the camera's state.
        *
        * @param {Object} [state] - A {@link CameraModel.defaultState|state} object.
        * @return {CameraModel} The model.
        */
        setState: function (state) {
            state = state || {};

            instance.set('state', Object.assign({}, 
                this.get('defaultState'), 
                this.get('state'), 
                _.pick(state, Object.keys(this.defaults.defaultState))
            ));
            
            return this;
        },
        
        /**
        * Sets the camera's transition.
        *
        * @param {Object} [transition] - A {@link CameraModel.defaultTransition|transition} object.
        * @return {CameraModel} The model.
        */
        setTransition: function (transition) {
            transition = transition || {};

            instance.set('transition', Object.assign({}, 
                this.get('defaultTransition'), 
                this.get('transition'),
                _.pick(transition, Object.keys(this.defaults.defaultTransition))
            ));
            
            return this;
        }
    };
    
    // Compose the object.
    let instance = Object.create(Object.assign(
        Backbone.Model.prototype, 
        prototype
    ));

    Backbone.Model.call(instance, options);

    return instance;
};
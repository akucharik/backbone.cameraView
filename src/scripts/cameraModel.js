'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Factory: Creates a CameraView's model.
* Requires {@link http://lodash.com|lodash} or {@link http://underscorejs.org|underscore} and {@link http://jquery.com|jQuery} or {@link http://zeptojs.com|Zepto}.
*
* @constructs CameraModel
* @extends Backbone.Model
* @param {Object} [options] - An object of options. See {@link http://backbonejs.org/#Model|Backbone.Model}.
* @param {number} [options.increment] - The base {@link CameraModel.defaults.increment|scale increment}.
* @param {number} [options.minScale] - The {@link CameraModel.defaults.minScale|minimum scale}.
* @param {number} [options.maxScale] - The {@link CameraModel.defaults.maxScale|maximum scale}.
* @param {Object} [options.transition] - The default transition. A {@link CameraModel.defaults.transition|transition} object.
* @param {Object} [options.state] - The starting state. A camera {@link CameraModel.defaults.state|state} object.

* @returns {CameraModel} A new CameraModel object.
*/
var CameraModel = function (options) {
    /**
    * @lends CameraModel.prototype
    */
    let prototype = {
        /**
        * The default camera properties.
        * @namespace CameraModel.defaults
        */
        defaults: {
            /**
            * The base increment at which the content will be scaled.
            * @property {number} - See {@link CameraModel.defaults.state.scale|scale}.
            * @memberOf CameraModel.defaults
            * @default
            */
            increment: 0.02,
            /**
            * The minimum value the content can be scaled.
            * @property {number} - See {@link CameraModel.defaults.state.scale|scale}.
            * @memberOf CameraModel.defaults
            * @default
            */
            minScale: 0.25,
            /**
            * The maximum value the content can be scaled.
            * @property {number} - See {@link CameraModel.defaults.state.scale|scale}.
            * @memberOf CameraModel.defaults
            * @default
            */
            maxScale: 6.0,
            /**
            * The default transition.
            * @property {Object} - An object of transition properties.
            * @memberOf CameraModel.defaults
            * @namespace CameraModel.defaults.transition
            */
            transition: {
                /**
                * The default transition delay.
                * @property {string} - A valid CSS transition-delay value.
                * @memberOf CameraModel.defaults.transition
                * @default
                */
                delay: '0s',
                /**
                * The default transition duration.
                * @property {string} - A valid CSS transition-duration value.
                * @memberOf CameraModel.defaults.transition
                * @default
                */
                duration: '500ms',
                /**
                * The default transition property.
                * @private
                * @property {string} - A valid CSS transition-property value.
                * @memberOf CameraModel.defaults.transition
                * @default
                */
                property: 'transform',
                /**
                * The default transition timing function.
                * @property {string} - A valid CSS transition-timing-function value.
                * @memberOf CameraModel.defaults.transition
                * @default
                */
                timingFunction: 'ease-out'
            },
            /**
            * The camera's current state.
            * @property {Object} - An object of camera state properties.
            * @memberOf CameraModel.defaults
            * @namespace CameraModel.defaults.state
            */
            state: {
                /**
                * The current scale.
                * @property {number} - A scale ratio where 1 = 100%;
                * @memberOf CameraModel.defaults.state
                * @default
                */
                scale: 1,
                /**
                * The current focus.
                * @property {Object|Element} - An 'x' {number}, 'y' {number} pixel coordinate object or an Element.
                * @memberOf CameraModel.defaults.state
                * @default
                */
                focus: {
                    x: 501,
                    y: 251
                },
                /**
                * The current transition.
                * @property {Object} - A camera {@link CameraModel.defaults.transition|transition} object.
                * @memberOf CameraModel.defaults.state
                * @default See {@link CameraModel.defaults.transition|transition}.
                */
                transition: {
                    delay: '0s',
                    duration: '500ms',
                    property: 'transform',
                    timingFunction: 'ease-out'
                }
            }
        },
        
        /**
        * Sets the camera's state.
        *
        * @param {Object} [state] - A camera {@link CameraModel.defaults.state|state} object.
        * @param {Object} [transition] - A camera {@link CameraModel.defaults.transition|transition} object.
        */
        setState: function (state, transition) {
            console.log('state set');
            instance.set({
                state: Object.assign({}, 
                    instance.get('state'), 
                    _.pick(state, ['scale', 'focus']),
                    { transition: _.pick(transition, ['delay', 'duration', 'timingFunction']) })
            });
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
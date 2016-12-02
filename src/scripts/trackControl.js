'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import pick         from 'lodash/pick';
import DragControl  from './dragControl';
import WheelControl from './wheelControl';

/**
* @class Oculo.TrackControl
* @constructor
* @memberof Oculo
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
class TrackControl {
    constructor (camera, options) {
        /**
        * @property {object} - The initial configuration.
        * @default {};
        */
        this.config = options || {};
        
        /**
        * @property {Oculo.Camera} - The camera.
        */
        this.camera = camera;
        
        /**
        * @property {boolean} - Whether dragging is handled or not.
        * @default false
        */
        this.isDraggable = this.config.draggable ? true : false;
        
        /**
        * @property {Draggable} - The drag control.
        * @default null
        */
        this.dragControl = !this.isDraggable ? null : new DragControl(this.camera.scenes.view, Object.assign({
            dragProxy: this.camera.view,
            onDragParams: [this.camera],
            zIndexBoost: false
        }, pick(this.config, DragControl.CONFIG_PROP_NAMES)));

        /**
        * @property {boolean} - Whether wheeling is handled or not.
        * @default false
        */
        this.isWheelable = this.config.wheelable ? true : false;
        
        /**
        * @property {WheelControl} - The wheel control.
        * @default null
        */
        this.wheelControl = !this.isWheelable ? null : new WheelControl(this.camera.view, Object.assign({
            onWheelParams: [this.camera]
        }, pick(this.config, WheelControl.CONFIG_PROP_NAMES)));
    }

    /**
    * @property {boolean} - Whether dragging is enabled or not.
    * @readonly
    */
    get dragEnabled () {
        return this.isDraggable ? this.dragControl.enabled : false;
    }
    
    /**
    * @property {boolean} - Whether wheeling is enabled or not.
    * @readonly
    */
    get wheelEnabled () {
        return this.isWheelable ? this.wheelControl.enabled : false;
    }
    
    /**
    * Destroys the control and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        if (this.isDraggable) {
            this.dragControl.destroy();
        }
        
        if (this.isWheelable) {
            this.wheelControl.destroy();
        }
        
        return this;
    }
    
    /**
    * Disables dragging.
    *
    * @returns {this} self
    */
    disableDrag () {
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
    enableDrag () {
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
    disableWheel () {
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
    enableWheel () {
        if (this.isWheelable) {
            this.wheelControl.enable();
        }

        return this;
    }
}

export default TrackControl;
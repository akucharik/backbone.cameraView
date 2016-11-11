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

import pick      from 'lodash/pick';
import Wheelable from './wheelable';

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
        
        this._wheelControlConfig = pick(this.config, ['onWheel']);
        
        /**
        * @property {Oculo.Camera} - The camera.
        */
        this.camera = camera;
        
        /**
        * @property {Element} - The view.
        */
        this.view = camera.view;
        
        /**
        * @property {boolean} - Whether dragging is handled or not.
        * @default false
        */
        this.isDraggable = this.config.draggable ? true : false;
        
        /**
        * @property {Draggable} - The drag control.
        * @default null
        */
        this.dragControl = !this.isDraggable ? null : new Draggable(this.camera.scene.view, {
            onDrag: function (trackControl) {
                trackControl.config.onDrag.call(this, trackControl.camera);
            },
            onDragParams: [this],
            zIndexBoost: false
        });
        
        /**
        * @property {boolean} - Whether it is dragging or not.
        * @default false
        */
        this.isDragging = false;

        /**
        * @property {boolean} - Whether it is pressed or not.
        * @default
        */
        this.isPressed = false;

        // Drag events and behaviors
        this.onDragstart = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            return false;
        };
        
        this.onDragRelease = (event) => {
            this.endDrag(event);
        };

        this.onDragLeave = (event) => {
            this.endDrag(event);
        };

        this.onDragMove = (event) => {
            if (this.isPressed && !this.isDragging) {
                this.dragControl.startDrag(event);
                this.isDragging = true;
            }
        };

        this.endDrag = (event) => {
            if (this.isDragging) {
                this.dragControl.endDrag(event);
                this.view.removeEventListener('mouseup', this.onDragRelease);
                this.view.removeEventListener('mouseleave', this.onDragLeave);
                this.view.removeEventListener('mousemove', this.onDragMove);
                this.view.removeEventListener('touchend', this.onDragRelease);
                this.view.removeEventListener('touchcancel', this.onDragRelease);
                this.view.removeEventListener('touchmove', this.onDragMove);
                this.isDragging = false;
            }
        };
        
        this.onPress = (event) => {
            this.view.addEventListener('mouseup', this.onDragRelease);
            this.view.addEventListener('mouseleave', this.onDragLeave);
            this.view.addEventListener('mousemove', this.onDragMove);
            this.view.addEventListener('touchend', this.onDragRelease);
            this.view.addEventListener('touchcancel', this.onDragRelease);
            this.view.addEventListener('touchmove', this.onDragMove);
            this.isPressed = true;
        };

        this.onRelease = (event) => {
            this.release();
        };

        this.onLeave = (event) => {
            this.release();
        };

        this.release = () => {
            this.isPressed = false;
        };
        
        if (this.isDraggable) {
            this.enableDrag();
        }

        /**
        * @property {boolean} - Whether wheeling is handled or not.
        * @default false
        */
        this.isWheelable = this.config.wheelable ? true : false;
        
        /**
        * @property {Wheelable} - The wheel control.
        * @default null
        */
        this.wheelControl = !this.isWheelable ? null : new Wheelable(this.view, Object.assign({
            onWheelScope: this.camera
        }, this._wheelControlConfig));
    }

    /**
    * Destroys the control and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        if (this.isDraggable) {
            this.disableDrag();
            this.dragControl.kill();
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
            this.view.removeEventListener('dragstart', this.onDragstart);
            this.view.removeEventListener('mousedown', this.onPress);
            this.view.removeEventListener('mouseup', this.onRelease);
            this.view.removeEventListener('mouseleave', this.onLeave);
            this.view.removeEventListener('touchstart', this.onPress);
            this.view.removeEventListener('touchend', this.onRelease);
            this.view.removeEventListener('touchcancel', this.onRelease);
            this.view.style.cursor = null;
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
            this.view.addEventListener('dragstart', this.onDragstart);
            this.view.addEventListener('mousedown', this.onPress);
            this.view.addEventListener('mouseup', this.onRelease);
            this.view.addEventListener('mouseleave', this.onLeave);
            this.view.addEventListener('touchstart', this.onPress);
            this.view.addEventListener('touchend', this.onRelease);
            this.view.addEventListener('touchcancel', this.onRelease);
            this.view.style.cursor = 'move';
        }

        return this;
    }
    
    /**
    * Whether dragging is enabled or not.
    * @property {boolean}
    * @default false
    */
    get dragEnabled () {
        return this.isDraggable ? this.dragControl.enabled() : false;
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
    
    /**
    * Whether wheeling is enabled or not.
    * @default false
    */
    get wheelEnabled () {
        return this.isWheelable ? this.wheelControl.enabled : false;
    }
}

export default TrackControl;
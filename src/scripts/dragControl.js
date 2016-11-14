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

import Utils from './utils';

/**
* @class Oculo.DragControl
* @requires {@link external:Draggable}
* @memberof Oculo
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
class DragControl {
    constructor (target, options) {
        /**
        * @property {object} - The configuration.
        */
        this.config = options = options || {};
        
        /**
        * @property {Draggable} - The object that handles the drag behavior.
        */
        this.control = new Draggable(target, Object.assign({
            callbackScope: this,
            zIndexBoost: false
        }, this.config));
        
        /**
        * @property {Element} - The element that controls/initiates the drag events.
        */
        this.dragProxy = this.config.dragProxy ? Utils.DOM.parseView(this.config.dragProxy) : this.target;
        
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
                this.control.startDrag(event);
                this.isDragging = true;
            }
        };

        this.endDrag = (event) => {
            if (this.isDragging) {
                this.control.endDrag(event);
                this.dragProxy.removeEventListener('mouseup', this.onDragRelease);
                this.dragProxy.removeEventListener('mouseleave', this.onDragLeave);
                this.dragProxy.removeEventListener('mousemove', this.onDragMove);
                this.dragProxy.removeEventListener('touchend', this.onDragRelease);
                this.dragProxy.removeEventListener('touchcancel', this.onDragRelease);
                this.dragProxy.removeEventListener('touchmove', this.onDragMove);
                this.isDragging = false;
            }
        };
        
        this.onPress = (event) => { 
            this.dragProxy.addEventListener('mouseup', this.onDragRelease);
            this.dragProxy.addEventListener('mouseleave', this.onDragLeave);
            this.dragProxy.addEventListener('mousemove', this.onDragMove);
            this.dragProxy.addEventListener('touchend', this.onDragRelease);
            this.dragProxy.addEventListener('touchcancel', this.onDragRelease);
            this.dragProxy.addEventListener('touchmove', this.onDragMove);
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
        
        this.enable();
    }

    /**
    * @property {boolean} - Whether it is enabled or not.
    * @readonly
    */
    get enabled () {
        return this.control.enabled();
    }
    
    /**
    * @property {Object} - The last pointer event that affected the instance.
    * @readonly
    */
    get pointerEvent () {
        return this.control.pointerEvent;
    }
    
    /**
    * @property {number} - The x position of the last pointer event that affected the instance.
    * @readonly
    */
    get pointerX () {
        return this.control.pointerX;
    }
    
    /**
    * @property {number} - The y position of the last pointer event that affected the instance.
    * @readonly
    */
    get pointerY () {
        return this.control.pointerY;
    }
    
    /**
    * @property {Element} - The target.
    */
    get target () {
        return this.control.target;
    }
    
    /**
    * @property {number} - The current x position.
    * @readonly
    */
    get x () {
        return this.control.x;
    }
    
    /**
    * @property {number} - The current y position.
    * @readonly
    */
    get y () {
        return this.control.y;
    }
    
    /**
    * Destroys the control and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        this.disable();
        this.control.kill();
        
        return this;
    }
    
    /**
    * Disables the control.
    *
    * @returns {this} self
    */
    disable () {
        this.control.disable();
        this.dragProxy.removeEventListener('dragstart', this.onDragstart);
        this.dragProxy.removeEventListener('mousedown', this.onPress);
        this.dragProxy.removeEventListener('mouseup', this.onRelease);
        this.dragProxy.removeEventListener('mouseleave', this.onLeave);
        this.dragProxy.removeEventListener('touchstart', this.onPress);
        this.dragProxy.removeEventListener('touchend', this.onRelease);
        this.dragProxy.removeEventListener('touchcancel', this.onRelease);
        this.dragProxy.style.cursor = null;

        return this;
    }
    
    /**
    * Enables the control.
    *
    * @returns {this} self
    */
    enable () {
        this.control.enable();
        this.dragProxy.addEventListener('dragstart', this.onDragstart);
        this.dragProxy.addEventListener('mousedown', this.onPress);
        this.dragProxy.addEventListener('mouseup', this.onRelease);
        this.dragProxy.addEventListener('mouseleave', this.onLeave);
        this.dragProxy.addEventListener('touchstart', this.onPress);
        this.dragProxy.addEventListener('touchend', this.onRelease);
        this.dragProxy.addEventListener('touchcancel', this.onRelease);
        this.dragProxy.style.cursor = 'move';

        return this;
    }
}

/**
* @property {Array} - The configuration property names.
* @static
*/
DragControl.CONFIG_PROP_NAMES = ['dragProxy', 'onDrag', 'onDragParams', 'onDragScope'];

export default DragControl;
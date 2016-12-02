'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* @class Oculo.CSSRenderer
* @constructor
* @memberof Oculo
*
* @example
* var myRenderer = new CSSRenderer(myCamera);
*/
class CSSRenderer {
    constructor (camera) {
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
    destroy () {
        this.camera = null;
        
        return this;
    }
    
    /**
    * Render the scene.
    *
    * returns {this} self
    */
    render () {
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
    renderSize () {
        if (this.camera.view) {
            TweenLite.set(this.camera.view, { 
                css: { 
                    height: this.camera.height,
                    width: this.camera.width
                }
            });
        }
    }
}

export default CSSRenderer;
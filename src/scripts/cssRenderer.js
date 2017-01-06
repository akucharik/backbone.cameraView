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
            var offset = this.camera._convertPositionToOffset(this.camera.position, this.camera.center, this.camera.transformOrigin, this.camera.transformation);
            
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
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import Scene    from './scene';

/**
* Description.
* 
* @class Oculo.SceneManager
* @constructor
* @param {Oculo.Camera} camera - The camera that owns this SceneManager.
* @param {boolean} [hasView=true] - If true, a 'div' is created and managed internally. Pass false to create a SceneManager without a view.
*/
class SceneManager {
    constructor (camera, hasView = true) {
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
        this.view = (hasView === true) ? document.createElement('div') : null;
        
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
    add (name, scene) {
        if (typeof scene === 'string') {
            scene = new Scene(this.camera, scene);
        }
        else {
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
    destroy () {
        for (let key in this._scenes) {
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
    get (name) {
        return this._scenes[name];
    }
    
    /**
    * Sets the active scene.
    *
    * @returns {this} self
    */
    setActiveScene (name) {
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
}

export default SceneManager;
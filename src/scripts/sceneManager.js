'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import isString from 'lodash/isString';
import Scene    from './scene';

/**
* Description.
* 
* @class SceneManager
* @param {Oculo.Camera} camera - The camera that owns this SceneManager.
*/
class SceneManager {
    constructor (camera) {
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
        * @property {Object} - An object for storing the managed Scene instances.
        * @private
        */
        this._scenes = {};
    }
    
    /**
    * Adds a scene.
    *
    * @param {string} name - The name to give the scene.
    * @param {Oculo.Scene} scene - The scene.
    * @returns {this} self
    */
    add (name, scene) {
        if (isString(scene)) {
            scene = new Scene(scene);
        }
        
        scene.camera = this.camera;
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
        this._scenes = {};
        
        return this;
    }
    
    /**
    * Gets a scene.
    *
    * @param {string} name - The name of the scene.
    * @returns {Oculo.Scene} The scene.
    */
    getScene (name) {
        return this._scenes[name];
    }
    
    /**
    * Sets the active scene.
    *
    * @returns {this} self
    */
    setActiveScene (name) {
        this.activeScene = this._scenes[name];
        
        return this;
    }
}

export default SceneManager;
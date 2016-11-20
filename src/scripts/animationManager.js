'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import isString from 'lodash/isString';

/**
* Description.
* 
* @class AnimationManager
* @param {Object} target - The object that owns this AnimationManager.
*/
class AnimationManager {
    constructor (target) {
        /**
        * @property {Object} - The object that owns this AnimationManager.
        * @readonly
        */
        this.target = target;
        
        /**
        * @property {Oculo.Animation} - The active camera animation.
        * @readonly
        */
        this.currentAnimation = null;
        
        /**
        * @property {Object} - An object for storing the managed Animation instances.
        * @private
        */
        this._animations = {};
    }
    
    /**
    * @name AnimationManager#isAnimating
    * @property {boolean} - Whether the current animation is running or not.
    * @readonly
    */
    get isAnimating () {
        var progress = this.currentAnimation ? this.currentAnimation.progress() : 0;
        return progress > 0 && progress < 1;
    }
    
    /**
    * @name AnimationManager#isPaused
    * @property {boolean} - Whether the current animation is paused or not.
    * @readonly
    */
    get isPaused () {
        return this.currentAnimation ? this.currentAnimation.paused() : false;
    }
    
    /**
    * Adds an animation.
    *
    * @param {string} name - The name to give the animation.
    * @param {Oculo.Animation} animation - The animation.
    * @returns {this} self
    */
    add (name, animation) {
        animation.camera = this.target;
        animation.managed = true;
        this._animations[name] = animation;
        
        return this;
    }
    
    /**
    * Destroys the camera and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        for (let key in this._animations) {
            this._animations[key].destroy();
        }
        
        this.target = null;
        this.currentAnimation.destroy();
        this.currentAnimation = null;
        this._animations = {};
        
        return this;
    }
    
    /**
    * Gets an animation.
    *
    * @param {string} name - The name of the animation.
    * @returns {Oculo.Animation} The animation.
    */
    get (name) {
        return this._animations[name];
    }
    
    /**
    * Pauses the active animation.
    *
    * @see {@link external:TimelineMax|TimelineMax}
    * @returns {this} self
    */
    pause () {
        this.currentAnimation.pause();

        return this;
    }

    /**
    * Plays the current or provided animation. forward from the current playhead position.
    *
    * @returns {this} self
    */
    play (animation) {
        if (isString(animation)) {
            animation = this._animations[animation];
        }
        
        if (animation) {
            if (this.currentAnimation && !this.currentAnimation.managed) {
                this.currentAnimation.destroy();
            }
            
            this.currentAnimation = animation;
            this.currentAnimation.invalidate().restart(false, false);
        } else {
            this.currentAnimation.play();
        }
        
        return this;
    }
    
    /**
    * Resumes playing the animation from the current playhead position.
    *
    * @see {@link external:TimelineMax|TimelineMax}
    * @returns {this} self
    */
    resume () {
        this.currentAnimation.resume();

        return this;
    }
}

export default AnimationManager;
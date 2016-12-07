'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import Animation from './Animation';
import { Type }  from './constants';

/**
* Description.
* 
* @class Oculo.AnimationManager
* @constructor
* @param {Object} camera - The camera that owns this AnimationManager.
*/
class AnimationManager {
    constructor (camera) {
        /**
        * @property {Object} - The camera that owns this AnimationManager.
        * @readonly
        */
        this.camera = camera;
        
        /**
        * @property {Oculo.Animation} - The active animation.
        * @readonly
        */
        this.currentAnimation = null;
        
        /**
        * @property {Object} - An object for storing the Animation instances.
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
    * @param {object|Oculo.Animation} animation - The animation. It can be an actual animation instance or an object representing the animation.
    * @returns {this} self
    *
    * @example <caption>As an animation instance</caption>
    * myAnimationManager.add('zoomInOut', new Oculo.Animation(myCamera).animate({zoom: 2}, 2, {ease: Power2.easeIn}).animate({zoom: 1}, 2, {ease: Power2.easeOut}));
    * 
    * @example <caption>As an object representing an animation</caption>
    * myAnimationManager.add('zoomInAndOut', { 
    *   keyframes: [{ 
    *     zoom: 2, 
    *     duration: 2, 
    *     options: { 
    *       ease: Power2.easeIn 
    *     }
    *   }, {
    *     zoom: 1,
    *     duration: 2,
    *     options: {
    *       ease: Power2.easeOut
    *     }
    *   }]
    * });
    */        
    add (name, animation) {
        let newAnimation;
        
        if (this._animations[name]) {
            this._animations[name].destroy();
        }
        
        if (animation.type === Type.ANIMATION) {
            newAnimation = animation;
        }
        else {
            newAnimation = new Animation(this.camera);
            animation.keyframes.forEach((keyframe) => {
                newAnimation.animate({
                    origin: keyframe.origin,
                    position: keyframe.position,
                    rotation: keyframe.rotation,
                    shake: keyframe.shake,
                    zoom: keyframe.zoom
                }, keyframe.duration, keyframe.options);
            });
            
        }
        
        this._animations[name] = newAnimation;
        
        return this;
    }
    
    /**
    * Destroys the AnimationManager and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        for (let key in this._animations) {
            this._animations[key].destroy();
        }
        
        this.camera = null;
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
        if (this.currentAnimation) {
            this.currentAnimation.pause(null, false);
        }

        return this;
    }

    /**
    * Plays the current or provided animation. forward from the current playhead position.
    *
    * @returns {this} self
    */
    play (animation) {
        if (typeof animation === 'string') {
            animation = this._animations[animation];
        }
        
        if (animation) {
            this.currentAnimation = animation;
            this.currentAnimation.invalidate().restart(false, false);
        } 
        else if (this.currentAnimation) {
            this.currentAnimation.play(null, false);
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
        if (this.currentAnimation) {
            this.currentAnimation.resume(null, false);
        }
        
        return this;
    }
}

export default AnimationManager;
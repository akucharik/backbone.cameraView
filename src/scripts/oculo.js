'use strict';

/**
* The Backbone library.
* @external Backbone
* @see http://backbonejs.org
*/

/**
* Backbone.Events
* @name Events
* @memberof external:Backbone
* @see http://backbonejs.org/#Events
*/

/**
* The Lodash library.
* @external Lodash
* @see http://lodash.com
*/

/**
* GSAP's TimelineMax.
* @external TimelineMax
* @see http://greensock.com/docs/#/HTML5/GSAP/TimelineMax/
*/

/**
* GSAP's TweenMax.
* @external TweenMax
* @see http://greensock.com/docs/#/HTML5/GSAP/TweenMax/
*/

/**
* GSAP's Easing.
* @external Easing
* @see http://greensock.com/docs/#/HTML5/GSAP/Easing/
*/

import Animation     from './animation';
import AnimationLite from './animationLite';
import Camera        from './camera';
import CSSRenderer   from './cssRenderer';
import Math          from './math/math';
import Matrix2       from './math/matrix2';
import Scene         from './scene';
import Utils         from './utils';
import Vector2       from './math/vector2';

const Oculo = {
    Animation: Animation,
    //AnimationLite: AnimationLite,
    Camera: Camera,
    CSSRenderer: CSSRenderer,
    Math: Math,
    Matrix2: Matrix2,
    Scene: Scene,
    Utils: Utils,
    Vector2: Vector2
};

module.exports = Oculo;
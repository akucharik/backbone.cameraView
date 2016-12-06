'use strict';

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
import Camera        from './camera';
import CSSRenderer   from './cssRenderer';
import Math          from './math/math';
import Matrix2       from './math/matrix2';
import Scene         from './scene';
import Utils         from './utils';
import Vector2       from './math/vector2';


/**
* @namespace Oculo
*/
const Oculo = {
    Animation: Animation,
    Camera: Camera,
    CSSRenderer: CSSRenderer,
    Math: Math,
    Matrix2: Matrix2,
    Scene: Scene,
    Utils: Utils,
    Vector2: Vector2
};

module.exports = Oculo;
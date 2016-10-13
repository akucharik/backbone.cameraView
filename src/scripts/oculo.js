'use strict';

import Animation from './cameraAnimation3';
//var Animation = require('./cameraAnimation3');
var Math = require('./math/math');
var Matrix2 = require('./math/matrix2');
var Vector2 = require('./math/vector2');

var Oculo = {
    Animation: Animation,
    Math: Math,
    Matrix2: Matrix2,
    Vector2: Vector2
};

window.Oculo = Oculo;
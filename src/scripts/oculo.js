'use strict';

import Animation from './animation';
import Camera from './camera';
import Math from './math/math';
import Matrix2 from './math/matrix2';
import Scene from './scene';
import Utils from './utils';
import Vector2 from './math/vector2';

const Oculo = {
    Animation: Animation,
    Camera: Camera,
    Math: Math,
    Matrix2: Matrix2,
    Scene: Scene,
    Utils: Utils,
    Vector2: Vector2
};

window.Oculo = Oculo;
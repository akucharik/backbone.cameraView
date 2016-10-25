'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import actions from './actions';

const reducers = {};

reducers.shakeEaseIn = function (value, action) {
    if (value === undefined) {
        value = 'Power2.easeIn';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_EASEIN:
            return action.easing;
        default: 
            return value;
    }
};

reducers.app = function (state, action) {
    if (state === undefined) {
        state = {};
    }

    return {
        shakeEaseIn: reducers.shakeEaseIn(state.shakeEaseIn, action)
    };
};

export default reducers;
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import actions from './actions';

const reducers = {};

reducers.behaviorGroup = function (value, action) {
    if (value === undefined) {
        value = 'move';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_BEHAVIOR_GROUP:
            return action.behaviorGroup;
        default: 
            return value;
    }
};

reducers.shakeEaseIn = function (value, action) {
    if (value === undefined) {
        value = 'Power0.easeNone';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_EASEIN:
            return action.easing;
        default: 
            return value;
    }
};

reducers.shakeEaseOut = function (value, action) {
    if (value === undefined) {
        value = 'Power0.easeNone';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_EASEOUT:
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
        behaviorGroup: reducers.behaviorGroup(state.behaviorGroup, action),
        shakeEaseIn: reducers.shakeEaseIn(state.shakeEaseIn, action),
        shakeEaseOut: reducers.shakeEaseOut(state.shakeEaseOut, action)
    };
};

export default reducers;
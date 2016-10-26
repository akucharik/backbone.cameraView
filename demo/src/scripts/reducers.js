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

// MoveTo
reducers.moveToDuration = function (value, action) {
    if (value === undefined) {
        value = '1';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_MOVETO_DURATION:
            return action.moveToDuration;
        default: 
            return value;
    }
};

reducers.moveToTarget = function (value, action) {
    if (value === undefined) {
        value = '{"x":200,"y":200}';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_MOVETO_TARGET:
            return action.moveToTarget;
        default: 
            return value;
    }
};

// Shake
reducers.shakeDirection = function (value, action) {
    if (value === undefined) {
        value = 'Both';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_DIRECTION:
            return action.shakeDirection;
        default: 
            return value;
    }
};

reducers.shakeDuration = function (value, action) {
    if (value === undefined) {
        value = '1';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_DURATION:
            return action.shakeDuration;
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
            return action.easeIn;
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
            return action.easeOut;
        default: 
            return value;
    }
};

reducers.shakeIntensity = function (value, action) {
    if (value === undefined) {
        value = '0.1';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_INTENSITY:
            return action.shakeIntensity;
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
        moveToDuration: reducers.moveToDuration(state.moveToDuration, action),
        moveToTarget: reducers.moveToTarget(state.moveToTarget, action),
        shakeDirection: reducers.shakeDirection(state.shakeDirection, action),
        shakeDuration:  reducers.shakeDuration(state.shakeDuration, action),
        shakeEaseIn: reducers.shakeEaseIn(state.shakeEaseIn, action),
        shakeEaseOut: reducers.shakeEaseOut(state.shakeEaseOut, action),
        shakeIntensity: reducers.shakeIntensity(state.shakeIntensity, action)
    };
};

export default reducers;
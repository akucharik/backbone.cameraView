'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import data    from './data/data';
import actions from './actions';

const reducers = {};

reducers.behaviorGroup = function (value, action) {
    if (value === undefined) {
        value = 'move';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_BEHAVIOR_GROUP:
            return action.group;
        default: 
            return value;
    }
};

// moveTo
reducers.moveToDuration = function (value, action) {
    if (value === undefined) {
        value = data.durationList[data.lookups.durationList['1']].value;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_MOVETO_DURATION:
            return action.duration;
        default: 
            return value;
    }
};

reducers.moveToEase = function (value, action) {
    if (value === undefined) {
        value = data.ease.None;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_MOVETO_EASE:
            return action.ease;
        default: 
            return value;
    }
};

reducers.moveToTarget = function (value, action) {
    if (value === undefined) {
        value = data.targetList[data.lookups.targetList['200,200']].value;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_MOVETO_TARGET:
            return action.target;
        default: 
            return value;
    }
};

// rotateTo
reducers.rotateToRotation = function (value, action) {
    if (value === undefined) {
        value = 0;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_ROTATETO_ROTATION:
            return action.rotation;
        default: 
            return value;
    }
};

reducers.rotateToDuration = function (value, action) {
    if (value === undefined) {
        value = data.durationList[data.lookups.durationList['1']].value;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_ROTATETO_DURATION:
            return action.duration;
        default: 
            return value;
    }
};

reducers.rotateToEase = function (value, action) {
    if (value === undefined) {
        value = data.ease.None;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_ROTATETO_EASE:
            return action.ease;
        default: 
            return value;
    }
};

// setSize
reducers.setSizeHeight = function (value, action) {
    if (value === undefined) {
        value = '500';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SETSIZE_HEIGHT:
            return action.height;
        default: 
            return value;
    }
};

reducers.setSizeWidth = function (value, action) {
    if (value === undefined) {
        value = '500';
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SETSIZE_WIDTH:
            return action.width;
        default: 
            return value;
    }
};

// shake
reducers.shakeDirection = function (value, action) {
    if (value === undefined) {
        value = data.shakeDirectionList[data.lookups.shakeDirectionList.Both].value;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_DIRECTION:
            return action.direction;
        default: 
            return value;
    }
};

reducers.shakeDuration = function (value, action) {
    if (value === undefined) {
        value = data.durationList[data.lookups.durationList['2']].value;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_DURATION:
            return action.duration;
        default: 
            return value;
    }
};

reducers.shakeEaseIn = function (value, action) {
    if (value === undefined) {
        value = data.ease.None;
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
        value = data.ease.None;
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
        value = data.shakeIntensityList[data.lookups.shakeIntensityList['0.05']].value;
    }
    
    switch (action.type) {
        case actions.type.UPDATE_SHAKE_INTENSITY:
            return action.intensity;
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
        moveToEase: reducers.moveToEase(state.moveToEase, action),
        moveToTarget: reducers.moveToTarget(state.moveToTarget, action),
        rotateToRotation: reducers.rotateToRotation(state.rotateToRotation, action),
        rotateToDuration: reducers.rotateToDuration(state.rotateToDuration, action),
        rotateToEase: reducers.rotateToEase(state.rotateToEase, action),
        setSizeHeight: reducers.setSizeHeight(state.setSizeHeight, action),
        setSizeWidth: reducers.setSizeWidth(state.setSizeWidth, action),
        shakeDirection: reducers.shakeDirection(state.shakeDirection, action),
        shakeDuration:  reducers.shakeDuration(state.shakeDuration, action),
        shakeEaseIn: reducers.shakeEaseIn(state.shakeEaseIn, action),
        shakeEaseOut: reducers.shakeEaseOut(state.shakeEaseOut, action),
        shakeIntensity: reducers.shakeIntensity(state.shakeIntensity, action)
    };
};

export default reducers;
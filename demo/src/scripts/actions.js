'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

const actions = {
    type: {
        UPDATE_BEHAVIOR_GROUP: 'UPDATE_BEHAVIOR_GROUP',
        
        // moveTo
        UPDATE_MOVETO_DURATION: 'UPDATE_MOVETO_DURATION',
        UPDATE_MOVETO_TARGET: 'UPDATE_MOVETO_TARGET',
        UPDATE_MOVETO_EASE: 'UPDATE_MOVETO_EASE',
        
        // rotateTo
        UPDATE_ROTATETO_ROTATION: 'UPDATE_ROTATETO_ROTATION',
        UPDATE_ROTATETO_DURATION: 'UPDATE_ROTATETO_DURATION',
        UPDATE_ROTATETO_EASE: 'UPDATE_ROTATETO_EASE',
        
        // setSize
        UPDATE_SETSIZE_HEIGHT: 'UPDATE_SETSIZE_HEIGHT',
        UPDATE_SETSIZE_WIDTH: 'UPDATE_SETSIZE_WIDTH',
        
        // shake
        UPDATE_SHAKE_DIRECTION: 'UPDATE_SHAKE_DIRECTION',
        UPDATE_SHAKE_DURATION: 'UPDATE_SHAKE_DURATION',
        UPDATE_SHAKE_EASEIN: 'UPDATE_SHAKE_EASEIN',
        UPDATE_SHAKE_EASEOUT: 'UPDATE_SHAKE_EASEOUT',
        UPDATE_SHAKE_INTENSITY: 'UPDATE_SHAKE_INTENSITY'
    }
};

actions.updateBehaviorGroup = function (group) {
    return {
        type: actions.type.UPDATE_BEHAVIOR_GROUP,
        group: group
    };
};

// moveTo
actions.updateMoveToDuration = function (duration) {
    return {
        type: actions.type.UPDATE_MOVETO_DURATION,
        duration: duration
    };
};

actions.updateMoveToEase = function (ease) {
    return {
        type: actions.type.UPDATE_MOVETO_EASE,
        ease: ease
    };
};

actions.updateMoveToTarget = function (target) {
    return {
        type: actions.type.UPDATE_MOVETO_TARGET,
        target: target
    };
};

// rotateTo
actions.updateRotateToRotation = function (value) {
    return {
        type: actions.type.UPDATE_ROTATETO_ROTATION,
        rotation: value
    };
};

actions.updateRotateToDuration = function (duration) {
    return {
        type: actions.type.UPDATE_ROTATETO_DURATION,
        duration: duration
    };
};

actions.updateRotateToEase = function (ease) {
    return {
        type: actions.type.UPDATE_ROTATETO_EASE,
        ease: ease
    };
};

// setSize
actions.updateSetSizeHeight = function (height) {
    return {
        type: actions.type.UPDATE_SETSIZE_HEIGHT,
        height: height
    };
};

actions.updateSetSizeWidth = function (width) {
    return {
        type: actions.type.UPDATE_SETSIZE_WIDTH,
        width: width
    };
};

// shake
actions.updateShakeDirection = function (direction) {
    return {
        type: actions.type.UPDATE_SHAKE_DIRECTION,
        direction: direction
    };
};

actions.updateShakeDuration = function (duration) {
    return {
        type: actions.type.UPDATE_SHAKE_DURATION,
        duration: duration
    };
};

actions.updateShakeEaseIn = function (ease) {
    return {
        type: actions.type.UPDATE_SHAKE_EASEIN,
        easeIn: ease
    };
};

actions.updateShakeEaseOut = function (ease) {
    return {
        type: actions.type.UPDATE_SHAKE_EASEOUT,
        easeOut: ease
    };
};

actions.updateShakeIntensity = function (intensity) {
    return {
        type: actions.type.UPDATE_SHAKE_INTENSITY,
        intensity: intensity
    };
};

export default actions;
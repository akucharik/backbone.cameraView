'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

const actions = {
    type: {
        UPDATE_BEHAVIOR_GROUP: 'UPDATE_BEHAVIOR_GROUP',
        
        // MoveTo
        UPDATE_MOVETO_DURATION: 'UPDATE_MOVETO_DURATION',
        UPDATE_MOVETO_TARGET: 'UPDATE_MOVETO_TARGET',
        
        // Shake
        UPDATE_SHAKE_DIRECTION: 'UPDATE_SHAKE_DIRECTION',
        UPDATE_SHAKE_DURATION: 'UPDATE_SHAKE_DURATION',
        UPDATE_SHAKE_EASEIN: 'UPDATE_SHAKE_EASEIN',
        UPDATE_SHAKE_EASEOUT: 'UPDATE_SHAKE_EASEOUT',
        UPDATE_SHAKE_INTENSITY: 'UPDATE_SHAKE_INTENSITY',
    }
};

actions.updateBehaviorGroup = function (group) {
    return {
        type: actions.type.UPDATE_BEHAVIOR_GROUP,
        behaviorGroup: group
    };
};

// MoveTo
actions.moveTo = function () {
    var state = Demo.store.getState();
    
    camera.moveTo(JSON.parse(state.moveToTarget), parseFloat(state.moveToDuration));
};

actions.updateMoveToDuration = function (duration) {
    return {
        type: actions.type.UPDATE_MOVETO_DURATION,
        moveToDuration: duration
    };
};

actions.updateMoveToTarget = function (target) {
    return {
        type: actions.type.UPDATE_MOVETO_TARGET,
        moveToTarget: target
    };
};

// Shake
actions.shake = function () {
    var state = Demo.store.getState();
    
    camera.shake(parseFloat(state.shakeIntensity), parseFloat(state.shakeDuration));
};

actions.updateShakeDirection = function (direction) {
    return {
        type: actions.type.UPDATE_SHAKE_DIRECTION,
        shakeDirection: direction
    };
};

actions.updateShakeDuration = function (duration) {
    return {
        type: actions.type.UPDATE_SHAKE_DURATION,
        shakeDuration: duration
    };
};

actions.updateShakeEaseIn = function (easing) {
    return {
        type: actions.type.UPDATE_SHAKE_EASEIN,
        easeIn: easing
    };
};

actions.updateShakeEaseOut = function (easing) {
    return {
        type: actions.type.UPDATE_SHAKE_EASEOUT,
        easeOut: easing
    };
};

actions.updateShakeIntensity = function (intensity) {
    return {
        type: actions.type.UPDATE_SHAKE_INTENSITY,
        shakeIntensity: intensity
    };
};

export default actions;
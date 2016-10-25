'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

const actions = {
    type: {
        UPDATE_BEHAVIOR_GROUP: 'UPDATE_BEHAVIOR_GROUP',
        UPDATE_SHAKE_EASEIN: 'UPDATE_SHAKE_EASEIN',
        UPDATE_SHAKE_EASEOUT: 'UPDATE_SHAKE_EASEOUT'
    }
};

actions.updateBehaviorGroup = function (behaviorGroup) {
    return {
        type: actions.type.UPDATE_BEHAVIOR_GROUP,
        behaviorGroup: behaviorGroup
    };
};

actions.updateShakeEaseIn = function (easing) {
    return {
        type: actions.type.UPDATE_SHAKE_EASEIN,
        easing: easing
    };
};

actions.updateShakeEaseOut = function (easing) {
    return {
        type: actions.type.UPDATE_SHAKE_EASEOUT,
        easing: easing
    };
};

export default actions;
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

const actions = {
    type: {
        UPDATE_SHAKE_EASEIN: 'UPDATE_SHAKE_EASEIN'
    }
};

actions.updateShakeEaseIn = function (easing) {
    return {
        type: actions.type.UPDATE_SHAKE_EASEIN,
        easing: easing
    };
};

export default actions;
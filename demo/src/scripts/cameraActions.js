'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import store from './store';

function parseTextValue (value) {
    let parsedValue;
    
    try {
        parsedValue = JSON.parse(value);
    }
    catch (error) {
        console.log('caught: ', error);
    }
    
    return parsedValue;
}

const actions = {
    moveTo: function () {
        let state = store.getState();
        let target = parseTextValue(state.moveToTarget);

        if (target !== undefined) {
            camera.moveTo(target, parseFloat(state.moveToDuration));
        }
    },
    rotateAt: function () {
        let state = store.getState();
        let originTarget = parseTextValue(state.rotateAtOrigin);
        
        if (target !== undefined) {
            camera.rotateAt(parseFloat(state.rotateAtAmount), originTarget, parseFloat(state.rotateAtDuration));
        }
    },
    rotateTo: function () {
        let state = store.getState();

        camera.rotateTo(parseFloat(state.rotateToAmount), parseFloat(state.rotateToDuration));
    },
    shake: function () {
        let state = store.getState();

        camera.shake(parseFloat(state.shakeIntensity), parseFloat(state.shakeDuration));
    },
    zoomAt: function () {
        let state = store.getState();
        let taret = parseTextValue(state.zoomAtTarget);
        let originTarget = parseTextValue(state.zoomAtOrigin);

        camera.zoomAt(target, originTarget, parseFloat(state.zoomAtDuration));
    },
    zoomTo: function () {
        let state = store.getState();
        let target = parseTextValue(state.zoomToTarget);

        camera.zoomTo(target, parseFloat(state.zoomToDuration));
    }
};

export default actions;
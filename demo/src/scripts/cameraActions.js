'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import data  from './data/data';
import store from './store';

const actions = {
    moveTo: function () {
        let state = store.getState();
        let target = data.target[state.moveToTarget];
        let duration = data.duration[state.moveToDuration];

        camera.moveTo(target, duration, { ease: state.moveToEase });
    },
    rotateAt: function () {
        let state = store.getState();
        let originTarget = parseTextValue(state.rotateAtOrigin);
        
        if (target !== undefined) {
            camera.rotateAt(state.rotateAtAmount, originTarget, state.rotateAtDuration);
        }
    },
    rotateTo: function () {
        let state = store.getState();

        camera.rotateTo(state.rotateToAmount, state.rotateToDuration);
    },
    setSize: function () {
        let state = store.getState();
        
        camera.setSize(state.setSizeWidth, state.setSizeHeight);
    },
    shake: function () {
        let state = store.getState();
        let intensity = data.shakeIntensity[state.shakeIntensity];
        let duration = data.duration[state.shakeDuration];
        let direction = data.shakeDirection[state.shakeDirection];

        camera.shake(intensity, duration, direction, { easeIn: state.shakeEaseIn, easeOut: state.shakeEaseOut });
    },
    zoomAt: function () {
        let state = store.getState();
        let target = state.zoomAtTarget;
        let originTarget = state.zoomAtOrigin;

        camera.zoomAt(target, originTarget, state.zoomAtDuration);
    },
    zoomTo: function () {
        let state = store.getState();
        let target = state.zoomToTarget;

        camera.zoomTo(target, state.zoomToDuration);
    }
};

export default actions;
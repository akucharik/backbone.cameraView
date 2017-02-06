'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import camera   from './camera';
import data     from './data/data';
import store    from './store';

const actions = {
    animate: function () {
        let state = store.getState();
        let duration = data.duration[state.duration];

        camera.animate({
            origin: data.origin[state.origin],
            position: data.target[state.position],
            rotation: parseFloat(state.rotation),
            zoom: parseFloat(state.zoom)
        }, duration, { ease: state.animateEase });
    },
    moveTo: function () {
        let state = store.getState();
        let position = data.target[state.position];
        let duration = data.duration[state.duration];

        camera.moveTo(position, duration, { ease: state.ease });
    },
    pause: function () {
        camera.pause();
    },
    play: function () {
        camera.play();
    },
    resume: function () {
        camera.resume();
    },
    reverse: function () {
        camera.reverse();
    },
    rotateAt: function () {
        let state = store.getState();
        let origin = data.origin[state.origin];
        let duration = data.duration[state.duration];
        
        camera.rotateAt(origin, parseFloat(state.rotation), duration, { ease: state.ease });
    },
    rotateTo: function () {
        let state = store.getState();
        let duration = data.duration[state.duration];

        camera.rotateTo(parseFloat(state.rotation), duration, { ease: state.ease });
    },
    setBounds: function () {
        let state = store.getState();
        
        camera.bounds = data.bounds[state.bounds];
        camera.render();
    },
    setSize: function () {
        let state = store.getState();
        
        camera.setSize(state.width, state.height);
    },
    shake: function () {
        let state = store.getState();
        let intensity = data.shakeIntensity[state.shakeIntensity];
        let duration = data.duration[state.duration];
        let direction = data.shakeDirection[state.shakeDirection];
        let ease = data.ease[state.ease];
        let easeIn = data.ease[state.shakeEaseIn];
        let easeOut = data.ease[state.shakeEaseOut];

        camera.shake(intensity, duration, direction, { ease: ease, easeIn: easeIn, easeOut: easeOut });
    },
    zoomAt: function () {
        let state = store.getState();
        let zoom = parseFloat(state.zoom);
        let origin = data.origin[state.origin];
        let duration = data.duration[state.duration];

        camera.zoomAt(origin, zoom, duration, { ease: state.ease });
    },
    zoomTo: function () {
        let state = store.getState();
        let zoom = parseFloat(state.zoom);
        let duration = data.duration[state.duration];

        camera.zoomTo(zoom, duration, { ease: state.ease });
    }
};

export default actions;
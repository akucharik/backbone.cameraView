'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import data  from './data/data';
import store from './store';

const actions = {
    animate: function () {
        let state = store.getState();
        let duration = data.duration[state.duration];

        Demo.camera.animate({
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

        Demo.camera.moveTo(position, duration, { ease: state.ease });
    },
    pause: function () {
        Demo.camera.pause();
    },
    play: function () {
        Demo.camera.play();
    },
    resume: function () {
        Demo.camera.resume();
    },
    reverse: function () {
        Demo.camera.reverse();
    },
    rotateAt: function () {
        let state = store.getState();
        let origin = data.origin[state.origin];
        let duration = data.duration[state.duration];
        
        Demo.camera.rotateAt(origin, parseFloat(state.rotation), duration, { ease: state.ease });
    },
    rotateTo: function () {
        let state = store.getState();
        let duration = data.duration[state.duration];

        Demo.camera.rotateTo(parseFloat(state.rotation), duration, { ease: state.ease });
    },
    setBounds: function () {
        let state = store.getState();
        
        Demo.camera.bounds = data.bounds[state.bounds];
        Demo.camera.render();
    },
    setSize: function () {
        let state = store.getState();
        
        Demo.camera.setSize(state.width, state.height);
    },
    shake: function () {
        let state = store.getState();
        let intensity = data.shakeIntensity[state.shakeIntensity];
        let duration = data.duration[state.duration];
        let direction = data.shakeDirection[state.shakeDirection];
        let ease = data.ease[state.ease];
        let easeIn = data.ease[state.shakeEaseIn];
        let easeOut = data.ease[state.shakeEaseOut];

        Demo.camera.shake(intensity, duration, direction, { ease: ease, easeIn: easeIn, easeOut: easeOut });
    },
    zoomAt: function () {
        let state = store.getState();
        let zoom = parseFloat(state.zoom);
        let origin = data.origin[state.origin];
        let duration = data.duration[state.duration];

        Demo.camera.zoomAt(origin, zoom, duration, { ease: state.ease });
    },
    zoomTo: function () {
        let state = store.getState();
        let zoom = parseFloat(state.zoom);
        let duration = data.duration[state.duration];

        Demo.camera.zoomTo(zoom, duration, { ease: state.ease });
    }
};

export default actions;
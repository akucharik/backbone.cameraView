'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import debounce from 'lodash/debounce';
import data     from './data/data';

function resizeCamera () {
    if (window.innerWidth >= 1024) {
        camera.setSize(600);
    }
    else {
        let rowStyle = window.getComputedStyle(camera.view.parentElement.parentElement.parentElement);
        camera.setSize(window.innerWidth - parseInt(rowStyle.paddingLeft) - parseInt(rowStyle.paddingRight));
    }
}

// Initialize camera
const camera = new Oculo.Camera({
    view: '#camera',
    bounds: Oculo.Camera.bounds.WORLD_EDGE,
    dragToMove: true,
    minZoom: 0.40,
    wheelToZoom: true,
    width: 600,
    height: 500
});

// Initialize scenes
camera.addScene('scene1', new Oculo.Scene('#scene1', 1350, 900));
camera.addScene('scene2', new Oculo.Scene('#scene2', 1827, 1215));
camera.addScene('scene3', '#scene3');

data.elements.forEach(function (item) {
    let htmlElement = document.createElement('div');
    htmlElement.className = 'element ' + item.metalCategory.toLowerCase();
    htmlElement.setAttribute('id', item.name);
    htmlElement.innerHTML = '<div class="element-number">' + item.atomicNumber + '</div><div class="element-symbol">' + item.symbol + '</div><div class="element-name">' + item.name + '</div><div class="element-weight">' + item.weight + '</div>';
    htmlElement.style.top = (item.col - 1) * 90 + 'px';
    htmlElement.style.left = (item.row - 1) * 75 + 'px';
    camera.scenes.get('scene1').view.appendChild(htmlElement);
});

camera.setScene('scene1');

// Initialize animations
const animations = [{
    name: 'intro',
    keyframes: [{
        position: {
            x: camera.scene.width * 0.5,
            y: camera.scene.height * 0.5
        }, 
        zoom: 2,
        options: {
            onComplete: function () { this.camera.play('delayedZoomOut'); }
        }
    }]
}, {
    name: 'delayedZoomOut',
    keyframes: [{ 
        zoom: 0.4, 
        duration: 0.6,
        options: {
            ease: Power2.easeInOut,
            delay: 0.5
        }
    }]
}, {
    name: 'invariant',
    keyframes: [{ 
        origin: {x: 0, y: 0},
        position: {x: 0, y: 0},
        rotation: 0,
        zoom: 1, 
        duration: 0
    }, {
        zoom: 2,
        duration: 2,
        options: {
            ease: Power2.easeOut
        }
    }]
}, {
    name: 'two',
    keyframes: [{ 
        zoom: 2, 
        duration: 2, 
        options: { 
            ease: Power2.easeIn 
        }
    }, {
        zoom: 1,
        duration: 2,
        options: {
            ease: Power2.easeOut
        }
    }]
}];

animations.forEach(function (item) {
    camera.addAnimation(item.name, item);
});

//camera.addAnimation('moveTobox100', { duration: 2, position: '#box100', rotation:-20, zoom: 1.5 });
camera.addAnimation('moveTobox100', new Oculo.Animation(camera).animate({position: {x:200, y:200}}, 1).animate({position: '#box100', rotation:-20, zoom: 2}, 2));
camera.addAnimation('moveTo2000', new Oculo.Animation(camera).animate({position: {x:2000, y:500}, zoom: 1.5}, 2));
camera.addAnimation('moveTo800Slow', new Oculo.Animation(camera).animate({position: {x:800}, zoom: 1.5}, 8));
camera.addAnimation('rotateAt200', new Oculo.Animation(camera).rotateAt({x:200, y:200}, -50, 5));
camera.addAnimation('rotateTo20', new Oculo.Animation(camera).rotateTo(-20, 2));
camera.addAnimation('shakeEaseNone', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH));
camera.addAnimation('shakeEase', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH, { ease: Power2.easeIn }));
camera.addAnimation('shakeEaseIn', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH, { easeIn: Power2.easeIn }));
camera.addAnimation('shakeEaseOut', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH, { easeOut: Power2.easeOut }));
camera.addAnimation('shakeEaseInOut', new Oculo.Animation(camera).shake(0.1, 4, Oculo.Animation.shake.direction.BOTH, { easeIn: Power2.easeIn, easeOut: Power2.easeOut }));
camera.addAnimation('shakeNoBounds', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH, { enforceBounds: false }));
camera.addAnimation('zoomAt100', new Oculo.Animation(camera).zoomAt({x:100, y:100}, 2, 2));
camera.addAnimation('zoomTo50', new Oculo.Animation(camera).zoomTo(0.5, 2));
camera.addAnimation('zoomTo200', new Oculo.Animation(camera).zoomTo(2, 2));
camera.addAnimation('instantZoom', new Oculo.Animation(camera).zoomTo(2, 0));
camera.addAnimation('instantShake', new Oculo.Animation(camera).shake(0.1, 0));
camera.addAnimation('backAndForth', new Oculo.Animation(camera).animate({position: '#box100', rotation:20, zoom: 1.5}, 1.5, {ease: Power4.easeOut}).animate({position: 'previous', rotation: 'previous', zoom: 'previous'}, 1.5, {ease: Power3.easeOut}));

camera.addAnimation('moveTo0001', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 0.166}, 61, {ease: Power0.easeNone}));
camera.addAnimation('moveTo0005', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 0.5}, 61, {ease: Power0.easeNone}));
camera.addAnimation('moveTo0006', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 0.666}, 61, {ease: Power0.easeNone}));
camera.addAnimation('moveTo001', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 1}, 61, {ease: Power0.easeNone}));
camera.addAnimation('moveTo0015', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 1.5}, 61, {ease: Power0.easeNone}));
camera.addAnimation('moveTo002', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 2}, 61, {ease: Power0.easeNone}));
camera.addAnimation('moveTo006', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 6}, 61, {ease: Power0.easeNone}));

// Manage size
resizeCamera();
window.addEventListener('resize', debounce(resizeCamera, 200, { maxWait: 400 }));

// Render
camera.render();
camera.play('intro');

export default camera;
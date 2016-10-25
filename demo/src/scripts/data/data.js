'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

const store = {
    moveTo: {
        position: { x: 0, y: 0 },
        duration: 2
    },
    rotateAt: {
        rotation: 0,
        origin: { x: 0, y: 0 },
        duration: 2
    },
    rotateTo: {
        rotation: 0,
        duration: 2
    },
    shake: {
        intensity: 0.1,
        duration: 2,
        direction: Oculo.Animation.shakeDirection.BOTH,
        easeIn: 'Power4',
        easeOut: 'Power4'
    },
    zoomAt: {
        zoom: 1,
        origin: { x: 0, y: 0 },
        duration: 2
    },
    zoomTo: {
        zoom: 1,
        duration: 2
    }
};

const data = {
    lookups: {}
};

data.behaviorTypes = [
    {
        text: 'Move',
        value: 'move'
    },
    {
        text: 'Rotate',
        value: 'rotate'
    },
    {
        text: 'Zoom',
        value: 'zoom'
    },
    {
        text: 'Effect',
        value: 'effect'
    }
];

data.lookups.behaviorType = {
    move: data.behaviorTypes[0],
    rotate: data.behaviorTypes[1],
    zoom: data.behaviorTypes[2],
    effect: data.behaviorTypes[4]
};

data.behaviors = {
    moveTo: {
        action: camera.moveTo,
        fields: ['position', 'duration'],
        type: data.lookups.behaviorType.move
    },
    rotateAt: {
        action: camera.rotateAt,
        fields: ['rotation', 'origin', 'duration'],
        type: data.lookups.behaviorType.rotate
    },
    rotateTo: {
        action: camera.rotateTo,
        fields: ['rotation', 'duration'],
        type: data.lookups.behaviorType.rotate
    },
    shake: {
        action: camera.shake,
        fields: ['intensity', 'duration', 'direction', 'easeIn', 'easeOut'],
        type: data.lookups.behaviorType.effect
    },
    zoomAt: {
        action: camera.zoomAt,
        fields: ['zoom', 'origin', 'duration'],
        type: data.lookups.behaviorType.zoom
    },
    zoomTo: {
        action: camera.zoomTo,
        fields: ['zoom', 'duration'],
        type: data.lookups.behaviorType.zoom
    }
};

data.easingList = [
    { text: 'Power0.easeNone', value: 'Power0.easeNone' },
    { text: 'Power1.easeIn', value: 'Power1.easeIn' },
    { text: 'Power1.easeOut', value: 'Power1.easeOut' },
    { text: 'Power1.easeInOut', value: 'Power1.easeInOut' },
    { text: 'Power2.easeIn', value: 'Power2.easeIn' },
    { text: 'Power2.easeOut', value: 'Power2.easeOut' },
    { text: 'Power2.easeInOut', value: 'Power2.easeInOut' },
    { text: 'Power3.easeIn', value: 'Power3.easeIn' },
    { text: 'Power3.easeOut', value: 'Power3.easeOut' },
    { text: 'Power3.easeInOut', value: 'Power3.easeInOut' },
    { text: 'Power4.easeIn', value: 'Power4.easeIn' },
    { text: 'Power4.easeOut', value: 'Power4.easeOut' },
    { text: 'Power4.easeInOut', value: 'Power4.easeInOut' },
    { text: 'Back.easeIn', value: 'Back.easeIn' },
    { text: 'Back.easeOut', value: 'Back.easeOut' },
    { text: 'Back.easeInOut', value: 'Back.easeInOut' },
    { text: 'Elastic.easeIn', value: 'Elastic.easeIn' },
    { text: 'Elastic.easeOut', value: 'Elastic.easeOut' },
    { text: 'Elastic.easeInOut', value: 'Elastic.easeInOut' },
    { text: 'Bounce.easeIn', value: 'Bounce.easeIn' },
    { text: 'Bounce.easeOut', value: 'Bounce.easeOut' },
    { text: 'Bounce.easeInOut', value: 'Bounce.easeInOut' },
    { text: 'Circ.easeIn', value: 'Circ.easeIn' },
    { text: 'Circ.easeOut', value: 'Circ.easeOut' },
    { text: 'Circ.easeInOut', value: 'Circ.easeInOut' },
    { text: 'Expo.easeIn', value: 'Expo.easeIn' },
    { text: 'Expo.easeOut', value: 'Expo.easeOut' },
    { text: 'Expo.easeInOut', value: 'Expo.easeInOut' },
    { text: 'Sine.easeIn', value: 'Sine.easeIn' },
    { text: 'Sine.easeOut', value: 'Sine.easeOut' },
    { text: 'Sine.easeInOut', value: 'Sine.easeInOut' }
];

data.fields = {
    duration: {
        tag: 'input',
        type: 'number'
    },
    easeIn: {
        tag: 'select'
    },
    easeOut: {
        data: com.greensock.easing,
        tag: 'select'
    },
    intensity: {
        tag: 'input',
        type: 'number'
    },
    origin: {
        tag: 'input',
        type: 'text'
    },
    position: {
        tag: 'input',
        type: 'text'
    },
    rotation: {
        tag: 'input',
        type: 'text'
    },
    zoom: {
        tag: 'input',
        type: 'number'
    }
};

export default data;
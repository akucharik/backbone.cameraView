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
        easeIn: Power2.easeIn,
        easeOut: Power2.easeOut
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
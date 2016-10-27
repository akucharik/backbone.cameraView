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

data.behaviorGroups = [{
        text: 'Move To',
        value: 'moveTo'
    }, {
        text: 'Rotate To',
        value: 'rotateTo'
    }, {
        text: 'Zoom To',
        value: 'zoomTo'
    }, {
        text: 'Shake',
        value: 'shake'
    }, {
        text: 'Resize',
        value: 'setSize'
    }
];

data.lookups.behaviorType = {
    move: data.behaviorGroups[0],
    rotate: data.behaviorGroups[1],
    zoom: data.behaviorGroups[2],
    effect: data.behaviorGroups[4]
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

data.duration = {
    '0': 0,
    '0.5': 0.5,
    '1': 1,
    '2': 2,
    '4': 4
};

data.durationList = [{
        text: '0',
        value: '0'
    },{
        text: '0.5',
        value: '0.5'
    },{
        text: '1',
        value: '1'
    },{
        text: '2',
        value: '2'
    },{
        text: '4',
        value: '4'
    }
];

data.lookups.durationList = {
    '0': 0,
    '0.5': 1,
    '1': 2,
    '2': 3,
    '4': 4,
};

// Easing
data.ease = {
    'None': '',
    'Power1.easeIn': 'Power1.easeIn',
    'Power1.easeOut': 'Power1.easeOut',
    'Power1.easeInOut': 'Power1.easeInOut',
    'Power2.easeIn': 'Power2.easeIn',
    'Power2.easeOut': 'Power2.easeOut',
    'Power2.easeInOut': 'Power2.easeInOut',
    'Power3.easeIn': 'Power3.easeIn',
    'Power3.easeOut': 'Power3.easeOut',
    'Power3.easeInOut': 'Power3.easeInOut',
    'Power4.easeIn': 'Power4.easeIn',
    'Power4.easeOut': 'Power4.easeOut',
    'Power4.easeInOut': 'Power4.easeInOut',
    'Back.easeIn': 'Back.easeIn',
    'Back.easeOut': 'Back.easeOut',
    'Back.easeInOut': 'Back.easeInOut',
    'Elastic.easeIn': 'Elastic.easeIn',
    'Elastic.easeOut': 'Elastic.easeOut',
    'Elastic.easeInOut': 'Elastic.easeInOut',
    'Bounce.easeIn': 'Bounce.easeIn',
    'Bounce.easeOut': 'Bounce.easeOut',
    'Bounce.easeInOut': 'Bounce.easeInOut',
    'Circ.easeIn': 'Circ.easeIn',
    'Circ.easeOut': 'Circ.easeOut',
    'Circ.easeInOut': 'Circ.easeInOut',
    'Expo.easeIn': 'Expo.easeIn',
    'Expo.easeOut': 'Expo.easeOut',
    'Expo.easeInOut': 'Expo.easeInOut',
    'Sine.easeIn': 'Sine.easeIn',
    'Sine.easeOut': 'Sine.easeOut',
    'Sine.easeInOut': 'Sine.easeInOut'
};

data.easeList = [
    { text: 'None', value: 'None' },
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

data.lookups.easeList = {
    'None': 0,
    'Power1.easeIn': 1,
    'Power1.easeOut': 2,
    'Power1.easeInOut': 3,
    'Power2.easeIn': 4,
    'Power2.easeOut': 5,
    'Power2.easeInOut': 6,
    'Power3.easeIn': 7,
    'Power3.easeOut': 8,
    'Power3.easeInOut': 8,
    'Power4.easeIn': 9,
    'Power4.easeOut': 10,
    'Power4.easeInOut': 11,
    'Back.easeIn': 12,
    'Back.easeOut': 13,
    'Back.easeInOut': 14,
    'Elastic.easeIn': 15,
    'Elastic.easeOut': 16,
    'Elastic.easeInOut': 17,
    'Bounce.easeIn': 18,
    'Bounce.easeOut': 19,
    'Bounce.easeInOut': 20,
    'Circ.easeIn': 21,
    'Circ.easeOut': 22,
    'Circ.easeInOut': 23,
    'Expo.easeIn': 24,
    'Expo.easeOut': 25,
    'Expo.easeInOut': 26,
    'Sine.easeIn': 27,
    'Sine.easeOut': 28,
    'Sine.easeInOut': 29
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

// Shake
data.shakeDirection = {
    'Both': 0,
    'Horizontal': 1,
    'Vertical': 2
};

data.shakeDirectionList = [
    {text: 'Both', value: 'Both' }, 
    { text: 'Horizontal', value: 'Horizontal' },
    { text: 'Vertical', value: 'Vertical' }
];

data.lookups.shakeDirectionList = {
    'Both': 0,
    'Horizontal': 1,
    'Vertical': 2
};

data.shakeIntensity = {
    '0.01': 0.01,
    '0.03': 0.03,
    '0.05': 0.05,
    '0.1': 0.1,
    '0.2': 0.2
};

data.shakeIntensityList = [
    { text: '0.01', value: '0.01' }, 
    { text: '0.03', value: '0.03'}, 
    { text: '0.05', value: '0.05'}, 
    { text: '0.1', value: '0.1' }, 
    { text: '0.2', value: '0.2' }
];

data.lookups.shakeIntensityList = {
    '0.01': 0,
    '0.03': 1,
    '0.05': 2,
    '0.1': 3,
    '0.2': 4
};

// Target
data.target = {
    '#box100': '#box100',
    '200,200': { x:200, y:200 }
};

data.targetList = [
    { text: '#box100', value: '#box100' }, 
    { text: '200, 200', value: '200,200' }
];

data.lookups.targetList = {
    '#box100': 0,
    '200,200': 1
};

export default data;
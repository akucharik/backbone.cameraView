# Oculo (in development)

Oculo is a simple and intuitive JavaScript 2D camera that allows you to animate HTML within a frame. It's built using [GSAP](https://greensock.com/gsap) for its tweening and rendering engine.

## Features
- Pan
- Zoom
- Rotate
- Drag
- Wheel
- Bounds
- Play controls
- and more...

## Getting started
### 1. [Download Oculo](https://github.com/akucharik/backbone.cameraView/archive/master.zip) and add it and its dependencies to your page.

```html
<script type="text/javascript" src="oculo/dist/TweenMax.min.js"></script>
<script type="text/javascript" src="oculo/dist/Draggable.min.js"></script>
<script type="text/javascript" src="oculo/dist/oculo.min.js"></script>
```

### 2. Set up your HTML

```html
<div id="camera"></div>
<div id="scene">
    <div>My first scene...</div>
</div>
```

### 3. Initialize your camera

```javascript
var myCamera = new Oculo.Camera({
    view: '#camera',
    width: 800,
    height: 400,
    dragToMove: true,
    wheelToZoom: true
}).addScene('scene1', '#scene').render();
```

## Reusable animations
Create reusable animations when your page initially loads:

```javascript
myCamera.addAnimation('zoomInOut', {
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
});

// Play your animation in the future: myCamera.play('zoomInOut');
```
## On-the-fly animations
Create on-the-fly animations when needed:

```javascript
myCamera.zoomTo(2, 1, { ease: Power2.easeOut });
```
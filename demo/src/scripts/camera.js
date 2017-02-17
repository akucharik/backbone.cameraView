'use strict';

const camera = new Oculo.Camera({
    bounds: Oculo.Camera.bounds.WORLD_EDGE,
    dragToMove: true,
    minZoom: 0.40,
    wheelToZoom: true
});

export default camera;
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

const camera = new Oculo.Camera({
    bounds: Oculo.Camera.bounds.WORLD_EDGE,
    dragToMove: true,
    minZoom: 0.40,
    wheelToZoom: true
});

export default camera;
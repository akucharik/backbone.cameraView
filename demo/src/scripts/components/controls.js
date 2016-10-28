'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React         from 'react';
import cameraActions from '../cameraActions';

const Controls = () => (
    <div>
        <button onClick={cameraActions.pause}>Pause</button>
        <button onClick={cameraActions.play}>Play</button>
        <button onClick={cameraActions.resume}>Resume</button>
    </div>
);

export default Controls;
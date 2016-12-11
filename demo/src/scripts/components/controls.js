'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React         from 'react';
import cameraActions from '../cameraActions';

const Controls = () => (
    <div className="button-group">
        <button type="button" className="button" onClick={cameraActions.pause}>Pause</button>
        <button type="button" className="button" onClick={cameraActions.play}>Play</button>
        <button type="button" className="button" onClick={cameraActions.resume}>Resume</button>
        <button type="button" className="button" onClick={cameraActions.reverse}>Reverse</button>
    </div>
);

export default Controls;
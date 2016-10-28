'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React         from 'react';
import data          from '../data/data';
import actions       from '../actions';
import cameraActions from '../cameraActions';
import Textbox       from '../containers/textbox';

const SetSizeControls = () => (
    <div>
        <div>
            <label>Width</label>
            <Textbox valueKey='width' onChange={actions.updateWidth} />
        </div>
        <div>
            <label>Height</label>
            <Textbox valueKey='height' onChange={actions.updateHeight} />
        </div>
        <div>
            <button onClick={cameraActions.setSize}>Resize</button>
        </div>
    </div>
);

export default SetSizeControls;
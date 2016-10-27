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
import DropdownList  from '../containers/dropdownList';
import Textbox       from '../containers/textbox';

const RotateToControls = () => (
    <div>
        <div>
            <label>Rotation</label>
            <Textbox valueKey='rotateToRotation' onChange={actions.updateRotateToRotation} />
        </div>
        <div>
            <label>Duration</label>
            <DropdownList items={data.durationList} valueKey='moveToDuration' onChange={actions.updateRotateToDuration} />
        </div>
        <div>
            <label>Ease</label>
            <DropdownList items={data.easeList} valueKey='moveToEase' onChange={actions.updateRotateToEase} />
        </div>
        <div>
            <button onClick={cameraActions.rotateTo}>Rotate</button>
        </div>
    </div>
);

export default RotateToControls;
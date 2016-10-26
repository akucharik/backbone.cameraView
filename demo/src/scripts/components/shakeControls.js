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

const ShakeControls = () => (
    <div>
        <div>
            <label>Intensity</label>
            <Textbox valueKey='shakeIntensity' onChange={actions.updateShakeIntensity} />
        </div>
        <div>
            <label>Duration</label>
            <Textbox valueKey='shakeDuration' onChange={actions.updateShakeDuration} />
        </div>
        <div>
            <label>Direction</label>
            <DropdownList items={data.shakeDirections} itemTextKey='text' itemValueKey='value' valueKey='shakeDirection' onChange={actions.updateShakeDirection} />
        </div>
        <div>
            <label>Ease in</label>
            <DropdownList items={data.easingList} itemTextKey='text' itemValueKey='value' valueKey='shakeEaseIn' onChange={actions.updateShakeEaseIn} />
        </div>
        <div>
            <label>Ease out</label>
            <DropdownList items={data.easingList} itemTextKey='text' itemValueKey='value' valueKey='shakeEaseOut' onChange={actions.updateShakeEaseOut} />
        </div>
        <div>
            <button onClick={cameraActions.shake}>Shake</button>
        </div>
    </div>
);

export default ShakeControls;
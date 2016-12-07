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

const AnimateControls = () => (
    <div>
        <div>
            <label>Position</label>
            <DropdownList items={data.targetList} valueKey='position' onChange={actions.updatePosition} />
        </div>
        <div>
            <label>Rotation</label>
            <Textbox valueKey='rotation' onChange={actions.updateRotation} />
        </div>
        <div>
            <label>Zoom</label>
            <Textbox valueKey='zoom' onChange={actions.updateZoom} />
        </div>
        <div>
            <label>Origin</label>
            <DropdownList items={data.targetList} valueKey='origin' onChange={actions.updateOrigin} />
        </div>
        <div>
            <label>Duration</label>
            <DropdownList items={data.durationList} valueKey='duration' onChange={actions.updateDuration} />
        </div>
        <div>
            <label>Ease</label>
            <DropdownList items={data.easeList} valueKey='ease' onChange={actions.updateEase} />
        </div>
        <div>
            <label>Shake intensity</label>
            <DropdownList items={data.shakeIntensityList} valueKey='shakeIntensity' onChange={actions.updateShakeIntensity} />
        </div>
        <div>
            <label>Shake direction</label>
            <DropdownList items={data.shakeDirectionList} valueKey='shakeDirection' onChange={actions.updateShakeDirection} />
        </div>
        <div>
            <label>Shake ease in</label>
            <DropdownList items={data.easeList} valueKey='shakeEaseIn' onChange={actions.updateShakeEaseIn} />
        </div>
        <div>
            <label>Shake ease out</label>
            <DropdownList items={data.easeList} valueKey='shakeEaseOut' onChange={actions.updateShakeEaseOut} />
        </div>
        <div>
            <button type="button" className="button" onClick={cameraActions.animate}>Animate</button>
        </div>
    </div>
);

export default AnimateControls;
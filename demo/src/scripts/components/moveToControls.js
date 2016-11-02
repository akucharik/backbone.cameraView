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

const MoveToControls = () => (
    <div>
        <div>
            <label>Position</label>
            <DropdownList items={data.targetList} valueKey='position' onChange={actions.updatePosition} />
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
            <button onClick={cameraActions.moveTo}>Move</button>
        </div>
    </div>
);

export default MoveToControls;
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
            <label>Target</label>
            <DropdownList items={data.targetList} valueKey='moveToTarget' onChange={actions.updateMoveToTarget} />
        </div>
        <div>
            <label>Duration</label>
            <DropdownList items={data.durationList} valueKey='moveToDuration' onChange={actions.updateMoveToDuration} />
        </div>
        <div>
            <label>Ease</label>
            <DropdownList items={data.easeList} valueKey='moveToEase' onChange={actions.updateMoveToEase} />
        </div>
        <div>
            <button onClick={cameraActions.moveTo}>Move</button>
        </div>
    </div>
);

export default MoveToControls;
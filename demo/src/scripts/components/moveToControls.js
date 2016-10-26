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

const MoveToControls = () => (
    <div>
        <div>
            <label>Target</label>
            <Textbox valueKey='moveToTarget' onChange={actions.updateMoveToTarget} />
        </div>
        <div>
            <label>Duration</label>
            <Textbox valueKey='moveToDuration' onChange={actions.updateMoveToDuration} />
        </div>
        <div>
            <button onClick={cameraActions.moveTo}>Move</button>
        </div>
    </div>
);

export default MoveToControls;
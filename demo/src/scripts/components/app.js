'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React         from 'react';
import data          from '../data/data';
import actions       from '../actions';
import BehaviorGroup from '../containers/behaviorGroup';
import Controls      from '../components/controls';
import DropdownList  from '../containers/dropdownList';

const App = () => (
    <div>
        <DropdownList items={data.behaviorGroups} itemTextKey='text' itemValueKey='value' valueKey='behaviorGroup' onChange={actions.updateBehaviorGroup} />
        <BehaviorGroup />
        <Controls />
    </div>
);

export default App;
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
import Properties    from '../components/properties';

const App = () => (
    <div className="row">
    <div className="medium-6 columns">
        <h3>Behavior</h3>
        <DropdownList items={data.behaviorGroups} itemTextKey='text' itemValueKey='value' valueKey='behaviorGroup' onChange={actions.updateBehaviorGroup} />
        <BehaviorGroup />
        
    </div>
    <div className="medium-6 columns">
        <h3>Play Controls</h3>
        <Controls />
    </div>
    </div>
);

export default App;
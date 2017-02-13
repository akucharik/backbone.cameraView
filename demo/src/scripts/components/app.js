'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React                from 'react';
import data                 from '../data/data';
import actions              from '../actions';
import BehaviorGroup        from '../containers/behaviorGroup';
import Controls             from '../components/controls';
import CustomDropdownList   from '../containers/customDropdownList';

const App = () => (
    <div className="row">
        <div className="demo-cpanel-behaviors">
            <CustomDropdownList 
                items={data.behaviorGroups} 
                itemTextKey='text' 
                itemValueKey='value' 
                dataKey='behaviorGroups'
                valueKey='behaviorGroup' 
                listVisibilityKey='behaviorGroupListIsVisible' 
                onClick={actions.updateBehaviorGroupListVisibility} 
                onChange={actions.updateBehaviorGroup} />
            <BehaviorGroup />
        </div>
        <div className="demo-cpanel-controls">
            <h3 className="demo-cpanel-header">Play Controls</h3>
            <Controls />
        </div>
    </div>
);

export default App;
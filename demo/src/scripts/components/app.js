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
        <div className="medium-6 columns" style={{paddingRight: '0.8em'}}>
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
        <div className="medium-6 columns" style={{paddingLeft: '0.8em'}}>
            <h3>Play Controls</h3>
            <Controls />
        </div>
    </div>
);

export default App;
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React        from 'react';
import data         from '../data/data';
import actions      from '../actions';
import DropdownList from '../containers/dropdownList';

const BehaviorGroup = ({ behaviorGroup }) => (
    <div>
        {behaviorGroup === 'effect' &&
            <DropdownList items={data.easingList} itemTextKey='text' itemValueKey='value' valueKey='shakeEaseIn' onChange={actions.updateShakeEaseIn} />
        }
        {behaviorGroup === 'effect' &&
            <DropdownList items={data.easingList} itemTextKey='text' itemValueKey='value' valueKey='shakeEaseOut' onChange={actions.updateShakeEaseOut} />
        }
    </div>
);

BehaviorGroup.propTypes = {
    behaviorGroup: React.PropTypes.string.isRequired
};

export default BehaviorGroup;
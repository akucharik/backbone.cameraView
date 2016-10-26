'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React          from 'react';
import MoveToControls from '../components/moveToControls';
import ShakeControls  from '../components/shakeControls';

const BehaviorGroup = ({ behaviorGroup }) => (
    <div>
        {behaviorGroup === 'move' &&
            <MoveToControls />
        }
        {behaviorGroup === 'effect' &&
            <ShakeControls />
        }
    </div>
);

BehaviorGroup.propTypes = {
    behaviorGroup: React.PropTypes.string.isRequired
};

export default BehaviorGroup;
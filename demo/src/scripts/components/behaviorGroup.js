'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React            from 'react';
import MoveToControls   from '../components/moveToControls';
import RotateToControls from '../components/rotateToControls';
import SetSizeControls  from '../components/setSizeControls';
import ShakeControls    from '../components/shakeControls';

const BehaviorGroup = ({ behaviorGroup }) => (
    <div>
        {behaviorGroup === 'moveTo' &&
            <MoveToControls />
        }
        {behaviorGroup === 'rotateTo' &&
            <RotateToControls />
        }
        {behaviorGroup === 'setSize' &&
            <SetSizeControls />
        }
        {behaviorGroup === 'shake' &&
            <ShakeControls />
        }
    </div>
);

BehaviorGroup.propTypes = {
    behaviorGroup: React.PropTypes.string.isRequired
};

export default BehaviorGroup;
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React            from 'react';
import AnimateControls  from '../components/animateControls';
import MoveToControls   from '../components/moveToControls';
import RotateAtControls from '../components/rotateAtControls';
import RotateToControls from '../components/rotateToControls';
import SetSizeControls  from '../components/setSizeControls';
import ShakeControls    from '../components/shakeControls';
import ZoomAtControls   from '../components/zoomAtControls';
import ZoomToControls   from '../components/zoomToControls';

const BehaviorGroup = ({ behaviorGroup }) => (
    <div>
        {behaviorGroup === 'animate' &&
            <AnimateControls />
        }
        {behaviorGroup === 'moveTo' &&
            <MoveToControls />
        }
        {behaviorGroup === 'rotateAt' &&
            <RotateAtControls />
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
        {behaviorGroup === 'zoomAt' &&
            <ZoomAtControls />
        }
        {behaviorGroup === 'zoomTo' &&
            <ZoomToControls />
        }
    </div>
);

BehaviorGroup.propTypes = {
    behaviorGroup: React.PropTypes.string.isRequired
};

export default BehaviorGroup;
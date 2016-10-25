'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import { connect }       from 'react-redux';
import actions           from '../actions';
import BehaviorGroupView from '../components/behaviorGroup';

const mapStateToProps = (state, props) => {
    return {
        behaviorGroup: state.behaviorGroup
    };
};

const BehaviorGroup = connect(mapStateToProps)(BehaviorGroupView);

export default BehaviorGroup;
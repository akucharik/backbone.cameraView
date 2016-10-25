'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import { connect }  from 'react-redux';
import actions      from '../actions';
import DropdownList from '../components/statelessdropdownlist';

const mapStateToProps = (state, ownProps) => {
    return {
        selected: state.shakeEaseIn
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        onChange: (event) => {
            dispatch(actions.updateShakeEaseIn(event.target.value));
        }
    };
};

const ShakeEaseInList = connect(mapStateToProps, mapDispatchToProps)(DropdownList);

export default ShakeEaseInList;
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import { connect }      from 'react-redux';
import actions          from '../actions';
import DropdownListView from '../components/dropdownList';

const mapStateToProps = (state, props) => {
    return {
        value: state[props.valueKey]
    };
};

const mapDispatchToProps = (dispatch, props) => {
    return {
        onChange: (event) => {
            dispatch(props.onChange(event.target.value));
        }
    };
};

const DropdownList = connect(mapStateToProps, mapDispatchToProps)(DropdownListView);

export default DropdownList;
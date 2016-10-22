'use strict';

import React        from 'react';
import ReactDOM     from 'react-dom';
import data         from './data/data';
import DropdownList from './components/dropdownlist';

const Demo = {
    data: data,
    eventHandlers: {
        onBehaviorChange: function (value) {
            console.log('changed to: ', value);
        }
    },
    DropdownList: DropdownList
};

window.Demo = Demo;

window.onload = () => ReactDOM.render(<DropdownList items={data.behaviorTypes} itemTextKey='text' itemValueKey='value' onChange={Demo.eventHandlers.onBehaviorChange} />, document.getElementById('dropdown'));
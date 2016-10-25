'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React           from 'react';
import data            from '../data/data';
import ShakeEaseInList from '../containers/shakeEaseInList';
import DropdownList    from './dropdownlist';

class App extends React.Component {
    constructor (props) {
        super(props);
    }
    
    render () {
        return (
            <div>
                <DropdownList items={data.behaviorTypes} itemTextKey='text' itemValueKey='value' />
                <ShakeEaseInList items={data.easingList} itemTextKey='text' itemValueKey='value' />
            </div>
        );
    }
}

export default App;
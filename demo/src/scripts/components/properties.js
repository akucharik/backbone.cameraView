'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React        from 'react';
import data          from '../data/data';
import actions       from '../actions';
import DropdownList from '../containers/dropdownList';

const Properties = () => (
    <div>
        <div>
            <label>Bounds</label>
            <DropdownList items={data.boundsList} valueKey='bounds' onChange={actions.updateBounds} />
        </div>
    </div>
);

export default Properties;
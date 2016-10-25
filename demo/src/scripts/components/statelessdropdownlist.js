'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React from 'react';

const DropdownList = ({ items, itemTextKey, itemValueKey, selected, onChange }) => (
    <select value={selected} onChange={onChange}> 
        {items.map(item => 
            <option key={item[itemValueKey]} value={item[itemValueKey]}> {item[itemTextKey]} </option>
        )}
    </select>
);

DropdownList.propTypes = {
    items: React.PropTypes.array.isRequired,
    itemTextKey: React.PropTypes.string,
    itemValueKey: React.PropTypes.string,
    selected: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func.isRequired
};

DropdownList.defaultProps = {
    items: [],
    itemTextKey: 'text',
    itemValueKey: 'value',
    selected: null,
    onChange: null
};

export default DropdownList;
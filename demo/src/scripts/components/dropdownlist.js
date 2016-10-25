'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React from 'react';

const DropdownList = ({ items, itemTextKey, itemValueKey, value, onChange }) => (
    <select value={value} onChange={onChange}> 
        {items.map(item => 
            <option key={item[itemValueKey]} value={item[itemValueKey]}> {item[itemTextKey]} </option>
        )}
    </select>
);

DropdownList.propTypes = {
    items: React.PropTypes.array,
    itemTextKey: React.PropTypes.string,
    itemValueKey: React.PropTypes.string,
    value: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func.isRequired
};

DropdownList.defaultProps = {
    items: [],
    itemTextKey: 'text',
    itemValueKey: 'value'
};

export default DropdownList;
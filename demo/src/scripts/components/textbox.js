'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React from 'react';

const Textbox = ({ value, onChange }) => (
    <input type="text" value={value} onChange={onChange} />
);

Textbox.propTypes = {
    value: React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string
    ]).isRequired,
    onChange: React.PropTypes.func
};

export default Textbox;
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import React from 'react';

class DropdownList extends React.Component {
    constructor (props) {
        super(props);
        
        this.state = {
            selected: this.getSelectedFromProps(this.props)
        };
        
        this.onChange = (event) => {
            if (this.props.onChange) {
                this.props.onChange.call(this, event.target.value);
            }

            this.setState({
                selected: event.target.value
            });
        };
    }
    
    getSelectedFromProps (props) {
        var selected = props.selected;
        
        if (props.selected === null && props.items.length !== 0) {
            selected = props.items[0][props.valueKey];
        }
        
        return selected;
    }
    
    select (item) {
        this.setState({
            selected: item.value
        });
    }
    
    render () {
        var items = this.props.items.map(item => <option key={item.value} value={item[this.props.itemValueKey]}> {item[this.props.itemTextKey]} </option>);
        
        return (<select onChange={this.onChange} value={this.state.selected}> {items} </select>);
    }
}

DropdownList.propTypes = {
    onChange: React.PropTypes.func,
    items: React.PropTypes.array,
    selected: React.PropTypes.string,
    textKey: React.PropTypes.string,
    valueKey: React.PropTypes.string
};

DropdownList.defaultProps = {
    onChange: null,
    items: [],
    selected: null,
    textKey: 'text',
    valueKey: 'value'
};

export default DropdownList;
'use strict';

import React        from 'react';
import ReactDOM     from 'react-dom';
import { Provider } from 'react-redux';
import actions      from './actions';
import data         from './data/data';
import reducers     from './reducers';
import store        from './store';
import App          from './components/app';
import DropdownList from './components/dropdownlist';

const Demo = {
    actions: actions,
    data: data,
    eventHandlers: {
        onBehaviorChange: function (value) {
            console.log('changed to: ', value);
        },
        onShakeEaseInChange: function (value) {
            console.log('changed to: ', value);
        },
        onShakeEaseOutChange: function (value) {
            console.log('changed to: ', value);
        },
    },
    reducers: reducers,
    store: store,
    DropdownList: DropdownList
};

window.Demo = Demo;

window.onload = () => {
    data.lookups.easing = {
        'Power0': com.greensock.easing.Power0.easeNone,
        'Power1.easeIn': com.greensock.easing.Power1.easeIn,
        'Power1.easeOut': com.greensock.easing.Power1.easeOut,
        'Power1.easeInOut': com.greensock.easing.Power1.easeInOut,
        'Power2.easeIn': com.greensock.easing.Power2.easeIn,
        'Power2.easeOut': com.greensock.easing.Power2.easeOut,
        'Power2.easeInOut': com.greensock.easing.Power2.easeInOut,
        'Power3.easeIn': com.greensock.easing.Power3.easeIn,
        'Power3.easeOut': com.greensock.easing.Power3.easeOut,
        'Power3.easeInOut': com.greensock.easing.Power3.easeInOut,
        'Power4.easeIn': com.greensock.easing.Power4.easeIn,
        'Power4.easeOut': com.greensock.easing.Power4.easeOut,
        'Power4.easeInOut': com.greensock.easing.Power4.easeInOut,
        'Back.easeIn': com.greensock.easing.Back.easeIn,
        'Back.easeOut': com.greensock.easing.Back.easeOut,
        'Back.easeInOut': com.greensock.easing.Back.easeInOut,
        'Elastic.easeIn': com.greensock.easing.Elastic.easeIn,
        'Elastic.easeOut': com.greensock.easing.Elastic.easeOut,
        'Elastic.easeInOut': com.greensock.easing.Elastic.easeInOut,
        'Bounce.easeIn': com.greensock.easing.Bounce.easeIn,
        'Bounce.easeOut': com.greensock.easing.Bounce.easeOut,
        'Bounce.easeInOut': com.greensock.easing.Bounce.easeInOut,
        'Circ.easeIn': com.greensock.easing.Circ.easeIn,
        'Circ.easeOut': com.greensock.easing.Circ.easeOut,
        'Circ.easeInOut': com.greensock.easing.Circ.easeInOut,
        'Expo.easeIn': com.greensock.easing.Expo.easeIn,
        'Expo.easeOut': com.greensock.easing.Expo.easeOut,
        'Expo.easeInOut': com.greensock.easing.Expo.easeInOut,
        'Sine.easeIn': com.greensock.easing.Sine.easeIn,
        'Sine.easeOut': com.greensock.easing.Sine.easeOut,
        'Sine.easeInOut': com.greensock.easing.Sine.easeInOut
    };
    
    console.log('state: ', store.getState());
    
    let subscription = store.subscribe(() => 
        console.log('state: ', store.getState())
    );
    
    store.dispatch(actions.updateShakeEaseIn('Back.easeIn'));
    
    ReactDOM.render(
        <Provider store={store}>
            <App />
        </Provider>, 
        document.getElementById('app')
    );
    
    ReactDOM.render(<DropdownList items={data.behaviorTypes} itemTextKey='text' itemValueKey='value' onChange={Demo.eventHandlers.onBehaviorChange} />, document.getElementById('dropdown'));
                    
    ReactDOM.render(<DropdownList items={data.easingList} itemTextKey='text' itemValueKey='value' onChange={Demo.eventHandlers.onShakeEaseInChange} />, document.getElementById('shakeEaseIn'));
                    
    ReactDOM.render(<DropdownList items={data.easingList} itemTextKey='text' itemValueKey='value' onChange={Demo.eventHandlers.onShakeEaseOutChange} />, document.getElementById('shakeEaseOut'));
}
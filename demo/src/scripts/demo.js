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
    console.log('initial state: ', store.getState());
    
    let subscription = store.subscribe(() => 
        console.log('state: ', store.getState())
    );
    
    ReactDOM.render(
        <Provider store={store}>
            <App />
        </Provider>, 
        document.getElementById('app')
    );
}
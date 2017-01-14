'use strict';

import React         from 'react';
import ReactDOM      from 'react-dom';
import { Provider }  from 'react-redux';
import actions       from './actions';
import cameraActions from './cameraActions';
import data          from './data/data';
import reducers      from './reducers';
import store         from './store';
import App           from './components/app';
import DropdownList  from './components/dropdownlist';

const Demo = {
    actions: actions,
    cameraActions: cameraActions,
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
    document.getElementById('copyrightYear').innerHTML = new Date().getFullYear();
    prettyPrint();
    
    // ScrollTo
    data.scrollItems.forEach(function (item) {
        document.querySelector(item.trigger).addEventListener('click', function () {
            event.preventDefault();
            TweenLite.to(window, 0.7, { scrollTo: item.target, ease: Power2.easeOut });
        })
    });
    
    // Periodic Table
    var pt = document.getElementById('pt');

    data.elements.forEach(function (item) {
        var htmlElement = document.createElement('div');
        htmlElement.className = 'element ' + item.metalCategory.toLowerCase();
        htmlElement.setAttribute('id', item.name);
        htmlElement.innerHTML = '<div class="element-number">' + item.atomicNumber + '</div><div class="element-symbol">' + item.symbol + '</div><div class="element-name">' + item.name + '</div><div class="element-weight">' + item.weight + '</div>';
        htmlElement.style.top = (item.col - 1) * 90 + 'px';
        htmlElement.style.left = (item.row - 1) * 75 + 'px';
        pt.appendChild(htmlElement);
    });
    
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
    
    document.addEventListener('click', function () {
        store.dispatch(actions.updateBehaviorGroupListVisibility(false));
    });
}
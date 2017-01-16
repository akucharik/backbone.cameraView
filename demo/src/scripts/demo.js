'use strict';

import debounce      from 'lodash/debounce';
import React         from 'react';
import ReactDOM      from 'react-dom';
import { Provider }  from 'react-redux';
import actions       from './actions';
import cameraActions from './cameraActions';
import data          from './data/data';
import reducers      from './reducers';
import store         from './store';
import App           from './components/app';

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
    initialize: function () {
        // Update copyright
        document.getElementById('copyrightYear').innerHTML = new Date().getFullYear();
        
        // Format code
        prettyPrint();

        // Initialize ScrollTo behavior
        data.scrollItems.forEach(function (item) {
            document.querySelector(item.trigger).addEventListener('click', function () {
                event.preventDefault();
                TweenLite.to(window, 0.7, { scrollTo: item.target, ease: Power2.easeOut });
            })
        });

        // Build periodic table
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

        // Manage camera size
        Demo.resizeCamera();
        window.addEventListener('resize', debounce(Demo.resizeCamera, 200, { maxWait: 400 }));

        console.log('initial state: ', store.getState());

        let subscription = store.subscribe(() => 
            console.log('state: ', store.getState())
        );

        document.addEventListener('click', function () {
            store.dispatch(actions.updateBehaviorGroupListVisibility(false));
        });
        
        ReactDOM.render(
            <Provider store={store}>
                <App />
            </Provider>, 
            document.getElementById('app')
        );
    },
    resizeCamera: function () {
        if (window.innerWidth >= 1024) {
            camera.setSize(600);
        }
        else {
            let rowStyle = window.getComputedStyle(camera.view.parentElement.parentElement.parentElement);
            camera.setSize(window.innerWidth - parseInt(rowStyle.paddingLeft) - parseInt(rowStyle.paddingRight));
        }
    }
};

window.Demo = Demo;
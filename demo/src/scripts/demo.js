'use strict';

import debounce      from 'lodash/debounce';
import React         from 'react';
import ReactDOM      from 'react-dom';
import { Provider }  from 'react-redux';
import actions       from './actions';
import camera        from './camera';
import cameraActions from './cameraActions';
import data          from './data/data';
import reducers      from './reducers';
import store         from './store';
import App           from './components/app';

const Demo = {
    actions: actions,
    camera: camera,
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
        
        console.log('initial state: ', store.getState());

        let subscription = store.subscribe(() => 
            console.log('state: ', store.getState())
        );

        // Hide behavior menu
        document.addEventListener('click', function () {
            store.dispatch(actions.updateBehaviorGroupListVisibility(false));
        });
        
        // Initialize React app
        ReactDOM.render(
            <Provider store={store}>
                <App />
            </Provider>, 
            document.getElementById('app')
        );
    }
};

window.Demo = Demo;
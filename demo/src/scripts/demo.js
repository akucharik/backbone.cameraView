'use strict';

import debounce      from 'lodash/debounce';
import random        from 'lodash/random';
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
        
        // Initialize background circles
        let max = 15;
        let circles = [];
        let homeBannerBkgd = document.getElementById('homeBannerBkgd');
        
//        while (max > 0) {
//            circles.push(document.createElement('div'));
//            max--;
//        }
//        
//        circles.forEach(function (item) {
//            item.classList = 'home-banner-circle';
//            
//            let scale = random(0.1, 1);
//            
//            TweenLite.set(item, {
//                opacity: random(0.01, 0.05),
//                scale: scale,
//                xPercent: -50,
//                yPercent: -50,
//                top: random(30, 110) + '%',
//                left: random(0, 100) + '%'
//            });
//            
//            homeBannerBkgd.appendChild(item);
//            
//            TweenMax.to(item, random(5, 10), { 
//                opacity: random(0.01, 0.07), 
//                delay: random(0, 3), 
//                repeat: -1, 
//                repeatDelay: random(0, 3), 
//                yoyo: true, 
//                ease: Power1.easeInOut 
//            });
//            TweenMax.to(item, random(5, 10), { 
//                scale: scale * random(0.5, 1.2), 
//                delay: random(0, 3), 
//                repeat: -1, 
//                repeatDelay: random(0, 3), 
//                yoyo: true, 
//                ease: Power1.easeInOut 
//            });
//            TweenMax.to(item, random(10, 15), { 
//                x: random(-150, 150), 
//                delay: random(0, 3), 
//                repeat: -1, 
//                repeatDelay: random(0, 3), 
//                yoyo: true, 
//                ease: Power2.easeInOut 
//            });
//            TweenMax.to(item, random(10, 15), { 
//                xPercent: random(-80, -20),
//                delay: random(0, 3), 
//                repeat: -1, 
//                repeatDelay: random(0, 3), 
//                yoyo: true, 
//                ease: Power2.easeInOut 
//            });
//            TweenMax.to(item, random(10, 15), { 
//                y: random(-150, 150), 
//                delay: random(0, 3), 
//                repeat: -1, 
//                repeatDelay: random(0, 3), 
//                yoyo: true, 
//                ease: Power2.easeInOut 
//            });
//            TweenMax.to(item, random(10, 15), { 
//                yPercent: random(-80, -20),
//                delay: random(0, 3), 
//                repeat: -1, 
//                repeatDelay: random(0, 3), 
//                yoyo: true, 
//                ease: Power2.easeInOut 
//            });
//        });
    }
};

window.Demo = Demo;
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

        // Initialize banner camera
        
        
        // Initialize demo camera
        let pt = document.getElementById('pt');

        data.elements.forEach(function (item) {
            var htmlElement = document.createElement('div');
            htmlElement.className = 'element ' + item.metalCategory.toLowerCase();
            htmlElement.setAttribute('id', item.name);
            htmlElement.innerHTML = '<div class="element-number">' + item.atomicNumber + '</div><div class="element-symbol">' + item.symbol + '</div><div class="element-name">' + item.name + '</div><div class="element-weight">' + item.weight + '</div>';
            htmlElement.style.top = (item.col - 1) * 90 + 'px';
            htmlElement.style.left = (item.row - 1) * 75 + 'px';
            pt.appendChild(htmlElement);
        });
        
        let camera = new Oculo.Camera({
            view: '#camera',
            bounds: Oculo.Camera.bounds.WORLD_EDGE,
            dragToMove: true,
            //maxZoom: 6,
            minZoom: 0.40,
            wheelToZoom: true,
            //wheelToZoomIncrement: 0.5,
            width: 600,
            height: 500
        });
        
        Demo.camera = camera;
        
        camera.addScene('scene1', '#scene1');
        camera.addScene('scene2', new Oculo.Scene(camera, '#scene2'));
        camera.addScene('scene3', '#scene3');
        camera.setScene('scene1');
        
//        camera.addAnimations([
//            { 
//              name: 'zoomTo2',
//              keyframes: [{ 
//                  zoom: 2, 
//                  duration: 2, 
//                  options: { 
//                      ease: Power2.easeIn 
//                  }
//              }, {
//                  zoom: 1,
//                  duration: 2,
//                  options: {
//                      ease: Power2.easeOut
//                  }
//              }]
//            },
//            { name: 'moveTo500',
//              animation: [
//                  { position: {x: 500, y: 500 }},
//                  { position: {x: 1000, y: 200 }}
//              ]
//            }
//        ]);
//        
//        var animations = [
//            {
//                name: 'moveTobox100',
//                type: 'animate',
//                value: {position: '#box100', rotation:-20, zoom: 1.5},
//                duration: 2
//            }
//        ];
//        
//        animations.forEach(function (item) {
//            camera.addAnimation(item.name, new Oculo.Animation(camera)[item.type](value, duration)).;
//        });
        
        camera.addAnimation('delayedZoomOut', {
          keyframes: [{ 
              zoom: 0.4, 
              duration: 0.6,
              options: {
                  ease: Power2.easeInOut,
                  delay: 0.5
              }
          }]
        });
        
        camera.addAnimation('box100', {
          keyframes: [{ 
              zoom: 0.5,
              duration: 0
          }, {
              position: '#box100',
              zoom: 2,
              duration: 1,
              options: {
                  ease: Power0.easeNone
              }
          }]
        });
        
        camera.addAnimation('box10050', {
          keyframes: [{ 
              zoom: 0.5,
              duration: 0
          }, {
              position: '#box100',
              zoom: 1.25,
              duration: 1,
              options: {
                  ease: Power0.easeNone
              }
          }]
        });
        
        camera.addAnimation('two', {
          keyframes: [{ 
              zoom: 2, 
              duration: 2, 
              options: { 
                  ease: Power2.easeIn 
              }
          }, {
              zoom: 1,
              duration: 2,
              options: {
                  ease: Power2.easeOut
              }
          }]
        });
        
        camera.addAnimation('invariant', {
          keyframes: [{ 
              origin: {x: 0, y: 0},
              position: {x: 0, y: 0},
              rotation: 0,
              zoom: 1, 
              duration: 0
          }, {
              zoom: 2,
              duration: 2,
              options: {
                  ease: Power2.easeOut
              }
          }]
        });
        
        //camera.addAnimation('moveTobox100', { duration: 2, position: '#box100', rotation:-20, zoom: 1.5 });
        camera.addAnimation('moveTobox100', new Oculo.Animation(camera).animate({position: {x:200, y:200}}, 1).animate({position: '#box100', rotation:-20, zoom: 2}, 2));
        camera.addAnimation('moveTo2000', new Oculo.Animation(camera).animate({position: {x:2000, y:500}, zoom: 1.5}, 2));
        camera.addAnimation('moveTo800Slow', new Oculo.Animation(camera).animate({position: {x:800}, zoom: 1.5}, 8));
        camera.addAnimation('rotateAt200', new Oculo.Animation(camera).rotateAt({x:200, y:200}, -50, 5));
        camera.addAnimation('rotateTo20', new Oculo.Animation(camera).rotateTo(-20, 2));
        camera.addAnimation('shakeEaseNone', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH));
        camera.addAnimation('shakeEase', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH, { ease: Power2.easeIn }));
        camera.addAnimation('shakeEaseIn', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH, { easeIn: Power2.easeIn }));
        camera.addAnimation('shakeEaseOut', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH, { easeOut: Power2.easeOut }));
        camera.addAnimation('shakeEaseInOut', new Oculo.Animation(camera).shake(0.1, 4, Oculo.Animation.shake.direction.BOTH, { easeIn: Power2.easeIn, easeOut: Power2.easeOut }));
        camera.addAnimation('shakeNoBounds', new Oculo.Animation(camera).shake(0.1, 2, Oculo.Animation.shake.direction.BOTH, { enforceBounds: false }));
        camera.addAnimation('zoomAt100', new Oculo.Animation(camera).zoomAt({x:100, y:100}, 2, 2));
        camera.addAnimation('zoomTo50', new Oculo.Animation(camera).zoomTo(0.5, 2));
        camera.addAnimation('zoomTo200', new Oculo.Animation(camera).zoomTo(2, 2));
        camera.addAnimation('instantZoom', new Oculo.Animation(camera).zoomTo(2, 0));
        camera.addAnimation('instantShake', new Oculo.Animation(camera).shake(0.1, 0));
        camera.addAnimation('backAndForth', new Oculo.Animation(camera).animate({position: '#box100', rotation:20, zoom: 1.5}, 1.5, {ease: Power4.easeOut}).animate({position: 'previous', rotation: 'previous', zoom: 'previous'}, 1.5, {ease: Power3.easeOut}));
        
        camera.addAnimation('moveTo0001', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 0.166}, 61, {ease: Power0.easeNone}));
        camera.addAnimation('moveTo0005', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 0.5}, 61, {ease: Power0.easeNone}));
        camera.addAnimation('moveTo0006', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 0.666}, 61, {ease: Power0.easeNone}));
        camera.addAnimation('moveTo001', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 1}, 61, {ease: Power0.easeNone}));
        camera.addAnimation('moveTo0015', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 1.5}, 61, {ease: Power0.easeNone}));
        camera.addAnimation('moveTo002', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 2}, 61, {ease: Power0.easeNone}));
        camera.addAnimation('moveTo006', new Oculo.Animation(camera, {useFrames: true}).animate({position: {x:0,y:0}, zoom: 6}, 61, {ease: Power0.easeNone}));
        
        // Manage camera size
        resizeCamera();
        window.addEventListener('resize', debounce(resizeCamera, 200, { maxWait: 400 }));

        camera.render();
        camera.animate({position: {x:675,y:450}, zoom:2}, 0, {onComplete: function () { this.camera.play('delayedZoomOut'); }});
        
        // 
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
        
        // Private functions
        function resizeCamera () {
            if (window.innerWidth >= 1024) {
                camera.setSize(600);
            }
            else {
                let rowStyle = window.getComputedStyle(camera.view.parentElement.parentElement.parentElement);
                camera.setSize(window.innerWidth - parseInt(rowStyle.paddingLeft) - parseInt(rowStyle.paddingRight));
            }
        }
    }
};

window.Demo = Demo;
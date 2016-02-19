'use strict';

QUnit.module('camera', function () {
    QUnit.module('_getElementFocus', {
        beforeEach: function() {
            this.view = CameraView({
                className: 'bcv-camera',
                template: _.template('<div><div id="focusElement" style="width: 100px; height: 200px; position: absolute; left: 0px; top: 0px;"></div></div>'),
                model: CameraModel({
                    height: 500,
                    width: 1000
                }),
                onBeforeRender: function () {
                    this.el.innerHTML = this.template();
                }
            }).render();
            document.getElementById('qunit-fixture').appendChild(this.view.el);
            
            this.focusElement = document.getElementById('focusElement');
        },
        afterEach: function() {
            this.view.remove();
        }}, function () {
        
        QUnit.test('scale: 0.7, offset: 100px', function(assert) {
            this.view.content.style.transform = 'scale(0.7)';
            this.view.content.style.left = '100px';
            this.view.content.style.top = '100px';
            assert.deepEqual(this.view._getElementFocus(this.focusElement, this.view.content, 0.7), { x: 50, y: 100 });
        });
        
        QUnit.test('scale: 1, offset: 0px', function(assert) {
            this.view.content.style.transform = 'scale(1)';
            this.view.content.style.left = '0px';
            this.view.content.style.top = '0px';
            assert.deepEqual(this.view._getElementFocus(this.focusElement, this.view.content, 1), { x: 50, y: 100 });
        });
        
        QUnit.test('scale: 1.3, offset: 200px', function(assert) {
            this.view.content.style.transform = 'scale(1.3)';
            this.view.content.style.left = '200px';
            this.view.content.style.top = '200px';
            assert.deepEqual(this.view._getElementFocus(this.focusElement, this.view.content, 1.3), { x: 50, y: 100 });
        });
    });
    
    QUnit.module('_getFocusOffset', {
        beforeEach: function() {
            this.view = CameraView({
                className: 'bcv-camera',
                template: _.template('<div><div id="focusElement" style="width: 100px; height: 200px; position: absolute; left: 0px; top: 0px;"></div></div>'),
                model: CameraModel({
                    height: 500,
                    width: 1000
                }),
                onBeforeRender: function () {
                    this.el.innerHTML = this.template();
                }
            }).render();
            document.getElementById('qunit-fixture').appendChild(this.view.el);
            
            this.focusPoint = { x: 300, y: 150};
            this.focusElement = document.getElementById('focusElement');
        },
        afterEach: function() {
            this.view.remove();
        }}, function () {
    
        QUnit.test('Point: scale: 1-0.7', function(assert) {
            this.view.content.style.transform = 'scale(1)';
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 1, 0.7), { x: 290, y: 145 });
        });
        
        QUnit.test('Point: scale: 1-1', function(assert) {
            this.view.content.style.transform = 'scale(1)';
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 1, 1), { x: 200, y: 100 });
        });
        
        QUnit.test('Point: scale: 1-1.3', function(assert) {
            this.view.content.style.transform = 'scale(1)';
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 1, 1.3), { x: 110, y: 55 });
        });
        
        QUnit.test('Element: scale: 1-0.7', function(assert) {
            this.view.content.style.transform = 'scale(1)';
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 1, 0.7), { x: 465, y: 180 });
        });
        
        QUnit.test('Element: scale: 1-1', function(assert) {
            this.view.content.style.transform = 'scale(1)';
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 1, 1), { x: 450, y: 150 });
        });
        
        QUnit.test('Element: scale: 1-1.3', function(assert) {
            this.view.content.style.transform = 'scale(1)';
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 1, 1.3), { x: 435, y: 120 });
        });
    });
    
    QUnit.module('_onTransitionEnd', {
        beforeEach: function() {
            this.view = CameraView({
                template: _.template('<div></div>'),
                model: CameraModel(),
                onBeforeRender: function () {
                    this.el.innerHTML = this.template();
                }
            }).render();
            document.getElementById('qunit-fixture').appendChild(this.view.el);
        },
        afterEach: function() {
            this.view.remove();
        }}, function () {
        
        QUnit.test('transition has ended', function(assert) {
            this.view.isTransitioning = true;
            this.view._onTransitionEnd();
            assert.equal(this.view.isTransitioning, false);
        });
    });
});
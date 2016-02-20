'use strict';

QUnit.module('focuser', function () {
    QUnit.module('getElementFocus', {
        beforeEach: function() {
            document.getElementById('qunit-fixture').innerHTML = '<div id="container"><div id="element" style="width: 100px; height: 200px; position: absolute; left: 0px; top: 0px;"></div></div>';
            this.container = document.getElementById('container');
            this.element = document.getElementById('element');
            this.focuser = Focuser();
        }}, function () {
        
        QUnit.test('scale: 0.7, offset: 100px', function(assert) {
            this.container.style.transform = 'scale(0.7)';
            this.container.style.left = '100px';
            this.container.style.top = '100px';
            assert.deepEqual(this.focuser.getElementFocus(this.container, this.element, 0.7), { x: 50, y: 100 });
        });
        
        QUnit.test('scale: 1, offset: 0px', function(assert) {
            this.container.style.transform = 'scale(1)';
            this.container.style.left = '0px';
            this.container.style.top = '0px';
            assert.deepEqual(this.focuser.getElementFocus(this.container, this.element, 1), { x: 50, y: 100 });
        });
        
        QUnit.test('scale: 1.3, offset: 200px', function(assert) {
            this.container.style.transform = 'scale(1.3)';
            this.container.style.left = '200px';
            this.container.style.top = '200px';
            assert.deepEqual(this.focuser.getElementFocus(this.container, this.element, 1.3), { x: 50, y: 100 });
        });
    });
    
    QUnit.module('getFocusOffset', {
        beforeEach: function() {
            document.getElementById('qunit-fixture').innerHTML = '<div id="frame" style="height: 500px; width: 1000px;"><div id="container"><div id="element" style="width: 100px; height: 200px; position: absolute; left: 0px; top: 0px;"></div></div></div>';
            this.frame = document.getElementById('frame');
            this.container = document.getElementById('container');
            this.element = document.getElementById('element');
            this.point = { x: 300, y: 150};
            this.focuser = Focuser();
        }}, function () {
    
        QUnit.test('Point: scale: 1-0.7', function(assert) {
            this.container.style.transform = 'scale(1)';
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.container, this.point, 0.7, 1), { x: 290, y: 145 });
        });
        
        QUnit.test('Point: scale: 1-1', function(assert) {
            this.container.style.transform = 'scale(1)';
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.container, this.point, 1, 1), { x: 200, y: 100 });
        });
        
        QUnit.test('Point: scale: 1-1.3', function(assert) {
            this.container.style.transform = 'scale(1)';
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.container, this.point, 1.3, 1), { x: 110, y: 55 });
        });
        
        QUnit.test('Element: scale: 1-0.7', function(assert) {
            this.container.style.transform = 'scale(1)';
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.container, this.element, 0.7, 1), { x: 465, y: 180 });
        });
        
        QUnit.test('Element: scale: 1-1', function(assert) {
            this.container.style.transform = 'scale(1)';
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.container, this.element, 1, 1), { x: 450, y: 150 });
        });
        
        QUnit.test('Element: scale: 1-1.3', function(assert) {
            this.container.style.transform = 'scale(1)';
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.container, this.element, 1.3, 1), { x: 435, y: 120 });
        });
    });
});
'use strict';

QUnit.module('focuser', function () {
    QUnit.module('getElementFocus', {
        beforeEach: function() {
            this.focuser = Focuser();
        }}, function () {
        
        QUnit.test('scroll: 100, scale: 0.7, offset: 100', function(assert) {
            this.window = {
                scrollX: 100,
                scrollY: 100
            };
            this.scale = 0.7;
            this.containerRect = {
                left: 100,
                top: 100,
                height: 500 * this.scale,
                width: 1000 * this.scale
            };
            this.elRect = {
                left: 100,
                top: 100,
                height: 200 * this.scale,
                width: 100 * this.scale
            };
            
            assert.deepEqual(this.focuser.getElementFocus(this.window, this.containerRect, this.elRect, this.scale), { x: 50, y: 100 });
        });
        
        QUnit.test('scroll: 0, scale: 1, offset: 0', function(assert) {
            this.window = {
                scrollX: 0,
                scrollY: 0
            };
            this.scale = 1;
            this.containerRect = {
                left: 0,
                top: 0,
                height: 500 * this.scale,
                width: 1000 * this.scale
            };
            this.elRect = {
                left: 0,
                top: 0,
                height: 200 * this.scale,
                width: 100 * this.scale
            };
            
            assert.deepEqual(this.focuser.getElementFocus(this.window, this.containerRect, this.elRect, this.scale), { x: 50, y: 100 });
        });
        
        QUnit.test('scroll: 200, scale: 1.3, offset: 200', function(assert) {
            this.window = {
                scrollX: 200,
                scrollY: 200
            };
            this.scale = 1.3;
            this.containerRect = {
                left: 200,
                top: 200,
                height: 500 * this.scale,
                width: 1000 * this.scale
            };
            this.elRect = {
                left: 200,
                top: 200,
                height: 200 * this.scale,
                width: 100 * this.scale
            };
            
            assert.deepEqual(this.focuser.getElementFocus(this.window, this.containerRect, this.elRect, this.scale), { x: 50, y: 100 });
        });
    });
    
    QUnit.module('getFocusOffset', {
        beforeEach: function() {
            this.focuser = Focuser();
            this.frame = { 
                height: 500, 
                width: 1000
            };
            this.position = { 
                x: 300, 
                y: 150
            };
        }}, function () {
    
        QUnit.test('scale: 0.7', function(assert) {
            this.scale = 0.7;
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.position, this.scale), { x: 290, y: 145 });
        });
        
        QUnit.test('scale: 1', function(assert) {
            this.scale = 1;
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.position, this.scale), { x: 200, y: 100 });
        });
        
        QUnit.test('scale: 1.3', function(assert) {
            this.scale = 1.3;
            assert.deepEqual(this.focuser.getFocusOffset(this.frame, this.position, this.scale), { x: 110, y: 55 });
        });
    });
});
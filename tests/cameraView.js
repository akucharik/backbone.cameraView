'use strict';

QUnit.module('camera', function () {
    QUnit.module('_getFocusOffset', {
        beforeEach: function() {
            this.view = CameraView({
                className: 'bcv-camera',
                template: _.template('<div><div id="focusElement" style="width: 100px; height: 200px; position: absolute; left: 100px; top: 100px;"></div></div>'),
                model: CameraModel({
                    state: {
                        scale: 1,
                        focus: {
                            x: 0,
                            y: 0
                        }, 
                        transition: {
                            duration: '0s'
                        }
                    }
                }),
                width: 1000,
                height: 500
            });
            document.getElementById('qunit-fixture').appendChild(this.view.el);
            
            this.focusPoint = { x: 300, y: 150};
            this.focusElement = document.getElementById('focusElement');
        },
        afterEach: function() {
            this.view.remove();
        }}, function () {
    
        QUnit.test('Point at 70%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 0.7), { x: 290, y: 145 });
        });
        
        QUnit.test('Point at 100%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 1), { x: 200, y: 100 });
        });
        
        QUnit.test('Point at 130%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 1.3), { x: 110, y: 55 });
        });
        /*
        QUnit.test('Element at 70%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 0.7), { x: 350, y: 50 });
        });
        
        QUnit.test('Element at 100%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 1), { x: 350, y: 50 });
        });
        
        QUnit.test('Element at 130%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 1.3), { x: 350, y: 50 });
        });
        */
    });
});
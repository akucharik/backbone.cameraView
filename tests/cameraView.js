'use strict';

QUnit.module('camera', function () {
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
    
        QUnit.test('Point from 100% - 70%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 1, 0.7), { x: 290, y: 145 });
        });
        
        QUnit.test('Point from 100% - 100%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 1, 1), { x: 200, y: 100 });
        });
        
        QUnit.test('Point from 100% - 130%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusPoint, 1, 1.3), { x: 110, y: 55 });
        });
        
        QUnit.test('Element from 100% - 70%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 1, 0.7), { x: 465, y: 180 });
        });
        
        QUnit.test('Element from 100% - 100%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 1, 1), { x: 450, y: 150 });
        });
        
        QUnit.test('Element from 100% - 130%', function(assert) {
            assert.deepEqual(this.view._getFocusOffset(this.focusElement, 1, 1.3), { x: 435, y: 120 });
        });
    });
});
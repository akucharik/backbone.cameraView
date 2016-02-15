'use strict';

QUnit.module('camera', {
    beforeEach: function() {
        this.view = CameraView({
            className: 'bcv-camera',
            template: _.template('<div></div>'),
            model: CameraModel({
                state: {
                    scale: 1,
                    focus: {
                        x: 0,
                        y: 0
                    }
                }
            }),
            width: 1000,
            height: 500
        });
        document.getElementById('qunit-fixture').appendChild(this.view.el);
    },
    afterEach: function() {
        this.view.remove();
    }}, function () {
    
    QUnit.test('_getFocalOffset', function(assert) {
        let _this = this;
        let focus, scale, expected;

        function run (focus, scale, expected) {
            assert.deepEqual(_this.view._getFocalOffset(focus, scale), expected);    
        }

        focus = { x: 300, y: 150};
        
        scale = 0.7;
        expected = { x: 290, y: 145};
        run(focus, scale, expected);
        
        scale = 1;
        expected = { x: 200, y: 100};
        run(focus, scale, expected);
        
        scale = 1.3;
        expected = { x: 110, y: 55};
        run(focus, scale, expected);
    });
});
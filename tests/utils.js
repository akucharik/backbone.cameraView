'use strict';

QUnit.module('utils', function () {
    QUnit.module('css', {
        beforeEach: function() {
            this.el = document.createElement('div');
            document.getElementById('qunit-fixture').appendChild(this.el);
        }}, function () {
        
        QUnit.test('setCssTransition', function(assert) {
            let _this = this;
            let delay = '0.5s';
            let duration = '1s';
            let timingFunction = 'ease-out';

            utils.setCssTransition(_this.el, {
                delay: delay,
                duration: duration,
                timingFunction: timingFunction
            });

            assert.equal(_this.el.style.transitionDelay, delay);
            assert.equal(_this.el.style.transitionDuration, duration);
            assert.equal(_this.el.style.transitionTimingFunction, timingFunction);
        });

        QUnit.test('getCssTransform', function(assert) {
            let _this = this;
            let expected, value;

            function css (expected) {
                assert.deepEqual(utils.getCssTransform(_this.el), expected);    
            }

            expected = ['none'];
            css(expected);

            _this.el.style.transform = 'matrix(1,0,0,1,0,0)';
            expected = ['1','0','0','1','0','0'];
            css(expected);
        });
    });
});
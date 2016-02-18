'use strict';

QUnit.module('utils', function () {
    QUnit.module('css', {
        beforeEach: function() {
            this.el = document.createElement('div');
            document.getElementById('qunit-fixture').appendChild(this.el);
        }}, function () {
        
        QUnit.test('getCssTransform', function(assert) {
            let _this = this;
            let expected;

            function clean () {
                _this.el.style.removeProperty('transform');
            }
            
            function run (expected) {
                assert.deepEqual(utils.getCssTransform(_this.el), expected);
                clean();
            }

            // Case: None
            expected = ['none'];
            run(expected);
            
            // Case: Matrix
            _this.el.style.transform = 'matrix(2, 0, 0, 2, 200, 200)';
            expected = ['2','0','0','2','200','200'];
            run(expected);
        });
        
        
        // TODO: Write separate test for - assert.equal(tracker.isTransitioning, true);
        QUnit.test('setCssTransform', function(assert) {
            let _this = this;
            let expected, options;
            let tracker = {};

            function clean () {
                _this.el.style.removeProperty('transform');
            }
            
            function run (options, expected) {
                utils.setCssTransform(_this.el, options, tracker);
                assert.equal(_this.el.style.transform, expected);
                clean();
            }

            // Case: scaleX
            options = {
                scaleX: 2
            };
            expected = 'matrix(2, 0, 0, 1, 0, 0)';
            run(options, expected);
            
            // Case: scaleY
            options = {
                scaleY: 2
            };
            expected = 'matrix(1, 0, 0, 2, 0, 0)';
            run(options, expected);
            
            // Case: translateX
            options = {
                translateX: 200
            };
            expected = 'matrix(1, 0, 0, 1, 200, 0)';
            run(options, expected);
            
            // Case: translateY
            options = {
                translateY: 200
            };
            expected = 'matrix(1, 0, 0, 1, 0, 200)';
            run(options, expected);
            
            // Case: All paired properties
            options = {
                scale: 2,
                translate: 200
            };
            expected = 'matrix(2, 0, 0, 2, 200, 200)';
            run(options, expected);
            
            // Case: All individual properties
            options = {
                scaleX: 1,
                scaleY: 2,
                translateX: 3,
                translateY: 4
            };
            expected = 'matrix(1, 0, 0, 2, 3, 4)';
            run(options, expected);
        });
        
        QUnit.test('setCssTransition', function(assert) {
            let _this = this;
            let expected, options;

            function clean () {
                _this.el.style.removeProperty('transition-delay');
                _this.el.style.removeProperty('transition-duration');
                _this.el.style.removeProperty('transition-property');
                _this.el.style.removeProperty('transition-timing-function');
            }
            
            function run (options, expected) {
                utils.setCssTransition(_this.el, options);
                assert.equal(_this.el.style.transitionDelay, expected.delay);
                assert.equal(_this.el.style.transitionDuration, expected.duration);
                assert.equal(_this.el.style.transitionProperty, expected.property);
                assert.equal(_this.el.style.transitionTimingFunction, expected.timingFunction);
                clean();
            }

            // Case: None
            options = {};
            expected = {
                delay: '0s',
                duration: '0s',
                property: 'all',
                timingFunction: 'ease'
            };
            run(options, expected);
            
            // Case: Delay
            options = {
                delay: '1s'
            };
            expected = {
                delay: '1s',
                duration: '0s',
                property: 'all',
                timingFunction: 'ease'
            };
            run(options, expected);
            
            // Case: Duration
            options = {
                duration: '200ms'
            };
            expected = {
                delay: '0s',
                duration: '200ms',
                property: 'all',
                timingFunction: 'ease'
            };
            run(options, expected);
            
            // Case: Property
            options = {
                property: 'transform'
            };
            expected = {
                delay: '0s',
                duration: '0s',
                property: 'transform',
                timingFunction: 'ease'
            };
            run(options, expected);
            
            // Case: All
            options = {
                delay: '1s',
                duration: '200ms',
                property: 'transform',
                timingFunction: 'ease-out'
            };
            expected = options;
            run(options, expected);
            
            // Case: Bogus
            options = {
                bogus: 'bogus',
                delay: '1',
                duration: 1,
                property: 'bogus',
                timingFunction: 'bogus'
            };
            expected = {
                delay: '',
                duration: '',
                property: 'bogus',
                timingFunction: ''
            };
            run(options, expected);
        });
        
    });
});
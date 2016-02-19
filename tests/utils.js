'use strict';

QUnit.module('utils', {
    beforeEach: function() {
        this.el = document.createElement('div');
        document.getElementById('qunit-fixture').appendChild(this.el);
    }}, function () {
    QUnit.module('getCssTransform', function () {
        
        QUnit.test('none', function(assert) {
            assert.deepEqual(utils.getCssTransform(this.el), ['none']);
        });
            
        QUnit.test('matrix', function(assert) {
            this.el.style.transform = 'matrix(2, 0, 0, 2, 200, 200)';
            assert.deepEqual(utils.getCssTransform(this.el), ['2','0','0','2','200','200']);
        });
    });
    
    QUnit.module('setCssTransform', {
        beforeEach: function() {
            this.transitionTracker = {};
        }}, function () {
        
        QUnit.test('scaleX', function(assert) {
            utils.setCssTransform(this.el, {
                scaleX: 2
            });
            assert.equal(this.el.style.transform, 'matrix(2, 0, 0, 1, 0, 0)');
        });
        
        QUnit.test('scaleY', function(assert) {
            utils.setCssTransform(this.el, {
                scaleY: 2
            });
            assert.equal(this.el.style.transform, 'matrix(1, 0, 0, 2, 0, 0)');
        });

        QUnit.test('translateX', function(assert) {
            utils.setCssTransform(this.el, {
                translateX: 200
            });
            assert.equal(this.el.style.transform, 'matrix(1, 0, 0, 1, 200, 0)');
        });
            
        QUnit.test('translateY', function(assert) {
            utils.setCssTransform(this.el, {
                translateY: 200
            });
            assert.equal(this.el.style.transform, 'matrix(1, 0, 0, 1, 0, 200)');
        });
            
        QUnit.test('scale, translate', function(assert) {
            utils.setCssTransform(this.el, {
                scale: 2,
                translate: 200
            });
            assert.equal(this.el.style.transform, 'matrix(2, 0, 0, 2, 200, 200)');
        });
            
        QUnit.test('scaleX, scaleY, translateX, translateY', function(assert) {
            utils.setCssTransform(this.el, {
                scaleX: 1,
                scaleY: 2,
                translateX: 3,
                translateY: 4
            });
            assert.equal(this.el.style.transform, 'matrix(1, 0, 0, 2, 3, 4)');
        });
        
        QUnit.test('transition > 0s', function(assert) {
            this.el.style.transitionDuration = '1s';
            utils.setCssTransform(this.el, {}, this.transitionTracker);
            assert.equal(this.transitionTracker.isTransitioning, true);
        });
        
        QUnit.test('transition === 0s', function(assert) {
            utils.setCssTransform(this.el, {}, this.transitionTracker);
            assert.equal(this.transitionTracker.isTransitioning, false);
        });

    });
    
    QUnit.module('setCssTransition', function () {
        QUnit.test('no transition', function(assert) {
            utils.setCssTransition(this.el, {});
            assert.equal(this.el.style.transitionDelay, '0s');
            assert.equal(this.el.style.transitionDuration, '0s');
            assert.equal(this.el.style.transitionProperty, 'all');
            assert.equal(this.el.style.transitionTimingFunction, 'ease');
        });
        
        QUnit.test('delay', function(assert) {
            utils.setCssTransition(this.el, {
                delay: '1s'
            });
            assert.equal(this.el.style.transitionDelay, '1s');
            assert.equal(this.el.style.transitionDuration, '0s');
            assert.equal(this.el.style.transitionProperty, 'all');
            assert.equal(this.el.style.transitionTimingFunction, 'ease');
        });
        
        QUnit.test('duration', function(assert) {
            utils.setCssTransition(this.el, {
                duration: '200ms'
            });
            assert.equal(this.el.style.transitionDelay, '0s');
            assert.equal(this.el.style.transitionDuration, '200ms');
            assert.equal(this.el.style.transitionProperty, 'all');
            assert.equal(this.el.style.transitionTimingFunction, 'ease');
        });
        
        QUnit.test('property', function(assert) {
            utils.setCssTransition(this.el, {
                property: 'transform'
            });
            assert.equal(this.el.style.transitionDelay, '0s');
            assert.equal(this.el.style.transitionDuration, '0s');
            assert.equal(this.el.style.transitionProperty, 'transform');
            assert.equal(this.el.style.transitionTimingFunction, 'ease');
        });
        
        QUnit.test('timingFunction', function(assert) {
            utils.setCssTransition(this.el, {
                timingFunction: 'ease-out'
            });
            assert.equal(this.el.style.transitionDelay, '0s');
            assert.equal(this.el.style.transitionDuration, '0s');
            assert.equal(this.el.style.transitionProperty, 'all');
            assert.equal(this.el.style.transitionTimingFunction, 'ease-out');
        });

        QUnit.test('delay, duration, property, timingFunction', function(assert) {
            utils.setCssTransition(this.el, {
                delay: '1s',
                duration: '200ms',
                property: 'transform',
                timingFunction: 'ease-out'
            });
            assert.equal(this.el.style.transitionDelay, '1s');
            assert.equal(this.el.style.transitionDuration, '200ms');
            assert.equal(this.el.style.transitionProperty, 'transform');
            assert.equal(this.el.style.transitionTimingFunction, 'ease-out');
        });
        
        QUnit.test('delay, duration, property, timingFunction (bogus values)', function(assert) {
            utils.setCssTransition(this.el, {
                bogus: 'bogus',
                delay: '1',
                duration: 1,
                property: 'bogus',
                timingFunction: 'bogus'
            });
            assert.equal(this.el.style.transitionDelay, '');
            assert.equal(this.el.style.transitionDuration, '');
            assert.equal(this.el.style.transitionProperty, 'bogus');
            assert.equal(this.el.style.transitionTimingFunction, '');
        });
    });
    
    QUnit.module('throttleToFrame', {
        beforeEach: function() {
            this.count = 0;
            this.func = function () { this.count++; }
            this.throttled = utils.throttleToFrame(this.func);    
        }}, function () {
        
        QUnit.test('return a throttled function', function(assert) {
            assert.equal(_.isFunction(this.throttled), true);
        });
        
        QUnit.test('throttled function runs only once per animation frame', function(assert) {
            var _this = this;
            var done = assert.async(2);
            
            this.throttled();
            this.throttled();
            
            window.setTimeout(function () {
                assert.equal(_this.count, 1);
                done();
                _this.throttled();
                _this.throttled();
            }, 50);
            
            window.setTimeout(function () {
                assert.equal(_this.count, 2);
                done();
            }, 100);
        });
    });
});
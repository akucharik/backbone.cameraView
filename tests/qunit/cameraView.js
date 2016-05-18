'use strict';

QUnit.module('camera', function () {    
    QUnit.module('_onTransitionEnd', {
        beforeEach: function() {
            this.view = new CameraView({
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
        
//        QUnit.test('transition has ended', function(assert) {
//            this.view.isTransitioning = true;
//            this.view._onTransitionEnd();
//            assert.equal(this.view.isTransitioning, false);
//        });
    });
});
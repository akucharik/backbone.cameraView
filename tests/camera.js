'use strict';

import { 
    beforeEach, 
    describe as test, 
    it as assert } from 'mocha';
import { expect }  from 'chai';
import Backbone    from 'backbone';
import Camera      from '../src/scripts/camera';
import Matrix2     from '../src/scripts/math/matrix2';
import Vector2     from '../src/scripts/math/vector2';
    
test('Camera', function() {
    var c;

    beforeEach('Instantiate a new camera', function() {
        c = new Camera({
            draggable: false,
            width: 1000,
            height: 500
        });
        
        c.animation = null;
    });
    
    afterEach('Clean up camera', function() {
        c.destroy();
    });

    test('bounds', function() {
        assert('should have no bounds', function() {
            c.bounds = null;
            expect(c.bounds).to.be.null;
            expect(c.hasBounds).to.be.false;
            expect(c.minX).to.be.null;
            expect(c.minY).to.be.null;
            expect(c.maxX).to.be.null;
            expect(c.maxY).to.be.null;
        });
        
        assert('should calculate bounds', function() {
            c.setSize(1000, 500);
            c.bounds = function () {
                return {
                    minX: this.viewportCenter.x,
                    minY: this.viewportCenter.y,
                    maxX: this.sceneWidth - this.viewportCenter.x,
                    maxY: this.sceneHeight - this.viewportCenter.y
                }
            };
            expect(c.bounds).to.be.a('function');
            expect(c.hasBounds).to.be.true;
            expect(c.minX).to.equal(500);
            expect(c.minY).to.equal(250);
            expect(c.maxX).to.equal(-500);
            expect(c.maxY).to.equal(-250);
        });
    });
    
    test('isAnimating', function() {
        assert('should not be animating if camera has no animation', function() {
            expect(c.isAnimating).to.be.false;
        });
    });
    
    test('isDragEnabled', function() {
        assert('should not be enabled if camera has no drag capability', function() {
            expect(c.isDragEnabled).to.be.false;
        });
    });
    
    test('isPaused', function() {
        assert('should not be paused if camera has no animation', function() {
            expect(c.isPaused).to.be.false;
        });
    });
    
    test('manual zoom', function() {
        assert('should disable manual zoom', function() {
            c.isManualZoomEnabled = true;
            c.disableManualZoom();
            expect(c.isManualZoomEnabled).to.be.false;
        });
        
        assert('should enable manual zoom', function() {
            c.isManualZoomEnabled = false;
            c.enableManualZoom();
            expect(c.isManualZoomEnabled).to.be.true;
        });
    });
    
    test('_calculatePosition', function() {
        assert('should calculate the position of the camera', function() {
            var position;
            
            c.zoom = 1.5;
            c.rotation = -20;
            position = c._calculatePosition(new Vector2(-397, -224), c.viewportCenter, new Vector2(500, 250), c.sceneTransformation);
            expect(Math.round(position.x)).to.equal(200);
            expect(Math.round(position.y)).to.equal(200);
            
            c.zoom = 1.5;
            c.rotation = -20;
            position = c._calculatePosition(new Vector2(-300, -50), c.viewportCenter, new Vector2(200, 200), c.sceneTransformation);
            expect(Math.round(position.x)).to.equal(200);
            expect(Math.round(position.y)).to.equal(200);
            
            c.zoom = 1;
            c.rotation = -20;
            position = c._calculatePosition(new Vector2(0, 0), c.viewportCenter, new Vector2(200, 200), c.sceneTransformation);
            expect(Math.round(position.x)).to.equal(499);
            expect(Math.round(position.y)).to.equal(144);
        });
    }); 
    
    test('_clampZoom', function() {
        assert('should return the clamped zoom', function() {
            var zoom;
            c.minZoom = 0.5;
            c.maxZoom = 5;
            
            zoom = c._clampZoom(0.49);
            expect(zoom).to.equal(0.5);
            
            zoom = c._clampZoom(0.5);
            expect(zoom).to.equal(0.5);
            
            zoom = c._clampZoom(5.1);
            expect(zoom).to.equal(5);
            
            zoom = c._clampZoom(5);
            expect(zoom).to.equal(5);
            
            zoom = c._clampZoom(2);
            expect(zoom).to.equal(2);
        });
    });
    
    test('setSize', function() {
        assert('should set its width and height to the provided values', function() {
            c.setSize(100, 100);
            expect(c.width).to.equal(100);
            expect(c.height).to.equal(100);
            
            c.setSize(200, null);
            expect(c.width).to.equal(200);
            expect(c.height).to.equal(100);
            
            c.setSize(null, 200);
            expect(c.width).to.equal(200);
            expect(c.height).to.equal(200);
        });
        
        assert('should trigger a "change:size" event', function() {
            var changed = false;
            c.listenTo(c, 'change:size', function () { changed = true; });
            
            c.setSize(300, 300);
            expect(changed).to.be.true;
            
            changed = false;
            c.setSize(400, 300);
            expect(changed).to.be.true;
            
            changed = false;
            c.setSize(300, 400);
            expect(changed).to.be.true;
        });
        
        assert('should not trigger a "change:size" event', function() {
            var changed = false;
            c.listenTo(c, 'change:size', function () { changed = true; });
            
            c.setSize(1000, 500);
            expect(changed).to.be.false;
            
            c.setSize(null, null);
            expect(changed).to.be.false;
        });
    });
});
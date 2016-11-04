'use strict';

import { 
    beforeEach, 
    describe as test, 
    it as assert } from 'mocha';
import { expect }  from 'chai';
import isElement   from 'lodash/isElement';

global.window = {};

global.document = {
    querySelector: function () { 
        return new HTMLElement();
    }
};

global.HTMLElement = function () {
    this.nodeType = 1;
    this.offsetHeight = 100;
    this.offsetLeft = 0;
    this.offsetTop = 0;
    this.offsetWidth = 100;
};

global.TimelineMax = function () {};
global.TimelineMax.prototype.eventCallback = function () {};
global.TimelineMax.prototype.kill = function () {};
global.TimelineMax.prototype.pause = function () {};

var Oculo = require('../build/scripts/oculo');
var Utils = Oculo.Utils;
var Vector2 = Oculo.Vector2;

test('Utils', function() {
    test('parsePosition', function() {
        var position, expected;
        var world = new HTMLElement();
        
        assert('should return the center of the element when provided a valid selector', function() {
            position = '#view';
            expected = new Vector2(50, 50);
            expect(Utils.parsePosition(position, world)).to.deep.equal(expected);
        });
        
        assert('should return the center of the provided element', function() {
            position = new HTMLElement();
            expected = new Vector2(50, 50);
            expect(Utils.parsePosition(position, world)).to.deep.equal(expected);
        });
        
        assert('should return a vector built from the provided object', function() {
            position = { x: 200, y: 200 };
            expected = new Vector2(200, 200);
            expect(Utils.parsePosition(position, world)).to.deep.equal(expected);
        });
        
        assert('should return null when provided an invalid parameter', function() {
            position = 9;
            expected = null;
            expect(Utils.parsePosition(position, world)).to.deep.equal(expected);
        });
    });
});

test('Utils.DOM', function() {    
    test('getObjectWorldPosition', function() {
        assert('should return the center of the provided object', function() {
            var object, world, expected;
            
            object = new HTMLElement();
            world = new HTMLElement();
            expected = new Vector2(50, 50);
            expect(Utils.DOM.getObjectWorldPosition(object, world)).to.deep.equal(expected);
            
            object.offsetLeft = 200;
            object.offsetTop = 200;
            world.offsetLeft = 100;
            world.offsetTop = 100;
            expected = new Vector2(150, 150);
            expect(Utils.DOM.getObjectWorldPosition(object, world)).to.deep.equal(expected);
        });
    });
    
    test('parseView', function() {
        var view;
        
        assert('should return an element when provided a valid selector', function() {
            view = Utils.DOM.parseView('#view');
            expect(isElement(view)).to.be.true;
        });
        
        assert('should return the element when provided an element', function() {
            var element = new HTMLElement();
            view = Utils.DOM.parseView(element);
            expect(view).to.deep.equal(element);
        });
        
        assert('should return null when provided an invalid parameter', function() {
            view = Utils.DOM.parseView(9);
            expect(view).to.be.null;
        });
    });
});
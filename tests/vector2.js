'use strict';

var test = require('mocha').describe;
var beforeEach = require('mocha').beforeEach;
var assert = require('mocha').it;
var expect = require('chai').expect;
var Vector2 = require('../src/scripts/math/vector2');
    
test('Vector2', function() {
    var v;

    beforeEach('Instantiate a new vector', function() {
        v = new Vector2();
    });

    test('Vector2.add', function() {
        assert('should return the sum of two vectors', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            var v3 = Vector2.add(v, v2);
            expect(v3.x).to.equal(4);
            expect(v3.y).to.equal(6);
        });
    });
    
    test('Vector2.clone', function() {
        assert('should return a duplicate vector', function() {
            var v2 = Vector2.clone(v);
            expect(v).to.deep.equal(v2);
        });
    });

    test('Vector2.multiplyScalar', function() {
        assert('should multiply vector values by the provided scalar', function() {
            v.set(1,2,3,1);
            var v1 = Vector2.multiplyScalar(v, 2);
            expect(v1.x).to.equal(2);
            expect(v1.y).to.equal(4);
        });
    });

    test('Vector2.toArray', function() {
        assert('should return an Array', function() {
            var a = Vector2.toArray(v);
            expect(a).to.be.a('Array');
        });
        assert('should return something with length of 2', function() {
            var a = Vector2.toArray(v);
            expect(a).to.have.lengthOf(2);
        });
        assert('should return a new array containing vector values', function() {
            v.set(1,2);
            var a = Vector2.toArray(v);
            expect(a[0]).to.equal(1);
            expect(a[1]).to.equal(2);
        });
    });

    test('constructor', function() {
        assert('should set its values to the provided parameters', function() {
            var v = new Vector2(1,2);
            expect(v.x).to.equal(1);
            expect(v.y).to.equal(2);
        });
        assert('should set its values to 0,0 if no parameters are provided', function() {
            var v = new Vector2();
            expect(v.x).to.equal(0);
            expect(v.y).to.equal(0);
        });
    });

    test('add', function() {
        assert('should add its values by the provided vector', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            v.add(v2);
            expect(v.x).to.equal(4);
            expect(v.y).to.equal(6);
        });
    });    
    
    test('clone', function() {
        assert('should return a duplicate vector', function() {
            var v2 = v.clone();
            expect(v).to.deep.equal(v2);
        });
    });

    test('multiplyScalar', function() {
        assert('should multiply its values by the provided value', function() {
            v.set(1,2);
            v.multiplyScalar(2);
            expect(v.x).to.equal(2);
            expect(v.y).to.equal(4);
        });
    });

    test('set', function() {
        assert('should set its values to the provided values', function() {
            v.set(1,2);
            expect(v.x).to.equal(1);
            expect(v.y).to.equal(2);
        });
    });

    test('toArray', function() {
        assert('should return an array', function() {
            var a = v.toArray();
            expect(a).to.be.a('Array');
        });
    });
});
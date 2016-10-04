'use strict';

var test = require('mocha').describe;
var beforeEach = require('mocha').beforeEach;
var assert = require('mocha').it;
var expect = require('chai').expect;
var Matrix2 = require('../src/scripts/math/matrix2');
var Matrix2D = require('../src/scripts/math/matrix2D');
var Vector2 = require('../src/scripts/math/vector2');
    
test('Vector2', function() {
    var v;

    beforeEach('Instantiate a new vector', function() {
        v = new Vector2();
    });

    test('Vector2.add', function() {
        assert('should return the sum of multiple (infinite) vectors', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            var v3 = new Vector2(5,6);
            var v4 = Vector2.add(v, v2, v3);
            expect(v4.x).to.equal(9);
            expect(v4.y).to.equal(12);
        });
    });
    
    test('Vector2.clone', function() {
        assert('should return a duplicate vector', function() {
            var v2 = Vector2.clone(v);
            expect(v).to.deep.equal(v2);
        });
    });

    test('Vector2.equals', function() {
        assert('should validate that the first vector equals the second vector', function() {
            v.set(1,2);
            var v2 = new Vector2(1,2);
            expect(Vector2.equals(v, v2)).to.be.true;
        });
        assert('should validate that the first vector does not equal the second vector', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            expect(Vector2.equals(v, v2)).to.be.false;
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

    test('Vector2.subtract', function() {
        assert('should return the difference of multiple (infinite) vectors', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            var v3 = new Vector2(5,6);
            var v4 = Vector2.subtract(v, v2, v3);
            expect(v4.x).to.equal(-7);
            expect(v4.y).to.equal(-8);
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
    
    test('Vector2.transform', function() {
        assert('should return a Matrix2 transformed vector', function() {
            v.set(1,2);
            var m = new Matrix2(2,0,0,2);
            var m2 = new Matrix2(0,1,-1,0);
            var v1 = Vector2.transform(v, m, m2);
            expect(v1.x).to.equal(4);
            expect(v1.y).to.equal(-2);
        });
        assert('should return a Matrix2D transformed vector', function() {
            v.set(1,2);
            var m = new Matrix2D(2,0,0,2,10,20);
            var v1 = Vector2.transform(v, m);
            expect(v1.x).to.equal(12);
            expect(v1.y).to.equal(24);
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
        assert('should add its values by the provided (infinite) vectors', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            var v3 = new Vector2(5,6);
            v.add(v2, v3);
            expect(v.x).to.equal(9);
            expect(v.y).to.equal(12);
        });
    });
    
    test('clone', function() {
        assert('should return a duplicate vector', function() {
            var v2 = v.clone();
            expect(v).to.deep.equal(v2);
        });
    });

    test('copy', function() {
        assert('should copy the values from the provided vector into this vector', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            v.copy(v2);
            expect(v).to.deep.equal(v2);
        });
    });
    
    test('equals', function() {
        assert('should validate that the vector equals the provided vector', function() {
            v.set(1,2);
            var v2 = new Vector2(1,2);
            expect(v.equals(v2)).to.be.true;
        });
        assert('should validate that the vector does not equal the provided vector', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            expect(v.equals(v2)).to.be.false;
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

    test('subtract', function() {
        assert('should subtract its values by the provided (infinite) vectors', function() {
            v.set(1,2);
            var v2 = new Vector2(3,4);
            var v3 = new Vector2(5,6);
            v.subtract(v2, v3);
            expect(v.x).to.equal(-7);
            expect(v.y).to.equal(-8);
        });
    }); 
    
    test('toArray', function() {
        assert('should return an array', function() {
            var a = v.toArray();
            expect(a).to.be.a('Array');
        });
    });
    
    test('transform', function() {
        assert('should transform its values by the provided (infinite) Matrix2 matrices', function() {
            v.set(1,2);
            var m = new Matrix2(2,0,0,2);
            var m2 = new Matrix2(0,1,-1,0);
            v.transform(m, m2);
            expect(v.x).to.equal(4);
            expect(v.y).to.equal(-2);
        });
        assert('should transform its values by the provided Matrix2D matrix', function() {
            v.set(1,2);
            var m = new Matrix2D(2,0,0,2,10,20);
            v.transform(m);
            expect(v.x).to.equal(12);
            expect(v.y).to.equal(24);
        });
    });
});
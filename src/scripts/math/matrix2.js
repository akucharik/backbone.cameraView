'use strict';

var _ = require('lodash');

//Utilities
var isArrayLike = _.isArrayLike;

/**
* Create 2x2 matrix from a series of values.
* 
* Represented like:
* 
* | a | b |
* | c | d |
*
* @class Matrix2
* @constructor
* @param {number} [e11=1] - The value of row 1, column 1
* @param {number} [e12=0] - The value of row 1, column 2
* @param {number} [e21=0] - The value of row 2, column 1
* @param {number} [e22=1] - The value of row 2, column 2
*/
class Matrix2 {
    constructor (e11, e12, e21, e22) {
        /**
        * @property {number} e11
        * @default 1
        */
        this.e11 = null;
        
        /**
        * @property {number} e12
        * @default 0
        */
        this.e12 = null;
        
        /**
        * @property {number} e21
        * @default 0
        */
        this.e21 = null;
        
        /**
        * @property {number} e22
        * @default 1
        */
        this.e22 = null;
        
        this.setToIdentity();
        
        if (arguments.length === 4) {
            this.set(e11, e12, e21, e22);
        }
        else if (isArrayLike(e11) && e11.length === 4) {
            this.setFromArray(e11);
        }
    }
    
    /**
    * Clones the matrix.
    * {Matrix2} m - The matrix to clone.
    * @return {Matrix2} - A new identical matrix.
    */
    static clone (m) {
        return new Matrix2(Matrix2.toArray(m));
    }
    
    /**
    * Clones the matrix.
    * @return {Matrix2} - A new identical matrix.
    */
    clone () {
        return this.constructor.clone(this);
    }
    
    /**
    * Gets the determinant.
    * {Matrix2} m - The matrix to get the determinant.
    * @return {number} - The determinant.
    */
    static getDeterminant (m) {
        return m.e11 * m.e22 - m.e12 * m.e21;
    }
    
    /**
    * Gets the determinant.
    * @return {number} - The determinant.
    */
    getDeterminant () {
        return this.constructor.getDeterminant(this);
    }
    
    /**
    * Gets the inverse.
    * {Matrix2} m - The matrix to get the inverse.
    * @return {Matrix2} - The inverse matrix.
    */
    static getInverse (m) {
        return Matrix2.multiplyScalar(m, 1 / Matrix2.getDeterminant(m));
    }
    
    /**
    * Gets the inverse.
    * @return {Matrix2} - The inverse matrix.
    */
    getInverse () {
        return this.constructor.getInverse(this);
    }
    
    /**
    * Multiplies two matrices.
    * @param {Matrix2} a - A matrix.
    * @param {Matrix2} b - Another matrix.
    * @return {Matrix2} - A new matrix that is the product of the provided matrices.
    *//**
    * Multiplies a list of matrices.
    * @param {Array} m - A list of matrices.
    * @return {Matrix2} - A new matrix that is the product of the provided matrices.
    */
    static multiplyMatrices (a, b) {
        if (Array.isArray(a)) {
            let m = a.reduce(Matrix2.multiplyMatrices);
            
            return new Matrix2(Matrix2.toArray(m));
        }
        else if (a.cols === b.rows) {
            let n11, n12, n21, n22;
         
            n11 = a.e11 * b.e11 + a.e12 * b.e21;
            n12 = a.e11 * b.e12 + a.e12 * b.e22;
            n21 = a.e21 * b.e11 + a.e22 * b.e21;
            n22 = a.e21 * b.e12 + a.e22 * b.e22;
        
            return new Matrix2(n11, n12, n21, n22);
        }
        else {
            throw new Error('Cannot multiply incompatible matrices');
        }
    }
    
    /**
    * Multiplies the matrix by another matrix.
    * @param {Matrix2|Matrix2D} m - a matrix.
    * @return {Matrix2} - The matrix.
    *//**
    * Multiplies the matrix by a list of matrices.
    * @param {Array} m - A list of matrices.
    * @return {Matrix2} - The matrix.
    */
    multiplyMatrices (m) {
        var a = Array.isArray(m) ? m.slice() : [m];
        a.unshift(this);
        this.setFromArray(this.constructor.multiplyMatrices(a).toArray());

        return this;
    }
    
    /**
    * Multiplies a matrix by a scalar.
    * @param {Matrix2} m - The matrix.
    * @param {number} s - The scalar.
    * @return {Matrix2} - A new scaled matrix.
    */
    static multiplyScalar (m, s) {
        var e11 = m.e11 * s;
        var e12 = m.e12 * s;
        var e21 = m.e21 * s;
        var e22 = m.e22 * s;

        return new Matrix2(e11, e12, e21, e22);
    }
    
    /**
    * Multiplies the matrix by a scalar.
    * @param {number} s - The scalar.
    * @return {Matrix2} - The matrix.
    */
    multiplyScalar (s) {
        var m = this.constructor.multiplyScalar(this, s);
        this.setFromArray(m.toArray());

        return this;
    }
    
    /**
    * Sets the matrix values.
    * @param {number} e11
    * @param {number} e12
    * @param {number} e21
    * @param {number} e22
    * @return {Matrix2} The matrix.
    */
    set (e11, e12, e21, e22) {
        this.e11 = e11;
        this.e12 = e12;
        this.e21 = e21;
        this.e22 = e22;
        
        return this;
    }
    
    /**
    * Sets the matrix from an array.
    * @param {Array} a - The array of matrix values.
    * @return {Matrix2} The matrix.
    */
    setFromArray (a) {
        this.set(a[0], a[1], a[2], a[3]);

        return this;
    }
    
    /**
    * Sets the matrix to the identity.
    * @return {Matrix2} The matrix.
    */
    setToIdentity () {
        this.set(1, 0, 0, 1);
        
        return this;
    }
    
    /**
    * Sets the values from the matrix into a new array.
    * @param {Matrix2} m - The matrix.
    * @return {Array} The array containing the matrix values.
    */
    static toArray (m) {
        var a = new Array(4);
        
        a[0] = m.e11;
        a[1] = m.e12;
        a[2] = m.e21;
        a[3] = m.e22;
        
        return a;
    }
    
    /**
    * Sets the values from the matrix into a new array.
    * @return {Array} The array containing the matrix values.
    */
    toArray () {
        return this.constructor.toArray(this);
    }
    
    /**
    * Sets the values from the matrix into a new Float32Array.
    * @param {Matrix2} m - The matrix.
    * @return {Float32Array} The array containing the matrix values.
    */
    static toFloat32Array (m) {
        var a = new Float32Array(4);
        
        a[0] = m.e11;
        a[1] = m.e12;
        a[2] = m.e21;
        a[3] = m.e22;
        
        return a;
    }
    
    /**
    * Sets the values from the matrix into a new Float32Array.
    * @return {Float32Array} The array containing the matrix values.
    */
    toFloat32Array () {
        return this.constructor.toFloat32Array(this);
    }
}

/**
* The number of columns.
* @name Matrix2#cols
*/
Object.defineProperty(Matrix2.prototype, 'cols', {
    enumerable: true,
    value: 2
});

/**
* The number of rows.
* @name Matrix2#rows
*/
Object.defineProperty(Matrix2.prototype, 'rows', {
    enumerable: true,
    value: 2
});

module.exports = Matrix2;
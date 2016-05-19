'use strict';

/**
* Creates a 2D vector from a series of values.
* @class Vector2
* @param {number} [x]
* @param {number} [y]
*/
class Vector2 {
    constructor (x, y) {
        /**
        * The x coordinate.
        * @default 0
        */
        this.x = x || 0;
        
        /**
        * The y coordinate.
        * @default 0
        */
        this.y = y || 0;
    }

    /**
    * Adds two vectors.
    * {Vector2} a - A vector.
    * {Vector2} b - Another vector.
    * @return {Vector2} - A new vector that is the sum of the provided vectors.
    */
    static add (a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }
    
    /**
    * Adds one or more vectors to the vector.
    * {Vector2} a - A vector.
    * {Vector2} b - Another vector.
    * @return {Vector2} - A new identical vector.
    */
    add (v) {
        var v1 = this.constructor.add(this, v);
        this.set(v1.x, v1.y);
        
        return this;
    }
    
    /**
    * Clones the vector.
    * {Vector2} v - The vector to clone.
    * @return {Vector2} - A new identical vector.
    */
    static clone (v) {
        return new Vector2(v.x, v.y);
    }
    
    /**
    * Clones the vector.
    * @return {Vector2} - A new identical vector.
    */
    clone () {
        return this.constructor.clone(this);
    }
    
    /**
    * Multiplies a vector by a scalar.
    * @param {Vector2} m - The vector.
    * @param {number} s - The scalar.
    * @return {Vector2} - A new scaled vector.
    */
    static multiplyScalar (v, s) {
        var x = v.x * s;
        var y = v.y * s;

        return new Vector2(x, y);
    }
    
    /**
    * Multiplies the vector by a scalar.
    * @param {number} s - The scalar.
    * @return {Vector2} - The vector.
    */
    multiplyScalar (s) {
        var v = this.constructor.multiplyScalar(this, s);
        this.set(v.x, v.y);

        return this;
    }
    
    /**
    * Sets the vector values.
    * @param {number} x
    * @param {number} y
    * @return {Vector2} The vector.
    */
    set (x, y) {
        this.x = x;
        this.y = y;
        
        return this;
    }
    
    /**
    * Sets the values from the vector into a new array.
    * @param {Vector2} v - The vector.
    * @return {Array} The array containing the vector values.
    */
    static toArray (v) {
        var a = new Array(2);
        
        a[0] = v.x;
        a[1] = v.y;
        
        return a;
    }
    
    /**
    * Sets the values from the vector into a new array.
    * @return {Array} The array containing the vector values.
    */
    toArray () {
        return this.constructor.toArray(this);
    }
    
    
    /**
    * Transforms the vector by multiplying a matrix.
    * @param {Matrix2D} m - The matrix.
    * @return {Vector2} - The transformed vector.
    */
    transform (m) {
        var v1 = Vector2.transform(this, m);

        this.x = v1.x;
        this.y = v1.y;

        return this;
    }

    /**
    * Transforms a vector by multiplying a matrix.
    * @static
    * @param {Vector2} v - The vector.
    * @param {Matrix2D} m - The matrix.
    * @return {Vector2} - The transformed vector.
    */
    static transform (v, m) {
        var x = v.x, y = v.y;
        var a = m.value[0], b = m.value[1],
            c = m.value[2], d = m.value[3],
            e = m.value[4], f = m.value[5];

        var x1 = x * a + y * b + e;
        var y1 = x * c + y * d + f;

        return new Vector2(x1, y1);
    }
    
//    static multiplyVector (v, v1, m) {
//        v1.x = m.e11 * v.x + m.e12 * v.y;
//        v1.y = m.e21 * v.x + m.e22 * v.y;
//
//        return v1;
//
//    }
//    
//    /**
//    * Transform a vector by a matrix or array of matrices.
//    *
//    * @param {Vector2} v - The vector.
//    * @param {Vector2} v1 - The vector in which to write the transformed values.
//    * @return {Vector2} The transformed vector.
//    */
//    static transformVector (v, v1, m) {
//        if (Array.isArray(m)) {
//            m.forEach(i => Matrix2.multiplyVector(v, v1, m));
//        }
//        
//        return Matrix2.multiplyVector(v, v1, m);
//    }
}

module.exports = Vector2;
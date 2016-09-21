'use strict';

/**
* Creates a 2D vector from a series of values.
* @param {number} [x] - The x value.
* @param {number} [y] - The y value.
*/
class Vector2 {
    constructor (x, y) {
        /**
        * The x value.
        * @default 0
        */
        this.x = x || 0;
        
        /**
        * The y value.
        * @default 0
        */
        this.y = y || 0;
    }

    /**
    * Adds two vectors.
    * @private
    * @param {Vector2} a - A vector.
    * @param {Vector2} b - Another vector.
    * @return {Vector2} A new vector that is the sum of the provided vectors.
    */
    static _add (a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }
    
    /**
    * Adds vectors together.
    * @param {...Vector2} v - A vector.
    * @return {Vector2} A new vector that is the sum of the provided vectors.
    */
    static add (v) {
        let vectors = Array.prototype.slice.call(arguments);

        return vectors.reduce(Vector2._add);
    }
    
    /**
    * Adds vectors to the vector.
    * @param {...Vector2} v - A vector.
    * @return {Vector2} The vector.
    */
    add (v) {
        var v1 = null;
        var vectors = Array.prototype.slice.call(arguments);
        
        vectors.unshift(this);
        v1 = this.constructor.add.apply(null, vectors);
        this.set(v1.x, v1.y);

        return this;
    }
    
    /**
    * Clones the vector.
    * {Vector2} v - The vector to clone.
    * @return {Vector2} A new identical vector.
    */
    static clone (v) {
        return new Vector2(v.x, v.y);
    }
    
    /**
    * Clones the vector.
    * @return {Vector2} A new identical vector.
    */
    clone () {
        return this.constructor.clone(this);
    }
    
    /**
    * Copies the values from the provided vector into this vector.
    * {Vector2} v - The vector to copy.
    * @return {this} self
    */
    copy (v) {
        return this.set(v.x, v.y);
    }
        
    /**
    * Determines if the provided vectors are equal.
    * @param {Vector2} a - The first vector.
    * @param {Vector2} b - The second vector.
    * @return {boolean} Whether the vectors are equal.
    */
    static equals (a, b) {
        return a.x === b.x && a.y === b.y;
    }
    
    /**
    * Determines if the vector equals the provided vector.
    * @param {Vector2} v - The vector.
    * @return {boolean} Whether the vector equals the provided vector.
    */
    equals (v) {
        return this.constructor.equals(this, v);
    }
    
    /**
    * Multiplies a vector by a scalar.
    * @param {Vector2} v - The vector.
    * @param {number} s - The scalar.
    * @return {Vector2} A new scaled vector.
    */
    static multiplyScalar (v, s) {
        var x = v.x * s;
        var y = v.y * s;

        return new Vector2(x, y);
    }
    
    /**
    * Multiplies the vector by a scalar.
    * @param {number} s - The scalar.
    * @return {Vector2} The vector.
    */
    multiplyScalar (s) {
        var v = this.constructor.multiplyScalar(this, s);
        this.set(v.x, v.y);

        return this;
    }
    
    /**
    * Sets the vector values.
    * @param {number} x - The x value.
    * @param {number} y - The y value.
    * @return {Vector2} The vector.
    */
    set (x, y) {
        this.x = x;
        this.y = y;
        
        return this;
    }
    
    /**
    * Subtracts two vectors.
    * @private
    * @param {Vector2} a - A vector.
    * @param {Vector2} b - Another vector.
    * @return {Vector2} A new vector that is the difference of the provided vectors.
    */
    static _subtract (a, b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }
    
    /**
    * Subtracts vectors.
    * @param {...Vector2} v - A vector.
    * @return {Vector2} A new vector that is the difference of the provided vectors.
    */
    static subtract (v) {
        let vectors = Array.prototype.slice.call(arguments);

        return vectors.reduce(Vector2._subtract);
    }
    
    /**
    * Subtracts vectors from the vector.
    * @param {...Vector2} v - A vector.
    * @return {Vector2} The vector.
    */
    subtract (v) {
        var v1 = null;
        var vectors = Array.prototype.slice.call(arguments);
        
        vectors.unshift(this);
        v1 = this.constructor.subtract.apply(null, vectors);
        this.set(v1.x, v1.y);

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
    * Transforms a vector using the provided matrix.
    * @private
    * @param {Vector2} v - A vector.
    * @param {Matrix2|Matrix2D} m - A transformation matrix.
    * @return {Vector2} A new transformed vector.
    */
    static _transform (v, m) {
        var x1 = v.x * m.e11 + v.y * m.e12 + (m.tx ? m.tx : 0);
        var y1 = v.x * m.e21 + v.y * m.e22 + (m.ty ? m.ty : 0);

        return new Vector2(x1, y1);
    }
    
    /**
    * Transforms a vector using the provided matrices.
    * @param {Vector2} v - A vector.
    * @param {...Matrix2|...Matrix2D} m - A transformation matrix.
    * @return {Vector2} A new transformed vector.
    */
    static transform (v, m) {
        var args = Array.prototype.slice.call(arguments);

        return args.reduce(Vector2._transform);
    }
    
    /**
    * Transforms the vector using the provided matrices.
    * @param {...Matrix2|...Matrix2D} m - A transformation matrix.
    * @return {Vector2} The transformed vector.
    */
    transform (m) {
        var v1 = null;
        var args = Array.prototype.slice.call(arguments);
        
        args.unshift(this);
        v1 = this.constructor.transform.apply(null, args);
        this.set(v1.x, v1.y);

        return this;
    }
}

module.exports = Vector2;
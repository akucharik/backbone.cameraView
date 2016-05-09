// Utilities
var isArray = _.isArray;
var round = _.round;

/**
* Create 2x2 matrix from a series of values.
* 
* Represented like:
* 
* | a | b |
* | c | d |
*
* @class Matrix2
* @param {number} [e11=1]
* @param {number} [e12=0]
* @param {number} [e21=0]
* @param {number} [e22=1]
*//**
* Create a 2x2 matrix from an array.
* @class Matrix2
* @param {Array} - The matrix values.
*//**
* Create a 2x2 matrix initialzed to its identity.
* @class Matrix2
*/
class Matrix2 {
    constructor (e11, e12, e21, e22) {
        /**
        * @property {number} e11
        * @default
        */
        this.e11 = 1;
        
        /**
        * @property {number} e12
        * @default
        */
        this.e12 = 0;
        
        /**
        * @property {number} e21
        * @default
        */
        this.e21 = 0;
        
        /**
        * @property {number} e22
        * @default
        */
        this.e22 = 1;
        
        if (arguments.length === 4) {
            this.set(e11, e12, e21, e22);
        }
        else if (isArray(e11) && e11.length === 4) {
            this.setFromArray(e11);
        }
    }
    
    /**
    * Gets the determinant.
    */
    get determinant () {
        return this.e11 * this.e22 - this.e12 * this.e21;
    }
    
    /**
    * Gets the inverse.
    */
    inverse () {
        var m = new Matrix2(this.e22, -this.e12, -this.e21, this.e11)

        return m.multiplyScalar(1 / m.determinant);
    }
    
    /**
    * Sets the matrix to the identity.
    */
    identity () {
        return this.set(1, 0 , 0, 1);
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
    multiply (m) {
        var result;
        
        if (isArray(m)) {
            m.forEach(i => this.multiply(i));
        }
        else {
            result = Matrix2.multiplyMatrices(this, m);
            this.setFromArray(result.toArray());
        }

        return this;
    }
    
    /**
    * Multiplies two matrices.
    * @static
    * @param {Matrix2|Matrix2D} a - A matrix.
    * @param {Matrix2|Matrix2D} b - Another matrix.
    * @return {Matrix2} - The multiplied matrix.
    */
    static multiplyMatrices (a, b) {
        var n11, n12, n21, n22;
        
        if (a.cols === b.rows) {
            n11 = a.e11 * b.e11 + a.e12 * b.e21;
            n12 = a.e11 * b.e12 + a.e12 * b.e22;
            n21 = a.e21 * b.e11 + a.e22 * b.e21;
            n22 = a.e21 * b.e12 + a.e22 * b.e22;
        }
        else {
            throw new Error('Cannot multiply incompatible matrices');
        }

        return new Matrix2(n11, n12, n21, n22);
    }
    
    /**
    * Multiplies the matrix by a scalar.
    * @param {number} s - The scalar.
    * @return {Matrix2} - The matrix.
    */
    multiplyScalar (s) {
        var n11 = this.e11 * s;
        var n12 = this.e12 * s;
        var n21 = this.e21 * s;
        var n22 = this.e22 * s;
        
        this.set(n11, n12, n21, n22);

        return this;
    }
    
    /**
    * Sets the matrix from an array.
    * @param {Array} array - The array of matrix values.
    * @return {Matrix2} The matrix.
    */
    setFromArray (array) {
        if (array.length === 4) {
            this.set(array[0], array[1], array[2], array[3]);
        }
        else {
            throw new Error('Cannot set matrix values from an invalid array');
        }

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
    * Creates an array from the matrix values.
    *
    * @param {Array} array - If provided the matrix values will be set into the array, otherwise a new array is created.
    * @return {Array} The array containing the matrix values.
    */
    toArray (array) {
        if (!array) {
            var array = new Float32Array(4);    
        }
        
        array[0] = this.e11;
        array[1] = this.e12;
        array[2] = this.e21;
        array[3] = this.e22;
        
        return array;
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
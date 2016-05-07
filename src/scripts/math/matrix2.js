// Utilities
var isArray = _.isArray;

/**
* Create 2x2 matrix from a series of values.
* 
* Represented like:
* 
* | a | b |
* | c | d |
*
* @class Matrix2
* @param {number} [a=1]
* @param {number} [b=0]
* @param {number} [c=0]
* @param {number} [d=1]
*//**
* Create a 2x2 matrix from an array.
* @class Matrix2
* @param {Array} - The matrix values.
*//**
* Create a 2x2 matrix initialzed to its identity.
* @class Matrix2
*/
class Matrix2 {
    constructor (a, b, c, d) {
        /**
        * @property {number} a
        * @default
        */
        this.a = 1;
        
        /**
        * @property {number} b
        * @default
        */
        this.b = 0;
        
        /**
        * @property {number} c
        * @default
        */
        this.c = 0;
        
        /**
        * @property {number} d
        * @default
        */
        this.d = 1;
        
        if (arguments.length === 4) {
            this.setTo(a, b, c, d);
        }
        else if (isArray(a) && a.length === 4) {
            this.setFromArray(a);
        }
    }
    
    /**
    * Gets the determinant.
    */
    get determinant () {
        return this.a * this.d - this.b * this.c;
    }
    
    /**
    * Gets the inverse.
    */
    get inverse () {
        var m = new Matrix2(this.d, -this.b, -this.c, this.a)

        return m.multiplyScalar(1 / m.determinant);
    }
    
    /**
    * Sets the matrix to the identity.
    */
    identity () {
        return this.setTo(1, 0 , 0, 1);
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
        var m = new Matrix2();
        
        if (a.cols === b.rows) {
            m.a = a.a * b.a + a.b * b.c;
            m.b = a.a * b.b + a.b * b.d;
            m.c = a.c * b.a + a.d * b.c;
            m.d = a.c * b.b + a.d * b.d;
        }
        else {
            throw new Error('Cannot multiply incompatible matrices');
        }

        return m;
    }
    
    /**
    * Multiplies the matrix by a scalar.
    * @param {number} s - The scalar.
    * @return {Matrix2} - The matrix.
    */
    multiplyScalar (s) {
        this.a *= s;
        this.b *= s;
        this.c *= s;
        this.d *= s;

        return this;
    }
    
    /**
    * Sets the matrix from an array.
    * @param {Array} array - The array of matrix values.
    * @return {Matrix2} The matrix.
    */
    setFromArray (array) {
        if (array.length === 4) {
            this.a = array[0];
            this.b = array[1];
            this.c = array[2];
            this.d = array[3];
        }
        else {
            throw new Error('Cannot set matrix values from an invalid array');
        }

        return this;
    }
    
    /**
    * Sets the matrix values.
    * @param {number} a
    * @param {number} b
    * @param {number} c
    * @param {number} d
    * @return {Matrix2} The matrix.
    */
    setTo (a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        
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
            var array = new Array(4);    
        }
        
        array[0] = this.a;
        array[1] = this.b;
        array[2] = this.c;
        array[3] = this.d;
        
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
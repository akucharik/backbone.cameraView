// Utilities
var isArray = _.isArray;

class Matrix2 {
    constructor (m) {
        /**
        * The matrix value.
        * @default [1,0,0,1]
        */
        this.value = null;
                    
        if (!m) {
            this.value = this.identity;
        }
        else if (isArray(m) && m.length === 4) {
            this.value = m;
        }
        else {
            throw new Error('Cannot instantiate a matrix from an invalid array');
        }
    }
    
    /**
    * Gets the number of columns.
    */
    get cols () {
        return 2;
    }
    
    /**
    * Gets the determinant.
    */
    get determinant () {
        var m = this.value;
        var a = m[0], b = m[1],
            c = m[2], d = m[3];
    
        return a * d - b * c;
    }
    
    /**
    * Gets the identity.
    */
    get identity () {
        return [1, 0,
                0, 1];
    }
    
    /**
    * Gets the inverse.
    */
    get inverse () {
        var v = this.value;
        var a = v[0], b = v[1],
            c = v[2], d = v[3];
        var m = new Matrix2([d, -b, -c, a])

        return m.multiplyScalar(1 / m.determinant);
    }
    
    /**
    * Gets the number of rows.
    */
    get rows () {
        return 2;
    }
    
    /**
    * Multiplies the matrix by one or more matrices.
    * @param {Matrix2|Matrix2D|Array} m - One or more Matrices.
    * @return {Matrix2} - The matrix.
    */
    multiply (m) {
        if (isArray(m)) {
            m.forEach(function (item) {
                this.value = Matrix2.multiplyMatrices(this, item).value;
            });
        }
        else {
            this.value = Matrix2.multiplyMatrices(this, m).value;
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
        if (a.cols === b.rows) {
            var av = a.value;
            var bv = b.value;
            var nv = new Array(4);
            var a11 = av[0], a12 = av[1],
                a21 = av[2], a22 = av[3],
                b11 = bv[0], b12 = bv[1],
                b21 = bv[2], b22 = bv[3];

            nv[0] = a11 * b11 + a12 * b21;
            nv[1] = a11 * b12 + a12 * b22;
            nv[2] = a21 * b11 + a22 * b21;
            nv[3] = a21 * b12 + a22 * b22;
        }
        else {
            throw new Error('Cannot multiply incompatible matrices');
        }

        return new Matrix2(nv);
    }
    
    /**
    * Multiplies a matrix by a scalar.
    * @param {number} s - The scalar.
    * @return {Matrix2} - The scaled matrix.
    */
    multiplyScalar (s) {
        var v = this.value;
        var a = v[0], b = v[1],
            c = v[2], d = v[3];

        a *= s; b *= s;
        c *= s; d *= s;

        return this;
    }
}
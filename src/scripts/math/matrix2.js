// Utilities
var isArray = _.isArray;

var Matrix2 = function (m) {
    if (!m) {
        this.value = this.identity;
    }
    else if (isArray(m) && m.length === 4) {
        this.value = m;
    }
    else {
        throw new Error('Cannot instantiate a matrix from an invalid array');
    }
    
    this.rows = 2;
    this.cols = 2;
}

var p = Matrix2.prototype;

p.constructor = Matrix2;

/**
* Multiplies the matrix by one or more matrices.
* @param {Matrix2|Matrix2D|Array} m - One or more Matrices.
* @return {Matrix2} - The matrix.
*/
p.multiply = function (m) {
    if (isArray(m)) {
        m.forEach(function (item) {
            this.value = Matrix2.multiplyMatrices(this, item).value;
        });
    }
    else {
        this.value = Matrix2.multiplyMatrices(this, m).value;
    }
    
    return this;
};

/**
* Gets the matrix's determinant.
* @name Matrix2#determinant
*/
Object.defineProperty(p, 'determinant', {
    get: function () {
        var m = this.value;
        var a = m[0], b = m[1],
            c = m[2], d = m[3];
    
        return a * d - b * c;
    }
});

/**
* The matrix identity.
* @name Matrix2#identity
*/
Object.defineProperty(p, 'identity', {
    enumerable: true,
    value: [1, 0,
            0, 1]
});

/**
* Gets the matrix's inverse.
* @name Matrix2#inverse
*/
Object.defineProperty(p, 'inverse', {
    get: function () {
        return this.constructor.getInverse(this);
    }
});

/**
* Gets a martix's determinant.
* @static
* @param {Matrix2} m - The matrix.
* @return {Matrix2} - The inverse matrix.
*/
Matrix2.getInverse = function (m) {
    var a = m.value[0], b = m.value[1],
        c = m.value[2], d = m.value[3];
    
    return this.constructor.multiplyScalar(new Matrix2([d, -b, -c, a]), 1 / m.determinant);
};

/**
* Multiplies two matrices.
* @param {Matrix2|Matrix2D} a - A matrix.
* @param {Matrix2|Matrix2D} b - Another matrix.
* @return {Matrix2} - The multiplied matrix.
*/
Matrix2.multiplyMatrices = function (a, b) {
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
};

/**
* Multiplies a matrix by a scalar.
* @static
* @param {Matrix2} m - The matrix.
* @param {number} s - The scalar.
* @return {Matrix2} - The scaled matrix.
*/
Matrix2.multiplyScalar = function (m, s) {
    var a = m.value[0], b = m.value[1],
        c = m.value[2], d = m.value[3];
    
    a *= s; b *= s;
    c *= s; d *= s;
    
    return m;
};
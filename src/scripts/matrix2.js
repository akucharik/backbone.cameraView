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
* @param {Matrix2|Array} m - One or more Matrices.
* @return {Matrix2} - The matrix.
*/
p.multiplyMatrix = function (m) {
    if (isArray(m)) {
        m.forEach(function (item) {
            Matrix2.multiplyMatrices(this, item);
        });
    }
    else {
        Matrix2.multiplyMatrices(this, m);
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
* @param {Matrix2} a - A matrix.
* @param {Matrix2} b - Another matrix.
* @return {Matrix2} - The multiplied matrix.
*/
Matrix2.multiplyMatrices = function (a, b) {
    if (a.cols === b.rows) {
        var a11 = a[0], a12 = a[1],
            a21 = a[2], a22 = a[3],
            b11 = b[0], b12 = b[1],
            b21 = b[2], b22 = b[3];
    
        // TODO: Multiply matrices
    }
    else {
        throw new Error('Cannot multiply incompatible matrices');
    }
    
    return a;
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
// Utilities
var isArray = _.isArray;

var Matrix2D = function (m) {
    if (!m) {
        this.value = this.identity;
    }
    else if (isArray(m) && m.length === 4) {
        this.value = new Array(6);
        
        m.forEach(function (item, index) {
            this.value[index] = item;
        }, this);
        
        this.value.fill(0, 4);
    }
    else if (isArray(m) && m.length === 6) {
        this.value = m;
    }
    else {
        throw new Error('Cannot instantiate a matrix from an invalid array');
    }
    
    this.rows = 2;
    this.cols = 2;
}

var p = Matrix2D.prototype;

p.constructor = Matrix2D;

/**
* Multiplies the matrix by one or more matrices.
* @param {Matrix2|Matrix2D|Array} m - One or more Matrices.
* @return {Matrix2D} - The matrix.
*/
p.multiply = function (m) {
    if (isArray(m)) {
        m.forEach(function (item) {
            this.value = Matrix2D.multiplyMatrices(this, item).value;
        });
    }
    else {
        this.value = Matrix2D.multiplyMatrices(this, m).value;
    }
    
    return this;
};

/**
* Gets the matrix's determinant.
* @name Matrix2D#determinant
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
* @name Matrix2D#identity
*/
Object.defineProperty(p, 'identity', {
    enumerable: true,
    value: [1, 0,
            0, 1,
            0, 0]
});

/**
* Gets the matrix's inverse.
* @name Matrix2D#inverse
*/
Object.defineProperty(p, 'inverse', {
    get: function () {
        return this.constructor.getInverse(this);
    }
});

/**
* Gets a martix's determinant.
* @static
* @param {Matrix2D} m - The matrix.
* @return {Matrix2D} - The inverse matrix.
*/
Matrix2D.getInverse = function (m) {
    var a = m.value[0], b = m.value[1],
        c = m.value[2], d = m.value[3],
        e = m.value[4], f = m.value[5];
    
    return Matrix2D.multiplyScalar(new Matrix2D([d, -b, -c, a, -e, -f]), 1 / m.determinant);
};

/**
* Multiplies two matrices.
* @param {Matrix2|Matrix2D} a - A matrix.
* @param {Matrix2|Matrix2D} b - Another matrix.
* @return {Matrix2D} - The multiplied matrix.
*/
Matrix2D.multiplyMatrices = function (a, b) {
    if (a.cols === b.rows) {
        var av = a.value;
        var bv = b.value;
        var nv = new Array[6];
        var a11 = av[0], a12 = av[1],
            a21 = av[2], a22 = av[3],
            a3x = av[4] || 0, a3y = av[5] || 0,
            b11 = bv[0], b12 = bv[1],
            b21 = bv[2], b22 = bv[3],
            b3x = bv[4] || 0, b3y = bv[5] || 0;
        
        nv[0] = a11 * b11 + a12 * b21;
        nv[1] = a11 * b12 + a12 * b22;
        nv[2] = a21 * b11 + a22 * b21;
        nv[3] = a21 * b12 + a22 * b22;
        nv[4] = a3x + b3x;
        nv[5] = a3y + b3y;
    }
    else {
        throw new Error('Cannot multiply incompatible matrices');
    }
    
    return new Matrix2D(nv);
};

/**
* Multiplies a matrix by a scalar.
* @static
* @param {Matrix2D} m - The matrix.
* @param {number} s - The scalar.
* @return {Matrix2D} - The scaled matrix.
*/
Matrix2D.multiplyScalar = function (m, s) {
    var a = m.value[0], b = m.value[1],
        c = m.value[2], d = m.value[3],
        e = m.value[4], f = m.value[5];
    
    a *= s; b *= s;
    c *= s; d *= s;
    
    return m;
};
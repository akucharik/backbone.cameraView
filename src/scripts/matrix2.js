// Utilities (allows for easy swapping)
var isArray = _.isArray;

var Matrix2 = function (matrix) {
    if (!matrix) {
        this.value = this.identity;
    }
    else if (isArray(matrix) && matrix.length === 4) {
        this.value = matrix;
    }
    else {
        throw new Error('Cannot instantiate a matrix from an invalid array');
    }
}

var p = Matrix2.prototype;

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
        return Matrix2.getInverse(this);
    }
});

/**
* Gets a martix's determinant.
* @param {Matrix2} m - The matrix.
* @return {Matrix2} - The inverse matrix.
*/
Matrix2.getInverse = function (m) {
    var a = m.value[0], b = m.value[1],
        c = m.value[2], d = m.value[3];
    
    return Matrix2.multiplyScalar(1 / m.determinant, new Matrix2([d, -b, -c, a]));
};

/**
* Multiplies a matrix by a scalar.
* @param {number} s - The scalar.
* @param {Matrix2} m - The matrix.
* @return {Matrix2} - The scaled matrix.
*/
Matrix2.multiplyScalar = function (s, m) {
    var a = m.value[0], b = m.value[1],
        c = m.value[2], d = m.value[3];
    
    a *= s; b *= s;
    c *= s; d *= s;
    
    return m;
};
// Utilities
var isArray = _.isArray;

var Matrix2D = function (m) {
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

var p = Matrix2D.prototype;

/**
* Multiplies the matrix by a vector.
* @param {Array} v - The vector.
* @return {Array} - The transformed vector.
*/
p.multiplyVector = function (v) {
    return Matrix2D.multiplyVector(this, v);
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
            0, 1]
});

/**
* Gets the matrix's inverse.
* @name Matrix2D#inverse
*/
Object.defineProperty(p, 'inverse', {
    get: function () {
        return Matrix2D.getInverse(this);
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
        c = m.value[2], d = m.value[3];
    
    return Matrix2D.multiplyScalar(new Matrix2D([d, -b, -c, a]), 1 / m.determinant);
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
        c = m.value[2], d = m.value[3];
    
    a *= s; b *= s;
    c *= s; d *= s;
    
    return m;
};

/**
* Multiplies a matrix by a vector.
* @static
* @param {Matrix2D} m - The matrix.
* @param {Array} v - The vector.
* @return {Array} - The transformed vector.
*/
Matrix2D.multiplyVector = function (m, v) {
    var a = m.value[0], b = m.value[1],
        c = m.value[2], d = m.value[3];
    
    var x = v[0], y = v[1];
    
    var x1 = a * x + b * y;
    var y1 = c * x + d * y;
    
    return [x1, y1];
};
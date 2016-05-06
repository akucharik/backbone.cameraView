class Vector2 {
    constructor (x, y) {
        /**
        * TODO.
        * @default 0
        */
        this.x = x || 0;
        
        /**
        * TODO.
        * @default 0
        */
        this.y = y || 0;
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
}
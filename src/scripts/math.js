var M = {
    degToRad: function (degrees) {
        return degrees * M.DEG2RAD;
    },

    radToDeg: function (radians) {
        return radians * M.RAD2DEG;
    }
};

Object.defineProperty(M, 'DEG2RAD', {
    value: Math.PI / 180
});

Object.defineProperty(M, 'RAD2DEG', {
    value: 180 / Math.PI
});
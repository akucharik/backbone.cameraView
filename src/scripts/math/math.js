Camera.Math = class {
    static degToRad (degrees) {
        return degrees * Camera.Math.DEG2RAD;
    }

    static radToDeg (radians) {
        return radians * Camera.Math.RAD2DEG;
    }
};

Object.defineProperty(Camera.Math, 'DEG2RAD', {
    value: Math.PI / 180
});

Object.defineProperty(Camera.Math, 'RAD2DEG', {
    value: 180 / Math.PI
});
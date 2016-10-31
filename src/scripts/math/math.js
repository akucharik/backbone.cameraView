'use strict';

/**
* A collection of useful mathematical values and functions.
*
* @class Oculo.Math
* @static
*/
const _Math = {
    /**
    * Convert degrees to radians.
    * @param {number} degrees - The degrees value.
    * @return {number} - The value in radians.
    */
    degToRad: (degrees) => {
        return degrees * _Math.degToRadFactor;
    },

    /**
    * Convert radians to degrees.
    * @param {number} radians - The radians value.
    * @return {number} - The value in degrees.
    */
    radToDeg: (radians) => {
        return radians * _Math.radToDegFactor;
    }
};

/**
* The factor used to convert degrees to radians.
* @name Math#degToRadFactor
*/
Object.defineProperty(_Math, 'degToRadFactor', {
    value: Math.PI / 180
});

/**
* The factor used to convert radians to degrees.
* @name Math2#radToDegFactor
*/
Object.defineProperty(_Math, 'radToDegFactor', {
    value: 180 / Math.PI
});

export default _Math;
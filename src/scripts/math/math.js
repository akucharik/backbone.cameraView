'use strict';

/**
* A collection of useful mathematical values and functions.
*
* @class Oculo.Math
* @static
*/
const Math = {
    /**
    * Convert degrees to radians.
    * @param {number} degrees - The degrees value.
    * @return {number} - The value in radians.
    */
    degToRad: (degrees) => {
        return degrees * Math.degToRadFactor;
    },

    /**
    * Convert radians to degrees.
    * @param {number} radians - The radians value.
    * @return {number} - The value in degrees.
    */
    radToDeg: (radians) => {
        return radians * Math.radToDegFactor;
    }
};

/**
* The factor used to convert degrees to radians.
* @name Math#degToRadFactor
*/
Object.defineProperty(Math, 'degToRadFactor', {
    value: window.Math.PI / 180
});

/**
* The factor used to convert radians to degrees.
* @name Math2#radToDegFactor
*/
Object.defineProperty(Math, 'radToDegFactor', {
    value: 180 / window.Math.PI
});

export default Math;
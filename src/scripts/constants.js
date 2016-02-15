'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* @namespace constants
*/
var constants = {
    /**
    * @namespace
    * @memberof constants
    */
    defaults: {
        /**
        * @readonly
        * @constant {number}
        * @default
        */
        PIXEL_PRECISION: 2,
        TRANSITION: {
            /**
            * @readonly
            * @constant {string}
            * @default
            */
            DELAY: '0s',
            /**
            * @readonly
            * @constant {string}
            * @default
            */
            DURATION: '500ms',
            PROPERTY: 'transform',
            /**
            * @readonly
            * @constant {string}
            * @default
            */
            TIMING_FUNCTION: 'ease-out'
        }
    },
    /**
    * Enum for zoom direction.
    * @enum {number}
    * @memberof constants
    */
    zoom: {
        /**
        * Zoom in.
        * @readonly
        */
        IN: 1,
        /**
        * Zoom out.
        * @readonly
        */
        OUT: 0
    }
};
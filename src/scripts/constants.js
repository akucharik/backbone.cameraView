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
    errorMessage: {
        METHOD_SIGNATURE: 'Incorrect method signature'
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
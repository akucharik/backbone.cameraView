'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Creates focus functionality used for object composition.
* Requires {@link http://lodash.com|lodash}.
*
* @class
* @constructor
*/
var Focuser = function () {
    /**
    * Get the x/y focus point for an element.
    *
    * @param {Object} containerRect - The boundingClientRect object for the element that contains all focusable positions.
    * @param {Element} elRect - The boundingClientRect object for the element on which to determine the focus position.
    * @param {number} scale - The currently rendered scale ratio.
    * @returns {Object} The element's focus position. An x/y position object representing the center point of the element in relation to the container.
    */
    this.getElementFocus = function (window, containerRect, elRect, scale) {
        return {
            x: _.round((elRect.width / scale / 2) + (elRect.left / scale + window.scrollX) - (containerRect.left / scale + window.scrollX), 2),
            y: _.round((elRect.height / scale / 2) + (elRect.top / scale + window.scrollY) - (containerRect.top / scale + window.scrollY), 2)
        };
    };

    /**
    * Get the x/y container offset to focus/center on a position.
    *
    * @param {Object} frameRect - The boundingClientRect object for the frame.
    * @param {Object} position - The position that will be brought to focus. An x/y point object (at a scale ratio of 1).
    * @param {number} scale - The destination scale ratio.
    * @returns {Object} The offset. An x/y point object representing the position of the content's container in order for the frame to focus on the position.
    */
    this.getFocusOffset = function (frameRect, position, scale) {
        if (_.isFinite(position.x) && _.isFinite(position.y)) {
            return {
                x: _.round((frameRect.width / 2) - (position.x * scale), 2),
                y: _.round((frameRect.height / 2) - (position.y * scale), 2)
            };
        }
        else {
            throw new Error('Cannot determine focus offset from an invalid position');
        }
    }
};

Focuser.prototype.constructor = Focuser;
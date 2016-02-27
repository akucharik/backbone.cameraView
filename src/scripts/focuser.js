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
var Focuser = function () {};

Focuser.prototype = {
        /**
    * Get the x/y focus point for an element.
    *
    * @param {Object} containerRect - The boundingClientRect object for the element that contains all focusable positions.
    * @param {Element} elRect - The boundingClientRect object for the element on which to determine the focus position.
    * @param {number} scale - The currently rendered scale ratio.
    * @returns {Object} The element's focus position. An x/y position object representing the center point of the element in relation to the container.
    */
    getElementFocus: function (window, containerRect, elRect, scale) {
        var position = {};

        position.x = _.round((elRect.width / scale / 2) + (elRect.left / scale + window.scrollX) - (containerRect.left / scale + window.scrollX), 2);
        position.y = _.round((elRect.height / scale / 2) + (elRect.top / scale + window.scrollY) - (containerRect.top / scale + window.scrollY), 2);

        return position;
    },

    /**
    * Get the x/y container offset to focus/center on a position.
    *
    * @param {Object} frameRect - The boundingClientRect object for the frame.
    * @param {Object} position - The position that will be brought to focus. An x/y point object (at a scale ratio of 1).
    * @param {number} scale - The destination scale ratio.
    * @returns {Object} The offset. An x/y point object representing the position of the content's container in order for the frame to focus on the position.
    */
    getFocusOffset: function (frameRect, position, scale) {
        var offset = {};

        if (_.isFinite(position.x) && _.isFinite(position.y)) {
            offset.x = _.round((frameRect.width / 2) - (position.x * scale), 2);
            offset.y = _.round((frameRect.height / 2) - (position.y * scale), 2);
        }
        else {
            throw new Error('Cannot determine focus offset from invalid position coordinates');
        }

        return offset;
    }
};

Focuser.prototype.constructor = Focuser;
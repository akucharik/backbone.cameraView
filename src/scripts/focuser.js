'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Factory: Creates focus functionality used for object composition.
* Requires {@link http://lodash.com|lodash}.
*
* @constructs Focuser
* @returns {Focuser} A new Focuser object.
*/
var Focuser = function () {
    /**
    * @lends Focuser.prototype
    */
    var instance = {
        /**
        * Get the x/y focus point for an element.
        *
        * @param {Element} container - The element that contains all focusable points/elements.
        * @param {Element} el - The element on which to determine the focus point.
        * @param {number} scale - The currently rendered scale ratio.
        * @returns {Object} The element's focus point. An x/y point object representing the center point of the element in relation to the container.
        */
        getElementFocus: function (container, el, scale) {
            var containerRect = container.getBoundingClientRect();
            var elRect = el.getBoundingClientRect();
            var focus = {};

            focus.x = (elRect.width / scale / 2) + (elRect.left / scale + window.scrollX) - (containerRect.left / scale + window.scrollX);
            focus.y = (elRect.height / scale / 2) + (elRect.top / scale + window.scrollY) - (containerRect.top / scale + window.scrollY);

            return focus;
        },

        /**
        * Get the x/y container offset for a point or element.
        *
        * @param {Element} frame - The element that frames the container.
        * @param {Element} container - The element that contains all focusable points/elements.
        * @param {Object|Element} focus - An x/y point object (at a scale ratio of 1) or an element.
        * @param {number} scale - The destination scale ratio.
        * @param {number} renderedScale - The currently rendered scale ratio.
        * @returns {Object} The offset. An x/y point object representing the position of the container in order for the frame to focus on a point.
        */
        getFocusOffset: function (frame, container, focus, scale, renderedScale) {
            var offset = {};
            var frameWidth = frame.getBoundingClientRect().width;
            var frameHeight = frame.getBoundingClientRect().height;

            if (_.isElement(focus)) {
                focus = this.getElementFocus(container, focus, renderedScale);
            }

            if (_.isFinite(focus.x) && _.isFinite(focus.y)) {
                offset.x = _.round((frameWidth / 2) - (focus.x * scale), 2);
                offset.y = _.round((frameHeight / 2) - (focus.y * scale), 2);
            }
            else {
                throw new Error('Cannot determine focus offset from invalid focus coordinates');
            }

            return offset;
        }
    };
    
    return instance;
};
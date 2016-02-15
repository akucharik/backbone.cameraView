'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Factory: Creates {@link http://backbonejs.org/#View|Backbone.View} height and width sizing functionality used for object composition.
* Requires {@link http://lodash.com|lodash} or {@link http://underscorejs.org|underscore} and {@link http://jquery.com|jQuery} or {@link http://zeptojs.com|Zepto}.
*
* @constructs SizableView
* @extends Backbone.View
* @returns {SizableView} A new SizableView object.
*/
var SizableView = function () {
    /**
    * @lends SizableView.prototype
    */
    var instance = {};

    /**
    * Sets the height of the view.
    *
    * @param {number|string|Element} height - A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
    * @returns {this} The view.
    */
    instance.setHeight = function (height) {
        if (_.isNumber(height)) {
            this.$el.height(height);
        }
        else if (_.isElement(height)) {
            this.$el.height(height.clientHeight);
        }
        else if (_.isFunction(height)) {
            this.$el.height(height());
        }
        
        return this;
    };

    /**
    * Sets the width of the view.
    *
    * @param {number|string|Element} width - A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
    * @returns {this} The view.
    */
    instance.setWidth = function (width) {
        if (_.isNumber(width)) {
            this.$el.width(width);
        }
        else if (_.isElement(width)) {
            this.$el.width(width.clientWidth);
        }
        else if (_.isFunction(width)) {
            this.$el.width(width());
        }
        
        return this;
    };

    return instance;
};
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
* @class
* @constructor
* @extends Backbone.View
*/
var SizableView = function () {
    /**
    * Sets the view element's height.
    *
    * @private
    * @returns {this} The view.
    */
    this._setHeight = function () {
        var height = this.height;

        if (_.isElement(height)) {
            height = $(height).height();
        }
        this.$el.height(height);

        return this;
    };
    
    /**
    * Sets the view element's width.
    *
    * @private
    * @returns {this} The view.
    */
    this._setWidth = function () {
        var width = this.width;

        if (_.isElement(width)) {
            width = $(width).width();
        }
        this.$el.width(width);

        return this;
    };
    
    /**
    * Sets the view's height.
    *
    * @param {number|string|Element} height - A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
    * @returns {this} The view.
    */
    this.setHeight = function (height) {
        this.height = height;
        this.trigger('change:height');
        
        return this;
    };

    /**
    * Sets the view's width.
    *
    * @param {number|string|Element} width - A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
    * @returns {this} The view.
    */
    this.setWidth = function (width) {
        this.width = width;
        this.trigger('change:width');
        
        return this;
    };
};

SizableView.prototype.constructor = SizableView;
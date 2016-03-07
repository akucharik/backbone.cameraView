'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Height and width sizing functionality for object composition when the object extends {@link external:Backbone.View}.
* Requires {@link external:lodash} or {@link external:underscore} and {@link external:jQuery} or {@link external:zepto}.
*
* @mixin
*/
var SizableView = {
    /**
    * Sets the view element's height.
    *
    * @returns {this} The view.
    */
    setViewHeight: function () {
        var height = this.height;

        if (_.isElement(height)) {
            height = $(height).height();
        }
        this.$el.height(height);

        return this;
    },
    
    /**
    * Sets the view element's width.
    *
    * @returns {this} The view.
    */
    setViewWidth: function () {
        var width = this.width;

        if (_.isElement(width)) {
            width = $(width).width();
        }
        this.$el.width(width);

        return this;
    },
    
    /**
    * Sets the view's height.
    *
    * @param {number|string|Element} height - A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
    * @returns {this} The view.
    */
    setHeight: function (height) {
        this.height = height;
        this.trigger('change:height');
        
        return this;
    },

    /**
    * Sets the view's width.
    *
    * @param {number|string|Element} width - A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
    * @returns {this} The view.
    */
    setWidth: function (width) {
        this.width = width;
        this.trigger('change:width');
        
        return this;
    }
};
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
        this.$el.height(this.height);

        return this;
    },
    
    /**
    * Sets the view element's width.
    *
    * @returns {this} The view.
    */
    setViewWidth: function () {
        this.$el.width(this.width);

        return this;
    },

    /**
    * Sets the view's size.
    *
    * @param {number|string} width - A number will be treated as pixels. A valid CSS string may also be used.
    * @param {number|string} height - A number will be treated as pixels. A valid CSS string may also be used.
    * @returns {this} The view.
    */
    setSize: function (width, height) {
        this.width = width;
        this.height = height;
        this.trigger('change:size');
        
        return this;
    },
    
    /**
    * Sets the view's height.
    *
    * @param {number|string} height - A number will be treated as pixels. A valid CSS string may also be used.
    * @returns {this} The view.
    */
    setHeight: function (height) {
        this.height = height;
        this.trigger('change:size');
        
        return this;
    },

    /**
    * Sets the view's width.
    *
    * @param {number|string} width - A number will be treated as pixels. A valid CSS string may also be used.
    * @returns {this} The view.
    */
    setWidth: function (width) {
        this.width = width;
        this.trigger('change:size');
        
        return this;
    }
};
'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Creates a camera's content.
* Requires {@link external:lodash} and {@link external:zepto}.
* 
* @constructs CameraContentView
* @extends external:Backbone.View
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
* @param {number|string|Element} [options.width] - The {@link CameraContentView#width|width}.
* @param {number|string|Element} [options.height] - The {@link CameraContentView#height|height}.
* @param {number} [options.x] - The {@link CameraContentView#x|x} position.
* @param {number} [options.y] - The {@link CameraContentView#y|y} position.
* @param {Function} [options.onResize] - The "resize" event handler.
*/
var CameraContentView = Backbone.View.extend(
    /**
    * @lends CameraContentView.prototype
    */
    {
        /**
        * The scale of the x-axis.
        * @property {number} - The scale of the x-axis.
        * @default
        */
        scaleX: 1,
        
        /**
        * The scale of the y-axis.
        * @property {number} - The scale of the y-axis.
        * @default
        */
        scaleY: 1,
        
        /**
        * The 'x' position of the content.
        * @property {number} - The 'x' position of the content.
        * @default
        */
        x: 0,

        /**
        * The 'y' position of the content.
        * @property {number} - The 'y' position of the content.
        * @default
        */
        y: 0,

        /**
        * Called on the view this when the view has been created. This method is not meant to be overridden. If you need to access initialization, use {@link CameraView#onInitialize|onInitialize}.
        *
        * @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
        * @returns {CameraContentView} The view.
        */
        initialize: function (options) {
            options = options || {};

            this.transformRootEl = this.el;
            this.$transformRootEl = this.$el;
            
            this.transformEl = document.createElement('div');
            this.$transformEl = this.$(this.transformEl);
            this.transformEl.classList.add('bcv-transform');
            
            this.rotateEl = options.content;
            this.$rotateEl = this.$(options.content);
            this.rotateEl.classList.add('bcv-rotate');
            
            this.transformRootEl.appendChild(this.transformEl);
            this.transformEl.appendChild(this.rotateEl);
            
            // Ensure the view has its own tweenable properties.
            this.x = 0;
            this.y = 0;

            Object.assign(this, _.pick(options, [
                'width',
                'height',
                'x',
                'y',
                'onResize'
            ]));

            return this;
        },
        
        /**
        * Called when the view is resized. The default implementation is a no-op. Override this function with your code. 
        *
        * @param {number|string} width - The width the view was resized to.
        * @param {number|string} height - The height the view was resized to.
        */
        onResize: function (width, height) {
            
        },
        
        /**
        * Sets the view's size.
        *
        * @param {number|string} width - A number will be treated as pixels. A valid CSS string may also be used.
        * @param {number|string} height - A number will be treated as pixels. A valid CSS string may also be used.
        * @returns {this} The view.
        */
        resize: function (width, height) {
            if (width != this.width || height != this.height) {
                this.width = width;
                this.height = height;
                this.onResize(width, height);
            }
            
            return this;
        }
    }
);

/**
* The width.
* @name CameraContentView#width
* @property {number} - Gets or sets the view's width. A "change:width" event is emitted if the value has changed.
*/
Object.defineProperty(CameraContentView.prototype, 'width', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.transformEl);
        
        return this.transformEl.clientWidth + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));
    },

    set: function (value) {
        if (value != this.width) {
            this.$transformEl.width(value);
            this.trigger('change:width', value);
        }
    }
});

/**
* The height.
* @name CameraContentView#height
* @property {number} - Gets or sets the view's height. A "change:height" event is emitted if the value has changed.
*/
Object.defineProperty(CameraContentView.prototype, 'height', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.transformEl);
        
        return this.transformEl.clientHeight + parseFloat(computedStyle.getPropertyValue('border-top-width')) + parseFloat(computedStyle.getPropertyValue('border-bottom-width'));
    },

    set: function (value) {
        if (value != this.height) {
            this.$transformEl.height(value);
            this.trigger('change:height', value);
        }
    }
});
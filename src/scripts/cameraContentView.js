'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Creates a camera's content.
* Requires {@link external:lodash}, and {@link external:jQuery} or {@link external:zepto}.
* 
* @constructs CameraContentView
* @extends external:Backbone.View
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
*/
var CameraContentView = Backbone.View.extend(
    /**
    * @lends CameraContentView.prototype
    */
    {
        /**
        * The maximum value the content can be scaled.
        * @property {number} - See {@link CameraContentView.scale|scale}.
        * @default
        */
        maxScale: 10,

        /**
        * The minimum value the content can be scaled.
        * @property {number} - See {@link CameraContentView.scale|scale}.
        * @default
        */
        minScale: 0.1,

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
        * The scale.
        * @private
        * @property {number} - A scale ratio where 1 = 100%.
        * @default
        */
        _scale: 1,

        /**
        * Called on the view this when the view has been created. This method is not meant to be overridden. If you need to access initialization, use {@link CameraView#onInitialize|onInitialize}.
        *
        * @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
        * @returns {CameraContentView} The view.
        */
        initialize: function (options) {
            options = options || {};

            // Ensure the view has its own tweenable properties.
            this.x = 0;
            this.y = 0;

            Object.assign(this, _.pick(options, [
                'height',
                'minScale',
                'maxScale',
                'scale',
                'width',
                'x',
                'y',
            ]));

            this.el.setAttribute('draggable', false);
            this.$el.on('dragstart', this._onDragStart.bind(this));

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

            return this;
        },
        
        /**
        * Handle the dragstart event.
        *
        * @private
        * @param {DragEvent} event - The drag event.
        */
        _onDragStart: function (event) {
            // Prevent the "ghost image" when dragging.
            event.preventDefault();

            return false;
        }
    }
);

/**
* The scale.
* @name CameraContentView#scale
* @property {number} - Gets or sets the view's scale. This value is automatically clamped if it falls outside the bounds.
*/
Object.defineProperty(CameraContentView.prototype, 'scale', {
    get: function () {
        return this._scale;
    },

    set: function (value) {
        this._scale = _.clamp(value, this.minScale, this.maxScale);
    }
});

/**
* The width.
* @name SizeableView#width
* @property {number} - Gets or sets the view's width.
*/
Object.defineProperty(CameraContentView.prototype, 'width', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.el);
        return this.el.clientWidth + parseInt(computedStyle.getPropertyValue('border-left-width')) + parseInt(computedStyle.getPropertyValue('border-right-width'));
    },

    set: function (value) {
        this.$el.width(value);
        this.trigger('change:size');
    }
});

/**
* The height.
* @name SizeableView#height
* @property {number} - Gets or sets the view's height.
*/
Object.defineProperty(CameraContentView.prototype, 'height', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.el);
        return this.el.clientHeight + parseInt(computedStyle.getPropertyValue('border-top-width')) + parseInt(computedStyle.getPropertyValue('border-bottom-width'));
    },

    set: function (value) {
        this.$el.height(value);
        this.trigger('change:size');
    }
});
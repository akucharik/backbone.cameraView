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
        * The height.
        * @property {number} - The height.
        * @default
        */
        height: 0,

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
        * The width.
        * @property {number} - The width.
        * @default
        */
        width: 0,

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

            this.x = 0;
            this.y = 0;

            if (options.scale) {
                this.scale = options.scale;
            }

            Object.assign(this, _.pick(options, [
                'height',
                'minScale',
                'maxScale',
                'width',
                'x',
                'y',
            ]));

            this.el.setAttribute('draggable', false);
            
            // Initialize events
            this.$el.on('dragstart', this._onDragStart.bind(this));
            
            this.update();

            return this;
        },

        /**
        * Updates the view.
        *
        * @returns {CameraContentView} The view.
        */
        update: function () {
            // TODO: Remove once development is complete
            console.log('update');

            var clientRect = this.el.getBoundingClientRect();

            this.width = clientRect.width;
            this.height = clientRect.height;

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
        },
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
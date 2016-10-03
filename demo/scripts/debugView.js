'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

// TODO: Add documentation
var DebugView = Backbone.View.extend({
    initialize: function (options) {
        // TODO: Add documentation
        this.childView = new DebugScrollView({
            model: this.model,
            scrollHintTopClassName: 'fa fa-ellipsis-h',
            scrollHintBottomClassName: 'fa fa-ellipsis-h'
        });
        
        // TODO: Add documentation
        this._isOpen = true;
        
        // TODO: Add documentation
        Object.defineProperty(this, 'isOpen', {
            get: function () {
                return this._isOpen;
            },
            
            set: function (value) {
                if (value !== this._isOpen) {
                    this._isOpen = value;
                    this.trigger('change:isOpen', value);
                }
            }
        });
        
        this.listenTo(this, 'change:isOpen', this.onIsOpenChange);
        
//        this.listenTo(this, 'attach', function () { console.log('attach debug: ' + this.cid); });
//        this.listenTo(this, 'render', function () { console.log('render debug: ' + this.cid); });
//        this.listenTo(this, 'update', function () { console.log('update debug: ' + this.cid); });
    },

    events: {
        'click': 'onClick'
    },
    
    // TODO: Abstract to installable feature
    attach: function (element) {
        element.appendChild(this.el);
        this.childView.trigger('attach');
        this.trigger('attach');
    },
    
    render: function() {
        var template = '<div class="oculo-panel-handle"></div>';
        var compiledTemplate = _.template(template, { variable: 'data' });
        
        this.el.innerHTML = compiledTemplate();
        this.el.appendChild(this.childView.render().el);
        this.trigger('render');
        
        return this;
    },
    
    update: function () {
        this.childView.update();
        
        return this;
    },
    
    destroy: function () {
        this.childView.destroy();
        this.trigger('destroy');
        this.remove();
    },
    
    onClick: function () {
        this.isOpen = this.isOpen ? false : true;
    },
    
    onIsOpenChange: function (value) {
        if (!value) {
            TweenMax.to(this.el, 0.3, { x: this.$el.width() - 30 });
        }
        else {
            TweenMax.to(this.el, 0.3, { x: 0 });
        }
    }
});
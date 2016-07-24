'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

var DebugView = Backbone.View.extend({
    initialize: function (options) {
        var properties = Object.getOwnPropertyNames(this.model).sort().filter(function (property) {
            return typeof this[property] !== 'function' && typeof this[property] !== 'object';
        }, this.model);
        
        this.isOpen = true;
        this.propertyViews = new Array(properties.length);
        
        properties.forEach(function (property, index) {
            this.propertyViews[index] = new DebugPropertyView({
                className: 'oculo-debug-property',
                model: this.model,
                property: property,
                tagName: 'li'
            });
        }, this);
        
        this.listenTo(this, 'change:isOpen', this.isOpenChange);
        this.listenTo(this, 'append', this.checkScroll);
        //TODO: Fix this crappy code
        $(window).on('resize', this.checkScroll.bind(this));
    },

    events: {
        'click': 'onClick',
        'mouseenter': 'onMouseenter',
        'mouseleave': 'onMouseleave'
    },
    
    // TODO: Fix this crappy code
    append: function (element) {
        element.appendChild(this.el);
        this.trigger('append');
    },
    
    render: function() {
        var template = '<div class="oculo-panel-handle"></div><h2>Debug Info</h2><ul class="oculo-scrollable content"></ul><div class="oculo-scroll-indicator"></div>';
        var compiledTemplate = _.template(template, { variable: 'data' });
        var fragment = document.createDocumentFragment();
        
        this.propertyViews.forEach(function (view) {
            fragment.appendChild(view.render().el);
        });
        
        this.$el.html(compiledTemplate(this));
        this.$el.find('.content').append(fragment);
        
        // TODO: Fix this crappy code
        this.$el.find('.oculo-scrollable').on('scroll', this.checkScroll.bind(this));
        
        return this;
    },
    
    update: function () {
        this.propertyViews.forEach(function (view) {
            view.update();
        });
        
        return this;
    },
    
    onClick: function () {
        this.isOpen = this.isOpen ? false : true;
        this.trigger('change:isOpen', this.isOpen);
    },
    
    onMouseenter: function () {
        document.body.style.overflow = 'hidden';
    },
    
    onMouseleave: function () {
        document.body.style.overflow = null;
    },
    
    // TODO: Fix this crappy code
    checkScroll: function () {
        var scrollable = this.$el.find('.oculo-scrollable')[0];
        
        //console.log(scrollable.scrollTop(), scrollable.height(), scrollable[0].scrollHeight);
        
        console.log(scrollable.scrollTop, scrollable.clientHeight, scrollable.scrollHeight);
        
        if (scrollable.scrollHeight - scrollable.scrollTop === scrollable.clientHeight) {
            console.log('hidden');
            this.$el.find('.oculo-scroll-indicator').addClass('oculo-transparent');
        }
        else {
            this.$el.find('.oculo-scroll-indicator').removeClass('oculo-transparent');
        }
    },
    
    isOpenChange: function (value) {
        if (!value) {
            TweenMax.to(this.el, 0.5, { x: this.$el.width() - 30 });
        }
        else {
            TweenMax.to(this.el, 0.5, { x: 0 });
        }
    }
});
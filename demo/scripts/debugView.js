'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

var DebugView = Backbone.View.extend({
    initialize: function (options) {
        this.properties = Object.getOwnPropertyNames(this.model).sort().filter(function (item) {
            return typeof this[item] !== 'function' && typeof this[item] !== 'object';
        }, this.model);
        
        this.propertyViews = new Array(this.properties.length);
        
        this.properties.forEach(function (item, index) {
            this.propertyViews[index] = new DebugPropertyView({
                model: this.model,
                property: item,
                className: 'debug-property'
            });
        }, this);
    },

    render: function() {
        var template = '<div class="content"></div>';
        var compiledTemplate = _.template(template, { variable: 'data' });
        var fragment = document.createDocumentFragment();
        
        this.propertyViews.forEach(function (item) {
            fragment.appendChild(item.render().el);
        });
        
        this.$el.html(compiledTemplate);
        this.$el.find('.content').append(fragment);
        
        return this;
    },
    
    update: function () {
        this.propertyView.forEach(function (item) {
            item.update();
        });
        
        return this;
    }
});
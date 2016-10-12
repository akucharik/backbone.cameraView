'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

var DebugPropertiesView = Backbone.View.extend({
    initialize: function (options) {
        var properties = Object.getOwnPropertyNames(this.model).sort().filter(property => typeof this.model[property] !== 'function' && (typeof this.model[property] !== 'object' || this.model[property] === null));
        
        this.childViews = new Array(properties.length);
        
        properties.forEach(function (property, index) {
            this.childViews[index] = new DebugPropertyView({
                model: this.model,
                property: property,
                tagName: 'li'
            });
        }, this);
        
        this.listenTo(this, 'attach', this._attachChildren);
        
//        this.listenTo(this, 'attach', function () { console.log('attach properties: ' + this.cid); });
//        this.listenTo(this, 'render', function () { console.log('render properties: ' + this.cid); });
//        this.listenTo(this, 'update', function () { console.log('update properties: ' + this.cid); });
    },
    
    render: function() {
        var fragment = document.createDocumentFragment();
        
        this.childViews.forEach(function (view) {
            fragment.appendChild(view.render().el);
        });
        this.el.appendChild(fragment);
        this.trigger('render');
        
        return this;
    },
    
    update: function () {
        this.childViews.forEach(function (view) {
            view.update();
        });
        this.trigger('update');
        
        return this;
    },
    
    destroy: function () {
        this.childViews.forEach(function (view) {
            view.destroy();
        });
        this.trigger('destroy');
        this.remove();
    },
    
    _attachChildren: function () {
        this.childViews.forEach(function (view) {
            view.trigger('attach');
        });
    }
});
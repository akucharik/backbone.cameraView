'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

// TODO: Add documentation
var DebugScrollView = Backbone.View.extend({
    initialize: function (options) {
        ScrollView.call(this, options);
        
        this.childView = new DebugPropertiesView({
            model: this.model,
            tagName: 'ul'
        });
        
        this.listenTo(this, 'attach', this._attachChildren);
        
//        this.listenTo(this, 'attach', function () { console.log('attach scroll: ' + this.cid); });
//        this.listenTo(this, 'render', function () { console.log('render scroll: ' + this.cid); });
//        this.listenTo(this, 'update', function () { console.log('update scroll: ' + this.cid); });
    },
    
    render: function() {
        var template = '<h2>Debug Info</h2>';
        var compiledTemplate = _.template(template, { variable: 'data' });
        
        this.scrollElement.innerHTML = compiledTemplate();
        this.scrollElement.appendChild(this.childView.render().el);
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
    
    _attachChildren: function () {
        this.childView.trigger('attach');
    }
});

ScrollView.install(DebugScrollView.prototype);
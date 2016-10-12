'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

var DebugPropertyView = Backbone.View.extend({
    initialize: function (options) {
        this.property = options.property || '';
        
//        this.listenTo(this, 'attach', function () { console.log('attach property: ' + this.property); });
//        this.listenTo(this, 'render', function () { console.log('render property: ' + this.property); });
//        this.listenTo(this, 'update', function () { console.log('update property: ' + this.property); });
    },

    render: function() {
        var template = '<label><%= data.property %>:</label> <span class="value"><%= data.model[data.property] %></span>';
        var compiledTemplate = _.template(template, { variable: 'data' });
        
        this.el.innerHTML = compiledTemplate({ 
            model: this.model,
            property: this.property
        });
        this.trigger('render');
        
        return this;
    },
    
    update: function () {
        this.el.querySelector('.value').innerHTML = this.model[this.property] === null ? 'null' : this.model[this.property];
        this.trigger('update');
        
        return this;
    },
    
    destroy: function () {
        this.trigger('destroy');
        this.remove();
    }
});
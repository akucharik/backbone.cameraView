'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

var DebugPropertyView = Backbone.View.extend({
    initialize: function (options) {
        this.property = options.property || '';
    },

    render: function() {
        var template = '<label><%= data.property %>:</label> <span class="value"><%= data.object[data.property] %></span>';
        var compiledTemplate = _.template(template, { variable: 'data' });
        
        this.$el.html(compiledTemplate({ 
            object: this.model,
            property: this.property
        }));
        
        return this;
    },
    
    update: function () {
        this.$('.value').html(this.model[this.property]);
        
        return this;
    }
});
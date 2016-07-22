'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/*

var zoomView = new BehaviorView({
    name: 'focusOn',
    properties: ['zoom', 'x', 'y'],
    template: _.template(document.getElementById('behaviorTemplate'))
});

*/

var BehaviorView = Backbone.View.extend({
    initialize: function (options) {
        this.model = {
            name: options.name || '',
            properties: options.properties || {}
        };
    },

    render: function() {
        var template = '<button><%= name %></button>';
        var compiledTemplate = _.template(template, { variable: 'data' });
        
        this.$el.html(compiledTemplate(this.model));
        
        return this;
    }
});
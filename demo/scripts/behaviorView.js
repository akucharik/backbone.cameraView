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
        
        this.render();
    },

    render: function() {
        this.$el.html(this.template(this.model));
    },
    
    template: _.template(document.getElementById('behaviorTemplate').innerHTML)
});
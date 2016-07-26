'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

// TODO: Add documentation
class ScrollView {
    constructor () {}
    
    // TODO: Add documentation
    static install (target, options) {
        var properties = Object.getOwnPropertyNames(ScrollView.prototype);
        
        properties.splice(properties.indexOf('constructor'), 1);
        properties.forEach(function (property) {
            target[property] = ScrollView.prototype[property];
        });
        
        // TODO: Pass in the element selectors as parameters
        // TODO: Add documentation
        target.scrollElement = null;
        
        // TODO: Add documentation
        target.scrollIndicatorElement = null;
        
        // TODO: Add documentation
        target.scrollPosition = 0; 
        
        target.checkScrollPosition = target.checkScrollPosition.bind(target);
        
        target.listenTo(target, 'render', target.initializeScrollView);
        target.listenTo(target, 'attach', target.checkScrollPosition);
        target.listenTo(target, 'destroy', target.destroyScrollView);
        
        window.addEventListener('resize', target.checkScrollPosition);
    }
    
    // TODO: Add documentation
    initializeScrollView () {
        this.scrollElement = this.el.querySelector('.oculo-scrollable');
        this.scrollElement.addEventListener('scroll', this.checkScrollPosition);
        
        this.scrollIndicatorElement = this.el.querySelector('.oculo-scroll-indicator');
        this.scrollIndicatorElement.style.opacity = 0;
    }
    
    // TODO: Add documentation
    destroyScrollView () {
        window.removeEventListener('resize', this.checkScrollPosition);
    }
    
    // TODO: Add documentation
    /**
    * Checks the scroll position and shows/hides the scroll indicator.
    */
    checkScrollPosition () {
        var hiddenHeight = this.scrollElement.scrollHeight - this.scrollElement.clientHeight;
        
        this.scrollPosition = hiddenHeight > 0 ? this.scrollElement.scrollTop / hiddenHeight : 1;
        this.scrollIndicatorElement.style.opacity = (this.scrollPosition !== 1) ? 1 : 0;
    }
}
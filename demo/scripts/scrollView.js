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
        
        target.hasScrolling = false;
        
        // TODO: Pass in the element selectors as parameters
        target.scrollElement = null;
        target.scrollIndicatorElement = null;
        
        // TODO: Set up non-enumerable read-only property that defines the position constants
        target.scrollPosition = '';
        target.scrollRatio = 0;
        
        target.checkScroll = target.checkScroll.bind(target);
        
        target.listenTo(target, 'render', target.initializeScrollView);
        target.listenTo(target, 'attach', target.checkScroll);
        target.listenTo(target, 'change:hasScrolling', target.setScrollIndicatorVisibility);
        target.listenTo(target, 'change:scrollPosition', target.setScrollIndicatorVisibility);
        target.listenTo(target, 'destroy', target.destroyScrollView);
        
        window.addEventListener('resize', target.checkScroll);
    }
    
    // TODO: Add documentation
    initializeScrollView () {
        this.scrollElement = this.el.querySelector('.oculo-scrollable');
        this.scrollElement.addEventListener('scroll', this.onScroll.bind(this));
        
        this.scrollIndicatorElement = this.el.querySelector('.oculo-scroll-indicator');
        this.scrollIndicatorElement.style.opacity = 0;
    }
    
    destroyScrollView () {
        window.removeEventListener('resize', this.checkScroll);
    }
    
    // TODO: Add documentation
    /**
    * Checks if an element is scrolled to the bottom.
    */
    checkScroll () {
        // TODO: Rework change event emitting using defineProperty and _hasScrolling, _scrollPosition
        var hasScrolling = this.hasScrolling;
        var scrollPosition = this.scrollPosition;
        
        this.hasScrolling = (this.scrollElement.scrollHeight === this.scrollElement.clientHeight) ? false : true;
        
        if (this.hasScrolling !== hasScrolling) {
            this.trigger('change:hasScrolling');    
        }
        
        if (this.scrollElement.scrollTop === 0) {
            this.scrollPosition = 'top';
        }
        else if (this.scrollElement.scrollHeight - this.scrollElement.scrollTop === this.scrollElement.clientHeight) {
            this.scrollPosition = 'bottom';
        }
        else {
            this.scrollPosition = 'middle';
        }
        
        if (this.scrollPosition !== scrollPosition) {
            this.trigger('change:scrollPosition');    
        }
        
        this.scrollRatio = this.scrollElement.scrollTop / (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
    }
    
    // TODO: Add documentation
    onScroll () {
        this.checkScroll();
    }
    
    // TODO: Add documentation
    setScrollIndicatorVisibility (value) {
        if (this.hasScrolling === true && this.scrollPosition !== 'bottom') {
            this.scrollIndicatorElement.style.opacity = 1;
        }
        else {
            this.scrollIndicatorElement.style.opacity = 0;
        }
    }
}
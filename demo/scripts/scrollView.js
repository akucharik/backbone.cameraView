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
        target.scrollElement = null;
        target.scrollIndicatorElement = null;
        
        target._scrollPosition = 0;
        
        Object.defineProperty(target, 'scrollPosition', {
            get: function () {
                return this._scrollPosition;
            },

            set: function (value) {
                if (value != this._scrollPosition) {
                    this._scrollPosition = value;
                    this.trigger('change:scrollPosition');
                }
            }
        }); 
        
        // TODO: Should be able to remove "hasScrolling" and just use "scrollPosition"
        target._hasScrolling = false;
        
        Object.defineProperty(target, 'hasScrolling', {
            get: function () {
                return this._hasScrolling;
            },

            set: function (value) {
                if (value != this._hasScrolling) {
                    this._hasScrolling = value;
                    this.trigger('change:hasScrolling');
                }
            }
        });  
        
        target.checkScroll = target.checkScroll.bind(target);
        target.onScroll = target.onScroll.bind(target);
        
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
        this.scrollElement.addEventListener('scroll', this.onScroll);
        
        this.scrollIndicatorElement = this.el.querySelector('.oculo-scroll-indicator');
        this.scrollIndicatorElement.style.opacity = 0;
    }
    
    destroyScrollView () {
        window.removeEventListener('resize', this.checkScroll);
    }
    
    // TODO: Add documentation
    /**
    * Sets the scroll position.
    */
    checkScroll () {
        this.hasScrolling = (this.scrollElement.scrollHeight === this.scrollElement.clientHeight) ? false : true;
        this.scrollPosition = this.hasScrolling ? this.scrollElement.scrollTop / (this.scrollElement.scrollHeight - this.scrollElement.clientHeight) : 1;
    }
    
    // TODO: Add documentation
    onScroll () {
        this.checkScroll();
    }
    
    // TODO: Add documentation
    setScrollIndicatorVisibility () { console.log(this.scrollPosition);
        this.scrollIndicatorElement.style.opacity = (this.hasScrolling && this.scrollPosition !== 1) ? 1 : 0;
    }
}
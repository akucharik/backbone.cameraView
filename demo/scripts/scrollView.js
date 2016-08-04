'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

// TODO: Add documentation
class ViewPlus {
    constructor () {}
    
    // TODO: Add documentation
    static extend (target, obj) {
        var properties = Object.getOwnPropertyNames(obj);
        
        properties.splice(properties.indexOf('constructor'), 1);
        properties.forEach(function (property) {
            target[property] = obj[property];
        });
    }
}

// TODO: Add documentation
/**
* @mixin
*/
var ScrollView = function (options) {
    options = options || {};
    
    /**
    * @property {string} scrollViewClassName - The css classes for the view element.
    */
    this.scrollViewClassName = 'scrollview ' + options.scrollViewClassName;
    
    /**
    * @property {Element} scrollElement - The scroll element.
    */
    this.scrollElement = this.el;
    
    /**
    * @property {string} scrollElementClassName - The css classes for the scroll element.
    */
    this.scrollElementClassName = 'scrollview-scroll-element ' + options.scrollElementClassName;

    /**
    * @property {Element} scrollHintTopElement - The top scroll hint element.
    */
    this.scrollHintTopElement = document.createElement('div');

    /**
    * @property {Element} scrollHintBottomElement - The bottom scroll hint element.
    */
    this.scrollHintBottomElement = document.createElement('div');
    
    /**
    * @property {string} scrollHintTopClassName - The css classes for the top scroll hint element.
    */
    this.scrollHintTopClassName = 'scrollview-scroll-hint-top ' + options.scrollHintTopClassName;
    
    /**
    * @property {string} scrollHintBottomClassName - The css classes for the bottom scroll hint element.
    */
    this.scrollHintBottomClassName = 'scrollview-scroll-hint-bottom ' + options.scrollHintBottomClassName;

    /**
    * @property {boolean} scrollHintTopEnabled - Whether or not the top scroll hint is enabled.
    */
    this.scrollHintTopEnabled = options.scrollHintTopEnabled === undefined ? true : options.scrollHintTopEnabled;

    /**
    * @property {boolean} scrollHintBottomEnabled - Whether or not the bottom scroll hint is enabled.
    */
    this.scrollHintBottomEnabled = options.scrollHintBottomEnabled === undefined ? true : options.scrollHintBottomEnabled;

    /**
    * The scroll position.
    * @name ScrollView#scrollPosition
    * @property {number} scrollPosition - Gets the scroll element's scroll position.
    */
    Object.defineProperty(this, 'scrollPosition', {
        get: function () {
            var hiddenHeight = this.scrollElement.scrollHeight - this.scrollElement.clientHeight;

            return hiddenHeight > 0 ? this.scrollElement.scrollTop / hiddenHeight : null;
        }
    });

    this.setElement(document.createElement('div'));
    this.updateScrollView = this.updateScrollView.bind(this);

    this.listenTo(this, 'render', this.onScrollViewRender);
    this.listenTo(this, 'attach', this.onScrollViewAttach);
    this.listenTo(this, 'destroy', this.onScrollViewDestroy);

    this.scrollElement.addEventListener('mouseenter', this.onScrollViewMouseenter);
    this.scrollElement.addEventListener('mouseleave', this.onScrollViewMouseleave);
    this.scrollElement.addEventListener('scroll', this.updateScrollView);
    window.addEventListener('resize', this.updateScrollView);
};

/**
* @static
* @param {ViewPlus} target - The view on which to install the ScrollView.
*/
ScrollView.install = function (target) {
    ViewPlus.extend(target, ScrollView.prototype);
};

// TODO: Add documentation
ScrollView.prototype.onScrollViewRender = function () {
    this.el.className = this.scrollViewClassName;
    this.scrollElement.className = this.scrollElementClassName;
    this.scrollHintTopElement.className = this.scrollHintTopClassName;
    this.scrollHintBottomElement.className = this.scrollHintBottomClassName;
    this.scrollHintTopElement.style.opacity = 0;
    this.scrollHintBottomElement.style.opacity = 0;
    this.el.appendChild(this.scrollElement);
    this.el.appendChild(this.scrollHintTopElement);
    this.el.appendChild(this.scrollHintBottomElement);
    
    return this;
};

// TODO: Add documentation
ScrollView.prototype.onScrollViewAttach = function () {
    this.updateScrollView();
    
    return this;
};

// TODO: Add documentation
ScrollView.prototype.onScrollViewDestroy = function () {
    window.removeEventListener('resize', this.updateScrollView);
    document.body.style.overflow = null;
};

// TODO: Add documentation
ScrollView.prototype.updateScrollView = function (event) {
    var scrollPosition = this.scrollPosition;

    if (this.scrollHintTopEnabled) {
        this.scrollHintTopElement.style.opacity = (scrollPosition !== null && scrollPosition !== 0) ? 1 : 0;
    }

    if (this.scrollHintBottomEnabled) {
        this.scrollHintBottomElement.style.opacity = (scrollPosition !== null && scrollPosition !== 1) ? 1 : 0;
    }
};

// TODO: Add documentation
ScrollView.prototype.onScrollViewMouseenter = function (event) {
    document.body.style.overflow = 'hidden';
};

// TODO: Add documentation
ScrollView.prototype.onScrollViewMouseleave = function (event) {
    document.body.style.overflow = null;
};
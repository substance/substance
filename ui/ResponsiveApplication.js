'use strict';

var inBrowser = require('substance/util/inBrowser');
var DefaultDOMElement = require('substance/ui/DefaultDOMElement');
var Component = require('substance/ui/Component');
var cloneDeep = require('lodash/cloneDeep');

var I18n = require('substance/ui/i18n');
I18n.instance.load(require('../i18n/en'));

function ResponsiveApplication() {
  Component.apply(this, arguments);

  this.pages = {};

  this.handleActions({
    'navigate': this.navigate,
  });
}

ResponsiveApplication.Prototype = function() {

  this.getInitialState = function() {
    return {
      route: undefined,
      mobile: this._isMobile()
    };
  };

  this.didMount = function() {
    if (inBrowser) {
      var _window = DefaultDOMElement.getBrowserWindow();
      _window.on('resize', this._onResize, this);
    }
    this.router = this.getRouter();
    this.router.on('route:changed', this._onRouteChanged, this);
    var route = this.router.readRoute();
    // Replaces the current entry without creating new history entry
    // or triggering hashchange
    this.navigate(route, {replace: true});
  };

  this.dispose = function() {
    this.router.off(this);
    this.router.dispose();
  };

  /*
    Used to navigate the app based on given route.
  
    Example route: {documentId: 'example.xml'}
    On app level, never use setState/extendState directly as this may
    lead to invalid states.
  */
  this.navigate = function(route, opts) {
    this.extendState({
      route: route
    });
    this.router.writeRoute(route, opts);
  };

  this._onRouteChanged = function(route) {
    console.log('NotesApp._onRouteChanged', route);
    this.navigate(route, {replace: true});
  };

  this._isMobile = function() {
    if (inBrowser) {
      return window.innerWidth < 700;  
    }
  };

  this._onResize = function() {
    if (this._isMobile()) {
      // switch to mobile
      if (!this.state.mobile) {
        this.extendState({
          mobile: true
        });
      }
    } else {
      if (this.state.mobile) {
        this.extendState({
          mobile: false
        });
      }
    }
  };

  this._getPage = function() {
    return this.state.route.page || this.getDefaultPage();
  };

  this._getPageClass = function() {
    var page = this._getPage();
    return this.pages[page];
  };

  this._getPageProps = function() {
    var props = cloneDeep(this.state.route);
    delete props.page;
    props.mobile = this.state.mobile;
    return props;
  };

  this.addPage = function(pageName, PageClass) {
    this.pages[pageName] = PageClass;
  };

  this.renderPage = function($$) {
    var PageClass = this._getPageClass();
    var pageName = this._getPage();
    return $$(PageClass, this._getPageProps()).ref(pageName);
  };

  this.render = function($$) {
    var el = $$('div').addClass('sc-responsive-application');

    if (this.state.route === undefined) {
      // Not yet initialized by router
      return el;
    }

    el.append(
      this.renderPage($$)
    );
    
    return el;
  };

};

Component.extend(ResponsiveApplication);
module.exports = ResponsiveApplication;
import cloneDeep from '../../util/cloneDeep'
import inBrowser from '../../util/inBrowser'
import DefaultDOMElement from '../../dom/DefaultDOMElement'
import Component from '../../ui/Component'

class ResponsiveApplication extends Component {
  constructor(...args) {
    super(...args)

    this.pages = {}

    this.handleActions({
      'navigate': this.navigate
    })
  }

  getInitialState() {
    return {
      route: undefined,
      mobile: this._isMobile()
    }
  }

  didMount() {
    if (inBrowser) {
      let _window = DefaultDOMElement.getBrowserWindow()
      _window.on('resize', this._onResize, this)
    }
    this.router = this.getRouter()
    this.router.on('route:changed', this._onRouteChanged, this)
    let route = this.router.readRoute()
    // Replaces the current entry without creating new history entry
    // or triggering hashchange
    this.navigate(route, {replace: true})
  }

  dispose() {
    this.router.off(this)
    this.router.dispose()
  }

  /*
    Used to navigate the app based on given route.

    Example route: {documentId: 'example.xml'}
    On app level, never use setState/extendState directly as this may
    lead to invalid states.
  */
  navigate(route, opts) {
    this.extendState({
      route: route
    })
    this.router.writeRoute(route, opts)
  }

  _onRouteChanged(route) {
    // console.log('NotesApp._onRouteChanged', route);
    this.navigate(route, {replace: true})
  }

  _isMobile() {
    if (inBrowser) {
      return window.innerWidth < 700
    }
  }

  _onResize() {
    if (this._isMobile()) {
      // switch to mobile
      if (!this.state.mobile) {
        this.extendState({
          mobile: true
        })
      }
    } else {
      if (this.state.mobile) {
        this.extendState({
          mobile: false
        })
      }
    }
  }

  _getPage() {
    return this.state.route.page || this.getDefaultPage()
  }

  _getPageClass() {
    let page = this._getPage()
    return this.pages[page]
  }

  _getPageProps() {
    let props = cloneDeep(this.state.route)
    delete props.page
    props.mobile = this.state.mobile
    return props
  }

  addPage(pageName, PageClass) {
    this.pages[pageName] = PageClass
  }

  renderPage($$) {
    let PageClass = this._getPageClass()
    let pageName = this._getPage()
    return $$(PageClass, this._getPageProps()).ref(pageName)
  }

  render($$) {
    let el = $$('div').addClass('sc-responsive-application')

    if (this.state.route === undefined) {
      // Not yet initialized by router
      return el
    }

    el.append(
      this.renderPage($$)
    )

    return el
  }

}

export default ResponsiveApplication

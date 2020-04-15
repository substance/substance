import { Component, $$ } from '../dom'
import { Input } from '../ui'
import { debounce, platform } from '../util'
import ListGroup from './ListGroup'

export default class AutoComplete extends Component {
  constructor (...args) {
    super(...args)
    // TODO: experiment with different cases
    // it might make sense to use throttled function for small strings
    // e.g. throttle is good when the user type something for observing and
    // debounce is good when the user type something specific (e.g. email or complete username)
    // For in memory cases we can don't need this at all
    this._debouncedAutocompleteSearch = debounce(this.autocompleteSearch.bind(this), 500)
  }

  getInitialState () {
    return {
      searchResults: [],
      searchString: ''
    }
  }

  render () {
    const { placeholder } = this.props
    const el = $$('div', { class: 'sc-autocomplete' })
    el.append(
      $$(Input, { placeholder })
        .ref('input')
        .on('input', this._debouncedAutocompleteSearch.bind(this))
    )
    return el
  }

  renderNotFound () {
    const { notFound } = this.props
    const { searchString } = this.state
    return $$('div', { class: 'sc-autocomplete-no-results' },
      notFound(searchString)
    ).on('click', this._onNotFoundClick.bind(this, searchString))
  }

  renderSearchResults () {
    const { searchResults } = this.state
    const { itemClass } = this.props
    const { width } = this._getInputRect()
    if (searchResults.length === 0) {
      return this.renderNotFound().css('width', width)
    }
    return $$(ListGroup, { itemClass, items: searchResults }).css('width', width)
  }

  async autocompleteSearch () {
    const searchString = this.refs.input.val()
    const { search } = this.props
    this._hideSearchResults()
    this.setState({ searchString })
    const searchResults = await search(searchString)
    // We care only about results of latest search string
    if (this.state.searchString === searchString) {
      this.extendState({ searchResults })
      this._showSearchResults()
    }
  }

  reset () {
    this._hideSearchResults()
    this.refs.input.val('')
    this.setState(this.getInitialState())
  }

  _onNotFoundClick (searchString) {
    this.send('item:notfoundaction', searchString)
  }

  _hideSearchResults () {
    this.send('releasePopover', this)
  }

  _showSearchResults () {
    this.send('requestPopover', {
      requester: this,
      desiredPos: this._getDesiredPopoverPos(),
      content: () => {
        return this.renderSearchResults()
      },
      position: 'relative'
    })
  }

  _getInputRect () {
    if (platform.inBrowser) {
      const input = this.refs.input
      return input.el.getNativeElement().getBoundingClientRect()
    }
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  _getDesiredPopoverPos () {
    const inputRect = this._getInputRect()
    if (inputRect) {
      let { left: x, top: y, height, width } = inputRect
      y = y + height + 10
      x = x + width / 2
      return { x, y }
    }
  }
}

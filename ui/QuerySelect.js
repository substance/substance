import { Component, $$, domHelpers } from '../dom'
import { debounce, platform, uuid, substanceGlobals } from '../util'
import Input from './Input'

const DEFAULT_QUERY_SELECT_DELAY = 500

export default class QuerySelect extends Component {
  constructor (...args) {
    super(...args)

    // TODO:
    const QUERY_SELECT_DELAY = substanceGlobals.QUERY_SELECT_DELAY || DEFAULT_QUERY_SELECT_DELAY
    this._debouncedQuery = debounce(this._query.bind(this), QUERY_SELECT_DELAY)
  }

  render () {
    const { placeholder } = this.props
    const el = $$('div', { class: 'sc-query-select' })
    el.append(
      $$(Input, { placeholder })
        .ref('input')
        .on('focus', this._onFocus)
        .on('blur', this._onBlur)
        .on('input', this._onInput)
    )
    return el
  }

  reset () {
    this._hideOptions()
    this.refs.input.val('')
    this.setState(this.getInitialState())
  }

  _onInput (event) {
    // console.log('QuerySelect._onInput()')
    domHelpers.stop(event)
    this._debouncedQuery()
  }

  _onFocus (event) {
    domHelpers.stop(event)
    // console.log('QuerySelect._onFocus()')
    this._query()
  }

  _onBlur (event) {
    // console.log('QuerySelect._onBlur()')
    domHelpers.stop(event)
    this._hideOptions()
  }

  async _query () {
    const { query } = this.props
    const queryString = this.refs.input.val()
    // this._hideOptions()

    const queryId = uuid()
    this._lastQueryId = queryId
    const options = await query(queryString)

    // ATTENTION: stop if this query has been superseded by a new one
    if (this._lastQueryId !== queryId) return

    this._showOptions(options)
  }

  _hideOptions () {
    this.send('releasePopover', this)
  }

  _showOptions (options) {
    if (options.length > 0) {
      // console.log('QuerySelect._showOptions', options)
      this.send('requestPopover', {
        requester: this,
        desiredPos: this._getDesiredPopoverPos(),
        content: () => {
          return this._renderOptions(options)
        },
        position: 'relative',
        ignoreClicksInside: this.refs.input.getElement()
      })
    }
  }

  _renderOptions (options) {
    const { optionRenderer } = this.props
    const { width } = this._getInputRect()
    const optionsEl = $$('div', { class: 'se-options' }).css('width', width)
    for (const option of options) {
      const renderedOption = optionRenderer(option)
      optionsEl.append(
        $$('div', { class: 'se-option' }, renderedOption).on('click', this._onClickOption.bind(this, option))
      )
    }
    return optionsEl
  }

  _onClickOption (option, e) {
    e.stopPropagation()
    this.emit('change', { option })
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

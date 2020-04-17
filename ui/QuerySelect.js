import { Component, $$, domHelpers } from '../dom'
import { debounce, platform, uuid, keys, parseKeyEvent } from '../util'
import Input from './Input'

const DEFAULT_QUERY_SELECT_DELAY = 500

export default class QuerySelect extends Component {
  constructor (...args) {
    super(...args)

    if (this.props.local) {
      // no debounce
      this._delayedQuery = debounce(this._query.bind(this), 0)
    } else {
      this._delayedQuery = debounce(this._query.bind(this), DEFAULT_QUERY_SELECT_DELAY)
    }

    // volatile state
    this._selected = null
    this._options = null
  }

  didMount () {
    if (this.props.autofocus) {
      this.focus()
    }
  }

  render () {
    const { placeholder } = this.props
    const el = $$('div', { class: 'sc-query-select' })
    el.append(
      $$(Input, { placeholder })
        .ref('input')
        .on('focus', this._onFocus)
        .on('input', this._onInput)
        .on('keydown', this._onKeydown)
        .on('click', this._onClick)
        .on('change', domHelpers.stop)
    )
    return el
  }

  focus () {
    this.refs.input.focus()
  }

  reset () {
    this._hideOptions()
    this.refs.input.val('')
  }

  async _query () {
    const { query } = this.props
    const queryString = this.refs.input.val()
    // TODO: not to hide options feels a bit less jumpy to me
    // this._hideOptions()
    const queryId = uuid()
    this._lastQueryId = queryId
    try {
      this._running = true
      this._resetSelection()
      const options = await query(queryString)
      // ATTENTION: stop if this query has been superseded by a new one
      // if (this._lastQueryId !== queryId) return
      this._options = options
      this._showOptions(options)
    } finally {
      this._running = false
    }
  }

  _hideOptions () {
    this.send('releasePopover', this)
  }

  async _showOptions (options) {
    if (options.length > 0) {
      // console.log('QuerySelect._showOptions', options)
      this._popoverId = await this.send('requestPopover', {
        requester: this,
        desiredPos: this._getDesiredPopoverPos(),
        content: () => {
          return this._renderOptions(options)
        },
        position: 'relative',
        ignoreClicksInside: this.refs.input.getElement(),
        onClose: () => {
          this._showsOptions = false
        }
      })
      this._showsOptions = true
    }
  }

  _rerenderOptions (options) {
    if (this._popoverId) {
      console.log('QuerySelect._rerenderOptions', options)
      this.send('requestPopover', {
        update: true,
        requestId: this._popoverId,
        content: () => {
          return this._renderOptions(options)
        }
      })
    }
  }

  _renderOptions (options) {
    const optionRenderer = this.props.optionRenderer || this._renderOption
    const { width } = this._getInputRect()
    const optionsEl = $$('div', { class: 'se-options' }).css('width', width)
    for (let idx = 0; idx < options.length; idx++) {
      const option = options[idx]
      const optionEl = optionRenderer(option)
      optionEl.on('click', this._onClickOption.bind(this, option))
      if (idx === this._selected) {
        optionEl.addClass('sm-selected')
      }
      optionsEl.append(optionEl)
    }
    return optionsEl
  }

  _renderOption (option) {
    return $$(QuerySelectOption, { option })
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

  _selectOption (option) {
    this._hideOptions()
    this.el.emit('change', option)
  }

  _resetSelection () {
    this._selected = null
  }

  _onInput (event) {
    // console.log('QuerySelect._onInput()')
    domHelpers.stop(event)
    this._delayedQuery()
  }

  _onFocus (event) {
    domHelpers.stop(event)
    // console.log('QuerySelect._onFocus()')
    if (this.props.queryOnFocus) {
      this._delayedQuery()
    }
  }

  _onClick (event) {
    if (!this._running) {
      this._delayedQuery()
    }
  }

  _onKeydown (event) {
    const options = this._options
    const N = options.length
    switch (event.keyCode) {
      case keys.UP: {
        domHelpers.stopAndPrevent(event)
        if (this._selected === null) {
          this._selected = N - 1
        } else {
          this._selected = (N + this._selected - 1) % N
        }
        this._rerenderOptions(options)
        break
      }
      case keys.DOWN: {
        domHelpers.stopAndPrevent(event)
        if (this._selected === null) {
          this._selected = 0
        } else {
          this._selected = (this._selected + 1) % N
        }
        this._rerenderOptions(options)
        break
      }
      case keys.ESCAPE: {
        if (this._showsOptions) {
          domHelpers.stopAndPrevent(event)
          this._hideOptions()
        }
        break
      }
      case keys.ENTER: {
        if (this._options && this._selected !== null) {
          const combo = parseKeyEvent(event, true)
          // only plain ENTER (no meta)
          if (combo === '') {
            const option = this._options[this._selected]
            if (option) {
              domHelpers.stopAndPrevent(event)
              this._selectOption(option)
            }
          }
        }
      }
    }
  }

  _onClickOption (option, e) {
    e.stopPropagation()
    this._selectOption(option)
  }
}

function QuerySelectOption (props) {
  const option = props.option
  return $$('div', { class: `sc-query-select-option sm-${option.action}` }, option.label)
}

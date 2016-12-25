import Component from '../../ui/Component'
import forEach from '../../util/forEach'

/*
  A tabbed pane layout component. The actual content is specified via append.

  @class TabbedPane
  @component

  @prop {Object[]} tabs an array of objects with id and name properties
  @prop {String} activeTab id of currently active tab

  @example

  ```js
  $$(TabbedPane, {
    tabs: [
      {id: 'tabA', 'A'},
      {id: 'tabB', 'B'},
    ],
    activeTab: 'tabA'
  }).ref('tabbedPane').append(
    tabAContent
  )
  ```
*/

class TabbedPane extends Component {

  render($$) {
    let el = $$('div').addClass('sc-tabbed-pane')
    let tabsEl = $$('div').addClass('se-tabs')
    forEach(this.props.tabs, function(tab) {
      let tabEl = $$('a')
        .addClass("se-tab")
        .attr({
          href: "#",
          "data-id": tab.id,
        })
        .on('click', this.onTabClicked)
      if (tab.id === this.props.activeTab) {
        tabEl.addClass("sm-active")
      }
      tabEl.append(
        $$('span').addClass('label').append(tab.name)
      )
      tabsEl.append(tabEl)
    }.bind(this))

    el.append(tabsEl)
    // Active content
    el.append(
      $$('div').addClass('se-tab-content').ref('tabContent').append(
        this.props.children
      )
    )
    return el
  }

  onTabClicked(e) {
    e.preventDefault()
    let tabId = e.currentTarget.dataset.id
    this.send('switchTab', tabId)
  }
}

export default TabbedPane

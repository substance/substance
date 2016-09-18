import Component from './Component'
import Icon from './FontAwesomeIcon'

class TOC extends Component {

  didMount() {
    let tocProvider = this.context.tocProvider
    tocProvider.on('toc:updated', this.onTOCUpdated, this)
  }

  dispose() {
    let tocProvider = this.context.tocProvider
    tocProvider.off(this)
  }

  render($$) {
    let tocProvider = this.context.tocProvider
    let activeEntry = tocProvider.activeEntry
    let ScrollPane = this.getComponent('scroll-pane')

    let tocEntries = $$("div")
      .addClass("se-toc-entries")
      .ref('tocEntries');

    let entries = tocProvider.getEntries()
    for (let i = 0; i < entries.length; i++) {
      let entry = entries[i]
      let level = entry.level

      let tocEntryEl = $$('a')
        .addClass('se-toc-entry')
        .addClass('sm-level-'+level)
        .attr({
          href: "#",
          "data-id": entry.id,
        })
        .ref(entry.id)
        .on('click', this.handleClick)
        .append(
          $$(Icon, {icon: 'fa-caret-right'}),
          entry.name
        );
      if (activeEntry === entry.id) {
        tocEntryEl.addClass("sm-active")
      }
      tocEntries.append(tocEntryEl)
    }

    let el = $$('div').addClass('sc-toc-panel').append(
      $$(ScrollPane).ref('panelEl').append(
        tocEntries
      )
    );
    return el;
  }

  getDocument() {
    return this.context.doc
  }

  onTOCUpdated() {
    this.rerender()
  }

  handleClick(e) {
    let nodeId = e.currentTarget.dataset.id
    e.preventDefault()
    this.send('tocEntrySelected', nodeId)
  }

}

export default TOC

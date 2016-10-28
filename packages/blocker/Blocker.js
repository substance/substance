import Component from '../../ui/Component'

class Blocker extends Component {
  render($$) {
    let el = $$('div').addClass('sc-blocker')
    let dialog = $$('div').addClass('se-dialog')
    dialog.append('Loading....')
    el.append(dialog)
    return el
  }

  didMount() {
    setTimeout(()=>{
      this.addClass('sm-visible')
    }, 500)
  }
}

export default Blocker

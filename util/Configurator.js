import AbstractConfigurator from './AbstractConfigurator'
import FontAwesomeIconProvider from '../ui/FontAwesomeIconProvider'

// Setup default label provider
import LabelProvider from '../ui/DefaultLabelProvider'

/*
  Default Configurator for most Substance apps

  If you need app-specific API's just extend
  and configure your custom configurator.
*/
class Configurator extends AbstractConfigurator {

  getIconProvider() {
    return new FontAwesomeIconProvider(this.config.icons)
  }

  getLabelProvider() {
    return new LabelProvider(this.config.labels)
  }
}

export default Configurator

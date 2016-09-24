import InlineWrapper from './InlineWrapper'
import InlineWrapperComponent from './InlineWrapperComponent'
import InlineWrapperConverter from './InlineWrapperConverter'

/*
  This package adds a node to the model which can be used
  to use a block-level node within an inline context.

    The quick brown fox jumps over the lazy <fig><img src='./dog.jpg'/></fig>.

  To register the converter you must provide `config.converters` which is
  an array of names of the converters you want this to be registered in.
*/
export default {
  name: 'inline-wrapper',
  configure: function(config, options) {
    config.addNode(InlineWrapper)
    config.addComponent(InlineWrapper.type, InlineWrapperComponent)
    if (options.converters) {
      options.converters.forEach(function(name) {
        config.addConverter(name, InlineWrapperConverter)
      })
    }
  },
  InlineWrapper: InlineWrapper,
  InlineWrapperComponent: InlineWrapperComponent,
  InlineWrapperConverter: InlineWrapperConverter
}

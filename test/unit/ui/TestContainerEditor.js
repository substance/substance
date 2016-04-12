var ContainerEditor = require('../../../ui/ContainerEditor');
var Controller = require('../../../ui/Controller');

var TestContainerEditor = Controller.extend({
  render: function($$) {
    return $$('div').append(
      $$(ContainerEditor, {
        doc: this.props.doc,
        containerId: 'main',
        name: 'main'
      }).ref('editor')
    );
  }
});

module.exports = TestContainerEditor;

'use strict';

import NodeComponent from '../../ui/NodeComponent'
import percentage from '../../util/percentage'

function ImageComponent() {
  ImageComponent.super.apply(this, arguments);
}

ImageComponent.Prototype = function() {

  var _super = ImageComponent.super.prototype;

  this.didMount = function() {
    _super.didMount.call(this);
    var node = this.props.node;
    node.on('src:changed', this.rerender, this);
    // TODO: we should try to factor this out for reuse
    node.on('upload:started', this.onUploadStarted, this);
    node.on('upload:progress', this.onUploadProgress, this);
    node.on('upload:finished', this.onUploadFinished, this);
  };

  this.dispose = function() {
    _super.dispose.call(this);

    this.props.node.off(this);
  };

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    el.addClass('sc-image');

    el.append(
      $$('img').attr({
        src: this.props.node.src,
      }).ref('image')
    );

    if (this.state.uploading) {
      var progressBar = $$('div')
        .addClass('se-progress-bar')
        .ref('progressBar')
        .append('Uploading: ' + percentage(this.state.progress));
      el.append(progressBar);
    }

    return el;
  };

  this.onUploadStarted = function() {
    this.setState({ uploading: true, progress: 0 });
  };

  this.onUploadProgress = function(progress) {
    this.setState({ uploading: true, progress: progress });
  };

  this.onUploadFinished = function() {
    this.setState({});
  };

};

NodeComponent.extend(ImageComponent);

export default ImageComponent;

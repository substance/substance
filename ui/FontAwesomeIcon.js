'use strict';

import Component from './Component'

function FontAwesomeIcon() {
  FontAwesomeIcon.super.apply(this, arguments);
}

FontAwesomeIcon.Prototype = function() {

  this.render = function($$) {
    return $$('i').addClass('fa ' + this.props.icon);
  };

};

Component.extend(FontAwesomeIcon);

export default FontAwesomeIcon;
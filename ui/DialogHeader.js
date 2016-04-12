'use strict';

var Component = require('./Component');
var Icon = require('./FontAwesomeIcon');

function DialogHeader() {
  DialogHeader.super.apply(this, arguments);
}

DialogHeader.Prototype = function() {

  this.render = function($$) {
    return $$('div').addClass('sc-dialog-header').append(
        $$('a').addClass('se-back').attr('href', '#')
          .on('click', this.onCancel)
          .append($$(Icon, {icon: 'fa-chevron-left'})),
        $$('div').addClass('se-label').append(this.props.label)
    );
  };

  this.onCancel = function(e) {
    e.preventDefault();
    this.send('closeDialog');
  };

};

Component.extend(DialogHeader);

module.exports = DialogHeader;

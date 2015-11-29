'use strict';

var _ = require('../util/helpers');

var Component = require('./Component');
var $$ = Component.$$;
var Icon = require('./FontAwesomeIcon');

function DialogHeader() {
  Component.apply(this, arguments);
}

DialogHeader.Prototype = function() {

  this.render = function() {
    return $$('div').addClass('sc-dialog-header').append(
        $$('a').addClass('se-back').attr('href', '#')
          .on('click', this.handleCancel)
          .append($$(Icon, {icon: 'fa-chevron-left'})),
        $$('div').addClass('se-label').append(this.props.label)
    );
  };

  this.handleCancel = function(e) {
    e.preventDefault();
    this.send("switchContext", "toc");
  };

};

Component.extend(DialogHeader);

module.exports = DialogHeader;

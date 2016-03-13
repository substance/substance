var oo = require('./oo');

/**
  Custom error object for all Substance related errors

  @example
  
  ```js
  var Err = require('substance/util/Error');
  throw new Err('Document.SelectionUpdateError', {message: 'Could not update selection.'});
  ```

  For better inspection allows you to pass a cause (the error that caused the error).
  That way we can attach context information on each level and we can also ensure
  security, by not passing the cause-chain to the client.
*/
function SubstanceError(name, options) {
  this.name = name;
  this.message = options.message;
  this.info = options.info;
  this.errorCode = options.errorCode;

  this.cause = options.cause;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, (SubstanceError));  
  }
}

SubstanceError.Prototype = function() {
  this.toString = function() {

    var parts = [
      Error.prototype.toString.call(this)
    ];

    if (this.info) {
      parts.push(this.info + '. ');
    }

    if (this.cause) {
      parts.push('\nCause: ');
      parts.push(this.cause.toString());
    }

    return parts.join('');
  };
};

oo.initClass(Error);

Error.extend(SubstanceError);

module.exports = SubstanceError;
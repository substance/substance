/**
 @class
 @export
*/
function MyClass() {}

// our ctor approach for prototype using 'this'
MyClass.Prototype = function() {

  /**
    FOO
  */
  this.foo = function() {}

  /**
    BAR
    @type String
  */
  this.bar = 'bar'
}

// classical prototype approach

/**
  BLA
*/
MyClass.prototype.bla = function() {}

/**
  BLUPP
  @type String
*/
MyClass.prototype.blupp = 'blupp'

// static

/**
  ZIP
*/
MyClass.zip = function() {}

/**
  ZAP
  @type String
*/
MyClass.zap = 'zap'

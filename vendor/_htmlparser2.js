import Parser from './htmlparser2/lib/Parser'

// monkey patching

Parser.prototype.ondeclaration = function(value){
  if(this._cbs.ondeclaration){
    this._cbs.ondeclaration(value);
  } else if(this._cbs.onprocessinginstruction){
    var name = this._getInstructionName(value);
    this._cbs.onprocessinginstruction("!" + name, "!" + value);
  }
}

Parser.prototype.oncdata = function(value){
  this._updatePosition(1);

  if(this._options.xmlMode || this._options.recognizeCDATA){
    if(this._cbs.oncdatastart) this._cbs.oncdatastart(value)
    // we don't want `ontext` getting called here
    if(this._cbs.oncdataend) this._cbs.oncdataend()
  } else {
    this.oncomment("[CDATA[" + value + "]]")
  }
}

export default Parser

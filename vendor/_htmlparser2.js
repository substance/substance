import Parser from './htmlparser2/lib/Parser'

// monkey patching

/*
Parser.prototype.oncdata = function(value){
  this._updatePosition(1);

  if(this._options.xmlMode || this._options.recognizeCDATA){
    if(this._cbs.oncdatastart) this._cbs.oncdatastart();
    if(this._cbs.ontext) this._cbs.ontext(value);
    if(this._cbs.oncdataend) this._cbs.oncdataend();
  } else {
    this.oncomment("[CDATA[" + value + "]]");
  }
};
*/
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

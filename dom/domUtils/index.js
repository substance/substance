var DomUtils = module.exports;

[
  require("domutils/lib/stringify"),
  require("./lib/traversal"),
  require("./lib/manipulation"),
  require("domutils/lib/querying"),
  require("./lib/legacy"),
  require("domutils/lib/helpers")
].forEach(function(ext){
  Object.keys(ext).forEach(function(key){
    DomUtils[key] = ext[key].bind(DomUtils);
  });
});

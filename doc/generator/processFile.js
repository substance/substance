/* jshint latedef: false */
var each = require('lodash/collection/each');

var _supportedTypes = {
  "class": true,
  "module": true,
  "function": true,
  "method": true,
  "property": true,
};

/**
 * A 'module' will be classified either as Object (classical module), Class, or Function.
 * Either entities are exported explicitly using an '@export' tag,
 * or implicitly when their name equals the file name as it is the case for most of our classes or functions (e.g. transforms).
 */
function processFile(_module) {

  var entities = {};
  var currentClass = null;
  var exported = [];
  var mainEntity = null;

  function prepareEntity(entity) {
    if (entity.ctx) {
      entity.type = entity.ctx.type;
      entity.name = entity.ctx.name;
    }
    each(entity.tags, function(tag) {
      if (tag.type === "export") {
        entity.isExported = true;
      } else if (tag.type === "class") {
        entity.isClass = true;
        entity.type = "class";
        entity.members = [];
      } else if (tag.type === "module") {
        entity.isModule = true;
        entity.type = "module";
        entity.members = [];
      }
    });
  }

  // in the first pass we create nested structure containing all available information
  each(_module.dox, function(entity) {
    // skip private variables/methods
    if (entity.isPrivate) return;

    prepareEntity(entity);

    // only let through supported entities
    if (!_supportedTypes[entity.type]) {
      return;
    }

    if (entity.isClass) {
      currentClass = entity;
    }

    if (entity.isExported) {
      exported.push(entity);
    }

    // entities with no receiving context are on module scope and considered as candidates for export
    // Attention: this assumption is not necessarily correct but in our world we don't do such
    if (entity.ctx && !entity.ctx.receiver) {
      entities[entity.ctx.name] = entity;
    }
    // the main entity of a module is that one which has the same name as the entry
    // e.g. the class 'Component' in file 'Component.js' would be assumed to be exported
    if (entity.ctx && !entity.ctx.receiver && entity.ctx.name === _module.name) {
      mainEntity = entity;
    }

    if (entity.ctx && entity.ctx.receiver) {
      if (entities[entity.ctx.receiver] && entities[entity.ctx.receiver].members) {
        entities[entity.ctx.receiver].members.push(entity);
        entity.isStatic = true;
      } else if (entity.ctx.receiver === "this") {
        if (currentClass) {
          currentClass.members.push(entity);
        }
      }
    }

  });

  if (exported.length === 0 && mainEntity) {
    exported.push(mainEntity);
    mainEntity.isDefault = true;
  }

  return convertEntities(_module, exported);
}

function convertEntities(_module, exportedEntities) {
  var nodes = [];

  function convertClass(entity, node) {
    // reuse the function converter to extract ctor arguments
    convertFunction(entity, node);

    node.type = "class";
    node.members = [];

    each(entity.members, function(member) {
      var memberNode = {
        name: member.name
      };
      if (member.isStatic) {
        memberNode.id = node.id + "." + member.ctx.name;
        memberNode['static'] = true;
      } else {
        memberNode.id = node.id + "#" + member.ctx.name;
      }
      if (member.type === 'method') {
        convertMethod(member, memberNode);
      } else if (member.type === "property") {
        convertProperty(member, memberNode);
      } else if (member.type === "class") {
        convertClass(member, memberNode);
      } else {
        console.error('Not implemented yet: converter for class member', member.ctx);
        return;
      }
      nodes.push(memberNode);
      node.members.push(memberNode.id);
    });
  }

  function convertModule(entity, node) {
    node.type = "module";
    node.members = [];
    each(entity.members, function(member) {
      var memberNode = {
        id: node.id + "." + member.name,
        name: member.name
      };
      if (member.type === 'method') {
        convertMethod(member, memberNode);
      } else if (member.type === "property") {
        convertProperty(member, memberNode);
      } else if (member.type === "class") {
        convertClass(member, memberNode);
      } else {
        console.error('Not implemented yet: converter for class member', member.ctx);
        return;
      }
      nodes.push(memberNode);
      node.members.push(memberNode.id);
    });
  }

  function convertFunction(entity, node) {
    node.type = "function";
    node.description = entity.description.full;
    node['params'] = [];

    each(entity.tags, function(tag) {
      if (tag.type === "return") {
        // TODO: in dox a type can have multiple entries
        var returnVal = {
          type: tag.types.join('|'),
          description: tag.description
        };
        node['returns'] = returnVal;
      } else if (tag.type == "param") {
        var param = {
          type: tag.types.join('|'),
          name: tag.name,
          description: tag.description
        };
        if (tag.optional) {
          param.name = param.name.replace(/[\[\]]/g, '');
          param.optional = true;
        }
        node.params.push(param);
      }
    });
  }

  function convertMethod(entity, node) {
    convertFunction(entity, node);
    node.type = "method";
  }

  function convertProperty(entity, node) {
    node.type = "property";
    node.description = entity.description.full;
  }

  each(exportedEntities, function(entity) {
    var node = {
      id: _module.id + "." + entity.name,
      isDefault: entity.isDefault,
      name: entity.name
    };
    if (entity.isDefault) {
      node.namespace = _module.folder;
    }
    if (exportedEntities.length === 1) {
      node.id = _module.id;
    }
    nodes.push(node);
    if (entity.type === "function") {
      convertFunction(entity, node);
      node['static'] = true;
    } else if (entity.type === "property") {
      convertProperty(entity, node);
      node['static'] = true;
    } else if (entity.type === "class") {
      convertClass(entity, node);
    } else if (entity.type === "module") {
      convertModule(entity, node);
    } else {
      console.error('FIXME: convert to node', entity.ctx);
      return;
    }
  });

  return nodes;
}

module.exports = processFile;

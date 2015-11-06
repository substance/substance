/* jshint latedef: false */
var each = require('lodash/collection/each');

/**
 * A 'module' will be classified either as Object (classical module), Class, or Function.
 * Either entities are exported explicitly using an '@export' tag,
 * or implicitly when their name equals the file name as it is the case for most of our classes or functions (e.g. transforms).
 */
function processFile(module) {

  var entities = {};
  var currentClass = null;
  var exported = [];
  var mainEntity = null;

  function isExported(entity) {
    for (var i = 0; i < entity.tags.length; i++) {
      if (entity.tags[i].type === "export") return true;
    }
    return false;
  }

  // in the first pass we create nested structure containing all available information
  each(module.dox, function(entity) {
    if (entity.ctx) {
      entity.type = entity.ctx.type;
    }
    if (isExported(entity)) {
      exported.push(entity);
    }
    // entitys with no receiving context are on module scope and considered as candidates for export
    // Attention: this assumption is not necessarily correct but in our world we don't do such
    if (entity.ctx && !entity.ctx.receiver) {
      entities[entity.ctx.name] = entity;
    }
    // the main entity of a module is that one which has the same name as the entry
    // e.g. the class 'Component' in file 'Component.js' would be assumed to be exported
    if (entity.ctx && !entity.ctx.receiver && entity.ctx.name === module.name) {
      mainEntity = entity;
    }
    // classes
    if (entity.isClass) {
      entity.type = 'class';
      entity.members = [];
      currentClass = entity;
    }
    if (entity.ctx && entity.ctx.receiver) {
      if (entities[entity.ctx.receiver] && entities[entity.ctx.receiver].type === 'class') {
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
  }

  return convertEntities(module, exported);
}

function convertEntities(module, exportedEntities) {
  var nodes = [];

  function convertClass(entity, classNode) {
    classNode.type = "class";
    classNode.properties = [];
    each(entity.members, function(member) {
      var memberNode = {};
      if (entity.isStatic) {
        memberNode.id = classNode.id + "." + member.ctx.name;
        memberNode['static'] = true;
      } else {
        memberNode.id = classNode.id + "#" + member.ctx.name;
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
      classNode.properties.push(memberNode.id);
    });
  }

  function convertFunction(entity, node) {
    node.type = "function";
    node.description = entity.description.full;
    node.params = [];
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
      id: module.id + "." + entity.ctx.name
    };
    nodes.push(node);
    if (entity.type === "function") {
      convertFunction(entity, node);
      node['static'] = true;
    } else if (entity.type === "property") {
      convertProperty(entity, node);
      node['static'] = true;
    } else if (entity.type === "class") {
      convertClass(entity, node);
    } else {
      console.error('FIXME: convert to node', entity.ctx);
      return;
    }
  });

  if (exportedEntities.length === 1) {
    nodes[0].id = module.id;
  }

  return nodes;
}

module.exports = processFile;

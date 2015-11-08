/* jshint latedef: false */
var oo = require('../../util/oo');
var fs = require('fs');
var path = require('path');
var each = require('lodash/collection/each');
var dox = require('dox');
var markdown = require('./markdownConverter');
dox.setMarkdownConverter(markdown);

/**
 * Parses a javascript file and extracts nodes as JSON objects
 * which can be used to create a {doc/model/Documentation} instance.
 */
function parseFile(jsFile) {
  var parser = new _Parser(jsFile);
  var nodes = parser.parse();
  return nodes;
}

/**
 * Helper class for controlling the parsing process.
 *
 * @class
 * @private
 */
function _Parser(jsFile) {
  this.file = jsFile;
  this.folder = path.dirname(jsFile);
  this.name = path.basename(jsFile, '.js');
  this.id = jsFile.slice(0,-3);
}

_Parser.Prototype = function() {

  this.parse = function() {
    var js = fs.readFileSync(this.file, 'utf8');
    var doxified = dox.parseComments(js, { skipSingleStar: true });
    var exported = this.extractExports(doxified);
    var nodes = this.convert(exported);
    return nodes;
  };

  /**
   * Extracts exported entities.
   * Children of classes and modules are aggregated.
   */
  this.extractExports = function(doxified) {
    var entities = {};
    var currentClass = null;
    var exported = [];
    var mainEntity = null;

    // in the first pass we create nested structure containing all available information
    each(doxified, function(entity) {
      // preparations, such as setting flags if certain tags are present
      this._prepareEntity(entity);
      // skip blocks with a @skip tag
      if (entity.skip) {
        return;
      }
      // only let through supported entities
      if (!this._supportedTypes[entity.type]) {
        return;
      }
      if (entity.isClass) {
        currentClass = entity;
      }
      if (entity.isExported) {
        exported.push(entity);
      }
      entities[entity.id] = entity;

      // the main entity of a module is that one which has the same name as the entry
      // e.g. the class 'Component' in file 'Component.js' would be assumed to be exported
      if (entity.ctx && !entity.ctx.receiver && entity.ctx.name === this.name) {
        mainEntity = entity;
      }

      if (entity.ctx && entity.ctx.receiver) {
        var receiver = entity.ctx.receiver;
        if (entities[receiver] && entities[receiver].members) {
          entities[receiver].members.push(entity);
          entity.isStatic = true;
          return;
        }
        if (receiver === "this") {
          if (currentClass) {
            currentClass.members.push(entity);
          }
          return;
        }
      }
      if (entity.ctx && entity.type === "method" && entity.ctx.constructor) {
        var clazz = entity.ctx.constructor;
        if (entities[clazz] && entities[clazz].type === "class") {
          entities[clazz].members.push(entity);
          return;
        }
      }
    }, this);

    if (exported.length === 0 && mainEntity) {
      exported.push(mainEntity);
      mainEntity.isDefault = true;
    }

    return exported;
  };

  /**
   * Converts entities to nodes.
   */
  this.convert = function(entities) {
    var nodes = [];

    each(entities, function(entity) {
      var node = {
        id: this.id + "." + entity.name,
        isDefault: entity.isDefault,
        name: entity.name,
        example: entity.example
      };
      if (entity.isDefault) {
        node.namespace = this.folder;
      }
      if (entities.length === 1) {
        node.id = this.id;
      }
      nodes.push(node);
      if (entity.type === "function") {
        _convertFunction(entity, node);
        node.isStatic = true;
      } else if (entity.type === "property") {
        _convertProperty(entity, node);
        node.isStatic = true;
      } else if (entity.type === "class") {
        _convertClass(nodes, entity, node);
      } else if (entity.type === "module") {
        _convertModule(nodes, entity, node);
      } else {
        console.error('FIXME: convert to node', entity.ctx);
        return;
      }
    }, this);

    return nodes;
  };

  /**
   * Prepares a parsed block/entity.
   * For instance, it sets flags when certain tags are present.
   *
   * @private
   */
  this._prepareEntity = function(entity) {
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
      } else if (tag.type === "abstract") {
        entity.isAbstract = true;
      } else if (tag.type === "extends") {
        entity.parentClass = tag.string;
      } else if (tag.type === "skip") {
        entity.skip = true;
      } else if (tag.type === "see") {
        // TODO: for delegators it would make sense to show the documentation
        // of the target
        entity.see = tag.string;
      } else if (tag.type === "export") {
        entity.isExported = true;
      } else if (tag.type === "example") {
        entity.example = _extractExample(tag.string);
      } else if (tag.type === "type") {
        entity.dataType = tag.string;
      }
    });
    var id = "";
    if (entity.ctx) {
      if (entity.ctx.receiver) {
        id = entity.ctx.receiver + ".";
      } else if (entity.ctx.hasOwnProperty('constructor')) {
        id = entity.ctx.constructor + ".prototype.";
      }
    }
    id += entity.name;
    entity.id = id;
  };

  this._supportedTypes = {
    "class": true,
    "module": true,
    "function": true,
    "method": true,
    "property": true,
  };

  function _convertModule(nodes, entity, node) {
    node.type = "module";
    node.description = entity.description.full;
    node.members = [];
    each(entity.members, function(member) {
      var memberNode = {
        id: node.id + "." + member.name,
        parent: node.id,
        name: member.name,
        example: member.example
      };
      if (member.type === 'method') {
        convertMethod(member, memberNode);
      } else if (member.type === "property") {
        _convertProperty(member, memberNode);
      } else if (member.type === "class") {
        _convertClass(nodes, member, memberNode);
      } else {
        console.error('Not implemented yet: converter for class member', member.ctx);
        return;
      }
      nodes.push(memberNode);
      node.members.push(memberNode.id);
    });
  }

  function _convertClass(nodes, entity, node) {
    // reuse the function converter to extract ctor arguments
    _convertFunction(entity, node);

    node.type = "class";
    node.isAbstract = entity.isAbstract;
    node.parentClass = entity.parentClass;
    node.members = [];

    each(entity.members, function(member) {
      var memberNode = {
        name: member.name,
        parent: node.id,
        example: member.example
      };
      if (member.isStatic) {
        memberNode.id = node.id + "." + member.ctx.name;
        memberNode.isStatic = true;
      } else {
        memberNode.id = node.id + "#" + member.ctx.name;
      }
      if (member.type === 'method') {
        convertMethod(member, memberNode);
      } else if (member.type === "property") {
        _convertProperty(member, memberNode);
      } else if (member.type === "class") {
        _convertClass(nodes, member, memberNode);
      } else {
        console.error('Not implemented yet: converter for class member', member.ctx);
        return;
      }
      nodes.push(memberNode);
      node.members.push(memberNode.id);
    });
  }

  function _convertFunction(entity, node) {
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
    _convertFunction(entity, node);
    node.type = "method";
    node.isPrivate = entity.isPrivate;
  }

  function _convertProperty(entity, node) {
    node.type = "property";
    node.description = entity.description.full;
    node.dataType = entity.dataType;
  }

  function _extractExample(str) {
    var firstLineBreak = str.indexOf("\n");
    var header, body;
    if (firstLineBreak >= 0) {
      header = str.slice(0, firstLineBreak).trim();
      body = str.slice(firstLineBreak);
      body = dox.trimIndentation(body);
    } else {
      header = undefined;
      body = str.trim();
    }
    return markdown.toHtml(body);
  }

};

oo.initClass(_Parser);


// DOX configuration

// HACK: overriding the type parser entry point
// to workaround a syntax error thrown by jsdoctypeparser for
// when using paths in type strings `{model/Document}` without `module:` prefix.
var _parseTagTypes = dox.parseTagTypes;
dox.parseTagTypes = function(str, tag) {
  if (/\{\w+(\/\w+)+([.#]\w+)*\}/.exec(str)) {
    str = str.replace('/', '_SEP_');
    var types = _parseTagTypes(str, tag);
    for (var i = 0; i < types.length; i++) {
      types[i] = types[i].replace('_SEP_', '/');
    }
  } else {
    return _parseTagTypes(str, tag);
  }
};

module.exports = parseFile;

/* jshint latedef: false */
var oo = require('../../util/oo');
var fs = require('fs');
var path = require('path');
var each = require('lodash/collection/each');
var extend = require('lodash/object/extend');
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

    dox.parseTagTypes = this._parseTagTypes.bind(this);
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
      if (this._exportableTypes[entity.type] && (entity.id === this.name)) {
        if (mainEntity) {
          throw new Error([
            'Ambigous main entity in file ', this.file,
            "\n Found: ", mainEntity.name, " of type ", mainEntity.type, " in line ", mainEntity.line,
            "\n and: ", entity.name, " of type ", entity.type, " in line ", entity.line
          ].join(''));
        }
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
      // for prototype members dox extracts the constructor name
      if (entity.ctx && entity.ctx.cons) {
        var clazz = entity.ctx.cons;
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
      var node = _createNode(this, entity, {
        id: this.id + "." + entity.name,
        isDefault: entity.isDefault
      });

      if (entity.isDefault) {
        node.parent = this.folder;
      }
      if (entities.length === 1) {
        node.id = this.id;
      }
      nodes.push(node);
      if (entity.type === "function") {
        _convertFunction(this, entity, node);
        node.isStatic = true;
      } else if (entity.type === "property") {
        _convertProperty(this, entity, node);
        node.isStatic = true;
      } else if (entity.type === "class") {
        _convertClass(this, nodes, entity, node);
      } else if (entity.type === "module") {
        _convertModule(this, nodes, entity, node);
      } else if (entity.type === "event") {
        _convertEvent(this, nodes, entity, node);
      } else {
        console.error('FIXME: convert to node', entity.ctx);
        return;
      }
    }, this);

    return nodes;
  };

  var STATIC_PROP = /(.+)\.static/;

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
    // in most cases, we use the source line of the associated code (first code line after comment block)
    entity.sourceLine = entity.codeStart;

    var refinedTags = [];
    entity.params = [];
    each(entity.tags, function(tag) {
      // NOTE: we want to pass through tags. However, to reduce the footprint of the
      // generated JSON, for now we only pass through 'custom' tags
      // built-in tags are covered by this implementation
      // TODO: we could introduce a configuration to control this behavior
      if (tag.type === "class") {
        entity.isClass = true;
        entity.type = "class";
        entity.members = [];

        // overloaded receiver
        if (tag.string) {
          entity.sourceLine = entity.line;
          var ctx = _extractClassCtx(this, tag.string);
          entity.ctx = extend({}, entity.ctx, ctx);
          entity.name = ctx.name;
        }
      } else if (tag.type === "param") {
        var param = _prepareParam(tag);
        refinedTags.push({ type: 'param', value: param });
        entity.params.push(param);
      } else if (tag.type === "return" || tag.type === "returns") {
        // TODO: in dox a type can have multiple entries
        var returnVal = {
          type: tag.types.join('|'),
          description: tag.description
        };
        refinedTags.push({ type: 'returns', value: returnVal });
        entity.returns = returnVal;
      } else if (tag.type === "constructor") {
        entity.type = "ctor";
        extend(entity, _extractConstructorInfo(this, tag, entity));
      } else if (tag.type === "module") {
        entity.isModule = true;
        entity.type = "module";
        entity.members = [];
      } else if (tag.type === "event") {
        entity.type = "event";
        // there is no code location we can associate, so we take the comment location.
        entity.sourceLine = entity.line;
        extend(entity, _extractEventInfo(this, tag));
      } else if (tag.type === "abstract") {
        entity.isAbstract = true;
      } else if (tag.type === "private") {
        entity.isPrivate = true;
      } else if (tag.type === "static") {
        entity.isStatic = true;
      } else if (tag.type === "extends") {
        entity.superClass = tag.string;
      } else if (tag.type === "skip") {
        entity.skip = true;
      } else if (tag.type === "see") {
        entity.see = tag.string;
      } else if (tag.type === "example") {
        entity.example = _extractExample(tag.string);
      } else if (tag.type === "type") {
        entity.dataType = tag.string;
      } else if (tag.type === "export") {
        entity.isExported = true;
      } else {
        var typeDescription = _typeTagMatcher.exec(tag.string);
        if (typeDescription) {
          tag.name = typeDescription[2];
          tag.description = typeDescription[3];
          dox.parseTagTypes(typeDescription[1], tag);
          var customParam = _prepareParam(tag);
          refinedTags.push({ type: tag.type, value: customParam });
        } else {
          refinedTags.push({ type: tag.type, value: tag.string });
        }
      }
    }, this);

    entity.tags = refinedTags;

    // support for `static` props defined this way 'Foo.static.foo'
    if (entity.ctx && entity.ctx.receiver) {
      var match = STATIC_PROP.exec(entity.ctx.receiver);
      if (match) {
        entity.ctx.receiver = match[1];
        entity.isStatic = true;
      }
    }

    if (!entity.id) {
      var id = "";
      if (entity.ctx) {
        if (entity.ctx.receiver) {
          id = entity.ctx.receiver + ".";
        } else if (entity.ctx.cons) {
          id = entity.ctx.cons + ".prototype.";
        }
      }
      id += entity.name;
      entity.id = id;
    }
  };

  this._supportedTypes = {
    "class": true,
    "ctor": true,
    "module": true,
    "function": true,
    "method": true,
    "property": true,
    "event": true
  };

  this._exportableTypes = {
    "class": true,
    "module": true,
    "function": true
  };

  var _typeTagMatcher = /^\s*(\{[^@][^{]+\})\s+([\w\/]+)\s+(.+)/;

  function _prepareParam(tag) {
    var shortTypes = tag.types.map(function(type) {
      return path.basename(type);
    });
    var param = {
      type: tag.types.join('|'),
      shortType: shortTypes.join('|'),
      name: tag.name,
      description: markdown.toHtml(tag.description)
    };
    if (tag.optional) {
      // param.name = param.name.replace(/[\[\]]/g, '');
      param.optional = true;
    }
    return param;
  }


  function _createNode(self, entity, node) {
    node.name = entity.name;
    node.ns = self.folder;
    node.example = entity.example;
    node.sourceFile = self.file;
    node.sourceLine = entity.sourceLine;
    node.tags = entity.tags;
    if (entity.isPrivate) {
      node.isPrivate = true;
    }
    if (entity.description.full) {
      node.description = entity.description.full;
    }
    return node;
  }

  function _convertModule(self, nodes, entity, node) {
    node.type = "module";
    node.members = [];
    each(entity.members, function(member) {
      var memberNode = _createNode(self, member, {
        id: node.id + "." + member.name,
        parent: node.id
      });
      _convertMember(self, nodes, member, memberNode);

      nodes.push(memberNode);
      node.members.push(memberNode.id);
    });
  }

  function _convertClass(self, nodes, entity, node) {
    node.type = "class";
    node.isAbstract = entity.isAbstract;
    node.superClass = entity.superClass;
    node.members = [];

    each(entity.members, function(member) {
      var memberNode = _createNode(self, member, {
        parent: node.id,
      });
      var sep;
      if (member.isEvent) {
        sep = "@";
      } else if (member.isConstructor) {
        sep = "@";
        member.isStatic = true;
      } else if (member.isStatic) {
        sep = ".";
        memberNode.isStatic = true;
      } else {
        sep = "#";
      }
      memberNode.id = node.id + sep + member.name;

      _convertMember(self, nodes, member, memberNode);

      nodes.push(memberNode);
      node.members.push(memberNode.id);
    });
  }

  function _convertMember(self, nodes, member, memberNode) {
    if (member.type === 'ctor') {
      _convertConstructor(self, member, memberNode);
    } else if (member.type === 'method') {
      _convertMethod(self, member, memberNode);
    } else if (member.type === "property") {
      _convertProperty(self, member, memberNode);
    } else if (member.type === "event") {
      _convertEvent(self, member, memberNode);
    } else if (member.type === "class") {
      _convertClass(self, nodes, member, memberNode);
    } else {
      console.error('Not implemented yet: converter for class member', member.ctx);
      return;
    }
  }

  function _convertFunction(self, entity, node) {
    node.type = "function";
    node.params = entity.params;
    node.returns = entity.returns;
    // To reduce redundancy remove the params from tags
    node.tags = node.tags.filter(function(tag) {
      return (tag.type !== "param" && tag.type !== "returns");
    });
  }

  function _convertMethod(self, entity, node) {
    _convertFunction(self, entity, node);
    node.type = "method";
    node.isPrivate = entity.isPrivate;
  }

  function _convertEvent(self, entity, node) {
    _convertFunction(self, entity, node);
    node.type = "event";
  }

  function _convertConstructor(self, entity, node) {
    _convertFunction(self, entity, node);
    node.type = "ctor";
    node.isPrivate = entity.isPrivate;
  }

  function _convertProperty(self, entity, node) {
    node.type = "property";
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

  function _extractEventInfo(self, tag) {
    var eventId = tag.string;
    var parts = eventId.split('@');
    var name = parts[1];
    var receiver = parts[0];
    receiver = _normalizeReceiver(self, receiver);
    var ctx = {
      receiver: receiver
    };
    return {
      id: eventId,
      name: name,
      ctx: ctx
    };
  }

  function _extractConstructorInfo(self, tag, entity) {
    var name = entity.ctx.name;
    var receiver = tag.string || name;
    receiver = _normalizeReceiver(self, receiver);
    var id = receiver + "@" + name;
    return {
      id: id,
      name: name,
      ctx: { receiver: receiver }
    };
  }

  function _normalizeReceiver(self, receiver) {
    if (receiver) {
      // support global ids, i.e., `model/MyClass.`
      return receiver.replace(new RegExp("^"+self.folder+"/"), '');
    } else {
      return '';
    }
  }

  function _extractClassCtx(self, classStr) {
    classStr = _normalizeReceiver(self, classStr);
    var idComponents = classStr.split('.');
    var name = idComponents.pop();
    var receiver = idComponents.join('.');
    return {
      name: name,
      receiver: receiver
    };
  }

  // HACK: overriding the type parser entry point
  // to workaround a syntax error thrown by jsdoctypeparser for
  // when using paths in type strings `{model/Document}` without `module:` prefix.
  // keep a reference to original dox.parseTagTypes
  var dox_parseTagTypes = dox.parseTagTypes;
  this._parseTagTypes = function(str, tag) {
    if (/\{[^{]+\}/.exec(str)) {
      str = str.replace(/\//g, '_SEP_');
      str = str.replace(/\[\]/g, '_ARR_');
      try {
        var types = dox_parseTagTypes(str, tag);
        for (var i = 0; i < types.length; i++) {
          types[i] = types[i].replace(/_SEP_/g, '/');
          types[i] = types[i].replace(/_ARR_/g, '[]');
        }
      } catch (err) {
        throw new Error('Could not parse jsdoc expression found in ' + this.file + "\n" + err.message);
      }
    } else {
      return dox_parseTagTypes(str, tag);
    }
  };

};

oo.initClass(_Parser);

module.exports = parseFile;

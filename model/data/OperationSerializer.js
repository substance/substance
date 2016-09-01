"use strict";

import isArray from 'lodash/isArray'
import isNumber from 'lodash/isNumber'
import isObject from 'lodash/isObject'
import oo from '../../util/oo'
import ObjectOperation from './ObjectOperation'
import TextOperation from './TextOperation'
import ArrayOperation from './ArrayOperation'

/*
  Specification:

  - create:
    ```
    'c <JSON.stringify(data)>'
    'c { id: "1123", type: "paragraph", content: ""}'
    ```
  - delete:
    ```
    'd <JSON.stringify(data)>'
    'd { id: "1123", type: "paragraph", content: ""}'
    ```
  - set a property
    ```
    's <property path> <value> <old value>'
    's p1.content foo'
    ```
  - update a property
    ```
    'u <property path> <primitive op>'
    'u p1.content t+ 4 foo'
    ```

Primitive type operations:

  - insert text
    ```
    't+ <pos> <string>'
    't+ 4 foo'
    ```
  - delete text
    ```
    't- <pos> <string>'
    't- 4 foo'
    ```
  - insert value into array
    ```
    'a+ <pos> <value>'
    'a+ 0 p1'
    ```
  - delete value from array
    ```
    'a- <pos> <value>'
    'a- 0 p1'
    ```
*/

function OperationSerializer() {
  this.SEPARATOR = '\t';
}

OperationSerializer.Prototype = function() {

  this.serialize = function(op) {
    var out = [];
    switch (op.type) {
      case 'create':
        out.push('c');
        out.push(op.val.id);
        out.push(op.val);
        break;
      case 'delete':
        out.push('d');
        out.push(op.val.id);
        out.push(op.val);
        break;
      case 'set':
        out.push('s');
        out.push(op.path.join('.'));
        out.push(op.val);
        out.push(op.original);
        break;
      case 'update':
        out.push('u');
        out.push(op.path.join('.'));
        Array.prototype.push.apply(out, this.serializePrimitiveOp(op.diff));
        break;
      default:
        throw new Error('Unsupported operation type.');
    }
    return out;
  };

  this.serializePrimitiveOp = function(op) {
    var out = [];
    if (op._isTextOperation) {
      if (op.isInsert()) {
        out.push('t+');
      } else if (op.isDelete()) {
        out.push('t-');
      }
      out.push(op.pos);
      out.push(op.str);
    } else if (op._isArrayOperation) {
      if (op.isInsert()) {
        out.push('a+');
      } else if (op.isDelete()) {
        out.push('a-');
      }
      out.push(op.pos);
      out.push(op.val);
    } else {
      throw new Error('Unsupported operation type.');
    }
    return out;
  };

  this.deserialize = function(str, tokenizer) {
    if (!tokenizer) {
      tokenizer = new Tokenizer(str, this.SEPARATOR);
    }
    var type = tokenizer.getString();
    var op, path, val, oldVal, diff;
    switch (type) {
      case 'c':
        path = tokenizer.getPath();
        val = tokenizer.getObject();
        op = ObjectOperation.Create(path, val);
        break;
      case 'd':
        path = tokenizer.getPath();
        val = tokenizer.getObject();
        op = ObjectOperation.Delete(path, val);
        break;
      case 's':
        path = tokenizer.getPath();
        val = tokenizer.getAny();
        oldVal = tokenizer.getAny();
        op = ObjectOperation.Set(path, oldVal, val);
        break;
      case 'u':
        path = tokenizer.getPath();
        diff = this.deserializePrimitiveOp(str, tokenizer);
        op = ObjectOperation.Update(path, diff);
        break;
      default:
        throw new Error('Illegal type for ObjectOperation: '+ type);
    }
    return op;
  };

  this.deserializePrimitiveOp = function(str, tokenizer) {
    if (!tokenizer) {
      tokenizer = new Tokenizer(str, this.SEPARATOR);
    }
    var type = tokenizer.getString();
    var op, pos, val;
    switch (type) {
      case 't+':
        pos = tokenizer.getNumber();
        val = tokenizer.getString();
        op = TextOperation.Insert(pos, val);
        break;
      case 't-':
        pos = tokenizer.getNumber();
        val = tokenizer.getString();
        op = TextOperation.Delete(pos, val);
        break;
      case 'a+':
        pos = tokenizer.getNumber();
        val = tokenizer.getAny();
        op = ArrayOperation.Insert(pos, val);
        break;
      case 'a-':
        pos = tokenizer.getNumber();
        val = tokenizer.getAny();
        op = ArrayOperation.Delete(pos, val);
        break;
      default:
        throw new Error('Unsupported operation type: ' + type);
    }
    return op;
  };
};

oo.initClass(OperationSerializer);

function Tokenizer(str, sep) {
  if (isArray(arguments[0])) {
    this.tokens = arguments[0];
  } else {
    this.tokens = str.split(sep);
  }
  this.pos = -1;
}

Tokenizer.Prototype = function() {

  this.error = function(msg) {
    throw new Error('Parsing error: ' + msg + '\n' + this.tokens[this.pos]);
  };

  this.getString = function() {
    this.pos++;
    var str = this.tokens[this.pos];
    if (str[0] === '"') {
      str = str.slice(1, -1);
    }
    return str;
  };

  this.getNumber = function() {
    this.pos++;
    var number;
    var token = this.tokens[this.pos];
    try {
      if (isNumber(token)) {
        number = token;
      } else {
        number = parseInt(this.tokens[this.pos], 10);
      }
      return number;
    } catch (err) {
      this.error('expected number');
    }
  };

  this.getObject = function() {
    this.pos++;
    var obj;
    var token = this.tokens[this.pos];
    try {
      if (isObject(token)) {
        obj = token;
      } else {
        obj = JSON.parse(this.tokens[this.pos]);
      }
      return obj;
    } catch (err) {
      this.error('expected object');
    }
  };

  this.getAny = function() {
    this.pos++;
    var token = this.tokens[this.pos];
    return token;
  };

  this.getPath = function() {
    var str = this.getString();
    return str.split('.');
  };
};

oo.initClass(Tokenizer);

OperationSerializer.Tokenizer = Tokenizer;

export default OperationSerializer;

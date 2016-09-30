import Err from '../util/SubstanceError'

/*
  Implements Substance ChangeStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of DocumentEngine
*/
function ChangeStore(config) {
  this.config = config;
}

ChangeStore.Prototype = function() {

  /*
    Gets changes for a given document

    @param {String} args.documentId document id
    @param {Number} args.sinceVersion since which change
  */
  this.getChanges = function(args, cb) {
    var changes = this._getChanges(args.documentId);

    // sinceVersion is optional
    if (!args.sinceVersion) {
      args.sinceVersion = 0;
    }

    if(args.sinceVersion < 0) {
      return cb(new Err('ChangeStore.ReadError', {
        message: 'Illegal argument "sinceVersion":' +args.sinceVersion
      }));
    }

    if(args.toVersion < 0) {
      return cb(new Err('ChangeStore.ReadError', {
        message: 'Illegal argument "toVersion":' +args.toVersion
      }));
    }

    if(args.sinceVersion >= args.toVersion) {
      return cb(new Err('ChangeStore.ReadError', {
        message: 'Illegal version arguments "sinceVersion":' +args.sinceVersion+ ', toVersion":' +args.toVersion
      }));
    }

    var version = this._getVersion(args.documentId);

    var res;

    if (args.sinceVersion === 0) {
      res = {
        version: version,
        changes: changes.slice(0, args.toVersion)
      };
      cb(null, res);
    } else if (args.sinceVersion > 0) {
      res = {
        version: version,
        changes: changes.slice(args.sinceVersion, args.toVersion)
      };
      cb(null, res);
    }
  };

  /*
    Add a change object to the database
  */
  this.addChange = function(args, cb) {
    if (!args.documentId) {
      return cb(new Err('ChangeStore.CreateError', {
        message: 'No documentId provided'
      }));
    }

    if (!args.change) {
      return cb(new Err('ChangeStore.CreateError', {
        message: 'No change provided'
      }));
    }

    this._addChange(args.documentId, args.change);
    var newVersion = this._getVersion(args.documentId);
    cb(null, newVersion);
  };

  /*
    Delete changes for a given documentId
  */
  this.deleteChanges = function(documentId, cb) {
    var deletedChanges = this._deleteChanges(documentId);
    cb(null, deletedChanges.length);
  };

  /*
    Gets the version number for a document
  */
  this.getVersion = function(id, cb) {
    cb(null, this._getVersion(id));
  };

  /*
    Seeds the database with given changes
  */
  this.seed = function(changes, cb) {
    this._changes = changes;
    if (cb) { cb(null); }
    return this;
  };

  // Handy synchronous helpers
  // -------------------------

  this._deleteChanges = function(documentId) {
    var changes = this._getChanges(documentId);
    delete this._changes[documentId];
    return changes;
  };

  this._getVersion = function(documentId) {
    var changes = this._changes[documentId];
    return changes ? changes.length : 0;
  };

  this._getChanges = function(documentId) {
    return this._changes[documentId] || [];
  };

  this._addChange = function(documentId, change) {
    if (!this._changes[documentId]) {
      this._changes[documentId] = [];
    }
    this._changes[documentId].push(change);
  };
};


export default ChangeStore;

import Err from '../util/SubstanceError'

/*
  Implements Substance ChangeStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of DocumentEngine
*/
class ChangeStore {
  constructor(config) {
    this.config = config;
  }

  /*
    Gets changes for a given document

    @param {String} args.documentId document id
    @param {Number} args.sinceVersion since which change
  */
  getChanges(args, cb) {
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
  }

  /*
    Add a change object to the database
  */
  addChange(args, cb) {
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
  }

  /*
    Delete changes for a given documentId
  */
  deleteChanges(documentId, cb) {
    var deletedChanges = this._deleteChanges(documentId);
    cb(null, deletedChanges.length);
  }

  /*
    Gets the version number for a document
  */
  getVersion(id, cb) {
    cb(null, this._getVersion(id));
  }

  /*
    Seeds the database with given changes
  */
  seed(changes, cb) {
    this._changes = changes;
    if (cb) { cb(null); }
    return this;
  }

  // Handy synchronous helpers
  // -------------------------

  _deleteChanges(documentId) {
    var changes = this._getChanges(documentId);
    delete this._changes[documentId];
    return changes;
  }

  _getVersion(documentId) {
    var changes = this._changes[documentId];
    return changes ? changes.length : 0;
  }

  _getChanges(documentId) {
    return this._changes[documentId] || [];
  }

  _addChange(documentId, change) {
    if (!this._changes[documentId]) {
      this._changes[documentId] = [];
    }
    this._changes[documentId].push(change);
  }
}

export default ChangeStore;

'use strict';

var oo = require('../util/oo');
var Err = require('../util/Error');

/*
  Implements Substance SnapshotStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of SnapshotEngine
*/
function SnapshotStore(config) {
  this.config = config;

  // Snapshots will stored here
  this._snapshots = {};
}

SnapshotStore.Prototype = function() {


  /*
    Get Snapshot by documentId and version. If no version is provided
    the highest version available is returned
    
    @return {Object} snapshot record
  */
  this.getSnapshot = function(args, cb) {
    if (!args || !args.documentId) {
      return cb(new Err('InvalidArgumentsError', {
        message: 'args require a documentId'
      }));
    }
    var documentId = args.documentId;
    var version = args.version;
    var docEntry = this._snapshots[documentId];
    var result;

    if (!docEntry) return cb(null, undefined);

    var availableVersions = Object.keys(docEntry);

    // Exit if no versions are available
    if (availableVersions.length === 0) return cb(null, undefined);

    // If no version is given we return the latest version available
    if (!version) {
      var latestVersion = Math.max.apply(null, availableVersions);
      result = docEntry[latestVersion];
    } else {
      // Attemt to get the version
      result = docEntry[version];
      if (!result && args.findClosest) {
        // We don't have a snaphot for that requested version
        var smallerVersions = availableVersions.filter(function(v) {
          return parseInt(v, 10) < version;
        });

        // Take the closest version if there is any
        var clostestVersion = Math.max.apply(null, smallerVersions);
        result = docEntry[clostestVersion];
      }
    }

    cb(null, result);
  };

  /*
    Stores a snapshot for a given documentId and version.

    Please not that an existing snapshot will be overwritten.
  */
  this.saveSnapshot = function(args, cb) {
    var documentId = args.documentId;
    var version = args.version;
    var data = args.data;
    var docEntry = this._snapshots[documentId];
    if (!docEntry) {
      docEntry = this._snapshots[documentId] = {};
    }
    docEntry[version] = {
      documentId: documentId,
      version: version,
      data: data
    };
    cb(null, docEntry[version]);
  };

  /*
    Removes a snapshot for a given documentId + version
  */
  this.deleteSnaphot = function(documentId, version, cb) {
    var docEntry = this._snapshots[documentId];
    if (!docEntry || !docEntry[version]) {
      return cb(new Err('DeleteError', {
        message: 'Snapshot could not be found'
      }));
    }
    var snapshot = this._snapshots[documentId][version];
    delete this._snapshots[documentId][version];
    cb(null, snapshot);
  };

  /*
    Deletes all snapshots for a given documentId
  */
  this.deleteSnapshotsForDocument = function(documentId, cb) {
    var docEntry = this._snapshots[documentId];
    var deleteCount = 0;
    if (docEntry) deleteCount = Object.keys(docEntry).length;
    delete this._snapshots[documentId];
    cb(null, deleteCount);
  };

  /*
    Returns true if a snapshot exists for a certain version
  */
  this.snapshotExists = function(documentId, version, cb) {
    var exists = false;
    var docRecord = this._snapshots[documentId];

    if (docRecord) {
      exists = docRecord[version];
    }
    cb(null, exists);
  };

  /*
    Seeds the database
  */
  this.seed = function(snapshots, cb) {
    this._snapshots = snapshots;
    if (cb) { cb(null); }
    return this;
  };

};


oo.initClass(SnapshotStore);
module.exports = SnapshotStore;

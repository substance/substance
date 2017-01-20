import Server from './Server'
import CollabEngine from './CollabEngine'
import Err from '../util/SubstanceError'
import forEach from '../util/forEach'

/*
  Implements Substance CollabServer API.
*/
class CollabServer extends Server {
  constructor(config) {
    super(config)

    this.scope = 'substance/collab'
    this.configurator = config.configurator
    this.documentEngine = this.configurator.getDocumentEngine()
    this.collabEngine = new CollabEngine(this.documentEngine)
  }

  /*
    Send an error
  */
  _error(req, res, err) {
    console.error(err)
    res.error({
      scope: this.scope,
      type: 'error',
      error: {
        name: req.message.type+'Error',
        cause: {
          name: err.name
        }
      },
      documentId: req.message.documentId
    })
    this.next(req, res)
  }

  /*
    Configurable authenticate method
  */
  authenticate(req, res) {
    if (this.config.authenticate) {
      this.config.authenticate(req, (err, session) => {
        if (err) {
          console.error(err)
          // Send the response with some delay
          this._error(req, res, new Err('AuthenticationError', {cause: err}))
          return
        }
        req.setAuthenticated(session)
        this.next(req, res)
      })
    } else {
      super.authenticate.apply(this, arguments);
    }
  }

  /*
    Configureable enhanceRequest method
  */
  enhanceRequest(req, res) {
    if (this.config.enhanceRequest) {
      this.config.enhanceRequest(req, (err) => {
        if (err) {
          console.error('enhanceRequest returned an error', err)
          this._error(req, res, err)
          return
        }
        req.setEnhanced()
        this.next(req, res)
      })
    } else {
      super.enhanceRequest.apply(this, arguments)
    }
  }

  /*
    Called when a collaborator disconnects
  */
  onDisconnect(collaboratorId) {
    // console.info('CollabServer.onDisconnect ', collaboratorId)
    // All documents collaborator is currently collaborating to
    let documentIds = this.collabEngine.getDocumentIds(collaboratorId)
    documentIds.forEach(function(documentId) {
      this._disconnectDocument(collaboratorId, documentId)
    }.bind(this))
  }

  /*
    Execute CollabServer API method based on msg.type
  */
  execute(req, res) {
    let msg = req.message
    let method = this[msg.type]

    if (method) {
      method.call(this, req, res)
    } else {
      console.error('Method', msg.type, 'not implemented for CollabServer')
    }
  }

  /*
    Client initiates a sync
  */
  sync(req, res) {
    let args = req.message

    // Takes an optional argument collaboratorInfo
    this.collabEngine.sync(args, (err, result) => {
      // result: changes, version, change
      if (err) {
        this._error(req, res, err)
        return
      }

      // Get enhanced collaborators (e.g. including some app-specific user-info)
      let collaborators = this.collabEngine.getCollaborators(args.documentId, args.collaboratorId)

      // Send the response
      res.send({
        scope: this.scope,
        type: 'syncDone',
        documentId: args.documentId,
        version: result.version,
        serverChange: result.serverChange,
      })

      // We need to broadcast a new change if there is one
      forEach(collaborators, (collaborator) => {
        this.send(collaborator.collaboratorId, {
          scope: this.scope,
          type: 'update',
          documentId: args.documentId,
          version: result.version,
          change: result.change
        })
      })
      this.next(req, res)
    })
  }

  /*
    Expcicit disconnect. User wants to exit a collab session.
  */
  disconnect(req, res) {
    let args = req.message
    let collaboratorId = args.collaboratorId
    let documentId = args.documentId
    this._disconnectDocument(collaboratorId, documentId)
    // Notify client that disconnect has completed successfully
    res.send({
      scope: this.scope,
      type: 'disconnectDone',
      documentId: args.documentId
    })
    this.next(req, res)
  }

  _disconnectDocument(collaboratorId, documentId) {
    // Exit from each document session
    this.collabEngine.disconnect({
      documentId: documentId,
      collaboratorId: collaboratorId
    })
  }

}

export default CollabServer

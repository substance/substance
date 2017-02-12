import EditorSession from './EditorSession'
import Configurator from '../util/Configurator'

/*
  Creates a factory for documents and the correspondent initial changeset

  @param {String} name schema identifier
  @param {String} schema schema version

  @example

  var myDocFactory = createDocumentFactory(ProseArticle, function(tx) {
    var body = tx.get('body');
    tx.create({
      id: 'p1',
      type: 'paragraph',
      content: '0123456789'
    });
    body.show('p1');
  });

  myDocFactory.ArticleClass;
  myDocFactory.createEmptyArticle();
  myDocFactory.createArticle();
  myDocFactory.createChangeset();
*/
function createDocumentFactory(ArticleClass, create) {
  return {
    ArticleClass: ArticleClass,
    createEmptyArticle: function() {
      var doc = new ArticleClass()
      return doc
    },
    createArticle: function() {
      var doc = new ArticleClass()
      create(doc)
      return doc
    },
    createChangeset: function() {
      var doc = new ArticleClass()
      var session = new EditorSession(doc, {
        configurator: new Configurator()
      })
      var change = session.transaction(create)
      return [change.toJSON()]
    }
  }
}

export default createDocumentFactory
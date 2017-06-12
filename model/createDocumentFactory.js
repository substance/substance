import ChangeRecorder from './ChangeRecorder'

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
export default
function createDocumentFactory(ArticleClass, create) {
  return {
    ArticleClass: ArticleClass,
    createEmptyArticle: function() {
      const doc = new ArticleClass()
      return doc
    },
    createArticle: function() {
      const doc = new ArticleClass()
      create(doc)
      return doc
    },
    createChangeset: function() {
      const doc = new ArticleClass()
      const tx = new ChangeRecorder(doc)
      create(tx)
      const change = tx.generateChange()
      return [change.toJSON()]
    }
  }
}

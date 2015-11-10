Transformations are there to define higher level document operations that editor implementations can use. We implemented a range of useful transformations and made them available in the {@link model/transform} folder. However, you are encouraged to define your own functions. Below is a shortened version of a possible searchAndReplace transformation.

```js
function searchAndReplace(tx, args) {
  // 1. verify arguments args.searchStr, args.replaceStr, args.container
  // 2. implement your transformation using low level operations (e.g. tx.create)
  // ...
  var searchResult = search(tx, args);

  searchResult.matches.forEach(function(match) {
    var replaceArgs = _.extend({}, args, {selection: match, replaceStr: args.replaceStr});
    replaceText(tx, replaceArgs);
  });

  // 3. set new selection
  if (searchResult.matches.length > 0) {
    var lastMatch = _.last(searchResult.matches);
    args.selection = lastMatch;
  }

  // 4. return args for the caller or transaction context
  return args;
}
```

Transformations always take 2 parameters: `tx` is a `TransactionDocument` and `args` are the transformation's arguments. Transformations can be composed, so in a transformation you can call another transformation. You just need to be careful to always set the args properly. Here's how the transformation we just defined can be called in a transaction.

```js
surface.transaction(function(tx, args) {
  args.searchStr = "foo";
  args.replaceStr = "bar";
  return searchAndReplace(tx, args);
});
```

Using the transaction method on a {@link ui/Surface} instance passes the current selection to the transformation automatically. So you will use surface transactions whenever some kind of selection is involved in your action. However, you could also provide the selection manually and call `transaction()` on the document or app controller instance. Make sure that your transformations are robust for both scenarios. If you look at the above example under (3) we set the selection to the last matched element after search and replace. If something has been found.
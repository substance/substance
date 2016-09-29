import map from 'lodash/map'

export default function(collection, prop) {
  return map(collection, function(item) { return item[prop]; });
};

module.exports = {
  getNestedProperty
}

function getNestedProperty (path, object) {
  return path.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, object)
}

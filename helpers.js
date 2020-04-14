module.exports = {
  getNestedProperty,
  setNestedProperty
}

function getNestedProperty (path, object) {
  return path.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, object)
}

function setNestedProperty (object, path, value) {
  let ref = object
  for (let index = 0; index < path.length; index++) {
    const property = path[index]
    if (index === path.length - 1) ref[property] = value
    if (!ref[property]) ref[property] = {}
    ref = ref[property]
  }
}

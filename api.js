const fsPromises = require('fs').promises
const path = require('path')
const {
  getNestedProperty
} = require('./helpers')

module.exports = {
  getHealth,
  getStudentProperty
}

async function getHealth (req, res, next) {
  res.json({ success: true })
}

// - GET /:student-id/:propertyName(/:propertyName)
// - Retrieves data from `/data/${studentId}.json`.
// - Returns 404 if that file or property doesn't exist.
// - Should also retrieve nested properties:
// - `curl http://localhost:1337/rn1abu8/courses/calculus`
async function getStudentProperty (req, res) {
  const studentId = req.params.studentId
  const properties = req.params[0].split('/')
  const dir = path.join(__dirname, 'data')
  const filePath = path.join(dir, `${studentId}.json`)
  // Retrieves data from `/data/${studentId}.json`
  try {
    const data = await fsPromises.readFile(filePath)
    const student = JSON.parse(data)
    // this means no property was passed, so return student
    if (properties.length === 1 && properties[0] === '') {
      return res.json(student)
    }
    // Retrieve nested properties
    const property = getNestedProperty(properties, student)
    // Returns 404 if that property doesn't exist
    if (!property) {
      return res.status(404).json({ message: "Sorry can't find that!" })
    }
    return res.json(property)
  } catch (error) {
    // Returns 404 if that file doesn't exist
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: "Sorry can't find that!" })
    }
    return res.status(500).json({ message: 'Something went wrong' })
  }
}

const fsPromises = require('fs').promises
const path = require('path')
const {
  getNestedProperty,
  setNestedProperty
} = require('./helpers')

module.exports = {
  getHealth,
  getStudentProperty,
  putStudentProperty
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

// - PUT /:student-id/:propertyName(/:propertyName)
// - Stores data within `/data/${studentId}.json`.
// - If that file or property doesn't exist it is created.
// - Should also set nested properties: `curl -X PUT -d '{ "score": 98 }'
// http://localhost:1337/rn1abu8/courses/calculus/quizzes/ye0ab61`
// would mean that `require('./data/rn1abu8.json').courses.calculus.quizzes.ye0ab61.score === 98`
async function putStudentProperty (req, res) {
  const studentId = req.params.studentId
  const properties = req.params[0].split('/')
  const dir = path.join(__dirname, 'data')
  const filePath = path.join(dir, `${studentId}.json`)
  let student = {}
  // If data directory doesn't exist it is created
  try {
    await fsPromises.mkdir(dir)
  } catch (error) {
    // It's not a problem if directory already exist
    if (error.code !== 'EEXIST') {
      return res.status(500).json({ message: 'Something went wrong' })
    }
  }
  // Try to read studen json
  try {
    const data = await fsPromises.readFile(filePath)
    student = JSON.parse(data)
  } catch (error) {
    // It's not a problem if file doesn't exist
    if (error.code !== 'ENOENT') {
      return res.status(500).json({ message: 'Something went wrong' })
    }
  }
  // Set nested properties and save changes
  try {
    setNestedProperty(student, properties, req.body)
    await fsPromises.writeFile(filePath, JSON.stringify(student, null, 2))
    return res.json(student)
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong' })
  }
}

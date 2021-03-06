const fsPromises = require('fs').promises
const path = require('path')
const tape = require('tape')
const jsonist = require('jsonist')

const port = (process.env.PORT = process.env.PORT || require('get-port-sync')())
const endpoint = `http://localhost:${port}`

const server = require('./server')

const testStudent = {
  id: 'test1' + Date.now()
}

const testStudent2 = {
  id: 'test2' + Date.now(),
  courses: {
    calculus: {
      quizzes: {
        ye0ab61: {
          score: 98
        }
      }
    }
  }
}

tape('setup', async function (t) {
  const dir = path.join(__dirname, 'data')
  const filePath = path.join(dir, `${testStudent2.id}.json`)
  // If data directory doesn't exist it is created
  try {
    await fsPromises.mkdir(dir)
  } catch (error) {
    // Ignore directory already exists error
    if (error.code !== 'EEXIST') {
      t.error(error)
    }
  }
  try {
    // Create test student json file
    await fsPromises.writeFile(filePath, JSON.stringify(testStudent2, null, 2))
    t.pass('should successfully create test file and directory')
  } catch (error) {
    t.error(error)
  }
  t.end()
})

tape('health', async function (t) {
  const url = `${endpoint}/health`
  jsonist.get(url, (err, body) => {
    if (err) t.error(err)
    t.ok(body.success, 'should have successful healthcheck')
    t.end()
  })
})

tape('PUT - data for new student in non-existent student json file', async function (t) {
  const dir = path.join(__dirname, 'data')
  const filePath = path.join(dir, `${testStudent.id}.json`)
  try {
    await fsPromises.stat(filePath)
    t.fail('temporary test student json file should exist before')
  } catch (err) {
    t.equal(err.code, 'ENOENT', 'temporary test student json file should not exist before')
  }
  const url = `${endpoint}/${testStudent.id}/courses/calculus/quizzes/ye0ab61`
  const payload = { 'score': 98 }
  jsonist.put(url, payload, async (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 200, 'should return correct status code')
    t.deepEqual(body.courses.calculus.quizzes.ye0ab61, payload, 'payload exists on returned student')
    try {
      await fsPromises.access(filePath)
      t.pass('temporary test student json file should exist after')
    } catch (err) {
      t.error(err)
    }
    t.end()
  })
})

tape('PUT - data in existing student json file', async function (t) {
  const dir = path.join(__dirname, 'data')
  const filePath = path.join(dir, `${testStudent.id}.json`)
  try {
    await fsPromises.access(filePath)
    t.pass('student json file should already exist')
  } catch (err) {
    t.error(err)
  }
  const url = `${endpoint}/${testStudent.id}/courses/calculus/quizzes/ye0ab61`
  const payload = { 'time': Date.now() }
  jsonist.put(url, payload, (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 200, 'should return correct status code')
    t.deepEqual(body.courses.calculus.quizzes.ye0ab61, payload, 'payload exists on returned student')
    t.end()
  })
})

tape('GET - student json file', async function (t) {
  const url = `${endpoint}/${testStudent2.id}/`
  jsonist.get(url, (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 200, 'should return correct status code')
    t.deepEqual(body.courses, testStudent2.courses, 'should return student data from json')
    t.end()
  })
})

tape('GET - non-existing student', async function (t) {
  const url = `${endpoint}/undefined`
  jsonist.get(url, (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 404, 'should return 404 if file doesn\'t exist')
    t.end()
  })
})

tape('GET - nested property from student json', async function (t) {
  const url = `${endpoint}/${testStudent2.id}/courses/calculus`
  jsonist.get(url, (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 200, 'should return correct status code')
    t.deepEqual(body, testStudent2.courses.calculus, 'should retrieve nested properties')
    t.end()
  })
})

tape('GET - non-existing property of existing student', async function (t) {
  const url = `${endpoint}/${testStudent2.id}/courses/undefined`
  jsonist.get(url, (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 404, 'should return 404 if property doesn\'t exist')
    t.end()
  })
})

tape('DELETE - property of non-existing student', async function (t) {
  const url = `${endpoint}/undefined/courses/calculus/quizzes/ye0ab61`
  jsonist.delete(url, (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 404, 'should return 404 if file doesn\'t exist')
    t.end()
  })
})

tape('DELETE - non-existing property of student', async function (t) {
  const url = `${endpoint}/${testStudent2.id}/courses/calculus/quizzes/undefined`
  jsonist.delete(url, (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 404, 'should return 404 if property doesn\'t exist')
    t.end()
  })
})

tape('DELETE - nested property of student', async function (t) {
  const url = `${endpoint}/${testStudent2.id}/courses/calculus/quizzes/ye0ab61`
  jsonist.delete(url, (err, body, res) => {
    if (err) t.error(err)
    t.equal(res.statusCode, 200, 'should return correct status code')
    t.deepEqual(body.courses.calculus.quizzes.ye0ab61, {}, 'should delete nested property of student')
    t.end()
  })
})

tape('cleanup', async function (t) {
  server.close()
  try {
    const dir = path.join(__dirname, 'data')
    const filePath = path.join(dir, `${testStudent.id}.json`)
    const filePath2 = path.join(dir, `${testStudent2.id}.json`)
    await fsPromises.unlink(filePath)
    await fsPromises.unlink(filePath2)
    t.pass('should successfully clean up test files')
  } catch (error) {
    t.error(error)
  }
  t.end()
})

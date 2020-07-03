const mongo = require('mongodb')

const getMongoUrl = (local = false) => {
  const localUrl = 'mongodb://localhost:27017/local'
  if (local) {
    return localUrl
  }
  const url = process.env.CONNECTION
  return url || localUrl
}

const issueError = (res, error) => {
  if (typeof error === 'number') {
    res.sendStatus(error)
  } else {
    res.status(500).json(error)
  }
}

const connectAndExecute = (routine) => async (req, res) => {
  const connectionURL = getMongoUrl()

  const client = new mongo.MongoClient(connectionURL, { useUnifiedTopology: true })
  const { error } = await client.connect()

  if (error) {
    if (client) client.close()
    console.error(error)
    issueError(res, error)
  } else {
    const { error, data } = await routine(client.db('vbase2'), req.params, req.body)
    if (error || !data) {
      issueError(res, error)
    } else {
      res.status(200).json(data)
    }
    client.close()
  }
}

module.exports = connectAndExecute

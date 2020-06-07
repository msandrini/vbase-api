import mongoDB from 'mongodb'

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

const connectAndExecute = (req, res) => async (routine) => {
  const mongo = mongoDB.MongoClient
  const { error, client } = await mongo.connect(getMongoUrl())

  if (error) {
    if (client) client.close()
    console.error(error)
    issueError(res, error)
  } else {
    const { error, data } = routine(client.db, req.params, req.body)
    if (error || !data) {
      issueError(res, error)
    } else {
      res.status(200).json(data)
    }
    client.close()
  }
}

export default connectAndExecute

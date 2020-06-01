import express from 'express'
import mongoDB from 'mongodb'

const app = express()
const connection = app.get('connection')

const getMongoUrl = (local = false) => {
  const localUrl = 'mongodb://localhost:27017/local'
  if (local) {
    return localUrl
  }
  const url = process.env.CONNECTION
  return url || localUrl
}

const connect = () => {
  const mongo = mongoDB.MongoClient
  return new Promise((resolve, reject) => {
    mongo.connect(getMongoUrl(), null, (error, db) => {
      if (error) {
        if (db) db.close()
        console.error(connection.res)
        reject(connection.res, 'DBConn')
      } else {
        resolve(db)
      }
    })
  })
}

export default connect

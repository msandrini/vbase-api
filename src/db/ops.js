const ops = (db, payload) => {
  return new Promise((resolve, reject) => {
    db.listCollections().toArray().then((results, error) => {
      resolve(results, error)
    })
  })
}

export default ops

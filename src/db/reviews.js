const reviews = {

  list: async (db, { game }) => {
    const search = { game }
    const projection = { _id: 0, game: 0 }
    const sort = { added: 1 }
    const { error, results } = db.collection('reviews').find(search, projection).sort(sort).toArray()

    if (error) {
      return { error }
    }
    return { data: results }
  },

  insert: async (db, _, body) => {
    const payload = { ...body, added: new Date(), source: 'simple-api' }
    const { result, error } = await db.collection('reviews').insertOne(payload)
    if (error) {
      return { error }
    }
    return { data: result.result }
  }

}

export default reviews

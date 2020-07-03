const reviews = {

  list: async (db, { game }) => {
    const search = { game }
    const projection = { _id: 0, game: 0 }
    const sort = { added: 1 }
    try {
      const results = await db.collection('reviews').find(search, projection).sort(sort).toArray()
      return { data: results }
    } catch (error) {
      return { error }
    }
  },

  insert: async (db, _, body) => {
    const payload = { ...body, added: new Date(), source: 'simple-api' }
    try {
      const results = await db.collection('reviews').insertOne(payload)
      return { data: { insertedCount: results.insertedCount } }
    } catch (error) {
      return { error }
    }
  }

}

module.exports = reviews

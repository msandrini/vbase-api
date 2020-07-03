const ops = async (db) => {
  try {
    const collections = await db.listCollections().toArray()
    return { data: collections }
  } catch (error) {
    return { error }
  }
}

module.exports = ops

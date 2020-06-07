const ops = async (db) => {
  return await db.listCollections().toArray()
}

export default ops

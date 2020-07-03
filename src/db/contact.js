const contact = async (db, _, body) => {
  const payload = { ...body, dateSent: new Date() }
  try {
    const results = await db.collection('contactmessages').insertOne(payload)
    return { data: { insertedCount: results.insertedCount } }
  } catch (error) {
    return { error }
  }
}

module.exports = contact

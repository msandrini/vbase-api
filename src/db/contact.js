const contact = async (db, _, body) => {
  const payload = { ...body, dateSent: new Date() }
  const { results, error } = await db.collection('contactmessages').insertOne(payload)

  if (error) {
    return { error }
  }
  return { data: results.result }
}

export default contact

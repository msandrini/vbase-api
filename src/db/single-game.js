const { gameIdIsValid } = require('../../utils/string')

const singleInfo = async (db, { id }) => {
  if (!gameIdIsValid(id)) {
    return { error: 'Invalid ID' }
  }
  // Query for the game primary info
  const condition = { _id: id }
  let resultsG
  try {
    resultsG = await db.collection('games').findOne(condition, { _id: 0 })
  } catch (error) {
    return { error }
  }
  if (resultsG === null) {
    return { error: 404 }
  }
  const doc = resultsG || {}
  // Put on queue query for all types of supplementar info on games
  const promises = []
  const types = [
    'series',
    'addOns',
    'genres',
    'companies'
  ]
  types.forEach(typeKey => {
    if (doc[typeKey]) {
      const conditions = doc[typeKey].map(v => ({ _id: v }))
      promises.push(db.collection(typeKey.toLowerCase()).find({ $or: conditions }).toArray())
    } else {
      promises.push([])
    }
  })
  // Put on queue query for user reviews with some processing on the query itself
  const aggregationParams = [
    { $match: { game: id } },
    { $group: { _id: null, averageScore: { $avg: '$score' }, timesReviewed: { $sum: 1 } } }
  ]
  promises.push(db.collection('reviews').aggregate(aggregationParams).toArray())

  // Get all results
  let results
  try {
    results = await Promise.all(promises)
  } catch (error) {
    return { error }
  }
  // Process results from the four types
  let counter
  results.forEach((resultForType, index) => {
    if (index < 4) {
      const output = {}
      for (const entry of resultForType) {
        output[entry._id] = { title: entry.title, id: entry._id }
      }
      const typeKey = types[index]
      if (doc[typeKey]) {
        counter = 0
        for (const entriesOnGame of doc[typeKey]) {
          doc[typeKey][counter] = output[entriesOnGame]
          counter++
        }
      }
    }
  })
  // Process user reviews
  const userReviews = results[4]
  if (userReviews.length && userReviews[0]) {
    delete userReviews[0]._id
    doc.userReviews = userReviews[0]
  }
  return { data: doc }
}

module.exports = singleInfo

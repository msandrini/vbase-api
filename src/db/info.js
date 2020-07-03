const path = require('path')
const fs = require('fs')

const getDBNameFromType = (type) => {
  const typeWhitelist = ['addon', 'genre', 'series', 'company']
  if (typeWhitelist.includes(type)) {
    if (type !== 'company') {
      if (type !== 'series') {
        return type + 's'
      }
      return type
    }
    return 'companies'
  }
  return null
}

const singleInfo = async (db, { type, key }) => {
  const condition = { _id: key }
  const dbName = getDBNameFromType(type)

  if (dbName) {
    let doc
    try {
      doc = await db.collection(dbName).findOne(condition, { _id: 0 })
    } catch (error) {
      return { error }
    }
    if (!doc) {
      return { error: 404 }
    }
    const imgPath = `../static/images/${dbName}/${key}/1.png`
    const data = { ...doc, imageExists: fs.existsSync(path.join(__dirname, imgPath)) }
    return { data }
  }
  return { error: `${type} not recognised as a type` }
}

module.exports = singleInfo

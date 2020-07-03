const ITEMS_PER_PAGE = 20
const projectionForList = {
  title: 1,
  genres: 1,
  releaseIn: 1,
  otherNames: 1,
  companies: 1,
  editorScore: 1,
  specialStatus: 1
}
const sortCriteria = { title: 1 }
const basicCondition = { specialStatus: { $ne: 'homebrew' } }

const getEscapedRegExp = str => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
const getRegExpParam = str => ({ $regex: `${getEscapedRegExp(str)}`, $options: 'i' })
const getUnique = (array) => array.filter((value, index, self) => self.indexOf(value) === index)

const getConditions = data => {
  const conditions = {}
  if (data.companyid) {
    conditions.companies = getRegExpParam(data.companyid)
  }
  if (data.review) {
    const lang = data.lang
    conditions[`editorReview.${lang}`] = getRegExpParam(data.review)
  }
  if (data.genreid) {
    conditions.genres = data.genreid
  }
  if (data.names) {
    conditions.$or = [{ title: getRegExpParam(data.names) }, { 'otherNames.name': getRegExpParam(data.names) }]
  }
  if (data.seriesid) {
    conditions.series = data.seriesid
  }
  if (data.addonid) {
    conditions.addOns = data.addonid
  }
  if (data.scores.from || data.scores.to) {
    conditions.editorScore = {}
    if (data.scores.from) {
      conditions.editorScore.$gte = parseFloat(data.scores.from)
    }
    if (data.scores.to) {
      conditions.editorScore.$lte = parseFloat(data.scores.to)
    }
  }
  if (data.sizes.from || data.sizes.to) {
    conditions.cartridgeSize = {}
    if (data.sizes.from) {
      conditions.cartridgeSize.$gte = parseFloat(data.sizes.from)
    }
    if (data.sizes.to) {
      conditions.cartridgeSize.$lte = parseFloat(data.sizes.to)
    }
  }
  if (data.years.from || data.years.to) {
    conditions.year = {}
    if (data.years.from) {
      conditions.year.$gte = parseInt(data.years.from, 10)
    }
    if (data.years.to) {
      conditions.year.$lte = parseInt(data.years.to, 10)
    }
  }
  return conditions
}

const getGames = async (db, cursor, page, pageSize = ITEMS_PER_PAGE) => {
  const skip = (page - 1) * pageSize
  let docs
  let count
  try {
    const results = await cursor.skip(skip).limit(pageSize).sort(sortCriteria).toArray()
    docs = results || []
  } catch (error) {
    return { error }
  }
  try {
    count = await cursor.count(false)
  } catch (errorCount) {
    return { error: errorCount }
  }
  let genres = []
  for (const d of docs) {
    if (d.genres) {
      genres = [...genres, ...d.genres]
    }
  }
  let companies = []
  for (const d of docs) {
    if (d.companies) {
      companies = [...companies, ...d.companies]
    }
  }
  if (genres.length || companies.length) {
    const genresCondition = { _id: { $in: getUnique(genres) || [] } }
    const companiesCondition = { _id: { $in: getUnique(companies) || [] } }
    let docsGenre
    let docsCompany
    try {
      const results = await Promise.all([
        db.collection('genres').find(genresCondition, { title: 1 }).toArray(),
        db.collection('companies').find(companiesCondition, { name: 1 }).toArray()
      ])
      docsGenre = results[0]
      docsCompany = results[1]
    } catch (error) {
      return { error }
    }

    const genresObj = {}
    for (const g of docsGenre) {
      genresObj[g._id] = g.title
    }
    for (const d of docs) {
      const genresForThisDoc = []
      for (const dg of d.genres) {
        genresForThisDoc.push(genresObj[dg])
      }
      d.genreTitles = genresForThisDoc
      delete d.genres
    }

    const companiesObj = {}
    for (const c of docsCompany) {
      companiesObj[c._id] = c.name
    }
    for (const d of docs) {
      const companiesForThisDoc = []
      for (const dg of d.companies) {
        companiesForThisDoc.push(companiesObj[dg])
      }
      d.companyNames = companiesForThisDoc
      delete d.companies
    }
    return { data: { games: docs, total: count } }
  } else {
    return { data: { games: docs, total: count } }
  }
}

const games = {

  byNames: async (db, { name, page = 0 }) => {
    const search = getRegExpParam(name)
    const condition = { ...basicCondition, $or: [{ title: search }, { 'otherNames.name': search }] }
    const gamesCursor = db.collection('games').find(condition, projectionForList)
    return await getGames(db, gamesCursor, page)
  },

  all: async (db, { page = 0 }) => {
    const gamesCursor = db.collection('games').find(basicCondition, projectionForList)
    return await getGames(db, gamesCursor, page)
  },

  fromSeries: async (db, { series }) => {
    const condition = { ...basicCondition, series: { $in: series.split(',') } }
    const gamesCursor = db.collection('games').find(condition, { title: 1 })
    return await getGames(db, gamesCursor, 1, 100)
  },

  advanced: async (db, _, body) => {
    const data = body
    const conditions = { ...basicCondition, ...getConditions(data) }
    const doMainCall = async (conditions) => {
      const gamesCursor = db.collection('games').find(conditions, projectionForList)
      return await getGames(db, gamesCursor, data.page || 1)
    }
    if (data.company) {
      try {
        const docs = await db.collection('companies').find({ name: getRegExpParam(data.company) }, { _id: 1 }).toArray()
        const companyIds = docs.map(d => d._id)
        return await doMainCall({ ...conditions, companies: { $in: companyIds } })
      } catch (error) {
        return { error }
      }
    } else {
      return await doMainCall(conditions)
    }
  }

}

module.exports = games

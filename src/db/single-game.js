import { gameIdIsValid } from './utils.server'

const singleInfo = (db, id) => {
  return new Promise((resolve, reject) => {
    if (!gameIdIsValid(id)) {
      reject(new Error('Invalid ID'))
    } else {
      const condition = { _id: id }
      db.collection('games').findOne(condition, { _id: 0 }).then((doc, error) => {
        if (error) {
          reject(error)
        } else {
          if (doc === null) {
            reject(new Error('404 Error'))
            return false
          }
          doc = doc || {}
          const promises = []
          if (doc.series) {
            const seriesConditions = doc.series.map(series => ({ _id: series }))
            promises.push(db.collection('series').find({ $or: seriesConditions }).toArray())
          } else {
            promises.push([])
          }
          if (doc.addOns) {
            const addOnsConditions = doc.addOns.map(addOns => ({ _id: addOns }))
            promises.push(db.collection('addons').find({ $or: addOnsConditions }).toArray())
          } else {
            promises.push([])
          }
          if (doc.genres) {
            const genresConditions = doc.genres.map(genres => ({ _id: genres }))
            promises.push(db.collection('genres').find({ $or: genresConditions }).toArray())
          } else {
            promises.push([])
          }
          if (doc.companies && doc.companies.length) {
            const companiesConditions = doc.companies.map(companies => ({ _id: companies }))
            promises.push(db.collection('companies').find({ $or: companiesConditions }).toArray())
          } else {
            promises.push([])
          }
          const aggregationParams = [
            { $match: { game: id } },
            { $group: { _id: null, averageScore: { $avg: '$score' }, timesReviewed: { $sum: 1 } } }
          ]
          promises.push(db.collection('reviews').aggregate(aggregationParams).toArray())

          Promise.all(promises).then(results => {
            let counter
            const series = {}
            for (const s of results[0]) {
              series[s._id] = { title: s.title, id: s._id }
            }
            if (doc.series) {
              counter = 0
              for (const seriesOnGame of doc.series) {
                doc.series[counter] = series[seriesOnGame]
                counter++
              }
            }
            const addOns = {}
            for (const a of results[1]) {
              addOns[a._id] = { title: a.title, type: a.type, id: a._id }
            }
            if (doc.addOns) {
              counter = 0
              for (const addOnsOnGame of doc.addOns) {
                doc.addOns[counter] = addOns[addOnsOnGame]
                counter++
              }
            }
            const genres = {}
            for (const g of results[2]) {
              genres[g._id] = { title: g.title, super: g.super, id: g._id }
            }
            if (doc.genres) {
              counter = 0
              for (const genresOnGame of doc.genres) {
                doc.genres[counter] = genres[genresOnGame]
                counter++
              }
            }
            const companies = {}
            for (const c of results[3]) {
              companies[c._id] = { title: c.name, id: c._id }
            }
            if (doc.companies) {
              counter = 0
              for (const companiesOnGame of doc.companies) {
                doc.companies[counter] = companies[companiesOnGame]
                counter++
              }
            }
            if (results[4].length && results[4][0]) {
              delete results[4][0]._id
              doc.userReviews = results[4][0]
            }
            resolve(doc)
          }).catch(errorCompl => {
            reject(errorCompl)
          })
        }
      })
    }
  })
}

export default singleInfo

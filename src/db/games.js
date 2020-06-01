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

const _escapeRegExp = str => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
const _regExpParam = str => ({ $regex: `${_escapeRegExp(str)}`, $options: 'i' })
const _unique = (array) => array.filter((value, index, self) => self.indexOf(value) === index)

const _getConditions = data => {
	let conditions = {}
	if (data.companyid) {
		conditions.companies = _regExpParam(data.companyid)
	}
	if (data.review) {
		const lang = data.lang
		conditions[`editorReview.${lang}`] = _regExpParam(data.review)
	}
	if (data.genreid) {
		conditions.genres = data.genreid
	}
	if (data.names) {
		conditions.$or = [{ title: _regExpParam(data.names) }, { 'otherNames.name': _regExpParam(data.names) }]
	}
	if (data.seriesid) {
		conditions.series = data.seriesid
	}
	if (data.addonid) {
		conditions.addOns = data.addonid
	}
	if (data['scores-from'] || data['scores-to']) {
		conditions.editorScore = {}
		if (data['scores-from']) {
			conditions.editorScore['$gte'] = parseFloat(data['scores-from'])
		}
		if (data['scores-to']) {
			conditions.editorScore['$lte'] = parseFloat(data['scores-to'])
		}
	}
	if (data['sizes-from'] || data['sizes-to']) {
		conditions.cartridgeSize = {}
		if (data['sizes-from']) {
			conditions.cartridgeSize['$gte'] = parseFloat(data['sizes-from'])
		}
		if (data['sizes-to']) {
			conditions.cartridgeSize['$lte'] = parseFloat(data['sizes-to'])
		}
	}
	if (data['years-from'] || data['years-to']) {
		conditions.year = {}
		if (data['years-from']) {
			conditions.year['$gte'] = parseInt(data['years-from'], 10)
		}
		if (data['years-to']) {
			conditions.year['$lte'] = parseInt(data['years-to'], 10)
		}
	}
	return conditions
}

const _getGames = (db, cursor, page, pageSize = ITEMS_PER_PAGE) => {
	const skip = (page - 1) * pageSize
	return new Promise((resolve, reject) => {
		cursor.skip(skip).limit(pageSize).sort(sortCriteria).toArray((err, docs) => {
			if (err) {
				reject(err)
			} else {
				cursor.count(false, (errCount, count) => {
					if (errCount) {
						reject(errCount)
					} else {
						docs = docs || []
						let genres = []
						for (let d of docs) {
							if (d.genres) {
								genres = [...genres, ...d.genres]
							}
						}
						let companies = []
						for (let d of docs) {
							if (d.companies) {
								companies = [...companies, ...d.companies]
							}
						}
						if (genres.length || companies.length) {
							const genresCondition = { _id: { $in: _unique(genres) || [] } }
							const companiesCondition = { _id: { $in: _unique(companies) || [] } }
							Promise.all([
								db.collection('genres').find(genresCondition, { title: 1 }).toArray(),
								db.collection('companies').find(companiesCondition, { name: 1 }).toArray()
							]).then((results) => {
								let [docsGenre, docsCompany] = results

								let genresObj = {}
								for (let g of docsGenre) {
									genresObj[g._id] = g.title
								}
								for (let d of docs) {
									let genresForThisDoc = []
									for (let dg of d.genres) {
										genresForThisDoc.push(genresObj[dg])
									}
									d.genreTitles = genresForThisDoc
									delete d.genres
								}

								let companiesObj = {}
								for (let c of docsCompany) {
									companiesObj[c._id] = c.name
								}
								for (let d of docs) {
									let companiesForThisDoc = []
									for (let dg of d.companies) {
										companiesForThisDoc.push(companiesObj[dg])
									}
									d.companyNames = companiesForThisDoc
									delete d.companies
								}
								resolve({ games: docs, total: count })

							}).catch((errAll) => {
								reject(errAll)
							})
						} else {
							resolve({ games: docs, total: count })
						}
					}
				})
			}
		})
	})
}

const games = {

	byNames: (db, name, page = 0) => {
		const search = _regExpParam(name)
		const condition = Object.assign({}, basicCondition, { $or: [{ title: search }, { 'otherNames.name': search }] })
		const gamesCursor = db.collection('games').find(condition, projectionForList)
		return _getGames(db, gamesCursor, page)
	},

	all: (db, page = 0) => {
		const gamesCursor = db.collection('games').find(basicCondition, projectionForList)
		return _getGames(db, gamesCursor, page)
	},

	fromSeries: (db, seriesIds) => {
		const condition = Object.assign({}, basicCondition, { series: { $in: seriesIds.split(',') } })
		const gamesCursor = db.collection('games').find(condition, { title: 1 })
		return _getGames(db, gamesCursor, 1, 100)
	},

	advanced: (db, postBody) => {
		const data = postBody
		let conditions = Object.assign({}, basicCondition, _getConditions(data))
		const _doMainCall = function (conditions) {
			const gamesCursor = db.collection('games').find(conditions, projectionForList)
			return _getGames(db, gamesCursor, data.page || 1)
		}
		if (data.company) {
			db.collection('companies').find({ name: _regExpParam(data.company) }, { _id: 1 }).toArray().then(docs => {
				const companyIds = docs.map(d => d._id)
				conditions.companies = { $in: companyIds }
				return _doMainCall(conditions)
			})
		} else {
			return _doMainCall(conditions)
		}
	}

}

module.exports = games

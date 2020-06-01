const reviews = {

	list: (db, game) => {
		const search = { game }
		const projection = { _id: 0, game: 0 }
		const sort = { added: 1 }
		return new Promise((resolve, reject) => {
			db.collection('reviews').find(search, projection).sort(sort).toArray((errorR, resultsR) => {
				if (errorR) {
					reject(errorR)
				} else {
					let userIds = new Set()
					for (const r of resultsR) {
						if (!userIds.has(r.user)) {
							userIds.add(r.user)
						}
					}
					const searchU = { _id: { $in: Array.from(userIds) } }
					const projectionU = { name: 1, source: 1 }
					db.collection('users').find(searchU, projectionU).toArray((errorU, resultsU) => {
						if (errorU) {
							reject(errorU)
						} else {
							let users = {}
							for (const u of resultsU) {
								users[u._id] = u
								delete users[u._id]._id
							}
							for (const r of resultsR) {
								r.userInfo = users[r['user']]
								delete r.user
							}
							resolve(resultsR)
						}
					})
				}
			})
		})
	},

	insert: (db, payload, session) => {
		payload.added = new Date()
		return new Promise((resolve, reject) => {
			const query = { serviceId: session.user.serviceId, via: session.user.via }
			db.collection('users').find(query, { _id: 1 }).limit(1).toArray((errorU, resultU) => {
				if (errorU) {
					reject(errorU)
				} else {
					const userId = resultU[0]._id
					payload.user = userId
					payload.source = 'new-api'
					db.collection('reviews').insertOne(payload).then((result, error) => {
						if (error) {
							reject(error)
						} else {
							resolve({ feedback: result.result })
						}
					})
				}
				resolve(resultU)
			})
		})
	}

}

module.exports = reviews

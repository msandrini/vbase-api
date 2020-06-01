const _getSet = payload => {
	payload.serviceId = payload.id
	delete payload.id
	payload.source = 'new-api'
	payload.lastLogin = new Date()
	return { $set: payload }
}

const user = {

	login: (db, payload, session) => {
		return new Promise((resolve, reject) => {
			const match = { serviceId: payload.id, via: payload.via }
			const set = _getSet(payload)
			const options = { upsert: true }
			db.collection('users').updateOne(match, set, options).then((result, error) => {
				if (error) {
					reject(error)
				} else {
					session.user = payload
					resolve()
				}
			})
		})
	},

	check: (res, session) => {
		let obj
		if (session && session.user) {
			const { name, via, image } = session.user
			obj = { name, via, image }
		} else {
			obj = null
		}
		res.json(obj)
	},

	logout: (res, session) => {
		session.reset()
		res.sendStatus(200)
	}

}

module.exports = user

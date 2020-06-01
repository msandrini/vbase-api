const contact = (db, payload) => {
	payload.dateSent = new Date()
	return new Promise((resolve, reject) => {
		db.collection('contactmessages').insertOne(payload).then((results, error) => {
			if (error) {
				reject(error)
			} else {
				resolve({ feedback: results.result })
			}
		})
	})
}

module.exports = contact

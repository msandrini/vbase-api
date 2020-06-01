export const gameIdIsValid = id => /[a-z0-9-]+/.test(String(id))

export const getDBNameFromType = (type) => {
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
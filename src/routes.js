const info = require('../utils/info')
const games = require('./db/games')
const singleGame = require('./db/single-game')
const contact = require('./db/contact')
const user = require('./db/user')
const reviews = require('./db/reviews')
const sitemap = require('./db/sitemap')
const ops = require('./db/ops')
const { issueToClient: { send, fail } } = require('../utils/error')
const connect = require('../utils/connection')

const routing = (app) => {

	const defaultRoute = res => res.sendStatus(404)

	app
		/* games list */

		.get('/games/all/:page', (req, res) => connect().then(db =>
			games.all(db, req.params.page).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		))
		.get('/games/by-names/:name/:page', (req, res) => connect().then(db =>
			games.byNames(db, req.params.name, req.params.page).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		))
		.post('/games/advanced', (req, res) => connect().then(db =>
			games.advanced(db, req.body).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		))
		.get('/games/from-series/:series', (req, res) => connect().then(db =>
			games.fromSeries(db, req.params.series).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		))

		/* single game */

		.get('/game-entry/:id', (req, res) => connect().then(db =>
			singleGame(db, req.params.id).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		))

		/* info */

		.get('/info-entry/:type/:key', (req, res) => connect().then(db =>
			info(db, req.params.type, req.params.key).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		))

		/* user review */

		.get('/user-reviews/:game', (req, res) => connect().then(db => {
			reviews.list(db, req.params.game).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		}))
		.post('/review', (req, res) => connect().then(db => {
			reviews.insert(db, req.body, req.session).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		}))

		/* user login */

		.post('/user', (req, res) => connect().then(db => {
			user.login(db, req.body, req.session).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		}))
		.get('/user', (req, res) => user.check(res, req.session))
		.delete('/user', (req, res) => user.logout(res, req.session))

		/* contact */

		.post('/contact', (req, res) => connect().then(db => {
			contact(db, req.body).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		}))

		/* sitemap generator */

		.get('/sitemap-generate', (req, res) => connect().then(db => {
			sitemap(db).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		}))

		/* maintenance */

		.get('/ops', (req, res) => connect().then(db => {
			ops(db).then(v => send(db, res, v)).catch(e => fail(db, res, e))
		}))

		/* default route */

		.get('*', (req, res) => defaultRoute(res))

}

export default routing

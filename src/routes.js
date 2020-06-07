import info from './db/info'
import games from './db/games'
import singleGame from './db/single-game'
import contact from './db/contact'
import reviews from './db/reviews'
import sitemap from './db/sitemap'
import ops from './db/ops'
import connectAndExecute from '../utils/connection'

const routing = (app) => {
  const defaultRoute = (req, res) => res.sendStatus(404)

  app
  /* games list */

    .get('/games/all/:page', connectAndExecute(games.all))
    .get('/games/by-names/:name/:page', connectAndExecute(games.byNames))
    .post('/games/advanced', connectAndExecute(games.advanced))
    .get('/games/from-series/:series', connectAndExecute(games.fromSeries))

  /* single game */

    .get('/game-entry/:id', connectAndExecute(singleGame))

  /* info */

    .get('/info-entry/:type/:key', connectAndExecute(info))

  /* user review */

    .get('/user-reviews/:game', connectAndExecute(reviews.list))
    .post('/review', connectAndExecute(reviews.insert))

  /* contact */

    .post('/contact', connectAndExecute(contact))

  /* sitemap generator */

    .get('/sitemap-generate', connectAndExecute(sitemap))

  /* maintenance */

    .get('/ops', connectAndExecute(ops))

  /* default route */

    .get('*', defaultRoute)
}

export default routing

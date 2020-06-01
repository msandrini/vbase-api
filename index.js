import express from 'express'
import bodyParser from 'body-parser'
import sessions from 'client-sessions'
import routing from './src/routes'

const app = express()

// sets port
app.set('port', (process.env.PORT || 5000))

// initialize bodyParser to interpret POST values
app.use(bodyParser.json())

// initialize sessions
const day = 24 * 60 * 60 * 1000
app.use(sessions({
  cookieName: 'session',
  secret: 'come-on-are-you-really-interested-in-reading-this-pfff-omg',
  duration: 10 * day,
  activeDuration: day
}))

// connect to DB and then continue to routing
routing(app)

// final listener (http)
app.listen(app.get('port'), () => {
  console.log('Node app is running HTTP on port ' + app.get('port'))
})

process.on('uncaughtException', function (err) {
  console.log(err)
})

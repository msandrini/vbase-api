import express from 'express'
import bodyParser from 'body-parser'
import routing from './src/routes'

const app = express()

// sets port
app.set('port', (process.env.PORT || 5000))

// initialize bodyParser to interpret POST values
app.use(bodyParser.json())

// connect to DB and then continue to routing
routing(app)

// final listener (http)
app.listen(app.get('port'), () => {
  console.log('Node app is running HTTP on port ' + app.get('port'))
})

process.on('uncaughtException', function (err) {
  console.log(err)
})

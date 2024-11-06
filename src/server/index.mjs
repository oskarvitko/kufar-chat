import express, { json } from 'express'
import config from '../config/server.mjs'
import browserApi from '../browser/browser-api.mjs'
import { createLogger } from '../common/log.mjs'
import { apiRouter } from './controllers/index.mjs'
import { connectSockets } from './socket.mjs'
import { join } from 'path'
import cors from 'cors'
import { htmlPath } from '../../index.mjs'

const app = express()

app.logger = createLogger('SERVER')

app.use(json())
app.use(express.static('client/dist'))
app.use(cors({ origin: '*' }))
app.use('/api', apiRouter)

app.get('/client', (_, res) => res.sendFile(htmlPath))

const startServer = () => {
    const server = connectSockets(app)

    server.listen(config.PORT, async () => {
        app.logger.log(`Server started on port ${config.PORT}`, 'success')
        await browserApi.connect()
        // browserApi.launchProfiles(1)
    })
}

export default startServer

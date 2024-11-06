import { Router } from 'express'
import { profilesRouter } from './profiles.mjs'
import { controllerRouter } from './controller.mjs'

export const apiRouter = Router()

apiRouter.use('/profiles', profilesRouter)
apiRouter.use('/controller', controllerRouter)

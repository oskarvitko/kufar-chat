import { Router } from 'express'
import {
    connectedProfileMiddleware,
    getProfileByIdFromBody,
} from '../middlewares/profiles.mjs'
import { controllerCommandMiddleware } from '../middlewares/controller.mjs'

export const controllerRouter = Router()

export const commands = [
    {
        name: 'get-new-messages',
        exec: async (controller) => controller.dialogs,
    },
    {
        name: 'open-dialog',
        params: ['dialogId'],
        exec: async (controller, { dialogId }) =>
            controller.openDialog(dialogId),
    },
    {
        name: 'close-dialog',
        exec: (controller) => controller.closeDialog(),
    },
    {
        name: 'send-message',
        exec: (controller, { message, dialogId }) =>
            controller.sendMessage(message, dialogId),
        params: ['message', 'dialogId'],
    },
]

controllerRouter.post(
    '/command',
    getProfileByIdFromBody,
    connectedProfileMiddleware,
    controllerCommandMiddleware,
    async (req, res) => {
        const { profile } = req
        const { command, profileId, ...commandParams } = req.body

        const cmd = commands.find((c) => c.name === command)

        try {
            const result = await cmd.exec(
                profile.getController(),
                commandParams,
            )
            return res.status(200).json(result === undefined ? true : result)
        } catch (e) {
            profile.logger.error(e)
            return res.status(500).json({ message: 'Command error', error: e })
        }
    },
)

import { commands } from '../controllers/controller.mjs'

export const controllerCommandMiddleware = (req, res, next) => {
    const body = req.body ?? {}
    const { command } = body

    const cmd = commands.find((c) => c.name === command)

    if (!cmd) {
        return res.status(400).json({ message: 'Invalid command name.' })
    }

    const cmdParams = cmd.params ?? []

    for (let param of cmdParams) {
        if (body[param] === undefined) {
            return res.status(400).json({
                message: `Invalid command. Missed param ${param}. Required params: [${cmdParams
                    .map((p) => `"${p}"`)
                    .join(', ')}]`,
            })
        }
    }

    next()
}

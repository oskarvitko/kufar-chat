import browserApi from '../../browser/browser-api.mjs'

export const getProfileByIdFromBody = (req, res, next) => {
    const { profileId } = req.body ?? {}

    const profile = browserApi.getProfileById(profileId)

    if (!profile) {
        return res.status(404).json({ message: 'Profile not founded' })
    }

    req.profile = profile

    next()
}

export const getProfileByIdFromParam = (req, res, next) => {
    const { id } = req.params ?? {}

    const profile = browserApi.getProfileById(id)

    if (!profile) {
        return res.status(404).json({ message: 'Profile not founded' })
    }

    req.profile = profile

    next()
}

export const connectedProfileMiddleware = (req, res, next) => {
    const { profile } = req

    if (!profile.isConnected()) {
        return res.status(400).json({ message: 'Profile disconnected.' })
    }

    next()
}

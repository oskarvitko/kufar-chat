import { Router } from 'express'
import browserApi from '../../browser/browser-api.mjs'
import {
    getProfileByIdFromParam,
    getProfileByIdFromBody,
} from '../middlewares/profiles.mjs'

export const profilesRouter = Router()

const formatProfile = (profile) => profile.get()
const formatProfiles = (profiles) => profiles.map(formatProfile)

// Get All Profiles
profilesRouter.get('/', (req, res) => {
    const profiles = browserApi.getProfilesArray()

    return res.status(200).json(formatProfiles(profiles))
})

// Get Profile By ID
profilesRouter.get('/:id', getProfileByIdFromParam, (req, res) => {
    const { profile } = req

    return res.status(200).json(formatProfile(profile))
})

// Launch All Profiles
profilesRouter.post('/launch-all', async (req, res) => {
    browserApi.launchProfiles()

    return res.status(200).json(true)
})

// Launch profile
profilesRouter.post('/launch', getProfileByIdFromBody, async (req, res) => {
    const { profile } = req

    await profile.launch()

    return res.status(200).json(true)
})

// Shutdown profile
profilesRouter.post('/shutdown', getProfileByIdFromBody, async (req, res) => {
    const { profile } = req

    await profile.stop()

    return res.status(200).json(true)
})

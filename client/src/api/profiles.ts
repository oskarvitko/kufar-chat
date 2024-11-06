import { api } from '.'
import { Profile } from '../types'

export const getAllProfiles = (): Promise<Profile[]> =>
    api.get('profiles').then((r) => r.data)

export const launchAll = () => api.post('profiles/launch-all')

export const launchProfile = (profileId: string) =>
    api.post('profiles/launch', { profileId })

export const shutdownProfile = (profileId: string) =>
    api.post('profiles/shutdown', { profileId })

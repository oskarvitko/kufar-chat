import { useMemo } from 'react'
import { Profile, ProfileStatus as ProfileStatusType } from '../../types'
import { Stack, Typography } from '@mui/material'
import { ProfileStatus } from './Profile'

export interface ProfilesStatsProps {
    profiles: Profile[]
}

export const ProfilesStats = ({ profiles }: ProfilesStatsProps) => {
    const { connected, stopped, unauthorized } = useMemo(() => {
        const result: Record<ProfileStatusType, number> = {
            connected: 0,
            connecting: 0,
            stopped: 0,
            unauthorized: 0,
        }

        profiles.forEach((profile) => {
            result[profile.status] += 1
        })

        return result
    }, [profiles])

    return (
        <Stack direction="row" spacing={1}>
            <Stack direction="row" spacing={1} alignItems={'center'}>
                <ProfileStatus size={10} status="connected" />
                <Typography>{connected}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems={'center'}>
                <ProfileStatus size={10} status="stopped" />
                <Typography>{stopped}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems={'center'}>
                <ProfileStatus size={10} status="unauthorized" />
                <Typography>{unauthorized}</Typography>
            </Stack>
        </Stack>
    )
}

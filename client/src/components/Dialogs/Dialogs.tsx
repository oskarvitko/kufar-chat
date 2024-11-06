import { useMemo } from 'react'
import { Profile } from '../../types'
import { CircularProgress, Stack, Typography } from '@mui/material'
import { Dialog } from './Dialog'

interface DialogsProps {
    profiles: Profile[]
    loading: boolean
}

export const Dialogs = (props: DialogsProps) => {
    const { profiles, loading } = props

    const profilesWithDialogs = useMemo(() => {
        return profiles.filter(
            (profile) =>
                profile.dialogs?.length && profile.status === 'connected',
        )
    }, [profiles])

    if (loading) {
        return (
            <CircularProgress
                sx={{ alignSelf: 'center', mt: 5 }}
                color="secondary"
            />
        )
    }

    if (!profilesWithDialogs.length) {
        return (
            <Typography textAlign={'center'}>
                Нет новых сообщений среди запущенных профилей
            </Typography>
        )
    }

    return (
        <Stack direction="column" spacing={1}>
            {profilesWithDialogs.map((profile) => (
                <Dialog key={profile.id} profile={profile} />
            ))}
        </Stack>
    )
}

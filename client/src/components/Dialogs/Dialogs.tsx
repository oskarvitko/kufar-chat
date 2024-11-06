import { useDeferredValue, useMemo } from 'react'
import { Profile } from '../../types'
import { CircularProgress, Stack, Typography } from '@mui/material'
import { Dialog } from './Dialog'
import { DialogType } from './types'

interface DialogsProps {
    profiles: Profile[]
    loading: boolean
}

export const Dialogs = (props: DialogsProps) => {
    const { profiles, loading } = props

    const deferredProfiles = useDeferredValue(profiles)

    const dialogs: DialogType[] = useMemo(() => {
        return deferredProfiles
            .map((p) =>
                (p.dialogs ?? []).map((dialog) => ({
                    ...dialog,
                    profile: { id: p.id, name: p.name },
                })),
            )
            .flat()
            .sort((dialog1, dialog2) => {
                const date1 = new Date(dialog1.time)
                const date2 = new Date(dialog2.time)

                return date2.getTime() - date1.getTime()
            })
    }, [deferredProfiles])

    if (loading) {
        return (
            <CircularProgress
                sx={{ alignSelf: 'center', mt: 5 }}
                color="secondary"
            />
        )
    }

    if (!dialogs.length) {
        return (
            <Typography textAlign={'center'}>
                Нет диалогов среди запущенных профилей
            </Typography>
        )
    }

    return (
        <Stack direction="column" spacing={1}>
            {dialogs.map((dialog) => (
                <Dialog key={dialog.id} dialog={dialog} />
            ))}
        </Stack>
    )
}

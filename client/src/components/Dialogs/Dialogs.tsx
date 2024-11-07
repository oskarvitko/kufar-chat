import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Profile } from '../../types'
import {
    Autocomplete,
    CircularProgress,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import { Dialog } from './Dialog'
import { DialogType } from './types'
import { Search } from '@mui/icons-material'

interface DialogsProps {
    profiles: Profile[]
    loading: boolean
}

export const Dialogs = (props: DialogsProps) => {
    const { profiles, loading } = props
    const [filtersOpened, setFiltersOpened] = useState(false)
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

    const deferredProfiles = useDeferredValue(profiles)

    const filteredProfiles = useMemo(() => {
        if (!selectedProfile) {
            return deferredProfiles
        }

        return deferredProfiles.filter(
            (profile) => profile.id === selectedProfile,
        )
    }, [selectedProfile, deferredProfiles])

    const dialogs: DialogType[] = useMemo(() => {
        return filteredProfiles
            .map((p) =>
                (p.dialogs ?? []).map((dialog) => ({
                    ...dialog,
                    profile: {
                        id: p.id,
                        name: p.name,
                        usageStatus: p.usageStatus,
                    },
                })),
            )
            .flat()
            .sort((dialog1, dialog2) => {
                const date1 = new Date(dialog1.time)
                const date2 = new Date(dialog2.time)

                return date2.getTime() - date1.getTime()
            })
    }, [filteredProfiles])

    useEffect(() => {
        if (filtersOpened) {
            window.scroll({
                left: 0,
                top: 0,
                behavior: 'smooth',
            })
        }
    }, [filtersOpened])

    if (loading) {
        return (
            <CircularProgress
                sx={{ alignSelf: 'center', mt: 5 }}
                color="secondary"
            />
        )
    }

    return (
        <Stack direction="column" spacing={1}>
            {!filtersOpened && (
                <IconButton
                    size="small"
                    sx={{
                        ml: 'auto',
                        position: 'fixed',
                        bottom: 10,
                        right: 10,
                        zIndex: 30,
                        bgcolor: 'gray',
                    }}
                    onClick={() => setFiltersOpened(true)}
                >
                    <Search />
                </IconButton>
            )}
            {filtersOpened && (
                <Autocomplete
                    autoFocus
                    options={deferredProfiles.map((profile) => ({
                        label: profile.name,
                        id: profile.id,
                    }))}
                    onChange={(_, value) => {
                        setSelectedProfile(value ? value.id : null)
                    }}
                    renderInput={(params) => (
                        <TextField
                            autoFocus
                            label="Профиль"
                            {...params}
                            size="small"
                        />
                    )}
                />
            )}
            {!dialogs.length && (
                <Typography textAlign={'center'}>
                    Нет диалогов среди запущенных профилей
                </Typography>
            )}
            {dialogs.map((dialog) => (
                <Dialog key={dialog.id} dialog={dialog} />
            ))}
        </Stack>
    )
}

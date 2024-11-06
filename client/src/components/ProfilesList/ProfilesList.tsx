import { launchAll } from '../../api/profiles'
import {
    Button,
    ButtonGroup,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    FormGroup,
    Grid2,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
} from '@mui/material'
import { Profile } from './Profile'
import { Refresh, Search } from '@mui/icons-material'
import { ProfileStatus, Profile as ProfileType } from '../../types'
import { useMemo, useState } from 'react'

interface ProfilesListProps {
    profiles: ProfileType[]
    fetchProfiles: () => void
    loading: boolean
}

export const ProfilesList = (props: ProfilesListProps) => {
    const [filter, setFilter] = useState('')
    const [enabledStatuses, setEnabledStatuses] = useState<
        Record<ProfileStatus, boolean>
    >({
        connected: true,
        connecting: true,
        unauthorized: true,
        stopped: true,
    })
    const { profiles, loading, fetchProfiles } = props

    const filteredProfiles = useMemo(() => {
        return profiles.filter(
            (profile) =>
                profile.name.includes(filter) &&
                enabledStatuses[profile.status],
        )
    }, [profiles, filter, enabledStatuses])

    const handleChangeStatusFilter =
        (status: ProfileStatus) => (value: boolean) =>
            setEnabledStatuses((prev) => ({ ...prev, [status]: value }))

    if (loading) {
        return (
            <CircularProgress
                sx={{ alignSelf: 'center', mt: 5 }}
                color="secondary"
            />
        )
    }

    return (
        <Stack direction={'column'} spacing={1}>
            <ButtonGroup sx={{ maxWidth: 500 }}>
                <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={launchAll}
                >
                    Запустить все остановленные
                </Button>
                <IconButton sx={{ ml: 'auto' }} onClick={fetchProfiles}>
                    <Refresh />
                </IconButton>
            </ButtonGroup>
            <FormGroup sx={{ flexDirection: 'row' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={enabledStatuses.connected}
                            onChange={(e) =>
                                handleChangeStatusFilter('connected')(
                                    e.target.checked,
                                )
                            }
                        />
                    }
                    label="Включенные"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={enabledStatuses.stopped}
                            onChange={(e) => {
                                handleChangeStatusFilter('stopped')(
                                    e.target.checked,
                                )
                            }}
                        />
                    }
                    label="Остановленные"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={enabledStatuses.unauthorized}
                            onChange={(e) => {
                                handleChangeStatusFilter('unauthorized')(
                                    e.target.checked,
                                )
                            }}
                        />
                    }
                    label="Не авторизованные"
                />
            </FormGroup>
            <TextField
                sx={{ maxWidth: 500 }}
                size="small"
                placeholder="Название профиля"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    },
                }}
            />
            <Grid2 container spacing={1}>
                {filteredProfiles.map((profile) => (
                    <Profile key={profile.id} profile={profile} />
                ))}
            </Grid2>
        </Stack>
    )
}

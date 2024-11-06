import { launchAll } from '../../api/profiles'
import {
    Button,
    ButtonGroup,
    CircularProgress,
    Grid2,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
} from '@mui/material'
import { Profile } from './Profile'
import { Refresh, Search } from '@mui/icons-material'
import { Profile as ProfileType } from '../../types'
import { useMemo, useState } from 'react'

interface ProfilesListProps {
    profiles: ProfileType[]
    fetchProfiles: () => void
    loading: boolean
}

export const ProfilesList = (props: ProfilesListProps) => {
    const [filter, setFilter] = useState('')
    const { profiles, loading, fetchProfiles } = props

    const filteredProfiles = useMemo(() => {
        if (!filter) {
            return profiles
        }

        return profiles.filter((profile) => profile.name.includes(filter))
    }, [profiles, filter])

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

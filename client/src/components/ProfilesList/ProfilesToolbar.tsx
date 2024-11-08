import {
    Pause,
    PlayArrow,
    Refresh,
    RestartAlt,
    Settings,
} from '@mui/icons-material'
import { IconButton, Stack } from '@mui/material'
import { launchAll, shutdownAll, updateAll } from '../../api/profiles'

interface ProfilesToolbarProps {
    fetchProfiles: () => void
    profilesToolbarOpened: boolean
    onToggleProfilesToolbar: () => void
}

export const ProfilesToolbar = (props: ProfilesToolbarProps) => {
    const { fetchProfiles, profilesToolbarOpened, onToggleProfilesToolbar } =
        props

    return (
        <>
            {profilesToolbarOpened && (
                <Stack direction={'row'} spacing={1}>
                    <IconButton color="success" onClick={launchAll}>
                        <PlayArrow />
                    </IconButton>
                    <IconButton color="warning" onClick={shutdownAll}>
                        <Pause />
                    </IconButton>
                    <IconButton color="info" onClick={updateAll}>
                        <RestartAlt />
                    </IconButton>

                    <div style={{ flexGrow: 1 }} />
                    <IconButton onClick={fetchProfiles}>
                        <Refresh />
                    </IconButton>
                    <IconButton onClick={onToggleProfilesToolbar}>
                        <Settings />
                    </IconButton>
                </Stack>
            )}
        </>
    )
}

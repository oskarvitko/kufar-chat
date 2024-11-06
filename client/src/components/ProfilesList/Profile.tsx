import {
    Box,
    CircularProgress,
    Grid2,
    IconButton,
    Paper,
    Typography,
} from '@mui/material'
import {
    Profile as ProfileType,
    ProfileStatus as ProfileStatusType,
} from '../../types'
import { memo, useState } from 'react'
import { Pause, PlayArrow, Refresh } from '@mui/icons-material'
import { launchProfile, shutdownProfile } from '../../api/profiles'

interface ProfileProps {
    profile: ProfileType
}

export const Profile = memo((props: ProfileProps) => {
    const { profile } = props

    const [loading, setLoading] = useState(false)

    const renderActionButton = () => {
        const loader = (
            <CircularProgress
                size={15}
                thickness={5}
                style={{ marginRight: 8 }}
                color="inherit"
            />
        )

        if (loading) {
            return loader
        }

        switch (profile.status) {
            case 'stopped':
                return (
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => launchProfile(profile.id)}
                    >
                        <PlayArrow />
                    </IconButton>
                )
            case 'unauthorized':
                return (
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => launchProfile(profile.id)}
                    >
                        <Refresh />
                    </IconButton>
                )
            case 'connected':
                return (
                    <IconButton
                        size="small"
                        color="warning"
                        onClick={() => {
                            setLoading(true)
                            shutdownProfile(profile.id).then(() =>
                                setLoading(false),
                            )
                        }}
                    >
                        <Pause />
                    </IconButton>
                )
            case 'connecting':
                return loader
            default:
                return null
        }
    }

    return (
        <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
            <Paper>
                <Grid2
                    container
                    pl={1}
                    height={42}
                    whiteSpace={'nowrap'}
                    alignItems={'center'}
                    spacing={1}
                >
                    <Grid2 size={'auto'}>
                        <ProfileStatus status={profile.status} />
                    </Grid2>
                    <Grid2 size={'grow'} sx={{}}>
                        <Typography
                            sx={{
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                            }}
                        >
                            {profile.name}
                        </Typography>
                    </Grid2>
                    {renderActionButton()}
                </Grid2>
            </Paper>
        </Grid2>
    )
})

interface ProfileStatusProps {
    status: ProfileStatusType
}

const ProfileStatus = memo((props: ProfileStatusProps) => {
    const colors: Record<ProfileStatusType, string> = {
        connected: '#04c004',
        connecting: 'orange',
        stopped: '#ce0000',
        unauthorized: 'blue',
    }

    return (
        <Box
            width={8}
            height={8}
            component={'div'}
            bgcolor={colors[props.status]}
            borderRadius={'50%'}
        />
    )
})

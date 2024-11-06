import {
    CircularProgress,
    createTheme,
    CssBaseline,
    Stack,
    Tab,
    Tabs,
    ThemeProvider,
    Typography,
} from '@mui/material'
import { ProfilesList } from './components/ProfilesList/ProfilesList'
import {
    CSSProperties,
    ReactNode,
    useCallback,
    useEffect,
    useState,
} from 'react'
import { Event, Profile } from './types'
import { getAllProfiles } from './api/profiles'
import { io } from 'socket.io-client'
import { host } from './api'
import { Dialogs } from './components/Dialogs/Dialogs'

const theme = createTheme({
    palette: {
        mode: 'dark',
    },
})

const socket = io(host)

function App() {
    const [tab, setTab] = useState(0)
    const [applicationLoading, setApplicationLoading] = useState(true)

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue)
    }

    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)

    const fetchProfiles = useCallback(() => {
        setLoading(true)
        getAllProfiles()
            .then(setProfiles)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        socket.on('connect', () => {
            setApplicationLoading(false)
            fetchProfiles()
        })
        socket.on('disconnect', () => {
            setApplicationLoading(true)
        })
        socket.on('message', (event: Event) => {
            switch (event.type) {
                case 'PROFILES_LOADED':
                    fetchProfiles()
                    break
                case 'PROFILE_STATUS_CHANGED':
                    setProfiles((prev) =>
                        prev.map((profile) => {
                            if (profile.id === event.meta.profileId) {
                                return {
                                    ...profile,
                                    status: event.data,
                                }
                            }

                            return profile
                        }),
                    )

                    break
                case 'DIALOGS_UPDATED':
                    setProfiles((prev) =>
                        prev.map((profile) => {
                            if (profile.id === event.meta.profileId) {
                                return {
                                    ...profile,
                                    dialogs: event.data,
                                }
                            }

                            return profile
                        }),
                    )
                    break
            }
        })

        return () => {
            socket.off('message')
            socket.off('connect')
            socket.off('disconnect')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {applicationLoading && (
                <Stack
                    spacing={3}
                    alignItems="center"
                    justifyContent={'center'}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        left: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0, 40%)',
                        zIndex: 100,
                    }}
                >
                    <CircularProgress />
                    <Typography>Подключение</Typography>
                </Stack>
            )}
            <Tabs
                value={tab}
                onChange={handleChange}
                aria-label="basic tabs example"
                variant="fullWidth"
                indicatorColor="secondary"
                textColor="inherit"
                sx={{ maxWidth: 510 }}
            >
                <Tab label="Сообщения" />
                <Tab label="Профили" />
            </Tabs>
            <TabPanel visible={tab === 1}>
                <ProfilesList
                    loading={loading}
                    profiles={profiles}
                    fetchProfiles={fetchProfiles}
                />
            </TabPanel>
            <TabPanel visible={tab === 0}>
                <Dialogs loading={loading} profiles={profiles} />
            </TabPanel>
        </ThemeProvider>
    )
}

export default App

interface TabPanelProps {
    visible: boolean
    children: ReactNode
}

const TabPanel = (props: TabPanelProps) => {
    const styles: CSSProperties = {}

    if (!props.visible) {
        styles.display = 'none'
    }

    return (
        <Stack direction="column" spacing={2} p={2} style={styles}>
            {props.children}
        </Stack>
    )
}

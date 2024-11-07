import {
    Avatar,
    Badge,
    BadgeProps,
    Grid2,
    Paper,
    Stack,
    styled,
    Typography,
} from '@mui/material'
import { memo, useMemo, useState } from 'react'
import { DialogChat } from './DialogChat'
import { DialogType } from './types'
import { Lock } from '@mui/icons-material'

interface DialogProps {
    dialog: DialogType
}

const StyledBadge = styled(Badge)<BadgeProps>(() => ({
    '& .MuiBadge-badge': {
        right: 15,
        top: 15,
    },
}))

export const Dialog = memo(
    (props: DialogProps) => {
        const { dialog } = props
        const [isChatOpen, setIsChatOpen] = useState(false)

        return (
            <StyledBadge
                color="error"
                badgeContent={dialog.newMessages}
                sx={{ right: 0, top: 0 }}
            >
                {dialog.profile.usageStatus === 'dialog-opened' && (
                    <Stack
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            zIndex: 20,
                            bgcolor: 'rgba(0,0,0,25%)',
                            animation: 'fadeInf 2s ease infinite',
                            '@keyframes fadeInf': {
                                '0%': {
                                    opacity: 1,
                                },
                                '50%': {
                                    opacity: 0,
                                },
                                '100%': {
                                    opacity: 1,
                                },
                            },
                        }}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Lock />
                    </Stack>
                )}
                <Paper
                    sx={{ p: 1, width: '100%' }}
                    onClick={() => setIsChatOpen(true)}
                >
                    <Grid2 container spacing={1}>
                        <Grid2 size="auto">
                            {dialog.image ? (
                                <Avatar
                                    sx={{ width: 56, height: 56 }}
                                    src={dialog.image}
                                />
                            ) : (
                                <Avatar sx={{ width: 56, height: 56 }}>
                                    {dialog.name[0]}
                                </Avatar>
                            )}
                        </Grid2>
                        <Grid2 size="grow">
                            <Typography>{dialog.name}</Typography>
                            <DialogTime
                                time={dialog.time}
                                messages={dialog.newMessages}
                            />
                            <Typography
                                color="textSecondary"
                                sx={{ fontSize: '.8em' }}
                            >
                                {dialog.text}
                            </Typography>
                            <Typography fontSize={'.7em'} textAlign={'right'}>
                                {dialog.profile.name}
                            </Typography>
                        </Grid2>
                    </Grid2>

                    {isChatOpen && (
                        <DialogChat
                            profileId={dialog.profile.id}
                            dialog={dialog}
                            setIsChatOpen={setIsChatOpen}
                        />
                    )}
                </Paper>
            </StyledBadge>
        )
    },
    ({ dialog: prevDialog }, { dialog: nextDialog }) => {
        const isEqual =
            prevDialog.image === nextDialog.image &&
            prevDialog.name === nextDialog.name &&
            prevDialog.newMessages === nextDialog.newMessages &&
            prevDialog.text === nextDialog.text &&
            prevDialog.time === nextDialog.time &&
            prevDialog.profile.usageStatus === nextDialog.profile.usageStatus

        return isEqual
    },
)

const DialogTime = memo(
    ({ time, messages }: { time: string; messages: number }) => {
        const date = useMemo(() => {
            return new Date(time)
        }, [time])

        const isToday = useMemo(() => {
            const today = new Date()

            return (
                today.getDay() === date.getDay() &&
                today.getMonth() === date.getMonth()
            )
        }, [date])

        return (
            <Typography
                color="textSecondary"
                fontSize="0.75em"
                sx={{ position: 'absolute', top: 6, right: messages ? 30 : 6 }}
            >
                {isToday
                    ? date.toLocaleTimeString('ru').slice(0, 5)
                    : date.toLocaleDateString('ru')}
            </Typography>
        )
    },
)

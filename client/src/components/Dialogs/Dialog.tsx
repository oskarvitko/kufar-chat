import {
    Avatar,
    Badge,
    BadgeProps,
    Grid2,
    Paper,
    styled,
    Typography,
} from '@mui/material'
import { memo, useMemo, useState } from 'react'
import { DialogChat } from './DialogChat'
import { DialogType } from './types'

interface DialogProps {
    dialog: DialogType
}

const StyledBadge = styled(Badge)<BadgeProps>(() => ({
    '& .MuiBadge-badge': {
        right: 15,
        top: 15,
    },
}))

export const Dialog = memo((props: DialogProps) => {
    const { dialog } = props
    const [isChatOpen, setIsChatOpen] = useState(false)

    return (
        <StyledBadge
            color="error"
            badgeContent={dialog.newMessages}
            sx={{ right: 0, top: 0 }}
        >
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
})

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

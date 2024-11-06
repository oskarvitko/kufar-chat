import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Chip,
    Grid2,
    Paper,
    Stack,
    Typography,
} from '@mui/material'
import { memo, useState } from 'react'
import { Profile, ProfileDialog } from '../../types'
import { ExpandMore } from '@mui/icons-material'
import { DialogChat } from './DialogChat'

interface DialogProps {
    profile: Profile
}

export const Dialog = memo((props: DialogProps) => {
    const { profile } = props

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ pl: 1 }}>
                <Chip
                    sx={{ mr: 1 }}
                    label={profile.dialogs?.length}
                    size="small"
                    color="error"
                />
                {profile.name}
            </AccordionSummary>

            <AccordionDetails sx={{ p: 1 }}>
                <Stack spacing={1} direction={'column'}>
                    {profile.dialogs?.map((dialog) => (
                        <DialogItem
                            key={dialog.id}
                            profileId={profile.id}
                            dialog={dialog}
                        />
                    ))}
                </Stack>
            </AccordionDetails>
        </Accordion>
    )
})

interface DialogItemProps {
    dialog: ProfileDialog
    profileId: string
}

const DialogItem = memo((props: DialogItemProps) => {
    const { dialog, profileId } = props
    const [isChatOpen, setIsChatOpen] = useState(false)

    return (
        <Paper sx={{ p: 1 }} onClick={() => setIsChatOpen(true)}>
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
                    <Typography color="textSecondary" sx={{ fontSize: '.8em' }}>
                        {dialog.text}
                    </Typography>
                </Grid2>
            </Grid2>
            {isChatOpen && (
                <DialogChat
                    profileId={profileId}
                    dialog={dialog}
                    setIsChatOpen={setIsChatOpen}
                />
            )}
        </Paper>
    )
})

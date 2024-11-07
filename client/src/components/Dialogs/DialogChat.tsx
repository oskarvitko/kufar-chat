import {
    Avatar,
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Grid2,
    IconButton,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import { DialogMessage } from '../../types'
import { Close, Send } from '@mui/icons-material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { sendCommand } from '../../api/controll'
import { DialogType } from './types'
import { host } from '../../api'

interface DialogChatProps {
    dialog: DialogType
    profileId: string
    setIsChatOpen: (v: boolean) => void
}

export const DialogChat = (props: DialogChatProps) => {
    const { dialog, profileId, setIsChatOpen } = props
    const [messages, setMessages] = useState<DialogMessage[]>([])
    const [topic, setTopic] = useState<{ name: string; image: string } | null>(
        null,
    )
    const [loadingState, setLoadingState] = useState<
        'first-loading' | 'loading' | 'idle'
    >('idle')
    const isFirstLoading = loadingState === 'first-loading'
    const isLoading = loadingState === 'loading'
    const ref = useRef<HTMLDivElement | null>(null)
    const [text, setText] = useState('')
    const [inputHeight, setInputHeight] = useState(0)

    const handleClose = () => {
        setLoadingState('loading')
        sendCommand({
            command: 'close-dialog',
            profileId,
        }).finally(() => {
            setIsChatOpen(false)
        })
    }

    const openDialogRequest = useCallback(() => {
        setLoadingState('first-loading')
        sendCommand({
            command: 'open-dialog',
            dialogId: dialog.id,
            profileId,
        }).then((response) => {
            if (response.data === null) {
                return setIsChatOpen(false)
            }

            const { messages, topic } = response.data
            setMessages(messages)
            setTopic(topic)
            setLoadingState('idle')
        })
    }, [dialog.id, profileId, setIsChatOpen])

    useEffect(() => {
        openDialogRequest()
    }, [openDialogRequest])

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTo(0, ref.current.scrollHeight)
        }
    }, [messages, inputHeight])

    const handleSend = () => {
        if (text) {
            setLoadingState('loading')
            sendCommand({
                command: 'send-message',
                message: text,
                dialogId: dialog.id,
                profileId,
            }).then((response) => {
                const { messages } = response.data
                setMessages(messages)
                setText('')
                setLoadingState('idle')
            })
        }
    }

    return (
        <Dialog open fullScreen>
            <DialogTitle textAlign={'center'}>
                {dialog.name}
                <Typography color="textSecondary" fontSize="12px">
                    {dialog.profile.name}
                </Typography>
            </DialogTitle>
            <IconButton
                disabled={isFirstLoading || isLoading}
                aria-label="close"
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                }}
            >
                <Close />
            </IconButton>
            <DialogContent dividers sx={{ position: 'relative', px: 0 }}>
                <Stack
                    direction={'column'}
                    height={'100%'}
                    justifyContent={isFirstLoading ? 'center' : 'flex-start'}
                >
                    {isFirstLoading ? (
                        <CircularProgress sx={{ alignSelf: 'center' }} />
                    ) : (
                        <>
                            {isLoading && (
                                <Stack
                                    alignItems={'center'}
                                    justifyContent={'center'}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        left: 0,
                                        bottom: 0,
                                        bgcolor: 'rgba(0,0,0, 25%)',
                                        zIndex: 200,
                                    }}
                                >
                                    <CircularProgress />
                                </Stack>
                            )}
                            {topic && (
                                <Stack direction={'column'}>
                                    <Grid2
                                        container
                                        pb={1}
                                        px={1}
                                        spacing={2}
                                        mt={-1}
                                    >
                                        <Grid2 size="auto">
                                            <Avatar
                                                src={topic.image}
                                                sx={{ width: 40, height: 40 }}
                                            />
                                        </Grid2>
                                        <Grid2 size="grow">
                                            <Typography>
                                                {topic.name}
                                            </Typography>
                                        </Grid2>
                                    </Grid2>
                                    <Divider />
                                </Stack>
                            )}
                            <Stack
                                ref={ref}
                                direction={'column'}
                                sx={{ overflowY: 'auto', px: 2, flexGrow: 1 }}
                                justifyContent={
                                    isFirstLoading ? 'center' : 'flex-start'
                                }
                                spacing={1}
                            >
                                {messages.map((message, idx) => {
                                    const aligns: Record<
                                        DialogMessage['author'],
                                        string
                                    > = {
                                        date: 'center',
                                        receiver: 'flex-end',
                                        sender: 'flex-start',
                                    }

                                    const fontSizes: Record<
                                        DialogMessage['author'],
                                        string
                                    > = {
                                        date: '12px',
                                        receiver: '16px',
                                        sender: '16px',
                                    }

                                    const elevations: Record<
                                        DialogMessage['author'],
                                        number
                                    > = {
                                        date: 5,
                                        receiver: 5,
                                        sender: 1,
                                    }

                                    const renderContent = () => {
                                        switch (message.type) {
                                            case 'text':
                                                return (
                                                    <Typography
                                                        fontSize={
                                                            fontSizes[
                                                                message.author
                                                            ]
                                                        }
                                                        sx={{
                                                            whiteSpace:
                                                                'pre-line',
                                                        }}
                                                    >
                                                        {message.text}
                                                    </Typography>
                                                )
                                            case 'image':
                                                return (
                                                    <Box
                                                        sx={{ width: '100%' }}
                                                        component={'img'}
                                                        src={`${host}/images/${message.image}`}
                                                    />
                                                )
                                        }
                                    }

                                    return (
                                        <Paper
                                            key={idx}
                                            elevation={
                                                elevations[message.author]
                                            }
                                            sx={{
                                                width: 'auto',
                                                maxWidth: '60%',
                                                p: 1,
                                                alignSelf:
                                                    aligns[message.author],
                                            }}
                                        >
                                            <Grid2
                                                container
                                                spacing={1}
                                                alignItems={'flex-end'}
                                            >
                                                <Grid2 size="grow">
                                                    {renderContent()}
                                                </Grid2>
                                                {message.time && (
                                                    <Grid2 size="auto">
                                                        <Typography
                                                            color="textSecondary"
                                                            fontSize="0.75em"
                                                        >
                                                            {message.time}
                                                        </Typography>
                                                    </Grid2>
                                                )}
                                            </Grid2>
                                        </Paper>
                                    )
                                })}
                            </Stack>
                            <Grid2
                                container
                                p={2}
                                alignItems={'flex-end'}
                                spacing={1}
                            >
                                <Grid2 size="grow">
                                    <TextField
                                        size="small"
                                        value={text}
                                        onChange={(e) => {
                                            setText(e.target.value)
                                            setInputHeight(
                                                e.target.getBoundingClientRect()
                                                    .height,
                                            )
                                        }}
                                        sx={{ width: '100%' }}
                                        multiline
                                        placeholder="Сообщение"
                                        variant="outlined"
                                    />
                                </Grid2>
                                <Grid2 size="auto">
                                    <IconButton onClick={handleSend}>
                                        <Send />
                                    </IconButton>
                                </Grid2>
                            </Grid2>
                        </>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    )
}

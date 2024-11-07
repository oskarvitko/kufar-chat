import { api } from '.'

type CommandName = 'open-dialog' | 'close-dialog' | 'send-message'

interface BaseCommand {
    command: CommandName
    profileId: string
}

export interface OpenDialogCommand extends BaseCommand {
    command: 'open-dialog'
    dialogId: string
}

export interface CloseDialogCommand extends BaseCommand {
    command: 'close-dialog'
}

export interface SendMessageCommand extends BaseCommand {
    command: 'send-message'
    message: string
    dialogId: string
}

export type Command =
    | OpenDialogCommand
    | CloseDialogCommand
    | SendMessageCommand

export const sendCommand = (command: Command) =>
    api.post('controller/command', command)

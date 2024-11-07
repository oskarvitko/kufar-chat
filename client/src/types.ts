export type ProfileStatus =
    | 'stopped'
    | 'connected'
    | 'connecting'
    | 'unauthorized'

export type ProfileUsageStatus = 'scanning' | 'dialog-opened'

export interface Profile {
    id: string
    name: string
    status: ProfileStatus
    usageStatus: ProfileUsageStatus
    dialogs?: ProfileDialog[]
}

export interface ProfileDialog {
    name: string
    id: string
    text: string
    time: string
    image: string | null
    newMessages: number
}

export type EventType =
    | 'PROFILE_STATUS_CHANGED'
    | 'DIALOGS_UPDATED'
    | 'PROFILES_LOADED'
    | 'USAGE_STATUS_CHANGED'

interface BaseEvent {
    type: EventType
    meta: {
        profileId: string
    }
}

export interface ProfileStatusChangedEvent extends BaseEvent {
    type: 'PROFILE_STATUS_CHANGED'
    data: ProfileStatus
}

export interface DialogsUpdatedEvent extends BaseEvent {
    type: 'DIALOGS_UPDATED'
    data: ProfileDialog[]
}

export interface ProfilesLoadedEvent extends BaseEvent {
    type: 'PROFILES_LOADED'
}

export interface ProfileUsageStatusChangedEvent extends BaseEvent {
    type: 'USAGE_STATUS_CHANGED'
    data: ProfileUsageStatus
}

export type Event =
    | ProfileStatusChangedEvent
    | DialogsUpdatedEvent
    | ProfilesLoadedEvent
    | ProfileUsageStatusChangedEvent

export type DialogMessageAuthor = 'date' | 'sender' | 'receiver'

interface DialogMessageBase {
    author: DialogMessageAuthor
    time?: string
    type: 'text' | 'image'
}
export interface DialogMessageText extends DialogMessageBase {
    type: 'text'
    text: string
}

export interface DialogMessageImage extends DialogMessageBase {
    type: 'image'
    image: string
}
export type DialogMessage = DialogMessageText | DialogMessageImage

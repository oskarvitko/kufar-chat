export type ProfileStatus =
    | 'stopped'
    | 'connected'
    | 'connecting'
    | 'unauthorized'

export interface Profile {
    id: string
    name: string
    status: ProfileStatus
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

export type Event =
    | ProfileStatusChangedEvent
    | DialogsUpdatedEvent
    | ProfilesLoadedEvent

export type DialogMessageAuthor = 'date' | 'sender' | 'receiver'

export interface DialogMessage {
    author: DialogMessageAuthor
    text: string
    time?: string
}

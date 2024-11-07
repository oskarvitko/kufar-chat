import { createServer } from 'http'
import { Server } from 'socket.io'

export const EmitTypes = {
    PROFILES_LOADED: 'PROFILES_LOADED',
    PROFILE_STATUS_CHANGED: 'PROFILE_STATUS_CHANGED',
    USAGE_STATUS_CHANGED: 'USAGE_STATUS_CHANGED',
    DIALOGS_UPDATED: 'DIALOGS_UPDATED',
}

export const emitter = {
    emitCore: () => {},
    emit(type, data) {
        this.emitCore('message', {
            type,
            ...data,
        })
    },
}

export const createEmitter = (meta) => ({
    emit: (type, data) =>
        emitter.emit(type, {
            meta,
            data,
        }),
})

export const connectSockets = (app) => {
    const server = createServer(app)
    const io = new Server(server, { cors: { origin: '*' } })

    emitter.emitCore = io.emit.bind(io)

    return server
}

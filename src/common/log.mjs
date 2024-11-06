// import fs from 'fs'

export function log(message, prefix, severity, type = 'log') {
    const colors = {
        info: 0,
        success: 32,
        error: 31,
        warn: 33,
    }

    const types = {
        log: 'INFO',
        error: 'ERROR',
    }

    const color = colors[severity]
    const logType = types[type]

    const timestamp = new Date().toLocaleTimeString('ru')

    const text = `[${logType}][${timestamp}]${
        prefix ? ` ${prefix}` : ''
    }: ${message}`

    console.log(`\x1b[${color}m${text}\x1b[0m`)

    // if (process.env.NODE_ENV === 'production') {
    //     const date = new Date().toLocaleDateString('ru')
    //     const path = `logs/${date}.txt`

    //     fs.appendFile(path, text + '\n', (error) => {
    //         if (error) console.log(error)
    //     })
    // }
}

export function createLogger(prefix) {
    return {
        log(message, severity = 'info') {
            log(message, prefix, severity)
        },
        error(message) {
            log(message, prefix, 'error', 'error')
        },
    }
}

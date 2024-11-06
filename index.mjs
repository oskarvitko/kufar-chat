import startServer from './src/server/index.mjs'
import { join } from 'path'

export const htmlPath = join(
    import.meta.dirname,
    'client',
    'dist',
    'index.html',
)

startServer()

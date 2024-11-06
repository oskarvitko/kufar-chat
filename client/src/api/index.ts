import axios from 'axios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const host = (window as any)['HOST']

export const api = axios.create({
    baseURL: `${host}/api`,
})

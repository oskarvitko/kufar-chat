import axios from 'axios'
import config from '../config/server.mjs'
import puppeteer from 'puppeteer-core'
import { createLogger } from '../common/log.mjs'
import BrowserProfile from './profile.mjs'
import { createEmitter, EmitTypes } from '../server/socket.mjs'

class BrowserApi {
    logger = createLogger('BROWSER API')
    api = axios.create({
        baseURL: 'https://api.gologin.com/',
        headers: {
            Authorization: `Bearer ${config.GOLOGIN_TOKEN}`,
        },
    })

    emitter = createEmitter({})
    profiles = {}

    async connect() {
        this.logger.log('Connecting started...')

        this.updateProfiles()
    }

    async updateProfiles(force = false) {
        this.logger.log('Profiles loading started...')
        const profiles = await this.#loadProfiles()

        profiles.forEach(async ({ id, name, proxy }) => {
            const profile = this.getProfileById(id)
            if (profile) {
                if (force) {
                    if (profile.isConnected()) {
                        await profile.stop()
                    }

                    this.profiles[id] = new BrowserProfile(id, name, proxy)
                }
            } else {
                this.profiles[id] = new BrowserProfile(id, name, proxy)
            }
        })

        this.logger.log('Profiles stored', 'success')
        this.emitter.emit(EmitTypes.PROFILES_LOADED)
    }

    getProfilesArray() {
        return Object.values(this.profiles)
    }

    getProfileById(id) {
        return this.profiles[id]
    }

    async stopProfiles() {
        this.getProfilesArray().forEach((profile) => {
            if (profile.isConnected()) {
                profile.stop()
            }
        })
    }

    async launchProfiles(n) {
        const profiles = this.getProfilesArray()

        const length = n ? n : profiles.length
        let i = 0
        while (i < length) {
            const profile = profiles[i]
            if (profile.isStopped()) {
                profile.launch()
            }
            i++
        }
    }

    async #loadProfiles() {
        this.logger.log('Getting profiles...')
        const fetchPage = async (page) => {
            try {
                const response = await this.api.get(`browser/v2?page=${page}`)

                if (response.status === 200) {
                    this.logger.log('Profiles loaded')
                    return response.data
                }
            } catch (e) {
                this.logger.error(e.message, 'error')
            }
        }

        const PROFILES_PER_PAGE = 30
        const profiles = []
        let page = 0
        let totalProfiles = 0
        do {
            page += 1
            const data = await fetchPage(page)
            totalProfiles = data.allProfilesCount
            profiles.push(data.profiles)
        } while (totalProfiles > page * PROFILES_PER_PAGE)

        return profiles.flat()
    }
}

export default new BrowserApi()

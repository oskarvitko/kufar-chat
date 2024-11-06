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

        const profiles = await this.#loadProfiles()

        profiles.forEach(({ id, name, proxy }, idx) => {
            this.profiles[id] = new BrowserProfile(id, name, proxy)
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
        try {
            const response = await this.api.get('browser/v2')

            if (response.status === 200) {
                this.logger.log('Profiles loaded')
                return response.data.profiles
            }
        } catch (e) {
            this.logger.error(e.message, 'error')
        }
    }

    async #automation(profileId) {
        const {
            data: { automation },
        } = await axios(
            `http://localhost:3001/v1.0/browser_profiles/${profileId}/start?automation=1`,
        )

        const { port, wsEndpoint } = automation

        const browser = await puppeteer.connect({
            browserWSEndpoint: `ws://127.0.0.1:${port}${wsEndpoint}`,
        })

        const page = await browser.newPage()
        await page.goto('https://google.com')
        await page.screenshot({ path: 'google.png' })

        await browser.close()
    }
}

export default new BrowserApi()

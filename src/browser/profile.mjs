import { createLogger } from '../common/log.mjs'
import { GoLogin } from 'gologin/src/gologin.js'
import config from '../config/server.mjs'
import { connect } from 'puppeteer-core'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import BrowserController, { KUFAR_ACCOUNT_URL } from './controller.mjs'
import { createEmitter, EmitTypes } from '../server/socket.mjs'
import { USER_NAME } from '../../user.mjs'

const BrowserProfileStatus = {
    STOPPED: 'stopped',
    CONNECTED: 'connected',
    CONNECTING: 'connecting',
}

class BrowserProfile {
    id
    logger
    gologin
    status = BrowserProfileStatus.STOPPED

    constructor(id, name, proxy) {
        this.id = id
        this.name = name
        this.proxy = proxy
        this.logger = createLogger(`PROFILE ${id}`)

        this.tmpFolderPath = join('tmp', this.id)

        const params = [
            '--no-sandbox',
            '--disable-notifications',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
        ]

        if (process.env.NODE_ENV === 'production') {
            params.push('--headless')
        }

        this.gologin = new GoLogin({
            token: config.GOLOGIN_TOKEN,
            profile_id: id,
            executablePath: join(
                'C:',
                'Users',
                USER_NAME,
                '.gologin',
                'browser',
                'orbita-browser-129',
                'chrome.exe',
            ),
            tmpdir: this.tmpFolderPath,
            extra_params: params,
        })

        this.emitter = createEmitter({ profileId: id })
    }

    async launch() {
        this.logger.log(`--- ${this.id} ---`, 'warn')
        this.logger.log('Launching...')
        this.#checkFolder(this.tmpFolderPath)
        this.#changeStatus(BrowserProfileStatus.CONNECTING)

        try {
            const cookies = await this.gologin.getCookies(this.id)
            const result = await this.gologin.start()

            if (result.status === 'success') {
                this.logger.log('Launched')
            }

            const browser = await connect({
                browserWSEndpoint: result.wsUrl,
                ignoreHTTPSErrors: true,
            })

            this.browser = browser
            const [page] = await browser.pages()
            await page.authenticate({
                username: this.proxy.username,
                password: this.proxy.password,
            })
            await page.setCookie(...cookies)
            await page.setViewport({ width: 1366, height: 768 })

            this.page = page
            this.controller = new BrowserController(
                page,
                this.logger,
                this.emitter,
            )

            browser.on('disconnected', () => {
                this.#changeStatus(BrowserProfileStatus.STOPPED)
                this.controller.stopInterval()
            })

            await this.controller.start()
            this.#changeStatus(BrowserProfileStatus.CONNECTED)
        } catch (e) {
            this.logger.error(e)
            await this.#changeStatus(BrowserProfileStatus.STOPPED)
        }
    }

    async stop() {
        this.logger.log('Stopping...')
        await this.gologin.stop()
        await this.browser.close()
        this.logger.log('Stopped', 'success')
    }

    async getKufarAccount(page, cookies) {
        await page.goto(KUFAR_ACCOUNT_URL)
    }

    getController() {
        return this.controller
    }

    isConnected() {
        return this.status === BrowserProfileStatus.CONNECTED
    }

    isStopped() {
        return this.status === BrowserProfileStatus.STOPPED
    }

    get() {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            dialogs: this.controller?.dialogs ?? [],
        }
    }

    #changeStatus(status) {
        this.status = status
        this.emitter.emit(EmitTypes.PROFILE_STATUS_CHANGED, status)
    }

    #checkFolder(path) {
        const result = existsSync(path)
        if (!result) {
            mkdirSync(path)
        }
    }
}

export default BrowserProfile

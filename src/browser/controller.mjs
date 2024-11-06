import { EmitTypes } from '../server/socket.mjs'
import { BrowserProfileStatus } from './profile.mjs'

export const KUFAR_BASE_URL = 'https://www.kufar.by/account/messaging/'
export const KUFAR_ACCOUNT_URL =
    'https://www.kufar.by/account/settings/personal_info'

const DIALOG =
    'li[data-testid="conversations-list-item"] div[data-conversation-id]'
const NEW_MESSAGE = `${DIALOG}:has(span[class^="styles_unseen-message-badge"])`
// const NEW_MESSAGE = DIALOG
const DIALOG_ID = (id) => `li:has(div[data-conversation-id="${id}"])`
const DIALOG_NAME = (id) =>
    `${DIALOG_ID(id)} p[class^="styles_right-side__top-name"]`
const DIALOG_IMAGE = (id) => `${DIALOG_ID(id)} img[alt="item"]`
const DIALOG_PREVIEW = (id) => `${DIALOG_ID(id)} [class^="styles_preview"]`

const TOPIC = 'div[class^="styles_ad-block"]'
const TOPIC_NAME = 'div[class^="styles_ad-block__info"]'
const TOPIC_IMAGE = 'div[class^="styles_ad-block__img-container"] img'

const MESSAGES = 'section[data-testid="messages-section"] > *'
const INPUT = 'textarea[name="message_textarea"]'
const SEND_BUTTON = 'label[class^="styles_send-button"]'

const WAITUNTIL = 'domcontentloaded'
const TIMEOUT = 120_000

const options = {
    timeout: TIMEOUT,
    waitUntil: WAITUNTIL,
}

class BrowserController {
    page
    intervalId
    dialogs = []

    constructor(profile, page) {
        this.profile = profile
        this.page = page
        this.logger = profile.logger
        this.emitter = profile.emitter
    }

    async start(isFirst = false) {
        await this.page.goto(KUFAR_BASE_URL, options)

        const result = await this.checkForNewMessages(isFirst)
        if (result) {
            this.intervalId = setInterval(() => {
                this.checkForNewMessages()
            }, 5000)
        }

        return result
    }

    async openDialog(dialogId) {
        await this.stopInterval()
        await this.page.goto(KUFAR_BASE_URL, options)

        await this.page.waitForSelector(DIALOG_ID(dialogId), {
            timeout: 120_000,
        })
        await this.page.click(DIALOG_ID(dialogId))

        return this.scanDialogMessages()
    }

    async scanDialogMessages() {
        await this.page.waitForSelector(MESSAGES, options)

        const getTopic = async () => {
            try {
                await this.page.waitForSelector(TOPIC, { timeout: 200 })
                const topicName = await this.page.$eval(
                    TOPIC_NAME,
                    (node) => node.textContent,
                )
                const topicImage = await this.page.$eval(TOPIC_IMAGE, (node) =>
                    node.getAttribute('src'),
                )

                return { name: topicName, image: topicImage }
            } catch (e) {
                return null
            }
        }

        const topic = await getTopic()

        const messages = await this.page.$$eval(MESSAGES, (nodes) =>
            nodes.map((node, idx) => {
                let author = 'date'
                const testId = node.getAttribute('data-testid')
                if (testId === 'mc-message-bubble-sender') {
                    author = 'sender'
                }
                if (testId === 'mc-message-bubble-receiver') {
                    author = 'receiver'
                }

                if (idx === nodes.length) {
                    node.scrollIntoView()
                }

                return {
                    text: node.textContent,
                    author,
                }
            }),
        )

        return { messages, topic }
    }

    async closeDialog() {
        await this.start()
    }

    async sendMessage(message) {
        await this.page.waitForSelector(INPUT)
        await this.page.waitForSelector(SEND_BUTTON)
        await this.page.click(INPUT)

        for (const line of message.split('\n')) {
            await this.page.keyboard.type(line)
            await this.page.keyboard.down('Shift')
            await this.page.keyboard.press('Enter')
            await this.page.keyboard.up('Shift')
        }

        await this.page.click(SEND_BUTTON)
        return this.scanDialogMessages()
    }

    async checkForNewMessages(isFirst) {
        if (isFirst) {
            await new Promise((res) => setTimeout(res, 1000))
        }

        const url = await this.page.url()

        if (!url.includes(KUFAR_BASE_URL)) {
            this.logger.error('Unauthorized')
            this.stopInterval()
            await this.profile.stop()
            await this.profile.changeStatus(BrowserProfileStatus.UNAUTHORIZED)

            return false
        }

        try {
            this.logger.log('Checking for new messages...')
            await this.page.waitForSelector(NEW_MESSAGE, {
                ...options,
                timeout: 1000,
            })
            this.logger.log('Founded new messages', 'success')
        } catch (e) {
            this.logger.log('No new messages')
            this.updateDialogs([])
            return true
        }
        try {
            this.logger.log('Collecting dialogs data...')
            const dialogsIds = await this.page.$$eval(NEW_MESSAGE, (dialogs) =>
                dialogs.map((dialog) =>
                    dialog.getAttribute('data-conversation-id'),
                ),
            )

            if (dialogsIds.length) {
                const dialogs = []
                for (const id of dialogsIds) {
                    const name = await this.page.$eval(
                        DIALOG_NAME(id),
                        (node) => node.textContent,
                    )
                    const text = await this.page.$eval(
                        DIALOG_PREVIEW(id),
                        (node) => node.textContent,
                    )

                    const dialog = {
                        id,
                        name,
                        text,
                        image: null,
                    }

                    try {
                        await this.page.waitForSelector(DIALOG_IMAGE(id), {
                            timeout: 200,
                        })
                        const image = await this.page.$eval(
                            DIALOG_IMAGE(id),
                            (node) => node.getAttribute('src'),
                        )
                        dialog.image = image
                    } catch (e) {}

                    dialogs.push(dialog)
                }
                this.logger.log('Dialogs data collected', 'success')
                this.updateDialogs(dialogs)
                return true
            }
        } catch (e) {
            this.logger.error(e)
            return false
        }
    }

    updateDialogs(dialogs) {
        this.dialogs = dialogs
        this.emitter.emit(EmitTypes.DIALOGS_UPDATED, dialogs)
    }

    stopInterval() {
        clearInterval(this.intervalId)
    }
}

export default BrowserController

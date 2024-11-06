import { EmitTypes } from '../server/socket.mjs'

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

class BrowserController {
    page
    intervalId
    dialogs = []

    constructor(page, logger, emitter) {
        this.page = page
        this.logger = logger
        this.emitter = emitter
    }

    async start() {
        await this.page.goto(KUFAR_BASE_URL, { timeout: 60000 })

        await this.checkForNewMessages()
        this.intervalId = setInterval(() => {
            this.checkForNewMessages()
        }, 5000)
    }

    async openDialog(dialogId) {
        await this.stopInterval()
        await this.page.goto(KUFAR_BASE_URL)

        await this.page.waitForSelector(DIALOG_ID(dialogId))
        await this.page.click(DIALOG_ID(dialogId))

        return this.scanDialogMessages()
    }

    async scanDialogMessages() {
        await this.page.waitForSelector(MESSAGES)

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

    async checkForNewMessages() {
        try {
            await this.page.waitForSelector(NEW_MESSAGE)
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

                this.updateDialogs(dialogs)
            }
        } catch (e) {
            this.logger.error(e)
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

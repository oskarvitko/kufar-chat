import { EmitTypes } from '../server/socket.mjs'
import { BrowserProfileStatus } from './profile.mjs'
import { existsSync, writeFile } from 'fs'
import { join } from 'path'

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
const DIALOG_NEW_MESSAGES = (id) =>
    `${DIALOG_ID(id)} span[class^="styles_unseen-message-badge"]`
const DIALOG_PREVIEW = (id) => `${DIALOG_ID(id)} [class^="styles_preview"]`
const DIALOG_TIME = (id) =>
    `${DIALOG_ID(id)} span[class^="styles_right-side__top-time"]`

const TOPIC = 'div[class^="styles_ad-block"]'
const TOPIC_NAME = 'div[class^="styles_ad-block__info"]'
const TOPIC_IMAGE = 'div[class^="styles_ad-block__img-container"] img'

const MESSAGES = 'section[data-testid="messages-section"] > *'
const IMAGE_MESSAGES = `${MESSAGES}:has([class^="styles_attachments-images"])`
const INPUT = 'textarea[name="message_textarea"]'
const SEND_BUTTON = 'label[class^="styles_send-button"]'

const WAITUNTIL = 'domcontentloaded'
const TIMEOUT = 120_000

const options = {
    timeout: TIMEOUT,
}

export const BrowserControllerUsageStatus = {
    DIALOG_OPENED: 'dialog-opened',
    SCANNING: 'scanning',
}

class BrowserController {
    page
    intervalId
    dialogOpenedTimeoutId
    dialogs = []
    usageStatus = BrowserControllerUsageStatus.SCANNING

    constructor(profile, page) {
        this.profile = profile
        this.page = page
        this.logger = profile.logger
        this.emitter = profile.emitter
    }

    async start(isFirst = false) {
        await this.page.goto(KUFAR_BASE_URL, options)

        const result = await this.loadDialogs(isFirst)
        if (result) {
            this.intervalId = setInterval(() => {
                this.loadDialogs()
            }, 10_000)
        }

        return result
    }

    async openDialog(dialogId) {
        if (this.usageStatus === BrowserControllerUsageStatus.DIALOG_OPENED) {
            return null
        }

        await this.stopInterval()
        await this.page.goto(KUFAR_BASE_URL, options)

        await this.page.waitForSelector(DIALOG_ID(dialogId), {
            timeout: 120_000,
        })

        this.changeUsageStatus(BrowserControllerUsageStatus.DIALOG_OPENED)
        this.dialogOpenedTimeoutId = setTimeout(
            () => this.closeDialog(),
            180_000,
        )

        await this.page.click(DIALOG_ID(dialogId))

        return this.scanDialogMessages(dialogId)
    }

    async scanDialogMessages(dialogId) {
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

        try {
            await this.page.waitForSelector(IMAGE_MESSAGES, { timeout: 200 })
            const imageMessages = await this.page.$$eval(
                IMAGE_MESSAGES,
                (nodes) => {
                    return nodes.map((node, idx) => {
                        node.setAttribute('data-image-message', idx)
                        return idx
                    })
                },
            )
            await Promise.all(
                imageMessages.map(async (idx) =>
                    this.page.waitForSelector(
                        `[data-image-message="${idx}"] img[alt="file-message"]`,
                    ),
                ),
            )
        } catch (e) {}

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

                const fullText = node.textContent
                const message = {
                    author,
                    text: fullText,
                    type: 'text',
                }

                if (author !== 'date') {
                    const timeNode = node.querySelector(
                        '[class*="message__content_info"]',
                    )
                    if (timeNode) {
                        const time = timeNode.textContent
                        const text = fullText.replace(time, '')
                        message.text = text
                        message.time = time
                    }
                }

                if (message.text === '') {
                    const img = node.querySelector('img[alt="file-message"]')
                    if (img) {
                        message.type = 'image'
                        message.image = img.getAttribute('src')
                    }
                }

                return message
            }),
        )

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i]
            if (message.type === 'image') {
                const imageBuffer = await this.page.evaluate(
                    async (blobUrl) => {
                        const response = await fetch(blobUrl)
                        const buffer = await response.arrayBuffer()
                        return Array.from(new Uint8Array(buffer))
                    },
                    message.image,
                )

                const imageId = `${[this.profile.id, dialogId, i].join(
                    '_',
                )}.png`
                const result = existsSync(join('images', imageId))
                if (!result) {
                    try {
                        await new Promise((res, rej) => {
                            writeFile(
                                join('images', imageId),
                                Buffer.from(imageBuffer),
                                (error) => {
                                    if (error) {
                                        rej(error)
                                    } else {
                                        res()
                                    }
                                },
                            )
                        })
                    } catch (e) {
                        this.logger.error(e)
                    }
                }

                message.image = imageId
            }
        }

        return { messages, topic }
    }

    async closeDialog() {
        clearTimeout(this.dialogOpenedTimeoutId)
        await this.start()
        this.changeUsageStatus(BrowserControllerUsageStatus.SCANNING)
    }

    async sendMessage(message, dialogId) {
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
        return this.scanDialogMessages(dialogId)
    }

    async loadDialogs(isFirst) {
        if (isFirst) {
            await new Promise((res) => setTimeout(res, 1000))
        }

        const urlStr = await this.page.url()
        const url = new URL(urlStr)

        if (!url.pathname.includes('account/messaging')) {
            this.logger.error('Unauthorized')
            this.stopInterval()
            await this.profile.stop()
            await this.profile.changeStatus(BrowserProfileStatus.UNAUTHORIZED)

            return false
        }

        try {
            this.logger.log('Scanning dialogs...')
            await this.page.waitForSelector(DIALOG, {
                ...options,
                timeout: 2000,
            })
            this.logger.log('Founded dialogs', 'success')
        } catch (e) {
            this.logger.log('No dialogs founded')
            this.updateDialogs([])
            return true
        }
        try {
            this.logger.log('Collecting dialogs data...')
            const dialogsIds = await this.page.$$eval(DIALOG, (dialogs) =>
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

                    const timeStr = await this.page.$eval(
                        DIALOG_TIME(id),
                        (node) => node.textContent.trim(),
                    )
                    if (timeStr.length === 8) {
                        const [day, month, year] = timeStr.split('.')
                        dialog.time = new Date([month, day, year].join('.'))
                    } else {
                        const [hours, minutes] = timeStr.split(':')
                        const date = new Date()
                        date.setHours(Number(hours))
                        date.setMinutes(Number(minutes))
                        date.setSeconds(0)
                        date.setMilliseconds(0)

                        dialog.time = date
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

                    try {
                        await this.page.waitForSelector(
                            DIALOG_NEW_MESSAGES(id),
                            {
                                timeout: 200,
                            },
                        )
                        const newMessages = await this.page.$eval(
                            DIALOG_NEW_MESSAGES(id),
                            (node) => node.textContent,
                        )
                        dialog.newMessages = Number(newMessages)
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

    changeUsageStatus(status) {
        this.usageStatus = status
        this.emitter.emit(EmitTypes.USAGE_STATUS_CHANGED, status)
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

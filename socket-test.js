const { io } = require('socket.io-client')

// Подключаемся к Socket.IO-серверу по его URL
const socket = io('http://localhost:5588')

// Обработчик успешного подключения
socket.on('connect', () => {
    console.log('Соединение установлено с Socket.IO-сервером')
    socket.emit('message', 'Привет от клиента') // Отправляем сообщение на сервер
})

// Обработчик получения сообщения от сервера
socket.on('message', (msg) => {
    console.log('Сообщение от сервера:', msg)
})

// Обработчик отключения
socket.on('disconnect', () => {
    console.log('Соединение с сервером разорвано')
})

// Обработчик ошибок
socket.on('connect_error', (error) => {
    console.error('Ошибка подключения:', error)
})

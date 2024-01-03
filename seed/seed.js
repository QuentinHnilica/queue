const sequalize = require('../config/connection')
const { Message } = require('../modals')

const messageData = require('./message.json')

const start = async () => {
    await sequalize.sync({ force: true })

    const seedMessage = await Message.bulkCreate(messageData, {
        individualHooks: true,
        returning: true,
    })

    process.exit(0)
}

start()
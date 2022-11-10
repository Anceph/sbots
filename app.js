const mineflayer = require('mineflayer')
const inventoryViewer = require('mineflayer-web-inventory')
const config = require('./settings.json')

function createBot() {

    const bot = mineflayer.createBot({
        username: config['bot-account']['username'],
        password: config['bot-account']['password'],
        auth: config['bot-account']['type'],
        host: config.server.ip,
        port: config.server.port,
        version: config.server.version,
    })

    inventoryViewer(bot) // Starts a server at http://localhost:3000/ to view your bots inventory easily. 

    bot.on('spawn', () => {
        console.log(`\x1b[33m[BOT-LOG] ${config['bot-account']['username']} joined to the server`, `\x1b[0m`)

        if (config.utils['auto-auth'].enabled) { // Activates every time you change a world. Use accordingly.
            console.log('[INFO] Auto-auth started')
            
            var password = config.utils['auto-auth']['password']
            setTimeout(() => {
                bot.chat(`/login ${password}`)
            }, 2000);
        }

        if (config.utils['anti-afk'].enabled) {
            bot.setControlState('jump', true)
            if (config.utils['anti-afk'].sneak) {
                bot.setControlState('sneak', true)
            }
        }

        setTimeout(() => {
            bot.chat('/skyblock') // Needed for servers with login lobbies. You can change it whatever command you want or remove it If you don't need it.
        }, 1500);
    })

    bot.on('chat', (username, message) => {
        if (config.utils['chat-log']) {
            console.log(`[CHAT] <${username}> ${message}`)
        }
        if (config['bot-owner'].username == username) {
            if (message.includes('me]')) { // Private message prefix changes according to the server. You need to figure it out yourself. Example: https://i.imgur.com/7PCE1RU.png
                if (message == "me] test") {
                    dig(bot)
                    bot.chat(`/msg ${config['bot-owner']['username']} Starting digging`)
                }
                if (message == "me] isgo") {
                    bot.chat('/is go')
                    bot.chat(`/msg ${config['bot-owner']['username']} Teleporting to island`)
                }
                if (message == "me] home") {
                    bot.chat('/home')
                    bot.chat(`/msg ${config['bot-owner']['username']} Teleporting to home`)
                }
                if (message == "me] tpa") {
                    bot.chat(`/tpa ${config['bot-owner']['username']}`)
                }
                if (message == "me] sethome") {
                    bot.chat('/sethome')
                    bot.chat(`/msg ${config['bot-owner']['username']} Set my home to here`)
                }
                if (message == "me] drop") {
                    dropItem(bot)
                    bot.chat(`/msg ${config['bot-owner']['username']} Here you go`)
                }
                if (message.includes('me] say')) {
                    bot.chat(message.replace("me] say", ""))
                }

                // You can add/remove command(s) for personal use or to contribute.
                // You can add/remove command(s) for personal use or to contribute.
                // You can add/remove command(s) for personal use or to contribute.

            }
        }
    })

    bot.on('death', () => {
        console.log(
            `\x1b[33m[BOT-LOG] Bot has been died and was respawned ${bot.entity.position}`,
            '\x1b[0m'
        )
    })

    if (config.utils['auto-reconnect']) {
        bot.on('end', () => {
            setTimeout(() => {
                createBot()
            }, config.utils['auto-recconect-delay']);
        })
    }

    bot.on('kicked', (reason) => {
        console.log(
            '\x1b[33m',
            `[BOT-LOG] Bot was kicked from the server. Reason: \n${reason}`,
            '\x1b[0m'
         )
    })

    bot.on('error', (err) => {
        console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m')
    })
}

async function dig(bot) {
    let target = bot.blockAt(bot.entity.position.offset(0, 1, 1))
    if (bot.blockAt(bot.entity.position.offset(-1, 1, 0)).name == "air") {
        return
    }
    if (bot.targetDigBlock) {
        return
    } else {
        if (target && bot.canDigBlock(target)) {
            try {
                while (true) {
                    await bot.dig(target)
                }
            } catch (err) {
                console.log(err.stack)
            }
        } else {
            return
        }
    }
}

function dropItem(bot) {
    const excludedItems = ['diamond_pickaxe'] // TODO: Hard coding items is stupid, change it
    const item = bot.inventory.items().find(item => excludedItems.includes(item.name))
    if (item) {
        bot.tossStack(item)
          .then(() => {
            setTimeout(dropAll)
          })
          .catch(err => {
            console.log(err)
            setTimeout(dropAll, 100)
          })
      }
}

createBot()
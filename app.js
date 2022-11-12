const mineflayer = require('mineflayer')
const inventoryViewer = require('mineflayer-web-inventory')
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const autoeat = require("mineflayer-auto-eat")

const config = require('./settings.json')

var canDig = true

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
    bot.loadPlugin(autoeat)

    bot.once('spawn', () => { // Starts a server at http://localhost:3007/ to see a view from your bots eyes or bird's-eye.
        mineflayerViewer(bot, { port: 3007, firstPerson: false }) // port is the minecraft server port, if first person is false, you get a bird's-eye view
        // bot.autoEat.options.priority = "foodPoints"
        // bot.autoEat.options.bannedFood = []
        // bot.autoEat.options.eatingTimeout = 3
    })

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
        if (config['bot-owner'].username == username || config['bot-owner'].username2 == username) {
            if (message.includes('me')) { // Private message prefix changes according to the server. You need to figure it out yourself. Example: https://i.imgur.com/7PCE1RU.png
                let args = message.split(' ')
                if (args[1] == "dig") {
                    dig(bot)
                    bot.chat(`/msg ${config['bot-owner']['username']} Starting digging`)
                }
                if (args[1] == "isgo") {
                    bot.chat('/is go')
                    bot.chat(`/msg ${config['bot-owner']['username']} Teleporting to island`)
                }
                if (args[1] == "home") {
                    bot.chat('/home')
                    bot.chat(`/msg ${config['bot-owner']['username']} Teleporting to home`)
                }
                if (args[1] == "tpa") {
                    if (!args[2]) {
                        bot.chat(`/msg ${config['bot-owner']['username']} Specify a player to teleport`)
                    } else {
                        bot.chat(`/tpa ${args[2]}`)
                    }
                }
                if (args[1] == "sethome") {
                    bot.chat('/sethome')
                    bot.chat(`/msg ${config['bot-owner']['username']} Set my home to here`)
                }
                if (args[1] == "drop") {
                    if (!args[2]) {
                        bot.chat(`/msg ${config['bot-owner']['username']} Specify a item to drop`)
                    } else {
                        dropItem(bot, args[2])
                    }
                }
                if (args[1] == "equip") {
                    if (!args[2]) {
                        bot.chat(`/msg ${config['bot-owner']['username']} Specify a item to equip`)
                    } else {
                        equipItem(bot, args[2])
                    }
                }
                if (args[1] == "say") {
                    msg = args.slice(2).join(' ')
                    bot.chat(`${msg}`)
                }
                if (args[1] == "food") {
                    bot.chat(`/msg ${config['bot-owner']['username']} Currently at ${bot.food}`)
                }
                if (args[1] == "parca") {
                    parca(bot)
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
        // setTimeout(() => {
        //     bot.chat(`/home`)
        //     dig(bot)
        // }, 3000);
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

    bot.on('health', async() => {
        if (bot.food < 14) {
            bot.stopDigging()
            canDig = false
            await bot.autoEat.eat(function (err) {
                if (err) {
                    console.error(err)
                } else {
                    console.log("ate")
                }
            })
            setTimeout(() => {
                equipItem(bot, "diamond_pickaxe")
                canDig = true
            }, 3500);
        }

        // if (bot.food == 20) {
        //     bot.autoEat.disable()
        // } else {
        //     bot.autoEat.enable()
        // }
    })
}

function naber(bot) {
    console.log(bot.blockAt(bot.entity.position.offset(-1, 1, 0)).name)
}

async function dig(bot) {
    let target1 = bot.blockAt(bot.entity.position.offset(0, 1, -1))
    let target2 = bot.blockAt(bot.entity.position.offset(0, 1, -2))
    let target3 = bot.blockAt(bot.entity.position.offset(0, 1, -3))
    let target4 = bot.blockAt(bot.entity.position.offset(0, 1, -4))
    let target5 = bot.blockAt(bot.entity.position.offset(0, 1, -5))
    // let target1 = bot.blockAt(bot.entity.position.offset(-1, 1, 0))
    // let target2 = bot.blockAt(bot.entity.position.offset(-2, 1, 0))
    // let target3 = bot.blockAt(bot.entity.position.offset(-3, 1, 0))
    // let target4 = bot.blockAt(bot.entity.position.offset(-4, 1, 0))
    // let target5 = bot.blockAt(bot.entity.position.offset(-5, 1, 0))

    if (canDig == true) {
        if (bot.targetDigBlock) {
            return
        } else {
            if (target1 && bot.canDigBlock(target1) && bot.blockAt(bot.entity.position.offset(0, 1, -1)).name != "air") {
                try {
                    await bot.dig(target1)
                    await bot.waitForTicks(5)
                } catch (err) {
                    console.log(err)
                }
            }
            if (target2 && bot.canDigBlock(target2) && bot.blockAt(bot.entity.position.offset(0, 1, -1)).name == "air") {
                try {
                    await bot.dig(target2)
                    await bot.waitForTicks(5)
                } catch (err) {
                    console.log(err)
                }
            }
            if (target3 && bot.canDigBlock(target3) && bot.blockAt(bot.entity.position.offset(0, 1, -1)).name == "air" && bot.blockAt(bot.entity.position.offset(0, 1, -2)).name == "air") {
                try {
                    await bot.dig(target3)
                    await bot.waitForTicks(5)
                } catch (err) {
                    console.log(err)
                }
            }
            if (target4 && bot.canDigBlock(target4) && bot.blockAt(bot.entity.position.offset(0, 1, -1)).name == "air" && bot.blockAt(bot.entity.position.offset(0, 1, -3)).name == "air") {
                try {
                    await bot.dig(target4)
                    await bot.waitForTicks(5)
                } catch (err) {
                    console.log(err)
                }
            }
        }
    } else {
        setTimeout(() => {
            dig(bot)
        }, 2000);
    }

    setTimeout(() => {
        dig(bot)
    }, 2000);
}

function dropItem(bot, item) {
    const excludedItems = [item]
    const items = bot.inventory.items().find(item => excludedItems.includes(item.name))
    if (items) {
        bot.tossStack(items)
        setTimeout(() => {
            return
        }, 500);
    } else {
        bot.chat(`/msg ${config['bot-owner']['username']} Couldn't find that item :(`)
    }
}

async function equipItem(bot, item) {
    var items;
    for (const it of bot.inventory.items())
        if (it.name === item)
            items = it;
    if (!items) {
        bot.chat(`/msg ${config['bot-owner']['username']} Couldn't find that item :(`)
    } else {
        await bot.equip(items, "hand")
    }
}

async function parca (bot) {
    while (bot.currentWindow == null) {
        bot.chat('/parça')
        await bot.waitForTicks(10);
    }

    if (bot.currentWindow != null) {
        setTimeout(() => {
            bot.simpleClick.leftMouse(18)
            if (bot.currentWindow == null) return
            bot.waitForTicks(20)
        }, 3000);
    }
}

createBot()
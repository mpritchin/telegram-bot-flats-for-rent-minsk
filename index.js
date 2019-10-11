const TelegramBot = require('node-telegram-bot-api');
const lodash = require('lodash');
const getFlatsFromOnliner = require('./src/getFlatsFromOnliner');
const TOKEN = process.env.TELEGRAM_TOKEN;
const options = {
    webHook: {
        // Port to which you should bind is assigned to $PORT variable
        // See: https://devcenter.heroku.com/articles/dynos#local-environment-variables
        port: process.env.PORT
        // you do NOT need to set up certificates since Heroku provides
        // the SSL certs already (https://<app-name>.herokuapp.com)
        // Also no need to pass IP because on Heroku you need to bind to 0.0.0.0
    }
};
// Heroku routes from port :443 to $PORT
// Add URL of your app to env variable or enable Dyno Metadata
// to get this automatically
// See: https://devcenter.heroku.com/articles/dyno-metadata
const url = process.env.APP_URL;
const bot = new TelegramBot(TOKEN, options);


// This informs the Telegram servers of the new webhook.
// Note: we do not need to pass in the cert, as it already provided
bot.setWebHook(`${url}/bot${TOKEN}`);

const chatIds = [];

if(process.env.DEFAULT_CHAT_ID) {
    chatIds.push(process.env.DEFAULT_CHAT_ID);
}

// Just to ping!
bot.on('message', function onMessage(msg) {
    bot.sendMessage(msg.chat.id, 'Do you want to know all new offers rent for flats in Minsk?');
    console.log(`${msg.chat.id}:${msg.text}`);
    if(msg.text === 'yes') {
        const index = chatIds.indexOf(msg.chat.id);
        if (index === -1) {
            chatIds.push( msg.chat.id );
            console.log(`New chat id '${msg.chat.id}' was added`);
        }
        bot.sendMessage(msg.chat.id, 'OK. You added to list of recipients');
    } else if(msg.text === 'no') {
        const index = chatIds.indexOf(msg.chat.id);
        if (index >= 0) {
            chatIds.splice( index, 1 );
            console.log(`Chat id '${msg.chat.id}' was removed`);
        }
        bot.sendMessage(msg.chat.id, 'OK. You removed from list of recipients');
    }
});

let oldFlats = [];

function pingFlats() {
    getFlatsFromOnliner().then((flats) => {
        console.log(`Flats found: ${flats.length}`);
        const newFlats = lodash.differenceBy(flats, oldFlats, 'id');
        const removedFlats = lodash.differenceBy(oldFlats, flats, 'id');
        const flatsWithChangedPrice = flats.filter(flat => {
            const oldFlat = lodash.find(oldFlats, {id: flat.id});
            if(!oldFlat) {
                return false
            }
            try {
                return oldFlat.price.amount !== flat.price.amount
            } catch (e) {
                console.error(e);
                return false
            }
        });
        console.log(`ChatIds count: ${chatIds.length}`);
        console.log(`Found new flats count: ${newFlats.length}`);
        if (oldFlats.length > 0 && newFlats.length > 0 && chatIds.length > 0) {
            newFlats.forEach(feature => {
                chatIds.forEach(chatId => {
                    bot.sendMessage(chatId, `New flat: https://r.onliner.by/pk/apartments/${feature.id}`);
                });
            });
        }

        console.log(`Found changed price flats count: ${flatsWithChangedPrice.length}`);
        if (flatsWithChangedPrice.length > 0 && chatIds.length > 0) {
            flatsWithChangedPrice.forEach(flat => {
                const oldFlat = lodash.find(oldFlats, {id: flat.id})
                chatIds.forEach(chatId => {
                    bot.sendMessage(chatId, `Changed price => https://r.onliner.by/pk/apartments/${flat.id} price ${oldFlat.price.amount} => ${flat.price.amount}`);
                });
            });
        }

        console.log(`Found removed flats count: ${removedFlats.length}`);
        if (removedFlats.length > 0 && chatIds.length > 0) {
            removedFlats.forEach(flat => {
                chatIds.forEach(chatId => {
                    bot.sendMessage(chatId, `Removed flat => ${JSON.stringify(flat)}`);
                });
            });
        }
        oldFlats = flats;
        setTimeout(pingFlats, 60000)
    });
}

pingFlats();

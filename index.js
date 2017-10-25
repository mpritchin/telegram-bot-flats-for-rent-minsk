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

// Just to ping!
bot.on('message', function onMessage(msg) {
    bot.sendMessage(msg.chat.id, 'Do you want to know all new offers rent for flats in Minsk?');
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

let oldFeatures = [];

function pingFlats() {
    getFlatsFromOnliner().then((points) => {
        const newFeatures = lodash(points.features, oldFeatures, 'id');
        console.log(`Found new flats: ${JSON.stringify(newFeatures)}`);
        console.log(`ChatIds: ${chatIds}`);
        if(newFeatures && newFeatures.length > 0 && chatIds.length > 0) {
                newFeatures.forEach(feature => {
                    chatIds.forEach(chatId => {
                        bot.sendMessage(chatId, `https://r.onliner.by/ak/apartments/${feature.id}`);
                    });
                });
        }
        oldFeatures = points.features;
        setTimeout(pingFlats, 60000)
    });
}

pingFlats();
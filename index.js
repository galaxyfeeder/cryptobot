let BotKit = require('botkit');
let dotenv = require('dotenv');
let autobahn = require('autobahn');

const wsuri = 'wss://api.poloniex.com';

// environment variables configuration
dotenv.config();

// poloniex web server
let connection = new autobahn.Connection({
    url: wsuri,
    realm: "realm1"
});

// slack bot
let bot = BotKit.slackbot({
    debug: false
});

let data = {};

// set webserver events
connection.onopen = (session) => {
    function tickerEvent (args, kwargs) {
        data[args[0]] = {
            currencyPair: args[1],
            last: args[2],
            lowestAsk: args[3],
            highestBid: args[4],
            percentChange: args[5],
            baseVolume: args[6],
            quoteVolume: args[7],
            isFrozen: args[8],
            high24hr: args[9],
            low24hr: args[10]
        };
    }
    session.subscribe('ticker', tickerEvent);
};

connection.onclose = () => {
    console.log("Websocket connection closed");
};

connection.open();

// start real time messaging
bot.spawn({
    token: process.env.SLACK_TEAM_TOKEN
}).startRTM();

// welcome message
bot.hears(['^.*\\bhello\\b.*$', '^.*\\bhi\\b.*$', '^.*\\bhey\\b.*$'], ['direct_message','direct_mention','mention'], (bot, message) => {
    bot.api.users.info({user: message.user}, (err, info) => {
        if (info.ok) {
            bot.reply(message, 'Hello ' + info.user.profile.first_name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});

// ask about a cryptocurrency
bot.hears(['^.*\\bchange\\b.*(BTC_REP|ETH_REP|BTC_PASC|BTC_ETH|USDT_ETH|ETH_STEEM|BTC_ETC|BTC_BTM|USDT_BTC|ETH_ETC|BTC_BBR|BTC_XMG|BTC_FCT|BTC_DASH|BTC_BCY|USDT_REP|ETH_ZEC|BTC_ZEC|USDT_ZEC|BTC_XMR|ETH_GNT|BTC_BELA|BTC_BURST|BTC_DGB|BTC_GNT|BTC_GAME|BTC_LTC|BTC_MAID|BTC_NXT|BTC_POT|BTC_SYS|BTC_VTC|BTC_GRC|BTC_XRP|BTC_SC|BTC_RADS|BTC_VOX|BTC_DCR|BTC_LSK|BTC_LBC|USDT_DASH|USDT_LTC|XMR_NXT|USDT_XRP|USDT_ETC|ETH_LSK|BTC_STEEM|BTC_CURE|BTC_NEOS|BTC_NMC).*$'], ['direct_message','direct_mention','mention'], (bot, message) => {
    let value = message.match[1];
    if(value in data){
        bot.reply(message, 'The change is '+data[value].currencyPair);
    }else{
        bot.reply(message, 'The change for '+value+' is not available now. Try again later.')
    }
});

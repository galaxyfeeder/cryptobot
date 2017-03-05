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
let alerts = [];

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
        console.log(args[0]);
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

// ask about the change of a cryptocurrency
bot.hears(['^.*\\bchange\\b.*((BTC|REP|ETH|PASC|USDT|STEEM|ETC|BTM|BBR|XMG|FCT|DASH|BCY|REP|ZEC|XMR|GNT|BELA|BURST|DGB|GNT|GAME|LTC|MAID|NXT|POT|SYS|VTC|GRC|XRP|SC|RADS|VOX|DCR|LSK|LBC|DASH|STEEM|CURE|NEOS|NMC)_(BTC|REP|ETH|PASC|USDT|STEEM|ETC|BTM|BBR|XMG|FCT|DASH|BCY|REP|ZEC|XMR|GNT|BELA|BURST|DGB|GNT|GAME|LTC|MAID|NXT|POT|SYS|VTC|GRC|XRP|SC|RADS|VOX|DCR|LSK|LBC|DASH|STEEM|CURE|NEOS|NMC)).*$'], ['direct_message','direct_mention','mention'], (bot, message) => {
    const currency1 = message.match[2];
    const currency2 = message.match[3];
    const value = currency1+'_'+currency2;
    const valuer = currency2+'_'+currency1;
    if(value in data){
        bot.reply(message, 'The change is '+data[value].currencyPair);
    }else if(valuer in data){
        bot.reply(message, 'The change is '+1/(data[valuer].currencyPair));
    }else{
        bot.reply(message, 'The change for '+value+' is not available now. Try again later.')
    }
});

// ask about a cryptocurrency
bot.hears(['^.*\\bshow all about\\b.*(BTC_REP|ETH_REP|BTC_PASC|BTC_ETH|USDT_ETH|ETH_STEEM|BTC_ETC|BTC_BTM|USDT_BTC|ETH_ETC|BTC_BBR|BTC_XMG|BTC_FCT|BTC_DASH|BTC_BCY|USDT_REP|ETH_ZEC|BTC_ZEC|USDT_ZEC|BTC_XMR|ETH_GNT|BTC_BELA|BTC_BURST|BTC_DGB|BTC_GNT|BTC_GAME|BTC_LTC|BTC_MAID|BTC_NXT|BTC_POT|BTC_SYS|BTC_VTC|BTC_GRC|BTC_XRP|BTC_SC|BTC_RADS|BTC_VOX|BTC_DCR|BTC_LSK|BTC_LBC|USDT_DASH|USDT_LTC|XMR_NXT|USDT_XRP|USDT_ETC|ETH_LSK|BTC_STEEM|BTC_CURE|BTC_NEOS|BTC_NMC).*$'], ['direct_message','direct_mention','mention'], (bot, message) => {
    let value = message.match[1];
    if(value in data){
        bot.reply(message, 'The currency pair is '+data[value].currencyPair);
        bot.reply(message, 'The last value is '+data[value].last);
        bot.reply(message, 'The lowest value in the last 24h is '+data[value].high24hr);
        bot.reply(message, 'The highest value in the last 24h is '+data[value].low24hr);
        bot.reply(message, 'The percentual change is '+data[value].percentChange);
        bot.reply(message, 'The base volume is '+data[value].baseVolume);
        bot.reply(message, 'The quote volume is '+data[value].quoteVolume);
    }else{
        bot.reply(message, 'The information about '+value+' is not available now. Try again later.')
    }
});

// ask about a cryptocurrency
bot.hears(['^.*\\bchanges\\b.*(BTC|ETH|USDT|XMR).*$'], ['direct_message','direct_mention','mention'], (bot, message) => {
    let value = message.match[1];
    for(let d in data){
        if(d.includes(value)){
            bot.reply(message, 'The currency pair of '+d+' is '+data[d].currencyPair);
        }
    }
});

// ask about a cryptocurrency
bot.hears(['^.*\\list\\b.*\\bcurrencies\\b.*$'], ['direct_message','direct_mention','mention'], (bot, message) => {
    let m = '';
    for(let d in data){
        m += d + '\n';
    }
    bot.reply(message, m);
});

// ask about a cryptocurrency
bot.hears(['^.*\\alert me\\b.*(BTC_REP|ETH_REP|BTC_PASC|BTC_ETH|USDT_ETH|ETH_STEEM|BTC_ETC|BTC_BTM|USDT_BTC|ETH_ETC|BTC_BBR|BTC_XMG|BTC_FCT|BTC_DASH|BTC_BCY|USDT_REP|ETH_ZEC|BTC_ZEC|USDT_ZEC|BTC_XMR|ETH_GNT|BTC_BELA|BTC_BURST|BTC_DGB|BTC_GNT|BTC_GAME|BTC_LTC|BTC_MAID|BTC_NXT|BTC_POT|BTC_SYS|BTC_VTC|BTC_GRC|BTC_XRP|BTC_SC|BTC_RADS|BTC_VOX|BTC_DCR|BTC_LSK|BTC_LBC|USDT_DASH|USDT_LTC|XMR_NXT|USDT_XRP|USDT_ETC|ETH_LSK|BTC_STEEM|BTC_CURE|BTC_NEOS|BTC_NMC).*(maximum|minimum|change).*(greater|smaller|equal).*([0-9]*).*$'], ['direct_message','direct_mention','mention'], (bot, message) => {
    let currency = message.match[1];
    let type = message.match[2];
    let condition = message.match[3];
    let value = message.match[4];

    alerts.push({
        user: message.user,
        currency: currency,
        type: type,
        condition: condition,
        value: value
    });
    bot.reply(message, "Your alert has been configured correctly.");
});

function check_alerts(){
    for(alert in alerts){

    }
    setTimeout(check_alerts, 5000);
}
check_alerts();

var ElizaBot = require('./elizabot.js');

var elizairc = function(dbot) {
    this.elizainstance = new ElizaBot();
    this.dbot = dbot;
    this.pattern = new RegExp("^"+dbot.config.name);
    this.replace = new RegExp("^"+dbot.config.name+".");
    this.listener = function(event) {
        if(this.pattern.test(event.message)) {
            var msg = event.message.replace(this.replace,"");
            var reply = this.elizainstance.transform(msg);
            event.reply(reply);
        }
    }.bind(this);
    this.onLoad = function() {
    };
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new elizairc(dbot);
}

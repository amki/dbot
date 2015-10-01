/** 
 * Module Name: Twitter
 * Description: Allows to read Twitter feeds
 */
var request = require('request'), 
    _ = require('underscore')._;

var twitter = function(dbot) {
    this.pollInterval = 60000;
    this.consumerKey = "";
    this.consumerSecret = "";
    this.httpoptions = {headers: {}};
    var self = this;

    this.internalAPI = {
        'makeRequest': function(id,tw) {
            var options = {
                url:"https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name="+tw.name+"&count=10",
                headers: self.httpoptions.headers
            };
            var req = request(options, function(err,res,body) {
                var data = JSON.parse(body);

                for(var i=0;i<data.length;++i) {
                    var dat = data[i];
                    var creation = new Date(dat.created_at);
                    if(creation.valueOf() > tw.lastPosted) {
                        var text = dat.text.replace(/\n/g," ");
                        dbot.say(tw.server,tw.channel,"["+tw.name+"] "+text);
                        for(var z=0;z<dat.entities.media.length;++z) {
                            var medium = dat.entities.media[z];
                            if(medium.type == "photo") {
                                dbot.say(tw.server,tw.channel,"["+tw.name+"] New slobber pic: "+medium.media_url_https);
                            }
                        }
                        tw.lastPosted = Date.now();
                        dbot.say(tw.server,tw.channel,"["+tw.name+"] lastPosted: "+tw.lastPosted);
                    }
                }
            });
        }.bind(this),
        
        'checkFeeds': function() {
            console.log("Checking twitters...");
            if(dbot.db.twitters == null) {
                console.log("No active twitters...");
                return;
            }
            for(var i=0;i<dbot.db.twitters.length;++i) {
                this.internalAPI.makeRequest(i,dbot.db.twitters[i]);
            }
        }.bind(this),

        'reloadFeeds': function() {
            return setInterval(this.internalAPI.checkFeeds, this.pollInterval);
        }.bind(this)
    };

    this.commands = {
        '~addtwitterfeed': function(event) {
            if(event.params.length < 2) {
                event.reply("GIMME A PARAMETER DUDE");
                return;
            }
            var now = Date.now();
            if(dbot.db.twitters == null)
                dbot.db.twitters = [];
            dbot.db.twitters.push({server:event.server, channel:event.channel.name, name:event.params[1], lastPosted: now});
            event.reply("Adding Twitter feed for "+event.params[1]);
        },
        '~twittertest': function(event) {
            var options = {
                url:"https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=hktakbfooru&count=5",
                headers: self.httpoptions.headers
            };
            console.log(options);
            var req = request(options,function(err,res,body) {
                var data = JSON.parse(body);
                for(var i=0;i<data.length;++i) {
                    event.reply(data[i].text);
                }
            });
        },
        '~delrssfeed': function(event) {
            for(var i=0;i<dbot.db.twitters.length;++i) {
                if(dbot.db.twitters[i].name == event.params[1]) {
                    dbot.db.twitters.splice(i, 1);
                    event.reply("Removed "+event.params[1]+"'s twitter feed");
                    break;
                }
            }
        }
    };

    this.onLoad = function() {
        var btk = this.consumerKey+":"+this.consumerSecret;
        var btk64 = new Buffer(btk).toString('base64');
        var options = {
            url: 'https://api.twitter.com/oauth2/token',
            headers: {
                'Authorization': 'Basic '+btk64
            },
            form: {
                'grant_type': 'client_credentials'
            }
        };
        
        console.log("Trying b64 encode: "+btk64);
        var req = request.post(options,function(err,res,body) {
            var answer = JSON.parse(body);
            console.log(answer);
            if(answer.token_type === "bearer") {
                self.httpoptions.headers.Authorization = "Bearer "+answer.access_token;
                console.log(self.httpoptions);
                self.interval = self.internalAPI.reloadFeeds();
            }
        });
    };

    this.onDestroy = function() {
        clearInterval(this.interval);
    };
};

exports.fetch = function(dbot) {
    return new twitter(dbot);
};

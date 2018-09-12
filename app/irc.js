console.log('loading irc.js');

var config = require('./config.json');

var irc = new WebSocket('wss://irc-ws.chat.twitch.tv:443/irc');

irc.onopen = function() {
  irc.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
  irc.send('PASS ' + config.oauth);
  irc.send('NICK ' + config.username);
  irc.send('JOIN ' + config.channel);
};

irc.onerror = function(error) {
 // Something went terribly wrong... Respond?!
 console.log(error);
};

irc.onmessage = function (message) {
  if(message !== null) {
    const parsed = parseMessage(message.data);
    if(parsed !== null) {
      switch(parsed.command) {
        case "PRIVMSG":
          var msg = "<div class=ircmessage><span style='color: %c'>%u</span>&nbsp;:&nbsp;%m</div>";
          var Chat = document.getElementById('chat');
          var mss = document.createElement('div');
          mss.className = 'row';
          var emoteMsg = parsed.message;
          console.log(emoteMsg);
          msg = msg.replace('%c', parsed.tags.color).replace('%u', parsed.tags['display-name']).replace('%m', emoteMsg);
          mss.innerHTML = msg;
          Chat.appendChild(mss);
          break;
        case "PING":
          sendServerMessage('PONG :' + parsed.message);
          break;
        default:
          break;
      }
    }
  };
};

irc.onclose = function (){
 console.log("[IRC] Connection Closed!");
};

function parseMessage(rawMessage) {
    const parsedMessage = {
        message: null,
        tags: [],
        command: null,
        original: rawMessage,
        channel: null,
        username: null,
    };

    if(rawMessage[0] === '@') {
        const tagIndex = rawMessage.indexOf(' '),
            userIndex = rawMessage.indexOf(' ', tagIndex + 1),
            commandIndex = rawMessage.indexOf(' ', userIndex + 1),
            channelIndex = rawMessage.indexOf(' ', commandIndex + 1),
            messageIndex = rawMessage.indexOf(':', channelIndex + 1);

        parsedMessage.tags.raw = rawMessage.slice(0, tagIndex);
        const temp = parsedMessage.tags.raw.split(';');
        for(let c = 0; c < temp.length; c++){
            const key = temp[c].split('=')[0];
            const value = temp[c].split('=')[1];
            parsedMessage.tags[key] = value;
        }

        parsedMessage.username = rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
        parsedMessage.command = rawMessage.slice(userIndex + 1, commandIndex);
        parsedMessage.channel = rawMessage.slice(commandIndex + 1, channelIndex);
        parsedMessage.message = rawMessage.slice(messageIndex + 1);
    } else if(rawMessage.startsWith("PING")) {
        parsedMessage.command = "PING";
        parsedMessage.message = rawMessage.split(":")[1];
    }

    return parsedMessage;
};

function sendServerMessage(message) {
    irc.send(message);
};

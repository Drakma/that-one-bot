var config   = require('./config/config.json');
var hashtags = require('./files/hashtags.json');
var localws  = new WebSocket('ws://localhost:3000/keywords');
var timerws  = new WebSocket('ws://localhost:3000/timer');
var socket   = new WebSocket(config.wssite);


socket.onopen = function() {
  var auth = {
    author: "drakma",
    website: "thatone.show",
    api_key: config.apikey,
    events: ["EVENT_SUB", "EVENT_FOLLOW", "EVENT_HOST", "EVENT_CHEER", "EVENT_DONATION"]
  }
  socket.send(JSON.stringify(auth));
};

socket.onerror = function(error) {
 console.log('[ALERT] ERROR: ' + error.stringify());
};

socket.onmessage = function (message) {
  var msg = JSON.parse(message.data);
  switch(msg.event) {
    case "EVENT_CHEER":
      var data = JSON.parse(msg.data);
      parseHashtags(data, hashtags);
      processTimerMoney(data);
      break;
    case "EVENT_DONATION":
      var data = JSON.parse(msg.data);
      parseHashtags(data, hashtags)
      processTimerMoney(data);
      break;
    case "EVENT_CONNECTED":
      console.log('[ALERT] Connected to websocket');
      break;
    case "EVENT_SUB":
      var data = JSON.parse(msg.data);
      processTimerSubs(data);
      break;
    case "EVENT_FOLLOW":
    case "EVENT_HOST":
    default:
      break;
  }

};

socket.onclose = function () {
 // Connection has been closed by you or the server
 console.log("[ALERT] Connection Closed!");
};

function parseHashtags(data, hashtags) {
  var keywords = hashtags.keywords;
  var msg = data.message;
  var amount = 0;
  var found = 0;
  if('bits' in data) {
    amount = data.bits;
  } else if ('amount' in data) {
    amount = data.amount * 100;
  }

  for(i = 0; i < keywords.length; i++) {
    if(msg.includes(keywords[i]) && found == 0) {
      hashtags.values[i] = hashtags.values[i] + amount;
      localws.send(JSON.stringify(hashtags));
      found = 1;
    }
  }
};

timerws.onopen = function() {
  var timer  = config.timer;
  var date   = new Date();
  var datems = date.getTime();
  var endms  = datems + (timer.minimum * 60 * 60 * 1000);
  var leftms = endms - datems;
  console.log(leftms);
  var req = {
    "event": "INIT",
    "data": {
      "status": "PAUSED",
      "start": -1,
      "togo": leftms,
      "elapsed": 0
    }
  }
  timerws.send(JSON.stringify(req));
};

function processTimerMoney(data) {
  var msg = data.message;
  var amount = 0;
  var minutes = 0;
  if('bits' in data) {
    minutes = Math.floor(data.bits / config.timer.bits_per_minute);
  } else if ('amount' in data) {
    minutes = Math.floor(data.amount / config.timer.dollars_per_minute);
  }
  if(minutes > 0 ) {
    ltimerAddTime(minutes);
  }
}

function processTimerSubs(data) {
  var minutes = 0;
  var tier = data.tier;
  switch(tier) {
    case "3":
      minutes = config.timer.tier3_minutes;
      break;
    case "2":
      minutes = config.timer.tier2_minutes;
      break;
    case "1":
    default:
      minutes = config.timer.tier1_minutes;
  }

  if(minutes > 0 ) {
    ltimerAddTime(minutes);
  }
}

function ltimerPause() {
  var msg = {
    "event": "PAUSE",
  };
  timerws.send(JSON.stringify(msg));
};

function ltimerUnPause() {
  var msg = {
    "event": "UNPAUSE",
  };
  timerws.send(JSON.stringify(msg));
};

function ltimerAddTime(minutes) {
  console.log("adding " + minutes + " minutes to timer");
  var msg = {
    "event": "ADD",
    "minutes": minutes
  };
  timerws.send(JSON.stringify(msg));
};

function ltimerSubtractTime(minutes) {
  var msg = {
    "event": "SUB",
    "minutes": minutes
  };
  timerws.send(JSON.stringify(msg));
};

function delay(seconds) {
  var d = seconds * 1000;
  setTimeout(function() {

  }, d);
}

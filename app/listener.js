var express = require('express');
var path = require('path');
var fs = require('fs');
var app = express();
var expressWs = require('express-ws')(app);
var filesDir = __dirname + "/files/";
var configDir = __dirname + "/config/";

//app.use(express.static('config'));
//app.use(express.static('bot'));
//app.use(express.static('docs'));

app.use(function (req, res, next) {
    req.testing = 'testing';
    return next();
});

app.ws('/keywords', function(ws, req) {
  ws.on('message', function(msg) {
    var data = JSON.parse(msg);
    switch(data.event) {
      case "REFRESH" :
        fs.readFile(filesDir + "hashtags.json", function(err, data) {
          if (err) return console.log(err);
          var message = JSON.parse(data);
          var keywords = message.keywords;
          for (i = 0; i < keywords.length; i++) {
            fs.writeFile(filesDir + '' + keywords[i] + '.txt', message.values[i], function (err) {
              if (err) return console.log(err);
            });
          }
        });
        break;
      case "GET" :
        fs.readFile(filesDir + 'hashtags.json', function (err, data) {
          if (err) return console.log(err);
          var timerjs = JSON.parse(data);
          ws.send(JSON.stringify(timerjs));
        });
        break;
      default:
        fs.writeFile(filesDir + 'hashtags.json', msg, function (err) {
          if (err) return console.log(err);
          console.log('Hashtag Data Saved');
        });
        var message = JSON.parse(msg);
        var keywords = message.keywords;
        for (i = 0; i < keywords.length; i++) {
          fs.writeFile(filesDir + '' + keywords[i] + '.txt', message.values[i], function (err) {
            if (err) return console.log(err);
          });
        }
      
    }
  });
});

app.ws('/timer', function(ws, req) {
  ws.on('message', function(msg) {
    var data = JSON.parse(msg);
    switch(data.event) {
      case "INIT":
        if(!fs.existsSync(filesDir + 'timer.json')) {
          fs.writeFile(filesDir + 'timer.json', JSON.stringify(data.data), function(err) {
            if(err) return console.log(err);
          });
        };
        break;
      case "GET":
        fs.readFile(filesDir + 'timer.json', function (err, data) {
          if (err) return console.log(err);
          var timerjs = JSON.parse(data);
          ws.send(JSON.stringify(timerjs));
        });
        break;
      case "TICK":
        fs.readFile(filesDir + 'timer.json', function(err, data) {
          if(err) return console.log(err);
          var timerjs = JSON.parse(data);
          if(timerjs.status == "ACTIVE") {
            var date = new Date();
            var now = date.getTime();
            var diff = now - timerjs.start;
            timerjs.elapsed = timerjs.elapsed + diff;
            timerjs.togo = timerjs.togo - diff;
            timerjs.start = now;
            var readableTime = msToTime(timerjs.togo);
            fs.writeFile(filesDir + 'timer.txt', readableTime, function(err) {
              if(err) return console.log(err);
            });
            fs.writeFile(filesDir + 'timer.json', JSON.stringify(timerjs), function(err) {
              if(err) return console.log(err);
            });
          };
        });
        break;
      case "PAUSE":
        fs.readFile(filesDir + 'timer.json', function(err, data) {
          if(err) return console.log(err);
          var timerjs = JSON.parse(data);
          var date = new Date();
          var ms = date.getTime();
          timerjs.status = "PAUSED";
          timerjs.start = -1;
          fs.writeFile(filesDir + 'timer.json', JSON.stringify(timerjs), function(err) {
            if(err) return console.log(err);
          });
        });
        break;
      case "UNPAUSE":
        fs.readFile(filesDir + 'timer.json', function(err, data) {
          if(err) return console.log(err);
          var timerjs = JSON.parse(data);
          var date = new Date();
          var ms = date.getTime();
          timerjs.status = "ACTIVE";
          timerjs.start = ms;
          fs.writeFile(filesDir + 'timer.json', JSON.stringify(timerjs), function(err) {
            if(err) return console.log(err);
          });
        });
        break;
      case "ADD":
        fs.readFile(filesDir + 'timer.json', function(err, file) {
          if(err) return console.log(err);
          var timerjs = JSON.parse(file);
            diff = data.minutes * 60 * 1000;
            timerjs.togo = timerjs.togo + diff;
            var readableTime = msToTime(timerjs.togo);
          fs.writeFile(filesDir + 'timer.txt', readableTime, function(err) {
              if(err) return console.log(err);
            });
          fs.writeFile(filesDir + 'timer.json', JSON.stringify(timerjs), function(err) {
              if(err) return console.log(err);
            });
        });
        break;
      case "SUB":
        fs.readFile(filesDir + 'timer.json', function(err, file) {
          if(err) return console.log(err);
          var timerjs = JSON.parse(file);
            diff = data.minutes * 60 * 1000;
            timerjs.togo = timerjs.togo - diff;
            var readableTime = msToTime(timerjs.togo);
          fs.writeFile(filesDir + 'timer.txt', readableTime, function(err) {
              if(err) return console.log(err);
            });
          fs.writeFile(filesDir + 'timer.json', JSON.stringify(timerjs), function(err) {
              if(err) return console.log(err);
            });
        });
        break;
      default:
        break;
    }
  });
});

app.listen(3000, function() {
   console.log('listener.js running on port 3000!');
});

function msToTime(duration) {
  if (isNaN(duration) || duration < 0) {
    return null;
  }

  var d, h, m, s, ms;
  s = Math.floor(duration / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  ms = Math.floor((duration % 1000) * 1000) / 1000;
  h = (h<10) ? "0"+h : h;
  m = (m<10) ? "0"+m : m;
  s = (s<10) ? "0"+s : s;

   return d + ":" + h + ":" + m + ":" + s;
}

'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const rssReader = require('feed-read')
const wtf_wikipedia = require("wtf_wikipedia")
const SummaryTool = require('node-summary');
const math = require('mathjs');

//const S = require('string');
//const wordnet = require('wordnet')
//const weather = require('yahoo-weather')
//
const app = express()
global.qury = "Sorry I dont Know";
//var body = null;

app.set('port',5000)

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/',function(req,res){
	res.send("hello this is tweak")
})


app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'holmesvinn_access_token') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});


  
function receivedMessage(event) {
  // Putting a stub for now, we'll expand it in the following steps
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  //var postmessage = event.postback;


  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;


 // var postmsg = postmessage.text;
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'subscribe':
		sendTextMessage(senderID, " ");
        break;

      case 'ubsubscribe':
      	sendTextMessage(senderID, "You have been UNSubscribed");
      	break;


      default:
         callWitAI(messageText, function(err, intent, qury) {
              handleIntent(intent, senderID, qury, messageText)
            })
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "luv u!");
  } else {
  	sendTextMessage(senderID,"ðŸ’šðŸ’šðŸ’šðŸ’šðŸ’šðŸ’šðŸ’š")
  }
}


function handleIntent(intent, sender, qurrry, messageText) {
  switch(intent) {
    case "jokes":
      sendTextMessage(sender, "Today a man knocked on my door and asked for a small donation towards the local swimming pool. I gave him a glass of water.")
      break;
    case "greet":
      sendTextMessage(sender, "Hi!")
      break;
    case "identification":
      sendTextMessage(sender, "I am Tweak ðŸ™‹, an artificial intelligence robot created by holmesvinn")
      break;
    case "capabilities":
      sendTextMessage(sender,"I am capable of sending newsðŸ˜‰ if you ask!")
      break;
    case "thank":
      sendTextMessage(sender,"Welcome! I can even show some news if you want") 
      break;
    case "dad":
      sendTextMessage(sender,"Thats holmesvinn ðŸ˜Œ, my dad")
      break;
    case "yes":
      sendTextMessage(sender,"yep!! ðŸ˜…")
      break;  
    case "compliments":
      sendTextMessage(sender,"Thanks! i can also send news! if you want!")
      break;      
    case "moreNews":
      getArticle(function(err, articles) {
        if (err) {
          console.log(err);
        } else {
          sendTextMessage(sender, "How about these?")
          var maxArticles = Math.min(articles.length, 5);
          for (var i=0; i<maxArticles; i++) {
            newsMessage(sender, articles[i])
          }
        }
      })
      break;
    case "generalNews":
      getArticle(function(err, articles) {
        if (err) {
          console.log(err);
        } else {
          sendTextMessage(sender, "Here's what I found...")
          newsMessage(sender, articles[0])
        }
      })
      break;
    case "localNews":
      getArticle(function(err, articles) {
        if (err) {
          console.log(err);
        } else {
          sendTextMessage(sender, "I don't know local news yet, but I found these...")
          newsMessage(sender, articles[0])
        }
      })
      break;

    case "meaning":  

     try{
      var wordnet = require('wordnet')
      qurrry = qurrry.toLowerCase();
      wordnet.lookup(qurrry, function(err, definitions) {
        try{
          definitions.forEach(function(definition) {
          //console.log('  words: %s', words.trim());
          console.log('  %s', definition.glossary);
          sendTextMessage(sender, definition.glossary)
          });
        }catch(e)
          {
            console.log(e)
            sendTextMessage(sender,"I dont know about that!..Sorry")
          }
        });
      }catch(e){
          sendTextMessage(sender,qurrry)
        }
        break;

    case "person":
    sendTextMessage(sender,"Searching for that data")
      try{
        wtf_wikipedia.from_api(qurrry, "en", function(markup){
          if(markup == null){
            sendTextMessage(sender,"Sorry I dont Know about That")
          }
        var wtext= wtf_wikipedia.plaintext(markup)
        SummaryTool.summarize(qurrry, wtext, function(err, summary) {
        if(err) console.log("Something went wrong man!");
        sendTextMessage(sender, summary)
          });
        })
      }catch(e){
        sendTextMessage(sender,"Sorry I coundnt find that ðŸ˜Ÿ")
      }

      break;

    case "weather":
        try{
            var weather = require('yahoo-weather');
             weather(qurrry, 'c').then(info => { 
              console.log("\n");
              console.log(info);
              console.log("\n");
              var temper = info["item"]["condition"]["temp"]
              var title = info["item"]["title"]
              var lastUpdated = info["item"]["pubDate"]
              var condition = info["item"]["condition"]["text"]
              var humidity = info["atmosphere"]["humidity"]
              var pressure = info["atmosphere"]["pressure"]
              var finalData = title+'\n'+"temperature: "+temper+"Â°C"+'\n'+"condition: "+condition+'\n'+"humidity: "+humidity+'\n'+"pressure: "+pressure+'\n'+ lastUpdated;
              console.log(info);
              sendTextMessage(sender,finalData)
            }).catch(err => {
            sendTextMessage(sender,"I dont think thats a city name")
            console.log(err); 
            });

          }
          catch(e)
              {
               sendTextMessage(sender, "I dont think thats a city name")
          }

    break;

    case "math":
        sendTextMessage(sender,qurrry);
        break;      
    default:
      sendTextMessage(sender, "Sorry i don't understand..Try queries with these syntax..\n1. solve 7+8*5-6/4\n2.what is the meaning of life?\n3.what is the weather in simla?\n4.show me the meaning of death\n5.differentiate sin(x)+x^2\n6.Who is Napolean Bonaparte")
      break

  }
}



function callWitAI(query, callback) {
  query = encodeURIComponent(query);
   request({
    uri: 'https://api.wit.ai/message?v=11/05/2017&q='+query,
    qs: { access_token: '/*yor wit.ai access token*/'},
    method: 'GET'
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("Successfully got %s", response.body);
      //sendTextMessage(23434343423,"success")
      try {
        var body = JSON.parse(response.body)
        var intent = body["entities"]["intent"][0]["value"]
        if(intent == "meaning")
        {
         try{
         global.qury = body["entities"]["search_query"][0]["value"]
         global.qury = global.qury.toLowerCase();
       }catch(e){
        var S = require('string')
         global.qury = body["entities"]["wikipedia_search_query"][0]["value"]
         global.qury = global.qury.toLowerCase();
         var textu = global.qury
         console.log(textu)
         console.log(S(textu).strip('meaning','of',' ').s);
         global.qury = S(textu).strip('meaning','of',' ').s;
         console.log("\n\n "+ global.qury+"\n\n");

       }
                 
      }else if(intent == "person")
      {
        global.qury = "I dont Know"
        try{
          global.qury = body["entities"]["wikipedia_search_query"][0]["value"]
        }catch(e)
        {
          global.qury = body["entities"]["search_query"][0]["value"]
        }

      }else if(intent == "weather"){


        global.qury = "hfjdhfkjd";
        try{
          var S = require('string')
          global.qury = body["entities"]["search_query"][0]["value"]
          var testu = global.qury
          global.qury = global.qury.toLowerCase();
          global.qury = S(testu).strip('weather','in',' ','the','what').s;

        }catch(e){
          var S = require('string')
          global.qury = body["entities"]["wikipedia_search_query"][0]["value"]
          var testu = global.qury
          global.qury = global.qury.toLowerCase();
          global.qury = S(testu).strip('weather','in',' ','the','what').s;
           }

      }else if(intent  == "math"){

        try{
          var S = require('string')
          var math = require('mathjs')
          var valqury = body["entities"]["search_query"][0]["value"]
          valqury = valqury.toLowerCase();
          console.log(valqury);
          if(S(valqury).contains('differentiate') && S(valqury).contains('Differentiate')){
            console.log("contains differentiate");

            
            var value = S(valqury).strip('differentiate',' ').s;
            console.log(value);

            var returnable = math.derivative(value.toString(),'x').toString();
            console.log(returnable);
            global.qury =returnable;
            console.log(global.qury);
            }
            else{

              valqury = valqury.toLowerCase();
              var valuee = S(valqury).strip('simplify','solve','evaluate','find','what','is',' ').s;
              var returnvalueee = math.eval(valuee);
              global.qury = returnvalueee;
              
            }
          }catch(e){
            var S = require('string')
            var math = require('mathjs')
            var valquryw = body["entities"]["wikipedia_search_query"][0]["value"]
            valquryw = valquryw.toLowerCase();
            console.log(valquryw);
            if(S(valquryw).contains('differentiate')){
              console.log("contains differentiate");
              var valuew = S(valquryw).strip('differentiate',' ').s;
              console.log(valuew);
              var returnablew = math.derivative(valuew.toString(),'x').toString();
              console.log(returnablew);
              global.qury =returnablew;
              console.log(global.qury);
           }
          else{
              valquryw = valquryw.toLowerCase();
              var valuee = S(valquryw).strip('simplify','solve','evaluate','find','what','is',' ').s;
              var returnvalueee = math.eval(valuee);
              global.qury = returnvalueee;
              
            }
         }

       }


      callback(null, intent, global.qury)
    }
      catch (e) {

        callback(e)
      }

    }
     else {

      //console.log(response.statusCode)
      console.error("Unable to send message. %s", error);
      //callback(error)
    }
  });
}


var  googleNewsEndpoint = "http://news.google.com/news?output=rss"

function getArticle(callback){
rssReader(googleNewsEndpoint,function(err,articles){
	if(err){
		callback(err)

	}
	else{
		if(articles.length > 0){
			callback(null, articles)

		} else{
			callback("no articles received")
		}
	}
})

}


function newsPostback(recipientId, messageText){
var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
          	title: "Tweak",
            subtitle: "An artificial intelligence bot",
            
            buttons: [{
              type: "postback",
              title: "general News",
              payload: "Payload for second bubble",
            }],
          }] 
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function newsMessage(recipientId, messageText){
var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: messageText.title,
            subtitle: messageText.published.toString(),
            item_url: messageText.link,               
            image_url: messageText.url,
            buttons: [{
              type: "web_url",
              url: messageText.link,
              title: "Open Web URL"
            }],
          }] 
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: '/*your facebook messenger api key*/' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      //console.log("Successfully sent generic message with id %s to recipient %s", 
        //messageId, recipientId);
    } else {
     // console.error("Unable to send message.");
      //console.error(response);
      console.error("finish");
    }
  });  
}

app.listen(5000)
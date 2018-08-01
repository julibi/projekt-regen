'use strict';

const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  fetch = require('node-fetch'),
  app = express().use(bodyParser.json()); // creates express http server
const myPort = process.env.PORT || 5000;

app.listen(myPort, () => console.log('webhook is listening', myPort));

app.get('/', (req, res) => {
  res.json({'text': 'This is the dev server.'});
});

app.post('/webhook', (req, res) => {  
 
  let body = req.body;
  // console.log(body);

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      // console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      // console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }

});

app.get('/webhook', (req, res) => {
  // Your verify token. Should be a random string.
  const verifyToken = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {

  let response;

  fetch('https://vast-gorge-26239.herokuapp.com/')
	  .then(res => console.log(res.json(), 'hello i just called vast-gorge'));

  // Check if the message contains text
  if (received_message.text === 'starte Projekt regen') {    
    // Create the payload for a basic text message
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an image!`
    }
  }  else {
    response = {
      "text": `You sent the message: "${received_message.text}"`
    }
  }
  
  // Sends the response message
  callSendAPI(sender_psid, response);    
}

function callSendAPI(sender_psid, response) {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;  
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// function handleMessage(sender_psid, received_message) {
//   let response;
  
//   // Checks if the message contains text
//   if (received_message.text) {    
//     // Create the payload for a basic text message, which
//     // will be added to the body of our request to the Send API
//     response = {
//       "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
//     }
//   } else if (received_message.attachments) {
//     // Get the URL of the message attachment
//     let attachment_url = received_message.attachments[0].payload.url;
//     response = {
//       "attachment": {
//         "type": "template",
//         "payload": {
//           "template_type": "generic",
//           "elements": [{
//             "title": "Is this the right picture?",
//             "subtitle": "Tap a button to answer.",
//             "image_url": attachment_url,
//             "buttons": [
//               {
//                 "type": "postback",
//                 "title": "Yes!",
//                 "payload": "yes",
//               },
//               {
//                 "type": "postback",
//                 "title": "No!",
//                 "payload": "no",
//               }
//             ],
//           }]
//         }
//       }
//     }
//   } 
  
//   // Send the response message
//   callSendAPI(sender_psid, response);    
// }
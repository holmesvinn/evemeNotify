const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var db = admin.database();
var ref = db.ref("people");
var eveName = null;

exports.notifyPeopleEve = functions.database.ref('/events/{pushID}/participants')
    .onWrite(event => {
      var participants = event.data.val();
      var eventName = db.ref("events/"+event.params.pushID);
      eventName.on("value",function(dataevename){
        var eveNamedata = dataevename.val();
        eveName = eveNamedata.name;
      });
      for(var mkey in participants){
        var reftoken = db.ref("users/"+mkey+"/reftoken");
        reftoken.on("value", function(snapshot) {
          console.log("participants",participants[mkey]);
          if(participants[mkey] != "OWNER"){
            var payload = {
              notification: {
                title: "New Event",
                body: "You have been Added to "+ eveName
              }
            };
            admin.messaging().sendToDevice(snapshot.val(), payload)
              .then(function(response) {
                console.log("Successfully sent message:", response);
              })
              .catch(function(error) {
                  console.log("Error sending message:", error);
            });
          }
          console.log("valuess",snapshot.val());
          }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
          });
      }
      console.log(participants);
     
    });
    exports.notifyPeopleMsg = functions.database.ref('/events/{pushID}/chatmodel/{userID}')
    .onWrite(event => {
      var chats = event.data.val();
      var chatkey = event.params.userID;
      console.log("Message Sent By",chats.userModel.name);
      var sentUser = chats.userModel.name;
      var newmessage = chats.message;
      var eventName = db.ref("events/"+event.params.pushID);
      eventName.on("value",function(dataevename){
        var eveNamedata = dataevename.val();
        eveName = eveNamedata.name;

      });
      
      var usrRef = db.ref("events/"+event.params.pushID+"/participants");
      usrRef.on("value",function(datasnap){
        var participants = datasnap.val();
      for(var mkey in participants){
       if(mkey.toString() != sentUser){
         console.log("users of the event",mkey.toString());
            var refstoken = db.ref("users/"+mkey+"/fcmtoken");
            refstoken.on("value",function(msnapshot){
              console.log("refresh Tokenof the users",msnapshot.val().toString());
              var payload = {
              notification: {
                title: sentUser+" from "+eveName,
                body: newmessage
              }
            };
              admin.messaging().sendToDevice(msnapshot.val(), payload)
              .then(function(response) {
                console.log("Successfully sent message:", response);
              })
              .catch(function(error) {
                  console.log("Error sending message:", error);
            });
            });
       }
      }
    });
    });


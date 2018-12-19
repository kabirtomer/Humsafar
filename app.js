var builder = require('botbuilder');
var builder_cognitiveservices = require("botbuilder-cognitiveservices");
var azure = require('botbuilder-azure'); 
var request = require('request');
var bodyParser = require('body-parser');
var loc_api = require('./src/location');
var uber_api = require('./src/uber');
var train = require('./src/train');

var MICROSOFT_APP_ID = process.env.MICROSOFT_APP_ID;
var MICROSOFT_APP_PASSWORD = process.env.MICROSOFT_APP_PASSWORD;


var introMessage = ['Main functionalities are described below-\n\nProfile : Setup your profile to allow bot know your name.',
'Uber Services: This app allows you to book uber moto/auto/cab/pool etc.',
'Train Services : Ask the bot \'PNR Status\' of the ticket.'
];

var src_lat = undefined;
var src_long = undefined;
var dest_lat = undefined;
var dest_long = undefined;
var ride_list = undefined;

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: MICROSOFT_APP_ID,
    appPassword: MICROSOFT_APP_PASSWORD
});

var inMemoryStorage = new builder.MemoryBotStorage();

var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);;

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^(goodbye)|(bye)|(exit)|(end)|(quit)/i });
    
    
bot.dialog('/', [
    function(session, args, next){
        src_lat = undefined;
        src_long = undefined;
        dest_lat = undefined;
        dest_long = undefined;
        ride_list = undefined;
        session.userData.final = undefined;
        session.userData.ride = undefined;
        console.log(session.userData);
        if(!session.userData.name){
            session.beginDialog('/profile');
        }
        else{
            session.send("Hi " + session.userData.name + "!");
            session.beginDialog('/main');
        }
    }
]);

bot.beginDialogAction('help', '/help', { matches: /^help/i });
bot.dialog('end', function (session, args, next) {
    session.endConversation("Thank You. Please type hi to start conversation.");
})
.triggerAction({
    matches: /^exit$/i,
});

bot.dialog('/main',[
    function(session,args,next) {
        if(!session.userData.name){
            session.beginDialog('/profile');
        }
        else{
            next();
        }
    },
    function(session,args,next) {
        builder.Prompts.choice(session, "What would you like to get (type end to quit)?", "Uber Service|Train Service|Profile|Help|Developers");
    },
    function(session,results){
        if(results.response){
            if(results.response.entity === 'Exit'){
                session.endConversation("Thanks for using. You can chat again by saying Hi");
            }
            else{
                switch(results.response.entity){
                    case "Uber Service":
                        session.beginDialog('/uber_source');
                        break;
                    case "Train Service":
                        session.beginDialog('/train');
                        break;
                    case "Help":
                        session.beginDialog('/help');
                        break;
                    case "Profile":
                        session.userData.en = undefined;
                        session.userData.name = undefined;
                        session.beginDialog('/profile');
                        break;
                    case "Developers":
                        session.beginDialog('/developers');
                        break;
                }
            }
        }
        else{
            session.endConversation("Invalid Response. You can call again by saying Hi");
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/main');
    }
]);

bot.dialog('/help',[
    function(session)
    {
        var introCard = new builder.HeroCard(session)
                .title("Trans Bot")
                .text("Your own transport assistant");
                // .images([
                    // builder.CardImage.create(session, "https://s24.postimg.org/jwjmzedid/dev.png")
                // ]);
        var msg = new builder.Message(session).attachments([introCard]);
        session.send(msg);
        introMessage.forEach(function(ms){
            session.send(ms);
        });
        session.endDialog();
    }
]);

bot.dialog('/profile', [
    function (session, args, next) {
        builder.Prompts.text(session, "What is your name?");
    },
    function (session, results, next) {
        if (results.response) {
            session.userData.name = results.response;
            session.send('Hi '+session.userData.name+", Welcome to TransBot");
        }
        session.replaceDialog('/main');
    }
]);


bot.dialog('/uber_source', [
    function (session,args,next) {
      builder.Prompts.text(session, 'Tell me the source location');
    },function (session, results, next){
      loc_api.get_location(results.response, session, results, next, function(session, results, next, final){
        var msg = "";
        for (var i = 0; i<final.length; i++){
            msg = msg + "|" + final[i]['name'];
        }
        if(final.length > 1){
            builder.Prompts.choice(session, "Please select the index of your desired address. Type <na> if your desired address is not in the list.", msg);
            session.userData.final = final;
            next();   
        }else if(final.length == 1){
            session.replaceDialog('/uber_source_confirm', final[0]);            
        }else{
            session.replaceDialog('/uber_source');
        }
      });  
    },function(session, results, next){
        if(results.response == "na" || results.response == "<na>" || results.response == "<Na>" || results.response == "Na" || results.response == "<NA>" || results.response == "NA"){
            session.send("Sorry, Please try again.");
            session.replaceDialog('/uber_source');
        }
        src_lat = session.userData.final[results.response-1]['lat'];
        src_long = session.userData.final[results.response-1]['long'];
        session.beginDialog('/uber_dest');
    }
]);

bot.dialog('/uber_source_confirm', [
    function (session,args) {
      session.userData.final = JSON.parse(JSON.stringify(args));
      builder.Prompts.text(session, "Is " + args.name + " your final destination ?" , "yes|no");
    },function (session, results, next){
      if (results.response == "yes" || results.response == "Yes" || results.response == "YES" || results.response == "yeah" || results.response == "YEAH"){
        src_lat = session.userData.final['lat'];
        src_long = session.userData.final['long'];        
        session.beginDialog('/uber_dest');
      } else{
        session.beginDialog('/uber_source');
      }   
    }
]);

bot.dialog('/uber_dest', [
    function (session,args,next) {
      builder.Prompts.text(session, 'Tell me the destination location');
    },function (session, results, next){
      loc_api.get_location(results.response, session, results, next, function(session, results, next, final){
        var msg = "";
        for (var i = 0; i<final.length; i++){
            msg = msg + "|" + final[i]['name'];
        }
        if(final.length > 1){
            builder.Prompts.choice(session, "Please select the index of your desired address. Type <na> if your desired address is not in the list.", msg);
            session.userData.final = final;
            next();   
        }else if(final.length == 1){
            session.replaceDialog('/uber_dest_confirm', final[0]);
        }else{
            session.replaceDialog('/uber_dest');
        }
      });  
    },function(session, results, next){
        if(results.response == "na" || results.response == "<na>" || results.response == "<Na>" || results.response == "Na" || results.response == "<NA>" || results.response == "NA"){
            session.send("Sorry, Please try again.");
            session.replaceDialog('/uber_dest');
        }
        dest_lat = session.userData.final[results.response-1]['lat'];
        dest_long = session.userData.final[results.response-1]['long'];
        session.beginDialog('/uber_ride_list');
    }
]);


bot.dialog('/uber_dest_confirm', [
    function (session,args,next) {
      builder.Prompts.text(session, "Is " + args['name'] + " your final destination ? (yes/no)");
      session.userData.final = args;  
    },function (session, results, next){
      if (results.response == "yes" || results.response == "Yes" || results.response == "YES" || results.response == "yeah" || results.response == "YEAH"){
        dest_lat = session.userData.final['lat'];
        dest_long = session.userData.final['long'];        
        session.beginDialog('/uber_ride_list');
      } else{
        session.beginDialog('/uber_dest');
      }   
    }
]);

bot.dialog('/uber_ride_list', [
    function (session,args,next) {
      session.send("Let me fetch you available options.");
        if(ride_list == undefined){
          uber_api.get_rides(src_lat, src_long, session, next, function(session, next, final){
            var msg = "";
            for (var i = 0; i<final.length; i++){
                if(msg != ""){
                	msg = msg + "|" + final[i]['name'] + ": " + final[i]['capacity'] + "capacity" + "\nDescription: " + final[i]['desc'];
                }else{
                	msg = final[i]['name'] + ": " + final[i]['capacity'] + "capacity" + "\nDescription: " + final[i]['desc'];
                }
            }
            ride_list = final;
            if(final.length > 1){
                builder.Prompts.choice(session, "Please select the index of your desired ride option.", msg);
                session.userData.ride = final;
                next();   
            }else if(final.length == 1){
                session.send("Only the following rides are available from your location.");
                session.beginDialog('/uber_fare_confirm', final);            
            }else{
                session.endDialog("No rides are available from your location. Please try again after sometime.");
            }
          });
        }else{
            var final = ride_list;
            var msg = "";
            for (var i = 0; i<final.length; i++){
    	 		if(msg != ""){
    	            msg = msg + "|" + final[i]['name'] + ": " + final[i]['capacity'] + "capacity" + "\nDescription: " + final[i]['desc'];
                }else{
                	msg = final[i]['name'] + ": " + final[i]['capacity'] + "capacity" + "\nDescription: " + final[i]['desc'];
                }
            }
            if(final.length > 1){
                builder.Prompts.choice(session, "Please select the index of your desired ride option.", msg);
                session.userData.ride = final;
                next();   
            }else if(final.length == 1){
                session.send("Only the following rides are available from your location.");
                session.beginDialog('/uber_fare_confirm', final[0]);            
            }else{
                session.endDialog("No rides are available from your location. Please try again after sometime.");
            }            
        }
    },function(session, results, next){
        console.log(results.response);
        session.beginDialog('/uber_fare_confirm', session.userData.ride[results.response.index]);            
    }
]);

bot.dialog('/uber_fare_confirm', [
    function (session, args, next) {
      session.send("Let me get you the estimated fare.");
      console.log("Estimated Fare");
      console.log(args);
      uber_api.get_fare(args, src_lat, src_long, dest_lat, dest_long, session, next, function(session, next, final){
        if(final != {}){
            args.src_lat = src_lat;
            args.src_long = src_long;
            args.dest_lat = dest_lat;
            args.dest_long = dest_long;
            args.fare_id = final.fare_id;
        	session.userData.booking = args
            builder.Prompts.text(session, "Your fare estimate is: " + final['fare'] + "\nYour journey distance is: " + final['distance'] + "\n Confirm Pickup? (yes/no)");      
        }else{
            session.send("Your destination was too far away/ Cabs are not available at the moment. Please start again");
            session.beginDialog('/main');
        }
      });
    },function(session, results, next){
        console.log(results.response);
        if(results.response == "yes" || results.response == "Yes" || results.response == "YES" || results.response == "yeah" || results.response == "YEAH"){
            uber_api.booking(session.userData.booking, session, results, next, function(session, results, next, final){
                if (final){
                	session.userData.booking = final;
                    session.beginDialog('/track_uber');
                }else{
                    session.endDialog("Your ride was cancelled by the driver due to some reason. Please try again. Sorry for any inconvenience :(");                   
                }
            });
        }else{
            builder.Prompts.text(session, "Would you like to choose another option? (yes/no)");
            next();
        }
    }, function(session, results, next){
        if (results.response == "yes" || results.response == "Yes" || results.response == "YES" || results.response == "yeah" || results.response == "YEAH"){
            session.userData.booking = undefined;
            session.userData.ride = undefined;
            session.beginDialog('/uber_ride_list');
        }else{
            session.endConversation("Thanks for using the service. Please start another session by saying hi.");
        }
    }    
]);

bot.dialog('/track_uber', [
    function(session, args, next){
        uber_api.track(session, next, "accepted", function(session, next, final){
	        session.send("Please wait. We are finding your uber");
        	console.log("FINAL");
        	console.log(final);
        	uber_api.track(session, next, "arriving", function(session, next, final1){
        		console.log("FINAL1");
        		console.log(final1);
	        	session.send("Booked!. Your Uber is arriving");
	            if(final1.driver.name == null){
	            	final1.driver.name = "Ashish"
	            }
	            if(final1.driver.phone_number == null){
	            	final1.driver.phone_number = "9999999999"
	            }
	            if(final1.driver.picture_url == null){
	            	final1.driver.picture_url = "http://wanderlustandlipstick.com/wp-content/uploads/2007/11/sixt_driver1.jpg"
	            }
	            if(final1.vehicle.make == null){
	            	final1.vehicle.make = "Toyota"
	            }
	            if(final1.vehicle.model == null){
	            	final1.vehicle.model = "Prius"
	            }
	            var introCard1 = new builder.HeroCard(session)
                .title(final1.driver.name + "(" + final1.driver.phone_number + ")")
                .text(final1.vehicle.make + " " + final1.vehicle.model)
                .images([
                    builder.CardImage.create(session, final1.driver.picture_url)
                ]);
	            var msg = new builder.Message(session).attachments([introCard1]);
	            session.send(msg);
	            session.endConversation("Thank you for visiting. Have a safe and sound journey. :)")
        	});
        });
    }
]);

bot.dialog('/train', [
    function (session,args) {  
      builder.Prompts.choice(session, "Choose one of the following services:", "PNR_Status|Train_Running_Status");
    },function (session, results, next){
      console.log(results.response.index);
      if (results.response.index == 0){
        session.beginDialog('/pnr');
      } else{
        session.beginDialog('/run_stat');
      }   
    }
]);

bot.dialog('/pnr', [
    function (session,args) {  
      builder.Prompts.text(session, "Enter Your pnr number:");
    },function (session, results, next){
      train.pnr_status(results.response, session, results, next, function(session, results, next, final){
      	if(final.length == 0){
      		session.endConversation("Wrong Pnr Number or status unavailable. Please try again.");
      		// session.replaceDialog('/pnr');
      	}else{
      		for(var i = 0; i<final.length; i++){
      			session.send("Status " + i + ":" + final[i]);
      		}
      		session.endConversation("Thank you. You can start a new conversation by typing hi.");
      	}
      });	
    }
]);

bot.dialog('/run_stat', [
    function (session,args) {  
      builder.Prompts.text(session, "Enter Your train number:");
    },function (session, results, next){
      train.run_train(results.response, session, results, next, function(session, results, next, final){
		session.send(final);  	
		session.endConversation("Thank you. You can start a new conversation by typing hi.");  	
      });	
    }
]);

bot.dialog('/developers', [
    function (session) {
        session.send('The Developers are : \n1. Atishya Jain \n2. Shashwat Shivam \n3. Kabir Tomer \n4. Parth Dhar');
        session.replaceDialog('/main');
    }
]);

// Setup Restify Server
var restify = require('restify');
var server = restify.createServer();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended:true}));
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});


// Listen for messages from users 
server.post('/api/message', connector.listen());

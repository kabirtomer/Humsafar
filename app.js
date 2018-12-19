var builder = require('botbuilder');
var builder_cognitiveservices = require("botbuilder-cognitiveservices");
var azure = require('botbuilder-azure'); 
var request = require('request');
var bodyParser = require('body-parser');
var loc_api = require('./src/location');
var uber_api = require('./src/uber');

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

// var documentDbOptions = {
//     host: AZURE_DOCUMENT_DB_URI, 
//     masterKey: AZURE_DOCUMENT_DB_KEY, 
//     database: 'botdocs',   
//     collection: 'botdata'
// };

// var docDbClient = new azure.DocumentDbClient(documentDbOptions);
// var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);
var inMemoryStorage = new builder.MemoryBotStorage();

// var bot = new builder.UniversalBot(connector).set('storage', cosmosStorage);;
var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);;

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^(goodbye)|(bye)|(exit)|(end)|(quit)/i });
    
    
// bot.dialog('/', intents);
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

// bot.dialog('/bot', [
//     function(session, args, next){
//         intelligence.classify(session.message.text, function(data){
//             session.beginDialog(String(data));
//         });
//     },
//     function(session, args, next){
//         session.replaceDialog('/bot');
//     } 
// ]);

// intents.matches('main','/main');
// intents.matches('profile', '/profile');
bot.beginDialogAction('help', '/help', { matches: /^help/i });
bot.dialog('end', function (session, args, next) {
    session.endDialog("Thank You. Please type hi to start conversation.");
})
.triggerAction({
    matches: /^exit$/i,
});
// bot.beginDialogAction('end', '/end', { matches: /^help/i });
// intents.matches('developers','/developers');
// intents.matches('repeat', '/repeat');

// intents.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));

/*
bot.dialog('/',[
    function(session)
    {
        console.log(session);
        session.endDialog("to be implemented");
    }
]);
*/

// bot.dialog('/bot', function(session){
//     session.beginDialog('/main');
// });

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
                session.endDialog("Thanks for using. You can chat again by saying Hi");
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
            session.endDialog("Invalid Response. You can call again by saying Hi");
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
            session.beginDialog('/uber_source_confirm', final[0]);            
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
      builder.Prompts.text(session, "Is " + args.name + " your final destination ? (yes/no)");
    },function (session, results, next){
      if (results.response == "yes"){
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
            session.beginDialog('/uber_dest_confirm', final[0]);            
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
      if (results.response == "yes"){
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
                msg = msg + "|" + final[i]['name'] + ": " + final[i]['capacity'] + "capacity" + "\nDescription: " + final[i]['desc'];
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
                session.endDialog("No rides are available from your location. Please try again after sometime by saying hi.");
            }
          });
        }else{
            var final = ride_list;
            var msg = "";
            for (var i = 0; i<final.length; i++){
                msg = msg + "|" + final[i]['name'] + ": " + final[i]['capacity'] + "capacity" + "\nDescription: " + final[i]['desc'];
            }
            if(final.length > 1){
                builder.Prompts.choice(session, "Please select the index of your desired ride option.", msg);
                session.userData.ride = final;
                next();   
            }else if(final.length == 1){
                session.send("Only the following rides are available from your location.");
                session.beginDialog('/uber_fare_confirm', final[0]);            
            }else{
                session.endDialog("No rides are available from your location. Please try again after sometime by saying hi.");
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
      uber_api.get_fare(args, src_lat, src_long, dest_lat, dest_long, session, next, function(session, next, final){
        if(final != {}){
            final.src_lat = src_lat;
            final.src_long = src_long;
            final.dest_lat = dest_lat;
            final.dest_long = dest_long;
            session.userData.booking = final;
            builder.Prompts.text(session, "Your fare estimate is: " + final['fare'] + "\nEstimated Time for Pickup: " + final['time_pickup'] + "\nYour journey distance is: " + final['distance'] + "\n Confirm Pickup? (yes/no)");      
        }else{
            session.send("Your destination was too far away. Please start again");
            session.beginDialog('/main');
        }
      });
    },function(session, results, next){
        console.log(results.response);
        if(results.response == "yes"){
            uber_api.booking(session.userData.booking, session, results, next, function(session, results, next, final){
                if (final){
                    session.beginDialog('/track_uber');
                }else{
                    session.endDialog("Your ride was cancelled by the driver due to some reason. Please try again. Sorry for any inconvenience :(");                   
                }
            });
        }else{
            builder.Prompts.text("Would you like to choose another option? (yes/no)");
            next();
        }
    }, function(session, results, next){
        if (results.response == "yes"){
            session.userData.booking = undefined;
            session.userData.ride = undefined;
            session.beginDialog('/uber_ride_list');
        }else{
            session.endDialog("Thanks for using the service. Please start anothe session by saying hi.");
        }
    }    
]);

bot.dialog('/track_uber', [
    function(session, args, next){
        var interval =  setInterval(function(session){
            uber_api.track(interval, session, function(inter, session, status){
                if(status == "yes"){
                    session.send("On way");
                }else{
                    clearInterval(inter);
                }
            });
        }, 10000);
    }
]);

bot.dialog('/train', [
    function (session,args) {  
      builder.Prompts.text(session, "Is " + args.name + " your final destination ? (yes/no)");
    },function (session, results, next){
      if (results.response == "yes"){
        src_lat = session.userData.final['lat'];
        src_long = session.userData.final['long'];        
        session.beginDialog('/uber_dest');
      } else{
        session.beginDialog('/uber_source');
      }   
    }
]);

bot.dialog('/developers', [
    function (session) {
        session.send('The Developers are : \n1. Atishya Jain \n2. Shashwat Shivam \n3. Kabir Tomer \n4. Parth Dhar');
        session.replaceDialog('/main');
    }
]);

// bot.dialog('/repeat', [
//     function (session) {
//         builder.Prompts.text(session, 'Hi! I repeat everything!');
//     },
//     function (session, results) {
//         session.send(results.response);
//         session.endDialog();
//     }
// ]);

// bot.dialog('/events',[
//     function(session,args)
//     {
//         events.get_events(function(result){
//             var attach = [];
//             result.forEach(function(ev){
//                 var card = new builder.ThumbnailCard(session)
//                             .title(ev.name)
//                             .subtitle(ev.start_time+" - "+ev.end_time)
//                             .tap(
//                                 builder.CardAction.openUrl(session,ev.link)
//                             );
//                 if(ev.cover){
//                     card = card.images([builder.CardImage.create(session,ev.cover)]);
//                 }
//                 attach.push(card);
//             });
//             var msg = new builder.Message(session)
//                     .attachmentLayout(builder.AttachmentLayout.carousel)
//                     .attachments(attach);
//             session.replaceDialog('/main');
//             // session.endDialog(msg);
//         });
//     }
// ]);

// bot.dialog('/exam',[
//     function(session){
//         if(EXAMS_RELEASED==false){
//             session.endDialog("Exam Schedule not yet updated!\nCheck after schedule has been released");
//         }
//         else{
//             builder.Prompts.choice(session,"Select exam","Minor1|Minor2|Major");
//         }
//     },
//     function(session,results)
//     {
//         if((["MINOR1","MINOR2","MAJOR"]).includes(results.response.entity.toUpperCase())){
//             if(!session.userData.en){
//                 session.beginDialog('/profile');
//             }
//             // var courses = schedule.courses(session.userData.en);
//             // if(courses){
//             session.userData.exam_type = results.response.entity;
//             var sch = schedule.exam_schedule(results.response.entity,session.userData.en);
//             if(sch !== undefined){
//                 if(sch.length === 0){
//                     var attach = [];
//                     attach.push(
//                         new builder.HeroCard(session)
//                             .title("Woohoo! No Exams :D")
//                             .subtitle("Have fun")
//                     );
//                     var msg = new builder.Message(session)
//                                     .attachments(attach);
//                 }
//                 else{
//                     //var week = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
//                     for(var day in sch){
//                         var attach = [];
//                         // var parts = sch[day][0].split("/");
//                         // var dt = new Date(parseInt(parts[2], 10),
//                         //                   parseInt(parts[1], 10) - 1,
//                         //                   parseInt(parts[0], 10));
//                         // session.send(dt.toDateString());
//                         session.send(sch[day].date);
//                         attach.push(
//                             new builder.HeroCard(session)
//                                 .title(sch[day].slot+"("+slot+")")
//                                 .subtitle(sch[day].code)
//                         );
//                         // for(var i=1;i<sch[day].length;i++){
//                         //     // var c = course.get_course(sch[day][i].course);
//                         //     // var slot = sch[day][i].slot;
//                         //     attach.push(
//                         //         new builder.HeroCard(session)
//                         //             .title(c.code+"("+slot+")")
//                         //             .subtitle(c.name)
//                         //     );
//                         // }
//                         var msg = new builder.Message(session)
//                                     .attachments(attach);
//                         session.send(msg);
//                     }
//                     // session.endDialog("All the Best for Exams");
//                     session.send("All the Best for Exams");
//                     session.replaceDialog('/main');
//                 }
//             }
//             else{
//                 // session.endDialog("Sorry, some error occurred");
//                 session.send("Sorry, some error occurred");
//                 session.replaceDialog('/main');
//             }
//         }
//         else{
//             // session.endDialog("You entered an invalid response");
//             session.send("You entered an invalid response");
//             session.replaceDialog('/main');
//         }
//     }
// ]);

// bot.dialog('/schedule',[
//     function(session,args,next) {
//         if(COURSES_RELEASED==false){
//             session.endDialog("Enjoy your Vacations !\nCheck after schedule has been released");
//         }
//         else{
//             session.dialogData.arrr = args;
//             if (!session.userData.en) {
//                 builder.Prompts.text(session, "What's your entry number?");
//             } else {
//                 next();
//             }
//         }
//     },
//     function(session,results){
//         var days = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
//         var day = undefined;
//         try{
//             var str = session.dialogData.arrr.entities[0].resolution.values[0].timex;
//             if(str.substr(0,9)==="XXXX-WXX-"){
//                 day = days[parseInt(str[9])];
//             }
//             else if(str.substr(0,4)==="XXXX"){
//                 day = new Date(Date.now()).getFullYear()+str.substr(4);
//                 day = days[new Date(str).getDay()];
//             }
//             else{
//                 day = days[new Date(str).getDay()];
//             }
//         } catch(e) {
//             day = undefined;
//         }
//         session.dialogData.arrr = undefined;

//         if (results.response) {
//             session.userData.en = results.response;
//         }
//         // var courses = schedule.courses(session.userData.en);
//         // if(courses !== undefined)
//         // {
//         var week = schedule.week_schedule(session.userData.en);
//         if(week !== undefined){
//             if(day === undefined)
//             {
//                 for(var i in week)
//                 {
//                     var attach = [];
//                     if(week[i] !== undefined)
//                     {
//                         for(var c in days)
//                         {
//                             attach.push(
//                                     new builder.ThumbnailCard(session)
//                                         .title(week[i].code)
//                                         .text(week[i].room+": "+week[i].schedule.days[c].start+"-"+week[i].schedule.days[c].end)
//                             );
//                         }
//                         var msg = new builder.Message(session)
//                             .textFormat(builder.TextFormat.markdown)
//                             .attachmentLayout(builder.AttachmentLayout.carousel)
//                             .attachments(attach);
//                         session.send(i);
//                         session.send(msg);
//                     }
//                 }
//             }
//             else
//             {
//                 if(["SUNDAY","SATURDAY"].includes(day))
//                 {
//                     session.send(day+" is a holiday!");
//                 }
//                 else
//                 {
//                     var attach = [];
//                     day = day.toUpperCase();
// 	                for (var j in week)
// 	                    if(week[j].schedule.days[day] !== undefined)
// 	                    {
// 	                        attach.push(
// 	                            new builder.ThumbnailCard(session)
// 	                                .title(week[j].code)
// 	                                .text(week[j].room+": "+ week[j].schedule.days[day].start+"-"+week[j].schedule.days[day].end)
// 	                            );
// 	                    }
//             	}
//                 var msg = new builder.Message(session)
//                         .attachments(attach);
//                 session.send(day);
//                 session.send(msg);
//  	       }
//         }    
//         else
//         {
//             session.userData.en = undefined;
//             session.send("Invalid entry number provided!");
//         }
//         session.replaceDialog('/main');
//         // session.endDialog();
//     }
// ]);

// bot.dialog('/course',[
//     function(session,args,next){
//         if(COURSES_RELEASED==false){
//             session.endDialog("Enjoy your Vacations !\nCheck after schedule has been released");
//         }
//         else{
//             var coursecode = undefined
//             try{
//                 coursecode = builder.EntityRecognizer.findEntity(args.entities, 'courseent');
//             }
//             catch(e){
//                 coursecode = undefined
//             }
//             if (!coursecode) {
//                 builder.Prompts.text(session,"Give me the course code");
//             } else {
//                 next({ response: coursecode.entity });
//             }
//         }
//     },
//     function(session,results) {
//         var c = course.get_course(results.response);
//         if(c === undefined) {
//             session.send("No such course code found!");
//         }
//         else {
//             session.send(course.pretty_course(c));
//         }
//         session.replaceDialog('/main');
//         // session.endDialog();
//     }
// ]);


// bot.dialog('/qna', [
//     function (session) {
//         builder.Prompts.text(session, 'Ask me anything!');
//     },
//     function (session, results) {
//         var postBody = '{"question":"' + results.response + '"}';
//         console.log(postBody)
//             request({
//                 url: "https://westus.api.cognitive.microsoft.com/qnamaker/v2.0/knowledgebases/"+QNA_KNOWLEDGE_ID+"/generateAnswer",
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Ocp-Apim-Subscription-Key': QNA_SUBSCRIPTION_KEY
//                 },
//                 body: postBody
//             },
//             function (error, response, body) {
//                 var result;
//                 result = JSON.parse(body);
//                 result = result.answers[0];
//                 if(result.score < 50){
//                     session.endDialog('Did not find a good answer for yout question :(')
//                 }
//                 else{
//                     session.endDialog(result.answer);
//                 }
//             }
//             );
//         session.endDialog();
//     }
// ]);

// bot.dialog('/messagePage', [
//     function (session) {
//     },
//     function (session, results) {
//         session.replaceDialog('/messagePage');
//     }
// ]);


// Setup Restify Server
var restify = require('restify');
var server = restify.createServer();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended:true}));
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});


// Listen for messages from users 
// server.get('/', verificationController);
// server.post('/message', messageWebhookController);
server.post('/api/message', connector.listen());

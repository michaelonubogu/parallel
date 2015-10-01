/**
 * Created by Namdascious.
 */
var express = require('express');
var http = require('http');
var url = require('url');
var path = require('path');
var openid = require('openid');
var nodemailer = require('nodemailer');
var uuid = require('uuid');
var fs = require('fs');
var _ = require('underscore');

var Firebase = require('firebase');
var FirebaseTokenGenerator = require("firebase-token-generator");
var giantbomb = require('../giantbomb');
var steam = require('../steam');
var config = require('../config');

//Express stuff (routing, server info, etc)
var app = express();
var router = express.Router();
var host = process.env.HOST;
var port = process.env.PORT || 1337;
//var fayePort = process.env.PORT || 8089;
var origin = '';

switch (config.appsettings.env) {
    case 'dev':
        origin = 'http://' + host + ':' + port;
        break;

    case 'test':
        origin = config.appsettings.testDomain;
        break;

    case 'prod':
        origin = config.appsettings.prodDomain;
        break;

    default:
        break;
}

var relyingParty = new openid.RelyingParty(
							origin + '/api/steam/authenticate/verify', // Verification URL (yours)
							origin, // Realm (optional, specifies realm for OpenID authentication)
							true, // Use stateless verification
							false, // Strict mode
							[]
); // List of extensions to enable and include

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.email.gmail.user,
        pass: config.email.gmail.password
    }
});


router.get('/', function (req, res) {
	res.send('respond with a resource');
});

router.get('/email/sendCommentEmail', function (req, res) {
    var requestid = req.query.requestid;
    var commenter = req.query.commenter;
    var creator = req.query.creator;
    var gametitle = req.query.gametitle;
    var system = req.query.system;
    
    var titlemessage = 'Someone commented on your request';
    var grammarfocus = 'your';
    var interestfocus = 'you are interested in'
    var subject = 'Someone commented on your gaming request';

    //Send email to the owner of the request
    var templateDir = config.appsettings.env === 'dev' ? './emailTemplates/commentRequestEmail.html' : '../emailTemplates/commentRequestEmail.html';
    var originalHtmlTemplate = fs.readFileSync(templateDir, "utf8");
    var requesturl = origin + '/#/request/' + requestid;
    
    //Gonna need to do some querying - Get the creator, then for each subscriber, get their user info, and send an email to them if they are subscribed
    var creatorRef = new Firebase(config.firebase.url + 'users');
    
    creatorRef
    .orderByChild('username')
    .equalTo(creator)
    .once('value', function (creatorSnapshot) {
        var creatorUserObj = creatorSnapshot.val();

        if (creatorUserObj !== null && creatorUserObj !== undefined) {

            var creatorEmail = null;
            var creatorUser = null;

            var creatorUserArray = _.map(creatorUserObj, function (userItem, userKey) { 
                return userItem;
            });
            
            if (creatorUserArray !== null && creatorUserArray !== undefined && creatorUserArray.length > 0) {
                creatorUser = creatorUserArray[0];
                creatorEmail = creatorUserArray[0].email;
            }

            //Send an email to the creator if (a) their email is verified & (b) they are not the commenter
            if (
                creatorEmail !== null && 
                creatorEmail !== undefined && 
                creatorUser !== null &&
                creatorUser !== undefined &&
                creatorUser.emailverified !== null && 
                creatorUser.emailverified !== undefined && 
                creatorUser.emailverified == true &&
                creator.trim() !== commenter.trim()) {

                //send email to creator
                var htmlTemplate = originalHtmlTemplate.slice(0); //get a copy of the template
                htmlTemplate = htmlTemplate.replace('{{addressee}}', creator);
                htmlTemplate = htmlTemplate.replace('{{titlemessage}}', titlemessage);
                htmlTemplate = htmlTemplate.replace('{{grammarfocus}}', grammarfocus);
                htmlTemplate = htmlTemplate.replace('{{interestfocus}}', ''); //interest focus is empty for the creator
                htmlTemplate = htmlTemplate.replace('{{commenter}}', commenter);
                htmlTemplate = htmlTemplate.replace('{{gametitle}}', gametitle);
                htmlTemplate = htmlTemplate.replace('{{system}}', system);
                htmlTemplate = htmlTemplate.replace('{{requesturl}}', requesturl);
                
                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: 'Parallel <' + config.email.gmail.user + '>', // sender address
                    to: creatorUser.email, // list of receivers
                    subject: subject, // Subject line
                    html: htmlTemplate // html body
                };
                
                // send mail with defined transport object
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);
                });
            }

            //Now we are going to make a call for each subscribed user, and send them an email one after the other
            var requestSubscribersRef = new Firebase(config.firebase.url + 'requests/' + requestid + '/subscribers');

            requestSubscribersRef.once('value', function (subsSnapshot) {
                var subscriberIds = subsSnapshot.val();

                if (subscriberIds !== null && subscriberIds !== undefined) {
                    var subscriberIdsArray = _.map(subscriberIds, function (sub, key) {
                        return sub.uid;
                    });

                    if (subscriberIdsArray !== null && subscriberIdsArray !== undefined && subscriberIdsArray.length > 0) {
                        //Get the user for each uid and send them an email - all except the commenter
                        _.each(subscriberIdsArray, function (subId) {

                            var userRef = new Firebase(config.firebase.url + 'users/' + subId);
                            userRef.once('value', function (userSnapshot) {
                                var user = userSnapshot.val();

                                if (
                                    user !== null && 
                                    user !== undefined &&
                                     user.username !== null && 
                                     user.username !== undefined && 
                                     user.email !== null && 
                                     user.email !== undefined && 
                                     user.emailverified !== null &&
                                     user.emailverified !== undefined &&
                                     user.emailverified == true &&
                                     user.username.trim() !== commenter.trim()) {
                                    
                                    //send the user an email
                                    var htmlTemplate = originalHtmlTemplate.slice(0); //get a copy of the template
                                    htmlTemplate = htmlTemplate.replace('{{addressee}}', user.username);
                                    htmlTemplate = htmlTemplate.replace('{{titlemessage}}', 'Someone commented on a request you are interested in');
                                    htmlTemplate = htmlTemplate.replace('{{grammarfocus}}', 'a');
                                    htmlTemplate = htmlTemplate.replace('{{interestfocus}}', 'you are interested in'); //interest focus is empty for the creator
                                    htmlTemplate = htmlTemplate.replace('{{commenter}}', commenter);
                                    htmlTemplate = htmlTemplate.replace('{{gametitle}}', gametitle);
                                    htmlTemplate = htmlTemplate.replace('{{system}}', system);
                                    htmlTemplate = htmlTemplate.replace('{{requesturl}}', requesturl);
                                    
                                    // setup e-mail data with unicode symbols
                                    var mailOptions = {
                                        from: 'Parallel <' + config.email.gmail.user + '>', // sender address
                                        to: user.email, // list of receivers
                                        subject: 'Someone commented on a gaming request you are interested in', // Subject line
                                        html: htmlTemplate // html body
                                    };
                                    
                                    // send mail with defined transport object
                                    transporter.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        console.log('Message sent: ' + info.response);
                                    });
                                }
                            });
                        });
                    }
                }
            });
        }
    });
    
    res.status(200).send('server reached');
    
});

router.get('/email/sendInviteRequest', function (req, res) {
    var requestid = req.query.requestid;
    var invitee = req.query.invitee;
    var gametitle = req.query.gametitle;
    var system = req.query.system;
    
    //Get the request
    var requestRef = new Firebase(config.firebase.url + 'requests/' + requestid);
    
    requestRef.once('value', function (requestSnapshot) {

        var request = requestSnapshot.val();
        
        if (request !== null && request !== undefined) {
            
            //Get the request creator
            var creatorRef = new Firebase(config.firebase.url + 'users/' + request.uid);
            creatorRef.once('value', function (creatorSnapshot) {

                var creator = creatorSnapshot.val();
                
                //Make sure their email is verified
                if (
                    creator !== null && 
                    creator !== undefined && 
                    creator.username !== null && 
                    creator.username !== undefined && 
                    creator.email !== null && 
                    creator.email !== undefined && 
                    creator.emailverified === true) {
                    
                    //Send email to the creator
                    var templateDir = config.appsettings.env === 'dev' ? './emailTemplates/inviteRequestEmail.html' : '../emailTemplates/inviteRequestEmail.html';
                    var htmlTemplate = fs.readFileSync(templateDir, "utf8");
                    var requesturl = origin + '/#/request/' + requestid;
                    
                    htmlTemplate = htmlTemplate.replace('{{creator}}', creator.username);
                    htmlTemplate = htmlTemplate.replace('{{inviteRequestor}}', invitee);
                    htmlTemplate = htmlTemplate.replace('{{gametitle}}', gametitle);
                    htmlTemplate = htmlTemplate.replace('{{system}}', system);
                    htmlTemplate = htmlTemplate.replace('{{requesturl}}', requesturl);
                    
                    // setup e-mail data with unicode symbols
                    var mailOptions = {
                        from: 'Parallel <' + config.email.gmail.user + '>', // sender address
                        to: creator.email, // list of receivers
                        subject: 'Response to your gaming request', // Subject line
                        html: htmlTemplate // html body
                    };
                    
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message sent: ' + info.response);
                    });
                }
            });
        }
    });

    res.status(200).send('server reached');
});

router.get('/verify', function (req, res) {
    var uid = req.query.uid;
    var userEmailRef = new Firebase(config.firebase.url +'users/' + uid + '/email');

    userEmailRef.once('value', function (snapshot) {
        var email = snapshot.val();

        if (email) {
            //create, save & send email token
            var token = uuid.v1();
            
            //Save confirm token for user
            userVerifyTokenRef = new Firebase(config.firebase.url + 'users/' + uid + '/verifytoken');
            userVerifyTokenRef.set(token, function (error) {
                if (error) {
                    //Send message to user/client - probably via faye
                    console.log('Synchronization failed');
                } else {
                    //Send verification email and success message to user/client
                    var templateDir = config.appsettings.env === 'dev' ? './emailTemplates/verifyEmail.html' : '../emailTemplates/verifyEmail.html';
                    var htmlTemplate = fs.readFileSync(templateDir, "utf8");
                    var verify_url = origin + '/api/confirm/' + token;
                    
                    htmlTemplate = htmlTemplate.replace('{{verify_url}}', verify_url);
                    htmlTemplate = htmlTemplate.replace('{{unsubscribe_url}}', verify_url);
                    
                    // setup e-mail data with unicode symbols
                    var mailOptions = {
                        from: 'Parallel <' + config.email.gmail.user + '>', // sender address
                        to: email, // list of receivers
                        subject: 'Verify your Parallel Account Email', // Subject line
                        html: htmlTemplate // html body
                    };
                    
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message sent: ' + info.response);

                        //send a faye notification to the client...
                        var faye_server = GLOBAL.faye_server;
                        
                        if (faye_server !== null && faye_server !== undefined) {
                            //Send confirmation to client
                            faye_server.getClient().publish('/verificationSent', 
			                {
                                emailSent: true
                            });
                        }
                    });
                }
            });
        }
    });

    res.status(200).send('server reached');
});

router.get('/confirm/:token', function (req, res) {
    var token = req.params.token;
    usersRef = new Firebase(config.firebase.url + 'users');
    
    //hack - save the response object to use and send response later
    GLOBAL.confirmResponse = res;

    usersRef
        .orderByChild('verifytoken')
        .equalTo(token)
        .once('value', function (snapshot) {
            var user = snapshot.val();
            var confirmResponse = GLOBAL.confirmResponse;

            if (user && !user.emailverified) {
                var userKey = _.map(user, function (obj, key) { return key; });

                if (userKey && userKey.length > 0) {
                    var firebaseUrl = config.firebase.url + 'users/' + userKey[0] + '/emailverified';
                    var userItemRef = new Firebase(firebaseUrl);
                    userItemRef.set(true);
                
                    //send verification success page
                    if (confirmResponse !== null && confirmResponse !== undefined) {
                        confirmResponse.sendFile(path.join(__dirname, '../public', 'confirm.html'));
                    }
                }
            }
            else {
                if (confirmResponse !== null && confirmResponse !== undefined) {
                    //send message to client about not being able to confirm
                    confirmResponse.sendFile(path.join(__dirname, '../public', 'index.html'));
                }
            }
        });
});

router.get('/steam/authenticate', function (req, res) {
	
	var identifier = config.steam.provider;

	relyingParty.authenticate(identifier, false, function (error, authUrl) {
		if (error) {
			res.writeHead(200);
			res.end('Authentication failed: ' + error.message);
		}
		else if (!authUrl) {
			res.writeHead(200);
			res.end('Authentication failed');
		}
		else {
			res.status(200).send({ 'url' : authUrl });
		}
	});
});

router.get('/steam/authenticate/verify', function (req, res) {
    console.log('DING: Steam Authenticate Route Hit');
	relyingParty.verifyAssertion(req, function (error, result) {
		
		var urlObj = url.parse(result.claimedIdentifier);
		var pathArray = urlObj.pathname.split('/');
		
		if (pathArray !== null && pathArray !== undefined && pathArray.length > 0) {
            var steamid = pathArray[(pathArray.length - 1)];
            
            //Get the user profile from steam
            steam.getSteamUser(steamid)
            .then(function (data) {
                var steamData = JSON.parse(data);              
                if (
                    steamData !== null && steamData !== undefined && steamData.response !== null && steamData.response !== undefined && steamData.response.players !== null &&
                    steamData.response.players !== undefined && steamData.response.players.length > 0
                    ) {
                    var steamUser = steamData.response.players[0];

                    //Generate a firebase token for our steam auth user info
                    var tokenGenerator = new FirebaseTokenGenerator(config.firebase.secret);
                    var token = tokenGenerator.createToken({ uid: "steam:" + steamid });
                    
                    var faye_server = GLOBAL.faye_server;
                    
                    if (faye_server !== null && faye_server !== undefined) {
                        //Send token to the client
                        faye_server.getClient().publish('/steamSuccess', 
			            {
                            pageName: 'sign-in.html',
                            steamid: steamid,
                            steam: steamUser,
                            token: token
                        });
                    }
                }
            }, function (err) {

            });
		}
	});
});

router.get('/giantbomb/search', function (req, res) {
    console.log('DING: Giantbomb Search Route Hit');
	giantbomb.getGames(req.query.search, req.query.limit)
	.then(function (data) {
		res.send(data);
	}, function (err) {
		console.error("%s; %s", err.message, url);
		//console.log("%j", err.res.statusCode);
	});
});

module.exports = router;
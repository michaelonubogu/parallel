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
                    var htmlTemplate = fs.readFileSync('./emailTemplates/verifyEmail.html', "utf8");
                    var verify_url = origin + '/api/confirm/' + token;
                    
                    htmlTemplate = htmlTemplate.replace('{{verify_url}}', verify_url);
                    htmlTemplate = htmlTemplate.replace('{{unsubscribe_url}}', verify_url);
                    
                    // setup e-mail data with unicode symbols
                    var mailOptions = {
                        from: config.email.gmail.user, // sender address
                        to: email, // list of receivers
                        subject: 'Verify your Parallel Account Email', // Subject line
                        html: verify_url // html body
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
});

router.get('/confirm/:token', function (req, res) { 
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
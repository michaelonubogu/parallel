/**
 * Created by Namdascious.
 */
var express = require('express');
var http = require('http');
var url = require('url');
var path = require('path');
var openid = require('openid');
var faye = require('faye');
var FirebaseTokenGenerator = require("firebase-token-generator");
var giantbomb = require('../giantbomb');
var config = require('../config');

//Express stuff (routing, server info, etc)
var app = express();
var router = express.Router();
var host = process.env.HOST;
var port = process.env.PORT || 1337;
var origin = ''

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

//Faye websocket init
var server = http.createServer();
var faye_server = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
console.log('Firing up faye server. . . ');
faye_server.attach(server);
server.listen(8089);
//server.listen(8089);

var relyingParty = new openid.RelyingParty(
							origin + '/api/steam/authenticate/verify', // Verification URL (yours)
							origin, // Realm (optional, specifies realm for OpenID authentication)
							true, // Use stateless verification
							false, // Strict mode
							[]
); // List of extensions to enable and include


router.get('/', function (req, res) {
	res.send('respond with a resource');
});

//router.get('/request/:id', function (req, res) {
//	var filePath = path.join(__dirname, "/../public");
//	//res.send({ 'requestid' : req.params.id });
//	res.sendFile(filePath + '/request.html');	//Send the home page - we have logic to route there.
//});

//router.get('/game/:id', function (req, res) {
//	var filePath = path.join(__dirname, "/../public");
//	//res.send({ 'gameid' : req.params.id });
//	res.sendFile(filePath + '/game.html');
//});

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
	relyingParty.verifyAssertion(req, function (error, result) {
		
		var urlObj = url.parse(result.claimedIdentifier);
		var pathArray = urlObj.pathname.split('/');
		
		if (pathArray !== null && pathArray !== undefined && pathArray.length > 0) {
			var steamid = pathArray[(pathArray.length - 1)];
			
			//Generate a firebase token for our steam auth user info
			var tokenGenerator = new FirebaseTokenGenerator(config.firebase.secret);
			var token = tokenGenerator.createToken({ uid: "steam:" + steamid  });
			
			//Send token to the client
			faye_server.getClient().publish('/steamSuccess', 
			{
				pageName: 'sign-in.html',
				steamid: steamid,
				token: token
			});
		}
	});
});

router.get('/giantbomb/search', function (req, res) {
	giantbomb.getGames(req.query.search, req.query.limit)
	.then(function (data) {
		res.send(data);
	}, function (err) {
		console.error("%s; %s", err.message, url);
		console.log("%j", err.res.statusCode);
	});
});

module.exports = router;
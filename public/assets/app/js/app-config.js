/**
 * Created by Namdascious on 6/3/2015...
 */
(function(){
	$(document).ready(function () {
		//Config & Util Settings
		var lfg = window.lfg !== null && window.lfg !== undefined ? window.lfg : {};
		var config = {
            appDevUrl: 'http://localhost:1337',
            appTestUrl: 'http://parallel-test.azurewebsites.net/',
            appProdUrl: 'http://www.parallel.team/',
            fayeDevUrl: 'http://localhost:1337/faye',
            fayeTestUrl: 'http://parallel-test.azurewebsites.net/faye',
            fayeProdUrl: 'http://www.parallel.team/faye',
            env: 'prod',
			apiEndPoints: {
				games: 'api/giantbomb/games',
				game: 'api/giantbomb/game',
				platforms: 'api/giantbomb/platform',
				search: 'api/giantbomb/search',
                steamlogin: 'api/steam/authenticate',
                verifyEmail : 'api/verify',
                inviteRequest: 'api/email/sendInviteRequest',
                commentEmail: 'api/email/sendCommentEmail'
			},
			firebaseUrl: 'https://lfgbase.firebaseio.com/',
			firebaseEntities: {
				requests: 'requests',
				games: 'games',
				users: 'users'
			},
            firebaseCacheKey: 'firebase:session::lfgbase',
            firebaseAuthCallbacks:[],
			tunneling: false,
            tempSecureTunnel: 'http://1d4b1d75.ngrok.io',   
            
            detachAllAuthCallbacks: function (){
                var ref = new Firebase(this.getFirebaseUrl());
                var config = this;
                var arrClone = config.firebaseAuthCallbacks.slice(0);
                
                for (i = 0; i <= arrClone.length - 1; i++) {
                    var funcCallback = arrClone[i];
                    if (funcCallback !== null && funcCallback !== undefined) {
                        ref.offAuth(funcCallback);
                        config.firebaseAuthCallbacks.splice(config.firebaseAuthCallbacks.indexOf(funcCallback), 1);
                    }
                }
            },
                    
            getAppUrl: function (){
                switch (this.env) {
                    case 'dev':
                        return this.appDevUrl;
                        break;

                    case 'test':
                        return this.appTestUrl;
                        break;

                    case 'prod':
                        return this.appProdUrl;
                        break;
                }
            },

			getFirebaseUrl: function () {
				return this.firebaseUrl;
			},
			
            getGiantBombUrl: function (entity) {
                var url = '';
                switch (this.env) {
                    case 'dev':
                        url = this.appDevUrl;
                        break;

                    case 'test':
                        url = this.appTestUrl;
                        break;

                    case 'prod':
                        url = this.appProdUrl;
                        break;

                    default:
                        break;
                }
                
                if(url[url.length - 1] !== '/'){ url += '/'; }

				switch (entity) {
					case this.apiEndPoints.games:
						return url + this.apiEndPoints.games;
						break;

					case this.apiEndPoints.game:
						return url + this.apiEndPoints.game;
						break;

					case this.apiEndPoints.platforms:
						return url + this.apiEndPoints.platforms;
						break;

					case this.apiEndPoints.search:
						return url + this.apiEndPoints.search;
						break;
				}
			},
			
            getSteamVerifyUrl: function () {
                var url = '';
                switch (this.env) {
                    case 'dev':
                        url =  this.appDevUrl;
                        break;

                    case 'test':
                        url =  this.appTestUrl;
                        break;

                    case 'prod':
                        url =  this.appProdUrl;
                        break;

                    default:
                        break;
                }
                
                if (url[url.length - 1] !== '/') { url += '/'; }

				return url + this.apiEndPoints.steamlogin;
            },

            getVerifyEmailUrl: function (){
                var url = '';
                switch (this.env) {
                    case 'dev':
                        url = this.appDevUrl;
                        break;

                    case 'test':
                        url = this.appTestUrl;
                        break;

                    case 'prod':
                        url = this.appProdUrl;
                        break;

                    default:
                        break;
                }
                
                if (url[url.length - 1] !== '/') { url += '/'; }
                return url + this.apiEndPoints.verifyEmail;
            },

            getInviteRequestUrl: function (){
                var url = '';
                switch (this.env) {
                    case 'dev':
                        url = this.appDevUrl;
                        break;

                    case 'test':
                        url = this.appTestUrl;
                        break;

                    case 'prod':
                        url = this.appProdUrl;
                        break;

                    default:
                        break;
                }
                
                if (url[url.length - 1] !== '/') { url += '/'; }
                return url + this.apiEndPoints.inviteRequest;
            },

            getCommentEmailUrl: function (){
                var url = '';
                switch (this.env) {
                    case 'dev':
                        url = this.appDevUrl;
                        break;

                    case 'test':
                        url = this.appTestUrl;
                        break;

                    case 'prod':
                        url = this.appProdUrl;
                        break;

                    default:
                        break;
                }
                
                if (url[url.length - 1] !== '/') { url += '/'; }
                return url + this.apiEndPoints.commentEmail;
            }
		};
		
		var utils = {
			/*This is used for lexicographical ordering of a date for firebase. Since javascript stores dates as numbers,
				 * and firebase doesn't order in  chronologic descending order, if I wanted to order any field in 
				 * chronologic descending order, I would need to make it so that the higher the time value, the smaller the 
				 * chronologic order. Since time is ever increasing, If I swap the highest possible digit in a time value (9) for the
				 * lowest possible letter in the alphabet (a), I could then create this ordering
				 * 
				 * I could probably do this without the array just using ascii code conversions, but at this time, this was just easier
				 * */
				indexMapping: [
				{ char: '0', value : 'j' },
				{ char: '1', value : 'i' },
				{ char: '2', value : 'h' },
				{ char: '3', value : 'g' },
				{ char: '4', value : 'f' },
				{ char: '5', value : 'e' },
				{ char: '6', value : 'd' },
				{ char: '7', value : 'c' },
				{ char: '8', value : 'b' },
				{ char: '9', value : 'a' },
            ],
            
            automaticSignin: function () {
                //Check if the user is logged in on the server
                var utils = this;
                var loggedIn = utils.isLoggedIn();

                if (loggedIn) {
                    //set auth token
                    window.lfg.utils.setAuthToken(authData);
                    var userRef = new Firebase(window.lfg.config.getFirebaseUrl() + 'users/' + authData.uid);
                    
                    //Get the user profile info. If none exists, redirect to Onboarding process...
                    userRef
					    .once('value', function (snapshot) {
                        var user = snapshot.val();          
                            //redirect to user setup page
                            if (user === null || user === undefined || user.setupcomplete === null || user.setupcomplete === undefined || user.setupcomplete === '' || user.setupcomplete === false) {
                                document.querySelector('app-router').go('/setup');
                            }
                        });
                }
                else {
                    //redirect to sign in..
                    document.querySelector('app-router').go('/login');
                }
                
                return false;
            },
            
			checkEmail: function (email) {
				var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
				if (reg.test(email)) {
					return true;
				}
				else {
					return false;
				}
            },
            
            convertDateToISO: function (date){
                return date.toISOString();
            },
			
			convertDateToUtc: function (date) {
				//return Math.round((date).getTime() / 1000);
                return (0 - date);
			},
			
			convertUtcToLocalDate: function (utcSeconds) {
                var tz = jstz.determine();
                var tz_name = tz.name();
                var utcDate = new Date(utcSeconds);
                var date = moment.tz(utcDate, tz_name).toDate();
                return date;
			},
			
            convertUtcToLocal: function (utcDate) {
                var tz = jstz.determine();
                var tz_name = tz.name();
                var utcDate = new Date(utcSeconds);
                var date = moment.tz(utcDate, tz_name).toDate();
                return date.toDate().toString('MMM dd, yyyy h:mm tt');
			},
			
			convertToBase64: function (imageUrl) {
				var image = new Image();
				var canvas = document.createElement('canvas');
				var context = canvas.getContext('2d');
				
				image.src = imageUrl;
				context.drawImage(image, 0, 0);
				return canvas.toDataURL();
			},
			
			clearWhiteSpace: function (str) {
				var re = / /g;
				return str.toString().replace(re, '');
            },
            
            deleteAuthToken: function () {
                sessionStorage.removeItem(config.firebaseCacheKey);
                localStorage.removeItem(config.firebaseCacheKey);
            },
			
			getSearchIndex: function (string) {
				var ascii = '';
				var index = '';
				string = this.clearWhiteSpace(string);
				
				for (var i = 0; i < string.length; i++) {
					ascii += string.charCodeAt(i).toString();
				}
				
				for (var j = 0; j < ascii.length; j++) {
					index += this.getIndexSwap(ascii[j]);
				}
				
				return index;
			},
			
			getIndexSwap: function (char) {
				for (var i = 0; i < this.indexMapping.length; i++) {
					if (this.indexMapping[i].char === char) {
						return this.indexMapping[i].value;
					}
				}
            },
            
            getAbsolutePosition: function (element){
                var rect = element.getBoundingClientRect();
                console.log(rect.top, rect.right, rect.bottom, rect.left);
                return rect;
            },
            
            getEditableDivCaretPosition: function (){
                //Another serious hack :|
                //Gets the index position of the cursor relative to the text of the currently-editing content editable div
                if (window.getSelection) {
                    var selection = window.getSelection();
                    if (selection) {
                        if (selection.getRangeAt) { // Mozilla
                            if (selection.rangeCount >= 1) {
                                var range = selection.getRangeAt(0);
                                return range.startOffset;
                                //alert(range.startContainer + ' | ' + range.startOffset);
                            }
                        } else if (selection.focusNode) { // Webkit
                            return selection.focusOffset;
                            //alert(selection.startContainer + ' | ' + selection.startOffset);
                        }
                    }
                }
            },

            getAuthData: function () {
                var authJSON = sessionStorage.getItem(config.firebaseCacheKey);
                var authData = JSON.parse(authJSON);
                
                if (authData == null || authData == undefined) {
                    var localJSON = localStorage.getItem(config.firebaseCacheKey);
                    authData = JSON.parse(localJSON);
                }
                
                if (authData == null || authData == undefined) {
                    var ref = new Firebase(config.getFirebaseUrl());
                    authData = ref.getAuth();
                }
                
                return authData !== null && authData !== undefined ? authData : null;
            },
			
			getUser: function () {
				var authJSON = sessionStorage.getItem(config.firebaseCacheKey);
				var authData = JSON.parse(authJSON);
				
				if (authData == null || authData == undefined) {
					var localJSON = localStorage.getItem(config.firebaseCacheKey);
					authData = JSON.parse(localJSON);
                }
                
                if (authData == null || authData == undefined) {
                    var ref = new Firebase(config.getFirebaseUrl());
                    authData = ref.getAuth();
                }
                
                //Set the token on the client if it exists in firebase - this shouldnt happen though I think :\
                if (authData !== null && authData !== undefined) {
                    this.setAuthToken(authData);
                }

				return authData !== null && authData !== undefined && authData.uid !== null && authData.uid !== undefined && authData.uid !== '' ? authData.uid : null;
            },
            
            getQueryStringParam: function (name, url) {
                if (!url) {
                    url = window.location.href;
                }
                var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
                if (!results) {
                    return null;
                }
                return results[1] || null;
            },
            
            getSharableRequestListUrl: function (game, system) {
                if (game !== null && game !== undefined && game !== '' && system !== null && system !== undefined && system !== '') {
                    return window.location.protocol + '//' + window.location.host + '/#/requests?game=' + encodeURIComponent(window.lfg.utils.clearWhiteSpace(game).replace(/&amp;/g, "&")) + '&system=' + system;
                }
                else if (game !== null && game !== undefined && game !== '') {
                    return window.location.protocol + '//' + window.location.host + '/#/requests?game=' + encodeURIComponent(window.lfg.utils.clearWhiteSpace(game).replace(/&amp;/g, "&"));
                }
                else if (system !== null && system !== undefined && system !== ''){
                    return window.location.protocol + '//' + window.location.host + '/#/requests?system=' + system;
                }
                else {
                    return window.location.protocol + '//' + window.location.host + '/#/requests';
                }
                return null;
            },
            
            getSharableRequestUrl: function (id){
                return window.location.protocol + '//' + window.location.host + '/#/request/' + id;
            },
            
            isFileAnImage: function (blob) {
                var int32View = new Uint8Array(blob);
                var isValid = false;
                
                //verify the magic number
                // for JPG is 0xFF 0xD8 0xFF 0xE0 (see https://en.wikipedia.org/wiki/List_of_file_signatures)
                
                //JPEG
                if (int32View.length > 4 && int32View[0] == 0xFF && int32View[1] == 0xD8 && int32View[2] == 0xFF && int32View[3] == 0xE0) {
                    isValid = true;
                }
                
                //GIF 87a
                if (int32View.length > 4 && int32View[0] == 0x47 && int32View[1] == 0x49 && int32View[2] == 0x46 && int32View[3] == 0x38 && int32View[4] == 0x37 && int32View[5] == 0x61) {
                    isValid = true;
                }
                
                //GIF 89a
                if (int32View.length > 4 && int32View[0] == 0x47 && int32View[1] == 0x49 && int32View[2] == 0x46 && int32View[3] == 0x38 && int32View[4] == 0x39 && int32View[5] == 0x61) {
                    isValid = true;
                }
                
                //PNG
                if (int32View.length > 4 && int32View[0] == 0x89 && int32View[1] == 0x50 && int32View[2] == 0x4E && int32View[3] == 0x47 && int32View[4] == 0x0D && int32View[5] == 0x0A && int32View[6] == 0x1A && int32View[7] == 0x0A) {
                    isValid = true;
                }
                
                return isValid;
            },
			
            isLoggedIn: function () {
                //Check the client first - session storage
                var utils = this;
                var loggedIn = true;

                //db session check
                var ref = new Firebase(config.getFirebaseUrl());
                authData = ref.getAuth();
                
                if (authData == null || authData == undefined) {
                    loggedIn = false;
                }
                else {
                    utils.setAuthToken(authData);
                }

				//return (authData !== null && authData !== undefined);
                return loggedIn;
            },
            
            logOut: function () {
                var ref = new Firebase(config.getFirebaseUrl());
                ref.unauth();
                this.deleteAuthToken();
            },
			
			postToFacebook: function (options) {
				var href = '';
				if (config.tunneling === true) {
					href = config.tempSecureTunnel + '/#/request/' + options.entityId
				}
				else {
					href = window.location.protocol + '//' + window.location.host + '/#/request/' + options.entityId
				}

				FB.ui(
					{
						method: 'feed',
						name: 'Gaming Request for ' + options.gametitle + ' on ' + options.system,
						link: href,
						description: options.description,
						picture: options.photo
					}, function (response) { });
            },
            
            randomShortString: function (count){
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                
                for (var i = 0; i < count; i++)
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                return text;
            },
            
            setAuthToken: function (authData) {
                
                var localJSON = localStorage.getItem(config.firebaseCacheKey);
                var authJSON = sessionStorage.getItem(config.firebaseCacheKey);
                
                if (localJSON === null || localJSON === undefined) {
                    localStorage.setItem(config.firebaseCacheKey, JSON.stringify(authData));
                }
                
                if (authJSON === null || authJSON === undefined) {
                    sessionStorage.setItem(config.firebaseCacheKey, JSON.stringify(authData));
                }
            },
            
            sendVerificationEmail: function (){
                var uid = this.getUser();
                if (uid) {
                    //Call verification email server route
                    url = config.getVerifyEmailUrl();

                    $.ajax({
                        url: url,
                        type: 'GET',
                        cache: false,
                        data: { uid: uid },
                        dataType: 'json',
                        success: function (data) { 
                            console.log('Server contacted');
                        }
                    });
                }
            },
			
			tweetOnTwitter: function (options) {
				//Get app url
				var href = '';
				if (config.tunneling === true) {
					href = config.tempSecureTunnel + '/#/request/' + options.entityId
				}
				else {
					href = window.location.protocol + '//' + window.location.host + '/#/request/' + options.entityId
				}
				
				options.message += ('%20' + encodeURIComponent(href));
				
				var url = 'https://twitter.com/intent/tweet?text=' + options.message;

				window.open(
					url,
							'_blank' // <- This is what makes it open in a new window.
				);
			},

			timeSince: function(date) {
				return jQuery.timeago(date);
			}

		}
		
		lfg.config = config;
		lfg.utils = utils;
		window.lfg = lfg;
	});
})();
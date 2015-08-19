/**
 * Created by Namdascious on 6/3/2015.
 */
(function(){
  //  document.onreadystatechange = function(){
  //      var state = document.readyState;

		//if (state === 'complete') {
			
			
  //      }
  //  }

	$(document).ready(function () {
		//Config & Util Settings
		var lfg = window.lfg !== null && window.lfg !== undefined ? window.lfg : {};
		var config = {
            appDevUrl: 'http://localhost:1337',
            appTestUrl: 'https://parallel-test.herokuapp.com/',
            appProdUrl: '',
            fayeDevUrl: 'http://localhost:1337/faye',
            fayeTestUrl: 'https://parallel-test.herokuapp.com/faye',
            fayeProdUrl: '',
            env: 'test',
			apiEndPoints: {
				games: 'api/giantbomb/games',
				game: 'api/giantbomb/game',
				platforms: 'api/giantbomb/platform',
				search: 'api/giantbomb/search',
				steamlogin: 'api/steam/authenticate'
			},
			firebaseUrl: 'https://lfgbase.firebaseio.com/',
			firebaseEntities: {
				requests: 'requests',
				games: 'games',
				users: 'users'
			},
			firebaseCacheKey: 'firebase:session::lfgbase',
			tunneling: false,
			tempSecureTunnel: 'http://fb40516a.ngrok.io',
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
                var ref = new Firebase(window.lfg.config.getFirebaseUrl());
                authData = ref.getAuth();
                
                if (authData !== null && authData !== undefined) {
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
			
			convertDateToUtc: function (date) {
				return Date.UTC(
					date.getFullYear(),
						date.getMonth(),
						date.getDate(),
						date.getHours(),
						date.getMinutes(),
						date.getSeconds()
				);
			},
			
			convertUtcToLocalDate: function (utcDate) {
				var date = new Date(utcDate);
				return date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
			},
			
			convertUtcToLocal: function (utcDate) {
				var date = new Date(utcDate);
				date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
				return date.toString('MMM dd, yyyy h:mm tt');
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
			
            isLoggedIn: function () {
                //Check the client first - session storage
                var loggedIn = true;
				var authJSON = sessionStorage.getItem(config.firebaseCacheKey);
				var authData = JSON.parse(authJSON);
                
                //local storage check
				if (authData == null || authData == undefined) {
					var localJSON = localStorage.getItem(config.firebaseCacheKey);
					authData = JSON.parse(localJSON);
                }
                
                //db session check
                if (authData == null || authData == undefined) {
                    var ref = new Firebase(config.getFirebaseUrl());
                    authData = ref.getAuth();
                }
                
                if (authData == null || authData == undefined) {
                    loggedIn = false;
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
            
            setAuthToken: function (authData) {
                var jsonAuthData = JSON.stringify(authData);

                sessionStorage.setItem(config.firebaseCacheKey, jsonAuthData);
                localStorage.setItem(config.firebaseCacheKey, jsonAuthData);
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
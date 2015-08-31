/**
 * Created by Namdascious.
 */
var rp = require('request-promise');
var _ = require('underscore');
var config = require('./config.js');

var steam_interface = {
	news: 'ISteamNews',
	user: 'ISteamUser',
	userStats: 'ISteamUserStats'
};

var steam_version = 'v0002';

var steam_methods = [
	{ name: 'getPlayerSummaries', method: { name: 'GetPlayerSummaries', version: 'v0002' } },
	{ name: 'getFriendList', method: { name: 'GetFriendList', version: 'v0001' } },
	{ name: 'getPlayerAchievements', method: { method: 'GetPlayerAchievements', version: 'v0001' } },
	{ name: 'getUserStatsForGame', method: { name: 'GetUserStatsForGame', version: 'v0002' } },
	{ name: 'getOwnedGames', method: { name: 'GetOwnedGames', version: 'v0001' } },
	{ name: 'getRecentlyPlayedGames', method: { name: 'GetRecentlyPlayedGames', version: 'v0001' } },
	{ name: 'isPlayingSharedGame', method: { name: 'IsPlayingSharedGame', version: 'v0001' } }
];

var steam_formats = {
	json : 'json',
	xml: 'xml'
};

var steam = {
	getSteamUser : function (userid) {
		
		var steam_method = _.findWhere(steam_methods, { name: "getPlayerSummaries" });

		var steam_api_url = config.steam.api_url
							.replace('<interface_name>', steam_interface.user)
							.replace('<method_name>', steam_method.method.name)
							.replace('<version>', steam_method.method.version)
							.replace('<api_key>', config.steam.api_key)
							.replace('<format>', steam_formats.json);
		return rp(steam_api_url + '&steamids=' + userid);
	},

	getSteamUserStats : function () {
	},

	getSteamNews : function () {
	},
}

module.exports = steam;
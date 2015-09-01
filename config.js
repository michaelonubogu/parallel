/**
 * Created by Namdascious on 6/4/2015..
 */
var env = {
	dev: 'dev',
	test: 'test',
	prod: 'prod'
};

module.exports = {
	"appsettings" : {
        "env" : env.prod,
        "testDomain" : 'http://parallel-test.azurewebsites.net',
        "prodDomain" : 'http://www.parallel.team'
	},
	"giant_bomb": {
		"url" : "http://www.giantbomb.com/api/",
		"key" : "9caedc058d2f9553e2de63e66dde3d81df03d6d0",
		"endpoints" : {
			"games" : "games",
			"genres" : "genres",
			"platforms" : "platforms",
			"search" : "search"
		},
		"formats": {
			"json" : "json",
			"xml" : "xml"
		},
		"resources" : {
			'game' : 'game',
			'franchise' : 'franchise',
			'character' : 'character',
			'concept' : 'concept', 
			'object' : 'object',
			'location' : 'location',
			'person' : 'person',
			'company' : 'company',
			'video' : 'video'
		},
		"limit" : 4,
		"sample_url" : "http://www.giantbomb.com/api/game/3030-4725/?api_key=[YOUR-KEY]",
		"sample_url_json" : "http://www.giantbomb.com/api/game/3030-4725/?api_key=[YOUR-KEY]&format=json&field_list=genres,name",
		"sample_url_breakdown" : "http://www.giantbomb.com/api/[RESOURCE-TYPE]/[RESOURCE-ID]/?api_key=[YOUR-KEY]&format=[RESPONSE-DATA-FORMAT]&field_list=[COMMA-SEPARATED-LIST-OF-RESOURCE-FIELDS]"
	},
	"facebook" : {
		"appid" : "857142311041951",
		"appsecret" : "0de76eaa87e8118ce44d0f34f060ca45"
	},
	"steam" : {
		"api_url" : 'http://api.steampowered.com/<interface_name>/<method_name>/<version>/?key=<api_key>&format=<format>',
		"api_key" : '4B152814751E25D21F710569111A99BE',
		"provider" : 'http://steamcommunity.com/openid'
	},
	"firebase" : {
		"url" : 'https://lfgbase.firebaseio.com/',
		"secret" : 'kr3DZhA9sGUbV8Gp09utU5jFiL4iqysnSBzCHfy0'
	}
}
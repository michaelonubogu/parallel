/**
 * Created by Namdascious on 6/4/2015.
 */
var rp = require('request-promise');
var config = require('./config.js');

var giantbomb = {

    getGames: function(query, max){
        var gbRef = config.giant_bomb;
        var limit = max !== null && max !== undefined ? max : gbRef.limit;
		var url = gbRef.url + gbRef.endpoints.search + '/?api_key=' + gbRef.key + '&limit=' + limit + '&format=' + gbRef.formats.json + '&query="' + query + '"&resources=' + gbRef.resources.game + '&field_list=id,name,image,original_release_date';
		return rp(url);
    },

    getGame: function(){

    },

    getGenres: function(){

    },

    getGenre: function(){

    },

    getPlatforms: function(){

    },

    getPlatform: function(){

    }
};

module.exports = giantbomb;

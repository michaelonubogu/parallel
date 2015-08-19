/**
 * Created by Namdascious on 6/4/2015.
 */
var rp = require('request-promise');
var config = require('./config.js');
var http = require('http');
var url = require('url');

var giantbomb = {

    getGames: function(query, max){
        var gbRef = config.giant_bomb;
        var limit = max !== null && max !== undefined ? max : gbRef.limit;
        var gburl = gbRef.url + gbRef.endpoints.search + '/?api_key=' + gbRef.key + '&limit=' + limit + '&format=' + gbRef.formats.json + '&query="' + query + '"&resources=' + gbRef.resources.game + '&field_list=id,name,image,original_release_date';
        return rp(gburl);
        //if (config.appsettings.env == 'dev') {
        //    return rp(gburl);
        //}
        //else {
        //    if (process.env.PROXIMO_URL) {
        //        var proxy = url.parse(process.env.PROXIMO_URL);
        //        options = {
        //            hostname: proxy.hostname,
        //            port: proxy.port || 80,
        //            uri: gburl,
        //            headers: { "Proxy-Authorization" : 'Basic #{new Buffer(proxy.auth).toString("base64")}' }
        //        };
                
        //        return rp(options);

        //        //return http.get(options, function (res) {
        //        //    console.log("status code", res.statusCode);
        //        //    console.log("headers", res.headers);
        //        //});
        //    }
        //}
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

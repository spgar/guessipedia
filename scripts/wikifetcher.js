
/* exported WikiFetcher */

// Utility class to grab things from Wikipedia.
var WikiFetcher = function() {
    'use strict';

    function getFetchArticleExtractURL(title) {
        var urlBase = 'http://en.wikipedia.org/w/api.php?';
        var urlOptions = 'format=json&action=query&prop=extracts&exintro&explaintext';
        var urlTitle = '&titles=' + title.replace(' ', '%20');
        var urlCallback = '&callback=?';
        return urlBase + urlOptions + urlTitle + urlCallback;
    }

    function fetchArticleExtract(title, id, callback) {
        $.ajax({
            type: 'GET',
            url: getFetchArticleExtractURL(title),
            contentType: 'application/json; charset=utf-8',
            async: false,
            dataType: 'jsonp',

            success: function(data) {
                for (var id in data.query.pages) {
                    if (data.query.pages.hasOwnProperty(id)) {
                        callback(title, id, data.query.pages[id].extract);
                    }
                }
            },

            error: function(errorMessage) {
                console.log('Error getting data from wikipedia: ' + errorMessage);
            }
        });
    }

    function getRandomArticleURL() {
        var urlBase = 'http://en.wikipedia.org/w/api.php?';
        var urlParameters = 'action=query&list=random&format=json&rnnamespace=0&rnlimit=1';
        var urlCallback = '&callback=?';
        return urlBase + urlParameters + urlCallback;
    }

    var fetchRandomArticle = function(callback) {
        $.ajax({
            type: 'GET',
            url: getRandomArticleURL(),
            contentType: 'application/json; charset=utf-8',
            async: false,
            dataType: 'jsonp',

            success: function(data) {
                fetchArticleExtract(data.query.random[0].title, data.query.random[0].id, callback);
            },

            error: function(errorMessage) {
                console.log('Error getting data from wikipedia: ' + errorMessage);
            }
        });
    };

    return {
        fetchRandomArticle: fetchRandomArticle
    };
};
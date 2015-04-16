
/* exported WikiFetcher */

// Utility class to grab things from Wikipedia.
var WikiFetcher = function() {
    'use strict';

    function getFetchExtractURL(pageName) {
        var urlBase = 'http://en.wikipedia.org/w/api.php?';
        var urlOptions = 'format=json&action=query&prop=extracts&exintro&explaintext';
        var urlTitle = '&titles=' + pageName.replace(' ', '%20');
        var urlCallback = '&callback=?';
        return urlBase + urlOptions + urlTitle + urlCallback;
    }

    function fetchPageExtract(pageName, callback) {
        $.ajax({
            type: 'GET',
            url: getFetchExtractURL(pageName),
            contentType: 'application/json; charset=utf-8',
            async: false,
            dataType: 'jsonp',

            success: function(data) {
                // SPGTODO: Should be only one
                for (var id in data.query.pages) {
                    if (data.query.pages.hasOwnProperty(id)) {
                        callback(pageName, data.query.pages[id].extract);
                    }
                }
            },

            error: function(errorMessage) {
                console.log('Error getting data from wikipedia: ' + errorMessage);
            }
        });
    }

    function getRandomPageURL() {
        var urlBase = 'http://en.wikipedia.org/w/api.php?';
        var urlParameters = 'action=query&list=random&format=json&rnnamespace=0&rnlimit=1';
        var urlCallback = '&callback=?';
        return urlBase + urlParameters + urlCallback;
    }

    var fetchRandomPage = function(callback) {
        $.ajax({
            type: 'GET',
            url: getRandomPageURL(),
            contentType: 'application/json; charset=utf-8',
            async: false,
            dataType: 'jsonp',

            success: function(data) {
                fetchPageExtract(data.query.random[0].title, callback);
            },

            error: function(errorMessage) {
                console.log('Error getting data from wikipedia: ' + errorMessage);
            }
        });
    };

    return {
        fetchRandomPage: fetchRandomPage
    };
};
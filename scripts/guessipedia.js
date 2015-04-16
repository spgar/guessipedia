
/* global WikiFetcher */

$(document).ready(function() {

    'use strict';

    var REPLACEMENT_STRING = '_____';

    var round = 1;
    var quizPages = [];
    var quizExtracts = [];
    var wikiFetcher = new WikiFetcher();

    function getNumQuizWords() {
        return round + 1;
    }

    function processExtractIntoSentences(extract, pageName) {
        // Get rid of anything in parenthesis within the page name.
        pageName = pageName.replace(/\s*\(.*?\)\s*/g, '');

        // Try to strip out middle initials, they seem to come up a lot.
        // 'Douglas R. White' -> 'Douglas White'
        extract = extract.replace(/[A-Z]\.\s/g, '');

        // Split out the source string into an array of sentences. This really needs natural language
        // processing, but this regular expression works ok (not great).
        var splitSentences = extract.replace(/([.?!])\s*(?=\s[A-Z])/g, '$1|').split('|');

        // Replace any instances of the goal page name with REPLACEMENT_STRING
        var re = new RegExp(pageName, 'gi');
        splitSentences = splitSentences.map(function(s) { return s.replace(re, REPLACEMENT_STRING); });

        // Also replace any individual word in the pagename to be safe? Only if it's proper.
        var splitWord = pageName.split(/[\s,]+/);
        splitWord.forEach(function(word) {
            if (word.length > 1) {
                // Skip some common, small words.
                if ($.inArray(word, ['on', 'and', 'the', 'of', 'in', 'is', 'at']) === -1) {
                    re = new RegExp('\\b' + word + '\\b', 'gi');
                    splitSentences = splitSentences.map(function(s) { return s.replace(re, REPLACEMENT_STRING); });
                }
            }
        });

        return splitSentences;
    }

    function isValidQuizPage(pageName) {
        // Already have enough words.
        if (quizPages.length >= getNumQuizWords()) {
            return false;
        }

        // This is a duplicate.
        quizPages.forEach(function(quizPage) {
            if (quizPage === pageName) {
                return false;
            }
        });

        // Don't deal with 'list of' pages.
        if (pageName.indexOf('List of') > -1) {
            return false;
        }

        // Some pages have a . in it. Problematic!
        if (pageName.indexOf('.') > -1) {
            return false;
        }

        // Otherwise it's ok.
        return true;
    }

    function processPageName(pageName) {
        return pageName.replace(/ *\([^)]*\) */g, '');
    }

    function processExtract(extract) {
        if (extract !== undefined && extract.length > 0 && extract.indexOf('^') > 0) {
            // Strip out everything after footnotes.
            extract = extract.substring(0, extract.indexOf('^'));
        }
        return extract;
    }

    function isValidExtract(extract) {
        // Sometimes the extract is undefined or has 0 length. Not sure why.
        if (extract === undefined || extract.length === 0) {
            return false;
        }

        // Don't deal with disambiguation pages.
        if (extract.indexOf('may refer to') > -1) {
            return false;
        }

        // Don't deal with 'list of' pages.
        if (extract.indexOf('list of') > -1) {
            return false;
        }

        return true;
    }

    function addValidToQuizPages(pageName, extract) {
        // Do some filtering on pageName and extract
        pageName = processPageName(pageName);
        extract = processExtract(extract);
        if (isValidQuizPage(pageName) && isValidExtract(extract)) {
            var extractSentences = processExtractIntoSentences(extract, pageName);
            quizExtracts.push(extractSentences);
            quizPages.push(pageName);
        }

        // Go back and collect more quiz pages if necessary.
        if (quizPages.length < getNumQuizWords()) {
            collectQuizPages();
        } else if (quizPages.length === getNumQuizWords()) {
            finishedCollectingQuizPages();
        } else {
            // SPGTODO: Something better.
            console.log('Big problem.');
        }
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function finishedCollectingQuizPages() {
        // Show the hint.
        $('#hint').html('Hint: ' + quizExtracts[0][randomInt(0, quizExtracts[0].length - 1)]);

        // Show all of the answers
        quizPages.forEach(function(quizPage) {
            var button = $('<button/>', {
                text: quizPage,
                click: function () {
                    $('#answers :button').attr('disabled', true);

                    if (quizPage === quizPages[0]) {
                        correctAnswer();
                    } else {
                        incorrectAnswer();
                    }
                }
            });

            $('#answers').append(button);
        });
    }

    function correctAnswer() {
        $('#result').html('Correct!');
        round += 1;

        var button = $('<button/>', {
                text: 'Next Round',
                click: kickOff,
        });
        $('#nextRound').append(button);
    }

    function incorrectAnswer() {
        $('#result').html('WRONG');
        round = 1;

        var button = $('<button/>', {
                text: 'Start Over',
                click: kickOff,
        });
        $('#nextRound').append(button);
    }

    function collectQuizPages() {
        wikiFetcher.fetchRandomPage(addValidToQuizPages);
    }

    function clearQuiz() {
        quizPages = [];
        quizExtracts = [];
        $('#hint').html('');
        $('#result').html('');
        $('#nextRound').empty();
        $('#answers').empty();
    }

    function kickOff() {
        clearQuiz();
        $('#round').html('Round: ' + round);
        collectQuizPages();
    }

    kickOff();
});

/* global WikiFetcher */

$(document).ready(function() {

    'use strict';

    var REPLACEMENT_STRING = '_____';

    var wikiFetcher = new WikiFetcher();

    var score = 0;
    var maxScore = 0;
    var articles = {};

    function getNumQuizWords() {
        return score + 2;
    }

    function processExtractIntoSentences(extract, title) {
        // Get rid of anything in parenthesis within the title.
        title = title.replace(/\s*\(.*?\)\s*/g, '');

        // Try to strip out middle initials, they seem to come up a lot.
        // 'Douglas R. White' -> 'Douglas White'
        extract = extract.replace(/[A-Z]\.\s/g, '');

        // Split out the source string into an array of sentences. This really needs natural language
        // processing, but this regular expression works ok (not great).
        var splitSentences = extract.replace(/([.?!])\s*(?=\s[A-Z])/g, '$1|').split('|');

        // Replace any instances of the goal title with REPLACEMENT_STRING
        var re = new RegExp(title, 'gi');
        splitSentences = splitSentences.map(function(s) { return s.replace(re, REPLACEMENT_STRING); });

        // Also replace any individual word in the title to be safe? Only if it's proper.
        var splitWord = title.split(/[\s,]+/);
        splitWord.forEach(function(word) {
            if (word.length > 1) {
                // Skip replacing some common, small words.
                if ($.inArray(word, ['on', 'and', 'the', 'of', 'in', 'is', 'at']) === -1) {
                    re = new RegExp('\\b' + word + '\\b', 'gi');
                    splitSentences = splitSentences.map(function(s) { return s.replace(re, REPLACEMENT_STRING); });
                }
            }
        });

        return splitSentences;
    }

    function processTitle(title) {
        return title.replace(/ *\([^)]*\) */g, '');
    }

    function processExtract(extract) {
        if (extract !== undefined && extract.length > 0 && extract.indexOf('^') > 0) {
            // Strip out everything after footnotes.
            extract = extract.substring(0, extract.indexOf('^'));
        }
        return extract;
    }

    function isValidTitle(title) {
        // Already have enough articles.
        if (articles.length >= getNumQuizWords()) {
            return false;
        }

        // This is a duplicate.
        articles.forEach(function(article) {
            if (article.processedTitle === title) {
                return false;
            }
        });

        // Don't deal with 'list of' articles.
        if (title.indexOf('List of') > -1) {
            return false;
        }

        // Some articles have a . in the title. Problematic!
        if (title.indexOf('.') > -1) {
            return false;
        }

        // Otherwise it's ok.
        return true;
    }

    function isValidExtract(extract) {
        // Sometimes the extract is undefined or has 0 length. Not sure why.
        if (extract === undefined || extract.length === 0) {
            return false;
        }

        // Don't deal with disambiguation articles.
        if (extract.indexOf('may refer to') > -1) {
            return false;
        }

        // Don't deal with 'list of' articles.
        if (extract.indexOf('list of') > -1) {
            return false;
        }

        return true;
    }

    function isValidArticle(title, extract) {
        return isValidTitle(title) && isValidExtract(extract);
    }

    function addArticle(title, id, extract) {
        // Do some filtering on title and extract
        var processedTitle = processTitle(title);
        var processedExtract = processExtract(extract);

        if (isValidArticle(processedTitle, processedExtract)) {
            var extractSentences = processExtractIntoSentences(processedExtract, processedTitle);
            var article = {
                title: title,
                id: id,
                processedTitle: processedTitle,
                extract: extract,
                extractSentences: extractSentences
            };
            articles.push(article);
        }

        // Go back and collect more articles if necessary.
        if (articles.length < getNumQuizWords()) {
            collectArticles();
        } else if (articles.length === getNumQuizWords()) {
            finishedCollectingArticles();
        } else {
            // SPGTODO: Something better.
            console.log('Big problem!');
        }
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function disableAllAnswerButtons() {
        $('.answerButton').addClass('ui-disabled');
    }

    function finishedCollectingArticles() {
        // Show the hint.
        var sentences = articles[0].extractSentences;
        $('#hint').html('Hint: ' + sentences[randomInt(0, sentences.length - 1)]);

        // Choose a correct answer and then mix up the articles.
        var shuffledArticles = _.shuffle(articles);

        // Setup all of the answer buttons.
        shuffledArticles.forEach(function(article) {
            var button = $('<a data-role="button" data-id="' + article.processedTitle + '">' + article.processedTitle + '</a>');
            $(button).addClass('answerButton');
            $('#answers').append(button).trigger('create');
            button.bind('click', function() {
                disableAllAnswerButtons();
                if (article.processedTitle === articles[0].processedTitle) {
                    correctAnswer();
                } else {
                    incorrectAnswer();
                }
            });
        });
    }

    function addContinueButton(text) {
        var button = $('<a data-role="button">' + text + '</a>');
        $('#continue').append(button).trigger('create');
        button.bind('click', kickOff);
    }

    function correctAnswer() {
        $('#result').html('Correct!');
        score += 1;
        if (score > maxScore) {
            maxScore = score;
        }

        addContinueButton('Next Round');
    }

    function getCorrectAnswerLink() {
        return '<a href="' + 'http://en.wikipedia.org/?curid=' + articles[0].id +
               '" target="_blank">' + articles[0].processedTitle + '</a>';
    }

    function incorrectAnswer() {
        $('#result').html('WRONG. Correct answer: ' + getCorrectAnswerLink());
        score = 0;

        addContinueButton('Start Over');
    }

    function collectArticles() {
        wikiFetcher.fetchRandomArticle(addArticle);
    }

    function clearQuiz() {
        articles = [];
        $('#hint').html('');
        $('#result').html('');
        $('#continue').empty();
        $('#answers').empty();
    }

    function kickOff() {
        clearQuiz();
        $('#score').html('Score: ' + score + ' (max: ' + maxScore + ')');
        collectArticles();
    }

    kickOff();
});
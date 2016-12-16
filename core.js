var prompt = require('prompt');
var mongoose = require('mongoose');
var path = require('path');
var appDir = path.dirname(require.main.filename);
var sense2vec = require(appDir + '/handlers/sense2vecHandler');
var ComparisonLobe = require(appDir + '/neuralN/ComparisonLobe');
var MatchingLobe = require(appDir + '/neuralN/MatchingLobe');
var config = require(appDir + '/config');
var async = require('async');
var scoreThoughtCategories = require(appDir + '/scoring/categorySelection');
var thoughtCore = require(appDir + '/memory/thoughtCore');
var loadInThoughts = require(appDir + '/loadThoughts');

mongoose.Promise = global.Promise
mongoose.connect(config.database);
mongoose.connection.on('error', function() {
  console.info('Error: Could not connect to MongoDB. Did you forget to run `mongod`?'.red);
});

// Master process
async.waterfall([
  function(cb){
    loadInThoughts(cb);
  },
  function(referenceThoughts, cb){
    new ComparisonLobe().then(function(err, compareLobeObj){
      cb(err, compareLobeObj, referenceThoughts);
    });
  },
  function(compareLobeObj, referenceThoughts, cb){
    new MatchingLobe(compareLobeObj).then(function(err, matchingLobeObj){
      cb(err, matchingLobeObj, referenceThoughts);
    });
  },
  function(matchingLobeObj, referenceThoughts, cb){
    compareNow(referenceThoughts, matchingLobeObj);
  }
], function(err){
  console.log("Complete");
});


loadInThoughts(function(err, referenceThoughts){
  new ComparisonLobe().then(function(compareLobeObj){
      new MatchingLobe(compareLobeObj).then(function(matchingLobeObj){
        compareNow(referenceThoughts, matchingLobeObj);
      });
  });
});

var compareNow = function(referenceThoughts, matchingLobeObj) {
  var scores = new Array(referenceThoughts.length);
  async.waterfall([
    function(callback){
      prompt.start();
      prompt.get(['query'], callback);
    },
    function(command, callback){
      thoughtCore.createThought(command.query, function(err, newThought){
        callback(err, command, newThought);
      });
    }, 
    function(command, newThought, callback){
      async.forEachOfLimit(referenceThoughts, 1, function (templateThought, key, forLimitCB) {
        matchingLobeObj.compareThoughts(newThought, templateThought.thought, function(err, result){
          scores[key] = ({"matchScore": result, "thought":templateThought.thought, "category":templateThought.category});
          forLimitCB(err);
        });
      }, callback);
    }, 
    function(callback){
      console.log("Scores:");
      console.log(scores);
      scoreThoughtCategories(scores, function(err){
        compareNow(referenceThoughts, matchingLobeObj);
      });
    }
  ])
};

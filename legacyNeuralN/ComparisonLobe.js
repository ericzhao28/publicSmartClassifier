var path = require('path');
var appDir = path.dirname(require.main.filename);
var async = require('async');
var nodeSenseVecHandler = require(appDir + '/handlers/sense2vecHandler');
var synaptic = require('synaptic');
var trainingData = require(appDir + '/data/comparisonLobeTrainingData.json');



// Comparison Lobe
module.exports = class ComparisonLobe{

  /*
  * 
  * Initialization
  *
  */

  constructor(cb) {
    console.log("\n########### Creating comparison lobe ###########\n\n")
    this.net = new synaptic.Architect.Perceptron(13, 4, 1);
    this.trainer = new synaptic.Trainer(this.net);
    this.trainingSet = [];
    this.cb = cb;
    var that = this;
    return new Promise((resolve) => {
      async.forEachOfSeries(trainingData, function(value, key, callback){
        that.generateData(value[0], value[1], function(err, dataSet){
          that.trainingSet.push({input:dataSet, output:[value[2]]});
          callback(err);
        });
      }, function(err){
        console.log("Training set generated");
        that.trainer.train(that.trainingSet,{
          rate: .1,
          iterations: 20000,
          error: .1,
          shuffle: true,
          log: 100,
          cost: synaptic.Trainer.cost.CROSS_ENTROPY
        });
        that.testLobe(function(err){
          console.log("Comparison lobe generation complete", "\n###########################################\n\n")
          resolve(that);
        });
      });
    });
  }

  testLobe(cb){
    var that = this;
    console.log("\n\n## Initating lobe test##");
    async.series([
      function(callback) {
        console.log("Testing: day-which, birthday-again");
        that.comparePhrases({"subject":"day","objType":"det","subjImp":-7.400947093963623,"object":"Which","subjType":"noun","specificRelationship":"det","relation":"supp","subjNER":"DURATION","objImp":-6.877470970153809}, {"subject":"birthday","objType":"adv","subjImp":-10.359518051147461,"object":"again","subjType":"noun","specificRelationship":"nmod:on","relation":"supp","objImp":-7.7370924949646}, function(err, score){
          console.log("Result: " + score);
          callback(err);
        });
      }, 
      function(callback) {
        console.log("Testing: like-what, how-is");
        that.comparePhrases({"specificRelationship":"dep","objType":"adp","subjType":"noun","relation":"central","object":"like","objImp":-5.610429763793945,"subject":"What","subjImp":-6.023346424102783}, {"specificRelationship":"advmod","objType":"adv","subjType":"verb","relation":"supp","object":"How","objImp":-6.496722221374512,"subject":"is","subjImp":-4.457748889923096}, function(err, score){
          console.log("Result: " + score);
          callback(err);
        });
      },
      function(callback){
        console.log("Testing: weather-like, sports-like");
        that.comparePhrases({
      "specificRelationship": "longrange",
      "object": "weather",
      "subject": "like",
      "objType": "noun",
      "subjType": "verb",
      "objImp": -10.458684921264648,
      "subjImp": -5.610429763793945,
      "relation": "central"
    },
    {
      "object": "sports",
      "specificRelationship": "longrange",
      "objType": "noun",
      "relation": "central",
      "subject": "like",
      "subjType": "verb",
      "subjImp": -5.610429763793945,
      "objImp": -10.086164474487305
    }, function(err, score){
          console.log("Result: " + score);
          callback(err);
        });
      },
      function(callback){
        console.log("Testing: like-I, loves-he");
        that.comparePhrases({
      "objType": "verb",
      "subjType": "verb",
      "specificRelationship": "longrange",
      "subject": "going",
      "subjImp": -6.833367824554443,
      "relation": "central",
      "objImp": -8.752785682678223,
      "object": "running"
    },
    {
      "objType": "verb",
      "subjType": "verb",
      "specificRelationship": "longrange",
      "subject": "going",
      "subjImp": -8.662449836730957,
      "relation": "central",
      "objImp": -6.833367824554443,
      "object": "hiking"
    }, function(err, score){
          console.log("Result: " + score);
          callback(err);
        });
      }
    ], cb);
  }

  comparePhrases(thoughtJS, thoughtyJS, cb){
    var that = this;
    that.generateData(thoughtJS, thoughtyJS, function(err, dataset){
      //console.log("Result of comparison: " + that.net.activate(dataset));
      cb(err, that.net.activate(dataset));
    });
  }

  generateData(newLink, otherLink, cb){
    var that = this;
    async.waterfall([
      function(callback){
        nodeSenseVecHandler.compareSentences(newLink.subject+"+"+newLink.object, otherLink.subject+"+"+otherLink.object, callback);
      }, 
      function(pairsDist, callback){
        nodeSenseVecHandler.compareWords(newLink.subject, newLink.subjNER, newLink.subjType, otherLink.subject, otherLink.subjNER, otherLink.subjType, function(err, subjectSim, subjectDist){
          if (!subjectSim){
            subjectSim = 0.1;
          }
          if (!subjectDist){
            subjectDist = 10;
          }
          callback(err, pairsDist, subjectSim, subjectDist);
        });
      },
      function(pairsDist, subjectSim, subjectDist, callback){
        nodeSenseVecHandler.compareWords(newLink.object, newLink.objNER, newLink.objType, otherLink.object, otherLink.objNER, otherLink.objType, function(err, objectSim, objectDist){
          if (!objectSim){
            objectSim = 0.4;
          }
          if (!objectDist){
            objectDist = 5;
          }
          callback(err, parseFloat(pairsDist) + 0.1, parseFloat(subjectSim), parseFloat(subjectDist) + 0.1, parseFloat(objectSim), parseFloat(objectDist) + 0.1, Math.abs(otherLink.subjImp - newLink.subjImp), Math.abs(otherLink.objImp - newLink.objImp), newLink, otherLink);
        });
      },
      that.normalizeData
    ], cb);
  }

  normalizeData(pairsDist, subjectSim, subjectDist, objectSim, objectDist, subjImpDiff, objImpDiff, newLink, otherLink, cb){
    var specificRelationshipMatch = (newLink.specificRelationship == otherLink.specificRelationship) ? 1 : 0;
    var relationMatch = (newLink.relation == otherLink.relation)  ? 1 : 0;
    var subjectTypeMatch = (newLink.subjType == otherLink.subjType) ? 1 : 0;
    var objectTypeMatch = (newLink.objType == otherLink.objType) ? 1 : 0;
    var subjectNERMatch = (newLink.subjNER == otherLink.subjNER) ? 1 : 0;
    var objectNERMatch = (newLink.objNER == otherLink.objNER) ? 1 : 0;
    cb(null, [pairsDist, subjectSim, subjectDist, objectSim, objectDist, specificRelationshipMatch, relationMatch, subjectTypeMatch, objectTypeMatch, subjectNERMatch, objectNERMatch, subjImpDiff, objImpDiff]);
  }
};
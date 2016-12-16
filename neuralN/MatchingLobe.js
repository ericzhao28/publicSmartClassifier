var path = require('path');
var appDir = path.dirname(require.main.filename);
var async = require('async');
var nodeSenseVecHandler = require(appDir + '/handlers/sense2vecHandler');
var synaptic = require('synaptic');
var trainingData = require(appDir + '/data/matchingLobeTrainingData.json');
var thoughtCore = require(appDir + '/memory/thoughtCore');



// Matching Lobe
module.exports = class MatchingLobe{

  /*
  * 
  * Initialization
  *
  */

  constructor(compareLobeInst, cb) {
    console.log("\n########### Creating Matching lobe ###########\n\n")
    this.net = new synaptic.Architect.Perceptron(15, 8, 2, 1);
    this.trainer = new synaptic.Trainer(this.net);
    this.trainingSet = [];
    this.compareLobeInst = compareLobeInst;
    this.constCB = cb;
    var that = this;
    return new Promise((resolve) => {
      async.forEachOfSeries(trainingData, that.createTrainingDataThought.bind(that), function(err){
        console.log("Training set generated");
        //console.log(that.trainingSet);
        that.trainer.train(that.trainingSet,{
          rate: 0.1,
          iterations: 20000,
          error: .1,
          shuffle: true,
          log: 100,
          cost: synaptic.Trainer.cost.CROSS_ENTROPY
        });
        that.testLobe(function(err){
          console.log("Matching lobe generation complete", "\n###########################################\n\n")
          resolve(err, that, that.constCB);
        });
      });
    });
  }

  testLobe(cb){
    var testData = [["Is it raining?", "Is it raining in Los Angeles?"]];
    var that = this;
    async.forEachOfSeries(testData, that.createTestDataThought.bind(that), function(err){
      console.log("Testing complete");
      cb(err);
    });
  }

  createTestDataThought(rawDataChunk, key, cb){
    var that = this;
    async.series([
      function(parallelCB){
        //console.log("first");
        thoughtCore.createThought(rawDataChunk[0], function(err, thoughty){
          //console.log("new thouhgty");
          parallelCB(err, thoughty);
        });
      },
      function(parallelCB){
        //console.log("second");
        thoughtCore.createThought(rawDataChunk[1], function(err, thoughty){
          //console.log("New thought");
          parallelCB(err, thoughty);
        });
      }
    ],
    function(err, testData){
      //console.log("third");
      that.generateData(testData[0], testData[1], function(err, dataSet){
        console.log("Created test data thought, err: " + err);
        console.log(rawDataChunk[0] + " VS " + rawDataChunk[1] + " : " + that.net.activate(dataSet));
        cb(err);
      });
    });
  }

  createTrainingDataThought(rawDataChunk, key, cb){
    var that = this;
    async.series([
      function(parallelCB){
        //console.log("first");
        thoughtCore.createThought(rawDataChunk[0], function(err, thoughty){
          //console.log("new thouhgty");
          parallelCB(err, thoughty);
        });
      },
      function(parallelCB){
        //console.log("second");
        thoughtCore.createThought(rawDataChunk[1], function(err, thoughty){
          //console.log("New thought");
          parallelCB(err, thoughty);
        });
      }
    ],
    function(err, trainingData){
      //console.log("third");
      that.generateData(trainingData[0], trainingData[1], function(err, dataSet){
        console.log("Created training data thought, err: " + err);
        that.trainingSet.push({input:dataSet, output:[rawDataChunk[2]]});
        cb(err);
      });
    });
  }

  compareThoughts(baseThought, templateThought, cb){
    var that = this; 
    that.generateData(baseThought, templateThought, function(err, dataset){
      //console.log(that.net.activate(dataset));
      cb(err, that.net.activate(dataset));
    });
  }

  generateData(newThought, otherThought, cb){
    var that = this;
    async.waterfall([
      function(waterfallCB){
        newThought.compareThought(otherThought, that.compareLobeInst, waterfallCB);
      },
      function(sentenceRawDist, centralScores, centralMirror, suppScores,  suppMirror, waterfallCB){
        async.forEachOfSeries(centralScores, 
          function(score, index, forEachCB){
            console.log("Score: " + score);
            console.log("New match: " + centralMirror[index].suggestedMatch.subject.text + " -> " + centralMirror[index].suggestedMatch.object.text);
              forEachCB();
            console.log("Base match: " + centralMirror[index].rawOriginal[0].subject.text + " -> " + centralMirror[index].rawOriginal[0].object.text);
          },
          function(err){
            waterfallCB(err, sentenceRawDist, centralScores, centralMirror, suppScores,  suppMirror);
          }
        );
      },
      function(sentenceRawDist, centralScores, centralMirror, suppScores,  suppMirror, waterfallCB){
        async.parallel([
          function(callback){
            var centralSDev = that.standardDeviation(centralScores);
            var suppSDev = that.standardDeviation(suppScores);
            var averageCentralDev = that.average(centralScores);
            var averageSuppDev = that.average(suppScores);
            callback(null, averageCentralDev, averageSuppDev, centralSDev, suppSDev);   
          }, 
          function(callback){
            var suppMaxDiff = Math.min(...suppScores);
            if (isNaN(suppMaxDiff) || (suppMaxDiff == -Infinity) || (suppMaxDiff == Infinity)){
              suppMaxDiff = 1;
              var suppDevMaxDiff = 0;
            } else {
              var suppDevMaxDiff = Math.max(...suppScores) - Math.min(...suppScores);
            }
            var centralMaxDiff = Math.min(...centralScores);
            if (isNaN(centralMaxDiff) || (centralMaxDiff == -Infinity) || (centralMaxDiff == Infinity)){
              centralMaxDiff = 1;
              var centralDevMaxDiff = 0;
            } else {
              var centralDevMaxDiff = Math.max(...centralScores) - Math.min(...centralScores);
            }
            
            callback(null, suppMaxDiff, centralMaxDiff, suppDevMaxDiff, centralDevMaxDiff);
          },
          function(callback){
            var templateSuppCount = otherThought.getCount()[0];
            var templateCentralCount = otherThought.getCount()[0];
            var baseSuppCount = newThought.getCount()[0];
            var baseCentralCount = newThought.getCount()[0];
            var templateSuppEmpty = (templateSuppCount == 0) ? 1 : 0;
            var baseSuppEmpty = (baseSuppCount == 0) ? 1 : 0;
            var templateCentralEmpty = (templateCentralCount == 0) ? 1 : 0;
            var baseCentralEmpty = (baseCentralCount == 0) ? 1 : 0;
            var suppDifference = Math.abs(templateSuppCount - baseSuppCount)/100;
            var centralDifference = Math.abs(templateCentralCount - baseCentralCount)/100;
            callback(null, parseFloat(sentenceRawDist.substr(0,sentenceRawDist.length - 2)), templateSuppEmpty, baseSuppEmpty, templateCentralEmpty, baseCentralEmpty, suppDifference, centralDifference);
          }
        ], function(err, results){
          that.normalizeData(results, cb);
        });
      }
    ]);
  }

  normalizeData(results, cb){
    cb(null, [].concat(results[0],results[1],results[2]));
  }

  standardDeviation(values){
    if (typeof values != typeof []){
      values = [values];
    }

    var avg = this.average(values);
    var squareDiffs = values.map(function(value){
      var diff = value - avg;
      var sqrDiff = diff * diff;
      return sqrDiff;
    });
    var avgSquareDiff = this.average(squareDiffs);
    var stdDev = Math.sqrt(avgSquareDiff);
    if (isNaN(stdDev)){
      stdDev = 0;
    }
    return stdDev;
  }

  average(data){
    if (typeof data != typeof []){
      data = [data];
    }
    var sum = data.reduce(function(sum, value){
      return sum + value;
    }, 0);
    var avg = sum / data.length;
    if (isNaN(avg) || (avg == Infinity)){
      avg = 0;
    }
    return avg;
  }
};

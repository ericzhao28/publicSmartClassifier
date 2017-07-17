var path = require('path');
var appDir = path.dirname(require.main.filename);
var async = require('async');
var nlpProcessor = require(appDir + '/handlers/parsingHandler');
var senseProcessor = require(appDir + '/handlers/sense2vecHandler');
var ThoughtLink = require('./ThoughtLink');
var ThoughtMod = require(appDir + '/db_models/Thought');

// Thought
module.exports = class Thought{

  /*
  *
  * Initialization
  *
  */


  constructor(query, mongooseObject) {
    this.query = query;
    this.links = [];
    this.centralLinks = [];
    this.suppLinks = [];
    if (mongooseObject){
      this.mongooseObject = mongooseObject;
      this.semJson = JSON.parse(mongooseObject.semJson);
    } else {
      this.mongooseObject = new ThoughtMod();
    }
    return;
  }

  //
  // If thought is already in DB, load DB model into this object
  //

  loadFromModel(cb){
    var that = this;
    async.series([
      function(asyncCB) {
        async.forEachOfSeries(that.mongooseObject.centralLinks, function(value, index, next){
          var thoughtLinky = new ThoughtLink(that, JSON.parse(value.linkJSON));
          thoughtLinky.initiate(true, function(err, newLink){
            //console.log("Initiated " + err);
            if (err){
              next(err);
            } else {
              that.links.push(newLink);
              that.centralLinks.push(newLink);
              next();
            }
          });
        }, function(err){
          asyncCB(err);
        });
      },
      function(asyncCB) {
        async.forEachOfSeries(that.mongooseObject.suppLinks, function(value, index, next){
          var thoughtLinky = new ThoughtLink(that, JSON.parse(value.linkJSON));
          thoughtLinky.initiate(true, function(err, newLink){
            //console.log("Initiated " + err);
            if (err){
              next(err);
            } else {
              that.links.push(newLink);
              that.suppLinks.push(newLink);
              next();
            }
          });
        }, function(err){
          asyncCB(err);
        });
      },
      function(asyncCB) {
        that.mongooseObject.save((err) => { 
          if (err) {
            //console.log(err);
            asyncCB(err);
          } else {
            asyncCB(null);
          }
        });
      }
    ],
    function(err) {
      //console.log("Load from model complete: " + err);
      cb(err, that);
    });
  }

  //
  // If thought not yet in DB, we add it
  // 

  initiate(cb){
    var that = this;
    //console.log("Initiation");
    nlpProcessor(that.query, false, function(err, dataString){
      //console.log("Consulting NLP");
      //console.log(dataString);
      if (err) {
        cb(err);
      } else {
        that.saveThoughtLinks(JSON.parse(dataString), cb);
      }
    });
  }

  saveThoughtLinks(parsedNLPJSON, cb){
    var that = this;
    //console.log("Saving thought links");
    //console.log("Length: " + parsedNLPJSON.result.length);
    that.semJson = parsedNLPJSON.semData;
    async.forEachOfSeries(parsedNLPJSON.result, function (linkJSON, index, callback) {
      //console.log("For each json");
      var thoughtLinky = new ThoughtLink(that, linkJSON);
      thoughtLinky.initiate(false, function(err, newLink){
        //console.log("Initiated save thought links: " + err);
        //console.log("Finished initiation");
        if (err){
          //console.log("Next");
          //console.log(err);
          callback(err);
        } else {
          //console.log("Next next");
          that.links.push(newLink);
          if (newLink.getRelation() == "central"){
            that.centralLinks.push(newLink);
          } else if (newLink.getRelation() == "supp"){
            that.suppLinks.push(newLink);
          }
          //console.log("Next next next");
          callback();
        }
      });
    }, cb);
  }

  saveToDatabase(cb){
    //console.log("Saving thought to database");
    var that = this;
    this.mongooseObject.query = this.query.trim();
    this.mongooseObject.links = [];
    this.mongooseObject.centralLinks = [];
    this.mongooseObject.suppLinks = [];
    this.mongooseObject.semJson = JSON.stringify(this.semJson);
    async.series([
        function(callback) {
          async.forEachOfSeries(that.links, function(value, index, next){
            that.mongooseObject.links.push(value.getMongooseObject()._id);
            next();
          }, function(err){
            callback(err);
          });
        },
        function(callback) {
          async.forEachOfSeries(that.centralLinks, function(value, index, next){
            that.mongooseObject.centralLinks.push(value.getMongooseObject()._id);
            next();
          }, function(err){
            callback(err);
          });
        },
        function(callback) {
          async.forEachOfSeries(that.suppLinks, function(value, index, next){
            that.mongooseObject.suppLinks.push(value.getMongooseObject()._id);
            next();
          }, function(err){
            callback(err);
          });
        },
        function(callback) {
          that.mongooseObject.save((err) => { 
            callback(err);
          });
        }
    ],
    function(err) {
        cb(err, that);
    });
  }

  /*
  *
  * Get props
  *
  */
  getQuery(){
    return this.query;
  }

  getCentral(){
    return this.centralLinks;
  }

  getSupp(){
    return this.suppLinks;
  }

  getCount(){
    return [this.suppLinks.length, this.centralLinks.length];
  }

  /*
  *
  * Compare thoughts
  *
  */

  compareThought(opposingThought, compareLobeInst, cb){
    var that = this;
    async.series([
      function(callback){
        senseProcessor.compareSentences(that.getQuery(), opposingThought.getQuery(), callback);
      }, 
      function(callback){
        that.calcCentralPatternMatch(opposingThought, compareLobeInst, callback);
      }, 
      function(callback){
        that.calcSupplementMatch(opposingThought, compareLobeInst, callback);
      }
    ], function(err, results){
      cb(err, results[0], results[1][0], results[1][1], results[2][0], results[2][1]);
    });
  }

  calcCentralPatternMatch(opposingThought, compareLobeInst, cb){
    var that = this;
    that.compareThoughtLinkTrees(opposingThought.getCentral(), this.getCentral(), compareLobeInst, function(err, result, mirror){
      if (err){
        cb(err);
      } else {
        cb(null, result, mirror);
      }
    });
  }

  calcSupplementMatch(opposingThought, compareLobeInst, cb){
    this.compareThoughtLinkTrees(opposingThought.getSupp(), this.getSupp(), compareLobeInst, function(err, result, mirror){
      if (err){
        cb(err);
      } else {
        cb(null, result, mirror);
      }
    }); 
  }

  compareThoughtLinkTrees(thoughtLinkComparisonPoolRaw, thoughtLinkBasePoolRaw, compareLobeInst, cb) {
    var that = this;
    var thoughtLinkComparisonPool = thoughtLinkComparisonPoolRaw.slice(0);
    var thoughtLinkBasePool = thoughtLinkBasePoolRaw.slice(0);
    var results = new Array(thoughtLinkComparisonPool.length);
    var resultsThoughtMirror = new Array(thoughtLinkComparisonPool.length);

    // Compensate for length differences
    /*if (thoughtLinkComparisonPool.length < Math.floor(thoughtLinkBasePool.length * 0)){
      cb(null, 400);
    } else {*/
    async.forEachOfSeries(thoughtLinkComparisonPool, function(thoughtLinkComparison, index, outsideNext){
      var smallResults = new Array(thoughtLinkBasePool.length);
      var smallResultsMirror = new Array(thoughtLinkBasePool.length);
      async.forEachOfLimit(thoughtLinkBasePool, 500, function(thoughtLinkBase, innerIndex, insideNext){
        //console.log("Consulting lobe: " + compareLobeInst);
        //console.log(typeof compareLobeInst.comparePhrases);
        //console.log(typeof compareLobeInst);
        //console.log(typeof compareLobeInst.generateData);
        compareLobeInst.comparePhrases(thoughtLinkBase.linkJSON, thoughtLinkComparison.linkJSON, function(error, distErr){
          //console.log("Consultation complete");
          smallResults[innerIndex] = distErr[0];
          smallResultsMirror[innerIndex] = thoughtLinkBase;
          insideNext();
        });
      }, function(err){
        if (err){
          outsideNext(err);
        } else {
          results[index] = smallResults;
          resultsThoughtMirror[index] = {"rawOriginal": smallResultsMirror, "suggestedMatch":thoughtLinkComparison, "original": []};
          outsideNext();
        }
      });
    }, function(err){
      //console.log("Comparisons complete");
      if (err){
        cb(err);
      } else {
        that.rearrangeThoughtLinkTreeResults(results, resultsThoughtMirror, cb);
      }
    });
   // }
  }

  rearrangeThoughtLinkTreeResults(results, resultsThoughtMirror, cb){
    var that = this;
    var maxValues = [];
    var maxValueKeys = [];
    if (results.length == 0){
      cb(null, [], []);
      return;
    }
    if (results[0].length == 0){
      cb(null, [], []);
      return;
    }
    //console.log(resultsThoughtMirror);
   /* if (!results[0]){
      //console.log("200 error");
      cb(null, 200, resultsThoughtMirror);
    } else if (results[0].length == 0){
      //console.log("300 error");
      cb(null, 300, resultsThoughtMirror);
    } else {*/
    async.forEachOfSeries(results, function(smallResults, index, next){
      if ((Math.max(...smallResults)) == 100){
        //console.log("Lost cause");
        results.splice(index, 1);
        resultsThoughtMirror.splice(index, 1);
        that.rearrangeThoughtLinkTreeResults(results, resultsThoughtMirror, cb);
      } else if (maxValueKeys.indexOf(smallResults.indexOf(Math.max(...smallResults))) == -1){
        //console.log("Pushing to max value keys");
        maxValueKeys.push(smallResults.indexOf(Math.max(...smallResults)));
        resultsThoughtMirror[index].original.push(resultsThoughtMirror[index].rawOriginal[smallResults.indexOf(Math.max(...smallResults))]);
        maxValues.push(Math.max(...smallResults));
        next();
      } else {
        if (maxValues[maxValueKeys.indexOf(smallResults.indexOf(Math.max(...smallResults)))] < Math.max(...smallResults)){
          //console.log("rearrange1");
          results[index][smallResults.indexOf(Math.max(...smallResults))] = 100;
          that.rearrangeThoughtLinkTreeResults(results, resultsThoughtMirror, cb);
        } else {
          //console.log("rearrange2");
          //console.log(maxValueKeys);
          //console.log(smallResults);
          results[maxValueKeys.indexOf(smallResults.indexOf(Math.max(...smallResults)))][smallResults.indexOf(Math.max(...smallResults))] = 100;
          that.rearrangeThoughtLinkTreeResults(results, resultsThoughtMirror, cb);
        }
      }
    }, function(err){
      //console.log("Manipulating");
      that.manipulateThoughtTreeCutoffs(err, maxValues, resultsThoughtMirror, cb);
    });
    
  }

  manipulateThoughtTreeCutoffs(err, maxValues, mirror, cb){
    // More neural net stuff here
    var that = this;
    //console.log("Returning..");

    cb(err, maxValues, mirror);
  }
}

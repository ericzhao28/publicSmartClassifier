var memorySystemTest = require('./unitTests/memorySystemTest');
var parsingSystemTest = require('./unitTests/parsingSystemTest');
var sense2vecSystemTest = require('./unitTests/sense2vecSystemTest');
// var scoringSystemTest = require('./unitTests/scoringSystemTest');
var async = require('async');


async.series([
    function(callback){
      console.log('###### Sense2vec Tests #######');
      sense2vecSystemTest.compareWords(function(){
        sense2vecSystemTest.getWordVector(function(){
          sense2vecSystemTest.compareSentences(function(){
            console.log('##############################\n');
            callback();
          });
        });
      });
    },
    function(callback){
      console.log('#### Parsing System Tests ####');
      parsingSystemTest(function(err, result){
        if (result){
          console.log(result);
        } else {
          console.log("PARSING SYSTEM IS DOWN\nUnable to continue validation tests due to parsing error");
          // console.log("Error details: " + err);
          console.log('##############################\n');
          callback(err);
        }
        console.log('##############################\n');
        callback(err);
      });
    },
    function(callback){
      console.log('#### Memory System Tests #####');
      memorySystemTest(function(err, result){
        if (result){
        } else {
          console.log("Error: " + err);
        }
        console.log('##############################\n');
        callback();
      });
    }
  ], 
  function(err, result){
    console.log("Framework verification tests also available in unitTests/, including: coreNLPTest, mongoTest and semaforeTest");
    process.exit();
  }
);

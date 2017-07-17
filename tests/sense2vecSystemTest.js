var path = require('path');
var appDir = path.dirname(require.main.filename);
var sense2vecHandler = require(appDir + '/handlers/sense2vecHandler');

module.exports.getWordVector = function(cb){
  console.log('Testing getWordVector');
  sense2vecHandler.getWordVector("hello", "", "noun", function(err, result){
    if (err || (result == false)){
      console.log("Failure getWordVector #1 " + err);
    }
  });
  sense2vecHandler.getWordVector("california", "PLACE", "noun", function(err, result){
    if (err){
      console.log("Failure getWordVector #2 " + err);
    }
  });
  sense2vecHandler.getWordVector("california", "", "noun", function(err, result){
    if (err){
      console.log("Failure getWordVector #3 " + err);
    }
  });
  sense2vecHandler.getWordVector("asfaff", "", "noun", function(err, result){
    if (err || (result != false)){
      console.log("Failure getWordVector #4 " + err);
    }
  });
  sense2vecHandler.getWordVector("california", "", "", function(err, result){
    if (err){
      console.log("Failure getWordVector #5 " + err);
    }
  });
  sense2vecHandler.getWordVector("", "LOCATION", "noun", function(err, result){
    if (err){
      console.log("getWordVector 1/3 intentional failure!");
    }
  });
  sense2vecHandler.getWordVector("", "", "noun", function(err, result){
    if (err){
      console.log("getWordVector 2/3 intentional failure!");
    }
  });
  sense2vecHandler.getWordVector("", "", "", function(err, result){
    if (err){
      console.log("getWordVector 3/3 intentional failure!");
    }
    cb();
  });
};


module.exports.compareWords = function(cb){
  console.log('Testing compareWords');
  sense2vecHandler.compareWords("hello", "", "noun", "goodbye", "", "noun", function(err, sim, distance){
    if (err){
      console.log("Failure compareWords #1 " + err);
    }
  });
  sense2vecHandler.compareWords("california", "LOCATION", "noun", "california", "LOCATION", "noun", function(err, sim, distance){
    if (err){
      console.log("Failure compareWords #2 " + err);
    }
  });
  sense2vecHandler.compareWords("california", "", "noun", "california", "", "noun", function(err, sim, distance){
    if (err){
      console.log("Failure compareWords #3 " + err);
    }
  });
  sense2vecHandler.compareWords("hello", "", "noun", "california", "", "noun", function(err, sim, distance){
    if (err || (distance == false)){
      console.log("Failure compareWords #4 " + err);
    }
  });
  sense2vecHandler.compareWords("california", "", "noun", "california", "LOCATION", "noun", function(err, sim, distance){
    if (err){
      console.log("Failure compareWords #5 " + err);
    }
  });
  sense2vecHandler.compareWords("california", "", "noun", "aasff", "", "noun", function(err, sim, distance){
    if (err || (sim != false) || (distance != false)){
      console.log("Failure compareWords #6 " + err);
    }
  });
  sense2vecHandler.compareWords("", "LOCATION", "noun", "", "LOCATION", "noun", function(err, sim, distance){
    if (err){
      console.log("compareWords 1/7 intentional failure!");
    }
  });
  sense2vecHandler.compareWords("", "", "noun", "", "", "noun", function(err, sim, distance){
    if (err){
      console.log("compareWords 2/7 intentional failure!");
    }
  });
  sense2vecHandler.compareWords("", "", "", "", "", "", function(err, sim, distance){
    if (err){
      console.log("compareWords 3/7 intentional failure!");
    }
  });
  sense2vecHandler.compareWords("california", "LOCATION", "noun", "", "LOCATION", "noun", function(err, sim, distance){
    if (err){
      console.log("compareWords 4/7 intentional failure!");
    }
  });
  sense2vecHandler.compareWords("california", "", "noun", "", "", "noun", function(err, sim, distance){
    if (err){
      console.log("compareWords 5/7 intentional failure!");
    }
  });
  sense2vecHandler.compareWords("", "", "", "", "", "", function(err, sim, distance){
    if (err){
      console.log("compareWords 6/7 intentional failure!");
    }
  });
  sense2vecHandler.compareWords("california", "", "", "", "", "", function(err, sim, distance){
    if (err){
      console.log("compareWords 7/7 intentional failure!");
    }
    cb();
  });
};

module.exports.compareSentences = function(cb){
  console.log('Testing compareSentences');
  sense2vecHandler.compareSentences("Hello my friend", "Hey beautiful", function(err, result){
    if (err || (result == false)){
      console.log("Failure compareSentences #1 " + err);
    }
  });
  sense2vecHandler.compareSentences("I LIKE BIG BUTTS AND I CANNOT LIE", "asvdsv vaVVA", function(err, result){
    if (err || (JSON.parse(result) != false)){
      console.log("Failure compareSentences #2 " + err);
    }
  });
  sense2vecHandler.compareSentences("", "Hey beautiful", function(err, result){
    if (err){
      console.log("compareSentences 1/2 intentional failure!");
    }
  });
  sense2vecHandler.compareSentences("", "", function(err, result){
    if (err){
      console.log("compareSentences 2/2 intentional failure!");
    }
    cb();
  });
};
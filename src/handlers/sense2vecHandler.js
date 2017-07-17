var path = require('path');
var appDir = path.dirname(require.main.filename);
var request = require('request');
var config = require(appDir + '/config');

/*

Return error in CB only if critical error
Return false if no word embedding match found in sensevec system

Otherwise:
getWordVector -> error, word embedding array
compareWords -> error, similarity score (sometimes false), embeddings distance
compareSentences -> error, distance

*/

exports.getWordVector = function(word, ner, partType, cb){
  // Disabled NER for now
  /*if (ner){
    partType = ner;
  }*/
  request("http://" + config.senseVecHost + ":" + config.senseVecPort + "/senseVec/vector?query="+word+"&type="+partType, function (error, response, body) {
    if ((!response)||(response.statusCode != 200)){
      cb("Wrong error code");
    } else if (body.slice(0,6) == "\"ERROR"){
      cb("Missing argument");
    } else if (JSON.parse(body.replace(/\\n/g, "")) == false){
      cb(null, false);
    } else if (!error) {
      try{
        cb(null, JSON.parse(body.replace(/\\n/g, "")).substring(1, JSON.parse(body.replace(/\\n/g, "")).length-1).split(',').map(Number));
      } catch (err) {
        cb(err);
      }
    } else {
      cb(error);
    }
  });
}

exports.compareWords = function(word, ner, partType, word2, ner2, partType2, cb){
  // Disabled NER for now
  /*if (ner){
    partType = ner;
  }
  if (ner2){
    partType2 = ner2;
  }*/
  request("http://" + config.senseVecHost + ":" + config.senseVecPort + "/senseVec/compare?query="+word+"&type="+partType+"&query2="+word2+"&type2="+partType2, function (error, response, compareBody) {
    if ((!response)||(response.statusCode != 200)){
      cb("Wrong error code");
    } else if (compareBody.slice(0,6) == "\"ERROR"){
      cb("Missing argument");
    } else if (!error) {
      request("http://" + config.senseVecHost + ":" + config.senseVecPort + "/senseVec/compareDistance?query="+word+"&type="+partType+"&query2="+word2+"&type2="+partType2, function (error, response, distanceBody) {
        if (response.statusCode != 200){
          cb("Wrong error code");
        } else if (distanceBody.slice(0,6) == "\"ERROR"){
          cb("Missing argument");
        } else if (!error) {
          if ((distanceBody == "null\n")||(distanceBody == "false\n")){
            var distanceResult = false;
          }
          else {
            var distanceResult = distanceBody;
          }
          if ((compareBody == "null\n")||(compareBody == "false\n")){
            var comparisonResult = false;
          }
          else {
            var comparisonResult = compareBody;
          }
          cb(null, comparisonResult, distanceResult);
        } else {
          cb(error);
        }
      });
    } else {
      cb(error);
    }
  });
}

exports.compareSentences = function(sentence1, sentence2, cb){
  sentence1 = sentence1.replace(" ", "+");
  sentence2 = sentence2.replace(" ", "+");
  request("http://" + config.senseVecHost + ":" + config.senseVecPort + "/senseVec/sentence?query="+sentence1+"&query2="+sentence2, function (error, response, body) {
    if ((!response)||(response.statusCode != 200)){
      cb("Wrong error code");
    } else if (body.slice(0,6) == "\"ERROR"){
      cb("Missing argument");
    } else if (!error) {
      if (body == '"false"\n'){
        cb(null, false);
      }
      else {
        cb(null, body);
      }
    } else {
      cb(error);
    }
  });
}
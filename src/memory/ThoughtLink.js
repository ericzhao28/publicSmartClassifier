var path = require('path');
var appDir = path.dirname(require.main.filename);
var ThoughtLinkMod = require(appDir + '/dbModels/ThoughtLink');
var async = require('async');
var ThoughtLinkObject = require(appDir + '/memory/ThoughtLinkObject');
var nodeSenseVecHandler = require(appDir + '/handlers/sense2vecHandler');

// ThoughtLink
module.exports = class ThoughtLink{

  /*
  * 
  * Initialization
  *
  */

  constructor(thought, linkJSON) {
    this.thought = thought;
    this.linkJSON = linkJSON;
    this.relation = linkJSON.relation;
    this.specificRelation = linkJSON.specificRelation;
    this.mongooseObject = new ThoughtLinkMod();
  }

  initiate(noSaveModel, cb){
    var that = this;
    this.loadLinkObjects(function(err){
      if (err){
        cb(err);
      } else if (noSaveModel) {
        cb(null, that);
      } else {
        that.saveThisToDB(cb);
      }
    });
  }

  /*
  *
  * Object handling
  *
  */

  loadLinkObjects(cb) {
    var that = this;
    async.series([
      function(callback) {
        ThoughtLinkObject.save(that, that.linkJSON.subject, that.linkJSON.subjType, that.linkJSON.subjNER, that.linkJSON.subjImp, function(err, result){
          that.subject = result;
          callback(err);
        });
      },
      function(callback) {
        ThoughtLinkObject.save(that, that.linkJSON.object, that.linkJSON.objType, that.linkJSON.objNER, that.linkJSON.objImp, function(err, result){
          that.object = result;
          callback(err);
        });
      }
    ],
    function(err) {
      ////console.log("Finished loading link objects");
      cb(err);
    });
  }

  /*
  *
  * Saving 
  *
  */

  saveThisToDB(cb){
    var that = this;
    ////console.log("Saving to db");
    ThoughtLinkMod.findOne({subject: this.subject.getMongooseObject()._id, object: this.object.getMongooseObject()._id, relation:this.relation, specificRelation:this.specificRelation}, function(err, result){
      if (err){
        cb(err);
      } else if (result){
        //console.log("Old thought link");
        that.mongooseObject = result;
        that.object.updateMongooseObject(result);
        that.subject.updateMongooseObject(result);
        cb(err, that);
      } else {
        //console.log("New thought link");
        that.mongooseObject.subject = that.subject.getMongooseObject()._id;
        that.mongooseObject.object = that.object.getMongooseObject()._id;
        that.mongooseObject.subjectGloss = that.subject.getText(); 
        that.mongooseObject.objectGloss = that.object.getText();
        that.mongooseObject.relation = that.relation;
        that.mongooseObject.linkJSON = JSON.stringify(that.linkJSON);
        that.mongooseObject.specificRelation = that.specificRelation;
        that.mongooseObject.save((err) => { 
          //console.log("New thought link saved, error: " + err);
          cb(err, that);
        });
      }
    });
  }

  /*
  *
  * Information passers (to help Thoughts process grammar)
  *
  */

  getMongooseObject(){
    return this.mongooseObject;
  }
  getRelation(){
    return this.relation;
  }
  getSpecificRelation(){
    return this.specificRelation;
  }
  getObject(){
    return this.object;
  }
  getSubject(){
    return this.subject;
  }
}
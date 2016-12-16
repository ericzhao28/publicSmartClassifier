// ThoughtLinkObject is a fragment of a ThoughtLink, it is equivalent to a entity
var path = require('path');
var appDir = path.dirname(require.main.filename);
var ThoughtLinkObjectMod = require(appDir + '/dbModels/ThoughtLinkObject');
var sense2vec = require(appDir + '/handlers/sense2vecHandler');
var async = require('async');

// ThoughtObject
module.exports = class ThoughtLinkObject{

  /*
  * 
  * Initialization
  *
  */

  constructor(link, text, ner, type, imp) {
    this.link = link;
    this.text = text;
    this.ner = ner;
    this.type = type;
    this.imp = imp;
  }

  /*
  *
  * Saving 
  *
  */

  static save(link, text, type, ner, imp, cb){
    var that = this;
    that.findExistingLinkObject(link.getMongooseObject(), text, type, function(err, existingObject){
      if (err){
        cb(err);
      }
      else if (existingObject){
        //console.log("Old thought link object");
        cb(null, existingObject);
      } else {
        //console.log("New thought link object");
        if (err){
          cb(err);
        } else {
          var thaty = new that(link, text, ner, type, imp);
          thaty.createModel(cb);
        }
      }
    });
  }

  static findExistingLinkObject(link, text, type, cb){
    var that = this;
    ThoughtLinkObjectMod.findOne({text: text.trim(), type: type}, function(err, result){
      if (err){
        cb(err);
      }
      else {
        that.loadModel(link, result, cb);
      }
    });
  }

  /*
  *
  * New linkobjects
  *
  */ 

  createModel(cb){
    var that = this;
    that.mongooseObject = new ThoughtLinkObjectMod();
    that.mongooseObject.text = that.text.trim();
    that.mongooseObject.type = that.type;
    that.mongooseObject.imp = that.imp;
    that.mongooseObject.links.push(that.link.getMongooseObject()._id);
    if (that.ner){
      that.mongooseObject.ner = that.ner;
    }
    that.mongooseObject.save((err) => {
      if (err) {
        cb(err);
      }
      cb(null, that);
    });
  }

  /*
  *
  * Handle existing linkobjects
  *
  */

  static loadModel(link, mongooseObject, cb){
    if (mongooseObject){
      var newInstance = new this(link, mongooseObject.text, mongooseObject.ner, mongooseObject.type, mongooseObject.imp, false);
      newInstance.mongooseObject = mongooseObject;
      newInstance.updateModel(link, function(err){
        cb(err, newInstance)
      });
    } else {
      cb();
    }
  }

  updateModel(link, cb){
    this.mongooseObject.links.push(link._id);
    if (!(this.mongooseObject.ner) && (this.ner)) {
      this.mongooseObject.ner = this.ner;
    }
    this.mongooseObject.save((err) => {
      if (err) {
        cb(err);
      }
      cb();
    });
  }

  /*
  *
  * Fetch props
  *
  */

  getMongooseObject(){
    return this.mongooseObject;
  }

  updateMongooseObject(mongooseObject){
    this.mongooseObject = mongooseObject;
  }

  getText(){
    return this.text;
  }

  getType(){
    return this.type;
  }

  getNER(){
    return this.ner;
  }

}
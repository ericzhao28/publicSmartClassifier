var mongoose = require('mongoose');

var ThoughtLinkSchema = new mongoose.Schema({
  subject: {
    type:String, 
    ref:"ThoughtLinkObject"
  },
  relation: {
    type:String
  },
  specificRelation: {
    type:String
  },
  object: {
    type:String, 
    ref:"ThoughtLinkObject"
  },
  subjectGloss: {
    type:String
  },
  objectGloss: {
    type:String
  },
  linkJSON: {
    type:String
  },
  user: { 
    type: String, ref: 'User' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ThoughtLink', ThoughtLinkSchema);
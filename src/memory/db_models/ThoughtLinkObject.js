var mongoose = require('mongoose');

var ThoughtLinkObjectSchema = new mongoose.Schema({
  text: String,
  ner: String,
  type: String,
  vector: String,
  wildcard: String,
  imp: String,
  links: [{
  	type:String, 
  	ref:"nameLink"
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ThoughtLinkObject', ThoughtLinkObjectSchema);
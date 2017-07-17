var mongoose = require('mongoose');

var ThoughtSchema = new mongoose.Schema({
  query: String,
  semJson: String,
  links: [{
    type:String, 
    ref:"ThoughtLink"
  }],
  centralLinks: [{
    type:String, 
    ref:"ThoughtLink"
  }],
  suppLinks: [{
    type:String, 
    ref:"ThoughtLink"
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Thought', ThoughtSchema);
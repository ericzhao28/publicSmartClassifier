from flask import request
from flask_restful import Resource, reqparse
import numpy as np

class Compare(Resource):
  def __init__(self, argHandler):
    self.argHandler = argHandler

  def get(self):
    args = self.argHandler.parseGeneralArgs(reqparse)
    try:
      query = args.get('query', [])[0].lower().replace(" ", "_")
      grammarType = args.get('type', [])[0].upper()
      query2 = args.get('query2', [])[0].lower().replace(" ", "_")
      grammarType2 = args.get('type2', [])[0].upper()
    except:
      return "ERROR: missing argument"
    if ((not query) or (not query2)):
      return "ERROR: missing argument"

    if (grammarType != ""):
      grammarType = "|" + grammarType
    if (grammarType2 != ""):
      grammarType2 = "|" + grammarType2

    query_vector, success = self.argHandler.getVector(query, grammarType)
    
    if not success:
        return False
    similarities, rawScores = self.argHandler.getSenseVecModel().most_similar(query_vector, n=30000)
    scores = list(rawScores)
    matchingScores = []
    matchingSimilarities = []
    for index, similarity in enumerate(similarities):
      if (query2 + "|") in similarity:
        matchingScores.append(scores[index])
        matchingSimilarities.append(similarity)
    if len(scores) == 0:
      return 0
    else:
      for index, similarity in enumerate(matchingSimilarities):
        if ("|" + grammarType2) in similarity:
          return matchingScores[index]
        else:
          return matchingScores[0]
  

from flask import request
from flask_restful import Resource, reqparse
import numpy as np

class CompareDistance(Resource):
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
    query_vector2, success2 = self.argHandler.getVector(query2, grammarType2)

    if (not success) or (not success2):
        return False

    return float(np.linalg.norm(query_vector - query_vector2))

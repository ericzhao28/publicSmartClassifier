from flask import request
from flask_restful import Resource, reqparse
import numpy as np

class GetVector(Resource):
  def __init__(self, argHandler):
    self.argHandler = argHandler

  def get(self):
    args = self.argHandler.parseGeneralArgs(reqparse)
    try:
      query = args.get('query', [])[0].lower().replace(" ", "_")
      grammarType = args.get('type', [])[0].upper()
    except:
      return "ERROR: missing argument"
    if (not query):
      return "ERROR: missing argument"

    if (grammarType != ""):
      grammarType = "|" + grammarType

    query_vector, success = self.argHandler.getVector(query, grammarType)

    if not success:
        return False

    res = str(query_vector).replace("\\n", "").replace("  ", " ").replace("  ", " ").replace("[ ", "[").replace(" ", ", ")

    return res

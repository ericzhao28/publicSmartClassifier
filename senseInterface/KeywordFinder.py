from flask import request
from flask_restful import Resource, reqparse
import numpy as np
import json

class KeywordFinder(Resource):
  def __init__(self, argHandler):
    self.argHandler = argHandler

  def get(self):
    args = self.argHandler.parseGeneralArgs(reqparse)
    nlp = self.argHandler.getSpacyEn()
    try:
      query = args.get('query', [])[0].lower().replace("+", " ")
    except:
      return "ERROR: missing argument"
    if (not query):
      return "ERROR: missing argument"

    tokens = nlp(query)
    return json.dumps([o.prob for o in tokens])

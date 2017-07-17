from flask import request
from flask_restful import Resource, reqparse
import numpy as np

class Sentence(Resource):
  def __init__(self, argHandler):
    self.argHandler = argHandler

  def get(self):
    args = self.argHandler.parseGeneralArgs(reqparse)
    nlp = self.argHandler.getSpacyEn()
    try:
      query = nlp(args.get('query', [])[0].lower().replace("+", " "))
      query2 = nlp(args.get('query2', [])[0].lower().replace("+", " "))
    except:
      return "ERROR: missing argument"
    if ((not query) or (not query2)):
      return "ERROR: missing argument"
    sentenceSim = query.similarity(query2)
    if (sentenceSim == 0.0) and (not query == query2):
      return "false"
    return sentenceSim
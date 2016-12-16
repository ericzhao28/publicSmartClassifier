from flask import Flask, request, jsonify
from flask_restful import Resource, Api, reqparse
import argparse
import sense2vec
from ArgHandling import ArgHandling
from GetVector import GetVector
from Compare import Compare
from CompareDistance import CompareDistance
from Sentence import Sentence
from KeywordFinder import KeywordFinder

app = Flask(__name__)
api = Api(app)
@app.errorhandler(404)
def pageNotFound(error):
  return "page not found"
@app.errorhandler(500)
def raiseError(error):
  return error
if __name__ == '__main__':
  argHandler = ArgHandling()
  p = argparse.ArgumentParser()
  p.add_argument("--host", help="Host name (default: localhost)")
  p.add_argument("--port", help="Port (default: 5000)")
  p.add_argument("--path", help="Path (default: /senseVec)")
  args = p.parse_args()
  host = args.host if args.host else "localhost"
  path = args.path if args.path else "/senseVec"
  port = int(args.port) if args.port else 5000
  print("Usage: senseVec-apy.py [--host localhost --port 5000 --path senseVec]")
  api.add_resource(GetVector, path+'/vector', resource_class_kwargs={'argHandler': argHandler})
  api.add_resource(Compare, path+'/compare', resource_class_kwargs={'argHandler': argHandler})
  api.add_resource(CompareDistance, path+'/compareDistance', resource_class_kwargs={'argHandler': argHandler})
  api.add_resource(Sentence, path+'/sentence', resource_class_kwargs={'argHandler': argHandler})
  api.add_resource(KeywordFinder, path+'/keyword', resource_class_kwargs={'argHandler': argHandler})
  app.run(host=host, port=port)

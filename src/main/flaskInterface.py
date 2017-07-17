from flask import Flask, request, jsonify
app = Flask(__name__)
import sys
sys.path.insert(0,'../siameseLSTM/')
from lstm import *
sls=lstm("modelData/trainingCheckpoint.p",load=True,training=False, noInit=True)

def scoreComparison(sentence1, sentence2):
  return sls.predict_similarity(sentence1, sentence2)

@app.route("/")
def hello():
    return "<h1>Hi</h1>"

@app.route("/compare")
def compare():
  sentence1 = request.args.get('sentence1').lower()
  sentence2 = request.args.get('sentence2').lower()
  print sentence1
  print sentence2
  print "#######"
  return str(scoreComparison(str(sentence1), str(sentence2))[0])

app.run()
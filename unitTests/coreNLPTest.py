import sys
from pycorenlp import StanfordCoreNLP

try:
  nlp = StanfordCoreNLP('http://localhost:9000')
  print('Connection made. Verifying CoreNLP integrity.')
  output = nlp.annotate("Hello I'm hungry right now", properties={
    'annotators': 'tokenize,ssplit,pos,depparse,lemma,ner,natlog,openie',
    'outputFormat': 'conllu'
  })
  print('CoreNLP is up and running just fine')
except:
  print('CoreNLP server not running at localhost:9000 as needed')
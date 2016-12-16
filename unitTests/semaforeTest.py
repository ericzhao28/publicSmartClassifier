import socket
import sys
from pycorenlp import StanfordCoreNLP

try:
  nlp = StanfordCoreNLP('http://localhost:9000')
  output = nlp.annotate("Hello I'm hungry right now", properties={
    'annotators': 'tokenize,ssplit,pos,depparse,lemma,ner,natlog,openie',
    'outputFormat': 'conllu'
  })
except:
  print('CoreNLP server not running at localhost:9000 as needed to test Semafore')
  sys.exit(0)

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
  s.connect(("localhost", 5001))
  s.settimeout(30)
except ConnectionRefusedError:
  print('Semafore not online')
  sys.exit(0)
s.send(output.encode())

try:
  print('Attempting to connect to Semafore system')  
  semData = s.recv(1024)
except socket.timeout:
  print('Semafore not online')
  sys.exit(0)

if semData.decode() == '{"frames":[{"target":{"name":"Desiring","spans":[{"start":3,"end":4,"text":"hungry"}]},"annotationSets":[{"rank":0,"score":72.31273622416344,"frameElements":[{"name":"Experiencer","spans":[{"start":1,"end":2,"text":"I"}]}]}]},{"target":{"name":"Correctness","spans":[{"start":4,"end":5,"text":"right"}]},"annotationSets":[{"rank":0,"score":62.265558296504,"frameElements":[]}]},{"target":{"name":"Temporal_collocation","spans":[{"start":5,"end":6,"text":"now"}]},"annotationSets":[{"rank":0,"score":31.06582492516722,"frameElements":[{"name":"Landmark_period","spans":[{"start":4,"end":6,"text":"right now"}]},{"name":"Trajector_event","spans":[{"start":1,"end":4,"text":"I \'m hungry"}]}]}]}],"tokens":["Hello","I","\'m","hungry","right","now"]}\n':
  print("Semafore system up and running")
else:
  print("Unable to validate Semafore integrity")
s.close()

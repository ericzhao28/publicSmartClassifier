import sys
from lstm import *
sls=lstm("../modelData/trainingCheckpoint1.p",load=True,training=False, noInit=True)

def scoreComparison(sentence1, sentence2):
  return sls.predict_similarity(sentence1, sentence2)

while True:
  try:
    print scoreComparison(raw_input("s1: "), raw_input("s2: "))  
  except:
    continue
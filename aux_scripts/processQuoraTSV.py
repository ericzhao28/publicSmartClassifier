import csv
import numpy as np
import pickle

quoraData = list()

with open('quora.tsv','rb') as tsvin:
  tsvin = csv.reader(tsvin, delimiter="\t")
  for i,row in enumerate(tsvin):
    if i==0:
      continue
    quoraData.append(np.array([row[3], row[4], row[5]]))

with open('quoraData.p', 'wb') as handle:
  pickle.dump(quoraData, handle, protocol=pickle.HIGHEST_PROTOCOL)
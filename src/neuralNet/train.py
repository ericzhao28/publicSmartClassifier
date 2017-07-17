import sys
sys.path.insert(0,'../siameseLSTM/')

from lstm import *

# Syn_aug=True # it False faster but does slightly worse on Test dataset

# Create lstm with bestsem.p as the default the creatrnnx()
sls=lstm("modelData/bestsem.p",load=False,training=True)

#print "Pre-training"
# Load in pre-training data
# train=pickle.load(open("semtrain.p","rb"))#[:-8]
# train=sanitize(train) # sanitize defined in sentences.py
# jfor i in range(3):
#  sls.train_lstm(train,5)
#   sls.saveModel("preTrainingCheckpointn.p")
# print "Pre-training done"

train=pickle.load(open("auxData/quoraData.p",'rb'))
train=sanitize(train) # sanitize defined in sentences.py

for i in range(15):
  sls.train_lstm(train,10) # 375 iterations normally
  sls.saveModel("modelData/trainingCheckpointProper"+str(i//5)+".p")

sls.saveModel("modelData/completeTraining.p")

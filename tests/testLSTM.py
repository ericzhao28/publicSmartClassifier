import pickle, sys
sys.path.insert(0,'../siameseLSTM')
from lstm import *

sls = lstm("bestsem.p", load=True, training=False)

test=pickle.load(open("semtest.p",'rb'))
print sls.chkterr2(test)

sls = lstm("trainingCheckpoint1.p", load=True, training=False, noInit = True)

test=pickle.load(open("semtest.p",'rb'))
print sls.chkterr2(test)

import sys
sys.path.insert(0,'../siameseLSTM/')

from lstm import *


sls=lstm("bestsem.p",load=True,training=False)

sa="A truly wise man"
sb="He is smart"
print sls.predict_similarity(sa,sb)*4.0+1.0
sls.saveModel()

newSls=lstm("lstmModel.p",load=True,training=False, noInit=True)
sa="A truly wise man"
sb="He is smart"
print newSls.predict_similarity(sa,sb)*4.0+1.0

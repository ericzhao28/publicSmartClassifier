import pickle, re, random, sys, time, theano
import numpy as np
import scipy.stats as meas
from collections import OrderedDict
from theano import config
import theano.tensor as tensor
from theano.sandbox.rng_mrg import MRG_RandomStreams as RandomStreams
from sentences import *

# Return a string combining pp and name
def _p(string1, string2):
    return '%s%s' % (string1, string2)


def np_floatX(data):
    return np.asarray(data, dtype=config.floatX)

# Populate tparams orderedDict with shared value versions of params
def init_tparams(params):
    tparams = OrderedDict()
    for kk, pp in params.iteritems():
        tparams[kk] = theano.shared(params[kk], name=kk)
    return tparams

# Fetch layer via key
def get_layer(name):
    fns = layers[name]
    return fns

# Create random samples from Gaussian distribution
def genm(mu,sigma,n1,n2):
    return np.random.normal(mu,sigma,(n1,n2))

# Generates custom LSTM layers for neural network generation
def generateLayer(neuralNetwork,nameOfLayer,size,sizeIn):
    mu=0.0
    sigma=0.2
    # 4*size, size of random initalized 0.0-0.2/sqrt(size)
    U = np.concatenate([genm(mu,sigma,size,size),genm(mu,sigma,size,size),genm(mu,sigma,size,size),genm(mu,sigma,size,size)])/np.sqrt(size)
    U=np.array(U,dtype=config.floatX)
    neuralNetwork[nameOfLayer+'U'] = U
    # U: (size*4, size), type=config.floatX

    W =np.concatenate([genm(mu,sigma,size,sizeIn),genm(mu,sigma,size,sizeIn),genm(mu,sigma,size,sizeIn),genm(mu,sigma,size,sizeIn)])/np.sqrt(np.sqrt(size*sizeIn))
    W=np.array(W,dtype=config.floatX)
    neuralNetwork[nameOfLayer+'W'] = W
    # W: (size*4, sizeIn), type=config.floatX

    # b is bias, uniform down specific columns
    b = np.random.uniform(-0.5,0.5,size=(4*size,))
    # forget gates set to 1.5
    b[size:size*2]=1.5
    neuralNetwork[nameOfLayer+'b'] = b.astype(config.floatX)

    return neuralNetwork

# Generate neural network structure
def createNeuralNetwork():
    neuralNetwork=OrderedDict()
    print("Creating neural network")
    neuralNetwork=generateLayer(neuralNetwork,'1lstm1_',50,300)
    neuralNetwork=generateLayer(neuralNetwork,'2lstm1_',50,300)
    return neuralNetwork

# Dropout regularization - randomly deactivate neurons
def dropout_layer(state_before, use_noise, rrng, rate):
    proj = tensor.switch(use_noise,
                         (state_before * rrng),
                         state_before * (1-rate))
    return proj

# To add a layer
def getpl2(prevlayer,pre,mymask,used,rrng,size,optimizedNeuralNet):
    proj = lstm_layer2(optimizedNeuralNet, prevlayer, options,
                                        prefix=pre,
                                        mask=mymask,nhd=size)
    if used:
        print("Added dropout")
        proj = dropout_layer(proj, use_noise, rrng,0.5)
        
    return proj

# Create layer object
def lstm_layer2(optimizedNeuralNet, state_below, options, prefix='lstm', mask=None,nhd=None):
    nsteps = state_below.shape[0]
    if state_below.ndim == 3:
        n_samples = state_below.shape[1]
    else:
        n_samples = 1

    assert mask is not None

    def _slice(_x, n, dim):
        if _x.ndim == 3:
            return _x[:, :, n * dim:(n + 1) * dim]
        return _x[:, n * dim:(n + 1) * dim]

    def _step(m_, x_, h_, c_):
        preact = tensor.dot(h_, optimizedNeuralNet[_p(prefix, '_U')].T)
        preact += x_
        preact += optimizedNeuralNet[_p(prefix, '_b')]

        i = tensor.nnet.sigmoid(_slice(preact, 0, -))
        f = tensor.nnet.sigmoid(_slice(preact, 1, nhd))
        o = tensor.nnet.sigmoid(_slice(preact, 2, nhd))
        c = tensor.tanh(_slice(preact, 3, nhd))

        c = f * c_ + i * c
        c = m_[:, None] * c + (1. - m_)[:, None] * c_

        h = o * tensor.tanh(c)
        h = m_[:, None] * h + (1. - m_)[:, None] * h_

        return [h, c]

    state_below = (tensor.dot(state_below, optimizedNeuralNet[_p(prefix, '_W')].T) +
                   optimizedNeuralNet[_p(prefix, '_b')].T)
    dim_proj = nhd

    # loop updates
    [hvals,yvals], updates = theano.scan(_step,
                                sequences=[mask, state_below],
                                outputs_info=[tensor.alloc(np_floatX(0.),
                                                           n_samples,
                                                           dim_proj),
                                              tensor.alloc(np_floatX(0.),
                                                           n_samples,
                                                           dim_proj)],
                                name=_p(prefix, '_layers'),
                                n_steps=nsteps)

    return hvals

# Adaptive learning rate method: https://arxiv.org/abs/1212.5701 
def adadelta(learningRate, neuralNet, grads, emb11,mask11,emb21,mask21,y, cost):
    zipped_grads = [theano.shared(p.get_value() * np_floatX(0.),
      name='%s_grad' % k)
    for k, p in neuralNet.iteritems()]
    running_up2 = [theano.shared(p.get_value() * np_floatX(0.),
       name='%s_rup2' % k)
    for k, p in neuralNet.iteritems()]
    running_grads2 = [theano.shared(p.get_value() * np_floatX(0.),
        name='%s_rgrad2' % k)
    for k, p in neuralNet.iteritems()]
    zgup = [(zg, g) for zg, g in zip(zipped_grads, grads)]
    rg2up = [(rg2, (0.95 * rg2 + 0.05* (g ** 2)))
    for rg2, g in zip(running_grads2, grads)]

    f_grad_shared = theano.function([emb11,mask11,emb21,mask21,y], cost, updates=zgup + rg2up,
        name='adadelta_f_grad_shared')

    updir = [-tensor.sqrt(ru2 + 1e-6) / tensor.sqrt(rg2 + 1e-6) * zg
    for zg, ru2, rg2 in zip(zipped_grads,
       running_up2,
       running_grads2)]
    ru2up = [(ru2, (0.95 * ru2 + 0.05 * (ud ** 2)))
    for ru2, ud in zip(running_up2,updir)]
    param_up = [(p, p + ud) for p, ud in zip(neuralNet.values(), updir)]

    f_update = theano.function([learningRate], [], updates=ru2up + param_up,
     on_unused_input='ignore',
     name='adadelta_f_update')

    return f_grad_shared, f_update

class lstm():    
    # nam loads in bestsem.p
    def __init__(self,nam,load=False,training=False, noInit=False):

        neuralNet=createNeuralNetwork()

        # Make sure weights are symmetric
        for i in neuralNet.keys():
            if i[0]=='1':
                neuralNet['2'+i[1:]]=neuralNet[i]

        y = tensor.vector('y', dtype=config.floatX)
        mask11 = tensor.matrix('mask11', dtype=config.floatX)
        mask21 = tensor.matrix('mask21', dtype=config.floatX)
        emb11=theano.tensor.ftensor3('emb11')
        emb21=theano.tensor.ftensor3('emb21')

        # 
        if load==True:
            neuralNet=pickle.load(open(nam,'rb'))

        # Convert neural network weights and gates to GPU optimizable theanos-shared tensors
        if noInit == True:
            self.optimizedNeuralNet = neuralNet
        else:
            self.optimizedNeuralNet=init_tparams(neuralNet)

        trng = RandomStreams(1234)
        use_noise = theano.shared(np_floatX(0.))
    
        rate=0.5

        # Handles dropout regularization
        rrng=trng.binomial(emb11.shape, p=1-rate, n=1, dtype=emb11.dtype)
    
        # LSTM #1 output
        # emb*, mask* are dynamic and the result of what we want to forward propogate
        proj11=getpl2(emb11,'1lstm1',mask11,False,rrng,50,self.optimizedNeuralNet)[-1]
        # LSTM #2 output
        proj21=getpl2(emb21,'2lstm1',mask21,False,rrng,50,self.optimizedNeuralNet)[-1]

        # calculate difference between values reached by the two lstms
        dif=(proj21-proj11).norm(L=1,axis=1)
        # logistic function
        s2=tensor.exp(-dif)
        # limit max
        sim=tensor.clip(s2,1e-7,1.0-1e-7)

        # learning rate
        learningRate = tensor.scalar(name='learningRate')

        # calculate cost using mean squared error
        ys=tensor.clip((y-1.0)/4.0,1e-7,1.0-1e-7)
        cost=tensor.mean((sim - ys) ** 2)

        ns=emb11.shape[1]

        self.f2sim=theano.function([emb11,mask11,emb21,mask21],sim,allow_input_downcast=True)

        # Set up for training
        if training==True:
            # Set up a tensor for the gradients we'll need for adadelta
            gradi = tensor.grad(cost, wrt=self.optimizedNeuralNet.values())
            grads=[]
            l=len(gradi)

            # Update gradients
            for i in range(0,l/2):
                gravg=(gradi[i]+gradi[i+l/2])/(4.0)
                grads.append(gravg)
            for i in range(0,len(self.optimizedNeuralNet.keys())/2):
                    grads.append(grads[i])
            self.f_grad_shared, self.f_update = adadelta(learningRate, self.optimizedNeuralNet, grads, emb11, mask11, emb21, mask21,y, cost)
    
    def saveModel(self, saveUrl="lstmModel.p"):
        with open(saveUrl,'wb') as handle:
            pickle.dump(self.optimizedNeuralNet, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def train_lstm(self,train,max_epochs):
        # Handle display counters
        print "Training"
        freq=0
        dfreq=40#display frequency

        batchsize=32
        valfreq=800# Validation frequency
        lrate=0.0001
        precision=2

        # Run through epochs
        for epoch in xrange(0,max_epochs):
            timeTaken=time.time()
            print 'Epoch', epoch

            trainingSize=len(train)
            randomDatapointIndex=random.sample(xrange(len(train)),len(train))

            for i in range(0,trainingSize,batchsize):
                q=[]

                # Determine batch size, limit by training size
                x=i+batchsize
                if x>trainingSize:
                    x=trainingSize

                # Iterate through the data points, adding a BATCHSIZE number of data points to q. Cycling through the existing data size with a changing start index
                for z in range(i,x):
                    q.append(train[randomDatapointIndex[z]])
                x1,regDropoutMask1,x2,regDropoutMask2,y2=helper.prepare_data(q)
                

                # Add noise during training
                ls=[]
                ls2=[]
                freq+=1
                use_noise.set_value(1.)

                for j in range(0,len(x1)):
                    # Embedding is helper.embed(helper.prepare_data(q))
                    ls.append(helper.embed(x1[j]))
                    ls2.append(helper.embed(x2[j]))

                # for each: batch size * feature length for training
                trconv=np.dstack(ls)
                trconv2=np.dstack(ls2)
                emb2=np.swapaxes(trconv2,1,2)
                emb1=np.swapaxes(trconv,1,2)
               
                # Update using gradient 
                cost=self.f_grad_shared(emb2, regDropoutMask2, emb1,regDropoutMask1,y2)
                s=self.f_update(lrate)

                # Handle visual updates
                if np.mod(freq,dfreq)==0:
                    print 'Epoch ', epoch, 'Update ', freq, 'Cost ', cost

            sto=time.time()
            print "Epoch took:",sto-timeTaken
        
    def predict_similarity(self,sa,sb):
        q=[[sa,sb,0]]
        x1,regDropoutMask1,x2,regDropoutMask2,y2=helper.prepare_data(q)
        ls=[]
        ls2=[]

        # We don't have any noise here
        use_noise.set_value(0.)
        for j in range(0,len(x1)):
            ls.append(helper.embed(x1[j]))
            ls2.append(helper.embed(x2[j]))

        trconv=np.dstack(ls)
        trconv2=np.dstack(ls2)
        emb2=np.swapaxes(trconv2,1,2)
        emb1=np.swapaxes(trconv,1,2)
        return self.f2sim(emb1,regDropoutMask1,emb2,regDropoutMask2)

    def predict_vector(self,sa):
        x1 = np.array(sa.split())
        use_noise.set_value(0.)
        trconv=np.dstack([helper.embed(x1)])
        emb1=np.swapaxes(trconv,1,2)

        return emb1
        
    # Check error over test dataset
    def chkterr2(self, mydata):
        count=[]
        num=len(mydata)
        px=[]
        yx=[]
        use_noise.set_value(0.)
        for i in range(0,num,256):
            q=[]
            x=i+256
            if x>num:
                x=num
            for j in range(i,x):
                q.append(mydata[j])
            x1,mas1,x2,mas2,y2=helper.prepare_data(q)
            ls=[]
            ls2=[]
            embedError = False
            for j in range(0,len(q)):
                if type(helper.embed(x1[j])) == bool or type(helper.embed(x2[j])) == bool:
                    embedError = True
                    print "pre error"
                    break
                ls.append(helper.embed(x1[j]))
                ls2.append(helper.embed(x2[j]))
            if embedError:
                print "error"
                continue
            trconv=np.dstack(np.array(ls))
            trconv2=np.dstack(np.array(ls2))
            emb2=np.swapaxes(trconv2,1,2)
            emb1=np.swapaxes(trconv,1,2)
            pred=(self.f2sim(emb1,mas1,emb2,mas2))*4.0+1.0
            for z in range(0,len(q)):
                yx.append(y2[z])
                px.append(pred[z])
        px=np.array(px)
        yx=np.array(yx)
        return np.mean(np.square(px-yx)),meas.pearsonr(px,yx)[0],meas.spearmanr(yx,px)[0]

# Define variables for sentences.py
d2=pickle.load(open("synsem.p",'rb'))
dtr=pickle.load(open("dwords.p",'rb'))
prefix='lstm'
noise_std=0.
use_noise = theano.shared(np_floatX(0.))
flg=1
training=False #Loads best saved model if False
Syn_aug=True # If true, performs better on Test dataset but longer training time
options=locals().copy()

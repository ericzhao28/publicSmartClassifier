import numpy as np
import pickle, random, re
from gensim.models import word2vec
from nltk.corpus import stopwords

cachedStopWords = stopwords.words("english")

# {'word':['alternative','saying']} format, contains alternatives
alternativeSpellingsDict=pickle.load(open("auxData/synsem.p",'rb'))

# {'word':'wordUsuallyTheSame'} format, contains dictionary that all words must hold
knownSpellingsDict=pickle.load(open("auxData/dwords.p",'rb'))

import sys
sys.path.insert(0,'../')
#from senseHelper import fetchSimReddit

print "Loading word2vec"

# Swap out for concept vectors
word2vecModel = word2vec.Word2Vec.load_word2vec_format("auxData/globalWordModels.bin.gz",binary=False)

# Takes an array of sentence-match data points, [{a,b,y}]
# Gives back 5: word-embedding based matrix for sentence 1, mask 1, sentence 2 matrix, y 
def prepare_data(data):
    # Isolate into three different arrays
    xa1=[]
    xb1=[]
    y2=[]
    for i in range(0,len(data)):
        xa1.append(data[i][0])
        xb1.append(data[i][1])
        y2.append(data[i][2])
    lengths=[]

    # Iterate through each x array and attach to [lengths] the length of each sentence
    for i in xa1:
        lengths.append(len(i.split()))
    for i in xb1:
        lengths.append(len(i.split()))

    # Calculate longest sentence out of all points and subsections included in data arg
    maxlen = np.max(lengths)

    # Generate 2 matrixes for each of the input sentence vectors
    emb1,regDropoutMask1=getMatrix(xa1,maxlen)
    emb2,regDropoutMask2=getMatrix(xb1,maxlen)

    y2=np.array(y2,dtype=np.float32)

    return emb1,regDropoutMask1,emb2,regDropoutMask2,y2

# Generate filled x matrix for shorter sentences, and also mask for dropout reg
def getMatrix(xList, maxlen):
    n_samples = len(xList)
    filledXs=[]
    x_mask = np.zeros((maxlen, n_samples)).astype(np.float32)
    for i in range(0,len(xList)):
        # For each X's string, generate token list
        q=xList[i].split() 
        # Generate mask for regularization (dropout)
        for j in range(0,len(q)):
            x_mask[j][i]=1.0
        # Fill up shorter utterances with blanks
        while(len(q)<maxlen):
            q.append(',')

        filledXs.append(q)
    xList=np.array(filledXs)
    return xList,x_mask

# Swap out senseHelper embedding finding
# Convert sentence into array of word embeddings (excluding commas)
def embed(stmx):
    stmx = np.array(stmx)
    #stmx=stmx.split()
    dmtr=np.zeros((stmx.shape[0],300),dtype=np.float32)
    count=0
    while(count<len(stmx)):
        if stmx[count]==',':
            count+=1
            continue
        if stmx[count] in word2vecModel:
            dmtr[count] = word2vecModel[stmx[count]]
            count+=1
            continue 
        if re.compile('[^a-zA-Z0-9]').sub('', stmx[count]) in word2vecModel:
            dmtr[count] = word2vecModel[re.compile('[^a-zA-Z0-9]').sub('', stmx[count])]
            count+=1
            continue
        if re.compile('[^a-zA-Z0-9 ]').sub('', stmx[count]) in word2vecModel:
            dmtr[count] = word2vecModel[re.compile('[^a-zA-Z0-9]').sub('', stmx[count])]
            count+=1
            continue
        if stmx[count].lower() in word2vecModel:
            dmtr[count] = word2vecModel[stmx[count].lower()]
            count+=1
            continue
        if stmx[count].upper() in word2vecModel:
            dmtr[count] = word2vecModel[stmx[count].upper()]
            count+=1
            continue
        else:
            count+=1
            return False
        count += 1
    return dmtr


# Build alternative sentences using synonyms
def generateAlternativeDatas(s,data):
    counter=0

    # Create an array of tokens
    x2 = s.split() 

    # Duplicate x
    x=[] 
    for i in x2:
        x.append(i)
   
    # Cycle through x string's words
    for i in range(0, len(x)):
        token = x[i]
        mst=''

        # Skip token if not in a list with alternative wordings
        if token not in alternativeSpellingsDict:
            continue

        # Skip stop words in any capitalization schema
        if token in cachedStopWords or token.title() in cachedStopWords or token.lower() in cachedStopWords:
            continue

        # If token both in alt and word2vecModel, generate alt token
        if token in alternativeSpellingsDict or token.lower() in alternativeSpellingsDict:
            if unicode(token) not in word2vecModel:
                alternativeToken=''
                continue
            alternativeToken = findsim(token)

        # If alt token in word2vecModel
        if unicode(alternativeToken) in word2vecModel:
            # Make sure that the alt isn't the original lol
            if token.lower() == alternativeToken.lower():
                alternativeToken = ''
                continue
            # If alt too different, drop it
#            if word2vecModel.similarity(q,alternativeToken)<0.6:
#                continue

            # Replace this token with aternative
            x[i] = alternativeToken

            # If original has 'ing' and the alt has a 'ing'-version in the model, swap for the 'ing' version
            if token.find('ing') != -1:
                if unicode(x[i]+'ing') in word2vecModel:
                    x[i]+='ing'
                if unicode(x[i][:-1]+'ing') in word2vecModel:
                    x[i]=x[i][:-1]+'ing'

            # If original has 'ed' and the alt has a 'ed'-version in the model, swap for the 'ed' version
            if token.find('ed')!=-1:
                if unicode(x[i]+'ed') in word2vecModel:
                    x[i]+='ed'
                if unicode(x[i][:-1]+'ed') in word2vecModel:
                    x[i]=x[i][:-1]+'ed'

            counter += 1

    return ' '.join(x), counter

# Return a random alternative spelling for a given word
def findsim(token):
    alternativeSpellingsArray = alternativeSpellingsDict[token]
    randomAltInd = random.randint(0,len(alternativeSpellingsArray)-1)
    return alternativeSpellingsArray[randomAltInd]

# Check for duplicate string existence in the dataset
def check(sa,sb,dat):
    for i in dat:
        if sa==i[0] and sb==i[1]:
            return False
        if sa==i[1] and sb==i[0]:
            return False
    return True

# Check if vocab exists
def stringClean(string):
    if type(embed(string.split())) == bool:
        if embed(string.split()) == False:
          return False

    return True

def expand(data):
    # Called during training to increase accuracy at time cost
    finalDataset = []
    tempDataset = []
    for m in range(0,10):
        for i in data: 
            # get first string in data point
            firstString, cnt1=generateAlternativeDatas(i[0],data) 
            # get second string in data point
            secondString, cnt2=generateAlternativeDatas(i[1],data) 

            if stringClean(i[0]) and stringClean(i[1]):
                finalDataset.append(i)

            # If update to string was made
            if cnt1>0 and cnt2>0: 
                # Add new updated string to dataset
                l1=[firstString,secondString,i[2]]
                tempDataset.append(l1)

    # Recreate updatedDataset without any repeated points
    for i in tempDataset:
        if check(i[0],i[1],data):
            if stringClean(i[0]) and stringClean(i[1]):
                finalDataset.append(i)

    return np.array(finalDataset)
    
def sanitize(data):
    # mandatory
    finalDataset = []
    for i in data: 
        if stringClean(i[0]) and stringClean(i[1]):
            finalDataset.append(i)

    print "sanitization complete"
    return np.array(finalDataset)

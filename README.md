### This commit will not work. Please refer to commit `dd8ca0866005575e5b666fc32c0a5accf2782037` for a working version.

# SmartClassifier (under development)
A novel query classification engine currently under development. We employ three primary inputs for our learning algorithms:
* Word embedding dependencies, modified to track complete NER phrases and long-distance links
* Framenet-style parsed structures
* Traditional statistics, such as length, keywords, and average embedding vector values

A Manhattan LSTM approach is used for learning. In this version, rudimentary perceptron layers are used as a dummy.

[![Maintenance Intended](http://maintained.tech/badge.svg)](http://maintained.tech/)

## Instructions

* Initiate external frameworks by calling `initiate.sh`
* Verify frameworks are online by calling unitTests/ for Mongo, Semafor and CoreNLP
* Verify the project works by calling `verifyProjectIntegrity.js`
* Run `core.js`

## Bugs and problems

* Scoring system is biased towards longer queries 
* High E_in due to inherent limitations of the rudimentary perceptron layers currently in place.

## Installation

Install all modules (`npm install`)
Install all frameworks: MongoDB, Semafor, CoreNLP, Sense2vec. Update the locations of those frameworks in `initiate.sh`
Install python reqs: 
* `virtualenv -p /usr/bin/python3 venv --no-site-packages`
* `source venv/bin/activate`
* `pip install -r requirements.txt`
Replace the sample data in data/ with your own.


# License

Copyright Eric Zhao, All Rights Reserved

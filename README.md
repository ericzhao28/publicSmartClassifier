### This repo is the development repo and is going through refactoring. If you are in the Whimmly organization, refer to the larger meta-project to find the main repository with a working branch. The working repo's development branch points to this repository.

# SmartClassifier
A novel query classification engine currently under development. We employ three primary inputs for our learning algorithms:
* Word embedding dependencies, modified to track complete NER phrases and long-distance links
* Framenet-style parsed structures
* Traditional statistics, such as length, keywords, and average embedding vector values

A Manhattan LSTM approach is used for learning. In this version, rudimentary perceptron layers are used as a dummy.

[![Maintenance Intended](http://maintained.tech/badge.svg)](http://maintained.tech/)

## Instructions

* Initiate external frameworks by calling `auxillary_scripts/initiate_auxillaries.sh`
* Verify frameworks are online by calling `tests/` for Mongo, Semafor and CoreNLP
* Verify the project works by calling `tests/verifyProjectIntegrity.js`
* Run `src/main/core.js`

## Bugs and problems

* Scoring system is biased towards longer queries 
* High E_in due to inherent limitations of the rudimentary perceptron layers currently in place.

## Installation

Install all modules (`npm install`)
Install all frameworks: MongoDB, Semafor, CoreNLP, Sense2vec. Update the locations of those frameworks in `initiate.sh`
Install python reqs: 
* `virtualenv -p /usr/bin/python2 venv --no-site-packages`
* `source venv/bin/activate`
* `pip install -r requirements.txt`
Replace the sample data in data/ with your own.


# License

Copyright 2014 Eric Zhao

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

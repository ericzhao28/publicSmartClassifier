# SmartClassifier (UNDER DEVELOPMENT - IT MAY NOT COMPILE CURRENTLY)
A novel query classification engine currently under development. We employ three primary techniques of classification:
* Comparing word embedding dependencies of target query and base queries
* Comparing Framenet-style parsing of target query with those of base queries
* Identifying traditional statistics of the sentence, such as length, keywords, and average embedding vector values
Classification via comparisons and identification are conducted via neural networks. Currently, dummy-PLAs are in place.

[![Maintenance Intended](http://maintained.tech/badge.svg)](http://maintained.tech/)

## Instructions

* Initiate external frameworks by calling `initiate.sh`
* Verify frameworks are online by calling unitTests for Mongo, Semafor and CoreNLP
* Verify the project works by calling `verifyProjectIntegrity.js`
* Run `core.js`

## Installation

Install all modules (`npm install`)
Install all frameworks: MongoDB, Semafor, CoreNLP, Sense2vec. Update the locations of those frameworks in `initiate.sh`
Replace the sample data in data/ with your own.


# License

Copyright Eric Zhao, All Rights Reserved
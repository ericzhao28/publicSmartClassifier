from pycorenlp import StanfordCoreNLP
from copy import deepcopy
from JsonEncoder import JsonEncoder
from Dependency import Dependency
from Component import Component
import sys
import json
import re
import logging
import requests
import threading
import socket

# Logging stuff
logging.basicConfig(filename='dependencyQueryLog.log',level=logging.DEBUG)
logging.basicConfig(filename=sys.stdout,level=logging.DEBUG)

class Query():
  
  def __init__(self, queryText):
    self.queryText = queryText.capitalize()
    self.output = self.connectToServer()  
    self.tokens = self.output['tokens']  
    self.components = []
    self.semComponents = []
    r = requests.get('http://localhost:5000/senseVec/keyword?query=' + "+".join([o['word'] for o in self.tokens]))
    if (r.status_code == 200):
      self.importantScores =  json.loads(r.json())
    rSem = requests.get('http://localhost:5000/senseVec/keyword?query=' + "+".join([o['word'] for o in self.semData.tokens]))
    if (rSem.status_code == 200):
      self.semImportantScores =  json.loads(rSem.json())
    for index, token in enumerate(self.tokens):
      self.components.append(Component(index, token['word'], token['pos'], self.importantScores[index]))
    for index, token in enumerate(self.semData.tokens):
      self.semComponents.append(Component(index, token['word'], "semData", self.semImportantScores[index]))
    self.dependencies = []
    for newDependency in self.output['collapsed-ccprocessed-dependencies']:
      self.dependencies.append(Dependency.buildNormalDependency(newDependency, self.components))
    self.processDependencies()
    for dependency in self.dependencies:
      if dependency.depType != "ROOT":
        dependency.intermediateRedirect()
    for dependency in self.dependencies:
      if dependency.depType != "ROOT":
        dependency.compensateForType()
    self.longRangeDependencies = self.longRangeLinking()

  ################### Setup #####################

  def connectToServer(self):
    self.nlp = StanfordCoreNLP('http://localhost:9000')
    t1 = threading.Thread(target=self.getJsonFromServer)
    t2 = threading.Thread(target=self.getSemFromServer)
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    return self.jsonOutput

  def getJsonFromServer(self):
    try:
      self.jsonOutput = self.nlp.annotate(self.queryText, properties={
        'annotators': 'tokenize,ssplit,pos,depparse,lemma,ner,natlog,openie',
        'outputFormat': 'json'
      })['sentences'][0]
    except TypeError:
      sys.exit("Invalid input")
    return 

  def getSemFromServer(self):
    try:
      output = self.nlp.annotate(self.queryText, properties={
        'annotators': 'tokenize,ssplit,pos,depparse,lemma,ner,natlog,openie',
        'outputFormat': 'conllu'
      })
    except TypeError:
      sys.exit("Invalid input")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(("localhost", 5001))
    s.send(output.encode())
    self.semData = s.recv(102040).decode()
    s.close()
    return 

  ###############################################

  ############ Processing compounds #############

  def processDependencies(self):
    self.calculateNER()
    for dependency in self.dependencies:
      if dependency.depType != "ROOT":
        dependency.combineCompound(self.dependencies, "compound")
        dependency.combineCompound(self.dependencies, "goeswith")
    for component in self.components:
      component.repopulateGloss(self.tokens)

  def calculateNER(self):
    allNERs = []
    for index, token in enumerate(self.tokens):
      if (token['ner'] != "O") and not (index in allNERs):
        logging.info("NER ID'd for token #" + str(index))
        nerList = [index]
        allNERs.append(index)
        if index != 0:
          leftTokenIndex = index - 1
          leftToken = self.tokens[leftTokenIndex]
          while (token['ner'] == leftToken['ner']):
            nerList.append(leftTokenIndex)
            allNERs.append(leftTokenIndex)
            if (leftTokenIndex != 0):
              leftTokenIndex -= 1
              leftToken = self.tokens[leftTokenIndex]
            else:
              break
        if index < (len(self.tokens) - 1):
          rightTokenIndex = index + 1
          rightToken = self.tokens[rightTokenIndex]
          while (token['ner'] == rightToken['ner']):
            nerList.append(rightTokenIndex)
            allNERs.append(rightTokenIndex)
            rightTokenIndex += 1
            if (rightTokenIndex < (len(self.tokens) - 1)):
              rightToken = self.tokens[rightTokenIndex]
            else:
              break
        for index in nerList:
          self.components[index].updateNER(nerList, token['ner'])

  #########################################

  ############### Printing ################

  def getJsonDetails(self):
    jsonRelationships = []
    for dependency in self.dependencies:
      if not dependency.checkIfIgnore():
        jsonRelationships.append(dependency.cleanJson())
    for longRelation in self.longRangeDependencies:
      if not longRelation.checkIfIgnore():
        jsonRelationships.append(longRelation.cleanJson())
    jsonRelationships = [dict(t) for t in set([tuple(d.items()) for d in jsonRelationships])]
    return (json.dumps({"result":jsonRelationships, "semData": json.loads(self.semData)}, separators=(',', ':'), cls=JsonEncoder))

  def prettyPrint(self, dependencies):
    printing = []
    for dependency in dependencies:
      if not dependency.checkIfIgnore():
        if str(dependency) not in printing:
          printing.append(str(dependency))
    return (printing)
    
  #########################################

  ########## Long range linking ###########

  def longRangeLinking(self):
    longRangeDependencies = []
    for component in self.components:
      logging.info("Base component: " + component.getGloss() + " with wheredependent len: " + str(len(component.getWhereDependent())))
      for dependency in component.getWhereDependent():
        if (not dependency.checkIfIgnore()) and (dependency.getGeneralType() == "central"):
          logging.info("Skipped component: " + dependency.getGovernor().getGloss())
          longRangeDependencies = (self.longRangeRecursiveSearch(component, dependency.getGovernor().getWhereDependent(), longRangeDependencies))
      logging.info("\n\n\n");
    return longRangeDependencies

  def longRangeRecursiveSearch(self, baseComponent, filteredDependencies, newDependencies):
    logging.info("Long range inititated, # of stuff to do: " + str(len(filteredDependencies)) + " : " + str(self.prettyPrint(filteredDependencies)))
    logging.info("Dependencies so far: " + str(self.prettyPrint(newDependencies)))
    for dependency in filteredDependencies:
      if (not dependency.checkIfIgnore()) and (dependency.getGeneralType() == "central"):
        logging.info("New component: " + dependency.getGovernor().getGloss())
        self.prettyPrint(filteredDependencies)
        if (Dependency(baseComponent, dependency.getGovernor(), "longrange", False) in newDependencies):
          logging.info("Duplicate")
          return newDependencies
        newDependencies.append(Dependency(baseComponent, dependency.getGovernor(), "longrange", False))
        if len(dependency.getGovernor().getWhereDependent()) > 0:
          logging.info(len(dependency.getGovernor().getWhereDependent()))
          logging.info("New one " + str(dependency.getGovernor().getGloss()) + "\n");
          newDependencies = (self.longRangeRecursiveSearch(baseComponent, dependency.getGovernor().getWhereDependent(), newDependencies))
    return newDependencies
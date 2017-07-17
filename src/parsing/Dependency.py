import re
from Component import Component
import requests
import logging

class Dependency():

  def __init__(self, dependent, governor, depType, normal):
    self.depType = depType
    if self.depType != "ROOT":
      self.governor = governor
      self.dependent = dependent
      self.generalType = "Not set yet"
      if normal: # Prevent long-range dependencies from giving self to comp
        self.governor.addWhereGovernor(self)
        self.dependent.addWhereDependent(self)
      else:
        self.generalType = "central"
      # Implement wildcards
      if self.depType == "MWE":
        self.governor.setWildcard(True)
        self.dependent.setWildcard(True)

  @staticmethod
  def buildNormalDependency(dependencyJSON, components):
    return Dependency(Component.findComponent(dependencyJSON['dependent'] \
      - 1, components), Component.findComponent(dependencyJSON['governor'] \
      - 1, components), dependencyJSON['dep'], True)

  #################### For logging.infoing #####################

  def __str__(self):
    if not (self.checkIfIgnore()): 
      return (self.dependent.getGloss() + " <---'" + self.generalType + " | " \
        + self.depType + " <--- " + self.governor.getGloss())
    else:
      return ("")

  def cleanJson(self):
    newDependencyJSON = {"subject": self.governor.getGloss(), \
      "object":self.dependent.getGloss(), "relation":self.generalType, \
      "specificRelationship":self.depType, "subjImp": self.governor.getImportance(), "objImp": self.dependent.getImportance()}
    if self.dependent.getNER():
      newDependencyJSON['objNER'] = self.dependent.getNER()
    if self.governor.getNER():
      newDependencyJSON['subjNER'] = self.governor.getNER()
    newDependencyJSON['subjType'] = self.governor.getPOS()
    newDependencyJSON['objType'] = self.dependent.getPOS()
    return newDependencyJSON

  #####################################################

  ################# Compound handling #################

  def combineCompound(self, allDependencies, compoundType):
    if self.depType == compoundType:    
      self.governor.updateCompound(self.dependent.getIndex())
      self.dependent.updateCompound(self.governor.getIndex())
    return

  def checkIfIgnore(self):
    ignoredRegex = re.compile("ROOT|cc|discourse|posessive|punc|compound|" \
      + "goeswith|number", re.IGNORECASE)
    if (ignoredRegex.match(self.depType)): 
      return True
    elif (self.dependent.getCompound()) and (self.governor.getCompound()):
      if self.dependent.getCompound() == self.governor.getCompound():
        return True
    elif (self.dependent == self.governor):
      return True
    else:
      return False

  ###################################################

  ################## NER handling ###################

  def updateNER(self, nerList, newNER):
    self.governor.updateNER(nerList, newNER)
    self.dependent.updateNER(nerList, newNER)

  ###################################################

  ########## Governor / dependent handling ##########

  def getGovernor(self):
    return self.governor

  def getDependent(self):
    return self.dependent

  def setGovernor(self, component):
    self.governor = component

  def setDependent(self, component):
    self.dependent = component

  ###################################################

  ################# Fetch properties ################

  def getRelation(self):
    return self.depType

  def getGeneralType(self):
    return self.generalType

  def __eq__(self, other):
    return self.__dict__ == other.__dict__
    
  ###################################################

  ############### Relationship mapping ##############

  def compensateForType(self):
    mods = re.compile("advcl|amod|nn|predet|prep|prepc|nmod|det|appos|" \
      + "preconj|nummod|expl|quantmod|advmod", re.IGNORECASE)
    neg = re.compile("neg", re.IGNORECASE) 
    relationshipIdeas = re.compile("ccomp|pcomp|xcomp|acomp|acl", \
      re.IGNORECASE)
    governorDependent = re.compile("dobj|iobj|pobj", re.IGNORECASE)
    dependentIsGovernor = re.compile("csubj|csubjpass|nsubj|nsubjpass|xsubj", \
      re.IGNORECASE)
    reversedMods = re.compile("advmod", re.IGNORECASE)
    if mods.match(self.depType) or neg.match(self.depType) or reversedMods.match(self.depType):
      self.generalType = "supp"
    elif relationshipIdeas.match(self.depType) or \
      governorDependent.match(self.depType) or dependentIsGovernor.match(self.depType):
      self.generalType = "central"
    else:
      self.generalType = "central"

    # Older complex code that reverses the order of word embedding dependencies based on the regexed'd dependency type

    # if mods.match(self.depType) or neg.match(self.depType):
    #   self.generalType = "supp"
    # elif relationshipIdeas.match(self.depType) or \
    #   governorDependent.match(self.depType):
    #   self.generalType = "central"
    # elif reversedMods.match(self.depType):
    #   self.dependent.addWhereGovernor(self)
    #   self.dependent.removeWhereDependent(self)
    #   self.governor.addWhereDependent(self)
    #   self.governor.removeWhereGovernor(self)
    #   temp = self.governor
    #   self.governor = self.dependent
    #   self.dependent = temp
    #   self.generalType = "supp"
    # elif dependentIsGovernor.match(self.depType):
    #   self.dependent.addWhereGovernor(self)
    #   self.dependent.removeWhereDependent(self)
    #   self.governor.addWhereDependent(self)
    #   self.governor.removeWhereGovernor(self)
    #   temp = self.governor
    #   self.governor = self.dependent
    #   self.dependent = temp
    #   self.generalType = "central"
    # else:
    #   self.generalType = "central"

  ###################################################

  ################### Redirect ######################
  
  def intermediateRedirect(self):
    logging.info("Intermediate redirect")
    intermediate = re.compile("aux|cop|auxpass|mark", re.IGNORECASE)
    relationshipIdeas = re.compile("ccomp|pcomp|xcomp|acomp|acl", \
      re.IGNORECASE)
    governorDependent = re.compile("dobj|iobj|pobj", re.IGNORECASE)
    if intermediate.match(self.depType):
      self.generalType = "central"
      logging.info("Governor: " + self.governor.getGloss())
      logging.info("Dependent: " + self.dependent.getGloss())
      for nonIntDependency in self.governor.getWhereGovernor():
        if (nonIntDependency != self) and not \
          (nonIntDependency.checkIfIgnore()) and \
          (relationshipIdeas.match(nonIntDependency.depType) or \
          governorDependent.match(nonIntDependency.depType)):
          logging.info("Redirect starting")
          logging.info("Dependency: " + str(nonIntDependency))
          logging.info("Intermdiate dependency: " + str(self))
          nonIntDependency.getGovernor().removeWhereGovernor(nonIntDependency)
          nonIntDependency.setGovernor(self.dependent)
          self.dependent.addWhereGovernor(nonIntDependency)
          logging.info("New dependency: " + str(nonIntDependency))

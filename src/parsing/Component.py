class Component():

  def __init__(self, index, gloss, pos, importance):
    self.index = index # Start from 0
    self.gloss = gloss
    self.pos = self.convertPOS(pos.lower())
    self.importance = importance
    self.whereGovernor = []
    self.whereDependent = []
    self.whereDetailDependent = []
    self.whereDetailGovernor = []

  ############## NER ###################

  def updateNER(self, nerList, newNER):
    if hasattr(self, "compound"):
      self.compound + (nerList)
    else:
      self.compound = nerList
    self.ner = newNER
    
  def getNER(self):
    if hasattr(self, "ner"):
      return self.ner
    else:
      return False

  ######################################

  ############## Wildcard ##############

  def setWildcard(self, wildCard):
    self.wildCard = wildCard

  def getWildcard(self):
    return self.wildCard

  ######################################

  ############ Fetch basic props #############
    
  def getPOS(self):
    return self.pos

  def getIndex(self):
    return self.index

  def getImportance(self):
    return self.importance

  ######################################

  ######## Relationship mapping ########

  def getWhereGovernor(self):
    return self.whereGovernor

  def getWhereDependent(self):
    return self.whereDependent

  def addWhereGovernor(self, dependency):
    self.whereGovernor.append(dependency)

  def addWhereDependent(self, dependency):
    self.whereDependent.append(dependency)

  def removeWhereGovernor(self, dependency):
    self.whereGovernor.remove(dependency)

  def removeWhereDependent(self, dependency):
    self.whereDependent.remove(dependency)

  #######################################

  ############## Compound ###############

  def updateCompound(self, newIndex):
    if hasattr(self, "compound"):
      self.compound.append(newIndex)
    else:
      self.compound = [self.index, newIndex]

  def getCompound(self):
    if hasattr(self, "compound"):
      return self.compound
    else:
      return False

  #######################################

  ############### POS ###################

  def convertPOS(self, pos):
    if pos in ["jj", "jjr", "jjs"]:
      return "adj"
    elif pos in ["in", "rp", "to"]:
      return "adp"
    elif pos in ["rb", "rbr", "rbs", "wrb"]:
      return "adv"
    elif pos in ["cc"]:
      return "conj"
    elif pos in ["dt", "ex", "pdt", "wdt"]:
      return "det"
    elif pos in ["uh"]:
      return "intj"
    elif pos in ["nn", "nns"]:
      return "noun"
    elif pos == "cd":
      return "num"
    elif pos in ["prp", "prp$", "wp", "wp$"]:
      return "noun"
    elif pos in ["pos", "rp"]:
      return "part"
    elif pos in ["ptb", "prp", "prp$", "wp", "wp$", "ex", "wh"]:
      return "pron"
    elif pos in ["nnp", "nnps"]:
      return "propn"
    elif pos in ["nfp", "sym", "$", "#", "%"]:
      return "sym"
    elif pos in ["md", "vb", "vbd", "vbg", "vbn", "vbp", "vbz"]:
      return "verb"
    elif pos in ["fw", "ls", "xx", "add", "afx", "gw", "sym", "uh"]:
      return "x"
    else:
      return ""

  #######################################

  ############## Glossing ###############

  def repopulateGloss(self, allTokens):
    if hasattr(self, "compound"):
      self.compound = list(set(self.compound))
      self.compound.sort()
      newText = ""
      for i in (self.compound):
        newText = (newText + " " + allTokens[i]['word'])
      self.gloss = newText.replace(" at_time",'').replace("\n",'')
      return True
    return False

  def getGloss(self):
    return self.gloss.strip().replace(" at_time",'').replace("\n",'')

  #######################################

  ############ Static stuff #############

  @staticmethod # For query initiation
  def findComponent(index, allComponents):
    for component in allComponents:
      if component.getIndex() == index:
        return component


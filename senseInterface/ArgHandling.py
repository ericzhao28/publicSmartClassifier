import sense2vec
import spacy.en

class ArgHandling():
  def __init__(self):
    self.model = sense2vec.load()
    self.nlp = spacy.en.English()

  def getVector(self, query, grammarType):
    try:
      freq, query_vector = self.model[query + grammarType]
      return query_vector, True
    except KeyError:
      try:
        freq, query_vector = self.model[query]
        return query_vector, True
      except KeyError:
        return False, False

  def parseGeneralArgs(self, reqparse):
    parser = reqparse.RequestParser()
    parser.add_argument('query', type=str, required=True, help="Query", action='append')
    parser.add_argument('type', type=str, required=False, help="Type", action='append')
    parser.add_argument('query2', type=str, required=False, help="Query2", action='append')
    parser.add_argument('type2', type=str, required=False, help="Type2", action='append')
    args = parser.parse_args()
    return args

  def getSenseVecModel(self):
    return self.model

  def getSpacyEn(self):
    return self.nlp
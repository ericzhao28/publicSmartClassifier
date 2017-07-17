from Query import Query
from pycorenlp import StanfordCoreNLP
import sys

def read_in():
  lines = sys.stdin.readlines()
  return lines[0]

def main():
  queryString = read_in()
  newText = str(queryString)
  query = Query(newText)
  print(query.getJsonDetails())

if __name__ == '__main__':
	main()
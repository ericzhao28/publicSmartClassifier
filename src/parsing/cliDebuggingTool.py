# Module for classification

# pip install pycorenlp

from Query import Query
from pycorenlp import StanfordCoreNLP
import sys


#Read data from stdin
def read_in():
    return input("Yes?\n")

# Main initiator function
def main():
  while True:
    # Get our data as an array from read_in()
    queryString = read_in()
    # Get looped user input
    newText = str(queryString)
    query = Query(newText)
    print(query.getJsonDetails())
    # print("\n")
    # query = OpenIEQuery(newText)
    # print("\nRaw:")
    # print(newText)
    # print("\n\n")

# Launch main
if __name__ == '__main__':
  main()

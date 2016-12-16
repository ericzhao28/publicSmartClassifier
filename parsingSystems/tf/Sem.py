

for frame in frames:
  



  subject = combineGloss(allInRange(frame['target']['start']+1, frame['target']['end']))
  object = combineGloss(allInRange(frame['annotationSets'][0]['frameElements']['start'] + 1, frame['annotationSets'][0]['frameElements']['end']))

  
  objNER = frame['annotationSets'][0]['frameElements'][0]['name']

tokens[x]
gnome-terminal -x sh -c "cd ./senseInterface/ && python senseVecAPI.py"
gnome-terminal -x sh -c 'java -mx4g -cp "/home/em/projects/toolkit/stanford-corenlp/*" edu.stanford.nlp.pipeline.StanfordCoreNLPServer'
gnome-terminal -x sh -c "sudo mongod --storageEngine=wiredTiger"
gnome-terminal -x sh -c "java -Xms4g -Xmx4g -cp /home/em/projects/toolkit/semafor-master/target/Semafor-3.0-alpha-04.jar edu.cmu.cs.lti.ark.fn.SemaforSocketServer model-dir:/home/em/projects/toolkit/semafor-master/models/semafor_malt_model_20121129 port:5001"

output=`ps aux|grep p\[y\]thon`
set -- $output
sudo renice -20 $2
setterm -blank 0

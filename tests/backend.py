import importlib.util
import math
spec=importlib.util.spec_from_file_location('alerts','Magik_Alert/magik_alert.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=[object(),object()]
a=m.MagikPlaySound().execute(data,['on empty queue'],[0.5],['notify.mp3'])
b=m.MagikNotification().execute(data,['Finished'],['on empty queue'])
assert a['result'][0] is data and b['result'][0] is data
assert b['ui']['magik_alert'][0]['message']=='Finished'
assert b['ui']['magik_alert'][0]['mode']=='on empty queue'
assert a['ui']['magik_alert'][0]['volume']==0.5
assert a['ui']['magik_alert'][0]['event_id']!=b['ui']['magik_alert'][0]['event_id']
assert math.isnan(m.MagikPlaySound.IS_CHANGED())
print('Backend tests passed: identity passthrough, scalar settings, unique events, cache invalidation.')

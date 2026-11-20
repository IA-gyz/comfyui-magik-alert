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
c=m.MagikAlert().execute(data,[True],['always'],[0.8],['notify.mp3'],[True],['on empty queue'],['Done'])
assert c['result'][0] is data
ui=c['ui']['magik_alert']
assert len(ui)==2
assert ui[0]['kind']=='sound' and ui[0]['mode']=='always' and ui[0]['volume']==0.8
assert ui[1]['kind']=='notification' and ui[1]['mode']=='on empty queue' and ui[1]['message']=='Done'
assert ui[0]['event_id']!=ui[1]['event_id']
d=m.MagikAlert().execute(data,[False],['always'],[0.5],['notify.mp3'],[False],['always'],['x'])
assert d['ui']['magik_alert']==[] and d['result'][0] is data
e=m.MagikAlert().execute(data,[False],['always'],[0.5],['notify.mp3'],[True],['always'],['Only notif'])
assert len(e['ui']['magik_alert'])==1 and e['ui']['magik_alert'][0]['kind']=='notification'
assert math.isnan(m.MagikAlert.IS_CHANGED())
print('Backend tests passed: identity passthrough, scalar settings, unique events, cache invalidation, combined node toggles and modes.')

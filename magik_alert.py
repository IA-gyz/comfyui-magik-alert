"""Standalone browser alerts; list inputs pass through without copying."""
import math
import uuid

class AnyType(str):
    def __ne__(self, other):
        return False
ANY = AnyType('*')
MODES = ['always', 'on empty queue']
def first(value, default):
    return value[0] if isinstance(value, list) and value else default

class AlertBase:
    FUNCTION = 'execute'
    CATEGORY = 'Magik/Alerts'
    INPUT_IS_LIST = True
    OUTPUT_IS_LIST = (True,)
    OUTPUT_NODE = True
    RETURN_TYPES = (ANY,)
    RETURN_NAMES = ('any',)
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float('nan')
    def result(self, data, mode, **settings):
        return {'ui': {'magik_alert': [{'event_id': uuid.uuid4().hex,
                'mode': first(mode, 'always'), **settings}]}, 'result': (data,)}

class MagikPlaySound(AlertBase):
    @classmethod
    def INPUT_TYPES(cls):
        return {'required': {
            'any': (ANY, {'tooltip': 'Forward unchanged. Connect after the work to monitor.'}),
            'mode': (MODES, {'tooltip': 'Always: at this node. On empty queue: after successful execution and queue completion.'}),
            'volume': ('FLOAT', {'default': 0.5, 'min': 0, 'max': 1, 'step': 0.05}),
            'file': ('STRING', {'default': 'notify.mp3', 'tooltip': 'Bundled filename, relative asset URL, or HTTP(S) URL; not a server filesystem path.'})}}
    def execute(self, any, mode, volume, file):
        level = float(first(volume, 0.5))
        level = min(1.0, max(0.0, level)) if math.isfinite(level) else 0.5
        return self.result(any, mode, kind='sound', volume=level,
                           file=str(first(file, 'notify.mp3') or 'notify.mp3'))

class MagikNotification(AlertBase):
    @classmethod
    def INPUT_TYPES(cls):
        return {'required': {
            'message': ('STRING', {'default': 'Your notification has triggered.', 'multiline': True}),
            'any': (ANY, {'tooltip': 'Forward unchanged.'}),
            'mode': (MODES, {'tooltip': 'Always: at this node. On empty queue: after successful execution and queue completion.'})}}
    def execute(self, any, message, mode):
        return self.result(any, mode, kind='notification',
                           message=str(first(message, 'Your notification has triggered.')))
NODE_CLASS_MAPPINGS = {'MagikPlaySound': MagikPlaySound, 'MagikNotification': MagikNotification}
NODE_DISPLAY_NAME_MAPPINGS = {'MagikPlaySound': 'Magik Play Sound', 'MagikNotification': 'Magik Notification'}

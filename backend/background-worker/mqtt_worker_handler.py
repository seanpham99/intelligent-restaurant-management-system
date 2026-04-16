from abc import ABC, abstractmethod

from handler import BaseDataHandler

class MQTTWokerHander(BaseDataHandler):
    @abstractmethod
    def set_db(self, db):
        pass
    
    @abstractmethod
    def set_payload(self, payload):
        pass
    
    @abstractmethod
    def set_mqtt(self, mqtt):
        pass
    
    @abstractmethod
    def set_event_loop(self, loop):
        pass


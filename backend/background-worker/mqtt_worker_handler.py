from abc import ABC, abstractmethod

from shared.handler import BaseDataHandler

class MQTTWorkerHandler(BaseDataHandler):
    @abstractmethod
    def configure(self, db=None, payload=None, mqtt=None, loop=None):
        pass


from abc import ABC, abstractmethod

class BaseDataHandler(ABC):
    @abstractmethod
    def handle(self):
        pass

class DBInsertHandler(BaseDataHandler):
    @abstractmethod
    def set_db(self, db):
        pass
    
    @abstractmethod
    def set_payload(self, payload):
        pass
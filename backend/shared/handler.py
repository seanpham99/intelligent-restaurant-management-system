from abc import ABC, abstractmethod

class BaseDataHandler(ABC):
    @abstractmethod
    def handle(self):
        pass
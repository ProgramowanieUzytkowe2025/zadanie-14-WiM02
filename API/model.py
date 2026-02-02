from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Kon(Base):
    __tablename__ = "Konie"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rasa = Column(String(100), nullable=False)
    wiek = Column(Integer, nullable=False)
    dostepnosc_do_jazdy = Column(Boolean, nullable=False)

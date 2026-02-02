from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal
from model import Kon
from pydantic import BaseModel
from fastapi import status
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/konie")
def get_konie(dostepnosc: Optional[str] = "all"):
    db = SessionLocal()
    query = db.query(Kon)

    if dostepnosc == "true":
        query = query.filter(Kon.dostepnosc_do_jazdy == True)
    elif dostepnosc == "false":
        query = query.filter(Kon.dostepnosc_do_jazdy == False)

    konie = query.all()
    db.close()
    return konie

@app.delete("/konie/{kon_id}")
def delete_kon(kon_id: int):
    db = SessionLocal()
    kon = db.query(Kon).filter(Kon.id == kon_id).first()
    if not kon:
        db.close()
        raise HTTPException(status_code=404, detail="Koń nie istnieje")
    if not kon.dostepnosc_do_jazdy:
        db.close()
        raise HTTPException(status_code=400, detail="Nie można usuwać koni niedostępnych")
    db.delete(kon)
    db.commit()
    db.close()
    return {"detail": "Usunięto konia"}

class KonUpdate(BaseModel):
    rasa: str
    wiek: int
    dostepnosc_do_jazdy: bool

@app.get("/konie/{kon_id}")
def get_kon(kon_id: int):
    db = SessionLocal()
    kon = db.query(Kon).filter(Kon.id == kon_id).first()
    db.close()
    if not kon:
        raise HTTPException(status_code=404)
    return kon

@app.put("/konie/{kon_id}")
def update_kon(kon_id: int, data: KonUpdate):
    db = SessionLocal()
    kon = db.query(Kon).filter(Kon.id == kon_id).first()

    if not kon:
        db.close()
        raise HTTPException(status_code=404, detail="Koń nie istnieje")

    if data.rasa != kon.rasa:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Nie można zmieniać rasy konia"
        )

    kon.wiek = data.wiek
    kon.dostepnosc_do_jazdy = data.dostepnosc_do_jazdy

    db.commit()
    db.refresh(kon)
    db.close()
    return kon

@app.post("/konie", status_code=status.HTTP_201_CREATED)
def create_kon(data: KonUpdate):
    db = SessionLocal()
    kon = Kon(
        rasa=data.rasa,
        wiek=data.wiek,
        dostepnosc_do_jazdy=data.dostepnosc_do_jazdy
    )
    db.add(kon)
    db.commit()
    db.refresh(kon)
    db.close()
    return kon

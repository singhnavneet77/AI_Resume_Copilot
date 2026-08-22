from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import settings

# For SQLite, we require connect_args={"check_same_thread": False}
connect_args = {}
engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL (or any real server-based DB): use a pooled, health-checked
    # connection pool so the app survives idle-connection drops / restarts
    # of the database (common with managed Postgres and Docker).
    engine_kwargs = {
        "pool_pre_ping": True,   # verify connection liveness before use
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 1800,    # recycle connections every 30 min
    }

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args, **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

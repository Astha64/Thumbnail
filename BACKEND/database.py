from sqlmodel import SQLModel, create_engine, Session
from config import DATABSE_URL
#session-performs db operations like deleting, adding, querying the data.
#create_engine() is a function from SQLModel that sets up the connection to the database using the provided URL.

#echo=false -> no SQL command/queries will be shown

#connect_args={check_same_thread: false} -> basically allows multiple thread to access the same db connection.
#what happens i sthe fastapi works with multiple threads internally, pr sqlite ek baar me ek hi the=read k sath kaam krega
#lekin jb fastapi internally dusre thread pe kaam kr rha hoga to wo db connection ko access krne ki koshish krega, 
# aur wo error dega ki "check_same_thread" is true, so we set it to false to allow multiple threads to access the same db connection.
engine = create_engine(DATABSE_URL, echo=False, connect_args={"check_same_thread": False})

def create_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session    
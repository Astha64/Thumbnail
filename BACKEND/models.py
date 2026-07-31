# from datetime import datetime, timezone
# # for creating unique ids so no conflicts in the database
# from uuid import uuid4 
# # Either string is returned or none if there is an error, so we use Optional
# from typing import Optional, List

# from sqlmodel import SQLModel, Field, Relationship

# def _uuid() -> str:
#     return str(uuid4()) #get the uuid and convert it to a string
# def _now() -> datetime:
#     return datetime.now(timezone.utc); #get the current time in UTC timezone

# # Job = stores a user's thumbnail generation request
# # Thumbnail = stores each generated thumbnail
# # job_id connects them
# # Relationship() lets both access each other automatically
# # Together they create a one-to-many relationship where one job can have many thumbnails, but each thumbnail belongs to only one job.

# class Thumbnail(SQLModel, table=True):
#     id: str = Field(default_factory=_uuid, primary_key=True)
#     job_id: str = Field(foreign_key="job.id")
#     style_name: str = Field(default="")
#     status: str = Field(default="pending")
#     imagekit_url: Optional[str] = Field(default=None)
#     error_message: Optional[str] = Field(default=None)
#     created_at: datetime = Field(default_factory=_now)
    
#     job: Optional["Job"] = Relationship(back_populates="thumbnails")
    
# class Job(SQLModel, table=True):
#     id: str = Field(default_factory=_uuid, primary_key=True)
#     prompt: str = Field(default="")
#     num_thumbnails: int = Field(default=1, ge=1, le=3)
#     headshot_url: str = Field(default="")
#     status: str = Field(default="pending")
#     created_at: datetime = Field(default_factory=_now)
    
#     thumbnails: List[Thumbnail] = Relationship(back_populates="job")
    




from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional, List

from sqlmodel import SQLModel, Field, Relationship


def _uuid() -> str:
    return str(uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================
# USER TABLE
# ============================================================

class User(SQLModel, table=True):
    """
    Stores registered users.
    Every user can create multiple thumbnail generation jobs.
    """

    id: str = Field(default_factory=_uuid, primary_key=True)

    email: str = Field(index=True, unique=True)

    hashed_password: str

    created_at: datetime = Field(default_factory=_now)

    # One User -> Many Jobs
    jobs: List["Job"] = Relationship(back_populates="user")


# ============================================================
# THUMBNAIL TABLE
# ============================================================

class Thumbnail(SQLModel, table=True):
    """
    Stores every generated thumbnail.
    One Job can generate multiple thumbnails.
    """

    id: str = Field(default_factory=_uuid, primary_key=True)

    job_id: str = Field(foreign_key="job.id")

    style_name: str = Field(default="")

    status: str = Field(default="pending")

    imagekit_url: Optional[str] = Field(default=None)

    error_message: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=_now)

    # Many Thumbnails -> One Job
    job: Optional["Job"] = Relationship(back_populates="thumbnails")


# ============================================================
# JOB TABLE
# ============================================================

class Job(SQLModel, table=True):
    """
    Stores one thumbnail generation request.

    One User can create many Jobs.
    One Job can generate many Thumbnails.
    """

    id: str = Field(default_factory=_uuid, primary_key=True)

    # NEW
    user_id: str = Field(foreign_key="user.id")

    prompt: str = Field(default="")

    num_thumbnails: int = Field(default=1, ge=1, le=3)

    headshot_url: str = Field(default="")

    status: str = Field(default="pending")

    created_at: datetime = Field(default_factory=_now)

    # Many Jobs -> One User
    user: Optional[User] = Relationship(back_populates="jobs")

    # One Job -> Many Thumbnails
    thumbnails: List[Thumbnail] = Relationship(back_populates="job")
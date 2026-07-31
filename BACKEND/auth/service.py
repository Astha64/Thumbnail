# auth/service.py
from sqlmodel import Session, select

from models import User
from auth.security import hash_password, verify_password


def create_user(session: Session, email: str, password: str) -> User:
    """Creates a new user after checking whether the email already exists."""
    existing_user = session.exec(select(User).where(User.email == email)).first()
    if existing_user:
        raise ValueError("Email already registered")

    user = User(email=email, hashed_password=hash_password(password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, email: str, password: str) -> User:
    """
    Looks up a user and verifies their password.
    Same error message for 'no such email' and 'wrong password' —
    this prevents an attacker from discovering which emails are registered.
    """
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email or password")
    return user
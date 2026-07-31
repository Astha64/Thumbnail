# auth/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database import get_session
from auth.schemas import UserSignup, UserLogin, UserResponse, TokenResponse
from auth.service import create_user, authenticate_user
from auth.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=201)
def signup(request: UserSignup, session: Session = Depends(get_session)):
    try:
        user = create_user(session=session, email=request.email, password=request.password)
        return UserResponse(id=user.id, email=user.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(request: UserLogin, session: Session = Depends(get_session)):
    try:
        user = authenticate_user(session=session, email=request.email, password=request.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)
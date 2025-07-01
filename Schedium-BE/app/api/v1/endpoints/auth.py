"""
Authentication endpoints.
Handles login, logout, token refresh, and user management.
"""
from typing import Annotated, List, Optional, Union

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_active_user,
    get_current_user,
    get_db,
    get_pagination_params,
    require_admin,
)
from app.config import settings
from app.core.exceptions import (  # Add this import if NotFoundException is defined here
    NotFoundException,
)
from app.core.pagination import Page, PaginationParams
from app.core.responses import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    Role,
    RoleCreate,
    RoleUpdate,
    Token,
    User,
    UserCreate,
    UserUpdate,
    UserWithoutPassword,
)
from app.services.auth import AuthService

router = APIRouter()


# Authentication endpoints
@router.post("/login", response_model=SuccessResponse[Token])
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse[Token]:
    """
    OAuth2 compatible token login.

    Use username field for email.
    Returns access and refresh tokens.
    """
    service = AuthService(db)

    # Authenticate user
    user = service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create tokens
    tokens = service.create_tokens(int(user.user_id))

    return SuccessResponse(data=tokens, message="Login successful", errors=None)


@router.post("/login-json", response_model=SuccessResponse[Token])
async def login_json(
    credentials: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse[Token]:
    """
    JSON-based login endpoint.
    
    Alternative to OAuth2 form-based login that accepts JSON.
    Returns access and refresh tokens.
    """
    service = AuthService(db)

    # Authenticate user
    user = service.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create tokens
    tokens = service.create_tokens(int(user.user_id))

    return SuccessResponse(data=tokens, message="Login successful", errors=None)


@router.post("/refresh", response_model=SuccessResponse[Token])
async def refresh_token(
    refresh_token: Annotated[str, Body(..., embed=True, description="Refresh token")],
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse[Token]:
    """
    Refresh access token using refresh token.

    Returns new access and refresh tokens.
    """
    service = AuthService(db)
    tokens = service.refresh_access_token(refresh_token)

    return SuccessResponse(
        data=tokens, message="Token refreshed successfully", errors=None
    )


@router.post("/logout", response_model=SuccessResponse[dict])
async def logout(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> SuccessResponse[dict]:
    """
    Logout current user.

    Note: Since we use stateless JWT, this endpoint is mainly
    for client-side token removal. In production, you might want
    to implement token blacklisting.
    """
    return SuccessResponse(
        data={
            "user_id": current_user.user_id,
            "message": "Please remove tokens from client storage",
        },
        message="Logout successful",
        errors=None,
    )


@router.get("/me", response_model=SuccessResponse[UserWithoutPassword])
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> SuccessResponse[UserWithoutPassword]:
    """
    Get current user information.
    """
    return SuccessResponse(
        data=UserWithoutPassword.model_validate(current_user),
        message="User information retrieved",
        errors=None,
    )


@router.put("/me", response_model=UpdatedResponse[UserWithoutPassword])
async def update_current_user(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UpdatedResponse[UserWithoutPassword]:
    """
    Update current user's own information.

    Cannot change role or active status.
    """
    # Remove fields that user cannot change themselves
    update_data = user_update.model_dump(exclude_unset=True)
    update_data.pop("role_id", None)
    update_data.pop("active", None)
    update_data.pop("password", None)  # Use change-password endpoint

    service = AuthService(db)
    user = service.update_user(current_user.user_id, UserUpdate(**update_data))

    return UpdatedResponse(
        data=UserWithoutPassword.model_validate(user),
        message="Profile updated successfully",
        errors=None,
    )


@router.post("/change-password", response_model=SuccessResponse[dict])
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse[dict]:
    """
    Change current user's password.
    """
    service = AuthService(db)

    success = service.change_password(
        current_user.user_id, password_data.current_password, password_data.new_password
    )

    return SuccessResponse(
        data={"success": success}, message="Password changed successfully", errors=None
    )


@router.post("/forgot-password", response_model=SuccessResponse[dict])
async def forgot_password(
    email: Annotated[str, Body(..., embed=True, description="User email")],
    background_tasks: BackgroundTasks,
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse[dict]:
    """
    Request password reset.

    Sends reset token to user's email (in production).
    For development, the token is returned in the response.
    """
    service = AuthService(db)

    try:
        reset_token = service.reset_password(email)

        # In production, send email with reset token
        # background_tasks.add_task(send_reset_email, email, reset_token)

        # For development, return token
        response_data = {"message": "Password reset instructions sent to email"}
        if settings.DEBUG:
            response_data["reset_token"] = reset_token

        return SuccessResponse(
            data=response_data, message="Password reset requested", errors=None
        )
    except NotFoundException:
        # Don't reveal if email exists or not
        return SuccessResponse(
            data={"message": "If the email exists, reset instructions have been sent"},
            message="Password reset requested",
            errors=None,
        )


@router.post("/reset-password", response_model=SuccessResponse[dict])
async def reset_password(
    token: Annotated[str, Body(..., description="Reset token")],
    new_password: Annotated[str, Body(..., min_length=8, description="New password")],
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse[dict]:
    """
    Reset password using reset token.
    """
    service = AuthService(db)
    success = service.confirm_reset_password(token, new_password)

    return SuccessResponse(
        data={"success": success}, message="Password reset successfully", errors=None
    )


# User management endpoints (Admin only)
@router.get("/users", response_model=SuccessResponse[Page[UserWithoutPassword]])
async def get_users(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends(get_pagination_params)],
    search: Optional[str] = None,
    role_id: Optional[int] = None,
    active: Optional[bool] = None,
) -> SuccessResponse[Page[UserWithoutPassword]]:
    """
    Get paginated list of users.

    Admin only.
    """
    service = AuthService(db)
    users = service.get_users(params, search, role_id, active)

    user_list = [UserWithoutPassword.model_validate(user) for user in users.items]
    users_page = Page(
        items=user_list,
        total=users.total,
        page=users.page,
        page_size=users.page_size,
        total_pages=users.total_pages,
        has_next=users.has_next,
        has_prev=users.has_prev,
    )
    return SuccessResponse(
        data=users_page, message="Users retrieved successfully", errors=None
    )


# Coordinators endpoint - temporary workaround for route conflicts
@router.get("/list-coordinators", response_model=SuccessResponse[List[UserWithoutPassword]])
async def get_coordinators(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    active: Optional[bool] = Query(None, description="Filter by active status"),
) -> SuccessResponse[List[UserWithoutPassword]]:
    """
    Get all coordinators.
    
    Returns list of users with Coordinator role.
    Accessible by any authenticated user for dropdowns.
    """
    service = AuthService(db)
    
    # Get coordinator role ID dynamically
    from app.repositories.auth import RoleRepository
    role_repo = RoleRepository(db)
    coordinator_role = role_repo.get_by_name("Coordinator")
    
    if not coordinator_role:
        return SuccessResponse(
            data=[],
            message="No coordinator role found",
            errors=None
        )
    
    # Get users with coordinator role
    users = service.get_users(
        params=PaginationParams(page=1, page_size=100),  # Get all coordinators (max 100)
        role_id=coordinator_role.role_id,
        active=active if active is not None else True  # Default to active only
    )
    
    coordinators = [UserWithoutPassword.model_validate(user) for user in users.items]
    
    return SuccessResponse(
        data=coordinators,
        message="Coordinators retrieved successfully",
        errors=None
    )


@router.post("/users", response_model=CreatedResponse[UserWithoutPassword])
async def create_user(
    user_in: UserCreate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> CreatedResponse[UserWithoutPassword]:
    """
    Create a new user.

    Admin only.
    """
    service = AuthService(db)
    user = service.create_user(user_in)

    return CreatedResponse(
        data=UserWithoutPassword.model_validate(user),
        message="User created successfully",
        errors=None,
    )


@router.get("/users/{user_id}", response_model=SuccessResponse[UserWithoutPassword])
async def get_user(
    user_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse[UserWithoutPassword]:
    """
    Get user by ID.

    Admin only.
    """
    service = AuthService(db)
    user = service.get_user(user_id)

    return SuccessResponse(
        data=UserWithoutPassword.model_validate(user),
        message="User retrieved successfully",
        errors=None,
    )


@router.put("/users/{user_id}", response_model=UpdatedResponse[UserWithoutPassword])
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UpdatedResponse[UserWithoutPassword]:
    """
    Update user.

    Admin only.
    """
    service = AuthService(db)
    user = service.update_user(user_id, user_in)

    return UpdatedResponse(
        data=UserWithoutPassword.model_validate(user),
        message="User updated successfully",
        errors=None,
    )


@router.delete("/users/{user_id}", response_model=DeletedResponse)
async def delete_user(
    user_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DeletedResponse:
    """
    Delete user.

    Admin only. Cannot delete the last administrator.
    """
    service = AuthService(db)
    service.delete_user(user_id)

    return DeletedResponse(message="User deleted successfully", errors=None)


# Role management endpoints
@router.get("/roles", response_model=SuccessResponse[List[Role]])
async def get_roles(
    db: Annotated[Session, Depends(get_db)]
) -> SuccessResponse[List[Role]]:
    """
    Get all roles.

    Public endpoint - roles are not sensitive.
    """
    service = AuthService(db)
    roles = service.get_roles()

    return SuccessResponse(
        data=roles, message="Roles retrieved successfully", errors=None
    )


@router.post("/roles", response_model=CreatedResponse[Role])
async def create_role(
    role_in: RoleCreate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> CreatedResponse[Role]:
    """
    Create a new role.

    Admin only.
    """
    service = AuthService(db)
    role = service.create_role(role_in)

    return CreatedResponse(data=role, message="Role created successfully", errors=None)


@router.put("/roles/{role_id}", response_model=UpdatedResponse[Role])
async def update_role(
    role_id: int,
    role_in: RoleUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UpdatedResponse[Role]:
    """
    Update role.

    Admin only. Cannot rename system roles.
    """
    service = AuthService(db)
    role = service.update_role(role_id, role_in)

    return UpdatedResponse(data=role, message="Role updated successfully", errors=None)


@router.delete("/roles/{role_id}", response_model=DeletedResponse)
async def delete_role(
    role_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DeletedResponse:
    """
    Delete role.

    Admin only. Cannot delete system roles or roles in use.
    """
    service = AuthService(db)
    service.delete_role(role_id)

    return DeletedResponse(message="Role deleted successfully", errors=None)


# Estrategia Híbrida de Autenticación
@router.post("/users/create-with-strategy", response_model=SuccessResponse)
async def create_user_with_auth_strategy(
    user_data: UserCreate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    preferred_method: Optional[str] = Body(None),
    request=None  # Para obtener IP y User-Agent
) -> SuccessResponse:
    """
    Crea usuario usando estrategia híbrida de autenticación.
    
    Métodos disponibles:
    - magic_link: Enlace por email para crear contraseña (preferido)
    - temp_email: Contraseña temporal por email
    - visible_password: Contraseña visible (solo emergencias)
    - auto: Decidir automáticamente (recomendado)
    """
    from app.services.auth_strategy_service import AuthStrategyService
    
    # Obtener información de la request
    ip_address = getattr(request, 'client', {}).get('host') if request else None
    user_agent = getattr(request, 'headers', {}).get('user-agent') if request else None
    
    strategy_service = AuthStrategyService(db)
    
    user_dict = {
        'email': user_data.email,
        'first_name': user_data.first_name,
        'last_name': user_data.last_name,
        'document_number': user_data.document_number,
        'role_id': user_data.role_id,
        'active': getattr(user_data, 'active', True)
    }
    
    try:
        user, auth_result = strategy_service.create_user_with_strategy(
            user_data=user_dict,
            admin_user_id=current_user.user_id,
            preferred_method=preferred_method,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return SuccessResponse(
            data={
                'user': {
                    'user_id': user.user_id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role_id': user.role_id
                },
                'auth_result': auth_result
            },
            message="Usuario creado exitosamente con estrategia híbrida",
            errors=None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear usuario: {str(e)}"
        )


@router.get("/auth-methods/available", response_model=SuccessResponse)
async def get_available_auth_methods(
    db: Annotated[Session, Depends(get_db)]
) -> SuccessResponse:
    """
    Obtiene los métodos de autenticación disponibles.
    """
    from app.services.auth_strategy_service import AuthStrategyService
    
    strategy_service = AuthStrategyService(db)
    available_methods = strategy_service.check_available_methods()
    
    return SuccessResponse(
        data=available_methods,
        message="Métodos de autenticación obtenidos",
        errors=None
    )


@router.post("/set-password-from-token", response_model=SuccessResponse)
async def set_password_from_token(
    db: Annotated[Session, Depends(get_db)],
    token: str = Body(...),
    new_password: str = Body(...),
    request=None
) -> SuccessResponse:
    """
    Establece contraseña usando un token válido (magic link).
    """
    from app.services.auth_strategy_service import AuthStrategyService
    
    # Obtener información de la request
    ip_address = getattr(request, 'client', {}).get('host') if request else None
    user_agent = getattr(request, 'headers', {}).get('user-agent') if request else None
    
    strategy_service = AuthStrategyService(db)
    
    success, error_message = strategy_service.set_password_from_token(
        token_plain=token,
        new_password=new_password,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    return SuccessResponse(
        data=None,
        message="Contraseña establecida exitosamente",
        errors=None
    )


@router.post("/verify-token", response_model=SuccessResponse)
async def verify_auth_token(
    db: Annotated[Session, Depends(get_db)],
    token: str = Body(...)
) -> SuccessResponse:
    """
    Verifica si un token es válido sin usarlo.
    """
    from app.services.auth_strategy_service import AuthStrategyService
    
    strategy_service = AuthStrategyService(db)
    
    valid, user, error_message = strategy_service.verify_and_use_token(token)
    
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    return SuccessResponse(
        data={
            'valid': True,
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        },
        message="Token válido",
        errors=None
    )

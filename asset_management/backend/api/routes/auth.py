from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db, limiter
from backend.api.models.user import User, Role
from datetime import datetime, timezone, timedelta
import secrets

from backend.api.utils.responses import success_response, error_response

auth_bp = Blueprint('auth', __name__)
auth_bp.strict_slashes = False

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role_name = data.get('role', 'staff')

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'message': 'User or Email already exists'}), 400

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        # Auto-create basic roles if they don't exist (helpful for first run)
        role = Role(name=role_name)
        db.session.add(role)
        db.session.commit()

    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        role_id=role.id,
        verification_token=secrets.token_urlsafe(32)
    )
    db.session.add(new_user)
    db.session.commit()

    # In a real app, send email here with verification_token
    return jsonify({'message': 'User registered. Please verify your email.', 'token': new_user.verification_token}), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("20 per hour")
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password_hash, password):
            return error_response("Invalid username or password", 401)

        if user.status != 'active':
            return error_response("Account is locked or inactive", 403)

        # Ensure Role existence (fallback)
        if not user.role:
            default_role = Role.query.filter_by(name='staff').first()
            if not default_role:
                default_role = Role(name='staff')
                db.session.add(default_role)
            user.role = default_role

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        user.last_login_at = datetime.now(timezone.utc)
        user.login_count += 1
        db.session.commit()

        # Log audit after commit to ensure user object is fresh
        from backend.api.utils.audit import log_audit
        log_audit("Auth", "Login", f"User {user.username} logged into the system", target_id=user.id)

        return success_response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }, "Login successful")
    except Exception as e:
        return error_response(f"Login Error: {str(e)}", 500)

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({'access_token': access_token}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = request.get_json().get('email')
    user = User.query.filter_by(email=email).first()

    if user:
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()
        # Mock Email Send
        print(f"Password Reset Link: /reset-password?token={user.reset_token}")

    return jsonify({'message': 'If an account exists, a reset link has been sent.'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    user = User.query.filter_by(reset_token=token).first()

    if not user or user.reset_token_expiry < datetime.now(timezone.utc):
        return jsonify({'message': 'Invalid or expired token'}), 400

    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    return jsonify({'message': 'Password reset successful'}), 200

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return jsonify({'message': 'Invalid token'}), 400

    user.is_verified = True
    user.verification_token = None
    db.session.commit()

    return jsonify({'message': 'Email verified successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@auth_bp.route('/me/<int:user_id>', methods=['GET'])
@jwt_required()
def get_me(user_id=None):
    try:
        identity_id = get_jwt_identity()
        # If user_id is provided in URL, it must match the token's identity
        # OR we just always use the token's identity for security.
        user = db.session.get(User, int(identity_id))
        if not user:
            return error_response("User not found", 404)
        return success_response(user.to_dict())
    except Exception as e:
        return error_response(f"Me Error: {str(e)}", 500)

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, int(user_id))
        data = request.get_json()

        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'email' in data: user.email = data['email']
        if 'avatar_url' in data: user.avatar_url = data['avatar_url']

        db.session.commit()
        return success_response(user.to_dict(), "Profile updated successfully")
    except Exception as e:
        db.session.rollback()
        from flask import current_app
        current_app.logger.error(f"Profile Update Error: {str(e)}")
        return error_response(str(e))

@auth_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, int(user_id))
        data = request.get_json()

        if 'email_notifications' in data: user.email_notifications = data['email_notifications']
        if 'push_notifications' in data: user.push_notifications = data['push_notifications']
        if 'language' in data: user.language = data['language']
        if 'two_factor_enabled' in data: user.two_factor_enabled = data['two_factor_enabled']

        db.session.commit()
        return success_response(user.to_dict(), "Settings updated successfully")
    except Exception as e:
        return error_response(str(e))

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, int(user_id))
        data = request.get_json()

        old_pw = data.get('old_password')
        new_pw = data.get('new_password')

        if not check_password_hash(user.password_hash, old_pw):
            return error_response("Current password incorrect", 401)

        user.password_hash = generate_password_hash(new_pw)
        db.session.commit()
        return success_response(message="Password changed successfully")
    except Exception as e:
        return error_response(str(e))

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.api.services.ai_agent import AISQLAgent
from backend.api.auth.decorators import role_required

from backend.extensions import limiter

ai_agent_bp = Blueprint('ai_agent', __name__)
ai_agent_bp.strict_slashes = False
agent = AISQLAgent()

@ai_agent_bp.route('/chat', methods=['POST'])
@jwt_required()
@limiter.limit("500 per hour")
def agent_chat():
    data = request.get_json()
    message = data.get('message')
    user_id = get_jwt_identity()

    if not message:
        return jsonify({"error": "Message is required"}), 400

    result = agent.process_request(user_id, message)
    return jsonify(result), 200

@ai_agent_bp.route('/execute-confirmed', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def execute_sql():
    data = request.get_json()
    sql = data.get('sql')

    if not sql:
        return jsonify({"error": "SQL is required"}), 400

    result = agent.execute_confirmed_sql(sql)
    return jsonify(result), 200

import os
from flask import Flask, jsonify, render_template, request
from ai import get_ai_answer
from database import (
    init_db,
    get_dashboard_stats,
    get_products,
    add_product,
    update_product,
    delete_product,
    update_stock,
    create_sale,
    get_chart_data,
    get_meta_data,
)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

init_db()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/dashboard")
def dashboard():
    return jsonify(get_dashboard_stats())


@app.route("/api/meta")
def meta():
    return jsonify(get_meta_data())


@app.route("/api/products")
def api_products():
    search = request.args.get("search", "").strip()
    return jsonify(get_products(search))


@app.route("/api/products", methods=["POST"])
def api_add_product():
    payload = request.get_json(silent=True) or {}
    product_id = add_product(payload)
    return jsonify({"success": True, "product_id": product_id})


@app.route("/api/products/<int:product_id>", methods=["PUT"])
def api_update_product(product_id):
    payload = request.get_json(silent=True) or {}
    success = update_product(product_id, payload)
    return jsonify({"success": success})


@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def api_delete_product(product_id):
    success = delete_product(product_id)
    return jsonify({"success": success})


@app.route("/api/stock", methods=["POST"])
def api_stock():
    payload = request.get_json(silent=True) or {}
    success = update_stock(payload)
    return jsonify({"success": success})


@app.route("/api/billing", methods=["POST"])
def api_billing():
    payload = request.get_json(silent=True) or {}
    try:
        result = create_sale(payload)
        return jsonify({"success": True, **result})
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400


@app.route("/api/ai")
def api_ai():
    question = request.args.get("question", "").strip()
    if not question:
        return jsonify({"answer": "Please ask a question about the supermarket data."})
    return jsonify({"answer": get_ai_answer(question)})


@app.route("/api/charts")
def api_charts():
    return jsonify(get_chart_data())


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000, use_reloader=False)

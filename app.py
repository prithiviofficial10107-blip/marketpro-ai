import sys
import os

# Add the new developed portal folder to Python's search path
sys.path.append(os.path.join(os.path.dirname(__file__), 'asset_management'))

try:
    from backend.app import create_app
    print("Starting New Developed Backend (MarketPro AI)...")
    print("Backend accessible at http://localhost:5001")
    print("REMINDER: Also run the React dashboard using .\\START_NEW_PORTAL.bat")

    app = create_app()
    if __name__ == '__main__':
        # Listen on 0.0.0.0 to allow access from local machine and Android emulator
        app.run(debug=True, host='0.0.0.0', port=5001)

except ImportError as e:
    print(f"Error: Could not find the new backend files in 'asset_management'.")
    print(f"Details: {str(e)}")

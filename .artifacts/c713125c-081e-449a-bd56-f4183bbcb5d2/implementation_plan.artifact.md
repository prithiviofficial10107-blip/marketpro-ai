# Implementation Plan - Standardize Portal Address & Fix Connectivity

This plan fixes the issue where the local address is not opening and standardizes the portal URL shown in the terminal.

## User Review Required

> [!IMPORTANT]
> - **URL Standardization**: I am switching the displayed and launched URL from `127.0.0.1` to `localhost`. This is more universally compatible across different Windows network configurations.
> - **Backend Binding**: I will ensure the backend binds to both `localhost` and `127.0.0.1` to ensure the frontend can always find it.

## Proposed Changes

### 🚀 Launcher Optimization
#### [MODIFY] [START_NEW_PORTAL.bat](file:///C:/Users/acer/Desktop/supermarket_ai/START_NEW_PORTAL.bat)
- Update all references of `127.0.0.1` to `localhost`.
- Remove all non-standard characters/emojis that might cause terminal crashes.
- Increase the sync delay to ensure the frontend has fully initialized before opening the browser.
- Clearly print the **MarketPro AI** custom portal address.

### 🌐 Backend Refinement
#### [MODIFY] [app.py](file:///C:/Users/acer/Desktop/supermarket_ai/app.py)
- Ensure the backend explicitly mentions `localhost` in the startup message.
- Keep the `0.0.0.0` binding for Android compatibility, but prioritize `localhost` for local browser users.

### ⚛️ Frontend Sync
#### [MODIFY] [frontend/.env](file:///C:/Users/acer/Desktop/supermarket_ai/asset_management/frontend/.env)
- Update `VITE_API_BASE_URL` to use `localhost` for maximum stability.

## Verification Plan

### Manual Verification
1.  Run `.\START_NEW_PORTAL.bat`.
2.  Choose Option 1.
3.  **Expected Result**:
    - Terminal should clearly show `http://localhost:5173`.
    - Browser should open `http://localhost:5173`.
    - Dashboard should load data successfully.
4.  Verify that entering `http://localhost:5001` in the browser correctly redirects to the dashboard.

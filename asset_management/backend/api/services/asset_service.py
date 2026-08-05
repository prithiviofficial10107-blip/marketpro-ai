from backend.api.services.base_service import BaseService
from backend.api.models.asset import Asset, AssetCategory
from backend.api.models.history import AssetStatusHistory
from backend.extensions import db

class AssetService(BaseService):
    model = Asset

def update_asset_status(asset_id, new_status, user_id, notes=None):
    asset = Asset.query.get(asset_id)
    if not asset:
        return None, "Asset not found"

    old_status = asset.status
    if old_status == new_status:
        return asset, None

    asset.status = new_status

    history = AssetStatusHistory(
        asset_id=asset.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=user_id,
        notes=notes
    )

    db.session.add(history)
    db.session.commit()
    return asset, None

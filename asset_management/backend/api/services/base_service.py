from backend.extensions import db

class BaseService:
    model = None

    @classmethod
    def get_all(cls, filter_deleted=True):
        query = cls.model.query
        if filter_deleted:
            query = query.filter_by(deleted_at=None)
        return query.all()

    @classmethod
    def get_by_id(cls, id, filter_deleted=True):
        query = cls.model.query.filter_by(id=id)
        if filter_deleted:
            query = query.filter_by(deleted_at=None)
        return query.first()

    @classmethod
    def create(cls, **kwargs):
        obj = cls.model(**kwargs)
        db.session.add(obj)
        db.session.commit()
        return obj

    @classmethod
    def update(cls, id, **kwargs):
        obj = cls.get_by_id(id)
        if not obj:
            return None
        for key, value in kwargs.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        db.session.commit()
        return obj

    @classmethod
    def delete(cls, id, hard=False):
        obj = cls.get_by_id(id)
        if not obj:
            return False
        if hard:
            db.session.delete(obj)
        else:
            obj.soft_delete()
        db.session.commit()
        return True

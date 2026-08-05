import sqlparse

class SQLGuardrail:
    FORBIDDEN_KEYWORDS = {
        'DROP', 'TRUNCATE', 'ALTER', 'GRANT', 'REVOKE',
        'CREATE', 'RENAME', 'EXEC', 'EXECUTE', 'CALL'
    }

    ALLOWED_TABLES = {
        'assets', 'employees', 'asset_categories', 'assignments',
        'damage_reports', 'service_records', 'users', 'roles',
        'activity_logs', 'notifications', 'chat_history'
    }

    @classmethod
    def validate_query(cls, sql, allow_write=False):
        if not sql:
            return False, "Empty query"

        parsed = sqlparse.parse(sql)
        if not parsed:
            return False, "Invalid SQL format"

        for statement in parsed:
            # Check keywords
            for token in statement.flatten():
                if token.ttype is sqlparse.tokens.Keyword and token.value.upper() in cls.FORBIDDEN_KEYWORDS:
                    return False, f"Keyword {token.value} is strictly forbidden."

            # Check if it's a WRITE operation when not allowed
            if not allow_write:
                if statement.get_type() != 'SELECT':
                    return False, "Only SELECT queries are allowed in this context."

        return True, "Success"

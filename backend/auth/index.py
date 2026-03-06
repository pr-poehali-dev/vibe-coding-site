import json
import os
import hashlib
import uuid
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password, salt=None):
    if not salt:
        salt = uuid.uuid4().hex
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"

def check_password(password, stored):
    salt, hashed = stored.split(':')
    return hash_password(password, salt) == stored

def get_user_by_token(token):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT u.id, u.email, u.name FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = '%s' AND s.expires_at > NOW()" % token.replace("'", "''"))
    row = cur.fetchone()
    conn.close()
    if row:
        return {'id': row[0], 'email': row[1], 'name': row[2]}
    return None

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
    'Content-Type': 'application/json'
}

def handler(event, context):
    """Авторизация: регистрация, вход, проверка сессии"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = (event.get('queryStringParameters') or {}).get('action', '')
    method = event.get('httpMethod', 'GET')

    if method == 'POST' and path == 'register':
        return register(event)
    elif method == 'POST' and path == 'login':
        return login(event)
    elif method == 'GET' and path == 'me':
        return me(event)
    else:
        return resp(400, {'error': 'Unknown action. Use ?action=register|login|me'})

def register(event):
    body = parse_body(event)
    email = (body.get('email') or '').strip().lower()
    password = body.get('password', '')
    name = (body.get('name') or '').strip()

    if not email or not password or not name:
        return resp(400, {'error': 'Заполните все поля: email, password, name'})
    if len(password) < 6:
        return resp(400, {'error': 'Пароль минимум 6 символов'})

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE email = '%s'" % email.replace("'", "''"))
    if cur.fetchone():
        conn.close()
        return resp(409, {'error': 'Пользователь с таким email уже существует'})

    pw_hash = hash_password(password)
    cur.execute(
        "INSERT INTO users (email, password_hash, name) VALUES ('%s', '%s', '%s') RETURNING id"
        % (email.replace("'", "''"), pw_hash.replace("'", "''"), name.replace("'", "''"))
    )
    user_id = cur.fetchone()[0]

    token = uuid.uuid4().hex + uuid.uuid4().hex
    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%d, '%s', NOW() + INTERVAL '30 days')"
        % (user_id, token)
    )
    conn.commit()
    conn.close()

    return resp(200, {'token': token, 'user': {'id': user_id, 'email': email, 'name': name}})

def login(event):
    body = parse_body(event)
    email = (body.get('email') or '').strip().lower()
    password = body.get('password', '')

    if not email or not password:
        return resp(400, {'error': 'Введите email и пароль'})

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id, email, name, password_hash FROM users WHERE email = '%s'" % email.replace("'", "''"))
    row = cur.fetchone()
    if not row:
        conn.close()
        return resp(401, {'error': 'Неверный email или пароль'})

    user_id, user_email, user_name, pw_hash = row

    if not check_password(password, pw_hash):
        conn.close()
        return resp(401, {'error': 'Неверный email или пароль'})

    token = uuid.uuid4().hex + uuid.uuid4().hex
    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%d, '%s', NOW() + INTERVAL '30 days')"
        % (user_id, token)
    )
    conn.commit()
    conn.close()

    return resp(200, {'token': token, 'user': {'id': user_id, 'email': user_email, 'name': user_name}})

def me(event):
    token = extract_token(event)
    if not token:
        return resp(401, {'error': 'Не авторизован'})

    user = get_user_by_token(token)
    if not user:
        return resp(401, {'error': 'Сессия истекла'})

    return resp(200, {'user': user})

def extract_token(event):
    headers = event.get('headers') or {}
    auth = headers.get('X-Authorization') or headers.get('x-authorization') or headers.get('Authorization') or headers.get('authorization') or ''
    if auth.startswith('Bearer '):
        return auth[7:]
    return auth

def parse_body(event):
    raw = event.get('body') or '{}'
    if isinstance(raw, str):
        return json.loads(raw)
    return raw

def resp(status, data):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False)}

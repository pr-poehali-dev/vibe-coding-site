import json
import os
import ssl
import uuid
import re
import psycopg2
import urllib.request
import urllib.error
import boto3

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
    'Content-Type': 'application/json'
}

SYSTEM_PROMPT = """Ты — профессиональный генератор одностраничных HTML-сайтов.
Пользователь описывает, какой сайт ему нужен — ты генерируешь полный, готовый HTML-файл.

Строгие правила:
- Верни ТОЛЬКО чистый HTML-код. Никаких пояснений, никакого markdown, никаких ```
- Первая строка ответа — <!DOCTYPE html>
- Последняя строка — </html>
- Все стили — в <style> внутри <head>
- Современный, чистый дизайн. Тёмная тема по умолчанию
- Адаптивная вёрстка (mobile-first)
- Подключи Google Fonts: Inter или Golos Text
- Плавные CSS-анимации (fade-in, slide-up)
- Градиенты, тени, стеклянные эффекты
- Минимум 4-5 секций: шапка, герой, особенности, о нас, подвал
- Контент на русском языке
- Кнопки с hover-эффектами
- Полностью самодостаточный HTML (без внешних JS-библиотек)
- Качественный, реалистичный контент"""

def handler(event, context):
    """Управление сайтами: создание, список, обновление, удаление"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    action = (event.get('queryStringParameters') or {}).get('action', '')
    method = event.get('httpMethod', 'GET')

    if method == 'POST' and action == 'create':
        return create_site(event)
    elif method == 'GET' and action == 'list':
        return list_sites(event)
    elif method == 'GET' and action == 'get':
        return get_site(event)
    elif method == 'PUT' and action == 'update':
        return update_site(event)
    elif method == 'POST' and action == 'regenerate':
        return regenerate_site(event)
    elif method == 'GET' and action == 'stats':
        return get_stats(event)
    elif method == 'GET' and action == 'submissions':
        return get_submissions(event)
    elif method == 'DELETE' and action == 'delete-submission':
        return delete_submission(event)
    else:
        return resp(400, {'error': 'Unknown action'})

def auth_required(event):
    headers = event.get('headers') or {}
    auth = headers.get('X-Authorization') or headers.get('x-authorization') or headers.get('Authorization') or headers.get('authorization') or ''
    token = auth[7:] if auth.startswith('Bearer ') else auth
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT u.id, u.email, u.name FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = '%s' AND s.expires_at > NOW()" % token.replace("'", "''"))
    row = cur.fetchone()
    conn.close()
    if row:
        return {'id': row[0], 'email': row[1], 'name': row[2]}
    return None

def create_site(event):
    user = auth_required(event)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    body = parse_body(event)
    prompt = (body.get('prompt') or '').strip()
    title = (body.get('title') or 'Мой сайт').strip()
    slug = (body.get('slug') or '').strip().lower()

    if not prompt:
        return resp(400, {'error': 'Опишите, какой сайт создать'})

    if not slug:
        slug = re.sub(r'[^a-z0-9-]', '', re.sub(r'\s+', '-', title.lower()))[:50]
        if not slug:
            slug = uuid.uuid4().hex[:8]

    if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', slug) and len(slug) > 1:
        return resp(400, {'error': 'Slug может содержать только латинские буквы, цифры и дефис'})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM sites WHERE slug = '%s'" % slug.replace("'", "''"))
    if cur.fetchone():
        slug = slug + '-' + uuid.uuid4().hex[:4]

    html_code = generate_html(prompt)
    if not html_code:
        conn.close()
        return resp(502, {'error': 'Не удалось сгенерировать сайт'})

    site_id = uuid.uuid4().hex[:12]
    s3_key = "sites/%s/index.html" % site_id

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=s3_key, Body=html_code.encode('utf-8'), ContentType='text/html; charset=utf-8')

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    site_url = "https://cdn.poehali.dev/projects/%s/bucket/sites/%s/index.html" % (access_key, site_id)

    cur.execute(
        "INSERT INTO sites (user_id, site_id, slug, title, s3_key, html_content, prompt) VALUES (%d, '%s', '%s', '%s', '%s', '%s', '%s') RETURNING id"
        % (user['id'], site_id, slug.replace("'", "''"), title.replace("'", "''"), s3_key, html_code.replace("'", "''"), prompt.replace("'", "''"))
    )
    db_id = cur.fetchone()[0]
    conn.commit()
    conn.close()

    return resp(200, {
        'id': db_id,
        'site_id': site_id,
        'slug': slug,
        'title': title,
        'url': site_url,
    })

def list_sites(event):
    user = auth_required(event)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, site_id, slug, title, status, views_count, created_at, prompt FROM sites WHERE user_id = %d ORDER BY created_at DESC" % user['id'])
    rows = cur.fetchall()
    conn.close()

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    sites = []
    for r in rows:
        sites.append({
            'id': r[0],
            'site_id': r[1],
            'slug': r[2],
            'title': r[3],
            'status': r[4],
            'views': r[5],
            'created_at': r[6].isoformat() if r[6] else '',
            'prompt': r[7] or '',
            'url': "https://cdn.poehali.dev/projects/%s/bucket/sites/%s/index.html" % (access_key, r[1]),
        })

    return resp(200, {'sites': sites})

def get_site(event):
    user = auth_required(event)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    params = event.get('queryStringParameters') or {}
    site_id = params.get('site_id', '')
    if not site_id:
        return resp(400, {'error': 'site_id required'})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, site_id, slug, title, description, meta_title, meta_description, og_image, html_content, prompt, status, views_count, created_at FROM sites WHERE site_id = '%s' AND user_id = %d" % (site_id.replace("'", "''"), user['id']))
    r = cur.fetchone()
    conn.close()

    if not r:
        return resp(404, {'error': 'Сайт не найден'})

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    return resp(200, {
        'id': r[0], 'site_id': r[1], 'slug': r[2], 'title': r[3],
        'description': r[4], 'meta_title': r[5], 'meta_description': r[6],
        'og_image': r[7], 'html': r[8], 'prompt': r[9], 'status': r[10],
        'views': r[11], 'created_at': r[12].isoformat() if r[12] else '',
        'url': "https://cdn.poehali.dev/projects/%s/bucket/sites/%s/index.html" % (access_key, r[1]),
    })

def update_site(event):
    user = auth_required(event)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    body = parse_body(event)
    site_id = body.get('site_id', '')
    if not site_id:
        return resp(400, {'error': 'site_id required'})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, s3_key FROM sites WHERE site_id = '%s' AND user_id = %d" % (site_id.replace("'", "''"), user['id']))
    row = cur.fetchone()
    if not row:
        conn.close()
        return resp(404, {'error': 'Сайт не найден'})

    updates = []
    if 'title' in body:
        updates.append("title = '%s'" % body['title'].replace("'", "''"))
    if 'slug' in body:
        new_slug = body['slug'].strip().lower()
        cur.execute("SELECT id FROM sites WHERE slug = '%s' AND site_id != '%s'" % (new_slug.replace("'", "''"), site_id.replace("'", "''")))
        if cur.fetchone():
            conn.close()
            return resp(409, {'error': 'Этот slug уже занят'})
        updates.append("slug = '%s'" % new_slug.replace("'", "''"))
    if 'meta_title' in body:
        updates.append("meta_title = '%s'" % body['meta_title'].replace("'", "''"))
    if 'meta_description' in body:
        updates.append("meta_description = '%s'" % body['meta_description'].replace("'", "''"))
    if 'description' in body:
        updates.append("description = '%s'" % body['description'].replace("'", "''"))
    if 'html' in body:
        html = body['html']
        updates.append("html_content = '%s'" % html.replace("'", "''"))
        s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev', aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
        s3.put_object(Bucket='files', Key=row[1], Body=html.encode('utf-8'), ContentType='text/html; charset=utf-8')

    if updates:
        updates.append("updated_at = NOW()")
        cur.execute("UPDATE sites SET %s WHERE site_id = '%s'" % (', '.join(updates), site_id.replace("'", "''")))
        conn.commit()

    conn.close()
    return resp(200, {'ok': True})

def regenerate_site(event):
    user = auth_required(event)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    body = parse_body(event)
    site_id = body.get('site_id', '')
    prompt = (body.get('prompt') or '').strip()
    if not site_id or not prompt:
        return resp(400, {'error': 'site_id и prompt обязательны'})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, s3_key FROM sites WHERE site_id = '%s' AND user_id = %d" % (site_id.replace("'", "''"), user['id']))
    row = cur.fetchone()
    if not row:
        conn.close()
        return resp(404, {'error': 'Сайт не найден'})

    html_code = generate_html(prompt)
    if not html_code:
        conn.close()
        return resp(502, {'error': 'Не удалось сгенерировать сайт'})

    s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev', aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
    s3.put_object(Bucket='files', Key=row[1], Body=html_code.encode('utf-8'), ContentType='text/html; charset=utf-8')

    cur.execute("UPDATE sites SET html_content = '%s', prompt = '%s', updated_at = NOW() WHERE id = %d" % (html_code.replace("'", "''"), prompt.replace("'", "''"), row[0]))
    conn.commit()
    conn.close()

    return resp(200, {'ok': True, 'html': html_code})

def get_stats(event):
    user = auth_required(event)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*), COALESCE(SUM(views_count), 0) FROM sites WHERE user_id = %d" % user['id'])
    row = cur.fetchone()

    cur.execute("SELECT COUNT(*) FROM form_submissions fs JOIN sites s ON fs.site_id = s.id WHERE s.user_id = %d" % user['id'])
    forms = cur.fetchone()[0]
    conn.close()

    return resp(200, {'total_sites': row[0], 'total_views': row[1], 'total_submissions': forms})

def get_submissions(event):
    user = auth_required(event)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    params = event.get('queryStringParameters') or {}
    site_id = params.get('site_id', '')
    page = int(params.get('page', '1'))
    per_page = min(int(params.get('per_page', '50')), 100)
    offset = (page - 1) * per_page

    conn = get_conn()
    cur = conn.cursor()

    if site_id:
        cur.execute("SELECT id FROM sites WHERE site_id = '%s' AND user_id = %d" % (site_id.replace("'", "''"), user['id']))
        site_row = cur.fetchone()
        if not site_row:
            conn.close()
            return resp(404, {'error': 'Сайт не найден'})
        db_site_id = site_row[0]
        cur.execute("SELECT COUNT(*) FROM form_submissions WHERE site_id = %d" % db_site_id)
        total = cur.fetchone()[0]
        cur.execute(
            "SELECT fs.id, fs.form_name, fs.data, fs.sender_ip, fs.created_at, s.title, s.slug "
            "FROM form_submissions fs JOIN sites s ON fs.site_id = s.id "
            "WHERE fs.site_id = %d ORDER BY fs.created_at DESC LIMIT %d OFFSET %d"
            % (db_site_id, per_page, offset)
        )
    else:
        cur.execute("SELECT COUNT(*) FROM form_submissions fs JOIN sites s ON fs.site_id = s.id WHERE s.user_id = %d" % user['id'])
        total = cur.fetchone()[0]
        cur.execute(
            "SELECT fs.id, fs.form_name, fs.data, fs.sender_ip, fs.created_at, s.title, s.slug "
            "FROM form_submissions fs JOIN sites s ON fs.site_id = s.id "
            "WHERE s.user_id = %d ORDER BY fs.created_at DESC LIMIT %d OFFSET %d"
            % (user['id'], per_page, offset)
        )

    rows = cur.fetchall()
    conn.close()

    submissions = []
    for r in rows:
        data_val = r[2]
        if isinstance(data_val, str):
            import json as json_mod
            data_val = json_mod.loads(data_val)
        submissions.append({
            'id': r[0],
            'form_name': r[1],
            'data': data_val,
            'sender_ip': r[3],
            'created_at': r[4].isoformat() if r[4] else '',
            'site_title': r[5],
            'site_slug': r[6],
        })

    return resp(200, {'submissions': submissions, 'total': total, 'page': page, 'per_page': per_page})


def delete_submission(event):
    user = auth_required(event)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    params = event.get('queryStringParameters') or {}
    sub_id = params.get('submission_id', '')
    if not sub_id:
        return resp(400, {'error': 'submission_id required'})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM form_submissions WHERE id = %d AND site_id IN (SELECT id FROM sites WHERE user_id = %d)"
        % (int(sub_id), user['id'])
    )
    deleted = cur.rowcount
    conn.commit()
    conn.close()

    if not deleted:
        return resp(404, {'error': 'Заявка не найдена'})
    return resp(200, {'ok': True})


def generate_html(prompt):
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        return None

    payload = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 4000,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": "Создай одностраничный сайт: %s" % prompt}],
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://188.137.252.157/v1/messages',
        data=payload,
        headers={'Content-Type': 'application/json', 'x-api-key': api_key, 'anthropic-version': '2023-06-01'},
        method='POST',
    )

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, timeout=120, context=ssl_ctx) as r:
            data = json.loads(r.read().decode('utf-8'))
    except Exception:
        return None

    html = ''
    for block in data.get('content', []):
        if block.get('type') == 'text':
            html += block['text']

    html = html.strip()
    if html.startswith('```'):
        lines = html.split('\n')
        lines = lines[1:]
        if lines and lines[-1].strip() == '```':
            lines = lines[:-1]
        html = '\n'.join(lines)

    if not html or '<!DOCTYPE' not in html.upper():
        return None
    return html

def parse_body(event):
    raw = event.get('body') or '{}'
    if isinstance(raw, str):
        return json.loads(raw)
    return raw

def resp(status, data):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False)}
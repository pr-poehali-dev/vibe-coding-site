import json
import os
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event, context):
    """Приём заявок с форм на сайтах пользователей"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    if event.get('httpMethod') != 'POST':
        return resp(405, {'error': 'Method not allowed'})

    body = parse_body(event)
    site_id = body.get('site_id')
    form_name = (body.get('form_name') or 'default').strip()[:100]
    data = body.get('data')

    if not site_id or not data:
        return resp(400, {'error': 'site_id and data required'})

    if not isinstance(data, dict):
        return resp(400, {'error': 'data must be an object'})

    if len(data) > 50:
        return resp(400, {'error': 'Too many fields'})

    ip = ''
    rc = event.get('requestContext') or {}
    identity = rc.get('identity') or {}
    ip = identity.get('sourceIp', '')

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id FROM sites WHERE id = %d AND status = 'active'" % int(site_id))
    if not cur.fetchone():
        conn.close()
        return resp(404, {'error': 'Site not found'})

    data_json = json.dumps(data, ensure_ascii=False).replace("'", "''")
    cur.execute(
        "INSERT INTO form_submissions (site_id, form_name, data, sender_ip) VALUES (%d, '%s', '%s'::jsonb, '%s') RETURNING id"
        % (int(site_id), form_name.replace("'", "''"), data_json, ip.replace("'", "''"))
    )
    sub_id = cur.fetchone()[0]
    conn.commit()
    conn.close()

    return resp(200, {'ok': True, 'submission_id': sub_id})


def parse_body(event):
    body = event.get('body', '') or ''
    if event.get('isBase64Encoded'):
        import base64
        body = base64.b64decode(body).decode('utf-8')
    try:
        return json.loads(body)
    except Exception:
        return {}


def resp(status, data):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps(data, ensure_ascii=False),
    }

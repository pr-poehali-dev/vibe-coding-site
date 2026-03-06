import json
import os
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event, context):
    """Роутер: отдаёт HTML сайта по slug и считает просмотры"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    if event.get('httpMethod') != 'GET':
        return {'statusCode': 405, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Method not allowed'})}

    params = event.get('queryStringParameters') or {}
    slug = params.get('slug', '').strip()

    if not slug:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'slug parameter required'})}

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id, html_content, meta_title, meta_description, og_image, title FROM sites WHERE slug = '%s' AND status = 'active'" % slug.replace("'", "''"))
    row = cur.fetchone()

    if not row:
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': '<!DOCTYPE html><html><head><meta charset="utf-8"><title>404</title></head><body style="background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h1>Сайт не найден</h1></body></html>',
        }

    site_db_id, html_content, meta_title, meta_description, og_image, title = row

    cur.execute("UPDATE sites SET views_count = views_count + 1 WHERE id = %d" % site_db_id)

    ip = ''
    rc = event.get('requestContext') or {}
    identity = rc.get('identity') or {}
    ip = identity.get('sourceIp', '')

    ua = (event.get('headers') or {}).get('User-Agent', '')
    referer = (event.get('headers') or {}).get('Referer', '')

    cur.execute(
        "INSERT INTO analytics (site_id, visitor_ip, user_agent, referer) VALUES (%d, '%s', '%s', '%s')"
        % (site_db_id, ip.replace("'", "''"), ua[:500].replace("'", "''"), referer[:500].replace("'", "''"))
    )

    conn.commit()
    conn.close()

    if html_content and meta_title:
        html_content = html_content.replace('<title>', '<title>%s | ' % meta_title, 1)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
        },
        'body': html_content or '',
    }

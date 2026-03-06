import json
import os
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

FORM_CAPTURE_JS = """<script>(function(){var SUBMIT_URL="__SUBMIT_URL__";var SITE_ID=__SITE_DB_ID__;document.addEventListener("submit",function(e){var f=e.target;if(!f||f.tagName!=="FORM")return;e.preventDefault();var d={};var els=f.elements;for(var i=0;i<els.length;i++){var el=els[i];if(el.name&&el.type!=="submit"&&el.type!=="button"){d[el.name]=el.value||""}}var fn=f.getAttribute("name")||f.getAttribute("id")||"default";fetch(SUBMIT_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({site_id:SITE_ID,form_name:fn,data:d})}).then(function(){var msg=document.createElement("div");msg.style.cssText="position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;font-family:sans-serif;font-size:14px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.3)";msg.textContent="\\u0417\\u0430\\u044f\\u0432\\u043a\\u0430 \\u043e\\u0442\\u043f\\u0440\\u0430\\u0432\\u043b\\u0435\\u043d\\u0430!";document.body.appendChild(msg);setTimeout(function(){msg.remove()},3000);f.reset()}).catch(function(){var msg=document.createElement("div");msg.style.cssText="position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;font-family:sans-serif;font-size:14px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.3)";msg.textContent="\\u041e\\u0448\\u0438\\u0431\\u043a\\u0430 \\u043e\\u0442\\u043f\\u0440\\u0430\\u0432\\u043a\\u0438";document.body.appendChild(msg);setTimeout(function(){msg.remove()},3000)})},true)})();</script>"""

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

    submit_url = os.environ.get('FORM_SUBMIT_URL', '')
    if submit_url and html_content and '</body>' in html_content:
        script = FORM_CAPTURE_JS.replace('__SUBMIT_URL__', submit_url).replace('__SITE_DB_ID__', str(site_db_id))
        html_content = html_content.replace('</body>', script + '</body>')

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
        },
        'body': html_content or '',
    }

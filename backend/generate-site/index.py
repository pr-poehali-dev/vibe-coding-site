import json
import os
import ssl
import urllib.request
import urllib.error
import uuid
import boto3


SYSTEM_PROMPT = """Ты — профессиональный генератор одностраничных HTML-сайтов.
Пользователь описывает, какой сайт ему нужен — ты генерируешь полный, готовый HTML-файл.

Строгие правила:
- Верни ТОЛЬКО чистый HTML-код. Никаких пояснений, никакого markdown, никаких ```
- Первая строка ответа — <!DOCTYPE html>
- Последняя строка — </html>
- Все стили — в <style> внутри <head>
- Современный, чистый дизайн. Тёмная тема по умолчанию (тёмный фон, светлый текст)
- Адаптивная вёрстка (mobile-first, используй media queries)
- Подключи Google Fonts: Inter или Golos Text
- Плавные CSS-анимации (fade-in, slide-up при загрузке)
- Градиенты, тени, стеклянные эффекты (glassmorphism)
- Минимум 4-5 секций: шапка, герой, особенности, о нас, подвал
- Контент на русском языке, используй эмодзи для акцентов
- Кнопки с hover-эффектами
- Полностью самодостаточный HTML (без внешних JS-библиотек)
- Качественный, реалистичный контент — не заглушки"""


def handler(event, context):
    """Генерирует HTML-сайт по текстовому описанию через Claude AI и публикует его"""

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

    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    body = {}
    raw_body = event.get('body') or '{}'
    if isinstance(raw_body, str):
        body = json.loads(raw_body)
    elif isinstance(raw_body, dict):
        body = raw_body

    prompt = body.get('prompt', '').strip()
    if not prompt:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'No prompt provided'})}

    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'AI key not configured'})}

    payload = json.dumps({
        "model": "claude-3-5-haiku-20241022",
        "max_tokens": 4000,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": f"Создай одностраничный сайт: {prompt}"}
        ],
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://188.137.252.157/v1/messages',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
        },
        method='POST',
    )

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    resp_data = None
    try:
        with urllib.request.urlopen(req, timeout=120, context=ssl_ctx) as resp:
            resp_data = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        print(f"Anthropic API error {e.code}: {error_body}")
        hint = ''
        if e.code == 403:
            hint = ' — проверьте, что на аккаунте Anthropic подключена оплата и ключ активен'
        elif e.code == 401:
            hint = ' — неверный API-ключ'
        return {
            'statusCode': 502,
            'headers': cors,
            'body': json.dumps({'error': f'Ошибка AI ({e.code}){hint}'}),
        }

    html_code = ''
    for block in resp_data.get('content', []):
        if block.get('type') == 'text':
            html_code += block['text']

    html_code = html_code.strip()
    if html_code.startswith('```'):
        lines = html_code.split('\n')
        lines = lines[1:]
        if lines and lines[-1].strip() == '```':
            lines = lines[:-1]
        html_code = '\n'.join(lines)

    if not html_code or '<!DOCTYPE' not in html_code.upper():
        return {
            'statusCode': 502,
            'headers': cors,
            'body': json.dumps({'error': 'AI did not return valid HTML'}),
        }

    site_id = uuid.uuid4().hex[:12]
    s3_key = f"sites/{site_id}/index.html"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    s3.put_object(
        Bucket='files',
        Key=s3_key,
        Body=html_code.encode('utf-8'),
        ContentType='text/html; charset=utf-8',
    )

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    site_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/sites/{site_id}/index.html"

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({
            'site_id': site_id,
            'url': site_url,
            'html': html_code,
        }),
    }
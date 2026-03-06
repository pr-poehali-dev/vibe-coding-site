import json
import os
import urllib.request
import urllib.error
import uuid
import boto3


def handler(event, context):
    """Генерирует HTML-сайт по описанию через AI и публикует его в S3"""

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

    try:
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    except (json.JSONDecodeError, TypeError):
        body = {}

    prompt = body.get('prompt', '').strip()
    if not prompt:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'No prompt provided'})}

    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    system_prompt = """Ты — генератор HTML-сайтов. Пользователь описывает сайт, ты генерируешь полный HTML-код.

Правила:
- Верни ТОЛЬКО HTML-код, без пояснений, без markdown-блоков
- Используй встроенные стили (тег <style> в <head>)
- Дизайн должен быть современным, красивым, с тёмной темой
- Адаптивный дизайн (mobile-friendly)
- Используй Google Fonts (Golos Text)
- Добавь плавные анимации через CSS
- Язык контента — русский
- Используй эмодзи для визуальных акцентов
- Минимум 3-4 секции на странице
- HTML должен быть полным (<!DOCTYPE html> ... </html>)
- Используй градиенты, glassmorphism-эффекты, современную типографику"""

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Создай сайт: {prompt}"},
        ],
        "max_tokens": 4000,
        "temperature": 0.7,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            html_code = result['choices'][0]['message']['content']
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        return {'statusCode': 502, 'headers': cors, 'body': json.dumps({'error': f'AI error: {e.code}', 'details': error_body})}

    html_code = html_code.strip()
    if html_code.startswith('```'):
        lines = html_code.split('\n')
        lines = lines[1:]
        if lines and lines[-1].strip() == '```':
            lines = lines[:-1]
        html_code = '\n'.join(lines)

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

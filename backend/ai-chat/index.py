import json
import os
import urllib.request
import urllib.error


def handler(event, context):
    """AI-чат Коди — отвечает на вопросы пользователей о создании сайтов"""

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
    messages = body.get('messages', [])

    if not messages:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'No messages'})}

    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    system_prompt = (
        "Ты — Коди, дружелюбный AI-ассистент для создания сайтов. "
        "Ты помогаешь пользователям создавать сайты, лендинги и веб-приложения. "
        "Отвечай коротко (2-4 предложения), по-русски, в дружелюбном тоне. "
        "Если пользователь описывает сайт — предложи структуру и дизайн. "
        "Если спрашивает о возможностях — расскажи про AI-генерацию, шаблоны, компоненты и мгновенную публикацию."
    )

    openai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages[-10:]:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        if role in ('user', 'assistant') and content:
            openai_messages.append({"role": role, "content": content})

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": openai_messages,
        "max_tokens": 300,
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
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            reply = result['choices'][0]['message']['content']
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'reply': reply})}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        return {'statusCode': 502, 'headers': cors, 'body': json.dumps({'error': f'OpenAI error: {e.code}', 'details': error_body})}
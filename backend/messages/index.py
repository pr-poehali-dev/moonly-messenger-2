import json
import os
import psycopg2
from datetime import datetime

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    '''API для работы с чатами и сообщениями'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        user_id = int(user_id)
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action')
            
            if action == 'chats':
                cur.execute("""
                    SELECT DISTINCT 
                        c.id, c.name, c.is_group, c.avatar_url,
                        (SELECT message_text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                        (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != %s AND is_read = false) as unread_count
                    FROM chats c
                    INNER JOIN chat_members cm ON cm.chat_id = c.id
                    WHERE cm.user_id = %s
                    ORDER BY last_message_time DESC NULLS LAST
                """, (user_id, user_id))
                
                chats = []
                for row in cur.fetchall():
                    chat_id = row[0]
                    
                    if not row[2]:
                        cur.execute("""
                            SELECT u.id, u.username, u.nickname, u.avatar_url, u.is_online, u.status_text, u.status_emoji
                            FROM chat_members cm
                            INNER JOIN users u ON u.id = cm.user_id
                            WHERE cm.chat_id = %s AND cm.user_id != %s
                            LIMIT 1
                        """, (chat_id, user_id))
                        other_user = cur.fetchone()
                        
                        if other_user:
                            chats.append({
                                'id': chat_id,
                                'name': other_user[2],
                                'avatar_url': other_user[3],
                                'is_group': False,
                                'last_message': row[4] or '',
                                'last_message_time': row[5].isoformat() if row[5] else None,
                                'unread_count': row[6],
                                'online': other_user[4],
                                'status_text': other_user[5],
                                'status_emoji': other_user[6]
                            })
                    else:
                        chats.append({
                            'id': chat_id,
                            'name': row[1],
                            'avatar_url': row[3],
                            'is_group': True,
                            'last_message': row[4] or '',
                            'last_message_time': row[5].isoformat() if row[5] else None,
                            'unread_count': row[6],
                            'online': False
                        })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chats': chats}),
                    'isBase64Encoded': False
                }
            
            elif action == 'messages':
                chat_id = event.get('queryStringParameters', {}).get('chat_id')
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT m.id, m.message_text, m.message_type, m.file_url, m.created_at, m.sender_id, u.nickname
                    FROM messages m
                    INNER JOIN users u ON u.id = m.sender_id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (int(chat_id),))
                
                messages = []
                for row in cur.fetchall():
                    messages.append({
                        'id': row[0],
                        'text': row[1],
                        'type': row[2],
                        'file_url': row[3],
                        'time': row[4].isoformat(),
                        'sender_id': row[5],
                        'sender_name': row[6],
                        'is_own': row[5] == user_id
                    })
                
                cur.execute("""
                    UPDATE messages SET is_read = true 
                    WHERE chat_id = %s AND sender_id != %s AND is_read = false
                """, (int(chat_id), user_id))
                conn.commit()
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'send_message':
                chat_id = body.get('chat_id')
                message_text = body.get('message_text', '').strip()
                message_type = body.get('message_type', 'text')
                file_url = body.get('file_url')
                
                if not chat_id or (not message_text and not file_url):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id and message required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO messages (chat_id, sender_id, message_text, message_type, file_url)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (chat_id, user_id, message_text, message_type, file_url))
                
                result = cur.fetchone()
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message_id': result[0],
                        'created_at': result[1].isoformat()
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'create_chat':
                other_user_id = body.get('other_user_id')
                is_group = body.get('is_group', False)
                group_name = body.get('group_name')
                
                if not other_user_id and not is_group:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'other_user_id required'}),
                        'isBase64Encoded': False
                    }
                
                if not is_group:
                    cur.execute("""
                        SELECT c.id FROM chats c
                        INNER JOIN chat_members cm1 ON cm1.chat_id = c.id
                        INNER JOIN chat_members cm2 ON cm2.chat_id = c.id
                        WHERE c.is_group = false 
                        AND cm1.user_id = %s 
                        AND cm2.user_id = %s
                        LIMIT 1
                    """, (user_id, other_user_id))
                    
                    existing = cur.fetchone()
                    if existing:
                        cur.close()
                        conn.close()
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'success': True, 'chat_id': existing[0], 'existing': True}),
                            'isBase64Encoded': False
                        }
                
                cur.execute("""
                    INSERT INTO chats (name, is_group, created_by)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (group_name, is_group, user_id))
                
                chat_id = cur.fetchone()[0]
                
                cur.execute("""
                    INSERT INTO chat_members (chat_id, user_id)
                    VALUES (%s, %s)
                """, (chat_id, user_id))
                
                if not is_group and other_user_id:
                    cur.execute("""
                        INSERT INTO chat_members (chat_id, user_id)
                        VALUES (%s, %s)
                    """, (chat_id, other_user_id))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'chat_id': chat_id}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

import json
import os
import psycopg2

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    '''API для работы с пользователями и друзьями'''
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
            
            if action == 'search':
                query = event.get('queryStringParameters', {}).get('query', '').strip()
                if not query:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'query required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT id, username, nickname, avatar_url, is_online, status_text, status_emoji
                    FROM users
                    WHERE (username ILIKE %s OR nickname ILIKE %s) AND id != %s
                    LIMIT 20
                """, (f'%{query}%', f'%{query}%', user_id))
                
                users = []
                for row in cur.fetchall():
                    users.append({
                        'id': row[0],
                        'username': row[1],
                        'nickname': row[2],
                        'avatar_url': row[3],
                        'is_online': row[4],
                        'status_text': row[5],
                        'status_emoji': row[6]
                    })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': users}),
                    'isBase64Encoded': False
                }
            
            elif action == 'friend_requests':
                cur.execute("""
                    SELECT fr.id, u.id, u.username, u.nickname, u.avatar_url, fr.created_at, fr.status
                    FROM friend_requests fr
                    INNER JOIN users u ON u.id = fr.from_user_id
                    WHERE fr.to_user_id = %s AND fr.status = 'pending'
                    ORDER BY fr.created_at DESC
                """, (user_id,))
                
                requests = []
                for row in cur.fetchall():
                    requests.append({
                        'request_id': row[0],
                        'user_id': row[1],
                        'username': row[2],
                        'nickname': row[3],
                        'avatar_url': row[4],
                        'created_at': row[5].isoformat()
                    })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'requests': requests}),
                    'isBase64Encoded': False
                }
            
            elif action == 'profile':
                profile_user_id = event.get('queryStringParameters', {}).get('user_id')
                if profile_user_id:
                    profile_user_id = int(profile_user_id)
                else:
                    profile_user_id = user_id
                
                cur.execute("""
                    SELECT id, username, nickname, email, avatar_url, status_text, status_emoji, is_online, last_seen
                    FROM users
                    WHERE id = %s
                """, (profile_user_id,))
                
                user = cur.fetchone()
                if not user:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user': {
                            'id': user[0],
                            'username': user[1],
                            'nickname': user[2],
                            'email': user[3] if profile_user_id == user_id else None,
                            'avatar_url': user[4],
                            'status_text': user[5],
                            'status_emoji': user[6],
                            'is_online': user[7],
                            'last_seen': user[8].isoformat() if user[8] else None
                        }
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'update_profile':
                nickname = body.get('nickname')
                avatar_url = body.get('avatar_url')
                status_text = body.get('status_text')
                status_emoji = body.get('status_emoji')
                
                updates = []
                params = []
                
                if nickname is not None:
                    updates.append('nickname = %s')
                    params.append(nickname)
                
                if avatar_url is not None:
                    updates.append('avatar_url = %s')
                    params.append(avatar_url)
                
                if status_text is not None:
                    updates.append('status_text = %s')
                    params.append(status_text)
                
                if status_emoji is not None:
                    updates.append('status_emoji = %s')
                    params.append(status_emoji)
                
                if not updates:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'No fields to update'}),
                        'isBase64Encoded': False
                    }
                
                params.append(user_id)
                query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
                
                cur.execute(query, params)
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'send_friend_request':
                to_username = body.get('username', '').strip()
                if not to_username:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'username required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT id FROM users WHERE username = %s", (to_username,))
                to_user = cur.fetchone()
                
                if not to_user:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                to_user_id = to_user[0]
                
                if to_user_id == user_id:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Нельзя добавить себя в друзья'}),
                        'isBase64Encoded': False
                    }
                
                try:
                    cur.execute("""
                        INSERT INTO friend_requests (from_user_id, to_user_id, status)
                        VALUES (%s, %s, 'pending')
                        RETURNING id
                    """, (user_id, to_user_id))
                    request_id = cur.fetchone()[0]
                    conn.commit()
                    
                    cur.close()
                    conn.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'request_id': request_id}),
                        'isBase64Encoded': False
                    }
                except psycopg2.IntegrityError:
                    conn.rollback()
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Запрос уже отправлен'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'accept_friend_request':
                request_id = body.get('request_id')
                if not request_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'request_id required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT from_user_id FROM friend_requests 
                    WHERE id = %s AND to_user_id = %s AND status = 'pending'
                """, (request_id, user_id))
                
                request = cur.fetchone()
                if not request:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Запрос не найден'}),
                        'isBase64Encoded': False
                    }
                
                from_user_id = request[0]
                
                cur.execute("""
                    UPDATE friend_requests SET status = 'accepted'
                    WHERE id = %s
                """, (request_id,))
                
                cur.execute("""
                    INSERT INTO chats (is_group, created_by)
                    VALUES (false, %s)
                    RETURNING id
                """, (user_id,))
                chat_id = cur.fetchone()[0]
                
                cur.execute("""
                    INSERT INTO chat_members (chat_id, user_id)
                    VALUES (%s, %s), (%s, %s)
                """, (chat_id, user_id, chat_id, from_user_id))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'chat_id': chat_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'reject_friend_request':
                request_id = body.get('request_id')
                if not request_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'request_id required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE friend_requests SET status = 'rejected'
                    WHERE id = %s AND to_user_id = %s AND status = 'pending'
                """, (request_id, user_id))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
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
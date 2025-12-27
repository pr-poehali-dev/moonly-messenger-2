import json
import os
import psycopg2
from datetime import datetime

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    '''API для WebRTC сигналинга звонков'''
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
            
            if action == 'poll':
                chat_id = event.get('queryStringParameters', {}).get('chat_id')
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT id, caller_id, receiver_id, call_type, status, signal_data, created_at
                    FROM call_sessions
                    WHERE chat_id = %s AND status IN ('calling', 'ringing', 'active')
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (int(chat_id),))
                
                call = cur.fetchone()
                cur.close()
                conn.close()
                
                if call:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'call': {
                                'id': call[0],
                                'caller_id': call[1],
                                'receiver_id': call[2],
                                'call_type': call[3],
                                'status': call[4],
                                'signal_data': json.loads(call[5]) if call[5] else None,
                                'created_at': call[6].isoformat()
                            }
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'call': None}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'start_call':
                chat_id = body.get('chat_id')
                call_type = body.get('call_type', 'audio')
                receiver_id = body.get('receiver_id')
                
                if not chat_id or not receiver_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id and receiver_id required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO call_sessions (chat_id, caller_id, receiver_id, call_type, status)
                    VALUES (%s, %s, %s, %s, 'calling')
                    RETURNING id
                """, (chat_id, user_id, receiver_id, call_type))
                
                call_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'call_id': call_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_signal':
                call_id = body.get('call_id')
                signal_data = body.get('signal_data')
                
                if not call_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'call_id required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE call_sessions 
                    SET signal_data = %s, status = 'active'
                    WHERE id = %s
                """, (json.dumps(signal_data), call_id))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'end_call':
                call_id = body.get('call_id')
                
                if not call_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'call_id required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE call_sessions 
                    SET status = 'ended', ended_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (call_id,))
                
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

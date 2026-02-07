"""
Netlify serverless function wrapper for Flask app
This adapts the Flask app to work with Netlify Functions
"""

from app import app
import json

def handler(event, context):
    """
    AWS Lambda/Netlify Function handler
    """
    # Parse the incoming request
    path = event.get('path', '/')
    http_method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {})
    body = event.get('body', '')
    
    # Create a test request context
    with app.test_request_context(
        path=path,
        method=http_method,
        headers=headers,
        query_string=query_params,
        data=body
    ):
        try:
            # Process the request through Flask
            response = app.full_dispatch_request()
            
            # Extract response data
            response_body = response.get_data(as_text=True)
            status_code = response.status_code
            response_headers = dict(response.headers)
            
            return {
                'statusCode': status_code,
                'headers': response_headers,
                'body': response_body
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }

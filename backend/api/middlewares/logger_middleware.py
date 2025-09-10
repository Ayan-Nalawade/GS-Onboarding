from collections.abc import Callable
from typing import Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

class LoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Any]
    ) -> Response:
        """
        Logs all incoming and outgoing request, response pairs. This method logs the request params,
        datetime of request, duration of execution. Logs should be printed using the custom logging module provided.
        Logs should be printed so that they are easily readable and understandable.

        :param request: Request received to this middleware from client (it is supplied by FastAPI)
        :param call_next: Endpoint or next middleware to be called (if any, this is the next middleware in the chain of middlewares, it is supplied by FastAPI)
        :return: Response from endpoint
        """
        start_time = time.time()
        
        # Read request body
        request_body = await request.body()
        
        # Monkey patch the request to have the body
        async def receive():
            return {"type": "http.request", "body": request_body, "more_body": False}
        request._receive = receive

        response = await call_next(request)

        # Read response body
        response_body = b""
        async for chunk in response.body_iterator:
            response_body += chunk
        
        duration = time.time() - start_time
        
        logging.info(f"Request: {request.method} {request.url.path}")
        if request_body:
            logging.info(f"Request Body: {request_body.decode()}")
        logging.info(f"Response Status Code: {response.status_code}")
        if response_body:
            logging.info(f"Response Body: {response_body.decode()}")
        logging.info(f"Duration: {duration:.2f}s")
        
        # Return a new response with the buffered body, so it can be read again by the client
        return Response(
            content=response_body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )
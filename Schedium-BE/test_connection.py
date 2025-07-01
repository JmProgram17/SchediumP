#!/usr/bin/env python3
import socket
import time
import os

def test_connection():
    host = os.getenv('DB_HOST', 'mysql')
    port = int(os.getenv('DB_PORT', '3306'))
    
    print(f"Testing connection to {host}:{port}")
    
    # Test DNS resolution
    try:
        ip = socket.gethostbyname(host)
        print(f"✓ DNS resolved: {host} -> {ip}")
    except socket.gaierror as e:
        print(f"✗ DNS resolution failed: {e}")
        return False
    
    # Test TCP connection
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    
    try:
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f"✓ TCP connection successful to {host}:{port}")
            sock.close()
            return True
        else:
            print(f"✗ TCP connection failed with error code: {result}")
            return False
    except Exception as e:
        print(f"✗ Connection error: {e}")
        return False
    finally:
        sock.close()

if __name__ == "__main__":
    test_connection()
#!/usr/bin/env python3
"""
Simple test runner for the PACMAN game.
This script starts a local server and runs the tests in a headless browser.
"""

import http.server
import socketserver
import threading
import time
import subprocess
import sys
import os
from pathlib import Path

def start_server(port=8000):
    """Start a simple HTTP server in the background."""
    os.chdir(Path(__file__).parent)
    
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Suppress server logs
    
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"Server started at http://localhost:{port}")
        httpd.serve_forever()

def run_tests():
    """Run the tests using a headless browser if available."""
    test_url = "http://localhost:8000/tests/test_pacman.html"
    
    # Try to use different browsers for testing
    browsers = [
        ["google-chrome", "--headless", "--no-sandbox", "--disable-gpu", "--dump-dom"],
        ["chromium-browser", "--headless", "--no-sandbox", "--disable-gpu", "--dump-dom"],
        ["firefox", "--headless"],
    ]
    
    for browser_cmd in browsers:
        try:
            print(f"Trying to run tests with {browser_cmd[0]}...")
            result = subprocess.run(
                browser_cmd + [test_url],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("✓ Tests completed successfully!")
                print("Test output:")
                print(result.stdout)
                return True
            else:
                print(f"Browser returned error code: {result.returncode}")
                print(f"Error: {result.stderr}")
                
        except FileNotFoundError:
            print(f"{browser_cmd[0]} not found, trying next browser...")
            continue
        except subprocess.TimeoutExpired:
            print(f"Test timeout with {browser_cmd[0]}")
            continue
        except Exception as e:
            print(f"Error running tests with {browser_cmd[0]}: {e}")
            continue
    
    print("Could not run automated tests with headless browser.")
    print(f"Please open {test_url} in your browser to run tests manually.")
    return False

def main():
    """Main function to run the test suite."""
    print("PACMAN Game Test Runner")
    print("=" * 30)
    
    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait for server to start
    time.sleep(2)
    
    # Run tests
    success = run_tests()
    
    if not success:
        print("\nManual testing instructions:")
        print("1. Open http://localhost:8000/index.html to test the game")
        print("2. Open http://localhost:8000/tests/test_pacman.html to run automated tests")
        print("3. Press Ctrl+C to stop the server")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nServer stopped.")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
"""
Test script for AI Service
"""
import requests
import json
import time
from pathlib import Path

# Configuration
API_URL = "http://localhost:5000"
TIMEOUT = 30

# ANSI colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

def print_test(name):
    print(f"\n{CYAN}▶ {name}{RESET}")

def print_pass(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_fail(message):
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    print(f"{YELLOW}ℹ {message}{RESET}")


def test_health_check():
    """Test health check endpoint"""
    print_test("Health Check")
    try:
        response = requests.get(f"{API_URL}/health", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print_pass(f"Service is healthy: {data['status']}")
            return True
        else:
            print_fail(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Connection error: {e}")
        return False


def test_api_info():
    """Test API info endpoint"""
    print_test("API Information")
    try:
        response = requests.get(f"{API_URL}/api/info", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print_pass(f"API: {data['name']} v{data['version']}")
            print_info(f"AI Models: {len(data['ai_models'])} models loaded")
            for model in data['ai_models']:
                print_info(f"  - {model}")
            return True
        else:
            print_fail(f"API info failed: {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Error: {e}")
        return False


def test_models_status():
    """Test models status endpoint"""
    print_test("Models Status")
    try:
        response = requests.get(f"{API_URL}/models/status", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            for model_name, status in data.items():
                if model_name == 'timestamp':
                    continue
                if isinstance(status, dict) and 'status' in status:
                    status_val = status['status']
                    if status_val == 'loaded':
                        print_pass(f"{model_name}: {status_val}")
                    else:
                        print_info(f"{model_name}: {status_val}")
            return True
        else:
            print_fail(f"Models status failed: {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Error: {e}")
        return False


def test_validation_with_dummy_file():
    """Test validation with dummy certificate"""
    print_test("Certificate Validation (Dummy File)")
    
    # Create a dummy test image
    test_image_path = Path("test_certificate.jpg")
    
    try:
        # Try to create a simple test image
        try:
            from PIL import Image, ImageDraw
            
            # Create a dummy certificate image
            img = Image.new('RGB', (800, 600), color='white')
            draw = ImageDraw.Draw(img)
            
            # Add some text
            draw.text((50, 50), "CERTIFICATE OF AUTHENTICITY", fill='black')
            draw.text((50, 100), "Name: Test Student", fill='black')
            draw.text((50, 150), "Roll: U19CS001", fill='black')
            draw.text((50, 200), "Course: B.Tech", fill='black')
            
            img.save(str(test_image_path))
            print_info("Created test image")
        except ImportError:
            print_info("PIL not available, using existing test file or skipping")
            if not test_image_path.exists():
                print_fail("No test image available")
                return False
        
        # Send validation request
        with open(test_image_path, 'rb') as f:
            files = {'file': f}
            data = {
                'certificate_id': 'TEST_001',
            }
            
            response = requests.post(
                f"{API_URL}/validate",
                files=files,
                data=data,
                timeout=TIMEOUT
            )
        
        if response.status_code == 200:
            result = response.json()
            decision = result.get('final_decision', 'UNKNOWN')
            confidence = result.get('confidence', 0)
            
            if decision in ['VALID', 'INVALID', 'SUSPICIOUS']:
                print_pass(f"Validation complete: {decision} (confidence: {confidence:.2f})")
            else:
                print_info(f"Validation result: {decision}")
            
            # Show step results
            steps = result.get('steps', {})
            for step_name, step_result in steps.items():
                if isinstance(step_result, dict) and 'status' in step_result:
                    status = step_result['status']
                    if status == 'success':
                        print_pass(f"  {step_name}: {status}")
                    elif status == 'skipped':
                        print_info(f"  {step_name}: {status}")
                    else:
                        print_fail(f"  {step_name}: {status}")
            
            return True
        else:
            print_fail(f"Validation failed: {response.status_code}")
            print_fail(f"Response: {response.text}")
            return False
    
    except Exception as e:
        print_fail(f"Error: {e}")
        return False
    
    finally:
        # Cleanup
        if test_image_path.exists():
            test_image_path.unlink()


def test_performance():
    """Test API response time"""
    print_test("Performance Test")
    try:
        start_time = time.time()
        response = requests.get(f"{API_URL}/health", timeout=TIMEOUT)
        elapsed_time = (time.time() - start_time) * 1000  # Convert to ms
        
        if elapsed_time < 100:
            print_pass(f"Response time: {elapsed_time:.2f}ms")
        else:
            print_info(f"Response time: {elapsed_time:.2f}ms")
        
        return True
    except Exception as e:
        print_fail(f"Performance test failed: {e}")
        return False


def main():
    """Run all tests"""
    print(f"\n{CYAN}{'='*60}")
    print(f"Academic Authenticity Validator - AI Service Tests")
    print(f"{'='*60}{RESET}")
    
    tests = [
        ("Health Check", test_health_check),
        ("API Information", test_api_info),
        ("Models Status", test_models_status),
        ("Performance", test_performance),
        ("Validation Test", test_validation_with_dummy_file),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print_fail(f"Test crashed: {e}")
            results[test_name] = False
    
    # Summary
    print(f"\n{CYAN}{'='*60}")
    print(f"Test Summary")
    print(f"{'='*60}{RESET}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"{test_name}: {status}")
    
    print(f"\n{CYAN}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"{GREEN}✓ All tests passed!{RESET}\n")
        return 0
    else:
        print(f"{RED}✗ Some tests failed{RESET}\n")
        return 1


if __name__ == '__main__':
    import sys
    
    # Check if service is running
    print_info(f"Testing API at: {API_URL}")
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
    except:
        print_fail("AI Service is not running!")
        print_info("Start the service with: python app_flask.py")
        sys.exit(1)
    
    exit_code = main()
    sys.exit(exit_code)

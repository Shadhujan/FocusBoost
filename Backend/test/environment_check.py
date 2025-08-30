# Create environment_check.py
import sys
import platform
import subprocess
import pkg_resources

def check_environment():
    print("=== SYSTEM INFORMATION ===")
    print(f"OS: {platform.system()} {platform.release()}")
    print(f"Python Version: {sys.version}")
    print(f"Architecture: {platform.machine()}")
        
    print("\n=== PYTHON PACKAGES ===")
    installed_packages = [d.project_name + "==" + d.version for d in pkg_resources.working_set]
    for package in sorted(installed_packages):
        if any(name in package.lower() for name in ['fastapi', 'tensorflow', 'firebase', 'torch', 'numpy']):
            print(package)

if __name__ == "__main__":
    check_environment()
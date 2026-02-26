"""
Debug Login Script
Run this to test login with specific credentials
"""

from app.database.session import SessionLocal
from app.models.user import User
from app.utils.security import verify_password

def debug_login(email: str, password: str):
    db = SessionLocal()

    print(f"\n=== Debugging Login for {email} ===\n")

    # Step 1: Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if not user:
        print("❌ User NOT FOUND in database")
        print("   Solution: Sign up first with this email")
        db.close()
        return

    print(f"✓ User found: {user.name}")

    # Step 2: Check if user has password
    if not user.password_hash:
        print("❌ User has NO password (Google OAuth account)")
        print("   Solution: Use Google Sign-In instead")
        db.close()
        return

    print("✓ User has password hash")

    # Step 3: Verify password
    is_valid = verify_password(password, user.password_hash)

    if is_valid:
        print("✓ Password is CORRECT")
        print("\n=== Login should work! ===")
    else:
        print("❌ Password is INCORRECT")
        print("   Solution: Use the correct password or reset it")

    db.close()

if __name__ == "__main__":
    # Test with your credentials
    email = input("Enter email: ")
    password = input("Enter password: ")
    debug_login(email, password)

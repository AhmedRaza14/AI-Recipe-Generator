# Authentication API Documentation

## Manual Authentication (Email/Password)

### 1. Sign Up
**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Requirements:**
- Email must be valid format
- Password must be at least 8 characters
- Name must be at least 2 characters

---

### 2. Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Cases:**
- Invalid email or password: `400 Bad Request`
- Google OAuth user trying to login manually: `400 Bad Request` with message "This account uses Google Sign-In"

---

## Google OAuth Authentication

### 3. Google Sign In
**Endpoint:** `POST /auth/google`

**Request Body:**
```json
{
  "token": "google_oauth_token_here"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "John Doe"
  }
}
```

**How it works:**
1. Frontend gets Google OAuth token from Google
2. Send token to this endpoint
3. Backend verifies token with Google
4. Creates user if doesn't exist
5. Returns JWT token

---

## Using the JWT Token

After login/signup, use the `access_token` in subsequent requests:

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Protected Endpoints:**
- `POST /saved/save-recipe`
- `GET /saved/recipes`
- `DELETE /saved/recipes/{id}`

---

## Security Features

✅ **Password Hashing:** Passwords are hashed using bcrypt
✅ **JWT Tokens:** Secure token-based authentication
✅ **Token Expiration:** Tokens expire after 30 minutes
✅ **Email Validation:** Proper email format validation
✅ **Password Requirements:** Minimum 8 characters
✅ **Duplicate Prevention:** Cannot register with existing email
✅ **Account Type Detection:** Prevents manual login for Google OAuth users

---

## Testing with cURL

### Sign Up
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Access Protected Route
```bash
curl -X GET http://localhost:8000/saved/recipes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

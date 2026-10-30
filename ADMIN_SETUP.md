# Admin User Setup Guide

## How to Create an Admin User

There are **3 ways** to create an admin user:

### Method 1: Using the Script (Recommended) ⭐

This is the easiest method. Run this command in your terminal:

```bash
npm run create-admin
```

This will create an admin with default credentials:

- **Email:** `admin@kickit.com`
- **Username:** `admin`
- **Password:** `admin123`

**Custom credentials:**

```bash
npm run create-admin <email> <username> <password> <firstName> <lastName>
```

Example:

```bash
npm run create-admin admin@example.com myadmin securepass123 John Admin
```

### Method 2: Using the Web Interface

1. Make sure your backend server is running (`npm run server`)
2. Navigate to: `http://localhost:5173/create-admin`
3. Fill in the form and submit
4. **Note:** This only works if no admin user exists yet

### Method 3: Using the API Endpoint

If no admin exists, you can create one via API:

```bash
POST http://localhost:5000/api/admin/create-admin
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@kickit.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User"
}
```

Using cURL:

```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@kickit.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

## How to Login as Admin

1. Make sure both frontend and backend are running:

   - Backend: `npm run server` (runs on port 5000)
   - Frontend: `npm run dev` (runs on port 5173)

2. Navigate to: `http://localhost:5173/login`

3. Enter your admin credentials:

   - **Email:** The email you used when creating the admin
   - **Password:** The password you set

4. After successful login, you'll see a "Dashboard" button in the navbar that takes you to `/admin`

## Important Notes

- ⚠️ **Only one admin can be created via the API/web interface** - this is a security feature
- ✅ **Existing admins can create other admins** through the admin dashboard (user management)
- 🔒 **Change your default password** after first login for security
- 📝 The script method works even if admins already exist (it will just show existing admin info)

## Troubleshooting

**"Admin user already exists" error:**

- An admin user already exists in the database
- Use the script method to see existing admin credentials
- Or login with existing admin and create new admins through the dashboard

**"Cannot connect to server" error:**

- Make sure MongoDB is running
- Make sure the backend server is running (`npm run server`)
- Check your `.env` file has the correct `MONGODB_URI`

**"Failed to fetch" error:**

- Backend server is not running
- Check that the server is running on port 5000
- Verify the API URL in your frontend `.env` file (if using custom URL)

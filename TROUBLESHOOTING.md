# Troubleshooting Guide

## "Failed to fetch" Error

If you're getting a "Failed to fetch" error when registering a team, follow these steps:

### 1. Check if Backend Server is Running

The backend server must be running for the frontend to work. To start it:

```bash
# In the project root directory
npm run server
```

Or for development with auto-reload:

```bash
npm run server:dev
```

You should see:

```
Server is running on port 5000
MongoDB Connected: ...
```

### 2. Check MongoDB Connection

Make sure MongoDB is running. The server needs to connect to MongoDB to save data.

**For local MongoDB:**

- Make sure MongoDB is installed and running
- Default connection: `mongodb://localhost:27017/kick_it_db`

**For MongoDB Atlas:**

- Update your `.env` file with your Atlas connection string:
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kick_it_db
  ```

### 3. Check Environment Variables

Make sure you have a `.env` file in the root directory with:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/kick_it_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 4. Check Browser Console

Open your browser's developer console (F12) and check:

- Network tab: See if the request is being sent and what error it's getting
- Console tab: Look for any JavaScript errors

### 5. Verify API URL

The frontend defaults to `http://localhost:5000/api`. If your backend is on a different port or URL, create a `.env` file in the root with:

```env
VITE_API_URL=http://your-backend-url:port/api
```

### 6. Common Issues

**CORS Errors:**

- The backend should have CORS enabled (it does by default)
- If you see CORS errors, check that `app.use(cors())` is in `server/index.js`

**Port Already in Use:**

- If port 5000 is already in use, change the PORT in your `.env` file
- Make sure to update `VITE_API_URL` in the frontend `.env` if you change the port

**MongoDB Connection Failed:**

- Check that MongoDB is running
- Verify the connection string in `.env`
- Check MongoDB logs for errors

### 7. Testing the Connection

You can test if the server is running by visiting:

- `http://localhost:5000/api/health`

You should see:

```json
{ "status": "OK", "message": "Server is running" }
```

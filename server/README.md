# Backend API Documentation

## Overview

Node.js/Express/MongoDB backend with JWT authentication and Role-Based Access Control (RBAC).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/kick_it_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

3. Make sure MongoDB is running on your system.

4. Start the server:
   how can i login

```bash
npm run server
```

For development with auto-reload:

```bash
npm run server:dev
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User

- **POST** `/api/auth/register`
- **Access**: Public
- **Body**:

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "player" // optional, defaults to "player"
}
```

- **Response**: Returns JWT token and user object

#### Login

- **POST** `/api/auth/login`
- **Access**: Public
- **Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

- **Response**: Returns JWT token and user object

#### Get Current User

- **GET** `/api/auth/me`
- **Access**: Private (requires authentication)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Returns current user information

### User Routes (`/api/users`)

#### Get All Users

- **GET** `/api/users`
- **Access**: Admin only
- **Headers**: `Authorization: Bearer <token>`

#### Get User by ID

- **GET** `/api/users/:id`
- **Access**: Private (users can access their own profile, admins can access any)
- **Headers**: `Authorization: Bearer <token>`

#### Update User

- **PUT** `/api/users/:id`
- **Access**: Private (users can update their own profile, admins can update any)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Any user fields to update (role changes require admin)

#### Delete User

- **DELETE** `/api/users/:id`
- **Access**: Admin only
- **Headers**: `Authorization: Bearer <token>`

#### Get Users by Role

- **GET** `/api/users/role/:role`
- **Access**: Admin, Team Leader
- **Headers**: `Authorization: Bearer <token>`
- **Params**: `role` can be `player`, `admin`, or `team_leader`

## Roles

- **player**: Default role for regular users
- **team_leader**: Can view users by role
- **admin**: Full access to all endpoints and user management

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

Error responses follow this format:

```json
{
  "message": "Error message here"
}
```

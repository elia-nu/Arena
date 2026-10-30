# How to Start MongoDB on Windows

## Option 1: Start MongoDB Service (Recommended)

1. **Open PowerShell as Administrator:**
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Start MongoDB service:**
   ```powershell
   net start MongoDB
   ```

3. **Verify it's running:**
   ```powershell
   Get-Service MongoDB
   ```
   You should see `Status: Running`

## Option 2: Start MongoDB Manually

If the service doesn't work, you can start MongoDB manually:

1. **Find your MongoDB installation:**
   - Usually at: `C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe`
   - Or check: `C:\Program Files (x86)\MongoDB\Server\<version>\bin\mongod.exe`

2. **Create data directory (if it doesn't exist):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "C:\data\db"
   ```

3. **Start MongoDB:**
   ```powershell
   & "C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe" --dbpath "C:\data\db"
   ```
   Replace `<version>` with your actual MongoDB version (e.g., `7.0`, `6.0`, etc.)

## Option 3: Use MongoDB Atlas (Cloud - No Installation Needed)

If you prefer not to run MongoDB locally:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster
4. Get your connection string
5. Update your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kick_it_db
   ```

## After Starting MongoDB

Once MongoDB is running, restart your server:
```powershell
cd C:\Users\envy\Documents\GenShifter\LetsKickIt\kick_it\server
npm run server
```

You should now see:
```
✅ MongoDB Connected: localhost
```


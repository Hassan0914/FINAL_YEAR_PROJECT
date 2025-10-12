# Authentication Setup Guide

This project uses **NextAuth.js** with **PostgreSQL** database through **Prisma** and **JWT** tokens for authentication.

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fyp_database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-jwt-key-change-this-in-production"

# JWT Secret (same as NextAuth secret for consistency)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Database Setup

1. **Start PostgreSQL** and create a database named `fyp_database`
2. **Run Prisma migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```
3. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

### 4. Start Development Server

```bash
npm run dev
# or
pnpm dev
```

## 🔐 Authentication Features

### ✅ What's Implemented

- **User Registration** with email, password, and optional name
- **User Login** with email and password
- **JWT Token Management** with 30-day expiration
- **Password Hashing** using bcryptjs
- **Protected Routes** via middleware
- **Session Management** with NextAuth.js
- **Database Integration** with Prisma and PostgreSQL

### 🛡️ Security Features

- **Password Validation**: Minimum 6 characters
- **Email Validation**: Proper email format checking
- **Password Hashing**: bcryptjs with salt rounds of 12
- **JWT Tokens**: Secure token-based authentication
- **Protected Routes**: Automatic redirects for unauthorized access
- **CSRF Protection**: Built-in NextAuth.js protection

## 📁 File Structure

```
├── app/
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts    # NextAuth handler
│   │   ├── login/route.ts            # Direct JWT login API
│   │   └── signup/route.ts           # User registration API
│   ├── auth/
│   │   ├── login/page.tsx            # Login page
│   │   └── signup/page.tsx           # Signup page
│   └── dashboard/page.tsx            # Protected dashboard
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   ├── db.ts                         # Prisma client
│   └── jwt.ts                        # JWT utilities
├── hooks/
│   └── use-auth.tsx                  # Authentication hook
├── middleware.ts                     # Route protection
├── prisma/
│   └── schema.prisma                 # Database schema
└── types/
    └── next-auth.d.ts               # TypeScript definitions
```

## 🔧 API Endpoints

### Authentication Routes

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - Direct JWT login
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handler

### Protected Routes

- `/dashboard/*` - Requires authentication
- `/analysis/*` - Requires authentication

## 🎯 Usage Examples

### Using the Authentication Hook

```tsx
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, isAuthenticated, login, signup, logout } = useAuth()

  if (isAuthenticated) {
    return <div>Welcome, {user?.name || user?.email}!</div>
  }

  return <div>Please log in</div>
}
```

### Direct API Usage

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})

// Signup
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name })
})
```

## 🚨 Important Notes

1. **Change the JWT secret** in production to a secure random string
2. **Use HTTPS** in production for secure token transmission
3. **Database credentials** should be properly secured
4. **Environment variables** should never be committed to version control

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **JWT Secret Error**
   - Ensure NEXTAUTH_SECRET is set
   - Use a strong, random secret

3. **Authentication Not Working**
   - Check middleware configuration
   - Verify route protection settings
   - Check browser console for errors

## 🔄 Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

## 📝 Next Steps

1. **Customize** the authentication flow as needed
2. **Add** additional user fields to the schema
3. **Implement** password reset functionality
4. **Add** email verification
5. **Enhance** security with rate limiting

---

**Authentication is now fully implemented and ready to use!** 🎉



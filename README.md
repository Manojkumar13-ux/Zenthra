# Zenthra – AI Powered Social Networking Platform

Zenthra is a modern social platform with real-time messaging, AI content generation, community features, and advanced analytics.

# Zenthra - Social Media Platform

A modern, feature-rich social media platform built with Next.js 14, MongoDB, and NextAuth.js.

## 🌟 Features

### Core Features
- ✅ **User Authentication** - Google OAuth and Email/Password login
- ✅ **Post Creation** - Create posts with text, images, videos, and audio
- ✅ **Hashtag System** - Automatic hashtag detection and categorization
- ✅ **Trending Hashtags** - Real-time trending hashtags with post counts
- ✅ **Comment System** - Nested comments with likes
- ✅ **Like & Share** - Like and share posts with friends
- ✅ **Follow System** - Follow/Unfollow users and communities
- ✅ **Notifications** - Real-time notifications for likes, comments, follows
- ✅ **Messaging** - Direct messaging with read receipts
- ✅ **Profile Management** - Custom profile with cover photo and avatar
- ✅ **Dark Mode** - Toggle between light and dark themes
- ✅ **Responsive Design** - Works on all devices
 
### User Features
- 📝 Create, edit, delete posts
- 🏷️ Hashtag categorization (#movie, #music, #tech, etc.)
- 👥 Follow users and communities
- 💬 Comment and engage with posts
- ❤️ Like and bookmark posts
- 📨 Direct messaging
- 🔔 Real-time notifications
- 🎨 Customize profile with avatar and cover photo
- 🌓 Dark/Light mode toggle

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: MongoDB (Atlas)
- **Authentication**: NextAuth.js (Google OAuth, Credentials)
- **Real-time**: Socket.io
- **File Upload**: Cloudinary
- **Deployment**: Vercel
- **State Management**: Zustand, React Query

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console account (for OAuth)
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Manojkumar13-ux/Zenthra.git
cd Zenthra
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create `.env.local` file:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/zenthra
MONGODB_DB=zenthra

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod --dbpath ~/data/db

# Or use MongoDB Atlas (cloud)
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open the application**
Visit `http://localhost:3000`

## 📁 Project Structure

```
zenthra/
├── app/
│   ├── (main)/
│   │   ├── feed/           # Main feed page
│   │   ├── explore/        # Explore page with hashtags
│   │   ├── profile/        # User profile
│   │   ├── messages/       # Direct messages
│   │   ├── notifications/  # Notifications
│   │   └── communities/    # Communities
│   ├── api/
│   │   ├── auth/          # Authentication routes
│   │   ├── posts/         # Post CRUD
│   │   ├── users/         # User operations
│   │   ├── comments/      # Comments
│   │   ├── messages/      # Messages
│   │   ├── notifications/ # Notifications
│   │   └── hashtags/      # Hashtag operations
│   ├── admin/             # Admin dashboard
│   ├── login/             # Login page
│   └── register/          # Registration page
├── components/
│   ├── shared/            # Shared components
│   │   ├── Navbar.tsx     # Navigation bar
│   │   ├── Sidebar.tsx    # Sidebar
│   │   └── RightSidebar.tsx # Right sidebar
│   └── ui/                # UI components
├── lib/
│   ├── mongodb.ts         # MongoDB connection
│   └── auth.ts            # NextAuth configuration
├── models/                # Database models
├── styles/                # Global styles
├── public/                # Static assets
├── .env.local            # Environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```



3. **Environment Variables on Vercel**
```
MONGODB_URI=your-mongodb-atlas-uri
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### MongoDB Atlas Setup
1. Create cluster on MongoDB Atlas
2. Add IP `0.0.0.0/0` to whitelist
3. Create database user with read/write permissions
4. Get connection string

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start development server
npm run dev:next         # Start Next.js dev server

# Build
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run seed             # Seed database with sample data
npm run db:reset         # Reset database

# Linting
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking

# Cleanup
npm run clean            # Remove .next folder
npm run clean:win        # Remove .next folder (Windows)
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/[id]` - Get single post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post

### Users
- `GET /api/users/[id]` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/[id]/follow` - Follow user
- `DELETE /api/users/[id]/follow` - Unfollow user

### Comments
- `GET /api/posts/[id]/comments` - Get post comments
- `POST /api/posts/[id]/comments` - Add comment

### Hashtags
- `GET /api/hashtags/trending` - Get trending hashtags

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js Team for the amazing framework
- Vercel for hosting
- MongoDB for database
- All contributors

## 📞 Support

For support, email okmanoj110@gmail.com or open an issue on GitHub.

---
**Made with ❤️ by Manoj Kumar**

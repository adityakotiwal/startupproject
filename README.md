# GymSync Pro - Frontend

A modern, responsive frontend for the GymSync Pro gym management SaaS application built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Authentication System**: Secure login and signup with Supabase Auth
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI**: Clean, professional interface built with Tailwind CSS
- **Type Safety**: Full TypeScript support for better development experience
- **Real-time Updates**: Integrated with Supabase for real-time data synchronization

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (supabase-js library)
- **State Management**: React Context + Hooks
- **Icons**: Lucide React
- **Charts**: Recharts library (for future dashboard analytics)

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase project with the gym management database schema set up
- Supabase project URL and anon key

## ⚙️ Installation & Setup

1. **Clone and navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── signup/        # Signup page
│   ├── dashboard/         # Protected dashboard area
│   ├── layout.tsx         # Root layout with AuthProvider
│   └── page.tsx           # Home page (redirects based on auth)
├── components/            # Reusable React components
│   ├── ui/                # Basic UI components
│   └── ProtectedRoute.tsx # Route protection component
├── contexts/              # React context providers
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utilities and configurations
│   └── supabaseClient.ts  # Supabase client configuration
└── types/                 # TypeScript type definitions
    ├── index.ts           # Application types
    └── supabase.ts        # Database schema types
```

## 🔐 Authentication Flow

The authentication system uses Supabase Auth with the following flow:

1. Users can sign up with email/password
2. Email verification is required for new accounts
3. Authenticated users are redirected to the dashboard
4. Unauthenticated users are redirected to the login page
5. Authentication state is managed globally with React Context

## 🎨 UI Components

The application includes a set of reusable UI components built with Tailwind CSS:

- **Button**: Multiple variants (default, outline, ghost, etc.)
- **Input**: Form input with consistent styling
- **Card**: Container component for content sections
- **Label**: Form labels with proper accessibility

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1024px+)
- Tablets (768px - 1023px)
- Mobile phones (320px - 767px)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

The application can be deployed to any platform that supports Next.js:

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- Netlify
- AWS Amplify
- Railway
- Digital Ocean App Platform

## 🤝 Phase 1 Completion

Phase 1 of the development includes:

✅ **Project Setup**: Next.js with TypeScript and Tailwind CSS  
✅ **Supabase Integration**: Client configuration and connection  
✅ **Authentication System**: Login and signup pages with validation  
✅ **Global State Management**: AuthContext for user session management  
✅ **Route Protection**: Middleware and client-side protection  
✅ **Basic Dashboard**: Welcome dashboard with placeholder content  
✅ **Responsive Design**: Mobile-friendly interface  

## 📋 Next Steps (Phase 2)

The next phase will include:
- Complete dashboard layout with sidebar navigation
- KPI calculations and display
- Member management system
- Staff management
- Financial tracking
- Settings and customization

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Make sure all dependencies are installed with `npm install`

2. **Supabase connection errors**: Verify your environment variables in `.env.local`

3. **Build errors**: Check that all TypeScript types are properly defined

4. **Authentication not working**: Ensure your Supabase project has the correct RLS policies

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

This project is part of the GymSync Pro application suite.
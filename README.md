# Our Wedding — RSVP

A beautiful, mobile-first wedding RSVP website built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- 🎨 Beautiful, responsive design with mobile-first approach
- 📝 RSVP form with validation and spam prevention
- 📧 Email notifications for new RSVPs
- 📅 Calendar integration (.ics download + Google Calendar)
- ♿ Fully accessible with ARIA labels and keyboard navigation
- 🔒 Secure with rate limiting and duplicate detection
- 📊 Admin panel for managing RSVPs (local development only)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works fine)
- SendGrid account for email notifications (optional but recommended)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up Supabase:
   - Create a new project at https://supabase.com
   - Go to the SQL Editor and run the schema from `content/supabase-schema.sql`
   - Copy your project URL and API keys

3. Configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

SENDGRID_API_KEY=your_sendgrid_api_key
NOTIFICATION_EMAIL=your@email.com

PAWGRAMMER_SESSION_ID=your_session_id
```

4. Start the development server:

```bash
npm run dev
```

Visit http://localhost:3000 to see your wedding site!

### Editing Content

All wedding content can be edited in `content/site.json`:

- Couple names, wedding date, venue
- Schedule and details
- FAQ questions and answers
- Contact information
- Form labels

Images can be added to the `public/images/` folder and referenced in the JSON.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

Vercel will automatically redeploy whenever you push to your main branch.

### Environment Variables for Production

Make sure to add all environment variables from `.env.local` to your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENDGRID_API_KEY`
- `NOTIFICATION_EMAIL`

## Admin Panel (Development Only)

The admin panel is only available in development mode for security:

- Visit http://localhost:3000/admin
- View all RSVP responses
- Search and filter responses
- Export to CSV
- Edit site content visually

The admin route returns 404 in production builds.

## Project Structure

```
wedding-rsvp/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin panel (dev only)
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main page
│   ├── components/       # React components
│   │   ├── ui/           # UI components (Button, Input, etc.)
│   │   ├── Hero.tsx
│   │   ├── Details.tsx
│   │   ├── FAQ.tsx
│   │   ├── Contact.tsx
│   │   └── RSVPForm.tsx
│   └── lib/              # Utility functions
│       ├── utils.ts
│       ├── ics-generator.ts
│       └── supabase.ts
├── content/              # Editable content
│   ├── site.json
│   └── supabase-schema.sql
├── public/               # Static assets
│   └── images/
└── scripts/              # Build and seed scripts
```

## Testing

The site includes:

- Client-side form validation
- Server-side validation and sanitization
- Rate limiting (5 submissions per hour per IP)
- Duplicate detection (same email within 24 hours)
- Honeypot spam prevention
- Error handling with retry capability

## License

This project is for personal use. Feel free to customize it for your own wedding!

## Support

For questions or issues, please create an issue in the repository.

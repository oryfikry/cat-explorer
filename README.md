# Cat Explorer

A web application that allows users to discover and document stray cats around the world. Users can add cat sightings, view cats on a map, and explore cats in their vicinity.

## Features

- **Location-based cat exploration**: Find stray cats near you
- **Interactive map**: View cats on a map and get directions
- **Google authentication**: Secure sign-in using Google account
- **Add cat sightings**: Share stray cats you encounter with location tagging
- **Responsive design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js with Google provider
- **Maps**: Leaflet for interactive maps

## Getting Started

### Prerequisites

- Node.js 18 or later
- MongoDB database (local or Atlas)
- Google OAuth credentials

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cat-explorer.git
cd cat-explorer
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file based on the `.env.local.example` file and fill in your configuration values:

```bash
cp .env.local.example .env.local
```

4. Set up your MongoDB database and get your connection string

5. Configure Google OAuth:
   - Go to the [Google Developer Console](https://console.developers.google.com/)
   - Create a new project
   - Set up OAuth credentials
   - Add the credentials to your `.env.local` file

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/src/app`: Page components and API routes
- `/src/components`: Reusable UI components
- `/src/lib`: Utility functions and configuration
- `/src/models`: MongoDB models
- `/src/providers`: Context providers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

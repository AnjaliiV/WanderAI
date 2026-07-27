# 🌍 AI Trip Planner

An intelligent, full-stack travel itinerary generator that uses the power of Google's Gemini AI to plan your perfect trips. Designed with a beautiful, responsive, and dynamic user interface featuring both light and dark themes.

## ✨ Features

- **🤖 AI-Powered Itineraries:** Generate detailed, personalized trip plans instantly using Google's Gemini AI.
- **🎨 Modern UI/UX:** Built with a stunning, premium aesthetic featuring glassmorphism, micro-animations, and vibrant color palettes.
- **🌗 Theme Support:** Seamless dark and light mode toggle that respects system preferences.
- **🔒 Secure Authentication:** User sign-up, sign-in, and Google authentication powered by Firebase Auth.
- **💾 Cloud Storage:** Save your generated itineraries and view them later, safely stored in Firebase Firestore.
- **📱 Responsive Design:** Works perfectly on desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

- **Frontend:** HTML5, Vanilla CSS3 (Custom Variables, Flexbox, Grid), Vanilla JavaScript (No heavy frameworks!).
- **Backend:** Node.js, Express.js.
- **Database:** Firebase Firestore (NoSQL).
- **Authentication:** Firebase Authentication (Client & Admin SDK).
- **AI Integration:** Google Gemini API.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- A [Firebase Project](https://firebase.google.com/) (with Firestore and Auth enabled)
- A [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ai-trip-planner.git
   cd ai-trip-planner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   NODE_ENV=development
   PORT=3000

   # Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here

   # Firebase Client Config
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   ```

4. **Add Firebase Admin Credentials:**
   Download your Firebase Service Account JSON file and place it in the root directory as `firebase-service-account.json`.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

## 📂 Project Structure

```text
├── public/                 # Frontend assets (HTML, CSS, JS, Images)
│   ├── css/                # Stylesheets (global.css, planner.css, etc.)
│   ├── js/                 # Client-side scripts (api.js, auth-guard.js, theme.js)
│   └── index.html          # Authentication / Landing page
├── server/                 # Backend source code
│   ├── controllers/        # Route controllers
│   ├── db/                 # Database connection (Firestore)
│   ├── routes/             # Express API routes
│   └── services/           # Business logic & 3rd party APIs (Gemini)
├── .env                    # Environment variables (not tracked)
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

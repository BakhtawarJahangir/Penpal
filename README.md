# PenPal Connect

PenPal Connect is a full-stack academic web application developed as a university team project. It allows users to create profiles, get matched with penpals, and exchange digital letters through a secure and interactive platform. The project aims to connect people worldwide through thoughtful digital letters, encouraging meaningful communication and cultural exchange between randomly matched penpals.

## Features

- User registration and secure login
- User profile creation and customization
- Random penpal matching system
- Send, receive, and reply to digital letters
- Attach stickers to letters
- Share music playlists with penpals
- Responsive user interface built with Bootstrap
- SQL Server database integration
- RESTful API-based communication

## Technologies Used

### Frontend
- HTML5
- CSS3
- Bootstrap 5
- JavaScript

### Backend
- Node.js
- Express.js
- RESTful APIs

### Database
- SQL Server

### Tools
- GitHub
- Visual Studio Code
- SQL Server Management Studio (SSMS)

### Other
- Express Session
- bcrypt (Password Hashing)

## Screenshots

### Login Page
![Login](Screenshots/login.png)

### Sign Up Page
![Sign Up](Screenshots/signup.png)

### Dashboard
![Dashboard](Screenshots/dashboard.png)

### Match Penpal
![Match](Screenshots/match.png)

### Write Letter
![Write Letter](Screenshots/write-letter.png)

### Letter Received
![Letter Received](Screenshots/letter-received.png)

### Read Letter
![Read Letter](Screenshots/read-letter.png)

## Quick Start

```bash
npm install
npm start
# → http://localhost:3000
```

Two test accounts are seeded automatically (bcrypt hashing takes ~1 second on startup):

| Name | Email | Password |
|------|-------|----------|
| Alice | alice@test.com | password123 |
| Bob | bob@test.com | password123 |

## Project Structure

```text
server.js
api.js
data/
  users.js
  matches.js
  letters.js
Penpal.html
Login.html
Info.html
Match.html
Dashboard.html
Read.html
Write.html
bootstrap-5.3.8-dist/
Stickers/
```

## Application Workflow

1. User registers or logs into the application.
2. User completes their profile.
3. The system matches the user with a random penpal.
4. Users can compose and send digital letters.
5. Recipients receive and read letters from their inbox.
6. Users can continue conversations by exchanging digital letters.

## Database

The application uses SQL Server to store user accounts, user profiles, penpal matches, digital letters, and music playlist information.

## Backend

The backend is developed using Node.js and Express.js. It handles user authentication, session management, RESTful API endpoints, penpal matching, digital letter exchange, and communication with the SQL Server database.

## Frontend

The frontend is built using HTML5, CSS3, Bootstrap, and JavaScript. It provides responsive pages for user authentication, profile management, penpal matching, and letter exchange.

## Future Improvements

- Interest-based penpal matching
- Built-in language translation for international users
- Notification system for new letters and replies
- More letter themes, stickers, and personalization options
- User profile editing and account management
- Cloud deployment using Azure or Render

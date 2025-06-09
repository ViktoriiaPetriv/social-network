# Social Network

This project is a simplified social network backend built using a microservice architecture. It includes three main services:

* **auth-service** – authentication and user registration with Google OAuth2 and JWT token generation
* **chat-service** – real-time chat using WebSockets
* **user-service** – basic internal user management (e.g., storing and retrieving user data)

The frontend is implemented using Angular and located in the **jwt-auth-app** directory.

## 1. Clone the project
```
git clone https://github.com/ViktoriiaPetriv/social-network.git
cd social-network
```

## 2. Create `.env` file
*You need to create a `.env` file in the root of the project directory with the following environment variables:*
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret-key
```

## 3. Build and Start All Services
```
docker-compose up --build
```
Docker will:
- Build and start:
  - **auth-service** on port **8080**
  - **user-service** on port **8081**
  - **chat-service** on port **8082**
  - frontend (**Angular app**) on port **4200**

- Start PostgreSQL databases for user-service and chat-service

## 4 . Access the Application
Once all services are running, you can open the frontend in your browser:

👉 http://localhost:4200

You'll be redirected to Google Login (OAuth2)

After logging in, the backend:
- Checks or creates the user via user-service
- Issues a signed JWT token
- Enables chat via WebSocket connection

## 5. Stop the project
To shut down all services:
```
docker-compose down
```

To also remove volumes (database data):
```
docker-compose down -v
```


# 👩‍💻 Author
**Viktoriia Petriv**

GitHub: [@ViktoriiaPetriv](https://github.com/ViktoriiaPetriv)

# Rule Engine Application

This project implements a simple 3-tier rule engine application with a backend API that creates, combines, and evaluates rules represented as Abstract Syntax Trees (ASTs).

## Design Choices

1. **Abstract Syntax Tree (AST)**: Rules are represented as ASTs to allow for complex rule structures and efficient evaluation.
2. **MongoDB**: Chosen as the database for storing rules due to its flexibility with JSON-like documents, which aligns well with our AST structure.
3. **Express.js**: Used as the web framework for creating our API endpoints due to its simplicity and wide adoption in the Node.js ecosystem.
4. **Node.js**: Selected as the runtime environment for its event-driven, non-blocking I/O model, which is well-suited for building scalable network applications.

## Dependencies

To run this application, you'll need:

- Node.js (v14 or later)
- npm (usually comes with Node.js)
- MongoDB (v4.4 or later)

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/your-username/rule-engine-app.git
   cd rule-engine-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/rule_engine
   ```

4. Start MongoDB:
   If you're using a local MongoDB installation, start it according to your operating system's instructions.

5. Start the application:
   ```
   npm start
   ```

   For development with auto-restart on file changes:
   ```
   npm run dev
   ```

The server should now be running on `http://localhost:5000`.

## API Endpoints

1. Create Rule:
   - POST `/api/rules/create`
   - Body: `{ "ruleString": "(age > 30 AND department = 'Sales') OR (salary > 50000)" }`

2. Combine Rules:
   - POST `/api/rules/combine`
   - Body: `{ "rules": ["ruleId1", "ruleId2"], "operator": "AND" }`

3. Evaluate Rule:
   - POST `/api/rules/evaluate`
   - Body: `{ "ruleId": "someRuleId", "data": { "age": 35, "department": "Sales", "salary": 60000 } }`

## Running with Docker

If you prefer to use Docker, follow these steps:

1. Make sure Docker and Docker Compose are installed on your system.

2. Create a `Dockerfile` in the root of your project:
   ```dockerfile
   FROM node:14
   WORKDIR /usr/src/app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

3. Create a `docker-compose.yml` file:
   ```yaml
   version: '3'
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - MONGODB_URI=mongodb://mongo:27017/rule_engine
       depends_on:
         - mongo
     mongo:
       image: mongo:4.4
       ports:
         - "27017:27017"
   ```

4. Build and run the Docker containers:
   ```
   docker-compose up --build
   ```

The application should now be running in Docker containers.

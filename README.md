# Rule Engine Application

This project implements a simple 3-tier rule engine application with a backend API that creates, combines, and evaluates rules represented as Abstract Syntax Trees (ASTs).

## Table of Contents
- [Design Choices](#design-choices)
- [Dependencies](#dependencies)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Running with Docker](#running-with-docker)
- [API Usage Examples](#api-usage-examples)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Design Choices

1. **Abstract Syntax Tree (AST)**: Rules are represented as ASTs to allow for complex rule structures and efficient evaluation.
2. **MongoDB**: Chosen as the database for storing rules due to its flexibility with JSON-like documents, which aligns well with our AST structure.
3. **Express.js**: Used as the web framework for creating our API endpoints due to its simplicity and wide adoption in the Node.js ecosystem.
4. **Node.js**: Selected as the runtime environment for its event-driven, non-blocking I/O model, which is well-suited for building scalable network applications.
5. **Rule Combination**: Rules can be combined using AND/OR operators, creating new rules without modifying existing ones.

## Dependencies

To run this application, you'll need:

- Node.js (v14 or later)
- npm (usually comes with Node.js)
- MongoDB (v4.4 or later)

Main npm packages:
- express
- mongoose
- dotenv
- swagger-ui-express (for API documentation)

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

1. Get All Rules:
   - GET `/api/rules`

2. Create Rule:
   - POST `/api/rules/create`
   - Body: `{ "ruleString": "(age > 30 AND department = 'Sales') OR (salary > 50000)" }`

3. Combine Rules:
   - POST `/api/rules/combine`
   - Body: `{ "rules": ["ruleId1", "ruleId2"], "operator": "AND" }`

4. Evaluate Rule:
   - POST `/api/rules/evaluate/:ruleId`
   - Body: `{ "data": { "age": 35, "department": "Sales", "salary": 60000 } }`

For detailed API documentation, visit `/api-docs` when the server is running.

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

## API Usage Examples

### Create a Rule
```bash
curl -X POST http://localhost:5000/api/rules/create \
  -H "Content-Type: application/json" \
  -d '{"ruleString": "(age > 30 AND department = \"Sales\") OR (salary > 50000)"}'
```

### Combine Rules
```bash
curl -X POST http://localhost:5000/api/rules/combine \
  -H "Content-Type: application/json" \
  -d '{"rules": ["ruleId1", "ruleId2"], "operator": "AND"}'
```

### Evaluate Rule
```bash
curl -X POST http://localhost:5000/api/rules/evaluate/ruleId \
  -H "Content-Type: application/json" \
  -d '{"data": {"age": 35, "department": "Sales", "salary": 60000}}'
```

## Testing

To run the test suite:

```
npm test
```

This will run all unit and integration tests using Jest.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

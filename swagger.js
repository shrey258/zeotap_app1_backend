const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rule Engine API',
      version: '1.0.0',
      description: 'A simple rule engine API for creating, combining, and evaluating rules',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Rules',
        description: 'API endpoints for managing rules',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API routes folder
};

const specs = swaggerJsdoc(options);
module.exports = specs;

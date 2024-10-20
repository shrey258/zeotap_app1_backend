const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.use(express.json());

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Import routes
const ruleRoutes = require('./routes/ruleRoutes');
app.use('/api/rules', ruleRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.use(errorHandler);

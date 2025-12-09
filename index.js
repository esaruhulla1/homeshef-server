require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT

// ✅ Middleware
app.use(cors());
app.use(express.json());






// ✅ Default route
app.get('/', (req, res) => {
    res.send('Hello from Node + Express server!');
});

// ✅ Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

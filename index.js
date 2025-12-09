require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT

// ✅ Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4u6lkgk.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const db = client.db(process.env.DB_NAME);
        const usersCollection = db.collection('users');

        // ✅user releted Apis here

        // CREATE user
        app.post('/users', async (req, res) => {
            try {
                const newUser = req.body;
                const result = await usersCollection.insertOne(newUser);
                res.status(201).json(result);
            } catch (err) {
                res.status(500).json({ message: 'Failed to create user', error: err });
            }
        });

        // READ ALL users
        app.get('/users', async (req, res) => {
            try {
                const users = await usersCollection.find().toArray();
                res.json(users);
            } catch (err) {
                res.status(500).json({ message: 'Failed to fetch users', error: err });
            }
        });

        // READ ONE users
        app.get('users/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const user = await usersCollection.findOne({ _id: new ObjectId(id) });
                if (!user) return res.status(404).json({ message: 'User not found' });
                res.json(user);
            } catch (err) {
                res.status(500).json({ message: 'Error finding user', error: err });
            }
        });




    }
    finally {

    }
}

run().catch(console.dir)

// ✅ Default route
app.get('/', (req, res) => {
    res.send('Hello from Node + Express server!');
});

// ✅ Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

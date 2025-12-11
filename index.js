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
        const mealsCollection = db.collection('meals');
        const reviewsCollection = db.collection('reviews');
        const favoritesCollection = db.collection('favorites');
        const orderCollection = db.collection('orders');
        const requestCollection = db.collection('request');

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


        // ✅ Meals Releted apis here
        // get 6 data
        app.get('/populer-meals', async (req, res) => {
            try {
                const meals = await mealsCollection.find().limit(6).toArray();
                res.json(meals);
            } catch (err) {
                res.status(500).json({ message: 'Failed to fetch data', error: err });
            }
        });

        // fet all meals
        app.get('/meals', async (req, res) => {
            try {
                const meals = await mealsCollection.find().toArray();
                res.json(meals);
            } catch (err) {
                res.status(500).json({ message: 'Failed to fetch data', error: err });
            }
        });

        // get one meals
        app.get('/meals/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });
                if (!meal) return res.status(404).json({ message: 'Meal not found' });
                res.json(meal);
            } catch (err) {
                res.status(500).json({ message: 'Error finding meal', error: err });
            }
        });


        // ✅ Review releted apis here

        // get review by filter
        app.get('/review/:id', async (req, res) => {
            try {
                const foodId = req.params.id;
                const reviews = await reviewsCollection.find({ foodId }).limit(10).toArray();
                if (reviews.length === 0) {
                    return res.status(404).json({ message: 'No reviews found' });
                }
                res.json(reviews);
            } catch (err) {
                res.status(500).json({ message: 'Error finding reviews', error: err });
            }
        });

        // post review
        app.post('/review', async (req, res) => {
            try {
                const newUser = req.body;
                const result = await reviewsCollection.insertOne(newUser);
                res.status(201).json(result);
            } catch (err) {
                res.status(500).json({ message: 'Failed to create data', error: err });
            }
        });


        // ✅ favorite food releted apis here

        // ADD TO FAVORITE with Duplicate Check
        app.post('/favorite', async (req, res) => {
            try {
                const { userEmail, mealId } = req.body;

                // 1️⃣ Check if already in favorites
                const alreadyExists = await favoritesCollection.findOne({ userEmail, mealId });

                if (alreadyExists) {
                    return res.status(409).json({ message: "Meal already in favorites" });
                }

                // 2️⃣ Insert new favorite
                const result = await favoritesCollection.insertOne(req.body);
                res.status(201).json({
                    message: "Added to favorites successfully",
                    insertedId: result.insertedId
                });

            } catch (err) {
                res.status(500).json({ message: 'Failed to add favorite', error: err });
            }
        });


        //✅ Orders releted apis here
        app.post('/orders', async (req, res) => {
            try {
                const newUser = req.body;
                const result = await orderCollection.insertOne(newUser);
                res.status(201).json(result);
            } catch (err) {
                res.status(500).json({ message: 'Failed to create data', error: err });
            }
        });


        //✅ Request releted apis here
        app.post('/request', async (req, res) => {
            try {
                const newUser = req.body;
                const result = await requestCollection.insertOne(newUser);
                res.status(201).json(result);
            } catch (err) {
                res.status(500).json({ message: 'Failed to create data', error: err });
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

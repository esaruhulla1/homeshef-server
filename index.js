require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT
const stripe = require('stripe')(process.env.STRIPE_SECRET);

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
        const paymentCollection = db.collection("payments");


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

        // GET user by email
        app.get('/users/email/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const user = await usersCollection.findOne({ email });
                if (!user) return res.status(404).json({ message: 'User not found' });
                res.json(user);
            } catch (err) {
                res.status(500).json({ message: 'Error finding user', error: err });
            }
        });

        // MAKE USER FRAUD
        app.patch('/users/fraud/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            status: "fraud"
                        }
                    }
                );

                res.json(result);
            } catch (error) {
                res.status(500).json({ message: "Failed to mark user as fraud", error });
            }
        });


        // REMOVE FRAUD (BACK TO USER)
        app.patch('/users/remove-fraud/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            status: "active",
                            role: "user"
                        }
                    }
                );

                res.json(result);
            } catch (error) {
                res.status(500).json({ message: "Failed to remove fraud", error });
            }
        });


        // ACCEPT REQUEST
        app.patch('/request/accept/:id', async (req, res) => {
            try {
                const requestId = req.params.id;
                const { userEmail, requestType } = req.body;

                // generate chefId if chef
                let updateUserDoc = {};

                if (requestType === 'chef') {
                    const chefId = `chef-${Math.floor(1000 + Math.random() * 9000)}`;
                    updateUserDoc = {
                        role: 'chef',
                        chefId
                    };
                }

                if (requestType === 'admin') {
                    updateUserDoc = { role: 'admin' };
                }

                // 1️⃣ Update user role
                await usersCollection.updateOne(
                    { email: userEmail },
                    { $set: updateUserDoc }
                );

                // 2️⃣ Update request status
                const result = await requestCollection.updateOne(
                    { _id: new ObjectId(requestId) },
                    { $set: { requestStatus: 'approved' } }
                );

                res.json(result);

            } catch (error) {
                res.status(500).json({ message: "Failed to accept request", error });
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

        // ✅ CREATE MEAL
        app.post('/meals', async (req, res) => {
            try {
                const meal = {
                    ...req.body,
                    rating: 0,
                    createdAt: new Date()
                };

                const result = await mealsCollection.insertOne(meal);
                res.status(201).json(result);

            } catch (error) {
                res.status(500).json({ message: "Failed to create meal", error });
            }
        });

        //  GET MY MEALS (by user email)
        app.get('/my-meals/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const meals = await mealsCollection.find({ userEmail: email }).toArray();
                res.json(meals);
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch meals", error });
            }
        });

        // DELETE MEAL
        app.delete('/meals/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
                res.json(result);
            } catch (error) {
                res.status(500).json({ message: "Failed to delete meal", error });
            }
        });

        //  UPDATE MEAL
        app.put('/meals/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedMeal = req.body;

                const result = await mealsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedMeal }
                );

                res.json(result);
            } catch (error) {
                res.status(500).json({ message: "Failed to update meal", error });
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

        // get review by email
        app.get('/my-reviews/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const reviews = await reviewsCollection.find({ reviewerEmail: email }).toArray();
                res.json(reviews);
            } catch (err) {
                res.status(500).json({ message: 'Failed to fetch reviews', error: err });
            }
        });

        // delete Review
        app.delete('/review/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
                res.json(result);
            } catch (err) {
                res.status(500).json({ message: 'Failed to delete review', error: err });
            }
        });

        // update review
        app.put('/review/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updated = req.body;
                const result = await reviewsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updated }
                );
                res.json(result);
            } catch (err) {
                res.status(500).json({ message: 'Failed to update review', error: err });
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


        // Get favorites by user email
        app.get('/favorites/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const favorites = await favoritesCollection.find({ userEmail: email }).toArray();
                res.json(favorites);
            } catch (err) {
                res.status(500).json({ message: 'Failed to fetch favorites', error: err });
            }
        });

        // Delete favorite by ID
        app.delete('/favorite/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
                res.json(result);
            } catch (err) {
                res.status(500).json({ message: 'Failed to delete favorite', error: err });
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

        // Get orders by user email
        app.get('/orders/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const orders = await orderCollection.find({ userEmail: email }).toArray();
                res.json(orders);
            } catch (err) {
                res.status(500).json({ message: 'Failed to fetch orders', error: err });
            }
        });

        // ======================
        //   STRIPE PAYMENT API
        // ======================

        app.post("/create-payment", async (req, res) => {
            try {
                const { orderId, price, mealName, userEmail } = req.body;

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    line_items: [
                        {
                            price_data: {
                                currency: "usd",
                                product_data: { name: mealName },
                                unit_amount: price * 100, // Convert to cents
                            },
                            quantity: 1,
                        },
                    ],
                    mode: "payment",
                    success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.SITE_DOMAIN}/dashboard/my-order`,
                    metadata: {
                        orderId,
                        userEmail
                    }
                });

                res.json({ url: session.url });

            } catch (error) {
                console.log(error);
                res.status(500).json({ message: "Stripe Error", error });
            }
        });


        // ================================
        // VERIFY PAYMENT AND UPDATE ORDER
        app.post("/payment-success", async (req, res) => {
            try {
                const { sessionId, orderId } = req.body;

                // 1) Verify payment from Stripe
                const session = await stripe.checkout.sessions.retrieve(sessionId);

                if (session.payment_status !== "paid") {
                    return res.status(400).json({ message: "Payment not verified" });
                }

                const transactionId = session.payment_intent;
                const email = session.metadata.userEmail;

                // 2) Duplicate Check (Very Important)
                const alreadyPaid = await paymentCollection.findOne({
                    orderId,
                    transactionId
                });

                if (alreadyPaid) {
                    return res.json({
                        message: "Payment already recorded",
                        paymentInfo: alreadyPaid
                    });
                }

                // 3) Save payment history (Only once)
                const paymentInfo = {
                    orderId,
                    amount: session.amount_total / 100,
                    transactionId,
                    email,
                    date: new Date()
                };

                await paymentCollection.insertOne(paymentInfo);

                // 4) Update order payment status (Only once)
                await orderCollection.updateOne(
                    { _id: new ObjectId(orderId) },
                    { $set: { paymentStatus: "paid" } }
                );

                res.json({ message: "Payment verified", paymentInfo });

            } catch (error) {
                console.log(error);
                res.status(500).json({ error });
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

        // Get request by user email
        app.get('/request/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const requests = await requestCollection.find({ userEmail: email }).toArray();
                res.json(requests);
            } catch (err) {
                res.status(500).json({ message: 'Error fetching requests', error: err });
            }
        });


        // GET ALL REQUESTS 
        app.get('/requests', async (req, res) => {
            try {
                const result = await requestCollection.find().sort({ requestTime: -1 }).toArray();
                res.json(result);
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch requests", error });
            }
        });

        // REJECT REQUEST
        app.patch('/request/reject/:id', async (req, res) => {
            try {
                const requestId = req.params.id;

                const result = await requestCollection.updateOne(
                    { _id: new ObjectId(requestId) },
                    { $set: { requestStatus: 'rejected' } }
                );

                res.json(result);

            } catch (error) {
                res.status(500).json({ message: "Failed to reject request", error });
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

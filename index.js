const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware(Authentication)-JWT(Token)
// --------------------------------------
app.post('/jwt', async (req, res) => {
	try {
		const authoriseUser = req.body;
		// console.log('authoriseUser', authoriseUser);
		const query = { email: authoriseUser.email };
		const user = usersCollection.findOne(query);
		if (user) {
			const token = jwt.sign(authoriseUser, process.env.ACCESS_TOKEN_SECRET_KEY, {
				expiresIn: '24h'
			});
			// Send token as an object form
			res.status(200).send({ accessToken: token });
		} else {
			res.status(404).send('User not found');
		}
	} catch (error) {
		res.send({
			errorDetails: error.stack
		});
	}
});

// 2. verifyToken(Wraper function)
function verifyToken(req, res, next) {
	try {
		const authBearerToken = req.headers.authorization;
		// console.log(authBearerToken);

		if (!authBearerToken) {
			return res.status(401).send({
				error: 'Unauthorise Access',
				message: 'authBearerToken not found at verifyToken function'
			});
		}
		// verifyToken
		const token = authBearerToken.split(' ')[1];
		// console.log(token);
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, function (err, decoded) {
			if (err) {
				return res.status(403).send({
					error: 'Forbidden Access',
					message: 'Error found at matching token & ACCESS_TOKEN_SECRET_KEY'
				});
			}
			req.decodedData = decoded;
			// console.log('Decoded', req.decoded);
			next();
		});
	} catch (error) {
		res.send(error.stack);
	}
}

// Payment Gateway - Stripe API
// ----------------------------
app.post('/create-payment-intent', async (req, res) => {
	try {
		const items = req.body;
		const price = items.price;
		const amount = price * 100; // Stripe amount is in cents((100 = $1)/(100paysa=1tk)) so we need to multiply by 100

		// Create a PaymentIntent with the order amount and currency
		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount,
			currency: 'usd',
			payment_method_types: ['card']
		});

		res.send({
			clientSecret: paymentIntent.client_secret
		});
	} catch (error) {
		console.log(error.stack);
	}
});

// ----------------------------
// MongoDB connection

const uri = process.env.DB_URL;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function runDB() {
	try {
		const connection = await client.connect();
		if (connection) {
			console.log('Database connected successfully');
		}
	} catch (error) {
		console.error(error.stack);
	}
}
runDB();
const database = client.db('CarBazar');
const brandsCollection = database.collection('brands');
const carsCollection = database.collection('cars');
const usersCollection = database.collection('users');
const bookingsCollection = database.collection('bookings');
const reportedItemsCollection = database.collection('reportedItems');
const paymentsCollection = database.collection('payments');
const advertisesCollection = database.collection('advertises');
// ----------------------------
app.put('/users', async (req, res) => {
	try {
		const usersData = req.body;
		console.log(usersData);
		const query = { email: usersData.email };
		const options = { upsert: true };

		const updateDoc = {
			$set: {
				email: usersData.email,
				name: usersData.name,
				accountType: usersData.accountType
			}
		};
		const result = await usersCollection.updateOne(query, updateDoc, options);
		console.log(result);

		res.send(result);
	} catch (error) {
		console.error(error.stack);
	}
});

app.get('/users', async (req, res) => {
	try {
		const sellers = { accountType: 'seller' };
		const buyers = { accountType: 'buyer' };
		const sellersData = await usersCollection.find(sellers).toArray();
		const buyersData = await usersCollection.find(buyers).toArray();
		res.send({ sellersData, buyersData });
	} catch (error) {
		console.error(error.stack);
	}
});

app.get('/users/verified', async (req, res) => {
	try {
		const email = req.query.email;
		const query = { email: email };
		const verifiedSeller = await usersCollection.findOne(query);
		res.send(verifiedSeller);
	} catch (error) {
		console.error(error.stack);
	}
});
// Seller verification update route
app.patch('/users/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const verification = req.body.verification;
		console.log(id, verification);
		const filter = { _id: ObjectId(id) };
		const options = { upsert: true };

		const updateDoc = {
			$set: {
				verification: verification
			}
		};
		const result = await usersCollection.updateOne(filter, updateDoc, options);
		res.send(result);
	} catch (error) {
		console.error(error.stack);
	}
});

// User delete route
app.delete('/users/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		// console.log(query);
		if (query) {
			const result = await usersCollection.deleteOne(query);
			res.send(result);
		}
	} catch (error) {
		console.log(error);
	}
});

// User's Role Check Route (Admin / Buyer/ Seller)
app.get('/users/role', async function (req, res) {
	try {
		const email = req.query.email;
		const query = { email: email };
		const result = await usersCollection.findOne(query);

		// result{email: "email", name: "name", role: "admin/buyer/seller"}
		res.send(result);
	} catch (error) {
		console.log(error.stack);
	}
});

app.get('/category', async (req, res) => {
	try {
		const query = {};
		const result = await brandsCollection.find(query).toArray();
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});

app.get('/category/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		const catagory = await brandsCollection.findOne(query);
		const brand = catagory.brand_name;
		const filter = { brand_name: brand };
		const result = await carsCollection.find(filter).toArray();
		// console.log(result);
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});

app.post('/booking', async (req, res) => {
	try {
		const bookingData = req.body;
		const result = await bookingsCollection.insertOne(bookingData);
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});

app.get('/booking', async (req, res) => {
	try {
		const email = req.query.email;
		const query = { 'buyerInfo.email': email };
		const result = await bookingsCollection.find(query).toArray();
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});

app.get('/booking/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		const result = await bookingsCollection.findOne(query);
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});

app.delete('/booking/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		if (query) {
			const result = await bookingsCollection.deleteOne(query);
			res.send(result);
		}
	} catch (error) {
		console.log(error);
	}
});

app.post('/add-product', async (req, res) => {
	try {
		const productData = req.body;
		const result = await carsCollection.insertOne(productData);
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});

app.get('/products', async (req, res) => {
	try {
		const email = req.query.email;
		const query = {
			'seller_info.email': email
		};
		const result = await carsCollection.find(query).toArray();
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});
app.delete('/products/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		const result = await carsCollection.deleteOne(query);
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});

app.post('/reported-items', async (req, res) => {
	try {
		const reportedItem = req.body;
		const result = await reportedItemsCollection.insertOne(reportedItem);
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});
app.get('/reported-items', async (req, res) => {
	try {
		const query = {};
		const result = await reportedItemsCollection.find(query).toArray();
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});
// Delete Product by report Items ID with query to product ID
app.delete('/reported-items/:id', async (req, res) => {
	try {
		const reportId = req.params.id;
		const query = { _id: ObjectId(reportId) };
		const result = await reportedItemsCollection.findOne(query);
		const carId = result.car._id;
		const filter = { _id: ObjectId(carId) };
		const findItem = await carsCollection.findOne(filter);
		console.log(findItem);
		const deleteItemCar = await carsCollection.deleteOne(filter);
		const deleteItemReport = await reportedItemsCollection.deleteOne(query);
		res.send({ deleteItemReport, deleteItemCar });
	} catch (error) {
		console.log(error);
	}
});

app.post('/payments', async (req, res) => {
	try {
		const paymentData = req.body;
		const carId = paymentData.orderData.carInfo._id;
		// console.log(carId);
		const filterCarId = { 'orderData.carInfo._id': carId };
		// console.log(filterCarId);
		const findItem = await paymentsCollection.findOne(filterCarId);
		if (findItem) {
			// console.log('Item found');
			return res.send({ findItem, message: 'Payment Not Complete...!Product already Sold...!' });
		} else {
			const result = await paymentsCollection.insertOne(paymentData);

			const orderId = paymentData.orderData._id;
			const query = { _id: ObjectId(orderId) };

			const updateDoc = {
				$set: {
					paymentStatus: 'paid'
				}
			};
			const updateBooking = await bookingsCollection.updateOne(query, updateDoc);

			const productId = paymentData.orderData.carInfo._id;
			const filter = { _id: ObjectId(productId) };

			const updateProduct = {
				$set: {
					sales_status: 'sold'
				}
			};
			const updateCars = await carsCollection.updateOne(filter, updateProduct);

			const advertiseId = paymentData.orderData.carInfo._id;
			const queryId = { 'product._id': advertiseId };

			const delAdd = await advertisesCollection.deleteOne(queryId);

			res.send({ result, updateBooking, updateCars, delAdd, message: 'Payment Complete Successfull...!' });
		}
	} catch (error) {
		console.error(error.stack);
	}
});

app.post('/advertise', async (req, res) => {
	try {
		const advertiseData = req.body;
		const id = advertiseData.product._id;
		console.log(id);
		const query = { 'product._id': id };
		const findItem = await advertisesCollection.findOne(query);
		if (findItem) {
			return res.send({ message: 'Already Advertised' });
		} else {
			const result = await advertisesCollection.insertOne(advertiseData);
			res.send(result);
		}
	} catch (error) {
		console.log(error);
	}
});

app.get('/advertise', async (req, res) => {
	try {
		const query = {};
		const result = await advertisesCollection.find(query).toArray();
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});
// Test Route
app.get('/', (req, res) => {
	console.log('Server is running');
	res.send('erver is running');
});

// Server Listening
app.listen(port, () => {
	console.log(`Server is running on port:...${port}`);
});

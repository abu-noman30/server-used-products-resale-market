const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

app.post('/add-product', async (req, res) => {
	try {
		const productData = req.body;
		const result = await carsCollection.insertOne(productData);
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

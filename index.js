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
const collectionBrands = database.collection('brands');
const collectionCars = database.collection('cars');
// ----------------------------


// Test Route
app.get('/', (req, res) => {
	console.log('Server is running');
	res.send('erver is running');
});

// Server Listening
app.listen(port, () => {
	console.log(`Server is running on port:...${port}`);
});

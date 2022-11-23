const express = require('express');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Test Route
app.get('/', (req, res) => {
	console.log('Server is running');
	res.send('erver is running');
});

// Server Listening
app.listen(port, () => {
	console.log(`Server is running on port:...${port}`);
});

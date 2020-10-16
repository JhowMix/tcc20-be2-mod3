
const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb+srv://tcc_dev:123605@cluster0.b7x8w.mongodb.net/tcc_dev?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = client;

// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   console.log(collection.collectionName);
//   client.close();
// });

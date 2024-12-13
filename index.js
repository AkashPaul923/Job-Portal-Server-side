require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const req = require('express/lib/request');
const app = express();
const port = process.env.PORT ||5000;
app.use(cors());
app.use(express.json());
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xlwti.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobCollection = client.db('JobPortal').collection('Jobs')
    const jobApplicationCollection = client.db('JobPortal').collection('Job-Application')

    // Auth APIs
    app.post('/jwt', async (req, res)=>{
      const user = req.body
      const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '1h'})
      res.cookie('token', token, {
        httpOnly:true,
        secure: false, 
      }).send({success: true})
    })

    // job APIs
    app.get('/jobs', async (req,res)=>{
        const cursor = jobCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/jobs/:id', async (req,res)=>{
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await jobCollection.findOne(query)
        res.send(result)
    })


    app.post('/jobs', async (req, res) =>{
      const newJob = req.body
      const result = await jobCollection.insertOne(newJob)
      res.send(result)
    })


    // job application apis
    app.post('/job-applications', async (req, res) =>{
      const application = req.body
      const result = await jobApplicationCollection.insertOne(application)
      res.send(result)
    })


    app.get('/job-applications/:email', async (req, res) =>{
      const email = req.params.email
      // console.log(email);
      const query = { applicant_email : email }
      const result = await jobApplicationCollection.find(query).toArray()
      for(const application of result){
        const query1 = { _id : new ObjectId(application.job_id) }
        const job = await jobCollection.findOne(query1)
        if(job){
          application.title = job.title
          application.location = job.location
          application.company = job.company
          application.company_logo = job.company_logo
        }
      }
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Jobs Server is Running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
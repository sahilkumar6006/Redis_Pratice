import express, { json } from 'express';
import { createClient } from 'redis';

const app = express();
app.use(express.json());

const redisClient = createClient();
redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});

app.post('/submit', async(req, res) => {
    const problemId = req.body.problemId;
    const code = req.body.code;
    const language = req.body.language;

    try {
        await redisClient.lPush("problems", JSON.stringify({
            code,
            language,
            problemId,
        }))

        //store in the database
        res.status(200).json({
            message: "Problem submitted successfully",
        });
    }catch (error){
        console.log('Error submitting problem:', error);
    }
})

async function startServer() {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');

        app.listen(3000, () => {
            console.log('Server is running on http://localhost:3000');
        }
        );
    } catch (error) {
        console.error('Error starting server:', error);
        
    }

   
}
startServer();

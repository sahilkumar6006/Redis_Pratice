import {createClient} from 'redis';
const redisClient = createClient();

async function processSubmissions(submission: string){
    const {problemId, code, language} = JSON.parse(submission);
    console.log(`Processing submission for problem ${problemId} in ${language}`);
    //! Here you would add the logic to process the submission, such as running tests or storing results.

    await new Promise((resolve) => {
        setTimeout(resolve, 1000);
    }
    );
    console.log(`Finished processing submission for problem ${problemId}`);

    //! Publish the result to a Redis channel
    // !This could be used to notify other services or components about the result
    //! For example, you might want to publish the result to a channel named 'submission_results'
    
    console.log(`Publishing result for problem ${problemId} in ${language}`);


     //! Publish the result to a Redis channel
     //! This could be used to notify other services or components about the result
     //! For example, you might want to publish the result to a channel named 'submission_results'

     await
    redisClient.publish('submission_results', JSON.stringify({
        problemId,  
        status: 'processed',
        language,
    }));
}

async function startWorker() {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');

        while (true) {
            const submission = await redisClient.brPop("problems", 0);
            if (submission) {
                console.log('Received submission from Redis:', submission);
                await processSubmissions(submission.element);
                //! Indicate worker is alive
                await redisClient.set('worker_status', 'working', { EX: 10 });
            } else {
                console.log('No submissions to process, waiting...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                //! Indicate worker is idle
                await redisClient.set('worker_status', 'idle', { EX: 10 });
            }
        }
    } catch (error) {
        console.error('Error in worker:', error);
    }
}
startWorker().catch(console.error);
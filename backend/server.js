require('dotenv').config(); 
const app = require('./src/app');
const connectDB = require('./src/db/db');

async function startServer() {
    await connectDB();
    app.listen(3000,()=>{
        console.log('server is running on port 3000');
    });
}

startServer().catch(() => {
    process.exitCode = 1;
});
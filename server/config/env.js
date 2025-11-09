import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Export for convenience (though process.env is globally available)
export default process.env;

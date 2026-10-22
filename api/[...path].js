// Vercel routes /api/* through this catch-all and runs the shared Express app
// as a serverless function. The Express app itself never opens a listener.
export { default } from '../backend/src/app.js'

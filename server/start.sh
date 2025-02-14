#!/bin/bash

# Start the Node.js server
echo "Starting Node.js server..."
npm run dev

# Function to handle script termination
cleanup() {
    echo "Shutting down server..."
    kill $!
    exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Wait for the process
wait 
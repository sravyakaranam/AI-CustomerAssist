// Import necessary modules
import { NextResponse } from 'next/server';

// Set up your API endpoint and environment variables
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Ensure your API key is securely stored in environment variables
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'https://your-vercel-app.vercel.app'; // Set to your local site URL
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || 'ai-customerAssist'; // Set to your local site name

// POST function to handle incoming requests
export async function POST(req) {
  let data;
  try {
    // Parse the incoming request as JSON
    data = await req.json();
  } catch (error) {
    console.error('Error parsing request JSON:', error);
    return new Response('Invalid JSON input', { status: 400 });
  }

  // Construct the request payload for OpenRouter API
  const requestBody = {
    model: 'meta-llama/llama-3.1-8b-instruct:free', // Specify the model to use
    messages: data, // Use the incoming messages from the request body
  };

  try {
    // Send a POST request to the OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`, // Include your API key
        'HTTP-Referer': YOUR_SITE_URL, // Optional: Include your local site URL
        'X-Title': YOUR_SITE_NAME, // Optional: Include your site name
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Read the response as text
    const textResponse = await response.text();
    console.log('Raw response:', textResponse); // Log the response for debugging

    // Check if the response is not OK or is in HTML format
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
      console.error('Error with API response:', textResponse);
      return new Response(`Error with API: ${textResponse}`, { status: 500 });
    }

    // Parse the response as JSON
    const responseData = JSON.parse(textResponse);

    // Create a readable stream to handle the response (adjust based on response structure)
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const text = encoder.encode(responseData.choices[0].message.content); // Adjust as per the actual response structure
        controller.enqueue(text);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Error during API request:', error);
    return new Response('Error with API request', { status: 500 });
  }
}

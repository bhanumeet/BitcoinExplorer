// pages/api/latestblock.js
import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  try {
    const response = await fetch('https://blockchain.info/latestblock');
    const data = await response.json();

    // Return the data with a status code of 200
    res.status(200).json(data);
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

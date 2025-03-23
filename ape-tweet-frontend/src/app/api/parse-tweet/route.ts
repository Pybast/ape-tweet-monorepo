import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful assistant that extracts Ethereum token addresses from tweets.
Your task is to identify and extract any Ethereum addresses that represent tokens.
Only respond with a JSON object containing the address. If no valid address is found, return null.
Example response format:
{
  "address": "0x1234...5678" // the token address, or null if not found
}`;

export async function POST(request: Request) {
  try {
    const { tweet } = await request.json();

    if (!tweet) {
      return NextResponse.json(
        { error: "Tweet content is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      amount: 10000000000000,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: tweet },
      ],
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '{"address": null}');

    return NextResponse.json({
      address: parsedResponse.address,
      amount: 10000000000000,
    });
  } catch (error) {
    console.error("Error parsing tweet:", error);
    return NextResponse.json(
      { error: "Failed to parse tweet" },
      { status: 500 }
    );
  }
}

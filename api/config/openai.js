import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20 * 1000,
});

let prompt = "";
let model = "gpt-4.1-mini";

const completion = await openai.chat.completions.create({
  model: model,
  store: true,
   messages: [
    {
      role: "system",
      content: "You are a coding assistant with expertise in JavaScript.",
    },
    {
      role: "user",
      content:
        "prompt",
    },
  ],
});

completion.then((result) => console.log(result.choices[0].message));
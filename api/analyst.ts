import { runAnalystRequest } from "../server/analyst";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const result = await runAnalystRequest(req.body, process.env.ANTHROPIC_API_KEY || "");
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || "The analyst request failed.",
    });
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { columnsA, columnsB, sampleDataA, sampleDataB } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are a data analysis expert. Given two CSV tables, suggest the best column mappings for a VLOOKUP operation.

Table A columns: ${columnsA.join(", ")}
Table A sample (first row): ${JSON.stringify(sampleDataA[0])}

Table B columns: ${columnsB.join(", ")}
Table B sample (first row): ${JSON.stringify(sampleDataB[0])}

Analyze the column names and sample data, then suggest:
1. Which column from Table A should be used as the lookup column (the key we're searching for)
2. Which column from Table B should be used as the match column (the key to match against)
3. Which column from Table B should be returned as the result

Provide your response as a JSON object with these exact keys: lookupColumn, matchColumn, returnColumn.
Also include a "reasoning" field explaining why you made these suggestions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a data analysis expert specializing in Excel VLOOKUP operations. Provide concise, accurate suggestions.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Try to extract JSON from the response
    let suggestion;
    try {
      // Look for JSON in the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if AI doesn't return JSON
        suggestion = {
          lookupColumn: columnsA[0],
          matchColumn: columnsB[0],
          returnColumn: columnsB[1] || columnsB[0],
          reasoning: aiResponse,
        };
      }
    } catch (e) {
      suggestion = {
        lookupColumn: columnsA[0],
        matchColumn: columnsB[0],
        returnColumn: columnsB[1] || columnsB[0],
        reasoning: aiResponse,
      };
    }

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-columns function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

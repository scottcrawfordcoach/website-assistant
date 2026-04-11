import Anthropic from '@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages: incomingMessages, query } = await req.json()
    
    // Handle both formats (legacy 'query' or new 'messages' array)
    let conversationMessages = [];
    if (incomingMessages && Array.isArray(incomingMessages)) {
        conversationMessages = incomingMessages;
    } else if (query) {
        conversationMessages = [{ role: 'user', content: query }];
    } else {
        throw new Error('No messages or query provided')
    }

    // Initialize Anthropic Client
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    // 1. Load Knowledge Files via data-handler
    const dataHandlerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/data-handler`
    const dataHandlerToken = Deno.env.get('DATA_HANDLER_BEARER_TOKEN') ?? ''

    const khRes = await fetch(dataHandlerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dataHandlerToken}`,
      },
      body: JSON.stringify({ action: 'knowledge_base_load', payload: {} }),
    })

    if (!khRes.ok) {
      throw new Error(`Failed to load knowledge base: ${khRes.status}`)
    }

    const { data: knowledgeFileList, error: khError } = await khRes.json()
    if (khError) throw new Error(`Knowledge base error: ${khError}`)

    let knowledgeBaseText = ''
    let behaviorConfig = null;

    for (const file of knowledgeFileList) {
      if (file.name === 'behavior.json') {
        try {
          behaviorConfig = JSON.parse(file.content);
        } catch (e) {
          console.error('Error parsing behavior.json:', e);
        }
      } else {
        knowledgeBaseText += `\n\n--- Source: ${file.name} ---\n${file.content}`
      }
    }

    // 2. Construct Prompt
    let systemPrompt = '';

    if (behaviorConfig) {
      // Build prompt from JSON config
      systemPrompt = `${behaviorConfig.role_definition}\n\nYour goal is to answer visitor questions using the following priority order:\n\n`;
      
      if (behaviorConfig.priority_tiers) {
        behaviorConfig.priority_tiers.forEach(tier => {
          systemPrompt += `${tier.title}\n${tier.instructions}\n\n`;
        });
      }

      if (behaviorConfig.safety_guidelines) {
        systemPrompt += `${behaviorConfig.safety_guidelines}\n\n`;
      }
      
      systemPrompt += `Context from Knowledge Base:\n${knowledgeBaseText}`;
      
    } else {
      // Fallback to hardcoded prompt if behavior.json is missing
      systemPrompt = `
You are Coach Scott's AI assistant. You are friendly, encouraging, and knowledgeable about wellness, fitness, and nutrition.

Your goal is to answer visitor questions using the following priority order:

TIER 1: DIRECT KNOWLEDGE (Highest Priority)
Use the provided context (Markdown files, CSVs) as your primary source of truth. 
- If the user asks about schedules, pricing, or specific "Coach Scott" policies, you MUST use this information.
- Pay attention to metadata headers in Markdown files to understand the context.
- Use exercises.csv to explain workout-generator exercises (movement, body parts, reps/EMOM structure, and instructions) when asked.
- If relevant to workout pacing, intervals, or EMOM setup, recommend the interval timer: https://interval-timer-sigma.vercel.app/

TIER 1.5: REAL-TIME DATA (High Priority)
If the user asks for specific nutritional information about a food (e.g., "How much protein in an egg?"), use the 'get_nutrition_info' tool to fetch accurate data from the USDA database.
- Use this data to answer the question precisely.

TIER 2: TRUSTED SOURCES
If the answer is not explicitly in the files, check the "Approved Sources" list in the context.
- If a relevant source is listed (e.g., "Matthew Walker for Sleep"), you may use your general training to explain that source's standard recommendations.
- Explicitly mention the source: "As recommended by [Source Name]..."

TIER 3: GENERAL KNOWLEDGE (Lowest Priority)
If no specific file or trusted source covers the topic:
- You may provide general, widely accepted wellness information.
- You MUST add a caution: "While I don't have a specific resource from Coach Scott on this, generally speaking..." or "Standard wellness guidelines suggest..."
- Do NOT make up specific policies or prices.

SAFETY & LIMITS:
- Do not give medical advice. If a question is medical in nature, disclaim that you are an AI and suggest seeing a doctor.
- Keep your answers concise (2-3 sentences) unless a longer explanation is necessary.

Context from Knowledge Base:
${knowledgeBaseText}
`
    }

    // Define Tools
    const tools = [
      {
        name: "get_nutrition_info",
        description: "Get nutritional information for a specific food item from the USDA database.",
        input_schema: {
          type: "object",
          properties: {
            foodQuery: {
              type: "string",
              description: "The food item to search for (e.g., 'raw apple', 'cheddar cheese').",
            },
          },
          required: ["foodQuery"],
        },
      },
    ];

    // 3. Call Anthropic (First Pass)
    // Note: Anthropic takes system as a top-level param, not inside messages
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationMessages,
      tools: tools,
    })

    const textBlock = response.content.find(block => block.type === 'text')
    let reply = textBlock ? textBlock.text : null

    // 4. Handle Tool Calls
    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(block => block.type === 'tool_use');
      if (toolUseBlock && toolUseBlock.name === "get_nutrition_info") {
        const { foodQuery } = toolUseBlock.input;
        
        // Call USDA API
        const fdcApiKey = Deno.env.get('FDC_API_KEY');
        let toolResult = "No nutritional data found.";

        if (fdcApiKey) {
          try {
            const fdcRes = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${fdcApiKey}&query=${encodeURIComponent(foodQuery)}&pageSize=1`);
            const fdcData = await fdcRes.json();
            
            if (fdcData.foods && fdcData.foods.length > 0) {
              const food = fdcData.foods[0];
              const nutrients = food.foodNutrients.filter(n => 
                ['Protein', 'Total lipid (fat)', 'Carbohydrate, by difference', 'Energy'].includes(n.nutrientName)
              );
              
              toolResult = `Data for ${food.description}:\n`;
              nutrients.forEach(n => {
                toolResult += `- ${n.nutrientName}: ${n.value} ${n.unitName}\n`;
              });
            }
          } catch (e) {
            console.error("USDA API Error:", e);
            toolResult = "Error fetching nutritional data.";
          }
        } else {
            toolResult = "Configuration Error: FDC_API_KEY not set.";
        }

        // Add tool result to messages (Anthropic format)
        const toolMessages = [
          ...conversationMessages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: toolResult,
            }],
          },
        ];

        // Call Anthropic again (Second Pass)
        const secondResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          system: systemPrompt,
          messages: toolMessages,
        });

        const secondTextBlock = secondResponse.content.find(block => block.type === 'text');
        reply = secondTextBlock ? secondTextBlock.text : null;
      }
    }

    // 4. Return Response
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

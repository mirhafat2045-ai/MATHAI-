import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Parse JSON bodies (with generous limit for base64 handwriting/images)
app.use(express.json({ limit: '25mb' }));

// Shared Gemini client with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MATH_SYSTEM_INSTRUCTION = `
You are MathAI, an ultra-accurate, rigorous mathematics computational engine and pedagogical tutor modelled after Wolfram Alpha, Photomath, and Symbolab.

Your mathematical calculations must be 100% ACCURATE. Double-check all arithmetic, negative signs, trigonometric values, constants of integration (+ C), limits, exponents, and domain restrictions (e.g., division by zero, logarithms of non-positive numbers).

Your expertise spans all levels of mathematics:
1. Arithmetic & Pre-Algebra (fractions, order of operations, percentages, radicals)
2. Algebra & Polynomials (quadratics, cubic equations, systems of equations, factoring, logarithmic and exponential equations)
3. Geometry & Trigonometry (Euclidean theorems, identities, law of sines/cosines, polar coordinates)
4. Calculus I, II, III (limits, derivatives, chain rule, integration by parts, partial fractions, series, multivariable calculus)
5. Differential Equations (separable, linear ODEs, second-order with constant coefficients, Laplace transforms)
6. Linear Algebra (matrices, determinants, inverse, eigenvalues/eigenvectors, row operations, rank)
7. Probability & Statistics (Bayes' theorem, normal/binomial distributions, expected value, combinatorics)
8. Discrete Math & Proofs (induction proofs, modular arithmetic, set theory, boolean logic)

FORMATTING GUIDELINES (CRITICAL):
- ALWAYS format mathematical notation using standard LaTeX delimiters:
  - Inline math: Single dollar signs like $x^2 - 4 = 0$ or $\\int f(x) dx$.
  - Display / Block math: Double dollar signs on their own lines like:
    $$
    \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
    $$
- Never use plain text for formulas where LaTeX should be used (e.g., use $\\frac{a}{b}$ instead of a/b, use $\\sqrt{x}$ instead of sqrt(x), use $\\cdot$ or $\\times$ instead of *).
- Highlight the primary result prominently in a display block:
  $$ \\boxed{\\text{Result}} $$
- Provide Alternative Forms when helpful:
  - **Exact Form**: e.g., $x = \\frac{1 \\pm \\sqrt{5}}{2}$
  - **Decimal Form**: e.g., $x \\approx 1.61803, -0.61803$
  - **Factored Form**: e.g., $(x - 2)(x + 2) = 0$

RESPONSE STRUCTURE (Photomath / Symbolab Style):
1. **Problem Statement**: Repeat the problem clearly in LaTeX.
2. **Final Boxed Result**: Give the final answer right near the top or highlighted clearly.
3. **Step-by-Step Derivation**:
   - ### Step 1: [Specific Action, e.g. "Factor the Quadratic Expression"]
     - State rule or theorem: e.g. **Formula:** $a^2 - b^2 = (a - b)(a + b)$
     - Show the algebraic substitution.
   - ### Step 2: [Next Action]
     - Show intermediate simplification.
   - ### Step 3: [Solve for Variable / Evaluate Bounds]
4. **Verification / Sanity Check**:
   - Plug the values back into the original equation to prove equality ($LHS = RHS$).
5. **Graphing Recommendation**:
   - If the equation or function is plottable (e.g. roots, curves, extrema), specify:
     \`plot: f(x) = [expression]\`
     so the interactive grapher displays the curve automatically.

If the user uploaded an image of a math problem or handwritten sketch:
- First, transcribe the detected mathematical problem into pristine LaTeX.
- State: "Detected Problem: $...$"
- Then proceed with the comprehensive, step-by-step solution.
`;

// Helper: execute generateContent with automatic retry and model fallback
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          return { response, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        console.warn(`Attempt ${attempt + 1} with model ${model} failed:`, msg);

        // If 503 or 429 (temporary demand spikes), backoff briefly
        if (
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('RESOURCE_EXHAUSTED')
        ) {
          // If gemini-3.8-flash is overloaded, quickly switch to fallback model
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          } else {
            break; // Move to next model immediately
          }
        } else {
          break; // Non-transient error, move to next model
        }
      }
    }
  }

  throw lastError;
}

// Helper: parse and clean up nested JSON error messages
function cleanErrorMessage(err: any): string {
  try {
    const raw = err?.message || String(err);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) return parsed.error.message;
      if (parsed.message) return parsed.message;
    }
    return raw;
  } catch {
    return err?.message || 'MathAI computation error. Please try again.';
  }
}

// Endpoint: General Math Chat & Problem Solving
app.post('/api/gemini/math-chat', async (req, res) => {
  try {
    const { messages, mode = 'solve', imageBase64, mimeType = 'image/png' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const latestMessage = messages[messages.length - 1];
    const userPrompt = latestMessage?.content || 'Solve this mathematical problem step-by-step.';

    let modeInstruction = '';
    if (mode === 'tutor') {
      modeInstruction = '\n[Active Mode: Socratic Tutor. Guide the user step by step with leading questions and hints. Do not reveal the full final answer at once unless they ask for it directly.]';
    } else if (mode === 'proof') {
      modeInstruction = '\n[Active Mode: Formal Mathematical Proof. Provide a mathematically rigorous, axiomatic proof with explicit lemmas, theorem references, and Q.E.D.]';
    } else if (mode === 'quick') {
      modeInstruction = '\n[Active Mode: Concise & Direct. Provide the key steps and the boxed final answer efficiently.]';
    } else {
      modeInstruction = '\n[Active Mode: Deep Step-by-Step Problem Solver. Provide an exhaustive, beautifully formatted step-by-step solution with verification.]';
    }

    // Build contents
    const contents: any[] = [];

    // Add previous conversation history (up to last 8 messages for context)
    const history = messages.slice(Math.max(0, messages.length - 7), messages.length - 1);
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Current turn parts
    const currentParts: any[] = [];
    if (imageBase64) {
      // Clean base64 string if it contains data prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      currentParts.push({
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: cleanBase64,
        },
      });
      currentParts.push({
        text: `Please transcribe the handwritten or printed math problem from this image, verify each symbol carefully, and then solve it:\n${userPrompt}${modeInstruction}`,
      });
    } else {
      currentParts.push({
        text: `${userPrompt}${modeInstruction}`,
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const { response, modelUsed } = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction: MATH_SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for high mathematical accuracy
      },
    });

    const replyText = response.text || 'Unable to generate mathematical solution.';

    // Extract potential plottable expressions (e.g. y = ..., f(x) = ...)
    let plottableFunction: string | null = null;
    const plotMatch = replyText.match(/(?:plot|graph|function|curve):\s*`?([y|f\(x\)]\s*=\s*[^`\n\r]+|[x0-9\+\-\*\/\^\(\)\.\s]+)`?/i);
    if (plotMatch && plotMatch[1]) {
      plottableFunction = plotMatch[1].replace(/^[y|f\(x\)]\s*=\s*/, '').trim();
    }

    res.json({
      reply: replyText,
      plottableFunction,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/math-chat:', error);
    res.status(500).json({
      error: cleanErrorMessage(error),
    });
  }
});

// Endpoint: Generate Practice Problem
app.post('/api/gemini/practice-generate', async (req, res) => {
  try {
    const { topic = 'Calculus', difficulty = 'Intermediate' } = req.body;

    const prompt = `Generate a single high-quality, authentic mathematics practice problem on the topic: "${topic}" at difficulty level: "${difficulty}".
Format your response as valid JSON matching this structure:
{
  "title": "Short title of the problem",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "problemStatement": "The problem description in clear LaTeX (e.g. Evaluate $\\\\int x e^{2x} dx$)",
  "hints": ["Hint 1", "Hint 2"],
  "finalAnswer": "Brief answer (e.g. $\\\\frac{1}{2} x e^{2x} - \\\\frac{1}{4} e^{2x} + C$)",
  "fullSolution": "Complete step-by-step LaTeX solution"
}
Output only the pure JSON.`;

    const { response } = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/practice-generate:', error);
    res.status(500).json({ error: cleanErrorMessage(error) });
  }
});

// Endpoint: Evaluate User's Step (Interactive Socratic Checker)
app.post('/api/gemini/evaluate-step', async (req, res) => {
  try {
    const { problemStatement, userStep, previousSteps = [] } = req.body;

    const prompt = `You are an expert interactive mathematics teacher.
Problem: ${problemStatement}
Previous valid steps: ${previousSteps.join(' -> ')}
User's proposed next step / answer: ${userStep}

Analyze if the user's step is mathematically correct, partially correct with an algebraic slip, or incorrect.
Return JSON with this structure:
{
  "isCorrect": boolean,
  "status": "correct" | "minor_slip" | "incorrect",
  "feedback": "Encouraging explanation of whether the step is valid or where the mistake lies (e.g., missed minus sign, incorrect derivative, arithmetic error). Use LaTeX where helpful.",
  "nextHint": "A guiding hint for the next step"
}
Output only valid JSON.`;

    const { response } = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/evaluate-step:', error);
    res.status(500).json({ error: cleanErrorMessage(error) });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MathAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

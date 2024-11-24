import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { createOpenAIFunctionsAgent } from 'langchain/agents';
import { AgentExecutor } from 'langchain/agents';
import { pull } from 'langchain/hub';
import type { ChatPromptTemplate } from '@langchain/core/prompts';
import { DynamicTool } from '@langchain/core/tools';

@Injectable()
export class ChatService {
  private llm: ChatOpenAI;
  private executor: AgentExecutor;

  constructor() {
    this.initializeLLM();
    this.initializeAgent();
  }

  private async initializeLLM() {
    this.llm = new ChatOpenAI({
      model: 'gpt-4o',
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7,
      streaming: true,
    });
  }

  private async initializeAgent() {
    // Define a simple placeholder tool
    const placeholderTool = new DynamicTool({
      name: 'placeholder_tool',
      description: 'A placeholder tool that echoes the input.',
      func: async (input: string) => {
        return `You used the placeholder tool with input: ${input}`;
      },
    });

    // Asynchronously pull the prompt
    const prompts: ChatPromptTemplate = await pull<ChatPromptTemplate>(
      'hwchase17/openai-functions-agent',
    );

    // Create the agent
    const agent = await createOpenAIFunctionsAgent({
      llm: this.llm,
      tools: [placeholderTool],
      prompt: prompts,
    });

    // Create the executor for the agent
    this.executor = new AgentExecutor({
      agent,
      tools: [placeholderTool],
    });
  }

  async query(input: string): Promise<string> {
    const result = await this.executor.invoke({ input });
    return result.output;
  }

  // Stream responses for an input query
  async *streamQuery(input: string): AsyncGenerator<string> {
    const eventStream = await this.executor.streamEvents(
      {
        input: input,
      },
      { version: 'v2' },
    );
    for await (const event of eventStream) {
      const streamEvent = event.event;
      if (streamEvent === 'on_chat_model_stream') {
        const content = event.data.chunk.content;
        if (content) {
          yield content;
        }
      }
    }
  }
}

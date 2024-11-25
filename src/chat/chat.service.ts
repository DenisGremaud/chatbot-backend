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
    this.initializeAgent();
  }

  private async initializeAgent() {
    this.llm = new ChatOpenAI({
      model: 'gpt-4o',
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.5,
      streaming: true,
    });

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
    try {
      const result = await this.executor.invoke({ input });
      return result.output;
    } catch (error) {
      console.error('Error during query:', error);
      throw new Error('Query failed. Please try again.');
    }
  }

  async *streamQuery(input: string): AsyncGenerator<string> {
    try {
      const eventStream = await this.executor.streamEvents(
        { input: input },
        { version: 'v2' },
      );
      for await (const event of eventStream) {
        if (event.event === 'on_chat_model_stream') {
          const content = event.data.chunk.content;
          if (content) {
            yield content;
          }
        }
      }
    } catch (error) {
      console.error('Error during stream query:', error);
      yield 'Streaming query failed. Please try again.';
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { createOpenAIFunctionsAgent } from 'langchain/agents';
import { AgentExecutor } from 'langchain/agents';
import { pull } from 'langchain/hub';
import { DynamicTool } from '@langchain/core/tools';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { SessionManagerService } from 'src/session/session-manager/session-manager.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';

@Injectable()
export class ChatService {
  private llm: ChatOpenAI;
  private executor: AgentExecutor;
  private agent_with_chat_history: any;

  constructor(private readonly sessionManager: SessionManagerService) {
    this.llm = new ChatOpenAI({
      model: process.env.OPENAI_MODEL,
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.5,
      streaming: true,
    });
    this.initializeAgent();
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

    this.agent_with_chat_history = new RunnableWithMessageHistory({
      runnable: this.executor,
      getMessageHistory: async (sessionId) =>
        this.sessionManager.getSessionHistory(sessionId),
      inputMessagesKey: 'input',
      historyMessagesKey: 'chat_history',
    });
  }

  async query(input: string, sessionId: string): Promise<string> {
    try {
      const result = await this.agent_with_chat_history.invoke(
        {
          input,
        },
        {
          configurable: {
            sessionId: sessionId,
          },
          metadata: {
            session_id: sessionId,
          },
        },
      );
      return result.output;
    } catch (error) {
      console.error('Error during query:', error);
      throw new Error('Query failed. Please try again.');
    }
  }

  async *streamQuery(input: string, sessionId: string): AsyncGenerator<string> {
    try {
      const eventStream = await this.agent_with_chat_history.streamEvents(
        {
          input,
        },
        {
          version: 'v2',
          configurable: {
            sessionId: sessionId,
          },
          metadata: {
            session_id: sessionId,
          },
        },
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

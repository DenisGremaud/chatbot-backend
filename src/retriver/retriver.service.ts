import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createRetrieverTool } from 'langchain/tools/retriever';
import { DynamicStructuredTool } from '@langchain/core/tools';

@Injectable()
export class RetriverService {
  private retrivers: Map<string, DynamicStructuredTool>;
  private openaiEmbeddings: OpenAIEmbeddings;

  constructor(private readonly prismaService: PrismaService) {
    this.retrivers = new Map<string, DynamicStructuredTool>();
    this.openaiEmbeddings = new OpenAIEmbeddings();
  }

  // Initialize retrievers from the posgres database
  async _initializeRetrievers() {
    const retrieversConfig = await this.prismaService.collections.findMany();
    for (const retriever of retrieversConfig) {
      const retriver = new Chroma(this.openaiEmbeddings, {
        collectionName: retriever.collectionName,
        url: `http://${retriever.host}:${retriever.port}`,
      }).asRetriever({ k: retriever.searchK });
      const tool = createRetrieverTool(retriver, {
        name: retriever.collectionName,
        description: retriever.description,
      });
      this.retrivers.set(retriever.collectionName, tool);
    }
  }

  public getAllRetrievers(): DynamicStructuredTool[] {
    return Array.from(this.retrivers.values());
  }

  public printRetrievers() {
    console.log(this.retrivers);
  }
}

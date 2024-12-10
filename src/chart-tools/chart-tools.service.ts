import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool, DynamicTool } from 'langchain/tools';
import { z } from 'zod';

@Injectable()
export class ChartToolsService {
  // Helper function to generate QuickChart URLs
  private generateChartUrl(
    chartConfig: object,
    options: {
      width?: number;
      height?: number;
      format?: string;
      encoding?: 'url' | 'base64';
    } = {},
  ): string {
    const {
      width = 500,
      height = 300,
      format = 'png',
      encoding = 'base64',
    } = options;

    try {
      // Encode the chart configuration based on the chosen encoding
      let chartParam: string;
      if (encoding === 'base64') {
        chartParam = Buffer.from(JSON.stringify(chartConfig)).toString(
          'base64',
        );
      } else {
        chartParam = encodeURIComponent(JSON.stringify(chartConfig));
      }

      // Return the final URL with the appropriate parameters
      return `https://quickchart.io/chart?chart=${chartParam}&width=${width}&height=${height}&format=${format}&encoding=${encoding}`;
    } catch (error) {
      throw new Error(`Failed to generate chart URL: ${error}`);
    }
  }

  // Tool for getting the current date
  getCurrentDateTool(): DynamicTool {
    return new DynamicTool({
      name: 'get_current_date',
      description:
        'A tool that provides the current date in YYYY-MM-DD format.',
      func: async () => {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0]; // Extract YYYY-MM-DD
        return `Today's date is: ${formattedDate}`;
      },
    });
  }

  // Tool for creating line graphs
  createLineGraph(): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'create_line_graph',
      description: 'Creates a line graph using the QuickChart API.',
      schema: z.object({
        labels: z.array(z.string()).describe('Labels for each data set'),
        data: z
          .array(z.array(z.number()))
          .describe('Data series for the line graph'),
        title: z.string().describe('The title of the graph'),
        is_start_zero: z
          .boolean()
          .describe('Whether the graph should start at zero'),
      }),
      func: async ({ labels, data, title, is_start_zero }) => {
        const chartConfig = {
          type: 'line',
          data: {
            labels,
            datasets: data.map((series, index) => ({
              label: labels[index],
              data: series,
              borderColor: `rgba(${index * 50}, 99, 132, 1)`,
              backgroundColor: `rgba(${index * 50}, 99, 132, 0.2)`,
              fill: false,
            })),
          },
          options: {
            title: {
              display: true,
              text: title,
            },
            responsive: true,
            scales: {
              y: {
                beginAtZero: is_start_zero,
              },
            },
            plugins: {
              title: {
                display: true,
                text: title,
              },
            },
          },
        };

        return this.generateChartUrl(chartConfig);
      },
    });
  }

  // Tool for creating bar graphs
  createBarGraph(): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'create_bar_graph',
      description: 'Creates a bar graph using the QuickChart API.',
      schema: z.object({
        categories: z.array(z.string()).describe('Categories foreach category'),
        values: z
          .array(z.array(z.number()))
          .describe('Values for each category'),
        labels: z.array(z.string()).describe('Labels for each dataset'),
        title: z.string().describe('The title of the graph'),
        is_start_zero: z
          .boolean()
          .describe('Whether the graph should start at zero'),
      }),
      func: async ({ categories, values, labels, title, is_start_zero }) => {
        const chartConfig = {
          type: 'bar',
          data: {
            labels: categories,
            datasets: values.map((series, index) => ({
              label: labels[index],
              data: series,
              backgroundColor: `rgba(${index * 50}, 99, 132, 0.2)`,
              borderColor: `rgba(${index * 50}, 99, 132, 1)`,
              borderWidth: 1,
            })),
          },
          options: {
            title: {
              display: true,
              text: title,
            },
            responsive: true,
            scales: {
              y: {
                beginAtZero: is_start_zero,
              },
            },
            plugins: {
              title: {
                display: true,
                text: title,
              },
            },
          },
        };

        return this.generateChartUrl(chartConfig);
      },
    });
  }

  // Tool for creating pie graphs
  createPieGraph(): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'create_pie_graph',
      description: 'Creates a pie chart using the QuickChart API.',
      schema: z.object({
        labels: z
          .array(z.string())
          .describe('Labels for each segment of the pie chart'),
        sizes: z
          .array(z.number())
          .describe('Sizes for each segment of the pie chart'),
        title: z.string().describe('The title of the graph'),
      }),
      func: async ({ labels, sizes, title }) => {
        const chartConfig = {
          type: 'pie',
          data: {
            labels,
            datasets: [
              {
                data: sizes,
                backgroundColor: labels.map(
                  (_, index) => `rgba(${index * 50}, 99, 132, 0.2)`,
                ),
              },
            ],
          },
          options: {
            responsive: true,
            title: {
              display: true,
              text: title,
            },
          },
        };

        return this.generateChartUrl(chartConfig);
      },
    });
  }

  // Retrieve all tools
  getAllTools(): DynamicStructuredTool[] {
    return [
      this.createLineGraph(),
      this.createBarGraph(),
      this.createPieGraph(),
    ];
  }
}

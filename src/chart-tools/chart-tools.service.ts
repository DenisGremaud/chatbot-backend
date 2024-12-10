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
        labels: z
          .array(z.string())
          .describe(
            'Names or categories representing each data point along the X-axis, helping to identify and differentiate the data displayed on the graph.',
          ),
        data: z
          .array(z.array(z.number()))
          .describe(
            'A collection of numerical datasets, where each inner array represents a data series to be plotted on the graph. Each series corresponds to the respective X-axis labels.',
          ),
        datasetLabels: z
          .array(z.string())
          .describe(
            'Labels for each dataset in the chart legend, identifying the corresponding data series.',
          ),
        title: z
          .string()
          .describe(
            'The main title of the graph, displayed prominently above it to provide context or summarize the data being visualized.',
          ),
        is_start_zero: z
          .boolean()
          .describe(
            'A flag indicating whether the Y-axis should start from zero, regardless of the data range. Useful for standardizing the visual comparison of datasets.',
          ),
      }),
      func: async ({ labels, data, datasetLabels, title, is_start_zero }) => {
        const chartConfig = {
          type: 'line',
          data: {
            labels,
            datasets: data.map((series, index) => ({
              label: datasetLabels[index] || `Dataset ${index + 1}`, // Use provided label or fallback
              data: series,
              borderColor: `rgba(${index * 50}, 99, 132, 1)`, // Dynamic color based on index
              backgroundColor: `rgba(${index * 50}, 99, 132, 0.2)`, // Semi-transparent fill
              fill: false, // No background fill for line charts
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
          },
        };

        return this.generateChartUrl(chartConfig);
      },
    });
  }

  createBarGraph(): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'create_bar_graph',
      description: 'Creates a customizable bar graph using the QuickChart API.',
      schema: z.object({
        categories: z
          .array(z.string())
          .describe(
            'Names or categories representing each bar along the X-axis, used to identify and distinguish the data being visualized in the graph.',
          ),
        values: z
          .array(z.array(z.number()))
          .describe(
            'A collection of numerical datasets, where each inner array represents a data series to be plotted as bars. Each series corresponds to the respective X-axis categories.',
          ),
        datasetLabels: z
          .array(z.string())
          .describe(
            'Labels for each dataset in the chart legend, identifying the corresponding data series.',
          ),
        title: z
          .string()
          .describe(
            'The main title of the graph, displayed prominently above it to provide context or summarize the data being visualized.',
          ),
        is_start_zero: z
          .boolean()
          .describe(
            'A flag indicating whether the Y-axis should start from zero, regardless of the data range. Useful for standardizing the visual comparison of datasets.',
          ),
      }),
      func: async ({
        categories,
        values,
        datasetLabels,
        title,
        is_start_zero,
      }) => {
        const chartConfig = {
          type: 'bar',
          data: {
            labels: categories,
            datasets: values.map((series, index) => ({
              label: datasetLabels[index] || `Dataset ${index + 1}`, // Use provided label or fallback
              data: series,
              backgroundColor: `rgba(${index * 50 + 50}, ${99 + index * 20}, ${
                132 - index * 30
              }, 0.5)`, // Dynamic semi-transparent color
              borderColor: `rgba(${index * 50 + 50}, ${99 + index * 20}, ${
                132 - index * 30
              }, 1)`, // Dynamic border color
              borderWidth: 1, // Consistent border width
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
          },
        };

        // Generate and return the chart URL using the QuickChart API
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

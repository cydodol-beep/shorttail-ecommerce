declare module 'react-chartjs-2' {
  import { ChartType, DefaultDataPoint, ChartOptions, Plugin } from 'chart.js';
  import { FC } from 'react';
  
  export interface ChartProps<
    TType extends ChartType = ChartType,
    TData = DefaultDataPoint<TType>,
    TLabel = unknown
  > {
    type: TType;
    data: import('chart.js').ChartData<TType, TData, TLabel>;
    options?: ChartOptions<TType>;
    plugins?: Plugin<TType>[];
    datasetIdKey?: string;
    width?: number;
    height?: number;
    fallbackContent?: React.ReactNode;
    className?: string;
  }
  
  export const Chart: FC<ChartProps>;
  export const Bar: FC<ChartProps>;
  export const Bubble: FC<ChartProps>;
  export const Doughnut: FC<ChartProps>;
  export const Line: FC<ChartProps>;
  export const Pie: FC<ChartProps>;
  export const PolarArea: FC<ChartProps>;
  export const Radar: FC<ChartProps>;
  export const Scatter: FC<ChartProps>;
}
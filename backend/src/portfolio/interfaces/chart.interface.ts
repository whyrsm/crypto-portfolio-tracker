export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
    }[];
}

export interface ChartDataResponse {
    source: string[][];
}
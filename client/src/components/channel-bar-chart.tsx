import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: ChartData[];
}

const ChannelBarChart = ({ data }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((item) => item.label),
        datasets: [{
          label: "수집 채널별 분포",
          data: data.map((item) => item.value),
          backgroundColor: data.map((item) => item.color),
          borderColor: data.map((item) => item.color),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: false 
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.x.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: Math.max(...data.map(item => item.value)) * 1.1,
            grid: {
              color: "rgba(0, 0, 0, 0.1)"
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              },
              color: "#374151"
            }
          }
        }
      }
    });

    return () => chart.destroy();
  }, [data]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">수집 채널별 분포</h3>
      <div className="flex items-center h-full">
        <div className="w-2/3 h-64">
          <canvas ref={canvasRef}></canvas>
        </div>
        <ul className="ml-4 space-y-2 text-sm text-gray-700">
          {data.map((item, i) => (
            <li key={i} className="flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></span>
              <span>{item.label}</span>
              <span className="ml-auto font-medium">{item.value.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChannelBarChart;
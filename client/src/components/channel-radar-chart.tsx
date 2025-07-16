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

const ChannelRadarChart = ({ data }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: data.map((item) => item.label),
        datasets: [{
          label: "수집 채널별 분포",
          data: data.map((item) => item.value),
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          borderColor: "rgba(79, 70, 229, 0.8)",
          pointBackgroundColor: data.map((item) => item.color),
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: data.map((item) => item.color),
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: false 
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.r.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: Math.max(...data.map(item => item.value)) * 1.2,
            grid: {
              color: "rgba(0, 0, 0, 0.1)"
            },
            angleLines: {
              color: "rgba(0, 0, 0, 0.1)"
            },
            pointLabels: {
              font: {
                size: 11
              },
              color: "#374151"
            },
            ticks: {
              display: false
            }
          }
        },
        elements: {
          line: {
            borderWidth: 3
          }
        }
      }
    });

    return () => chart.destroy();
  }, [data]);

  return (
    <div className="relative w-full h-60 rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold mb-2">수집 채널별 분포</p>
      <div className="flex items-center">
        <div className="w-2/3 h-52">
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

export default ChannelRadarChart;
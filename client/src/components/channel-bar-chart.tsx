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
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: false 
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.y.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'LG Smart UI, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              },
              color: "#374151"
            }
          },
          y: {
            beginAtZero: true,
            max: Math.max(...data.map(item => item.value)) * 1.1,
            grid: {
              color: "rgba(0, 0, 0, 0.1)"
            },
            ticks: {
              callback: function(value) {
                return Math.round(value as number) + '%';
              },
              stepSize: 1
            }
          }
        }
      }
    });

    return () => chart.destroy();
  }, [data]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">수집 채널별 분포</h3>
      <div className="flex flex-col" style={{ height: '320px' }}>
        <div className="h-48 mb-4">
          <canvas ref={canvasRef}></canvas>
        </div>
        {/* 범례를 감정분석 카드와 동일한 스타일로 */}
        <div className="mt-4 space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700" style={{ fontFamily: 'LG Smart UI, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{Math.round(item.value)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelBarChart;
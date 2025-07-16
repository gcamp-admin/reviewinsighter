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

    // 그라데이션 생성
    const gradients = data.map((item) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      
      // 버튼 톤에 맞춘 그라데이션
      if (item.label === '구글 앱스토어') {
        gradient.addColorStop(0, '#A5B4FC'); // 연한 보라
        gradient.addColorStop(1, '#667eea'); // 진한 보라
      } else if (item.label === '애플 앱스토어') {
        gradient.addColorStop(0, '#8B5CF6'); // 연한 보라
        gradient.addColorStop(1, '#4F46E5'); // 진한 보라
      } else if (item.label === '네이버 블로그') {
        gradient.addColorStop(0, '#C4B5FD'); // 연한 보라
        gradient.addColorStop(1, '#764ba2'); // 진한 보라
      } else if (item.label === '네이버 카페') {
        gradient.addColorStop(0, '#DDD6FE'); // 연한 보라
        gradient.addColorStop(1, '#8B5CF6'); // 진한 보라
      }
      
      return gradient;
    });

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((item) => item.label),
        datasets: [{
          label: "수집 채널별 분포",
          data: data.map((item) => item.value),
          backgroundColor: gradients,
          borderColor: data.map((item) => item.color),
          borderWidth: 1,
          borderRadius: 8,
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
      <div className="relative h-64">
        <canvas ref={canvasRef}></canvas>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ 
                  background: item.label === '구글 앱스토어' ? 'linear-gradient(135deg, #A5B4FC 0%, #667eea 100%)' :
                             item.label === '애플 앱스토어' ? 'linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)' :
                             item.label === '네이버 블로그' ? 'linear-gradient(135deg, #C4B5FD 0%, #764ba2 100%)' :
                             item.label === '네이버 카페' ? 'linear-gradient(135deg, #DDD6FE 0%, #8B5CF6 100%)' : 
                             item.color
                }}
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
  );
};

export default ChannelBarChart;
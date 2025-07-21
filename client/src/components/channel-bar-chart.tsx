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

    // 브랜드 색상 그라데이션 생성
    const gradients = data.map((item) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      
      // 브랜드 색상 그라데이션
      if (item.label === '구글 앱스토어') {
        gradient.addColorStop(0, '#D1FAE5'); // 연한 그린
        gradient.addColorStop(1, '#10B981'); // 브랜드 그린
      } else if (item.label === '애플 앱스토어') {
        gradient.addColorStop(0, '#E0E7FF'); // 연한 인디고
        gradient.addColorStop(1, '#4F46E5'); // 브랜드 인디고
      } else if (item.label === '네이버 블로그') {
        gradient.addColorStop(0, '#ECFDF5'); // 연한 메인 색상
        gradient.addColorStop(1, '#7CF3C4'); // 브랜드 메인
      } else if (item.label === '네이버 카페') {
        gradient.addColorStop(0, '#F3F4F6'); // 연한 그레이
        gradient.addColorStop(1, '#6B7280'); // 중립 그레이
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
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <div className="relative h-48">
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>

      <div className="mt-3 space-y-2 flex-shrink-0">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                style={{ 
                  background: item.label === '구글 앱스토어' ? 'linear-gradient(135deg, #D1FAE5 0%, #10B981 100%)' :
                             item.label === '애플 앱스토어' ? 'linear-gradient(135deg, #E0E7FF 0%, #4F46E5 100%)' :
                             item.label === '네이버 블로그' ? 'linear-gradient(135deg, #ECFDF5 0%, #7CF3C4 100%)' :
                             item.label === '네이버 카페' ? 'linear-gradient(135deg, #F3F4F6 0%, #6B7280 100%)' : 
                             item.color
                }}
              />
              <span className="text-body text-gray-700">
                {item.label}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-body font-medium text-gray-900">{Math.round(item.value)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelBarChart;
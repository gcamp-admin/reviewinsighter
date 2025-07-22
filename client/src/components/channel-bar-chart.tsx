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

    // Modern flat 컬러 생성 (그라데이션 제거)
    const flatColors = data.map((item) => {
      // 브랜드 색상 기반 soft 단색
      if (item.label === '구글 앱스토어') {
        return '#10B981'; // 브랜드 그린
      } else if (item.label === '애플 앱스토어') {
        return '#4F46E5'; // 브랜드 인디고
      } else if (item.label === '네이버 블로그') {
        return '#7CF3C4'; // 브랜드 메인
      } else if (item.label === '네이버 카페') {
        return '#6B7280'; // 중립 그레이
      }
      return item.color;
    });

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((item) => item.label),
        datasets: [{
          label: "수집 채널별 분포",
          data: data.map((item) => item.value),
          backgroundColor: flatColors,
          borderColor: flatColors,
          borderWidth: 0,
          borderRadius: 6,
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
              display: false // 막대 아래 라벨 숨김
            }
          },
          y: {
            beginAtZero: true,
            max: Math.max(...data.map(item => item.value)) * 1.1,
            grid: {
              color: "rgba(156, 163, 175, 0.2)",
              lineWidth: 1
            },
            ticks: {
              callback: function(value) {
                return Math.round(value as number) + '%';
              },
              stepSize: 10,
              font: {
                size: 11,
                family: 'LG Smart UI, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              },
              color: "#6B7280"
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

      <div className="mt-4 space-y-2 flex-shrink-0">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                style={{ 
                  backgroundColor: item.label === '구글 앱스토어' ? '#10B981' :
                                  item.label === '애플 앱스토어' ? '#4F46E5' :
                                  item.label === '네이버 블로그' ? '#7CF3C4' :
                                  item.label === '네이버 카페' ? '#6B7280' : 
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
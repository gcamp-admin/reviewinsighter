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

const ChannelRadialChart = ({ data }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.map((item) => item.label),
        datasets: data.map((item, index) => ({
          label: item.label,
          data: [item.value, 100 - item.value],
          backgroundColor: [item.color, "#f1f1f1"],
          borderWidth: 0,
          cutout: `${30 + index * 10}%`,
          circumference: 180,
          rotation: 270,
          radius: `${60 + index * 10}%`
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
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

export default ChannelRadialChart;
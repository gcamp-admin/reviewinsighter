import { useQuery } from "@tanstack/react-query";
import type { ReviewFilters } from "@/types";

const getEmoji = (score: number) => {
  if (score >= 4.5) return "😄"; // 매우 만족
  if (score >= 3.5) return "🙂"; // 만족
  if (score >= 2.5) return "😐"; // 보통
  if (score >= 1.5) return "😕"; // 불만족
  return "😠"; // 매우 불만족
};

const getLabel = (score: number) => {
  if (score >= 4.5) return "매우 만족";
  if (score >= 3.5) return "만족";
  if (score >= 2.5) return "보통";
  if (score >= 1.5) return "불만족";
  return "매우 불만족";
};

interface Props {
  filters?: ReviewFilters;
}

export default function AverageRatingCard({ filters }: Props) {
  // Use stats endpoint to get accurate average rating data
  const { data: statsData } = useQuery({
    queryKey: ['/api/reviews/stats', 'average-rating', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo.toISOString());
      }
      if (filters?.service?.id) {
        params.append('serviceId', filters.service.id);
      }
      
      const response = await fetch(`/api/reviews/stats?${params}`);
      return response.json();
    },
    enabled: true
  });

  if (!statsData || statsData.total === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center h-full">
        <p className="text-sm text-gray-500">평균 평점</p>
        <div className="flex items-center justify-center mt-1">
          <p className="text-3xl font-bold text-gray-900 mr-2">-</p>
          <span className="text-3xl">😐</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">데이터 없음</p>
      </div>
    );
  }

  // Use stats data which already provides accurate average rating
  const averageRating = statsData.averageRating || 0;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center h-full">
      <p className="text-sm text-gray-500">평균 평점</p>
      <div className="flex items-center justify-center mt-1">
        <p className="text-3xl font-bold text-gray-900 mr-2">{averageRating.toFixed(1)}</p>
        <span className="text-3xl">{getEmoji(averageRating)}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{getLabel(averageRating)} / 5점 만점</p>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";

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

export default function AverageRatingCard() {
  // Get all reviews to calculate accurate average rating
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews', 'all'],
    queryFn: async () => {
      // Fetch all reviews by requesting a large page size
      const response = await fetch('/api/reviews?limit=10000');
      return response.json();
    },
    enabled: true
  });

  if (!reviewsData?.reviews || reviewsData.reviews.length === 0) {
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

  // Calculate average rating from actual reviews
  const ratingsSum = reviewsData.reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = ratingsSum / reviewsData.reviews.length;

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
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { WordCloudData } from "@/types";

export default function WordCloud() {
  const { data: positiveWords, isLoading: positiveLoading } = useQuery<WordCloudData[]>({
    queryKey: ["/api/wordcloud/positive"],
  });

  const { data: negativeWords, isLoading: negativeLoading } = useQuery<WordCloudData[]>({
    queryKey: ["/api/wordcloud/negative"],
  });

  const getWordSize = (frequency: number, maxFreq: number) => {
    const ratio = frequency / maxFreq;
    if (ratio > 0.8) return "text-2xl font-bold";
    if (ratio > 0.6) return "text-xl font-semibold";
    if (ratio > 0.4) return "text-lg font-medium";
    return "text-sm font-normal";
  };

  const renderWordCloud = (words: WordCloudData[], sentiment: "positive" | "negative") => {
    if (!words || words.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          워드클라우드 데이터가 없습니다.
        </div>
      );
    }

    const maxFreq = Math.max(...words.map(w => w.frequency));
    const colorClass = sentiment === "positive" ? "text-green-600" : "text-red-600";
    const bgClass = sentiment === "positive" ? "bg-green-50" : "bg-red-50";

    return (
      <div className={`${bgClass} p-4 rounded-lg`}>
        <div className="flex flex-wrap gap-2 justify-center">
          {words.map((word) => (
            <span
              key={word.id}
              className={`${getWordSize(word.frequency, maxFreq)} ${colorClass} hover:opacity-80 transition-opacity cursor-pointer`}
              title={`${word.word} (${word.frequency}회 언급)`}
            >
              {word.word}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>감정 워드클라우드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Positive Word Cloud */}
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center">
              <ThumbsUp className="w-4 h-4 mr-2" />
              긍정 리뷰 키워드
            </h4>
            {positiveLoading ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2 justify-center">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16" />
                  ))}
                </div>
              </div>
            ) : (
              renderWordCloud(positiveWords || [], "positive")
            )}
          </div>

          {/* Negative Word Cloud */}
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center">
              <ThumbsDown className="w-4 h-4 mr-2" />
              부정 리뷰 키워드
            </h4>
            {negativeLoading ? (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2 justify-center">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16" />
                  ))}
                </div>
              </div>
            ) : (
              renderWordCloud(negativeWords || [], "negative")
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

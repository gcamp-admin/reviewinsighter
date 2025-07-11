import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import type { WordCloudData, ReviewFilters } from "@/types";
import { Badge } from "@/components/ui/badge";

interface KeywordNetworkProps {
  positiveWords: WordCloudData[];
  negativeWords: WordCloudData[];
  neutralWords: WordCloudData[];
  filters: ReviewFilters;
}

interface NetworkNode {
  id: string;
  word: string;
  frequency: number;
  sentiment: string;
  x: number;
  y: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

interface ClusterInsight {
  cluster: string[];
  theme: string;
  actionPoint: string;
  priority: 'high' | 'medium' | 'low';
}

export default function KeywordNetwork({ positiveWords, negativeWords, neutralWords, filters }: KeywordNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [clusterInsights, setClusterInsights] = useState<ClusterInsight[]>([]);

  // 부정 키워드 중심 네트워크 분석
  const analyzeNegativeKeywordNetwork = (negativeWords: WordCloudData[], positiveWords: WordCloudData[], neutralWords: WordCloudData[]) => {
    const networkNodes: NetworkNode[] = [];
    const networkEdges: NetworkEdge[] = [];
    
    // 1. 부정 키워드 우선 추출 (상위 6개)
    const topNegative = negativeWords.slice(0, 6);
    // 2. 관련성 높은 긍정/중립 키워드 추가 (상위 2개씩)
    const topPositive = positiveWords.slice(0, 2);
    const topNeutral = neutralWords.slice(0, 2);
    
    const allWords = [...topNegative, ...topPositive, ...topNeutral];
    
    allWords.forEach((word, index) => {
      networkNodes.push({
        id: word.word,
        word: word.word,
        frequency: word.frequency,
        sentiment: word.sentiment,
        x: 0,
        y: 0
      });
    });

    // 3. 네트워크 구조 분석 - 부정 키워드 간 연결 우선
    for (let i = 0; i < allWords.length; i++) {
      for (let j = i + 1; j < allWords.length; j++) {
        const word1 = allWords[i];
        const word2 = allWords[j];
        
        let weight = Math.min(word1.frequency, word2.frequency);
        
        // 부정-부정 연결 강화
        if (word1.sentiment === '부정' && word2.sentiment === '부정') {
          weight *= 2.0;
        }
        // 부정-긍정/중립 연결 (대조 분석)
        else if ((word1.sentiment === '부정' && word2.sentiment !== '부정') || 
                 (word1.sentiment !== '부정' && word2.sentiment === '부정')) {
          weight *= 1.2;
        }
        
        if (weight >= 1) {
          networkEdges.push({
            source: word1.word,
            target: word2.word,
            weight: weight
          });
        }
      }
    }

    return { nodes: networkNodes, edges: networkEdges };
  };

  // Force-directed layout 계산
  const calculateLayout = (nodes: NetworkNode[], edges: NetworkEdge[]) => {
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 초기 랜덤 위치 설정
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = 120;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    // 간단한 force simulation
    for (let iteration = 0; iteration < 100; iteration++) {
      // Repulsion force (노드 간 밀어내기)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = 1000 / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            nodes[i].x -= fx;
            nodes[i].y -= fy;
            nodes[j].x += fx;
            nodes[j].y += fy;
          }
        }
      }

      // Attraction force (연결된 노드들 끌어당기기)
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = distance * 0.001 * edge.weight;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            sourceNode.x += fx;
            sourceNode.y += fy;
            targetNode.x -= fx;
            targetNode.y -= fy;
          }
        }
      });

      // 경계 내 유지
      nodes.forEach(node => {
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      });
    }

    return nodes;
  };

  // 4. 클러스터별 인사이트 생성
  const generateClusterInsights = (nodes: NetworkNode[], edges: NetworkEdge[]) => {
    const insights: ClusterInsight[] = [];
    
    // 부정 키워드 클러스터 분석
    const negativeNodes = nodes.filter(n => n.sentiment === '부정');
    const negativeConnections = edges.filter(e => 
      negativeNodes.some(n => n.id === e.source) && 
      negativeNodes.some(n => n.id === e.target)
    );
    
    if (negativeNodes.length >= 2) {
      const negativeCluster = negativeNodes.map(n => n.word);
      let theme = "";
      let actionPoint = "";
      let priority: 'high' | 'medium' | 'low' = 'medium';
      
      // 클러스터 테마 분석
      if (negativeCluster.some(w => ['통화', '전화', '연결'].includes(w))) {
        theme = "통화 기능 문제";
        actionPoint = "통화 연결 안정성 개선 및 VoIP 서버 최적화 필요";
        priority = 'high';
      } else if (negativeCluster.some(w => ['어플', '앱', '기능'].includes(w))) {
        theme = "앱 기능 이슈";
        actionPoint = "핵심 기능 안정성 강화 및 사용성 개선 요구됨";
        priority = 'high';
      } else if (negativeCluster.some(w => ['블루투스', '연결', '호환'].includes(w))) {
        theme = "호환성 문제";
        actionPoint = "외부 기기 연동 호환성 테스트 및 개선 필요";
        priority = 'medium';
      } else {
        theme = "사용자 경험 개선";
        actionPoint = "사용자 피드백 기반 UX 개선 및 기능 최적화";
        priority = 'medium';
      }
      
      insights.push({
        cluster: negativeCluster,
        theme,
        actionPoint,
        priority
      });
    }
    
    // 혼합 클러스터 분석 (부정-긍정 대조)
    const mixedEdges = edges.filter(e => {
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      return sourceNode && targetNode && sourceNode.sentiment !== targetNode.sentiment;
    });
    
    if (mixedEdges.length > 0) {
      insights.push({
        cluster: mixedEdges.map(e => `${e.source}-${e.target}`),
        theme: "감정 대조 분석",
        actionPoint: "긍정 요소 강화하여 부정 요소 상쇄 전략 수립",
        priority: 'medium'
      });
    }
    
    return insights;
  };

  useEffect(() => {
    if (negativeWords.length > 0) {
      const { nodes: networkNodes, edges: networkEdges } = analyzeNegativeKeywordNetwork(
        negativeWords, 
        positiveWords || [], 
        neutralWords || []
      );
      const layoutNodes = calculateLayout(networkNodes, networkEdges);
      const insights = generateClusterInsights(layoutNodes, networkEdges);
      
      setNodes(layoutNodes);
      setEdges(networkEdges);
      setClusterInsights(insights);
    }
  }, [positiveWords, negativeWords, neutralWords]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case '긍정': return '#10B981';
      case '부정': return '#EF4444';
      case '중립': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getNodeSize = (frequency: number, maxFreq: number) => {
    const ratio = frequency / maxFreq;
    return Math.max(15, Math.min(35, 15 + ratio * 20));
  };

  if (nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>키워드 연관성 네트워크</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            키워드 연관성 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxFreq = Math.max(...nodes.map(n => n.frequency));
  const svgWidth = 600;
  const svgHeight = 400;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>키워드 연관성 네트워크</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <svg 
              ref={svgRef}
              width={svgWidth} 
              height={svgHeight} 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="border border-gray-200 rounded-lg bg-white"
            >
              {/* 엣지 그리기 */}
              {edges.map((edge, index) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                // 부정-부정 연결 강조
                const isNegativeConnection = sourceNode.sentiment === '부정' && targetNode.sentiment === '부정';
                
                return (
                  <line
                    key={`edge-${index}`}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isNegativeConnection ? "#EF4444" : "#CBD5E0"}
                    strokeWidth={Math.max(1, edge.weight / 2)}
                    strokeOpacity={isNegativeConnection ? 0.8 : 0.6}
                  />
                );
              })}
              
              {/* 노드 그리기 */}
              {nodes.map((node, index) => {
                const nodeSize = getNodeSize(node.frequency, maxFreq);
                const color = getSentimentColor(node.sentiment);
                
                return (
                  <g key={`node-${index}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeSize}
                      fill={color}
                      fillOpacity={0.8}
                      stroke={color}
                      strokeWidth={2}
                      className="hover:fill-opacity-90 transition-all cursor-pointer"
                    />
                    <text
                      x={node.x}
                      y={node.y - nodeSize - 5}
                      textAnchor="middle"
                      fontSize={12}
                      className="fill-gray-700 font-medium pointer-events-none"
                    >
                      {node.word}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 3}
                      textAnchor="middle"
                      fontSize={10}
                      className="fill-white font-medium pointer-events-none"
                    >
                      {node.frequency}
                    </text>
                  </g>
                );
              })}
              
              {/* 범례 */}
              <g transform="translate(20, 20)">
                <text x={0} y={0} fontSize={12} className="fill-gray-600 font-medium">
                  부정 키워드 중심 분석
                </text>
                <circle cx={0} cy={20} r={8} fill="#10B981" />
                <text x={15} y={25} fontSize={10} className="fill-gray-600">긍정</text>
                <circle cx={60} cy={20} r={8} fill="#EF4444" />
                <text x={75} y={25} fontSize={10} className="fill-gray-600">부정</text>
                <circle cx={120} cy={20} r={8} fill="#6B7280" />
                <text x={135} y={25} fontSize={10} className="fill-gray-600">중립</text>
              </g>
            </svg>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>• 부정 키워드 간 연결 강조 (빨간 선)</p>
            <p>• 노드 크기: 키워드 언급 빈도</p>
            <p>• 연결선 굵기: 키워드 간 연관성 강도</p>
          </div>
        </CardContent>
      </Card>

      {/* 5. 액션포인트 요약 */}
      {clusterInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>클러스터 인사이트 & 액션포인트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clusterInsights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{insight.theme}</h4>
                    <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                      {insight.priority === 'high' ? '높음' : '보통'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>관련 키워드:</strong> {insight.cluster.join(', ')}
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {insight.actionPoint}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import type { WordCloudData, ReviewFilters } from "@/types";

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

export default function KeywordNetwork({ positiveWords, negativeWords, neutralWords, filters }: KeywordNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);

  // 키워드 간 공동 언급 관계를 계산하는 함수
  const calculateCooccurrence = (allWords: WordCloudData[]) => {
    // 실제로는 리뷰 데이터에서 키워드 공동 언급을 분석해야 하지만,
    // 현재는 키워드 빈도를 기반으로 연관성을 추정합니다.
    const networkNodes: NetworkNode[] = [];
    const networkEdges: NetworkEdge[] = [];
    
    // 상위 빈도 키워드만 네트워크에 포함
    const topWords = allWords.slice(0, 8);
    
    topWords.forEach((word, index) => {
      networkNodes.push({
        id: word.word,
        word: word.word,
        frequency: word.frequency,
        sentiment: word.sentiment,
        x: 0,
        y: 0
      });
    });

    // 키워드 간 연결 생성 (빈도 기반 연관성)
    for (let i = 0; i < topWords.length; i++) {
      for (let j = i + 1; j < topWords.length; j++) {
        const word1 = topWords[i];
        const word2 = topWords[j];
        
        // 같은 감정 카테고리의 키워드들은 더 강한 연결을 가짐
        let weight = Math.min(word1.frequency, word2.frequency);
        
        if (word1.sentiment === word2.sentiment) {
          weight *= 1.5; // 같은 감정 카테고리 보너스
        }
        
        // 최소 연결 강도를 가진 경우만 엣지 생성
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

  useEffect(() => {
    const allWords = [...(positiveWords || []), ...(negativeWords || []), ...(neutralWords || [])];
    
    if (allWords.length > 0) {
      const { nodes: networkNodes, edges: networkEdges } = calculateCooccurrence(allWords);
      const layoutNodes = calculateLayout(networkNodes, networkEdges);
      
      setNodes(layoutNodes);
      setEdges(networkEdges);
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
              
              return (
                <line
                  key={`edge-${index}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#CBD5E0"
                  strokeWidth={Math.max(1, edge.weight / 2)}
                  strokeOpacity={0.6}
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
                키워드 연관성
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
          <p>• 노드 크기: 키워드 언급 빈도</p>
          <p>• 연결선 굵기: 키워드 간 연관성 강도</p>
          <p>• 색상: 감정 분류 (긍정, 부정, 중립)</p>
        </div>
      </CardContent>
    </Card>
  );
}
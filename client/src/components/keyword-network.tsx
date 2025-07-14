import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Network, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface KeywordNode {
  id: string;
  label: string;
  size: number;
  frequency: number;
  cluster?: number;
  x?: number;
  y?: number;
}

interface KeywordEdge {
  id: number;
  source: string;
  target: string;
  weight: number;
  pmi: number;
}

interface KeywordCluster {
  id: number;
  keywords: string[];
  size: number;
  label: string;
}

interface KeywordNetworkData {
  nodes: KeywordNode[];
  edges: KeywordEdge[];
  clusters: KeywordCluster[];
  stats?: {
    total_nodes: number;
    total_edges: number;
    total_clusters: number;
  };
}

interface KeywordNetworkProps {
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
  onAnalysisComplete?: (data: KeywordNetworkData) => void;
}

const KeywordNetwork: React.FC<KeywordNetworkProps> = ({
  serviceId = 'ixio',
  dateFrom,
  dateTo,
  onAnalysisComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [networkData, setNetworkData] = useState<KeywordNetworkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const clusterColors = [
    '#7CF3C4', // 브랜드 색상
    '#FF6B6B', // 빨간색
    '#4ECDC4', // 청록색
    '#45B7D1', // 파란색
    '#96CEB4', // 민트색
    '#FFEAA7', // 노란색
    '#DDA0DD', // 보라색
    '#98D8C8', // 연두색
    '#F7DC6F', // 금색
    '#BB8FCE'  // 라벤더색
  ];

  const analyzeKeywordNetwork = async () => {
    if (!dateFrom || !dateTo) {
      setError('날짜 범위를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/keyword-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          dateFrom,
          dateTo,
          method: 'cooccurrence'
        })
      });

      if (!response.ok) {
        throw new Error('키워드 네트워크 분석 실패');
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.message || '분석 중 오류가 발생했습니다.');
        return;
      }

      setNetworkData(data);
      onAnalysisComplete?.(data);
      
      // 캔버스 초기화
      setTimeout(() => {
        initializeCanvas();
      }, 100);

    } catch (err) {
      setError('네트워크 분석 중 오류가 발생했습니다.');
      console.error('Keyword network analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeCanvas = () => {
    if (!canvasRef.current || !networkData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // 노드 위치 초기화 (원형 배치)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;

    networkData.nodes.forEach((node, index) => {
      const angle = (index / networkData.nodes.length) * 2 * Math.PI;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    drawNetwork();
  };

  const drawNetwork = () => {
    if (!canvasRef.current || !networkData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 변환 적용
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 엣지 그리기
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    networkData.edges.forEach(edge => {
      const sourceNode = networkData.nodes.find(n => n.id === edge.source);
      const targetNode = networkData.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();
      }
    });

    // 노드 그리기
    networkData.nodes.forEach(node => {
      if (!node.x || !node.y) return;
      
      const nodeSize = Math.max(8, Math.min(30, node.frequency * 3));
      const clusterColor = clusterColors[node.cluster || 0];
      
      // 노드 원
      ctx.fillStyle = clusterColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // 노드 테두리
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 노드 라벨
      ctx.fillStyle = '#333333';
      ctx.font = '12px "LG Smart UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y + nodeSize + 15);
    });

    ctx.restore();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - rect.left - pan.x, 
      y: e.clientY - rect.top - pan.y 
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newPan = {
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y
    };
    
    setPan(newPan);
    drawNetwork();
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
    setTimeout(drawNetwork, 0);
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
    setTimeout(drawNetwork, 0);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setTimeout(drawNetwork, 0);
  };

  useEffect(() => {
    if (networkData) {
      drawNetwork();
    }
  }, [zoom, pan, networkData]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            키워드 네트워크 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {!networkData && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">
                  리뷰 데이터의 키워드 관계를 네트워크로 시각화합니다.
                </p>
                <Button 
                  onClick={analyzeKeywordNetwork}
                  disabled={loading || !dateFrom || !dateTo}
                  className="bg-[#7CF3C4] hover:bg-[#6CE3B4] text-black font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Network className="mr-2 h-4 w-4" />
                      키워드 네트워크 분석
                    </>
                  )}
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {networkData && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      노드: {networkData.nodes?.length || 0}개 | 
                      엣지: {networkData.edges?.length || 0}개 | 
                      클러스터: {networkData.clusters?.length || 0}개
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReset}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-96 cursor-move"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">키워드 클러스터</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {networkData.clusters.map((cluster, index) => (
                      <div 
                        key={cluster.id}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: clusterColors[index] }}
                          />
                          <span className="font-medium text-sm">{cluster.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cluster.keywords.slice(0, 8).map((keyword, keyIndex) => (
                            <Badge 
                              key={keyIndex} 
                              variant="secondary"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                          {cluster.keywords.length > 8 && (
                            <Badge variant="outline" className="text-xs">
                              +{cluster.keywords.length - 8}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeywordNetwork;
export { KeywordNetwork };
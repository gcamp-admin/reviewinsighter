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

      // 데이터 유효성 검증
      if (!data.nodes || data.nodes.length === 0) {
        setError('분석 가능한 키워드가 부족합니다. 더 많은 리뷰를 수집하거나 다른 날짜 범위를 선택해 주세요.');
        setNetworkData(null);
        return;
      }

      if (!data.edges || data.edges.length === 0) {
        setError('키워드 간 연관성이 부족합니다. 더 많은 리뷰를 수집하거나 다른 날짜 범위를 선택해 주세요.');
        setNetworkData(null);
        return;
      }

      // 백엔드 응답 형식에 맞게 클러스터 데이터 변환
      const transformedData = {
        ...data,
        clusters: (data.clusters || []).map((cluster: any, index: number) => ({
          id: index,
          keywords: Array.isArray(cluster) ? cluster : cluster.keywords || [],
          size: Array.isArray(cluster) ? cluster.length : cluster.keywords?.length || 0,
          label: data.cluster_labels?.[index]?.replace(/"/g, '') || `클러스터 ${index + 1}`
        }))
      };

      setNetworkData(transformedData);
      onAnalysisComplete?.(transformedData);
      
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

  // 컴포넌트 마운트 시 자동으로 분석 실행
  useEffect(() => {
    if (dateFrom && dateTo && !networkData && !loading) {
      analyzeKeywordNetwork();
    }
  }, [dateFrom, dateTo]);

  // 에러 및 빈 데이터 상태 렌더링
  const renderErrorState = () => {
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">⚠️ 분석 중 문제가 발생했습니다</div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            onClick={analyzeKeywordNetwork}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            다시 시도하기
          </Button>
        </div>
      );
    }
    
    if (!loading && !networkData) {
      return (
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
          <div className="text-gray-600 text-lg font-semibold mb-2">📭 키워드 네트워크를 생성할 수 없습니다</div>
          <p className="text-gray-700 mb-4">
            리뷰 수가 부족하거나 키워드 간 연관성이 충분하지 않습니다.<br/>
            더 많은 리뷰를 수집하거나 다른 날짜 범위를 선택해 주세요.
          </p>
          <Button 
            onClick={analyzeKeywordNetwork}
            disabled={loading}
            className="bg-[#7CF3C4] hover:bg-[#6CE3B4] text-black font-medium"
          >
            다시 분석하기
          </Button>
        </div>
      );
    }
    
    return null;
  };

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
            {loading && (
              <div className="text-center py-8">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-lg text-blue-600 font-semibold mb-2">키워드 네트워크 분석 중...</p>
                <p className="text-sm text-gray-600">리뷰에서 키워드 간 관계를 분석하고 있습니다</p>
              </div>
            )}
            
            {!loading && (error || !networkData) && renderErrorState()}
            
            {!loading && !error && networkData && (
              <div className="text-center py-2 mb-4">
                <div className="text-sm text-gray-600">
                  {networkData.stats?.total_nodes || networkData.nodes?.length || 0}개 키워드, {networkData.stats?.total_edges || networkData.edges?.length || 0}개 연결, {networkData.stats?.total_clusters || networkData.clusters?.length || 0}개 클러스터
                </div>
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
                          {(cluster.keywords || []).slice(0, 8).map((keyword, keyIndex) => (
                            <Badge 
                              key={keyIndex} 
                              variant="secondary"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                          {(cluster.keywords || []).length > 8 && (
                            <Badge variant="outline" className="text-xs">
                              +{(cluster.keywords || []).length - 8}
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
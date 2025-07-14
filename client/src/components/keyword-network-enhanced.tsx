import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Network, ZoomIn, ZoomOut, RefreshCw, Info } from 'lucide-react';

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
  message?: string;
}

interface KeywordNetworkProps {
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
  onAnalysisComplete?: (data: KeywordNetworkData) => void;
}

const KeywordNetworkEnhanced: React.FC<KeywordNetworkProps> = ({
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
  const [selectedNode, setSelectedNode] = useState<KeywordNode | null>(null);

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
    setNetworkData(null);

    try {
      console.log('🔍 키워드 네트워크 분석 시작...');
      
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 키워드 네트워크 분석 결과:', data);

      if (data.error) {
        setError(data.message || '분석 중 오류가 발생했습니다.');
        return;
      }

      if (data.message && (!data.nodes || data.nodes.length === 0)) {
        setError(data.message);
        return;
      }

      setNetworkData(data);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
      
      // 시각화 초기화
      setTimeout(() => {
        initializeVisualization(data);
      }, 100);
      
    } catch (err) {
      console.error('키워드 네트워크 분석 오류:', err);
      setError('네트워크 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const initializeVisualization = (data: KeywordNetworkData) => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.nodes || data.nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 클러스터 기반 레이아웃 초기화
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    if (data.clusters.length === 1) {
      // 단일 클러스터: 중심-방사형 배치
      initializeSingleClusterLayout(data, centerX, centerY);
    } else {
      // 다중 클러스터: 클러스터별 그룹 배치
      initializeMultiClusterLayout(data, centerX, centerY);
    }

    // Force simulation 효과 (더 자연스러운 분산)
    for (let i = 0; i < 150; i++) {
      applyForces(data.nodes, data.edges, centerX, centerY);
    }

    drawNetwork();
  };

  const initializeSingleClusterLayout = (data: KeywordNetworkData, centerX: number, centerY: number) => {
    const radius = Math.min(centerX, centerY) * 0.7;
    
    // 중심에 가장 빈도가 높은 노드 배치
    const sortedNodes = [...data.nodes].sort((a, b) => b.frequency - a.frequency);
    
    sortedNodes.forEach((node, index) => {
      if (index === 0) {
        // 중심 노드
        node.x = centerX;
        node.y = centerY;
      } else {
        // 방사형 배치
        const angle = (2 * Math.PI * (index - 1)) / (sortedNodes.length - 1);
        const nodeRadius = radius * (0.4 + Math.random() * 0.4); // 약간의 랜덤성
        node.x = centerX + Math.cos(angle) * nodeRadius;
        node.y = centerY + Math.sin(angle) * nodeRadius;
      }
    });
  };

  const initializeMultiClusterLayout = (data: KeywordNetworkData, centerX: number, centerY: number) => {
    const clusterRadius = Math.min(centerX, centerY) * 0.3;
    const mainRadius = Math.min(centerX, centerY) * 0.6;
    
    data.clusters.forEach((cluster, clusterIndex) => {
      // 클러스터 중심 위치
      const clusterAngle = (2 * Math.PI * clusterIndex) / data.clusters.length;
      const clusterCenterX = centerX + Math.cos(clusterAngle) * mainRadius;
      const clusterCenterY = centerY + Math.sin(clusterAngle) * mainRadius;
      
      // 클러스터 내 노드들 배치
      const clusterNodes = data.nodes.filter(node => node.cluster === cluster.id);
      
      clusterNodes.forEach((node, nodeIndex) => {
        if (nodeIndex === 0) {
          // 클러스터 중심에 가장 중요한 노드
          node.x = clusterCenterX;
          node.y = clusterCenterY;
        } else {
          // 클러스터 내 원형 배치
          const nodeAngle = (2 * Math.PI * (nodeIndex - 1)) / Math.max(1, clusterNodes.length - 1);
          const nodeRadius = clusterRadius * (0.3 + Math.random() * 0.4);
          node.x = clusterCenterX + Math.cos(nodeAngle) * nodeRadius;
          node.y = clusterCenterY + Math.sin(nodeAngle) * nodeRadius;
        }
      });
    });
  };

  const applyForces = (nodes: KeywordNode[], edges: KeywordEdge[], centerX: number, centerY: number) => {
    const repulsion = 2000;
    const attraction = 0.01;
    const centerForce = 0.001;

    // Repulsion between nodes
    nodes.forEach((node1, i) => {
      nodes.forEach((node2, j) => {
        if (i !== j && node1.x && node1.y && node2.x && node2.y) {
          const dx = node1.x - node2.x;
          const dy = node1.y - node2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0 && distance < 100) {
            const force = repulsion / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            node1.x += fx * 0.1;
            node1.y += fy * 0.1;
            node2.x -= fx * 0.1;
            node2.y -= fy * 0.1;
          }
        }
      });
    });

    // Attraction along edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (source && target && source.x && source.y && target.x && target.y) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const force = attraction * edge.weight;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.x += fx;
          source.y += fy;
          target.x -= fx;
          target.y -= fy;
        }
      }
    });

    // Center force
    nodes.forEach(node => {
      if (node.x && node.y) {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.x += dx * centerForce;
        node.y += dy * centerForce;
      }
    });
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas || !networkData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // 변환 적용
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    console.log(`🎨 네트워크 그리기 시작 - 노드:${networkData.nodes.length}, 엣지:${networkData.edges.length}`);

    // 클러스터 배경 그리기
    if (networkData.clusters && networkData.clusters.length > 0) {
      networkData.clusters.forEach(cluster => {
        const clusterNodes = networkData.nodes.filter(n => n.cluster === cluster.id);
        if (clusterNodes.length > 0) {
          drawClusterBackground(ctx, clusterNodes, cluster, clusterColors[cluster.id % clusterColors.length]);
        }
      });
    }

    // 엣지 그리기 (첨부된 이미지 스타일 - 점선)
    networkData.edges.forEach(edge => {
      const source = networkData.nodes.find(n => n.id === edge.source);
      const target = networkData.nodes.find(n => n.id === edge.target);
      
      if (source && target && source.x && source.y && target.x && target.y) {
        ctx.setLineDash([5, 3]); // 점선 스타일
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(120, 120, 120, ${Math.min(edge.weight / 10, 0.6)})`;
        ctx.lineWidth = Math.max(1, edge.weight / 3);
        ctx.stroke();
        ctx.setLineDash([]); // 점선 해제
      }
    });

    // 노드 그리기
    networkData.nodes.forEach(node => {
      if (node.x && node.y) {
        const color = node.cluster !== undefined ? clusterColors[node.cluster % clusterColors.length] : '#7CF3C4';
        
        // 노드 원
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = selectedNode?.id === node.id ? '#333' : '#fff';
        ctx.lineWidth = selectedNode?.id === node.id ? 3 : 2;
        ctx.stroke();
        
        // 노드 라벨
        ctx.fillStyle = '#333';
        ctx.font = `bold ${Math.max(10, node.size / 2)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 텍스트 배경 (가독성 향상)
        const textWidth = ctx.measureText(node.label).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(node.x - textWidth / 2 - 2, node.y - 6, textWidth + 4, 12);
        
        ctx.fillStyle = '#333';
        ctx.fillText(node.label, node.x, node.y);
      }
    });

    // 클러스터 라벨 그리기
    if (networkData.clusters && networkData.clusters.length > 0) {
      networkData.clusters.forEach(cluster => {
        const clusterNodes = networkData.nodes.filter(n => n.cluster === cluster.id);
        if (clusterNodes.length > 0) {
          drawClusterLabel(ctx, clusterNodes, cluster);
        }
      });
    }

    ctx.restore();
    console.log('✅ 네트워크 그리기 완료');
  };

  const drawClusterBackground = (ctx: CanvasRenderingContext2D, nodes: KeywordNode[], cluster: KeywordCluster, color: string) => {
    if (nodes.length === 0) return;

    const positions = nodes.map(n => ({ x: n.x || 0, y: n.y || 0 }));
    
    // 클러스터 중심점 계산
    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
    
    // 클러스터 반지름 계산 (가장 먼 노드까지의 거리 + 여유분)
    const maxDistance = Math.max(...positions.map(p => 
      Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
    ));
    const clusterRadius = maxDistance + 40;

    // 원형 배경 그리기 (첨부된 이미지 스타일)
    ctx.fillStyle = `${color}15`;
    ctx.strokeStyle = `${color}40`;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, clusterRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // 점선 원 추가 (더 시각적으로)
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = `${color}30`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, clusterRadius + 15, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawClusterLabel = (ctx: CanvasRenderingContext2D, nodes: KeywordNode[], cluster: KeywordCluster) => {
    if (nodes.length === 0) return;

    const positions = nodes.map(n => ({ x: n.x || 0, y: n.y || 0 }));
    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

    // 클러스터 상단에 라벨 위치 (첨부된 이미지 스타일)
    const maxDistance = Math.max(...positions.map(p => 
      Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
    ));
    const labelY = centerY - maxDistance - 30;

    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 라벨 배경 (더 세련된 스타일)
    const textWidth = ctx.measureText(cluster.label).width;
    const bgWidth = textWidth + 16;
    const bgHeight = 28;
    
    // 배경 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(centerX - bgWidth / 2 + 2, labelY - bgHeight / 2 + 2, bgWidth, bgHeight);
    
    // 배경
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(centerX - bgWidth / 2, labelY - bgHeight / 2, bgWidth, bgHeight);
    
    // 테두리
    ctx.strokeStyle = clusterColors[cluster.id % clusterColors.length];
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - bgWidth / 2, labelY - bgHeight / 2, bgWidth, bgHeight);
    
    // 텍스트
    ctx.fillStyle = '#2c3e50';
    ctx.fillText(cluster.label, centerX, labelY);
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!networkData || isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    // 클릭된 노드 찾기
    const clickedNode = networkData.nodes.find(node => {
      if (!node.x || !node.y) return false;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  useEffect(() => {
    if (networkData) {
      drawNetwork();
    }
  }, [zoom, pan, networkData, selectedNode]);

  // 자동 분석 실행
  useEffect(() => {
    if (dateFrom && dateTo && !networkData && !loading) {
      analyzeKeywordNetwork();
    }
  }, [dateFrom, dateTo]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            키워드 네트워크 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">키워드 관계를 분석하고 있습니다...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            키워드 네트워크 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
            <div className="text-yellow-600 text-lg font-semibold mb-2">
              <Info className="w-5 h-5 inline mr-2" />
              분석 결과
            </div>
            <p className="text-yellow-700 mb-4">{error}</p>
            <div className="text-sm text-yellow-600">
              <p>• 클러스터가 1개만 나오는 것은 정상적인 상황입니다</p>
              <p>• 리뷰가 비슷한 주제에 집중되어 있을 때 발생합니다</p>
              <p>• 더 다양한 데이터를 수집하거나 날짜 범위를 넓혀보세요</p>
            </div>
            <Button 
              onClick={analyzeKeywordNetwork}
              className="mt-4"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 분석하기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            키워드 네트워크 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
            <div className="text-blue-600 text-lg font-semibold mb-2">분석 준비</div>
            <p className="text-blue-700 mb-4">날짜 범위를 선택하고 리뷰를 수집한 후 분석을 시작하세요.</p>
            <Button 
              onClick={analyzeKeywordNetwork}
              disabled={!dateFrom || !dateTo || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Network className="w-4 h-4 mr-2" />
              키워드 네트워크 분석 시작
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          키워드 네트워크 분석
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>노드: {networkData.stats?.total_nodes || 0}개</span>
          <span>관계: {networkData.stats?.total_edges || 0}개</span>
          <span>클러스터: {networkData.stats?.total_clusters || 0}개</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 컨트롤 패널 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.3}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground ml-2">
              확대: {(zoom * 100).toFixed(0)}%
            </span>
          </div>

          {/* 클러스터 범례 */}
          {networkData.clusters && networkData.clusters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {networkData.clusters.map(cluster => (
                <Badge
                  key={cluster.id}
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: `${clusterColors[cluster.id % clusterColors.length]}40` }}
                >
                  {cluster.label} ({cluster.size})
                </Badge>
              ))}
            </div>
          )}

          {/* 네트워크 시각화 */}
          <div className="relative border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-96 cursor-pointer"
              onClick={handleCanvasClick}
            />
            
            {/* 선택된 노드 정보 */}
            {selectedNode && (
              <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
                <div className="font-semibold text-sm">{selectedNode.label}</div>
                <div className="text-xs text-muted-foreground">
                  빈도: {selectedNode.frequency}회
                </div>
                {selectedNode.cluster !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    클러스터: {networkData.clusters?.find(c => c.id === selectedNode.cluster)?.label}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 도움말 */}
          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
            <p>• 노드 크기 = 키워드 빈도, 선 굵기 = 관계 강도</p>
            <p>• 같은 색상의 노드들은 관련 있는 키워드 그룹입니다</p>
            <p>• 노드를 클릭하면 상세 정보를 확인할 수 있습니다</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeywordNetworkEnhanced;
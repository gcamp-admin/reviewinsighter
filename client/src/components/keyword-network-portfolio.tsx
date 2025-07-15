import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Node {
  id: string;
  label: string;
  size: number;
  frequency: number;
  cluster: number;
  color: string;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  width: number;
}

interface Cluster {
  id: number;
  name: string;
  color: string;
  keywords: string[];
  keyword_count: number;
}

interface KeywordNetworkData {
  nodes: Node[];
  edges: Edge[];
  clusters: Cluster[];
  stats: {
    total_nodes: number;
    total_edges: number;
    total_clusters: number;
    analysis_type: string;
  };
}

interface KeywordNetworkPortfolioProps {
  serviceId: string;
  dateFrom?: string;
  dateTo?: string;
}

export default function KeywordNetworkPortfolio({ serviceId, dateFrom, dateTo }: KeywordNetworkPortfolioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const { data: networkData, isLoading, error } = useQuery<KeywordNetworkData>({
    queryKey: ['keyword-network', serviceId, dateFrom, dateTo],
    queryFn: async () => {
      console.log('🔍 키워드 네트워크 분석 요청:', { serviceId, dateFrom, dateTo });
      
      const params = new URLSearchParams({
        serviceId,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      });
      
      const response = await fetch(`/api/keyword-network`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          ...(dateFrom && { dateFrom }),
          ...(dateTo && { dateTo })
        })
      });
      
      console.log('📊 키워드 네트워크 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 키워드 네트워크 분석 실패:', errorText);
        throw new Error('키워드 네트워크 분석 실패');
      }
      
      const data = await response.json();
      console.log('📊 키워드 네트워크 분석 결과:', data);
      return data;
    },
    enabled: !!serviceId,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const drawNetwork = () => {
    if (!networkData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 배경 그리기
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 그리드 패턴 배경
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    const gridSize = 30;
    
    for (let x = 0; x <= rect.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // 클러스터별 원형 영역 그리기
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clusterRadius = Math.min(rect.width, rect.height) * 0.15;
    
    networkData.clusters.forEach((cluster, index) => {
      const angle = (index * 2 * Math.PI) / networkData.clusters.length;
      const clusterX = centerX + Math.cos(angle) * clusterRadius * 1.5;
      const clusterY = centerY + Math.sin(angle) * clusterRadius * 1.5;
      
      // 클러스터 배경 원 그리기
      ctx.fillStyle = cluster.color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(clusterX, clusterY, clusterRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // 클러스터 테두리
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = cluster.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 클러스터 라벨 (상단에 태그 형태)
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cluster.name, clusterX, clusterY - clusterRadius - 15);
      
      // 클러스터 내 키워드 배치
      const keywords = networkData.nodes.filter(node => node.cluster === cluster.id);
      keywords.forEach((keyword, keywordIndex) => {
        const keywordAngle = (keywordIndex * 2 * Math.PI) / keywords.length;
        const keywordDistance = clusterRadius * 0.6;
        const keywordX = clusterX + Math.cos(keywordAngle) * keywordDistance;
        const keywordY = clusterY + Math.sin(keywordAngle) * keywordDistance;
        
        // 키워드 노드 그리기
        ctx.fillStyle = selectedNode === keyword.id ? '#3b82f6' : '#64748b';
        ctx.beginPath();
        ctx.arc(keywordX, keywordY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // 키워드 텍스트
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(keyword.label, keywordX, keywordY + 20);
        
        // 빈도수 표시
        ctx.fillStyle = '#64748b';
        ctx.font = '10px "Noto Sans KR", sans-serif';
        ctx.fillText(`(${keyword.frequency})`, keywordX, keywordY + 32);
      });
    });

    // 엣지 그리기 (클러스터 간 연결)
    ctx.globalAlpha = 0.4;
    networkData.edges.forEach(edge => {
      const sourceNode = networkData.nodes.find(n => n.id === edge.source);
      const targetNode = networkData.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const sourceCluster = networkData.clusters.find(c => c.id === sourceNode.cluster);
        const targetCluster = networkData.clusters.find(c => c.id === targetNode.cluster);
        
        if (sourceCluster && targetCluster && sourceCluster.id !== targetCluster.id) {
          // 클러스터 간 연결선 그리기
          const sourceAngle = (sourceCluster.id * 2 * Math.PI) / networkData.clusters.length;
          const targetAngle = (targetCluster.id * 2 * Math.PI) / networkData.clusters.length;
          
          const sourceX = centerX + Math.cos(sourceAngle) * clusterRadius * 1.5;
          const sourceY = centerY + Math.sin(sourceAngle) * clusterRadius * 1.5;
          const targetX = centerX + Math.cos(targetAngle) * clusterRadius * 1.5;
          const targetY = centerY + Math.sin(targetAngle) * clusterRadius * 1.5;
          
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = edge.width;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(sourceX, sourceY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  };

  useEffect(() => {
    drawNetwork();
  }, [networkData, selectedNode, zoom, pan]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-600 font-medium">🔍 키워드 네트워크 분석 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600 font-medium">키워드 네트워크 분석 실패</p>
            <p className="text-gray-500 text-sm mt-1">부정 리뷰가 부족하거나 분석할 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
    console.log('⚠️ 키워드 네트워크 데이터 없음:', networkData);
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-gray-400 text-2xl mb-2">📊</div>
            <p className="text-gray-600 font-medium">분석할 부정 리뷰가 없습니다</p>
            <p className="text-gray-500 text-sm mt-1">선택한 기간에 부정 리뷰가 충분하지 않습니다.</p>
            {networkData && (
              <div className="mt-2 text-xs text-gray-400">
                디버그: {JSON.stringify(networkData.stats || {}, null, 2)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              🎯 부정 리뷰 키워드 네트워크 분석
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              UX 문제 유형별 키워드 클러스터링 ({networkData.stats.total_clusters}개 클러스터)
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              키워드 {networkData.stats.total_nodes}개 • 연결 {networkData.stats.total_edges}개
            </div>
          </div>
        </div>
      </div>

      {/* 네트워크 시각화 */}
      <div className="p-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-96 border border-gray-200 rounded-lg cursor-pointer"
            onClick={(e) => {
              // 클릭 이벤트 처리 (추후 구현)
            }}
          />
        </div>
      </div>

      {/* 클러스터 범례 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-3">UX 문제 유형 클러스터</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {networkData.clusters.map((cluster) => (
            <div key={cluster.id} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full border-2"
                style={{ backgroundColor: cluster.color, borderColor: cluster.color }}
              />
              <span className="text-sm font-medium text-gray-700">{cluster.name}</span>
              <span className="text-xs text-gray-500">({cluster.keyword_count}개)</span>
            </div>
          ))}
        </div>
      </div>

      {/* 분석 통계 */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          ✨ 부정 리뷰에서 상위 20개 키워드를 추출하여 UX 전문가 관점에서 클러스터링한 결과입니다.
        </div>
      </div>
    </div>
  );
}
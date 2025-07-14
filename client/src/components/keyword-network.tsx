import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface KeywordNode {
  id: string;
  text: string;
  sentiment: string;
  frequency: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface KeywordLink {
  source: string;
  target: string;
  strength: number;
}

interface KeywordNetworkProps {
  serviceId: string;
  className?: string;
}

export function KeywordNetwork({ serviceId, className = "" }: KeywordNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<KeywordNode[]>([]);
  const [links, setLinks] = useState<KeywordLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const animationRef = useRef<number>();

  useEffect(() => {
    const fetchKeywordNetwork = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/keyword-network/${serviceId}`);
        if (response.ok) {
          const data = await response.json();
          setNodes(data.nodes || []);
          setLinks(data.links || []);
        }
      } catch (error) {
        console.error('Error fetching keyword network:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      fetchKeywordNetwork();
    }
  }, [serviceId]);

  useEffect(() => {
    if (!nodes.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Initialize node positions if not set
    const workingNodes = nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * width,
      y: node.y || Math.random() * height,
      vx: node.vx || 0,
      vy: node.vy || 0
    }));

    // Simple force simulation
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Apply forces
      workingNodes.forEach(node => {
        // Center force
        const centerX = width / 2;
        const centerY = height / 2;
        const dx = centerX - node.x!;
        const dy = centerY - node.y!;
        node.vx! += dx * 0.001;
        node.vy! += dy * 0.001;

        // Repulsion between nodes
        workingNodes.forEach(other => {
          if (node !== other) {
            const dx = node.x! - other.x!;
            const dy = node.y! - other.y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
              const force = 50 / distance;
              node.vx! += dx * force * 0.01;
              node.vy! += dy * force * 0.01;
            }
          }
        });

        // Apply velocity
        node.x! += node.vx!;
        node.y! += node.vy!;

        // Friction
        node.vx! *= 0.9;
        node.vy! *= 0.9;

        // Boundary
        if (node.x! < 20) node.x! = 20;
        if (node.x! > width - 20) node.x! = width - 20;
        if (node.y! < 20) node.y! = 20;
        if (node.y! > height - 20) node.y! = height - 20;
      });

      // Draw links
      links.forEach(link => {
        const sourceNode = workingNodes.find(n => n.id === link.source);
        const targetNode = workingNodes.find(n => n.id === link.target);
        
        if (sourceNode && targetNode) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x!, sourceNode.y!);
          ctx.lineTo(targetNode.x!, targetNode.y!);
          ctx.strokeStyle = `rgba(148, 163, 184, ${link.strength})`;
          ctx.lineWidth = Math.max(1, link.strength * 3);
          ctx.stroke();
        }
      });

      // Draw nodes
      workingNodes.forEach(node => {
        const radius = Math.max(15, Math.sqrt(node.frequency) * 3);
        
        // Node circle
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
        
        // Color based on sentiment
        if (node.sentiment === '긍정') {
          ctx.fillStyle = '#10b981';
        } else if (node.sentiment === '부정') {
          ctx.fillStyle = '#ef4444';
        } else {
          ctx.fillStyle = '#6b7280';
        }
        
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(10, radius * 0.6)}px "LG Smart UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.text, node.x!, node.y!);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, links]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">키워드 관계 네트워크</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">네트워크 분석 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nodes.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">키워드 관계 네트워크</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-500">
            분석할 키워드가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">키워드 관계 네트워크</CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            긍정
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            부정
          </Badge>
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            중립
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-96 border border-gray-200 rounded-lg"
            style={{ touchAction: 'none' }}
          />
          <div className="mt-4 text-sm text-gray-600">
            • 원의 크기는 언급 빈도를 나타냅니다
            • 선의 굵기는 키워드 간 연관성을 나타냅니다
            • 색상은 감정 분류를 나타냅니다
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
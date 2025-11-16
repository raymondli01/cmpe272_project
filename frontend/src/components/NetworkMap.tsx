import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface Node {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  pressure: number | null;
}

interface Edge {
  id: string;
  name: string;
  status: string;
  from_node_id: string;
  to_node_id: string;
  has_acknowledged_incidents?: boolean;
}

interface NetworkMapProps {
  center: [number, number];
  nodes: Node[] | undefined;
  edges: Edge[] | undefined;
  isolatedEdges: Set<string>;
  getNodePosition: (nodeId: string) => [number, number] | null;
  getEdgeColor: (edge: Edge) => string;
}

let Leaflet: any = null;

const NetworkMap = ({ center, nodes, edges, isolatedEdges, getNodePosition, getEdgeColor }: NetworkMapProps) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polylinesRef = useRef<Map<string, any>>(new Map());
  const [L, setL] = useState<any>(null);

  // Load Leaflet once on client side
  useEffect(() => {
    if (typeof window === 'undefined' || Leaflet) {
      if (Leaflet) setL(Leaflet);
      return;
    }

    import('leaflet').then((leafletModule) => {
      Leaflet = leafletModule.default;
      setL(Leaflet);
    });
  }, []);

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 16,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [L, center]);

  // Update map center if it changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom());
    }
  }, [center]);

  // Update nodes
  useEffect(() => {
    if (!L || !mapRef.current || !nodes) return;

    // Remove old markers
    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add new markers
    nodes.forEach((node) => {
      const color = node.type === 'tank' ? '#22c55e' : 
                   node.type === 'reservoir' ? '#0ea5e9' : '#f59e0b';
      
      const circle = L.circle([node.x, node.y], {
        radius: 20,
        fillColor: color,
        fillOpacity: 0.8,
        color: '#fff',
        weight: 2,
      });

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2';
      popupContent.innerHTML = `
        <p class="font-semibold">${node.name}</p>
        <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold mt-1">${node.type}</span>
        ${node.pressure ? `<p class="text-sm mt-2">Pressure: ${node.pressure.toFixed(1)} psi</p>` : ''}
      `;
      
      circle.bindPopup(popupContent);
      circle.addTo(mapRef.current!);
      markersRef.current.set(node.id, circle);
    });
  }, [L, nodes]);

  // Update edges
  useEffect(() => {
    if (!L || !mapRef.current || !edges) return;

    // Remove old polylines
    polylinesRef.current.forEach((polyline) => {
      mapRef.current?.removeLayer(polyline);
    });
    polylinesRef.current.clear();

    // Add new polylines
    edges.forEach((edge) => {
      const from = getNodePosition(edge.from_node_id);
      const to = getNodePosition(edge.to_node_id);
      if (!from || !to) return;

      const color = getEdgeColor(edge);
      // Use dashed line for isolated edges or acknowledged incidents
      const edgeData = edge as any; // Has additional fields from topology API
      const dashArray = (edge.status === 'isolated' || edgeData.has_acknowledged_incidents) ? '10, 10' : undefined;

      const polyline = L.polyline([from, to], {
        color,
        weight: 4,
        opacity: 0.8,
        dashArray,
      });

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2';
      popupContent.innerHTML = `
        <p class="font-semibold">${edge.name}</p>
        <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold mt-1">${edge.status}</span>
      `;
      
      polyline.bindPopup(popupContent);
      polyline.addTo(mapRef.current!);
      polylinesRef.current.set(edge.id, polyline);
    });
  }, [L, edges, isolatedEdges, getNodePosition, getEdgeColor]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default NetworkMap;

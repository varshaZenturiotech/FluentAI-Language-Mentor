import React, { Suspense, Component, ReactNode, ErrorInfo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MentorModel, MentorCharacterState, DEFAULT_MODEL_URL } from './MentorModel';

export type { MentorCharacterState };

export interface MentorCharacterProps {
  /** Current visual state of the mentor: 'idle' | 'listening' | 'thinking' | 'speaking' */
  state?: MentorCharacterState;
  /** Scale factor for the 3D model (default: 1) */
  scale?: number;
  /** Custom CSS classes for the container element */
  className?: string;
  /** Custom 3D camera position [X, Y, Z] (default: [0, 0, 2.7]) */
  cameraPosition?: [number, number, number];
  /** Enable OrbitControls for development inspection (default: false) */
  enableControls?: boolean;
  /** Custom GLB model path/URL (default: '/models/fluentai-mentor.glb') */
  modelUrl?: string;
  /** Show visual state badge indicator in overlay (default: true) */
  showStateBadge?: boolean;
}

/**
 * Error boundary component to handle WebGL / model loading errors gracefully
 * without breaking the rest of the application layout.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class Mentor3DErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[MentorCharacter 3D Error]:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-center backdrop-blur-sm">
            <div className="w-12 h-12 mb-2 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              🤖
            </div>
            <p className="text-sm font-semibold text-slate-300">AI Mentor unavailable</p>
            <p className="text-xs text-slate-500 mt-1">3D view fallback mode active</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

/**
 * Loading fallback view shown while the GLB model is downloading/parsing.
 */
const ModelLoadingFallback: React.FC = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-sm z-10 rounded-2xl">
    <div className="relative flex items-center justify-center mb-3">
      <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <div className="absolute text-xs">✨</div>
    </div>
    <span className="text-xs font-medium text-slate-300 tracking-wide animate-pulse">
      Preparing your AI mentor...
    </span>
  </div>
);

/**
 * Visual status badge overlay displaying the active character state.
 */
const StateBadge: React.FC<{ state: MentorCharacterState }> = ({ state }) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'listening':
        return {
          label: 'AI Listening...',
          dotClass: 'bg-blue-500 animate-ping',
          containerClass: 'bg-blue-950/70 text-blue-300 border-blue-800/50',
        };
      case 'thinking':
        return {
          label: 'AI Thinking...',
          dotClass: 'bg-purple-500 animate-pulse',
          containerClass: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
        };
      case 'speaking':
        return {
          label: 'AI Speaking...',
          dotClass: 'bg-emerald-500 animate-bounce',
          containerClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50',
        };
      case 'idle':
      default:
        return {
          label: 'FluentAI Mentor',
          dotClass: 'bg-indigo-500',
          containerClass: 'bg-slate-900/70 text-slate-300 border-slate-800/50',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div
      className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all duration-300 flex items-center space-x-2 z-10 shadow-lg ${config.containerClass}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
      {state === 'speaking' && (
        <span className="flex items-center space-x-0.5 ml-1">
          <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
          <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-75" />
          <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-150" />
        </span>
      )}
    </div>
  );
};

/**
 * Reusable 3D Mentor Character Component.
 *
 * Renders the FluentAI 3D mentor character inside a WebGL Canvas with
 * professional lighting, procedural micro-animations for idle/listening/thinking/speaking
 * states, loading states, and fallback error handling.
 */
export const MentorCharacter: React.FC<MentorCharacterProps> = ({
  state = 'idle',
  scale = 1.0,
  className = 'w-full h-80',
  cameraPosition = [0, 0, 2.9],
  enableControls = false,
  modelUrl = DEFAULT_MODEL_URL,
  showStateBadge = true,
}) => {
  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      role="img"
      aria-label="FluentAI 3D AI Mentor Character"
      title="FluentAI AI Mentor"
    >
      <Mentor3DErrorBoundary>
        <Suspense fallback={<ModelLoadingFallback />}>
          <Canvas
            camera={{ position: cameraPosition, fov: 45 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            className="w-full h-full"
          >
            {/* Lighting Setup */}
            <ambientLight intensity={1.2} />
            <directionalLight position={[5, 8, 5]} intensity={1.8} castShadow />
            <directionalLight position={[-5, 3, -5]} intensity={0.8} />
            <pointLight position={[0, 4, -4]} intensity={0.6} color="#a5b4fc" />

            {/* 3D Character Model */}
            <MentorModel state={state} scale={scale} modelUrl={modelUrl} />

            {/* Optional Orbit Controls for inspection during development */}
            {enableControls && <OrbitControls enableZoom={true} enablePan={true} />}
          </Canvas>
        </Suspense>
      </Mentor3DErrorBoundary>

      {/* State Status Badge */}
      {showStateBadge && <StateBadge state={state} />}
    </div>
  );
};

export default MentorCharacter;

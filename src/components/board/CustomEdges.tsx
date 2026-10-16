'use client';

import * as React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export function ThreadEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g className="cursor-pointer">
      {/* Background glow path */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={6}
        className="stroke-thread/30 fill-none pointer-events-none transition-all duration-300"
      />
      {/* Red thread main line */}
      <BaseEdge
        id={id}
        path={edgePath}
        className="stroke-thread stroke-2 fill-none transition-all duration-300 animate-in fade-in"
      />
    </g>
  );
}

export function ImpossibleEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g className="cursor-pointer">
      <BaseEdge
        id={id}
        path={edgePath}
        className="stroke-status-impossible stroke-2 fill-none stroke-dash-2 transition-all duration-300"
      />
    </g>
  );
}

export function RehearsedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g className="cursor-pointer">
      <BaseEdge
        id={id}
        path={edgePath}
        className="stroke-brass stroke-2 fill-none transition-all duration-300"
      />
    </g>
  );
}

export function InspectorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g className="cursor-pointer">
      <BaseEdge
        id={id}
        path={edgePath}
        className="stroke-inspector stroke-2 fill-none transition-all duration-300"
      />
    </g>
  );
}

export function SupportEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g className="cursor-pointer">
      <BaseEdge
        id={id}
        path={edgePath}
        className="stroke-border-strong stroke-1 fill-none transition-all duration-300"
      />
    </g>
  );
}

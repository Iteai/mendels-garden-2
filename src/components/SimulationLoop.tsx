import React, { useEffect, useRef, useCallback } from 'react';
import { useGardenActions, useAppStore } from '../store';
import { GAME } from '../constants/theme';
import type { SimulationEvent } from '../simulation';

export function SimulationLoop() {
  const { tickSimulation, setLastSimulatedAt } = useGardenActions();
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(simulationSpeed);

  useEffect(() => { speedRef.current = simulationSpeed; }, [simulationSpeed]);

  const runTick = useCallback(() => {
    const events: SimulationEvent[] = tickSimulation(speedRef.current);
    setLastSimulatedAt(Date.now());
    if (__DEV__ && events.length > 0) console.log(`[Sim] ${events.length} events`);
  }, [tickSimulation, setLastSimulatedAt]);

  useEffect(() => {
    intervalRef.current = setInterval(runTick, GAME.SIMULATION_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [runTick]);

  return null;
}
'use client';

import { useState, useMemo } from 'react';
import { calculateROI } from '@/lib/roi';

interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  suffix?: string;
}

const sliders: SliderConfig[] = [
  {
    id: 'legalEntities',
    label: 'Legal entities',
    min: 1,
    max: 50,
    step: 1,
    defaultValue: 5,
  },
  {
    id: 'consultants',
    label: 'Consultants',
    min: 5,
    max: 200,
    step: 5,
    defaultValue: 40,
  },
  {
    id: 'migrationWaves',
    label: 'Migration waves',
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 3,
  },
  {
    id: 'automationCoverage',
    label: 'Automation coverage',
    min: 20,
    max: 95,
    step: 5,
    defaultValue: 70,
    suffix: '%',
  },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function ROICalculator() {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const s of sliders) {
      initial[s.id] = s.defaultValue;
    }
    return initial;
  });

  const result = useMemo(
    () =>
      calculateROI({
        entities: values.legalEntities,
        consultants: values.consultants,
        waves: values.migrationWaves,
        automationCoverage: values.automationCoverage,
      }),
    [values],
  );

  function handleChange(id: string, value: number) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Sliders */}
      <div className="flex flex-col gap-6">
        {sliders.map((slider) => (
          <div key={slider.id}>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor={slider.id}
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {slider.label}
              </label>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {values[slider.id]}
                {slider.suffix ?? ''}
              </span>
            </div>
            <input
              id={slider.id}
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={values[slider.id]}
              onChange={(e) => handleChange(slider.id, Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-brand) ${
                  ((values[slider.id] - slider.min) / (slider.max - slider.min)) * 100
                }%, var(--color-border) ${
                  ((values[slider.id] - slider.min) / (slider.max - slider.min)) * 100
                }%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {slider.min}
                {slider.suffix ?? ''}
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {slider.max}
                {slider.suffix ?? ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <div
        className="rounded-xl border border-[var(--color-border)] p-6 lg:p-8 flex flex-col justify-center gap-6"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h3
          className="text-lg font-semibold m-0"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Estimated savings
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-wider m-0 mb-1"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Baseline duration
            </p>
            <p
              className="text-2xl font-bold m-0 tabular-nums"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {result.baselineMonths}{' '}
              <span className="text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>
                months
              </span>
            </p>
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-wider m-0 mb-1"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Automated duration
            </p>
            <p
              className="text-2xl font-bold m-0 tabular-nums"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {result.automatedMonths}{' '}
              <span className="text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>
                months
              </span>
            </p>
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-wider m-0 mb-1"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Months saved
            </p>
            <p
              className="text-2xl font-bold m-0 tabular-nums"
              style={{ color: 'var(--color-success)' }}
            >
              {result.monthsSaved}
            </p>
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-wider m-0 mb-1"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Cost savings
            </p>
            <p
              className="text-2xl font-bold m-0 tabular-nums"
              style={{ color: 'var(--color-success)' }}
            >
              {currencyFormatter.format(result.costSaved)}
            </p>
          </div>
        </div>

        <p
          className="text-xs m-0 leading-relaxed"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Estimates based on industry averages at $18,000/month blended consultant rate.
          Actual results vary by system complexity and team readiness.
        </p>
      </div>
    </div>
  );
}

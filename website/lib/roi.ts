export interface ROIInputs {
  entities: number;
  consultants: number;
  waves: number;
  automationCoverage: number;
}

export interface ROIResult {
  baselineMonths: number;
  automatedMonths: number;
  monthsSaved: number;
  percentReduction: number;
  costSaved: number;
}

export function calculateROI(inputs: ROIInputs): ROIResult {
  const { entities, consultants, waves, automationCoverage } = inputs;
  const baselineMonths = Math.round(
    Math.min(18, Math.max(6, entities * 0.08 + consultants * 0.05 + waves * 1.4))
  );
  const automatedMonths = Math.round(
    baselineMonths * (1 - (automationCoverage / 100) * 0.55)
  );
  const monthsSaved = baselineMonths - automatedMonths;
  const percentReduction = Math.round((monthsSaved / baselineMonths) * 100);
  const costSaved = monthsSaved * consultants * 18000;
  return { baselineMonths, automatedMonths, monthsSaved, percentReduction, costSaved };
}

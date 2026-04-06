export interface Query {
  query: string;
  should_trigger: boolean;
}

export function splitQueries(
  queries: Query[],
  trainRatio = 0.6
): { train: Query[]; validation: Query[] } {
  const shuffled = [...queries].sort(() => Math.random() - 0.5);
  const trainSize = Math.round(shuffled.length * trainRatio);
  return {
    train: shuffled.slice(0, trainSize),
    validation: shuffled.slice(trainSize),
  };
}

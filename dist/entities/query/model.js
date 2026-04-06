export function splitQueries(queries, trainRatio = 0.6) {
    const shuffled = [...queries].sort(() => Math.random() - 0.5);
    const trainSize = Math.round(shuffled.length * trainRatio);
    return {
        train: shuffled.slice(0, trainSize),
        validation: shuffled.slice(trainSize),
    };
}

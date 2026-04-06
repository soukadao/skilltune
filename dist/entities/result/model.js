export function summarize(results) {
    const passed = results.filter((r) => r.passed).length;
    return {
        results,
        pass_rate: results.length === 0 ? 0 : passed / results.length,
        total: results.length,
        passed,
    };
}

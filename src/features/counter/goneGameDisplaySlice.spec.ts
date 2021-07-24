import counterReducer from "./goneGameDisplaySlice";

describe("counter reducer", () => {
  it("should handle initial state", () => {
    expect(counterReducer(undefined, { type: "unknown" })).toEqual({
      simulationIsRunning: true,
      currentTime: 0,
      images: [],
      generationParams: {
        timeBetweenDisappearances: { min: 100, mean: 900, std: 1000 },
        fadeInTime: { min: 400, mean: 600, std: 200 },
        opaqueTime: { min: 0, mean: 200, std: 200 },
      },
    });
  });
});

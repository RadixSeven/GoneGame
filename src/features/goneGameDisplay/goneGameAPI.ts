// A mock function to mimic making an async request for data
import * as R from "ramda";

/**
 * Return the parameters mu and sigma to be passed to exp(normal_sample(mu, sigma)) to generate a sample
 * from a lognormal distribution with mean mean and standard deviation std
 *
 * To avoid customer-visible crashes, logs problem parameters to the console and chooses some sane
 * value for the inputs if the inputs are bad.
 *
 * @param mean The mean of a lognormal distribution using the returned parameters (must be > 0)
 * @param std The standard deviation of a lognormal distribution using the returned parameters (must be > 0)
 */
function normalParamsForLogNormalAfterTransformation(
  mean: number,
  std: number
) {
  //console.log(`normalParamsForLogNormalAfterTransformation(${mean}, ${std})`)
  if (mean <= 0) {
    console.error(
      `Using 1 to substitute for an illegal mean value for lognormal: ${mean}`
    );
    mean = 1;
  }
  if (std <= 0) {
    console.error(
      `Using 1 to substitute for an illegal standard deviation value for lognormal: ${std}`
    );
    std = 1;
  }
  const rescale = 1 + (std / mean) ** 2;
  const mu_log = Math.log(mean / Math.sqrt(rescale));
  const sigma_log = Math.sqrt(Math.log(rescale));
  return { mu: mu_log, sigma: sigma_log };
}

/**
 * Chance random number generator (so I don't need to reinvent Gaussian)
 */
const Chance = require("chance");

/**
 * Random number generator instance
 */
const chance = new Chance();

/**
 * Return a random horizontal position that makes an image of width imageWidth
 * overlap an already fixed image of width imageWidth whose x coordinate is imageX
 * within a viewport that is maxX pixels wide.
 *
 * @param imageX The upper left pixel x coordinate of the image that has already been placed
 * @param imageWidth The width of the two images that should overlap
 * @param maxX Maximum x value in the viewport
 */
export function randomOverlappingPosition(
  imageX: number,
  imageWidth: number,
  maxX: number
) {
  const maxImageX = R.max(0, maxX - imageWidth); // Images bigger than viewport are always at position 0
  return chance.integer({
    min: R.max(0, imageX - imageWidth / 2),
    max: R.min(maxImageX, imageX + imageWidth / 2),
  });
}

/**
 * Return a sample from a lognormal distribution whose mean is mean and whose standard deviation is std
 * @param mean The mean of the distribution to sample from
 * @param std The standard deviation of the distribution to sample from
 */
export function lognormal_sample(mean: number, std: number) {
  const { mu, sigma } = normalParamsForLogNormalAfterTransformation(mean, std);
  //console.log(`Params passed to chance. mu: ${mu}, sigma: ${sigma}`);
  const normal_sample = chance.normal({ mean: mu, dev: sigma });
  //console.log(`Chance return ${normal_sample}`);
  return Math.exp(normal_sample);
}

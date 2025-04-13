import NodeGeocoder from "node-geocoder";

import { IHereOption } from "./interfaces";

const options: IHereOption = {
  provider: process.env.GEOCODER_PROVIDER,
  // httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null,
};

const geocoder = NodeGeocoder(options);

export default geocoder;

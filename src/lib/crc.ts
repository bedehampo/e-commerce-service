import axios from "axios";
import config from "../config";
import {
  ConsumerHitResponse,
  ConsumerSearchResultResponse,
} from "../types/loan";

class crcService {
  client: any;

  constructor() {
    const username = config.crc.username;
    const password = config.crc.password;
    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );
    this.client = axios.create({
      baseURL: config.crc.base_url,

      headers: {
        "Content-Type": "application/json",
        //add basic auth
        Authorization: `Basic ${credentials}`,
      },
    });
  }

  async getBasicStandardCreditScoreByBVN(
    bvn: string
  ): Promise<ConsumerSearchResultResponse> {
    const username = config.crc.username;
    const password = config.crc.password;
    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );

    try {
      const payload = {
        Request: `{'@REQUEST_ID': '1','REQUEST_PARAMETERS': { 'REPORT_PARAMETERS': { '@REPORT_ID': '6417', '@SUBJECT_TYPE': '1', '@RESPONSE_TYPE': '5' }, 'INQUIRY_REASON': { '@CODE': '1' }, 'APPLICATION': { '@PRODUCT': '017', '@NUMBER': '232', '@AMOUNT': '15000', '@CURRENCY': 'NGN' }},'SEARCH_PARAMETERS': { '@SEARCH-TYPE': '4', 'BVN_NO': '${bvn}' }}`,
        UserName: username,
        Password: password,
      };
      // // console.log(payload);
      const response = await this.client.post(
        "/JsonLiveRequest/JsonService.svc/CIRRequest/ProcessRequestJson",
        payload
      );
      // console.log(response.data);
      let data = response.data;
      return data;
    } catch (error: any) {
      console.log(error);

      throw new Error(error);
    }
  }

  async getClassicStandardCreditDetailsByBVN(
    bvn: string
  ): Promise<ConsumerSearchResultResponse > {
    try {
      const requestString = multiHit(bvn);
      const payload = {
        Request: requestString,
        UserName: config.crc.username,
        Password: config.crc.password,
      };
      // console.log(payload);

      const response = await this.client.post(
        "/JsonLiveRequest/JsonService.svc/CIRRequest/ProcessRequestJson",
        payload
      );
      // console.log(response.data);

      let data = response.data;
      return data;
    } catch (error: any) {
      console.log(error);

      throw new Error(error);
    }
  }

  async getClassicStandardCreditDetailsByBVNMergeRequest(
    reference: string,
    primaryBureauId: string,
    bureauIds: string[]
  ): Promise<ConsumerHitResponse> {
    try {
      const payload = {
        Request: mergeRequest(reference, primaryBureauId, bureauIds),
        UserName: config.crc.username,
        Password: config.crc.password,
      };
      // console.log(payload);

      const response = await this.client.post(
        "/JsonLiveRequest/JsonService.svc/CIRRequest/ProcessRequestJson",
        payload
      );
      console.log("result", response.data);
      // return payload;
      let data = response.data;
      return data;
    } catch (error: any) {
      console.log(error);

      throw new Error(error);
    }
  }
}

const multiHit = (bvn: string) =>
  `{'@REQUEST_ID': '1','REQUEST_PARAMETERS': { 'REPORT_PARAMETERS': { '@REPORT_ID': '2', '@SUBJECT_TYPE': '1', '@RESPONSE_TYPE': '5' }, 'INQUIRY_REASON': { '@CODE': '1' }, 'APPLICATION': { '@PRODUCT': '017', '@NUMBER': '232', '@AMOUNT': '15000', '@CURRENCY': 'NGN' }},'SEARCH_PARAMETERS': { '@SEARCH-TYPE': '4', 'BVN_NO': '${bvn}' }}`;

const mergeRequest = (
  reference: string,
  primaryBureauId: string,
  bureauIds: string[]
) => {
  //format bureauIds to string
  let finalBureauIds = bureauIds.map((bureauId) => `'${bureauId}'`).join(",");
  finalBureauIds = `[${finalBureauIds}]`;

  return `{'@REQUEST_ID': '1','REQUEST_PARAMETERS': {   'APPLICATION': {      '@AMOUNT': '1000',      '@CURRENCY': 'NGN',      '@NUMBER': '232',      '@PRODUCT': '001'   },   'INQUIRY_REASON': {      '@CODE': '1'   },   'REPORT_PARAMETERS': {      '@REPORT_ID': '2',      '@RESPONSE_TYPE': '5',      '@SUBJECT_TYPE': '1'   },   'REQUEST_REFERENCE': {      '@REFERENCE-NO': ${reference},      'MERGE_REPORT': {         '@PRIMARY-BUREAU-ID': ${primaryBureauId},         'BUREAU_ID': ${finalBureauIds}      }   }}}`;
};

export default new crcService();

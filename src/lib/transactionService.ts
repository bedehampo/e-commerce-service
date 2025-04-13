import axios from "axios";
import config from "../config";
import { CheckoutInitiateTransaction } from "../types/order";
import { Transaction, TransactionServiceResponse } from "../types/transactions";
import { ServiceError } from "../errors";
import {
  CompleteLoanRepaymentPayload,
  InitiateLoanRepaymentPayload,
  LoanApprovalTransactionPayload,
  LoanTransaction,
  initiateLoanRepaymentResponseData,
} from "../types/loan";

export class TransactionService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.transactionService.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async initiateTransaction(
    payload: CheckoutInitiateTransaction
  ): Promise<TransactionServiceResponse<Transaction>> {
    try {
      // console.log(payload);
      // console.log("payload", payload.transactionDetailsDto.items);
      const response = await this.client.post("/api/v1/initiate", payload);

      let data = response.data;
      // console.log(data);
      return data;
    } catch (error) {
      console.log(error.response.data);
      return error.response.data;
    }
  }

  async completeTransaction(
    pin: string,
    transactionRef: string,
    vendor?: string
  ): Promise<TransactionServiceResponse<undefined>> {
    console.log(vendor);

    try {
      this.client.defaults.headers.common["transactionPin"] = pin;
      const response = await this.client.post(`/api/v1/complete`, {
        transactionRef,
        transactionType: "PURCHASE",
        vendor: vendor,
      });
      console.log("complete", response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      return error.response.data;
    }
  }

  async createBusinessWallet(): Promise<TransactionServiceResponse<undefined>> {
    try {
      const response = await this.client.post(
        "/wallet/api/v1/business-account"
      );
      let data = response.data;
      return data;
    } catch (error) {
      return error.response.data;
    }
  }
  async deleteBusinessWallet(): Promise<TransactionServiceResponse<undefined>> {
    try {
      const response = await this.client.delete(
        "/wallet/api/v1/business-account"
      );
      let data = response.data;
      return data;
    } catch (error) {
      return error.response.data;
    }
  }

  async disburseLoanAdmin(
    payload: LoanApprovalTransactionPayload
  ): Promise<TransactionServiceResponse<LoanTransaction>> {
    try {
      const response = await this.client.post(
        "/loan/api/v1/request/process",
        payload
      );
      let data = response.data;
      return data;
    } catch (error) {
      return error.response.data;
    }
  }
  async disburseLoanUser(
    payload: LoanApprovalTransactionPayload
  ): Promise<TransactionServiceResponse<LoanTransaction>> {
    console.log(payload, "payload");

    try {
      console.log("disbursing loan");
      console.log("url", config.transactionService.baseUrl);

      const response = await this.client.post(
        "/loan/api/v1/request/process/user",
        payload
      );
      console.log(response);

      let data = response.data;
      return data;
    } catch (error) {
      return error.response.data;
    }
  }
  async initiateLoanRepayment(
    payload: InitiateLoanRepaymentPayload
  ): Promise<TransactionServiceResponse<initiateLoanRepaymentResponseData>> {
    try {
      const response = await this.client.post(
        "/loan/api/v1/repayment/initiate",
        payload
      );

      console.log(payload);

      let data = response.data;
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
      return error.response.data;
    }
  }

  async completeLoanRepayment(
    pin: string,
    payload: CompleteLoanRepaymentPayload
  ): Promise<TransactionServiceResponse<undefined>> {
    try {
      this.client.defaults.headers.common["transactionPin"] = pin;
      const response = await this.client.post(
        `/loan/api/v1/repayment/complete`,
        { ...payload, transactionType: "LOAN_TRANSACTION" }
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      return error.response.data;
    }
  }
}

export default new TransactionService();

import mongoose from "mongoose";
import { IUser } from "./user";

export interface ConsumerSearchResultResponse {
  ConsumerSearchResultResponse: {
    BODY: {
      SEARCHRESULTLIST: ConsumerDetails[];
    };
    HEADER: {
      RESPONSETYPE: {
        CODE: string;
        DESCRIPTION: string;
      };
    };
    REFERENCENO: string;
    REQUESTID: string;
  };
}

export interface ConsumerDetails {
  ADDRESSES: {
    ADDRESS: null;
  };
  BUREAUID: string;
  CONFIDENCESCORE: string;
  DATEOFBIRTH: string;
  GENDER: string;
  IDENTIFIERS: {};
  NAME: string;
  PHONENUMBER: string;
  SURROGATES: {};
}

interface AddressHistoryItem {
  ADDRESS: string;
  ADDR_TYPE: string;
  DATE_REPORTED: string;
  SNO: string;
}

interface AmountODBucketCURR1Item {
  Apr19: null;
  Aug19: null;
  Jul19: null;
  Jun19: null;
  May19: null;
  Sep19: null;
  TYPE: string;
}

interface ClassificationInsTypeItem {
  AMOUNT_OVERDUE: string;
  APPROVED_CREDIT_SANCTIONED: string;
  CURRENCY: string;
  INSTITUTION_TYPE: string;
  LEGAL_FLAG: string | null;
  NO_OF_ACCOUNTS: string;
  OUSTANDING_BALANCE: string;
}

interface ClassificationProdTypeItem {
  AMOUNT_OVERDUE: string;
  CURRENCY: string;
  NO_ACC_LAST_SIX_MON: string;
  NO_OF_ACCOUNTS: string;
  PRODUCT_TYPE: string;
  RECENT_OVERDUE_DATE: null;
  SANCTIONED_AMOUNT: string;
  TOTAL_OUTSTANDING_BALANCE: string;
}

interface ConsCommDetails_IDItem {
  EXPIRY_DATE: null;
  IDENTIFIERNUMBER: string;
  IDENTIFIER_NUMBER: string;
  ID_TYPE: string;
}

interface ContactHistoryItem {
  CONTACT_TYPE: string;
  DATE_REPORTED: string;
  DETAILS: string;
  SNO: string;
}

interface CreditProfileOverviewItem {
  INDICATOR: string;
  INDICATOR_TYPE: string;
  VALUE: string;
}

interface InquiryHistoryDetailsItem {
  FACILITY_TYPE: string;
  INQUIRY_DATE: string;
  INSTITUTION_TYPE: string;
  SNO: string;
}

interface Inquiry_ProductItem {
  BANK: string;
  MICRO: string;
  MORTGAGE: string;
  NBFC: string;
  OTHER: string;
  PRODUCT_TYPE: string;
  TOTAL: string;
}

interface SummaryOfPerformanceItem {
  ACCOUNT_BALANCE: string;
  APPROVED_AMOUNT: string;
  DATA_PRDR_ID: string;
  DISHONORED_CHEQUES_COUNT: string;
  FACILITIES_COUNT: string;
  INSTITUTION_NAME: string;
  NONPERFORMING_FACILITY: string;
  OVERDUE_AMOUNT: string;
  PERFORMING_FACILITY: string;
}

interface CreditFacilityHistory24 {
  ACCOUNT_NUMBER: string;
  ACC_OPEN_DISB_DT: string;
  AMOUNT_OVERDUE_CAL: string;
  AMOUNT_WRITTEN_OFF: string;
  ASSET_CLASSIFICATION_CAL: string;
  CURRENCY: string;
  CURRENCY_VALUE: string;
  CURRENT_BALANCE_CAL: string;
  DATE_REPORTED: string;
  DATE_REPORTED_AGE: string;
  DPD120: string;
  DPD150: string;
  DPD180: string;
  DPD180P: string;
  DPD30: string;
  DPD60: string;
  DPD90: string;
  EXPECT_NXT_INSTALLMENT_AMT: string;
  ExposureGuarantors: null;
  IFF_TYPE: string;
  INSTITUTION_NAME: string;
  LASTREPAYAMT_DT_CAL: string;
  LOAN_STATUS: string;
  LOAN_TYPE: string;
  LOAN_TYPE_VALUE: string;
  MATURITY_DT: string;
  MONTH1: string;
  MONTH10: string;
  MONTH11: string;
  MONTH12: string;
  MONTH13: string;
  MONTH14: string;
  MONTH15: string;
  MONTH16: string;
  MONTH17: string;
  MONTH18: string;
  MONTH19: string;
  MONTH2: string;
  MONTH20: string;
  MONTH21: string;
  MONTH22: string;
  MONTH23: string;
  MONTH24: string;
  MONTH3: string;
  MONTH4: string;
  MONTH5: string;
  MONTH6: string;
  MONTH7: string;
  MONTH8: string;
  MONTH9: string;
  MONTH_1: string;
  MONTH_10: string;
  MONTH_11: string;
  MONTH_12: string;
  MONTH_13: string;
  MONTH_14: string;
  MONTH_15: string;
  MONTH_16: string;
  MONTH_17: string;
  MONTH_18: string;
  MONTH_19: string;
  MONTH_2: string;
  MONTH_20: string;
  MONTH_21: string;
  MONTH_22: string;
  MONTH_23: string;
  MONTH_24: string;
  MONTH_3: string;
  MONTH_4: string;
  MONTH_5: string;
  MONTH_6: string;
  MONTH_7: string;
  MONTH_8: string;
  MONTH_9: string;
  NUMBER_OF_INSTALLMENTS: string;
  NUM_OF_DAYS_IN_ARREARS_CAL: string;
  OWNERSHIP_INDICATOR: string;
  RANKING: string;
  REASON_CODE: string;
  REASON_CODE_VALUE: string;
  REPAYMENT_FREQUENCY: string;
  REPORTED_DT_TEXT: string;
  RESTRUCTREASON: string;
  RESTRUCT_DT: string;
  SANCTIONED_AMOUNT_CAL: string;
  SECURITY_COVERAGE: string;
  SECURITY_VALUE: string;
  SIN: string;
  SNO: string;
  S_NO: string;
  TYPE: string;
  TYPE_Basic_RPT: string;
  UNIQUE_ROOT_ID: string;
}

export interface ConsumerHitResponse {
  ConsumerHitResponse: {
    BODY: {
      AddressHistory: AddressHistoryItem[];
      Amount_OD_BucketCURR1: {
        Amount_OD_BucketCURR1: AmountODBucketCURR1Item[];
        Credit_Utilization_TrendCURR1: null;
      };
      CONSUMER_RELATION: null;
      CREDIT_MICRO_SUMMARY: null;
      CREDIT_NANO_SUMMARY: null;
      CREDIT_SCORE_DETAILS: null;
      ClassificationInsType: ClassificationInsTypeItem[];
      ClassificationProdType: ClassificationProdTypeItem[];
      ClosedAccounts: {
        ClosedAccounts: null;
      };
      ConsCommDetails: {
        ConsCommDetails_ID: ConsCommDetails_IDItem[];
        ConsCommDetails_Subject: {
          ADDRESS: string;
          APPLICATIONVIABILITYSCORE: string;
          DATE_OF_BIRTH: string;
          DATE_OF_BIRTH_M: string;
          GENDER: string;
          NAME: string;
          NATIONALITY: string;
          PHONE_NO1: string;
          PHONE_NO2: string;
        };
      };
      ConsumerMergerDetails: {
        ConsumerMergerDetails: {
          NAME: string;
          SN: string;
        };
      };
      ContactHistory: ContactHistoryItem[];
      CreditFacilityHistory24: CreditFacilityHistory24[];
      CreditDisputeDetails: null;
      CreditProfileOverview: CreditProfileOverviewItem[];
      CreditProfileSummaryCURR1: {
        Apr19: null;
        Aug19: null;
        Jul19: null;
        Jun19: null;
        May19: null;
        Sep19: null;
        TYPE: string;
      }[];
      CreditProfileSummaryCURR2: any[];
      CreditProfileSummaryCURR3: any[];
      CreditProfileSummaryCURR4: any[];
      CreditProfileSummaryCURR5: any[];
      DMMDisputeSection: {
        DMMDisputeSection: null;
      };
      DODishonoredChequeDetails: any[];
      DOJointHolderDetails: {
        DOJointHolderDetails: null;
      };
      DOLitigationDetails: any[];
      DisclaimerDetails: {};
      EmploymentHistory: {
        EmploymentHistory: {
          ADDRESS: null;
          DATE_REPORTED: string;
          EMPLOYER_NAME: null;
          EMP_EXP_MONTH: null;
          POSITION: null;
          SNO: string;
        };
      };
      GuaranteedLoanDetails: any[];
      InquiryHistoryDetails: InquiryHistoryDetailsItem[];
      Inquiry_Product: Inquiry_ProductItem[];
      LegendDetails: {};
      MFCREDIT_MICRO_SUMMARY: null;
      MFCREDIT_NANO_SUMMARY: null;
      MGCREDIT_MICRO_SUMMARY: null;
      MGCREDIT_NANO_SUMMARY: null;
      MIC_CONSUMER_PROFILE: null;
      NANO_CONSUMER_PROFILE: null;
      RelatedToDetails: {
        RelatedToDetails: null;
      };
      ReportDetail: {
        ReportDetailBVN: null;
      };
      ReportDetailAcc: {
        ReportDetailAcc: null;
      };
      ReportDetailBVN: {
        ReportDetailBVN: {
          BVN_NUMBER: number;
          CIR_NUMBER: string;
          DATE_OF_BIRTH: null;
          DATE_OF_BIRTH_M: null;
          GENDER: null;
          INSTITUTION_NAME: string;
          NAME: null;
          REPORT_ORDER_DATE: string;
          REPORT_ORDER_DATE_M: null;
          SEARCH_CONFIDENCE_SCORE: string;
        };
      };
      ReportDetailMob: {
        ReportDetailMob: null;
      };
      ReportDetailsSIR: {};
      SecurityDetails: any[];
      SummaryOfPerformance: SummaryOfPerformanceItem[];
    };
    HEADER: {
      REPORTHEADER: {
        MAILTO: string;
        PRODUCTNAME: string;
        REASON: {};
        REPORTDATE: string;
        REPORTORDERNUMBER: string;
        USERID: string;
      };
      RESPONSETYPE: {
        CODE: string;
        DESCRIPTION: string;
      };
      SEARCHCRITERIA: {
        BRANCHCODE: null;
        BVN_NO: string;
        CFACCOUNTNUMBER: null;
        DATEOFBIRTH: string;
        GENDER: string;
        NAME: string;
        TELEPHONE_NO: null;
      };
      SEARCHRESULTLIST: {
        SEARCHRESULTITEM: null;
      };
    };
    REQUESTID: string;
  };
}

export interface LoanTransaction {
  parentRef: string;
  transactionRef: string;
  amount: number;
  phone: string;
  accountNo: string;
  userId: string;
}
export interface LoanApprovalTransactionPayload {
  parentRef: string;
  phone: string;
  amount: number;
  userId: number;
  accountNo: string;
}

export enum LoanDurationUnit {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

export interface ILoanType extends Document {
  name: string;
  interestRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoanDuration extends Document {
  value: number;
  unit: LoanDurationUnit;
  createdAt: Date;
  updatedAt: Date;
}

export interface Iloan extends Document {
  amount: number;
  loanCategory: string;
  loanType: string;
  user: number;
  loanBio: string;
  status: string;
  transactionReference?: string;
  dueDate?: Date;
  completedDate?: Date;
  monthlyRepayment: number;
  payBackAmount: number;
  approvedAt?: Date;
}

export enum LoanTypesName {
  PERSONAL = "personal",
  SME = "sme",
  NANO = "nano",
}

export enum LoanEligibilityType {
  credit_history = "credit_history",
  income = "income",
  additional_credit_history = "additional_credit_history",
  employment_stability = "employment_stability",
  debt_to_income_ratio = "debt_to_income_ratio",
  account_tier = "account_tier",
  age = "age",
  loan_repayment_history = "loan_repayment_history",
  depth_to_income_ratio = "depth_to_income_ratio",
  bank_account_history = "bank_account_history",
}

export enum AgeKey {
  below_25_years_above_55_years = "below_25_years_above_55_years",
  "41_55_years" = "41_55_years",
  "25_40_years" = "25_40_years",
}

export enum AccountTierKey {
  TIER1 = "tier_1",
  TIER2 = "tier_2",
  TIER3 = "tier_3",
}
export enum AdditionalCreditHistoryKey {
  NOPREVIOUSLOAN = "no_previous_loan",
  ONELOAN = "one_loan",
  MULTIPLELOAN = "multiple_loan",
}

export enum CreditHistoryKey {
  MULTIPLE_PREVIOUS_DEFAULTS = "multiple_previous_defaults",
  ONE_PREVIOUS_DEFAULT = "one_previous_default",
  NO_PREVIOUS_DEFAULT = "no_previous_default",
}

export enum LoanPaymentType {
  PARTIAL = "partial",
  FULL = "full",
  LOANDUEFULL = "loan_due_full",
  LOANDUEPARTIAL = "loan_due_partial",
  RECOVA = "recova",
}

export enum LoanRepaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  OVERDUE = "overdue",
  DEFAULTED = "defaulted",
  LIQUIDATED = "liquidated",
}

export enum Liquidationtype {
  PARTIAL = "partial",
  FULL = "full",
}
export interface CreateConsentRequestServicePayload {
  loanId: mongoose.Types.ObjectId;
  user: IUser;
}

export interface RecovaCreateConsentRequestPayload {
  bvn: string;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  loanReference: string;
  customerID: number;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  loanAmount: number;
  totalRepaymentExpected: number;
  loanTenure?: number;
  linkedAccountNumber?: string;
  repaymentType: string;
  preferredRepaymentBankCBNCode?: string;
  preferredRepaymentAccount?: string;
  collectionPaymentSchedules: CollectionPaymentSchedule[];
}

export interface CollectionPaymentSchedule {
  repaymentDate: Date;
  repaymentAmountInNaira: number;
}

export interface RecovaCreateConsentRequestResponse {
  id: number;
  bvn: string;
  businessRegistrationNumber: string;
  taxIdentificationNumber: string;
  loanAmount: number;
  customerID: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  totalRepaymentExpected: number;
  loanTenure: number;
  requestStatus: string;
  loanReference: string;
  linkedAccountNumber: string;
  repaymentType: string;
  preferredRepaymentBankCBNCode: string;
  preferredRepaymentAccount: string;
  consentApprovalUrl: string;
  consentConfirmationUrl: string;
}

export interface InitiateLoanRepaymentPayload {
  parentRef: string;
  phone: string;
  amount: number;
  userId: number;
  accountNo: string;
}

export interface initiateLoanRepaymentResponseData {
  parentRef: string;
  transactionRef: string;
  phone: string;
  amount: number;
  userId: number;
  accountNo: string;
}

export interface CompleteLoanRepaymentPayload {
  transactionRef: string;
  userId: number;
}

export enum RecovaMandateStatus {
  PENDING = "pending",
  APPROVED = "approved",
  DECLINED = "declined",
}

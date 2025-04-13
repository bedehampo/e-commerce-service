import { object, string, number, array, TypeOf, z } from "zod";
import { upload } from "../middlewares/upload";
import { LoanTypeGroup } from "../model/Loan/LoanType";
import { LoanBioFieldType } from "../model/Loan/LoanBioField";

const payload = {
  body: object({
    amount: number({
      required_error: "Amount is required",
    }).min(0, "Amount must be greater than 0"),
    loanTypeId: string({
      required_error: "Loan Type Id is required",
    }),
    loanDuration: number({
      required_error: "Loan Duration Id is required",
    }),
    //bvn field and should be 11 digits
    bvn: string({
      required_error: "BVN is required",
    })
      .min(11, "BVN must be 11 digits")
      .max(11, "BVN must be 11 digits"),
    loanApplicationData: z.record(z.any()).optional(),
  }),
};

export const CreateLoanSchema = object({
  ...payload,
});

export type CreateLoanInput = TypeOf<typeof CreateLoanSchema>;

const createLoanExistingPayload = {
  body: object({
    amount: number({
      required_error: "Amount is required",
    }).min(0, "Amount must be greater than 0"),
    loanTypeId: string({
      required_error: "Loan Type Id is required",
    }),
    //bvn field and should be 11 digits
    bvn: string({
      required_error: "BVN is required",
    })
      .min(11, "BVN must be 11 digits")
      .max(11, "BVN must be 11 digits"),
    loanCategory: string({
      required_error: "Loan Category is required",
    }),
    loanDurationId: string({
      required_error: "Loan Duration Id is required",
    }),
  }),
};

export const CreateLoanExistingSchema = object({
  ...createLoanExistingPayload,
});

export type CreateLoanExistingInput = TypeOf<typeof CreateLoanExistingSchema>;

export const calculateLoanPaymentSchedulePayload = {
  body: object({
    amount: number({
      required_error: "Loan amount is required",
    }),
    loanTypeId: string({
      required_error: "Loan type is required, key: loanTypeId",
    }),
    loanDuration: number({
      required_error: "Loan Duration is required",
    }),
  }),
};

export const CalculateLoanPaymentScheduleSchema = object({
  ...calculateLoanPaymentSchedulePayload,
});

export type CalculateLoanPaymentScheduleInput = TypeOf<
  typeof CalculateLoanPaymentScheduleSchema
>;
const processLoanPayload = {
  body: object({
    loanId: string({
      required_error: "Loan Id is required",
    }),
    status: z.enum(["approved", "rejected"]),
    remarks: string().optional(),
  }),
};

export const ProcessLoanSchema = object({
  ...processLoanPayload,
});

export type ProcessLoanInput = TypeOf<typeof ProcessLoanSchema>;

const appealLoanPayload = {
  body: object({
    loanId: string({
      required_error: "Loan Id is required",
    }),
    description: string({
      required_error: "Description is required",
    }),
    supportingDocuments: array(
      string({
        required_error: "Supporting Document is required",
      })
    ),
  }),
};

export const AppealLoanSchema = object({
  ...appealLoanPayload,
});

export type AppealLoanInput = TypeOf<typeof AppealLoanSchema>;

const addLoanEligibilitySettingsPayload = {
  body: object({
    title: string({
      required_error: "Title is required",
    }),
    key: string({
      required_error: "Key is required",
    }),
    value: number({
      required_error: "Value is required",
    }),
  }),
};

export const AddLoanEligibilitySettingsSchema = object({
  ...addLoanEligibilitySettingsPayload,
});

export type AddLoanEligibilitySettingsInput = TypeOf<
  typeof AddLoanEligibilitySettingsSchema
>;

const updateLoanEligibilitySettingsPayload = {
  body: object({
    title: string({
      required_error: "Title is required",
    }),
    key: string({
      required_error: "Key is required",
    }),
    value: number({
      required_error: "Value is required",
    }),
  }),
};

export const UpdateLoanEligibilitySettingsSchema = object({
  ...updateLoanEligibilitySettingsPayload,
});

export type UpdateLoanEligibilitySettingsInput = TypeOf<
  typeof UpdateLoanEligibilitySettingsSchema
>;

const computeLoanEligibilitypayload = {
  body: object({
    bvn: string({
      required_error: "BVN is required",
    })
      .min(11, "BVN must be 11 digits")
      .max(11, "BVN must be 11 digits"),
  }),
};

export const ComputeLoanEligibilitySchema = object({
  ...computeLoanEligibilitypayload,
});

export type ComputeLoanEligibilityInput = TypeOf<
  typeof ComputeLoanEligibilitySchema
>;

const recovaSmsAlertPayload = {
  body: object({
    phoneNumber: string({
      required_error: "Phone number is required",
    }),
    message: string({
      required_error: "Message is required",
    }),
    institutionCode: string({
      required_error: "Institution code is required",
    }),
    loanReference: string({
      required_error: "Loan reference is required",
    }),
  }),
};

export const RecovaSmsAlertSchema = object({
  ...recovaSmsAlertPayload,
});

export type RecovaSmsAlertInput = TypeOf<typeof RecovaSmsAlertSchema>;

const loanBalanceUpdatePayload = {
  body: object({
    creditAccountNumber: string({
      required_error: "Credit account number is required",
    }),
    debitAccountNumber: string({
      required_error: "Debit account number is required",
    }),
    amount: number({
      required_error: "Amount is required",
    }).min(0, "Amount must be greater than 0"),
    narration: string({
      required_error: "Narration is required",
    }),
    transactionReference: string({
      required_error: "Transaction reference is required",
    }),
    loanReference: string({
      required_error: "Loan reference is required",
    }),
  }),
};

export const LoanBalanceUpdateSchema = object({
  ...loanBalanceUpdatePayload,
});

export type LoanBalanceUpdateInput = TypeOf<typeof LoanBalanceUpdateSchema>;

// {
//   "loanReference": "string",
//   "institutionCode": "string"
// }

const mandateCreatedPayload = {
  body: object({
    loanReference: string({
      required_error: "Loan reference is required",
    }),
    institutionCode: string({
      required_error: "Institution code is required",
    }),
  }),
};

export const MandateCreatedSchema = object({
  ...mandateCreatedPayload,
});

export type MandateCreatedInput = TypeOf<typeof MandateCreatedSchema>;

const liquidateLoanPayload = {
  body: object({
    loan_id: string({
      required_error: "Loan reference is required",
    }),
    amount: number({
      invalid_type_error: "Amount must be a number",
    })
      .min(0, "Amount must be greater than 0")
      .optional(),
    liquidation_type: z.enum(["full", "partial"], {
      invalid_type_error: "Liquidation type must be either full or partial",
      required_error: "Liquidation type is required",
    }),
    pin: string({
      required_error: "Pin is required, key: pin",
    }),
  }).refine(
    (data) => {
      if (data.liquidation_type === "partial" && !data.amount) {
        return false;
      }
      return true;
    },
    {
      message: "Amount is required for partial liquidation",
    }
  ),
};

export const LiquidateLoanSchema = object({
  ...liquidateLoanPayload,
});

export type LiquidateLoanInput = TypeOf<typeof LiquidateLoanSchema>;

const loanDuePaymentPayload = {
  body: object({
    amount: number({
      invalid_type_error: "Amount must be a number",
      required_error: "Amount is required, key: amount",
    }).min(0, "Amount must be greater than 0"),
    loan_repayment_id: string({
      required_error: "Loan repayment Id is required, key: loan_repayment_id",
    }),
    pin: string({
      required_error: "Pin is required, key: pin",
    }),
  }),
};

export const LoanDuePaymentSchema = object({
  ...loanDuePaymentPayload,
});

export type LoanDuePaymentInput = TypeOf<typeof LoanDuePaymentSchema>;

const updateLoanTypePayload = {
  //same as createLoanTypePayload but without required fields i.e optional
  body: object({
    title: string().optional(),
    group: z.enum([LoanTypeGroup.personal, LoanTypeGroup.sme]).optional(),
    interest_rate: number().optional(),
    minimum_amount: number().optional(),
    max_amount: number().optional(),
    duration_schedule: object({
      type: z.enum(["fixed", "flexible"]).optional(),
      unit: z.enum(["weeks", "months", "years"]).optional(),
    }).optional(),
    min_duration: number().optional(),
    max_duration: number().optional(),
    fields: array(
      object({
        field: string().optional(),
        required: z.boolean().optional(),
        condition: object({
          field: string().optional(),
          value: z.any().optional(),
        }).optional(),
      })
    ).optional(),
  }),
};

export const UpdateLoanTypeSchema = object({
  ...updateLoanTypePayload,
});

export type UpdateLoanTypeInput = TypeOf<typeof UpdateLoanTypeSchema>;

const createLoanTypePayload = {
  body: object({
    title: string({
      required_error: "Title is required",
    }),
    group: z.enum([LoanTypeGroup.personal, LoanTypeGroup.sme], {
      required_error: "Group is required",
      invalid_type_error: "Group must be either personal or sme",
    }),
    interest_rate: number({
      required_error: "Interest rate is required",
    }),
    minimum_amount: number({
      required_error: "Minimum amount is required",
    }),
    max_amount: number({
      required_error: "Maximum amount is required",
    }),
    duration_schedule: object({
      type: z.enum(["fixed", "flexible"], {
        required_error: "Type is required",
        invalid_type_error: "Type must be either fixed or flexible",
      }),
      unit: z.enum(["weeks", "months", "years"], {
        required_error: "Unit is required",
        invalid_type_error: "Unit must be either weeks, months or years",
      }),
    }),
    min_duration: number({
      required_error: "Minimum duration is required",
    }),
    max_duration: number({
      required_error: "Maximum duration is required",
    }),
    fields: array(
      object({
        field: string({
          required_error: "Field is required",
        }),
        required: z.boolean({
          required_error: "Required is required",
        }),
        condition: object({
          field: string({
            required_error: "Field is required",
          }),
          value: z.any(),
        }).optional(),
      })
    )
      .min(1, {
        message: "Fields must be at least one",
      })
      .optional(),
  }),
};

export const CreateLoanTypeSchema = object({
  ...createLoanTypePayload,
});

export type CreateLoanTypeInput = TypeOf<typeof CreateLoanTypeSchema>;

export const CreateLoanBioField = {
  body: object({
    title: string({
      required_error: "Title is required",
    }),
    type: z.enum(
      [
        LoanBioFieldType.TEXT,
        LoanBioFieldType.NUMBER,
        LoanBioFieldType.DATE,
        LoanBioFieldType.SELECT,
        LoanBioFieldType.RADIO,
        LoanBioFieldType.CHECKBOX,
        LoanBioFieldType.FILE,
      ],
      {
        required_error: "Type is required",
        invalid_type_error:
          "Type must be either text, number, date, boolean or array",
      }
    ),
    options: array(string())
      .min(1, {
        message: "Options must be at least one",
      })
      .optional(),
  }).refine(
    (data) => {
      if (
        (data.type === LoanBioFieldType.SELECT ||
          data.type === LoanBioFieldType.RADIO ||
          data.type === LoanBioFieldType.CHECKBOX) &&
        !data.options
      ) {
        return false;
      }

      return true;
    },
    {
      message: "Options are required for select, radio and checkbox types",
    }
  ),
};

export const CreateLoanBioFieldSchema = object({
  ...CreateLoanBioField,
});

export type CreateLoanBioFieldInput = TypeOf<typeof CreateLoanBioFieldSchema>;

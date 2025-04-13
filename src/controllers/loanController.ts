import express from "express";
import mongoose from "mongoose";
import config from "../config/index";
import { Request, Response, NextFunction } from "express";
import { LoanStatusTypes, OkraCreateCustomerResult } from "../utils/interfaces";
import {
  AppealLoanInput,
  CalculateLoanPaymentScheduleInput,
  CreateLoanExistingInput,
  CreateLoanInput,
} from "../validation/loan.schema";
// import LoanType from "../model/Loan/LoanType";
import { AuthorizationError, NotFoundError, ServiceError } from "../errors";
import { successResponse } from "../helpers";
import okraService from "../lib/okra";
import Loan from "../model/Loan/Loan";
// import LoanBio from "../model/Loan/LoanBio";
import { CustomRequest } from "../utils/interfaces";
import LoanType, { ILoanType } from "../model/Loan/LoanType";
import { checkUserById } from "../middlewares/validators";
import crcService from "../lib/crc";
import loanCategory from "../model/Loan/loanCategory";
import { ILoanDuration, Iloan, LoanDurationUnit } from "../types/loan";
import { computeLoanEligibilityService, getLoansService } from "../services";
import LoanAppeal from "../model/Loan/LoanAppeal";
import LoanDuration from "../model/Loan/LoanDuration";
import createLoanService from "../services/loan/createLoan";
import LoanEligibilitySettings from "../model/Loan/LoanEligibilitySettings";
import { calculateLoanRepayment } from "../services/loan/calculateLoanRepaymentSchedule";
import {
  computeLoanRepaymentSchedule,
  getLoanDetailsService,
  getLoanRepaymentScheduleService,
  liquidateLoanService,
  loanDuePaymentService,
} from "../services/loan";

export const getLoans = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const userId = req.user && req.user.id;
  // await LoanType.create(sample);
  // return res.send("done");
  try {
    const result = await getLoansService(userId);
    return res.send(successResponse("Loans fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

export const createLoan = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const userId = req.user && req.user.id;
    const transactionService = req.transactionService;

    const { loan, loanApplicationDataPayload } = await createLoanService(
      userId,
      req.userService,
      transactionService,
      req.body,
      session
    );

    await session.commitTransaction();
    session.endSession();
    return res.send(
      successResponse("Loan created successfully", {
        loan,
        loanApplicationDataPayload,
        // okraWidgetUrl,
      })
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// export const createLoanExixtingBio = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	const session = await mongoose.startSession();
// 	try {
// 		session.startTransaction();
// 		const userId = req.user && req.user.id;
// 		const {
// 			amount,
// 			loanTypeId,
// 			loanCategory,
// 			loanDurationId,
// 			bvn,
// 		} = req.body as CreateLoanExistingInput["body"];

// 		await checkUserById(userId, req.userService);

// 		const existingLoanBio = await LoanBio.findOne({
// 			user: userId,
// 		});

// 		if (!existingLoanBio) {
// 			throw new AuthorizationError(
// 				"Loan bio does not exist"
// 			);
// 		}

// 		const existingLoan = await Loan.findOne({
// 			user: userId,
// 			status: { $in: ["pending", "approved", "unpaid"] },
// 		});

// 		if (existingLoan) {
// 			throw new AuthorizationError(
// 				"You have an existing loan"
// 			);
// 		}

// 		const loanType = (await LoanType.findById(
// 			loanTypeId
// 		)) as ILoanType;

// 		if (!loanType) {
// 			throw new NotFoundError("Loan type not found");
// 		}

// 		const loanDuration = (await LoanDuration.findById(
// 			loanDurationId
// 		)) as ILoanDuration;

// 		if (!loanDuration) {
// 			throw new NotFoundError("Loan duration not found");
// 		}
// 		//calculate loan repayment schedule
// 		const { monthlyRepayment, totalRepayment } =
// 			calculateLoanRepayment(
// 				amount,
// 				loanType,
// 				loanDuration
// 			);

// 		const loan = new Loan({
// 			amount,
// 			loanType: loanTypeId,
// 			loanCategory,
// 			user: userId,
// 			loanBio: existingLoanBio._id,
// 			payBackAmount: totalRepayment,
// 			monthlyRepayment,
// 		});

// 		await loan.save({ session });

// 		await session.commitTransaction();

// 		session.endSession();
// 		return res.send(
// 			successResponse("Loan created successfully", {
// 				loan,
// 				loanBio: existingLoanBio,
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

export const completeLoan = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {};

// export const saveOkraCustomer = async (
// 	req: CustomRequest,
// 	res: express.Response,
// 	next: express.NextFunction
// ) => {
// 	try {
// 		const data = req.body as OkraCreateCustomerResult;
// 		const userId = req.user && req.user.id;

// 		const customerIncome =
// 			await okraService.processCustomerIncome(
// 				data.auth.customer_id
// 			);

// 		const customerSpendingPattern =
// 			await okraService.processSpendingPattern(
// 				data.auth.customer_id
// 			);

// 		// return res.send(customerSpendingPattern);
// 		const session = await mongoose.startSession();
// 		await session.withTransaction(async () => {
// 			const updatedLoanBio = await LoanBio.findOneAndUpdate(
// 				{
// 					user_id: userId,
// 				},
// 				{
// 					customer_id: data.auth.customer_id,
// 					bank_id: data.auth.bank_id,
// 					bank_name: data.auth.bank_details.name,
// 					nuban_account_number: data.accounts.nuban,
// 					account_name: data.accounts.name,
// 					income: customerIncome.income,
// 				}
// 			);

// 			return res.send(
// 				successResponse(
// 					"Loan bio updated successfully",
// 					updatedLoanBio
// 				)
// 			);
// 		});
// 		session.endSession();
// 	} catch (error) {
// 		next(error);
// 	}
// };

export const getLoanTypes = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  //get loan types exclude nano
  const loanTypes = await LoanType.find();
  return res.send(
    successResponse("Loan types fetched successfully", loanTypes)
  );
};

export const getLoanCategories = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const loanCategories = await loanCategory.find();
  return res.send(
    successResponse("Loan categories fetched successfully", loanCategories)
  );
};

export const calculateLoanRepaymentSchedule = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user && req.user.id;
    const { amount, loanTypeId, loanDuration } =
      req.body as CalculateLoanPaymentScheduleInput["body"];
    const user = await checkUserById(userId, req.userService);

    // if (!user.bvnVerified) {
    //   throw new AuthorizationError("BVN not verified");
    // }

    const loanType = (await LoanType.findById(loanTypeId)) as ILoanType;
    if (!loanType) {
      throw new NotFoundError("Loan type not found");
    }

    // const loanDuration = (await LoanDuration.findById(
    //   loanDurationId
    // )) as ILoanDuration;

    // if (!loanDuration) {
    //   throw new NotFoundError("Loan duration not found");
    // }

    const { monthlyRepayment, totalRepayment, totalInterest, monthlyInterest } =
      calculateLoanRepayment(amount, loanType, loanDuration);

    return res.send(
      successResponse("Loan calculated successfully", {
        monthlyRepayment: Number(monthlyRepayment.toFixed(2)),
        totalRepayment: Number(totalRepayment.toFixed(2)),
        interestRate: Number(loanType.interestRate.toFixed(2)),
        totalInterest: Number(totalInterest.toFixed(2)),
        monthlyInterest: Number(monthlyInterest.toFixed(2)),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const checkIfUserHasLoan = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const userId = req.user && req.user.id;
    const user = await checkUserById(userId, req.userService);

    const existingLoan = await Loan.findOne({
      user: userId,
      status: {
        $in: [LoanStatusTypes.PENDING, LoanStatusTypes.APPROVED],
      },
    });

    return res.send(
      successResponse("User existing loan status fetched successfully", {
        hasLoan: !!existingLoan,
      })
    );
  } catch (error) {
    next(error);
  }
};

// export const checkIfUserHasLoanBio = async (
// 	req: CustomRequest,
// 	res: express.Response,
// 	next: express.NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		await checkUserById(userId, req.userService);

// 		const existingLoanBio = await LoanBio.findOne({
// 			user: userId,
// 		});

// 		return res.send(
// 			successResponse(
// 				"User existing loan bio status fetched successfully",
// 				{
// 					hasLoanBio: !!existingLoanBio,
// 				}
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

export const appealLoan = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const userId = req.user && req.user.id;
    const { description, supportingDocuments, loanId } =
      req.body as AppealLoanInput["body"];
    await checkUserById(userId, req.userService);

    const loan = await Loan.findById(loanId);

    if (!loan) {
      throw new NotFoundError("Loan not found");
    }

    if (loan.user !== userId) {
      throw new AuthorizationError(
        "You are not authorized to appeal this loan"
      );
    }

    const loanAppealPayload = {
      description,
      supportingDocuments,
      user: userId,
      loan: loanId,
    };

    //save loan appeal
    await LoanAppeal.create(loanAppealPayload);

    return res.send(successResponse("Loan appeal created successfully", null));
  } catch (error) {
    next(error);
  }
};

export const getLoanDurations = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const loanDurations = await LoanDuration.find().sort({
      value: 1,
    });

    return res.send(
      successResponse("Loan durations fetched successfully", loanDurations)
    );
  } catch (error) {
    next(error);
  }
};

export const addLoanEligibilitySettings = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { title, key, value } = req.body;
    const loanEligibilitySettings = await LoanEligibilitySettings.create({
      title,
      key,
      value,
    });

    return res.send(
      successResponse("Loan eligibility settings created successfully", {
        loanEligibilitySettings,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const computeLoanEligibility = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const userId = req.user && req.user.id;
    const userService = req.userService;
    const payload = req.body;
    const loanEligibitity = await computeLoanEligibilityService(
      userId,
      userService,
      payload
    );
    return res.send(
      successResponse("Loan eligibility computed successfully", loanEligibitity)
    );
  } catch (error) {
    next(error);
  }
};

export const liquidateLoan = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const payload = req.body;
    const userId = req.user && req.user.id;
    const transactionService = req.transactionService;
    const liquidateLoanResponse = await liquidateLoanService(
      payload,
      userId,
      req.userService,
      transactionService,
      session
    );
    await session.commitTransaction();
    session.endSession();
    return res.send(
      successResponse("Loan liquidated successfully", liquidateLoanResponse)
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const loanDuePayment = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const payload = req.body;
    const userId = req.user && req.user.id;
    const transactionService = req.transactionService;
    const loanDuePaymentResponse = await loanDuePaymentService(
      payload,
      userId,
      req.userService,
      transactionService,
      session
    );

    await session.commitTransaction();
    session.endSession();
    return res.send(
      successResponse(
        "Loan repayment completed successfully",
        loanDuePaymentResponse
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const createConsentRequest = async () => {};

export const getLoanRepaymentSchedule = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const { loanId } = req.params;
  try {
    console.log(loanId);

    const loan = await Loan.findById(loanId);

    if (!loan) {
      throw new NotFoundError("Loan not found");
    }

    const loanDuration = await LoanDuration.findById(loan.loanDuration);

    if (!loanDuration) {
      throw new NotFoundError("Loan duration not found");
    }

    const response = await getLoanRepaymentScheduleService(loan._id);
    return res.send(
      successResponse("Loan repayment schedule fetched successfully", response)
    );
  } catch (error) {
    next(error);
  }
};

export const getLoanDetails = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const response = await getLoanDetailsService(req.params.loanId);
    return res.send(
      successResponse("Loan details fetched successfully", response)
    );
  } catch (error) {
    next(error);
  }
};

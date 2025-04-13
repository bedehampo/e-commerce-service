import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Loan from "../../model/Loan/Loan";
import { successResponse } from "../../helpers";
import { ServiceError, ValidationError } from "../../errors";
import {
  AdminRequest,
  CustomRequest,
  LoanStatusTypes,
} from "../../utils/interfaces";
import moment from "moment";
import {
  CreateLoanTypeInput,
  MandateCreatedInput,
  ProcessLoanInput,
} from "../../validation/loan.schema";
import { MainWallet } from "../../model/budgetWallets/MainWallets";
import { Transactions } from "../../model/Transactions";
import { TransactionService } from "../../lib/transactionService";
import {
  generateTransactionReference,
  notificationService,
} from "../../utils/global";
import { TransactionStatusCode } from "../../types/transactions";
import LoanType from "../../model/Loan/LoanType";
import { getLoanOverviewStatsService } from "../../services";
import LoanEligibilitySettings from "../../model/Loan/LoanEligibilitySettings";
import { processLoanRequestService } from "../../services/loan";
import LoanBioField from "../../model/Loan/LoanBioField";
import LoanApproval from "../../model/Loan/LoanApproval";
// import notificationService from "../../lib/notificationService";

export const processLoanRequest = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  const data = req.body;

  const adminUser = req.adminUser;
  const adminService = req.AdminService;

  const payload = data as ProcessLoanInput["body"];
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    await processLoanRequestService(
      payload,
      req.userService,
      req.transactionService,
      adminUser,
      adminService,
      session
    );

    return res.send(successResponse("Loan processed successfully", null));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getLoanRequests = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const loans = await Loan.find({ status: LoanStatusTypes.PENDING })
      .populate("loanType")
      .populate("loanBio");
    return res.send(successResponse("Loan fetched successfully", loans));
  } catch (error) {
    next(error);
  }
};

export const getPersonalLoanRecords = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const personalLoanType = await LoanType.findOne({
      name: "personal",
    });
    const loans = await Loan.find({
      status: LoanStatusTypes.APPROVED,
      loanType: personalLoanType._id,
    })
      .populate("loanType")
      .populate("loanBio");

    return res.send(successResponse("Loan fetched successfully", loans));
  } catch (error) {
    next(error);
  }
};

export const getNanoLoanRecords = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const nanoLoanTypeId = await LoanType.findOne({
      name: "nano",
    });
    console.log(nanoLoanTypeId);

    const loans = await Loan.find({
      status: LoanStatusTypes.APPROVED,
      loanType: nanoLoanTypeId,
    })
      .populate("loanType")
      .populate("loanBio");

    return res.send(successResponse("Loan fetched successfully", loans));
  } catch (error) {
    next(error);
  }
};

export const getBucketLoanRecords = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  const year = req.params.year;
  console.log(year);

  try {
    const bucketedRecords = await Loan.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year}-12-31`),
          },
          status: LoanStatusTypes.APPROVED,
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" }, // Group by month
            range: {
              $switch: {
                branches: [
                  { case: { $lte: ["$amount", 1000] }, then: "1-1000" },
                  { case: { $lte: ["$amount", 11000] }, then: "1100-11000" },
                  { case: { $lte: ["$amount", 50000] }, then: "10100-50000" },
                  { case: { $lte: ["$amount", 500000] }, then: "50100-500000" },
                  {
                    case: { $lte: ["$amount", 5000000] },
                    then: "500100-5000000",
                  },
                ],
                default: "Unknown",
              },
            },
          },
          count: { $sum: 1 }, // Count loans in each range
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          range: "$_id.range",
          count: 1,
        },
      },
      {
        $sort: { month: 1, range: 1 }, // Sort by month and range
      },
    ]);
    return res.send(
      successResponse("Loan fetched successfully", bucketedRecords)
    );
  } catch (error) {
    next(error);
  }
};

export const getLoanOverviewStats = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const loanStats = await getLoanOverviewStatsService();
    return res.send(successResponse("Loan fetched successfully", loanStats));
  } catch (error) {
    next(error);
  }
};

export const getSingleLoanRequest = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const loanId = req.params.loadId;
    const loan = await Loan.findById(loanId)
      .populate("loanType")
      .populate("loanBio");
    return res.send(successResponse("Loan fetched successfully", loan));
  } catch (error) {
    next(error);
  }
};

export const getLoanEligibilitySettings = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const loanEligibilitySettings = await LoanEligibilitySettings.find({});
    return res.send(
      successResponse(
        "Loan eligibility settings fetched successfully",
        loanEligibilitySettings
      )
    );
  } catch (error) {
    next(error);
  }
};

export const addLoanEligibilitySettings = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  const data = req.body;
  try {
    const loanEligibilitySettings = await LoanEligibilitySettings.create(data);
    return res.send(
      successResponse(
        "Loan eligibility settings added successfully",
        loanEligibilitySettings
      )
    );
  } catch (error) {
    next(error);
  }
};

export const updateLoanEligibilitySettings = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  const data = req.body;
  const { id } = req.params;
  try {
    const loanEligibilitySettings =
      await LoanEligibilitySettings.findByIdAndUpdate(id, data, { new: true });
    return res.send(
      successResponse(
        "Loan eligibility settings updated successfully",
        loanEligibilitySettings
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getLoanTypes = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const loanTypes = await LoanType.find({});
    return res.send(
      successResponse("Loan types fetched successfully", loanTypes)
    );
  } catch (error) {
    next(error);
  }
};

export const createLoanType = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as CreateLoanTypeInput["body"];

    const payload = {
      title: data.title,
      group: data.group,
      interestRate: data.interest_rate,
      minAmount: data.minimum_amount,
      maxAmount: data.max_amount,
      durationSchedule: data.duration_schedule,
      minDuration: data.min_duration,
      maxDuration: data.max_duration,
      fields: data.fields,
    };
    const loanType = await LoanType.create(payload);
    return res.send(
      successResponse("Loan type created successfully", loanType)
    );
  } catch (error) {
    next(error);
  }
};

export const getLoanBioFields = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const loanBioFields = await LoanBioField.find({});
    return res.send(
      successResponse("Loan bio fields fetched successfully", loanBioFields)
    );
  } catch (error) {
    next(error);
  }
};

export const createLoanBioField = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const loanBioField = await LoanBioField.create(data);
    return res.send(
      successResponse("Loan bio field created successfully", loanBioField)
    );
  } catch (error) {
    next(error);
  }
};

export const updateLoanType = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  const data = req.body;
  const { id } = req.params;
  try {
    const loanType = await LoanType.findByIdAndUpdate(id, data, {
      new: true,
    });
    return res.send(
      successResponse("Loan type updated successfully", loanType)
    );
  } catch (error) {
    next(error);
  }
};

export const getLoanApprovalsForALoan = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  const loanId = req.params.loanId;
  const adminService = req.AdminService;
  try {
    const loanApprovals = await LoanApproval.find({
      loan: loanId,
    });

    // get the role details for each loan approval
    const result = await Promise.all(
      loanApprovals.map(async (approval) => {
        const roleDetails = await adminService.getRoleDetails(approval.role);
        return {
          ...approval.toJSON(),
          roleDetails,
        };
      })
    );

    return res.send(
      successResponse("Loan approvals fetched successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

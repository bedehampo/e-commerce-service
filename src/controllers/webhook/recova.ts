import { successResponse } from "../../helpers";
import { CustomRequest } from "../../utils/interfaces";
import express from "express";
import {
  MandateCreatedInput,
  RecovaSmsAlertInput,
} from "../../validation/loan.schema";
import Loan from "../../model/Loan/Loan";
import { notificationService } from "../../utils/global";
import { RecovaMandateStatus } from "../../types/loan";

export const recovaSMSAlert = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { loanReference } = req.body as RecovaSmsAlertInput["body"];
    console.log("SMS alert", req.body);

    //get loan
    const loan = await Loan.findById(loanReference);

    await notificationService(
      "MotoPay",
      loan,
      `Loan Approved`,
      `Your loan request has been approved. You will receive the funds shortly`
    );

    return res.send(successResponse("SMS alert", req.body));
  } catch (error) {
    next(error);
  }
};

export const recovaLoanBalanceUpdate = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const body = req.body;
    console.log("Loan balance update", body);

    return res.send(successResponse("Loan balance updated", body));
    console.log(body);
  } catch (error) {
    next(error);
  }
};

export const recovaMandateCreated = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const body = req.body as MandateCreatedInput["body"];
    console.log("Mandate created", body);

    await Loan.findByIdAndUpdate(
      body.loanReference,
      {
        recovaMandateStatus: RecovaMandateStatus.APPROVED,
      },
      { new: true }
    );

    return res.send(successResponse("Mandate created", body));
  } catch (error) {
    next(error);
  }
};

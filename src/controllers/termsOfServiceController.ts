import { NextFunction, Request, Response } from "express";
import { ConflictError, NotFoundError, ServiceError } from "../errors";
import { successResponse } from "../helpers";
import { TermsOfService } from "../model/TermsOfService";
import { ITerm } from "../utils/interfaces";

export const addTermsOfService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { heading, body, status } = req.body;
    // Find the existing TermsOfService
    let termOfService = await TermsOfService.findOne({ heading, body });

    if (termOfService) {
      throw new ConflictError(
        "A term with the same heading and body already exists."
      );
    }

    termOfService = new TermsOfService({
      heading,
      body,
      status,
    });

    await termOfService.save();
    return res.send(
      successResponse("Term of service added successfully", termOfService)
    );
  } catch (err) {
    console.error(`Error adding terms of service: ${err.message}`);
    next(err);
  }
};

export const getAllTermsOfService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const termsOfService = await TermsOfService.find().select(
      "-__v -createdAt -updatedAt"
    );
    return res.send(
      successResponse("Terms of service fetched successfully", termsOfService)
    );
  } catch (err) {
    console.error(`Error fetching terms of service: ${err.message}`);
    next(err);
  }
};

export const getSingleTermOfService = async (
  req: Request,
  res: Response,
  nextFunction: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new NotFoundError("id is required");
    }

    const term = await TermsOfService.findById(id).select(
      "-__v -createdAt -updatedAt"
    );

    if (!term) {
      throw new ServiceError("Term not found");
    }
    return res.send(successResponse("Term fetched successfully", term));
  } catch (err) {
    console.error(`Error fetching term: ${err.message}`);
    nextFunction(err);
  }
};

export const editTermOfService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    if (!id) {
      throw new NotFoundError("id is required");
    }

    // directly update and get the new term
    const updatedTerm = await TermsOfService.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    // If no term was found to update, throw and error
    if (!updatedTerm) {
      throw new NotFoundError("Term not found");
    }

    return res.send(
      successResponse("Term of service updated successfully", updatedTerm)
    );
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

export const deleteTermOfService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new NotFoundError("id is required");
    }

    const term = await TermsOfService.findByIdAndDelete(id);

    if (!term) {
      throw new NotFoundError("Term not found");
    }

    return res.send(successResponse("Term deleted successfully", term));
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};
